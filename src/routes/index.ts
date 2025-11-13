import { Router } from 'express';
import authRoutes from './auth.routes';
import friendRoutes from './friend.routes';
import billRoutes from './bill.routes';
import transactionRoutes from './transaction.routes';
import conversationRoutes from './conversation.routes';
import notificationRoutes from './notification.routes';
import organizationRoutes from './organization.routes';

const router = Router();

// Health check
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Bills Ledger API is running',
    timestamp: new Date().toISOString(),
  });
});

// API routes
router.use('/auth', authRoutes);
router.use('/friends', friendRoutes);
router.use('/bills', billRoutes);
router.use('/transactions', transactionRoutes);
router.use('/conversations', conversationRoutes);
router.use('/notifications', notificationRoutes);
router.use('/organizations', organizationRoutes);

export default router;