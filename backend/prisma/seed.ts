import { PrismaClient, UserRole, MetalType, Purity, StockStatus, PaymentMethod } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // ── Store Settings ─────────────────────────────────────
  await prisma.storeSettings.upsert({
    where: { id: 'default' },
    create: {
      id: 'default',
      storeName: 'JewelStore Premium',
      address: '123 Gold Street',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      phone: '+91-9876543210',
      email: 'info@jewelstore.com',
      currency: 'INR',
      currencySymbol: '₹',
      taxRate: 3,
      goldRate: 6500,
      invoicePrefix: 'INV',
    },
    update: {},
  });

  // ── Users ──────────────────────────────────────────────
  const adminPass = await bcrypt.hash('Admin@123', 12);
  const managerPass = await bcrypt.hash('Manager@123', 12);
  const staffPass = await bcrypt.hash('Staff@123', 12);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@jewelstore.com' },
    create: { name: 'Admin User', email: 'admin@jewelstore.com', password: adminPass, role: UserRole.ADMIN, phone: '+91-9876543210' },
    update: {},
  });

  const manager = await prisma.user.upsert({
    where: { email: 'manager@jewelstore.com' },
    create: { name: 'Store Manager', email: 'manager@jewelstore.com', password: managerPass, role: UserRole.MANAGER },
    update: {},
  });

  await prisma.user.upsert({
    where: { email: 'staff@jewelstore.com' },
    create: { name: 'Sales Staff', email: 'staff@jewelstore.com', password: staffPass, role: UserRole.SALES_STAFF },
    update: {},
  });

  console.log('✅ Users created');

  // ── Categories ─────────────────────────────────────────
  const categoryData = [
    { name: 'Rings', sortOrder: 1 }, { name: 'Necklaces', sortOrder: 2 },
    { name: 'Earrings', sortOrder: 3 }, { name: 'Bangles', sortOrder: 4 },
    { name: 'Bracelets', sortOrder: 5 }, { name: 'Pendants', sortOrder: 6 },
    { name: 'Chains', sortOrder: 7 }, { name: 'Watches', sortOrder: 8 },
    { name: 'Coins', sortOrder: 9 }, { name: 'Bridal Sets', sortOrder: 10 },
  ];

  const categories: Record<string, string> = {};
  for (const cat of categoryData) {
    const c = await prisma.category.upsert({
      where: { name: cat.name },
      create: cat,
      update: {},
    });
    categories[cat.name] = c.id;
  }

  // Subcategories
  const subCats = [
    { name: 'Solitaire', categoryId: categories['Rings'] },
    { name: 'Wedding Bands', categoryId: categories['Rings'] },
    { name: 'Engagement', categoryId: categories['Rings'] },
    { name: 'Choker', categoryId: categories['Necklaces'] },
    { name: 'Long Chain', categoryId: categories['Necklaces'] },
    { name: 'Stud', categoryId: categories['Earrings'] },
    { name: 'Jhumka', categoryId: categories['Earrings'] },
    { name: 'Kada', categoryId: categories['Bangles'] },
    { name: 'Thin', categoryId: categories['Bangles'] },
  ];

  for (const sub of subCats) {
    try {
      await prisma.subCategory.create({ data: sub });
    } catch {}
  }

  console.log('✅ Categories created');

  // ── Suppliers ──────────────────────────────────────────
  const supplier1 = await prisma.supplier.create({
    data: {
      companyName: 'Golden Crafts Pvt Ltd',
      contactPerson: 'Raj Sharma',
      phone: '+91-9123456789',
      email: 'raj@goldencrafts.com',
      address: '456 Zaveri Bazaar',
      city: 'Mumbai',
      country: 'India',
      gstNumber: 'GSTIN123456789',
      creditLimit: 500000,
    },
  });

  const supplier2 = await prisma.supplier.create({
    data: {
      companyName: 'Diamond House International',
      contactPerson: 'Sanjay Patel',
      phone: '+91-9988776655',
      email: 'sanjay@diamondhouse.in',
      city: 'Surat',
      country: 'India',
    },
  });

  console.log('✅ Suppliers created');

  // ── Inventory ──────────────────────────────────────────
  const inventoryItems = [
    { productId: 'PRD-00001', name: 'Diamond Solitaire Ring', categoryId: categories['Rings'], metalType: MetalType.GOLD, purity: Purity.K18, weight: 4.5, sellingPrice: 75000, purchasePrice: 55000, makingCharges: 8000, quantity: 5, stockStatus: StockStatus.IN_STOCK, supplierId: supplier2.id },
    { productId: 'PRD-00002', name: 'Gold Mangalsutra Chain', categoryId: categories['Chains'], metalType: MetalType.GOLD, purity: Purity.K22, weight: 12.5, sellingPrice: 52000, purchasePrice: 40000, makingCharges: 5000, quantity: 8, stockStatus: StockStatus.IN_STOCK, supplierId: supplier1.id },
    { productId: 'PRD-00003', name: 'Kundan Jhumka Earrings', categoryId: categories['Earrings'], metalType: MetalType.GOLD, purity: Purity.K22, weight: 8.2, sellingPrice: 28000, purchasePrice: 19000, makingCharges: 3500, quantity: 12, stockStatus: StockStatus.IN_STOCK, supplierId: supplier1.id },
    { productId: 'PRD-00004', name: '22K Gold Bangle Set (2)', categoryId: categories['Bangles'], metalType: MetalType.GOLD, purity: Purity.K22, weight: 24.0, sellingPrice: 98000, purchasePrice: 78000, makingCharges: 9000, quantity: 3, stockStatus: StockStatus.LOW_STOCK, supplierId: supplier1.id },
    { productId: 'PRD-00005', name: 'Pearl Necklace Set', categoryId: categories['Necklaces'], metalType: MetalType.GOLD, purity: Purity.K18, weight: 6.8, sellingPrice: 32000, purchasePrice: 22000, makingCharges: 4000, quantity: 0, stockStatus: StockStatus.OUT_OF_STOCK, supplierId: supplier1.id },
    { productId: 'PRD-00006', name: 'Platinum Wedding Band', categoryId: categories['Rings'], metalType: MetalType.PLATINUM, purity: Purity.OTHER, weight: 5.0, sellingPrice: 45000, purchasePrice: 35000, makingCharges: 3000, quantity: 6, stockStatus: StockStatus.IN_STOCK, supplierId: supplier2.id },
    { productId: 'PRD-00007', name: 'Gold Coin 8g (24K)', categoryId: categories['Coins'], metalType: MetalType.GOLD, purity: Purity.K24, weight: 8.0, sellingPrice: 52000, purchasePrice: 48000, makingCharges: 500, quantity: 20, stockStatus: StockStatus.IN_STOCK, supplierId: supplier1.id },
    { productId: 'PRD-00008', name: 'Diamond Pendant', categoryId: categories['Pendants'], metalType: MetalType.GOLD, purity: Purity.K18, weight: 3.2, sellingPrice: 55000, purchasePrice: 40000, makingCharges: 6000, quantity: 4, stockStatus: StockStatus.IN_STOCK, supplierId: supplier2.id },
  ];

  for (const item of inventoryItems) {
    try {
      await prisma.inventory.create({ data: item });
    } catch {}
  }

  console.log('✅ Inventory items created');

  // ── Customers ──────────────────────────────────────────
  const customerData = [
    { customerId: 'CUS-00001', fullName: 'Priya Sharma', phone: '9876543210', email: 'priya@example.com', city: 'Mumbai', birthday: new Date('1990-03-15') },
    { customerId: 'CUS-00002', fullName: 'Amit Patel', phone: '8765432109', email: 'amit@example.com', city: 'Pune', anniversary: new Date('2018-11-20') },
    { customerId: 'CUS-00003', fullName: 'Sunita Gupta', phone: '7654321098', city: 'Delhi', creditLimit: 100000 },
    { customerId: 'CUS-00004', fullName: 'Rajesh Mehta', phone: '6543210987', email: 'rajesh@example.com', city: 'Surat' },
    { customerId: 'CUS-00005', fullName: 'Kavya Nair', phone: '5432109876', city: 'Bangalore', birthday: new Date('1985-06-28') },
  ];

  for (const c of customerData) {
    try {
      const customer = await prisma.customer.create({ data: c });
      await prisma.customerBalance.create({
        data: { customerId: customer.id, totalPurchase: 0, totalPaid: 0, balance: 0 },
      });
    } catch {}
  }

  console.log('✅ Customers created');
  console.log('\n🎉 Database seeded successfully!\n');
  console.log('📋 Demo Credentials:');
  console.log('   Admin:   admin@jewelstore.com   / Admin@123');
  console.log('   Manager: manager@jewelstore.com / Manager@123');
  console.log('   Staff:   staff@jewelstore.com   / Staff@123\n');
}

main()
  .catch((e) => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(() => prisma.$disconnect());
