import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { ApiResponse } from '../utils/apiResponse';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { generateCustomerId } from '../utils/generators';

const customerSchema = z.object({
  fullName: z.string().min(2).max(100),
  phone: z.string().min(7).max(20),
  whatsapp: z.string().optional(),
  email: z.string().email().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  birthday: z.string().datetime().optional(),
  anniversary: z.string().datetime().optional(),
  idProof: z.string().optional(),
  photoUrl: z.string().optional(),
  creditLimit: z.number().nonnegative().default(0),
  notes: z.string().optional(),
});

export const getCustomers = async (req: AuthRequest, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = (page - 1) * limit;
  const where: any = { isActive: true };

  if (req.query.search) {
    const s = req.query.search as string;
    where.OR = [
      { fullName: { contains: s, mode: 'insensitive' } },
      { phone: { contains: s } },
      { email: { contains: s, mode: 'insensitive' } },
      { customerId: { contains: s, mode: 'insensitive' } },
    ];
  }

  const [customers, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      include: { balance: true },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.customer.count({ where }),
  ]);

  ApiResponse.paginated(res, customers, total, page, limit);
};

export const getCustomer = async (req: AuthRequest, res: Response): Promise<void> => {
  const customer = await prisma.customer.findUnique({
    where: { id: req.params.id },
    include: {
      balance: true,
      sales: {
        orderBy: { saleDate: 'desc' },
        take: 10,
        include: { items: { include: { inventory: { select: { name: true } } } } },
      },
      payments: { orderBy: { paymentDate: 'desc' }, take: 10 },
    },
  });
  if (!customer) throw new AppError('Customer not found', 404);
  ApiResponse.success(res, customer);
};

export const createCustomer = async (req: AuthRequest, res: Response): Promise<void> => {
  const body = customerSchema.parse(req.body);
  const customerId = await generateCustomerId();

  const customer = await prisma.$transaction(async (tx) => {
    const c = await tx.customer.create({
      data: { ...body, customerId, birthday: body.birthday ? new Date(body.birthday) : undefined, anniversary: body.anniversary ? new Date(body.anniversary) : undefined },
    });
    await tx.customerBalance.create({
      data: { customerId: c.id, totalPurchase: 0, totalPaid: 0, balance: 0 },
    });
    return c;
  });

  ApiResponse.created(res, customer, 'Customer created');
};

export const updateCustomer = async (req: AuthRequest, res: Response): Promise<void> => {
  const body = customerSchema.partial().parse(req.body);
  const existing = await prisma.customer.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new AppError('Customer not found', 404);

  const customer = await prisma.customer.update({
    where: { id: req.params.id },
    data: {
      ...body,
      birthday: body.birthday ? new Date(body.birthday) : undefined,
      anniversary: body.anniversary ? new Date(body.anniversary) : undefined,
    },
    include: { balance: true },
  });

  ApiResponse.success(res, customer, 'Customer updated');
};

export const deleteCustomer = async (req: AuthRequest, res: Response): Promise<void> => {
  const existing = await prisma.customer.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new AppError('Customer not found', 404);
  await prisma.customer.update({ where: { id: req.params.id }, data: { isActive: false } });
  ApiResponse.success(res, null, 'Customer deleted');
};

export const getCustomerBalance = async (req: AuthRequest, res: Response): Promise<void> => {
  const balance = await prisma.customerBalance.findUnique({
    where: { customerId: req.params.id },
    include: { customer: { select: { fullName: true, phone: true } } },
  });
  if (!balance) throw new AppError('Customer not found', 404);
  ApiResponse.success(res, balance);
};

export const recordPayment = async (req: AuthRequest, res: Response): Promise<void> => {
  const body = z.object({
    saleId: z.string().uuid().optional(),
    amount: z.number().positive(),
    paymentMethod: z.enum(['CASH', 'CARD', 'BANK_TRANSFER', 'UPI', 'CHEQUE', 'CREDIT', 'OTHER']),
    reference: z.string().optional(),
    notes: z.string().optional(),
    paymentDate: z.string().datetime().optional(),
  }).parse(req.body);

  const customerId = req.params.id;
  const customer = await prisma.customer.findUnique({ where: { id: customerId } });
  if (!customer) throw new AppError('Customer not found', 404);

  await prisma.$transaction(async (tx) => {
    // Record payment
    await tx.payment.create({
      data: {
        customerId,
        saleId: body.saleId,
        amount: body.amount,
        paymentMethod: body.paymentMethod,
        reference: body.reference,
        notes: body.notes,
        paymentDate: body.paymentDate ? new Date(body.paymentDate) : new Date(),
      },
    });

    // Update sale if linked
    if (body.saleId) {
      const sale = await tx.sale.findUnique({ where: { id: body.saleId } });
      if (sale) {
        const newPaid = Number(sale.paidAmount) + body.amount;
        const newBalance = Number(sale.grandTotal) - newPaid;
        await tx.sale.update({
          where: { id: body.saleId },
          data: {
            paidAmount: newPaid,
            balanceAmount: Math.max(0, newBalance),
            paymentStatus: newBalance <= 0 ? 'PAID' : 'PARTIAL',
          },
        });
      }
    }

    // Update customer balance
    await tx.customerBalance.update({
      where: { customerId },
      data: { totalPaid: { increment: body.amount }, balance: { decrement: body.amount } },
    });
  });

  ApiResponse.success(res, null, 'Payment recorded successfully');
};

export const getUpcomingBirthdays = async (req: AuthRequest, res: Response): Promise<void> => {
  const today = new Date();
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);

  // Get customers with birthdays in the next 7 days (any year)
  const customers = await prisma.$queryRaw`
    SELECT id, "fullName", phone, birthday
    FROM customers
    WHERE is_active = true
      AND birthday IS NOT NULL
      AND EXTRACT(MONTH FROM birthday) = EXTRACT(MONTH FROM CURRENT_DATE)
      AND EXTRACT(DAY FROM birthday) BETWEEN EXTRACT(DAY FROM CURRENT_DATE)
        AND EXTRACT(DAY FROM CURRENT_DATE) + 7
  `;

  ApiResponse.success(res, customers);
};
