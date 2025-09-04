import { Product } from "../models/product.model.js";
import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ==== Utility Functions ====
const handleCloudinaryUpload = async (file, folder = "products") => {
  try {
    const result = await cloudinary.uploader.upload(file.path, {
      folder,
      quality: "auto",
      fetch_format: "auto",
      transformation: [
        { width: 1000, height: 1000, crop: "limit" },
        { quality: "auto:good" }
      ]
    });
    return {
      url: result.secure_url,
      public_id: result.public_id,
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Image upload failed');
  }
};

const validateObjectId = (id, fieldName = "ID") => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error(`Invalid ${fieldName}`);
  }
};

const validatePrice = (price, fieldName = "price") => {
  const numPrice = parseFloat(price);
  if (!numPrice || numPrice <= 0 || numPrice > 999999) {
    throw new Error(`${fieldName} must be between 0.01 and 999999`);
  }
  return numPrice;
};

// Async error wrapper
const handleAsyncError = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// ==== CRUD OPERATIONS ====

// CREATE SINGLE PRODUCT
export const createProduct = handleAsyncError(async (req, res) => {
  const { 
    productname, 
    productprice, 
    originalPrice, 
    productdescription, 
    category, 
    subcategory, 
    tags, 
    specifications, 
    stock 
  } = req.body;

  // Input validation
  if (!productname?.trim()) {
    return res.status(400).json({ success: false, message: "Product name is required" });
  }
  if (!productprice) {
    return res.status(400).json({ success: false, message: "Product price is required" });
  }
  if (!productdescription?.trim()) {
    return res.status(400).json({ success: false, message: "Product description is required" });
  }
  if (!category) {
    return res.status(400).json({ success: false, message: "Category is required" });
  }

  // Validate price
  let validatedPrice, validatedOriginalPrice;
  try {
    validatedPrice = validatePrice(productprice, "Product price");
    if (originalPrice) {
      validatedOriginalPrice = validatePrice(originalPrice, "Original price");
      if (validatedOriginalPrice < validatedPrice) {
        return res.status(400).json({ 
          success: false, 
          message: "Original price must be greater than or equal to current price" 
        });
      }
    }
  } catch (error) {
    return res.status(400).json({ success: false, message: error.message });
  }

  // Image validation
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ success: false, message: "At least one image is required" });
  }
  if (req.files.length > 10) {
    return res.status(400).json({ success: false, message: "Maximum 10 images allowed" });
  }

  // Upload images
  const images = await Promise.all(
    req.files.map(file => handleCloudinaryUpload(file))
  );

  // Parse and validate tags
  let parsedTags = [];
  if (tags) {
    try {
      parsedTags = typeof tags === "string" ? JSON.parse(tags) : tags;
      if (!Array.isArray(parsedTags)) {
        return res.status(400).json({ success: false, message: "Tags must be an array" });
      }
      // Limit tags
      parsedTags = parsedTags.slice(0, 10).map(tag => tag.toString().trim().toLowerCase());
    } catch {
      return res.status(400).json({ success: false, message: "Invalid tags format" });
    }
  }

  // Auto-add user sold tag
  if (req.role === "user" && !parsedTags.includes("usersold")) {
    parsedTags.push("usersold");
  }

  // Parse stock
  let parsedStock = { quantity: 1 };
  if (stock) {
    try {
      parsedStock = typeof stock === "string" ? JSON.parse(stock) : stock;
      if (parsedStock.quantity < 0 || parsedStock.quantity > 999999) {
        return res.status(400).json({ 
          success: false, 
          message: "Stock quantity must be between 0 and 999999" 
        });
      }
    } catch {
      return res.status(400).json({ success: false, message: "Invalid stock format" });
    }
  }

  const newProduct = new Product({
    productname: productname.trim(),
    productprice: validatedPrice,
    originalPrice: validatedOriginalPrice,
    productdescription: productdescription.trim(),
    category,
    subcategory: subcategory?.trim(),
    tags: parsedTags,
    specifications,
    stock: parsedStock,
    createdBy: req.id,
    images,
  });

  await newProduct.save();
  await newProduct.populate("createdBy", "fullname email");

  res.status(201).json({ 
    success: true, 
    message: "Product created successfully", 
    product: newProduct 
  });
});

