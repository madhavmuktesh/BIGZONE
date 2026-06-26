import express from "express";
import {
  createOrderFromCart,
  getUserOrders,
  getAllOrders,
  getSingleOrder,
  cancelOrder,
  searchOrdersByProductName,
  getOrderAnalytics,
  downloadInvoice,
  handleOrderErrors,
  getSellerDashboardData,
  getMyProducts,
  getSellerOrders,
  updateOrderStatus,
} from "../controllers/orders.controller.js";
import { isAuthenticated, requireRole } from "../middlewares/isAuthenticated.js";

const router = express.Router();

router.use(isAuthenticated);

/**
 * Specific routes first
 */
router.get("/dashboard/seller", getSellerDashboardData);
router.get("/my-products", getMyProducts);
router.get("/seller-orders", getSellerOrders);
router.get("/analytics/summary", requireRole("admin"), getOrderAnalytics);
router.get("/my-orders", getUserOrders);
router.get("/search", searchOrdersByProductName);
router.post("/create", createOrderFromCart);

/**
 * Broader list endpoints
 */
router.get("/", getAllOrders);

/**
 * Order actions
 */
router.get("/:id/invoice", downloadInvoice);
router.post("/:id/cancel", cancelOrder);
router.patch("/:id/status", updateOrderStatus);
router.get("/:id", getSingleOrder);

router.use(handleOrderErrors);

export default router;