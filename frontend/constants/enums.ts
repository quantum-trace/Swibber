/**
 * Centralised enum definitions for Swibber.
 *
 * ARCHITECTURE RULE:
 *  - No enum literal strings are hardcoded anywhere outside this file.
 *  - Every enum ships a *Config* record that carries human-readable labels,
 *    DB-overridable aliases, icons, colours, and any domain metadata.
 *  - `EnumAliasService` lets the API/DB patch aliases at runtime so the UI
 *    automatically reflects backend-configured display names.
 */

// ─────────────────────────────────────────────
// 1. Vehicle Types
// ─────────────────────────────────────────────
export const VehicleTypeEnum = {
  BIKE: 'bike',
  AUTO: 'auto',
  MINI: 'mini',
  SEDAN: 'sedan',
  XL: 'xl',
  PREMIUM: 'premium',
} as const;

export type VehicleType = (typeof VehicleTypeEnum)[keyof typeof VehicleTypeEnum];

export interface VehicleConfig {
  key: VehicleType;
  label: string;
  alias: string;
  icon: string;
  capacity: number;
  description: string;
  basePrice: number;
  pricePerKm: number;
  estimatedTime: string;
  emoji: string;
}

export const vehicleConfigs: Record<VehicleType, VehicleConfig> = {
  bike: {
    key: 'bike', label: 'Bike', alias: 'SwibberBike', icon: 'motorcycle',
    capacity: 1, description: 'Quick & affordable bike rides', basePrice: 25,
    pricePerKm: 8, estimatedTime: '3–5 min', emoji: '🏍️',
  },
  auto: {
    key: 'auto', label: 'Auto', alias: 'SwibberAuto', icon: 'local-taxi',
    capacity: 3, description: 'Comfortable auto-rickshaw rides', basePrice: 35,
    pricePerKm: 12, estimatedTime: '4–7 min', emoji: '🛺',
  },
  mini: {
    key: 'mini', label: 'Mini', alias: 'SwibberMini', icon: 'directions-car',
    capacity: 4, description: 'Compact hatchback rides', basePrice: 50,
    pricePerKm: 14, estimatedTime: '5–8 min', emoji: '🚗',
  },
  sedan: {
    key: 'sedan', label: 'Sedan', alias: 'SwibberPrime', icon: 'directions-car',
    capacity: 4, description: 'Premium sedan experience', basePrice: 75,
    pricePerKm: 18, estimatedTime: '5–10 min', emoji: '🚘',
  },
  xl: {
    key: 'xl', label: 'XL', alias: 'SwibberXL', icon: 'airport-shuttle',
    capacity: 6, description: 'Spacious SUV for groups', basePrice: 100,
    pricePerKm: 22, estimatedTime: '6–12 min', emoji: '🚐',
  },
  premium: {
    key: 'premium', label: 'Premium', alias: 'SwibberLux', icon: 'star',
    capacity: 4, description: 'Luxury ride experience', basePrice: 150,
    pricePerKm: 28, estimatedTime: '7–12 min', emoji: '🏎️',
  },
};

// ─────────────────────────────────────────────
// 2. Order Status
// ─────────────────────────────────────────────
export const OrderStatusEnum = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PREPARING: 'preparing',
  PICKED_UP: 'picked_up',
  ON_THE_WAY: 'on_the_way',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
} as const;

export type OrderStatus = (typeof OrderStatusEnum)[keyof typeof OrderStatusEnum];

export interface OrderStatusConfig {
  key: OrderStatus;
  label: string;
  alias: string;
  color: string;
  icon: string;
  step: number;
}

export const orderStatusConfigs: Record<OrderStatus, OrderStatusConfig> = {
  pending: { key: 'pending', label: 'Pending', alias: 'Order Placed', color: '#FF9500', icon: 'access-time', step: 0 },
  confirmed: { key: 'confirmed', label: 'Confirmed', alias: 'Restaurant Confirmed', color: '#4C35E8', icon: 'check-circle', step: 1 },
  preparing: { key: 'preparing', label: 'Preparing', alias: 'Being Prepared', color: '#7B2FBE', icon: 'restaurant', step: 2 },
  picked_up: { key: 'picked_up', label: 'Picked Up', alias: 'Rider Picked Up', color: '#00D4FF', icon: 'two-wheeler', step: 3 },
  on_the_way: { key: 'on_the_way', label: 'On The Way', alias: 'Heading Your Way', color: '#007AFF', icon: 'delivery-dining', step: 4 },
  delivered: { key: 'delivered', label: 'Delivered', alias: 'Order Delivered', color: '#00C853', icon: 'check-circle-outline', step: 5 },
  cancelled: { key: 'cancelled', label: 'Cancelled', alias: 'Order Cancelled', color: '#FF3B30', icon: 'cancel', step: -1 },
  refunded: { key: 'refunded', label: 'Refunded', alias: 'Amount Refunded', color: '#00C853', icon: 'replay', step: -2 },
};

