import React from "react";
import { StyleSheet, View, ImageBackground, StatusBar, Text, TouchableOpacity, Image, TextInput, FlatList } from 'react-native';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import commonStyles from '../styles/Common';
import color from '../styles/StyleConstants';
import LinearGradient from 'react-native-linear-gradient';
import Modal from 'react-native-modalbox';
import commonStrings from '../styles/CommonStrings';
import NetInfo from "@react-native-community/netinfo";
import firebase from 'react-native-firebase';
import { Toast } from 'native-base';

export default class VerificationScreen extends React.Component {

    state = {
        loading: false,
        selectedValue: "Select",
        dataList: [
            {
                value: 'Aadhar Card'
            },
            {
                value: 'PAN'
            },
            {
                value: 'Passport'
            },
            {
                value: 'Driving License'
            }
        ]
    };

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

    setValue(value) {
        this.setState({ selectedValue: value })
        this.refs.modal1.close()
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

                    <View style={[commonStyles.column, commonStyles.margin]}>
                        <View style={{ marginTop: hp('5%'), flexDirection: 'row' }}>
                            <TouchableOpacity style={{ paddingLeft: wp('1%'), paddingRight: wp('2%') }} onPress={() => { this.props.navigation.goBack() }}>
                                <Image style={[commonStyles.backIcons, { justifyContent: 'center' }]}
                                    source={require('../../assets/images/back-button.png')} />
                            </TouchableOpacity>

                            <View style={{ flexDirection: 'row', flex: 1 }}>
                                <Text style={[commonStyles.fontFamilyBold, commonStyles.fontSize(4.5), { flex: 1, marginLeft: wp('3%'), color: color.neavyBlue }]}>{commonStrings.verification_header}</Text>
                                <TouchableOpacity style={{justifyContent: 'center'}} onPress={()=>{ navigate('TravelHistoryScreen') }}>
                                     <View style={{ alignItems: 'flex-end' }}>
                                        <Text style={[commonStyles.fontFamilyBold, commonStyles.fontSize(2.5), { color: color.orange }]}>{commonStrings.skip}</Text>
                                    </View>
                                </TouchableOpacity>
                            </View>

                        </View>

                        <Text style={[commonStyles.fontFamilyRegular, commonStyles.fontSize(2.3), { color: color.grayColor }]}>{commonStrings.verification_description}</Text>

                        <View style={[styles.backgroundBox, { marginTop: hp('8.5%'), }]}>
                            <View style={{ flex: 1, flexDirection: 'row' }}>
                                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'flex-start' }}>
                                    <Text style={[commonStyles.fontFamilyRegular, commonStyles.fontSize(2), { height: hp('3%'), color: color.grayColor }]}>{commonStrings.verification_select_document}</Text>
                                </View>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <Image style={styles.icons}
                                        source={require('../../assets/images/document.png')} />
                                </View>
                            </View>
                            <View style={{ flex: 1, }}>
                                <View style={{ flex: 1, flexDirection: 'row' }}>

                                    <TouchableOpacity onPress={() => { this.refs.modal1.open() }} style={{ flex: 1 }}>
                                        <View >
                                            <Text style={[commonStyles.fontFamilyBold, commonStyles.fontSize(2.3), { color: color.neavyBlue, marginTop: hp('0.2%'), height: hp('6%') }]}>{this.state.selectedValue}</Text>
                                        </View>
                                    </TouchableOpacity>

                                    <View style={{ height: hp('4%'), alignItems: 'flex-end', justifyContent: 'center' }}>
                                        <Image style={styles.icons}
                                            source={require('../../assets/images/menu.png')} />
                                    </View>
                                </View>
                            </View>
                        </View>

                        <View style={[styles.backgroundBox, { marginTop: hp('2%'), }]}>
                            <View style={{ flex: 1, flexDirection: 'row' }}>
                                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'flex-start' }}>
                                    <Text style={[commonStyles.fontFamilyRegular, commonStyles.fontSize(2), { height: hp('3%'), color: color.grayColor }]}>Document Number</Text>
                                </View>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <Image style={styles.icons}
                                        source={require('../../assets/images/document.png')} />
                                </View>
                            </View>
                            <View style={{ flex: 1, }}>
                                <TextInput
                                    style={[commonStyles.fontFamilyBold, commonStyles.fontSize(2.3), { color: color.neavyBlue, paddingHorizontal: wp('0%'), marginBottom: hp('-1%'), height: hp('6%'), marginTop: hp('-1%') }]}
                                    placeholder={'Enter document number'}
                                    placeholderTextColor={color.neavyBlue}
                                />
                            </View>
                        </View>

                        <View style={[styles.backgroundBoxPhoto, { marginTop: hp('2%'), justifyContent: 'center', alignItems: 'center' }]}>
                            <Text style={[commonStyles.fontFamilyBold, commonStyles.fontSize(2.3), { color: color.neavyBlue, marginTop: hp('0.2%'), height: hp('6%') }]}>Capture a photo of document</Text>
                            <Image style={styles.camera}
                                source={require('../../assets/images/camera.png')} />
                        </View>

                    </View>

                    <View style={{ flex: 1 }}>
                        <LinearGradient
                            colors={[color.gradientStartColor, color.gradientEndColor]}
                            // style={styles.linearGradient}
                            start={{ x: 0.0, y: 0.25 }} end={{ x: 1.2, y: 1.0 }}
                            style={[styles.center, {
                                marginTop: hp('1%'),
                                width: wp('100.1%'),
                                height: hp('8%'),
                                position: 'absolute',
                                bottom: 0,
                                borderTopLeftRadius: wp('2.5%'),
                                borderTopRightRadius: wp('2.5%'),
                            }]}>
                            <TouchableOpacity onPress={() => { navigate('TravelHistoryScreen') }}>
                                <View style={{ height: hp('8%'), justifyContent: 'center', alignSelf: 'center' }}>
                                    <Text style={[commonStyles.fontSize(3), commonStyles.fontFamilyBold, { color: '#ffffff' }]}>Next</Text>
                                </View>
                            </TouchableOpacity>
                        </LinearGradient>
                    </View>
                </ImageBackground>

                <Modal style={[styles.modal, styles.modal2, { width: wp('90%'), borderRadius: wp('3%') }]} position={"center"} ref={"modal1"}
                    backdropPressToClose={false}>
                    <FlatList
                        data={this.state.dataList}
                        renderItem={({ item }) => {

                            return (
                                <View style={{ backgroundColor: 'white' }}>
                                    <TouchableOpacity
                                        onPress={() => this.setValue(item.value)}>
                                        <Text style={[commonStyles.fontFamilyBold, commonStyles.fontSize(2.3), { color: color.neavyBlue, marginTop: hp('0.2%'), height: hp('6%') }]}>{item.value}</Text>
                                    </TouchableOpacity>
                                    <View style={commonStyles.line} />
                                </View>
                            )
                        }}

                    />
                </Modal>
            </View>

        );
    }
}

const styles = StyleSheet.create({

    backgroundBox: {
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
    backgroundBoxPhoto: {
        height: hp('15%'),
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

    camera: {
        marginTop: hp('-1.5'),
        width: wp('12%'),
        height: hp('3.5%'),
        resizeMode: 'contain'
    },

    signInButton: {
        marginRight: wp('-6%'),
        width: wp('20%'),
        height: hp('20%'),
        resizeMode: 'contain'
    },
    modal: {
        padding: wp('5%')
    },
    modal2: {
        maxHeight: hp('35%'),
        minHeight: hp('10%')
    },
});