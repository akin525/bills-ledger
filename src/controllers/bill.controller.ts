import { Response } from 'express';
import { AuthRequest } from '../types';
import prisma from '../config/database';
import { sendSuccess, sendError } from '../utils/response';
// import { v4 as uuidv4 } from 'uuid';

export class BillController {
  // Create a new bill
  async createBill(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const creatorId = req.user?.id;
      let { title, description, totalAmount, currency, dueDate, conversationId, participants } = req.body;

      if (!creatorId) {
        return sendError(res, 'Unauthorized', 'User not authenticated', 401);
      }

      // Validate participants total amount
      const participantsTotal = participants.reduce((sum: number, p: any) => sum + p.amount, 0);
      if (Math.abs(participantsTotal - totalAmount) > 0.01) {
        return sendError(res, 'Invalid amounts', 'Participants amounts must equal total amount', 400);
      }

      // Create conversation if not provided
      if (!conversationId) {
        const conversation = await prisma.conversation.create({
          data: {
            name: `Bill: ${title}`,
            type: 'GROUP', // or whatever type you use
            participants: {
              create: [
                { userId: creatorId },
                ...participants.map((p: any) => ({ userId: p.userId })),
              ],
            },
          },
        });
        conversationId = conversation.id;
      } else {
        // Validate existing conversationId
        const conversationExists = await prisma.conversation.findUnique({
          where: { id: conversationId },
        });

        if (!conversationExists) {
          return sendError(res, 'Invalid conversation', 'Conversation not found', 404);
        }
      }

      // Create bill with participants
      const bill = await prisma.bill.create({
        data: {
          title,
          description,
          totalAmount,
          currency: currency || 'NGN',
          dueDate: dueDate ? new Date(dueDate) : null,
          conversationId,
          creatorId,
          participants: {
            create: participants.map((p: any) => ({
              userId: p.userId,
              amount: p.amount,
            })),
          },
        },
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              fullName: true,
              avatar: true,
            },
          },
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

      // Create notifications for all participants (except creator)
      const notificationPromises = participants
          .filter((p: any) => p.userId !== creatorId)
          .map((p: any) =>
              prisma.notification.create({
                data: {
                  userId: p.userId,
                  title: 'New Bill Created',
                  message: `${bill.creator.fullName} added you to a bill: ${title}`,
                  type: 'BILL_CREATED',
                  metadata: { billId: bill.id },
                },
              })
          );

      await Promise.all(notificationPromises);

      return sendSuccess(res, 'Bill created successfully', bill, 201);
    } catch (error: any) {
      console.error('Create bill error:', error);
      return sendError(res, 'Failed to create bill', error.message, 500);
    }
  }

  // Get bill by ID
  async getBillById(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      const { billId } = req.params;

      if (!userId) {
        return sendError(res, 'Unauthorized', 'User not authenticated', 401);
      }

      const bill = await prisma.bill.findUnique({
        where: { id: billId },
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              fullName: true,
              avatar: true,
            },
          },
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
          transactions: {
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
          },
        },
      });

      if (!bill) {
        return sendError(res, 'Bill not found', 'Bill does not exist', 404);
      }

      // Check if user is part of the bill
      const isParticipant = bill.participants.some(p => p.userId === userId) || bill.creatorId === userId;
      if (!isParticipant) {
        return sendError(res, 'Unauthorized', 'You are not part of this bill', 403);
      }

      return sendSuccess(res, 'Bill retrieved successfully', bill);
    } catch (error: any) {
      console.error('Get bill error:', error);
      return sendError(res, 'Failed to get bill', error.message, 500);
    }
  }

  // Get user's bills
  async getUserBills(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      const { status, type } = req.query;

      if (!userId) {
        return sendError(res, 'Unauthorized', 'User not authenticated', 401);
      }

      let whereClause: any = {
        OR: [
          { creatorId: userId },
          { participants: { some: { userId } } },
        ],
      };

      if (status) {
        whereClause.status = status;
      }

      const bills = await prisma.bill.findMany({
        where: whereClause,
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              fullName: true,
              avatar: true,
            },
          },
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
        orderBy: { createdAt: 'desc' },
      });

      // Filter based on type if provided
      let filteredBills = bills;
      if (type === 'owed') {
        // Bills where user owes money
        filteredBills = bills.filter(bill => 
          bill.participants.some(p => p.userId === userId && !p.isPaid)
        );
      } else if (type === 'owing') {
        // Bills where others owe user money
        filteredBills = bills.filter(bill => 
          bill.creatorId === userId && bill.participants.some(p => !p.isPaid)
        );
      }

      return sendSuccess(res, 'Bills retrieved successfully', filteredBills);
    } catch (error: any) {
      console.error('Get user bills error:', error);
      return sendError(res, 'Failed to get bills', error.message, 500);
    }
  }

  // Update bill status
  async updateBillStatus(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      const { billId } = req.params;
      const { status } = req.body;

      if (!userId) {
        return sendError(res, 'Unauthorized', 'User not authenticated', 401);
      }

      const bill = await prisma.bill.findUnique({
        where: { id: billId },
      });

      if (!bill) {
        return sendError(res, 'Bill not found', 'Bill does not exist', 404);
      }

      if (bill.creatorId !== userId) {
        return sendError(res, 'Unauthorized', 'Only bill creator can update status', 403);
      }

      const updatedBill = await prisma.bill.update({
        where: { id: billId },
        data: { status },
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              fullName: true,
              avatar: true,
            },
          },
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

      return sendSuccess(res, 'Bill status updated successfully', updatedBill);
    } catch (error: any) {
      console.error('Update bill status error:', error);
      return sendError(res, 'Failed to update bill status', error.message, 500);
    }
  }

  // Mark bill participant as paid
  async markAsPaid(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      const { billId } = req.params;
      const { amount } = req.body;

      if (!userId) {
        return sendError(res, 'Unauthorized', 'User not authenticated', 401);
      }

      const participant = await prisma.billParticipant.findFirst({
        where: {
          billId,
          userId,
        },
        include: {
          bill: true,
        },
      });

      if (!participant) {
        return sendError(res, 'Not found', 'You are not part of this bill', 404);
      }

      if (participant.isPaid) {
        return sendError(res, 'Already paid', 'You have already paid this bill', 400);
      }

      const paidAmount = amount || participant.amount;

      // Update participant
      const updatedParticipant = await prisma.billParticipant.update({
        where: { id: participant.id },
        data: {
          isPaid: paidAmount >= participant.amount,
          paidAmount: paidAmount,
          paidAt: new Date(),
        },
      });

      // Check if all participants have paid
      const allParticipants = await prisma.billParticipant.findMany({
        where: { billId },
      });

      const allPaid = allParticipants.every(p => p.isPaid);
      const anyPaid = allParticipants.some(p => p.isPaid);

      // Update bill status
      let newStatus = participant.bill.status;
      if (allPaid) {
        newStatus = 'PAID';
      } else if (anyPaid) {
        newStatus = 'PARTIALLY_PAID';
      }

      await prisma.bill.update({
        where: { id: billId },
        data: {
          status: newStatus,
          ...(allPaid && { paidAt: new Date() }),
        },
      });

      // Create notification for bill creator
      await prisma.notification.create({
        data: {
          userId: participant.bill.creatorId,
          title: 'Bill Payment Received',
          message: `Payment received for ${participant.bill.title}`,
          type: 'BILL_PAYMENT',
          metadata: { billId, amount: paidAmount },
        },
      });

      return sendSuccess(res, 'Payment recorded successfully', updatedParticipant);
    } catch (error: any) {
      console.error('Mark as paid error:', error);
      return sendError(res, 'Failed to record payment', error.message, 500);
    }
  }

  // Get bill summary for user
  async getBillSummary(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return sendError(res, 'Unauthorized', 'User not authenticated', 401);
      }

      // Get bills where user is participant
      const userParticipations = await prisma.billParticipant.findMany({
        where: { userId },
        include: { bill: true },
      });

      // Get bills created by user
      const createdBills = await prisma.bill.findMany({
        where: { creatorId: userId },
        include: { participants: true },
      });

      // Calculate totals
      const totalOwed = userParticipations
        .filter(p => !p.isPaid)
        .reduce((sum, p) => sum + (p.amount - p.paidAmount), 0);

      const totalOwing = createdBills.reduce((sum, bill) => {
        const unpaidAmount = bill.participants
          .filter(p => !p.isPaid)
          .reduce((s, p) => s + (p.amount - p.paidAmount), 0);
        return sum + unpaidAmount;
      }, 0);

      const summary = {
        totalOwed,
        totalOwing,
        netBalance: totalOwing - totalOwed,
        totalBills: userParticipations.length + createdBills.length,
        pendingBills: userParticipations.filter(p => !p.isPaid).length,
      };

      return sendSuccess(res, 'Bill summary retrieved', summary);
    } catch (error: any) {
      console.error('Get bill summary error:', error);
      return sendError(res, 'Failed to get bill summary', error.message, 500);
    }
  }

  // Delete bill
  async deleteBill(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      const { billId } = req.params;

      if (!userId) {
        return sendError(res, 'Unauthorized', 'User not authenticated', 401);
      }

      const bill = await prisma.bill.findUnique({
        where: { id: billId },
      });

      if (!bill) {
        return sendError(res, 'Bill not found', 'Bill does not exist', 404);
      }

      if (bill.creatorId !== userId) {
        return sendError(res, 'Unauthorized', 'Only bill creator can delete', 403);
      }

      await prisma.bill.delete({
        where: { id: billId },
      });

      return sendSuccess(res, 'Bill deleted successfully');
    } catch (error: any) {
      console.error('Delete bill error:', error);
      return sendError(res, 'Failed to delete bill', error.message, 500);
    }
  }
}