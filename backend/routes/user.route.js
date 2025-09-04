// ===== USER ROUTES (user.route.js) =====
import express from "express";
import {
    register,
    login,
    logout,
    getProfile,
    updateProfile,
    updateProfilePhoto,
    addAddress,
    updateAddress,
    deleteAddress,
    forgotPassword,
    resetPassword,
    changePassword,
    getAllUsers,
    deleteAccount,
    getCurrentUser
} from "../controllers/user.controller.js";
import { isAuthenticated, requireRole } from "../middlewares/isAuthenticated.js";
import upload from "../middlewares/multer.js";

const router = express.Router();

// --- PUBLIC ROUTES ---
router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password/:token", resetPassword);

// --- AUTHENTICATED ROUTES ---
router.use(isAuthenticated);

// Current user
router.get("/me", getCurrentUser);

// Profile management
router.get("/profile", getProfile);
router.patch("/profile", updateProfile);
router.patch("/profile/photo", upload.single("profilePhoto"), updateProfilePhoto);
router.post("/change-password", changePassword);
router.delete("/account", deleteAccount);

// Address management
router.post("/addresses", addAddress);
router.put("/addresses/:addressId", updateAddress);
router.delete("/addresses/:addressId", deleteAddress);

// --- ADMIN ONLY ROUTES ---
router.get("/", requireRole("admin"), getAllUsers);

export default router;
