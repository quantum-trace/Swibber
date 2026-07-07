import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import type { ActivityStackParamList } from './types';
import ActivityScreen from '../screens/activity/ActivityScreen';
import ActivityDetailScreen from '../screens/activity/ActivityDetailScreen';
import ReceiptScreen from '../screens/activity/ReceiptScreen';

const Stack = createStackNavigator<ActivityStackParamList>();

export default function ActivityNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ActivityHome" component={ActivityScreen} />
      <Stack.Screen name="ActivityDetail" component={ActivityDetailScreen} />
      <Stack.Screen name="Receipt" component={ReceiptScreen} />
    </Stack.Navigator>
  );
}
