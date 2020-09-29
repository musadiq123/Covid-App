import React from "react";
import { StyleSheet, View, ImageBackground, StatusBar, Text, TouchableOpacity, Image, TextInput, Keyboard, ActivityIndicator } from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import commonStyles from '../styles/Common';
import color from '../styles/StyleConstants';
import firebase from 'react-native-firebase'
import { Toast } from 'native-base';
import { withNavigation, StackActions, NavigationActions } from 'react-navigation';
import { connect } from "react-redux";
import NetInfo from "@react-native-community/netinfo";
import commonStrings from '../styles/CommonStrings';
import { Base64 } from 'js-base64';
import { getUserData, saveUserData } from "../store/actions/userActions";
import AsyncStorage from '@react-native-community/async-storage';
class SignInScreen extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            emailid: "",
            loading: false,
            password: '',
            hidePassword: true
        }
        this.ref = firebase.firestore().collection('user')
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
    }

    navigationBack() {
        this.props.navigation.state.params.returnSignup();
        this.props.navigation.goBack()
    }

    setPasswordVisibility = () => {
        this.setState({ hidePassword: !this.state.hidePassword });
    }

    encrypt_password(pass) {
        var temp = Base64.encode(pass);
        return temp;
    }

    isValidEmail = (text) => {
        var reg = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
        return reg.test(text)
    }

    async checkData() {

        if (this.state.emailid === "" || !this.isValidEmail(this.state.emailid)) {
            this.showMessage("Please provide a valid Email ID")
        }
        else if (this.state.password.length < 1) {
            this.showMessage("Please enter password")
        }
        else {
            if (await this.checkInternet()) {
                this.setState({ loading: true })
                const doc = await this.ref.doc(this.state.emailid).get()
                if (doc.exists) {
                    //document exists

                    if (this.encrypt_password(this.state.password) === doc.data().password) {

                        var temp = [];
                        temp.push(doc.data())
                        console.log("doc data : ", temp)
                        await this.props.saveUserData(temp);
                        // this.props.navigation.navigate('TabManager')
                        this.setState({ loading: false }, async () => {
                            await AsyncStorage.setItem('emailid', this.state.emailid);
                            const resetAction = StackActions.reset({
                                index: 0,
                                actions: [
                                    NavigationActions.navigate({
                                        routeName: "InitialScreen"
                                    })
                                ]
                            });
                            this.props.navigation.dispatch(resetAction);
                        })

                    }
                    else {
                        this.setState({ loading: false })
                        alert("The password you have entered is incorrect");
                    }

                } else {
                    this.setState({ loading: false, emailid: '', password: '' })
                    alert("This user does not exist. Please Sign-Up first");
                }
            }
            else {
                this.showMessage("No Internet Connectivity!")
            }
        }


    }


    render() {
        const { navigate } = this.props.navigation;
        if (this.state.loading) {
            return (
                <ImageBackground
                    style={[{ backgroundColor: '#F9F9F9', width: "100%", height: "100%" }]}
                    resizeMode='stretch'
                    source={require('../../assets/images/bg.png')}>

                    <View style={[commonStyles.column, commonStyles.margin, { flex: 1, }]}>
                        <Text style={[commonStyles.fontFamilyBold, commonStyles.fontSize(4.5), { marginTop: hp('4%'), color: color.neavyBlue }]}>{commonStrings.signin_header}</Text>
                        <Text style={[commonStyles.fontFamilyRegular, commonStyles.fontSize(2.3), { color: color.grayColor }]}>{commonStrings.signin_description}</Text>
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
                <View>
                    <StatusBar barStyle="dark-content" hidden={false} backgroundColor="transparent" translucent={true} />

                    <ImageBackground
                        style={[{ backgroundColor: '#F9F9F9', width: "100%", height: "100%" }]}
                        resizeMode='stretch'
                        source={require('../../assets/images/bg.png')}>

                        <View style={[commonStyles.column, commonStyles.margin, { flex: 1, }]}>
                            <Text style={[commonStyles.fontFamilyBold, commonStyles.fontSize(4.5), { marginTop: hp('4%'), color: color.neavyBlue }]}>{commonStrings.signin_header}</Text>
                            <Text style={[commonStyles.fontFamilyRegular, commonStyles.fontSize(2.3), { color: color.grayColor }]}>{commonStrings.signin_description}</Text>

                            <View style={[styles.backgroundBox, { marginTop: hp('5%'), }]}>
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
                                        ref={(input) => { this.passwordInput = input; }}
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


                            <TouchableOpacity style={{ alignSelf: 'flex-end' }} onPress={() => { this.checkData() }}>
                                <View style={{ marginRight: wp('3%') }}>
                                    <Image style={styles.signUpButton}
                                        source={require('../../assets/images/arrow_button.png')} />
                                </View>
                            </TouchableOpacity>

                            <TouchableOpacity style={{ alignItems: 'center'}} onPress={() => { navigate('ForgotPasswordScreen') }}>
                                <View>
                                    <Text style={[commonStyles.fontFamilyBold, commonStyles.fontSize(2.2), { color: color.orange }]}>Forgot Password ?</Text>
                                </View>
                            </TouchableOpacity>



                            <View style={{ marginBottom: hp('5%'), flex: 1, position: 'absolute', bottom: 0, justifyContent: 'center', alignSelf: 'center' }}>
                                <View style={{ flexDirection: 'row', }}>
                                    <View>
                                        <Text style={[commonStyles.fontFamilyRegular, commonStyles.fontSize(2.2), { color: color.grayColor }]}>Already have an account? </Text>
                                    </View>
                                    <TouchableOpacity onPress={() => { this.navigationBack() }}>
                                        <View>
                                            <Text style={[commonStyles.fontFamilyBold, commonStyles.fontSize(2.2), { color: color.orange }]}>Sign Up</Text>
                                        </View>
                                    </TouchableOpacity>
                                </View>
                            </View>

                        </View>
                    </ImageBackground>
                </View>

            );
        }
    }
}

const styles = StyleSheet.create({
    gridPad: { marginTop: hp('2%') },
    txtMargin: { margin: wp('1%') },
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

    signUpButton: {
        marginRight: wp('-6%'),
        width: wp('20%'),
        height: hp('12%'),
        resizeMode: 'contain'
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
)(withNavigation(SignInScreen));