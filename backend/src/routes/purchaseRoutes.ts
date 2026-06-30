import { Router } from 'express';
import { authenticate, authorize } from '../middleware/auth';
import { prisma } from '../utils/prisma';
import { ApiResponse } from '../utils/apiResponse';
import { z } from 'zod';
import { generatePurchaseNumber } from '../utils/generators';

const router = Router();
router.use(authenticate);

router.get('/', async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = (page - 1) * limit;
  const where: any = {};
  if (req.query.supplierId) where.supplierId = req.query.supplierId;
  if (req.query.status) where.status = req.query.status;

  const [purchases, total] = await Promise.all([
    prisma.purchase.findMany({
      where,
      include: { supplier: { select: { companyName: true } }, items: { include: { inventory: { select: { name: true } } } } },
      orderBy: { purchaseDate: 'desc' },
      skip, take: limit,
    }),
    prisma.purchase.count({ where }),
  ]);
  ApiResponse.paginated(res, purchases, total, page, limit);
});

router.get('/:id', async (req, res) => {
  const purchase = await prisma.purchase.findUnique({
    where: { id: req.params.id },
    include: { supplier: true, items: { include: { inventory: true } } },
  });
  if (!purchase) { res.status(404).json({ success: false, message: 'Purchase not found' }); return; }
  ApiResponse.success(res, purchase);
});

router.post('/', authorize('ADMIN', 'MANAGER'), async (req, res) => {
  const body = z.object({
    supplierId: z.string().uuid(),
    purchaseDate: z.string().datetime().optional(),
    items: z.array(z.object({
      inventoryId: z.string().uuid(),
      quantity: z.number().int().positive(),
      unitCost: z.number().nonnegative(),
      totalCost: z.number().nonnegative(),
    })).min(1),
    taxAmount: z.number().nonnegative().default(0),
    otherCharges: z.number().nonnegative().default(0),
    paidAmount: z.number().nonnegative().default(0),
    invoiceRef: z.string().optional(),
    notes: z.string().optional(),
    dueDate: z.string().datetime().optional(),
  }).parse(req.body);

  const subTotal = body.items.reduce((s, i) => s + i.totalCost, 0);
  const grandTotal = subTotal + body.taxAmount + body.otherCharges;
  const balanceAmount = grandTotal - body.paidAmount;
  const purchaseNumber = await generatePurchaseNumber();

  const purchase = await prisma.$transaction(async (tx) => {
    const p = await tx.purchase.create({
      data: {
        purchaseNumber,
        supplierId: body.supplierId,
        purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : new Date(),
        subTotal,
        taxAmount: body.taxAmount,
        otherCharges: body.otherCharges,
        grandTotal,
        paidAmount: body.paidAmount,
        balanceAmount: Math.max(0, balanceAmount),
        paymentStatus: balanceAmount <= 0 ? 'PAID' : body.paidAmount > 0 ? 'PARTIAL' : 'PENDING',
        invoiceRef: body.invoiceRef,
        notes: body.notes,
        dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
        items: { create: body.items },
      },
      include: { items: true, supplier: true },
    });

    for (const item of body.items) {
      await tx.inventory.update({
        where: { id: item.inventoryId },
        data: { quantity: { increment: item.quantity } },
      });
    }

    return p;
  });

  ApiResponse.created(res, purchase, 'Purchase recorded');
});

export default router;
