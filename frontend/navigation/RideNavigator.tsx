import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import type { RideStackParamList } from './types';
import RideHomeScreen from '../screens/ride/RideHomeScreen';
import LocationSelectScreen from '../screens/ride/LocationSelectScreen';
import VehicleSelectScreen from '../screens/ride/VehicleSelectScreen';
import RideConfirmScreen from '../screens/ride/RideConfirmScreen';
import DriverMatchingScreen from '../screens/ride/DriverMatchingScreen';
import LiveTrackingScreen from '../screens/ride/LiveTrackingScreen';
import DriverChatScreen from '../screens/ride/DriverChatScreen';
import RideCompleteScreen from '../screens/ride/RideCompleteScreen';
import RideRatingScreen from '../screens/ride/RideRatingScreen';

const Stack = createStackNavigator<RideStackParamList>();

export default function RideNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="RideHome" component={RideHomeScreen} />
      <Stack.Screen name="LocationSelect" component={LocationSelectScreen} />
      <Stack.Screen name="VehicleSelect" component={VehicleSelectScreen} />
      <Stack.Screen name="RideConfirm" component={RideConfirmScreen} />
      <Stack.Screen name="DriverMatching" component={DriverMatchingScreen} />
      <Stack.Screen name="LiveTracking" component={LiveTrackingScreen} />
      <Stack.Screen name="DriverChat" component={DriverChatScreen} />
      <Stack.Screen name="RideComplete" component={RideCompleteScreen} />
      <Stack.Screen name="RideRating" component={RideRatingScreen} />
    </Stack.Navigator>
  );
}
