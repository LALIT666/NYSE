import { http } from "../api/http";
import { useMarketStore } from "../store/marketStore";
import toast from "react-hot-toast";

function MyOrders() {
  const openOrders = useMarketStore((s) => s.openOrders);
  const fetchOpenOrders = useMarketStore((s) => s.fetchOpenOrders);
  const fetchDepth = useMarketStore((s) => s.fetchDepth);
  const fetchBalances = useMarketStore((s) => s.fetchBalances);
  const currentMarket = useMarketStore((s) => s.currentMarket);

  const handleCancel = async (orderId: string) => {
    try {
      await http.delete(`/order/${orderId}`);
      toast.success("Order cancelled");

      fetchOpenOrders();
      fetchDepth(currentMarket);
      fetchBalances();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Cancel failed");
    }
  };

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-400 mb-2">Open Orders</h3>

      {openOrders.length > 0 ? (
        <div className="space-y-1">
          <div className="grid grid-cols-6 text-xs text-gray-500 px-1">
            <span>Side</span>
            <span>Price</span>
            <span>Qty</span>
            <span>Filled</span>
            <span>Market</span>
            <span></span>
          </div>

          {openOrders.map((order) => (
            <div
              key={order.orderId}
              className="grid grid-cols-6 text-xs px-1 py-1 hover:bg-[#0e0e10] rounded"
            >
              <span
                className={
                  order.kind === "buy" ? "text-green-400" : "text-red-400"
                }
              >
                {order.kind.toUpperCase()}
              </span>
              <span className="text-white">{order.price.toFixed(2)}</span>
              <span className="text-gray-300">{order.quantity.toFixed(2)}</span>
              <span className="text-gray-400">
                {order.filledQuantity.toFixed(2)}
              </span>
              <span className="text-gray-500">{order.market}</span>
              <button
                onClick={() => handleCancel(order.orderId)}
                className="text-red-500 hover:text-red-400"
              >
                Cancel
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-xs text-gray-500 text-center py-4">No open orders</p>
      )}
    </div>
  );
}

export default MyOrders;
