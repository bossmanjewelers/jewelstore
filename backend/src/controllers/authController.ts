import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { config } from '../config';
import { ApiResponse } from '../utils/apiResponse';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(['ADMIN', 'MANAGER', 'SALES_STAFF']).optional(),
  phone: z.string().optional(),
});

const generateTokens = (payload: { id: string; email: string; role: string; name: string }) => {
  const accessToken = jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn as string,
  });
  const refreshToken = jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn as string,
  });
  return { accessToken, refreshToken };
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const body = loginSchema.parse(req.body);

  const user = await prisma.user.findUnique({ where: { email: body.email } });
  if (!user || !user.isActive) {
    ApiResponse.unauthorized(res, 'Invalid credentials');
    return;
  }

  const isMatch = await bcrypt.compare(body.password, user.password);
  if (!isMatch) {
    ApiResponse.unauthorized(res, 'Invalid credentials');
    return;
  }

  const { accessToken, refreshToken } = generateTokens({
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
  });

  // Store refresh token & update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken, lastLoginAt: new Date() },
  });

  ApiResponse.success(res, {
    user: { id: user.id, name: user.name, email: user.email, role: user.role, avatarUrl: user.avatarUrl },
    accessToken,
    refreshToken,
  }, 'Login successful');
};

export const register = async (req: AuthRequest, res: Response): Promise<void> => {
  const body = registerSchema.parse(req.body);

  const existing = await prisma.user.findUnique({ where: { email: body.email } });
  if (existing) throw new AppError('Email already in use', 409);

  const hashedPassword = await bcrypt.hash(body.password, 12);
  const user = await prisma.user.create({
    data: {
      name: body.name,
      email: body.email,
      password: hashedPassword,
      role: body.role || 'SALES_STAFF',
      phone: body.phone,
    },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  ApiResponse.created(res, user, 'User created successfully');
};

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  const { refreshToken: token } = req.body;
  if (!token) {
    ApiResponse.unauthorized(res, 'Refresh token required');
    return;
  }

  const decoded = jwt.verify(token, config.jwt.refreshSecret) as { id: string; email: string; role: string; name: string };
  const user = await prisma.user.findUnique({ where: { id: decoded.id } });

  if (!user || user.refreshToken !== token || !user.isActive) {
    ApiResponse.unauthorized(res, 'Invalid refresh token');
    return;
  }

  const { accessToken, refreshToken: newRefreshToken } = generateTokens({
    id: user.id, email: user.email, role: user.role, name: user.name,
  });

  await prisma.user.update({ where: { id: user.id }, data: { refreshToken: newRefreshToken } });

  ApiResponse.success(res, { accessToken, refreshToken: newRefreshToken });
};

export const logout = async (req: AuthRequest, res: Response): Promise<void> => {
  if (req.user) {
    await prisma.user.update({
      where: { id: req.user.id },
      data: { refreshToken: null },
    });
  }
  ApiResponse.success(res, null, 'Logged out successfully');
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: { id: true, name: true, email: true, role: true, phone: true, avatarUrl: true, lastLoginAt: true, twoFactorEnabled: true },
  });
  ApiResponse.success(res, user);
};

export const changePassword = async (req: AuthRequest, res: Response): Promise<void> => {
  const { currentPassword, newPassword } = z.object({
    currentPassword: z.string(),
    newPassword: z.string().min(8),
  }).parse(req.body);

  const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
  const isMatch = await bcrypt.compare(currentPassword, user!.password);
  if (!isMatch) throw new AppError('Current password is incorrect', 400);

  const hashedPassword = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({ where: { id: req.user!.id }, data: { password: hashedPassword } });

  ApiResponse.success(res, null, 'Password changed successfully');
};
