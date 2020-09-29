import React from "react";
import { StyleSheet, View, ImageBackground, StatusBar, Text, TouchableOpacity, Image, ActivityIndicator, FlatList, Alert,Platform } from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import commonStyles from '../styles/Common';
import color from '../styles/StyleConstants';
import LinearGradient from 'react-native-linear-gradient';
import { ScrollView } from "react-native-gesture-handler";
import { Toast } from 'native-base';
import NetInfo from "@react-native-community/netinfo";
import firebase from 'react-native-firebase';
import AsyncStorage from '@react-native-community/async-storage';
import Modal from 'react-native-modalbox';
import Geolocation from '@react-native-community/geolocation';
import ImagePicker from 'react-native-image-crop-picker';
import Geocoder from 'react-native-geocoding';

export default class SymptomsAdvCatScreen extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            uploadingImage: false,
            base64: '',
            latitude: 0,
            longitude: 0,
            otherSymptoms: [
                {
                    key: 1,
                    label: "Aches and Pains",
                    selected: false
                },
                {
                    key: 2,
                    label: "Sore Throat",
                    selected: false
                },
                {
                    key: 3,
                    label: "Diarrhea",
                    selected: false
                },
                {
                    key: 4,
                    label: "Nausea",
                    selected: false
                },
                {
                    key: 5,
                    label: "Cold",
                    selected: false
                },
                {
                    key: 6,
                    label: "None of the above",
                    selected: false
                }
            ],
            loading: false
        }
        this.ref = firebase.firestore().collection('user')
    }

    componentDidMount() {
        Geolocation.getCurrentPosition(
            position => {
                
                        this.setState({latitude: position.coords.latitude, longitude: position.coords.longitude})
            },
            error => Alert.alert('Error', JSON.stringify(error)),
            { enableHighAccuracy: true, timeout: 20000 },
        );
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

    itemCheck(item) {
        var temp = [...this.state.otherSymptoms];
        console.log("item : ", item)
        if (item.key === 6) {
            temp[5].selected = true;
            for (var i = 0; i < 5; i++) {
                temp[i].selected = false;
            }
        }
        else {
            var index = _.findIndex(this.state.otherSymptoms, { key: item.key })
            temp[index].selected = !temp[index].selected
            temp[5].selected = false
        }
        console.log("temp : ", temp)

        this.setState({ otherSymptoms: temp })
    }


    async addSymptoms() {
        var checkArray = _.find(this.state.otherSymptoms, { selected: true });
        console.log("checkarray : ", checkArray)
        if (checkArray !== undefined) {
            this.setState({ loading: true })
            var emailid = await AsyncStorage.getItem('emailid');
            var temp = [];

            console.log("temp previous : ", temp)
            var tempA = _.find(this.state.otherSymptoms, { label: 'None of the above' });

            var symptomsCount = 0;
            if (tempA.selected === false) {
                for (var i = 0; i < this.state.otherSymptoms.length; i++) {
                    var selectedItem = {};
                    selectedItem[this.state.otherSymptoms[i].label] = this.state.otherSymptoms[i].selected
                    if (this.state.otherSymptoms[i].selected) {
                        symptomsCount = symptomsCount + 1;
                    }
                    if (i !== 5) {
                        temp.push(selectedItem);
                    }

                }
            }
            else {
                for (var i = 0; i < this.state.otherSymptoms.length; i++) {
                    var selectedItem = {};
                    selectedItem[this.state.otherSymptoms[i].label] = this.state.otherSymptoms[i].selected
                    if (i !== 4) {
                        temp.push(selectedItem);
                    }
                }
            }

            var status = '';
            if (symptomsCount < 3) {
                status = "Yellow"
            }
            else {
                status = "Green"
            }

            const addStatus = {
                quarantine_status: "Green",
                symptoms_status_level2: status,
                symptoms_level2: temp,
                location: new firebase.firestore.GeoPoint(this.state.latitude, this.state.longitude),
            }

            await this.ref.doc(emailid).collection('status').doc(this.props.navigation.state.params.document).update(addStatus)
            this.setState({ loading: false }, () => { this.refs.modal1.open() })
        }
        else {
            this.showMessage("Please select the relevant symptoms")
        }
    }


    showMessage(message) {
        Toast.show({
            text: message,
            duration: 2000
        })
    }

    async selectImage() {
        var RNFS = require('react-native-fs');
        
        Alert.alert(
            'Add photo from',
            'below modes',
            [
                {
                    text: 'Gallery',
                    onPress: () => {
                        ImagePicker.openPicker({
                            cropping: false,
                            mediaType: 'photo',
                            compressImageQuality: Platform.OS === 'ios' ? 0.1 : 0.1,
                        }).then(async responsepath => {
                            var base64data = await RNFS.readFile(responsepath.path, 'base64').then();
                            this.setState({base64: base64data},()=>{ this.uploadProfilePhoto() })
                        });
                    },
                },
                {
                    text: 'Camera',
                    onPress: () => {
                        ImagePicker.openCamera({
                            cropping: false,
                            mediaType: 'photo',
                            compressImageQuality: Platform.OS === 'ios' ? 0.1 : 0.1,
                        }).then(async responsepath => {
                            var base64data = await RNFS.readFile(responsepath.path, 'base64').then();
                            console.log("base : ",base64data)
                            this.setState({base64: base64data},()=>{ this.uploadProfilePhoto() })
                        });
                    }
                },
            ],
            { cancelable: true },
        );
    }

    async uploadProfilePhoto(){
        this.setState({ uploadingImage: true})
        var emailid = await AsyncStorage.getItem('emailid');
        const addStatus = {
            profile_url: this.state.base64
        }
        await this.ref.doc(emailid).collection('status').doc(this.props.navigation.state.params.document).update(addStatus)
        await this.ref.doc(emailid).update(addStatus)
        console.log("uploaded")
        this.setState({ uploadingImage: false},()=>{this.props.navigation.navigate('TabManager')})
        
    }



    render() {
        const { navigate } = this.props.navigation;
        return (

            <View>
                <StatusBar barStyle="dark-content" hidden={false} backgroundColor="transparent" translucent={true} />
                <ImageBackground
                    style={[{ backgroundColor: '#F9F9F9', width: "100%", height: "100%" }]}
                    resizeMode='stretch'
                    source={require('../../assets/images/bg.png')}>


                    <View style={[commonStyles.column, commonStyles.margin, { marginTop: hp('5%') }]}>
                        <View style={{ flexDirection: 'row' }}>


                            <Text style={[commonStyles.fontFamilyBold, commonStyles.fontSize(4.5), { color: color.neavyBlue }]}>Symptoms</Text>
                        </View>
                        <Text style={[commonStyles.fontFamilyBold, commonStyles.fontSize(3), { marginTop: hp('2%'), color: color.neavyBlue }]}>Level 2</Text>
                        <Text style={[commonStyles.fontFamilyRegular, commonStyles.fontSize(2.3), { marginTop: hp('0.5%'), color: color.grayColor }]}>If you feel any of the (below) symptoms please check the corresponding box</Text>
                        <ScrollView style={{ marginBottom: hp('9%') }} showsVerticalScrollIndicator={false}>

                            <View style={{ marginTop: hp('5%') }}>
                                <FlatList
                                    data={this.state.otherSymptoms}
                                    renderItem={({ item }) => {
                                        return (
                                            <TouchableOpacity onPress={() => { this.itemCheck(item) }} style={[styles.backgroundBox, { alignItems: 'center', height: hp('7%'), marginTop: hp('1%'), marginBottom: hp('1%'), flexDirection: 'row', }]}>
                                                {
                                                    item.selected ?
                                                        <Image style={styles.checkImage}
                                                            source={require('../../assets/images/check_green.png')} /> :
                                                        <Image style={styles.checkImage}
                                                            source={require('../../assets/images/check_grey.png')} />
                                                }
                                                <View style={{ marginLeft: wp('3%') }}>
                                                    <Text style={[commonStyles.fontFamilyBold, commonStyles.fontSize(2.3), { color: color.neavyBlue, paddingHorizontal: wp('0%') }]}>{item.label}</Text>
                                                </View>
                                            </TouchableOpacity>
                                        )
                                    }}

                                />
                            </View>
                        </ScrollView>
                    </View>

                    <View style={{
                        flex: 1, position: 'absolute',
                        bottom: 0,
                    }}>
                        <TouchableOpacity
                            onPress={async () => {
                                //console.log("internet : ", await this.checkInternet());
                                if (await this.checkInternet()) {
                                    this.addSymptoms();
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
                <Modal style={[styles.modal2, { width: wp('90%'), borderRadius: wp('3%') }]} position={"center"} ref={"modal1"} swipeArea={20}
                    backdropPressToClose={false}  >
                    <View style={[{height: hp('40%'), marginTop: hp('7%'), justifyContent: 'center', alignItems: 'center' }]}>
                        <Image style={styles.camera}
                            source={require('../../assets/images/camera.png')} />
                        <Text style={[commonStyles.fontFamilyBold, commonStyles.fontSize(3), { color: color.neavyBlue, marginTop: hp('2%') }]}>Please upload a</Text>
                        <Text style={[commonStyles.fontFamilyBold, commonStyles.fontSize(3), { color: color.neavyBlue }]}>photo for profile</Text>

                        <View style={{ marginTop: hp('4%'), flex: 1, alignItems: 'center' }}>

                                <TouchableOpacity
                                    onPress={async () => {
                                        //console.log("internet : ", await this.checkInternet());
                                        if (await this.checkInternet()) {
                                            this.selectImage()
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
                                            
                                            width: wp('50%'),
                                            height: hp('7%'),
                                            borderRadius: wp('10%')
                                        }]}>

                                        {
                                            this.state.uploadingImage === true ? (
                                                <View style={{ height: hp('6.5%'), justifyContent: 'center', alignItems: 'center', flexDirection: 'row', flex: 1 }}>
                                                    <View style={{ paddingRight: wp('5%'), backgroundColor: 'transparent' }}>
                                                        <ActivityIndicator size={'small'} color='#FFFFFF' />
                                                    </View>
                                                    <View style={{ backgroundColor: 'transparent' }}>
                                                        <Text style={[commonStyles.fontSize(3), commonStyles.fontFamilyBold, { color: '#FFFFFF' }]}>Uploading...</Text>
                                                    </View>
                                                </View>
                                            ) : (
                                                    <View style={{ height: hp('7%'), justifyContent: 'center', alignSelf: 'center' }}>
                                                        <Text style={[commonStyles.fontSize(3), commonStyles.fontFamilyBold, { color: '#ffffff' }]}>Proceed</Text>
                                                    </View>
                                                )
                                        }
                                    </LinearGradient>
                                </TouchableOpacity>

                            </View>
                    </View>
                </Modal>
            </View>

        );
    }
}

const styles = StyleSheet.create({

    backgroundBox: {

        marginBottom: hp('2%'),
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

    checkImage: {
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
});