// CREATE MULTIPLE PRODUCTS
export const createMultipleProducts = handleAsyncError(async (req, res) => {
  let productsData;
  try {
    productsData = JSON.parse(req.body.products);
  } catch {
    return res.status(400).json({ success: false, message: "Invalid products JSON format" });
  }

  if (!Array.isArray(productsData) || productsData.length === 0) {
    return res.status(400).json({ success: false, message: "Products must be a non-empty array" });
  }
  if (productsData.length > 50) {
    return res.status(400).json({ success: false, message: "Maximum 50 products at a time" });
  }

  const uploadedProducts = [];
  const errors = [];

  for (let i = 0; i < productsData.length; i++) {
    try {
      const product = productsData[i];
      
      // Validate required fields
      if (!product.productname || !product.productprice || !product.productdescription || !product.category) {
        errors.push({ index: i, error: "Missing required fields" });
        continue;
      }

      // Validate price
      const validatedPrice = validatePrice(product.productprice);

      const productFiles = req.files.filter(file => file.fieldname === `images_${i}`);
      if (productFiles.length === 0) {
        errors.push({ index: i, error: "At least one image is required" });
        continue;
      }

      const uploadedImages = await Promise.all(
        productFiles.map(file => handleCloudinaryUpload(file))
      );

      let pTags = product.tags || [];
      if (req.role === "user" && !pTags.includes("usersold")) pTags.push("usersold");

      const newProd = await Product.create({
        productname: product.productname.trim(),
        productprice: validatedPrice,
        originalPrice: product.originalPrice ? validatePrice(product.originalPrice) : undefined,
        productdescription: product.productdescription.trim(),
        images: uploadedImages,
        category: product.category,
        subcategory: product.subcategory,
        tags: pTags,
        specifications: product.specifications || {},
        stock: product.stock || { quantity: 1 },
        createdBy: req.id,
      });

      uploadedProducts.push(newProd);
    } catch (error) {
      errors.push({ index: i, error: error.message });
    }
  }

  res.status(201).json({ 
    success: true, 
    products: uploadedProducts, 
    errors: errors.length ? errors : undefined,
    summary: {
      successful: uploadedProducts.length,
      failed: errors.length,
      total: productsData.length
    }
  });
});

// GET ALL PRODUCTS with filtering and pagination
export const getAllProducts = handleAsyncError(async (req, res) => {
  const {
    page = 1,
    limit = 20,
    category,
    minPrice,
    maxPrice,
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    inStock
  } = req.query;

  // Build filter object
  const filter = {};
  if (category) filter.category = category;
  if (minPrice || maxPrice) {
    filter.productprice = {};
    if (minPrice) filter.productprice.$gte = parseFloat(minPrice);
    if (maxPrice) filter.productprice.$lte = parseFloat(maxPrice);
  }
  if (search) {
    filter.$text = { $search: search };
  }
  if (inStock === 'true') {
    filter['stock.quantity'] = { $gt: 0 };
  }

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

  const pageNumber = Math.max(1, parseInt(page));
  const pageSize = Math.min(50, Math.max(1, parseInt(limit)));
  const skip = (pageNumber - 1) * pageSize;

  const [products, totalCount] = await Promise.all([
    Product.find(filter)
      .populate("createdBy", "fullname email")
      .sort(sort)
      .skip(skip)
      .limit(pageSize)
      .lean(),
    Product.countDocuments(filter)
  ]);

  const totalPages = Math.ceil(totalCount / pageSize);

  res.status(200).json({ 
    success: true, 
    products,
    pagination: {
      currentPage: pageNumber,
      totalPages,
      totalProducts: totalCount,
      hasNextPage: pageNumber < totalPages,
      hasPrevPage: pageNumber > 1
    }
  });
});

// GET SINGLE PRODUCT
export const getSingleProduct = handleAsyncError(async (req, res) => {
  const { id } = req.params;
  validateObjectId(id, "product ID");

  const product = await Product.findById(id)
    .populate("createdBy", "fullname email")
    .populate("productreviews.user", "fullname");
    
  if (!product) {
    return res.status(404).json({ success: false, message: "Product not found" });
  }

  res.status(200).json({ success: true, product });
});

