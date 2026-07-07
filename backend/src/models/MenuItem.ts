import mongoose, { Document, Schema } from 'mongoose';

export interface IMenuItem extends Document {
  restaurantId: mongoose.Types.ObjectId;
  name: string;
  description?: string;
  price: number;
  category: string;
  imageUrl?: string;
  imageEmoji: string;
  isVeg: boolean;
  isPopular: boolean;
  isAvailable: boolean;
  addons: Array<{ id: string; name: string; price: number }>;
  createdAt: Date;
  updatedAt: Date;
}

const MenuItemSchema = new Schema<IMenuItem>(
  {
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true, index: true },
    name: { type: String, required: true },
    description: String,
    price: { type: Number, required: true },
    category: { type: String, required: true },
    imageUrl: String,
    imageEmoji: { type: String, default: '🍽️' },
    isVeg: { type: Boolean, default: true },
    isPopular: { type: Boolean, default: false },
    isAvailable: { type: Boolean, default: true },
    addons: [
      {
        id: { type: String, required: true },
        name: { type: String, required: true },
        price: { type: Number, required: true },
      },
    ],
  },
  { timestamps: true },
);

export const MenuItem = mongoose.model<IMenuItem>('MenuItem', MenuItemSchema);
