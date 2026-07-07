/**
 * Centralised enum definitions for the Swibber backend.
 *
 * ARCHITECTURE RULE:
 *  - Every enum is a `const XEnum = {...} as const` object — runtime-serialisable
 *    AND compile-time type source. Never use TypeScript `enum` keyword.
 *  - `export type X = (typeof XEnum)[keyof typeof XEnum]` — the type is derived
 *    from the value, preventing value/type drift.
 *  - Lifecycle enums (Ride, Parcel, Order) ship an `*Config` record with
 *    `isTerminal` so guards and exhaustive switches reference config, not magic strings.
 *  - Mongoose schemas use `Object.values(XEnum)` for the `enum` constraint, keeping
 *    schema and TS type permanently in sync.
 *  - Aliases can be overridden per-service via the EnumConfig MongoDB model.
 *  - Frontend mirrors this file — keep in sync.
 */

// ─── Auth ────────────────────────────────────────────────────────────────────

export const AuthProviderEnum = {
  GOOGLE: 'google',
  APPLE:  'apple',
  PHONE:  'phone',
  EMAIL:  'email',
} as const;
export type AuthProvider = (typeof AuthProviderEnum)[keyof typeof AuthProviderEnum];

export const AuthPlatformEnum = {
  IOS:     'ios',
  ANDROID: 'android',
  BOTH:    'both',
} as const;
export type AuthPlatform = (typeof AuthPlatformEnum)[keyof typeof AuthPlatformEnum];

// ─── Users ───────────────────────────────────────────────────────────────────

export const UserRoleEnum = {
  USER:   'user',
  DRIVER: 'driver',
  ADMIN:  'admin',
} as const;
export type UserRole = (typeof UserRoleEnum)[keyof typeof UserRoleEnum];

export const MembershipTierEnum = {
  BRONZE:   'bronze',
  GOLD:     'gold',
  PLATINUM: 'platinum',
} as const;
export type MembershipTier = (typeof MembershipTierEnum)[keyof typeof MembershipTierEnum];

export interface MembershipTierConfig {
  key: MembershipTier;
  alias: string;
  pointsRequired: number;
  cashbackRate: number;
  surgeProtected: boolean;
  freeDelivery: boolean;
  monthlyPrice: number;
}

export const membershipTierConfigs: Record<MembershipTier, MembershipTierConfig> = {
  bronze:   { key: 'bronze',   alias: 'Swibber Bronze',   pointsRequired: 0,    cashbackRate: 0.05, surgeProtected: false, freeDelivery: false, monthlyPrice: 0    },
  gold:     { key: 'gold',     alias: 'Swibber Gold',     pointsRequired: 2000, cashbackRate: 0.15, surgeProtected: true,  freeDelivery: true,  monthlyPrice: 999  },
  platinum: { key: 'platinum', alias: 'Swibber Platinum', pointsRequired: 5000, cashbackRate: 0.20, surgeProtected: true,  freeDelivery: true,  monthlyPrice: 1999 },
};

export const AddressTypeEnum = {
  HOME:  'home',
  WORK:  'work',
  OTHER: 'other',
} as const;
export type AddressType = (typeof AddressTypeEnum)[keyof typeof AddressTypeEnum];

// ─── Vehicles ────────────────────────────────────────────────────────────────

export const VehicleTypeEnum = {
  BIKE:    'bike',
  AUTO:    'auto',
  MINI:    'mini',
  SEDAN:   'sedan',
  XL:      'xl',
  PREMIUM: 'premium',
} as const;
export type VehicleType = (typeof VehicleTypeEnum)[keyof typeof VehicleTypeEnum];

// ─── Ride Status ─────────────────────────────────────────────────────────────

export const RideStatusEnum = {
  SEARCHING:       'searching',
  DRIVER_ASSIGNED: 'driver_assigned',
  DRIVER_ARRIVING: 'driver_arriving',
  DRIVER_ARRIVED:  'driver_arrived',
  IN_PROGRESS:     'in_progress',
  COMPLETED:       'completed',
  CANCELLED:       'cancelled',
} as const;
export type RideStatus = (typeof RideStatusEnum)[keyof typeof RideStatusEnum];