// ─────────────────────────────────────────────
// 3. Payment Methods
// ─────────────────────────────────────────────
export const PaymentMethodEnum = {
  RAZORPAY: 'razorpay',
  CASH: 'cash',
  // Legacy values kept so existing DB records remain valid
  UPI: 'upi',
  CREDIT_CARD: 'credit_card',
  DEBIT_CARD: 'debit_card',
  NET_BANKING: 'net_banking',
  WALLET: 'wallet',
} as const;

export type PaymentMethod = (typeof PaymentMethodEnum)[keyof typeof PaymentMethodEnum];

export interface PaymentMethodConfig {
  key: PaymentMethod;
  label: string;
  alias: string;
  icon: string;
  emoji: string;
  supportsRefund: boolean;
  isDigital: boolean;
}

export const paymentMethodConfigs: Record<PaymentMethod, PaymentMethodConfig> = {
  razorpay: { key: 'razorpay', label: 'Razorpay', alias: 'Pay via Razorpay', icon: 'credit-card', emoji: '💳', supportsRefund: true, isDigital: true },
  cash: { key: 'cash', label: 'Cash', alias: 'Pay by Cash', icon: 'payments', emoji: '💵', supportsRefund: false, isDigital: false },
  // Legacy
  upi: { key: 'upi', label: 'UPI', alias: 'Pay via UPI', icon: 'account-balance', emoji: '💳', supportsRefund: true, isDigital: true },
  credit_card: { key: 'credit_card', label: 'Credit Card', alias: 'Credit Card', icon: 'credit-card', emoji: '💳', supportsRefund: true, isDigital: true },
  debit_card: { key: 'debit_card', label: 'Debit Card', alias: 'Debit Card', icon: 'credit-card', emoji: '💳', supportsRefund: true, isDigital: true },
  net_banking: { key: 'net_banking', label: 'Net Banking', alias: 'Internet Banking', icon: 'account-balance', emoji: '🏦', supportsRefund: true, isDigital: true },
  wallet: { key: 'wallet', label: 'Swibber Wallet', alias: 'SwibberPay', icon: 'account-balance-wallet', emoji: '👛', supportsRefund: true, isDigital: true },
};

// ─────────────────────────────────────────────
// 4. Service Types
// ─────────────────────────────────────────────
export const ServiceTypeEnum = {
  RIDE: 'ride',
  FOOD: 'food',
  PARCEL: 'parcel',
} as const;

export type ServiceType = (typeof ServiceTypeEnum)[keyof typeof ServiceTypeEnum];

export interface ServiceTypeConfig {
  key: ServiceType;
  label: string;
  alias: string;
  icon: string;
  emoji: string;
  gradient: string[];
  description: string;
  ctaLabel: string;
}

export const serviceTypeConfigs: Record<ServiceType, ServiceTypeConfig> = {
  ride: {
    key: 'ride', label: 'Ride', alias: 'SwibberRide', icon: 'directions-car', emoji: '🚗',
    gradient: ['#4C35E8', '#00D4FF'], description: 'Book a ride instantly', ctaLabel: 'Book Ride',
  },
  food: {
    key: 'food', label: 'Food', alias: 'SwibberEats', icon: 'restaurant', emoji: '🍔',
    gradient: ['#FF6B6B', '#FF9500'], description: 'Food delivered fast', ctaLabel: 'Order Food',
  },
  parcel: {
    key: 'parcel', label: 'Parcel', alias: 'SwibberSend', icon: 'local-shipping', emoji: '📦',
    gradient: ['#00C853', '#00D4FF'], description: 'Send anything, anywhere', ctaLabel: 'Send Parcel',
  },
};

// ─────────────────────────────────────────────
// 5. Package Types
// ─────────────────────────────────────────────
export const PackageTypeEnum = {
  DOCUMENTS: 'documents',
  ELECTRONICS: 'electronics',
  FOOD_ITEMS: 'food_items',
  CLOTHING: 'clothing',
  FRAGILE: 'fragile',
  MEDICINE: 'medicine',
  OTHER: 'other',
} as const;

export type PackageType = (typeof PackageTypeEnum)[keyof typeof PackageTypeEnum];

export interface PackageTypeConfig {
  key: PackageType;
  label: string;
  alias: string;
  icon: string;
  emoji: string;
  maxWeightKg: number;
  handlingNote: string;
}

export const packageTypeConfigs: Record<PackageType, PackageTypeConfig> = {
  documents: { key: 'documents', label: 'Documents', alias: 'Docs & Files', icon: 'description', emoji: '📄', maxWeightKg: 2, handlingNote: 'Keep dry' },
  electronics: { key: 'electronics', label: 'Electronics', alias: 'Gadgets', icon: 'devices', emoji: '📱', maxWeightKg: 10, handlingNote: 'Handle with care' },
  food_items: { key: 'food_items', label: 'Food Items', alias: 'Food', icon: 'lunch-dining', emoji: '🍱', maxWeightKg: 5, handlingNote: 'Keep upright' },
  clothing: { key: 'clothing', label: 'Clothing', alias: 'Clothes', icon: 'checkroom', emoji: '👕', maxWeightKg: 10, handlingNote: 'No special handling' },
  fragile: { key: 'fragile', label: 'Fragile', alias: 'Fragile Items', icon: 'warning', emoji: '🏺', maxWeightKg: 8, handlingNote: 'Extremely fragile' },
  medicine: { key: 'medicine', label: 'Medicine', alias: 'Medical', icon: 'medical-services', emoji: '💊', maxWeightKg: 3, handlingNote: 'Keep cool if needed' },
  other: { key: 'other', label: 'Other', alias: 'Miscellaneous', icon: 'inventory-2', emoji: '📦', maxWeightKg: 15, handlingNote: 'Standard handling' },
};

