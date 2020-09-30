import React from "react";
import { StyleSheet, View, ImageBackground, Share, Text, TouchableOpacity, Image, TextInput, ActivityIndicator, FlatList } from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import commonStyles from '../styles/Common';
import color from '../styles/StyleConstants';
import { ScrollView } from "react-native-gesture-handler";
import { withNavigation, StackActions, NavigationActions } from 'react-navigation';
import { connect } from "react-redux";
import { Toast } from 'native-base';
import firebase from 'react-native-firebase';
import AsyncStorage from '@react-native-community/async-storage';
import Geocoder from 'react-native-geocoding';
import Modal from 'react-native-modalbox';
const { State: TextInputState } = TextInput;
import NetInfo from "@react-native-community/netinfo";
import Menu, { MenuItem, MenuDivider } from 'react-native-material-menu';

class GroupDashboardScreen extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            userEmailID: '',
            data: '',
            loading: '',
            userData: '',
            usersStatus: [],
            greenHealthStatus: 0,
            redHealthStatus: 0,
            yellowHealthStatus: 0,
            greenLocationStatus: 0,
            redLocationStatus: 0,
            yellowLocationStatus: 0,
        }
        this.arrayholder = []
        this.ref = firebase.firestore().collection('user')
    }

    showMessage(message) {
        Toast.show({
            text: message,
            duration: 2000
        })
    }

    async UNSAFE_componentWillMount() {
        this.setState({loading: true})
        var emailid = await AsyncStorage.getItem('emailid');
        this.setState({ userEmailID: emailid, data: this.props.navigation.state.params.data }, () => {  this.getAdminData() })
    }

    async getAdminData() {
        const userDoc = await this.ref.doc(this.state.data.admin[0]).get()
        this.setState({ userData: userDoc.data() }, () => { this.getUsersStatus() })
    }


    async getUsersStatus() {
        var data = []
        var GHS = 0, RHS = 0, YHS = 0, GLS = 0, RLS = 0, YLS = 0;

        var subject1 = [...this.state.data.admin]
        var subject = [...this.state.data.users];
        var subject2 = [...subject1, ...subject]
        

        for (var i = 0; i < subject2.length; i++) {

            const userDoc = await this.ref.doc(subject2[i]).get()
            await this.ref.doc(subject2[i]).collection('status').orderBy("datetime", "DESC").limit(1).get()
                .then(response => {
                    response.forEach(document => {

                        var temp = {}

                        temp['datetime'] = moment(document.data().datetime).fromNow()
                        temp['name'] = userDoc.data().name
                        temp['emailid'] = userDoc.data().emailid
                        temp['quarantine_status'] = document.data().quarantine_status
                        temp['profile_url'] = userDoc.data().profile_url

                        console.log("userDoc:",userDoc.data())
                        //check symptom status from both status
                        var stat = "";
                        if (document.data().symptoms_status_level1 !== "Green") {
                            temp['symptom_status'] = document.data().symptoms_status_level1;
                            stat = document.data().symptoms_status_level1;
                        }
                        else {
                            temp['symptom_status'] = document.data().symptoms_status_level2;
                            stat = document.data().symptoms_status_level2;
                        }

                        //check for health symptoms
                        if (stat === "Green") {
                            GHS++;
                        } else if (stat === "Yellow") {
                            YHS++;
                        }
                        else {
                            RHS++;
                        }


                        if (document.data().quarantine_status === "Green") {
                            GLS++;
                        } else if (document.data().quarantine_status === "Yellow") {
                            YLS++;
                        }
                        else {
                            RLS++;
                        }
                        data.push(temp)

                    });
                })
                .catch(error => {
                    alert(error)
                });
        }
        this.arrayholder = data
        this.setState({
            usersStatus: data,
            redHealthStatus: RHS, yellowHealthStatus: YHS, greenHealthStatus: GHS,
            redLocationStatus: RLS, yellowLocationStatus: YLS, greenLocationStatus: GLS, loading: false
        })

    }

    shareGroupCode = async () => {
        this._menu.hide();
        var txt = "I am inviting you to join my Group using code "+this.state.data.group_code+". By joining the group, you will be able to self report your health and also see the health and location status of other group members. Keep your family safe from the spread of viruses and illness. Download the GroupGuard app on [link for Android] or [iOS]"
        var text = "I am inviting you to join my group because I thought you might be interested in supporting it. You will get updates on whats new and you can interact with other people on this group. You can add " + this.state.data.group_code + " to join. Please install Android from https://play.google.com/store/apps/details?id=com.whatsapp&hl=en and IOS from https://play.google.com/store/apps/details?id=com.whatsapp&hl=en."
        try {
            await Share.share({
                title: 'Group Guard Share',
                message: txt,
            });

        } catch (error) {
            console.log(error.message);
        }
    }

    setMenuRef = ref => {
        this._menu = ref;
    };

    hideMenu = () => {
        this._menu.hide();
    };

    showMenu = () => {
        this._menu.show();
    };

    searchText(text) {
        this.setState({
          group_code: text,
    
        }, () => {
            if (text !== '') {
                var searchResults = [];
                for (var d of this.arrayholder) {
                    if (d.name.toLowerCase().includes(text.toLowerCase())) {
                        searchResults.push(d);
                    }
                }
                this.setState({
                    usersStatus: searchResults,
                    group_code: text
                })
            }
            else {
                this.setState({  usersStatus: this.arrayholder, group_code: text })
            }

        });
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

                    <View style={{ flexDirection: 'row', }}>
                        <TouchableOpacity style={{ paddingRight: wp('2%') }} onPress={() => { this.props.navigation.goBack() }}>
                            <Image style={[commonStyles.backIcons, { justifyContent: 'center' }]}
                                source={require('../../assets/images/back-button.png')} />
                        </TouchableOpacity>
                        <View style={{ flexDirection: 'column', width: wp('83%') }}>
                            <View style={{ flexDirection: 'row', }}>
                                <Text numberOfLines={1} style={[commonStyles.fontFamilyBold, commonStyles.fontSize(4.5), { width: wp('68%'), marginLeft: wp('3%'), color: color.neavyBlue }]}>{this.state.data.group_name}</Text>
                                <View style={{ justifyContent: 'center', flex: 1, alignItems: 'flex-end' }}>
                                    <Menu ref={this.setMenuRef} button={<TouchableOpacity onPress={this.showMenu}><Image style={[styles.dotIcons]}
                                        source={require('../../assets/images/more-option.png')} /></TouchableOpacity>}>
                                        <MenuItem onPress={this.shareGroupCode}>Invite Members</MenuItem>
                                        <MenuItem onPress={this.hideMenu}>Exit Group</MenuItem>
                                    </Menu>
                                </View>
                            </View>

                            <Text style={[commonStyles.fontFamilyRegular, commonStyles.fontSize(2), { marginLeft: wp('3%'), color: color.grayColor }]}>Admin: {this.state.userData.name}, {moment(this.state.data.created_at).format("MMM DD, YYYY")}</Text>
                        </View>

                    </View>
                    <Text style={[commonStyles.fontFamilySemiBold, commonStyles.fontSize(3), { marginTop: hp('4%'), color: color.neavyBlue }]}>Total Members: {this.state.data.admin.length + this.state.data.users.length}</Text>

                    <View style={{ justifyContent: 'space-between', flexDirection: 'row', marginTop: hp('1%') }}>
                        <View style={[styles.bgColorHeader]}>
                            <Text style={[commonStyles.fontFamilyBold, commonStyles.fontSize(2.1), { justifyContent: 'center', alignSelf: 'center', color: 'black' }]}>Health</Text>
                        </View>
                        <View style={[styles.bgColorBoxGreen]}>
                            <Text style={[commonStyles.fontFamilyBold, commonStyles.fontSize(3), { justifyContent: 'center', alignSelf: 'center', marginTop: hp('-0.5%'), color: 'white' }]}>{this.state.greenHealthStatus}</Text>
                        </View>
                        <View style={[styles.bgColorBoxYellow]}>
                            <Text style={[commonStyles.fontFamilyBold, commonStyles.fontSize(3), { justifyContent: 'center', alignSelf: 'center', marginTop: hp('-0.5%'), color: 'white' }]}>{this.state.yellowHealthStatus}</Text>
                        </View>
                        <View style={[styles.bgColorBoxRed]}>
                            <Text style={[commonStyles.fontFamilyBold, commonStyles.fontSize(3), { justifyContent: 'center', alignSelf: 'center', marginTop: hp('-0.5%'), color: 'white' }]}>{this.state.redHealthStatus}</Text>
                        </View>
                    </View>
                    {/* <Text style={[commonStyles.fontFamilySemiBold, commonStyles.fontSize(2.3), { marginTop: hp('1%'), color: color.neavyBlue }]}>Location</Text> */}
                    <View style={{ justifyContent: 'space-between', flexDirection: 'row', marginTop: hp('1%') }}>
                        <View style={[styles.bgColorHeader]}>
                            <Text style={[commonStyles.fontFamilyBold, commonStyles.fontSize(2.1), { justifyContent: 'center', alignSelf: 'center', color: 'black' }]}>Location</Text>
                        </View>
                        <View style={[styles.bgColorBoxGreen]}>
                            <Text style={[commonStyles.fontFamilyBold, commonStyles.fontSize(3), { justifyContent: 'center', alignSelf: 'center', marginTop: hp('-0.5%'), color: 'white' }]}>{this.state.greenLocationStatus}</Text>
                        </View>
                        <View style={[styles.bgColorBoxYellow]}>
                            <Text style={[commonStyles.fontFamilyBold, commonStyles.fontSize(3), { justifyContent: 'center', alignSelf: 'center', marginTop: hp('-0.5%'), color: 'white' }]}>{this.state.yellowLocationStatus}</Text>
                        </View>
                        <View style={[styles.bgColorBoxRed]}>
                            <Text style={[commonStyles.fontFamilyBold, commonStyles.fontSize(3), { justifyContent: 'center', alignSelf: 'center', marginTop: hp('-0.5%'), color: 'white' }]}>{this.state.redLocationStatus}</Text>
                        </View>
                    </View>

                    <View style={{ flexDirection: 'row', marginTop: hp('4%'), }}>
                        <View style={{ justifyContent: 'center', }}>
                            <Text style={[commonStyles.fontFamilySemiBold, commonStyles.fontSize(3), { color: color.neavyBlue }]}>Members (All)</Text>
                        </View>

                        <TouchableOpacity style={{ flex: 1, justifyContent: 'center', alignItems: 'flex-end' }} onPress={() => { this.setState({ textinput: !this.state.textinput }) }}>
                            {this.state.textinput ? <View><Text style={[commonStyles.fontFamilyRegular, commonStyles.fontSize(2.3), { height: hp('5%'), marginLeft: wp('1%'), color: color.neavyBlue }]}>Cancel</Text></View> :
                                <View style={{ marginRight: wp('1%') }}>
                                    <Image style={styles.searchIcons}
                                        source={require('../../assets/images/search.png')} />
                                </View>}
                        </TouchableOpacity>

                    </View>
                    {this.state.textinput ?
                        <View style={[styles.backgroundBoxSearch, { marginTop: hp('2%'), flexDirection: 'row', }]}>

                            <View style={{ marginLeft: wp('3%'), marginRight: wp('1%'), justifyContent: 'center' }}>
                                <Image style={styles.searchIcons}
                                    source={require('../../assets/images/search.png')} />
                            </View>
                            <TextInput
                                style={[commonStyles.fontFamilyRegular, commonStyles.fontSize(2.3), { width: wp('100%'), paddingLeft: wp('1.5%'), height: hp('6%'), justifyContent: 'center', paddingHorizontal: wp('0%'), }]}
                                placeholder={'Search by name'}
                                autoFocus={true}
                                numberOfLines={1}
                                placeholderTextColor={color.neavyBlue}
                                onChangeText={(text) => this.searchText(text)}
                            />
                        </View>
                        : null}

                    <ScrollView showsVerticalScrollIndicator={false}>
                        {
                            this.state.usersStatus.length > 0 ?
                                <FlatList
                                extraData={this.state.usersStatus}
                                    data={this.state.usersStatus}
                                    renderItem={({ item }) => {
                                      
                                        return (
                                            <TouchableOpacity onPress={() => { this.state.emailid != item.emailid ? navigate('DetailedStatusScreen', { emailid: item.emailid }) : null}} style={[styles.backgroundBoxStatus, { marginTop: hp('1%'), marginBottom: hp('1%'), flexDirection: 'row' }]}>
                                                <View style={{ flex: 1, flexDirection: 'row', }}>
                                                    <View style={{ marginLeft: wp('2%'), justifyContent: 'center', }}>
                                                        <View style={styles.imageBG}>
                                                            <Image style={[styles.userImageStatus]}
                                                                resizeMode={"cover"}
                                                                resizeMethod={"resize"} // <-------  this helped a lot as OP said
                                                                // progressiveRenderingEnabled={true}
                                                                source={{ uri: `data:image/gif;base64,${item.profile_url}` }} />
                                                        </View>
                                                    </View>

                                                    <View style={{ flexDirection: 'column', flex: 1, justifyContent: 'center' }}>

                                                        <View style={{ marginLeft: wp('2%'), marginRight: wp('1%'), flexDirection: 'column', }}>
                                                            <Text style={[commonStyles.fontFamilySemiBold, commonStyles.fontSize(2), { color: color.neavyBlue }]}>{item.name}</Text>
                                                            {
                                                                item.symptom_status === "Green" ?
                                                                    <View style={{ flexDirection: 'row' }}>
                                                                        <View>
                                                                            <Image style={styles.icons}
                                                                                source={require('../../assets/images/green-heart.png')} />
                                                                        </View>
                                                                        <View>
                                                                            <Text numberOfLines={1} style={[commonStyles.fontFamilyBold, commonStyles.fontSize(1.7), { width: wp('58%'), marginLeft: wp('1%'), color: color.neavyBlue }]}>No Symptoms</Text>
                                                                        </View>

                                                                    </View> : null
                                                            }
                                                            {
                                                                item.symptom_status === "Yellow" ?
                                                                    <View style={{ flexDirection: 'row' }}>
                                                                        <View>
                                                                            <Image style={styles.icons}
                                                                                source={require('../../assets/images/yellow-heart.png')} />
                                                                        </View>
                                                                        <View>
                                                                            <Text  style={[commonStyles.fontFamilyBold, commonStyles.fontSize(1.7), {  marginLeft: wp('1%'), color: color.neavyBlue }]}>Mild Symptoms</Text>
                                                                        </View>
                                                                        <View>
                                                                        <Text  style={[commonStyles.fontFamilyBold, commonStyles.fontSize(1.7), { marginLeft: wp('1%'), color: color.grayColor }]}>{item.datetime}</Text>
                                                                        </View>

                                                                    </View> : null
                                                            }
                                                            {
                                                                item.symptom_status === "Red" ?
                                                                    <View style={{ flexDirection: 'row' }}>
                                                                        <View>
                                                                            <Image style={styles.icons}
                                                                                source={require('../../assets/images/red-heart.png')} />
                                                                        </View>
                                                                        <View>
                                                                            <Text numberOfLines={1} style={[commonStyles.fontFamilyBold, commonStyles.fontSize(1.7), { width: wp('58%'), marginLeft: wp('1%'), color: color.neavyBlue }]}>Strong Symptoms</Text>
                                                                        </View>
                                                                    <Text numberOfLines={1} style={[commonStyles.fontFamilyBold, commonStyles.fontSize(1.7), { marginLeft: wp('1%'), color: color.grayColor }]}>{item.datetime}</Text>


                                                                    </View> : null
                                                            }
                                                            <View style={{ flexDirection: 'row' }}>
                                                                <View>
                                                                    <Image style={styles.locationIcons}
                                                                        source={require('../../assets/images/green-location.png')} />
                                                                </View>
                                                                {
                                                                    this.state.userData.quarantine_type === "No" ?
                                                                        <View style={{ flexDirection: 'row' }}>
                                                                            <Text numberOfLines={1} style={[commonStyles.fontFamilyBold, commonStyles.fontSize(1.7), { marginLeft: wp('1%'), color: color.neavyBlue }]}>At Home,</Text>
                                                                            <Text numberOfLines={1} style={[commonStyles.fontFamilyBold, commonStyles.fontSize(1.7), { marginLeft: wp('1%'), color: color.grayColor }]}>{item.datetime}</Text>

                                                                        </View> :
                                                                        <View style={{ flexDirection: 'row' }}>
                                                                            <Text numberOfLines={1} style={[commonStyles.fontFamilyBold, commonStyles.fontSize(1.7), { marginLeft: wp('1%'), color: color.neavyBlue }]}>In Quarantine,</Text>
                                                                            <Text numberOfLines={1} style={[commonStyles.fontFamilyBold, commonStyles.fontSize(1.7), { marginLeft: wp('1%'), color: color.grayColor }]}>{item.datetime}</Text>

                                                                        </View>
                                                                }
                                                                {/* {
                                                                    item.quarantine_status === "Green" ?
                                                                        <View style={{ flex: 1 }}>
                                                                            <View style={{ backgroundColor: color.green, alignSelf: 'flex-end', borderRadius: wp('5%'), marginRight: hp('0.7%') }}>
                                                                                <Text style={[commonStyles.fontSize(1.5), commonStyles.fontFamilyBold, { paddingTop: wp('0.5%'), paddingBottom: wp('0.5%'), paddingLeft: wp('1%'), paddingRight: wp('1%'), color: '#ffffff' }]}>Quarantine</Text>
                                                                            </View>
                                                                        </View> : null
                                                                }
                                                                {
                                                                    item.quarantine_status === "Yellow" ?
                                                                        <View style={{ flex: 1 }}>
                                                                            <View style={{ backgroundColor: color.yellow, alignSelf: 'flex-end', borderRadius: wp('5%'), marginRight: hp('0.7%') }}>
                                                                                <Text style={[commonStyles.fontSize(1.5), commonStyles.fontFamilyBold, { paddingTop: wp('0.5%'), paddingBottom: wp('0.5%'), paddingLeft: wp('1%'), paddingRight: wp('1%'), color: '#ffffff' }]}>Locality</Text>
                                                                            </View>
                                                                        </View> : null
                                                                }
                                                                {
                                                                    item.quarantine_status === "Red" ?
                                                                        <View style={{ flex: 1 }}>
                                                                            <View style={{ backgroundColor: color.red, alignSelf: 'flex-end', borderRadius: wp('5%'), marginRight: hp('0.7%') }}>
                                                                                <Text style={[commonStyles.fontSize(1.5), commonStyles.fontFamilyBold, { paddingTop: wp('0.5%'), paddingBottom: wp('0.5%'), paddingLeft: wp('3%'), paddingRight: wp('3%'), color: '#ffffff' }]}>Out</Text>
                                                                            </View>
                                                                        </View> : null
                                                                } */}

                                                            </View>

                                                            
                                                        </View>
                                                    </View>
                                                </View>
                                            </TouchableOpacity>
                                        )
                                    }}

                                /> :
                                <View style={{ marginTop: hp('2%') }}>
                                    <Text style={[commonStyles.fontFamilyRegular, commonStyles.fontSize(2), { height: hp('3%'), color: color.grayColor }]}>No History</Text>
                                </View>
                        }
                    </ScrollView>

                </View>

            );
        }

    }
}

