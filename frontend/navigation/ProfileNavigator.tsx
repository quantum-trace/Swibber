import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import type { ProfileStackParamList } from './types';
import ProfileHomeScreen from '../screens/profile/ProfileHomeScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import SavedAddressesScreen from '../screens/profile/SavedAddressesScreen';
import PaymentMethodsScreen from '../screens/profile/PaymentMethodsScreen';
import SettingsScreen from '../screens/profile/SettingsScreen';
import HelpSupportScreen from '../screens/profile/HelpSupportScreen';
import SupportChatScreen from '../screens/profile/SupportChatScreen';
import MembershipUpgradeScreen from '../screens/profile/MembershipUpgradeScreen';
import AddAddressScreen from '../screens/profile/AddAddressScreen';

const Stack = createStackNavigator<ProfileStackParamList>();

export default function ProfileNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfileHome" component={ProfileHomeScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="SavedAddresses" component={SavedAddressesScreen} />
      <Stack.Screen name="AddAddress" component={AddAddressScreen} />
      <Stack.Screen name="PaymentMethods" component={PaymentMethodsScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="HelpSupport" component={HelpSupportScreen} />
      <Stack.Screen name="SupportChat" component={SupportChatScreen} />
      <Stack.Screen name="MembershipUpgrade" component={MembershipUpgradeScreen} />
    </Stack.Navigator>
  );
}