// ─────────────────────────────────────────────
// 6. Membership Tiers
// ─────────────────────────────────────────────
export const MembershipTierEnum = {
  BRONZE:   'bronze',
  GOLD:     'gold',
  PLATINUM: 'platinum',
} as const;

export type MembershipTier = (typeof MembershipTierEnum)[keyof typeof MembershipTierEnum];

export interface MembershipTierConfig {
  key: MembershipTier;
  label: string;
  alias: string;
  color: string;
  gradient: string[];
  pointsRequired: number;
  benefits: string[];
  cashbackRate: number;
  emoji: string;
  monthlyPrice: number;
  freeDelivery: boolean;
  surgeProtected: boolean;
}

export const membershipTierConfigs: Record<MembershipTier, MembershipTierConfig> = {
  bronze: {
    key: 'bronze', label: 'Bronze', alias: 'Swibber Bronze', color: '#CD7F32',
    gradient: ['#CD7F32', '#8B5E3C'], pointsRequired: 0,
    benefits: [
      '5% cashback on every ride',
      'Access to all Swibber services',
      'Standard customer support',
    ],
    cashbackRate: 0.05, emoji: '🥉',
    monthlyPrice: 0, freeDelivery: false, surgeProtected: false,
  },
  gold: {
    key: 'gold', label: 'Gold', alias: 'Swibber Gold', color: '#FFD700',
    gradient: ['#FFD700', '#FF9500'], pointsRequired: 2000,
    benefits: [
      '15% cashback on rides & parcels',
      'Free parcel delivery (base fee waived)',
      'Surge price protection — never pay surge',
      'Priority customer support',
      'Early access to new features',
    ],
    cashbackRate: 0.15, emoji: '🥇',
    monthlyPrice: 999, freeDelivery: true, surgeProtected: true,
  },
  platinum: {
    key: 'platinum', label: 'Platinum', alias: 'Swibber Platinum', color: '#E5E4E2',
    gradient: ['#4C35E8', '#7B2FBE'], pointsRequired: 5000,
    benefits: [
      '20% cashback on everything',
      'Zero delivery charges on all parcels',
      'No surge pricing — ever',
      'Dedicated account manager',
      'Airport priority rides',
      'Exclusive member events & offers',
    ],
    cashbackRate: 0.20, emoji: '💎',
    monthlyPrice: 1999, freeDelivery: true, surgeProtected: true,
  },
};

// ─────────────────────────────────────────────
// 7. Notification Types
// ─────────────────────────────────────────────
export const NotificationTypeEnum = {
  RIDE_UPDATE: 'ride_update',
  FOOD_UPDATE: 'food_update',
  PARCEL_UPDATE: 'parcel_update',
  PROMO: 'promo',
  SYSTEM: 'system',
  PAYMENT: 'payment',
  REWARD: 'reward',
} as const;

export type NotificationType = (typeof NotificationTypeEnum)[keyof typeof NotificationTypeEnum];

export interface NotificationTypeConfig {
  key: NotificationType;
  label: string;
  alias: string;
  icon: string;
  color: string;
  emoji: string;
}

export const notificationTypeConfigs: Record<NotificationType, NotificationTypeConfig> = {
  ride_update: { key: 'ride_update', label: 'Ride Update', alias: 'Ride Alert', icon: 'directions-car', color: '#4C35E8', emoji: '🚗' },
  food_update: { key: 'food_update', label: 'Food Update', alias: 'Order Alert', icon: 'restaurant', color: '#FF9500', emoji: '🍔' },
  parcel_update: { key: 'parcel_update', label: 'Parcel Update', alias: 'Delivery Alert', icon: 'local-shipping', color: '#00C853', emoji: '📦' },
  promo: { key: 'promo', label: 'Promotion', alias: 'Offer Alert', icon: 'local-offer', color: '#7B2FBE', emoji: '🎁' },
  system: { key: 'system', label: 'System', alias: 'App Update', icon: 'info', color: '#007AFF', emoji: 'ℹ️' },
  payment: { key: 'payment', label: 'Payment', alias: 'Transaction Alert', icon: 'payment', color: '#00C853', emoji: '💳' },
  reward: { key: 'reward', label: 'Reward', alias: 'Points Update', icon: 'star', color: '#FFD700', emoji: '⭐' },
};

