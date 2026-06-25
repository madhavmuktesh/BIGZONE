import { Order } from "../models/orders.model.js";
import { Product } from "../models/product.model.js";
import { Cart } from "../models/cart.model.js";
import { User } from "../models/user.model.js";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";

const validateObjectId = (id, fieldName = "ID") => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error(`Invalid ${fieldName}`);
  }
};

const handleAsyncError = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

const ensureInvoiceDir = () => {
  const dir = path.join(process.cwd(), "output", "invoices");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  return dir;
};

const generateInvoicePdf = (order) => {
  const dir = ensureInvoiceDir();
  const invoiceNumber = `INV-${order._id.toString().slice(-8).toUpperCase()}`;
  const filePath = path.join(dir, `${invoiceNumber}.pdf`);

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    doc.fontSize(20).text("INVOICE", { align: "center" });
    doc.moveDown();
    doc.fontSize(12).text(`Invoice No: ${invoiceNumber}`);
    doc.text(`Order ID: ${order._id}`);
    doc.text(`Date: ${new Date().toLocaleString()}`);
    doc.text(`Customer: ${order.shippingAddress.fullName}`);
    doc.text(`Mobile: ${order.shippingAddress.mobile}`);
    doc.moveDown();

    doc.text("Shipping Address:");
    doc.text(`${order.shippingAddress.house}, ${order.shippingAddress.area}`);
    doc.text(`${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}`);
    doc.text(`${order.shippingAddress.country}`);
    doc.moveDown();

    doc.text(`Payment Method: ${order.paymentMethod}`);
    doc.text(`Order Status: ${order.orderStatus}`);
    doc.moveDown();

    doc.fontSize(14).text("Items:");
    doc.fontSize(11);
    order.products.forEach((item, idx) => {
      doc.text(
        `${idx + 1}. ${item.product.productname || "Product"} | Qty: ${item.quantity} | Price: ₹${item.priceAtPurchase} | Total: ₹${(item.quantity * item.priceAtPurchase).toFixed(2)}`
      );
    });

    doc.moveDown();
    doc.fontSize(12).text(`Subtotal: ₹${order.costBreakdown.subtotal.toFixed(2)}`);
    doc.text(`Tax: ₹${order.costBreakdown.tax.toFixed(2)}`);
    doc.text(`Shipping: ₹${order.costBreakdown.shipping.toFixed(2)}`);
    doc.text(`Discount: ₹${order.costBreakdown.discount.toFixed(2)}`);
    doc.fontSize(14).text(`Grand Total: ₹${order.totalCost.toFixed(2)}`);

    doc.end();

    stream.on("finish", () => resolve({ invoiceNumber, filePath }));
    stream.on("error", reject);
  });
};

