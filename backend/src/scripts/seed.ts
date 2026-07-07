import 'dotenv/config';
import mongoose from 'mongoose';
import { Restaurant } from '../models/Restaurant';
import { MenuItem } from '../models/MenuItem';
import { Coupon } from '../models/Coupon';
import { FareConfig } from '../models/FareConfig';
import { ParcelFareConfig } from '../models/ParcelFareConfig';

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI!);
  console.log('[Seed] Connected to MongoDB');

  // ─── Restaurants ──────────────────────────────────────────────────────────
  await Restaurant.deleteMany({});
  await MenuItem.deleteMany({});

  const restaurants = await Restaurant.insertMany([
    { name: 'Biryani Palace', cuisine: ['biryani', 'north_indian'], imageEmoji: '🍚', rating: 4.5, totalRatings: 1200, deliveryTimeMins: 30, deliveryFee: 0, minimumOrder: 149, address: 'Andheri West, Mumbai', location: { lat: 19.1194, lng: 72.8468 }, isOpen: true, offers: ['20% off on first order', 'Free delivery above ₹300'], tags: ['trending', 'bestseller'] },
    { name: 'Pizza Hub',      cuisine: ['pizza', 'italian'],        imageEmoji: '🍕', rating: 4.3, totalRatings: 890,  deliveryTimeMins: 25, deliveryFee: 30, minimumOrder: 199, address: 'Bandra West, Mumbai', location: { lat: 19.0596, lng: 72.8295 }, isOpen: true, offers: ['Buy 1 Get 1 on weekdays'], tags: ['popular'] },
    { name: 'Burger Barn',    cuisine: ['burger', 'american'],      imageEmoji: '🍔', rating: 4.1, totalRatings: 654,  deliveryTimeMins: 20, deliveryFee: 20, minimumOrder: 99,  address: 'Powai, Mumbai', location: { lat: 19.1190, lng: 72.9073 }, isOpen: true, offers: ['Free fries on orders above ₹200'], tags: ['fast food'] },
    { name: 'South Spice',    cuisine: ['south_indian'],            imageEmoji: '🥞', rating: 4.6, totalRatings: 2100, deliveryTimeMins: 35, deliveryFee: 0,  minimumOrder: 79,  address: 'Dadar, Mumbai', location: { lat: 19.0178, lng: 72.8478 }, isOpen: true, offers: ['10% off on dosas'], tags: ['healthy', 'trending'] },
    { name: 'Chinese Dragon', cuisine: ['chinese'],                 imageEmoji: '🍜', rating: 4.2, totalRatings: 432,  deliveryTimeMins: 40, deliveryFee: 40, minimumOrder: 199, address: 'Juhu, Mumbai', location: { lat: 19.0989, lng: 72.8259 }, isOpen: true, offers: [], tags: [] },
    { name: 'Punjabi Tadka',  cuisine: ['north_indian', 'indian'],  imageEmoji: '🍛', rating: 4.4, totalRatings: 1567, deliveryTimeMins: 30, deliveryFee: 0,  minimumOrder: 149, address: 'Malad, Mumbai', location: { lat: 19.1874, lng: 72.8484 }, isOpen: true, offers: ['₹50 off on orders above ₹400'], tags: ['popular'] },
  ]);

  for (const restaurant of restaurants) {
    await MenuItem.insertMany([
      { restaurantId: restaurant._id, name: `${restaurant.name} Special`, description: 'Chef special dish', price: 249, category: 'Specials', imageEmoji: restaurant.imageEmoji, isVeg: false, isPopular: true, addons: [{ id: 'a1', name: 'Extra spicy', price: 20 }, { id: 'a2', name: 'Extra cheese', price: 30 }] },
      { restaurantId: restaurant._id, name: 'Veg Delight', description: 'Fresh veg preparation', price: 179, category: 'Vegetarian', imageEmoji: '🥗', isVeg: true, isPopular: false, addons: [] },
      { restaurantId: restaurant._id, name: 'Classic Combo', description: 'Combo meal for one', price: 329, category: 'Combos', imageEmoji: '🍱', isVeg: false, isPopular: true, addons: [{ id: 'b1', name: 'Add drink', price: 50 }] },
      { restaurantId: restaurant._id, name: 'Dessert', description: 'Sweet ending', price: 99, category: 'Desserts', imageEmoji: '🍰', isVeg: true, isPopular: false, addons: [] },
    ]);
  }

  console.log(`[Seed] ✅ ${restaurants.length} restaurants + ${restaurants.length * 4} menu items`);

  // ─── Coupons ───────────────────────────────────────────────────────────────
  await Coupon.deleteMany({});
  await Coupon.insertMany([
    { code: 'FIRST50',    type: 'flat',       discount: 50,  minOrderAmount: 199, applicableFor: 'food',   usageLimit: 500,  expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000) },
    { code: 'RIDE20',     type: 'percentage', discount: 20,  maxDiscount: 100, minOrderAmount: 0,   applicableFor: 'ride',   usageLimit: 1000, expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000) },
    { code: 'SWIBBER10',  type: 'percentage', discount: 10,  maxDiscount: 50,  minOrderAmount: 149, applicableFor: 'all',    usageLimit: 2000, expiresAt: new Date(Date.now() + 60 * 24 * 3600 * 1000) },
    { code: 'PARCEL30',   type: 'flat',       discount: 30,  minOrderAmount: 100, applicableFor: 'parcel', usageLimit: 500,  expiresAt: new Date(Date.now() + 30 * 24 * 3600 * 1000) },
  ]);
  console.log('[Seed] ✅ 4 coupons');

  // ─── Fare Config ───────────────────────────────────────────────────────────
  await FareConfig.deleteMany({});
  await FareConfig.create({
    serviceArea:          'default',
    currency:             'INR',
    vehicles: [
      { vehicleType: 'bike',    alias: 'SwibberBike',  baseFare: 25,  perKmRate: 8,  perMinuteRate: 0.5,  minimumFare: 30,  cancellationFee: 0,   waitingChargePerMin: 0,   nightMultiplier: 1.25, maxDistanceKm: 10, capacity: 1, avgSpeedKmh: 25, isActive: true },
      { vehicleType: 'auto',   alias: 'SwibberAuto',  baseFare: 35,  perKmRate: 12, perMinuteRate: 0.75, minimumFare: 40,  cancellationFee: 20,  waitingChargePerMin: 0.5, nightMultiplier: 1.25, maxDistanceKm: 25, capacity: 3, avgSpeedKmh: 20, isActive: true },
      { vehicleType: 'mini',   alias: 'SwibberMini',  baseFare: 50,  perKmRate: 14, perMinuteRate: 1.0,  minimumFare: 60,  cancellationFee: 30,  waitingChargePerMin: 1.0, nightMultiplier: 1.25, maxDistanceKm: 60, capacity: 4, avgSpeedKmh: 22, isActive: true },
      { vehicleType: 'sedan',  alias: 'SwibberPrime', baseFare: 75,  perKmRate: 18, perMinuteRate: 1.5,  minimumFare: 90,  cancellationFee: 50,  waitingChargePerMin: 1.5, nightMultiplier: 1.3,  maxDistanceKm: 0,  capacity: 4, avgSpeedKmh: 22, isActive: true },
      { vehicleType: 'xl',     alias: 'SwibberXL',   baseFare: 100, perKmRate: 22, perMinuteRate: 2.0,  minimumFare: 120, cancellationFee: 75,  waitingChargePerMin: 2.0, nightMultiplier: 1.3,  maxDistanceKm: 0,  capacity: 6, avgSpeedKmh: 20, isActive: true },
      { vehicleType: 'premium',alias: 'SwibberLux',  baseFare: 150, perKmRate: 28, perMinuteRate: 2.5,  minimumFare: 180, cancellationFee: 100, waitingChargePerMin: 2.5, nightMultiplier: 1.35, maxDistanceKm: 0,  capacity: 4, avgSpeedKmh: 25, isActive: true },
    ],
    peakHours: [
      { label: 'Morning Rush', startHour: 8,  endHour: 10, multiplier: 1.4, daysOfWeek: [1, 2, 3, 4, 5] },
      { label: 'Evening Rush', startHour: 18, endHour: 21, multiplier: 1.5, daysOfWeek: [1, 2, 3, 4, 5] },
      { label: 'Weekend Night',startHour: 22, endHour: 2,  multiplier: 1.3, daysOfWeek: [5, 6] },
    ],
    nightChargeStartHour:  22,
    nightChargeEndHour:    6,
    baseWeatherMultiplier: 1.0,
    baseTrafficMultiplier: 1.0,
    maxSurgeMultiplier:    3.0,
    platformFeePercent:    0,
    gstPercent:            0,
    isActive:              true,
  });
  console.log('[Seed] ✅ Default FareConfig');

  // ─── Parcel Fare Config ────────────────────────────────────────────────────
  await ParcelFareConfig.deleteMany({});
  await ParcelFareConfig.create({
    serviceArea: 'default',
    currency:    'INR',
    baseFare:    40,
    perKmRate:   10,
    weightTiers: [
      { upToKg: 1,  surchargeFlat: 0   },
      { upToKg: 3,  surchargeFlat: 15  },
      { upToKg: 5,  surchargeFlat: 30  },
      { upToKg: 10, surchargeFlat: 60  },
      { upToKg: 20, surchargeFlat: 100 },
      { upToKg: 50, surchargeFlat: 200 },
    ],
    fragileSurcharge:           30,
    expressMultiplier:          1.5,
    peakMultiplier:             1.3,
    peakStartHour:              9,
    peakEndHour:                12,
    multiStopSurchargePerStop:  20,
    vehicles: [
      { vehicleType: 'bike',  alias: 'SwibberBike',  maxWeightKg: 5,  maxDimensionCm: 100, isActive: true },
      { vehicleType: 'auto',  alias: 'SwibberAuto',  maxWeightKg: 20, maxDimensionCm: 200, isActive: true },
      { vehicleType: 'mini',  alias: 'SwibberMini',  maxWeightKg: 50, maxDimensionCm: 300, isActive: true },
      { vehicleType: 'sedan', alias: 'SwibberPrime', maxWeightKg: 20, maxDimensionCm: 200, isActive: true },
      { vehicleType: 'xl',    alias: 'SwibberXL',    maxWeightKg: 80, maxDimensionCm: 400, isActive: true },
    ],
    minimumFare:       40,
    platformFeePercent: 0,
    gstPercent:         0,
    isActive:           true,
  });
  console.log('[Seed] ✅ Default ParcelFareConfig');

  console.log('\n[Seed] 🎉 All done!');
  await mongoose.disconnect();
};

seed().catch((err) => { console.error('[Seed] Failed:', err); process.exit(1); });
