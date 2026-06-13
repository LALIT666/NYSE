import type { User, UserBalance } from "../types-interfaces/types";

export const users = new Map<string, User>();

export const userById = new Map<string, User>();

export const balances = new Map<string, UserBalance>();
