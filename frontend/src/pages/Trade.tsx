import { useEffect } from "react";
import { useParams, Navigate } from "react-router-dom";
import { useMarketStore } from "../store/marketStore";
import Navbar from "../components/Navbar";
import Chart from "../components/Chart";
import Orderbook from "../components/Orderbook";
import OrderForm from "../components/OrderForm";
import Balance from "../components/Balance";
import RecentTrades from "../components/RecentTrades";
import MyOrders from "../components/MyOrders";
import type { Market } from "../types";

const VALID_MARKETS: Market[] = ["TATA_INR", "PAYTM_INR", "ZOMATO_INR"];

const Trade = () => {
  const { market } = useParams<{ market: string }>();
  const setMarket = useMarketStore((s) => s.setMarket);
  const fetchBalances = useMarketStore((s) => s.fetchBalances);

  const isValidMarket = market && VALID_MARKETS.includes(market as Market);

  useEffect(() => {
    if (isValidMarket) {
      setMarket(market as Market);
      fetchBalances();
    }
  }, [market, isValidMarket, setMarket, fetchBalances]);

  if (!isValidMarket) {
    return <Navigate to="/markets" replace />;
  }

  const currentMarket = market as Market;

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="p-3 grid grid-cols-12 gap-3">
        <div className="col-span-8 flex flex-col gap-3">
          <Chart market={currentMarket} />
          <MyOrders />
        </div>

        <div className="col-span-2">
          <div className="h-[500px]">
            <Orderbook market={currentMarket} />
          </div>
        </div>

        <div className="col-span-2 flex flex-col gap-3">
          <OrderForm market={currentMarket} />
          <Balance />
          <RecentTrades market={currentMarket} />
        </div>
      </div>
    </div>
  );
};

export default Trade;
