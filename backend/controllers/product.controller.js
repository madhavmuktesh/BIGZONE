import { Product } from "../models/product.model.js";
import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

// Cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ===== Utilities =====
const validateObjectId = (id, fieldName = "ID") => {
  if (!mongoose.Types.ObjectId.isValid(id)) throw new Error(`Invalid ${fieldName}`);
};

const toFiniteNumber = (val) => {
  const n = typeof val === "string" && val.trim() === "" ? NaN : Number(val);
  return Number.isFinite(n) ? n : NaN;
};

const parseMaybeJSON = (val) => {
  if (val === undefined) return undefined;
  if (typeof val === "string") {
    try { return JSON.parse(val); } catch { return Symbol.for("JSON_ERROR"); }
  }
  return val;
};

const isNonEmptyString = (s) => typeof s === "string" && s.trim().length > 0;

const sanitizeTags = (tags) => {
  if (tags === undefined) return [];
  if (!Array.isArray(tags)) return Symbol.for("TAGS_SHAPE");
  const cleaned = tags.map(t => (typeof t === "string" ? t.trim().toLowerCase() : t))
    .filter(t => typeof t === "string" && t.length > 0 && t.length <= 20);
  if (cleaned.length !== tags.length) return Symbol.for("TAGS_SHAPE");
  return cleaned;
};

const validateStock = (stock) => {
  if (stock === undefined) return { quantity: 1 };
  if (typeof stock !== "object" || stock === null) return Symbol.for("STOCK_SHAPE");
  const q = toFiniteNumber(stock.quantity);
  if (!Number.isFinite(q) || q < 0) return Symbol.for("STOCK_SHAPE");
  return { quantity: q };
};

const handleCloudinaryUpload = async (file, folder = "products") => {
  try {
    const result = await cloudinary.uploader.upload(file.path, {
      folder,
      quality: "auto",
      fetch_format: "auto",
    });
    return { url: result.secure_url, public_id: result.public_id };
  } catch (e) {
    throw new Error(`Upload failed for ${file.originalname || file.path}: ${e.message}`);
  }
};

const deleteCloudinaryPublicIds = async (publicIds) => {
  const results = await Promise.allSettled(
    publicIds.map(pid => cloudinary.uploader.destroy(pid))
  );
  const succeeded = [];
  const failed = [];
  results.forEach((r, idx) => {
    if (r.status === "fulfilled" && r.value && (r.value.result === "ok" || r.value.result === "not found")) {
      succeeded.push(publicIds[idx]);
    } else {
      failed.push(publicIds[idx]);
    }
  });
  return { succeeded, failed };
};

const handleAsyncError = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// ===== Controllers =====

