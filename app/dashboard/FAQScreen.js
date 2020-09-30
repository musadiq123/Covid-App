import React from "react";
import { StyleSheet, View, ImageBackground, StatusBar, Text, TouchableOpacity, Image, TextInput, ActivityIndicator } from 'react-native';
import commonStyles from '../styles/Common';
import color from '../styles/StyleConstants';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import { withNavigation, StackActions, NavigationActions } from 'react-navigation';
import { connect } from "react-redux";
import commonStrings from '../styles/CommonStrings';

class FAQScreen extends React.Component {

    

    render() {
        const { navigate } = this.props.navigation;
        return (
            <View style={[commonStyles.margin, commonStyles.column, { flex: 1, marginTop: hp('5%') }]}>

                <View style={{ flexDirection: 'row' }}>
                    <TouchableOpacity style={{ paddingLeft: wp('1%'), paddingRight: wp('2%') }} onPress={() => { this.props.navigation.goBack() }}>
                        <Image style={[commonStyles.backIcons, { justifyContent: 'center' }]}
                            source={require('../../assets/images/back-button.png')} />
                    </TouchableOpacity>

                    <Text style={[commonStyles.fontFamilyBold, commonStyles.fontSize(4.5), { marginLeft: wp('3%'), color: color.neavyBlue }]}>FAQ</Text>
                </View>
                <Text style={[commonStyles.fontFamilyRegular, commonStyles.fontSize(2), { marginTop: wp('5%'), color: color.neavyBlue }]}>{commonStrings.sample_text}</Text>
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
)(withNavigation(FAQScreen));