import mongoose, { Document, Schema } from 'mongoose';

export interface IFoodOrder extends Document {
  userId: mongoose.Types.ObjectId;
  restaurantId: mongoose.Types.ObjectId;
  riderId?: mongoose.Types.ObjectId;
  items: Array<{
    menuItemId: string;
    name: string;
    price: number;
    quantity: number;
    addons: Array<{ id: string; name: string; price: number }>;
  }>;
  deliveryAddress: string;
  deliveryLat: number;
  deliveryLng: number;
  deliveryInstructions?: string;
  subtotal: number;
  deliveryFee: number;
  discount: number;
  totalAmount: number;
  couponCode?: string;
  paymentMethod: string;
  paymentStatus: 'pending' | 'paid' | 'refunded';
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  status: 'placed' | 'accepted' | 'preparing' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'pending' | 'confirmed' | 'picked_up' | 'on_the_way' | 'refunded';
  otp: string;
  restaurantRating?: number;
  riderRating?: number;
  ratingComment?: string;
  estimatedDeliveryMins: number;
  confirmedAt?: Date;
  preparedAt?: Date;
  pickedUpAt?: Date;
  deliveredAt?: Date;
  cancellationReason?: string;
  cancelledBy?: 'user' | 'driver' | 'system';
  cancelledAt?: Date;
  cancellationFee: number;
  statusHistory: Array<{ status: string; timestamp: Date; note?: string; actor: string }>;
  createdAt: Date;
  updatedAt: Date;
}

const FoodOrderSchema = new Schema<IFoodOrder>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    restaurantId: { type: Schema.Types.ObjectId, ref: 'Restaurant', required: true },
    riderId: { type: Schema.Types.ObjectId, ref: 'Driver' },
    items: [
      {
        menuItemId: String,
        name: String,
        price: Number,
        quantity: Number,
        addons: [{ id: String, name: String, price: Number }],
      },
    ],
    deliveryAddress: { type: String, required: true },
    deliveryLat: { type: Number, required: true },
    deliveryLng: { type: Number, required: true },
    deliveryInstructions: String,
    subtotal: { type: Number, required: true },
    deliveryFee: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    couponCode: String,
    paymentMethod: { type: String, required: true },
    paymentStatus: { type: String, enum: ['pending', 'paid', 'refunded'], default: 'pending' },
    razorpayOrderId: String,
    razorpayPaymentId: String,
    status: {
      type: String,
      enum: ['placed', 'accepted', 'preparing', 'out_for_delivery', 'delivered', 'cancelled', 'pending', 'confirmed', 'picked_up', 'on_the_way', 'refunded'],
      default: 'placed',
    },
    otp: { type: String, required: true },
    restaurantRating: { type: Number, min: 1, max: 5 },
    riderRating: { type: Number, min: 1, max: 5 },
    ratingComment: String,
    estimatedDeliveryMins: { type: Number, default: 30 },
    confirmedAt: Date,
    preparedAt: Date,
    pickedUpAt: Date,
    deliveredAt: Date,
    cancellationReason: {
      type: String,
      enum: ['user_cancelled', 'driver_cancelled', 'driver_not_found', 'timeout', 'payment_failed', 'system_cancelled', 'other'],
    },
    cancelledBy:    { type: String, enum: ['user', 'driver', 'system'] },
    cancelledAt:    Date,
    cancellationFee: { type: Number, default: 0 },
    statusHistory: [
      {
        status:    { type: String, required: true },
        timestamp: { type: Date, default: () => new Date() },
        note:      String,
        actor:     { type: String, enum: ['system', 'user', 'driver', 'restaurant', 'rider'], default: 'system' },
      },
    ],
  },
  { timestamps: true },
);

export const FoodOrder = mongoose.model<IFoodOrder>('FoodOrder', FoodOrderSchema);
