import React from "react";
import { Animated, Dimensions, UIManager, StyleSheet, View, ImageBackground, StatusBar, Text, TouchableOpacity, Image, TextInput, Keyboard, ActivityIndicator, CheckBox } from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import commonStyles from '../styles/Common';
import color from '../styles/StyleConstants';
import { withNavigation, StackActions, NavigationActions } from 'react-navigation';
import { connect } from "react-redux";
import firebase from 'react-native-firebase';
import { Toast } from 'native-base';
import PhoneInput from 'react-native-phone-input'
import commonStrings from '../styles/CommonStrings';
import NetInfo from "@react-native-community/netinfo";
const { State: TextInputState } = TextInput;
import { Base64 } from 'js-base64';
import AsyncStorage from '@react-native-community/async-storage';
import { getUserData, saveUserData } from "../store/actions/userActions";
import Modal from 'react-native-modalbox';
class SignUpScreen extends React.Component {


    constructor(props) {
        super(props);

        this.state = {
            termAndConditionChecked: true,
            code: "",
            name: "",
            phone: "",
            emailid: "",
            value: "+91",
            loading: false,
            password: '',
            hidePassword: true,
            shift: new Animated.Value(0),
        }
        this.ref = firebase.firestore().collection('user')
    }

    setPasswordVisibility = () => {
        this.setState({ hidePassword: !this.state.hidePassword });
    }

