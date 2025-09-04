import mongoose from "mongoose";
import { Product } from "./product.model.js"; // Ensure this path is correct

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1,
  },
  // --- REAL E-COMMERCE ADDITION: Price Snapshot ---
  // Stores the price of the product at the time it was added to the cart.
  priceAtAddition: {
    type: Number,
    required: true,
  },
}, { _id: false });

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  items: [cartItemSchema],
  totalPrice: {
    type: Number,
    required: true,
    default: 0,
  },
}, { timestamps: true });

// --- Mongoose Middleware to Calculate Total Price ---
// This hook now uses the saved 'priceAtAddition' for a consistent total.
cartSchema.pre("save", function (next) {
  try {
    const total = this.items.reduce((acc, item) => {
      // Calculation is now based on the price when the item was added
      return acc + (item.quantity * item.priceAtAddition);
    }, 0);

    this.totalPrice = total;
    next();
  } catch (error) {
    next(error);
  }
});

export const Cart = mongoose.model("Cart", cartSchema);

