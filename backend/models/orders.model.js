import mongoose from "mongoose";

// Status history schema
const statusHistorySchema = new mongoose.Schema({
  status: {
    type: String,
    required: true,
    enum: ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"]
  },
  updatedAt: { type: Date, default: Date.now },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  note: String
}, { _id: false });

// Order item schema
const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: [true, 'Product reference is required']
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1'],
    max: [100, 'Quantity cannot exceed 100']
  },
  priceAtPurchase: {
    type: Number,
    required: [true, 'Price at purchase is required'],
    min: [0, 'Price cannot be negative']
  }
}, { _id: false });

// Shipping address schema
const shippingAddressSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true },
  street: { type: String, required: true, trim: true },
  city: { type: String, required: true, trim: true },
  state: { type: String, trim: true },
  zip: { type: String, required: true, trim: true },
  country: { type: String, default: "India", trim: true },
  landmark: { type: String, trim: true }
}, { _id: false });

// Cost breakdown schema
const costBreakdownSchema = new mongoose.Schema({
  subtotal: { type: Number, required: true, min: 0 },
  tax: { type: Number, default: 0, min: 0 },
  shipping: { type: Number, default: 0, min: 0 },
  discount: { type: Number, default: 0, min: 0 }
}, { _id: false });

// Main order schema
const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required'],
    index: true
  },
  products: {
    type: [orderItemSchema],
    validate: {
      validator: function(products) {
        return products && products.length > 0;
      },
      message: 'Order must contain at least one product'
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
    enum: ["COD", "UPI", "Credit Card", "Debit Card", "Net Banking"],
    default: "COD"
  },
  paymentStatus: {
    type: String,
    enum: ["pending", "completed", "failed", "refunded"],
    default: "pending"
  },
  totalCost: {
    type: Number,
    required: [true, 'Total cost is required'],
    min: [0, 'Total cost cannot be negative']
  },
  costBreakdown: {
    type: costBreakdownSchema,
    required: true
  },
  shippingAddress: {
    type: shippingAddressSchema,
    required: [true, 'Shipping address is required']
  },
  trackingNumber: {
    type: String,
    trim: true
  },
  estimatedDelivery: Date,
  actualDelivery: Date,
  
  // Order lifecycle timestamps
  orderPlacedAt: { type: Date, default: Date.now },
  confirmedAt: Date,
  shippedAt: Date,
  deliveredAt: Date,
  cancelledAt: Date,
  
  // Cancellation details
  cancellationReason: String,
  cancelledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  
  // Status history
  statusHistory: [statusHistorySchema],
  
  // Additional fields
  notes: { type: String, maxlength: 500 },
  isGift: { type: Boolean, default: false },
  giftMessage: { type: String, maxlength: 200 }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for performance
orderSchema.index({ userId: 1, orderPlacedAt: -1 });
orderSchema.index({ orderStatus: 1, orderPlacedAt: -1 });
orderSchema.index({ 'products.product': 1 });

// Virtual for order age
orderSchema.virtual('orderAge').get(function() {
  return Math.floor((Date.now() - this.orderPlacedAt.getTime()) / (1000 * 60 * 60 * 24));
});

// Virtual for can be cancelled
orderSchema.virtual('canBeCancelled').get(function() {
  return ["pending", "confirmed"].includes(this.orderStatus);
});

// Pre-save middleware to update timestamps based on status
orderSchema.pre('save', function(next) {
  if (this.isModified('orderStatus')) {
    const now = new Date();
    switch (this.orderStatus) {
      case 'confirmed':
        if (!this.confirmedAt) this.confirmedAt = now;
        break;
      case 'shipped':
        if (!this.shippedAt) this.shippedAt = now;
        break;
      case 'delivered':
        if (!this.deliveredAt) this.deliveredAt = now;
        this.actualDelivery = now;
        break;
      case 'cancelled':
        if (!this.cancelledAt) this.cancelledAt = now;
        break;
    }
  }
  next();
});

// Static methods
orderSchema.statics.getOrdersByStatus = function(status, limit = 10) {
  return this.find({ orderStatus: status })
    .populate('userId', 'fullname email')
    .populate('products.product', 'productname productprice')
    .sort({ orderPlacedAt: -1 })
    .limit(limit);
};

orderSchema.statics.getUserOrderStats = async function(userId) {
  const stats = await this.aggregate([
    { $match: { userId: new mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalOrders: { $sum: 1 },
        totalSpent: { $sum: '$totalCost' },
        avgOrderValue: { $avg: '$totalCost' },
        statusBreakdown: {
          $push: '$orderStatus'
        }
      }
    }
  ]);
  
  if (stats.length === 0) {
    return {
      totalOrders: 0,
      totalSpent: 0,
      avgOrderValue: 0,
      statusBreakdown: {}
    };
  }
  
  const result = stats[0];
  const statusCount = {};
  result.statusBreakdown.forEach(status => {
    statusCount[status] = (statusCount[status] || 0) + 1;
  });
  result.statusBreakdown = statusCount;
  
  return result;
};

// Instance methods
orderSchema.methods.addStatusUpdate = function(status, updatedBy, note) {
  this.statusHistory.push({
    status,
    updatedAt: new Date(),
    updatedBy,
    note
  });
  this.orderStatus = status;
};

orderSchema.methods.calculateEstimatedDelivery = function() {
  if (!this.shippedAt) return null;
  
  // Default 7 days from shipping date
  const deliveryDays = 7;
  const estimatedDate = new Date(this.shippedAt);
  estimatedDate.setDate(estimatedDate.getDate() + deliveryDays);
  
  this.estimatedDelivery = estimatedDate;
  return estimatedDate;
};

export const Order = mongoose.model('Order', orderSchema);