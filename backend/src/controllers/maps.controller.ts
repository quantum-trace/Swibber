import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import {
  getPlacesAutocomplete,
  getPlaceDetails,
  reverseGeocode,
  getDirections,
  getNearbyPlaces,
} from '../services/maps.service';

export const autocomplete = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { input, lat, lng } = req.query;
    const results = await getPlacesAutocomplete(
      String(input),
      lat ? parseFloat(String(lat)) : undefined,
      lng ? parseFloat(String(lng)) : undefined,
    );
    res.json({ success: true, data: results });
  } catch (err) { next(err); }
};

export const placeDetails = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await getPlaceDetails(String(req.query.placeId));
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

export const reverseGeocodeHandler = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { lat, lng } = req.query;
    const address = await reverseGeocode(parseFloat(String(lat)), parseFloat(String(lng)));
    res.json({ success: true, data: { address } });
  } catch (err) { next(err); }
};

export const getRoute = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { originLat, originLng, destLat, destLng } = req.query;
    const result = await getDirections(
      parseFloat(String(originLat)),
      parseFloat(String(originLng)),
      parseFloat(String(destLat)),
      parseFloat(String(destLng)),
    );
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
};

export const nearbyPlaces = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const { lat, lng, radius, type } = req.query;
    const results = await getNearbyPlaces(
      parseFloat(String(lat)),
      parseFloat(String(lng)),
      radius ? parseInt(String(radius)) : undefined,
      type ? String(type) : undefined,
    );
    res.json({ success: true, data: results });
  } catch (err) { next(err); }
};
