import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { ApiResponse } from '../utils/apiResponse';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { generateInvoiceNumber } from '../utils/generators';

const saleItemSchema = z.object({
  inventoryId: z.string().uuid(),
  quantity: z.number().int().positive(),
  weight: z.number().optional(),
  goldRate: z.number().optional(),
  stoneCharges: z.number().nonnegative().default(0),
  makingCharges: z.number().nonnegative().default(0),
  unitPrice: z.number().nonnegative(),
  totalPrice: z.number().nonnegative(),
});

const createSaleSchema = z.object({
  customerId: z.string().uuid(),
  saleDate: z.string().datetime().optional(),
  goldRate: z.number().optional(),
  items: z.array(saleItemSchema).min(1),
  discountType: z.enum(['PERCENT', 'AMOUNT']).optional(),
  discountValue: z.number().nonnegative().default(0),
  taxRate: z.number().nonnegative().default(0),
  paidAmount: z.number().nonnegative().default(0),
  paymentMethod: z.enum(['CASH', 'CARD', 'BANK_TRANSFER', 'UPI', 'CHEQUE', 'CREDIT', 'OTHER']).default('CASH'),
  notes: z.string().optional(),
  dueDate: z.string().datetime().optional(),
});

export const getSales = async (req: AuthRequest, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = (page - 1) * limit;
  const where: any = {};

  if (req.query.customerId) where.customerId = req.query.customerId;
  if (req.query.status) where.status = req.query.status;
  if (req.query.paymentStatus) where.paymentStatus = req.query.paymentStatus;
  if (req.query.search) {
    where.invoiceNumber = { contains: req.query.search as string, mode: 'insensitive' };
  }
  if (req.query.from || req.query.to) {
    where.saleDate = {};
    if (req.query.from) where.saleDate.gte = new Date(req.query.from as string);
    if (req.query.to) where.saleDate.lte = new Date(req.query.to as string);
  }

  const [sales, total] = await Promise.all([
    prisma.sale.findMany({
      where,
      include: {
        customer: { select: { fullName: true, phone: true } },
        salesperson: { select: { name: true } },
        items: { include: { inventory: { select: { name: true, metalType: true } } } },
      },
      orderBy: { saleDate: 'desc' },
      skip,
      take: limit,
    }),
    prisma.sale.count({ where }),
  ]);

  ApiResponse.paginated(res, sales, total, page, limit);
};

export const getSale = async (req: AuthRequest, res: Response): Promise<void> => {
  const sale = await prisma.sale.findUnique({
    where: { id: req.params.id },
    include: {
      customer: true,
      salesperson: { select: { name: true } },
      items: { include: { inventory: true } },
      payments: { orderBy: { paymentDate: 'desc' } },
    },
  });
  if (!sale) throw new AppError('Sale not found', 404);
  ApiResponse.success(res, sale);
};

export const createSale = async (req: AuthRequest, res: Response): Promise<void> => {
  const body = createSaleSchema.parse(req.body);

  const subTotal = body.items.reduce((sum, item) => sum + item.totalPrice, 0);
  const discountAmount = body.discountType === 'PERCENT'
    ? (subTotal * body.discountValue) / 100
    : body.discountValue;
  const afterDiscount = subTotal - discountAmount;
  const taxAmount = (afterDiscount * body.taxRate) / 100;
  const grandTotal = afterDiscount + taxAmount;
  const balanceAmount = grandTotal - body.paidAmount;

  const invoiceNumber = await generateInvoiceNumber();

  const sale = await prisma.$transaction(async (tx) => {
    // Create sale
    const newSale = await tx.sale.create({
      data: {
        invoiceNumber,
        customerId: body.customerId,
        userId: req.user!.id,
        saleDate: body.saleDate ? new Date(body.saleDate) : new Date(),
        goldRate: body.goldRate,
        subTotal,
        discountType: body.discountType,
        discountValue: body.discountValue,
        discountAmount,
        taxRate: body.taxRate,
        taxAmount,
        grandTotal,
        paidAmount: body.paidAmount,
        balanceAmount: Math.max(0, balanceAmount),
        paymentMethod: body.paymentMethod,
        paymentStatus: balanceAmount <= 0 ? 'PAID' : body.paidAmount > 0 ? 'PARTIAL' : 'PENDING',
        notes: body.notes,
        dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
        items: { create: body.items.map((item) => ({ ...item })) },
      },
      include: { items: true, customer: true },
    });

    // Deduct inventory
    for (const item of body.items) {
      await tx.inventory.update({
        where: { id: item.inventoryId },
        data: { quantity: { decrement: item.quantity } },
      });
    }

    // Record initial payment if any
    if (body.paidAmount > 0) {
      await tx.payment.create({
        data: {
          saleId: newSale.id,
          customerId: body.customerId,
          amount: body.paidAmount,
          paymentMethod: body.paymentMethod,
        },
      });
    }

    // Update customer balance
    await tx.customerBalance.upsert({
      where: { customerId: body.customerId },
      create: {
        customerId: body.customerId,
        totalPurchase: grandTotal,
        totalPaid: body.paidAmount,
        balance: Math.max(0, balanceAmount),
      },
      update: {
        totalPurchase: { increment: grandTotal },
        totalPaid: { increment: body.paidAmount },
        balance: { increment: Math.max(0, balanceAmount) },
      },
    });

    // Update last visit
    await tx.customer.update({
      where: { id: body.customerId },
      data: { lastVisitAt: new Date() },
    });

    return newSale;
  });

  ApiResponse.created(res, sale, 'Sale created successfully');
};

