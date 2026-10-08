import mongoose from 'mongoose';
import Notification from '../models/notification.model.js';
import { emitToUser } from '../sockets/index.js';
import { SOCKET_EVENTS } from '../sockets/events.js';

export async function createAndEmitNotification(userId, details) {
  const notification = await Notification.create({
    recipient: userId,
    type: details.type,
    title: details.title,
    message: details.message,
    resource: details.resource,
  });
  const value = notification.toObject({ versionKey: false });
  emitToUser(userId, SOCKET_EVENTS.NOTIFICATION_CREATED, { notification: value });
  return value;
}

export async function listNotifications(userId, { limit = 20, page = 1 } = {}) {
  const filter = { recipient: userId };
  const [notifications, total, unreadCount] = await Promise.all([
    Notification.find(filter)
      .sort({ createdAt: -1, _id: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Notification.countDocuments(filter),
    Notification.countDocuments({ ...filter, readAt: null }),
  ]);
  return {
    notifications,
    unreadCount,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
  };
}

export async function unreadNotificationCount(userId) {
  return Notification.countDocuments({ recipient: userId, readAt: null });
}

export async function markNotificationRead(userId, notificationId) {
  if (!mongoose.isValidObjectId(notificationId)) return null;
  const notification = await Notification.findOneAndUpdate(
    { _id: notificationId, recipient: userId, readAt: null },
    { $set: { readAt: new Date() } },
    { new: true },
  ).lean();
  if (notification) return notification;
  return Notification.findOne({ _id: notificationId, recipient: userId }).lean();
}

export async function markAllNotificationsRead(userId) {
  const result = await Notification.updateMany(
    { recipient: userId, readAt: null },
    { $set: { readAt: new Date() } },
  );
  return { modifiedCount: result.modifiedCount };
}
