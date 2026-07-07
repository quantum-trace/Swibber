import { Request, Response, NextFunction } from 'express';
import { Restaurant } from '../models/Restaurant';
import { Coupon } from '../models/Coupon';
import { AuthConfig, DEFAULT_AUTH_PROVIDERS } from '../models/AuthConfig';
import { AppConfig } from '../models/AppConfig';
import { FareConfig } from '../models/FareConfig';
import { ParcelFareConfig } from '../models/ParcelFareConfig';
import { loadFareConfig, invalidateFareCache } from '../services/fare.engine';
import { loadParcelFareConfig, invalidateParcelFareCache } from '../services/parcel.engine';
import {
  VehicleTypeEnum, OrderStatusEnum, PaymentMethodEnum, ServiceTypeEnum,
  PackageTypeEnum, MembershipTierEnum, NotificationTypeEnum, CuisineTypeEnum,
  AddressTypeEnum, SurgeLevelEnum, TransactionTypeEnum,
} from '../types/enums';

// ─── App Config ──────────────────────────────────────────────────────────────

export const getAppConfig = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const existing = await AppConfig.findOne().lean();
    const vc = existing ?? await AppConfig.create({});

    res.json({
      success: true,
      data: {
        version:         vc.latestVersion,
        minVersion:      vc.minVersion,
        latestVersion:   vc.latestVersion,
        apkDownloadUrl:  vc.apkDownloadUrl,
        androidStoreUrl: vc.androidStoreUrl,
        iosStoreUrl:     vc.iosStoreUrl,
        maintenanceMode: false,
        features:        { food: true, parcel: true, ride: true, wallet: true },
        currency:        { symbol: '₹', code: 'INR' },
        defaultLocation: { lat: 19.076, lng: 72.8777, city: 'Mumbai' },
        supportPhone:    '+91 1800 000 0000',
        supportEmail:    'support@swibber.com',
      },
    });
  } catch (err) {
    next(err);
  }
};

export const updateAppVersionConfig = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { minVersion, latestVersion, apkDownloadUrl, androidStoreUrl, iosStoreUrl } = req.body;

    const updated = await AppConfig.findOneAndUpdate(
      {},
      { ...(minVersion      && { minVersion }),
        ...(latestVersion   && { latestVersion }),
        ...(apkDownloadUrl  !== undefined && { apkDownloadUrl }),
        ...(androidStoreUrl && { androidStoreUrl }),
        ...(iosStoreUrl     && { iosStoreUrl }),
      },
      { upsert: true, new: true, runValidators: true },
    );

    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
};

// Called by GitHub Actions after each release — no JWT, just a shared secret
export const webhookUpdateAppVersion = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  try {
    const secret = req.headers['x-webhook-secret'];
    if (!secret || secret !== process.env.INTERNAL_WEBHOOK_SECRET) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { version, apkUrl } = req.body as { version?: string; apkUrl?: string };
    if (!version) {
      res.status(400).json({ success: false, message: 'version is required' });
      return;
    }

    await AppConfig.findOneAndUpdate(
      {},
      { minVersion: version, latestVersion: version, ...(apkUrl && { apkDownloadUrl: apkUrl }) },
      { upsert: true, new: true },
    );

    res.json({ success: true, message: `App version updated to ${version}` });
  } catch (err) {
    next(err);
  }
};

// ─── Auth provider config ─────────────────────────────────────────────────────

export const getAuthProviderConfig = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const existing = await AuthConfig.findOne().sort({ updatedAt: -1 }).lean();
    const providers = existing
      ? existing.providers
      : (await AuthConfig.create({ providers: DEFAULT_AUTH_PROVIDERS })).providers;
    res.json({ success: true, data: providers });
  } catch (err) {
    next(err);
  }
};

// ─── Promotions ───────────────────────────────────────────────────────────────

export const getPromotions = async (
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const coupons = await Coupon.find({ isActive: true, expiresAt: { $gt: new Date() } })
      .limit(10)
      .lean();

    res.json({
      success: true,
      data: [
        { id: '1', title: 'First Ride Free',  subtitle: 'Use code FIRSTRIDE', gradient: ['#4C35E8', '#00D4FF'], emoji: '🚗' },
        { id: '2', title: 'Food Fiesta',       subtitle: '20% off on first order', gradient: ['#FF6B6B', '#FF9500'], emoji: '🍔' },
        { id: '3', title: 'Send & Save',       subtitle: 'Free parcel delivery', gradient: ['#00C853', '#00D4FF'], emoji: '📦' },
        ...coupons.map((c, i) => ({
          id:       String(i + 4),
          title:    c.code,
          subtitle: c.type === 'percentage' ? `${c.discount}% off` : `₹${c.discount} off`,
          gradient: ['#7B2FBE', '#4C35E8'],
          emoji:    '🎁',
        })),
      ],
    });
  } catch (err) {
    next(err);
  }
};

// ─── Fare config ──────────────────────────────────────────────────────────────

export const getFareConfig = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const area   = String(req.query.area ?? 'default');
    const config = await loadFareConfig(area);
    res.json({ success: true, data: config });
  } catch (err) {
    next(err);
  }
};

export const upsertFareConfig = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const area    = String(req.query.area ?? 'default');
    const payload = req.body;

    const updated = await FareConfig.findOneAndUpdate(
      { serviceArea: area },
      { ...payload, serviceArea: area },
      { upsert: true, new: true, runValidators: true },
    );

    await invalidateFareCache(area);
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
};

export const getParcelFareConfig = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const area   = String(req.query.area ?? 'default');
    const config = await loadParcelFareConfig(area);
    res.json({ success: true, data: config });
  } catch (err) {
    next(err);
  }
};

export const upsertParcelFareConfig = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const area    = String(req.query.area ?? 'default');
    const payload = req.body;

    const updated = await ParcelFareConfig.findOneAndUpdate(
      { serviceArea: area },
      { ...payload, serviceArea: area },
      { upsert: true, new: true, runValidators: true },
    );

    await invalidateParcelFareCache(area);
    res.json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
};

// ─── Enum config ──────────────────────────────────────────────────────────────
// Returns all enum values so the frontend can apply backend-controlled aliases.

export const getEnumConfig = (_req: Request, res: Response, next: NextFunction): void => {
  try {
    res.json({
      success: true,
      data: {
        vehicleTypes:     Object.values(VehicleTypeEnum),
        orderStatuses:    Object.values(OrderStatusEnum),
        paymentMethods:   Object.values(PaymentMethodEnum),
        serviceTypes:     Object.values(ServiceTypeEnum),
        packageTypes:     Object.values(PackageTypeEnum),
        membershipTiers:  Object.values(MembershipTierEnum),
        notificationTypes:Object.values(NotificationTypeEnum),
        cuisineTypes:     Object.values(CuisineTypeEnum),
        addressTypes:     Object.values(AddressTypeEnum),
        surgeLevels:      Object.values(SurgeLevelEnum),
        transactionTypes: Object.values(TransactionTypeEnum),
      },
    });
  } catch (err) {
    next(err);
  }
};
