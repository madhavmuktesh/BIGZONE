import React, { useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { ShareIcon, CheckIcon } from "./Icons";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";

const formatSpecValue = (key, value) => {
  if (value === null || value === undefined || value === "") return "N/A";
  if (typeof value !== "number" && Number.isNaN(Number(value))) return String(value);

  const num = Number(value);
  const lowerKey = key.toLowerCase();

  if (lowerKey.includes("weight")) return `${num} kg`;
  if (lowerKey.includes("warranty")) return `${num} Year(s)`;
  if (lowerKey.includes("power")) return `${num} W`;
  if (lowerKey.includes("voltage")) return `${num} V`;
  if (lowerKey.includes("capacity")) return `${num} L`;
  if (
    lowerKey.includes("length") ||
    lowerKey.includes("width") ||
    lowerKey.includes("height")
  ) return `${num} cm`;

  return String(value);
};

const ProductInfo = ({ product }) => {
  const { isAuthenticated } = useAuth();
  const { addItemToCart } = useCart();
  const navigate = useNavigate();

  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [reviewText, setReviewText] = useState("");
  const [reviewRating, setReviewRating] = useState(5);
  const [reviews, setReviews] = useState(product?.productreviews || []);

  if (!product) {
    return <div className="error">No product information available.</div>;
  }

  const {
    _id,
    productname = "Unnamed Product",
    productdescription = "No description available",
    productprice = 0,
    originalPrice = null,
    reviewStats,
    stock = { quantity: 0 },
    tags = [],
    specifications = {},
    images = [],
  } = product;

  const averageRating = reviewStats?.averageRating ?? 0;
  const totalReviews = reviews.length || reviewStats?.totalReviews || 0;

  const discountPercentage = useMemo(() => {
    if (!originalPrice || !productprice) return 0;
    return Math.max(0, Math.round(((originalPrice - productprice) / originalPrice) * 100));
  }, [originalPrice, productprice]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      toast.error("Please sign in to add items to cart.");
      navigate("/signin");
      return false;
    }

    setIsAddingToCart(true);
    try {
      await addItemToCart(_id, 1, {
        productname,
        productprice,
        currentPrice: productprice,
        images,
        stock,
      });
      toast.success("Added to cart!");
      return true;
    } catch (error) {
      toast.error(error?.message || "Failed to add to cart");
      return false;
    } finally {
      setIsAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    const success = await handleAddToCart();
    if (success) navigate("/checkout");
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: productname,
          text: productdescription,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Product link copied!");
      }
    } catch (error) {
      console.log("Error sharing:", error);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();

    if (!isAuthenticated) {
      toast.error("Please sign in to submit a review.");
      return;
    }

    if (reviewText.trim().length < 10) {
      toast.error("Review must be at least 10 characters.");
      return;
    }

    try {
      const response = await fetch(`/api/v1/products/${_id}/reviews`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          review: reviewText.trim(),
          rating: reviewRating,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Failed to submit review");
      }

      toast.success("Review submitted successfully!");
      setReviews(data.product?.productreviews || []);
      setReviewText("");
      setReviewRating(5);
    } catch (error) {
      toast.error(error.message || "Failed to submit review");
    }
  };

  return (
    <div className="product-info-container">
      <Toaster position="top-center" />

      <div className="space-y-4">
        <div className="header-row" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          {tags.includes("bestseller") && <span className="bestseller-badge">Bestseller</span>}
          <button className="share-button" onClick={handleShare} aria-label="Share this product">
            <ShareIcon />
          </button>
        </div>

        <h1 className="product-title">{productname}</h1>

        <div className="price-section">
          <span className="price">₹{Number(productprice).toFixed(2)}</span>
          {originalPrice && (
            <>
              <span className="original-price">₹{Number(originalPrice).toFixed(2)}</span>
              {discountPercentage > 0 && (
                <span className="discount-badge">{discountPercentage}% OFF</span>
              )}
            </>
          )}
        </div>

        <div className="rating-section">
          <span className="stars">
            {"★".repeat(Math.floor(averageRating))}
            {"☆".repeat(5 - Math.floor(averageRating))}
          </span>
          <span className="rating-value">{Number(averageRating).toFixed(1)}</span>
          <span className="review-count">({totalReviews} reviews)</span>
        </div>
      </div>

      <div className="key-highlights">
        <h3 className="section-title">Key Highlights</h3>
        <div className="highlights-grid">
          {tags.length > 0 ? (
            tags.map((tag) => (
              <HighlightItem
                key={tag}
                text={tag.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
              />
            ))
          ) : (
            <HighlightItem text="Quality Product" />
          )}
        </div>
      </div>

      <div className="stock-info">
        <h3 className="section-title">Availability</h3>
        <p className={`stock-status ${stock?.quantity > 0 ? "in-stock" : "out-of-stock"}`}>
          {stock?.quantity > 0 ? `${stock.quantity} items in stock` : "Out of stock"}
        </p>
      </div>

      {Object.keys(specifications || {}).length > 0 && (
        <div className="specifications">
          <h3 className="section-title">Specifications</h3>
          <div className="specs-grid">
            {Object.entries(specifications).map(([key, value]) => (
              <div key={key} className="spec-item">
                <span className="spec-label">{key}:</span>
                <span className="spec-value">{formatSpecValue(key, value)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

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

      <div className="reviews-section">
        <h3 className="section-title">Customer Reviews</h3>

        {isAuthenticated ? (
          <form onSubmit={handleSubmitReview} className="review-form">
            <div className="rating-input">
              <label htmlFor="rating">Rating:</label>
              <select
                id="rating"
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

            <button type="submit" disabled={reviewText.trim().length < 10}>
              Submit Review
            </button>
          </form>
        ) : (
          <div className="signin-prompt">
            <p>
              Please <Link to="/signin">sign in</Link> to write a review.
            </p>
          </div>
        )}

        <div className="reviews-list">
          {reviews.length > 0 ? (
            reviews.slice(0, 5).map((review) => (
              <div key={review._id} className="review-item">
                <div className="review-header">
                  <span className="reviewer-name">
                    {review.user?.username || review.user?.fullname || review.user?.name || "Verified Buyer"}
                  </span>
                  <span className="review-rating">
                    {"★".repeat(review.rating)}
                  </span>
                </div>
                <p className="review-text">{review.review}</p>
                <div className="review-meta">
                  <span className="review-date">
                    {review.createdAt ? new Date(review.createdAt).toLocaleDateString() : "Recently"}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p>No reviews yet. Be the first to share your thoughts!</p>
          )}
        </div>
      </div>
    </div>
  );
};

const HighlightItem = ({ text }) => (
  <div className="highlight-item">
    <div className="highlight-icon">
      <CheckIcon />
    </div>
    <span>{text}</span>
  </div>
);

export default ProductInfo;