// ===== ORDER ROUTES =====
import express from "express";
import {
  createOrderFromCart,
  getUserOrders,
  getAllOrders,
  getSingleOrder,
  updateOrderStatus,
  cancelOrder,
  searchOrdersByProductName,
  getOrderAnalytics,
  handleOrderErrors
} from "../controllers/orders.controller.js";

import { isAuthenticated, requireRole } from "../middlewares/isAuthenticated.js";

const router = express.Router();

// All routes need authentication
router.use(isAuthenticated);

// ---------------- ADMIN / SELLER ROUTES ----------------

// Get analytics summary (admin/seller only)
router.get("/analytics/summary", requireRole("admin", "seller"), getOrderAnalytics);

// Get all orders (admin/seller only)
router.get("/", requireRole("admin", "seller"), getAllOrders);

// Update order status (admin/seller only)
router.patch("/:id/status", requireRole("admin", "seller"), updateOrderStatus);

// ---------------- USER ROUTES ----------------

// Get logged-in user’s orders
router.get("/my-orders", getUserOrders);

// Search orders by product name
router.get("/search", searchOrdersByProductName);

// Create order from user’s cart
router.post("/", createOrderFromCart);

// Cancel user’s own order (specific route BEFORE /:id)
router.post("/:id/cancel", cancelOrder);

// ---------------- GENERIC ----------------

// Get single order by ID (with role-based restrictions)
router.get("/:id", getSingleOrder);

// Order-specific error handler
router.use(handleOrderErrors);

export default router;
