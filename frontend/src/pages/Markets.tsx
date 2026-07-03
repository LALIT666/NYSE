import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import type { Market } from "../types";

const MARKETS: { id: Market; name: string; pair: string }[] = [
  { id: "TATA_INR", name: "TATA", pair: "TATA / INR" },
  { id: "PAYTM_INR", name: "PAYTM", pair: "PAYTM / INR" },
  { id: "ZOMATO_INR", name: "ZOMATO", pair: "ZOMATO / INR" },
];

function Markets() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      <Navbar />

      <div className="p-8">
        <h1 className="text-2xl font-bold mb-6">Markets</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {MARKETS.map((market) => (
            <div
              key={market.id}
              onClick={() => navigate(`/trade/${market.id}`)}
              className="bg-[#18181b] border border-[#2a2a2e] rounded-lg p-6 cursor-pointer hover:border-blue-500 transition-colors"
            >
              <h2 className="text-xl font-bold">{market.name}</h2>

              <p className="text-gray-400 text-sm mt-1">{market.pair}</p>

              <p className="text-blue-500 text-sm mt-4">Trade →</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Markets;