export interface RideStatusConfig {
  key: RideStatus;
  alias: string;
  label: string;
  icon: string;
  color: string;
  step: number;
  isTerminal: boolean;
  isActive: boolean;
}

export const rideStatusConfigs: Record<RideStatus, RideStatusConfig> = {
  searching:       { key: 'searching',       alias: 'Finding Driver',  label: 'Searching',       icon: 'search',         color: '#FF9500', step: 0,  isTerminal: false, isActive: true  },
  driver_assigned: { key: 'driver_assigned', alias: 'Driver Found',    label: 'Driver Assigned', icon: 'person',         color: '#4C35E8', step: 1,  isTerminal: false, isActive: true  },
  driver_arriving: { key: 'driver_arriving', alias: 'On the Way',      label: 'Driver Arriving', icon: 'directions-car', color: '#007AFF', step: 2,  isTerminal: false, isActive: true  },
  driver_arrived:  { key: 'driver_arrived',  alias: 'Driver is Here',  label: 'Driver Arrived',  icon: 'location-on',    color: '#00C853', step: 3,  isTerminal: false, isActive: true  },
  in_progress:     { key: 'in_progress',     alias: 'En Route',        label: 'Ride Started',    icon: 'navigation',     color: '#4C35E8', step: 4,  isTerminal: false, isActive: true  },
  completed:       { key: 'completed',       alias: 'Ride Complete',   label: 'Completed',       icon: 'check-circle',   color: '#00C853', step: 5,  isTerminal: true,  isActive: false },
  cancelled:       { key: 'cancelled',       alias: 'Ride Cancelled',  label: 'Cancelled',       icon: 'cancel',         color: '#FF3B30', step: -1, isTerminal: true,  isActive: false },
};

// ─── Payment ──────────────────────────────────────────────────────────────────

export const PaymentMethodEnum = {
  RAZORPAY:    'razorpay',
  CASH:        'cash',
  // Legacy values kept so existing DB records remain valid
  UPI:         'upi',
  CREDIT_CARD: 'credit_card',
  DEBIT_CARD:  'debit_card',
  NET_BANKING: 'net_banking',
  WALLET:      'wallet',
} as const;
export type PaymentMethod = (typeof PaymentMethodEnum)[keyof typeof PaymentMethodEnum];

export const PaymentStatusEnum = {
  PENDING:  'pending',
  PAID:     'paid',
  REFUNDED: 'refunded',
  FAILED:   'failed',
} as const;
export type PaymentStatus = (typeof PaymentStatusEnum)[keyof typeof PaymentStatusEnum];

// ─── Services ────────────────────────────────────────────────────────────────

export const ServiceTypeEnum = {
  RIDE:   'ride',
  FOOD:   'food',
  PARCEL: 'parcel',
} as const;
export type ServiceType = (typeof ServiceTypeEnum)[keyof typeof ServiceTypeEnum];

// ─── Food / Order Status ─────────────────────────────────────────────────────

export const OrderStatusEnum = {
  PENDING:    'pending',
  CONFIRMED:  'confirmed',
  PREPARING:  'preparing',
  PICKED_UP:  'picked_up',
  ON_THE_WAY: 'on_the_way',
  DELIVERED:  'delivered',
  CANCELLED:  'cancelled',
  REFUNDED:   'refunded',
} as const;
export type OrderStatus = (typeof OrderStatusEnum)[keyof typeof OrderStatusEnum];

export interface OrderStatusConfig {
  key: OrderStatus;
  alias: string;
  label: string;
  step: number;
  isTerminal: boolean;
}

