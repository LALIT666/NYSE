import { useEffect } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Orderbook from "../components/Orderbook";
import { useMarketStore } from "../store/marketStore";
import type { Market } from "../types";

function Trade() {
  const { market } = useParams<{ market: Market }>();

  const fetchDepth = useMarketStore((s) => s.fetchDepth);
  const setMarket = useMarketStore((s) => s.setMarket);

  useEffect(() => {
    if (!market) return;

    setMarket(market as Market);

    fetchDepth(market as Market);

    const interval = setInterval(() => {
      fetchDepth(market as Market);
    }, 3000);

    return () => clearInterval(interval);
  }, [market, fetchDepth, setMarket]);

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="p-4">
        <h1 className="text-xl font-bold mb-4">{market}</h1>

        <div className="grid grid-cols-12 gap-4">
          {/* Chart area */}
          <div className="col-span-8 bg-[#18181b] border border-[#2a2a2e] rounded-lg p-4 h-96">
            <p className="text-gray-400">Chart coming soon...</p>
          </div>

          <div className="col-span-4 space-y-4">
            <div className="bg-[#18181b] border border-[#2a2a2e] rounded-lg p-4 h-80">
              <Orderbook />
            </div>

            <div className="bg-[#18181b] border border-[#2a2a2e] rounded-lg p-4">
              <p className="text-gray-400">Order form coming soon...</p>
            </div>
          </div>

          <div className="col-span-12 bg-[#18181b] border border-[#2a2a2e] rounded-lg p-4">
            <p className="text-gray-400">Orders & trades coming soon...</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Trade;
