import express from "express";
import {
  addAddress,
  getAddresses,
  updateAddress,
  deleteAddress,
} from "../controllers/address.controller.js";
import isAuthenticated from "../middlewares/isAuthenticated.js";

const router = express.Router();

router.post("/", isAuthenticated, addAddress);
router.get("/", isAuthenticated, getAddresses);
router.put("/:id", isAuthenticated, updateAddress);
router.delete("/:id", isAuthenticated, deleteAddress);

export default router;