// ─────────────────────────────────────────────
// 8. Cuisine Types
// ─────────────────────────────────────────────
export const CuisineTypeEnum = {
  INDIAN: 'indian',
  NORTH_INDIAN: 'north_indian',
  SOUTH_INDIAN: 'south_indian',
  CHINESE: 'chinese',
  ITALIAN: 'italian',
  PIZZA: 'pizza',
  BURGER: 'burger',
  BIRYANI: 'biryani',
  MEXICAN: 'mexican',
  THAI: 'thai',
  JAPANESE: 'japanese',
  AMERICAN: 'american',
  CONTINENTAL: 'continental',
  DESSERTS: 'desserts',
  BEVERAGES: 'beverages',
} as const;

export type CuisineType = (typeof CuisineTypeEnum)[keyof typeof CuisineTypeEnum];

export interface CuisineTypeConfig {
  key: CuisineType;
  label: string;
  alias: string;
  emoji: string;
  color: string;
}

export const cuisineTypeConfigs: Record<CuisineType, CuisineTypeConfig> = {
  indian: { key: 'indian', label: 'Indian', alias: 'Desi Food', emoji: '🍛', color: '#FF9500' },
  north_indian: { key: 'north_indian', label: 'North Indian', alias: 'North Indian', emoji: '🍛', color: '#FF9500' },
  south_indian: { key: 'south_indian', label: 'South Indian', alias: 'South Indian', emoji: '🥞', color: '#FF6B6B' },
  chinese: { key: 'chinese', label: 'Chinese', alias: 'Chinese', emoji: '🍜', color: '#FF3B30' },
  italian: { key: 'italian', label: 'Italian', alias: 'Italian', emoji: '🍕', color: '#FF6B6B' },
  pizza: { key: 'pizza', label: 'Pizza', alias: 'Pizza', emoji: '🍕', color: '#FF3B30' },
  burger: { key: 'burger', label: 'Burger', alias: 'Burgers', emoji: '🍔', color: '#FF9500' },
  biryani: { key: 'biryani', label: 'Biryani', alias: 'Biryani', emoji: '🍚', color: '#7B2FBE' },
  mexican: { key: 'mexican', label: 'Mexican', alias: 'Mexican', emoji: '🌮', color: '#FF9500' },
  thai: { key: 'thai', label: 'Thai', alias: 'Thai', emoji: '🍲', color: '#00C853' },
  japanese: { key: 'japanese', label: 'Japanese', alias: 'Japanese', emoji: '🍣', color: '#FF3B30' },
  american: { key: 'american', label: 'American', alias: 'Fast Food', emoji: '🍔', color: '#FF9500' },
  continental: { key: 'continental', label: 'Continental', alias: 'World Food', emoji: '🥗', color: '#4C35E8' },
  desserts: { key: 'desserts', label: 'Desserts', alias: 'Sweets', emoji: '🍰', color: '#FF6B6B' },
  beverages: { key: 'beverages', label: 'Beverages', alias: 'Drinks', emoji: '☕', color: '#7B2FBE' },
};

// ─────────────────────────────────────────────
// 9. Address Types
// ─────────────────────────────────────────────
export const AddressTypeEnum = {
  HOME: 'home',
  WORK: 'work',
  OTHER: 'other',
} as const;

export type AddressType = (typeof AddressTypeEnum)[keyof typeof AddressTypeEnum];

export interface AddressTypeConfig {
  key: AddressType;
  label: string;
  alias: string;
  icon: string;
  emoji: string;
}

export const addressTypeConfigs: Record<AddressType, AddressTypeConfig> = {
  home: { key: 'home', label: 'Home', alias: 'My Home', icon: 'home', emoji: '🏠' },
  work: { key: 'work', label: 'Work', alias: 'Office', icon: 'business', emoji: '🏢' },
  other: { key: 'other', label: 'Other', alias: 'Other Place', icon: 'location-on', emoji: '📍' },
};

// ─────────────────────────────────────────────
// 10. Surge Pricing Levels
// ─────────────────────────────────────────────
export const SurgeLevelEnum = {
  NONE: 'none',
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
} as const;

export type SurgeLevel = (typeof SurgeLevelEnum)[keyof typeof SurgeLevelEnum];

export interface SurgeLevelConfig {
  key: SurgeLevel;
  label: string;
  alias: string;
  multiplier: number;
  color: string;
  description: string;
}

export const surgeLevelConfigs: Record<SurgeLevel, SurgeLevelConfig> = {
  none: { key: 'none', label: 'Normal', alias: 'Normal Fare', multiplier: 1.0, color: '#00C853', description: 'Regular pricing applies' },
  low: { key: 'low', label: 'Low Surge', alias: 'Slightly Busy', multiplier: 1.25, color: '#FF9500', description: 'Slightly high demand' },
  medium: { key: 'medium', label: 'Surge 1.5x', alias: 'Busy', multiplier: 1.5, color: '#FF6B6B', description: 'High demand in your area' },
  high: { key: 'high', label: 'Surge 2x', alias: 'Very Busy', multiplier: 2.0, color: '#FF3B30', description: 'Very high demand — fare is doubled' },
};

// ─────────────────────────────────────────────
// 11. Transaction Types
// ─────────────────────────────────────────────
export const TransactionTypeEnum = {
  CREDIT: 'credit',
  DEBIT: 'debit',
  REFUND: 'refund',
  CASHBACK: 'cashback',
} as const;