// CREATE SINGLE PRODUCT
export const createProduct = handleAsyncError(async (req, res) => {
  const { productname, productprice, originalPrice, productdescription, category, subcategory, specifications } = req.body;

  // ===== START: ADDED LOGS FOR DEBUGGING =====
  console.log("--- [DEBUG] Received createProduct request ---");
  console.log("Body:", req.body);
  console.log("Files:", req.files);
  console.log("-------------------------------------------");
  // ===== END: ADDED LOGS FOR DEBUGGING =====

  if (!isNonEmptyString(productname) || !isNonEmptyString(productdescription) || !isNonEmptyString(category)) {
    console.error("[DEBUG] Validation failed: Missing or invalid required fields.");
    return res.status(400).json({ success: false, message: "Missing or invalid required fields" });
  }
  if (!req.files || req.files.length === 0) {
    console.error("[DEBUG] Validation failed: At least one image is required.");
    return res.status(400).json({ success: false, message: "At least one image is required" });
  }
  if (req.files.length > 10) {
    console.error("[DEBUG] Validation failed: Maximum 10 images allowed.");
    return res.status(400).json({ success: false, message: "Maximum 10 images allowed" });
  }

  // Numbers
  const priceNum = toFiniteNumber(productprice);
  if (!Number.isFinite(priceNum) || priceNum < 0) {
    console.error("[DEBUG] Validation failed: Invalid product price.", { productprice });
    return res.status(400).json({ success: false, message: "Invalid product price" });
  }
  const origRaw = originalPrice ?? undefined;
  const origNum = origRaw === undefined ? undefined : toFiniteNumber(origRaw);
  if (origNum !== undefined && (!Number.isFinite(origNum) || origNum < priceNum)) {
    console.error("[DEBUG] Validation failed: Original price must be >= current price.");
    return res.status(400).json({ success: false, message: "Original price must be >= current price" });
  }

  // Tags
  const parsedTagsRaw = parseMaybeJSON(req.body.tags ?? undefined);
  if (parsedTagsRaw === Symbol.for("JSON_ERROR")) {
    console.error("[DEBUG] Validation failed: Invalid tags JSON.");
    return res.status(400).json({ success: false, message: "Invalid tags JSON" });
  }
  let parsedTags = sanitizeTags(parsedTagsRaw ?? []);
  if (parsedTags === Symbol.for("TAGS_SHAPE")) {
    console.error("[DEBUG] Validation failed: Tags shape is invalid.");
    return res.status(400).json({ success: false, message: "Tags must be non-empty strings up to 20 chars" });
  }
  if (req.role === "user" && !parsedTags.includes("usersold")) {
    parsedTags.push("usersold");
  }

  // Stock
  const stockRaw = parseMaybeJSON(req.body.stock ?? undefined);
  if (stockRaw === Symbol.for("JSON_ERROR")) {
    console.error("[DEBUG] Validation failed: Invalid stock JSON.");
    return res.status(400).json({ success: false, message: "Invalid stock JSON" });
  }
  const stock = validateStock(stockRaw);
  if (stock === Symbol.for("STOCK_SHAPE")) {
    console.error("[DEBUG] Validation failed: Stock shape is invalid.");
    return res.status(400).json({ success: false, message: "Invalid stock object" });
  }

  // Upload images
  const uploaded = [];
  try {
    for (const file of req.files) {
      uploaded.push(await handleCloudinaryUpload(file));
    }
  } catch (e) {
    if (uploaded.length) await deleteCloudinaryPublicIds(uploaded.map(i => i.public_id));
    return res.status(502).json({ success: false, message: e.message });
  }

  const newProduct = new Product({
    productname: productname.trim(),
    productprice: priceNum,
    originalPrice: origNum,
    productdescription: productdescription.trim(),
    category: category.trim(),
    subcategory: subcategory ? subcategory.trim() : undefined,
    tags: parsedTags,
    specifications: specifications ? (typeof specifications === "string" ? parseMaybeJSON(specifications) : specifications) : undefined,
    stock,
    createdBy: req.id,
    images: uploaded,
  });

  await newProduct.save();
  await newProduct.populate("createdBy", "username email");

  return res.status(201).json({ success: true, message: "Product created successfully", product: newProduct });
});

export const createMultipleProducts = handleAsyncError(async (req, res) => {
  let productsData;
  try {
    productsData = JSON.parse(req.body.products);
  } catch {
    return res.status(400).json({ success: false, message: "Invalid products JSON" });
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
    const product = productsData[i];
    try {
      if (!isNonEmptyString(product.productname) || !isNonEmptyString(product.productdescription) || !isNonEmptyString(product.category)) {
        throw new Error("Missing required fields");
      }
      const priceNum = toFiniteNumber(product.productprice);
      if (!Number.isFinite(priceNum) || priceNum < 0) throw new Error("Invalid product price");
      const origNum = product.originalPrice !== undefined && product.originalPrice !== null && product.originalPrice !== ""
        ? toFiniteNumber(product.originalPrice)
        : undefined;
      if (origNum !== undefined && (!Number.isFinite(origNum) || origNum < priceNum)) {
        throw new Error("Original price must be >= current price");
      }

      const productFiles = (req.files || []).filter(f => f.fieldname === `images_${i}`);
      if (!productFiles.length) throw new Error("At least one image is required");

      // tags/stock
      const pTags = sanitizeTags(product.tags ?? []);
      if (pTags === Symbol.for("TAGS_SHAPE")) throw new Error("Invalid tags");
      if (req.role === "user" && !pTags.includes("usersold")) pTags.push("usersold");
      const pStock = validateStock(product.stock);
      if (pStock === Symbol.for("STOCK_SHAPE")) throw new Error("Invalid stock");

      // upload images
      const uploadedImages = [];
      try {
        for (const file of productFiles) uploadedImages.push(await handleCloudinaryUpload(file));
      } catch (e) {
        if (uploadedImages.length) await deleteCloudinaryPublicIds(uploadedImages.map(i => i.public_id));
        throw e;
      }

      const newProd = await Product.create({
        productname: product.productname.trim(),
        productprice: priceNum,
        originalPrice: origNum,
        productdescription: product.productdescription.trim(),
        images: uploadedImages,
        category: product.category.trim(),
        subcategory: product.subcategory ? String(product.subcategory).trim() : undefined,
        tags: pTags,
        specifications: product.specifications || {},
        stock: pStock,
        createdBy: req.id,
      });

      uploadedProducts.push(newProd);
    } catch (error) {
      errors.push({ index: i, error: error.message });
    }
  }

  return res.status(201).json({ success: true, products: uploadedProducts, errors: errors.length ? errors : undefined });
}); [13][3]

