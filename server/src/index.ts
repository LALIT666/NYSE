import express from "express";

const app = express();
const PORT = 3000;

app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`server is running on port: http://localhost:${PORT}`);
});
