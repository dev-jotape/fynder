import React, {Component} from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Switch,
  Image,
} from 'react-native';
import {
  widthPercentageToDP as wp,
  heightPercentageToDP as hp,
} from 'react-native-responsive-screen';
import MapView, {Marker} from 'react-native-maps';
import PubNubReact from 'pubnub-react';
import geolocation from '@react-native-community/geolocation';

type Props = {};
export class TrackingPage extends Component<Props> {
  constructor(props) {
    super(props);

    this.pubnub = new PubNubReact({
      publishKey: 'pub-c-bc8d6339-4453-463d-bd88-6a5ea748e5c2',
      subscribeKey: 'sub-c-08981306-e1b4-11ea-823b-3e8d92f071f6',
    });

    //Base State
    this.state = {
      currentLoc: {
        latitude: -1,
        longitude: -1,
      },
      numUsers: 0,
      fixedOnUUID: '',
      focusOnMe: false,
      users: new Map(),
      isFocused: false,
      userCount: 0,
      allowGPS: true,
    };

    this.pubnub.init(this);
  }

  async componentDidMount() {
    this.setUpApp();
  }

  focusLoc = () => {
    if (this.state.focusOnMe || this.state.fixedOnUUID) {
      this.setState({
        focusOnMe: false,
        fixedOnUUID: '',
      });
    } else {
      let region = {
        latitude: this.state.currentLoc.latitude,
        longitude: this.state.currentLoc.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
      this.setState({
        focusOnMe: true,
      });
      this.map.animateToRegion(region, 2000);
    }
  };

  toggleGPS = () => {
    this.setState({
      allowGPS: !this.state.allowGPS,
    });
  };

  async setUpApp() {
    this.pubnub.getMessage('global', (msg) => {
      console.log('new message ===> ', msg);
      let users = this.state.users;
      if (msg.message.hideUser) {
        users.delete(msg.publisher);
        this.setState({
          users,
        });
      } else {
        let coord = [msg.message.latitude, msg.message.longitude]; //Format GPS Coordinates for Payload

        let oldUser = this.state.users.get(msg.publisher);

        let newUser = {
          uuid: msg.publisher,
          latitude: msg.message.latitude,
          longitude: msg.message.longitude,
        };

        // if (msg.message.message) {
        //   console.log('message.message')
        //   Timeout.set(msg.publisher, this.clearMessage, 5000, msg.publisher);
        //   newUser.message = msg.message.message;
        // } else if (oldUser) {
        //   newUser.message = oldUser.message;
        // }
        this.updateUserCount();
        users.set(newUser.uuid, newUser);
        this.setState({
          users,
        });
      }
    });

    this.pubnub.subscribe({
      channels: ['global'],
      withPresence: true,
    });

    //Get Stationary Coordinate
    geolocation.getCurrentPosition(
      (position) => {
        if (this.state.allowGPS) {
          console.log('publish message');
          this.pubnub.publish({
            message: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            },
            channel: 'global',
          });
          let users = this.state.users;
          let tempUser = {
            uuid: this.pubnub.getUUID(),
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          users.set(tempUser.uuid, tempUser);
          this.setState({
            users,
            currentLoc: position.coords,
          });
        }
      },
      (error) => console.log('Maps Error: ', error),
      {enableHighAccuracy: true},
    );

    //Track motional Coordinates
    geolocation.watchPosition(
      (position) => {
        this.setState({
          currentLoc: position.coords,
        });
        if (this.state.allowGPS) {
          this.pubnub.publish({
            message: {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            },
            channel: 'global',
          });
        }
        //console.log(positon.coords);
      },
      (error) => console.log('Maps Error: ', error),
      {
        enableHighAccuracy: true,
        distanceFilter: 100,
      },
    );
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.allowGPS != this.state.allowGPS) {
      //check whether the user just toggled their GPS settings
      if (this.state.allowGPS) {
        //if user toggled to show their GPS data
        if (this.state.focusOnMe) {
          //if user toggled to focus map view on themselves
          this.animateToCurrent(this.state.currentLoc, 1000);
        }
        let users = this.state.users;
        let tempUser = {
          uuid: this.pubnub.getUUID(),
          latitude: this.state.currentLoc.latitude,
          longitude: this.state.currentLoc.longitude,
          image: this.state.currentPicture,
          username: this.state.username,
        };
        users.set(tempUser.uuid, tempUser);
        this.setState(
          {
            users,
          },
          () => {
            this.pubnub.publish({
              message: tempUser,
              channel: 'global',
            });
          },
        );
      } else {
        //if user toggled to hide their GPS data
        let users = this.state.users;
        let uuid = this.pubnub.getUUID();

        users.delete(uuid);
        this.setState({
          users,
        });
        this.pubnub.publish({
          message: {
            hideUser: true,
          },
          channel: 'global',
        });
      }
    }
  }