    showMessage(message) {
        Keyboard.dismiss()
        Toast.show({
            text: message,
            duration: 2000
        })
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



    async addData() {

        if (this.state.name === '') {
            this.showMessage("Please provide your name")
        }
        else if (!this.phoneValidation(this.state.phone) || this.state.phone.length !== 10) {
            this.showMessage("Please provide a valid mobile number")
        }
        else if (this.state.emailid === "" || !this.isValidEmail(this.state.emailid)) {
            this.showMessage("Please provide a valid Email ID")
        }
        else if (this.state.password.length < 1) {
            this.showMessage("Please enter password")
        }
        else if (!this.state.termAndConditionChecked) {
            this.showMessage("Please accept Terms and Conditions")
        }
        else {
            if (await this.checkInternet()) {
                this.checkData(this.state.emailid)
            }
            else {
                this.showMessage("No Internet Connectivity!")
            }
        }
    }

    isValidEmail = (text) => {
        var reg = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
        return reg.test(text)
    }

    phoneValidation(text) {
        const reg = /^[0]?[789]\d{9}$/;
        if (reg.test(text) === false) {
            this.setState({
                mobilevalidate: false,
                telephone: text,
            });
            return false;
        } else {
            this.setState({
                mobilevalidate: true,
                telephone: text,
                message: '',
            });
            return true;
        }
    }

    async checkData(id) {
        this.setState({ loading: true })
        const doc = await this.ref.doc(id).get()
        if (doc.exists) {
            //document exists
            this.setState({ loading: false })
            alert("This Email ID is already registered. Please enter another Email ID");
        } else {
            this.handleSendCode()
        }
    }

    encrypt_password() {
        var temp = Base64.encode(this.state.password);
        return temp;
    }


    async handleSendCode() {

        this.setState({ loading: true })

        const defaultDoc = {
            phone_number: this.state.value + this.state.phone,
            name: this.state.name,
            emailid: this.state.emailid,
            password: this.encrypt_password(),
            profile_url: "",
            address: "",
            city: "",
            state: "",
            country: "",
            current_location: "",
            quarantine_type: "",
            current_location_coordinates: [0, 0],
            current_symptom: "",
            fcm_token: "",
            groups: [],
            signup_date: moment(new Date()).format("MMM DD, YYYY HH:mm"),
            lastlogin_date: moment(new Date()).format("MMM DD, YYYY HH:mm")
        }


        await this.ref.doc(this.state.emailid).set(defaultDoc)
        try {
            firebase
                .auth()
                .createUserWithEmailAndPassword(this.state.emailid, this.state.password)
                .then(user => { 
                       console.log(user);
                 });
      } catch (error) {
            console.log(error.toString(error));
          }

        await AsyncStorage.setItem('emailid', this.state.emailid);
        const doc = await this.ref.doc(this.state.emailid).get()
        var temp = [];
        temp.push(doc.data())
        await this.props.saveUserData(temp);
        this.setState({ loading: false }, () => {

            this.props.navigation.navigate('TravelHistoryScreen', { name: this.state.name })
        })

    }

    UNSAFE_componentWillMount() {
        this.keyboardDidShowSub = Keyboard.addListener('keyboardDidShow', this.handleKeyboardDidShow);
        this.keyboardDidHideSub = Keyboard.addListener('keyboardDidHide', this.handleKeyboardDidHide);
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

    returnSignup() {
        this.setState({ code: '' });
    }

    render() {
        const { shift } = this.state;
        const { navigate } = this.props.navigation;
        if (this.state.loading) {
            return (
                <ImageBackground
                    style={[{ backgroundColor: '#F9F9F9', width: "100%", height: "100%" }]}
                    resizeMode='stretch'
                    source={require('../../assets/images/bg.png')}>

                    <View style={[commonStyles.column, commonStyles.margin, { flex: 1, }]}>
                        <Text style={[commonStyles.fontFamilyBold, commonStyles.fontSize(4.5), { marginTop: hp('5%'), color: color.neavyBlue }]}>{commonStrings.signup_header}</Text>
                        <Text style={[commonStyles.fontFamilyRegular, commonStyles.fontSize(2.3), { color: color.grayColor }]}>{commonStrings.signup_description_line1}</Text>
                        <Text style={[commonStyles.fontFamilyRegular, commonStyles.fontSize(2.3), { color: color.grayColor }]}>{commonStrings.signup_description_line2}</Text>
                        <Text style={[commonStyles.fontFamilyRegular, commonStyles.fontSize(2.3), { marginTop: hp('1.5%'), color: color.grayColor }]}>{commonStrings.signup_description_line3}</Text>
                        <View style={{ marginTop: hp('10%') }}>
                            <ActivityIndicator
                                size='large'
                                color={color.gradientStartColor} />
                        </View>

                    </View>
                </ImageBackground>
            )
        }
        else {
            return (
                <Animated.View style={{ transform: [{ translateY: shift }], flex: 1 }}>

                    <StatusBar barStyle="dark-content" hidden={false} backgroundColor='transparent' translucent={true} />

                    <ImageBackground
                        style={[{ backgroundColor: '#F9F9F9', width: "100%", height: "100%" }]}
                        resizeMode='stretch'
                        source={require('../../assets/images/bg.png')}>

                        <View style={[commonStyles.column, commonStyles.margin, { flex: 1, }]}>
                            <Text style={[commonStyles.fontFamilyBold, commonStyles.fontSize(4.5), { marginTop: hp('5%'), color: color.neavyBlue }]}>{commonStrings.signup_header}</Text>
                            <Text style={[commonStyles.fontFamilyRegular, commonStyles.fontSize(2.3), { color: color.grayColor }]}>{commonStrings.signup_description_line1}</Text>
                            <Text style={[commonStyles.fontFamilyRegular, commonStyles.fontSize(2.3), { color: color.grayColor }]}>{commonStrings.signup_description_line2}</Text>
                            <Text style={[commonStyles.fontFamilyRegular, commonStyles.fontSize(2.3), { marginTop: hp('1.5%'), color: color.grayColor }]}>{commonStrings.signup_description_line3}</Text>


                            <View style={{ justifyContent: 'center', flex: 1, marginBottom: hp('5%'), }}>
                                <View style={[styles.backgroundBox]}>
                                    <View style={{ flex: 1, flexDirection: 'row' }}>
                                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'flex-start' }}>
                                            <View style={{ flexDirection: 'row' }}>
                                                <Text style={[commonStyles.fontFamilyRegular, commonStyles.fontSize(2), { height: hp('3%'), color: color.grayColor }]}>Name</Text>
                                                <Text style={[commonStyles.fontFamilyRegular, commonStyles.fontSize(2), { height: hp('3%'), color: color.red }]}> *</Text>
                                            </View>
                                        </View>
                                        <View style={{ alignItems: 'flex-end' }}>
                                            <Image style={styles.icons}
                                                source={require('../../assets/images/name.png')} />
                                        </View>
                                    </View>
                                    <View style={{ flex: 1, }}>
                                        <TextInput
                                            numberOfLines={1}
                                            autoCapitalize={'words'}
                                            returnKeyType={"next"}
                                            onSubmitEditing={() => { this.phoneInput.focus(); }}
                                            blurOnSubmit={false}
                                            style={[commonStyles.fontFamilyBold, commonStyles.fontSize(2.3), { paddingHorizontal: wp('0%'), marginBottom: hp('-1%'), height: hp('6%'), marginTop: hp('-1%') }]}
                                            placeholder={'Enter your name'}
                                            placeholderTextColor={color.neavyBlue}
                                            value={this.state.name}
                                            onChangeText={name => {
                                                this.setState({ name })
                                            }}
                                        />
                                    </View>
                                </View>

                                <View style={[styles.backgroundBox, { marginTop: hp('2%'), }]}>
                                    <View style={{ flex: 1, flexDirection: 'row' }}>
                                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'flex-start' }}>
                                            <View style={{ flexDirection: 'row' }}>
                                                <Text style={[commonStyles.fontFamilyRegular, commonStyles.fontSize(2), { height: hp('3%'), color: color.grayColor }]}>Phone</Text>
                                                <Text style={[commonStyles.fontFamilyRegular, commonStyles.fontSize(2), { height: hp('3%'), color: color.red }]}> *</Text>
                                            </View>

                                        </View>
                                        <View style={{ alignItems: 'flex-end' }}>
                                            <Image style={styles.icons}
                                                source={require('../../assets/images/phone.png')} />
                                        </View>
                                    </View>
                                    <View style={{ flex: 1, flexDirection: 'row' }}>
                                        <PhoneInput
                                            style={{ marginTop: hp('1%') }}
                                            ref={ref => {
                                                this.phone = ref;
                                            }}
                                            textStyle={{ color: 'black' }}
                                            initialCountry='in'
                                            onSelectCountry={() => { this.setState({ value: this.phone.getValue() }) }}
                                        />


                                        <Text style={[commonStyles.fontFamilyBold, commonStyles.fontSize(2.3), { marginTop: hp('0.3%'), height: hp('3%'), color: color.grayColor }]}>{this.state.value} -</Text>
                                        <TextInput
                                            ref={(input) => { this.phoneInput = input; }}
                                            style={[commonStyles.fontFamilyBold, commonStyles.fontSize(2.3), { flex: 1, marginLeft: wp('2%'), paddingHorizontal: wp('0%'), marginBottom: hp('-1%'), height: hp('6%'), marginTop: hp('-1%') }]}
                                            placeholder={'Enter your phone number'}
                                            placeholderTextColor={color.neavyBlue}
                                            value={this.state.phone}
                                            onChangeText={phone => {
                                                this.setState({ phone })
                                            }}
                                            maxLength={10}
                                            keyboardType={'numeric'}
                                            numberOfLines={1}
                                            returnKeyType={"next"}
                                            onSubmitEditing={() => { this.emailInput.focus(); }}
                                            blurOnSubmit={false}
                                        />
                                    </View>
                                </View>

                                <View style={[styles.backgroundBox, { marginTop: hp('2%'), }]}>
                                    <View style={{ flex: 1, flexDirection: 'row' }}>
                                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'flex-start' }}>
                                            <View style={{ flexDirection: 'row' }}>
                                                <Text style={[commonStyles.fontFamilyRegular, commonStyles.fontSize(2), { height: hp('3%'), color: color.grayColor }]}>Email ID</Text>
                                                <Text style={[commonStyles.fontFamilyRegular, commonStyles.fontSize(2), { height: hp('3%'), color: color.red }]}> *</Text>
                                            </View>

                                        </View>
                                        <View style={{ alignItems: 'flex-end' }}>
                                            <Image style={styles.icons}
                                                source={require('../../assets/images/email.png')} />
                                        </View>
                                    </View>
                                    <View style={{ flex: 1, }}>
                                        <TextInput
                                            autoCapitalize={'none'}
                                            ref={(input) => { this.emailInput = input; }}
                                            keyboardType={'email-address'}
                                            style={[commonStyles.fontFamilyBold, commonStyles.fontSize(2.3), { paddingHorizontal: wp('0%'), marginBottom: hp('-1%'), height: hp('6%'), marginTop: hp('-1%') }]}
                                            placeholder={'Enter your email ID'}
                                            placeholderTextColor={color.neavyBlue}
                                            value={this.state.emailid}
                                            onChangeText={emailid => {
                                                this.setState({ emailid })
                                            }}
                                            returnKeyType={"next"}
                                            onSubmitEditing={() => { this.passwordInput.focus(); }}
                                            blurOnSubmit={false}
                                        />
                                    </View>
                                </View>

                                <View style={[styles.backgroundBox, { marginBottom: hp('2%'), marginTop: hp('2%') }]}>
                                    <View style={{ flex: 1, flexDirection: 'row' }}>
                                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'flex-start' }}>
                                            <View style={{ flexDirection: 'row' }}>
                                                <Text style={[commonStyles.fontFamilyRegular, commonStyles.fontSize(2), { height: hp('3%'), color: color.grayColor }]}>Password</Text>
                                                <Text style={[commonStyles.fontFamilyRegular, commonStyles.fontSize(2), { height: hp('3%'), color: color.red }]}> *</Text>
                                            </View>

                                        </View>
                                        <View style={{ alignItems: 'flex-end' }}>
                                            <Image style={styles.icons}
                                                source={require('../../assets/images/key.png')} />
                                        </View>
                                    </View>
                                    <View style={{ flex: 1, flexDirection: 'row' }}>
                                        <TextInput
                                            ref={(input) => { this.passwordInput = input; }}
                                            autoCapitalize={'none'}
                                            secureTextEntry={this.state.hidePassword}
                                            style={[commonStyles.fontFamilyBold, commonStyles.fontSize(2.3), { width: wp('79.5%'), paddingHorizontal: wp('0%'), marginBottom: hp('-1%'), height: hp('6%'), marginTop: hp('-1%') }]}
                                            placeholder={'Enter password'}
                                            placeholderTextColor={color.neavyBlue}
                                            value={this.state.password}
                                            onChangeText={password => {
                                                this.setState({ password })
                                            }}
                                        />
                                        <TouchableOpacity activeOpacity={0.8} style={{ alignSelf: 'center' }} onPress={this.setPasswordVisibility}>
                                            <Image source={(this.state.hidePassword) ? require('../../assets/images/hidden.png') : require('../../assets/images/eye.png')} style={{ width: wp('5%'), height: hp('6%'), resizeMode: 'contain', marginTop: hp('1%') }} />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                                <View style={[{ justifyContent: 'center', alignItems: 'center', height: hp('5%'), marginTop: hp('1%'), marginBottom: hp('1%'), flexDirection: 'row', }]}>
                                    <TouchableOpacity onPress={() => { this.setState({ termAndConditionChecked: !this.state.termAndConditionChecked }) }} >
                                        {
                                            this.state.termAndConditionChecked ?
                                                <Image style={styles.checkImage}
                                                    source={require('../../assets/images/check_green.png')} /> :
                                                <Image style={styles.checkImage}
                                                    source={require('../../assets/images/check_grey.png')} />
                                        }

                                    </TouchableOpacity>
                                    <View style={{ marginLeft: wp('3%'), flexDirection: 'row' }}>
                                        <Text style={[commonStyles.fontSize(2.3), { color: color.grayColor, paddingHorizontal: wp('0%') }]}>I agree to the </Text>
                                        <TouchableOpacity onPress={() => { this.refs.modal1.open() }}><Text style={[commonStyles.fontFamilyBold, { color: color.neavyBlue, textDecorationLine: 'underline', }]}>Terms and Conditions</Text></TouchableOpacity>
                                    </View>
                                </View>


                                <TouchableOpacity style={{ marginTop: hp('-5%'), alignSelf: 'flex-end' }} onPress={() => { this.addData() }}>
                                    <View style={{ marginRight: wp('3%') }}>
                                        <Image style={styles.signInButton}
                                            source={require('../../assets/images/arrow_button.png')} />
                                    </View>
                                </TouchableOpacity>
                            </View>
                        </View>


                        <View style={{ marginBottom: hp('5%'), flex: 1, position: 'absolute', bottom: 0, justifyContent: 'center', alignSelf: 'center' }}>
                            <View style={{ flexDirection: 'row', }}>
                                <View>
                                    <Text style={[commonStyles.fontFamilyRegular, commonStyles.fontSize(2.2), { color: color.grayColor }]}>Already have an account? </Text>
                                </View>
                                <TouchableOpacity onPress={() => { navigate('SignInScreen', { returnSignup: this.returnSignup.bind(this) }) }}>
                                    <View>
                                        <Text style={[commonStyles.fontFamilyExtraBold, commonStyles.fontSize(2.2), { color: color.orange }]}>Sign In</Text>
                                    </View>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </ImageBackground>

                    <Modal style={[styles.modal2, { marginTop: hp('5%'), width: wp('90%'), borderRadius: wp('3%') }]} position={'top'} ref={"modal1"} swipeArea={20}
                        backdropPressToClose={true}  >
                        <View style={[{ backgroundColor: 'white', margin: wp('5%') }]}>
                            <TouchableOpacity onPress={()=>{this.refs.modal1.close()}} style={{width: wp('80%'), alignItems: 'flex-end' }}>
                                <Image style={{ width: wp('5%'), height: hp('5%'), resizeMode: 'contain' }}
                                    source={require('../../assets/images/cancel.png')} />
                            </TouchableOpacity>

                            <View style={{ height: hp('1%'), backgroundColor: color.linkColor, position: 'absolute', bottom: 0 }}>

                            </View>
                        </View>
                    </Modal>

                </Animated.View>

            );
        }

    }
}

const styles = StyleSheet.create({

    inputRadius: {
        textAlign: 'center',
        height: hp('7%'),
        width: wp('12%'),
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
    icons: {
        width: wp('3%'),
        height: hp('2.5%'),
        resizeMode: 'contain'
    },

    signInButton: {
        marginRight: wp('-6%'),
        width: wp('20%'),
        height: hp('20%'),
        resizeMode: 'contain'
    },
    checkImage: {
        width: wp('5%'),
        height: hp('5%'),
        resizeMode: 'contain'
    },
    modal2: {
        maxHeight: hp('90%'),
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
)(withNavigation(SignUpScreen));