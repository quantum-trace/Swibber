import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { verifyFirebaseToken } from '../config/firebase';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/jwt';
import { User } from '../models/User';
import { AuthConfig, DEFAULT_AUTH_PROVIDERS } from '../models/AuthConfig';
import { AuthProviderEnum } from '../types/enums';
import type { AuthProvider, UserRole } from '../types/enums';
import { getOrCreateWallet } from '../services/wallet.service';
import { createNotification } from '../services/notification.service';
import { AppError, UnauthorizedError, ConflictError } from '../utils/errors';
import { getRedis } from '../config/redis';

interface FirebaseAuthBody {
  idToken: string;
  fcmToken?: string;
  name?: string;
  email?: string;
  avatarUrl?: string;
  authProvider?: AuthProvider;
}

const buildUserResponse = (user: InstanceType<typeof User>) => ({
  id: user._id,
  name: user.name,
  phone: user.phone,
  email: user.email,
  avatarUrl: user.avatarUrl,
  membershipTier: user.membershipTier,
  rewardPoints: user.rewardPoints,
  role: user.role,
  primaryAuthProvider: user.primaryAuthProvider,
  authProviders: user.authProviders,
  isPhoneVerified: user.isPhoneVerified,
  isEmailVerified: user.isEmailVerified,
});

const issueTokenPair = async (userId: string, payload: Parameters<typeof signAccessToken>[0]) => {
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);
  await getRedis().setex(`refresh:${userId}`, 30 * 24 * 3600, refreshToken);
  return { accessToken, refreshToken };
};

export const firebaseAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { idToken, fcmToken, name, email, avatarUrl, authProvider }: FirebaseAuthBody = req.body;
    if (!idToken) { next(new AppError('Firebase ID token required', 400)); return; }

    const decoded = await verifyFirebaseToken(idToken);
    const detectedProvider = authProvider ?? deriveProvider(decoded);

    let user = await User.findOne({ firebaseUid: decoded.uid });

    if (!user) {
      const phone = decoded.phone_number;
      const resolvedEmail = email ?? decoded.email;
      const resolvedName = name ?? decoded.name ?? 'Swibber User';

      if (phone) {
        const phoneOwner = await User.findOne({ phone }).lean();
        if (phoneOwner) {
          next(new ConflictError('This phone number is already linked to another account'));
          return;
        }
      }

      try {
      user = await User.create({
        firebaseUid: decoded.uid,
        phone: phone || undefined,
        email: resolvedEmail,
        name: resolvedName,
        avatarUrl: avatarUrl ?? decoded.picture,
        isPhoneVerified: !!decoded.phone_number,
        isEmailVerified: decoded.email_verified ?? false,
        fcmToken,
        authProviders: [detectedProvider],
        primaryAuthProvider: detectedProvider,
        googleId: detectedProvider === AuthProviderEnum.GOOGLE ? decoded.uid : undefined,
        appleId: detectedProvider === AuthProviderEnum.APPLE ? decoded.uid : undefined,
      });
      } catch (createErr: any) {
        if (createErr?.code === 11000 && createErr?.keyPattern?.phone) {
          next(new ConflictError('This phone number is already linked to another account'));
          return;
        }
        throw createErr;
      }
      await getOrCreateWallet(user._id as unknown as string);
      createNotification({
        userId: user._id as unknown as string,
        type:   'system',
        title:  'Welcome to Swibber! 🎉',
        body:   'Your account is ready. Start booking rides, food deliveries and parcel services.',
      }).catch(() => undefined);
    } else {
      const updatedProviders = user.authProviders.includes(detectedProvider)
        ? user.authProviders
        : [...user.authProviders, detectedProvider];

      await User.updateOne(
        { _id: user._id },
        {
          $set: {
            fcmToken: fcmToken ?? user.fcmToken,
            authProviders: updatedProviders,
            ...(detectedProvider === AuthProviderEnum.GOOGLE && !user.googleId && { googleId: decoded.uid }),
            ...(detectedProvider === AuthProviderEnum.APPLE && !user.appleId && { appleId: decoded.uid }),
            ...(avatarUrl && !user.avatarUrl && { avatarUrl }),
            ...(email && !user.email && { email }),
          },
        },
      );
      user = (await User.findById(user._id))!;
    }

    const payload = {
      id: (user._id as unknown as string).toString(),
      phone: user.phone,
      email: user.email,
      role: user.role as UserRole,
      firebaseUid: user.firebaseUid,
    };
    const tokens = await issueTokenPair(payload.id, payload);

    res.json({ success: true, data: { ...tokens, user: buildUserResponse(user) } });
  } catch (err) {
    next(err);
  }
};

export const refreshToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) { next(new AppError('Refresh token required', 400)); return; }

    const payload = verifyRefreshToken(token);
    const stored = await getRedis().get(`refresh:${payload.id}`);
    if (!stored || stored !== token) { next(new UnauthorizedError('Invalid refresh token')); return; }

    const user = await User.findById(payload.id).lean();
    if (!user) { next(new UnauthorizedError('User not found')); return; }

    const newPayload = {
      id: payload.id,
      phone: user.phone,
      email: user.email,
      role: user.role as UserRole,
      firebaseUid: user.firebaseUid,
    };
    const tokens = await issueTokenPair(payload.id, newPayload);
    res.json({ success: true, data: tokens });
  } catch {
    next(new UnauthorizedError('Invalid or expired refresh token'));
  }
};

export const logout = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    if (req.user?.id) await getRedis().del(`refresh:${req.user.id}`);
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (err) {
    next(err);
  }
};

export const getMe = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const user = await User.findById(req.user!.id).lean();
    if (!user) { next(new AppError('User not found', 404)); return; }
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
};

export const getAuthConfig = async (
  _req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    // findOneAndUpdate with upsert is atomic — safe against concurrent cold starts
    const config = await AuthConfig.findOneAndUpdate(
      {},
      { $setOnInsert: { providers: DEFAULT_AUTH_PROVIDERS, version: 1 } },
      { upsert: true, new: true, sort: { updatedAt: -1 } },
    ).lean();

    res.json({ success: true, data: config?.providers ?? DEFAULT_AUTH_PROVIDERS });
  } catch (err) {
    next(err);
  }
};

function deriveProvider(decoded: { phone_number?: string; email?: string; firebase?: { sign_in_provider?: string } }): AuthProvider {
  const signInProvider = decoded.firebase?.sign_in_provider ?? '';
  if (signInProvider.includes('google')) return AuthProviderEnum.GOOGLE;
  if (signInProvider.includes('apple')) return AuthProviderEnum.APPLE;
  if (signInProvider.includes('phone') || decoded.phone_number) return AuthProviderEnum.PHONE;
  return AuthProviderEnum.EMAIL;
}
