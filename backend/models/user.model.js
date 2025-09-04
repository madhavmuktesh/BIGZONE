import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";

// Sub-schema for addresses to ensure structure and validation
const addressSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: [true, "Address name is required."] 
    },
    mobileNumber: { 
        type: String, 
        required: [true, "Address mobile number is required."] 
    },
    landmark: { 
        type: String, 
        required: [true, "Address landmark is required."] 
    },
    city: { 
        type: String, 
        required: [true, "Address city is required."] 
    },
    pincode: { 
        type: String, 
        required: [true, "Address pincode is required."],
        match: [/^\d{6}$/, "Please fill a valid 6-digit pincode."]
    },
    state: {
        type: String
    }
});

const userSchema = new mongoose.Schema({
    fullname: {
        type: String,
        required: [true, "Full name is required."]
    },
    email: {
        type: String,
        required: [true, "Email is required."],
        unique: true,
        lowercase: true,
        match: [/\S+@\S+\.\S+/, 'is invalid']
    },
    phoneNumber: {
        type: String,
        required: [true, "Phone number is required."],
        match: [/^\d{10}$/, "Please fill a valid 10-digit phone number."]
    },
    password: {
        type: String,
        required: [true, "Password is required."],
        minlength: [6, "Password must be at least 6 characters long."],
        select: false
    },
    role: {
        type: String,
        enum: ["user", "seller", "admin"],
        default: "user"
    },
    isActive: {
        type: Boolean,
        default: true
    },
    lastLogin: {
        type: Date
    },
    profilePhoto: {
        url: String,
        public_id: String
    },
    isVerified: {
        type: Boolean,
        default: false
    },
    profile: {
        bio: {
            type: String,
            maxlength: 200
        },
        address: {
            type: [addressSchema],
            default: [],
            validate: [arrayLimit, 'Maximum 5 addresses allowed']
        }
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date
}, { timestamps: true });

// Validation function for address array limit
function arrayLimit(val) {
    return val.length <= 5;
}

// FIXED: Virtual for address count with null safety
userSchema.virtual('addressCount').get(function() {
    return this.profile?.address?.length || 0;
});

// --- MIDDLEWARE & METHODS ---

// Hash password before saving
userSchema.pre("save", async function(next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

// Generate JWT token
userSchema.methods.generateAuthToken = function() {
    try {
        const secret = process.env.JWT_SECRET;
        const expiresIn = process.env.JWT_EXPIRES_IN || '7d';

        if (!secret) {
            throw new Error('JWT_SECRET is not defined in the .env file.');
        }

        return jwt.sign(
            { id: this._id, role: this.role },
            secret,
            { expiresIn: expiresIn }
        );
    } catch (error) {
        console.error("Error generating auth token:", error.message);
        return null; 
    }
};

// Create password reset token
userSchema.methods.createPasswordResetToken = function() {
    const resetToken = crypto.randomBytes(32).toString('hex');
    
    this.resetPasswordToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');
    
    this.resetPasswordExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
    
    return resetToken;
};

// Ensure virtual fields are serialized
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

export const User = mongoose.model("User", userSchema);
