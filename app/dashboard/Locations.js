import React from "react";
import { StyleSheet, View, ImageBackground, StatusBar, Text, TouchableOpacity, Image, TextInput, FlatList } from 'react-native';
import commonStyles from '../styles/Common';
import color from '../styles/StyleConstants';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import { withNavigation, StackActions, NavigationActions } from 'react-navigation';
import { connect } from "react-redux";
import commonStrings from '../styles/CommonStrings';
import AsyncStorage from '@react-native-community/async-storage';

class Locations extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            locations: '',
        }
    }

    async UNSAFE_componentWillMount() {
        const myArray = await AsyncStorage.getItem('locations');
        var temp = JSON.parse(myArray)
        this.setState({ locations: temp },()=>{console.log(" In Location : ",JSON.parse(myArray))})
    }

    render() {
        const { navigate } = this.props.navigation;
        return (
            <View style={[commonStyles.margin, commonStyles.column, { flex: 1, marginTop: hp('5%') }]}>
                {
                    this.state.locations ?
                        <FlatList
                            data={this.state.locations}
                            renderItem={({ item }) => {

                                return (
                                    <View style={[styles.backgroundBoxHistory, { marginTop: hp('1%'), marginBottom: hp('1%'), flexDirection: 'column', }]}>
                                        <Text style={{marginTop: hp('5%')}}>{item.latitude}</Text>
                                        <Text>{item.longitude}</Text>
                                        <Text>{item.quarantine_status}</Text>
                                        <Text>{item.datetime}</Text>
                                    </View>
                                )
                            }}

                        /> : <View style={{ marginTop: hp('2%') }}>
                            <Text style={[commonStyles.fontFamilyRegular, commonStyles.fontSize(2), { height: hp('3%'), color: color.grayColor }]}>No Locations</Text>
                        </View>
                }
            </View>

        );
    }
}

const styles = StyleSheet.create({

});

const mapStateToProps = state => ({
    data: state.user.data
});

export default connect(
    mapStateToProps,
    null
)(withNavigation(Locations));