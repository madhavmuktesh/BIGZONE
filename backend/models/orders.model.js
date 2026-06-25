import mongoose from "mongoose";

const statusHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    required: true,
    enum: ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"]
  },
  updatedAt: { type: Date, default: Date.now },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  note: String
}, { _id: false });

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: [true, "Product reference is required"]
  },
  quantity: {
    type: Number,
    required: [true, "Quantity is required"],
    min: [1, "Quantity must be at least 1"],
    max: [100, "Quantity cannot exceed 100"]
  },
  priceAtPurchase: {
    type: Number,
    required: [true, "Price at purchase is required"],
    min: [0, "Price cannot be negative"]
  }
}, { _id: false });

const shippingAddressSchema = new mongoose.Schema({
  fullName: { type: String, required: true, trim: true },
  mobile: { type: String, required: true },
  house: { type: String, required: true, trim: true },
  area: { type: String, required: true, trim: true },
  city: { type: String, required: true, trim: true },
  state: { type: String, required: true, trim: true },
  pincode: { type: String, required: true, trim: true },
  country: { type: String, default: "India", trim: true }
}, { _id: false });

const costBreakdownSchema = new mongoose.Schema({
  subtotal: { type: Number, required: true, min: 0 },
  tax: { type: Number, default: 0, min: 0 },
  shipping: { type: Number, default: 0, min: 0 },
  discount: { type: Number, default: 0, min: 0 }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "User reference is required"],
    index: true
  },
  products: {
    type: [orderItemSchema],
    validate: {
      validator: function(products) {
        return products && products.length > 0;
      },
      message: "Order must contain at least one product"
    }
  },
  orderStatus: {
    type: String,
    enum: ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"],
    default: "pending",
    index: true
  },
  paymentMethod: {
    type: String,
    enum: ["COD"],
    default: "COD"
  },
  paymentStatus: {
    type: String,
    enum: ["pending", "completed", "failed", "refunded"],
    default: "pending"
  },
  totalCost: {
    type: Number,
    required: [true, "Total cost is required"],
    min: [0, "Total cost cannot be negative"]
  },
  costBreakdown: {
    type: costBreakdownSchema,
    required: true
  },
  shippingAddress: {
    type: shippingAddressSchema,
    required: [true, "Shipping address is required"]
  },
  trackingNumber: {
    type: String,
    trim: true
  },
  estimatedDelivery: Date,
  actualDelivery: Date,
  orderPlacedAt: { type: Date, default: Date.now },
  confirmedAt: Date,
  shippedAt: Date,
  deliveredAt: Date,
  cancelledAt: Date,
  cancellationReason: String,
  cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  statusHistory: [statusHistorySchema],
  notes: { type: String, maxlength: 500 },
  isGift: { type: Boolean, default: false },
  giftMessage: { type: String, maxlength: 200 },

  invoiceNumber: { type: String, trim: true, index: true },
  invoicePath: { type: String, trim: true },
  invoiceGeneratedAt: { type: Date }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

orderSchema.index({ userId: 1, orderPlacedAt: -1 });
orderSchema.index({ orderStatus: 1, orderPlacedAt: -1 });
orderSchema.index({ "products.product": 1 });

orderSchema.virtual("orderAge").get(function() {
  return Math.floor((Date.now() - this.orderPlacedAt.getTime()) / (1000 * 60 * 60 * 24));
});

orderSchema.virtual("canBeCancelled").get(function() {
  return ["pending", "confirmed"].includes(this.orderStatus);
});

orderSchema.pre("save", function(next) {
  if (this.isModified("orderStatus")) {
    const now = new Date();
    switch (this.orderStatus) {
      case "confirmed":
        if (!this.confirmedAt) this.confirmedAt = now;
        break;
      case "shipped":
        if (!this.shippedAt) this.shippedAt = now;
        break;
      case "delivered":
        if (!this.deliveredAt) this.deliveredAt = now;
        this.actualDelivery = now;
        break;
      case "cancelled":
        if (!this.cancelledAt) this.cancelledAt = now;
        break;
    }
  }
  next();
});

export const Order = mongoose.model("Order", orderSchema);