export interface User {
  userId: string;
  email: string;
  passwordHash: string;
  createdAt: Date;
}

export type Asset = "INR" | "TATA" | "PAYTM" | "ZOMATO";

export interface Balance {
  available: number; // jo paisa/stock abhi use kar sakte ho
  locked: number; // jo paisa/stock kisi order me fas gaya hai, use nahi kar sakte abhi
}

export interface UserBalance {
  userId: string;
  assets: Map<Asset, Balance>;
}