export const orderStatusConfigs: Record<OrderStatus, OrderStatusConfig> = {
  pending:    { key: 'pending',    alias: 'Order Placed',        label: 'Pending',    step: 0,  isTerminal: false },
  confirmed:  { key: 'confirmed',  alias: 'Restaurant Confirmed', label: 'Confirmed',  step: 1,  isTerminal: false },
  preparing:  { key: 'preparing',  alias: 'Being Prepared',      label: 'Preparing',  step: 2,  isTerminal: false },
  picked_up:  { key: 'picked_up',  alias: 'Rider Picked Up',     label: 'Picked Up',  step: 3,  isTerminal: false },
  on_the_way: { key: 'on_the_way', alias: 'Heading Your Way',    label: 'On the Way', step: 4,  isTerminal: false },
  delivered:  { key: 'delivered',  alias: 'Order Delivered',     label: 'Delivered',  step: 5,  isTerminal: true  },
  cancelled:  { key: 'cancelled',  alias: 'Order Cancelled',     label: 'Cancelled',  step: -1, isTerminal: true  },
  refunded:   { key: 'refunded',   alias: 'Amount Refunded',     label: 'Refunded',   step: -2, isTerminal: true  },
};

// ─── Parcel ──────────────────────────────────────────────────────────────────

export const PackageTypeEnum = {
  DOCUMENTS:   'documents',
  ELECTRONICS: 'electronics',
  FOOD_ITEMS:  'food_items',
  CLOTHING:    'clothing',
  FRAGILE:     'fragile',
  MEDICINE:    'medicine',
  OTHER:       'other',
} as const;
export type PackageType = (typeof PackageTypeEnum)[keyof typeof PackageTypeEnum];

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
  alias: string;
  label: string;
  icon: string;
  color: string;
  step: number;
  isTerminal: boolean;
}

export const parcelStatusConfigs: Record<ParcelStatus, ParcelStatusConfig> = {
  searching_rider:  { key: 'searching_rider',  alias: 'Looking for Rider',     label: 'Searching Rider',   icon: 'search',          color: '#FF9500', step: 0,  isTerminal: false },
  rider_assigned:   { key: 'rider_assigned',   alias: 'Rider Assigned',        label: 'Rider Assigned',    icon: 'person',          color: '#4C35E8', step: 1,  isTerminal: false },
  pickup_arrived:   { key: 'pickup_arrived',   alias: 'Rider at Pickup',       label: 'Rider at Pickup',   icon: 'location-on',     color: '#007AFF', step: 2,  isTerminal: false },
  picked_up:        { key: 'picked_up',        alias: 'Parcel Picked Up',      label: 'Picked Up',         icon: 'inventory-2',     color: '#7B2FBE', step: 3,  isTerminal: false },
  in_transit:       { key: 'in_transit',       alias: 'In Transit',            label: 'In Transit',        icon: 'local-shipping',  color: '#00D4FF', step: 4,  isTerminal: false },
  near_destination: { key: 'near_destination', alias: 'Almost Delivered',      label: 'Near Destination',  icon: 'near-me',         color: '#00C853', step: 5,  isTerminal: false },
  delivered:        { key: 'delivered',        alias: 'Parcel Delivered',      label: 'Delivered',         icon: 'check-circle',    color: '#00C853', step: 6,  isTerminal: true  },
  cancelled:        { key: 'cancelled',        alias: 'Parcel Cancelled',      label: 'Cancelled',         icon: 'cancel',          color: '#FF3B30', step: -1, isTerminal: true  },
};

// ─── Wallet / Transactions ───────────────────────────────────────────────────

export const TransactionTypeEnum = {
  CREDIT:   'credit',
  DEBIT:    'debit',
  REFUND:   'refund',
  CASHBACK: 'cashback',
} as const;
export type TransactionType = (typeof TransactionTypeEnum)[keyof typeof TransactionTypeEnum];

export const TransactionStatusEnum = {
  PENDING:  'pending',
  SUCCESS:  'success',
  FAILED:   'failed',
  REVERSED: 'reversed',
} as const;
export type TransactionStatus = (typeof TransactionStatusEnum)[keyof typeof TransactionStatusEnum];

