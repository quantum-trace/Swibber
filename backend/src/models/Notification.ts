import mongoose, { Document, Schema } from 'mongoose';

export interface INotification extends Document {
  userId: mongoose.Types.ObjectId;
  type: 'ride_update' | 'food_update' | 'parcel_update' | 'promo' | 'system' | 'payment' | 'reward';
  title: string;
  body: string;
  data?: Record<string, string>;
  isRead: boolean;
  referenceId?: string;
  referenceType?: string;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: {
      type: String,
      enum: ['ride_update', 'food_update', 'parcel_update', 'promo', 'system', 'payment', 'reward'],
      required: true,
    },
    title: { type: String, required: true },
    body: { type: String, required: true },
    data: { type: Map, of: String },
    isRead: { type: Boolean, default: false },
    referenceId: String,
    referenceType: String,
  },
  { timestamps: true },
);

export const Notification = mongoose.model<INotification>('Notification', NotificationSchema);
