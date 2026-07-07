import { Config } from '../constants/config';

export const formatCurrency = (amount: number): string =>
  `${Config.CURRENCY_SYMBOL}${amount.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

export const formatDistance = (km: number): string =>
  km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1)} km`;

export const formatDuration = (minutes: number): string => {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} hr` : `${h} hr ${m} min`;
};

export const formatRelativeTime = (dateStr: string): string => {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} hr ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} day${Math.floor(diff / 86400) > 1 ? 's' : ''} ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

export const formatDate = (dateStr: string): string =>
  new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export const formatTime = (dateStr: string): string =>
  new Date(dateStr).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });

export const formatPhoneNumber = (phone: string): string =>
  phone.replace(/(\+91)\s?(\d{5})(\d{5})/, '$1 $2 $3');

export const maskCardNumber = (cardNumber: string): string =>
  `•••• •••• •••• ${cardNumber.slice(-4)}`;

export const formatOrdinal = (n: number): string => {
  const suffixes = ['th', 'st', 'nd', 'rd'];
  const v = n % 100;
  return n + (suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0]);
};

export const capitalize = (str: string): string =>
  str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

export const truncate = (str: string, maxLen: number): string =>
  str.length > maxLen ? `${str.slice(0, maxLen - 3)}...` : str;

export const formatRating = (rating: number): string => rating.toFixed(1);

export const formatReviewCount = (count: number): string =>
  count >= 1000 ? `${(count / 1000).toFixed(1)}k` : `${count}`;
