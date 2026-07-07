import { NavigatorScreenParams } from '@react-navigation/native';

// ─── Root ────────────────────────────────────────────────────────────────────
export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
};

// ─── Auth ─────────────────────────────────────────────────────────────────────
export type AuthStackParamList = {
  Welcome: undefined;
  PhoneAuth: undefined;
  OTPVerify: { phone: string };
  EmailAuth: { mode?: 'login' | 'signup' };
  ForgotPassword: undefined;
};

// ─── Main Tabs ────────────────────────────────────────────────────────────────
export type MainTabParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList>;
  ActivityTab: NavigatorScreenParams<ActivityStackParamList>;
  WalletTab: NavigatorScreenParams<WalletStackParamList>;
  NotificationsTab: undefined;
  ProfileTab: NavigatorScreenParams<ProfileStackParamList>;
  RideTab: NavigatorScreenParams<RideStackParamList>;
  FoodTab: NavigatorScreenParams<FoodStackParamList>;
  ParcelTab: NavigatorScreenParams<ParcelStackParamList>;
};

// ─── Activity Stack ───────────────────────────────────────────────────────────
export type ActivityStackParamList = {
  ActivityHome: undefined;
  ActivityDetail: {
    id: string;
    type: 'ride' | 'food' | 'parcel';
  };
  Receipt: {
    id: string;
    type: 'ride' | 'food' | 'parcel';
  };
};

// ─── Home Stack ───────────────────────────────────────────────────────────────
export type HomeStackParamList = {
  HomeMain: undefined;
  RideStack: NavigatorScreenParams<RideStackParamList>;
  FoodStack: NavigatorScreenParams<FoodStackParamList>;
  ParcelStack: NavigatorScreenParams<ParcelStackParamList>;
};

// ─── Wallet Stack ─────────────────────────────────────────────────────────────
export type WalletStackParamList = {
  WalletHome: undefined;
  Transactions: undefined;
};

// ─── Ride Stack ───────────────────────────────────────────────────────────────
export type RideStackParamList = {
  RideHome: undefined;
  LocationSelect: undefined;
  VehicleSelect: { pickup: string; destination: string; pickupLat?: number; pickupLng?: number; destLat?: number; destLng?: number; fromRebook?: boolean };
  RideConfirm: { vehicleType: string; fare: number; pickup: string; destination: string };
  DriverMatching: { rideId: string };
  LiveTracking: { rideId: string };
  DriverChat: { rideId: string; driverName: string; driverPhone: string };
  RideComplete: { rideId: string; fare: number; distance: string; duration: string };
  RideRating: { rideId: string; driverName: string };
};

// ─── Food Stack ───────────────────────────────────────────────────────────────
export type FoodStackParamList = {
  FoodHome: undefined;
  RestaurantList: { cuisine?: string; search?: string; searchFocus?: boolean };
  RestaurantDetail: { restaurantId: string };
  Cart: undefined;
  Checkout: { total: number };
  OrderTracking: { orderId: string };
  OrderComplete: { orderId: string };
};

// ─── Parcel Stack ─────────────────────────────────────────────────────────────
export type ParcelStackParamList = {
  ParcelHome: undefined;
  ParcelLocation: { selectedType?: string };
  ParcelDetails: { pickup: string; pickupFull: string; dropoff: string; dropoffFull: string; selectedType?: string; pickupLat?: number; pickupLng?: number; dropLat?: number; dropLng?: number };
  ParcelMatching: { parcelId: string; pickup: string; dropoff: string; fare: number; packageType: string; receiverName: string; receiverPhone: string; pickupLat?: number; pickupLng?: number; dropLat?: number; dropLng?: number };
  ParcelTracking: { parcelId: string; pickup: string; dropoff: string; pickupLat?: number; pickupLng?: number; dropLat?: number; dropLng?: number; packageType?: string; weightKg?: number };
  ParcelComplete: { parcelId: string };
};

// ─── Profile Stack ────────────────────────────────────────────────────────────
export type ProfileStackParamList = {
  ProfileHome: undefined;
  EditProfile: undefined;
  SavedAddresses: undefined;
  AddAddress: { editAddress?: { id: string; type: string; label: string; address: string; lat: number; lng: number } } | undefined;
  PaymentMethods: undefined;
  Settings: undefined;
  HelpSupport: undefined;
  SupportChat: undefined;
  MembershipUpgrade: undefined;
};
