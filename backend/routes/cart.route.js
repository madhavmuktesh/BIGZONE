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
    validateUpdateQuantity, // <-- 1. Import the new validator
} from "../middlewares/validation.js";

const router = express.Router();

// Apply authentication to all cart routes
router.use(isAuthenticated);

// ---------------- CART OPERATIONS ----------------

// Get full cart
router.get("/", getCart);

// Add new item
router.post("/items", validateCartInput, addToCart);

// Update item quantity
// v-- 2. Use the new, specific validator here
router.put("/items/:productId", validateUpdateQuantity, updateItemQuantity);

// Remove single item
router.delete("/items/:productId", removeFromCart);

// Clear entire cart
router.delete("/", clearCart);

// ---------------- ERROR HANDLER ----------------
router.use(handleCartErrors);

export default router;
