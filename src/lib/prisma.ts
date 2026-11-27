import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function buildDatasourceUrl(): string | undefined {
  const raw = process.env.DATABASE_URL;
  if (!raw) return undefined;
  try {
    const url = new URL(raw);
    if (url.searchParams.get('pgbouncer') === 'true') {
      if (!url.searchParams.has('pool_timeout')) {
        url.searchParams.set('pool_timeout', '25');
      }
      if (!url.searchParams.has('connect_timeout')) {
        url.searchParams.set('connect_timeout', '15');
      }
      if (!url.searchParams.has('connection_limit')) {
        url.searchParams.set('connection_limit', '12');
      }
    }
    return url.toString();
  } catch {
    return raw;
  }
}

const datasourceUrl = buildDatasourceUrl();

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient(datasourceUrl ? { datasourceUrl } : undefined);

globalForPrisma.prisma = prisma;
