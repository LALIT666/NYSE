import { useMarketStore } from "../store/marketStore";

function Balance() {
  const balances = useMarketStore((s) => s.balances);

  if (!balances) {
    return <p className="text-xs text-gray-500">Loading balances...</p>;
  }

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-400 mb-2">Balances</h3>

      <div className="space-y-1">
        {Object.entries(balances).map(([asset, bal]) => (
          <div key={asset} className="flex justify-between text-xs">
            <span className="text-gray-300">{asset}</span>
            <span className="text-gray-400">
              {bal.available.toFixed(2)}

              {bal.locked > 0 && (
                <span className="text-yellow-500 ml-1">
                  ({bal.locked.toFixed(2)} locked)
                </span>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Balance;
