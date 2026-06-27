import { Product } from "../models/product.model.js";
import mongoose from "mongoose";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";
import { getEcoScoresForProduct } from "../services/geminiService.js";

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

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
    try {
      return JSON.parse(val);
    } catch {
      return Symbol.for("JSON_ERROR");
    }
  }
  return val;
};

const isNonEmptyString = (s) => typeof s === "string" && s.trim().length > 0;

const sanitizeTags = (tags) => {
  if (tags === undefined) return [];
  if (!Array.isArray(tags)) return Symbol.for("TAGS_SHAPE");

  const cleaned = tags
    .map((t) => (typeof t === "string" ? t.trim().toLowerCase() : t))
    .filter((t) => typeof t === "string" && t.length > 0 && t.length <= 20);

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

const deleteCloudinaryPublicIds = async (publicIds = []) => {
  const results = await Promise.allSettled(publicIds.map((pid) => cloudinary.uploader.destroy(pid)));
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

const isOwnerOrAdmin = (req, ownerId) => req.role === "admin" || req.id?.toString() === ownerId?.toString();

export const createProduct = handleAsyncError(async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ success: false, message: "At least one image is required" });
  }

  if (req.files.length > 10) {
    return res.status(400).json({ success: false, message: "Maximum 10 images allowed" });
  }

  const tagsRaw = parseMaybeJSON(req.body.tags ?? "[]");
  const stockRaw = parseMaybeJSON(req.body.stock ?? "{}");
  const specificationsRaw = parseMaybeJSON(req.body.specifications ?? "{}");

  if ([tagsRaw, stockRaw, specificationsRaw].includes(Symbol.for("JSON_ERROR"))) {
    return res.status(400).json({ success: false, message: "Invalid JSON in request body" });
  }

  const tags = sanitizeTags(tagsRaw ?? []);
  const stock = validateStock(stockRaw ?? {});
  const specifications = specificationsRaw ?? {};

  if (tags === Symbol.for("TAGS_SHAPE")) {
    return res.status(400).json({ success: false, message: "Invalid tags" });
  }

  if (stock === Symbol.for("STOCK_SHAPE")) {
    return res.status(400).json({ success: false, message: "Invalid stock" });
  }

  let uploadedImages = [];

  try {
    uploadedImages = await Promise.all(req.files.map((file) => handleCloudinaryUpload(file)));
  } catch (error) {
    if (uploadedImages.length > 0) {
      await deleteCloudinaryPublicIds(uploadedImages.map((img) => img.public_id));
    }
    throw new Error(`Image upload failed: ${error.message}`);
  }

  const newProduct = new Product({
    ...req.body,
    tags,
    stock,
    specifications,
    images: uploadedImages,
    createdBy: req.id,
  });

  try {
    const ecoData = await getEcoScoresForProduct(newProduct);
    if (ecoData) {
      newProduct.ecoScore = ecoData.ecoScore;
      newProduct.co2SavedKg = ecoData.co2SavedKg;
      newProduct.ecoAnalysisJustification = ecoData.justification;
    }
  } catch (error) {
    console.error("Eco-score generation failed during product creation:", error.message);
  }

  await newProduct.save();
  await newProduct.populate("createdBy", "username email fullname");

  return res.status(201).json({
    success: true,
    message: "Product created successfully",
    product: newProduct,
  });
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
    return res.status(400).json({ success: false, message: "Maximum 50 products allowed per request" });
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
      if (!Number.isFinite(priceNum) || priceNum < 0) {
        throw new Error("Invalid product price");
      }

      const originalPrice = product.originalPrice !== undefined && product.originalPrice !== null && product.originalPrice !== ""
        ? toFiniteNumber(product.originalPrice)
        : undefined;

      if (originalPrice !== undefined && (!Number.isFinite(originalPrice) || originalPrice < priceNum)) {
        throw new Error("Original price must be greater than or equal to current price");
      }

      const productFiles = (req.files || []).filter((file) => file.fieldname === `images_${i}`);
      if (!productFiles.length) {
        throw new Error("At least one image is required");
      }

      const tags = sanitizeTags(product.tags ?? []);
      if (tags === Symbol.for("TAGS_SHAPE")) {
        throw new Error("Invalid tags");
      }

      if (req.role === "user" && !tags.includes("usersold")) {
        tags.push("usersold");
      }

      const stock = validateStock(product.stock);
      if (stock === Symbol.for("STOCK_SHAPE")) {
        throw new Error("Invalid stock");
      }

      const uploadedImages = [];
      try {
        for (const file of productFiles) {
          const image = await handleCloudinaryUpload(file);
          uploadedImages.push(image);
        }
      } catch (error) {
        if (uploadedImages.length > 0) {
          await deleteCloudinaryPublicIds(uploadedImages.map((img) => img.public_id));
        }
        throw new Error(`Image upload failed: ${error.message}`);
      }

      const productData = {
        productname: product.productname.trim(),
        productprice: priceNum,
        originalPrice,
        productdescription: product.productdescription.trim(),
        images: uploadedImages,
        category: product.category.trim(),
        subcategory: product.subcategory ? String(product.subcategory).trim() : undefined,
        tags,
        specifications: product.specifications || {},
        stock,
        createdBy: req.id,
      };

      try {
        const ecoData = await getEcoScoresForProduct(productData);
        if (ecoData) {
          productData.ecoScore = ecoData.ecoScore;
          productData.co2SavedKg = ecoData.co2SavedKg;
          productData.ecoAnalysisJustification = ecoData.justification;
        }
      } catch (error) {
        console.error(`Eco-score generation failed for product ${i}:`, error.message);
      }

      const newProduct = await Product.create(productData);
      uploadedProducts.push(newProduct);
    } catch (error) {
      errors.push({ index: i, error: error.message });
    }
  }

  return res.status(201).json({
    success: true,
    products: uploadedProducts,
    errors: errors.length ? errors : undefined,
  });
});

