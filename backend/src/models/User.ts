import mongoose, { Document, Schema } from 'mongoose';
import {
  AuthProvider,     AuthProviderEnum,
  UserRole,         UserRoleEnum,
  MembershipTier,   MembershipTierEnum,
  AddressType,      AddressTypeEnum,
} from '../types/enums';

export interface IUser extends Document {
  firebaseUid: string;
  phone?: string;
  email?: string;
  name: string;
  avatarUrl?: string;
  fcmToken?: string;
  role: UserRole;
  membershipTier: MembershipTier;
  authProviders: AuthProvider[];
  primaryAuthProvider: AuthProvider;
  googleId?: string;
  appleId?: string;
  rewardPoints: number;
  membershipExpiresAt?: Date;
  membershipPurchasedAt?: Date;
  gender?: string;
  isActive: boolean;
  isPhoneVerified: boolean;
  isEmailVerified: boolean;
  savedAddresses: Array<{
    id: string;
    type: AddressType;
    label: string;
    address: string;
    lat: number;
    lng: number;
  }>;
  settings: {
    notifications: boolean;
    emailUpdates: boolean;
    locationSharing: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    firebaseUid: { type: String, required: true, unique: true, index: true },
    phone:       { type: String, unique: true, sparse: true },
    email:       { type: String, sparse: true, lowercase: true, index: true },
    name:        { type: String, required: true, trim: true },
    avatarUrl:   String,
    fcmToken:    String,
    role: {
      type:    String,
      enum:    Object.values(UserRoleEnum),
      default: UserRoleEnum.USER,
    },
    membershipTier: {
      type:    String,
      enum:    Object.values(MembershipTierEnum),
      default: MembershipTierEnum.BRONZE,
    },
    authProviders:       [{ type: String, enum: Object.values(AuthProviderEnum) }],
    primaryAuthProvider: {
      type:    String,
      enum:    Object.values(AuthProviderEnum),
      default: AuthProviderEnum.PHONE,
    },
    googleId: { type: String, sparse: true, index: true },
    appleId:  { type: String, sparse: true, index: true },
    gender:              { type: String, enum: ['male', 'female', 'other'] },
    rewardPoints:        { type: Number, default: 0 },
    membershipExpiresAt: { type: Date },
    membershipPurchasedAt: { type: Date },
    isActive:            { type: Boolean, default: true },
    isPhoneVerified:   { type: Boolean, default: false },
    isEmailVerified:   { type: Boolean, default: false },
    savedAddresses: [
      {
        id:      { type: String, required: true },
        type:    { type: String, enum: Object.values(AddressTypeEnum), default: AddressTypeEnum.OTHER },
        label:   String,
        address: { type: String, required: true },
        lat:     { type: Number, required: true },
        lng:     { type: Number, required: true },
      },
    ],
    settings: {
      notifications:   { type: Boolean, default: true },
      emailUpdates:    { type: Boolean, default: true },
      locationSharing: { type: Boolean, default: true },
    },
  },
  { timestamps: true },
);

export const User = mongoose.model<IUser>('User', UserSchema);
