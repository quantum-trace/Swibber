import rateLimit from 'express-rate-limit';

export const globalRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, please try again later' },
});

export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many auth attempts, please try again in 15 minutes' },
});

export const otpRateLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 3,
  message: { success: false, error: 'Too many OTP requests' },
});