  updateUserCount = () => {
    var presenceUsers = 0;
    this.pubnub.hereNow(
      {
        includeUUIDs: true,
        includeState: true,
      },
      function (status, response) {
        // handle status, response
        if (response && response.totalOccupancy)
          presenceUsers = response.totalOccupancy;
      },
    );
    var totalUsers = Math.max(presenceUsers, this.state.users.size);
    this.setState({userCount: totalUsers});
  };

  animateToCurrent = (coords, speed) => {
    let region = {
      latitude: coords.latitude,
      longitude: coords.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    };
    this.map.animateToRegion(region, speed);
  };

  getImage = (position) => {
    return !!position
      ? require('../../../assets/images/dog.png')
      : require('../../../assets/images/person.png');
  };

  render() {
    let usersArray = Array.from(this.state.users.values());
    return (
      <View style={styles.container}>
        <MapView
          style={styles.map}
          ref={(ref) => (this.map = ref)}
          onMoveShouldSetResponder={this.draggedMap}
          initialRegion={{
            latitude: this.state.currentLoc.latitude,
            longitude: this.state.currentLoc.longitude,
            latitudeDelta: 0.01,
            longitudeDelta: 0.01,
          }}>
          {console.log('users: ', this.state.users.values())}
          {usersArray.map((item, index) => (
            <Marker
              style={styles.marker}
              key={item.uuid}
              coordinate={{
                latitude: item.latitude,
                longitude: item.longitude,
              }}
              ref={(marker) => {
                this.marker = marker;
              }}>
              <Image style={styles.profile} source={this.getImage(index)} />
            </Marker>
          ))}
        </MapView>

        {/* <View style={styles.topBar}>
          <View style={styles.leftBar}>
            <View style={styles.userCount}>
              <Text>{this.state.userCount}</Text>
            </View>
          </View>
        </View> */}

        <View style={styles.topBar}>
          <View style={styles.rightBar}>
            <Switch
              value={this.state.allowGPS}
              style={styles.locationSwitch}
              onValueChange={this.toggleGPS}
            />
          </View>
        </View>

        <View style={styles.bottom}>
          <View style={styles.bottomRow}>
            <TouchableOpacity onPress={this.focusLoc}>
              <Image
                style={styles.focusLoc}
                source={require('../../../assets/images/crosshair.png')}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  marker: {
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Platform.OS === 'android' ? 100 : 0,
  },
  topBar: {
    top: Platform.OS === 'android' ? hp('2%') : hp('5%'),

    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: wp('2%'),
  },
  rightBar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  leftBar: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
  },
  locationSwitch: {
    left: 300,
  },
  container: {
    flex: 1,
  },
  bottom: {
    position: 'absolute',
    flexDirection: 'column',
    bottom: 0,
    justifyContent: 'center',
    alignSelf: 'center',
    width: '100%',
    marginBottom: hp('4%'),
  },
  focusLoc: {
    width: hp('4.5%'),
    height: hp('4.5%'),
    marginRight: wp('2%'),
    left: 15,
  },
  userCount: {
    marginHorizontal: 10,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  profile: {
    width: hp('4.5%'),
    height: hp('4.5%'),
  },
});