export const getAllProducts = handleAsyncError(async (req, res) => {
  const products = await Product.find().populate("createdBy", "username email fullname");
  return res.status(200).json({ success: true, products });
});

export const getSingleProduct = handleAsyncError(async (req, res) => {
  const { id } = req.params;
  validateObjectId(id, "product ID");

  const product = await Product.findById(id)
    .populate("createdBy", "username email fullname")
    .populate("productreviews.user", "username fullname");

  if (!product) {
    return res.status(404).json({ success: false, message: "Product not found" });
  }

  return res.status(200).json({ success: true, product });
});

export const getMyProducts = handleAsyncError(async (req, res) => {
  const userId = req.id;
  if (!userId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const products = await Product.find({ createdBy: userId })
    .sort({ createdAt: -1 })
    .populate("createdBy", "username email fullname");

  return res.status(200).json({ success: true, products });
});

export const getUserProducts = handleAsyncError(async (req, res) => {
  const { userId } = req.params;
  validateObjectId(userId, "user ID");

  if (!isOwnerOrAdmin(req, userId)) {
    return res.status(403).json({ success: false, message: "Not authorized to view these products" });
  }

  const products = await Product.find({ createdBy: userId }).populate("createdBy", "username email fullname");
  return res.status(200).json({ success: true, products });
});

export const updateProduct = handleAsyncError(async (req, res) => {
  const { id } = req.params;
  validateObjectId(id, "product ID");

  const product = await Product.findById(id);
  if (!product) {
    return res.status(404).json({
      success: false,
      message: "Product not found",
    });
  }

  if (!isOwnerOrAdmin(req, product.createdBy)) {
    return res.status(403).json({
      success: false,
      message: "Not authorized",
    });
  }

  let deleteImageIds = req.body.deleteImageIds;
  if (typeof deleteImageIds === "string") {
    try {
      deleteImageIds = JSON.parse(deleteImageIds);
    } catch {
      return res.status(400).json({
        success: false,
        message: "Invalid deleteImageIds JSON",
      });
    }
  }

  if (deleteImageIds && !Array.isArray(deleteImageIds)) {
    return res.status(400).json({
      success: false,
      message: "deleteImageIds must be an array",
    });
  }

  if (Array.isArray(deleteImageIds) && deleteImageIds.length > 0) {
    await deleteCloudinaryPublicIds(deleteImageIds);
    product.images = product.images.filter(
      (img) => !deleteImageIds.includes(img.public_id)
    );
  }

  if (req.files && req.files.length > 0) {
    if (product.images.length + req.files.length > 10) {
      return res.status(400).json({
        success: false,
        message: "Maximum 10 images allowed",
      });
    }

    const newImgs = [];

    try {
      for (const file of req.files) {
        const uploadedImage = await handleCloudinaryUpload(file);
        newImgs.push(uploadedImage);
      }
    } catch (e) {
      if (newImgs.length > 0) {
        await deleteCloudinaryPublicIds(newImgs.map((img) => img.public_id));
      }

      return res.status(502).json({
        success: false,
        message: e.message || "Failed to upload images",
      });
    }

    product.images.push(...newImgs);
  }

  if (req.body.productname !== undefined) {
    if (!isNonEmptyString(req.body.productname)) {
      return res.status(400).json({
        success: false,
        message: "Invalid product name",
      });
    }
    product.productname = req.body.productname.trim();
  }

  if (req.body.productprice !== undefined) {
    const n = toFiniteNumber(req.body.productprice);
    if (!Number.isFinite(n) || n < 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid product price",
      });
    }
    product.productprice = n;
  }

  if (req.body.originalPrice !== undefined) {
    const val = req.body.originalPrice;
    const n = val === null || val === "" ? undefined : toFiniteNumber(val);

    if (n !== undefined) {
      if (
        !Number.isFinite(n) ||
        (product.productprice !== undefined && n < product.productprice)
      ) {
        return res.status(400).json({
          success: false,
          message: "Original price must be >= current price",
        });
      }
      product.originalPrice = n;
    } else {
      product.originalPrice = undefined;
    }
  }

  if (req.body.productdescription !== undefined) {
    if (!isNonEmptyString(req.body.productdescription)) {
      return res.status(400).json({
        success: false,
        message: "Invalid description",
      });
    }
    product.productdescription = req.body.productdescription.trim();
  }

  if (req.body.category !== undefined) {
    if (!isNonEmptyString(req.body.category)) {
      return res.status(400).json({
        success: false,
        message: "Invalid category",
      });
    }
    product.category = req.body.category.trim();
  }

  if (req.body.subcategory !== undefined) {
    product.subcategory = req.body.subcategory
      ? String(req.body.subcategory).trim()
      : undefined;
  }

  if (req.body.tags !== undefined) {
    const tRaw = parseMaybeJSON(req.body.tags);
    if (tRaw === Symbol.for("JSON_ERROR")) {
      return res.status(400).json({
        success: false,
        message: "Invalid tags JSON",
      });
    }

    const t = sanitizeTags(tRaw ?? []);
    if (t === Symbol.for("TAGS_SHAPE")) {
      return res.status(400).json({
        success: false,
        message: "Invalid tags",
      });
    }

    product.tags = t;
  }

  if (req.body.stock !== undefined) {
    const sRaw = parseMaybeJSON(req.body.stock);
    if (sRaw === Symbol.for("JSON_ERROR")) {
      return res.status(400).json({
        success: false,
        message: "Invalid stock JSON",
      });
    }

    const s = validateStock(sRaw);
    if (s === Symbol.for("STOCK_SHAPE")) {
      return res.status(400).json({
        success: false,
        message: "Invalid stock",
      });
    }

    product.stock = s;
  }

  if (req.body.specifications !== undefined) {
    const specsRaw = parseMaybeJSON(req.body.specifications);
    if (specsRaw === Symbol.for("JSON_ERROR")) {
      return res.status(400).json({
        success: false,
        message: "Invalid specifications JSON",
      });
    }

    product.specifications = specsRaw ?? {};
  }

  if (req.body.ecoScore !== undefined) {
    const ecoScore = toFiniteNumber(req.body.ecoScore);
    if (!Number.isFinite(ecoScore) || ecoScore < 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid ecoScore",
      });
    }
    product.ecoScore = ecoScore;
  }

  if (req.body.co2SavedKg !== undefined) {
    const co2SavedKg = toFiniteNumber(req.body.co2SavedKg);
    if (!Number.isFinite(co2SavedKg) || co2SavedKg < 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid co2SavedKg",
      });
    }
    product.co2SavedKg = co2SavedKg;
  }

  if (req.body.isEcoFriendly !== undefined) {
    const raw = String(req.body.isEcoFriendly).toLowerCase().trim();

    if (raw !== "true" && raw !== "false") {
      return res.status(400).json({
        success: false,
        message: "Invalid isEcoFriendly",
      });
    }

    product.isEcoFriendly = raw === "true";
  }

  await product.save();
  await product.populate("createdBy", "username email fullname");

  return res.status(200).json({
    success: true,
    message: "Product updated successfully",
    product,
  });
});

