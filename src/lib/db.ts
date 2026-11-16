import { PrismaClient } from "@prisma/client";

// Una sola instancia en desarrollo: la recarga en caliente de Next no abre conexiones nuevas.
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
