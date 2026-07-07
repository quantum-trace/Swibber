import { v4 as uuidv4 } from 'uuid';

export const generateOTP = (): string =>
  Math.floor(100000 + Math.random() * 900000).toString();

export const generateId = (): string => uuidv4();

/** Haversine great-circle distance in km. Used as a fallback when the Maps API is unavailable. */
export const calculateDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number => {
  const R    = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return parseFloat((R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))).toFixed(2));
};

const toRad = (deg: number): number => (deg * Math.PI) / 180;

export const paginate = (page: number, limit: number) => ({
  skip:  (page - 1) * limit,
  limit,
});

export const formatPaginatedResponse = <T>(
  data: T[],
  total: number,
  page: number,
  limit: number,
) => ({
  data,
  pagination: {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  },
});
