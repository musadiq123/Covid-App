import React from "react";
import { StyleSheet, View, ImageBackground, StatusBar, Text, TouchableOpacity, Image, ActivityIndicator, Alert, Share } from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import commonStyles from '../styles/Common';
import color from '../styles/StyleConstants';
import { ScrollView } from "react-native-gesture-handler";
import { Toast } from 'native-base';
import { withNavigation, StackActions, NavigationActions } from 'react-navigation';
import { connect } from "react-redux";
import firebase from 'react-native-firebase'
import NetInfo from "@react-native-community/netinfo";
import AsyncStorage from '@react-native-community/async-storage';
class ProfileScreen extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            data: '',
            loading: false,
            locations: '',
        }
        this.ref = firebase.firestore().collection('user')
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

    showMessage(message) {
        Keyboard.dismiss()
        Toast.show({
            text: message,
            duration: 2000
        })
    }

    async UNSAFE_componentWillMount() {
        
        var emailid = await AsyncStorage.getItem('emailid');
        this.setState({ loading: true })
        const userDoc = await this.ref.doc(emailid).get()
        this.setState({ data: userDoc.data(), loading: false })
    }

    logout() {
        Alert.alert(
            'Logout',
            'You will be returned to the login screen.',
            [
                {
                    text: 'Cancel', onPress: () => {

                    }, style: 'cancel'
                },
                {
                    text: 'Logout', onPress: async () => {
                        //firebase.auth().signOut();
                        await AsyncStorage.removeItem('USER_DATA', null);
                        const resetAction = StackActions.reset({
                            index: 0,
                            actions: [
                                NavigationActions.navigate({
                                    routeName: "SignUpScreen"
                                })
                            ]
                        });
                        this.props.navigation.dispatch(resetAction);
                    }
                },
            ],
            { cancelable: false }
        )
    }
    
    shareApp = async () => {
       var txt = "Join me on GroupGuard to defeat Covid-19. Use GroupGuard to create groups you trust and share your health status with family, friends, neighbours or colleagues. Download GroupGuard at [link for Android] or [iOS]"
        var text = "Please install Android from https://play.google.com/store/apps/details?id=com.whatsapp&hl=en and IOS from https://play.google.com/store/apps/details?id=com.whatsapp&hl=en."
        try {
            await Share.share({
                title: 'Group Guard Share',
                message: txt,
            });

        } catch (error) {
            console.log(error.message);
        }

    }

    render() {
        const { navigate } = this.props.navigation;
        if (this.state.loading) {
            return (
                <View style={[commonStyles.column, { flex: 1, }]}>
                    <Text style={[commonStyles.margin, commonStyles.fontFamilyBold, commonStyles.fontSize(5), { marginTop: hp('3%'), color: color.neavyBlue }]}>Profile</Text>
                    <View style={{ marginTop: hp('10%') }}>
                        <ActivityIndicator
                            size='large'
                            color={color.gradientStartColor} />
                    </View>

                </View>
            )
        }
        else {
            var encodedData = this.state.data.profile_url;
            return (
                <View style={[commonStyles.margin, commonStyles.column, { flex: 1 }]}>
                    <View style={{ flexDirection: 'row', marginTop: hp('3%'), alignItems: 'center' }}>
                        <View style={{ justifyContent: 'center', alignItems: 'flex-start' }}>
                            <Text style={[commonStyles.fontFamilyBold, commonStyles.fontSize(5), { color: color.neavyBlue }]}>Profile</Text>
                        </View>
                    </View>



                    <View style={[commonStyles.center, { marginTop: hp('1%') }]}>
                        <View style={styles.imageBG}>
                            <Image style={[styles.clientImage]}
                                resizeMode={"cover"}
                                resizeMethod={"resize"} // <-------  this helped a lot as OP said
                                // progressiveRenderingEnabled={true}
                                source={{ uri: `data:image/gif;base64,${encodedData}` }} />
                        </View>


                        <Text style={[commonStyles.fontFamilyBold, commonStyles.fontSize(3), { marginTop: hp('2%'), color: color.neavyBlue }]}>{this.state.data.name}</Text>

                    </View>
                    <ScrollView showsVerticalScrollIndicator={false}>


                        <View style={[styles.backgroundBox, { marginTop: hp('2%'), }]}>
                            <View style={{ flex: 1, flexDirection: 'row' }}>
                                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'flex-start' }}>
                                    <Text style={[commonStyles.fontFamilyRegular, commonStyles.fontSize(2), { height: hp('3%'), color: color.grayColor }]}>Email ID</Text>
                                </View>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <Image style={styles.icons}
                                        source={require('../../assets/images/email.png')} />
                                </View>
                            </View>
                            <View style={{ flex: 1, }}>
                                <Text
                                    style={[commonStyles.fontFamilyBold, commonStyles.fontSize(2.3), { color: color.neavyBlue, paddingHorizontal: wp('0%'), marginBottom: hp('-1%'), height: hp('6%'), }]}>{this.state.data.emailid}</Text>
                            </View>
                        </View>
                        <View style={[styles.backgroundBox, { marginTop: hp('2%'), }]}>
                            <View style={{ flex: 1, flexDirection: 'row' }}>
                                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'flex-start' }}>
                                    <Text style={[commonStyles.fontFamilyRegular, commonStyles.fontSize(2), { height: hp('3%'), color: color.grayColor }]}>Phone</Text>
                                </View>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <Image style={styles.icons}
                                        source={require('../../assets/images/phone.png')} />
                                </View>
                            </View>
                            <View style={{ flex: 1, }}>
                                <Text
                                    style={[commonStyles.fontFamilyBold, commonStyles.fontSize(2.3), { color: color.neavyBlue, paddingHorizontal: wp('0%'), marginBottom: hp('-1%'), height: hp('6%'), }]}>{this.state.data.phone_number}</Text>
                            </View>
                        </View>

                        <View style={[styles.backgroundBox, { marginTop: hp('2%'), }]}>
                            <View style={{ flex: 1, flexDirection: 'row' }}>
                                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'flex-start' }}>
                                    <Text style={[commonStyles.fontFamilyRegular, commonStyles.fontSize(2), { height: hp('3%'), color: color.grayColor }]}>Address</Text>
                                </View>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <Image style={styles.icons}
                                        source={require('../../assets/images/location.png')} />
                                </View>
                            </View>
                            <View style={{ flex: 1, }}>
                                <Text numberOfLines={1} style={[commonStyles.fontFamilyBold, commonStyles.fontSize(2.3), { color: color.neavyBlue, paddingHorizontal: wp('0%'), marginBottom: hp('-1%'), height: hp('6%'), }]}>{this.state.data.address}</Text>
                            </View>
                        </View>

                        <View style={[styles.backgroundBox, { marginTop: hp('2%') }]}>
                            <View style={{ flex: 1, flexDirection: 'row' }}>
                                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'flex-start' }}>
                                    <Text style={[commonStyles.fontFamilyRegular, commonStyles.fontSize(2), { height: hp('3%'), color: color.grayColor }]}>Quarantine Type</Text>
                                </View>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <Image style={styles.icons}
                                        source={require('../../assets/images/quarantine.png')} />
                                </View>
                            </View>
                            <View style={{ flex: 1, }}>
                                {
                                    this.state.data.quarantine_type === "No" ?
                                        <Text style={[commonStyles.fontFamilyBold, commonStyles.fontSize(2.3), { color: color.neavyBlue, paddingHorizontal: wp('0%'), marginBottom: hp('-1%'), height: hp('6%'), }]}>Not in Quarantine</Text> :
                                        <Text style={[commonStyles.fontFamilyBold, commonStyles.fontSize(2.3), { color: color.neavyBlue, paddingHorizontal: wp('0%'), marginBottom: hp('-1%'), height: hp('6%'), }]}>Government</Text>
                                }

                            </View>
                        </View>

                        <View style={{ justifyContent: "space-around", flexDirection: 'row', flex: 1, marginTop: hp('2%') }}>
                            <TouchableOpacity onPress={() => { this.logout() }} style={[styles.backgroundBoxOther]}>
                                <Image style={styles.logoutIcon}
                                    source={require('../../assets/images/logout.png')} />
                                <Text style={[commonStyles.fontFamilyBold, commonStyles.fontSize(2.5), { marginLeft: wp('3%'), color: color.neavyBlue }]}>Logout</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => { navigate("FAQScreen") }} style={[styles.backgroundBoxOther]}>
                                <Image style={styles.logoutIcon}
                                    source={require('../../assets/images/question.png')} />
                                <Text style={[commonStyles.fontFamilyBold, commonStyles.fontSize(2.5), { marginLeft: wp('3%'), color: color.neavyBlue }]}>FAQ</Text>
                            </TouchableOpacity>

                        </View>
                        <View style={{ justifyContent: 'space-around', flexDirection: 'row', flex: 1, marginTop: hp('2%'), marginBottom: hp('2%'), }}>
                            <TouchableOpacity onPress={() => { this.shareApp() }} style={[styles.backgroundBoxOther]}>
                                <Image style={styles.logoutIcon}
                                    source={require('../../assets/images/share.png')} />
                                <Text style={[commonStyles.fontFamilyBold, commonStyles.fontSize(2.5), { marginLeft: wp('3%'), color: color.neavyBlue }]}>Share</Text>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => { navigate("Locations") }} style={[styles.backgroundBoxOther]}>
                                <Image style={styles.logoutIcon}
                                    source={require('../../assets/images/question.png')} />
                                <Text style={[commonStyles.fontFamilyBold, commonStyles.fontSize(2.5), { marginLeft: wp('3%'), color: color.neavyBlue }]}>LOCATIONS</Text>
                            </TouchableOpacity>
                           
                        </View>

                        {/* <Text>{ this.state.locations ? this.state.locations[0].latitude : null}</Text> */}
                        
                    </ScrollView>
                </View>

            );
        }

    }
}

const styles = StyleSheet.create({
    logoutIcon: {
        width: wp('5%'),
        height: hp('5%'),
        resizeMode: 'contain'
    },
    icons: {
        width: wp('3%'),
        height: hp('2.5%'),
        resizeMode: 'contain'
    },
    clientImage: {
        width: wp('18%'), height: hp('18%'),
        aspectRatio: 1,
        borderRadius: wp('50%'),
    },
    imageBG: {
        borderWidth: 0.5,
        borderRadius: wp('50%'),
        borderColor: '#CBD5EA',
        elevation: 10,
        shadowColor: '#CBD5EA',
        shadowOffset: { width: 0, height: 5 },
        shadowOpacity: 0.5,
        shadowRadius: 5,
    },
    backgroundBox: {
        alignSelf: 'center',
        width: wp('88%'),
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
    backgroundBoxOther: {
        width: wp('43.5%'),
        justifyContent: 'center', alignItems: 'center', flexDirection: 'row',
        height: hp('7%'),
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
});
const mapStateToProps = state => ({
    data: state.user.data
});

export default connect(
    mapStateToProps,
    null
)(withNavigation(ProfileScreen));