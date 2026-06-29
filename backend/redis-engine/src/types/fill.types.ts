// Fill: Jab order match hota hai toh ek fill banta hai
// Ek order ke multiple fills ho sakte hai
// (alag alag prices pe, alag alag counter orders se)

export interface Fill {
  price: number; // Kis price pe fill hua
  quantity: number; // Kitna fill hua
  tradeId: string; // Konsa trade bana
  counterOrderId: string; // Saamne wale ka order id
}
