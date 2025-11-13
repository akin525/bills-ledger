import { Router } from 'express';
import { TransactionController } from '../controllers/transaction.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { createTransactionValidator } from '../utils/validators';

const router = Router();
const transactionController = new TransactionController();

// All routes are protected
router.use(authenticate);

router.post('/', createTransactionValidator, validate, transactionController.createTransaction.bind(transactionController));
router.get('/', transactionController.getUserTransactions.bind(transactionController));
router.get('/stats', transactionController.getTransactionStats.bind(transactionController));
router.get('/:transactionId', transactionController.getTransactionById.bind(transactionController));
router.post('/:transactionId/cancel', transactionController.cancelTransaction.bind(transactionController));

export default router;