import React from "react";
import { StyleSheet, View, ImageBackground, StatusBar, Text, TouchableOpacity, Image, ActivityIndicator, Keyboard, Alert } from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import commonStyles from '../styles/Common';
import color from '../styles/StyleConstants';
import LinearGradient from 'react-native-linear-gradient';
import { ScrollView, FlatList } from "react-native-gesture-handler";
import { Toast } from 'native-base';
import NetInfo from "@react-native-community/netinfo";
import firebase from 'react-native-firebase';
import AsyncStorage from '@react-native-community/async-storage';
import Geolocation from '@react-native-community/geolocation';
export default class SymptomsNorCatScreen extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            latitude: 0,
            longitude: 0,
            symptoms: [
                {
                    key: 1,
                    label: "Fever",
                    selected: false
                },
                {
                    key: 2,
                    label: "Tiredness/Weakness",
                    selected: false
                },
                {
                    key: 3,
                    label: "Dry Cough",
                    selected: false
                },
                {
                    key: 4,
                    label: "Difficulty in Breathing",
                    selected: false
                },
                {
                    key: 5,
                    label: "None of the above",
                    selected: false
                }
            ],
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
            ],
            loading: false
        }
        this.ref = firebase.firestore().collection('user')
    }

    componentDidMount() {
        Geolocation.getCurrentPosition(
            position => {


                this.setState({ latitude: position.coords.latitude, longitude: position.coords.longitude})

            },
            error => Alert.alert('Error', JSON.stringify(error)),
            { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 },
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
        var temp = [...this.state.symptoms];
        console.log("item : ", item)
        if (item.key === 5) {
            temp[4].selected = true;
            for (var i = 0; i < 4; i++) {
                temp[i].selected = false;
            }
        }
        else {
            var index = _.findIndex(this.state.symptoms, { key: item.key })
            temp[index].selected = !temp[index].selected
            temp[4].selected = false
        }
        console.log("temp : ", temp)

        this.setState({ symptoms: temp })
    }

    async addSymptoms() {
        var checkArray = _.find(this.state.symptoms, { selected: true });
        console.log("checkarray : ", checkArray)
        if (checkArray !== undefined) {
            this.setState({ loading: true })
            var emailid = await AsyncStorage.getItem('emailid');
            var temp = [];
            var tempA = _.find(this.state.symptoms, { label: 'None of the above' });

            var symptomsCount = 0;
            if (tempA.selected === false) {
                for (var i = 0; i < this.state.symptoms.length; i++) {
                    var selectedItem = {};
                    selectedItem[this.state.symptoms[i].label] = this.state.symptoms[i].selected
                    if (this.state.symptoms[i].selected) {
                        symptomsCount = symptomsCount + 1;
                    }
                    if (i !== 4) {
                        temp.push(selectedItem);
                    }

                }
            }
            else {
                for (var i = 0; i < this.state.symptoms.length; i++) {
                    var selectedItem = {};
                    selectedItem[this.state.symptoms[i].label] = this.state.symptoms[i].selected
                    if (i !== 4) {
                        temp.push(selectedItem);
                    }
                }
            }

            var status = '';
            if (symptomsCount === 1) {
                status = "Yellow"
            }
            else if (symptomsCount >= 2) {
                status = "Red"
            }
            else if (symptomsCount === 0) {
                status = "Green"
            }

            var otherArray = [];
            for (var i = 0; i < this.state.otherSymptoms.length; i++) {
                var selectedItem = {};
                selectedItem[this.state.otherSymptoms[i].label] = this.state.otherSymptoms[i].selected
                temp.push(selectedItem);
            }


            const addStatus = {
                datetime: moment().valueOf(),
                location: new firebase.firestore.GeoPoint(this.state.latitude, this.state.longitude),
                symptoms_status_level1: status,
                symptoms_status_level2: 'Green',
                quarantine_status: '',
                symptoms_level1: temp,
                symptoms_level2: otherArray
            }

            var datetime = moment(new Date()).format("MMDDYYYYHHmmss")
            await this.ref.doc(emailid).collection('status').doc(datetime).set(addStatus)
            this.setState({ loading: false }, () => { this.props.navigation.navigate('SymptomsAdvCatScreen', { document: datetime }) })
        }
        else {
            this.showMessage("Please select the relevant symptoms")
        }
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

                    <ScrollView style={{ marginBottom: hp('9%'), marginTop: hp('5%') }} showsVerticalScrollIndicator={false}>
                        <View style={[commonStyles.column, commonStyles.margin]}>
                            <View style={{ flexDirection: 'row' }}>
                                <TouchableOpacity style={{ paddingLeft: wp('1%'), paddingRight: wp('2%') }} onPress={() => { this.props.navigation.goBack() }}>
                                    <Image style={[commonStyles.backIcons, { justifyContent: 'center' }]}
                                        source={require('../../assets/images/back-button.png')} />
                                </TouchableOpacity>

                                <Text style={[commonStyles.fontFamilyBold, commonStyles.fontSize(4.5), { marginLeft: wp('3%'), color: color.neavyBlue }]}>Symptoms</Text>
                            </View>
                            <Text style={[commonStyles.fontFamilyBold, commonStyles.fontSize(3), { marginTop: hp('2%'), color: color.neavyBlue }]}>Level 1</Text>
                            <Text style={[commonStyles.fontFamilyRegular, commonStyles.fontSize(2.3), { marginTop: hp('0.5%'), color: color.grayColor }]}>If you feel any of the (below) symptoms please check the corresponding box</Text>

                            <View style={{ marginTop: hp('5%') }}>
                                <FlatList
                                    data={this.state.symptoms}
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


                        </View>
                    </ScrollView>
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

    icons: {
        width: wp('3%'),
        height: hp('2.5%'),
        resizeMode: 'contain'
    },

    checkImage: {
        width: wp('5%'),
        height: hp('5%'),
        resizeMode: 'contain'
    },
});