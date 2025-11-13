import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { verifyToken } from '../utils/jwt';
import prisma from '../config/database';
import { config } from '../config';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

export class WebSocketServer {
  private io: Server;
  private connectedUsers: Map<string, string> = new Map(); // userId -> socketId

  constructor(httpServer: HttpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: config.client.url,
        methods: ['GET', 'POST'],
        credentials: true,
      },
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware() {
    // Authentication middleware
    this.io.use((socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

        if (!token) {
          return next(new Error('Authentication error: No token provided'));
        }

        const decoded = verifyToken(token);
        socket.userId = decoded.id;
        next();
      } catch (error) {
        next(new Error('Authentication error: Invalid token'));
      }
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      console.log(`User connected: ${socket.userId}`);

      if (socket.userId) {
        this.connectedUsers.set(socket.userId, socket.id);

        console.log("send notification");
        // Notify user's friends that they're online
        this.broadcastUserStatus(socket.userId, 'online');
      }

      // Join conversation rooms
      socket.on('join_conversation', async (conversationId: string) => {

        console.log("i reach here");
        console.log(conversationId);
        try {
          console.log("am here ")
          // Verify user is part of conversation
          const participant = await prisma.conversationParticipant.findFirst({
            where: {
              conversationId,
              userId: socket.userId,
            },
          });

          if (participant) {
            socket.join(`conversation:${conversationId}`);
            console.log(`User ${socket.userId} joined conversation ${conversationId}`);
          }
        } catch (error) {
          console.error('Join conversation error:', error);
        }
      });

      // Leave conversation room
      socket.on('leave_conversation', (conversationId: string) => {
        socket.leave(`conversation:${conversationId}`);
        console.log(`User ${socket.userId} left conversation ${conversationId}`);
      });

      // Send message
      socket.on('send_message', async (data: {
        conversationId: string;
        content: string;
        type?: string;
        attachments?: string[];
      }) => {
        try {
          console.log("hello am here");
          if (!socket.userId) return;

          console.log("am at Db Now");

          // Create message in database
          const message = await prisma.message.create({
            data: {
              conversationId: data.conversationId,
              senderId: socket.userId,
              content: data.content,
              type: (data.type as any) || 'TEXT',
              attachments: data.attachments || [],
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
            where: { id: data.conversationId },
            data: {
              lastMessage: data.content,
              lastMessageAt: new Date(),
            },
          });

          // Broadcast to conversation room
          this.io.to(`conversation:${data.conversationId}`).emit('new_message', message);

          // Send notifications to offline users
          const participants = await prisma.conversationParticipant.findMany({
            where: {
              conversationId: data.conversationId,
              userId: { not: socket.userId },
            },
          });

          for (const participant of participants) {
            if (!this.connectedUsers.has(participant.userId)) {
              await prisma.notification.create({
                data: {
                  userId: participant.userId,
                  title: 'New Message',
                  message: `${message.sender.fullName}: ${data.content.substring(0, 50)}`,
                  type: 'MESSAGE',
                  metadata: { conversationId: data.conversationId, messageId: message.id },
                },
              });
            }
          }
        } catch (error) {
          console.error('Send message error:', error);
          socket.emit('error', { message: 'Failed to send message' });
        }
      });

      // Typing indicator
      socket.on('typing', (data: { conversationId: string; isTyping: boolean }) => {
        socket.to(`conversation:${data.conversationId}`).emit('user_typing', {
          userId: socket.userId,
          conversationId: data.conversationId,
          isTyping: data.isTyping,
        });
      });

      // Bill updates
      socket.on('bill_update', async (data: { billId: string; status: string }) => {
        try {
          if (!socket.userId) return;

          const bill = await prisma.bill.findUnique({
            where: { id: data.billId },
            include: {
              participants: true,
              creator: {
                select: {
                  id: true,
                  fullName: true,
                },
              },
            },
          });

          if (!bill) return;

          // Notify all participants
          for (const participant of bill.participants) {
            const socketId = this.connectedUsers.get(participant.userId);
            if (socketId) {
              this.io.to(socketId).emit('bill_updated', {
                billId: data.billId,
                status: data.status,
                updatedBy: socket.userId,
              });
            }
          }
        } catch (error) {
          console.error('Bill update error:', error);
        }
      });

      // Transaction notifications
      socket.on('transaction_created', async (data: { transactionId: string }) => {
        try {
          const transaction = await prisma.transaction.findUnique({
            where: { id: data.transactionId },
            include: {
              sender: {
                select: {
                  id: true,
                  fullName: true,
                },
              },
              receiver: {
                select: {
                  id: true,
                  fullName: true,
                },
              },
            },
          });

          if (!transaction) return;

          // Notify receiver
          const receiverSocketId = this.connectedUsers.get(transaction.receiverId);
          if (receiverSocketId) {
            this.io.to(receiverSocketId).emit('transaction_received', transaction);
          }
        } catch (error) {
          console.error('Transaction notification error:', error);
        }
      });

      // Friend request notifications
      socket.on('friend_request_sent', async (data: { receiverId: string }) => {
        const receiverSocketId = this.connectedUsers.get(data.receiverId);
        if (receiverSocketId) {
          this.io.to(receiverSocketId).emit('friend_request_received', {
            senderId: socket.userId,
          });
        }
      });

      // Disconnect
      socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.userId}`);
        
        if (socket.userId) {
          this.connectedUsers.delete(socket.userId);
          this.broadcastUserStatus(socket.userId, 'offline');
        }
      });
    });
  }

  private async broadcastUserStatus(userId: string, status: 'online' | 'offline') {
    try {
      // Get user's friends
      const friends = await prisma.friend.findMany({
        where: { userId },
        select: { friendId: true },
      });

      console.log("am working");
      // Notify each online friend
      for (const friend of friends) {
        const friendSocketId = this.connectedUsers.get(friend.friendId);
        if (friendSocketId) {
          this.io.to(friendSocketId).emit('user_status_changed', {
            userId,
            status,
          });
        }
      }
    } catch (error) {
      console.error('Broadcast user status error:', error);
    }
  }

  // Public method to emit events from controllers
  public emitToUser(userId: string, event: string, data: any) {
    const socketId = this.connectedUsers.get(userId);
    if (socketId) {
      this.io.to(socketId).emit(event, data);
    }
  }

  public emitToConversation(conversationId: string, event: string, data: any) {
    this.io.to(`conversation:${conversationId}`).emit(event, data);
  }

  public getIO(): Server {
    return this.io;
  }

  public getConnectedUsers(): Map<string, string> {
    return this.connectedUsers;
  }
}