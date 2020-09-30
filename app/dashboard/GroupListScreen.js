import React from "react";
import { Animated, StyleSheet, View, Keyboard, Text, TouchableOpacity, Image, TextInput, FlatList, ActivityIndicator } from 'react-native';
import commonStyles from '../styles/Common';
import color from '../styles/StyleConstants';
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import { withNavigation, StackActions, NavigationActions } from 'react-navigation';
import { connect } from "react-redux";
import Modal from 'react-native-modalbox';
import LinearGradient from 'react-native-linear-gradient';
import NetInfo from "@react-native-community/netinfo";
import { Toast } from 'native-base';
import firebase from 'react-native-firebase'
import AsyncStorage from '@react-native-community/async-storage';

class CustomItem extends React.Component {

    constructor(props) {
        super(props);

        this.state = {
            scaleValue: new Animated.Value(0)
        }
    }

    componentDidMount() {
        Animated.timing(this.state.scaleValue, {
            toValue: 1,
            duration: 500,
            delay: this.props.index * 350
        }).start();
    }

    render() {
        return (
            <Animated.View style={{ opacity: this.state.scaleValue }}>
                {this.props.children}
            </Animated.View>
        );
    }
}

class GroupListScreen extends React.Component {

    constructor(props) {
        super(props);
        this.state = {
            groupcode: "",
            groupList: [],
            showModal: true,
            groupCodeCreate: '',
            grouptextcode: '',
            groupname: '',
            groupshare: true,
            loading: false,
            pageLoading: false,
            scaleValue: new Animated.Value(0)
        }
        this.ref = firebase.firestore().collection('group')
        this.user = firebase.firestore().collection('user')
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


    triggerOpenModal() {
        if (this.state.showModal) {
            this.setState({ showModal: false })
        }
        else {
            this.setState({ showModal: true })
        }
        return this.state.showModal;
    }

    async joingroup() {
        var emailid = await AsyncStorage.getItem('emailid');
        if (this.state.groupcode === "" || this.state.groupcode.length !== 7) {
            this.showMessage("Enter 7 digit group code")
            this.setState({ groupcode: '' })
        }
        else {
            this.setState({ loading: true })

            //check group code exist or not
            const doc = await this.ref.doc(this.state.groupcode).get()
            if (doc.exists) {

                //if exist group code
                const userDoc = await this.user.doc(emailid).get()
                var temp = [...userDoc.data().groups];

                // check user already joined or not
                if (!_.find(temp, { group_code: this.state.groupcode })) {
                    temp.push(this.state.groupcode)
                    const updateUserData = { groups: temp }
                    await this.user.doc(emailid).update(updateUserData)
                    
                    var groupUserArray = [...doc.data().users]
                  
                    groupUserArray.push(emailid)
                    const updateGroupData = { users: groupUserArray }
                    await this.ref.doc(this.state.groupcode).update(updateGroupData)

                    this.refs.modalJoin.close()
                    this.setState({ groupList: [], loading: false })

                    this.UNSAFE_componentWillMount()
                }
                else {
                    this.showMessage("You already there in group.")
                    this.setState({ loading: false })
                }
            }
            else {
                this.showMessage("Please provide correct Group Code")
                this.setState({ loading: false })
            }
        }

    }

    async UNSAFE_componentWillMount() {
        this.setState({ pageLoading: true })
        var emailid = await AsyncStorage.getItem('emailid');
        var temp = [];
        const userDoc = await this.user.doc(emailid).get()
        var temp = [...userDoc.data().groups];

        if (temp.length > 0) {
            for (var i = 0; i < temp.length; i++) {
                var item = temp[i];

                const groupData = await this.ref.doc(item).get()

                var tempArray = [...this.state.groupList]
                tempArray.push(groupData.data())
                this.setState({ groupList: tempArray })
            }
        }
        this.setState({ pageLoading: false })
    }

    async creategroup() {
        var emailid = await AsyncStorage.getItem('emailid');
        if (this.state.groupname === "") {
            this.showMessage("Please provide the Group Name");
        }
        else {
            this.setState({ loading: true })
            var insertGroup = {
                group_name: this.state.groupname,
                group_code: this.state.groupCodeCreate,
                created_at: moment(new Date()).format("MMM DD, YYYY HH:mm"),
                updated_at: moment(new Date()).format("MMM DD, YYYY HH:mm"),
                users: [],
                admin: [emailid]
            };
            const userDoc = await this.user.doc(emailid).get()
            var temp = [...userDoc.data().groups];
            temp.push(this.state.groupCodeCreate)

            const updateData = { groups: temp }

            await this.ref.doc(this.state.groupCodeCreate).set(insertGroup)
            await this.user.doc(emailid).update(updateData)
            this.setState({ groupList: [],loading: false }, () => { this.UNSAFE_componentWillMount(), this.refs.modalCreate.close() })
        }
    }

    async makeGroupCode(length) {
        var result = '';
        var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        var charactersLength = characters.length;
        for (var i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
        }
        const doc = await this.ref.doc(result).get()
        if (doc.exists) {
            this.makeGroupCode(7)
        }
        else {
            this.setState({ groupCodeCreate: result });
        }
    }

    render() {
        const { navigate } = this.props.navigation;
        if (this.state.pageLoading) {
            return (
                <View style={[commonStyles.column, { flex: 1, }]}>
                    <Text style={[commonStyles.margin, commonStyles.fontFamilyBold, commonStyles.fontSize(5), { marginTop: hp('3%'), color: color.neavyBlue }]}>Group</Text>
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
                <View style={[commonStyles.column, { flex: 1, }]}>

                    <Text style={[commonStyles.margin, commonStyles.fontFamilyBold, commonStyles.fontSize(5), { marginTop: hp('3%'), color: color.neavyBlue }]}>Group</Text>
                    <View style={[commonStyles.margin, commonStyles.column, { flex: 1 }]}>
                        {
                            this.state.groupList.length === 0 ?
                                <View style={{ marginTop: hp('-8%'), flex: 1, justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
                                    <Image style={styles.icons}
                                        source={require('../../assets/images/groupList.png')} />
                                    <Text style={[commonStyles.fontFamilyBold, commonStyles.fontSize(2.7), { color: color.neavyBlue }]}>You are not a part of any group.</Text>
                                    <Text style={[commonStyles.fontFamilyBold, commonStyles.fontSize(2.7), { color: color.neavyBlue }]}>You can create a new group or</Text>
                                    <Text style={[commonStyles.fontFamilyBold, commonStyles.fontSize(2.7), { color: color.neavyBlue }]}>join an existing group.</Text>
                                </View> :
                                <View style={[commonStyles.column, { marginTop: hp('2%'), flex: 1 }]}>
                                    <FlatList
                                        data={this.state.groupList}
                                        renderItem={({ item }) => {

                                            return (
                                                <CustomItem index={item.index} >
                                                    <TouchableOpacity onPress={() => { navigate("GroupDashboardScreen",{data: item}) }} style={[styles.backgroundBoxStatus, { flex: 1, flexDirection: 'row', marginBottom: hp('2%') }]}>
                                                        <View style={{ width: wp('77%'), flexDirection: 'column', justifyContent: 'center', paddingLeft: wp('5%') }}>
                                                            <View>
                                                                <Text numberOfLines={1} style={[commonStyles.fontFamilyBold, commonStyles.fontSize(2.5), { color: color.neavyBlue }]}>{item.group_name.toString()}</Text>
                                                            </View>
                                                            <View style={{ flexDirection: 'row', marginTop: hp('0.5%') }}>
                                                                <Text style={[commonStyles.fontFamilyRegular, commonStyles.fontSize(2.2), { color: color.grayColor }]}>Group Code:</Text>
                                                                <Text style={[commonStyles.fontFamilyRegular, commonStyles.fontSize(2.2), { color: color.neavyBlue }]}> {item.group_code}</Text>
                                                            </View>
                                                            <View style={{ flexDirection: 'row' }}>
                                                                <Text style={[commonStyles.fontFamilyRegular, commonStyles.fontSize(2.2), { color: color.grayColor }]}>Total Members:</Text>
                                                                <Text style={[commonStyles.fontFamilyRegular, commonStyles.fontSize(2.2), { color: color.neavyBlue }]}> {item.admin.length + item.users.length}</Text>
                                                            </View>
                                                        </View>

                                                        <View style={{ flex: 1, flexDirection: 'column', justifyContent: 'center', alignSelf: 'center' }}>
                                                            <Image style={styles.righticons}
                                                                source={require('../../assets/images/arrow_button.png')} />
                                                        </View>
                                                    </TouchableOpacity>
                                                </CustomItem>
                                            )
                                        }}
                                        keyExtractor={(item, index) => index.toString()}
                                    />
                                </View>
                        }
                    </View>

                    <Modal useNativeDriver={false} style={[styles.modal2, { width: wp('90%'), borderRadius: wp('3%') }]} position={"center"} ref={"modalCreate"} swipeArea={20}
                        backdropPressToClose={true}  >

                        <View style={[{ height: hp('60%'), marginTop: hp('4%'), justifyContent: 'center', alignItems: 'center' }]}>
                            <Image style={styles.icons}
                                source={require('../../assets/images/create-group-popup.png')} />
                            <Text style={[commonStyles.fontFamilyBold, commonStyles.fontSize(3), { color: color.neavyBlue, marginTop: hp('1%') }]}>Create a group</Text>
                            <Text style={[commonStyles.fontFamilyRegular, commonStyles.fontSize(2), { color: color.grayColor, marginTop: hp('1%') }]}>Please share the Group Code</Text>
                            <Text style={[commonStyles.fontFamilyRegular, commonStyles.fontSize(2), { color: color.grayColor }]}>with your invitees</Text>

                            <View style={[styles.backgroundBox, { marginTop: hp('2%'), }]}>
                                <View style={{ flex: 1, flexDirection: 'row' }}>
                                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'flex-start' }}>
                                        <Text style={[commonStyles.fontFamilyRegular, commonStyles.fontSize(2), { height: hp('3%'), color: color.grayColor }]}>Group Code</Text>
                                    </View>
                                    <View style={{ alignItems: 'flex-end' }}>
                                        <Image style={styles.modalIcons}
                                            source={require('../../assets/images/group-code.png')} />
                                    </View>
                                </View>
                                <View style={{ flex: 1, }}>
                                    <Text
                                        style={[commonStyles.fontFamilyBold, commonStyles.fontSize(2.3),]}
                                        placeholderTextColor={color.neavyBlue}>{this.state.groupCodeCreate}</Text>
                                </View>
                            </View>

                            <View style={[styles.backgroundBox, { marginTop: hp('2%'), }]}>
                                <View style={{ flex: 1, flexDirection: 'row' }}>
                                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'flex-start' }}>
                                        <Text style={[commonStyles.fontFamilyRegular, commonStyles.fontSize(2), { height: hp('3%'), color: color.grayColor }]}>Group Name</Text>
                                    </View>
                                    <View style={{ alignItems: 'flex-end' }}>
                                        <Image style={styles.modalIcons}
                                            source={require('../../assets/images/group-name.png')} />
                                    </View>
                                </View>
                                <View style={{ flex: 1, }}>
                                    <TextInput
                                        style={[commonStyles.fontFamilyBold, commonStyles.fontSize(2.3), { paddingHorizontal: wp('0%'), marginBottom: hp('-1%'), height: hp('6%'), marginTop: hp('-1.5%') }]}
                                        placeholder={'Enter name'}
                                        placeholderTextColor={color.neavyBlue}
                                        onChangeText={(text) => { this.setState({ groupname: text }) }}
                                        value={this.state.groupname}
                                    />
                                </View>
                            </View>

                            <View style={{ marginTop: hp('1%'), flex: 1, alignItems: 'center' }}>

                                <TouchableOpacity
                                    onPress={async () => {
                                        //console.log("internet : ", await this.checkInternet());
                                        if (await this.checkInternet()) {
                                            this.creategroup()
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
                                            width: wp('45%'),
                                            height: hp('6.5%'),
                                            borderRadius: wp('10%')
                                        }]}>

                                        {
                                            this.state.loading === true ? (
                                                <View style={{ height: hp('6.5%'), justifyContent: 'center', alignItems: 'center', flexDirection: 'row', flex: 1 }}>
                                                    <View style={{ paddingRight: wp('5%'), backgroundColor: 'transparent' }}>
                                                        <ActivityIndicator size={'small'} color='#FFFFFF' />
                                                    </View>
                                                    <View style={{ backgroundColor: 'transparent' }}>
                                                        <Text style={[commonStyles.fontSize(3), commonStyles.fontFamilyBold, { color: '#FFFFFF' }]}>Creating...</Text>
                                                    </View>
                                                </View>
                                            ) : (
                                                    <View style={{ height: hp('6.5%'), justifyContent: 'center', alignSelf: 'center' }}>
                                                        <Text style={[commonStyles.fontSize(3), commonStyles.fontFamilyBold, { color: '#ffffff' }]}>Create</Text>
                                                    </View>
                                                )
                                        }
                                    </LinearGradient>
                                </TouchableOpacity>

                            </View>
                        </View>

                    </Modal>


                    <Modal useNativeDriver={false} style={[styles.modalJoin, { width: wp('90%'), borderRadius: wp('3%') }]} position={"center"} ref={"modalJoin"} swipeArea={20}
                        backdropPressToClose={true}  >

                        <View style={[{ height: hp('50%'), marginTop: hp('3%'), justifyContent: 'center', alignItems: 'center' }]}>
                            <Image style={styles.icons}
                                source={require('../../assets/images/joingroup-popup.png')} />
                            <Text style={[commonStyles.fontFamilyBold, commonStyles.fontSize(3), { color: color.neavyBlue, marginTop: hp('1%') }]}>Join a group</Text>
                            <Text style={[commonStyles.fontFamilyRegular, commonStyles.fontSize(2), { color: color.grayColor, marginTop: hp('1%') }]}>Please enter a group code</Text>
                            <Text style={[commonStyles.fontFamilyRegular, commonStyles.fontSize(2), { color: color.grayColor }]}>to join an existing group</Text>

                            <View style={[styles.backgroundBox, { marginTop: hp('2%'), }]}>
                                <View style={{ flex: 1, flexDirection: 'row' }}>
                                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'flex-start' }}>
                                        <Text style={[commonStyles.fontFamilyRegular, commonStyles.fontSize(2), { height: hp('3%'), color: color.grayColor }]}>Group Code</Text>
                                    </View>
                                    <View style={{ alignItems: 'flex-end' }}>
                                        <Image style={styles.modalIcons}
                                            source={require('../../assets/images/group-code.png')} />
                                    </View>
                                </View>
                                <View style={{ flex: 1, }}>
                                    <TextInput
                                        autoCapitalize='characters'
                                        maxLength={7}
                                        style={[commonStyles.fontFamilyBold, commonStyles.fontSize(2.3), { paddingHorizontal: wp('0%'), marginBottom: hp('-1%'), height: hp('6%'), marginTop: hp('-1.5%') }]}
                                        placeholder={'Enter group code'}
                                        placeholderTextColor={color.neavyBlue}
                                        onChangeText={(text) => { this.setState({ groupcode: text }) }}
                                        value={this.state.groupcode}
                                    />
                                </View>
                            </View>

