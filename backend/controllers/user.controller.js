import { User } from "../models/user.model.js";
import crypto from "crypto";
import { v2 as cloudinary } from "cloudinary";

// --- Helper: Send Token Response ---
const sendTokenResponse = (user, statusCode, res, message) => {
  try {
    const token = user.generateAuthToken();
    
    if (!token) {
      return res.status(500).json({
        success: false,
        message: "Failed to generate authentication token"
      });
    }

    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "Lax",
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    };

    const userData = {
      _id: user._id,
      fullname: user.fullname,
      email: user.email,
      phoneNumber: user.phoneNumber,
      role: user.role,
      profilePhoto: user.profilePhoto,
      profile: user.profile,
      isVerified: user.isVerified,
      createdAt: user.createdAt
    };

    return res
      .status(statusCode)
      .cookie("token", token, options)
      .json({
        success: true,
        message,
        user: userData,
      });
  } catch (error) {
    console.error("Error in sendTokenResponse:", error);
    return res.status(500).json({
      success: false,
      message: "Authentication error"
    });
  }
};

// --- Input Validation Helpers ---
const validateEmail = (email) => {
  const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
  return emailRegex.test(email);
};

const validatePhoneNumber = (phone) => {
  return /^\d{10}$/.test(phone);
};

const validatePassword = (password) => {
  return password && password.length >= 6;
};

// ================================
// REGISTER
// ================================
export const register = async (req, res) => {
  try {
    const { fullname, email, phoneNumber, password, role } = req.body;

    // Input validation
    if (!fullname?.trim()) {
      return res.status(400).json({ success: false, message: "Full name is required." });
    }
    if (!email?.trim()) {
      return res.status(400).json({ success: false, message: "Email is required." });
    }
    if (!validateEmail(email)) {
      return res.status(400).json({ success: false, message: "Please provide a valid email address." });
    }
    if (!phoneNumber?.trim()) {
      return res.status(400).json({ success: false, message: "Phone number is required." });
    }
    if (!validatePhoneNumber(phoneNumber)) {
      return res.status(400).json({ success: false, message: "Please provide a valid 10-digit phone number." });
    }
    if (!validatePassword(password)) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters long." });
    }

    // FIXED: Check if user already exists
    const existingUser = await User.findOne({ email: email.trim().toLowerCase() });
    if (existingUser) {
      return res.status(409).json({ 
        success: false, 
        message: "An account with this email already exists." 
      });
    }

    // Check if phone number already exists
    const existingPhone = await User.findOne({ phoneNumber });
    if (existingPhone) {
      return res.status(409).json({ 
        success: false, 
        message: "An account with this phone number already exists." 
      });
    }

    const newUser = await User.create({
      fullname: fullname.trim(),
      email: email.trim().toLowerCase(),
      phoneNumber,
      password,
      role: ["seller", "admin"].includes(role) ? role : "user",
    });

    return sendTokenResponse(newUser, 201, res, "Account created successfully.");
  } catch (error) {
    console.error("Register Error:", error);
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      const field = Object.keys(error.keyValue)[0];
      return res.status(409).json({
        success: false,
        message: `${field === 'email' ? 'Email' : 'Phone number'} already exists.`
      });
    }
    
    return res.status(500).json({ success: false, message: "Registration failed. Please try again." });
  }
};

// ================================
// LOGIN
// ================================
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Input validation
    if (!email?.trim() || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required." });
    }

    // FIXED: Find user and include password for comparison
    const user = await User.findOne({ email: email.trim().toLowerCase() }).select("+password");
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save({ validateBeforeSave: false });

    return sendTokenResponse(user, 200, res, "Login successful.");
  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({ success: false, message: "Login failed. Please try again." });
  }
};

// ================================
// LOGOUT
// ================================
export const logout = (req, res) => {
  return res
    .cookie("token", "", {
      expires: new Date(0),
      httpOnly: true,
      sameSite: "Lax",
      secure: process.env.NODE_ENV === "production",
    })
    .status(200)
    .json({ success: true, message: "Logout successful." });
};

// ================================
// GET PROFILE
// ================================
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.id).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    return res.status(200).json({ 
      success: true, 
      user: {
        ...user.toObject(),
        addressCount: user.addressCount
      }
    });
  } catch (error) {
    console.error("Get Profile Error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch profile." });
  }
};

