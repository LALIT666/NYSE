import { instruments } from "../data/instruments.data";

export function changePriceInEveryThreeSecond() {
  setInterval(() => {
    if (instruments.length === 0) return;

    const randomInstrument =
      instruments[Math.floor(Math.random() * instruments.length)];

    const change = Math.random() * 5 - 2.5;

    randomInstrument!.price = Number(
      (randomInstrument!.price + change).toFixed(2),
    );

    console.log(
      `${randomInstrument!.symbol} updated price: ${randomInstrument!.price}`,
    );
  }, 3000);
}
