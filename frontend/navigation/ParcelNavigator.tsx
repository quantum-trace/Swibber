import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import type { ParcelStackParamList } from './types';
import ParcelHomeScreen from '../screens/parcel/ParcelHomeScreen';
import ParcelLocationScreen from '../screens/parcel/ParcelLocationScreen';
import ParcelDetailsScreen from '../screens/parcel/ParcelDetailsScreen';
import ParcelMatchingScreen from '../screens/parcel/ParcelMatchingScreen';
import ParcelTrackingScreen from '../screens/parcel/ParcelTrackingScreen';
import ParcelCompleteScreen from '../screens/parcel/ParcelCompleteScreen';

const Stack = createStackNavigator<ParcelStackParamList>();

export default function ParcelNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ParcelHome" component={ParcelHomeScreen} />
      <Stack.Screen name="ParcelLocation" component={ParcelLocationScreen} />
      <Stack.Screen name="ParcelDetails" component={ParcelDetailsScreen} />
      <Stack.Screen name="ParcelMatching" component={ParcelMatchingScreen} />
      <Stack.Screen name="ParcelTracking" component={ParcelTrackingScreen} />
      <Stack.Screen name="ParcelComplete" component={ParcelCompleteScreen} />
    </Stack.Navigator>
  );
}
