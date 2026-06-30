import { Router } from 'express';
import { authenticate } from '../middleware/auth';
import { prisma } from '../utils/prisma';
import { ApiResponse } from '../utils/apiResponse';

const router = Router();
router.use(authenticate);

router.get('/sales-summary', async (req, res) => {
  const { from, to } = req.query;
  const start = from ? new Date(from as string) : new Date(new Date().setDate(1));
  const end = to ? new Date(to as string) : new Date();

  const [salesData, totalRevenue, totalSales, avgOrderValue] = await Promise.all([
    prisma.sale.groupBy({ by: ['paymentStatus'], where: { saleDate: { gte: start, lte: end }, status: { not: 'CANCELLED' } }, _count: true, _sum: { grandTotal: true } }),
    prisma.sale.aggregate({ where: { saleDate: { gte: start, lte: end }, status: { not: 'CANCELLED' } }, _sum: { grandTotal: true } }),
    prisma.sale.count({ where: { saleDate: { gte: start, lte: end }, status: { not: 'CANCELLED' } } }),
    prisma.sale.aggregate({ where: { saleDate: { gte: start, lte: end }, status: { not: 'CANCELLED' } }, _avg: { grandTotal: true } }),
  ]);
  ApiResponse.success(res, { salesData, totalRevenue: totalRevenue._sum.grandTotal || 0, totalSales, avgOrderValue: avgOrderValue._avg.grandTotal || 0 });
});

router.get('/inventory', async (_req, res) => {
  const items = await prisma.inventory.findMany({ where: { isActive: true }, include: { category: { select: { name: true } }, subCategory: { select: { name: true } }, supplier: { select: { companyName: true } } }, orderBy: { category: { name: 'asc' } } });
  const totalValue = items.reduce((s, i) => s + Number(i.sellingPrice) * i.quantity, 0);
  ApiResponse.success(res, { items, totalValue, totalItems: items.length });
});

router.get('/outstanding-balances', async (_req, res) => {
  const balances = await prisma.customerBalance.findMany({ where: { balance: { gt: 0 } }, include: { customer: { select: { fullName: true, phone: true, email: true } } }, orderBy: { balance: 'desc' } });
  const total = balances.reduce((s, b) => s + Number(b.balance), 0);
  ApiResponse.success(res, { balances, total });
});

router.get('/top-products', async (req, res) => {
  const { limit = 10 } = req.query;
  const topItems = await prisma.saleItem.groupBy({ by: ['inventoryId'], _sum: { quantity: true, totalPrice: true }, orderBy: { _sum: { totalPrice: 'desc' } }, take: parseInt(limit as string) });
  const itemsWithDetails = await Promise.all(topItems.map(async (item) => {
    const inventory = await prisma.inventory.findUnique({ where: { id: item.inventoryId }, select: { name: true, category: { select: { name: true } }, metalType: true } });
    return { ...item, inventory };
  }));
  ApiResponse.success(res, itemsWithDetails);
});

router.get('/profit', async (req, res) => {
  const { from, to } = req.query;
  const start = from ? new Date(from as string) : new Date(new Date().setDate(1));
  const end = to ? new Date(to as string) : new Date();
  const saleItems = await prisma.saleItem.findMany({ where: { sale: { saleDate: { gte: start, lte: end }, status: { not: 'CANCELLED' } } }, include: { inventory: { select: { purchasePrice: true, makingCharges: true } } } });
  let totalRevenue = 0, totalCost = 0;
  for (const item of saleItems) {
    totalRevenue += Number(item.totalPrice);
    totalCost += (Number(item.inventory.purchasePrice) + Number(item.inventory.makingCharges)) * item.quantity;
  }
  ApiResponse.success(res, { totalRevenue, totalCost, grossProfit: totalRevenue - totalCost, profitMargin: totalRevenue > 0 ? ((totalRevenue - totalCost) / totalRevenue * 100).toFixed(2) : '0' });
});

export default router;
