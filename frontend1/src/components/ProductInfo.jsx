// src/components/ProductInfo.jsx
import React, { useState } from "react";
import { ShareIcon, CheckIcon } from "./Icons";
import ApiService from "../services/api";

const ProductInfo = ({ product }) => {
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviews, setReviews] = useState(product?.productreviews || []);

  if (!product) {
    return <div className="error">No product information available.</div>;
  }

  // FIX: use backend field names
const {
  _id,
  productname = "Unnamed Product",
  productdescription = "No description available",
  productprice = 0,
  originalPrice = null,
  reviewStats = { averageRating: 0, totalReviews: (product?.productreviews?.length || 0) },
  stock = { quantity: 0 },
  tags = [],
  specifications = {},
  productreviews = [],
} = product;

const { averageRating = 0, totalReviews = productreviews.length } = reviewStats;


  // Calculate discount percentage safely
  const discountPercentage =
    originalPrice && productprice
      ? Math.round(((originalPrice - productprice) / originalPrice) * 100)
      : 0;

  // Handle add to cart
  const handleAddToCart = async () => {
    setIsAddingToCart(true);
    try {
      await ApiService.addToCart(_id, 1);
      alert("Added to cart!");
    } catch (error) {
      console.error("Error adding to cart:", error);
      alert("Failed to add to cart");
    } finally {
      setIsAddingToCart(false);
    }
  };

  // Handle buy now
  const handleBuyNow = () => {
    console.log("Buy now:", _id);
    alert("Proceeding to checkout...");
  };

  // Handle share
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: productname,
          text: productdescription,
          url: window.location.href,
        });
      } catch (error) {
        console.log("Error sharing:", error);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert("Product link copied to clipboard!");
    }
  };

  // Handle review submission
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    try {
      const newReview = await ApiService.addReview(_id, {
        review: reviewText,
        rating: reviewRating,
      });

      // ✅ update reviews list immediately
      setReviews((prev) => [newReview, ...prev]);

      setReviewText("");
      setReviewRating(5);
    } catch (error) {
      console.error("Error submitting review:", error);
      alert("Failed to submit review");
    }
  };

  return (
    <div className="product-info-container">
      {/* Product Header */}
      <div className="space-y-4">
        <div className="header-row">
          {tags.includes("bestseller") && (
            <span className="bestseller-badge">Bestseller</span>
          )}
          <button
            className="share-button"
            onClick={handleShare}
            aria-label="Share this product"
          >
            <ShareIcon />
          </button>
        </div>

        <h1 className="product-title">{productname}</h1>
        <p className="product-description">{productdescription}</p>

        <div className="price-section">
          <span className="price">${Number(productprice).toFixed(2)}</span>
          {originalPrice && (
            <>
              <span className="original-price">
                ${Number(originalPrice).toFixed(2)}
              </span>
              {discountPercentage > 0 && (
                <span className="discount-badge">{discountPercentage}% OFF</span>
              )}
            </>
          )}
        </div>

        <div className="rating-section">
          <span className="stars">
            {"★".repeat(Math.floor(averageRating || 0))}
            {"☆".repeat(5 - Math.floor(averageRating || 0))}
          </span>
          <span className="rating-value">
            {(averageRating || 0).toFixed(1)}
          </span>
          <span className="review-count">({totalReviews} reviews)</span>
        </div>
      </div>

      {/* Key Highlights */}
      <div className="key-highlights">
        <h3 className="section-title">Key Highlights</h3>
        <div className="highlights-grid">
          {tags.length > 0 ? (
            tags.map((tag, index) => (
              <HighlightItem
                key={index}
                text={tag
                  .replace(/([A-Z])/g, " $1")
                  .replace(/^./, (str) => str.toUpperCase())}
              />
            ))
          ) : (
            <HighlightItem text="Quality Product" />
          )}
        </div>
      </div>

      {/* Stock Information */}
      <div className="stock-info">
        <h3 className="section-title">Availability</h3>
        <p
          className={`stock-status ${
            stock?.quantity > 0 ? "in-stock" : "out-of-stock"
          }`}
        >
          {stock?.quantity > 0
            ? `${stock.quantity} items in stock`
            : "Out of stock"}
        </p>
      </div>

      {/* Specifications */}
      {specifications && Object.keys(specifications).length > 0 && (
        <div className="specifications">
          <h3 className="section-title">Specifications</h3>
          <div className="specs-grid">
            {Object.entries(specifications).map(([key, value]) => (
              <div key={key} className="spec-item">
                <span className="spec-label">{key}:</span>
                <span className="spec-value">{String(value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Reviews Section */}
      <div className="reviews-section">
        <h3 className="section-title">Customer Reviews</h3>

        {/* Review Form */}
        <form onSubmit={handleSubmitReview} className="review-form">
          <div className="rating-input">
            <label>Rating:</label>
            <select
              value={reviewRating}
              onChange={(e) => setReviewRating(Number(e.target.value))}
            >
              {[5, 4, 3, 2, 1].map((num) => (
                <option key={num} value={num}>
                  {num} Star{num !== 1 ? "s" : ""}
                </option>
              ))}
            </select>
          </div>
          <textarea
            value={reviewText}
            onChange={(e) => setReviewText(e.target.value)}
            placeholder="Write your review (minimum 10 characters)..."
            minLength={10}
            required
          />
          <button type="submit" disabled={reviewText.length < 10}>
            Submit Review
          </button>
        </form>

        {/* Display Reviews */}
        <div className="reviews-list">
          {reviews.length > 0 ? (
            reviews.slice(0, 3).map((review) => (
              <div key={review._id || Math.random()} className="review-item">
                <div className="review-header">
                  <span className="reviewer-name">
                    {review.user?.username ||
                      review.user?.name ||
                      "Anonymous"}
                  </span>
                  <span className="review-rating">
                    {"★".repeat(review.rating)}
                  </span>
                </div>
                <p className="review-text">{review.review}</p>
                <div className="review-meta">
                  <span className="review-date">
                    {review.createdAt
                      ? new Date(review.createdAt).toLocaleDateString()
                      : "Recently"}
                  </span>
                  {review.helpfulCount > 0 && (
                    <span className="helpful-count">
                      {review.helpfulCount} found helpful
                    </span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p>No reviews yet. Be the first!</p>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="action-buttons">
        <button
          className="btn-add-to-cart"
          onClick={handleAddToCart}
          disabled={isAddingToCart || stock?.quantity === 0}
        >
          {isAddingToCart ? "Adding..." : "Add to Cart"}
        </button>
        <button
          className="btn-buy-now"
          onClick={handleBuyNow}
          disabled={stock?.quantity === 0}
        >
          Buy Now
        </button>
      </div>

      <div className="additional-info">
        <span className="info-item">
          <CheckIcon /> Free Shipping
        </span>
        <span className="info-item">
          <CheckIcon /> 30-Day Returns
        </span>
        {tags.includes("eco-certified") && (
          <span className="info-item">
            <CheckIcon /> Eco Certified
          </span>
        )}
      </div>
    </div>
  );
};

// Helper component for highlights
const HighlightItem = ({ text }) => (
  <div className="highlight-item">
    <div
      className="highlight-icon"
      style={{ backgroundColor: "var(--last-lettuce)" }}
    >
      <CheckIcon style={{ color: "var(--teal-midnight)" }} />
    </div>
    <span>{text}</span>
  </div>
);

export default ProductInfo;
