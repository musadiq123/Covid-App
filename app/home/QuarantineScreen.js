import React from "react";
import { StyleSheet, View, ImageBackground, StatusBar, Text, TouchableOpacity, Image, TextInput, TouchableHighlight, Keyboard, Animated, Dimensions, UIManager, ActivityIndicator } from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import commonStyles from '../styles/Common';
import color from '../styles/StyleConstants';
import LinearGradient from 'react-native-linear-gradient';
import RadioForm, { RadioButton, RadioButtonInput, RadioButtonLabel } from 'react-native-simple-radio-button';
import { Toast } from 'native-base';
import firebase from 'react-native-firebase';
import AsyncStorage from '@react-native-community/async-storage';
import Geocoder from 'react-native-geocoding';
import Modal from 'react-native-modalbox';
const { State: TextInputState } = TextInput;
import NetInfo from "@react-native-community/netinfo";
import { getUserData, saveUserData } from "../store/actions/userActions";
import { withNavigation, StackActions, NavigationActions } from 'react-navigation';
import { connect } from "react-redux";
class QuarantineScreen extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            address: '',
            city: '',
            state: '',
            country: '',
            pincode: '',
            radio_props: [{ label: 'Yes', value: 1 }, { label: 'No', value: 0 }],
            value: 0,
            value3Index: 0,
            name: '',
            selectedAddress: 'Select your address',
            locationPredictions: [],
            coordinates: [],
            destination: '',
            shift: new Animated.Value(0),
            loading: false,
            latitude: 0,
            longitude: 0
        }
        this.ref = firebase.firestore().collection('user')
    }

    async UNSAFE_componentWillMount() {
        this.keyboardDidShowSub = Keyboard.addListener('keyboardDidShow', this.handleKeyboardDidShow);
        this.keyboardDidHideSub = Keyboard.addListener('keyboardDidHide', this.handleKeyboardDidHide);

        var emailid = await AsyncStorage.getItem('emailid');

        const doc = await this.ref.doc(emailid).get()
        this.setState({ name: doc.data().name })
    }


    componentWillUnmount() {
        this.keyboardDidShowSub.remove();
        this.keyboardDidHideSub.remove();
    }

    handleKeyboardDidShow = (event) => {
        const { height: windowHeight } = Dimensions.get('window');
        const keyboardHeight = event.endCoordinates.height;
        const currentlyFocusedField = TextInputState.currentlyFocusedField();
        UIManager.measure(currentlyFocusedField, (originX, originY, width, height, pageX, pageY) => {
            const fieldHeight = height;
            const fieldTop = pageY;
            const gap = (windowHeight - keyboardHeight) - (fieldTop + fieldHeight);
            if (gap >= 0) {
                return;
            }
            Animated.timing(
                this.state.shift,
                {
                    toValue: gap,
                    duration: 100,
                    useNativeDriver: true,
                }
            ).start();
        });
    }

    handleKeyboardDidHide = () => {
        Animated.timing(
            this.state.shift,
            {
                toValue: 0,
                duration: 100,
                useNativeDriver: true,
            }
        ).start();
    }

    checkInternet() {
        return new Promise((resolve, reject) => {
            NetInfo.fetch().then(state => {
                //console.log("Connection type", state.type);
                if (state.isConnected) {
                    resolve(true);
                }
                else {
                    resolve(false);
                }
            });
        })

    }


    async onChangeDestination(destination) {
        this.setState({ destination });
        const apiUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?key=AIzaSyBm36VD9fs9XlAONcjXNz5AxsWfIsz1Kks&input={${destination}}&location=${
            this.state.latitude
            },${this.state.longitude}&radius=2000`;
        const result = await fetch(apiUrl);
        const jsonResult = await result.json();
        this.setState({
            locationPredictions: jsonResult.predictions
        });
        console.log(jsonResult);
    }

    pressedPrediction(prediction) {
        console.log("selected : ", prediction);
        Keyboard.dismiss();
        this.setState({
            locationPredictions: [],
            selectedAddress: prediction.description,
            destination: ''

        }, () => { this.refs.modal1.close() });
        Geocoder.init("AIzaSyBm36VD9fs9XlAONcjXNz5AxsWfIsz1Kks", { language: "en" }); // set the language
        var location;
        Geocoder.from(prediction.description)
            .then(json => {
                location = json.results[0].geometry.location;
                console.log("json : ", json);
                let area = null;
                let country = null;
                let state = null;
                let city = null;
                let postal_code = null;
                json.results[0].address_components.map(element => {
                    // console.log("lement.types[0] : ", element.types[0]);
                    if (element.types[0] === "sublocality_level_1") {
                        area = element.long_name;
                    }
                    if (element.types[0] === "administrative_area_level_2") {
                        city = element.long_name;
                    }
                    if (element.types[0] === "administrative_area_level_1") {
                        state = element.long_name;
                    }
                    if (element.types[0] === "country") {
                        country = element.long_name;
                    }
                    if (element.types[0] === "postal_code") {
                        postal_code = element.long_name;
                    }
                });
                // var stateName = json.results[0].address_components.filter(x => x.types.filter(t => t == 'administrative_area_level_1').length > 0)[0].long_name;


                this.setState({ latitude: location.lat, longitude: location.lng, city: city, state: state, pincode: postal_code, country: country, address: area })
            })
            .catch(error => console.warn(error));
        Keyboard;
    }


    showMessage(message) {
        Keyboard.dismiss()
        Toast.show({
            text: message,
            duration: 2000
        })
    }

    async addQuarantineData() {

        if (this.state.selectedAddress === "") {
            this.showMessage("Please provide your current residence address ")
        }
        else if (this.state.city === "") {
            this.showMessage("Please enter your city")
        }
        else if (this.state.state === "") {
            this.showMessage("Please enter your state")
        }
        else if (this.state.pincode === "") {
            this.showMessage("Please enter your pincode")
        }
        else {
            this.setState({ loading: true })
            var emailid = await AsyncStorage.getItem('emailid');
            const updateData = {
                address: this.state.selectedAddress,
                city: this.state.city,
                state: this.state.state,
                country: this.state.country,
                current_location_coordinates: new firebase.firestore.GeoPoint(this.state.latitude, this.state.longitude),
                quarantine_type: this.state.value,
                current_location: this.state.selectedAddress,
            }
            await this.ref.doc(emailid).update(updateData)

            var tempData = this.props.data;
            tempData[0].address= this.state.selectedAddress,
            tempData[0].city= this.state.city,
            tempData[0].state= this.state.state,
            tempData[0].country= this.state.country,
            tempData[0].current_location_coordinates= new firebase.firestore.GeoPoint(this.state.latitude, this.state.longitude),
            tempData[0].quarantine_type= this.state.value,
            tempData[0].current_location= this.state.selectedAddress,

            await this.props.saveUserData(tempData);
            this.setState({ loading: false }, () => {
                this.props.navigation.navigate('SymptomsNorCatScreen')
            })
        }
    }

    render() {
        const { shift } = this.state;
        const { navigate } = this.props.navigation;
        const locationPredictions = this.state.locationPredictions.map(
            prediction => (
                <TouchableHighlight
                    key={prediction.id}
                    onPress={() => this.pressedPrediction(prediction)}>
                    <Text style={styles.locationSuggestion}>
                        {prediction.description}
                    </Text>
                </TouchableHighlight>
            )
        );
        return (

            <Animated.View style={{ transform: [{ translateY: shift }], flex: 1 }}>
                <StatusBar barStyle="dark-content" hidden={false} backgroundColor="transparent" translucent={true} />
                <ImageBackground
                    style={[{ backgroundColor: '#F9F9F9', width: "100%", height: "100%" }]}
                    resizeMode='stretch'
                    source={require('../../assets/images/bg.png')}>


                    <View style={[commonStyles.column, commonStyles.margin, { marginTop: hp('5%') }]}>
                        <View style={{ flexDirection: 'row' }}>
                            <View style={{ flexDirection: 'row', flex: 1 }}>
                                <TouchableOpacity style={{ paddingLeft: wp('1%'), paddingRight: wp('2%') }} onPress={() => { this.props.navigation.goBack() }}>
                                    <Image style={[commonStyles.backIcons, { justifyContent: 'center' }]}
                                        source={require('../../assets/images/back-button.png')} />
                                </TouchableOpacity>

                                <Text style={[commonStyles.fontFamilyBold, commonStyles.fontSize(4.5), { marginLeft: wp('3%'), color: color.neavyBlue }]}>Current Location</Text>

                            </View>
                        </View>
                        <Text style={[commonStyles.fontFamilyBold, commonStyles.fontSize(3), { marginTop: hp('2%'), color: color.neavyBlue }]}>Hello, {this.state.name}</Text>
                        <Text style={[commonStyles.fontFamilyRegular, commonStyles.fontSize(2.3), { marginTop: hp('0.5%'), color: color.grayColor }]}>Please enter your current residence address</Text>

                        <View style={[styles.backgroundBox, { marginTop: hp('4%'), }]}>
                            <View style={{ flex: 1, flexDirection: 'row' }}>
                                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'flex-start' }}>
                                    <View style={{ flexDirection: 'row' }}>
                                        <Text style={[commonStyles.fontFamilyRegular, commonStyles.fontSize(2), { height: hp('3%'), color: color.grayColor }]}>Address</Text>
                                        <Text style={[commonStyles.fontFamilyRegular, commonStyles.fontSize(2), { height: hp('3%'), color: color.red }]}> *</Text>
                                    </View>

                                </View>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <Image style={styles.icons}
                                        source={require('../../assets/images/location.png')} />
                                </View>
                            </View>
                            <View style={{ flex: 1, }}>
                                <TouchableOpacity onPress={() => { this.refs.modal1.open() }}>
                                    <Text numberOfLines={1}
                                        style={[commonStyles.fontFamilyBold, commonStyles.fontSize(2.3), { color: color.neavyBlue, paddingHorizontal: wp('0%'), marginBottom: hp('-1%'), height: hp('6%') }]}>{this.state.selectedAddress}</Text>
                                </TouchableOpacity>

                            </View>

                        </View>

                        <View style={[styles.backgroundBox, { marginTop: hp('2%'), }]}>
                            <View style={{ flex: 1, flexDirection: 'row' }}>
                                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'flex-start' }}>
                                    <View style={{ flexDirection: 'row' }}>
                                        <Text style={[commonStyles.fontFamilyRegular, commonStyles.fontSize(2), { height: hp('3%'), color: color.grayColor }]}>City</Text>
                                        <Text style={[commonStyles.fontFamilyRegular, commonStyles.fontSize(2), { height: hp('3%'), color: color.red }]}> *</Text>
                                    </View>

                                </View>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <Image style={styles.icons}
                                        source={require('../../assets/images/location.png')} />
                                </View>
                            </View>
                            <View style={{ flex: 1, }}>
                                <TextInput
                                    style={[commonStyles.fontFamilyBold, commonStyles.fontSize(2.3), { color: color.neavyBlue, paddingHorizontal: wp('0%'), marginBottom: hp('-1%'), height: hp('6%'), marginTop: hp('-1%') }]}
                                    placeholder={'Enter city name'}
                                    placeholderTextColor={color.neavyBlue}
                                    onChangeText={(text) => {
                                        this.setState({
                                            city: text
                                        })
                                    }}
                                    value={this.state.city}
                                />
                            </View>
                        </View>

                        <View style={[styles.backgroundBox, { marginTop: hp('2%'), }]}>
                            <View style={{ flex: 1, flexDirection: 'row' }}>
                                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'flex-start' }}>
                                    <View style={{ flexDirection: 'row' }}>
                                        <Text style={[commonStyles.fontFamilyRegular, commonStyles.fontSize(2), { height: hp('3%'), color: color.grayColor }]}>State</Text>
                                        <Text style={[commonStyles.fontFamilyRegular, commonStyles.fontSize(2), { height: hp('3%'), color: color.red }]}> *</Text>
                                    </View>

                                </View>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <Image style={styles.icons}
                                        source={require('../../assets/images/location.png')} />
                                </View>
                            </View>
                            <View style={{ flex: 1, }}>
                                <TextInput
                                    style={[commonStyles.fontFamilyBold, commonStyles.fontSize(2.3), { color: color.neavyBlue, paddingHorizontal: wp('0%'), marginBottom: hp('-1%'), height: hp('6%'), marginTop: hp('-1%') }]}
                                    placeholder={'Enter state name'}
                                    placeholderTextColor={color.neavyBlue}
                                    onChangeText={(text) => {
                                        this.setState({
                                            state: text
                                        })
                                    }}
                                    value={this.state.state}
                                />
                            </View>
                        </View>

                        <View style={[styles.backgroundBox, { marginTop: hp('2%'), }]}>
                            <View style={{ flex: 1, flexDirection: 'row' }}>
                                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'flex-start' }}>
                                    <View style={{ flexDirection: 'row' }}>
                                        <Text style={[commonStyles.fontFamilyRegular, commonStyles.fontSize(2), { height: hp('3%'), color: color.grayColor }]}>Pincode</Text>
                                        <Text style={[commonStyles.fontFamilyRegular, commonStyles.fontSize(2), { height: hp('3%'), color: color.red }]}> *</Text>
                                    </View>

                                </View>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <Image style={styles.icons}
                                        source={require('../../assets/images/location.png')} />
                                </View>
                            </View>
                            <View style={{ flex: 1, }}>
                                <TextInput
                                    maxLength={6}
                                    keyboardType={'numeric'}
                                    style={[commonStyles.fontFamilyBold, commonStyles.fontSize(2.3), { color: color.neavyBlue, paddingHorizontal: wp('0%'), marginBottom: hp('-1%'), height: hp('6%'), marginTop: hp('-1%') }]}
                                    placeholder={'Enter Pincode'}
                                    placeholderTextColor={color.neavyBlue}
                                    onChangeText={(text) => {
                                        this.setState({
                                            pincode: text
                                        })
                                    }}
                                    value={this.state.pincode}
                                />
                            </View>
                        </View>

                        <View style={[styles.backgroundBoxQuarantine, { marginTop: hp('2%'), marginBottom: hp('1%') }]}>
                            <View style={{ flex: 1, flexDirection: 'row', }}>
                                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'flex-start' }}>
                                    <Text style={[commonStyles.fontFamilyRegular, commonStyles.fontSize(2), { height: hp('3%'), color: color.grayColor }]}>Are you under government quarantine/isolation?</Text>
                                </View>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <Image style={styles.icons}
                                        source={require('../../assets/images/quarantine.png')} />
                                </View>
                            </View>
                            <View style={{ flex: 1, justifyContent: 'center', marginTop: hp('1%') }}>

                                <RadioForm formHorizontal={true} animation={true} >
                                    {this.state.radio_props.map((obj, i) => {
                                        var onPress = (value, index) => {
                                            this.setState({ radioValue: value, value3Index: index }, () => {
                                                if (value === 0) {
                                                    this.state.value = "No";
                                                }
                                                else {
                                                    this.state.value = "Yes";
                                                }
                                            })
                                        }
                                        return (
                                            <RadioButton labelVertical={true} key={i} >
                                                {/*  You can set RadioButtonLabel before RadioButtonInput */}
                                                <RadioButtonInput
                                                    obj={obj}
                                                    index={i}
                                                    isSelected={this.state.value3Index === i}
                                                    onPress={onPress}
                                                    buttonInnerColor={'#34C3C5'}
                                                    buttonOuterColor={this.state.value3Index === i ? '#34C3C5' : color.grayColor}
                                                    buttonSize={wp('2%')}
                                                    buttonStyle={{}}
                                                    buttonWrapStyle={{ marginLeft: i == 0 ? wp('0%') : wp('8%') }}
                                                />
                                                <RadioButtonLabel
                                                    obj={obj}
                                                    index={i}
                                                    onPress={onPress}
                                                    labelStyle={[commonStyles.fontFamilyBold, { marginLeft: wp('2%'), fontSize: hp('2.3%'), color: '#293D68' }]}
                                                    labelWrapStyle={{}}
                                                />
                                            </RadioButton>
                                        )
                                    })}
                                </RadioForm>



                            </View>
                        </View>


                    </View>


                    <View style={{
                        flex: 1, position: 'absolute',
                        bottom: 0,
                    }}>
                        <TouchableOpacity
                            onPress={async () => {
                                //console.log("internet : ", await this.checkInternet());
                                if (await this.checkInternet()) {
                                    this.addQuarantineData();
                                }
                                else {
                                    this.showMessage("No Internet Connectivity!")
                                }
                            }
                            }>
                            <LinearGradient
                                colors={[color.gradientStartColor, color.gradientEndColor]}
                                start={{ x: 0.0, y: 0.25 }} end={{ x: 1.2, y: 1.0 }}
                                style={[styles.center, {
                                    marginTop: hp('1%'),
                                    width: wp('100.1%'),
                                    height: hp('8%'),
                                    borderTopLeftRadius: wp('2.5%'),
                                    borderTopRightRadius: wp('2.5%'),
                                }]}>

                                {
                                    this.state.loading === true ? (
                                        <View style={{ height: hp('8%'), justifyContent: 'center', alignItems: 'center', flexDirection: 'row', flex: 1 }}>
                                            <View style={{ paddingRight: wp('5%'), backgroundColor: 'transparent' }}>
                                                <ActivityIndicator size={'small'} color='#FFFFFF' />
                                            </View>
                                            <View style={{ backgroundColor: 'transparent' }}>
                                                <Text style={[commonStyles.fontSize(3), commonStyles.fontFamilyBold, { color: '#FFFFFF' }]}>Please Wait...</Text>
                                            </View>
                                        </View>
                                    ) : (
                                            <View style={{ height: hp('8%'), justifyContent: 'center', alignSelf: 'center' }}>
                                                <Text style={[commonStyles.fontSize(3), commonStyles.fontFamilyBold, { color: '#ffffff' }]}>Next</Text>
                                            </View>
                                        )
                                }
                            </LinearGradient>
                        </TouchableOpacity>

                    </View>
                </ImageBackground>
                <Modal style={[styles.modal2, { marginTop: hp('5%'), width: wp('90%'), borderRadius: wp('3%') }]} position={'top'} ref={"modal1"} swipeArea={20}
                    backdropPressToClose={true}  >
                    <View style={[{ backgroundColor: 'white', margin: wp('5%'), borderWidth: wp('0.2%') }]}>
                        <TextInput
                            style={[commonStyles.fontFamilyBold, commonStyles.fontSize(2.3), { justifyContent: 'center', color: color.neavyBlue, paddingHorizontal: wp('0%'), paddingLeft: wp('2%') }]}
                            placeholder={'Enter your address'}
                            placeholderTextColor={color.neavyBlue}
                            onChangeText={destination => {
                                this.setState({ destination });
                                this.onChangeDestination(destination);
                            }}
                            value={this.state.destination}
                        />

                        {locationPredictions}
                    </View>
                </Modal>
            </Animated.View>

        );
    }
}

const styles = StyleSheet.create({
    destinationInput: {
        borderWidth: 0.5,
        borderColor: "grey",
        height: 40,
        marginTop: wp('5%'),
        marginLeft: wp('5%'),
        marginRight: wp('5%'),
        padding: 5,
        backgroundColor: "white",
        borderRadius: 5
    },
    locationSuggestion: {
        backgroundColor: "white",
        padding: 5,
        fontSize: 18,
        borderWidth: 0.5
    },
    backgroundBox: {
        height: hp('9%'),
        padding: wp('3%'),
        borderWidth: 0.5,
        borderRadius: 5,
        backgroundColor: 'white',
        borderColor: '#CBD5EA',
        elevation: 3,
        shadowColor: '#CBD5EA',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.5,
        shadowRadius: 5,
    },
    backgroundBoxQuarantine: {
        height: hp('10%'),
        padding: wp('3%'),
        borderWidth: 0.5,
        borderRadius: 5,
        backgroundColor: 'white',
        borderColor: '#CBD5EA',
        elevation: 3,
        shadowColor: '#CBD5EA',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.5,
        shadowRadius: 5,
    },
    icons: {
        width: wp('3%'),
        height: hp('2.5%'),
        resizeMode: 'contain'
    },
    modal2: {
        maxHeight: hp('70%'),
        minHeight: hp('15%')
    },
});
const mapStateToProps = state => ({
    data: state.user.data
});

const mapDispatchToProps = dispatch => ({
    getUserData: () => dispatch(getUserData()),
    saveUserData: data => dispatch(saveUserData(data)),
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(withNavigation(QuarantineScreen));