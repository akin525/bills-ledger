import { body, param, query, ValidationChain } from 'express-validator';

// Auth Validators
export const registerValidator: ValidationChain[] = [
  body('email').isEmail().withMessage('Invalid email address'),
  body('username').isLength({ min: 3, max: 30 }).withMessage('Username must be 3-30 characters'),
  body('fullName').notEmpty().withMessage('Full name is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('phoneNumber').optional().isMobilePhone('any').withMessage('Invalid phone number'),
];

export const loginValidator: ValidationChain[] = [
  body('email').isEmail().withMessage('Invalid email address'),
  body('password').notEmpty().withMessage('Password is required'),
];

export const resetPasswordValidator: ValidationChain[] = [
  body('email').isEmail().withMessage('Invalid email address'),
];

export const updatePasswordValidator: ValidationChain[] = [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
];

// User Validators
export const updateProfileValidator: ValidationChain[] = [
  body('fullName').optional().notEmpty().withMessage('Full name cannot be empty'),
  body('phoneNumber').optional().isMobilePhone('any').withMessage('Invalid phone number'),
  body('bio').optional().isLength({ max: 500 }).withMessage('Bio must be less than 500 characters'),
];

// Bill Validators
export const createBillValidator: ValidationChain[] = [
  body('title').notEmpty().withMessage('Bill title is required'),
  body('totalAmount').isFloat({ min: 0 }).withMessage('Total amount must be a positive number'),
  body('description').optional().isString(),
  body('dueDate').optional().isISO8601().withMessage('Invalid due date'),
  body('participants').isArray({ min: 1 }).withMessage('At least one participant is required'),
  body('participants.*.userId').notEmpty().withMessage('Participant user ID is required'),
  body('participants.*.amount').isFloat({ min: 0 }).withMessage('Participant amount must be positive'),
];

export const updateBillValidator: ValidationChain[] = [
  param('billId').isUUID().withMessage('Invalid bill ID'),
  body('status').optional().isIn(['PENDING', 'PARTIALLY_PAID', 'PAID', 'CANCELLED', 'OVERDUE']),
];

// Transaction Validators
export const createTransactionValidator: ValidationChain[] = [
  body('receiverId').isUUID().withMessage('Invalid receiver ID'),
  body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be greater than 0'),
  body('description').optional().isString(),
  body('billId').optional().isUUID().withMessage('Invalid bill ID'),
];

// Message Validators
export const sendMessageValidator: ValidationChain[] = [
  body('conversationId').isUUID().withMessage('Invalid conversation ID'),
  body('content').notEmpty().withMessage('Message content is required'),
  body('type').optional().isIn(['TEXT', 'IMAGE', 'FILE', 'BILL_REQUEST', 'BILL_PAYMENT', 'SYSTEM']),
];

// Friend Request Validators
export const sendFriendRequestValidator: ValidationChain[] = [
  body('receiverId').isUUID().withMessage('Invalid receiver ID'),
];

// Organization Validators
export const createOrganizationValidator: ValidationChain[] = [
  body('name').notEmpty().withMessage('Organization name is required'),
  body('description').optional().isString(),
];

export const addOrganizationMemberValidator: ValidationChain[] = [
  param('organizationId').isUUID().withMessage('Invalid organization ID'),
  body('userId').isUUID().withMessage('Invalid user ID'),
  body('role').optional().isIn(['ADMIN', 'MEMBER']),
];

// Pagination Validators
export const paginationValidator: ValidationChain[] = [
  query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
];