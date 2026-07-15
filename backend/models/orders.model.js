import mongoose from "mongoose";

const ORDER_STATUSES = [
  "pending",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

const PAYMENT_METHODS = ["COD"];
const PAYMENT_STATUSES = ["pending", "completed", "failed", "refunded"];

const statusHistorySchema = new mongoose.Schema(
  {
    previousStatus: {
      type: String,
      enum: ORDER_STATUSES,
      default: null,
    },
    status: {
      type: String,
      required: true,
      enum: ORDER_STATUSES,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    note: {
      type: String,
      trim: true,
      maxlength: 300,
    },
  },
  { _id: false }
);

// backend/models/orders.model.js
const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: [true, "Product reference is required"],
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, "Quantity must be at least 1"],
      max: [100, "Quantity cannot exceed 100"],
    },
    priceAtPurchase: {
      type: Number,
      required: true,
      min: [0, "Price cannot be negative"],
    },
    // ✅ Snapshot eco data at time of purchase
    ecoScore: { type: Number, default: 0, min: 0, max: 100 },
    co2SavedKg: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const shippingAddressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true },
    mobile: { type: String, required: true, trim: true },
    house: { type: String, required: true, trim: true },
    area: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    pincode: { type: String, required: true, trim: true },
    country: { type: String, default: "India", trim: true },
  },
  { _id: false }
);

const costBreakdownSchema = new mongoose.Schema(
  {
    subtotal: { type: Number, required: true, min: 0 },
    tax: { type: Number, default: 0, min: 0 },
    shipping: { type: Number, default: 0, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User reference is required"],
      index: true,
    },

    products: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: function (products) {
          return Array.isArray(products) && products.length > 0;
        },
        message: "Order must contain at least one product",
      },
    },

    orderStatus: {
      type: String,
      enum: ORDER_STATUSES,
      default: "pending",
      index: true,
    },

    paymentMethod: {
      type: String,
      enum: PAYMENT_METHODS,
      default: "COD",
    },

    paymentStatus: {
      type: String,
      enum: PAYMENT_STATUSES,
      default: "pending",
    },

    totalCost: {
      type: Number,
      required: [true, "Total cost is required"],
      min: [0, "Total cost cannot be negative"],
    },

    costBreakdown: {
      type: costBreakdownSchema,
      required: true,
    },

    shippingAddress: {
      type: shippingAddressSchema,
      required: [true, "Shipping address is required"],
    },

    trackingNumber: {
      type: String,
      trim: true,
      default: "",
    },

    estimatedDelivery: {
      type: Date,
      default: null,
    },

    actualDelivery: {
      type: Date,
      default: null,
    },

    orderPlacedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },

    confirmedAt: {
      type: Date,
      default: null,
    },

    shippedAt: {
      type: Date,
      default: null,
    },

    deliveredAt: {
      type: Date,
      default: null,
    },

    cancelledAt: {
      type: Date,
      default: null,
    },

    cancellationReason: {
      type: String,
      trim: true,
      maxlength: 300,
      default: "",
    },

    cancelledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    statusHistory: {
      type: [statusHistorySchema],
      default: [],
    },

    notes: {
      type: String,
      trim: true,
      maxlength: 500,
      default: "",
    },

    isGift: {
      type: Boolean,
      default: false,
    },

    giftMessage: {
      type: String,
      trim: true,
      maxlength: 200,
      default: "",
    },

    invoiceNumber: {
      type: String,
      trim: true,
      index: true,
      sparse: true,
    },

    invoicePath: {
      type: String,
      trim: true,
      default: "",
    },

    invoiceGeneratedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

orderSchema.index({ userId: 1, orderPlacedAt: -1 });
orderSchema.index({ orderStatus: 1, orderPlacedAt: -1 });
orderSchema.index({ "products.product": 1 });

orderSchema.virtual("orderAge").get(function () {
  if (!this.orderPlacedAt) return 0;
  return Math.floor((Date.now() - this.orderPlacedAt.getTime()) / (1000 * 60 * 60 * 24));
});

orderSchema.virtual("canBeCancelled").get(function () {
  return ["pending", "confirmed"].includes(this.orderStatus);
});

orderSchema.pre("save", function (next) {
  if (this.isNew && (!this.statusHistory || this.statusHistory.length === 0)) {
    this.statusHistory = [
      {
        previousStatus: null,
        status: this.orderStatus || "pending",
        updatedAt: this.orderPlacedAt || new Date(),
      },
    ];
  }

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
        if (!this.actualDelivery) this.actualDelivery = now;
        break;

      case "cancelled":
        if (!this.cancelledAt) this.cancelledAt = now;
        break;

      default:
        break;
    }
  }

  next();
});

export const Order = mongoose.model("Order", orderSchema);