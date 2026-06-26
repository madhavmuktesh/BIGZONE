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
    doc.text(`${order.shippingAddress.country || "India"}`);
    doc.moveDown();

    doc.text(`Payment Method: ${order.paymentMethod}`);
    doc.text(`Payment Status: ${order.paymentStatus}`);
    doc.text(`Order Status: ${order.orderStatus}`);
    doc.moveDown();

    doc.fontSize(14).text("Items:");
    doc.fontSize(11);
    order.products.forEach((item, idx) => {
      doc.text(
        `${idx + 1}. ${item.product?.productname || "Product"} | Qty: ${item.quantity} | Price: ₹${item.priceAtPurchase} | Total: ₹${(item.quantity * item.priceAtPurchase).toFixed(2)}`
      );
    });

    doc.moveDown();
    doc.fontSize(12).text(`Subtotal: ₹${(order.costBreakdown?.subtotal || 0).toFixed(2)}`);
    doc.text(`Tax: ₹${(order.costBreakdown?.tax || 0).toFixed(2)}`);
    doc.text(`Shipping: ₹${(order.costBreakdown?.shipping || 0).toFixed(2)}`);
    doc.text(`Discount: ₹${(order.costBreakdown?.discount || 0).toFixed(2)}`);
    doc.fontSize(14).text(`Grand Total: ₹${(order.totalCost || 0).toFixed(2)}`);

    doc.end();

    stream.on("finish", () => resolve({ invoiceNumber, filePath }));
    stream.on("error", reject);
  });
};

const isSellerOwnOrder = (order, requesterId) => {
  return (order.products || []).some(
    (item) => item?.product?.createdBy?.toString?.() === requesterId.toString()
  );
};

const getPagination = (page, limit, maxLimit = 50) => {
  const pageNumber = Math.max(1, parseInt(page) || 1);
  const pageSize = Math.min(maxLimit, Math.max(1, parseInt(limit) || 10));
  const skip = (pageNumber - 1) * pageSize;
  return { pageNumber, pageSize, skip };
};

export const createOrderFromCart = handleAsyncError(async (req, res) => {
  const userId = req.id;
  const { shippingAddress, paymentMethod = "COD" } = req.body;

  if (paymentMethod !== "COD") {
    return res.status(400).json({ success: false, message: "Only COD is supported" });
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
    return res.status(400).json({ success: false, message: "Complete shipping address is required" });
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
          priceAtPurchase: price,
        });

        stockUpdates.push({
          updateOne: {
            filter: { _id: product._id },
            update: { $inc: { "stock.quantity": -item.quantity } },
          },
        });
      }

      const tax = Math.round(subtotal * 0.18 * 100) / 100;
      const shipping = subtotal > 500 ? 0 : 50;
      const discount = 0;
      const totalCost = subtotal + tax + shipping - discount;

      const orderDocs = await Order.create(
        [
          {
            userId,
            products: orderItems,
            totalCost,
            costBreakdown: { subtotal, tax, shipping, discount },
            shippingAddress: { ...shippingAddress, country: shippingAddress.country || "India" },
            paymentMethod: "COD",
            paymentStatus: "pending",
            orderStatus: "pending",
          },
        ],
        { session }
      );

      createdOrder = orderDocs[0];

      if (stockUpdates.length > 0) {
        await Product.bulkWrite(stockUpdates, { session });
      }

      await Cart.findOneAndUpdate(
        { user: userId },
        { items: [], totalPrice: 0 },
        { session }
      );
    });
  } finally {
    await session.endSession();
  }

  await createdOrder.populate([
    { path: "userId", select: "fullname email phoneNumber" },
    { path: "products.product", select: "productname productprice images createdBy" },
  ]);

  const invoice = await generateInvoicePdf(createdOrder);
  createdOrder.invoiceNumber = invoice.invoiceNumber;
  createdOrder.invoicePath = invoice.filePath;
  createdOrder.invoiceGeneratedAt = new Date();
  await createdOrder.save();

  await createdOrder.populate([
    { path: "userId", select: "fullname email phoneNumber" },
    { path: "products.product", select: "productname productprice images createdBy" },
  ]);

  return res.status(201).json({
    success: true,
    message: "Order created successfully",
    order: createdOrder,
  });
});