// ================================
// UPDATE PROFILE
// ================================
export const updateProfile = async (req, res) => {
  try {
    const { fullname, phoneNumber, bio } = req.body;
    const updateData = {};

    // Validate and update fullname
    if (fullname !== undefined) {
      if (!fullname.trim()) {
        return res.status(400).json({ success: false, message: "Full name cannot be empty." });
      }
      updateData.fullname = fullname.trim();
    }

    // Validate and update phone number
    if (phoneNumber !== undefined) {
      if (!validatePhoneNumber(phoneNumber)) {
        return res.status(400).json({ success: false, message: "Please provide a valid 10-digit phone number." });
      }
      // Check if phone number is already taken by another user
      const existingPhone = await User.findOne({ phoneNumber, _id: { $ne: req.id } });
      if (existingPhone) {
        return res.status(409).json({ success: false, message: "Phone number already in use." });
      }
      updateData.phoneNumber = phoneNumber;
    }

    // Update bio
    if (bio !== undefined) {
      updateData['profile.bio'] = bio.trim().substring(0, 200);
    }

    const user = await User.findByIdAndUpdate(
      req.id,
      updateData,
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      user,
    });
  } catch (error) {
    console.error("Update Profile Error:", error);
    
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: "Phone number already exists." });
    }
    
    return res.status(500).json({ success: false, message: "Failed to update profile." });
  }
};

// ================================
// UPDATE PROFILE PHOTO
// ================================
export const updateProfilePhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Profile photo is required." });
    }

    const user = await User.findById(req.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    // Delete old profile photo from Cloudinary if exists
    if (user.profilePhoto?.public_id) {
      await cloudinary.uploader.destroy(user.profilePhoto.public_id).catch(console.error);
    }

    // Upload new photo
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "profile_photos",
      width: 300,
      height: 300,
      crop: "fill",
      quality: "auto"
    });

    user.profilePhoto = {
      url: result.secure_url,
      public_id: result.public_id
    };

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Profile photo updated successfully.",
      profilePhoto: user.profilePhoto
    });
  } catch (error) {
    console.error("Update Profile Photo Error:", error);
    return res.status(500).json({ success: false, message: "Failed to update profile photo." });
  }
};

// ================================
// ADD ADDRESS
// ================================
export const addAddress = async (req, res) => {
  try {
    const { name, mobileNumber, landmark, city, pincode, state } = req.body;
    
    // Input validation
    if (!name?.trim() || !mobileNumber?.trim() || !landmark?.trim() || !city?.trim() || !pincode?.trim()) {
      return res.status(400).json({ success: false, message: "All address fields are required." });
    }

    if (!validatePhoneNumber(mobileNumber)) {
      return res.status(400).json({ success: false, message: "Please provide a valid 10-digit mobile number." });
    }

    if (!/^\d{6}$/.test(pincode)) {
      return res.status(400).json({ success: false, message: "Please provide a valid 6-digit pincode." });
    }

    const user = await User.findById(req.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    if (user.profile.address.length >= 5) {
      return res.status(400).json({ success: false, message: "Maximum 5 addresses allowed." });
    }

    const newAddress = {
      name: name.trim(),
      mobileNumber,
      landmark: landmark.trim(),
      city: city.trim(),
      pincode,
      state: state?.trim()
    };

    user.profile.address.push(newAddress);
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Address added successfully.",
      addresses: user.profile.address,
    });
  } catch (error) {
    console.error("Add Address Error:", error);
    return res.status(500).json({ success: false, message: "Failed to add address." });
  }
};

// ================================
// UPDATE ADDRESS
// ================================
export const updateAddress = async (req, res) => {
  try {
    const { addressId } = req.params;
    const { name, mobileNumber, landmark, city, pincode, state } = req.body;

    const user = await User.findById(req.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const address = user.profile.address.id(addressId);
    if (!address) {
      return res.status(404).json({ success: false, message: "Address not found." });
    }

    // Update fields if provided
    if (name !== undefined) address.name = name.trim();
    if (mobileNumber !== undefined) {
      if (!validatePhoneNumber(mobileNumber)) {
        return res.status(400).json({ success: false, message: "Please provide a valid 10-digit mobile number." });
      }
      address.mobileNumber = mobileNumber;
    }
    if (landmark !== undefined) address.landmark = landmark.trim();
    if (city !== undefined) address.city = city.trim();
    if (pincode !== undefined) {
      if (!/^\d{6}$/.test(pincode)) {
        return res.status(400).json({ success: false, message: "Please provide a valid 6-digit pincode." });
      }
      address.pincode = pincode;
    }
    if (state !== undefined) address.state = state?.trim();

    await user.save();

    return res.status(200).json({
      success: true,
      message: "Address updated successfully.",
      addresses: user.profile.address,
    });
  } catch (error) {
    console.error("Update Address Error:", error);
    return res.status(500).json({ success: false, message: "Failed to update address." });
  }
};

// ================================
// DELETE ADDRESS
// ================================
export const deleteAddress = async (req, res) => {
  try {
    const { addressId } = req.params;

    const user = await User.findById(req.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const addressIndex = user.profile.address.findIndex(addr => addr._id.toString() === addressId);
    if (addressIndex === -1) {
      return res.status(404).json({ success: false, message: "Address not found." });
    }

    user.profile.address.splice(addressIndex, 1);
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Address deleted successfully.",
      addresses: user.profile.address,
    });
  } catch (error) {
    console.error("Delete Address Error:", error);
    return res.status(500).json({ success: false, message: "Failed to delete address." });
  }
};

