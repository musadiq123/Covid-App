import React from "react";
import {Animated, Dimensions, UIManager, StyleSheet, View, ImageBackground, StatusBar, Text, TouchableOpacity, Image, TextInput, Keyboard, ActivityIndicator } from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import commonStyles from '../styles/Common';
import color from '../styles/StyleConstants';
import OTPInputView from '@twotalltotems/react-native-otp-input';
import LinearGradient from 'react-native-linear-gradient';
import firebase from 'react-native-firebase';
import { Toast } from 'native-base';
import commonStrings from '../styles/CommonStrings';
import NetInfo from "@react-native-community/netinfo";
import { Base64 } from 'js-base64';
import { ScrollView } from "react-native-gesture-handler";
import AsyncStorage from '@react-native-community/async-storage';
const { State: TextInputState } = TextInput;

export default class SignUpOTPVerification extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            code: '',
            timer: 30,
            isReadyForSubmit: false,
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

    componentDidMount() {
        Keyboard.dismiss();
        this.startTimer()
    }


    startTimer = () => {
        this.clockCall = setInterval(() => {
            this.decrementClock();
        }, 1000);
    }

    decrementClock = () => {
        if (this.state.timer === 2) clearInterval(this.clockCall)
        this.setState((prevstate) => ({ timer: prevstate.timer - 1 }));
    };

    componentWillMount() {
        this.keyboardDidShowSub = Keyboard.addListener('keyboardDidShow', this.handleKeyboardDidShow);
        this.keyboardDidHideSub = Keyboard.addListener('keyboardDidHide', this.handleKeyboardDidHide);
    }

    componentWillUnmount() {
        this.keyboardDidShowSub.remove();
        this.keyboardDidHideSub.remove();
        clearInterval(this.clockCall);
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

    encrypt_password() {
        var temp = Base64.encode(this.state.password);
        return temp;
    }

    async insertData() {

        if (this.state.password.length < 8) {
            this.showMessage("Enter atleast 8 digit password")
        }
        else {
            this.setState({ loading: true })

            const defaultDoc = {
                phone_number: this.props.navigation.state.params.countryCode + this.props.navigation.state.params.phone,
                name: this.props.navigation.state.params.name,
                emailid: this.props.navigation.state.params.emailid,
                password: this.encrypt_password(),
                profile_url: "",
                address: "",
                city: "",
                state: "",
                current_symptoms: "",
                quarantine_location: "",
                quarantine_type: "",
                quarantine_coordinates: "",
                current_symptom: "",
                fcm_token: "",
                groups: [],
                signup_date: moment(new Date()).format("MMM DD, YYYY"),
                lastlogin_date: moment(new Date()).format("MMM DD, YYYY")
            }

            // const updateData = {
            //     name: "DK"
            // }


            await this.ref.doc(this.props.navigation.state.params.countryCode + this.props.navigation.state.params.phone).set(defaultDoc)
            await AsyncStorage.setItem('phone', this.props.navigation.state.params.countryCode + this.props.navigation.state.params.phone);
            this.setState({ loading: false })
            this.props.navigation.navigate('TravelHistoryScreen',{name: this.props.navigation.state.params.name})


            // var datetime = moment(new Date()).format("MMDDYYYYHHmmss")
            // //create sub collection
            // await this.ref.doc(this.props.navigation.state.params.countryCode + this.props.navigation.state.params.phone).collection('status').doc(datetime).set(defaultDoc)
            // await this.ref.doc(this.props.navigation.state.params.countryCode + this.props.navigation.state.params.phone).collection('travel_history').add(updateData)

            //update document
            // await this.ref.doc(this.props.navigation.state.params.countryCode + this.props.navigation.state.params.phone).update(updateData)
        }

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
                    <StatusBar barStyle="dark-content" hidden={false} backgroundColor="transparent" translucent={true} />
                    <ImageBackground
                        style={[{ backgroundColor: '#F9F9F9', width: "100%", height: "100%" }]}
                        resizeMode='stretch'
                        source={require('../../assets/images/bg.png')}>

                        <View style={[commonStyles.column, commonStyles.margin]}>
                            <Text style={[commonStyles.fontFamilyBold, commonStyles.fontSize(4.5), { marginTop: hp('5%'), color: color.neavyBlue }]}>{commonStrings.signup_header}</Text>
                            <Text style={[commonStyles.fontFamilyRegular, commonStyles.fontSize(2.3), { color: color.grayColor }]}>{commonStrings.signup_description_line1}</Text>
                            <Text style={[commonStyles.fontFamilyRegular, commonStyles.fontSize(2.3), { color: color.grayColor }]}>{commonStrings.signup_description_line2}</Text>
                            <Text style={[commonStyles.fontFamilyRegular, commonStyles.fontSize(2.3), { marginTop: hp('1.5%'), color: color.grayColor }]}>{commonStrings.signup_description_line3}</Text>

                            <ScrollView style={{ marginBottom: this.state.isReadyForSubmit ? hp('31%') : hp('25%') }} showsVerticalScrollIndicator={false}>
                                <View style={[styles.backgroundBox, { marginTop: hp('2.5%'), marginBottom: hp('2%'), }]}>
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
                                        <Text style={[commonStyles.fontFamilyBold, commonStyles.fontSize(2.3), { paddingHorizontal: wp('0%'), marginBottom: hp('-1%'), height: hp('6%') }]}>{this.props.navigation.state.params.name}</Text>
                                    </View>
                                </View>

                                <View style={[styles.backgroundBox, { marginBottom: hp('2%'), }]}>
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
                                        <Text style={[commonStyles.fontFamilyBold, commonStyles.fontSize(2.3), { flex: 1, paddingHorizontal: wp('0%'), marginBottom: hp('-1%'), height: hp('6%') }]}>{this.props.navigation.state.params.countryCode}{this.props.navigation.state.params.phone}</Text>
                                    </View>
                                </View>

                                <View style={[styles.backgroundBox, { marginBottom: hp('2%'), }]}>
                                    <View style={{ flex: 1, flexDirection: 'row' }}>
                                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'flex-start' }}>
                                            <Text style={[commonStyles.fontFamilyRegular, commonStyles.fontSize(2), { height: hp('3%'), color: color.grayColor }]}>Email ID (Optional)</Text>
                                        </View>
                                        <View style={{ alignItems: 'flex-end' }}>
                                            <Image style={styles.icons}
                                                source={require('../../assets/images/email.png')} />
                                        </View>
                                    </View>
                                    <View style={{ flex: 1, }}>
                                        <Text
                                            style={[commonStyles.fontFamilyBold, commonStyles.fontSize(2.3), { paddingHorizontal: wp('0%'), marginBottom: hp('-1%'), height: hp('6%'), }]}>{this.props.navigation.state.params.emailid ? this.props.navigation.state.params.emailid : "-"}</Text>
                                    </View>
                                </View>

                                <View style={[styles.backgroundBox, { marginBottom: hp('2%'), }]}>
                                    <View style={{ flex: 1, flexDirection: 'row' }}>
                                        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'flex-start' }}>
                                            <Text style={[commonStyles.fontFamilyRegular, commonStyles.fontSize(2), { height: hp('3%'), color: color.grayColor }]}>Password</Text>
                                        </View>
                                        <View style={{ alignItems: 'flex-end' }}>
                                            <Image style={styles.icons}
                                                source={require('../../assets/images/email.png')} />
                                        </View>
                                    </View>
                                    <View style={{ flex: 1, flexDirection: 'row' }}>
                                        <TextInput
                                            autoCapitalize={'none'}
                                            secureTextEntry={this.state.hidePassword}
                                            style={[commonStyles.fontFamilyBold, commonStyles.fontSize(2.3), { width: wp('79%'), paddingHorizontal: wp('0%'), marginBottom: hp('-1%'), height: hp('6%'), marginTop: hp('-1.5%') }]}
                                            placeholder={'Enter password'}
                                            placeholderTextColor={color.neavyBlue}
                                            value={this.state.password}
                                            onChangeText={password => {
                                                this.setState({ password })
                                            }}
                                        />
                                        <TouchableOpacity activeOpacity={0.8} style={{ alignSelf: 'center' }} onPress={this.setPasswordVisibility}>
                                            <Image source={(this.state.hidePassword) ? require('../../assets/images/hidden.png') : require('../../assets/images/eye.png')} style={{ width: wp('5%'), height: hp('4.5%'), resizeMode: 'contain' }} />
                                        </TouchableOpacity>
                                    </View>
                                </View>

                               
                            </ScrollView>


                        </View>
                        {
                            this.state.isReadyForSubmit ?
                                <View style={{ position: 'absolute', bottom: 0, }}>
                                    <View style={{ flex: 1 }}>
                                        <LinearGradient
                                            colors={[color.gradientStartColor, color.gradientEndColor]}
                                            // style={styles.linearGradient}
                                            start={{ x: 0.0, y: 0.25 }} end={{ x: 1.2, y: 1.0 }}
                                            style={[styles.center, {

                                                width: wp('100.1%'),
                                                height: hp('8%'),
                                                borderTopLeftRadius: wp('2.5%'),
                                                borderTopRightRadius: wp('2.5%'),
                                            }]}>
                                            <TouchableOpacity onPress={async () => {
                                                if (await this.checkInternet()) {
                                                    this.insertData()
                                                }
                                                else {
                                                    this.showMessage("No Internet Connectivity!")
                                                }
                                            }}>
                                                <View style={{ height: hp('8%'), justifyContent: 'center', alignSelf: 'center' }}>
                                                    <Text style={[commonStyles.fontSize(3), commonStyles.fontFamilyBold, { color: '#ffffff' }]}>Next</Text>
                                                </View>
                                            </TouchableOpacity>
                                        </LinearGradient>
                                    </View>
                                </View>
                                : null
                        }

                    </ImageBackground>
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
});