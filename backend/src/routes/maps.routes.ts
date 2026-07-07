import { Router } from 'express';
import { autocomplete, placeDetails, reverseGeocodeHandler, getRoute, nearbyPlaces } from '../controllers/maps.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/autocomplete', authenticate, autocomplete);
router.get('/place-details', authenticate, placeDetails);
router.get('/reverse-geocode', authenticate, reverseGeocodeHandler);
router.get('/directions', authenticate, getRoute);
router.get('/nearby', authenticate, nearbyPlaces);

export default router;
