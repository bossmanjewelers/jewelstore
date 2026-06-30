import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../utils/prisma';
import { ApiResponse } from '../utils/apiResponse';
import { AuthRequest } from '../middleware/auth';
import { AppError } from '../middleware/errorHandler';
import { StockStatus, MetalType, Purity } from '@prisma/client';
import { generateProductId, generateBarcode } from '../utils/generators';

const inventorySchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  subCategoryId: z.string().uuid().optional(),
  collection: z.string().optional(),
  metalType: z.nativeEnum(MetalType).default('GOLD'),
  purity: z.nativeEnum(Purity).default('K22'),
  weight: z.number().positive(),
  stoneType: z.string().optional(),
  stoneWeight: z.number().optional(),
  size: z.string().optional(),
  color: z.string().optional(),
  designNumber: z.string().optional(),
  brand: z.string().optional(),
  supplierId: z.string().uuid().optional(),
  purchasePrice: z.number().nonnegative(),
  makingCharges: z.number().nonnegative().default(0),
  otherCharges: z.number().nonnegative().default(0),
  sellingPrice: z.number().nonnegative(),
  quantity: z.number().int().nonnegative().default(1),
  minQuantity: z.number().int().nonnegative().default(1),
  images: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  notes: z.string().optional(),
  barcode: z.string().optional(),
});

export const getInventory = async (req: AuthRequest, res: Response): Promise<void> => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const skip = (page - 1) * limit;

  const where: any = { isActive: true };

  if (req.query.search) {
    const s = req.query.search as string;
    where.OR = [
      { name: { contains: s, mode: 'insensitive' } },
      { productId: { contains: s, mode: 'insensitive' } },
      { barcode: { contains: s, mode: 'insensitive' } },
      { designNumber: { contains: s, mode: 'insensitive' } },
    ];
  }
  if (req.query.categoryId) where.categoryId = req.query.categoryId;
  if (req.query.metalType) where.metalType = req.query.metalType;
  if (req.query.stockStatus) where.stockStatus = req.query.stockStatus;
  if (req.query.supplierId) where.supplierId = req.query.supplierId;

  const [items, total] = await Promise.all([
    prisma.inventory.findMany({
      where,
      include: { category: true, subCategory: true, supplier: { select: { companyName: true } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.inventory.count({ where }),
  ]);

  ApiResponse.paginated(res, items, total, page, limit);
};

export const getInventoryItem = async (req: AuthRequest, res: Response): Promise<void> => {
  const item = await prisma.inventory.findUnique({
    where: { id: req.params.id },
    include: {
      category: true,
      subCategory: true,
      supplier: true,
      saleItems: { include: { sale: { select: { invoiceNumber: true, saleDate: true } } }, take: 10 },
    },
  });
  if (!item) throw new AppError('Item not found', 404);
  ApiResponse.success(res, item);
};

export const createInventory = async (req: AuthRequest, res: Response): Promise<void> => {
  const body = inventorySchema.parse(req.body);
  const productId = await generateProductId();
  const barcode = body.barcode || generateBarcode();

  const item = await prisma.inventory.create({
    data: {
      ...body,
      productId,
      barcode,
      stockStatus: body.quantity === 0
        ? StockStatus.OUT_OF_STOCK
        : body.quantity <= body.minQuantity
          ? StockStatus.LOW_STOCK
          : StockStatus.IN_STOCK,
    },
    include: { category: true, subCategory: true },
  });

  ApiResponse.created(res, item, 'Inventory item created');
};

export const updateInventory = async (req: AuthRequest, res: Response): Promise<void> => {
  const body = inventorySchema.partial().parse(req.body);

  const existing = await prisma.inventory.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new AppError('Item not found', 404);

  const qty = body.quantity ?? existing.quantity;
  const minQty = body.minQuantity ?? existing.minQuantity;

  const item = await prisma.inventory.update({
    where: { id: req.params.id },
    data: {
      ...body,
      stockStatus: qty === 0
        ? StockStatus.OUT_OF_STOCK
        : qty <= minQty
          ? StockStatus.LOW_STOCK
          : StockStatus.IN_STOCK,
    },
    include: { category: true, subCategory: true },
  });

  ApiResponse.success(res, item, 'Inventory item updated');
};

export const deleteInventory = async (req: AuthRequest, res: Response): Promise<void> => {
  const existing = await prisma.inventory.findUnique({ where: { id: req.params.id } });
  if (!existing) throw new AppError('Item not found', 404);

  // Soft delete
  await prisma.inventory.update({ where: { id: req.params.id }, data: { isActive: false } });
  ApiResponse.success(res, null, 'Item deleted');
};

export const getLowStock = async (req: AuthRequest, res: Response): Promise<void> => {
  const items = await prisma.inventory.findMany({
    where: {
      isActive: true,
      stockStatus: { in: [StockStatus.LOW_STOCK, StockStatus.OUT_OF_STOCK] },
    },
    include: { category: true },
    orderBy: { quantity: 'asc' },
  });
  ApiResponse.success(res, items);
};

export const bulkImport = async (req: AuthRequest, res: Response): Promise<void> => {
  const items: any[] = req.body.items;
  if (!Array.isArray(items) || items.length === 0) {
    throw new AppError('No items provided', 400);
  }

  const results = { created: 0, failed: 0, errors: [] as string[] };

  for (const item of items) {
    try {
      const body = inventorySchema.parse(item);
      const productId = await generateProductId();
      const barcode = body.barcode || generateBarcode();
      await prisma.inventory.create({
        data: {
          ...body,
          productId,
          barcode,
          stockStatus: body.quantity === 0 ? 'OUT_OF_STOCK' : body.quantity <= body.minQuantity ? 'LOW_STOCK' : 'IN_STOCK',
        },
      });
      results.created++;
    } catch (e: any) {
      results.failed++;
      results.errors.push(e.message);
    }
  }

  ApiResponse.success(res, results, `Import complete: ${results.created} created, ${results.failed} failed`);
};
