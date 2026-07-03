import { useState } from "react";
import { http } from "../api/http";
import { useMarketStore } from "../store/marketStore";
import type { OrderKind } from "../types";
import toast from "react-hot-toast";

function OrderForm() {
  const [kind, setKind] = useState<OrderKind>("buy");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [loading, setLoading] = useState(false);

  const currentMarket = useMarketStore((s) => s.currentMarket);
  const fetchDepth = useMarketStore((s) => s.fetchDepth);
  const fetchOpenOrders = useMarketStore((s) => s.fetchOpenOrders);
  const fetchBalances = useMarketStore((s) => s.fetchBalances);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await http.post("/order", {
        kind,
        type: "limit",
        price: parseFloat(price),
        quantity: parseFloat(quantity),
        market: currentMarket,
      });

      toast.success(`${kind.toUpperCase()} order placed!`);

      setPrice("");
      setQuantity("");

      fetchDepth(currentMarket);
      fetchOpenOrders();
      fetchBalances();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Order failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex mb-4">
        <button
          onClick={() => setKind("buy")}
          className={`flex-1 py-2 text-sm font-semibold rounded-l ${
            kind === "buy"
              ? "bg-green-600 text-white"
              : "bg-[#0e0e10] text-gray-400"
          }`}
        >
          BUY
        </button>
        <button
          onClick={() => setKind("sell")}
          className={`flex-1 py-2 text-sm font-semibold rounded-r ${
            kind === "sell"
              ? "bg-red-600 text-white"
              : "bg-[#0e0e10] text-gray-400"
          }`}
        >
          SELL
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Price</label>
          <input
            type="number"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            className="w-full p-2 rounded bg-[#0e0e10] border border-[#2a2a2e] text-white text-sm"
            placeholder="0.00"
            required
          />
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Quantity</label>
          <input
            type="number"
            step="0.01"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="w-full p-2 rounded bg-[#0e0e10] border border-[#2a2a2e] text-white text-sm"
            placeholder="0.00"
            required
          />
        </div>

        {price && quantity && (
          <div className="text-xs text-gray-400">
            Total: {(parseFloat(price) * parseFloat(quantity)).toFixed(2)} INR
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className={`w-full p-2 rounded font-semibold text-sm disabled:opacity-50 ${
            kind === "buy"
              ? "bg-green-600 hover:bg-green-700"
              : "bg-red-600 hover:bg-red-700"
          }`}
        >
          {loading
            ? "Placing..."
            : `${kind === "buy" ? "BUY" : "SELL"} ${currentMarket.split("_")[0]}`}
        </button>
      </form>
    </div>
  );
}

export default OrderForm;