export type TransactionType = (typeof TransactionTypeEnum)[keyof typeof TransactionTypeEnum];

export interface TransactionTypeConfig {
  key: TransactionType;
  label: string;
  alias: string;
  color: string;
  icon: string;
  sign: '+' | '-';
}

export const transactionTypeConfigs: Record<TransactionType, TransactionTypeConfig> = {
  credit: { key: 'credit', label: 'Credit', alias: 'Money Added', color: '#00C853', icon: 'add-circle', sign: '+' },
  debit: { key: 'debit', label: 'Debit', alias: 'Money Spent', color: '#FF3B30', icon: 'remove-circle', sign: '-' },
  refund: { key: 'refund', label: 'Refund', alias: 'Refunded', color: '#4C35E8', icon: 'replay', sign: '+' },
  cashback: { key: 'cashback', label: 'Cashback', alias: 'Reward Cashback', color: '#7B2FBE', icon: 'star', sign: '+' },
};

// ─────────────────────────────────────────────
// 12. Wallet Actions
// ─────────────────────────────────────────────
export const WalletActionEnum = {
  ADD_MONEY: 'add_money',
  SEND: 'send',
  WITHDRAW: 'withdraw',
} as const;

export type WalletAction = (typeof WalletActionEnum)[keyof typeof WalletActionEnum];

export interface WalletActionConfig {
  key: WalletAction;
  label: string;
  alias: string;
  icon: string;
}

export const walletActionConfigs: Record<WalletAction, WalletActionConfig> = {
  add_money: { key: 'add_money', label: 'Add Money', alias: 'Top Up', icon: 'add' },
  send: { key: 'send', label: 'Send', alias: 'Transfer', icon: 'send' },
  withdraw: { key: 'withdraw', label: 'Withdraw', alias: 'Cash Out', icon: 'account-balance' },
};

// ─────────────────────────────────────────────
// 13. Transaction Filters
// ─────────────────────────────────────────────
export const TransactionFilterEnum = {
  ALL: 'all',
  CREDIT: 'credit',
  DEBIT: 'debit',
} as const;

export type TransactionFilter = (typeof TransactionFilterEnum)[keyof typeof TransactionFilterEnum];

export interface TransactionFilterConfig {
  key: TransactionFilter;
  label: string;
  alias: string;
}

export const transactionFilterConfigs: Record<TransactionFilter, TransactionFilterConfig> = {
  all: { key: 'all', label: 'All', alias: 'All' },
  credit: { key: 'credit', label: 'Credit', alias: 'In' },
  debit: { key: 'debit', label: 'Debit', alias: 'Out' },
};

// ─────────────────────────────────────────────
// 14. Message Senders
// ─────────────────────────────────────────────
export const MessageSenderEnum = {
  USER: 'user',
  DRIVER: 'driver',
  SUPPORT_AGENT: 'support_agent',
} as const;

export type MessageSender = (typeof MessageSenderEnum)[keyof typeof MessageSenderEnum];

export interface MessageSenderConfig {
  key: MessageSender;
  label: string;
  alias: string;
}

export const messageSenderConfigs: Record<MessageSender, MessageSenderConfig> = {
  user: { key: 'user', label: 'User', alias: 'You' },
  driver: { key: 'driver', label: 'Driver', alias: 'Driver' },
  support_agent: { key: 'support_agent', label: 'Support Agent', alias: 'Swibber Support' },
};

// ─────────────────────────────────────────────
// 15. Ride Status
// ─────────────────────────────────────────────
export const RideStatusEnum = {
  SEARCHING:        'searching',
  DRIVER_ASSIGNED:  'driver_assigned',
  DRIVER_ARRIVING:  'driver_arriving',
  DRIVER_ARRIVED:   'driver_arrived',
  IN_PROGRESS:      'in_progress',
  COMPLETED:        'completed',
  CANCELLED:        'cancelled',
} as const;

export type RideStatus = (typeof RideStatusEnum)[keyof typeof RideStatusEnum];

export interface RideStatusConfig {
  key: RideStatus;
  label: string;
  alias: string;
  icon: string;
  color: string;
  emoji: string;
  step: number;
  isTerminal: boolean;
  isActive: boolean;
}

export const rideStatusConfigs: Record<RideStatus, RideStatusConfig> = {
  searching:       { key: 'searching',       label: 'Searching',        alias: 'Finding Driver',    icon: 'search',              color: '#FF9500', emoji: '🔍', step: 0, isTerminal: false, isActive: true },
  driver_assigned: { key: 'driver_assigned', label: 'Driver Assigned',  alias: 'Driver Found',      icon: 'person',              color: '#4C35E8', emoji: '🧑‍💼', step: 1, isTerminal: false, isActive: true },
  driver_arriving: { key: 'driver_arriving', label: 'Driver Arriving',  alias: 'On the Way',        icon: 'directions-car',      color: '#007AFF', emoji: '🚗', step: 2, isTerminal: false, isActive: true },
  driver_arrived:  { key: 'driver_arrived',  label: 'Driver Arrived',   alias: 'Driver is Here',    icon: 'location-on',         color: '#00C853', emoji: '📍', step: 3, isTerminal: false, isActive: true },
  in_progress:     { key: 'in_progress',     label: 'Ride Started',     alias: 'En Route',          icon: 'navigation',          color: '#4C35E8', emoji: '🛣️', step: 4, isTerminal: false, isActive: true },
  completed:       { key: 'completed',       label: 'Completed',        alias: 'Ride Complete',     icon: 'check-circle',        color: '#00C853', emoji: '✅', step: 5, isTerminal: true,  isActive: false },
  cancelled:       { key: 'cancelled',       label: 'Cancelled',        alias: 'Ride Cancelled',    icon: 'cancel',              color: '#FF3B30', emoji: '❌', step: -1, isTerminal: true, isActive: false },
};