                            <View style={{ marginTop: hp('1%'), flex: 1, alignItems: 'center' }}>

                                <TouchableOpacity
                                    onPress={async () => {
                                        //console.log("internet : ", await this.checkInternet());
                                        if (await this.checkInternet()) {
                                            this.joingroup()
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
                                            width: wp('45%'),
                                            height: hp('6.5%'),
                                            borderRadius: wp('10%')
                                        }]}>

                                        {
                                            this.state.loading === true ? (
                                                <View style={{ height: hp('6.5%'), justifyContent: 'center', alignItems: 'center', flexDirection: 'row', flex: 1 }}>
                                                    <View style={{ paddingRight: wp('5%'), backgroundColor: 'transparent' }}>
                                                        <ActivityIndicator size={'small'} color='#FFFFFF' />
                                                    </View>
                                                    <View style={{ backgroundColor: 'transparent' }}>
                                                        <Text style={[commonStyles.fontSize(3), commonStyles.fontFamilyBold, { color: '#FFFFFF' }]}>Joining...</Text>
                                                    </View>
                                                </View>
                                            ) : (
                                                    <View style={{ height: hp('6.5%'), justifyContent: 'center', alignSelf: 'center' }}>
                                                        <Text style={[commonStyles.fontSize(3), commonStyles.fontFamilyBold, { color: '#ffffff' }]}>Join</Text>
                                                    </View>
                                                )
                                        }
                                    </LinearGradient>
                                </TouchableOpacity>

