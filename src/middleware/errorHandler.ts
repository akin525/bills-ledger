import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): Response => {
  console.error('Error:', err);

  if (err.name === 'ValidationError') {
    return sendError(res, 'Validation error', err.message, 400);
  }

  if (err.name === 'UnauthorizedError') {
    return sendError(res, 'Unauthorized', err.message, 401);
  }

  if (err.code === 'P2002') {
    return sendError(res, 'Duplicate entry', 'Resource already exists', 409);
  }

  if (err.code === 'P2025') {
    return sendError(res, 'Not found', 'Resource not found', 404);
  }

  return sendError(
    res,
    'Internal server error',
    process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong',
    500
  );
};