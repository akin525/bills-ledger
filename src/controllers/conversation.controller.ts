import { Response } from 'express';
import { AuthRequest } from '../types';
import prisma from '../config/database';
import { sendSuccess, sendError } from '../utils/response';

export class ConversationController {
  // Create or get direct conversation
  async createOrGetDirectConversation(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      const { participantId } = req.body;

      if (!userId) {
        return sendError(res, 'Unauthorized', 'User not authenticated', 401);
      }

      if (userId === participantId) {
        return sendError(res, 'Invalid request', 'Cannot create conversation with yourself', 400);
      }

      // Check if conversation already exists
      const existingConversation = await prisma.conversation.findFirst({
        where: {
          type: 'DIRECT',
          participants: {
            every: {
              userId: {
                in: [userId, participantId],
              },
            },
          },
        },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  fullName: true,
                  avatar: true,
                },
              },
            },
          },
        },
      });

      if (existingConversation) {
        return sendSuccess(res, 'Conversation retrieved', existingConversation);
      }

      // Create new conversation
      const conversation = await prisma.conversation.create({
        data: {
          type: 'DIRECT',
          participants: {
            create: [
              { userId },
              { userId: participantId },
            ],
          },
        },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  fullName: true,
                  avatar: true,
                },
              },
            },
          },
        },
      });

      return sendSuccess(res, 'Conversation created successfully', conversation, 201);
    } catch (error: any) {
      console.error('Create conversation error:', error);
      return sendError(res, 'Failed to create conversation', error.message, 500);
    }
  }

  // Create group conversation
  async createGroupConversation(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      const { name, participantIds } = req.body;

      if (!userId) {
        return sendError(res, 'Unauthorized', 'User not authenticated', 401);
      }

      if (!participantIds || participantIds.length < 2) {
        return sendError(res, 'Invalid request', 'At least 2 participants required for group', 400);
      }

      // Add creator to participants if not included
      const allParticipants = [...new Set([userId, ...participantIds])];

      const conversation = await prisma.conversation.create({
        data: {
          type: 'GROUP',
          name,
          participants: {
            create: allParticipants.map(id => ({ userId: id })),
          },
        },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  fullName: true,
                  avatar: true,
                },
              },
            },
          },
        },
      });

      return sendSuccess(res, 'Group conversation created successfully', conversation, 201);
    } catch (error: any) {
      console.error('Create group conversation error:', error);
      return sendError(res, 'Failed to create group conversation', error.message, 500);
    }
  }

  // Get user's conversations
  async getUserConversations(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return sendError(res, 'Unauthorized', 'User not authenticated', 401);
      }

      const conversations = await prisma.conversation.findMany({
        where: {
          participants: {
            some: {
              userId,
            },
          },
        },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  fullName: true,
                  avatar: true,
                },
              },
            },
          },
          messages: {
            take: 1,
            orderBy: { createdAt: 'desc' },
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
          },
        },
        orderBy: { lastMessageAt: 'desc' },
      });

      // Format conversations with unread count
      const formattedConversations = await Promise.all(
        conversations.map(async (conv) => {
          const participant = conv.participants.find(p => p.userId === userId);
          const unreadCount = await prisma.message.count({
            where: {
              conversationId: conv.id,
              senderId: { not: userId },
              createdAt: {
                gt: participant?.lastReadAt || new Date(0),
              },
            },
          });

          return {
            ...conv,
            unreadCount,
            lastMessage: conv.messages[0] || null,
          };
        })
      );

      return sendSuccess(res, 'Conversations retrieved successfully', formattedConversations);
    } catch (error: any) {
      console.error('Get conversations error:', error);
      return sendError(res, 'Failed to get conversations', error.message, 500);
    }
  }

  // Get conversation by ID
  async getConversationById(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      const { conversationId } = req.params;

      if (!userId) {
        return sendError(res, 'Unauthorized', 'User not authenticated', 401);
      }

      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: {
          participants: {
            include: {
              user: {
                select: {
                  id: true,
                  username: true,
                  fullName: true,
                  avatar: true,
                },
              },
            },
          },
        },
      });

      if (!conversation) {
        return sendError(res, 'Conversation not found', 'Conversation does not exist', 404);
      }

      // Check if user is participant
      const isParticipant = conversation.participants.some(p => p.userId === userId);
      if (!isParticipant) {
        return sendError(res, 'Unauthorized', 'You are not part of this conversation', 403);
      }

      return sendSuccess(res, 'Conversation retrieved successfully', conversation);
    } catch (error: any) {
      console.error('Get conversation error:', error);
      return sendError(res, 'Failed to get conversation', error.message, 500);
    }
  }

  // Get conversation messages
  async getConversationMessages(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      const { conversationId } = req.params;
      const { page = 1, limit = 50 } = req.query;

      if (!userId) {
        return sendError(res, 'Unauthorized', 'User not authenticated', 401);
      }

      // Check if user is participant
      const participant = await prisma.conversationParticipant.findFirst({
        where: {
          conversationId,
          userId,
        },
      });

      if (!participant) {
        return sendError(res, 'Unauthorized', 'You are not part of this conversation', 403);
      }

      const skip = (Number(page) - 1) * Number(limit);

      const [messages, total] = await Promise.all([
        prisma.message.findMany({
          where: { conversationId },
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
          skip,
          take: Number(limit),
        }),
        prisma.message.count({ where: { conversationId } }),
      ]);

      // Update last read timestamp
      await prisma.conversationParticipant.update({
        where: { id: participant.id },
        data: { lastReadAt: new Date() },
      });

      return sendSuccess(res, 'Messages retrieved successfully', {
        messages: messages.reverse(),
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error: any) {
      console.error('Get messages error:', error);
      return sendError(res, 'Failed to get messages', error.message, 500);
    }
  }

  // Send message
  async sendMessage(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const senderId = req.user?.id;
      const { conversationId, content, type, attachments } = req.body;

      if (!senderId) {
        return sendError(res, 'Unauthorized', 'User not authenticated', 401);
      }

      // Check if user is participant
      const participant = await prisma.conversationParticipant.findFirst({
        where: {
          conversationId,
          userId: senderId,
        },
      });

      if (!participant) {
        return sendError(res, 'Unauthorized', 'You are not part of this conversation', 403);
      }

      // Create message
      const message = await prisma.message.create({
        data: {
          conversationId,
          senderId,
          content,
          type: type || 'TEXT',
          attachments: attachments || [],
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
      });

      // Update conversation last message
      await prisma.conversation.update({
        where: { id: conversationId },
        data: {
          lastMessage: content,
          lastMessageAt: new Date(),
        },
      });

      return sendSuccess(res, 'Message sent successfully', message, 201);
    } catch (error: any) {
      console.error('Send message error:', error);
      return sendError(res, 'Failed to send message', error.message, 500);
    }
  }

  // Add participant to group
  async addParticipant(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      const { conversationId } = req.params;
      const { participantId } = req.body;

      if (!userId) {
        return sendError(res, 'Unauthorized', 'User not authenticated', 401);
      }

      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
      });

      if (!conversation) {
        return sendError(res, 'Conversation not found', 'Conversation does not exist', 404);
      }

      if (conversation.type !== 'GROUP') {
        return sendError(res, 'Invalid request', 'Can only add participants to group conversations', 400);
      }

      // Check if user is already participant
      const existingParticipant = await prisma.conversationParticipant.findFirst({
        where: {
          conversationId,
          userId: participantId,
        },
      });

      if (existingParticipant) {
        return sendError(res, 'Already participant', 'User is already in this conversation', 400);
      }

      await prisma.conversationParticipant.create({
        data: {
          conversationId,
          userId: participantId,
        },
      });

      return sendSuccess(res, 'Participant added successfully');
    } catch (error: any) {
      console.error('Add participant error:', error);
      return sendError(res, 'Failed to add participant', error.message, 500);
    }
  }

  // Leave conversation
  async leaveConversation(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      const { conversationId } = req.params;

      if (!userId) {
        return sendError(res, 'Unauthorized', 'User not authenticated', 401);
      }

      await prisma.conversationParticipant.deleteMany({
        where: {
          conversationId,
          userId,
        },
      });

      return sendSuccess(res, 'Left conversation successfully');
    } catch (error: any) {
      console.error('Leave conversation error:', error);
      return sendError(res, 'Failed to leave conversation', error.message, 500);
    }
  }
}