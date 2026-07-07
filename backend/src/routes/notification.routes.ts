import { Router } from 'express';
import { getNotifications, markRead, markAllRead, deleteNotification, getUnreadCount } from '../controllers/notification.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.get('/', authenticate, getNotifications);
router.get('/unread-count', authenticate, getUnreadCount);
router.put('/mark-all-read', authenticate, markAllRead);
router.put('/:id/read', authenticate, markRead);
router.delete('/:id', authenticate, deleteNotification);

export default router;
