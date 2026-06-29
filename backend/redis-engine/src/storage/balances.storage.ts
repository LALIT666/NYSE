// Saare users ka balance yahan store hoga
// userId se UserBalance dhundne ke liye Map

import type { UserBalance } from "../types/balance.types";

// userId -> UserBalance
export const balances = new Map<string, UserBalance>();
