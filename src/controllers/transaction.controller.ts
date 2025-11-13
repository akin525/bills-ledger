import { Response } from 'express';
import { AuthRequest } from '../types';
import prisma from '../config/database';
import { sendSuccess, sendError } from '../utils/response';
import { v4 as uuidv4 } from 'uuid';

export class TransactionController {
  // Create a new transaction
  async createTransaction(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const senderId = req.user?.id;
      const { receiverId, amount, description, billId, currency } = req.body;

      if (!senderId) {
        return sendError(res, 'Unauthorized', 'User not authenticated', 401);
      }

      if (senderId === receiverId) {
        return sendError(res, 'Invalid transaction', 'Cannot send money to yourself', 400);
      }

      // Check if receiver exists
      const receiver = await prisma.user.findUnique({
        where: { id: receiverId },
      });

      if (!receiver) {
        return sendError(res, 'User not found', 'Receiver does not exist', 404);
      }

      // Generate unique reference
      const reference = `TXN-${uuidv4().substring(0, 8).toUpperCase()}`;

      // Determine transaction type
      let type: 'BILL_PAYMENT' | 'DIRECT_TRANSFER' = 'DIRECT_TRANSFER';
      if (billId) {
        type = 'BILL_PAYMENT';
      }

      // Create transaction
      const transaction = await prisma.transaction.create({
        data: {
          senderId,
          receiverId,
          amount,
          description,
          billId,
          currency: currency || 'NGN',
          reference,
          type,
          status: 'COMPLETED', // In real app, this would be PENDING until payment gateway confirms
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
          bill: true,
        },
      });

      // If this is a bill payment, update the bill participant
      if (billId) {
        const participant = await prisma.billParticipant.findFirst({
          where: {
            billId,
            userId: senderId,
          },
        });

        if (participant) {
          const newPaidAmount = participant.paidAmount + amount;
          const isPaid = newPaidAmount >= participant.amount;

          await prisma.billParticipant.update({
            where: { id: participant.id },
            data: {
              paidAmount: newPaidAmount,
              isPaid,
              ...(isPaid && { paidAt: new Date() }),
            },
          });

          // Check if all participants have paid
          const allParticipants = await prisma.billParticipant.findMany({
            where: { billId },
          });

          const allPaid = allParticipants.every(p => p.isPaid);
          const anyPaid = allParticipants.some(p => p.isPaid);

          // Update bill status
          let newStatus = 'PENDING';
          if (allPaid) {
            newStatus = 'PAID';
          } else if (anyPaid) {
            newStatus = 'PARTIALLY_PAID';
          }

          await prisma.bill.update({
            where: { id: billId },
            data: {
              status: newStatus as any,
              ...(allPaid && { paidAt: new Date() }),
            },
          });
        }
      }

      // Create notifications
      await prisma.notification.create({
        data: {
          userId: receiverId,
          title: 'Payment Received',
          message: `You received ${currency || 'NGN'} ${amount} from ${transaction.sender.fullName}`,
          type: 'TRANSACTION',
          metadata: { transactionId: transaction.id },
        },
      });

      return sendSuccess(res, 'Transaction created successfully', transaction, 201);
    } catch (error: any) {
      console.error('Create transaction error:', error);
      return sendError(res, 'Failed to create transaction', error.message, 500);
    }
  }

  // Get transaction by ID
  async getTransactionById(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      const { transactionId } = req.params;

      if (!userId) {
        return sendError(res, 'Unauthorized', 'User not authenticated', 401);
      }

      const transaction = await prisma.transaction.findUnique({
        where: { id: transactionId },
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
          bill: {
            include: {
              creator: {
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

      if (!transaction) {
        return sendError(res, 'Transaction not found', 'Transaction does not exist', 404);
      }

      // Check if user is part of the transaction
      if (transaction.senderId !== userId && transaction.receiverId !== userId) {
        return sendError(res, 'Unauthorized', 'You are not part of this transaction', 403);
      }

      return sendSuccess(res, 'Transaction retrieved successfully', transaction);
    } catch (error: any) {
      console.error('Get transaction error:', error);
      return sendError(res, 'Failed to get transaction', error.message, 500);
    }
  }

  // Get user's transactions
  async getUserTransactions(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      const { type, status, page = 1, limit = 20 } = req.query;

      if (!userId) {
        return sendError(res, 'Unauthorized', 'User not authenticated', 401);
      }

      const skip = (Number(page) - 1) * Number(limit);

      let whereClause: any = {
        OR: [
          { senderId: userId },
          { receiverId: userId },
        ],
      };

      if (type) {
        whereClause.type = type;
      }

      if (status) {
        whereClause.status = status;
      }

      const [transactions, total] = await Promise.all([
        prisma.transaction.findMany({
          where: whereClause,
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
            bill: {
              select: {
                id: true,
                title: true,
                status: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: Number(limit),
        }),
        prisma.transaction.count({ where: whereClause }),
      ]);

      return sendSuccess(res, 'Transactions retrieved successfully', {
        transactions,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error: any) {
      console.error('Get user transactions error:', error);
      return sendError(res, 'Failed to get transactions', error.message, 500);
    }
  }

  // Get transaction statistics
  async getTransactionStats(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return sendError(res, 'Unauthorized', 'User not authenticated', 401);
      }

      // Get sent transactions
      const sentTransactions = await prisma.transaction.findMany({
        where: {
          senderId: userId,
          status: 'COMPLETED',
        },
      });

      // Get received transactions
      const receivedTransactions = await prisma.transaction.findMany({
        where: {
          receiverId: userId,
          status: 'COMPLETED',
        },
      });

      const totalSent = sentTransactions.reduce((sum, t) => sum + t.amount, 0);
      const totalReceived = receivedTransactions.reduce((sum, t) => sum + t.amount, 0);

      const stats = {
        totalSent,
        totalReceived,
        netBalance: totalReceived - totalSent,
        totalTransactions: sentTransactions.length + receivedTransactions.length,
        sentCount: sentTransactions.length,
        receivedCount: receivedTransactions.length,
      };

      return sendSuccess(res, 'Transaction statistics retrieved', stats);
    } catch (error: any) {
      console.error('Get transaction stats error:', error);
      return sendError(res, 'Failed to get transaction statistics', error.message, 500);
    }
  }

  // Cancel transaction (only if pending)
  async cancelTransaction(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      const { transactionId } = req.params;

      if (!userId) {
        return sendError(res, 'Unauthorized', 'User not authenticated', 401);
      }

      const transaction = await prisma.transaction.findUnique({
        where: { id: transactionId },
      });

      if (!transaction) {
        return sendError(res, 'Transaction not found', 'Transaction does not exist', 404);
      }

      if (transaction.senderId !== userId) {
        return sendError(res, 'Unauthorized', 'Only sender can cancel transaction', 403);
      }

      if (transaction.status !== 'PENDING') {
        return sendError(res, 'Cannot cancel', 'Only pending transactions can be cancelled', 400);
      }

      const updatedTransaction = await prisma.transaction.update({
        where: { id: transactionId },
        data: { status: 'CANCELLED' },
      });

      return sendSuccess(res, 'Transaction cancelled successfully', updatedTransaction);
    } catch (error: any) {
      console.error('Cancel transaction error:', error);
      return sendError(res, 'Failed to cancel transaction', error.message, 500);
    }
  }
}