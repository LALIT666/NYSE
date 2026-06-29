// Asset: Hamare system me kaunse coins/paisa hai
export type Asset = "INR" | "TATA" | "PAYTM" | "ZOMATO";

// Balance: Ek asset ka kitna available hai aur kitna locked hai
export interface Balance {
  available: number; // Jo freely use kar sakte ho
  locked: number; // Jo kisi order me fasa hua hai
}

// UserBalance: Ek user ke paas saare assets ka balance
export interface UserBalance {
  userId: string;
  assets: Map<Asset, Balance>;
}