// GET PRODUCTS BY USER
export const getUserProducts = handleAsyncError(async (req, res) => {
  const { userId } = req.params;
  const { role, id: requesterId } = req;

  validateObjectId(userId, "user ID");

  if (role !== "admin" && requesterId !== userId) {
    return res.status(403).json({ success: false, message: "Not authorized to view these products" });
  }

  const products = await Product.find({ createdBy: userId })
    .populate("createdBy", "fullname email")
    .sort({ createdAt: -1 });

  res.status(200).json({ success: true, products, count: products.length });
});

// UPDATE PRODUCT
export const updateProduct = handleAsyncError(async (req, res) => {
  const { id } = req.params;
  const { role, id: userId } = req;
  const { 
    productname, 
    productprice, 
    originalPrice, 
    productdescription, 
    category, 
    subcategory, 
    tags, 
    stock, 
    deleteImageIds 
  } = req.body;

  validateObjectId(id, "product ID");

  const product = await Product.findById(id);
  if (!product) {
    return res.status(404).json({ success: false, message: "Product not found" });
  }

  if (role === "user" && product.createdBy.toString() !== userId) {
    return res.status(403).json({ success: false, message: "Not authorized" });
  }

  // Handle image deletions
  if (Array.isArray(deleteImageIds) && deleteImageIds.length > 0) {
    const deletePromises = [];
    product.images = product.images.filter(img => {
      if (deleteImageIds.includes(img.public_id)) {
        deletePromises.push(
          cloudinary.uploader.destroy(img.public_id).catch(console.error)
        );
        return false;
      }
      return true;
    });
    await Promise.all(deletePromises);
  }

  // Add new images
  if (req.files && req.files.length > 0) {
    const newImgs = await Promise.all(
      req.files.map(file => handleCloudinaryUpload(file))
    );
    product.images.push(...newImgs);
  }

  // Ensure at least one image remains
  if (product.images.length === 0) {
    return res.status(400).json({ 
      success: false, 
      message: "Product must have at least one image" 
    });
  }

  // Update fields
  if (productname) product.productname = productname.trim();
  if (productprice) product.productprice = validatePrice(productprice);
  if (originalPrice !== undefined) {
    product.originalPrice = originalPrice ? validatePrice(originalPrice) : null;
  }
  if (productdescription) product.productdescription = productdescription.trim();
  if (category) product.category = category;
  if (subcategory !== undefined) product.subcategory = subcategory.trim();

  // Handle JSON fields
  try {
    if (tags) {
      product.tags = typeof tags === "string" ? JSON.parse(tags) : tags;
    }
    if (stock) {
      product.stock = typeof stock === "string" ? JSON.parse(stock) : stock;
    }
  } catch {
    return res.status(400).json({ success: false, message: "Invalid JSON in tags or stock" });
  }

  await product.save();
  res.status(200).json({ success: true, message: "Product updated successfully", product });
});

// DELETE PRODUCT
export const deleteProduct = handleAsyncError(async (req, res) => {
  const { id } = req.params;
  const { role, id: userId } = req;

  validateObjectId(id, "product ID");

  const product = await Product.findById(id);
  if (!product) {
    return res.status(404).json({ success: false, message: "Product not found" });
  }

  if (role === "user" && product.createdBy.toString() !== userId) {
    return res.status(403).json({ success: false, message: "Not authorized" });
  }

  // Delete images from Cloudinary
  await Promise.all(
    product.images.map(image => 
      cloudinary.uploader.destroy(image.public_id).catch(console.error)
    )
  );

  await Product.findByIdAndDelete(id);

  res.status(200).json({ success: true, message: "Product deleted successfully" });
});

// ==== REVIEW FUNCTIONS ====

