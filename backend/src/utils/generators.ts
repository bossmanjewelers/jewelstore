import { prisma } from './prisma';

export async function generateProductId(): Promise<string> {
  const count = await prisma.inventory.count();
  return `PRD-${String(count + 1).padStart(5, '0')}`;
}
export function generateBarcode(): string { return String(Date.now()).slice(-12); }
export async function generateInvoiceNumber(): Promise<string> {
  const today = new Date();
  const year = today.getFullYear().toString().slice(-2);
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const count = await prisma.sale.count();
  return `INV-${year}${month}-${String(count + 1).padStart(4, '0')}`;
}
export async function generateCustomerId(): Promise<string> {
  const count = await prisma.customer.count();
  return `CUS-${String(count + 1).padStart(5, '0')}`;
}
export async function generatePurchaseNumber(): Promise<string> {
  const count = await prisma.purchase.count();
  return `PUR-${String(count + 1).padStart(5, '0')}`;
}