export const deleteProduct = handleAsyncError(async (req, res) => {
  const { id } = req.params;
  validateObjectId(id, "product ID");

  const product = await Product.findById(id);
  if (!product) {
    return res.status(404).json({ success: false, message: "Product not found" });
  }

  if (!isOwnerOrAdmin(req, product.createdBy)) {
    return res.status(403).json({ success: false, message: "Not authorized" });
  }

  if (product.images?.length) {
    await deleteCloudinaryPublicIds(product.images.map((i) => i.public_id));
  }

  await Product.findByIdAndDelete(id);
  return res.status(200).json({ success: true, message: "Product deleted successfully" });
});

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
  if (!product) {
    return res.status(404).json({ success: false, message: "Product not found" });
  }

  const exists = product.productreviews.some((r) => r.user.toString() === userId);
  if (exists) {
    return res.status(400).json({ success: false, message: "Already reviewed" });
  }

  product.productreviews.push({
    review: review.trim(),
    rating: ratingNum,
    user: userId,
  });

  product.calculateReviewStats();
  await product.save();
  await product.populate("productreviews.user", "username fullname");

  return res.status(200).json({ success: true, message: "Review added", product });
});

export const updateProductReview = handleAsyncError(async (req, res) => {
  const { id, reviewId } = req.params;
  const userId = req.id;

  validateObjectId(id, "product ID");
  validateObjectId(reviewId, "review ID");

  const product = await Product.findById(id);
  if (!product) {
    return res.status(404).json({ success: false, message: "Product not found" });
  }

  const review = product.productreviews.find((r) => r._id.toString() === reviewId && r.user.toString() === userId);
  if (!review) {
    return res.status(403).json({ success: false, message: "Review not found or not authorized" });
  }

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

  product.calculateReviewStats();
  await product.save();
  await product.populate("productreviews.user", "username fullname");

  return res.status(200).json({ success: true, message: "Review updated", product });
});

