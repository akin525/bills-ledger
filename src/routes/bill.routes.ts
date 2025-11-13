import { Router } from 'express';
import { BillController } from '../controllers/bill.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { createBillValidator, updateBillValidator } from '../utils/validators';

const router = Router();
const billController = new BillController();

// All routes are protected
router.use(authenticate);

router.post('/', createBillValidator, validate, billController.createBill.bind(billController));
router.get('/', billController.getUserBills.bind(billController));
router.get('/summary', billController.getBillSummary.bind(billController));
router.get('/:billId', billController.getBillById.bind(billController));
router.put('/:billId/status', updateBillValidator, validate, billController.updateBillStatus.bind(billController));
router.post('/:billId/pay', billController.markAsPaid.bind(billController));
router.delete('/:billId', billController.deleteBill.bind(billController));

export default router;