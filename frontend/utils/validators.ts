export const Validators = {
  isValidEmail: (email: string): boolean =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()),

  isValidIndianPhone: (phone: string): boolean =>
    /^(\+91)?[6-9]\d{9}$/.test(phone.replace(/\s/g, '')),

  isValidPassword: (password: string): boolean =>
    password.length >= 8 && /[A-Z]/.test(password) && /[0-9]/.test(password),

  isValidOTP: (otp: string): boolean => /^\d{6}$/.test(otp),

  isValidName: (name: string): boolean => name.trim().length >= 2,

  isValidPincode: (pincode: string): boolean => /^\d{6}$/.test(pincode),

  isValidUPI: (upi: string): boolean =>
    /^[\w.\-_]{3,}@[a-zA-Z]{3,}$/.test(upi),

  getPasswordStrength: (password: string): 'weak' | 'fair' | 'strong' | 'very_strong' => {
    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    if (score <= 1) return 'weak';
    if (score === 2) return 'fair';
    if (score === 3) return 'strong';
    return 'very_strong';
  },
} as const;
