export const Routes = {
  // Root stack
  SPLASH: 'Splash',
  ONBOARDING: 'Onboarding',
  AUTH: 'Auth',
  MAIN: 'Main',

  // Auth stack
  WELCOME: 'Welcome',
  LOGIN: 'Login',
  SIGNUP: 'Signup',
  OTP: 'OTP',
  FORGOT_PASSWORD: 'ForgotPassword',

  // Main bottom tabs
  HOME_TAB: 'HomeTab',
  ACTIVITY_TAB: 'ActivityTab',
  WALLET_TAB: 'WalletTab',
  NOTIFICATIONS_TAB: 'NotificationsTab',
  PROFILE_TAB: 'ProfileTab',

  // Home stack
  HOME_MAIN: 'HomeMain',

  // Ride stack
  RIDE_HOME: 'RideHome',
  LOCATION_SELECT: 'LocationSelect',
  VEHICLE_SELECT: 'VehicleSelect',
  RIDE_CONFIRM: 'RideConfirm',
  DRIVER_MATCHING: 'DriverMatching',
  LIVE_TRACKING: 'LiveTracking',
  RIDE_COMPLETE: 'RideComplete',
  RIDE_RATING: 'RideRating',

  // Food stack
  FOOD_HOME: 'FoodHome',
  RESTAURANT_LIST: 'RestaurantList',
  RESTAURANT_DETAIL: 'RestaurantDetail',
  CART: 'Cart',
  CHECKOUT: 'Checkout',
  ORDER_TRACKING: 'OrderTracking',
  ORDER_COMPLETE: 'OrderComplete',

  // Parcel stack
  PARCEL_HOME: 'ParcelHome',
  PARCEL_LOCATION: 'ParcelLocation',
  PARCEL_DETAILS: 'ParcelDetails',
  PARCEL_MATCHING: 'ParcelMatching',
  PARCEL_TRACKING: 'ParcelTracking',
  PARCEL_COMPLETE: 'ParcelComplete',

  // Profile stack
  PROFILE_HOME: 'ProfileHome',
  EDIT_PROFILE: 'EditProfile',
  SAVED_ADDRESSES: 'SavedAddresses',
  PAYMENT_METHODS: 'PaymentMethods',
  SETTINGS: 'Settings',
  HELP_SUPPORT: 'HelpSupport',

  // Standalone screens in main navigator
  ACTIVITY: 'Activity',
  WALLET: 'Wallet',
  NOTIFICATIONS: 'Notifications',
} as const;

export type RouteKey = (typeof Routes)[keyof typeof Routes];
