import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import type { AuthStackParamList } from './types';
import WelcomeScreen from '../screens/auth/WelcomeScreen';
import PhoneAuthScreen from '../screens/auth/PhoneAuthScreen';
import OTPScreen from '../screens/auth/OTPScreen';
import EmailAuthScreen from '../screens/auth/EmailAuthScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';

const Stack = createStackNavigator<AuthStackParamList>();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const slideFromRight = ({ current, layouts }: any) => ({
  cardStyle: {
    transform: [
      {
        translateX: current.progress.interpolate({
          inputRange: [0, 1],
          outputRange: [layouts.screen.width, 0],
        }),
      },
    ],
  },
});

export default function AuthNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        cardStyleInterpolator: slideFromRight,
      }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="PhoneAuth" component={PhoneAuthScreen} />
      <Stack.Screen name="OTPVerify" component={OTPScreen} />
      <Stack.Screen name="EmailAuth" component={EmailAuthScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </Stack.Navigator>
  );
}
