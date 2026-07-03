import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { http } from "../api/http";
import { useMarketStore } from "../store/marketStore";
import type { Asset } from "../types";

const ASSETS: Asset[] = ["INR", "TATA", "PAYTM", "ZOMATO"];

const Balance = () => {
  const balances = useMarketStore((s) => s.balances);
  const fetchBalances = useMarketStore((s) => s.fetchBalances);

  const [showDeposit, setShowDeposit] = useState(false);
  const [asset, setAsset] = useState<Asset>("INR");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchBalances();
  }, [fetchBalances]);

  const handleDeposit = async () => {
    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      toast.error("Invalid amount");
      return;
    }

    setLoading(true);
    try {
      await http.post("/balance/deposit", { asset, amount: amt });
      toast.success(`Deposited ${amt} ${asset}`);
      setAmount("");
      setShowDeposit(false);
      fetchBalances();
    } catch (err) {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? "Deposit failed";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-[#18181b] border border-[#2a2a2e] rounded-lg p-3">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium">Balance</h3>
        <button
          onClick={() => setShowDeposit(!showDeposit)}
          className="text-xs px-2 py-0.5 border border-[#2a2a2e] rounded hover:bg-[#2a2a2e]"
        >
          {showDeposit ? "Cancel" : "Deposit"}
        </button>
      </div>

      {showDeposit && (
        <div className="flex flex-col gap-2 mb-3 p-2 bg-[#0e0e10] rounded">
          <select
            value={asset}
            onChange={(e) => setAsset(e.target.value as Asset)}
            className="bg-[#18181b] border border-[#2a2a2e] px-2 py-1 rounded text-xs"
          >
            {ASSETS.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
          <input
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Amount"
            className="bg-[#18181b] border border-[#2a2a2e] px-2 py-1 rounded text-xs focus:outline-none focus:border-gray-500"
          />
          <button
            onClick={handleDeposit}
            disabled={loading}
            className="bg-white text-black py-1 rounded text-xs font-medium disabled:opacity-50"
          >
            {loading ? "..." : "Deposit"}
          </button>
        </div>
      )}

      <div className="flex flex-col gap-1">
        {ASSETS.map((a) => {
          const bal = balances?.[a];
          return (
            <div key={a} className="flex justify-between text-xs">
              <span className="text-gray-400">{a}</span>
              <div className="text-right">
                <div>{bal?.available.toFixed(2) ?? "0.00"}</div>
                {bal && bal.locked > 0 && (
                  <div className="text-gray-500 text-[10px]">
                    Locked: {bal.locked.toFixed(2)}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Balance;
