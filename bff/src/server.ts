import cors from "cors";
import express from "express";
import rateLimit from "express-rate-limit";
import { createProxyMiddleware } from "http-proxy-middleware";

const app = express();
const PORT = process.env.PORT ?? 4000;
const FASTAPI_URL = process.env.FASTAPI_URL ?? "http://localhost:8000";

app.use(cors({ origin: "http://localhost:3000" }));
app.use(express.json());

// Global: 200 req / 15 min
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 200 }));

// Auth: 10 req / 15 min
app.use("/api/auth", rateLimit({ windowMs: 15 * 60 * 1000, max: 10 }));

// Matcher: 20 req / min
app.use("/api/matcher", rateLimit({ windowMs: 60 * 1000, max: 20 }));

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use(
  "/api",
  createProxyMiddleware({
    target: FASTAPI_URL,
    changeOrigin: true,
    pathRewrite: { "^/api": "" },
  }) as unknown as express.RequestHandler
);

app.listen(PORT, () => {
  console.log(`BFF listening on port ${PORT}`);
});
