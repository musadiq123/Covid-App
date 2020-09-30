import React from "react";
import { StyleSheet, View, ImageBackground, StatusBar, Text, TouchableOpacity, Image, TextInput, FlatList, ActivityIndicator } from 'react-native';
import commonStyles from '../styles/Common';
import color from '../styles/StyleConstants';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import { withNavigation, StackActions, NavigationActions } from 'react-navigation';
import { connect } from "react-redux";
import { Toast } from 'native-base';
import firebase from 'react-native-firebase';
import AsyncStorage from '@react-native-community/async-storage';
import commonStrings from '../styles/CommonStrings';
const { State: TextInputState } = TextInput;
import NetInfo from "@react-native-community/netinfo";
class HistoryListScreen extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            travelHistory: [],
            loading: false
        }
        this.ref = firebase.firestore().collection('user')
    }

    showMessage(message) {
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
        var emailid = await AsyncStorage.getItem('emailid');
        const doc = await this.ref.doc(emailid).get()
        this.setState({ travelHistory: [], name: doc.data().name })
        var tempArray = [];
        await this.ref.doc(emailid).collection('travel_history').orderBy("journeydate", "DESC").get()
            .then(response => {
                response.forEach(document => {
                    tempArray.push({ fromCity: document.data().fromCity, toCity: document.data().toCity, journeydate: moment(document.data().journeydate).format("MMM DD, YYYY") })
                    this.setState({ travelHistory: tempArray })
                });
            })
            .catch(error => {
                alert(error)
            });

            console.log("history : ",tempArray)
        this.setState({ loading: false })
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


    render() {
        const { navigate } = this.props.navigation;
        if (this.state.loading) {
            return (
                <View style={[commonStyles.column, { flex: 1, }]}>
                    <Text style={[commonStyles.margin, commonStyles.fontFamilyBold, commonStyles.fontSize(5), { marginTop: hp('3%'), color: color.neavyBlue }]}>Travel History</Text>
                    <View style={{ marginTop: hp('10%') }}>
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

                    <Text style={[commonStyles.fontFamilyBold, commonStyles.fontSize(5), { color: color.neavyBlue }]}>Travel History</Text>


                    {
                        this.state.travelHistory.length > 0 ?
                            <FlatList
                            showsVerticalScrollIndicator={false}
                                data={this.state.travelHistory}
                                renderItem={({ item }) => {

                                    return (
                                        <View style={[styles.backgroundBoxHistory, { marginTop: hp('1%'), marginBottom: hp('1%'), flexDirection: 'row', }]}>
                                            <View style={{ flexDirection: 'column', width: wp('28%') }}>
                                                <Text style={[commonStyles.fontFamilyRegular, commonStyles.fontSize(2), { height: hp('3%'), color: color.grayColor }]}>From</Text>
                                                <Text style={[commonStyles.fontFamilyExtraBold, commonStyles.fontSize(3), { color: color.neavyBlue }]} numberOfLines={1}>{item.fromCity}</Text>
                                            </View>
                                            <View style={{ flexDirection: 'column', justifyContent: 'center', alignItems: 'center', width: wp('28%') }}>
                                                <View style={{ flexDirection: 'row' }}>
                                                    <View style={{ width: wp('10%'), justifyContent: 'center' }}>
                                                        <View style={[styles.line]} />
                                                    </View>
                                                    <View>
                                                        <Image style={styles.greenLocationIcons}
                                                            source={require('../../assets/images/location_green.png')} />
                                                    </View>
                                                    <View style={{ width: wp('10%'), justifyContent: 'center' }}>
                                                        <View style={[styles.line]} />
                                                    </View>
                                                </View>
                                                <Text style={[commonStyles.fontFamilyRegular, commonStyles.fontSize(1.2), { height: hp('3%'), color: color.grayColor }]}>{item.journeydate}</Text>
                                            </View>
                                            <View style={{ flexDirection: 'column', width: wp('28%') }}>
                                                <Text style={[commonStyles.fontFamilyRegular, commonStyles.fontSize(2), { height: hp('3%'), color: color.grayColor }]}>To</Text>
                                                <Text style={[commonStyles.fontFamilyExtraBold, commonStyles.fontSize(3), { color: color.neavyBlue }]} numberOfLines={1}>{item.toCity}</Text>
                                            </View>
                                        </View>
                                    )
                                }}

                            /> : <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
                                <Image style={styles.noHistoryIcons}
                                    source={require('../../assets/images/no-travel-history.png')} />
                                <Text style={[commonStyles.fontFamilyBold, commonStyles.fontSize(2.7), { marginTop: hp('2%'), color: color.neavyBlue }]}>No travel history.</Text>
                                <Text style={[commonStyles.fontFamilyBold, commonStyles.fontSize(2.7), { color: color.neavyBlue }]}>Please add your travel history.</Text>

                            </View>
                    }

                    <View style={{ position: 'absolute', bottom: 0, flex: 1, alignSelf: 'flex-end' }}>
                        <TouchableOpacity onPress={() => { navigate('AddTravelHistoryScreen') }}>
                            <View style={{ alignItems: 'flex-end' }}>
                                <Image style={styles.addButton}
                                    source={require('../../assets/images/add_button.png')} />
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>

            );
        }

    }
}

const styles = StyleSheet.create({

    line: {
        borderBottomColor: '#828EA5',
        borderBottomWidth: 0.5,
    },
    backgroundBoxHistory: {
        alignSelf: 'center',
        width: wp('88%'),
        height: hp('11%'),
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
    greenLocationIcons: {
        width: wp('4%'),
        height: hp('4%'),
        resizeMode: 'contain'
    },
    icons: {
        width: wp('3%'),
        height: hp('2.5%'),
        resizeMode: 'contain'
    },
    addButton: {
        marginRight: wp('-3%'),
        width: wp('20%'),
        height: hp('15%'),
        resizeMode: 'contain'
    },
    noHistoryIcons: {
        width: wp('20%'),
        height: hp('10%'),
        resizeMode: 'contain',
    },
});

const mapStateToProps = state => ({
    data: state.user.data
});

export default connect(
    mapStateToProps,
    null
)(withNavigation(HistoryListScreen));