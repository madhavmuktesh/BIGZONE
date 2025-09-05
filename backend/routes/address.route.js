// routes/address.route.js
import express from "express";
import isAuthenticated from "../middlewares/isAuthenticated.js"; // matches your file
import {
  addAddress,
  getAddresses,
  getAddressById,
  updateAddress,
  deleteAddress
} from "../controllers/address.controller.js";

const router = express.Router();

// list
router.get("/", isAuthenticated, getAddresses);

// create
router.post("/", isAuthenticated, addAddress);

// single (fetch for edit)
router.get("/:id", isAuthenticated, getAddressById);

// update
router.patch("/:id", isAuthenticated, updateAddress);

// delete
router.delete("/:id", isAuthenticated, deleteAddress);

export default router;