export const createOrderFromCart = handleAsyncError(async (req, res) => {
  const userId = req.id;
  const { shippingAddress, paymentMethod = "COD" } = req.body;

  if (paymentMethod !== "COD") {
    return res.status(400).json({
      success: false,
      message: "Only COD is supported"
    });
  }

  if (
    !shippingAddress ||
    !shippingAddress.fullName ||
    !shippingAddress.mobile ||
    !shippingAddress.house ||
    !shippingAddress.area ||
    !shippingAddress.city ||
    !shippingAddress.state ||
    !shippingAddress.pincode
  ) {
    return res.status(400).json({
      success: false,
      message: "Complete shipping address is required"
    });
  }

  const session = await mongoose.startSession();
  let createdOrder = null;

  try {
    await session.withTransaction(async () => {
      const cart = await Cart.findOne({ user: userId }).populate("items.product").session(session);

      if (!cart || cart.items.length === 0) {
        throw new Error("Cart is empty");
      }

      const orderItems = [];
      let subtotal = 0;
      const stockUpdates = [];

      for (const item of cart.items) {
        const product = item.product;

        if (!product) {
          throw new Error("One or more products in cart no longer exist");
        }

        const currentStock = product.stock?.quantity !== undefined ? product.stock.quantity : product.stock;

        if (currentStock < item.quantity) {
          throw new Error(`Insufficient stock for ${product.productname}. Only ${currentStock} available.`);
        }

        const price = item.priceAtAddition ?? product.productprice;
        subtotal += item.quantity * price;

        orderItems.push({
          product: product._id,
          quantity: item.quantity,
          priceAtPurchase: price
        });

        stockUpdates.push({
          updateOne: {
            filter: { _id: product._id },
            update: { $inc: { "stock.quantity": -item.quantity } }
          }
        });
      }

      const tax = Math.round(subtotal * 0.18 * 100) / 100;
      const shipping = subtotal > 500 ? 0 : 50;
      const discount = 0;
      const totalCost = subtotal + tax + shipping - discount;

      const orderDocs = await Order.create([{
        userId,
        products: orderItems,
        totalCost,
        costBreakdown: {
          subtotal,
          tax,
          shipping,
          discount
        },
        shippingAddress,
        paymentMethod: "COD",
        paymentStatus: "pending",
        orderStatus: "pending"
      }], { session });

      createdOrder = orderDocs[0];

      await Product.bulkWrite(stockUpdates, { session });

      await Cart.findOneAndUpdate(
        { user: userId },
        { items: [], totalPrice: 0 },
        { session }
      );
    });

    await session.endSession();

    await createdOrder.populate([
      { path: "userId", select: "fullname email phoneNumber" },
      { path: "products.product", select: "productname productprice images createdBy" }
    ]);

    const invoice = await generateInvoicePdf(createdOrder);
    createdOrder.invoiceNumber = invoice.invoiceNumber;
    createdOrder.invoicePath = invoice.filePath;
    createdOrder.invoiceGeneratedAt = new Date();
    await createdOrder.save();

    await createdOrder.populate([
      { path: "userId", select: "fullname email phoneNumber" },
      { path: "products.product", select: "productname productprice images createdBy" }
    ]);

    res.status(201).json({
      success: true,
      message: "Order created successfully",
      order: createdOrder
    });
  } catch (error) {
    await session.endSession();
    throw error;
  }
});

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