export const updateSaleStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  const { status } = z.object({ status: z.enum(['DRAFT', 'CONFIRMED', 'DELIVERED', 'RETURNED', 'CANCELLED']) }).parse(req.body);

  const sale = await prisma.sale.update({
    where: { id: req.params.id },
    data: { status },
  });
  ApiResponse.success(res, sale, 'Sale status updated');
};

export const getDashboardStats = async (req: AuthRequest, res: Response): Promise<void> => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  lastDayOfMonth.setHours(23, 59, 59, 999);

  const [
    totalInventory,
    totalCustomers,
    todaySales,
    monthlySales,
    outstandingBalance,
    lowStockCount,
    recentSales,
    topCategories,
  ] = await Promise.all([
    prisma.inventory.count({ where: { isActive: true } }),
    prisma.customer.count({ where: { isActive: true } }),
    prisma.sale.aggregate({
      where: { saleDate: { gte: today, lte: todayEnd }, status: { not: 'CANCELLED' } },
      _sum: { grandTotal: true },
      _count: true,
    }),
    prisma.sale.aggregate({
      where: { saleDate: { gte: firstDayOfMonth, lte: lastDayOfMonth }, status: { not: 'CANCELLED' } },
      _sum: { grandTotal: true },
      _count: true,
    }),
    prisma.customerBalance.aggregate({ _sum: { balance: true } }),
    prisma.inventory.count({ where: { isActive: true, stockStatus: { in: ['LOW_STOCK', 'OUT_OF_STOCK'] } } }),
    prisma.sale.findMany({
      where: { status: { not: 'CANCELLED' } },
      orderBy: { saleDate: 'desc' },
      take: 5,
      include: { customer: { select: { fullName: true } } },
    }),
    prisma.saleItem.groupBy({
      by: ['inventoryId'],
      _sum: { quantity: true, totalPrice: true },
      orderBy: { _sum: { totalPrice: 'desc' } },
      take: 5,
    }),
  ]);

  ApiResponse.success(res, {
    totalInventory,
    totalCustomers,
    todaySales: { amount: todaySales._sum.grandTotal || 0, count: todaySales._count },
    monthlySales: { amount: monthlySales._sum.grandTotal || 0, count: monthlySales._count },
    outstandingBalance: outstandingBalance._sum.balance || 0,
    lowStockCount,
    recentSales,
    topCategories,
  });
};

export const getSalesReport = async (req: AuthRequest, res: Response): Promise<void> => {
  const { from, to, groupBy = 'day' } = req.query;

  const startDate = from ? new Date(from as string) : new Date(new Date().setDate(1));
  const endDate = to ? new Date(to as string) : new Date();

  const sales = await prisma.sale.findMany({
    where: {
      saleDate: { gte: startDate, lte: endDate },
      status: { not: 'CANCELLED' },
    },
    include: {
      items: { include: { inventory: { include: { category: true } } } },
    },
    orderBy: { saleDate: 'asc' },
  });

  ApiResponse.success(res, sales);
};