                            </View>
                        </View>

                    </Modal>


                    <Modal useNativeDriver={false} style={[styles.modalFabButton, { flex: 1, width: wp('100%') }]} ref={"modalFabButton"}
                        backdropPressToClose={true}  >
                        <View style={{ marginBottom: hp('12%'), position: 'absolute', bottom: 0, justifyContent: 'flex-end', alignSelf: 'flex-end', flex: 1 }}>
                            <View>
                                <TouchableOpacity onPress={() => { this.triggerOpenModal(), this.refs.modalFabButton.close(), this.refs.modalJoin.open() }}>
                                    <View style={{ alignItems: 'flex-end', flexDirection: 'row' }}>
                                        <View style={[styles.backgroundBoxFabLabel]}>
                                            <Text style={[commonStyles.fontSize(2), commonStyles.fontFamilyBold, { height: hp('3%'), textAlign: 'center', color: color.neavyBlue }]}>Join a group</Text>
                                        </View>

                                        <Image style={styles.addButton}
                                            source={require('../../assets/images/join-a-group.png')} />
                                    </View>
                                </TouchableOpacity>
                            </View>

                            <View style={{ marginBottom: hp('-1.5%'), }}>
                                <TouchableOpacity onPress={() => { this.triggerOpenModal(), this.refs.modalFabButton.close(), this.makeGroupCode(7), this.refs.modalCreate.open() }}>
                                    <View style={{ alignItems: 'flex-end', flexDirection: 'row' }}>
                                        <View style={[styles.backgroundBoxFabLabel]}>
                                            <Text style={[commonStyles.fontSize(2), commonStyles.fontFamilyBold, { height: hp('3%'), textAlign: 'center', color: color.neavyBlue }]}>Create a group</Text>
                                        </View>