// ─────────────────────────────────────────────
// 16. Driver Simulation Modes (dev/demo)
// ─────────────────────────────────────────────
export const DriverSimModeEnum = {
  OFF:      'off',
  STATIC:   'static',
  MOVING:   'moving',
  ARRIVING: 'arriving',
} as const;

export type DriverSimMode = (typeof DriverSimModeEnum)[keyof typeof DriverSimModeEnum];

export interface DriverSimModeConfig {
  key: DriverSimMode;
  label: string;
  alias: string;
  description: string;
  updateIntervalMs: number;
}

export const driverSimModeConfigs: Record<DriverSimMode, DriverSimModeConfig> = {
  off:      { key: 'off',      label: 'Off',      alias: 'Disabled',        description: 'Use real driver data',          updateIntervalMs: 0    },
  static:   { key: 'static',   label: 'Static',   alias: 'Fixed Position',  description: 'Driver stays put (debug)',      updateIntervalMs: 0    },
  moving:   { key: 'moving',   label: 'Moving',   alias: 'Simulate Route',  description: 'Simulate driver approaching',   updateIntervalMs: 2000 },
  arriving: { key: 'arriving', label: 'Arriving', alias: 'Fast Approach',   description: 'Fast arrival simulation',       updateIntervalMs: 1000 },
};

// ─────────────────────────────────────────────
// 17. Map Route States
// ─────────────────────────────────────────────
export const MapRouteStateEnum = {
  IDLE:     'idle',
  LOADING:  'loading',
  READY:    'ready',
  ERROR:    'error',
  STALE:    'stale',
} as const;

export type MapRouteState = (typeof MapRouteStateEnum)[keyof typeof MapRouteStateEnum];

// ─────────────────────────────────────────────
// 18. Parcel Status
// ─────────────────────────────────────────────
export const ParcelStatusEnum = {
  SEARCHING_RIDER:  'searching_rider',
  RIDER_ASSIGNED:   'rider_assigned',
  PICKUP_ARRIVED:   'pickup_arrived',
  PICKED_UP:        'picked_up',
  IN_TRANSIT:       'in_transit',
  NEAR_DESTINATION: 'near_destination',
  DELIVERED:        'delivered',
  CANCELLED:        'cancelled',
} as const;

export type ParcelStatus = (typeof ParcelStatusEnum)[keyof typeof ParcelStatusEnum];

export interface ParcelStatusConfig {
  key: ParcelStatus;
  label: string;
  alias: string;
  icon: string;
  color: string;
  emoji: string;
  step: number;
  isTerminal: boolean;
  isActive: boolean;
}

export const parcelStatusConfigs: Record<ParcelStatus, ParcelStatusConfig> = {
  searching_rider:  { key: 'searching_rider',  label: 'Searching Rider',  alias: 'Looking for Rider',  icon: 'search',          color: '#FF9500', emoji: '🔍', step: 0,  isTerminal: false, isActive: true  },
  rider_assigned:   { key: 'rider_assigned',   label: 'Rider Assigned',   alias: 'Rider Found',        icon: 'person',          color: '#4C35E8', emoji: '🧑', step: 1,  isTerminal: false, isActive: true  },
  pickup_arrived:   { key: 'pickup_arrived',   label: 'Rider at Pickup',  alias: 'Rider at Pickup',    icon: 'location-on',     color: '#007AFF', emoji: '📍', step: 2,  isTerminal: false, isActive: true  },
  picked_up:        { key: 'picked_up',        label: 'Picked Up',        alias: 'Parcel Picked Up',   icon: 'inventory-2',     color: '#7B2FBE', emoji: '📦', step: 3,  isTerminal: false, isActive: true  },
  in_transit:       { key: 'in_transit',       label: 'In Transit',       alias: 'In Transit',         icon: 'local-shipping',  color: '#00D4FF', emoji: '🚚', step: 4,  isTerminal: false, isActive: true  },
  near_destination: { key: 'near_destination', label: 'Near Destination', alias: 'Almost Delivered',   icon: 'near-me',         color: '#00C853', emoji: '🎯', step: 5,  isTerminal: false, isActive: true  },
  delivered:        { key: 'delivered',        label: 'Delivered',        alias: 'Parcel Delivered',   icon: 'check-circle',    color: '#00C853', emoji: '✅', step: 6,  isTerminal: true,  isActive: false },
  cancelled:        { key: 'cancelled',        label: 'Cancelled',        alias: 'Parcel Cancelled',   icon: 'cancel',          color: '#FF3B30', emoji: '❌', step: -1, isTerminal: true,  isActive: false },
};

