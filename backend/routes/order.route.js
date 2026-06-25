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
  downloadInvoice,
  handleOrderErrors
} from "../controllers/orders.controller.js";
import { isAuthenticated, requireRole } from "../middlewares/isAuthenticated.js";

const router = express.Router();

router.use(isAuthenticated);

router.get("/analytics/summary", requireRole("admin", "seller"), getOrderAnalytics);
router.get("/", requireRole("admin", "seller"), getAllOrders);
router.patch("/:id/status", requireRole("admin", "seller"), updateOrderStatus);

router.get("/my-orders", getUserOrders);
router.get("/search", searchOrdersByProductName);
router.post("/create", createOrderFromCart);
router.get("/:id/invoice", downloadInvoice);
router.post("/:id/cancel", cancelOrder);
router.get("/:id", getSingleOrder);

router.use(handleOrderErrors);

export default router;