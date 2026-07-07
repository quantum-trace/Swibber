import mongoose, { Document, Schema } from 'mongoose';

export interface IRestaurant extends Document {
  name: string;
  cuisine: string[];
  description?: string;
  imageUrl?: string;
  imageEmoji: string;
  rating: number;
  totalRatings: number;
  deliveryTimeMins: number;
  deliveryFee: number;
  minimumOrder: number;
  address: string;
  location: { lat: number; lng: number };
  isOpen: boolean;
  isActive: boolean;
  openingHours: {
    open: string;
    close: string;
    days: string[];
  };
  offers: string[];
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const RestaurantSchema = new Schema<IRestaurant>(
  {
    name: { type: String, required: true, index: true },
    cuisine: [String],
    description: String,
    imageUrl: String,
    imageEmoji: { type: String, default: '🍽️' },
    rating: { type: Number, default: 4.0, min: 1, max: 5 },
    totalRatings: { type: Number, default: 0 },
    deliveryTimeMins: { type: Number, default: 30 },
    deliveryFee: { type: Number, default: 0 },
    minimumOrder: { type: Number, default: 100 },
    address: { type: String, required: true },
    location: {
      lat: { type: Number, required: true },
      lng: { type: Number, required: true },
    },
    isOpen: { type: Boolean, default: true },
    isActive: { type: Boolean, default: true },
    openingHours: {
      open: { type: String, default: '10:00' },
      close: { type: String, default: '23:00' },
      days: [String],
    },
    offers: [String],
    tags: [String],
  },
  { timestamps: true },
);

RestaurantSchema.index({ 'location.lat': 1, 'location.lng': 1 });
RestaurantSchema.index({ cuisine: 1 });
RestaurantSchema.index({ name: 'text' });

export const Restaurant = mongoose.model<IRestaurant>('Restaurant', RestaurantSchema);
