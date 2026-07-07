import React from 'react';
import { createStackNavigator, TransitionPresets } from '@react-navigation/stack';
import type { WalletStackParamList } from './types';
import WalletScreen from '../screens/wallet/WalletScreen';
import TransactionsScreen from '../screens/wallet/TransactionsScreen';

const Stack = createStackNavigator<WalletStackParamList>();

export default function WalletNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        ...TransitionPresets.SlideFromRightIOS,
      }}
    >
      <Stack.Screen name="WalletHome" component={WalletScreen} />
      <Stack.Screen name="Transactions" component={TransactionsScreen} />
    </Stack.Navigator>
  );
}
