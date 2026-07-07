import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
import { Notification } from '../models/Notification';
import { paginate, formatPaginatedResponse } from '../utils/helpers';

export const getNotifications = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const page = parseInt(String(req.query.page ?? 1));
    const limit = parseInt(String(req.query.limit ?? 20));
    const { skip } = paginate(page, limit);
    const [notifications, total] = await Promise.all([
      Notification.find({ userId: req.user!.id }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Notification.countDocuments({ userId: req.user!.id }),
    ]);
    res.json({ success: true, ...formatPaginatedResponse(notifications, total, page, limit) });
  } catch (err) { next(err); }
};

export const markRead = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await Notification.findOneAndUpdate({ _id: req.params.id, userId: req.user!.id }, { isRead: true });
    res.json({ success: true });
  } catch (err) { next(err); }
};

export const markAllRead = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await Notification.updateMany({ userId: req.user!.id, isRead: false }, { isRead: true });
    res.json({ success: true });
  } catch (err) { next(err); }
};

export const deleteNotification = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    await Notification.findOneAndDelete({ _id: req.params.id, userId: req.user!.id });
    res.json({ success: true });
  } catch (err) { next(err); }
};

export const getUnreadCount = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const count = await Notification.countDocuments({ userId: req.user!.id, isRead: false });
    res.json({ success: true, data: { count } });
  } catch (err) { next(err); }
};
