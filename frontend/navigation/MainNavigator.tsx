import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import type { MainTabParamList } from './types';
import BottomTabBar from '../components/navigation/BottomTabBar';
import HomeNavigator from './HomeNavigator';
import ActivityNavigator from './ActivityNavigator';
import WalletNavigator from './WalletNavigator';
import NotificationsScreen from '../screens/notifications/NotificationsScreen';
import ProfileNavigator from './ProfileNavigator';
import RideNavigator from './RideNavigator';
import FoodNavigator from './FoodNavigator';
import ParcelNavigator from './ParcelNavigator';

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainNavigator() {
  return (
    <Tab.Navigator
      tabBar={(props) => <BottomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="HomeTab" component={HomeNavigator} />
      <Tab.Screen name="ActivityTab" component={ActivityNavigator} />
      <Tab.Screen name="WalletTab" component={WalletNavigator} />
      <Tab.Screen name="NotificationsTab" component={NotificationsScreen} />
      <Tab.Screen name="ProfileTab" component={ProfileNavigator} />
      <Tab.Screen name="RideTab" component={RideNavigator} />
      <Tab.Screen name="FoodTab" component={FoodNavigator} />
      <Tab.Screen name="ParcelTab" component={ParcelNavigator} />
    </Tab.Navigator>
  );
}
