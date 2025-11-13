import { Response } from 'express';
import { AuthRequest } from '../types';
import prisma from '../config/database';
import { sendSuccess, sendError } from '../utils/response';

export class NotificationController {
  // Get user notifications
  async getNotifications(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      const { page = 1, limit = 20, isRead } = req.query;

      if (!userId) {
        return sendError(res, 'Unauthorized', 'User not authenticated', 401);
      }

      const skip = (Number(page) - 1) * Number(limit);

      let whereClause: any = { userId };
      if (isRead !== undefined) {
        whereClause.isRead = isRead === 'true';
      }

      const [notifications, total, unreadCount] = await Promise.all([
        prisma.notification.findMany({
          where: whereClause,
          orderBy: { createdAt: 'desc' },
          skip,
          take: Number(limit),
        }),
        prisma.notification.count({ where: whereClause }),
        prisma.notification.count({
          where: {
            userId,
            isRead: false,
          },
        }),
      ]);

      return sendSuccess(res, 'Notifications retrieved successfully', {
        notifications,
        unreadCount,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error: any) {
      console.error('Get notifications error:', error);
      return sendError(res, 'Failed to get notifications', error.message, 500);
    }
  }

  // Mark notification as read
  async markAsRead(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      const { notificationId } = req.params;

      if (!userId) {
        return sendError(res, 'Unauthorized', 'User not authenticated', 401);
      }

      const notification = await prisma.notification.findUnique({
        where: { id: notificationId },
      });

      if (!notification) {
        return sendError(res, 'Notification not found', 'Notification does not exist', 404);
      }

      if (notification.userId !== userId) {
        return sendError(res, 'Unauthorized', 'This is not your notification', 403);
      }

      const updatedNotification = await prisma.notification.update({
        where: { id: notificationId },
        data: { isRead: true },
      });

      return sendSuccess(res, 'Notification marked as read', updatedNotification);
    } catch (error: any) {
      console.error('Mark notification as read error:', error);
      return sendError(res, 'Failed to mark notification as read', error.message, 500);
    }
  }

  // Mark all notifications as read
  async markAllAsRead(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return sendError(res, 'Unauthorized', 'User not authenticated', 401);
      }

      await prisma.notification.updateMany({
        where: {
          userId,
          isRead: false,
        },
        data: { isRead: true },
      });

      return sendSuccess(res, 'All notifications marked as read');
    } catch (error: any) {
      console.error('Mark all as read error:', error);
      return sendError(res, 'Failed to mark all notifications as read', error.message, 500);
    }
  }

  // Delete notification
  async deleteNotification(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      const { notificationId } = req.params;

      if (!userId) {
        return sendError(res, 'Unauthorized', 'User not authenticated', 401);
      }

      const notification = await prisma.notification.findUnique({
        where: { id: notificationId },
      });

      if (!notification) {
        return sendError(res, 'Notification not found', 'Notification does not exist', 404);
      }

      if (notification.userId !== userId) {
        return sendError(res, 'Unauthorized', 'This is not your notification', 403);
      }

      await prisma.notification.delete({
        where: { id: notificationId },
      });

      return sendSuccess(res, 'Notification deleted successfully');
    } catch (error: any) {
      console.error('Delete notification error:', error);
      return sendError(res, 'Failed to delete notification', error.message, 500);
    }
  }

  // Get unread count
  async getUnreadCount(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return sendError(res, 'Unauthorized', 'User not authenticated', 401);
      }

      const unreadCount = await prisma.notification.count({
        where: {
          userId,
          isRead: false,
        },
      });

      return sendSuccess(res, 'Unread count retrieved', { unreadCount });
    } catch (error: any) {
      console.error('Get unread count error:', error);
      return sendError(res, 'Failed to get unread count', error.message, 500);
    }
  }
}