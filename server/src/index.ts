import express from "express";
import dotenv from "dotenv";
dotenv.config();

import instumentsRouter from "./routes/instruments.routes";

const app = express();
const PORT = process.env.PORT;
app.use(express.json());

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.use("/api/v1/instruments", instumentsRouter);

app.listen(PORT, () => {
  console.log(`server is running on port: http://localhost:${PORT}`);
});
