import 'dotenv/config';
import 'express-async-errors'; // catch async route errors in Express 4
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';

import { config } from './config';
import { logger } from './utils/logger';
import routes from './routes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { prisma } from './utils/prisma';

const app = express();

// ─── Security ─────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));

app.use(cors({
  origin: (origin, cb) => {
    const allowed = [
      config.frontend.url,
      'http://localhost:3000',
      'http://localhost:5173',
      'http://localhost:5488',
    ];
    if (!origin || allowed.includes(origin)) return cb(null, true);
    // In production allow same-origin requests
    if (config.env === 'production') return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
}));

// ─── Middleware ────────────────────────────────────────────
app.use(compression());
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
if (config.env !== 'production') {
  app.use(morgan('dev', { stream: { write: (msg) => logger.http(msg.trim()) } }));
}

// ─── Health check ──────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
});

// ─── API Routes ────────────────────────────────────────────
app.use('/api', routes);

// ─── Serve built React frontend ────────────────────────────
// Looks for frontend/dist relative to this file's compiled location
const possibleFrontendPaths = [
  path.join(__dirname, '../../frontend/dist'),      // dev: backend/src → root/frontend/dist
  path.join(__dirname, '../../../frontend/dist'),   // compiled: backend/dist/src → root/frontend/dist
  path.join(process.cwd(), 'frontend/dist'),        // Railway: cwd is project root
];

const frontendDist = possibleFrontendPaths.find(p => fs.existsSync(p));

