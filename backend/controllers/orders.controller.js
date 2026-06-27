import { Order } from "../models/orders.model.js";
import { Product } from "../models/product.model.js";
import { Cart } from "../models/cart.model.js";
import { User } from "../models/user.model.js";
import mongoose from "mongoose";
import fs from "fs";
import path from "path";
import PDFDocument from "pdfkit";

const updateUserEcoStats = async (userId, orderProducts) => {
  try {
    const ecoItems = orderProducts.filter((item) => (item.ecoScore || 0) > 0);
    if (ecoItems.length === 0) return;

    const totalScore = ecoItems.reduce((sum, item) => sum + (item.ecoScore || 0), 0);
    const avgScore = Math.round(totalScore / ecoItems.length);

    // ✅ Multiply co2 by quantity — this was also wrong before
    const totalCo2 = ecoItems.reduce(
      (sum, item) => sum + (item.co2SavedKg || 0) * (item.quantity || 1),
      0
    );

    await User.findByIdAndUpdate(userId, {
      $inc: {
        "ecoStats.totalEcoScore":   avgScore,
        "ecoStats.totalCo2SavedKg": parseFloat(totalCo2.toFixed(2)),
        "ecoStats.ecoOrderCount":   1,
      },
      $set: { "ecoStats.lastUpdated": new Date() },
    });
  } catch (err) {
    console.error("Failed to update user eco stats:", err.message);
  }
};

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
    doc.text(`Date: ${new Date(order.createdAt || Date.now()).toLocaleString()}`);
    doc.text(`Customer: ${order.shippingAddress.fullName}`);
    doc.text(`Mobile: ${order.shippingAddress.mobile}`);
    doc.moveDown();

    doc.text("Shipping Address:");
    doc.text(`${order.shippingAddress.house}, ${order.shippingAddress.area}`);
    doc.text(
      `${order.shippingAddress.city}, ${order.shippingAddress.state} - ${order.shippingAddress.pincode}`
    );
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
        `${idx + 1}. ${item.product?.productname || "Product"} | Qty: ${
          item.quantity
        } | Price: ₹${item.priceAtPurchase} | Total: ₹${(
          item.quantity * item.priceAtPurchase
        ).toFixed(2)}`
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

const getPagination = (page, limit, maxLimit = 50) => {
  const pageNumber = Math.max(1, parseInt(page) || 1);
  const pageSize = Math.min(maxLimit, Math.max(1, parseInt(limit) || 10));
  const skip = (pageNumber - 1) * pageSize;
  return { pageNumber, pageSize, skip };
};

const populateOrder = async (order) => {
  return order.populate([
    { path: "userId", select: "fullname email phoneNumber" },
    { path: "products.product", select: "productname productprice images createdBy" },
    { path: "statusHistory.updatedBy", select: "fullname email" },
    { path: "cancelledBy", select: "fullname email" },
  ]);
};

const findOrderById = async (id) => {
  return Order.findById(id)
    .populate("userId", "fullname email phoneNumber")
    .populate("products.product", "productname productprice images createdBy")
    .populate("statusHistory.updatedBy", "fullname email")
    .populate("cancelledBy", "fullname email");
};

const isBuyerOfOrder = (order, userId) => {
  const buyerId = order.userId?._id?.toString?.() || order.userId?.toString?.();
  return buyerId === userId.toString();
};

const isSellerOfAnyProductInOrder = (order, userId) => {
  return (order.products || []).some(
    (item) => item?.product?.createdBy?.toString?.() === userId.toString()
  );
};

const canAccessOrder = (order, userId) => {
  return isBuyerOfOrder(order, userId) || isSellerOfAnyProductInOrder(order, userId);
};

