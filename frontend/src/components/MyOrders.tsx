import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { http } from "../api/http";
import { useMarketStore } from "../store/marketStore";
import { useAuthStore } from "../store/authStore";
import { wsManager } from "../api/ws";
import type { OrderUpdate } from "../types";

type Tab = "open" | "history";

const MyOrders = () => {
  const [tab, setTab] = useState<Tab>("open");
  const [cancelingId, setCancelingId] = useState<string | null>(null);

  const userId = useAuthStore((s) => s.userId);
  const openOrders = useMarketStore((s) => s.openOrders);
  const orderHistory = useMarketStore((s) => s.orderHistory);
  const fetchOpenOrders = useMarketStore((s) => s.fetchOpenOrders);
  const fetchOrderHistory = useMarketStore((s) => s.fetchOrderHistory);
  const fetchBalances = useMarketStore((s) => s.fetchBalances);

  useEffect(() => {
    fetchOpenOrders();
    fetchOrderHistory();
  }, [fetchOpenOrders, fetchOrderHistory]);

  useEffect(() => {
    if (!userId) return;

    const channel = `orders@${userId}`;
    const handler = (raw: unknown) => {
      const update = raw as OrderUpdate;

      if (
        update.status === "filled" ||
        update.status === "cancelled" ||
        update.status === "partial"
      ) {
        fetchOpenOrders();
        fetchOrderHistory();
        fetchBalances();

        if (update.status === "filled") {
          toast.success(`Order filled: ${update.orderId.slice(0, 8)}...`);
        }
      }
    };

    const unsub = wsManager.subscribe(channel, handler);
    return unsub;
  }, [userId, fetchOpenOrders, fetchOrderHistory, fetchBalances]);

  const handleCancel = async (orderId: string) => {
    setCancelingId(orderId);
    try {
      await http.delete(`/order/${orderId}`);
      toast.success("Order cancelled");
      fetchOpenOrders();
      fetchBalances();
    } catch (err) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Cancel failed";
      toast.error(msg);
    } finally {
      setCancelingId(null);
    }
  };

  const orders = tab === "open" ? openOrders : orderHistory;

  return (
    <div className="bg-[#18181b] border border-[#2a2a2e] rounded-lg p-3">
      <div className="flex gap-1 mb-3">
        <button
          onClick={() => setTab("open")}
          className={`px-3 py-1 text-sm rounded ${
            tab === "open"
              ? "bg-[#2a2a2e] text-white"
              : "bg-[#0e0e10] text-gray-400 hover:text-white"
          }`}
        >
          Open Orders ({openOrders.length})
        </button>
        <button
          onClick={() => setTab("history")}
          className={`px-3 py-1 text-sm rounded ${
            tab === "history"
              ? "bg-[#2a2a2e] text-white"
              : "bg-[#0e0e10] text-gray-400 hover:text-white"
          }`}
        >
          History ({orderHistory.length})
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead className="text-gray-400 border-b border-[#2a2a2e]">
            <tr>
              <th className="text-left px-2 py-2 font-medium">Time</th>
              <th className="text-left px-2 py-2 font-medium">Market</th>
              <th className="text-left px-2 py-2 font-medium">Side</th>
              <th className="text-left px-2 py-2 font-medium">Type</th>
              <th className="text-right px-2 py-2 font-medium">Price</th>
              <th className="text-right px-2 py-2 font-medium">Qty</th>
              <th className="text-right px-2 py-2 font-medium">Filled</th>
              <th className="text-left px-2 py-2 font-medium">Status</th>
              {tab === "open" && (
                <th className="text-right px-2 py-2 font-medium">Action</th>
              )}
            </tr>
          </thead>
          <tbody>
            {orders.length === 0 ? (
              <tr>
                <td
                  colSpan={tab === "open" ? 9 : 8}
                  className="text-center text-gray-500 py-4"
                >
                  No {tab === "open" ? "open orders" : "history"}
                </td>
              </tr>
            ) : (
              orders.map((o) => (
                <tr key={o.orderId} className="border-b border-[#2a2a2e]">
                  <td className="px-2 py-2 text-gray-400">
                    {new Date(o.createdAt).toLocaleTimeString("en-US", {
                      hour12: false,
                    })}
                  </td>
                  <td className="px-2 py-2">{o.market}</td>
                  <td
                    className={`px-2 py-2 ${
                      o.kind === "buy" ? "text-green-500" : "text-red-500"
                    }`}
                  >
                    {o.kind.toUpperCase()}
                  </td>
                  <td className="px-2 py-2 text-gray-400">{o.type}</td>
                  <td className="px-2 py-2 text-right">{o.price.toFixed(2)}</td>
                  <td className="px-2 py-2 text-right">
                    {o.quantity.toFixed(2)}
                  </td>
                  <td className="px-2 py-2 text-right">
                    {o.filledQuantity.toFixed(2)}
                  </td>
                  <td className="px-2 py-2">
                    <span
                      className={
                        o.status === "filled"
                          ? "text-green-500"
                          : o.status === "cancelled"
                            ? "text-gray-500"
                            : o.status === "partial"
                              ? "text-yellow-500"
                              : "text-blue-400"
                      }
                    >
                      {o.status}
                    </span>
                  </td>
                  {tab === "open" && (
                    <td className="px-2 py-2 text-right">
                      <button
                        onClick={() => handleCancel(o.orderId)}
                        disabled={cancelingId === o.orderId}
                        className="text-xs px-2 py-0.5 border border-[#2a2a2e] rounded hover:bg-[#2a2a2e] disabled:opacity-50"
                      >
                        {cancelingId === o.orderId ? "..." : "Cancel"}
                      </button>
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MyOrders;
