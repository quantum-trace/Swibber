import mongoose, { Document, Schema } from 'mongoose';
import {
  AuthProvider,  AuthProviderEnum,
  AuthPlatform,  AuthPlatformEnum,
} from '../types/enums';

export interface IAuthProviderConfig {
  key: AuthProvider;
  alias: string;
  shortAlias: string;
  enabled: boolean;
  platform: AuthPlatform;
  order: number;
  iconName: string;
  primaryColor: string;
}

export interface IAuthConfig extends Document {
  version: number;
  providers: IAuthProviderConfig[];
  updatedAt: Date;
}

const AuthProviderConfigSchema = new Schema<IAuthProviderConfig>(
  {
    key:          { type: String, enum: Object.values(AuthProviderEnum), required: true },
    alias:        { type: String, required: true },
    shortAlias:   { type: String, required: true },
    enabled:      { type: Boolean, default: true },
    platform:     { type: String, enum: Object.values(AuthPlatformEnum), default: AuthPlatformEnum.BOTH },
    order:        { type: Number, default: 0 },
    iconName:     { type: String, required: true },
    primaryColor: { type: String, required: true },
  },
  { _id: false },
);

const AuthConfigSchema = new Schema<IAuthConfig>(
  {
    version:   { type: Number, default: 1 },
    providers: [AuthProviderConfigSchema],
  },
  { timestamps: true },
);

export const AuthConfig = mongoose.model<IAuthConfig>('AuthConfig', AuthConfigSchema);

export const DEFAULT_AUTH_PROVIDERS: IAuthProviderConfig[] = [
  {
    key:          AuthProviderEnum.GOOGLE,
    alias:        'Continue with Google',
    shortAlias:   'Google',
    enabled:      true,
    platform:     AuthPlatformEnum.BOTH,
    order:        1,
    iconName:     'google',
    primaryColor: '#DB4437',
  },
  {
    key:          AuthProviderEnum.APPLE,
    alias:        'Continue with Apple',
    shortAlias:   'Apple',
    enabled:      true,
    platform:     AuthPlatformEnum.IOS,
    order:        2,
    iconName:     'apple',
    primaryColor: '#000000',
  },
  {
    key:          AuthProviderEnum.PHONE,
    alias:        'Continue with Phone',
    shortAlias:   'Phone',
    enabled:      true,
    platform:     AuthPlatformEnum.BOTH,
    order:        3,
    iconName:     'phone',
    primaryColor: '#4C35E8',
  },
  {
    key:          AuthProviderEnum.EMAIL,
    alias:        'Continue with Email',
    shortAlias:   'Email',
    enabled:      true,
    platform:     AuthPlatformEnum.BOTH,
    order:        4,
    iconName:     'email',
    primaryColor: '#606080',
  },
];
