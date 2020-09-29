import React, { Fragment, useEffect } from "react";
import { View, Image, Text, TouchableOpacity, RefreshControl, StyleSheet, StatusBar, Alert} from 'react-native';
import styles from '../styles/Common';
import styleConstants from '../styles/StyleConstants';
import StatusScreen from '../dashboard/StatusScreen';
import GroupListScreen from '../dashboard/GroupListScreen';
import HistoryListScreen from '../dashboard/HistoryListScreen';
import { Toast } from "native-base";
import ProfileScreen from "../dashboard/ProfileScreen";
import { heightPercentageToDP, widthPercentageToDP } from "react-native-responsive-screen";
const iconStatus = require('../../assets/images/status.png');
const iconStatusSelected = require('../../assets/images/status_selected.png');
const iconGroup = require('../../assets/images/group.png');
const iconGroupSelected = require('../../assets/images/group_selected.png');
const iconHistory = require('../../assets/images/History.png');
const iconHistorySelected = require('../../assets/images/History_selected.png');
const iconProfile = require('../../assets/images/profile.png');
const iconProfileSelected = require('../../assets/images/profile_selected.png');
import { connect } from "react-redux";
import { withNavigation, StackActions, NavigationActions } from 'react-navigation';
import firebase from 'react-native-firebase'

import AsyncStorage from '@react-native-community/async-storage';
import Geolocation from '@react-native-community/geolocation';
import { getDistance } from 'geolib';
import * as geolib from 'geolib';


class TabManager extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            selectedIndex: 0,
            expanded: true,
            userData: ''
        }
        this.ref = firebase.firestore().collection('user')
    }

   


    async componentDidMount() {

        // BackgroundFetch.configure({
        //     minimumFetchInterval: 15,     // <-- minutes (15 is minimum allowed)
        //     // Android options
        //     forceAlarmManager: true,     // <-- Set true to bypass JobScheduler.
        //     stopOnTerminate: false,
        //     startOnBoot: true,
        //     enableHeadless: true
        // }, async () => {
        //     console.log("demo : ", "fetching")

        //     const myArray = await AsyncStorage.getItem('locations');

        //     var storeData = [...JSON.parse(myArray)];
        //     var emailid = await AsyncStorage.getItem('emailid');
        //     const userDoc = await this.ref.doc(emailid).get()
        //     this.setState({ userData: userDoc.data() })
        //     Geolocation.getCurrentPosition(
        //         async position => {


        //             var temp = {};
        //             var km = "";
        //             var distance = getDistance(
        //                 { latitude: this.state.userData.current_location_coordinates._latitude, longitude: this.state.userData.current_location_coordinates._longitude },
        //                 { latitude: position.coords.latitude, longitude: position.coords.longitude }
        //             );
        //             km = geolib.convertDistance(distance, 'km').toFixed(1);

        //             var locationStatus = '';
        //             if (km <= 0.3) {
        //                 locationStatus = "Green";
        //             }
        //             else if (km > 0.3 && km < 3.0) {
        //                 locationStatus = "Yellow";
        //             }
        //             else if (km >= 3.0) {
        //                 locationStatus = "Red";
        //             }

        //             temp['latitude'] = position.coords.latitude;
        //             temp['longitude'] = position.coords.longitude;
        //             temp['quarantine_status'] = locationStatus;
        //             temp['datetime'] = moment().format("MMM DD, YYYY HH:mm:ss");

        //             console.log("temp : ", temp)
        //             storeData.push(temp);

        //             await AsyncStorage.setItem('locations', JSON.stringify(storeData));
        //         },
        //         error => Alert.alert('Error', JSON.stringify(error)),
        //         { enableHighAccuracy: true, timeout: 20000 },
        //     );

        // }, (error) => {
        //     console.log('Received error event! ', error);
        // });

        // BackgroundFetch.status((status) => {
        //     switch (status) {
        //         case BackgroundFetch.STATUS_RESTRICTED:
        //             console.log("BackgroundFetch restricted");
        //             break;
        //         case BackgroundFetch.STATUS_DENIED:
        //             console.log("BackgroundFetch denied");
        //             break;
        //         case BackgroundFetch.STATUS_AVAILABLE:
        //             console.log("BackgroundFetch is enabled");
        //             break;
        //     }
        // });
    }

    showMessage(message) {
        Toast.show({
            text: message,
            duration: 2000
        })
    }

    icons = [
        {
            label: 'Status',
            normal: iconStatus,
            selected: iconStatusSelected
        },
        {
            label: 'Group',
            normal: iconGroup,
            selected: iconGroupSelected
        },
        {
            label: 'Travel History',
            normal: iconHistory,
            selected: iconHistorySelected
        },
        {
            label: 'Profile',
            normal: iconProfile,
            selected: iconProfileSelected
        }
    ]


    getSelectedScreen() {
        if (this.state.selectedIndex === 0) {
            return <StatusScreen
                onAssignToMe={() => {
                    this.setState({ selectedIndex: 1 })
                }} />;
        }
        else if (this.state.selectedIndex === 1) {
            return <GroupListScreen />;
        }
        else if (this.state.selectedIndex === 2) {
            return <HistoryListScreen />;
        }
        else if (this.state.selectedIndex === 3) {
            return <ProfileScreen />;
        }
    }

    render() {
        console.log('index:', this.state.selectedIndex)
        return (
            <View style={[styles.full, styles.backgroundColor]}>
                <StatusBar barStyle="dark-content" hidden={false} backgroundColor="transparent" translucent={true} />
                <View style={{ flex: 1 }}>
                    <View style={[styles.full]}>
                        {this.getSelectedScreen()}
                    </View>
                </View>

                <View style={[styles.rh(10), styles.row, styles.center, { backgroundColor: 'white', borderRadius: widthPercentageToDP('3%') }]}>
                    {
                        this.icons.map((item, index) => {
                            return (
                                <TouchableOpacity
                                    onPress={async () => {

                                        this.setState({
                                            selectedIndex: index
                                        })
                                    }}
                                    style={[styles.full, styles.column, styles.center]}>
                                    <Image
                                        style={{ height: heightPercentageToDP('5%'), width: widthPercentageToDP('5%') }}
                                        resizeMode='contain'
                                        source={this.state.selectedIndex === index ? this.icons[index].selected : this.icons[index].normal}
                                    />
                                    <Text
                                        style={[
                                            styles.fontFamilyBold,
                                            styles.fontSize(1.5),
                                            {
                                                color: this.state.selectedIndex === index ? styleConstants.neavyBlue : styleConstants.inactiveColor
                                            }
                                        ]}>
                                        {this.icons[index].label}
                                    </Text>
                                </TouchableOpacity>
                            )
                        })
                    }
                </View>

            </View>

        )
    }
}

const mapStateToProps = state => ({
    data: state.user.data
});

const style = StyleSheet.create({


})

export default connect(
    mapStateToProps,
    null
)(withNavigation(TabManager));
