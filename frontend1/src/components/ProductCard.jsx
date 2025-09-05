import React from 'react';
import { Link } from 'react-router-dom';
import { HeartIcon } from './Icons';

const ProductCard = ({ product }) => {
  // Handle missing product data gracefully
  if (!product) {
    return null;
  }

  const {
    _id,
    productname,
    productprice,
    originalPrice,
    reviewStats,
    images,
    category,
    specifications
  } = product;

  // Calculate discount percentage if original price exists
  const discountPercentage = originalPrice && originalPrice > productprice 
    ? Math.round(((originalPrice - productprice) / originalPrice) * 100)
    : 0;

  // Generate star rating display
  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating || 0);
    const hasHalfStar = (rating || 0) % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<span key={i} className="star filled">★</span>);
    }

    if (hasHalfStar) {
      stars.push(<span key="half" className="star half">★</span>);
    }

    const emptyStars = 5 - Math.ceil(rating || 0);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<span key={`empty-${i}`} className="star empty">☆</span>);
    }

    return stars;
  };

  return (
    <div className="product-card">
      <div className="product-image-container">
        <div className="product-image">
          {images && images.length > 0 ? (
            <img 
              src={images[0].url} 
              alt={productname}
              onError={(e) => {
                e.target.src = '/placeholder.jpg';
              }}
            />
          ) : (
            <div className="placeholder-image">
              <i className="fas fa-image"></i>
            </div>
          )}
          
          {/* Discount Badge */}
          {discountPercentage > 0 && (
            <div className="discount-badge">
              {discountPercentage}% OFF
            </div>
          )}
        </div>
        
        <button className="wishlist-button">
          <HeartIcon />
        </button>
      </div>
      
      <div className="product-info">
        <h3 className="product-name">{productname}</h3>
        
        {/* Category and Brand */}
        <div className="product-meta">
          <span className="product-category">{category}</span>
          {specifications?.brand && (
            <span className="product-brand"> • {specifications.brand}</span>
          )}
        </div>
        
        {/* Rating */}
        <div className="product-rating">
          <div className="rating-stars">
            {renderStars(reviewStats?.averageRating)}
          </div>
          <span className="rating-count">
            ({reviewStats?.totalReviews || 0})
          </span>
        </div>
        
        {/* Price */}
        <div className="product-price">
          <span className="current-price">₹{productprice?.toLocaleString()}</span>
          {originalPrice && originalPrice > productprice && (
            <span className="original-price">₹{originalPrice.toLocaleString()}</span>
          )}
        </div>
        
        {/* Buttons */}
        <div className="product-buttons">
          {/* ✅ Fixed to match your router: /products/:id */}
          <Link to={`/products/${_id}`}>
            <button className="btn-view">View Details</button>
          </Link>
          <button className="btn-add">Add to Cart</button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
