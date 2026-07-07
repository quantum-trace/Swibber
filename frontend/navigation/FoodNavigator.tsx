import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import type { FoodStackParamList } from './types';
import FoodHomeScreen from '../screens/food/FoodHomeScreen';
import RestaurantListScreen from '../screens/food/RestaurantListScreen';
import RestaurantDetailScreen from '../screens/food/RestaurantDetailScreen';
import CartScreen from '../screens/food/CartScreen';
import CheckoutScreen from '../screens/food/CheckoutScreen';
import OrderTrackingScreen from '../screens/food/OrderTrackingScreen';
import OrderCompleteScreen from '../screens/food/OrderCompleteScreen';

const Stack = createStackNavigator<FoodStackParamList>();

export default function FoodNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="FoodHome" component={FoodHomeScreen} />
      <Stack.Screen name="RestaurantList" component={RestaurantListScreen} />
      <Stack.Screen name="RestaurantDetail" component={RestaurantDetailScreen} />
      <Stack.Screen name="Cart" component={CartScreen} />
      <Stack.Screen name="Checkout" component={CheckoutScreen} />
      <Stack.Screen name="OrderTracking" component={OrderTrackingScreen} />
      <Stack.Screen name="OrderComplete" component={OrderCompleteScreen} />
    </Stack.Navigator>
  );
}
