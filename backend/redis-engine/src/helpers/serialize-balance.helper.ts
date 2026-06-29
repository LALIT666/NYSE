// Map ko normal JSON object me convert karo
// Kyunki Map ko directly JSON.stringify nahi kar sakte
// Map: { "INR" => {available: 100, locked: 0} }
// Object: { "INR": {available: 100, locked: 0} }

import type { Balance, UserBalance } from "../types/balance.types";

export const serializeBalance = (ub: UserBalance): Record<string, Balance> => {
  // Khali object banao
  const obj: Record<string, Balance> = {};

  // Map ke har entry ko object me daal do
  ub.assets.forEach((bal, asset) => {
    obj[asset] = bal;
  });

  return obj;
};