// ─────────────────────────────────────────────
// 19. Driver Status
// ─────────────────────────────────────────────
export const DriverStatusEnum = {
  ONLINE:   'online',
  OFFLINE:  'offline',
  ON_TRIP:  'on_trip',
  ON_BREAK: 'on_break',
} as const;

export type DriverStatus = (typeof DriverStatusEnum)[keyof typeof DriverStatusEnum];

export interface DriverStatusConfig {
  key: DriverStatus;
  label: string;
  alias: string;
  color: string;
  icon: string;
  emoji: string;
  isAvailableForRide: boolean;
}

export const driverStatusConfigs: Record<DriverStatus, DriverStatusConfig> = {
  online:   { key: 'online',   label: 'Online',   alias: 'Available',     color: '#00C853', icon: 'wifi',                  emoji: '🟢', isAvailableForRide: true  },
  offline:  { key: 'offline',  label: 'Offline',  alias: 'Offline',       color: '#8E8E93', icon: 'wifi-off',              emoji: '⚫', isAvailableForRide: false },
  on_trip:  { key: 'on_trip',  label: 'On Trip',  alias: 'On a Ride',     color: '#4C35E8', icon: 'directions-car',        emoji: '🚗', isAvailableForRide: false },
  on_break: { key: 'on_break', label: 'On Break', alias: 'Taking a Break',color: '#FF9500', icon: 'pause-circle-outline',  emoji: '⏸', isAvailableForRide: false },
};

// ─────────────────────────────────────────────
// 20. User Roles
// ─────────────────────────────────────────────
export const UserRoleEnum = {
  USER:   'user',
  DRIVER: 'driver',
  ADMIN:  'admin',
} as const;

export type UserRole = (typeof UserRoleEnum)[keyof typeof UserRoleEnum];

export interface UserRoleConfig {
  key: UserRole;
  label: string;
  alias: string;
  icon: string;
  emoji: string;
}

export const userRoleConfigs: Record<UserRole, UserRoleConfig> = {
  user:   { key: 'user',   label: 'User',   alias: 'Passenger', icon: 'person',               emoji: '👤' },
  driver: { key: 'driver', label: 'Driver', alias: 'Driver',    icon: 'directions-car',        emoji: '🚗' },
  admin:  { key: 'admin',  label: 'Admin',  alias: 'Admin',     icon: 'admin-panel-settings',  emoji: '🛡' },
};

// ─────────────────────────────────────────────
// 21. Payment Status
// ─────────────────────────────────────────────
export const PaymentStatusEnum = {
  PENDING:  'pending',
  PAID:     'paid',
  REFUNDED: 'refunded',
  FAILED:   'failed',
} as const;

export type PaymentStatus = (typeof PaymentStatusEnum)[keyof typeof PaymentStatusEnum];

export interface PaymentStatusConfig {
  key: PaymentStatus;
  label: string;
  alias: string;
  color: string;
  icon: string;
  emoji: string;
}

export const paymentStatusConfigs: Record<PaymentStatus, PaymentStatusConfig> = {
  pending:  { key: 'pending',  label: 'Pending',  alias: 'Payment Pending', color: '#FF9500', icon: 'access-time',  emoji: '⏳' },
  paid:     { key: 'paid',     label: 'Paid',     alias: 'Payment Done',    color: '#00C853', icon: 'check-circle', emoji: '✅' },
  refunded: { key: 'refunded', label: 'Refunded', alias: 'Amount Refunded', color: '#4C35E8', icon: 'replay',       emoji: '↩' },
  failed:   { key: 'failed',   label: 'Failed',   alias: 'Payment Failed',  color: '#FF3B30', icon: 'cancel',       emoji: '❌' },
};

// ─────────────────────────────────────────────
// 22. Transaction Status
// ─────────────────────────────────────────────
export const TransactionStatusEnum = {
  PENDING:  'pending',
  SUCCESS:  'success',
  FAILED:   'failed',
  REVERSED: 'reversed',
} as const;

export type TransactionStatus = (typeof TransactionStatusEnum)[keyof typeof TransactionStatusEnum];

export interface TransactionStatusConfig {
  key: TransactionStatus;
  label: string;
  alias: string;
  color: string;
  icon: string;
}

export const transactionStatusConfigs: Record<TransactionStatus, TransactionStatusConfig> = {
  pending:  { key: 'pending',  label: 'Pending',  alias: 'Processing', color: '#FF9500', icon: 'access-time'  },
  success:  { key: 'success',  label: 'Success',  alias: 'Completed',  color: '#00C853', icon: 'check-circle' },
  failed:   { key: 'failed',   label: 'Failed',   alias: 'Failed',     color: '#FF3B30', icon: 'error'        },
  reversed: { key: 'reversed', label: 'Reversed', alias: 'Reversed',   color: '#8E8E93', icon: 'replay'       },
};

