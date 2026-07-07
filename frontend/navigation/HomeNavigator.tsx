import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import type { HomeStackParamList } from './types';
import HomeScreen from '../screens/home/HomeScreen';
import RideNavigator from './RideNavigator';
import FoodNavigator from './FoodNavigator';
import ParcelNavigator from './ParcelNavigator';

const Stack = createStackNavigator<HomeStackParamList>();

export default function HomeNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomeMain" component={HomeScreen} />
      <Stack.Screen name="RideStack" component={RideNavigator} />
      <Stack.Screen name="FoodStack" component={FoodNavigator} />
      <Stack.Screen name="ParcelStack" component={ParcelNavigator} />
    </Stack.Navigator>
  );
}
