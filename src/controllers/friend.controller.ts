import { Response } from 'express';
import { AuthRequest } from '../types';
import prisma from '../config/database';
import { sendSuccess, sendError } from '../utils/response';

export class FriendController {
  // Send friend request
  async sendFriendRequest(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const senderId = req.user?.id;
      const { receiverId } = req.body;

      if (!senderId) {
        return sendError(res, 'Unauthorized', 'User not authenticated', 401);
      }

      if (senderId === receiverId) {
        return sendError(res, 'Invalid request', 'Cannot send friend request to yourself', 400);
      }

      // Check if receiver exists
      const receiver = await prisma.user.findUnique({
        where: { id: receiverId },
      });

      if (!receiver) {
        return sendError(res, 'User not found', 'Receiver does not exist', 404);
      }

      // Check if already friends
      const existingFriendship = await prisma.friend.findFirst({
        where: {
          OR: [
            { userId: senderId, friendId: receiverId },
            { userId: receiverId, friendId: senderId },
          ],
        },
      });

      if (existingFriendship) {
        return sendError(res, 'Already friends', 'You are already friends with this user', 400);
      }

      // Check if request already exists
      const existingRequest = await prisma.friendRequest.findFirst({
        where: {
          OR: [
            { senderId, receiverId },
            { senderId: receiverId, receiverId: senderId },
          ],
          status: 'PENDING',
        },
      });

      if (existingRequest) {
        return sendError(res, 'Request exists', 'Friend request already sent', 400);
      }

      // Create friend request
      const friendRequest = await prisma.friendRequest.create({
        data: {
          senderId,
          receiverId,
        },
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              fullName: true,
              avatar: true,
            },
          },
          receiver: {
            select: {
              id: true,
              username: true,
              fullName: true,
              avatar: true,
            },
          },
        },
      });

      // Create notification for receiver
      await prisma.notification.create({
        data: {
          userId: receiverId,
          title: 'New Friend Request',
          message: `${friendRequest.sender.fullName} sent you a friend request`,
          type: 'FRIEND_REQUEST',
          metadata: { friendRequestId: friendRequest.id },
        },
      });

      return sendSuccess(res, 'Friend request sent successfully', friendRequest, 201);
    } catch (error: any) {
      console.error('Send friend request error:', error);
      return sendError(res, 'Failed to send friend request', error.message, 500);
    }
  }

  // Accept friend request
  async acceptFriendRequest(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      const { requestId } = req.params;

      if (!userId) {
        return sendError(res, 'Unauthorized', 'User not authenticated', 401);
      }

      const friendRequest = await prisma.friendRequest.findUnique({
        where: { id: requestId },
      });

      if (!friendRequest) {
        return sendError(res, 'Request not found', 'Friend request does not exist', 404);
      }

      if (friendRequest.receiverId !== userId) {
        return sendError(res, 'Unauthorized', 'You cannot accept this request', 403);
      }

      if (friendRequest.status !== 'PENDING') {
        return sendError(res, 'Invalid request', 'Request already processed', 400);
      }

      // Update request status
      await prisma.friendRequest.update({
        where: { id: requestId },
        data: { status: 'ACCEPTED' },
      });

      // Create friendship (bidirectional)
      await prisma.friend.createMany({
        data: [
          { userId: friendRequest.senderId, friendId: friendRequest.receiverId },
          { userId: friendRequest.receiverId, friendId: friendRequest.senderId },
        ],
      });

      // Create notification for sender
      await prisma.notification.create({
        data: {
          userId: friendRequest.senderId,
          title: 'Friend Request Accepted',
          message: 'Your friend request was accepted',
          type: 'FRIEND_ACCEPTED',
        },
      });

      return sendSuccess(res, 'Friend request accepted');
    } catch (error: any) {
      console.error('Accept friend request error:', error);
      return sendError(res, 'Failed to accept friend request', error.message, 500);
    }
  }

  // Reject friend request
  async rejectFriendRequest(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      const { requestId } = req.params;

      if (!userId) {
        return sendError(res, 'Unauthorized', 'User not authenticated', 401);
      }

      const friendRequest = await prisma.friendRequest.findUnique({
        where: { id: requestId },
      });

      if (!friendRequest) {
        return sendError(res, 'Request not found', 'Friend request does not exist', 404);
      }

      if (friendRequest.receiverId !== userId) {
        return sendError(res, 'Unauthorized', 'You cannot reject this request', 403);
      }

      await prisma.friendRequest.update({
        where: { id: requestId },
        data: { status: 'REJECTED' },
      });

      return sendSuccess(res, 'Friend request rejected');
    } catch (error: any) {
      console.error('Reject friend request error:', error);
      return sendError(res, 'Failed to reject friend request', error.message, 500);
    }
  }

  // Get pending friend requests
  async getPendingRequests(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return sendError(res, 'Unauthorized', 'User not authenticated', 401);
      }

      const requests = await prisma.friendRequest.findMany({
        where: {
          receiverId: userId,
          status: 'PENDING',
        },
        include: {
          sender: {
            select: {
              id: true,
              username: true,
              fullName: true,
              avatar: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return sendSuccess(res, 'Pending requests retrieved', requests);
    } catch (error: any) {
      console.error('Get pending requests error:', error);
      return sendError(res, 'Failed to get pending requests', error.message, 500);
    }
  }

  // Get friends list
  async getFriends(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return sendError(res, 'Unauthorized', 'User not authenticated', 401);
      }

      const friends = await prisma.friend.findMany({
        where: { userId },
        include: {
          friend: {
            select: {
              id: true,
              username: true,
              fullName: true,
              avatar: true,
              bio: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      const friendsList = friends.map(f => f.friend);

      return sendSuccess(res, 'Friends retrieved successfully', friendsList);
    } catch (error: any) {
      console.error('Get friends error:', error);
      return sendError(res, 'Failed to get friends', error.message, 500);
    }
  }

  // Remove friend
  async removeFriend(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      const { friendId } = req.params;

      if (!userId) {
        return sendError(res, 'Unauthorized', 'User not authenticated', 401);
      }

      // Delete both directions of friendship
      await prisma.friend.deleteMany({
        where: {
          OR: [
            { userId, friendId },
            { userId: friendId, friendId: userId },
          ],
        },
      });

      return sendSuccess(res, 'Friend removed successfully');
    } catch (error: any) {
      console.error('Remove friend error:', error);
      return sendError(res, 'Failed to remove friend', error.message, 500);
    }
  }

  // Search users
  async searchUsers(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      const { query } = req.query;

      if (!userId) {
        return sendError(res, 'Unauthorized', 'User not authenticated', 401);
      }

      if (!query || typeof query !== 'string') {
        return sendError(res, 'Invalid query', 'Search query is required', 400);
      }

      const users = await prisma.user.findMany({
        where: {
          AND: [
            { id: { not: userId } },
            {
              OR: [
                { username: { contains: query, mode: 'insensitive' } },
                { fullName: { contains: query, mode: 'insensitive' } },
                { email: { contains: query, mode: 'insensitive' } },
              ],
            },
          ],
        },
        select: {
          id: true,
          username: true,
          fullName: true,
          avatar: true,
          bio: true,
        },
        take: 20,
      });

      return sendSuccess(res, 'Users found', users);
    } catch (error: any) {
      console.error('Search users error:', error);
      return sendError(res, 'Failed to search users', error.message, 500);
    }
  }
}