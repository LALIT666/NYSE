import { create } from "zustand";
import { http } from "../api/http";
import type {
  Market,
  Depth,
  Trade,
  Order,
  UserBalances,
  Kline,
  KlineInterval,
} from "../types";

interface MarketState {
  currentMarket: Market;
  setMarket: (m: Market) => void;

  depth: Depth;
  setDepth: (d: Depth) => void;
  fetchDepth: (market: Market) => Promise<void>;

  recentTrades: Trade[];
  fetchRecentTrades: (market: Market) => Promise<void>;
  addTrade: (t: Trade) => void;

  openOrders: Order[];
  fetchOpenOrders: () => Promise<void>;

  orderHistory: Order[];
  fetchOrderHistory: () => Promise<void>;

  balances: UserBalances | null;
  fetchBalances: () => Promise<void>;

  klines: Kline[];
  setKlines: (k: Kline[]) => void;
  fetchKlines: (market: Market, interval: KlineInterval) => Promise<void>;
}

export const useMarketStore = create<MarketState>((set) => ({
  currentMarket: "TATA_INR",
  setMarket: (m) => set({ currentMarket: m }),

  depth: { bids: [], asks: [] },
  setDepth: (d) => set({ depth: d }),
  fetchDepth: async (market) => {
    const res = await http.get<Depth>(`/depth/${market}`);
    set({ depth: res.data });
  },

  recentTrades: [],
  fetchRecentTrades: async (market) => {
    const res = await http.get<{ trades: Trade[] }>(`/trades/${market}`);
    set({ recentTrades: res.data.trades });
  },
  addTrade: (t) =>
    set((state) => ({
      recentTrades: [t, ...state.recentTrades].slice(0, 50),
    })),

  openOrders: [],
  fetchOpenOrders: async () => {
    const res = await http.get<{ orders: Order[] }>("/order/open/list");
    set({ openOrders: res.data.orders });
  },

  orderHistory: [],
  fetchOrderHistory: async () => {
    const res = await http.get<{ orders: Order[] }>("/order/history/list");
    set({ orderHistory: res.data.orders });
  },

  balances: null,
  fetchBalances: async () => {
    const res = await http.get<{ balances: UserBalances }>("/balance");
    set({ balances: res.data.balances });
  },

  klines: [],
  setKlines: (k) => set({ klines: k }),
  fetchKlines: async (market, interval) => {
    const res = await http.get<{ klines: Kline[] }>(`/klines/${market}`, {
      params: { interval, limit: 200 },
    });
    set({ klines: res.data.klines });
  },
}));
