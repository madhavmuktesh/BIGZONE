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
router.get("/:id", getSingleProduct);

/* ======================
   AUTHENTICATED ROUTES
====================== */
router.use(isAuthenticated);

router.get("/my-products", getMyProducts);
router.get("/user/:userId", getUserProducts);

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

router.post("/:id/reviews", validateReviewInput, addProductReview);
router.put("/:id/reviews/:reviewId", validateReviewInput, updateProductReview);
router.delete("/:id/reviews/:reviewId", deleteProductReview);
router.post("/:id/reviews/:reviewId/helpful", markReviewHelpful);

router.put(
  "/:id",
  productImageUpload.array("images", 10),
  handleMulterError,
  cleanupFiles,
  updateProduct
);

router.delete("/:id", deleteProduct);


/* ======================
   ERROR HANDLER
====================== */
router.use(handleProductErrors);

export default router;