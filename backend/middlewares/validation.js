import { body, param, query, validationResult } from 'express-validator';
import mongoose from 'mongoose';

const handleValidationErrors = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: errors.array().map(err => ({
                field: err.param || err.path,
                message: err.msg,
                value: err.value,
            })),
        });
    }
    next();
};

// --- USER VALIDATION ---
export const validateUserRegistration = [
    // ... (no changes here)
];
export const validateUserLogin = [
    // ... (no changes here)
];


// --- PRODUCT VALIDATION ---

export const validateProductInput = [
    body('productname')
        .trim()
        .notEmpty().withMessage('Product name is required')
        .isLength({ min: 3, max: 100 }).withMessage('Product name must be between 3 and 100 characters'),
    body('productdescription')
        .trim()
        .notEmpty().withMessage('Product description is required')
        .isLength({ min: 10, max: 2000 }).withMessage('Product description must be between 10 and 2000 characters'),
    body('productprice')
        .notEmpty().withMessage('Product price is required')
        .isFloat({ min: 0.01, max: 999999 }).withMessage('Product price must be between 0.01 and 999,999'),
    body('category')
        .trim()
        .notEmpty().withMessage('Category is required'),

    // ===== START: THIS IS THE FIX =====
    body('stock')
        .optional()
        .isJSON().withMessage('Stock must be a valid JSON object string')
        .custom(value => {
            const stockObj = JSON.parse(value);
            if (typeof stockObj.quantity !== 'number' || !Number.isInteger(stockObj.quantity) || stockObj.quantity < 0) {
                throw new Error('Stock quantity must be a non-negative integer.');
            }
            return true; // Indicates validation passed
        }),
    // ===== END: THIS IS THE FIX =====

    handleValidationErrors,
];

// --- REVIEW VALIDATION ---

export const validateReviewInput = [
    body('rating')
        .notEmpty().withMessage('Rating is required')
        .isInt({ min: 1, max: 5 }).withMessage('Rating must be an integer between 1 and 5'),
    body('review')
        .trim()
        .notEmpty().withMessage('Review text is required')
        .isLength({ min: 10, max: 1000 }).withMessage('Review must be between 10 and 1000 characters'),
    handleValidationErrors,
];


// --- CART VALIDATION ---

/**
 * Validates the input for ADDING items to the cart.
 */
export const validateCartInput = [
    body('productId')
        .notEmpty().withMessage('Product ID is required')
        .isMongoId().withMessage('Invalid product ID format'),

    body('quantity')
        .notEmpty().withMessage('Quantity is required')
        .isInt({ min: 1, max: 100 }).withMessage('Quantity must be an integer between 1 and 100'),

    handleValidationErrors,
];

/**
 * Validates ONLY the quantity for UPDATING an item in the cart.
 */
export const validateUpdateQuantity = [
    body('quantity')
        .notEmpty().withMessage('Quantity is required')
        .isInt({ min: 1, max: 100 }).withMessage('Quantity must be an integer between 1 and 100'),
    
    handleValidationErrors,
];


// --- GENERAL/REUSABLE VALIDATION ---

/**
 * Validates that a URL parameter is a valid MongoDB ObjectId.
 */
export const validateIdParam = (paramName = 'id') => [
    param(paramName)
        .isMongoId().withMessage(`Invalid ${paramName} format`),
    handleValidationErrors,
];

/**
 * Validates common pagination query parameters.
 */
export const validatePagination = [
    query('page')
        .optional()
        .isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit')
        .optional()
        .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    handleValidationErrors,
];