if (frontendDist) {
  app.use(express.static(frontendDist));
  app.get(/^(?!\/api|\/health).*/, (_req, res) => {
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
  logger.info(`Serving frontend from: ${frontendDist}`);
} else {
  logger.warn('Frontend dist not found — API-only mode');
}

// ─── Error Handling ────────────────────────────────────────
app.use(notFoundHandler);
app.use(errorHandler);

// ─── Start ─────────────────────────────────────────────────

async function initDatabase(): Promise<void> {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "store_settings" (
        "id" TEXT NOT NULL, "storeName" TEXT NOT NULL DEFAULT 'My Jewelry Store',
        "logoUrl" TEXT, "address" TEXT, "city" TEXT, "state" TEXT, "country" TEXT,
        "phone" TEXT, "email" TEXT, "website" TEXT, "gstNumber" TEXT,
        "currency" TEXT NOT NULL DEFAULT 'INR', "currencySymbol" TEXT NOT NULL DEFAULT '₹',
        "taxRate" DECIMAL(5,2) NOT NULL DEFAULT 3, "goldRate" DECIMAL(10,2) NOT NULL DEFAULT 0,
        "invoicePrefix" TEXT NOT NULL DEFAULT 'INV', "invoiceFooter" TEXT, "termsConditions" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "store_settings_pkey" PRIMARY KEY ("id")
      )
    `);
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" TEXT NOT NULL, "name" TEXT NOT NULL, "email" TEXT NOT NULL,
        "password" TEXT NOT NULL, "role" TEXT NOT NULL DEFAULT 'SALES_STAFF',
        "phone" TEXT, "avatarUrl" TEXT, "isActive" BOOLEAN NOT NULL DEFAULT true,
        "twoFactorSecret" TEXT, "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
        "lastLoginAt" TIMESTAMP(3), "refreshToken" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "users_pkey" PRIMARY KEY ("id")
      )
    `);
    await prisma.$executeRawUnsafe('CREATE UNIQUE INDEX IF NOT EXISTS "users_email_key" ON "users"("email")');
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "categories" (
        "id" TEXT NOT NULL, "name" TEXT NOT NULL, "description" TEXT, "imageUrl" TEXT,
        "isActive" BOOLEAN NOT NULL DEFAULT true, "sortOrder" INTEGER NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
      )
    `);
    await prisma.$executeRawUnsafe('CREATE UNIQUE INDEX IF NOT EXISTS "categories_name_key" ON "categories"("name")');
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "sub_categories" (
        "id" TEXT NOT NULL, "name" TEXT NOT NULL, "description" TEXT,
        "isActive" BOOLEAN NOT NULL DEFAULT true, "categoryId" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "sub_categories_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "sub_categories_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);
    await prisma.$executeRawUnsafe('CREATE UNIQUE INDEX IF NOT EXISTS "sub_categories_name_categoryId_key" ON "sub_categories"("name","categoryId")');
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "suppliers" (
        "id" TEXT NOT NULL, "companyName" TEXT NOT NULL, "contactPerson" TEXT, "phone" TEXT,
        "email" TEXT, "address" TEXT, "city" TEXT, "state" TEXT, "country" TEXT,
        "gstNumber" TEXT, "bankDetails" TEXT, "creditLimit" DECIMAL(12,2) NOT NULL DEFAULT 0,
        "notes" TEXT, "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "suppliers_pkey" PRIMARY KEY ("id")
      )
    `);
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "inventory" (
        "id" TEXT NOT NULL, "productId" TEXT NOT NULL, "barcode" TEXT, "qrCode" TEXT,
        "name" TEXT NOT NULL, "description" TEXT, "categoryId" TEXT, "subCategoryId" TEXT,
        "collection" TEXT, "metalType" TEXT NOT NULL DEFAULT 'GOLD', "purity" TEXT NOT NULL DEFAULT 'K22',
        "weight" DECIMAL(10,3) NOT NULL, "stoneType" TEXT, "stoneWeight" DECIMAL(10,3),
        "size" TEXT, "color" TEXT, "designNumber" TEXT, "brand" TEXT, "supplierId" TEXT,
        "purchasePrice" DECIMAL(12,2) NOT NULL, "makingCharges" DECIMAL(12,2) NOT NULL DEFAULT 0,
        "otherCharges" DECIMAL(12,2) NOT NULL DEFAULT 0, "sellingPrice" DECIMAL(12,2) NOT NULL,
        "quantity" INTEGER NOT NULL DEFAULT 1, "minQuantity" INTEGER NOT NULL DEFAULT 1,
        "stockStatus" TEXT NOT NULL DEFAULT 'IN_STOCK', "images" TEXT[] DEFAULT ARRAY[]::TEXT[],
        "tags" TEXT[] DEFAULT ARRAY[]::TEXT[], "notes" TEXT, "isActive" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "inventory_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "inventory_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT "inventory_subCategoryId_fkey" FOREIGN KEY ("subCategoryId") REFERENCES "sub_categories"("id") ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT "inventory_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE SET NULL ON UPDATE CASCADE
      )
    `);
    await prisma.$executeRawUnsafe('CREATE UNIQUE INDEX IF NOT EXISTS "inventory_productId_key" ON "inventory"("productId")');
    await prisma.$executeRawUnsafe('CREATE UNIQUE INDEX IF NOT EXISTS "inventory_barcode_key" ON "inventory"("barcode") WHERE "barcode" IS NOT NULL');
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "customers" (
        "id" TEXT NOT NULL, "customerId" TEXT NOT NULL, "fullName" TEXT NOT NULL,
        "phone" TEXT NOT NULL, "whatsapp" TEXT, "email" TEXT, "address" TEXT,
        "city" TEXT, "state" TEXT, "country" TEXT, "birthday" TIMESTAMP(3), "anniversary" TIMESTAMP(3),
        "idProof" TEXT, "idProofUrl" TEXT, "photoUrl" TEXT,
        "creditLimit" DECIMAL(12,2) NOT NULL DEFAULT 0, "notes" TEXT,
        "isActive" BOOLEAN NOT NULL DEFAULT true, "lastVisitAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "customers_pkey" PRIMARY KEY ("id")
      )
    `);
    await prisma.$executeRawUnsafe('CREATE UNIQUE INDEX IF NOT EXISTS "customers_customerId_key" ON "customers"("customerId")');
    await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "customers_phone_idx" ON "customers"("phone")');
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "customer_balances" (
        "id" TEXT NOT NULL, "customerId" TEXT NOT NULL,
        "totalPurchase" DECIMAL(12,2) NOT NULL DEFAULT 0, "totalPaid" DECIMAL(12,2) NOT NULL DEFAULT 0,
        "balance" DECIMAL(12,2) NOT NULL DEFAULT 0, "creditBalance" DECIMAL(12,2) NOT NULL DEFAULT 0,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "customer_balances_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "customer_balances_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE CASCADE
      )
    `);
    await prisma.$executeRawUnsafe('CREATE UNIQUE INDEX IF NOT EXISTS "customer_balances_customerId_key" ON "customer_balances"("customerId")');
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "sales" (
        "id" TEXT NOT NULL, "invoiceNumber" TEXT NOT NULL, "customerId" TEXT NOT NULL, "userId" TEXT NOT NULL,
        "saleDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "goldRate" DECIMAL(10,2),
        "subTotal" DECIMAL(12,2) NOT NULL, "discountType" TEXT, "discountValue" DECIMAL(12,2) NOT NULL DEFAULT 0,
        "discountAmount" DECIMAL(12,2) NOT NULL DEFAULT 0, "taxRate" DECIMAL(5,2) NOT NULL DEFAULT 0,
        "taxAmount" DECIMAL(12,2) NOT NULL DEFAULT 0, "grandTotal" DECIMAL(12,2) NOT NULL,
        "paidAmount" DECIMAL(12,2) NOT NULL DEFAULT 0, "balanceAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
        "paymentMethod" TEXT NOT NULL DEFAULT 'CASH', "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
        "status" TEXT NOT NULL DEFAULT 'CONFIRMED', "notes" TEXT, "dueDate" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "sales_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "sales_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
        CONSTRAINT "sales_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE
      )
    `);
    await prisma.$executeRawUnsafe('CREATE UNIQUE INDEX IF NOT EXISTS "sales_invoiceNumber_key" ON "sales"("invoiceNumber")');
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "sale_items" (
        "id" TEXT NOT NULL, "saleId" TEXT NOT NULL, "inventoryId" TEXT NOT NULL,
        "quantity" INTEGER NOT NULL DEFAULT 1, "weight" DECIMAL(10,3), "goldRate" DECIMAL(10,2),
        "stoneCharges" DECIMAL(12,2) NOT NULL DEFAULT 0, "makingCharges" DECIMAL(12,2) NOT NULL DEFAULT 0,
        "unitPrice" DECIMAL(12,2) NOT NULL, "totalPrice" DECIMAL(12,2) NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "sale_items_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "sale_items_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "sales"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "sale_items_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "inventory"("id") ON DELETE RESTRICT ON UPDATE CASCADE
      )
    `);
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "payments" (
        "id" TEXT NOT NULL, "saleId" TEXT, "customerId" TEXT NOT NULL,
        "amount" DECIMAL(12,2) NOT NULL, "paymentMethod" TEXT NOT NULL DEFAULT 'CASH',
        "reference" TEXT, "notes" TEXT, "paymentDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "payments_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "payments_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "sales"("id") ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT "payments_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "customers"("id") ON DELETE RESTRICT ON UPDATE CASCADE
      )
    `);
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "purchases" (
        "id" TEXT NOT NULL, "purchaseNumber" TEXT NOT NULL, "supplierId" TEXT NOT NULL,
        "purchaseDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "subTotal" DECIMAL(12,2) NOT NULL,
        "taxAmount" DECIMAL(12,2) NOT NULL DEFAULT 0, "otherCharges" DECIMAL(12,2) NOT NULL DEFAULT 0,
        "grandTotal" DECIMAL(12,2) NOT NULL, "paidAmount" DECIMAL(12,2) NOT NULL DEFAULT 0,
        "balanceAmount" DECIMAL(12,2) NOT NULL DEFAULT 0, "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
        "status" TEXT NOT NULL DEFAULT 'PENDING', "invoiceRef" TEXT, "notes" TEXT, "dueDate" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "purchases_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "purchases_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "suppliers"("id") ON DELETE RESTRICT ON UPDATE CASCADE
      )
    `);
    await prisma.$executeRawUnsafe('CREATE UNIQUE INDEX IF NOT EXISTS "purchases_purchaseNumber_key" ON "purchases"("purchaseNumber")');
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "purchase_items" (
        "id" TEXT NOT NULL, "purchaseId" TEXT NOT NULL, "inventoryId" TEXT NOT NULL,
        "quantity" INTEGER NOT NULL DEFAULT 1, "unitCost" DECIMAL(12,2) NOT NULL, "totalCost" DECIMAL(12,2) NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "purchase_items_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "purchase_items_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "purchases"("id") ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT "purchase_items_inventoryId_fkey" FOREIGN KEY ("inventoryId") REFERENCES "inventory"("id") ON DELETE RESTRICT ON UPDATE CASCADE
      )
    `);
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "audit_logs" (
        "id" TEXT NOT NULL, "userId" TEXT, "action" TEXT NOT NULL, "entity" TEXT NOT NULL,
        "entityId" TEXT, "oldValues" JSONB, "newValues" JSONB, "ipAddress" TEXT, "userAgent" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE
      )
    `);
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "notifications" (
        "id" TEXT NOT NULL, "type" TEXT NOT NULL, "title" TEXT NOT NULL, "message" TEXT NOT NULL,
        "entityId" TEXT, "entityType" TEXT, "isRead" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
      )
    `);
    
    // Seed admin user if none exists
    try {
      const bcrypt = require('bcryptjs');
      const rows = await prisma.$queryRawUnsafe('SELECT COUNT(*) as cnt FROM users');
      const cnt = Number((rows as any[])[0]?.cnt || 0);
      if (cnt === 0) {
        const hash = await bcrypt.hash('Admin@123', 12);
        const uid = require('uuid').v4();
        await prisma.$executeRawUnsafe(
          `INSERT INTO "users" ("id","name","email","password","role","isActive","twoFactorEnabled","createdAt","updatedAt")
           VALUES ($1,'Admin','admin@jewelstore.com',$2,'ADMIN',true,false,NOW(),NOW())`,
          uid, hash
        );
        // Seed store settings
        const sid = require('uuid').v4();
        await prisma.$executeRawUnsafe(
          `INSERT INTO "store_settings" ("id","storeName","currency","currencySymbol","taxRate","goldRate","invoicePrefix","createdAt","updatedAt")
           VALUES ($1,'My Jewelry Store','INR','₹',3,0,'INV',NOW(),NOW())`,
          sid
        );
        logger.info('✅ Admin user and store settings seeded');
      }
    } catch (seedErr: any) {
      logger.warn('Seed skipped:', seedErr?.message?.slice(0,100));
    }

    logger.info('✅ Database schema initialized');
  } catch (err: any) {
    if (err?.message?.includes('already exists')) {
      logger.info('Database tables already exist — skipping init');
    } else {
      logger.error('DB init error (continuing):', err?.message);
    }
  }
}

export async function startServer(port?: number): Promise<number> {
  const serverPort = port || config.port;
  await initDatabase();
  await prisma.$connect();
  return new Promise((resolve, reject) => {
    const server = app.listen(serverPort, '0.0.0.0', () => {
      logger.info(`🚀 JewelStore running on port ${serverPort} [${config.env}]`);
      resolve(serverPort);
    });
    server.on('error', reject);
  });
}

if (require.main === module) {
  startServer().catch((err) => {
    logger.error('Failed to start:', err);
    process.exit(1);
  });
}


// Prevent unhandled async rejections from crashing the process (Express 4 limitation)
process.on('unhandledRejection', (reason: any) => {
  logger.error('Unhandled promise rejection (non-fatal):', reason?.message || reason);
});

process.on('SIGTERM', async () => {
  await prisma.$disconnect();
  process.exit(0);
});

export default app;
