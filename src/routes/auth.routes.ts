import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';
import { validate } from '../middleware/validation';
import {
  registerValidator,
  loginValidator,
  resetPasswordValidator,
  updatePasswordValidator,
  updateProfileValidator,
} from '../utils/validators';

const router = Router();
const authController = new AuthController();

// Public routes
router.post('/register', registerValidator, validate, authController.register.bind(authController));
router.post('/login', loginValidator, validate, authController.login.bind(authController));
router.post('/forgot-password', resetPasswordValidator, validate, authController.requestPasswordReset.bind(authController));
router.post('/reset-password', updatePasswordValidator, validate, authController.resetPassword.bind(authController));

// Protected routes
router.get('/me', authenticate, authController.getCurrentUser.bind(authController));
router.put('/profile', authenticate, updateProfileValidator, validate, authController.updateProfile.bind(authController));

export default router;