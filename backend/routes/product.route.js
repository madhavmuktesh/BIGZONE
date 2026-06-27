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
  getEcoZoneProducts,
  getSingleecoProduct,
  searchProducts,
  getMyProducts,
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
   PUBLIC ROUTES
====================== */
router.get("/search", searchProducts);
router.get("/ecozone", getEcoZoneProducts);
router.get("/ecozone/:id", getSingleecoProduct);
router.get("/", getAllProducts);

/* ======================
   AUTHENTICATED ROUTES
====================== */
router.get("/my-products", isAuthenticated, getMyProducts);
router.get("/user/:userId", isAuthenticated, getUserProducts);

router.post(
  "/create",
  isAuthenticated,
  productImageUpload.array("images", 10),
  handleMulterError,
  cleanupFiles,
  validateProductInput,
  createProduct
);

router.post(
  "/bulk-create",
  isAuthenticated,
  productImageUpload.any(),
  handleMulterError,
  cleanupFiles,
  createMultipleProducts
);

router.post("/:id/reviews", isAuthenticated, validateReviewInput, addProductReview);
router.put(
  "/:id/reviews/:reviewId",
  isAuthenticated,
  validateReviewInput,
  updateProductReview
);
router.delete("/:id/reviews/:reviewId", isAuthenticated, deleteProductReview);
router.post(
  "/:id/reviews/:reviewId/helpful",
  isAuthenticated,
  markReviewHelpful
);

router.put(
  "/:id",
  isAuthenticated,
  productImageUpload.array("images", 10),
  handleMulterError,
  cleanupFiles,
  updateProduct
);

router.delete("/:id", isAuthenticated, deleteProduct);

/* ======================
   PUBLIC SINGLE PRODUCT ROUTE
   KEEP THIS LAST
====================== */
router.get("/:id", getSingleProduct);

/* ======================
   ERROR HANDLER
====================== */
router.use(handleProductErrors);

export default router;