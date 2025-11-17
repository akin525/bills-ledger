import { Request } from 'express';
// import { User } from '@prisma/client';

// Extend Express Request to include user
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    username: string;
  };
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

// Pagination Types
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// WebSocket Types
export interface SocketUser {
  userId: string;
  socketId: string;
}

export interface ChatMessage {
  conversationId: string;
  senderId: string;
  content: string;
  type: 'TEXT' | 'IMAGE' | 'FILE' | 'BILL_REQUEST' | 'BILL_PAYMENT' | 'SYSTEM';
  attachments?: string[];
}

export interface TypingIndicator {
  conversationId: string;
  userId: string;
  isTyping: boolean;
}

export interface BillUpdate {
  billId: string;
  status: string;
  updatedBy: string;
}

// User Balance Type
export interface UserBalance {
  userId: string;
  totalOwed: number;
  totalOwing: number;
  netBalance: number;
}

// Bill Summary Type
export interface BillSummary {
  totalBills: number;
  pendingBills: number;
  paidBills: number;
  totalAmount: number;
  paidAmount: number;
}