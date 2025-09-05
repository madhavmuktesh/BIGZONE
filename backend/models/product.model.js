import mongoose from "mongoose";
import slugify from "slugify";
import { nanoid } from "nanoid";

// ===== IMAGE SCHEMA =====
const imageSchema = new mongoose.Schema({
  url: {
    type: String,
    required: [true, "Image URL is required"],
    validate: {
      validator: v => /^https?:\/\/.+\.(jpg|jpeg|png|webp|gif)$/i.test(v),
      message: "Please provide a valid image URL"
    }
  },
  public_id: {
    type: String,
    required: [true, "Image public_id is required"]
  }
}, { _id: false });

// ===== REVIEW SCHEMA ===== (unchanged)
const reviewSchema = new mongoose.Schema({
  review: {
    type: String,
    required: [true, "Review text is required"],
    minlength: [10, "Review must be at least 10 characters long"],
    maxlength: [1000, "Review cannot exceed 1000 characters"]
  },
  rating: {
    type: Number,
    required: [true, "Rating is required"],
    min: [1, "Rating must be at least 1"],
    max: [5, "Rating cannot exceed 5"],
    validate: {
      validator: Number.isInteger,
      message: "Rating must be a whole number"
    }
  },
  images: [imageSchema],
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "User reference is required"]
  },
  helpfulCount: { type: Number, default: 0 },
  helpfulUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  isVerified: { type: Boolean, default: false }
}, {
  timestamps: true
});

// ===== ENHANCED PRODUCT SCHEMA =====
const productSchema = new mongoose.Schema({
  productname: {
    type: String,
    required: [true, "Product name is required"],
    trim: true,
    minlength: [3, "Product name must be at least 3 characters long"],
    maxlength: [100, "Product name cannot exceed 100 characters"],
  },
  slug: {
    type: String,
    unique: true,
    index: true
  },
  sku: {
    type: String,
    unique: true,
    required: true,
    default: () => nanoid(10).toUpperCase()
  },
  productprice: {
    type: Number,
    required: [true, "Product price is required"],
    min: [0, "Product price cannot be negative"],
  },
  originalPrice: {
    type: Number,
    validate: {
      validator: function (v) {
        return !v || (v >= this.productprice);
      },
      message: "Original price should be greater than or equal to current price"
    }
  },
  productdescription: {
    type: String,
    required: [true, "Product description is required"],
    trim: true,
    minlength: [10, "Product description must be at least 10 characters long"],
  },
  images: {
    type: [imageSchema],
    validate: {
      validator: v => Array.isArray(v) && v.length > 0 && v.length <= 10,
      message: "Product must have between 1 and 10 images"
    }
  },
  specifications: {
    brand: { type: String, trim: true, maxlength: 50 },
    model: { type: String, trim: true, maxlength: 50 },
    color: { type: String, trim: true, maxlength: 30 },
    weight: { type: Number, min: 0 },
    dimensions: {
      length: { type: Number, min: 0 },
      width: { type: Number, min: 0 },
      height: { type: Number, min: 0 }
    },
    warranty: { type: String, maxlength: 100 }
  },
  productreviews: [reviewSchema],
  reviewStats: {
    averageRating: { type: Number, default: 0, min: 0, max: 5 },
    totalReviews: { type: Number, default: 0, min: 0 },
    ratingDistribution: {
      '5': { type: Number, default: 0 },
      '4': { type: Number, default: 0 },
      '3': { type: Number, default: 0 },
      '2': { type: Number, default: 0 },
      '1': { type: Number, default: 0 }
    }
  },
  category: {
    type: String,
    required: [true, "Category is required"],
    enum: {
      values: [
        "Smartphones", "Electronics", "Clothing", "Books", "Home & Kitchen",
        "Beauty", "Sports", "Toys", "Automotive", "Health", "Jewelry", "Others"
      ],
      message: "Please select a valid category"
    },
    default: "Others"
  },
  subcategory: { type: String, trim: true, maxlength: 50 },
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
    maxlength: 20,
    validate: {
      validator: v => v.trim() !== "",
      message: "Tags cannot be empty strings"
    }
  }],
  stock: {
    quantity: { type: Number, default: 1, min: 0 }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: [true, "Creator reference is required"],
    index: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ===== PRE-SAVE HOOK =====
productSchema.pre('save', function(next) {
    if (this.isModified('productname')) {
        this.slug = slugify(this.productname, { lower: true, strict: true, trim: true });
    }
    next();
});

// ===== ENHANCED INDEXES FOR COMPREHENSIVE SEARCH =====

// 🔥 MAIN TEXT INDEX - includes all searchable fields
productSchema.index({
  productname: "text",
  productdescription: "text",
  category: "text",
  subcategory: "text",
  "specifications.brand": "text",
  "specifications.model": "text",
  "specifications.color": "text",
  tags: "text"
}, {
  name: "comprehensive_text_search",
  weights: {
    productname: 10,        // Highest weight for product name
    "specifications.brand": 8,  // High weight for brand
    category: 6,            // Medium-high weight for category
    subcategory: 5,         // Medium weight for subcategory
    "specifications.model": 4,  // Medium weight for model
    tags: 3,               // Lower weight for tags
    productdescription: 2,  // Lower weight for description
    "specifications.color": 1   // Lowest weight for color
  }
});

// 🔥 INDIVIDUAL FIELD INDEXES for regex searches
productSchema.index({ category: 1 });
productSchema.index({ subcategory: 1 });
productSchema.index({ "specifications.brand": 1 });
productSchema.index({ "specifications.model": 1 });
productSchema.index({ tags: 1 });

// 🔥 COMPOUND INDEXES for common search patterns
productSchema.index({ category: 1, subcategory: 1 });
productSchema.index({ "specifications.brand": 1, category: 1 });
productSchema.index({ productprice: 1, category: 1 });

// ===== VIRTUALS ===== (unchanged)
productSchema.virtual("isInStock").get(function () {
  return this.stock.quantity > 0;
});

productSchema.virtual("discountPercentage").get(function () {
  if (!this.originalPrice || this.originalPrice === 0 || this.originalPrice <= this.productprice) {
    return 0;
  }
  return Math.round(((this.originalPrice - this.productprice) / this.originalPrice) * 100);
});

// ===== METHODS ===== (unchanged)
productSchema.methods.calculateReviewStats = function () {
  const reviews = this.productreviews;
  const totalReviews = reviews.length;
  if (totalReviews === 0) {
    this.reviewStats = {
      averageRating: 0,
      totalReviews: 0,
      ratingDistribution: { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 }
    };
    return;
  }
  const ratingSum = reviews.reduce((sum, review) => sum + review.rating, 0);
  const averageRating = Math.round((ratingSum / totalReviews) * 10) / 10;
  const ratingDistribution = { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 };
  reviews.forEach(r => {
    if (ratingDistribution.hasOwnProperty(r.rating)) {
        ratingDistribution[r.rating]++;
    }
  });
  this.reviewStats = { averageRating, totalReviews, ratingDistribution };
};

export const Product = mongoose.model("Product", productSchema);
