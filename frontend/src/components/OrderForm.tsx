import { useState, type FormEvent } from "react";
import toast from "react-hot-toast";
import { http } from "../api/http";
import { useMarketStore } from "../store/marketStore";
import type {
  Market,
  OrderKind,
  OrderType,
  PlaceOrderResponse,
} from "../types";

interface OrderFormProps {
  market: Market;
}

const OrderForm = ({ market }: OrderFormProps) => {
  const [kind, setKind] = useState<OrderKind>("buy");
  const [orderType, setOrderType] = useState<OrderType>("limit");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchBalances = useMarketStore((s) => s.fetchBalances);
  const fetchOpenOrders = useMarketStore((s) => s.fetchOpenOrders);
  const balances = useMarketStore((s) => s.balances);

  const [base, quote] = market.split("_") as [string, string];

  const availableBase =
    balances?.[base as keyof typeof balances]?.available ?? 0;
  const availableQuote =
    balances?.[quote as keyof typeof balances]?.available ?? 0;

  const total =
    price && quantity
      ? (parseFloat(price) * parseFloat(quantity)).toFixed(2)
      : "0";

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    const priceNum = parseFloat(price);
    const qtyNum = parseFloat(quantity);

    if (isNaN(priceNum) || isNaN(qtyNum) || priceNum <= 0 || qtyNum <= 0) {
      toast.error("Invalid price or quantity");
      return;
    }

    setLoading(true);
    try {
      const res = await http.post<PlaceOrderResponse>("/order", {
        kind,
        type: orderType,
        price: priceNum,
        quantity: qtyNum,
        market,
      });

      const { status, filledQuantity } = res.data;

      if (status === "filled") {
        toast.success(`Order filled! ${filledQuantity} @ ${priceNum}`);
      } else if (status === "partial") {
        toast.success(`Partial fill: ${filledQuantity}/${qtyNum}`);
      } else {
        toast.success("Order placed");
      }

      setPrice("");
      setQuantity("");
      fetchBalances();
      fetchOpenOrders();
    } catch (err) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Order failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#18181b] border border-[#2a2a2e] rounded-lg p-3">
      <div className="grid grid-cols-2 gap-1 mb-3">
        <button
          onClick={() => setKind("buy")}
          className={`py-1.5 text-sm rounded ${
            kind === "buy"
              ? "bg-green-600 text-white"
              : "bg-[#0e0e10] text-gray-400 hover:text-white"
          }`}
        >
          Buy
        </button>
        <button
          onClick={() => setKind("sell")}
          className={`py-1.5 text-sm rounded ${
            kind === "sell"
              ? "bg-red-600 text-white"
              : "bg-[#0e0e10] text-gray-400 hover:text-white"
          }`}
        >
          Sell
        </button>
      </div>

      <div className="grid grid-cols-2 gap-1 mb-3">
        <button
          onClick={() => setOrderType("limit")}
          className={`py-1 text-xs rounded ${
            orderType === "limit"
              ? "bg-[#2a2a2e] text-white"
              : "bg-[#0e0e10] text-gray-400 hover:text-white"
          }`}
        >
          Limit
        </button>
        <button
          onClick={() => setOrderType("market")}
          className={`py-1 text-xs rounded ${
            orderType === "market"
              ? "bg-[#2a2a2e] text-white"
              : "bg-[#0e0e10] text-gray-400 hover:text-white"
          }`}
        >
          Market
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <div className="text-xs text-gray-400 flex justify-between">
          <span>Available</span>
          <span>
            {kind === "buy"
              ? `${availableQuote.toFixed(2)} ${quote}`
              : `${availableBase.toFixed(2)} ${base}`}
          </span>
        </div>

        <div>
          <label className="text-xs text-gray-400">Price ({quote})</label>
          <input
            type="number"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="0.00"
            required
            disabled={orderType === "market"}
            className="w-full bg-[#0e0e10] border border-[#2a2a2e] px-2 py-1.5 rounded text-sm focus:outline-none focus:border-gray-500 disabled:opacity-50"
          />
        </div>

        <div>
          <label className="text-xs text-gray-400">Quantity ({base})</label>
          <input
            type="number"
            step="0.01"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder="0.00"
            required
            className="w-full bg-[#0e0e10] border border-[#2a2a2e] px-2 py-1.5 rounded text-sm focus:outline-none focus:border-gray-500"
          />
        </div>

        <div className="text-xs text-gray-400 flex justify-between">
          <span>Total</span>
          <span>
            {total} {quote}
          </span>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`py-2 rounded text-sm font-medium mt-1 disabled:opacity-50 ${
            kind === "buy"
              ? "bg-green-600 hover:bg-green-700"
              : "bg-red-600 hover:bg-red-700"
          }`}
        >
          {loading
            ? "Placing..."
            : `${kind === "buy" ? "Buy" : "Sell"} ${base}`}
        </button>
      </form>
    </div>
  );
};

export default OrderForm;
