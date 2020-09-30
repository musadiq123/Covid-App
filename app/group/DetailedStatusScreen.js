import React from "react";
import { StyleSheet, View, Text, TouchableOpacity, Image, ActivityIndicator, FlatList, Alert } from 'react-native';
import moment from 'moment';
import commonStyles from '../styles/Common';
import color from '../styles/StyleConstants';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import { withNavigation, StackActions, NavigationActions } from 'react-navigation';
import { connect } from "react-redux";
import LinearGradient from 'react-native-linear-gradient';
import { ScrollView } from "react-native-gesture-handler";
import { Toast } from 'native-base';
import firebase from 'react-native-firebase'
import NetInfo from "@react-native-community/netinfo";
import Geocoder from 'react-native-geocoding';

class DetailedStatusScreen extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            userData: '',
            loading: false,
            userStatus: []
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

    componentDidMount() {
        this.UNSAFE_componentWillMount();
        this.willFocusSubscription = this.props.navigation.addListener(
            'willFocus',
            () => {
                this.UNSAFE_componentWillMount();
            }
        );
    }

    componentWillUnmount() {
        this.willFocusSubscription.remove();
    }

    async UNSAFE_componentWillMount() {
        this.setState({ loading: true })
        var emailid = this.props.navigation.state.params.emailid;
        const userDoc = await this.ref.doc(emailid).get()
        this.setState({ userData: userDoc.data() }, () => {
            this.getStatus()
        })
    }

    async getStatus() {
        
        var tempArray = []
        var response = await this.ref.doc(this.state.userData.emailid).collection('status').orderBy("datetime", "desc").get()

        if (response.size > 0) {
            var size = response.size
            var counter = 1;
            response.forEach(async document => {

                var admission = moment(document.data().datetime);
                var discharge = moment();
                var diff = discharge.diff(admission, 'days');

                if (diff <= 14) {
                    var arr = {}
                    arr['address'] = document.data().address
                    
                    if (counter === 1) {
                        if (moment().format("MMM DD, YYYY") === moment(document.data().datetime).format("MMM DD, YYYY")) {
                            this.setState({ isTodayData: true })
                        }
                    }


                    arr['timestamp'] = moment(document.data().datetime).fromNow()

                    if (document.data().symptoms_status_level1 !== "Green") {
                        arr['symptom_status'] = document.data().symptoms_status_level1;
                    }
                    else {
                        arr['symptom_status'] = document.data().symptoms_status_level2;
                    }
                    arr['quarantine_status'] = document.data().quarantine_status


                    tempArray.push(arr);
                    if (counter === size) {
                        this.setState({ userStatus: tempArray, loading: false })
                    }
                    counter++;

                }
            })
        }
        else {
            this.setState({ userStatus: tempArray, loading: false })
        }
    }

    renderGreenStatus() {
        return (
            <View style={{ flexDirection: 'row', flex: 1 }}>
                <View>
                    <Image style={styles.icons}
                        source={require('../../assets/images/green-heart.png')} />
                </View>
                <View>
                    <Text numberOfLines={1} style={[commonStyles.fontFamilyBold, commonStyles.fontSize(1.7), { marginLeft: wp('1%'), color: color.neavyBlue }]}>No Symptoms,</Text>
                </View>

                <View style={{ marginRight: wp('1%') }}>
                    <Text numberOfLines={1} style={[commonStyles.fontFamilyRegular, commonStyles.fontSize(1.5), { position: 'absolute', bottom: 0, marginLeft: wp('1%'), color: color.grayColor }]}>{this.state.userStatus[0].timestamp}</Text>
                </View>
            </View>
        )

    }

    renderYellowStatus() {
        return (
            <View style={{ flexDirection: 'row', flex: 1 }}>
                <View>
                    <Image style={styles.icons}
                        source={require('../../assets/images/yellow-heart.png')} />
                </View>
                <View>
                    <Text numberOfLines={1} style={[commonStyles.fontFamilyBold, commonStyles.fontSize(1.7), { marginLeft: wp('1%'), color: color.neavyBlue }]}>Mild Symptoms,</Text>
                </View>
                <View style={{ marginRight: wp('1%') }}>
                    <Text numberOfLines={1} style={[commonStyles.fontFamilyRegular, commonStyles.fontSize(1.5), { position: 'absolute', bottom: 0, marginLeft: wp('1%'), color: color.grayColor }]}>{this.state.userStatus[0].timestamp}</Text>
                </View>
            </View>
        )

    }

    renderRedStatus() {
        return (
            <View style={{ flexDirection: 'row', flex: 1 }}>
                <View>
                    <Image style={styles.icons}
                        source={require('../../assets/images/red-heart.png')} />
                </View>
                <View>
                    <Text numberOfLines={1} style={[commonStyles.fontFamilyBold, commonStyles.fontSize(1.7), { marginLeft: wp('1%'), color: color.neavyBlue }]}>Strong Symptoms,</Text>
                </View>

                <View style={{ marginRight: wp('1%') }}>
                    <Text numberOfLines={1} style={[commonStyles.fontFamilyRegular, commonStyles.fontSize(1.5), { position: 'absolute', bottom: 0, marginLeft: wp('1%'), color: color.grayColor }]}>{this.state.userStatus[0].timestamp}</Text>
                </View>
            </View>
        )
    }


    render() {
        const { navigate } = this.props.navigation;
        if (this.state.loading) {
            return (
                <View style={[commonStyles.column, { flex: 1, }]}>
                    <View style={{ marginTop: hp('15%') }}>
                        <ActivityIndicator
                            size='large'
                            color={color.gradientStartColor} />
                    </View>

                </View>
            )
        }
        else {
            return (
                <View style={[commonStyles.margin, commonStyles.column, { flex: 1, marginTop: hp('3%') }]}>

                    <View style={{ flexDirection: 'row' }}>
                        <TouchableOpacity style={{ paddingLeft: wp('1%'), paddingRight: wp('2%') }} onPress={() => { this.props.navigation.goBack() }}>
                            <Image style={[commonStyles.backIcons, { justifyContent: 'center' }]}
                                source={require('../../assets/images/back-button.png')} />
                        </TouchableOpacity>

                        <View style={{ flexDirection: 'row', flex: 1 }}>
                            <Text style={[commonStyles.fontFamilyBold, commonStyles.fontSize(4.5), { flex: 1, marginLeft: wp('3%'), color: color.neavyBlue }]}>{this.state.userData.name}</Text>

                        </View>
                    </View>

                    <View style={[styles.backgroundBox, { marginTop: hp('2%'), flexDirection: 'row' }]}>

                            <LinearGradient
                                colors={[color.gradientStartColor, color.gradientEndColor]}
                                // style={styles.linearGradient}
                                start={{ x: 0.0, y: 0.25 }} end={{ x: 1.2, y: 1.0 }}
                                style={{
                                    justifyContent: 'center',
                                    alignSelf: 'center',
                                    width: wp('2%'),
                                    height: hp('10%'),
                                    borderTopLeftRadius: 5,
                                    borderBottomLeftRadius: 5,
                                }}>
                            </LinearGradient>
                            <View style={{ flex: 1, flexDirection: 'row', }}>
                                <View style={{ marginLeft: wp('2%'), justifyContent: 'center', }}>
                                    <View style={styles.imageBG}>
                                        <Image style={[styles.userImage]}
                                            resizeMode={"cover"}
                                            resizeMethod={"resize"} // <-------  this helped a lot as OP said
                                            // progressiveRenderingEnabled={true}
                                            source={{ uri: `data:image/gif;base64,${this.state.userData.profile_url}` }} />
                                    </View>
                                </View>

                                <View style={{ flexDirection: 'column', flex: 1, justifyContent: 'center' }}>

                                    <View style={{ marginLeft: wp('2%'), marginRight: wp('1%'), flexDirection: 'column', }}>

                                        <View style={{ flexDirection: 'row', }}>
                                            {
                                                this.state.userStatus[0].symptom_status === "Green" ?
                                                    this.renderGreenStatus()
                                                    : null
                                            }
                                            {
                                                this.state.userStatus[0].symptom_status === "Red" ?
                                                    this.renderRedStatus()
                                                    : null
                                            }
                                            {
                                                this.state.userStatus[0].symptom_status === "Yellow" ?
                                                    this.renderYellowStatus()
                                                    : null
                                            }

                                        </View>

                                        {
                                            this.state.userStatus[0].quarantine_status === "Green" ?
                                                <View style={{ flexDirection: 'row' }}>
                                                    <View>
                                                        <Image style={styles.locationIcons}
                                                            source={require('../../assets/images/green-location.png')} />
                                                    </View>
                                                    {
                                                        this.state.userData.quarantine_type === "No" ?
                                                            <View>
                                                                <Text numberOfLines={1} style={[commonStyles.fontFamilyBold, commonStyles.fontSize(1.7), { marginLeft: wp('1%'), color: color.neavyBlue }]}>At Home,</Text>
                                                            </View> :
                                                            <View>
                                                                <Text numberOfLines={1} style={[commonStyles.fontFamilyBold, commonStyles.fontSize(1.7), { marginLeft: wp('1%'), color: color.neavyBlue }]}>In Quarantine,</Text>
                                                            </View>
                                                    }


                                                    <View style={{ marginRight: wp('1%') }}>
                                                        <Text numberOfLines={1} style={[commonStyles.fontFamilyRegular, commonStyles.fontSize(1.5), { position: 'absolute', bottom: 0, marginLeft: wp('1%'), color: color.grayColor }]}>{this.state.userStatus[0].timestamp}</Text>
                                                    </View>
                                                </View> : null
                                        }
                                        {
                                            this.state.userStatus[0].quarantine_status === "Yellow" ?
                                                <View style={{ flexDirection: 'row' }}>
                                                    <View>
                                                        <Image style={styles.locationIcons}
                                                            source={require('../../assets/images/yellow-location.png')} />
                                                    </View>
                                                    <View>
                                                        <Text numberOfLines={1} style={[commonStyles.fontFamilyBold, commonStyles.fontSize(1.7), { marginLeft: wp('1%'), color: color.neavyBlue }]}>Near Home,</Text>
                                                    </View>


                                                    <View style={{ marginRight: wp('1%') }}>
                                                        <Text numberOfLines={1} style={[commonStyles.fontFamilyRegular, commonStyles.fontSize(1.5), { position: 'absolute', bottom: 0, marginLeft: wp('1%'), color: color.grayColor }]}>{this.state.userStatus[0].timestamp}</Text>
                                                    </View>
                                                </View> : null
                                        }
                                        {
                                            this.state.userStatus[0].quarantine_status === "Red" ?
                                                <View style={{ flexDirection: 'row' }}>
                                                    <View>
                                                        <Image style={styles.locationIcons}
                                                            source={require('../../assets/images/red-location.png')} />
                                                    </View>
                                                    <View>
                                                        <Text numberOfLines={1} style={[commonStyles.fontFamilyBold, commonStyles.fontSize(1.7), { marginLeft: wp('1%'), color: color.neavyBlue }]}>Far From Home,</Text>
                                                    </View>

                                                    <View style={{ marginRight: wp('1%') }}>
                                                        <Text numberOfLines={1} style={[commonStyles.fontFamilyRegular, commonStyles.fontSize(1.5), { position: 'absolute', bottom: 0, marginLeft: wp('1%'), color: color.grayColor }]}>{this.state.userStatus[0].timestamp}</Text>
                                                    </View>
                                                </View> : null
                                        }
                                    </View>
                                </View>

                            </View>
                        </View>



                        <Text style={[commonStyles.fontFamilyBold, commonStyles.fontSize(3), { marginTop: hp('4%'), color: color.neavyBlue }]}>Previous Status ({this.state.userStatus.length - 1})</Text>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <View style={{ marginTop: hp('2%') }} />
                            {
                                this.state.userStatus.length > 0 ?
                                    <FlatList
                                        data={this.state.userStatus}
                                        renderItem={({ item, index }) => {
                                            if (index != 0) {
                                                return (
                                                    <View style={[styles.backgroundBoxStatus, { marginBottom: hp('2%'), flexDirection: 'row' }]}>
                                                        <View style={{ flex: 1, flexDirection: 'row', }}>
                                                            <View style={{ marginLeft: wp('2%'), justifyContent: 'center', }}>
                                                                <View style={styles.imageBG}>
                                                                    <Image style={[styles.userImageStatus]}
                                                                        resizeMode={"cover"}
                                                                        resizeMethod={"resize"} // <-------  this helped a lot as OP said
                                                                        // progressiveRenderingEnabled={true}
                                                                        source={{ uri: `data:image/gif;base64,${this.state.userData.profile_url}` }} />
                                                                </View>
                                                            </View>

                                                            <View style={{ flexDirection: 'column', flex: 1, justifyContent: 'center' }}>

                                                                <View style={{ marginLeft: wp('2%'), marginRight: wp('1%'), flexDirection: 'column', }}>
                                                                    <View style={{ flexDirection: 'column', alignItems: 'center' }}>
                                                                        <View style={{ flexDirection: 'row', }}>
                                                                            {
                                                                                item.symptom_status === "Green" ?
                                                                                    this.renderGreenStatus()
                                                                                    : null
                                                                            }
                                                                            {
                                                                                item.symptom_status === "Red" ?
                                                                                    this.renderRedStatus()
                                                                                    : null
                                                                            }
                                                                            {
                                                                                item.symptom_status === "Yellow" ?
                                                                                    this.renderYellowStatus()
                                                                                    : null
                                                                            }
                                                                        </View>

                                                                        {
                                                                            item.quarantine_status === "Green" ?
                                                                                <View style={{ alignSelf: 'flex-start', flexDirection: 'row' }}>
                                                                                    <View>
                                                                                        <Image style={styles.locationIcons}
                                                                                            source={require('../../assets/images/green-location.png')} />
                                                                                    </View>
                                                                                    {
                                                                                        this.state.userData.quarantine_type === "No" ?
                                                                                            <View>
                                                                                                <Text numberOfLines={1} style={[commonStyles.fontFamilyBold, commonStyles.fontSize(1.7), { marginLeft: wp('1%'), color: color.neavyBlue }]}>At Home,</Text>
                                                                                            </View> :
                                                                                            <View>
                                                                                                <Text numberOfLines={1} style={[commonStyles.fontFamilyBold, commonStyles.fontSize(1.7), { marginLeft: wp('1%'), color: color.neavyBlue }]}>In Quarantine,</Text>
                                                                                            </View>
                                                                                    }

                                                                                    <View style={{ marginRight: wp('1%') }}>
                                                                                        <Text numberOfLines={1} style={[commonStyles.fontFamilyRegular, commonStyles.fontSize(1.5), { position: 'absolute', bottom: 0, marginLeft: wp('1%'), color: color.grayColor }]}>{this.state.userStatus[0].timestamp}</Text>
                                                                                    </View>
                                                                                </View> : null
                                                                        }
                                                                        {
                                                                            item.quarantine_status === "Yellow" ?
                                                                                <View style={{ alignSelf: 'flex-start', flexDirection: 'row' }}>
                                                                                    <View>
                                                                                        <Image style={styles.locationIcons}
                                                                                            source={require('../../assets/images/yellow-location.png')} />
                                                                                    </View>
                                                                                    <View>
                                                                                        <Text numberOfLines={1} style={[commonStyles.fontFamilyBold, commonStyles.fontSize(1.7), { marginLeft: wp('1%'), color: color.neavyBlue }]}>Near Home,</Text>
                                                                                    </View>

                                                                                    <View style={{ marginRight: wp('1%') }}>
                                                                                        <Text numberOfLines={1} style={[commonStyles.fontFamilyRegular, commonStyles.fontSize(1.5), { position: 'absolute', bottom: 0, marginLeft: wp('1%'), color: color.grayColor }]}>{this.state.userStatus[0].timestamp}</Text>
                                                                                    </View>
                                                                                </View> : null
                                                                        }
                                                                        {
                                                                            item.quarantine_status === "Red" ?
                                                                                <View style={{ alignSelf: 'flex-start', flexDirection: 'row' }}>
                                                                                    <View>
                                                                                        <Image style={styles.locationIcons}
                                                                                            source={require('../../assets/images/red-location.png')} />
                                                                                    </View>
                                                                                    <View>
                                                                                        <Text style={[commonStyles.fontFamilyBold, commonStyles.fontSize(1.7), { marginLeft: wp('1%'), color: color.neavyBlue }]}>Far From Home,</Text>
                                                                                    </View>

                                                                                    <View style={{ marginRight: wp('1%') }}>
                                                                                        <Text style={[commonStyles.fontFamilyRegular, commonStyles.fontSize(1.5), { position: 'absolute', bottom: 0, marginLeft: wp('1%'), color: color.grayColor }]}>{this.state.userStatus[0].timestamp}</Text>
                                                                                    </View>
                                                                                </View> : null
                                                                        }
                                                                    </View>
                                                                </View>
                                                            </View>

                                                        </View>
                                                    </View>
                                                )
                                            }

                                        }}

                                    /> :
                                    <View style={{ marginTop: hp('2%') }}>
                                        <Text style={[commonStyles.fontFamilyRegular, commonStyles.fontSize(2), { height: hp('3%'), color: color.grayColor }]}>No Status</Text>
                                    </View>
                            }

                        </ScrollView>

                </View>

            );
        }

    }
}

const styles = StyleSheet.create({
    icons: {
        width: wp('4%'),
        height: hp('2.7%'),
        resizeMode: 'contain'
    },

    userImage: {
        width: wp('10%'), height: hp('7%'),
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
    locationIcons: {
        width: wp('4%'),
        height: hp('2.3%'),
        resizeMode: 'contain'
    },
    userImageStatus: {
        width: wp('10%'), height: hp('7%'),
        aspectRatio: 1,
        borderRadius: wp('50%'),
    },
    backgroundBox: {
        height: hp('10%'),
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
    backgroundBoxStatus: {
        height: hp('10%'),
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
    addButton: {
        marginRight: wp('-3%'),
        width: wp('20%'),
        height: hp('15%'),
        resizeMode: 'contain'
    },
});

const mapStateToProps = state => ({
    data: state.user.data
});

export default connect(
    mapStateToProps,
    null
)(withNavigation(DetailedStatusScreen));