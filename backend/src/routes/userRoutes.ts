import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { prisma } from '../utils/prisma';
import { ApiResponse } from '../utils/apiResponse';
import { z } from 'zod';
import bcrypt from 'bcryptjs';

const router = Router();
router.use(authenticate, authorize('ADMIN'));

router.get('/', async (_req, res) => {
  const users = await prisma.user.findMany({ select: { id: true, name: true, email: true, role: true, phone: true, avatarUrl: true, isActive: true, lastLoginAt: true, createdAt: true }, orderBy: { name: 'asc' } });
  ApiResponse.success(res, users);
});

router.put('/:id', async (req, res) => {
  const body = z.object({ name: z.string().optional(), email: z.string().email().optional(), role: z.enum(['ADMIN', 'MANAGER', 'SALES_STAFF']).optional(), phone: z.string().optional(), isActive: z.boolean().optional() }).parse(req.body);
  const user = await prisma.user.update({ where: { id: req.params.id }, data: body, select: { id: true, name: true, email: true, role: true, isActive: true } });
  ApiResponse.success(res, user, 'User updated');
});

router.delete('/:id', async (req, res) => {
  await prisma.user.update({ where: { id: req.params.id }, data: { isActive: false } });
  ApiResponse.success(res, null, 'User deactivated');
});

router.get('/audit-logs', async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;
  const skip = (page - 1) * limit;
  const [logs, total] = await Promise.all([prisma.auditLog.findMany({ include: { user: { select: { name: true } } }, orderBy: { createdAt: 'desc' }, skip, take: limit }), prisma.auditLog.count()]);
  ApiResponse.paginated(res, logs, total, page, limit);
});

export default router;
