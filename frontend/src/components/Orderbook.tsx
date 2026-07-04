import { useEffect } from "react";
import { useMarketStore } from "../store/marketStore";
import { wsManager } from "../api/ws";
import type { Market, Depth } from "../types";

interface OrderbookProps {
  market: Market;
}

function Orderbook({ market }: OrderbookProps) {
  const depth = useMarketStore((s) => s.depth);
  const setDepth = useMarketStore((s) => s.setDepth);
  const fetchDepth = useMarketStore((s) => s.fetchDepth);

  // Initial fetch on mount / market change
  useEffect(() => {
    fetchDepth(market);
  }, [market, fetchDepth]);

  // WS subscribe for live updates
  useEffect(() => {
    const channel = `depth@${market}`;
    const handler = (raw: unknown) => {
      const d = raw as Depth;
      setDepth(d);
    };
    const unsub = wsManager.subscribe(channel, handler);
    return unsub;
  }, [market, setDepth]);

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-400 mb-2">Orderbook</h3>

      <div className="flex justify-between text-xs text-gray-500 mb-1 px-1">
        <span>Price</span>
        <span>Qty</span>
      </div>

      <div className="space-y-px">
        {depth.asks
          .slice(0, 15)
          .reverse()
          .map(([price, qty], i) => (
            <div
              key={`ask-${i}`}
              className="flex justify-between text-xs px-1 py-0.5"
            >
              <span className="text-red-400">{price.toFixed(2)}</span>
              <span className="text-gray-300">{qty.toFixed(2)}</span>
            </div>
          ))}
      </div>

      <div className="border-t border-[#2a2a2e] my-1" />

      <div className="space-y-px">
        {depth.bids.slice(0, 15).map(([price, qty], i) => (
          <div
            key={`bid-${i}`}
            className="flex justify-between text-xs px-1 py-0.5"
          >
            <span className="text-green-400">{price.toFixed(2)}</span>
            <span className="text-gray-300">{qty.toFixed(2)}</span>
          </div>
        ))}
      </div>

      {depth.bids.length === 0 && depth.asks.length === 0 && (
        <p className="text-xs text-gray-500 text-center py-4">No orders yet</p>
      )}
    </div>
  );
}

export default Orderbook;
