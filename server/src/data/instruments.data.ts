export type InstrumentsType = {
  symbol: string;
  name: string;
  price: number;
};

export const instruments: InstrumentsType[] = [
  {
    symbol: "AAPL",
    name: "Apple Inc.",
    price: 210.25,
  },
  {
    symbol: "MSFT",
    name: "Microsoft Corporation",
    price: 389.1,
  },
  {
    symbol: "TSLA",
    name: "Tesla Inc.",
    price: 172.55,
  },
  {
    symbol: "NVDA",
    name: "NVIDIA Corporation",
    price: 902.3,
  },
];