export const getAllProducts = handleAsyncError(async (req, res) => {
  const products = await Product.find().populate("createdBy", "username email");
  return res.status(200).json({ success: true, products });
}); [3]

export const getSingleProduct = handleAsyncError(async (req, res) => {
  const { id } = req.params;
  validateObjectId(id, "product ID");

  const product = await Product.findById(id)
    .populate("createdBy", "username email")
    .populate("productreviews.user", "username");
  if (!product) return res.status(404).json({ success: false, message: "Product not found" });

  return res.status(200).json({ success: true, product });
}); [14][15]

export const getUserProducts = handleAsyncError(async (req, res) => {
  const { userId } = req.params;
  const { role, id: requesterId } = req;
  validateObjectId(userId, "user ID");

  if (role !== "admin" && requesterId !== userId) {
    return res.status(403).json({ success: false, message: "Not authorized to view these products" });
  }

  const products = await Product.find({ createdBy: userId }).populate("createdBy", "username email");
  return res.status(200).json({ success: true, products });
}); [3]

export const updateProduct = handleAsyncError(async (req, res) => {
  const { id } = req.params;
  const { role, id: userId } = req;
  validateObjectId(id, "product ID");

  const product = await Product.findById(id);
  if (!product) return res.status(404).json({ success: false, message: "Product not found" });
  if (role === "user" && product.createdBy.toString() !== userId) {
    return res.status(403).json({ success: false, message: "Not authorized" });
  }

  // Parse deleteImageIds if present (could be JSON string in multipart)
  let deleteImageIds = req.body.deleteImageIds;
  if (typeof deleteImageIds === "string") {
    try { deleteImageIds = JSON.parse(deleteImageIds); } catch { return res.status(400).json({ success: false, message: "Invalid deleteImageIds JSON" }); }
  }
  if (deleteImageIds && !Array.isArray(deleteImageIds)) {
    return res.status(400).json({ success: false, message: "deleteImageIds must be an array" });
  }

  // Delete requested images
  if (Array.isArray(deleteImageIds) && deleteImageIds.length > 0) {
    const { failed } = await deleteCloudinaryPublicIds(deleteImageIds);
    // Remove all requested from product regardless of Cloudinary result to avoid dangling references;
    // optionally, report failures
    product.images = product.images.filter(img => !deleteImageIds.includes(img.public_id));
    if (failed.length) {
      // Continue but inform the client which public_ids failed to delete upstream
      // Not a hard error since DB state is now consistent
    }
  }

  // Add new images if any
  if (req.files && req.files.length > 0) {
    if (product.images.length + req.files.length > 10) {
      return res.status(400).json({ success: false, message: "Maximum 10 images allowed" });
    }
    const newImgs = [];
    try {
      for (const file of req.files) newImgs.push(await handleCloudinaryUpload(file));
    } catch (e) {
      if (newImgs.length) await deleteCloudinaryPublicIds(newImgs.map(i => i.public_id));
      return res.status(502).json({ success: false, message: e.message });
    }
    product.images.push(...newImgs);
  }

  // Scalars
  if (req.body.productname !== undefined) {
    if (!isNonEmptyString(req.body.productname)) return res.status(400).json({ success: false, message: "Invalid product name" });
    product.productname = req.body.productname.trim();
  }
  if (req.body.productprice !== undefined) {
    const n = toFiniteNumber(req.body.productprice);
    if (!Number.isFinite(n) || n < 0) return res.status(400).json({ success: false, message: "Invalid product price" });
    product.productprice = n;
  }
  if (req.body.originalPrice !== undefined) {
    const val = req.body.originalPrice;
    const n = val === null || val === "" ? undefined : toFiniteNumber(val);
    if (n !== undefined) {
      if (!Number.isFinite(n) || (product.productprice !== undefined && n < product.productprice)) {
        return res.status(400).json({ success: false, message: "Original price must be >= current price" });
      }
      product.originalPrice = n;
    } else {
      product.originalPrice = undefined;
    }
  }
  if (req.body.productdescription !== undefined) {
    if (!isNonEmptyString(req.body.productdescription)) return res.status(400).json({ success: false, message: "Invalid description" });
    product.productdescription = req.body.productdescription.trim();
  }
  if (req.body.category !== undefined) {
    if (!isNonEmptyString(req.body.category)) return res.status(400).json({ success: false, message: "Invalid category" });
    product.category = req.body.category.trim();
  }
  if (req.body.subcategory !== undefined) {
    product.subcategory = req.body.subcategory ? String(req.body.subcategory).trim() : undefined;
  }

  // Tags & stock can be JSON strings
  if (req.body.tags !== undefined) {
    const tRaw = parseMaybeJSON(req.body.tags);
    if (tRaw === Symbol.for("JSON_ERROR")) return res.status(400).json({ success: false, message: "Invalid tags JSON" });
    const t = sanitizeTags(tRaw ?? []);
    if (t === Symbol.for("TAGS_SHAPE")) return res.status(400).json({ success: false, message: "Invalid tags" });
    product.tags = t;
  }
  if (req.body.stock !== undefined) {
    const sRaw = parseMaybeJSON(req.body.stock);
    if (sRaw === Symbol.for("JSON_ERROR")) return res.status(400).json({ success: false, message: "Invalid stock JSON" });
    const s = validateStock(sRaw);
    if (s === Symbol.for("STOCK_SHAPE")) return res.status(400).json({ success: false, message: "Invalid stock" });
    product.stock = s;
  }

  await product.save();
  await product.populate("createdBy", "username email");
  return res.status(200).json({ success: true, message: "Product updated successfully", product });
}); [13][3]