const getSellerScopedOrderView = (orderDoc, sellerId) => {
  const order = orderDoc.toObject ? orderDoc.toObject() : orderDoc;

  const sellerItems = (order.products || []).filter((item) => {
    const productSellerId = item?.product?.createdBy?.toString?.();
    return productSellerId === sellerId.toString();
  });

  if (sellerItems.length === 0) return null;

  const sellerSubtotal = sellerItems.reduce((sum, item) => {
    return sum + Number(item.priceAtPurchase || 0) * Number(item.quantity || 0);
  }, 0);

  const totalOrderSubtotal = Number(order.costBreakdown?.subtotal || 0);
  const ratio = totalOrderSubtotal > 0 ? sellerSubtotal / totalOrderSubtotal : 0;

  const proportionalTax = Number((Number(order.costBreakdown?.tax || 0) * ratio).toFixed(2));
  const proportionalShipping = Number(
    (Number(order.costBreakdown?.shipping || 0) * ratio).toFixed(2)
  );
  const proportionalDiscount = Number(
    (Number(order.costBreakdown?.discount || 0) * ratio).toFixed(2)
  );

  const totalAmount = Number(
    (sellerSubtotal + proportionalTax + proportionalShipping - proportionalDiscount).toFixed(2)
  );

  return {
    ...order,
    products: sellerItems,
    items: sellerItems,
    sellerSubtotal,
    totalAmount,
    costBreakdown: {
      subtotal: sellerSubtotal,
      tax: proportionalTax,
      shipping: proportionalShipping,
      discount: proportionalDiscount,
    },
  };
};


// ─── Controllers ────────────────────────────────────────────────────────────

