import 'react-native-gesture-handler';
import * as React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {HomePage} from './src/modules/home/home.page';
import {TrackingPage} from './src/modules/tracking/tracking.page';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
      // screenOptions={{
      //   headerShown: false,
      // }}
      >
        <Stack.Screen
          name="Home"
          component={HomePage}
          options={{
            headerTransparent: true,
            title: '',
          }}
        />
        <Stack.Screen
          name="Tracking"
          component={TrackingPage}
          options={{
            headerTransparent: true,
            title: '',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