export const deleteProduct = handleAsyncError(async (req, res) => {
  const { id } = req.params;
  const { role, id: userId } = req;
  validateObjectId(id, "product ID");

  const product = await Product.findById(id);
  if (!product) return res.status(404).json({ success: false, message: "Product not found" });
  if (role === "user" && product.createdBy.toString() !== userId) {
    return res.status(403).json({ success: false, message: "Not authorized" });
  }

  // Attempt to delete images upstream; continue regardless to keep DB consistent
  if (product.images?.length) {
    await deleteCloudinaryPublicIds(product.images.map(i => i.public_id));
  }
  await Product.findByIdAndDelete(id);

  return res.status(200).json({ success: true, message: "Product deleted successfully" });
}); [13][3]

// ==== Reviews ====

// ADD PRODUCT REVIEW
export const addProductReview = handleAsyncError(async (req, res) => {
  const { id } = req.params;
  const userId = req.id;
  const { review, rating } = req.body;

  validateObjectId(id, "product ID");

  const ratingNum = toFiniteNumber(rating);
  if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    return res.status(400).json({ success: false, message: "Rating must be an integer between 1 and 5" });
  }
  if (!isNonEmptyString(review) || review.trim().length < 10) {
    return res.status(400).json({ success: false, message: "Review must be at least 10 characters" });
  }

  const product = await Product.findById(id);
  if (!product) return res.status(404).json({ success: false, message: "Product not found" });
  const exists = product.productreviews.some(r => r.user.toString() === userId);
  if (exists) return res.status(400).json({ success: false, message: "Already reviewed" });

  product.productreviews.push({
    review: review.trim(),
    rating: ratingNum,
    user: userId,
    // createdAt/updatedAt are handled by subdocument timestamps in the model
  });

  product.calculateReviewStats();
  await product.save();
  await product.populate("productreviews.user", "username");

  return res.status(200).json({ success: true, message: "Review added", product });
}); [9][3]

