import { useEffect } from "react";
import { useMarketStore } from "../store/marketStore";
import { wsManager } from "../api/ws";
import type { Market, TradeUpdate, Trade } from "../types";

interface RecentTradesProps {
  market: Market;
}

const RecentTrades = ({ market }: RecentTradesProps) => {
  const trades = useMarketStore((s) => s.recentTrades);
  const fetchRecentTrades = useMarketStore((s) => s.fetchRecentTrades);
  const addTrade = useMarketStore((s) => s.addTrade);

  useEffect(() => {
    fetchRecentTrades(market);
  }, [market, fetchRecentTrades]);

  useEffect(() => {
    const channel = `trades@${market}`;
    const handler = (raw: unknown) => {
      const t = raw as TradeUpdate;
      const trade: Trade = {
        tradeId: t.tradeId,
        market,
        price: t.price,
        quantity: t.quantity,
        timestamp: t.timestamp,
        buyerUserId: "",
        sellerUserId: "",
        buyOrderId: "",
        sellOrderId: "",
      };
      addTrade(trade);
    };
    const unsub = wsManager.subscribe(channel, handler);
    return unsub;
  }, [market, addTrade]);

  return (
    <div className="bg-[#18181b] border border-[#2a2a2e] rounded-lg p-3">
      <h3 className="text-sm font-medium mb-2">Recent Trades</h3>

      <div className="grid grid-cols-3 text-xs text-gray-400 px-1 py-1 border-b border-[#2a2a2e]">
        <div>Price</div>
        <div className="text-right">Size</div>
        <div className="text-right">Time</div>
      </div>

      <div className="max-h-48 overflow-y-auto">
        {trades.length === 0 ? (
          <div className="text-xs text-gray-500 px-1 py-2">No trades yet</div>
        ) : (
          trades.slice(0, 30).map((t, idx) => {
            const time = new Date(t.timestamp).toLocaleTimeString("en-US", {
              hour12: false,
            });
            return (
              <div
                key={`${t.tradeId}-${idx}`}
                className="grid grid-cols-3 px-1 py-0.5 text-xs"
              >
                <div className="text-green-500">{t.price.toFixed(2)}</div>
                <div className="text-right">{t.quantity.toFixed(2)}</div>
                <div className="text-right text-gray-500">{time}</div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default RecentTrades;
