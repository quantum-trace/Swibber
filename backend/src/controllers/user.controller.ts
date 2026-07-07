import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { User } from '../models/User';
import { uploadImage } from '../services/cloudinary.service';
import { AppError, ConflictError } from '../utils/errors';
import { v4 as uuid } from 'uuid';
import { MembershipTierEnum, membershipTierConfigs } from '../types/enums';

export const getProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findById(req.user!.id).lean();
    if (!user) { next(new AppError('User not found', 404)); return; }
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
};

export const updateProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { name, email, gender, phone } = req.body;
    const update: Record<string, string> = {};
    if (name)   update.name   = name;
    if (email)  update.email  = email;
    if (gender) update.gender = gender;
    if (phone) {
      const taken = await User.findOne({ phone, _id: { $ne: req.user!.id } }).lean();
      if (taken) { next(new ConflictError('Phone number is already in use')); return; }
      update.phone = phone;
    }
    const user = await User.findByIdAndUpdate(
      req.user!.id,
      update,
      { new: true, runValidators: true },
    ).lean();
    res.json({ success: true, data: user });
  } catch (err: any) {
    if (err?.code === 11000 && err?.keyPattern?.phone) {
      next(new ConflictError('Phone number is already in use'));
      return;
    }
    next(err);
  }
};

export const uploadAvatar = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    if (!req.file) { next(new AppError('No file provided', 400)); return; }
    const { url } = await uploadImage(req.file.buffer, 'avatars', `user_${req.user!.id}`);
    const user = await User.findByIdAndUpdate(req.user!.id, { avatarUrl: url }, { new: true }).lean();
    res.json({ success: true, data: { avatarUrl: url, user } });
  } catch (err) { next(err); }
};

export const getAddresses = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findById(req.user!.id, 'savedAddresses').lean();
    res.json({ success: true, data: user?.savedAddresses ?? [] });
  } catch (err) { next(err); }
};

export const addAddress = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { type, label, address, lat, lng } = req.body;
    const newAddr = { id: uuid(), type, label, address, lat, lng };
    const user = await User.findByIdAndUpdate(
      req.user!.id,
      { $push: { savedAddresses: newAddr } },
      { new: true },
    ).lean();
    res.status(201).json({ success: true, data: user?.savedAddresses });
  } catch (err) { next(err); }
};

export const updateAddress = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { id } = req.params;
    const { type, label, address, lat, lng } = req.body;
    await User.updateOne(
      { _id: req.user!.id, 'savedAddresses.id': id },
      { $set: { 'savedAddresses.$': { id, type, label, address, lat, lng } } },
    );
    const user = await User.findById(req.user!.id, 'savedAddresses').lean();
    res.json({ success: true, data: user?.savedAddresses });
  } catch (err) { next(err); }
};

export const deleteAddress = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await User.updateOne({ _id: req.user!.id }, { $pull: { savedAddresses: { id: req.params.id } } });
    res.json({ success: true, message: 'Address deleted' });
  } catch (err) { next(err); }
};

export const updateSettings = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { notifications, emailUpdates, locationSharing } = req.body;
    const update: Record<string, boolean> = {};
    if (notifications !== undefined) update['settings.notifications'] = notifications;
    if (emailUpdates !== undefined) update['settings.emailUpdates'] = emailUpdates;
    if (locationSharing !== undefined) update['settings.locationSharing'] = locationSharing;
    const user = await User.findByIdAndUpdate(req.user!.id, { $set: update }, { new: true }).lean();
    res.json({ success: true, data: user?.settings });
  } catch (err) { next(err); }
};

export const updateFcmToken = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await User.findByIdAndUpdate(req.user!.id, { fcmToken: req.body.fcmToken });
    res.json({ success: true });
  } catch (err) { next(err); }
};

export const getMembershipStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const user = await User.findById(req.user!.id, 'membershipTier rewardPoints membershipExpiresAt membershipPurchasedAt').lean();
    if (!user) { next(new AppError('User not found', 404)); return; }

    const isExpired = user.membershipExpiresAt && new Date() > new Date(user.membershipExpiresAt);
    const effectiveTier = isExpired ? MembershipTierEnum.BRONZE : user.membershipTier;
    const tierCfg = membershipTierConfigs[effectiveTier as keyof typeof membershipTierConfigs];

    res.json({
      success: true,
      data: {
        tier:               effectiveTier,
        config:             tierCfg,
        points:             user.rewardPoints,
        expiresAt:          isExpired ? null : user.membershipExpiresAt,
        purchasedAt:        user.membershipPurchasedAt,
        isExpired:          !!isExpired,
      },
    });
  } catch (err) { next(err); }
};

export const claimMembershipByPoints = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { targetTier } = req.body as { targetTier: string };
    const tierCfg = membershipTierConfigs[targetTier as keyof typeof membershipTierConfigs];
    if (!tierCfg || tierCfg.pointsRequired === 0) {
      next(new AppError('Invalid tier for point claim', 400)); return;
    }

    const user = await User.findById(req.user!.id, 'rewardPoints membershipTier').lean();
    if (!user) { next(new AppError('User not found', 404)); return; }

    if (user.rewardPoints < tierCfg.pointsRequired) {
      next(new AppError(`Insufficient points. Need ${tierCfg.pointsRequired}, have ${user.rewardPoints}.`, 400)); return;
    }

    const tierOrder: Record<string, number> = { bronze: 0, gold: 1, platinum: 2 };
    if ((tierOrder[targetTier] ?? 0) <= (tierOrder[user.membershipTier] ?? 0)) {
      next(new AppError('Target tier must be higher than current tier', 400)); return;
    }

    // Claim is permanent (no expiry) — points stay (not consumed)
    await User.findByIdAndUpdate(req.user!.id, {
      membershipTier:      targetTier,
      membershipExpiresAt: null,
    });

    res.json({ success: true, message: `${tierCfg.alias} membership claimed!`, data: { tier: targetTier } });
  } catch (err) { next(err); }
};
