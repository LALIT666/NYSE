import { useEffect, useRef, useState } from "react";
import {
  createChart,
  CandlestickSeries,
  type IChartApi,
  type ISeriesApi,
  type CandlestickData,
  type Time,
} from "lightweight-charts";
import { useMarketStore } from "../store/marketStore";
import { wsManager } from "../api/ws";
import type { Market, KlineInterval, TradeUpdate } from "../types";

interface ChartProps {
  market: Market;
}

const INTERVALS: KlineInterval[] = ["1m", "5m", "1h", "1d"];

const getIntervalMs = (interval: KlineInterval): number => {
  switch (interval) {
    case "1m":
      return 60 * 1000;
    case "5m":
      return 5 * 60 * 1000;
    case "1h":
      return 60 * 60 * 1000;
    case "1d":
      return 24 * 60 * 60 * 1000;
  }
};

const Chart = ({ market }: ChartProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

  const [interval, setInterval] = useState<KlineInterval>("1m");

  const klines = useMarketStore((s) => s.klines);
  const fetchKlines = useMarketStore((s) => s.fetchKlines);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { color: "#18181b" },
        textColor: "#9ca3af",
      },
      grid: {
        vertLines: { color: "#2a2a2e" },
        horzLines: { color: "#2a2a2e" },
      },
      timeScale: {
        timeVisible: true,
        secondsVisible: false,
        borderColor: "#2a2a2e",
      },
      rightPriceScale: {
        borderColor: "#2a2a2e",
      },
      width: containerRef.current.clientWidth,
      height: 400,
    });

    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#22c55e",
      downColor: "#ef4444",
      borderUpColor: "#22c55e",
      borderDownColor: "#ef4444",
      wickUpColor: "#22c55e",
      wickDownColor: "#ef4444",
    });

    chartRef.current = chart;
    seriesRef.current = series;

    const handleResize = () => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: containerRef.current.clientWidth,
        });
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      chart.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  useEffect(() => {
    fetchKlines(market, interval);
  }, [market, interval, fetchKlines]);

  useEffect(() => {
    if (!seriesRef.current || klines.length === 0) return;

    const data: CandlestickData[] = klines.map((k) => ({
      time: (new Date(k.bucket).getTime() / 1000) as Time,
      open: k.open,
      high: k.high,
      low: k.low,
      close: k.close,
    }));

    seriesRef.current.setData(data);
    chartRef.current?.timeScale().fitContent();
  }, [klines]);

  useEffect(() => {
    const channel = `trades@${market}`;

    const handler = (raw: unknown) => {
      const trade = raw as TradeUpdate;
      if (!seriesRef.current || klines.length === 0) return;

      const intervalMs = getIntervalMs(interval);
      const tradeTime = new Date(trade.timestamp).getTime();
      const bucketTime = Math.floor(tradeTime / intervalMs) * intervalMs;
      const bucketSec = (bucketTime / 1000) as Time;

      const lastCandle = klines[klines.length - 1];
      const lastBucketSec = new Date(lastCandle.bucket).getTime() / 1000;

      if (bucketSec === lastBucketSec) {
        seriesRef.current.update({
          time: bucketSec,
          open: lastCandle.open,
          high: Math.max(lastCandle.high, trade.price),
          low: Math.min(lastCandle.low, trade.price),
          close: trade.price,
        });
      } else if (bucketSec > lastBucketSec) {
        seriesRef.current.update({
          time: bucketSec,
          open: trade.price,
          high: trade.price,
          low: trade.price,
          close: trade.price,
        });
      }
    };

    const unsub = wsManager.subscribe(channel, handler);
    return unsub;
  }, [market, interval, klines]);

  return (
    <div className="bg-[#18181b] border border-[#2a2a2e] rounded-lg p-3">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium">{market}</h3>
        <div className="flex gap-1">
          {INTERVALS.map((iv) => (
            <button
              key={iv}
              onClick={() => setInterval(iv)}
              className={`px-2 py-1 text-xs rounded ${
                interval === iv
                  ? "bg-white text-black"
                  : "bg-[#0e0e10] text-gray-400 hover:text-white"
              }`}
            >
              {iv}
            </button>
          ))}
        </div>
      </div>
      <div ref={containerRef} />
    </div>
  );
};

export default Chart;
