import { Cart } from "../models/cart.model.js";
import { Product } from "../models/product.model.js";

// Helper to get an existing cart or create a new one
const getOrCreateCart = async (userId) => {
  let cart = await Cart.findOne({ user: userId });
  if (!cart) {
    cart = new Cart({ user: userId, items: [] });
  }
  return cart;
};

// --- ADD ITEM TO CART (with Price Snapshot) ---
export const addToCart = async (req, res, next) => {
  try {
    const userId = req.id;
    const { productId, quantity } = req.body;

    console.log('Add to cart request:', { userId, productId, quantity }); // Debug log

    if (!userId) {
      return res.status(401).json({ success: false, message: "User not authenticated." });
    }

    if (!productId || !quantity || quantity <= 0) {
      return res.status(400).json({ success: false, message: "Product ID and a valid quantity are required." });
    }

    const [product, cart] = await Promise.all([
        Product.findById(productId),
        getOrCreateCart(userId)
    ]);

    if (!product) {
        return res.status(404).json({ success: false, message: "Product not found." });
    }
    
    const existingItem = cart.items.find(item => item.product.equals(productId));
    const existingQuantity = existingItem ? existingItem.quantity : 0;

    // Handle both stock.quantity (nested) and stock (direct) structures
    const availableStock = product.stock?.quantity !== undefined ? product.stock.quantity : product.stock;
    
    if (availableStock < existingQuantity + quantity) {
        return res.status(400).json({ 
          success: false, 
          message: `Not enough stock. Only ${availableStock} available.` 
        });
    }

    if (existingItem) {
        existingItem.quantity += quantity;
        // Update price snapshot in case it changed since last addition
        existingItem.priceAtAddition = product.productprice; 
    } else {
        // --- REAL E-COMMERCE ADDITION ---
        // Save the current price along with the item
        cart.items.push({ 
            product: productId, 
            quantity, 
            priceAtAddition: product.productprice 
        });
    }

    await cart.save();
    res.status(200).json({ success: true, message: "Product added to cart." });

  } catch (error) {
    console.error('Add to cart error:', error); // Debug log
    next(error);
  }
};

// --- GET USER CART (with Real-time Validation) ---
export const getCart = async (req, res, next) => {
  try {
    const userId = req.id;
    
    console.log('Get cart request for user:', userId); // Debug log

    if (!userId) {
      return res.status(401).json({ success: false, message: "User not authenticated." });
    }

    const cart = await Cart.findOne({ user: userId }).lean();

    if (!cart || cart.items.length === 0) {
      return res.status(200).json({ 
        success: true, 
        cart: { 
          user: userId, 
          items: [], 
          totalPrice: 0, 
          validationIssues: 0 
        } 
      });
    }

    const productIds = cart.items.map(item => item.product);
    const products = await Product.find({ '_id': { $in: productIds } }).lean();
    const productMap = new Map(products.map(p => [p._id.toString(), p]));

    let validationIssues = 0;
    let totalPrice = 0;

    // --- REAL-TIME VALIDATION LOGIC ---
    const validatedItems = cart.items.map(item => {
        const product = productMap.get(item.product.toString());
        let validationStatus = "OK";
        
        // Calculate price for this item (use current price if validation passes)
        let itemPrice = item.priceAtAddition;
        let itemTotal = 0;
        
        if (!product) {
            validationStatus = "PRODUCT_REMOVED";
            validationIssues++;
        } else {
            // Handle both stock structures
            const currentStock = product.stock?.quantity !== undefined ? product.stock.quantity : product.stock;
            
            if (currentStock === 0) {
                validationStatus = "OUT_OF_STOCK";
                validationIssues++;
            } else if (currentStock < item.quantity) {
                validationStatus = "INSUFFICIENT_STOCK";
                validationIssues++;
            } else if (product.productprice !== item.priceAtAddition) {
                validationStatus = "PRICE_CHANGED";
                // Use current price for calculation
                itemPrice = product.productprice;
            }
            
            // Calculate item total (only if product exists and isn't completely out of stock)
            if (validationStatus !== "PRODUCT_REMOVED" && validationStatus !== "OUT_OF_STOCK") {
                itemTotal = itemPrice * item.quantity;
                totalPrice += itemTotal;
            }
        }

        return {
            ...item,
            productDetails: product ? { // Embed current product details
                productname: product.productname,
                images: product.images,
                currentPrice: product.productprice,
                currentStock: product.stock?.quantity !== undefined ? product.stock.quantity : product.stock,
            } : null,
            validationStatus, // Add the status to the item
            itemTotal // Add individual item total
        };
    });

    const validatedCart = {
        ...cart,
        items: validatedItems,
        totalPrice, // *** CRITICAL: Add total price calculation ***
        validationIssues // Total count of critical issues
    };
    
    console.log('Returning cart:', { itemCount: validatedItems.length, totalPrice }); // Debug log
    
    res.status(200).json({ success: true, cart: validatedCart });
  } catch (error) {
    console.error('Get cart error:', error); // Debug log
    next(error);
  }
};