// ================================
// FORGOT PASSWORD
// ================================
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email?.trim()) {
      return res.status(400).json({ success: false, message: "Email is required." });
    }

    // FIXED: Use standard findOne method
    const user = await User.findOne({ email: email.trim().toLowerCase() });

    // Always return success message for security
    const successMessage = "If an account exists with that email, a reset link has been sent.";

    if (!user) {
      return res.status(200).json({
        success: true,
        message: successMessage,
      });
    }

    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${req.protocol}://${req.get("host")}/api/v1/users/reset-password/${resetToken}`;
    
    // In production, you would send an email here
    if (process.env.NODE_ENV !== 'production') {
      console.log(`Password reset URL for ${user.email}: ${resetUrl}`);
    }

    return res.status(200).json({
      success: true,
      message: process.env.NODE_ENV === 'production' 
        ? successMessage 
        : "Password reset link generated. Check console for testing.",
    });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    return res.status(500).json({ success: false, message: "Failed to process request." });
  }
};

// ================================
// RESET PASSWORD
// ================================
export const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ success: false, message: "Password is required." });
    }

    if (!validatePassword(password)) {
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters long." });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired password reset token.",
      });
    }

    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    return sendTokenResponse(user, 200, res, "Password reset successful.");
  } catch (error) {
    console.error("Reset Password Error:", error);
    return res.status(500).json({ success: false, message: "Failed to reset password." });
  }
};

// ================================
// CHANGE PASSWORD
// ================================
export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: "Current password and new password are required." 
      });
    }

    if (!validatePassword(newPassword)) {
      return res.status(400).json({ 
        success: false, 
        message: "New password must be at least 6 characters long." 
      });
    }

    const user = await User.findById(req.id).select("+password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Current password is incorrect." });
    }

    user.password = newPassword;
    await user.save();

    return res.status(200).json({
      success: true,
      message: "Password changed successfully.",
    });
  } catch (error) {
    console.error("Change Password Error:", error);
    return res.status(500).json({ success: false, message: "Failed to change password." });
  }
};

// ================================
// GET ALL USERS (Admin only)
// ================================
export const getAllUsers = async (req, res) => {
  try {
    if (req.role !== 'admin') {
      return res.status(403).json({ success: false, message: "Admin access required." });
    }

    const { page = 1, limit = 20, role, search } = req.query;
    const filter = {};
    
    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        { fullname: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const pageNumber = Math.max(1, parseInt(page));
    const pageSize = Math.min(50, Math.max(1, parseInt(limit)));
    const skip = (pageNumber - 1) * pageSize;

    const [users, totalCount] = await Promise.all([
      User.find(filter)
        .select("-password -resetPasswordToken -resetPasswordExpires")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageSize),
      User.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(totalCount / pageSize);

    return res.status(200).json({
      success: true,
      users,
      pagination: {
        currentPage: pageNumber,
        totalPages,
        totalUsers: totalCount,
        hasNextPage: pageNumber < totalPages,
        hasPrevPage: pageNumber > 1
      }
    });
  } catch (error) {
    console.error("Get All Users Error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch users." });
  }
};

// ================================
// DELETE ACCOUNT
// ================================
export const deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ success: false, message: "Password is required to delete account." });
    }

    const user = await User.findById(req.id).select("+password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: "Incorrect password." });
    }

    // Delete profile photo from Cloudinary if exists
    if (user.profilePhoto?.public_id) {
      await cloudinary.uploader.destroy(user.profilePhoto.public_id).catch(console.error);
    }

    await User.findByIdAndDelete(req.id);

    return res
      .cookie("token", "", {
        expires: new Date(0),
        httpOnly: true,
        sameSite: "Lax",
        secure: process.env.NODE_ENV === "production",
      })
      .status(200)
      .json({
        success: true,
        message: "Account deleted successfully.",
      });
  } catch (error) {
    console.error("Delete Account Error:", error);
    return res.status(500).json({ success: false, message: "Failed to delete account." });
  }
};

export const getCurrentUser = async (req, res, next) => {
  try {
    const userId = req.id; // This comes from your auth middleware
    
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: "User not authenticated" 
      });
    }

    // Fetch user from database (adjust the model import as needed)
    const user = await User.findById(userId).select('-password');
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "User not found" 
      });
    }

    res.status(200).json({ 
      success: true, 
      user: user 
    });

  } catch (error) {
    console.error("Get current user error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Internal server error" 
    });
  }
};