export const updateProductReview = handleAsyncError(async (req, res) => {
  const { id, reviewId } = req.params;
  const userId = req.id;
  validateObjectId(id, "product ID");
  validateObjectId(reviewId, "review ID");

  const product = await Product.findById(id);
  if (!product) return res.status(404).json({ success: false, message: "Product not found" });

  const review = product.productreviews.find(r => r._id.toString() === reviewId && r.user.toString() === userId);
  if (!review) return res.status(403).json({ success: false, message: "Review not found or not authorized" });

  if (req.body.rating !== undefined) {
    const ratingNum = toFiniteNumber(req.body.rating);
    if (!Number.isInteger(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      return res.status(400).json({ success: false, message: "Rating must be an integer between 1 and 5" });
    }
    review.rating = ratingNum;
  }
  if (req.body.review !== undefined) {
    if (!isNonEmptyString(req.body.review) || req.body.review.trim().length < 10) {
      return res.status(400).json({ success: false, message: "Review must be at least 10 characters" });
    }
    review.review = req.body.review.trim();
  }
  // updatedAt auto-managed by subdoc timestamps

  product.calculateReviewStats();
  await product.save();
  await product.populate("productreviews.user", "username");

  return res.status(200).json({ success: true, message: "Review updated", product });
}); [9][3]

export const deleteProductReview = handleAsyncError(async (req, res) => {
  const { id, reviewId } = req.params;
  const { role, id: userId } = req;
  validateObjectId(id, "product ID");
  validateObjectId(reviewId, "review ID");

  const product = await Product.findById(id);
  if (!product) return res.status(404).json({ success: false, message: "Product not found" });

  const idx = product.productreviews.findIndex(r => r._id.toString() === reviewId);
  if (idx === -1) return res.status(404).json({ success: false, message: "Review not found" });

  if (role !== "admin" && product.productreviews[idx].user.toString() !== userId) {
    return res.status(403).json({ success: false, message: "Not authorized" });
  }

  product.productreviews.splice(idx, 1);
  product.calculateReviewStats();
  await product.save();

  return res.status(200).json({ success: true, message: "Review deleted", product });
}); [3]

// MARK REVIEW HELPFUL (atomic, idempotent)
export const markReviewHelpful = handleAsyncError(async (req, res) => {
  const { id, reviewId } = req.params;
  const userId = req.id;
  validateObjectId(id, "product ID");
  validateObjectId(reviewId, "review ID");

  // Atomically add user to helpfulUsers and increment count only if not already present
  const updated = await Product.findOneAndUpdate(
    {
      _id: id,
      "productreviews._id": reviewId,
      "productreviews.helpfulUsers": { $ne: userId },
    },
    {
      $addToSet: { "productreviews.$.helpfulUsers": userId },
      $inc: { "productreviews.$.helpfulCount": 1 },
    },
    { new: true }
  ).populate("productreviews.user", "username");

  if (!updated) {
    // Either review not found or already voted
    // To give accurate feedback, try to check existence
    const exists = await Product.exists({ _id: id, "productreviews._id": reviewId });
    if (!exists) return res.status(404).json({ success: false, message: "Review not found" });
    return res.status(200).json({ success: true, message: "Already marked helpful" });
  }

  const review = updated.productreviews.find(r => r._id.toString() === reviewId);
  return res.status(200).json({ success: true, helpfulCount: review.helpfulCount });
}); [4][3]

// ==== Error handler ====
export const handleProductErrors = (error, req, res, next) => {
  console.error("Product Controller Error:", error);
  if (error.name === "ValidationError") {
    const messages = Object.values(error.errors).map(err => err.message);
    return res.status(400).json({ success: false, message: "Validation Error", errors: messages });
  }
  if (error.name === "CastError") {
    return res.status(400).json({ success: false, message: "Invalid ID format" });
  }
  return res.status(500).json({ success: false, message: "Internal server error" });
};

// --- SEARCH PRODUCTS ---
export const searchProducts = handleAsyncError(async (req, res) => {
  const { query } = req.query;

  if (!query || query.trim().length === 0) {
    return res.status(400).json({ success: false, message: "Search query is required" });
  }

  // Text search using MongoDB indexes
  const products = await Product.find(
    { $text: { $search: query } },   // <-- do NOT use ID validation here
    { score: { $meta: "textScore" } }
  )
    .sort({ score: { $meta: "textScore" } })
    .populate("createdBy", "username email");

  return res.status(200).json({ success: true, count: products.length, products });
});
