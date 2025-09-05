// controllers/address.controller.js
import Address from "../models/Address.js";

// helper to get user id from middleware
const getUserIdFromReq = (req) => {
  return req.id || req.user?._id || req.user?.id;
};

// POST /api/v1/addresses
export const addAddress = async (req, res) => {
  try {
    const userId = getUserIdFromReq(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }

    const payload = {
      user: userId,
      country: req.body.country,
      fullName: req.body.fullName,
      mobile: req.body.mobile,
      location: req.body.location || "",
      house: req.body.house,
      area: req.body.area,
      pincode: req.body.pincode,
      city: req.body.city,
      state: req.body.state,
      makeDefault: !!req.body.makeDefault,
    };

    const address = await Address.create(payload);
    res.status(201).json({ success: true, address });
  } catch (error) {
    console.error("addAddress error:", error);
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: Object.values(error.errors).map(e => e.message),
      });
    }
    res.status(500).json({ success: false, message: "Failed to save address" });
  }
};

// GET /api/v1/addresses  (list) - you already have this; keep as is
export const getAddresses = async (req, res) => {
  try {
    const userId = getUserIdFromReq(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }
    const addresses = await Address.find({ user: userId }).sort({ createdAt: -1 });
    res.json({ success: true, addresses });
  } catch (error) {
    console.error("getAddresses error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch addresses" });
  }
};

// GET /api/v1/addresses/:id  (single)
export const getAddressById = async (req, res) => {
  try {
    const userId = getUserIdFromReq(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }

    const address = await Address.findOne({ _id: req.params.id, user: userId });
    if (!address) return res.status(404).json({ success: false, message: "Address not found" });

    res.json({ success: true, address });
  } catch (error) {
    console.error("getAddressById error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch address" });
  }
};

// PATCH /api/v1/addresses/:id (update)
export const updateAddress = async (req, res) => {
  try {
    const userId = getUserIdFromReq(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }

    const update = {
      country: req.body.country,
      fullName: req.body.fullName,
      mobile: req.body.mobile,
      location: req.body.location || "",
      house: req.body.house,
      area: req.body.area,
      pincode: req.body.pincode,
      city: req.body.city,
      state: req.body.state,
      makeDefault: !!req.body.makeDefault,
    };

    const address = await Address.findOneAndUpdate(
      { _id: req.params.id, user: userId },
      update,
      { new: true, runValidators: true }
    );

    if (!address) return res.status(404).json({ success: false, message: "Address not found or not authorized" });

    res.json({ success: true, address });
  } catch (error) {
    console.error("updateAddress error:", error);
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: Object.values(error.errors).map(e => e.message),
      });
    }
    res.status(500).json({ success: false, message: "Failed to update address" });
  }
};

// DELETE - you already have; keep it (ownership enforced)
export const deleteAddress = async (req, res) => {
  try {
    const userId = getUserIdFromReq(req);
    if (!userId) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }

    const address = await Address.findOneAndDelete({ _id: req.params.id, user: userId });
    if (!address) return res.status(404).json({ success: false, message: "Address not found" });

    res.json({ success: true, message: "Address deleted" });
  } catch (error) {
    console.error("deleteAddress error:", error);
    res.status(500).json({ success: false, message: "Failed to delete address" });
  }
};