export const getAllOrders = handleAsyncError(async (req, res) => {
  const { role, id: requesterId } = req;
  const { page = 1, limit = 20, status, userId, search } = req.query;

  if (role !== "admin" && role !== "seller") {
    return res.status(403).json({
      success: false,
      message: "Access denied. Admin or seller role required."
    });
  }

  const filter = {};
  if (status) filter.orderStatus = status;
  if (userId) {
    validateObjectId(userId, "user ID");
    filter.userId = userId;
  }

  if (search) {
    const users = await User.find({
      $or: [
        { fullname: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } }
      ]
    }).select("_id");
    filter.userId = { $in: users.map(u => u._id) };
  }

  if (role === "seller") {
    const sellerProducts = await Product.find({ createdBy: requesterId }).select("_id");
    filter["products.product"] = { $in: sellerProducts.map(p => p._id) };
  }

  const pageNumber = Math.max(1, parseInt(page));
  const pageSize = Math.min(100, Math.max(1, parseInt(limit)));
  const skip = (pageNumber - 1) * pageSize;

  const [orders, totalCount] = await Promise.all([
    Order.find(filter)
      .populate("userId", "fullname email phoneNumber")
      .populate("products.product", "productname productprice images createdBy")
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

  if (role === "user" && order.userId._id.toString() !== requesterId) {
    return res.status(403).json({
      success: false,
      message: "Not authorized to view this order"
    });
  }

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

export const updateOrderStatus = handleAsyncError(async (req, res) => {
  const { id } = req.params;
  const { status, trackingNumber } = req.body;
  const { role, id: requesterId } = req;

  validateObjectId(id, "order ID");

  const validStatuses = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Invalid status. Valid statuses: ${validStatuses.join(", ")}`
    });
  }

  const order = await Order.findById(id).populate("products.product", "createdBy");
  if (!order) {
    return res.status(404).json({
      success: false,
      message: "Order not found"
    });
  }

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

  order.orderStatus = status;
  if (trackingNumber) order.trackingNumber = trackingNumber;

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

export const cancelOrder = handleAsyncError(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const { role, id: requesterId } = req;

  validateObjectId(id, "order ID");

  const order = await Order.findById(id).populate("products.product");

  if (!order) {
    return res.status(404).json({
      success: false,
      message: "Order not found"
    });
  }

  if (role === "user" && order.userId.toString() !== requesterId) {
    return res.status(403).json({
      success: false,
      message: "Not authorized to cancel this order"
    });
  }

  if (["shipped", "delivered", "cancelled"].includes(order.orderStatus)) {
    return res.status(400).json({
      success: false,
      message: `Cannot cancel order with status: ${order.orderStatus}`
    });
  }

  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      order.orderStatus = "cancelled";
      order.cancellationReason = reason;
      order.cancelledAt = new Date();
      order.cancelledBy = requesterId;
      await order.save({ session });

      const stockUpdates = order.products.map(item => ({
        updateOne: {
          filter: { _id: item.product._id },
          update: { $inc: { "stock.quantity": item.quantity } }
        }
      }));

      if (stockUpdates.length > 0) {
        await Product.bulkWrite(stockUpdates, { session });
      }
    });

    await session.endSession();

    res.status(200).json({
      success: true,
      message: "Order cancelled successfully",
      order
    });
  } catch (error) {
    await session.endSession();
    throw error;
  }
});

export const searchOrdersByProductName = handleAsyncError(async (req, res) => {
  const { name, page = 1, limit = 20 } = req.query;
  const { role, id: requesterId } = req;

  if (!name || name.trim().length < 2) {
    return res.status(400).json({
      success: false,
      message: "Search term must be at least 2 characters long"
    });
  }

  let productFilter = {
    productname: { $regex: name.trim(), $options: "i" }
  };

  if (role === "seller") {
    productFilter.createdBy = requesterId;
  }

  const matchingProducts = await Product.find(productFilter).select("_id");
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

  const orderFilter = { "products.product": { $in: productIds } };
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

export const getOrderAnalytics = handleAsyncError(async (req, res) => {
  const { role, id: requesterId } = req;
  const { period = "30d" } = req.query;

  if (role === "user") {
    return res.status(403).json({
      success: false,
      message: "Access denied"
    });
  }

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

  let matchFilter = {
    orderPlacedAt: { $gte: startDate }
  };

  if (role === "seller") {
    const sellerProducts = await Product.find({ createdBy: requesterId }).select("_id");
    matchFilter["products.product"] = { $in: sellerProducts.map(p => p._id) };
  }

  const analytics = await Order.aggregate([
    { $match: matchFilter },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: "$totalCost" },
        averageOrderValue: { $avg: "$totalCost" },
        statusBreakdown: { $push: "$orderStatus" }
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

export const downloadInvoice = handleAsyncError(async (req, res) => {
  const { id } = req.params;
  const { role, id: requesterId } = req;

  validateObjectId(id, "order ID");

  const order = await Order.findById(id);

  if (!order) {
    return res.status(404).json({ success: false, message: "Order not found" });
  }

  if (role === "user" && order.userId.toString() !== requesterId) {
    return res.status(403).json({ success: false, message: "Not authorized" });
  }

  if (!order.invoicePath || !fs.existsSync(order.invoicePath)) {
    return res.status(404).json({ success: false, message: "Invoice not found" });
  }

  res.download(order.invoicePath);
});

export const handleOrderErrors = (error, req, res, next) => {
  console.error("Order Controller Error:", error);

  if (error.message === "Cart is empty") {
    return res.status(400).json({ success: false, message: error.message });
  }

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