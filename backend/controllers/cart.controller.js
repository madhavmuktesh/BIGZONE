import mongoose from "mongoose";
import { Cart } from "../models/cart.model.js";
import { Product } from "../models/product.model.js";

const validateObjectId = (id, fieldName = "ID") => {
  if (
    !mongoose.Types.ObjectId.isValid(id) ||
    new mongoose.Types.ObjectId(id).toString() !== id
  ) {
    throw new Error(`Invalid ${fieldName}`);
  }
};

const handleAsyncError = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

const getStockQty = (product) => {
  return product?.stock?.quantity !== undefined
    ? product.stock.quantity
    : product?.stock || 0;
};

const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) {
    cart = new Cart({ user: userId, items: [] });
  }
  return cart;
};

export const addToCart = handleAsyncError(async (req, res) => {
  const userId = req.id;
  const { productId, quantity } = req.body;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: "User not authenticated.",
    });
  }

  validateObjectId(productId, "product ID");

  const qty = Number(quantity);
  if (!Number.isInteger(qty) || qty <= 0) {
    return res.status(400).json({
      success: false,
      message: "Product ID and a valid quantity are required.",
    });
  }

  const [product, cart] = await Promise.all([
    Product.findById(productId),
    getOrCreateCart(userId),
  ]);

  if (!product) {
    return res.status(404).json({
      success: false,
      message: "Product not found.",
    });
  }

  const existingItem = cart.items.find((item) => item.product.equals(productId));
  const existingQuantity = existingItem ? existingItem.quantity : 0;
  const availableStock = getStockQty(product);

  if (availableStock < existingQuantity + qty) {
    return res.status(400).json({
      success: false,
      message: `Not enough stock. Only ${availableStock} available.`,
    });
  }

  if (existingItem) {
    existingItem.quantity += qty;
    existingItem.priceAtAddition = product.productprice;
  } else {
    cart.items.push({
      product: productId,
      quantity: qty,
      priceAtAddition: product.productprice,
    });
  }

  await cart.save();

  return res.status(200).json({
    success: true,
    message: "Product added to cart.",
    cart,
  });
});

export const getCart = handleAsyncError(async (req, res) => {
  const userId = req.id;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: "User not authenticated.",
    });
  }

  const cart = await Cart.findOne({ user: userId }).lean();

  if (!cart || cart.items.length === 0) {
    return res.status(200).json({
      success: true,
      cart: {
        user: userId,
        items: [],
        totalPrice: 0,
        validationIssues: 0,
      },
    });
  }

  const productIds = cart.items.map((item) => item.product);
  const products = await Product.find({ _id: { $in: productIds } }).lean();
  const productMap = new Map(products.map((p) => [p._id.toString(), p]));

  let validationIssues = 0;
  let totalPrice = 0;

  const validatedItems = cart.items.map((item) => {
    const product = productMap.get(item.product.toString());
    let validationStatus = "OK";
    let itemPrice = item.priceAtAddition;
    let itemTotal = 0;

    if (!product) {
      validationStatus = "PRODUCT_REMOVED";
      validationIssues++;
    } else {
      const currentStock = getStockQty(product);

      if (currentStock === 0) {
        validationStatus = "OUT_OF_STOCK";
        validationIssues++;
      } else if (currentStock < item.quantity) {
        validationStatus = "INSUFFICIENT_STOCK";
        validationIssues++;
      } else if (product.productprice !== item.priceAtAddition) {
        validationStatus = "PRICE_CHANGED";
        itemPrice = product.productprice;
      }

      if (
        validationStatus !== "PRODUCT_REMOVED" &&
        validationStatus !== "OUT_OF_STOCK"
      ) {
        itemTotal = itemPrice * item.quantity;
        totalPrice += itemTotal;
      }
    }

    return {
      ...item,
      productDetails: product
        ? {
            productname: product.productname,
            images: product.images,
            currentPrice: product.productprice,
            currentStock: getStockQty(product),
          }
        : null,
      validationStatus,
      itemTotal,
    };
  });

  return res.status(200).json({
    success: true,
    cart: {
      ...cart,
      items: validatedItems,
      totalPrice,
      validationIssues,
    },
  });
});

export const updateItemQuantity = handleAsyncError(async (req, res) => {
  const userId = req.id;
  const { productId } = req.params;
  const { quantity } = req.body;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: "User not authenticated.",
    });
  }

  validateObjectId(productId, "product ID");

  const qty = Number(quantity);
  if (!Number.isInteger(qty) || qty <= 0) {
    return res.status(400).json({
      success: false,
      message: "A valid quantity is required.",
    });
  }

  const [product, cart] = await Promise.all([
    Product.findById(productId),
    getOrCreateCart(userId),
  ]);

  if (!product) {
    return res.status(404).json({
      success: false,
      message: "Product not found.",
    });
  }

  const itemToUpdate = cart.items.find((item) => item.product.equals(productId));
  if (!itemToUpdate) {
    return res.status(404).json({
      success: false,
      message: "Item not found in cart.",
    });
  }

  const availableStock = getStockQty(product);
  if (availableStock < qty) {
    return res.status(400).json({
      success: false,
      message: `Not enough stock. Only ${availableStock} available.`,
    });
  }

  itemToUpdate.quantity = qty;
  itemToUpdate.priceAtAddition = product.productprice;

  await cart.save();

  return res.status(200).json({
    success: true,
    message: "Cart quantity updated.",
    cart,
  });
});

export const removeFromCart = handleAsyncError(async (req, res) => {
  const userId = req.id;
  const { productId } = req.params;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: "User not authenticated.",
    });
  }

  validateObjectId(productId, "product ID");

  const cart = await getOrCreateCart(userId);
  const initialItemCount = cart.items.length;

  cart.items = cart.items.filter((item) => !item.product.equals(productId));

  if (cart.items.length === initialItemCount) {
    return res.status(404).json({
      success: false,
      message: "Item not found in cart.",
    });
  }

  await cart.save();

  return res.status(200).json({
    success: true,
    message: "Item removed from cart.",
    cart,
  });
});

export const clearCart = handleAsyncError(async (req, res) => {
  const userId = req.id;

  if (!userId) {
    return res.status(401).json({
      success: false,
      message: "User not authenticated.",
    });
  }

  const cart = await getOrCreateCart(userId);
  cart.items = [];
  await cart.save();

  return res.status(200).json({
    success: true,
    message: "Cart cleared.",
    cart,
  });
});

export const handleCartErrors = (error, req, res, next) => {
  console.error("Cart Controller Error:", error);

  if (error.message?.startsWith("Invalid")) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  if (error.name === "ValidationError" || error.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: "Invalid data provided.",
    });
  }

  return res.status(500).json({
    success: false,
    message: "Internal server error",
  });
};