export const createOrderFromCart = handleAsyncError(async (req, res) => {
  const userId = req.id;
  const { shippingAddress, paymentMethod = "COD" } = req.body;

  if (paymentMethod !== "COD") {
    return res.status(400).json({ success: false, message: "Only COD is supported" });
  }

  if (
    !shippingAddress?.fullName ||
    !shippingAddress?.mobile ||
    !shippingAddress?.house ||
    !shippingAddress?.area ||
    !shippingAddress?.city ||
    !shippingAddress?.state ||
    !shippingAddress?.pincode
  ) {
    return res.status(400).json({ success: false, message: "Complete shipping address is required" });
  }

  const session = await mongoose.startSession();
  let createdOrder = null;

  try {
    await session.withTransaction(async () => {
      const cart = await Cart.findOne({ user: userId })
        .populate("items.product")
        .session(session);

      if (!cart || cart.items.length === 0) throw new Error("Cart is empty");

      const orderItems = [];
      let subtotal = 0;
      const stockUpdates = [];

      // In createOrderFromCart, update the orderItems loop:

      for (const item of cart.items) {
        const product = item.product;

        if (!product) throw new Error("One or more products in cart no longer exist");

        const currentStock =
          product.stock?.quantity !== undefined ? product.stock.quantity : product.stock;

        if (currentStock < item.quantity) {
          throw new Error(
            `Insufficient stock for ${product.productname}. Only ${currentStock} available.`
          );
        }

        const price = item.priceAtAddition ?? product.productprice;
        subtotal += item.quantity * price;

        orderItems.push({
          product: product._id,
          quantity: item.quantity,
          priceAtPurchase: price,
          ecoScore: product.ecoScore || 0,        // ✅ snapshot
          co2SavedKg: product.co2SavedKg || 0,   // ✅ snapshot
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
            shippingAddress: {
              ...shippingAddress,
              country: shippingAddress.country || "India",
            },
            paymentMethod: "COD",
            paymentStatus: "pending",
            orderStatus: "pending",
            statusHistory: [
              {
                previousStatus: null,
                status: "pending",
                updatedAt: new Date(),
                updatedBy: userId,
                note: "Order placed successfully",
              },
            ],
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

  await populateOrder(createdOrder);

  const invoice = await generateInvoicePdf(createdOrder);
  createdOrder.invoiceNumber = invoice.invoiceNumber;
  createdOrder.invoicePath = invoice.filePath;
  createdOrder.invoiceGeneratedAt = new Date();
  await createdOrder.save();
  // After createdOrder.save() (after invoice generation), add:
  await updateUserEcoStats(userId, createdOrder.products);

  await populateOrder(createdOrder);

  return res.status(201).json({
    success: true,
    message: "Order created successfully",
    order: createdOrder,
  });
});

export const createOrderFromBuyNow = handleAsyncError(async (req, res) => {
  const userId = req.id;
  const { shippingAddress, paymentMethod = "COD", buyNowItem } = req.body;

  if (paymentMethod !== "COD") {
    return res.status(400).json({ success: false, message: "Only COD is supported" });
  }

  if (
    !shippingAddress?.fullName ||
    !shippingAddress?.mobile ||
    !shippingAddress?.house ||
    !shippingAddress?.area ||
    !shippingAddress?.city ||
    !shippingAddress?.state ||
    !shippingAddress?.pincode
  ) {
    return res.status(400).json({ success: false, message: "Complete shipping address is required" });
  }

  if (!buyNowItem?.productId || !buyNowItem?.quantity) {
    return res.status(400).json({ success: false, message: "Product and quantity are required" });
  }

  validateObjectId(buyNowItem.productId, "product ID");

  const session = await mongoose.startSession();
  let createdOrder = null;

  try {
    await session.withTransaction(async () => {
      const product = await Product.findById(buyNowItem.productId).session(session);

      if (!product) throw new Error("Product not found");

      const currentStock =
        product.stock?.quantity !== undefined ? product.stock.quantity : product.stock;

      if (currentStock < buyNowItem.quantity) {
        throw new Error(
          `Insufficient stock for ${product.productname}. Only ${currentStock} available.`
        );
      }

      const price = buyNowItem.priceAtPurchase ?? product.productprice;
      const subtotal = price * buyNowItem.quantity;
      const tax = Math.round(subtotal * 0.18 * 100) / 100;
      const shipping = subtotal > 500 ? 0 : 50;
      const discount = 0;
      const totalCost = subtotal + tax + shipping - discount;

      const orderDocs = await Order.create(
        [
          {
            userId,
            products: [
              {
                product: product._id,
                quantity: buyNowItem.quantity,
                priceAtPurchase: price,
              },
            ],
            totalCost,
            costBreakdown: { subtotal, tax, shipping, discount },
            shippingAddress: {
              ...shippingAddress,
              country: shippingAddress.country || "India",
            },
            paymentMethod: "COD",
            paymentStatus: "pending",
            orderStatus: "pending",
            statusHistory: [
              {
                previousStatus: null,
                status: "pending",
                updatedAt: new Date(),
                updatedBy: userId,
                note: "Order placed via Buy Now",
              },
            ],
          },
        ],
        { session }
      );

      createdOrder = orderDocs[0];

      await Product.updateOne(
        { _id: product._id },
        { $inc: { "stock.quantity": -buyNowItem.quantity } },
        { session }
      );
    });
  } finally {
    await session.endSession();
  }

  await populateOrder(createdOrder);

  const invoice = await generateInvoicePdf(createdOrder);
  createdOrder.invoiceNumber = invoice.invoiceNumber;
  createdOrder.invoicePath = invoice.filePath;
  createdOrder.invoiceGeneratedAt = new Date();
  await createdOrder.save();

  await populateOrder(createdOrder);

  return res.status(201).json({
    success: true,
    message: "Order placed successfully",
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
      .populate("products.product", "productname productprice images createdBy")
      .populate("statusHistory.updatedBy", "fullname email")
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
  const requesterId = req.id;
  const { page = 1, limit = 20, status, userId, search, scope = "all" } = req.query;

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

  const myProductIds = await Product.find({ createdBy: requesterId }).distinct("_id");

  if (scope === "buyer") {
    filter.userId = requesterId;
  } else if (scope === "seller") {
    filter["products.product"] = { $in: myProductIds };
  } else {
    filter.$or = [
      { userId: requesterId },
      { "products.product": { $in: myProductIds } },
    ];
  }

  const { pageNumber, pageSize, skip } = getPagination(page, limit, 100);

  const [orders, totalCount] = await Promise.all([
    Order.find(filter)
      .populate("userId", "fullname email phoneNumber")
      .populate("products.product", "productname productprice images createdBy")
      .populate("statusHistory.updatedBy", "fullname email")
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
  const requesterId = req.id;

  validateObjectId(id, "order ID");

  const order = await findOrderById(id);

  if (!order) {
    return res.status(404).json({ success: false, message: "Order not found" });
  }

  if (!canAccessOrder(order, requesterId)) {
    return res.status(403).json({ success: false, message: "Not authorized to view this order" });
  }

  return res.status(200).json({ success: true, order });
});

export const cancelOrder = handleAsyncError(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  const requesterId = req.id;

  validateObjectId(id, "order ID");

  const order = await Order.findById(id)
    .populate("userId", "fullname email phoneNumber")
    .populate("products.product", "productname productprice images createdBy");

  if (!order) {
    return res.status(404).json({ success: false, message: "Order not found" });
  }

  if (!canAccessOrder(order, requesterId)) {
    return res.status(403).json({ success: false, message: "Not authorized to cancel this order" });
  }

  if (["shipped", "delivered", "cancelled"].includes(order.orderStatus)) {
    return res.status(400).json({
      success: false,
      message: `Cannot cancel order with status: ${order.orderStatus}`,
    });
  }

  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      // ✅ Capture BEFORE mutating
      const previousStatus = order.orderStatus;

      order.orderStatus = "cancelled";
      order.cancellationReason = reason?.trim() || "Order cancelled";
      order.cancelledAt = new Date();
      order.cancelledBy = requesterId;

      order.statusHistory = order.statusHistory || [];
      order.statusHistory.push({
        previousStatus,
        status: "cancelled",
        updatedAt: new Date(),
        updatedBy: requesterId,
        note: reason?.trim() || "Order cancelled",
      });

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

  await populateOrder(order);

  return res.status(200).json({
    success: true,
    message: "Order cancelled successfully",
    order,
  });
});

export const searchOrdersByProductName = handleAsyncError(async (req, res) => {
  const { name, page = 1, limit = 20 } = req.query;
  const requesterId = req.id;

  if (!name || name.trim().length < 2) {
    return res.status(400).json({
      success: false,
      message: "Search term must be at least 2 characters long",
    });
  }

  const matchingProducts = await Product.find({
    productname: { $regex: name.trim(), $options: "i" },
  }).select("_id createdBy");

  if (matchingProducts.length === 0) {
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

  const productIds = matchingProducts.map((p) => p._id);
  const myProductIds = new Set(
    matchingProducts
      .filter((p) => p.createdBy?.toString?.() === requesterId.toString())
      .map((p) => p._id.toString())
  );

  const orderFilter = {
    $or: [
      { userId: requesterId, "products.product": { $in: productIds } },
      { "products.product": { $in: productIds } },
    ],
  };

  const { pageNumber, pageSize, skip } = getPagination(page, limit, 50);

  const [orders, totalCount] = await Promise.all([
    Order.find(orderFilter)
      .populate("userId", "fullname email")
      .populate("products.product", "productname productprice images createdBy")
      .populate("statusHistory.updatedBy", "fullname email")
      .sort({ orderPlacedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(pageSize),
    Order.countDocuments(orderFilter),
  ]);

  const visibleOrders = orders.filter((order) => {
    if (isBuyerOfOrder(order, requesterId)) return true;
    return (order.products || []).some((item) =>
      myProductIds.has(item.product?._id?.toString?.())
    );
  });

  return res.status(200).json({
    success: true,
    orders: visibleOrders,
    searchTerm: name,
    pagination: {
      currentPage: pageNumber,
      totalPages: Math.ceil(totalCount / pageSize),
      totalOrders: totalCount,
      hasNextPage: pageNumber < Math.ceil(totalCount / pageSize),
      hasPrevPage: pageNumber > 1,
    },
  });
});

export const getOrderAnalytics = handleAsyncError(async (req, res) => {
  const requesterId = req.id;
  const { period = "30d", scope = "seller" } = req.query;

  const now = new Date();
  let startDate;

  switch (period) {
    case "7d":
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "90d":
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  const myProductIds = await Product.find({ createdBy: requesterId }).distinct("_id");
  const matchFilter = { orderPlacedAt: { $gte: startDate } };

  if (scope === "buyer") {
    matchFilter.userId = requesterId;
  } else {
    matchFilter["products.product"] = { $in: myProductIds };
  }

  const orders = await Order.find(matchFilter).select(
    "totalCost orderStatus products costBreakdown userId"
  );

  let totalOrders = 0;
  let totalRevenue = 0;
  const statusBreakdown = {};

  for (const order of orders) {
    if (scope === "buyer") {
      totalOrders += 1;
      totalRevenue += Number(order.totalCost || 0);
      const status = order.orderStatus || "pending";
      statusBreakdown[status] = (statusBreakdown[status] || 0) + 1;
      continue;
    }

    const sellerItems = (order.products || []).filter((item) =>
      myProductIds.some((id) => id.toString() === item.product?.toString?.())
    );

    if (sellerItems.length === 0) continue;

    const sellerSubtotal = sellerItems.reduce((sum, item) => {
      return sum + Number(item.priceAtPurchase || 0) * Number(item.quantity || 0);
    }, 0);

    const orderSubtotal = Number(order.costBreakdown?.subtotal || 0);
    const ratio = orderSubtotal > 0 ? sellerSubtotal / orderSubtotal : 0;

    const sellerRevenue =
      sellerSubtotal +
      Number(order.costBreakdown?.tax || 0) * ratio +
      Number(order.costBreakdown?.shipping || 0) * ratio -
      Number(order.costBreakdown?.discount || 0) * ratio;

    totalOrders += 1;
    totalRevenue += sellerRevenue;

    const status = order.orderStatus || "pending";
    statusBreakdown[status] = (statusBreakdown[status] || 0) + 1;
  }

  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  return res.status(200).json({
    success: true,
    analytics: {
      totalOrders,
      totalRevenue: Number(totalRevenue.toFixed(2)),
      averageOrderValue: Number(averageOrderValue.toFixed(2)),
      statusBreakdown,
    },
    period,
    scope,
  });
});

export const downloadInvoice = handleAsyncError(async (req, res) => {
  const { id } = req.params;
  const requesterId = req.id;

  validateObjectId(id, "order ID");

  const order = await Order.findById(id).populate("products.product", "createdBy");

  if (!order) {
    return res.status(404).json({ success: false, message: "Order not found" });
  }

  if (!canAccessOrder(order, requesterId)) {
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
    const errors = Object.values(error.errors).map((err) => ({
      path: err.path,
      message: err.message,
      value: err.value,
    }));

    return res.status(400).json({
      success: false,
      message: "Validation Error",
      errors,
    });
  }

  if (error.name === "CastError") {
    return res.status(400).json({ success: false, message: "Invalid ID format" });
  }

  return res.status(500).json({
    success: false,
    message: error.message || "Internal server error",
  });
};

export const getSellerDashboardData = handleAsyncError(async (req, res) => {
  const userId = req.id;

  const sellerProducts = await Product.find({ createdBy: userId }).select(
    "_id productname productprice stock images createdAt category createdBy"
  );
  const sellerProductIds = sellerProducts.map((p) => p._id);

  const recentOrdersRaw = await Order.find({
    "products.product": { $in: sellerProductIds },
  })
    .populate("userId", "fullname email phoneNumber")
    .populate("products.product", "productname productprice images createdBy")
    .sort({ orderPlacedAt: -1, createdAt: -1 })
    .limit(20);

  const recentOrders = recentOrdersRaw
    .map((order) => getSellerScopedOrderView(order, userId))
    .filter(Boolean)
    .slice(0, 5);

  const totalProducts = sellerProducts.length;

  const [totalOrders, pendingOrders, deliveredOrders] = await Promise.all([
    Order.countDocuments({ "products.product": { $in: sellerProductIds } }),
    Order.countDocuments({ "products.product": { $in: sellerProductIds }, orderStatus: "pending" }),
    Order.countDocuments({ "products.product": { $in: sellerProductIds }, orderStatus: "delivered" }),
  ]);

  const ordersForRevenue = await Order.find({
    "products.product": { $in: sellerProductIds },
    orderStatus: { $ne: "cancelled" },
  }).select("products costBreakdown");

  let totalRevenue = 0;
  for (const order of ordersForRevenue) {
    const scoped = getSellerScopedOrderView(order, userId);
    if (scoped) totalRevenue += Number(scoped.totalAmount || 0);
  }

  return res.status(200).json({
    success: true,
    data: {
      totalProducts,
      totalOrders,
      pendingOrders,
      deliveredOrders,
      totalRevenue: Number(totalRevenue.toFixed(2)),
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

export const getSellerOrders = handleAsyncError(async (req, res) => {
  const sellerId = req.id;
  const { page = 1, limit = 20, status } = req.query;

  const sellerProductIds = await Product.find({ createdBy: sellerId }).distinct("_id");

  if (!sellerProductIds.length) {
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

  const filter = { "products.product": { $in: sellerProductIds } };
  if (status) filter.orderStatus = status;

  const { pageNumber, pageSize, skip } = getPagination(page, limit, 100);

  const [orders, totalCount] = await Promise.all([
    Order.find(filter)
      .populate("userId", "fullname email phoneNumber")
      .populate("products.product", "productname productprice images createdBy")
      .populate("statusHistory.updatedBy", "fullname email")
      .sort({ orderPlacedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(pageSize),
    Order.countDocuments(filter),
  ]);

  const sellerScopedOrders = orders
    .map((order) => getSellerScopedOrderView(order, sellerId))
    .filter(Boolean);

  const totalPages = Math.ceil(totalCount / pageSize);

  return res.status(200).json({
    success: true,
    orders: sellerScopedOrders,
    pagination: {
      currentPage: pageNumber,
      totalPages,
      totalOrders: totalCount,
      hasNextPage: pageNumber < totalPages,
      hasPrevPage: pageNumber > 1,
    },
  });
});

export const updateOrderStatus = handleAsyncError(async (req, res) => {
  const { id } = req.params;
  const { status, trackingNumber, note, cancellationReason } = req.body;
  const requesterId = req.id;

  validateObjectId(id, "order ID");

  if (!status || !ALLOWED_STATUSES.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Invalid status. Valid statuses: ${ALLOWED_STATUSES.join(", ")}`,
    });
  }

  const order = await Order.findById(id)
    .populate("userId", "fullname email phoneNumber")
    .populate("products.product", "productname productprice images createdBy");

  if (!order) {
    return res.status(404).json({ success: false, message: "Order not found" });
  }

  if (!isSellerOfAnyProductInOrder(order, requesterId)) {
    return res.status(403).json({
      success: false,
      message: "Only the seller of products in this order can update the status",
    });
  }

  const currentStatus = order.orderStatus || "pending";

  if (currentStatus === status) {
    return res.status(400).json({ success: false, message: `Order is already ${status}` });
  }

  const nextAllowedStatuses = STATUS_FLOW[currentStatus] || [];

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

  if (status === "cancelled" && !cancellationReason?.trim() && !note?.trim()) {
    return res.status(400).json({
      success: false,
      message: "Cancellation reason is required when cancelling an order",
    });
  }

  const now = new Date();
  const previousStatus = currentStatus;

  order.orderStatus = status;

  if (trackingNumber?.trim()) order.trackingNumber = trackingNumber.trim();
  if (status === "confirmed" && !order.confirmedAt) order.confirmedAt = now;
  if (status === "processing") order.processingAt = now;
  if (status === "shipped" && !order.shippedAt) order.shippedAt = now;

  if (status === "delivered") {
    if (!order.deliveredAt) order.deliveredAt = now;
    if (!order.actualDelivery) order.actualDelivery = now;
    if (order.paymentMethod === "COD") order.paymentStatus = "completed";
  }

  if (status === "cancelled") {
    if (!order.cancelledAt) order.cancelledAt = now;
    order.cancelledBy = requesterId;
    order.cancellationReason = cancellationReason?.trim() || note?.trim() || "Order cancelled";
  }

  order.statusHistory = order.statusHistory || [];
  order.statusHistory.push({
    previousStatus,
    status,
    updatedAt: now,
    updatedBy: requesterId,
    note:
      note?.trim() ||
      (status === "cancelled"
        ? cancellationReason?.trim() || "Order cancelled"
        : `Order status updated to ${status}`),
  });

  await order.save();
  await populateOrder(order);

  return res.status(200).json({
    success: true,
    message: "Order status updated successfully",
    order,
  });
});