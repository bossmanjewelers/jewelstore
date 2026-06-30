import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { prisma } from '../utils/prisma';
import { ApiResponse } from '../utils/apiResponse';
import { z } from 'zod';

const router = Router();
router.use(authenticate);

router.get('/', async (_req, res) => {
  let settings = await prisma.storeSettings.findFirst();
  if (!settings) settings = await prisma.storeSettings.create({ data: {} });
  ApiResponse.success(res, settings);
});

router.put('/', authorize('ADMIN'), async (req, res) => {
  const body = z.object({
    storeName: z.string().optional(), logoUrl: z.string().optional(), address: z.string().optional(),
    city: z.string().optional(), state: z.string().optional(), country: z.string().optional(),
    phone: z.string().optional(), email: z.string().email().optional(), website: z.string().optional(),
    gstNumber: z.string().optional(), currency: z.string().optional(), currencySymbol: z.string().optional(),
    taxRate: z.number().optional(), goldRate: z.number().optional(), invoicePrefix: z.string().optional(),
    invoiceFooter: z.string().optional(), termsConditions: z.string().optional(),
  }).parse(req.body);
  let settings = await prisma.storeSettings.findFirst();
  if (!settings) settings = await prisma.storeSettings.create({ data: body });
  else settings = await prisma.storeSettings.update({ where: { id: settings.id }, data: body });
  ApiResponse.success(res, settings, 'Settings updated');
});

export default router;