// --- UPDATE ITEM QUANTITY ---
export const updateItemQuantity = async (req, res, next) => {
    try {
        const userId = req.id;
        const { productId } = req.params;
        const { quantity } = req.body;

        if (!userId) {
          return res.status(401).json({ success: false, message: "User not authenticated." });
        }

        if (!quantity || quantity <= 0) {
            return res.status(400).json({ success: false, message: "A valid quantity is required." });
        }

        const [product, cart] = await Promise.all([
            Product.findById(productId),
            getOrCreateCart(userId)
        ]);
        
        if (!product) return res.status(404).json({ success: false, message: "Product not found." });
        
        // Handle both stock structures
        const availableStock = product.stock?.quantity !== undefined ? product.stock.quantity : product.stock;
        
        if (availableStock < quantity) {
          return res.status(400).json({ 
            success: false, 
            message: `Not enough stock. Only ${availableStock} available.` 
          });
        }

        const itemToUpdate = cart.items.find(item => item.product.equals(productId));
        if (!itemToUpdate) return res.status(404).json({ success: false, message: "Item not found in cart." });

        itemToUpdate.quantity = quantity;
        itemToUpdate.priceAtAddition = product.productprice; // Also update price snapshot on quantity change
        await cart.save();

        res.status(200).json({ success: true, message: "Cart quantity updated." });
    } catch (error) {
        next(error);
    }
};

// --- REMOVE AN ITEM FROM THE CART ---
export const removeFromCart = async (req, res, next) => {
  try {
    const userId = req.id;
    const { productId } = req.params;

    if (!userId) {
      return res.status(401).json({ success: false, message: "User not authenticated." });
    }

    const cart = await getOrCreateCart(userId);
    const initialItemCount = cart.items.length;
    cart.items = cart.items.filter(item => !item.product.equals(productId));

    if (cart.items.length === initialItemCount) {
        return res.status(404).json({ success: false, message: "Item not found in cart." });
    }
    
    await cart.save();
    res.status(200).json({ success: true, message: "Item removed from cart." });
  } catch (error) {
    next(error);
  }
};

// --- CLEAR THE ENTIRE CART ---
export const clearCart = async (req, res, next) => {
  try {
    const userId = req.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: "User not authenticated." });
    }

    const cart = await getOrCreateCart(userId);
    
    cart.items = [];
    await cart.save();

    res.status(200).json({ success: true, message: "Cart cleared." });
  } catch (error) {
    next(error);
  }
};

// Simple error handler for cart operations
export const handleCartErrors = (error, req, res, next) => {
  console.error("Cart Controller Error:", error);
  if (error.name === "ValidationError" || error.name === "CastError") {
    return res.status(400).json({ success: false, message: "Invalid data provided." });
  }
  res.status(500).json({ success: false, message: "Internal server error" });
};