import React from 'react';
import {View, StyleSheet, Image, Text, Dimensions, TouchableHighlight} from 'react-native';
import Pulse from './components/pulse.component';
// import { Container } from './styles';
import Icon from 'react-native-vector-icons/Ionicons';

export const HomePage: React.FC = ({navigation}) => {
  const goToTracking = () => {
    navigation.push('Tracking');
  };
  return (
    <>
      <View style={styles.trackingButton}>
        <Pulse
          color="#0C94F6"
          numPulses={1}
          diameter={250}
          speed={10}
          duration={1000}
        />
        <TouchableHighlight onPress={() => goToTracking()}>
          <Image
            style={styles.imagePet}
            source={require('../../../assets/images/images.png')}
          />
        </TouchableHighlight>
      </View>
      <Text
        style={{
          position: 'absolute',
          bottom: Dimensions.get('window').height / 3,
          width: '100%',
          textAlign: 'center',
        }}>
        Buscar Pet
      </Text>
    </>
  );
};

const styles = StyleSheet.create({
  trackingButton: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePet: {
    width: 150,
    height: 150,
  },
});