// ADD PRODUCT REVIEW
export const addProductReview = handleAsyncError(async (req, res) => {
  const { id } = req.params;
  const { review, rating } = req.body;
  const userId = req.id;

  validateObjectId(id, "product ID");

  if (!rating || rating < 1 || rating > 5 || !Number.isInteger(Number(rating))) {
    return res.status(400).json({ success: false, message: "Rating must be an integer between 1 and 5" });
  }
  if (!review || review.trim().length < 10) {
    return res.status(400).json({ success: false, message: "Review must be at least 10 characters" });
  }

  const product = await Product.findById(id);
  if (!product) {
    return res.status(404).json({ success: false, message: "Product not found" });
  }

  const existingReview = product.productreviews.find(r => r.user.toString() === userId);
  if (existingReview) {
    return res.status(400).json({ success: false, message: "You have already reviewed this product" });
  }

  const newReview = {
    review: review.trim(),
    rating: parseInt(rating),
    user: userId,
    createdAt: new Date(),
    updatedAt: new Date()
  };

  product.productreviews.push(newReview);
  product.calculateReviewStats();
  await product.save();
  await product.populate("productreviews.user", "fullname");

  res.status(200).json({ success: true, message: "Review added", product });
});

// UPDATE PRODUCT REVIEW
export const updateProductReview = handleAsyncError(async (req, res) => {
  const { id, reviewId } = req.params;
  const { review, rating } = req.body;
  const userId = req.id;

  validateObjectId(id, "product ID");
  validateObjectId(reviewId, "review ID");

  const product = await Product.findById(id);
  if (!product) {
    return res.status(404).json({ success: false, message: "Product not found" });
  }

  const reviewObj = product.productreviews.find(r => 
    r._id.toString() === reviewId && r.user.toString() === userId
  );
  if (!reviewObj) {
    return res.status(403).json({ success: false, message: "Review not found or not authorized" });
  }

  if (rating && (rating < 1 || rating > 5 || !Number.isInteger(Number(rating)))) {
    return res.status(400).json({ success: false, message: "Rating must be an integer between 1 and 5" });
  }
  if (review && review.trim().length < 10) {
    return res.status(400).json({ success: false, message: "Review must be at least 10 characters" });
  }

  if (review) reviewObj.review = review.trim();
  if (rating) reviewObj.rating = parseInt(rating);
  reviewObj.updatedAt = new Date();

  product.calculateReviewStats();
  await product.save();

  res.status(200).json({ success: true, message: "Review updated", product });
});

// DELETE PRODUCT REVIEW
export const deleteProductReview = handleAsyncError(async (req, res) => {
  const { id, reviewId } = req.params;
  const { role, id: userId } = req;

  validateObjectId(id, "product ID");
  validateObjectId(reviewId, "review ID");

  const product = await Product.findById(id);
  if (!product) {
    return res.status(404).json({ success: false, message: "Product not found" });
  }

  const reviewIndex = product.productreviews.findIndex(r => r._id.toString() === reviewId);
  if (reviewIndex === -1) {
    return res.status(404).json({ success: false, message: "Review not found" });
  }

  const review = product.productreviews[reviewIndex];
  if (role !== "admin" && review.user.toString() !== userId) {
    return res.status(403).json({ success: false, message: "Not authorized" });
  }

  product.productreviews.splice(reviewIndex, 1);
  product.calculateReviewStats();
  await product.save();

  res.status(200).json({ success: true, message: "Review deleted", product });
});

// MARK REVIEW HELPFUL
export const markReviewHelpful = handleAsyncError(async (req, res) => {
  const { id, reviewId } = req.params;

  validateObjectId(id, "product ID");
  validateObjectId(reviewId, "review ID");

  const product = await Product.findById(id);
  if (!product) {
    return res.status(404).json({ success: false, message: "Product not found" });
  }

  const review = product.productreviews.find(r => r._id.toString() === reviewId);
  if (!review) {
    return res.status(404).json({ success: false, message: "Review not found" });
  }

  review.helpfulCount += 1;
  await product.save();

  res.status(200).json({ success: true, helpfulCount: review.helpfulCount });
});

// ==== ERROR HANDLER ====
export const handleProductErrors = (error, req, res, next) => {
  console.error("Product Controller Error:", error);
  
  if (error.name === "ValidationError") {
    const messages = Object.values(error.errors).map(err => err.message);
    return res.status(400).json({ 
      success: false, 
      message: "Validation Error", 
      errors: messages 
    });
  }
  
  if (error.name === "CastError") {
    return res.status(400).json({ success: false, message: "Invalid ID format" });
  }
  
  if (error.code === 11000) {
    return res.status(400).json({ success: false, message: "Duplicate entry" });
  }
  
  res.status(500).json({ success: false, message: "Internal server error" });
};