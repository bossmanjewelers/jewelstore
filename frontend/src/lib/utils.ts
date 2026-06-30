import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, parseISO } from 'date-fns';
export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }
export function formatCurrency(amount: number | string, symbol = '$'): string {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return `${symbol}${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
export function formatDate(date: string | Date, fmt = 'MMM dd, yyyy'): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, fmt);
}
export function formatWeight(weight: number | string): string {
  const w = typeof weight === 'string' ? parseFloat(weight) : weight;
  return `${w.toFixed(3)}g`;
}
export function getInitials(name: string): string { return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2); }
export function truncate(str: string, max: number): string { return str.length > max ? str.slice(0, max) + '…' : str; }
export const METAL_TYPE_LABELS: Record<string, string> = { GOLD: 'Gold', SILVER: 'Silver', PLATINUM: 'Platinum', DIAMOND: 'Diamond', CUSTOM: 'Custom' };
export const PURITY_LABELS: Record<string, string> = { K18: '18K', K22: '22K', K24: '24K', OTHER: 'Other' };
export const STOCK_STATUS_COLORS: Record<string, string> = {
  IN_STOCK: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  LOW_STOCK: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  OUT_OF_STOCK: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  DISCONTINUED: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
};
export const PAYMENT_STATUS_COLORS: Record<string, string> = {
  PAID: 'bg-green-100 text-green-800',
  PARTIAL: 'bg-blue-100 text-blue-800',
  PENDING: 'bg-yellow-100 text-yellow-800',
  OVERDUE: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-gray-100 text-gray-800',
};
