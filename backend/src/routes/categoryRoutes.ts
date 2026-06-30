import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { prisma } from '../utils/prisma';
import { ApiResponse } from '../utils/apiResponse';
import { z } from 'zod';

const router = Router();
router.use(authenticate);

router.get('/', async (req, res) => {
  const cats = await prisma.category.findMany({
    where: { isActive: true },
    include: { subCategories: { where: { isActive: true } }, _count: { select: { inventory: true } } },
    orderBy: { sortOrder: 'asc' },
  });
  ApiResponse.success(res, cats);
});

router.post('/', authorize('ADMIN', 'MANAGER'), async (req, res) => {
  const body = z.object({ name: z.string(), description: z.string().optional(), sortOrder: z.number().optional() }).parse(req.body);
  const cat = await prisma.category.create({ data: body });
  ApiResponse.created(res, cat);
});

router.put('/:id', authorize('ADMIN', 'MANAGER'), async (req, res) => {
  const body = z.object({ name: z.string().optional(), description: z.string().optional(), sortOrder: z.number().optional() }).parse(req.body);
  const cat = await prisma.category.update({ where: { id: req.params.id }, data: body });
  ApiResponse.success(res, cat);
});

router.delete('/:id', authorize('ADMIN'), async (req, res) => {
  await prisma.category.update({ where: { id: req.params.id }, data: { isActive: false } });
  ApiResponse.success(res, null, 'Category deleted');
});

router.post('/:categoryId/subcategories', authorize('ADMIN', 'MANAGER'), async (req, res) => {
  const body = z.object({ name: z.string(), description: z.string().optional() }).parse(req.body);
  const sub = await prisma.subCategory.create({ data: { ...body, categoryId: req.params.categoryId } });
  ApiResponse.created(res, sub);
});

router.put('/subcategories/:id', authorize('ADMIN', 'MANAGER'), async (req, res) => {
  const body = z.object({ name: z.string().optional(), description: z.string().optional() }).parse(req.body);
  const sub = await prisma.subCategory.update({ where: { id: req.params.id }, data: body });
  ApiResponse.success(res, sub);
});

router.delete('/subcategories/:id', authorize('ADMIN'), async (req, res) => {
  await prisma.subCategory.update({ where: { id: req.params.id }, data: { isActive: false } });
  ApiResponse.success(res, null, 'Subcategory deleted');
});

export default router;
