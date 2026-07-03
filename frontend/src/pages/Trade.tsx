import { useEffect } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import Chart from "../components/Chart";
import Orderbook from "../components/Orderbook";
import OrderForm from "../components/OrderForm";
import Balance from "../components/Balance";
import RecentTrades from "../components/RecentTrades";
import MyOrders from "../components/MyOrders";
import { useMarketStore } from "../store/marketStore";
import { wsManager } from "../api/ws";
import type { Market, Depth, Trade as TradeType } from "../types";

function Trade() {
  const { market } = useParams<{ market: Market }>();

  const fetchDepth = useMarketStore((s) => s.fetchDepth);
  const fetchBalances = useMarketStore((s) => s.fetchBalances);
  const fetchRecentTrades = useMarketStore((s) => s.fetchRecentTrades);
  const fetchOpenOrders = useMarketStore((s) => s.fetchOpenOrders);
  const setMarket = useMarketStore((s) => s.setMarket);
  const setDepth = useMarketStore((s) => s.setDepth);
  const addTrade = useMarketStore((s) => s.addTrade);

  useEffect(() => {
    if (!market) return;

    setMarket(market as Market);

    fetchDepth(market as Market);
    fetchBalances();
    fetchRecentTrades(market as Market);
    fetchOpenOrders();

    const unsubDepth = wsManager.subscribe(`depth@${market}`, (data) => {
      setDepth(data as Depth);
    });

    const unsubTrades = wsManager.subscribe(`trades@${market}`, (data) => {
      addTrade(data as TradeType);
    });

    return () => {
      unsubDepth();
      unsubTrades();
    };
  }, [
    market,
    fetchDepth,
    fetchBalances,
    fetchRecentTrades,
    fetchOpenOrders,
    setMarket,
    setDepth,
    addTrade,
  ]);

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="p-4">
        <h1 className="text-xl font-bold mb-4">{market}</h1>

        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-8">
            <Chart market={market as Market} />
          </div>

          <div className="col-span-4 space-y-4">
            <div className="bg-[#18181b] border border-[#2a2a2e] rounded-lg p-4 h-72">
              <Orderbook />
            </div>

            <div className="bg-[#18181b] border border-[#2a2a2e] rounded-lg p-4">
              <OrderForm />
            </div>

            <div className="bg-[#18181b] border border-[#2a2a2e] rounded-lg p-4">
              <Balance />
            </div>
          </div>

          <div className="col-span-4 bg-[#18181b] border border-[#2a2a2e] rounded-lg p-4">
            <RecentTrades />
          </div>

          <div className="col-span-8 bg-[#18181b] border border-[#2a2a2e] rounded-lg p-4">
            <MyOrders />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Trade;
