import React from "react";
import { SafeAreaView, StatusBar } from 'react-native';
import { connect } from "react-redux";
import LoadingIndicator from './styles/LoadingIndicator';
import TabManager from './home/TabManager';
import { getUserData } from "./store/actions/userActions";
import SignUpScreen from './home/SignUpScreen';
import TravelHistoryScreen from './home/TravelHistoryScreen';
import QuarantineScreen from './home/QuarantineScreen';
import styles from './styles/Common';
class InitialScreen extends React.Component {

    state = {
        loading: true
    }

    componentDidMount() {
        this.setState({
            loading: true
        }, async () => {
            await this.props.getUserData();
            this.setState({
                loading: false
            })
        })
    }

    getScreen() {
        
        if (this.state.loading) {
            return <LoadingIndicator />
        }
        else {
            if (this.props.data && this.props.data[0]) {
                if(this.props.data[0].quarantine_type == "")
                {
                    return <TravelHistoryScreen name={this.props.data[0].name}/>
                }
                else if(this.props.data[0].profile_url == "")
                {
                    return <QuarantineScreen />
                }
                else
                {
                    return <TabManager />
                }
                    
            }
            else {
                return <SignUpScreen />
            }
        }
    }

    render() {
        return (
            <SafeAreaView style={[styles.full]}>
                <StatusBar backgroundColor={'#000000'} barStyle='default' />
                {this.getScreen()}
            </SafeAreaView>
        );
    }
}

const mapStateToProps = state => ({
    data: state.user.data
});

const mapDispatchToProps = dispatch => ({
    getUserData: () => dispatch(getUserData()),
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(InitialScreen);