import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1
  },
  priceAtAddition: {
    type: Number,
    required: true,
    min: 0
  }
}, { _id: false });

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
    index: true
  },
  items: {
    type: [cartItemSchema],
    default: []
  },
  totalPrice: {
    type: Number,
    default: 0,
    min: 0
  }
}, { timestamps: true });

cartSchema.pre("save", function(next) {
  this.totalPrice = this.items.reduce((acc, item) => {
    return acc + (item.quantity * item.priceAtAddition);
  }, 0);
  next();
});

cartSchema.methods.calculateTotal = function() {
  return this.items.reduce((acc, item) => acc + (item.quantity * item.priceAtAddition), 0);
};

export const Cart = mongoose.model("Cart", cartSchema);