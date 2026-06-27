import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import morgan from "morgan";
import connectDB from "./config/db.js";

import userRoutes from "./routes/user.route.js";
import productRoutes from "./routes/product.route.js";
import orderRoutes from "./routes/orders.route.js";
import cartRoutes from "./routes/cart.route.js";
import addressRoutes from "./routes/address.route.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const API_PREFIX = "/api/v1";

app.set("trust proxy", 1);

connectDB();

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://localhost:4173",
  "http://127.0.0.1:4173",
  "https://bigzone-nu.vercel.app",
  "https://bigzone-git-main-mukteshmadhava-8668s-projects.vercel.app",
];

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));

app.use(morgan("dev"));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: process.env.NODE_ENV === "production" ? 100 : 1000,
  message: {
    success: false,
    message: "Too many requests from this IP, please try again later.",
  },
});

app.use("/api/", limiter);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`Not allowed by CORS: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.options("/{*splat}", cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get(`${API_PREFIX}/health`, (_req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is healthy",
  });
});

app.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "BIGZONE Backend API is running 🚀",
  });
});

app.use(`${API_PREFIX}/users`, userRoutes);
app.use(`${API_PREFIX}/products`, productRoutes);
app.use(`${API_PREFIX}/orders`, orderRoutes);
app.use(`${API_PREFIX}/cart`, cartRoutes);
app.use(`${API_PREFIX}/addresses`, addressRoutes);

app.all("/api/{*splat}", (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint ${req.originalUrl} not found`,
  });
});

app.use((err, req, res, _next) => {
  console.error("Global Error:", err);

  let status = err.status || 500;
  let message =
    process.env.NODE_ENV === "production"
      ? "Internal server error"
      : err.message || "Something went wrong";

  if (err.name === "ValidationError") {
    return res.status(400).json({
      success: false,
      message: "Validation Error",
      errors: Object.values(err.errors).map((e) => e.message),
    });
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

  res.status(status).json({
    success: false,
    message,
  });
});

process.on("SIGTERM", () => process.exit(0));
process.on("SIGINT", () => process.exit(0));

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}${API_PREFIX}`);
});