// ─── Notifications ───────────────────────────────────────────────────────────

export const NotificationTypeEnum = {
  RIDE_UPDATE:   'ride_update',
  FOOD_UPDATE:   'food_update',
  PARCEL_UPDATE: 'parcel_update',
  PROMO:         'promo',
  SYSTEM:        'system',
  PAYMENT:       'payment',
  REWARD:        'reward',
} as const;
export type NotificationType = (typeof NotificationTypeEnum)[keyof typeof NotificationTypeEnum];

// ─── Surge ───────────────────────────────────────────────────────────────────

export const SurgeLevelEnum = {
  NONE:   'none',
  LOW:    'low',
  MEDIUM: 'medium',
  HIGH:   'high',
} as const;
export type SurgeLevel = (typeof SurgeLevelEnum)[keyof typeof SurgeLevelEnum];

export interface SurgeLevelConfig {
  key: SurgeLevel;
  alias: string;
  multiplierThreshold: number;
  color: string;
}

export const surgeLevelConfigs: Record<SurgeLevel, SurgeLevelConfig> = {
  none:   { key: 'none',   alias: 'Normal Fare',   multiplierThreshold: 1.0,  color: '#00C853' },
  low:    { key: 'low',    alias: 'Slightly Busy', multiplierThreshold: 1.25, color: '#FF9500' },
  medium: { key: 'medium', alias: 'Busy',          multiplierThreshold: 1.5,  color: '#FF6B6B' },
  high:   { key: 'high',   alias: 'Very Busy',     multiplierThreshold: 2.0,  color: '#FF3B30' },
};

// ─── Driver ──────────────────────────────────────────────────────────────────

export const DriverStatusEnum = {
  ONLINE:   'online',
  OFFLINE:  'offline',
  ON_TRIP:  'on_trip',
  ON_BREAK: 'on_break',
} as const;
export type DriverStatus = (typeof DriverStatusEnum)[keyof typeof DriverStatusEnum];

// ─── Cuisine ─────────────────────────────────────────────────────────────────

export const CuisineTypeEnum = {
  INDIAN:       'indian',
  NORTH_INDIAN: 'north_indian',
  SOUTH_INDIAN: 'south_indian',
  CHINESE:      'chinese',
  ITALIAN:      'italian',
  PIZZA:        'pizza',
  BURGER:       'burger',
  BIRYANI:      'biryani',
  MEXICAN:      'mexican',
  THAI:         'thai',
  JAPANESE:     'japanese',
  AMERICAN:     'american',
  CONTINENTAL:  'continental',
  DESSERTS:     'desserts',
  BEVERAGES:    'beverages',
} as const;
export type CuisineType = (typeof CuisineTypeEnum)[keyof typeof CuisineTypeEnum];

// ─── Cancellation ────────────────────────────────────────────────────────────

export const CancelledByEnum = {
  USER:   'user',
  DRIVER: 'driver',
  SYSTEM: 'system',
} as const;
export type CancelledBy = (typeof CancelledByEnum)[keyof typeof CancelledByEnum];

// ─── Maps / Routing / Geocoding ───────────────────────────────────────────────

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
  OSRM:             'osrm',
  OSRM_ESTIMATE:    'osrm_estimate',
  HAVERSINE_FALLBACK: 'haversine_fallback',
} as const;
export type ETASource = (typeof ETASourceEnum)[keyof typeof ETASourceEnum];

export interface ETASourceConfig {
  key: ETASource;
  alias: string;
  confidenceLevel: 'high' | 'medium' | 'low';
}

export const etaSourceConfigs: Record<ETASource, ETASourceConfig> = {
  osrm:              { key: 'osrm',              alias: 'OSRM Routing',       confidenceLevel: 'high'   },
  osrm_estimate:     { key: 'osrm_estimate',     alias: 'OSRM Estimate',      confidenceLevel: 'medium' },
  haversine_fallback:{ key: 'haversine_fallback', alias: 'Estimated Distance', confidenceLevel: 'low'    },
};
