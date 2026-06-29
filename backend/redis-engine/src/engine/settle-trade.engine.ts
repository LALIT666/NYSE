// Trade hone ke baad dono parties ke balance me paisa transfer karo
// Buyer ko stock milega, Seller ko paisa milega

import type { Order } from "../types/order.types";
import type { Market } from "../types/order.types";
import { getBalance } from "../helpers/get-balance.helper";
import { marketAssets } from "../config/market.config";

export const settleTrade = (
  buyOrder: Order,
  sellOrder: Order,
  qty: number, // kitna trade hua
  price: number, // kis price pe hua
  market: Market,
): void => {
  // Base = stock (TATA), Quote = paisa (INR)
  const { base, quote } = marketAssets[market];

  // Dono users ke balance laao
  const buyerBal = getBalance(buyOrder.userId);
  const sellerBal = getBalance(sellOrder.userId);

  // Buyer ke quote (INR) aur base (TATA) balance
  const buyerQuote = buyerBal.assets.get(quote)!;
  const buyerBase = buyerBal.assets.get(base)!;

  // Seller ke base (TATA) aur quote (INR) balance
  const sellerBase = sellerBal.assets.get(base)!;
  const sellerQuote = sellerBal.assets.get(quote)!;

  // Actual cost = quantity * fill price
  const cost = qty * price;

  // Buyer ne apne order price pe lock kiya tha
  // Jo actual price se zyada ho sakta hai
  const lockedAtOrderPrice = qty * buyOrder.price;

  // Buyer: locked INR hatao, TATA stock do
  buyerQuote.locked -= lockedAtOrderPrice;
  buyerBase.available += qty;

  // Agar buyer ne zyada price pe lock kiya tha
  // aur saste me mil gaya, toh extra refund karo
  const refund = lockedAtOrderPrice - cost;
  if (refund > 0) {
    buyerQuote.available += refund;
  }

  // Seller: locked TATA hatao, INR do
  sellerBase.locked -= qty;
  sellerQuote.available += cost;
};
