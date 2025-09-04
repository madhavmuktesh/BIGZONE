import { Order } from "../models/orders.model.js";
import { Product } from "../models/product.model.js";
import { Cart } from "../models/cart.model.js";
import { User } from "../models/user.model.js";
import mongoose from "mongoose";

// --- Helper Functions ---
const validateObjectId = (id, fieldName = "ID") => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error(`Invalid ${fieldName}`);
  }
};

// Async error wrapper
const handleAsyncError = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// --- CREATE ORDER FROM CART ---
export const createOrderFromCart = handleAsyncError(async (req, res) => {
  const userId = req.id;
  const { shippingAddress, paymentMethod = "COD" } = req.body;

  // Validate shipping address
  if (!shippingAddress || !shippingAddress.street || !shippingAddress.city || !shippingAddress.zip) {
    return res.status(400).json({
      success: false,
      message: "Complete shipping address is required"
    });
  }

  // Get user's cart
  const cart = await Cart.findOne({ user: userId }).populate('items.product');
  if (!cart || cart.items.length === 0) {
    return res.status(400).json({
      success: false,
      message: "Cart is empty"
    });
  }

  // Validate stock and prepare order items
  const orderItems = [];
  let subtotal = 0;
  const stockUpdates = [];

  for (const item of cart.items) {
    const product = item.product;
    
    if (!product) {
      return res.status(400).json({
        success: false,
        message: "One or more products in cart no longer exist"
      });
    }

    if (product.stock.quantity < item.quantity) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock for ${product.productname}. Only ${product.stock.quantity} available.`
      });
    }

    const itemSubtotal = item.quantity * item.priceAtAddition;
    subtotal += itemSubtotal;

    orderItems.push({
      product: product._id,
      quantity: item.quantity,
      priceAtPurchase: item.priceAtAddition
    });

    // Prepare stock update
    stockUpdates.push({
      updateOne: {
        filter: { _id: product._id },
        update: { $inc: { 'stock.quantity': -item.quantity } }
      }
    });
  }

  // Calculate costs
  const tax = Math.round(subtotal * 0.18 * 100) / 100; // 18% tax
  const shipping = subtotal > 500 ? 0 : 50; // Free shipping above 500
  const totalCost = subtotal + tax + shipping;

  // Create order
  const newOrder = new Order({
    userId,
    products: orderItems,
    totalCost,
    costBreakdown: {
      subtotal,
      tax,
      shipping,
      discount: 0
    },
    shippingAddress,
    paymentMethod,
    orderStatus: "pending"
  });

  // Use transaction to ensure atomicity
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      // Save order
      await newOrder.save({ session });
      
      // Update product stock
      await Product.bulkWrite(stockUpdates, { session });
      
      // Clear cart
      await Cart.findOneAndUpdate(
        { user: userId },
        { items: [], totalPrice: 0 },
        { session }
      );
    });

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }

  // Populate order for response
  await newOrder.populate([
    { path: 'userId', select: 'fullname email' },
    { path: 'products.product', select: 'productname productprice images' }
  ]);

  res.status(201).json({
    success: true,
    message: "Order created successfully",
    order: newOrder
  });
});

// --- GET USER'S ORDERS ---
export const getUserOrders = handleAsyncError(async (req, res) => {
  const userId = req.id;
  const { page = 1, limit = 10, status } = req.query;

  const filter = { userId };
  if (status) filter.orderStatus = status;

  const pageNumber = Math.max(1, parseInt(page));
  const pageSize = Math.min(50, Math.max(1, parseInt(limit)));
  const skip = (pageNumber - 1) * pageSize;

  const [orders, totalCount] = await Promise.all([
    Order.find(filter)
      .populate("products.product", "productname productprice images")
      .sort({ orderPlacedAt: -1 })
      .skip(skip)
      .limit(pageSize),
    Order.countDocuments(filter)
  ]);

  const totalPages = Math.ceil(totalCount / pageSize);

  res.status(200).json({
    success: true,
    orders,
    pagination: {
      currentPage: pageNumber,
      totalPages,
      totalOrders: totalCount,
      hasNextPage: pageNumber < totalPages,
      hasPrevPage: pageNumber > 1
    }
  });
});

// --- GET ALL ORDERS (Admin/Seller) ---
export const getAllOrders = handleAsyncError(async (req, res) => {
  const { role, id: requesterId } = req;
  const { page = 1, limit = 20, status, userId, search } = req.query;

  // Authorization check
  if (role !== "admin" && role !== "seller") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admin or seller role required."
    });
  }

  // Build filter
  const filter = {};
  if (status) filter.orderStatus = status;
  if (userId) {
    validateObjectId(userId, "user ID");
    filter.userId = userId;
  }

  // If seller, only show orders for their products
  if (role === "seller") {
    const sellerProducts = await Product.find({ createdBy: requesterId }).select('_id');
    const productIds = sellerProducts.map(p => p._id);
    filter['products.product'] = { $in: productIds };
  }

  const pageNumber = Math.max(1, parseInt(page));
  const pageSize = Math.min(100, Math.max(1, parseInt(limit)));
  const skip = (pageNumber - 1) * pageSize;

  let query = Order.find(filter)
    .populate("userId", "fullname email phoneNumber")
    .populate("products.product", "productname productprice images createdBy")
    .sort({ orderPlacedAt: -1 })
    .skip(skip)
    .limit(pageSize);

  // Add search if provided
  if (search) {
    const users = await User.find({
      $or: [
        { fullname: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ]
    }).select('_id');
    
    const userIds = users.map(u => u._id);
    filter.userId = { $in: userIds };
  }

  const [orders, totalCount] = await Promise.all([
    query,
    Order.countDocuments(filter)
  ]);

  const totalPages = Math.ceil(totalCount / pageSize);

  res.status(200).json({
    success: true,
    orders,
    pagination: {
      currentPage: pageNumber,
      totalPages,
      totalOrders: totalCount,
      hasNextPage: pageNumber < totalPages,
      hasPrevPage: pageNumber > 1
    }
  });
});

// --- GET SINGLE ORDER ---
export const getSingleOrder = handleAsyncError(async (req, res) => {
  const { id } = req.params;
  const { role, id: requesterId } = req;

  validateObjectId(id, "order ID");

  const order = await Order.findById(id)
    .populate("userId", "fullname email phoneNumber")
    .populate("products.product", "productname productprice images createdBy");

  if (!order) {
    return res.status(404).json({
      success: false,
      message: "Order not found"
    });
  }

  // Authorization check
  if (role === "user" && order.userId._id.toString() !== requesterId) {
    return res.status(403).json({
      success: false,
      message: "Not authorized to view this order"
    });
  }

  // Seller can only view orders containing their products
  if (role === "seller") {
    const hasSellerProduct = order.products.some(item => 
      item.product.createdBy.toString() === requesterId
    );
    if (!hasSellerProduct) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to view this order"
      });
    }
  }

  res.status(200).json({
    success: true,
    order
  });
});

// --- UPDATE ORDER STATUS ---
export const updateOrderStatus = handleAsyncError(async (req, res) => {
  const { id } = req.params;
  const { status, trackingNumber } = req.body;
  const { role, id: requesterId } = req;

  validateObjectId(id, "order ID");

  // Validate status
  const validStatuses = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Invalid status. Valid statuses: ${validStatuses.join(", ")}`
    });
  }

  const order = await Order.findById(id)
    .populate("products.product", "createdBy");

  if (!order) {
    return res.status(404).json({
      success: false,
      message: "Order not found"
    });
  }

  // Authorization checks
  if (role === "user") {
    return res.status(403).json({
      success: false,
      message: "Users cannot update order status"
    });
  }

  if (role === "seller") {
    const hasSellerProduct = order.products.some(item => 
      item.product.createdBy.toString() === requesterId
    );
    if (!hasSellerProduct) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to update this order"
      });
    }
  }

  // Update order
  order.orderStatus = status;
  if (trackingNumber) order.trackingNumber = trackingNumber;
  
  // Add status history
  if (!order.statusHistory) order.statusHistory = [];
  order.statusHistory.push({
    status,
    updatedAt: new Date(),
    updatedBy: requesterId
  });

  await order.save();

  res.status(200).json({
    success: true,
    message: "Order status updated successfully",
    order
  });
});

