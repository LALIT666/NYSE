import { useMarketStore } from "../store/marketStore";

function RecentTrades() {
  const recentTrades = useMarketStore((s) => s.recentTrades);

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-400 mb-2">
        Recent Trades
      </h3>

      <div className="flex justify-between text-xs text-gray-500 mb-1 px-1">
        <span>Price</span>
        <span>Qty</span>
        <span>Time</span>
      </div>

      <div className="space-y-px max-h-48 overflow-y-auto">
        {recentTrades.map((trade, i) => (
          <div
            key={`${trade.tradeId}-${i}`}
            className="flex justify-between text-xs px-1 py-0.5"
          >
            <span className="text-white">{trade.price.toFixed(2)}</span>
            <span className="text-gray-300">{trade.quantity.toFixed(2)}</span>
            <span className="text-gray-500">
              {new Date(trade.timestamp).toLocaleTimeString()}
            </span>
          </div>
        ))}
      </div>

      {recentTrades.length === 0 && (
        <p className="text-xs text-gray-500 text-center py-4">No trades yet</p>
      )}
    </div>
  );
}

export default RecentTrades;
