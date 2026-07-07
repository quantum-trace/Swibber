export const Endpoints = {
  // Auth
  AUTH: {
    LOGIN: '/auth/login',
    SIGNUP: '/auth/signup',
    LOGOUT: '/auth/logout',
    REFRESH_TOKEN: '/auth/refresh',
    SEND_OTP: '/auth/otp/send',
    VERIFY_OTP: '/auth/otp/verify',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    GOOGLE_AUTH: '/auth/google',
    APPLE_AUTH: '/auth/apple',
  },

  // User / Profile
  USER: {
    PROFILE: '/user/profile',
    UPDATE_PROFILE: '/user/profile',
    UPLOAD_AVATAR: '/user/avatar',
    ADDRESSES: '/user/addresses',
    ADD_ADDRESS: '/user/addresses',
    UPDATE_ADDRESS: (id: string) => `/user/addresses/${id}`,
    DELETE_ADDRESS: (id: string) => `/user/addresses/${id}`,
    PAYMENT_METHODS: '/user/payment-methods',
    ADD_PAYMENT: '/user/payment-methods',
    DELETE_PAYMENT: (id: string) => `/user/payment-methods/${id}`,
    SETTINGS: '/user/settings',
    UPDATE_SETTINGS: '/user/settings',
  },

  // Ride
  RIDE: {
    ESTIMATE:       '/ride/estimate',
    CREATE:         '/ride/create',
    CANCEL:         (id: string) => `/ride/${id}/cancel`,
    STATUS:         (id: string) => `/ride/${id}/status`,
    RECEIPT:        (id: string) => `/ride/${id}/receipt`,
    HISTORY:        '/ride/history',
    RATE:           (id: string) => `/ride/${id}/rate`,
    NEARBY_DRIVERS: '/ride/nearby-drivers',
    SCHEDULE:       '/ride/schedule',
    ETA:            '/ride/eta',
    SURGE:          '/ride/surge',
  },

  // Food
  FOOD: {
    RESTAURANTS: '/food/restaurants',
    RESTAURANT_DETAIL: (id: string) => `/food/restaurants/${id}`,
    MENU: (id: string) => `/food/restaurants/${id}/menu`,
    SEARCH: '/food/search',
    CREATE_ORDER: '/food/orders',
    ORDER_STATUS: (id: string) => `/food/orders/${id}/status`,
    ORDER_RECEIPT: (id: string) => `/food/orders/${id}/receipt`,
    ORDER_HISTORY: '/food/orders/history',
    CANCEL_ORDER: (id: string) => `/food/orders/${id}/cancel`,
    RATE_ORDER: (id: string) => `/food/orders/${id}/rate`,
    APPLY_COUPON: '/food/coupon/apply',
  },

  // Parcel
  PARCEL: {
    ESTIMATE:   '/parcel/estimate',
    CREATE:     '/parcel/create',
    STATUS:     (id: string) => `/parcel/${id}/status`,
    RECEIPT:    (id: string) => `/parcel/${id}/receipt`,
    ETA:        (id: string) => `/parcel/${id}/eta`,
    HISTORY:    '/parcel/history',
    CANCEL:     (id: string) => `/parcel/${id}/cancel`,
    RATE:       (id: string) => `/parcel/${id}/rate`,
    VERIFY_OTP: (id: string) => `/parcel/${id}/verify-otp`,
  },

  // Wallet
  WALLET: {
    BALANCE: '/wallet/balance',
    TRANSACTIONS: '/wallet/transactions',
    ADD_MONEY: '/wallet/add-money',
    WITHDRAW: '/wallet/withdraw',
  },

  // Payment
  PAYMENT: {
    CREATE_ORDER: '/payment/create-order',
    VERIFY:       '/payment/verify',
    HISTORY:      '/payment/history',
    WEBHOOK:      '/payment/webhook',
  },

  // Activity
  ACTIVITY: '/activity',

  // Promotions / Config
  PROMOTIONS: '/promotions',
  ENUM_CONFIG: '/config/enums',
  APP_CONFIG: '/config/app',
} as const;