// --- CANCEL ORDER ---
export const cancelOrder = handleAsyncError(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const { role, id: requesterId } = req;

  validateObjectId(id, "order ID");

  const order = await Order.findById(id)
    .populate("products.product");

  if (!order) {
    return res.status(404).json({
      success: false,
      message: "Order not found"
    });
  }

  // Authorization check
  if (role === "user" && order.userId.toString() !== requesterId) {
    return res.status(403).json({
      success: false,
      message: "Not authorized to cancel this order"
    });
  }

  // Check if order can be cancelled
  if (["shipped", "delivered", "cancelled"].includes(order.orderStatus)) {
    return res.status(400).json({
      success: false,
      message: `Cannot cancel order with status: ${order.orderStatus}`
    });
  }

  // Restore stock quantities
  const stockUpdates = order.products.map(item => ({
    updateOne: {
      filter: { _id: item.product._id },
      update: { $inc: { 'stock.quantity': item.quantity } }
    }
  }));

  // Update order and restore stock
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      order.orderStatus = "cancelled";
      order.cancellationReason = reason;
      order.cancelledAt = new Date();
      order.cancelledBy = requesterId;
      await order.save({ session });

      if (stockUpdates.length > 0) {
        await Product.bulkWrite(stockUpdates, { session });
      }
    });

    await session.commitTransaction();
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    await session.endSession();
  }

  res.status(200).json({
    success: true,
    message: "Order cancelled successfully",
    order
  });
});

