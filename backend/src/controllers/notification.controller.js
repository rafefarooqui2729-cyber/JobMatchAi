import mongoose from 'mongoose';
import {
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  unreadNotificationCount,
} from '../services/notification.service.js';

function paginationValue(value, fallback, maximum) {
  if (value === undefined) return fallback;
  if (typeof value !== 'string' || !/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return parsed >= 1 && parsed <= maximum ? parsed : null;
}

export async function readNotifications(req, res, next) {
  const page = paginationValue(req.query.page, 1, 100000);
  const limit = paginationValue(req.query.limit, 20, 50);
  if (!page || !limit) {
    res.status(400).json({ error: { message: 'Page must be positive and limit must be between 1 and 50.' } });
    return;
  }
  try {
    res.status(200).json(await listNotifications(req.auth.id, { page, limit }));
  } catch (error) {
    next(error);
  }
}

export async function readUnreadCount(req, res, next) {
  try {
    res.status(200).json({ unreadCount: await unreadNotificationCount(req.auth.id) });
  } catch (error) {
    next(error);
  }
}

export async function markRead(req, res, next) {
  if (!mongoose.isValidObjectId(req.params.notificationId)) {
    res.status(400).json({ error: { message: 'A valid notification ID is required.' } });
    return;
  }
  try {
    const notification = await markNotificationRead(req.auth.id, req.params.notificationId);
    if (!notification) {
      res.status(404).json({ error: { message: 'Notification was not found.' } });
      return;
    }
    res.status(200).json({ notification });
  } catch (error) {
    next(error);
  }
}

export async function markAllRead(req, res, next) {
  try {
    res.status(200).json(await markAllNotificationsRead(req.auth.id));
  } catch (error) {
    next(error);
  }
}
