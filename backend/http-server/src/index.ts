import express from "express";
import { PORT } from "./config/config";

const app = express();

app.use(express.json());

app.get("/api/v1/healthy", (req, res) => {
  console.log("user is on this route -- api/v1/healthy");
  res.json({
    status: 200,
    success: true,
    route: "🏥 api/v1/healthy",
    message: "✅ Http-Server is healthy",
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Exchange API running on http://localhost:${PORT}`);
});
