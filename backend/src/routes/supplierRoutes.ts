import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { prisma } from '../utils/prisma';
import { ApiResponse } from '../utils/apiResponse';
import { z } from 'zod';

const router = Router();
router.use(authenticate);

const supplierSchema = z.object({
  companyName: z.string().min(2),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  gstNumber: z.string().optional(),
  bankDetails: z.string().optional(),
  creditLimit: z.number().nonnegative().default(0),
  notes: z.string().optional(),
});

router.get('/', async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = (page - 1) * limit;
  const where: any = { isActive: true };
  if (req.query.search) {
    const s = req.query.search as string;
    where.OR = [{ companyName: { contains: s, mode: 'insensitive' } }, { contactPerson: { contains: s, mode: 'insensitive' } }, { phone: { contains: s } }];
  }
  const [suppliers, total] = await Promise.all([prisma.supplier.findMany({ where, orderBy: { companyName: 'asc' }, skip, take: limit }), prisma.supplier.count({ where })]);
  ApiResponse.paginated(res, suppliers, total, page, limit);
});

router.get('/:id', async (req, res) => {
  const supplier = await prisma.supplier.findUnique({ where: { id: req.params.id }, include: { purchases: { orderBy: { purchaseDate: 'desc' }, take: 10 }, inventory: { where: { isActive: true }, take: 10 } } });
  if (!supplier) { res.status(404).json({ success: false, message: 'Supplier not found' }); return; }
  ApiResponse.success(res, supplier);
});

router.post('/', authorize('ADMIN', 'MANAGER'), async (req, res) => {
  const body = supplierSchema.parse(req.body);
  const supplier = await prisma.supplier.create({ data: body });
  ApiResponse.created(res, supplier);
});

router.put('/:id', authorize('ADMIN', 'MANAGER'), async (req, res) => {
  const body = supplierSchema.partial().parse(req.body);
  const supplier = await prisma.supplier.update({ where: { id: req.params.id }, data: body });
  ApiResponse.success(res, supplier);
});

router.delete('/:id', authorize('ADMIN'), async (req, res) => {
  await prisma.supplier.update({ where: { id: req.params.id }, data: { isActive: false } });
  ApiResponse.success(res, null, 'Supplier deleted');
});

export default router;
