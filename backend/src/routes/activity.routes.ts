import { Router } from 'express';
import { getActivity } from '../controllers/activity.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getActivity);

export default router;