// ─────────────────────────────────────────────
// 23. Cancelled By
// ─────────────────────────────────────────────
export const CancelledByEnum = {
  USER:   'user',
  DRIVER: 'driver',
  SYSTEM: 'system',
} as const;

export type CancelledBy = (typeof CancelledByEnum)[keyof typeof CancelledByEnum];

export interface CancelledByConfig {
  key: CancelledBy;
  label: string;
  alias: string;
  emoji: string;
}

export const cancelledByConfigs: Record<CancelledBy, CancelledByConfig> = {
  user:   { key: 'user',   label: 'User',   alias: 'Cancelled by you',    emoji: '👤' },
  driver: { key: 'driver', label: 'Driver', alias: 'Cancelled by driver', emoji: '🚗' },
  system: { key: 'system', label: 'System', alias: 'Auto-cancelled',      emoji: '🤖' },
};

// ─────────────────────────────────────────────
// Runtime Alias Override Service
// Allows DB/API to override display aliases at runtime
// ─────────────────────────────────────────────
// ─────────────────────────────────────────────
// 24. Maps / Routing / Geocoding
// ─────────────────────────────────────────────
export const MapProviderEnum = {
  OSM:    'osm',
  GOOGLE: 'google',
} as const;
export type MapProvider = (typeof MapProviderEnum)[keyof typeof MapProviderEnum];

export const GeocodingProviderEnum = {
  NOMINATIM: 'nominatim',
  GOOGLE:    'google',
} as const;
export type GeocodingProvider = (typeof GeocodingProviderEnum)[keyof typeof GeocodingProviderEnum];

export const RoutingProviderEnum = {
  OSRM:   'osrm',
  GOOGLE: 'google',
} as const;
export type RoutingProvider = (typeof RoutingProviderEnum)[keyof typeof RoutingProviderEnum];

export const ETASourceEnum = {
  OSRM:               'osrm',
  OSRM_ESTIMATE:      'osrm_estimate',
  HAVERSINE_FALLBACK: 'haversine_fallback',
} as const;
export type ETASource = (typeof ETASourceEnum)[keyof typeof ETASourceEnum];

export interface ETASourceConfig {
  key: ETASource;
  alias: string;
  confidenceLevel: 'high' | 'medium' | 'low';
}

export const etaSourceConfigs: Record<ETASource, ETASourceConfig> = {
  osrm:               { key: 'osrm',               alias: 'OSRM Routing',       confidenceLevel: 'high'   },
  osrm_estimate:      { key: 'osrm_estimate',       alias: 'OSRM Estimate',      confidenceLevel: 'medium' },
  haversine_fallback: { key: 'haversine_fallback',  alias: 'Estimated Distance', confidenceLevel: 'low'    },
};

// ─────────────────────────────────────────────
// Runtime Alias Override Service
// Allows DB/API to override display aliases at runtime
// ─────────────────────────────────────────────
type EnumRegistryKey =
  | 'vehicle'
  | 'orderStatus'
  | 'paymentMethod'
  | 'serviceType'
  | 'packageType'
  | 'membershipTier'
  | 'notificationType'
  | 'cuisineType'
  | 'addressType'
  | 'surgeLevel'
  | 'transactionType'
  | 'walletAction'
  | 'transactionFilter'
  | 'messageSender'
  | 'googleSignInError'
  | 'rideStatus'
  | 'driverSimMode'
  | 'parcelStatus'
  | 'driverStatus'
  | 'userRole'
  | 'paymentStatus'
  | 'transactionStatus'
  | 'cancelledBy'
  | 'etaSource';

type AliasOverrideMap = Partial<Record<string, string>>;

const _overrides: Record<EnumRegistryKey, AliasOverrideMap> = {
  vehicle: {},
  orderStatus: {},
  paymentMethod: {},
  serviceType: {},
  packageType: {},
  membershipTier: {},
  notificationType: {},
  cuisineType: {},
  addressType: {},
  surgeLevel: {},
  transactionType: {},
  walletAction: {},
  transactionFilter: {},
  messageSender: {},
  googleSignInError: {},
  rideStatus: {},
  driverSimMode: {},
  parcelStatus: {},
  driverStatus: {},
  userRole: {},
  paymentStatus: {},
  transactionStatus: {},
  cancelledBy: {},
  etaSource: {},
};

export const EnumAliasService = {
  /** Apply a batch of overrides (call once when app boots with DB config) */
  applyOverrides(registry: EnumRegistryKey, overrides: AliasOverrideMap): void {
    Object.assign(_overrides[registry], overrides);
  },

  /** Get the current alias for a given key (falls back to config default) */
  getAlias(registry: EnumRegistryKey, key: string, fallback: string): string {
    return _overrides[registry][key] ?? fallback;
  },

  /** Override a single alias */
  setAlias(registry: EnumRegistryKey, key: string, alias: string): void {
    _overrides[registry][key] = alias;
  },

  /** Serialise all overrides for persistence */
  exportOverrides(): Record<EnumRegistryKey, AliasOverrideMap> {
    return JSON.parse(JSON.stringify(_overrides));
  },
};
