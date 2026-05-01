export enum OrderType {
  BUY = "buy",
  SELL = "sell",
}

export enum SymbolEnum {
  AAPL = "AAPL",
  MSFT = "MSFT",
  TSLA = "TSLA",
  NVDA = "NVDA",
}

export interface Order {
  id: string;
  symbol: SymbolEnum;
  type: OrderType;
  quantity: number;
  price: number;
  status: "open" | "filled" | "cancelled";
  timestamp: string;
}