const styles = StyleSheet.create({
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
    userImageStatus: {
        width: wp('7%'), height: hp('9.5%'),
        aspectRatio: 1,
        borderRadius: wp('50%'),
    },
    statusIcons: {
        width: wp('4%'),
        height: hp('3%'),
        resizeMode: 'contain'
    },
    dotIcons: {
        width: wp('6%'),
        height: hp('3%'),
        resizeMode: 'contain'
    },

    backgroundBoxStatus: {
        alignSelf: 'center',
        width: wp('88%'),
        height: hp('12%'),
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
    backgroundBoxSearch: {
        height: hp('6%'),
        width: wp('90%'),
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
    bgColorHeader: {
        width: wp('22%'),
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
    bgColorBoxGreen: {
        width: wp('22%'),
        height: hp('7%'),
        padding: wp('3%'),
        borderWidth: 0.5,
        borderRadius: 5,
        backgroundColor: color.green,
        borderColor: '#CBD5EA',
        elevation: 3,
        shadowColor: '#CBD5EA',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.5,
        shadowRadius: 5,
    },
    bgColorBoxRed: {
        width: wp('22%'),
        height: hp('7%'),
        padding: wp('3%'),
        borderWidth: 0.5,
        borderRadius: 5,
        backgroundColor: color.red,
        borderColor: '#CBD5EA',
        elevation: 3,
        shadowColor: '#CBD5EA',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.5,
        shadowRadius: 5,
    },
    bgColorBoxYellow: {
        width: wp('22%'),
        height: hp('7%'),
        padding: wp('3%'),
        borderWidth: 0.5,
        borderRadius: 5,
        backgroundColor: '#ECBA56',
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
    searchIcons: {
        width: wp('5%'),
        height: hp('5%'),
        resizeMode: 'contain'
    },
    modal2: {
        maxHeight: hp('40%'),
        minHeight: hp('40%')
    },
    camera: {
        width: wp('15%'),
        height: hp('5%'),
        resizeMode: 'contain'
    },
    locationIcons: {
        width: wp('3.7%'),
        height: hp('2.3%'),
        resizeMode: 'contain'
    },
});
const mapStateToProps = state => ({
    data: state.user.data
});

export default connect(
    mapStateToProps,
    null
)(withNavigation(GroupDashboardScreen));