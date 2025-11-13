import { Request, Response } from 'express';
import { AuthRequest } from '../types';
import prisma from '../config/database';
import { hashPassword, comparePassword } from '../utils/password';
import { generateToken } from '../utils/jwt';
import { sendSuccess, sendError } from '../utils/response';
import { v4 as uuidv4 } from 'uuid';

export class AuthController {
  // Register new user
  async register(req: Request, res: Response): Promise<Response> {
    try {
      const { email, username, fullName, password, phoneNumber } = req.body;

      // Check if user already exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [{ email }, { username }],
        },
      });

      if (existingUser) {
        return sendError(res, 'User already exists', 'Email or username already taken', 409);
      }

      // Hash password
      const hashedPassword = await hashPassword(password);

      // Create user
      const user = await prisma.user.create({
        data: {
          email,
          username,
          fullName,
          password: hashedPassword,
          phoneNumber,
        },
        select: {
          id: true,
          email: true,
          username: true,
          fullName: true,
          phoneNumber: true,
          avatar: true,
          createdAt: true,
        },
      });

      // Generate token
      const token = generateToken({
        id: user.id,
        email: user.email,
        username: user.username,
      });

      return sendSuccess(
        res,
        'User registered successfully',
        { user, token },
        201
      );
    } catch (error: any) {
      console.error('Register error:', error);
      return sendError(res, 'Registration failed', error.message, 500);
    }
  }

  // Login user
  async login(req: Request, res: Response): Promise<Response> {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        return sendError(res, 'Invalid credentials', 'Email or password is incorrect', 401);
      }

      // Verify password
      const isPasswordValid = await comparePassword(password, user.password);

      if (!isPasswordValid) {
        return sendError(res, 'Invalid credentials', 'Email or password is incorrect', 401);
      }

      // Generate token
      const token = generateToken({
        id: user.id,
        email: user.email,
        username: user.username,
      });

      // Return user without password
      const { password: _, ...userWithoutPassword } = user;

      return sendSuccess(res, 'Login successful', {
        user: userWithoutPassword,
        token,
      });
    } catch (error: any) {
      console.error('Login error:', error);
      return sendError(res, 'Login failed', error.message, 500);
    }
  }

  // Get current user
  async getCurrentUser(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        return sendError(res, 'Unauthorized', 'User not authenticated', 401);
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          sentFriendRequests: true,
          receivedFriendRequests: true,
          friends: true,
          friendOf: true,
          sentMessages: true,
          conversations: true,
          createdBills: true,
          billParticipants: true,
          sentTransactions: true,
          receivedTransactions: true,
          notifications: true,
          organizationMemberships: true,
          createdOrganizations: true,
          resetTokens: true,
        },
      });

      if (!user) {
        return sendError(res, 'User not found', 'User does not exist', 404);
      }

      return sendSuccess(res, 'User retrieved successfully', user);
    } catch (error: any) {
      console.error('Get current user error:', error);
      return sendError(res, 'Failed to get user', error.message, 500);
    }
  }

  // Request password reset
  async requestPasswordReset(req: Request, res: Response): Promise<Response> {
    try {
      const { email } = req.body;

      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        // Don't reveal if user exists
        return sendSuccess(res, 'If the email exists, a reset link has been sent');
      }

      // Generate reset token
      const resetToken = uuidv4();
      const expiresAt = new Date(Date.now() + 3600000); // 1 hour

      await prisma.passwordReset.create({
        data: {
          userId: user.id,
          token: resetToken,
          expiresAt,
        },
      });

      // TODO: Send email with reset link
      // For now, return the token (in production, send via email)
      
      return sendSuccess(res, 'Password reset link sent', {
        resetToken, // Remove this in production
        message: 'Check your email for reset instructions',
      });
    } catch (error: any) {
      console.error('Password reset request error:', error);
      return sendError(res, 'Failed to process request', error.message, 500);
    }
  }

  // Reset password
  async resetPassword(req: Request, res: Response): Promise<Response> {
    try {
      const { token, newPassword } = req.body;

      const resetRecord = await prisma.passwordReset.findUnique({
        where: { token },
        include: { user: true },
      });

      if (!resetRecord || resetRecord.used || resetRecord.expiresAt < new Date()) {
        return sendError(res, 'Invalid or expired token', 'Reset token is invalid', 400);
      }

      // Hash new password
      const hashedPassword = await hashPassword(newPassword);

      // Update password
      await prisma.user.update({
        where: { id: resetRecord.userId },
        data: { password: hashedPassword },
      });

      // Mark token as used
      await prisma.passwordReset.update({
        where: { id: resetRecord.id },
        data: { used: true },
      });

      return sendSuccess(res, 'Password reset successfully');
    } catch (error: any) {
      console.error('Password reset error:', error);
      return sendError(res, 'Failed to reset password', error.message, 500);
    }
  }

  // Update profile
  async updateProfile(req: AuthRequest, res: Response): Promise<Response> {
    try {
      const userId = req.user?.id;
      const { fullName, phoneNumber, bio, avatar } = req.body;

      if (!userId) {
        return sendError(res, 'Unauthorized', 'User not authenticated', 401);
      }

      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          ...(fullName && { fullName }),
          ...(phoneNumber && { phoneNumber }),
          ...(bio !== undefined && { bio }),
          ...(avatar && { avatar }),
        },
        select: {
          id: true,
          email: true,
          username: true,
          fullName: true,
          phoneNumber: true,
          avatar: true,
          bio: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return sendSuccess(res, 'Profile updated successfully', updatedUser);
    } catch (error: any) {
      console.error('Update profile error:', error);
      return sendError(res, 'Failed to update profile', error.message, 500);
    }
  }
}