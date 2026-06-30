import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { prisma } from '../utils/prisma';
import { ApiResponse } from '../utils/apiResponse';
import { UserRole } from '@prisma/client';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    name: string;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      ApiResponse.unauthorized(res, 'No token provided');
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, config.jwt.secret) as {
      id: string; email: string; role: UserRole; name: string;
    };

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, email: true, role: true, name: true, isActive: true },
    });

    if (!user || !user.isActive) {
      ApiResponse.unauthorized(res, 'Account not found or deactivated');
      return;
    }

    req.user = { id: user.id, email: user.email, role: user.role, name: user.name };
    next();
  } catch (err) {
    if (err instanceof jwt.TokenExpiredError) {
      ApiResponse.unauthorized(res, 'Token expired');
    } else {
      ApiResponse.unauthorized(res, 'Invalid token');
    }
  }
};

export const authorize = (...roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      ApiResponse.unauthorized(res);
      return;
    }
    if (!roles.includes(req.user.role)) {
      ApiResponse.forbidden(res, 'Insufficient permissions');
      return;
    }
    next();
  };
};
