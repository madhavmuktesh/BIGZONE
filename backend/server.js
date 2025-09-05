import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";
import connectDB from "./config/db.js";

import userRoutes from "./routes/user.route.js";
import productRoutes from "./routes/product.route.js";
import orderRoutes from "./routes/order.route.js";
import cartRoutes from "./routes/cart.route.js";
import router from "./routes/address.route.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;
const API_PREFIX = "/api/v1";

connectDB();

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "production" ? 100 : 1000,
  message: "Too many requests from this IP, please try again later.",
});
app.use("/api/", limiter);

const corsOptions =
  process.env.NODE_ENV === "production"
    ? { origin: process.env.FRONTEND_URL || false, credentials: true }
    : {
        origin: [
          "http://localhost:3000",
          "http://localhost:5173",
          "http://127.0.0.1:5173",
          "http://localhost:4173",   // 👈 add this
          "http://127.0.0.1:4173"    // 👈 and this (sometimes Vite preview uses 127.0.0.1)
        ],
        credentials: true,
      };

app.use(cors(corsOptions));

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(cookieParser());

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

app.use(`${API_PREFIX}/users`, userRoutes);
app.use(`${API_PREFIX}/products`, productRoutes);
app.use(`${API_PREFIX}/orders`, orderRoutes);
app.use(`${API_PREFIX}/cart`, cartRoutes);
app.use(`${API_PREFIX}/addresses`, router);

app.get(`${API_PREFIX}/health`, (req, res) => {
  res.status(200).json({ success: true, message: "Server is healthy" });
});

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));
  app.get("/*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "../frontend/dist/index.html"));
  });
} else {
  app.get("/", (req, res) => {
    res.json({ success: true, message: "API running in dev mode" });
  });
}

app.all("/api/*splat", (req, res) => {
  res.status(404).json({ success: false, message: `API endpoint ${req.originalUrl} not found` });
});

app.use((err, req, res, next) => {
  console.error("Global Error:", err);
  let status = err.status || 500;
  let message = process.env.NODE_ENV === "production" ? "Internal server error" : err.message || "Something went wrong";

  if (err.name === "ValidationError") {
    status = 400;
    return res.status(status).json({ success: false, message: "Validation Error", errors: Object.values(err.errors).map(e => e.message) });
  }

  if (err.name === "CastError") {
    status = 400;
    message = "Invalid ID format";
  }

  if (err.code === 11000) {
    status = 400;
    const field = Object.keys(err.keyValue)[0];
    message = `${field} already exists`;
  }

  res.status(status).json({ success: false, message });
});

process.on("SIGTERM", () => process.exit(0));
process.on("SIGINT", () => process.exit(0));

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}${API_PREFIX}`);
});