export const getUserOrders = handleAsyncError(async (req, res) => {
  const userId = req.id;
  const { page = 1, limit = 10, status } = req.query;

  const filter = { userId };
  if (status) filter.orderStatus = status;

  const { pageNumber, pageSize, skip } = getPagination(page, limit, 50);

  const [orders, totalCount] = await Promise.all([
    Order.find(filter)
      .populate("products.product", "productname productprice images")
      .sort({ orderPlacedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(pageSize),
    Order.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(totalCount / pageSize);

  return res.status(200).json({
    success: true,
    orders,
    pagination: {
      currentPage: pageNumber,
      totalPages,
      totalOrders: totalCount,
      hasNextPage: pageNumber < totalPages,
      hasPrevPage: pageNumber > 1,
    },
  });
});

export const getAllOrders = handleAsyncError(async (req, res) => {
  const { role, id: requesterId } = req;
  const { page = 1, limit = 20, status, userId, search } = req.query;

  if (!["admin", "seller"].includes(role)) {
    return res.status(403).json({ success: false, message: "Access denied. Admin or seller role required." });
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
        { email: { $regex: search, $options: "i" } },
      ],
    }).select("_id");

    filter.userId = { $in: users.map((u) => u._id) };
  }

  if (role === "seller") {
    const sellerProducts = await Product.find({ createdBy: requesterId }).select("_id");
    filter["products.product"] = { $in: sellerProducts.map((p) => p._id) };
  }

  const { pageNumber, pageSize, skip } = getPagination(page, limit, 100);

  const [orders, totalCount] = await Promise.all([
    Order.find(filter)
      .populate("userId", "fullname email phoneNumber")
      .populate("products.product", "productname productprice images createdBy")
      .sort({ orderPlacedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(pageSize),
    Order.countDocuments(filter),
  ]);

  const totalPages = Math.ceil(totalCount / pageSize);

  return res.status(200).json({
    success: true,
    orders,
    pagination: {
      currentPage: pageNumber,
      totalPages,
      totalOrders: totalCount,
      hasNextPage: pageNumber < totalPages,
      hasPrevPage: pageNumber > 1,
    },
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
    return res.status(404).json({ success: false, message: "Order not found" });
  }

  if (!requesterId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  if (role === "user") {
    const ownerId = order.userId?._id?.toString?.() || order.userId?.toString?.();
    if (!ownerId || ownerId !== requesterId.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized to view this order" });
    }
  }

  if (role === "seller" && !isSellerOwnOrder(order, requesterId)) {
    return res.status(403).json({ success: false, message: "Not authorized to view this order" });
  }

  return res.status(200).json({ success: true, order });
});

export const cancelOrder = handleAsyncError(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const { role, id: requesterId } = req;

  validateObjectId(id, "order ID");

  const order = await Order.findById(id).populate("products.product");
  if (!order) {
    return res.status(404).json({ success: false, message: "Order not found" });
  }

  if (role === "user" && order.userId.toString() !== requesterId.toString()) {
    return res.status(403).json({ success: false, message: "Not authorized to cancel this order" });
  }

  if (role === "seller" && !isSellerOwnOrder(order, requesterId)) {
    return res.status(403).json({ success: false, message: "Not authorized to cancel this order" });
  }

  if (["shipped", "delivered", "cancelled"].includes(order.orderStatus)) {
    return res.status(400).json({ success: false, message: `Cannot cancel order with status: ${order.orderStatus}` });
  }

  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      order.orderStatus = "cancelled";
      order.cancellationReason = reason;
      order.cancelledAt = new Date();
      order.cancelledBy = requesterId;
      await order.save({ session });

      const stockUpdates = order.products
        .filter((item) => item.product?._id)
        .map((item) => ({
          updateOne: {
            filter: { _id: item.product._id },
            update: { $inc: { "stock.quantity": item.quantity } },
          },
        }));

      if (stockUpdates.length > 0) {
        await Product.bulkWrite(stockUpdates, { session });
      }
    });
  } finally {
    await session.endSession();
  }

  return res.status(200).json({
    success: true,
    message: "Order cancelled successfully",
    order,
  });
});

export const searchOrdersByProductName = handleAsyncError(async (req, res) => {
  const { name, page = 1, limit = 20 } = req.query;
  const { role, id: requesterId } = req;

  if (!name || name.trim().length < 2) {
    return res.status(400).json({ success: false, message: "Search term must be at least 2 characters long" });
  }

  const productFilter = { productname: { $regex: name.trim(), $options: "i" } };
  if (role === "seller") {
    productFilter.createdBy = requesterId;
  }

  const matchingProducts = await Product.find(productFilter).select("_id");
  const productIds = matchingProducts.map((p) => p._id);

  if (productIds.length === 0) {
    return res.status(200).json({
      success: true,
      orders: [],
      pagination: {
        currentPage: 1,
        totalPages: 0,
        totalOrders: 0,
        hasNextPage: false,
        hasPrevPage: false,
      },
    });
  }

  const orderFilter = { "products.product": { $in: productIds } };
  if (role === "user") {
    orderFilter.userId = requesterId;
  }

  const { pageNumber, pageSize, skip } = getPagination(page, limit, 50);

  const [orders, totalCount] = await Promise.all([
    Order.find(orderFilter)
      .populate("userId", "fullname email")
      .populate("products.product", "productname productprice images createdBy")
      .sort({ orderPlacedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(pageSize),
    Order.countDocuments(orderFilter),
  ]);

  const totalPages = Math.ceil(totalCount / pageSize);

  return res.status(200).json({
    success: true,
    orders,
    searchTerm: name,
    pagination: {
      currentPage: pageNumber,
      totalPages,
      totalOrders: totalCount,
      hasNextPage: pageNumber < totalPages,
      hasPrevPage: pageNumber > 1,
    },
  });
});

export const getOrderAnalytics = handleAsyncError(async (req, res) => {
  const { role, id: requesterId } = req;
  const { period = "30d" } = req.query;

  if (role === "user") {
    return res.status(403).json({ success: false, message: "Access denied" });
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

  const matchFilter = { orderPlacedAt: { $gte: startDate } };

  if (role === "seller") {
    const sellerProducts = await Product.find({ createdBy: requesterId }).select("_id");
    matchFilter["products.product"] = { $in: sellerProducts.map((p) => p._id) };
  }

  const analytics = await Order.aggregate([
    { $match: matchFilter },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalRevenue: { $sum: "$totalCost" },
        averageOrderValue: { $avg: "$totalCost" },
        statusBreakdown: { $push: "$orderStatus" },
      },
    },
    {
      $project: {
        _id: 0,
        totalOrders: 1,
        totalRevenue: { $round: ["$totalRevenue", 2] },
        averageOrderValue: { $round: ["$averageOrderValue", 2] },
        statusBreakdown: 1,
      },
    },
  ]);

  const statusBreakdown = {};
  if (analytics.length > 0 && analytics[0].statusBreakdown) {
    analytics[0].statusBreakdown.forEach((status) => {
      statusBreakdown[status] = (statusBreakdown[status] || 0) + 1;
    });
    analytics[0].statusBreakdown = statusBreakdown;
  }

  return res.status(200).json({
    success: true,
    analytics:
      analytics.length > 0
        ? analytics[0]
        : {
            totalOrders: 0,
            totalRevenue: 0,
            averageOrderValue: 0,
            statusBreakdown: {},
          },
    period,
  });
});

export const downloadInvoice = handleAsyncError(async (req, res) => {
  const { id } = req.params;
  const { role, id: requesterId } = req;

  validateObjectId(id, "order ID");

  const order = await Order.findById(id).populate("products.product", "createdBy");
  if (!order) {
    return res.status(404).json({ success: false, message: "Order not found" });
  }

  if (!requesterId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  if (role === "user") {
    const ownerId = order.userId?.toString?.() || "";
    if (ownerId !== requesterId.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }
  }

  if (role === "seller" && !isSellerOwnOrder(order, requesterId)) {
    return res.status(403).json({ success: false, message: "Not authorized" });
  }

  if (!order.invoicePath || !fs.existsSync(order.invoicePath)) {
    return res.status(404).json({ success: false, message: "Invoice not found" });
  }

  return res.download(order.invoicePath);
});

export const handleOrderErrors = (error, req, res, next) => {
  console.error("Order Controller Error:", error);

  if (error.message === "Cart is empty") {
    return res.status(400).json({ success: false, message: error.message });
  }

  if (error.message?.startsWith("Insufficient stock for")) {
    return res.status(400).json({ success: false, message: error.message });
  }

  if (error.name === "ValidationError") {
    const messages = Object.values(error.errors).map((err) => err.message);
    return res.status(400).json({
      success: false,
      message: "Validation Error",
      errors: messages,
    });
  }

  if (error.name === "CastError") {
    return res.status(400).json({ success: false, message: "Invalid ID format" });
  }

  return res.status(500).json({ success: false, message: error.message || "Internal server error" });
};

export const getSellerDashboardData = handleAsyncError(async (req, res) => {
  const userId = req.id;

  const sellerProducts = await Product.find({ createdBy: userId }).select("_id productname productprice stock images createdAt");
  const sellerProductIds = sellerProducts.map((p) => p._id);

  const recentOrders = await Order.find({ "products.product": { $in: sellerProductIds } })
    .populate("userId", "fullname email phoneNumber")
    .populate("products.product", "productname productprice images createdBy")
    .sort({ orderPlacedAt: -1, createdAt: -1 })
    .limit(5);

  const totalProducts = sellerProducts.length;
  const totalOrders = await Order.countDocuments({ "products.product": { $in: sellerProductIds } });
  const pendingOrders = await Order.countDocuments({
    "products.product": { $in: sellerProductIds },
    orderStatus: "pending",
  });
  const deliveredOrders = await Order.countDocuments({
    "products.product": { $in: sellerProductIds },
    orderStatus: "delivered",
  });

  const revenueAgg = await Order.aggregate([
    { $match: { "products.product": { $in: sellerProductIds }, orderStatus: { $ne: "cancelled" } } },
    { $group: { _id: null, totalRevenue: { $sum: "$totalCost" } } },
  ]);

  const totalRevenue = revenueAgg[0]?.totalRevenue || 0;

  return res.status(200).json({
    success: true,
    data: {
      totalProducts,
      totalOrders,
      pendingOrders,
      deliveredOrders,
      totalRevenue,
      products: sellerProducts,
      recentOrders,
    },
  });
});

export const getMyProducts = handleAsyncError(async (req, res) => {
  const userId = req.id;

  if (!userId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const products = await Product.find({ createdBy: userId })
    .sort({ createdAt: -1 })
    .select("productname productprice category stock images createdAt createdBy");

  return res.status(200).json({ success: true, products });
});


const ALLOWED_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

const STATUS_FLOW = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["processing", "cancelled"],
  processing: ["shipped", "cancelled"],
  shipped: ["delivered"],
  delivered: [],
  cancelled: [],
};

const isValidObjectId = (id) => {
  return (
    mongoose.Types.ObjectId.isValid(id) &&
    new mongoose.Types.ObjectId(id).toString() === id
  );
};

export const getSellerOrders = async (req, res, next) => {
  try {
    const sellerId = req.id;

    if (!sellerId) {
      return res.status(401).json({
        success: false,
        message: "User not authenticated.",
      });
    }

    const sellerProducts = await Product.find({ createdBy: sellerId })
      .select("_id productname productprice images")
      .lean();

    const sellerProductIds = sellerProducts.map((p) => p._id.toString());

    if (sellerProductIds.length === 0) {
      return res.status(200).json({
        success: true,
        orders: [],
      });
    }

    const sellerProductMap = new Map(
      sellerProducts.map((product) => [product._id.toString(), product])
    );

    const orders = await Order.find({
      "items.product": { $in: sellerProductIds },
    })
      .populate("user", "fullname email")
      .populate("items.product", "productname productprice images createdBy")
      .sort({ createdAt: -1 })
      .lean();

    const sellerScopedOrders = orders
      .map((order) => {
        const sellerItems = (order.items || []).filter((item) => {
          const productId =
            item.product && typeof item.product === "object"
              ? item.product._id?.toString()
              : item.product?.toString();

          return sellerProductIds.includes(productId);
        });

        if (sellerItems.length === 0) return null;

        const sellerTotalAmount = sellerItems.reduce((sum, item) => {
          const price =
            item.priceAtPurchase ??
            item.priceAtAddition ??
            item.product?.productprice ??
            0;

          return sum + price * (item.quantity || 0);
        }, 0);

        return {
          ...order,
          items: sellerItems.map((item) => {
            const productId =
              item.product && typeof item.product === "object"
                ? item.product._id?.toString()
                : item.product?.toString();

            const productDetails = sellerProductMap.get(productId);

            return {
              ...item,
              productDetails: productDetails
                ? {
                    _id: productDetails._id,
                    productname: productDetails.productname,
                    productprice: productDetails.productprice,
                    images: productDetails.images,
                  }
                : null,
            };
          }),
          totalAmount: sellerTotalAmount,
        };
      })
      .filter(Boolean);

    return res.status(200).json({
      success: true,
      orders: sellerScopedOrders,
    });
  } catch (error) {
    next(error);
  }
};

export const updateOrderStatus = handleAsyncError(async (req, res) => {
  const { id } = req.params;
  const { status, trackingNumber, note, cancellationReason } = req.body;
  const { role, id: requesterId } = req;

  validateObjectId(id, "order ID");

  const validStatuses = [
    "pending",
    "confirmed",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
  ];

  const allowedTransitions = {
    pending: ["confirmed", "cancelled"],
    confirmed: ["processing", "cancelled"],
    processing: ["shipped", "cancelled"],
    shipped: ["delivered"],
    delivered: [],
    cancelled: [],
  };

  if (!status || !validStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Invalid status. Valid statuses: ${validStatuses.join(", ")}`,
    });
  }

  const order = await Order.findById(id).populate("products.product", "createdBy");

  if (!order) {
    return res.status(404).json({
      success: false,
      message: "Order not found",
    });
  }

  if (role === "user") {
    return res.status(403).json({
      success: false,
      message: "Users cannot update order status",
    });
  }

  if (role === "seller" && !isSellerOwnOrder(order, requesterId)) {
    return res.status(403).json({
      success: false,
      message: "Not authorized to update this order",
    });
  }

  const currentStatus = order.orderStatus || "pending";

  if (currentStatus === status) {
    return res.status(400).json({
      success: false,
      message: `Order is already ${status}`,
    });
  }

  const nextAllowedStatuses = allowedTransitions[currentStatus] || [];

  if (!nextAllowedStatuses.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Invalid status transition from ${currentStatus} to ${status}`,
    });
  }

  if (status === "shipped" && !trackingNumber?.trim()) {
    return res.status(400).json({
      success: false,
      message: "Tracking number is required when marking order as shipped",
    });
  }

  if (status === "cancelled" && !cancellationReason?.trim()) {
    return res.status(400).json({
      success: false,
      message: "Cancellation reason is required when cancelling an order",
    });
  }

  const now = new Date();
  const previousStatus = currentStatus;

  order.orderStatus = status;

  if (trackingNumber?.trim()) {
    order.trackingNumber = trackingNumber.trim();
  }

  if (status === "confirmed" && !order.confirmedAt) {
    order.confirmedAt = now;
  }

  if (status === "shipped" && !order.shippedAt) {
    order.shippedAt = now;
  }

  if (status === "delivered") {
    if (!order.deliveredAt) order.deliveredAt = now;
    if (!order.actualDelivery) order.actualDelivery = now;
  }

  if (status === "cancelled") {
    if (!order.cancelledAt) order.cancelledAt = now;
    order.cancelledBy = requesterId;
    order.cancellationReason = cancellationReason.trim();
  }

  order.statusHistory = order.statusHistory || [];
  order.statusHistory.push({
    previousStatus,
    status,
    updatedAt: now,
    updatedBy: requesterId,
    note: note?.trim() || "",
  });

  await order.save();

  return res.status(200).json({
    success: true,
    message: "Order status updated successfully",
    order,
  });
});