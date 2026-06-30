import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient({ log: [{ emit: 'event', level: 'query' }, { emit: 'event', level: 'error' }, { emit: 'event', level: 'warn' }] });

if (process.env.NODE_ENV !== 'production') {
  // @ts-ignore
  prisma.$on('query', (e: { query: string; duration: number }) => { logger.debug(`Query: ${e.query} | Duration: ${e.duration}ms`); });
}
// @ts-ignore
prisma.$on('error', (e: { message: string }) => { logger.error(`Prisma Error: ${e.message}`); });
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
