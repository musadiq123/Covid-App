import React from "react";
import { StyleSheet, View, Image, Platform, BackHandler } from 'react-native';
import commonStyles from '../styles/Common';
import LinearGradient from 'react-native-linear-gradient';
import { widthPercentageToDP, heightPercentageToDP } from "react-native-responsive-screen";
import styleConstants from '../styles/StyleConstants';
import { checkMultiple, request, PERMISSIONS } from 'react-native-permissions';
import AsyncStorage from '@react-native-community/async-storage';
export default class SplashScreen extends React.Component {


    async componentDidMount() {


        if (Platform.OS === 'ios') {
            request(PERMISSIONS.IOS.LOCATION_ALWAYS).then((result) => {
                console.log("result : ", result)
                if (result === "denied") {
                    BackHandler.exitApp();
                }
                else {
                    console.disableYellowBox = true;
                    // Start counting when the page is loaded
                    this.timeoutHandle = setTimeout(() => {
                        // Add your logic for the transition
                        this.props.navigation.replace('InitialScreen')
                    }, 3000);
                }
            });
        }
        else {
            request(PERMISSIONS.ANDROID.ACCESS_FINE_LOCATION).then(async (result) => {
                console.log("result : ", result)
                const myArray = await AsyncStorage.getItem('locations');
                var temp = JSON.parse(myArray)
                if(temp === null)
                {
                    var temp = [];
                    await AsyncStorage.setItem('locations', JSON.stringify(temp));
                }

                if (result === "denied") {
                    BackHandler.exitApp();
                }
                else {
                    request(PERMISSIONS.ANDROID.ACCESS_COARSE_LOCATION).then((result) => {
                        console.log("result : ", result)
                        if (result === "denied") {
                            BackHandler.exitApp();
                        }
                        else {
                            request(PERMISSIONS.ANDROID.ACCESS_BACKGROUND_LOCATION).then((result) => {
                                console.log("result : ", result)
                                if (result === "denied") {
                                    BackHandler.exitApp();
                                }
                                else {
                                    console.disableYellowBox = true;
                                    // Start counting when the page is loaded
                                    this.timeoutHandle = setTimeout(() => {
                                        // Add your logic for the transition
                                        this.props.navigation.replace('InitialScreen')
                                    }, 3000);
                                }
                            });
                        }
                    });
                }
            });
        }



    }

    componentWillUnmount() {
        clearTimeout(this.timeoutHandle); // This is just necessary in the case that the screen is closed before the timeout fires, otherwise it would cause a memory leak that would trigger the transition regardless, breaking the user experience.
    }

    render() {
        return (
            <View style={[commonStyles.container, commonStyles.margin]}>

                <Image style={styles.logo_container}
                    source={require('../../assets/images/logo.png')} />

            </View>
        );
    }
}

const styles = StyleSheet.create({

    logo_container: {
        width: widthPercentageToDP('75%'),
        height: heightPercentageToDP('40%'),
        resizeMode: 'contain'
    },
});