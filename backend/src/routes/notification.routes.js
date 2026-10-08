import { Router } from 'express';
import {
  markAllRead,
  markRead,
  readNotifications,
  readUnreadCount,
} from '../controllers/notification.controller.js';
import { authenticate, requireSameOrigin } from '../middleware/auth.middleware.js';

const notificationRouter = Router();
notificationRouter.use(requireSameOrigin, authenticate);
notificationRouter.get('/', readNotifications);
notificationRouter.get('/unread-count', readUnreadCount);
notificationRouter.patch('/read-all', markAllRead);
notificationRouter.patch('/:notificationId/read', markRead);

export default notificationRouter;