                                        <Image style={styles.addButton}
                                            source={require('../../assets/images/create-a-group.png')} />
                                    </View>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </Modal>

                    <View style={{ zIndex: this.state.showModal ? 1 : 2, position: 'absolute', bottom: 0, flex: 1, alignSelf: 'flex-end' }}>
                        <TouchableOpacity onPress={() => { this.triggerOpenModal() ? this.refs.modalFabButton.open() : this.refs.modalFabButton.close() }}>
                            <View style={{ alignItems: 'flex-end', }}>
                                <Image style={styles.addButton}
                                    source={this.state.showModal ? require('../../assets/images/add_button.png') : require('../../assets/images/cross.png')} />
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>

            );
        }
    }
}

const styles = StyleSheet.create({
    backgroundBoxStatus: {
        alignSelf: 'center',
        width: wp('88%'),
        height: hp('13%'),
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
    backgroundBox: {
        width: wp('80%'),
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
    backgroundBoxFabLabel: {
        justifyContent: 'center',
        marginRight: wp('-5%'), marginBottom: hp('7%'),
        width: wp('35%'),
        height: hp('2.5%'),
        padding: wp('3%'),
        borderWidth: 0.5,
        borderRadius: 5,
        backgroundColor: 'white',
        borderColor: 'black',
        elevation: 3,
        shadowColor: '#CBD5EA',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.5,
        shadowRadius: 5,
    },
    modalIcons: {
        width: wp('3%'),
        height: hp('2.5%'),
        resizeMode: 'contain'
    },
    icons: {
        width: wp('20%'),
        height: hp('10%'),
        resizeMode: 'contain',
    },
    modal2: {
        maxHeight: hp('60%'),
        minHeight: hp('60%')
    },
    modalJoin: {
        maxHeight: hp('50%'),
        minHeight: hp('50%')
    },
    modalFabButton: {
        backgroundColor: 'transparent',
    },
    addButton: {
        marginTop: hp('-5%'),

        marginLeft: wp('5%'),
        marginRight: wp('2%'),
        width: wp('20%'),
        height: hp('15%'),
        resizeMode: 'contain'
    },
    righticons: {
        width: wp('10%'),
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
)(withNavigation(GroupListScreen));