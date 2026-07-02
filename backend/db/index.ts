import { PrismaClient } from "@prisma/client";

let prisma: PrismaClient | null = null;

export const getPrisma = (): PrismaClient => {
  if (!prisma) {
    prisma = new PrismaClient({
      log: ["error", "warn"],
    });
  }

  return prisma;
};
export type {
  User,
  Order,
  Balance,
  OrderKind,
  OrderType,
  OrderStatus,
  Market,
  Asset,
} from "@prisma/client";
