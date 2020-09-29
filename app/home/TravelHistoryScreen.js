import React, { useState } from "react";
import { Keyboard, Animated, Dimensions, UIManager, StyleSheet, View, ImageBackground, StatusBar, Text, TouchableOpacity, Image, TextInput, FlatList, ActivityIndicator } from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import commonStyles from '../styles/Common';
import color from '../styles/StyleConstants';
import LinearGradient from 'react-native-linear-gradient';
import { ScrollView } from "react-native-gesture-handler";
import moment from 'moment';
import DateTimePicker from "react-native-modal-datetime-picker";
import { withNavigation, StackActions, NavigationActions } from 'react-navigation';
import { connect } from "react-redux";
import { Toast } from 'native-base';
import firebase from 'react-native-firebase';
import AsyncStorage from '@react-native-community/async-storage';
import commonStrings from '../styles/CommonStrings';
const { State: TextInputState } = TextInput;
import NetInfo from "@react-native-community/netinfo";

class TravelHistoryScreen extends React.Component {


    constructor(props) {
        super(props);
        this.state = {
            isDatePickerVisible: false,
            selectedStartDate: moment().format('dddd, D MMM YYYY'),
            fromCity: '',
            toCity: '',
            travelHistory: [],
            newHistory: [],
            name: '',
            shift: new Animated.Value(0),
            loading: false
        }
        this.ref = firebase.firestore().collection('user')
    }



    showMessage(message) {
        Toast.show({
            text: message,
            duration: 2000
        })
    }

