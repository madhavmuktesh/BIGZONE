import express from "express";
import {
  addToCart,
  getCart,
  removeFromCart,
  clearCart,
  updateItemQuantity,
  handleCartErrors,
} from "../controllers/cart.controller.js";
import { isAuthenticated } from "../middlewares/isAuthenticated.js";
import {
  validateCartInput,
  validateUpdateQuantity,
} from "../middlewares/validation.js";

const router = express.Router();

/* ======================
   AUTHENTICATED ROUTES
====================== */
router.use(isAuthenticated);

/* ======================
   CART OPERATIONS
====================== */
router.get("/", getCart);
router.post("/items", validateCartInput, addToCart);
router.put("/items/:productId", validateUpdateQuantity, updateItemQuantity);
router.delete("/items/:productId", removeFromCart);
router.delete("/", clearCart);

/* ======================
   ERROR HANDLER
====================== */
router.use(handleCartErrors);

export default router;