// --- SEARCH ORDERS ---
export const searchOrdersByProductName = handleAsyncError(async (req, res) => {
  const { name, page = 1, limit = 20 } = req.query;
  const { role, id: requesterId } = req;

  if (!name || name.trim().length < 2) {
    return res.status(400).json({
      success: false,
      message: "Search term must be at least 2 characters long"
    });
  }

  // Find matching products
  let productFilter = {
    productname: { $regex: name.trim(), $options: "i" }
  };

  // If seller, only search their products
  if (role === "seller") {
    productFilter.createdBy = requesterId;
  }

  const matchingProducts = await Product.find(productFilter).select('_id');
  const productIds = matchingProducts.map(p => p._id);

  if (productIds.length === 0) {
    return res.status(200).json({
      success: true,
      orders: [],
      pagination: {
        currentPage: 1,
        totalPages: 0,
        totalOrders: 0,
        hasNextPage: false,
        hasPrevPage: false
      }
    });
  }

  // Build order filter
  let orderFilter = { "products.product": { $in: productIds } };

  // If user, only show their orders
  if (role === "user") {
    orderFilter.userId = requesterId;
  }

  const pageNumber = Math.max(1, parseInt(page));
  const pageSize = Math.min(50, Math.max(1, parseInt(limit)));
  const skip = (pageNumber - 1) * pageSize;

  const [orders, totalCount] = await Promise.all([
    Order.find(orderFilter)
      .populate("userId", "fullname email")
      .populate("products.product", "productname productprice images")
      .sort({ orderPlacedAt: -1 })
      .skip(skip)
      .limit(pageSize),
    Order.countDocuments(orderFilter)
  ]);

  const totalPages = Math.ceil(totalCount / pageSize);

  res.status(200).json({
    success: true,
    orders,
    searchTerm: name,
    pagination: {
      currentPage: pageNumber,
      totalPages,
      totalOrders: totalCount,
      hasNextPage: pageNumber < totalPages,
      hasPrevPage: pageNumber > 1
    }
  });
});

// --- GET ORDER ANALYTICS (Admin/Seller) ---
export const getOrderAnalytics = handleAsyncError(async (req, res) => {
  const { role, id: requesterId } = req;
  const { period = "30d" } = req.query;

  if (role === "user") {
    return res.status(403).json({
      success: false,
      message: "Access denied"
    });
  }

  // Calculate date range
  const now = new Date();
  let startDate;
  
  switch (period) {
    case "7d":
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "30d":
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case "90d":
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  // Build match filter
  let matchFilter = {
    orderPlacedAt: { $gte: startDate }
  };

  // If seller, filter by their products
  if (role === "seller") {
    const sellerProducts = await Product.find({ createdBy: requesterId }).select('_id');
    const productIds = sellerProducts.map(p => p._id);
    matchFilter['products.product'] = { $in: productIds };
  }

  const analytics = await Order.aggregate([
    { $match: matchFilter },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: "$totalCost" },
        averageOrderValue: { $avg: "$totalCost" },
        statusBreakdown: {
          $push: "$orderStatus"
        }
      }
    },
    {
      $project: {
        _id: 0,
        totalOrders: 1,
        totalRevenue: { $round: ["$totalRevenue", 2] },
        averageOrderValue: { $round: ["$averageOrderValue", 2] },
        statusBreakdown: 1
      }
    }
  ]);

  // Calculate status breakdown
  let statusBreakdown = {};
  if (analytics.length > 0 && analytics[0].statusBreakdown) {
    analytics[0].statusBreakdown.forEach(status => {
      statusBreakdown[status] = (statusBreakdown[status] || 0) + 1;
    });
    analytics[0].statusBreakdown = statusBreakdown;
  }

  res.status(200).json({
    success: true,
    analytics: analytics.length > 0 ? analytics[0] : {
      totalOrders: 0,
      totalRevenue: 0,
      averageOrderValue: 0,
      statusBreakdown: {}
    },
    period
  });
});

// --- ERROR HANDLER ---
export const handleOrderErrors = (error, req, res, next) => {
  console.error("Order Controller Error:", error);
  
  if (error.name === "ValidationError") {
    const messages = Object.values(error.errors).map(err => err.message);
    return res.status(400).json({
      success: false,
      message: "Validation Error",
      errors: messages
    });
  }
  
  if (error.name === "CastError") {
    return res.status(400).json({
      success: false,
      message: "Invalid ID format"
    });
  }
  
  res.status(500).json({
    success: false,
    message: "Internal server error"
  });
};