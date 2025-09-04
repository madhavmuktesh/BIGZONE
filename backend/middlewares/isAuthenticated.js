import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";

export const isAuthenticated = async (req, res, next) => {
  try {
    let token = req.cookies?.token;

    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      return res.status(401).json({
        message: "User not authenticated. No token provided.",
        success: false,
      });
    }

    // FIXED: Use JWT_SECRET instead of SECRET_KEY
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // FIXED: Use decoded.id instead of decoded.userId (matches your token generation)
    const user = await User.findById(decoded.id).select("-password");
    if (!user) {
      return res.status(401).json({
        message: "Invalid token. User not found.",
        success: false,
      });
    }

    // FIXED: Check if user account is active
    if (!user.isActive) {
      return res.status(401).json({
        message: "Account has been deactivated.",
        success: false,
      });
    }

    // FIXED: Set both req.user and req.id for compatibility with your controllers
    req.user = user;
    req.id = user._id; // Your controllers expect req.id
    req.role = user.role; // Your controllers expect req.role
    
    next();
  } catch (error) {
    console.error("Authentication error:", error.message);

    if (error.name === "TokenExpiredError") {
      return res.status(401).json({
        message: "Token has expired. Please sign in again.",
        success: false,
      });
    }
    if (error.name === "JsonWebTokenError") {
      return res.status(401).json({
        message: "Invalid token. Please sign in again.",
        success: false,
      });
    }

    return res.status(401).json({
      message: "Unauthorized. Please login to continue.",
      success: false,
    });
  }
};

export const requireRole = (...requiredRoles) => {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: User role not available.",
      });
    }

    const userRole = req.user.role;

    if (!requiredRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: You do not have the required permissions. Requires role: ${requiredRoles.join(
          " or "
        )}.`,
      });
    }

    next();
  };
};

export default isAuthenticated;