    async UNSAFE_componentWillMount() {
        this.keyboardDidShowSub = Keyboard.addListener('keyboardDidShow', this.handleKeyboardDidShow);
        this.keyboardDidHideSub = Keyboard.addListener('keyboardDidHide', this.handleKeyboardDidHide);

        var emailid = await AsyncStorage.getItem('emailid');
        // const markers = [];
        // await this.ref.doc(phone).subcollection('travel_history').get()
        // console.log("doc : ",doc.data());
        const doc = await this.ref.doc(emailid).get()
        this.setState({ travelHistory: [], name: doc.data().name })
        var tempArray = [];
        await this.ref.doc(emailid).collection('travel_history').get()
            .then(response => {
                response.forEach(document => {
                    // access the movie information
                    // console.log("doc : ", document.data());

                    tempArray.push({ fromCity: document.data().fromCity, toCity: document.data().toCity, journeydate: document.data().journeydate })
                    this.setState({ travelHistory: tempArray }, () => { console.log("doc : ", this.state.travelHistory) })
                });
            })
            .catch(error => {
                alert(error)
            });
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

    // Start Date Picker
    showStartDatePicker = () => {
        this.setState({ isDatePickerVisible: true });
    };

    hideStartDatePicker = () => {
        this.setState({ isDatePickerVisible: false });
    };

    handleStartDatePicker = date => {
        var sDate = moment(date).format('ddd, D MMM YYYY')
        this.setState({ selectedStartDate: sDate });
        this.hideStartDatePicker();
    };

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

    async addHistory() {

        if (this.state.fromCity === "") {
            this.showMessage("Please provide From city");
        }
        else if (this.state.toCity === "") {
            this.showMessage("Please provide To city");
        }
        else if(this.state.fromCity === this.state.toCity)
        {
            this.showMessage("From and To city cannot be same");
        }
        else {
            var tempArray = [...this.state.newHistory];
            tempArray.push({ fromCity: this.state.fromCity, toCity: this.state.toCity, journeydate: this.state.selectedStartDate })
            this.setState({ loading: true, newHistory: tempArray, fromCity: "", toCity: "", selectedStartDate: moment().format('dddd, D MMM YYYY') })

            var emailid = await AsyncStorage.getItem('emailid');
            this.setState({ loading: true })
            for (var i = 0; i < this.state.newHistory.length; i++) {
                const travelData = {
                    fromCity: this.state.newHistory[i].fromCity,
                    toCity: this.state.newHistory[i].toCity,
                    journeydate: this.state.newHistory[i].journeydate
                }
                await this.ref.doc(emailid).collection('travel_history').add(travelData)
            }
            this.setState({ travelHistory: [], newHistory: [], loading: false }, () => {
                this.showMessage("Added successfully.")
                this.UNSAFE_componentWillMount() })
        }
    }

    async sendData() {
        // navigate('QuarantineScreen')
        this.props.navigation.navigate('QuarantineScreen')

    }

    render() {
        const { shift } = this.state;
        const { isDatePickerVisible, selectedStartDate } = this.state;
        const { navigate } = this.props.navigation;

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
                                <Text style={[commonStyles.fontFamilyBold, commonStyles.fontSize(4.5), { flex: 1, color: color.neavyBlue }]}>{commonStrings.travel_history_header}</Text>
                                <TouchableOpacity style={{ justifyContent: 'center' }} onPress={() => { navigate('QuarantineScreen') }}>
                                    <View style={{ alignItems: 'flex-end' }}>
                                        <Text style={[commonStyles.fontFamilyBold, commonStyles.fontSize(2.5), { color: color.orange }]}>{commonStrings.skip}</Text>
                                    </View>
                                </TouchableOpacity>
                            </View>
                        </View>

                        <Text style={[commonStyles.fontFamilyBold, commonStyles.fontSize(3), { marginTop: hp('2%'), color: color.neavyBlue }]}>Hello, {this.props.name}</Text>
                        <Text style={[commonStyles.fontFamilyRegular, commonStyles.fontSize(2.3), { marginTop: hp('0.5%'), color: color.grayColor }]}>{commonStrings.travel_history_description1}</Text>
                        <Text style={[commonStyles.fontFamilyRegular, commonStyles.fontSize(2.3), { color: color.grayColor }]}>{commonStrings.travel_history_description2}</Text>

                        <ScrollView style={{ marginBottom: hp('27.5%') }} showsVerticalScrollIndicator={false}>
                            <View style={[styles.backgroundBox, { marginTop: hp('2%'), }]}>
                                <View style={{ flex: 1, flexDirection: 'row' }}>
                                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'flex-start' }}>
                                        <Text style={[commonStyles.fontFamilyRegular, commonStyles.fontSize(2), { height: hp('3%'), color: color.grayColor }]}>From</Text>
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
                                                fromCity: text
                                            })
                                        }}
                                        value={this.state.fromCity}
                                    />
                                </View>
                            </View>

                            <View style={[styles.backgroundBox, { marginTop: hp('2%'), }]}>
                                <View style={{ flex: 1, flexDirection: 'row' }}>
                                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'flex-start' }}>
                                        <Text style={[commonStyles.fontFamilyRegular, commonStyles.fontSize(2), { height: hp('3%'), color: color.grayColor }]}>To</Text>
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
                                                toCity: text
                                            })
                                        }}
                                        value={this.state.toCity}
                                    />
                                </View>
                            </View>

                            <View style={[styles.backgroundBox, { marginTop: hp('2%'), }]}>
                                <View style={{ flex: 1, flexDirection: 'row' }}>
                                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'flex-start' }}>
                                        <Text style={[commonStyles.fontFamilyRegular, commonStyles.fontSize(2), { height: hp('3%'), color: color.grayColor }]}>Date</Text>
                                    </View>
                                    <View style={{ alignItems: 'flex-end' }}>
                                        <Image style={styles.icons}
                                            source={require('../../assets/images/date.png')} />
                                    </View>
                                </View>
                                <TouchableOpacity style={{ flex: 1, }} onPress={() => { this.showStartDatePicker() }}>
                                    <View>
                                        <Text style={[commonStyles.fontFamilyBold, commonStyles.fontSize(2.3), { color: color.neavyBlue, paddingHorizontal: wp('0%'), marginBottom: hp('-1%'), height: hp('6%') }]}>{this.state.selectedStartDate}</Text>
                                    </View>
                                </TouchableOpacity>
                                <DateTimePicker
                                    mode="date"
                                    isVisible={isDatePickerVisible}
                                    onConfirm={this.handleStartDatePicker}
                                    onCancel={this.hideStartDatePicker}
                                    maximumDate={new Date()}
                                />
                            </View>




                            <View style={{ marginTop: hp('3%'), flex: 1, alignItems: 'center' }}>

                                <TouchableOpacity
                                    onPress={async () => {
                                        //console.log("internet : ", await this.checkInternet());
                                        if (await this.checkInternet()) {
                                            this.addHistory()
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
                                            width: wp('45%'),
                                            height: hp('6.5%'),
                                            borderRadius: wp('10%')
                                        }]}>

                                        {
                                            this.state.loading === true ? (
                                                <View style={{ height: hp('6.5%'), justifyContent: 'center', alignItems: 'center', flexDirection: 'row', flex: 1 }}>
                                                    <View style={{ paddingRight: wp('5%'), backgroundColor: 'transparent' }}>
                                                        <ActivityIndicator size={'small'} color='#FFFFFF' />
                                                    </View>
                                                    <View style={{ backgroundColor: 'transparent' }}>
                                                        <Text style={[commonStyles.fontSize(3), commonStyles.fontFamilyBold, { color: '#FFFFFF' }]}>Adding...</Text>
                                                    </View>
                                                </View>
                                            ) : (
                                                    <View style={{ height: hp('6.5%'), justifyContent: 'center', alignSelf: 'center' }}>
                                                        <Text style={[commonStyles.fontSize(3), commonStyles.fontFamilyBold, { color: '#ffffff' }]}>Add</Text>
                                                    </View>
                                                )
                                        }
                                    </LinearGradient>
                                </TouchableOpacity>

                            </View>


                            <Text style={[commonStyles.fontFamilySemiBold, commonStyles.fontSize(3), { marginTop: hp('5%'), color: color.neavyBlue }]}>Your Travel History ({this.state.travelHistory.length})</Text>
                            {
                                this.state.travelHistory.length > 0 ?
                                    <FlatList
                                        data={this.state.travelHistory}
                                        renderItem={({ item }) => {

                                            return (
                                                <View style={[styles.backgroundBoxHistory, { marginTop: hp('1%'), marginBottom: hp('1%'), flexDirection: 'row', }]}>
                                                    <View style={{ flexDirection: 'column', width: wp('28%') }}>
                                                        <Text style={[commonStyles.fontFamilyRegular, commonStyles.fontSize(2), { height: hp('3%'), color: color.grayColor }]}>From</Text>
                                                        <Text style={[commonStyles.fontFamilyExtraBold, commonStyles.fontSize(3), { color: color.neavyBlue }]} numberOfLines={1}>{item.fromCity}</Text>
                                                    </View>
                                                    <View style={{ flexDirection: 'column', justifyContent: 'center', alignItems: 'center', width: wp('28%') }}>
                                                        <View style={{ flexDirection: 'row' }}>
                                                            <View style={{ width: wp('10%'), justifyContent: 'center' }}>
                                                                <View style={[styles.line]} />
                                                            </View>
                                                            <View>
                                                                <Image style={styles.greenLocationIcons}
                                                                    source={require('../../assets/images/location_green.png')} />
                                                            </View>
                                                            <View style={{ width: wp('10%'), justifyContent: 'center' }}>
                                                                <View style={[styles.line]} />
                                                            </View>
                                                        </View>
                                                        <Text style={[commonStyles.fontFamilyRegular, commonStyles.fontSize(1.2), { height: hp('3%'), color: color.grayColor }]}>{item.journeydate}</Text>
                                                    </View>
                                                    <View style={{ flexDirection: 'column', width: wp('28%') }}>
                                                        <Text style={[commonStyles.fontFamilyRegular, commonStyles.fontSize(2), { height: hp('3%'), color: color.grayColor }]}>To</Text>
                                                        <Text style={[commonStyles.fontFamilyExtraBold, commonStyles.fontSize(3), { color: color.neavyBlue }]} numberOfLines={1}>{item.toCity}</Text>
                                                    </View>
                                                </View>
                                            )
                                        }}

                                    /> : <View style={{ marginTop: hp('2%') }}>
                                        <Text style={[commonStyles.fontFamilyRegular, commonStyles.fontSize(2), { height: hp('3%'), color: color.grayColor }]}>No History</Text>
                                    </View>
                            }

                        </ScrollView>
                    </View>



                    <View style={{
                        flex: 1, position: 'absolute',
                        bottom: 0,
                    }}>
                        <LinearGradient
                            colors={[color.gradientStartColor, color.gradientEndColor]}
                            // style={styles.linearGradient}
                            start={{ x: 0.0, y: 0.25 }} end={{ x: 1.2, y: 1.0 }}
                            style={[styles.center, {
                                marginTop: hp('1%'),
                                width: wp('100.1%'),
                                height: hp('8%'),
                                borderTopLeftRadius: wp('2.5%'),
                                borderTopRightRadius: wp('2.5%'),
                            }]}>
                            <TouchableOpacity onPress={() => { this.sendData() }}>
                                <View style={{ height: hp('8%'), justifyContent: 'center', alignSelf: 'center' }}>
                                    <Text style={[commonStyles.fontSize(3), commonStyles.fontFamilyBold, { color: '#ffffff' }]}>Next</Text>
                                </View>
                            </TouchableOpacity>
                        </LinearGradient>
                    </View>

                </ImageBackground>
            </Animated.View>

        );


    }
}

const styles = StyleSheet.create({

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
    line: {
        borderBottomColor: '#828EA5',
        borderBottomWidth: 0.5,
    },
    backgroundBoxHistory: {
        height: hp('11%'),
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

    greenLocationIcons: {
        width: wp('4%'),
        height: hp('4%'),
        resizeMode: 'contain'
    },

    signInButton: {
        marginRight: wp('-6%'),
        width: wp('20%'),
        height: hp('20%'),
        resizeMode: 'contain'
    },
    modal: {
        padding: wp('5%')
    },
    modal2: {
        maxHeight: hp('50%'),
        minHeight: hp('10%')
    },
});

const mapStateToProps = state => ({
    data: state.user.data
});

export default connect(
    mapStateToProps,
    null
)(withNavigation(TravelHistoryScreen));