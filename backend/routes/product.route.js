// ===== PRODUCT ROUTES (product.route.js) =====
import express from "express";
import {
  createProduct,
  createMultipleProducts,
  getAllProducts,
  getSingleProduct,
  getUserProducts,
  addProductReview,
  updateProductReview,
  deleteProductReview,
  markReviewHelpful,
  updateProduct,
  deleteProduct,
  handleProductErrors,
} from "../controllers/product.controller.js";

import { isAuthenticated } from "../middlewares/isAuthenticated.js";
import {
  productImageUpload,
  cleanupFiles,
  handleMulterError,
} from "../middlewares/multer.js";
import {
  validateReviewInput,
  validateProductInput,
} from "../middlewares/validation.js";

const router = express.Router();

/* ======================
   📌 PUBLIC ROUTES
====================== */
// Anyone can view products
router.get("/", getAllProducts);
router.get("/user/:userId", getUserProducts); // must come before /:id
router.get("/:id", getSingleProduct);

/* ======================
   🔒 AUTHENTICATED ROUTES
====================== */
router.use(isAuthenticated);

// --- Product CRUD ---
router.post(
  "/create",
  productImageUpload.array("images", 10),
  handleMulterError,
  cleanupFiles,
  validateProductInput,
  createProduct
);

router.post(
  "/bulk-create",
  productImageUpload.any(),
  handleMulterError,
  cleanupFiles,
  createMultipleProducts
);

router.put(
  "/:id",
  productImageUpload.array("images", 10),
  handleMulterError,
  cleanupFiles,
  updateProduct
);

router.delete("/:id", deleteProduct);

// --- Product Reviews ---
router.post("/:id/reviews", validateReviewInput, addProductReview);
router.put("/:id/reviews/:reviewId", validateReviewInput, updateProductReview);
router.delete("/:id/reviews/:reviewId", deleteProductReview);
router.post("/:id/reviews/:reviewId/helpful", markReviewHelpful);

/* ======================
   ⚠️ ERROR HANDLER
====================== */
router.use(handleProductErrors);

export default router;