export const deleteProductReview = handleAsyncError(async (req, res) => {
  const { id, reviewId } = req.params;
  const { role, id: userId } = req;

  validateObjectId(id, "product ID");
  validateObjectId(reviewId, "review ID");

  const product = await Product.findById(id);
  if (!product) {
    return res.status(404).json({ success: false, message: "Product not found" });
  }

  const idx = product.productreviews.findIndex((r) => r._id.toString() === reviewId);
  if (idx === -1) {
    return res.status(404).json({ success: false, message: "Review not found" });
  }

  if (role !== "admin" && product.productreviews[idx].user.toString() !== userId) {
    return res.status(403).json({ success: false, message: "Not authorized" });
  }

  product.productreviews.splice(idx, 1);
  product.calculateReviewStats();
  await product.save();

  return res.status(200).json({ success: true, message: "Review deleted", product });
});

export const markReviewHelpful = handleAsyncError(async (req, res) => {
  const { id, reviewId } = req.params;
  const userId = req.id;

  validateObjectId(id, "product ID");
  validateObjectId(reviewId, "review ID");

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
  ).populate("productreviews.user", "username fullname");

  if (!updated) {
    const exists = await Product.exists({ _id: id, "productreviews._id": reviewId });
    if (!exists) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }
    return res.status(200).json({ success: true, message: "Already marked helpful" });
  }

  const review = updated.productreviews.find((r) => r._id.toString() === reviewId);
  return res.status(200).json({ success: true, helpfulCount: review.helpfulCount });
});

export const handleProductErrors = (error, req, res, next) => {
  console.error("Product Controller Error:", error);

  if (error.name === "ValidationError") {
    const messages = Object.values(error.errors).map((err) => err.message);
    return res.status(400).json({ success: false, message: "Validation Error", errors: messages });
  }

  if (error.name === "CastError") {
    return res.status(400).json({ success: false, message: "Invalid ID format" });
  }

  return res.status(500).json({ success: false, message: "Internal server error" });
};

export const searchProducts = handleAsyncError(async (req, res) => {
  const { query = "", category = "", page = 1, limit = 20 } = req.query;

  const pageNum = Math.max(parseInt(page) || 1, 1);
  const limitNum = Math.min(parseInt(limit) || 20, 50);
  const skip = (pageNum - 1) * limitNum;

  const filter = {};

  if (category.trim()) {
    filter.category = { $regex: category.trim(), $options: "i" };
  }

  if (query.trim()) {
    filter.$or = [
      { productname: { $regex: query.trim(), $options: "i" } },
      { category: { $regex: query.trim(), $options: "i" } },
      { subcategory: { $regex: query.trim(), $options: "i" } },
      { "specifications.brand": { $regex: query.trim(), $options: "i" } },
      { "specifications.model": { $regex: query.trim(), $options: "i" } },
      { "specifications.color": { $regex: query.trim(), $options: "i" } },
    ];
  }

  const totalCount = await Product.countDocuments(filter);
  const products = await Product.find(filter)
    .populate("createdBy", "username email fullname")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limitNum);

  return res.status(200).json({
    success: true,
    count: products.length,
    totalCount,
    currentPage: pageNum,
    totalPages: Math.ceil(totalCount / limitNum),
    products,
  });
});

export const getEcoZoneProducts = handleAsyncError(async (req, res) => {
  const ecoFriendlyProducts = await Product.find({ ecoScore: { $gt: 60 } })
    .sort({ ecoScore: -1 })
    .populate("createdBy", "username email fullname");

  return res.status(200).json({
    success: true,
    count: ecoFriendlyProducts.length,
    products: ecoFriendlyProducts,
  });
});

export const getSingleecoProduct = handleAsyncError(async (req, res) => {
  const { id } = req.params;
  validateObjectId(id, "product ID");

  const product = await Product.findById(id)
    .populate("createdBy", "username email fullname")
    .populate("productreviews.user", "username fullname");

  if (!product) {
    return res.status(404).json({ success: false, message: "Product not found" });
  }

  if ((product.ecoScore || 0) <= 60) {
    return res.status(404).json({ success: false, message: "Eco-friendly product not found" });
  }

  return res.status(200).json({ success: true, product });
});
