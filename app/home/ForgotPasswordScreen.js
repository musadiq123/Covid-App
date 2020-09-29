import React from "react";
import { Animated, Dimensions, UIManager, StyleSheet, View, ImageBackground, StatusBar, Text, TouchableOpacity, Image, TextInput, Keyboard,Linking, ActivityIndicator, CheckBox, Alert } from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import commonStyles from '../styles/Common';
import color from '../styles/StyleConstants';
import { withNavigation, StackActions, NavigationActions } from 'react-navigation';
import { connect } from "react-redux";
import firebase from 'react-native-firebase';
import { Toast } from 'native-base';
import commonStrings from '../styles/CommonStrings';
import NetInfo from "@react-native-community/netinfo";
const { State: TextInputState } = TextInput;
import AsyncStorage from '@react-native-community/async-storage';


class ForgotPasswordScreen extends React.Component {


    constructor(props) {
        super(props);

        this.state = {
            emailid:'',
            shift: new Animated.Value(0),
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

    isValidEmail = (text) => {
        var reg = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
        return reg.test(text)
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

    makeid(length) {
        var result           = '';
        var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        var charactersLength = characters.length;
        for ( var i = 0; i < length; i++ ) {
           result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        return result;
     }
    

    async addData(Email){
        const doc = await this.ref.doc(this.state.emailid).get()
        console.log("users",firebase.firestore())
        if (doc.exists) {
            firebase.auth().sendPasswordResetEmail(this.state.emailid)
            this.showMessage("Email sent successfully!")
            this.setState({emailid:''})
            this.props.navigation.navigate('SignInScreen')
        }
        else{
            // alert("This user does not exist.");
            Alert.alert(
                'Warning',
                "This user does not exist. Please Sign-Up first",
                [
                  { text: "OK", onPress: () => { this.props.navigation.navigate('SignUpScreen') } }
                ],
                { cancelable: false }
              );
            this.setState({emailid:''})
        }    
    }

    render() {
        const { shift } = this.state;
        const { navigate } = this.props.navigation;

        return (
            <Animated.View style={{ transform: [{ translateY: shift }], flex: 1 }}>

                <StatusBar barStyle="dark-content" hidden={false} backgroundColor='transparent' translucent={true} />

                <ImageBackground
                    style={[{ backgroundColor: '#F9F9F9', width: "100%", height: "100%" }]}
                    resizeMode='stretch'
                    source={require('../../assets/images/bg.png')}>

                    <View style={[commonStyles.column, commonStyles.margin, { flex: 1, marginTop: hp('5%') }]}>
                    <View style={{ flexDirection: 'row' }}>
                            <View style={{ flexDirection: 'row', flex: 1 }}>
                                <TouchableOpacity style={{ paddingLeft: wp('1%'), paddingRight: wp('2%') }} onPress={() => { this.props.navigation.goBack() }}>
                                    <Image style={[commonStyles.backIcons, { justifyContent: 'center' }]}
                                        source={require('../../assets/images/back-button.png')} />
                                </TouchableOpacity>

                                <Text style={[commonStyles.fontFamilyBold, commonStyles.fontSize(4.5), { marginLeft: wp('3%'), color: color.neavyBlue }]}>Forgot Password</Text>

                            </View>
                        </View>
                        <Text style={[commonStyles.fontFamilyRegular, commonStyles.fontSize(2.3), { color: color.grayColor }]}>{commonStrings.signup_description_line1}</Text>
                        <Text style={[commonStyles.fontFamilyRegular, commonStyles.fontSize(2.3), { color: color.grayColor }]}>{commonStrings.signup_description_line2}</Text>
                        <Text style={[commonStyles.fontFamilyRegular, commonStyles.fontSize(2.3), { marginTop: hp('1.5%'), color: color.grayColor }]}>Please enter your email ID to reset your password</Text>


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
                                    keyboardType={'email-address'}
                                    style={[commonStyles.fontFamilyBold, commonStyles.fontSize(2.3), { paddingHorizontal: wp('0%'), marginBottom: hp('-1%'), height: hp('6%'), marginTop: hp('-1%') }]}
                                    placeholder={'Enter your email ID'}
                                    placeholderTextColor={color.neavyBlue}
                                    value={this.state.emailid}
                                    onChangeText={emailid => {
                                        this.setState({ emailid })
                                    }}
                                />
                            </View>
                        </View>

                        <View style={{ flex: 1, marginBottom: hp('5%'), }}>
                            <TouchableOpacity style={{ alignSelf: 'flex-end' }} onPress={() => { this.addData(this.state.emailid) }}>
                                <View style={{ marginRight: wp('3%') }}>
                                    <Image style={styles.signInButton}
                                        source={require('../../assets/images/arrow_button.png')} />
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>


                </ImageBackground>

            </Animated.View>

        );
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
)(withNavigation(ForgotPasswordScreen));