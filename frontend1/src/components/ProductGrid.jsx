// src/components/ProductGrid.js
import React from 'react';
import { useNavigate } from 'react-router-dom';
import ProductCard from './ProductCard';

const ProductGrid = ({ 
  products = [], 
  loading = false, 
  error = null,
  title = "Our Products",
  showViewAll = true,
  maxDisplay = 10
}) => {
  const navigate = useNavigate();

  // Handle loading state
  if (loading) {
    return (
      <div className="product-grid-container">
        <h2 className="section-title">{title}</h2>
        <div className="loading-message">
          <div className="loading-spinner"></div>
          <p>Loading eco-friendly products...</p>
        </div>
        <div className="product-grid loading">
          {/* Show skeleton cards while loading */}
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className="product-card skeleton">
              <div className="skeleton-image"></div>
              <div className="skeleton-content">
                <div className="skeleton-line"></div>
                <div className="skeleton-line short"></div>
                <div className="skeleton-line"></div>
                <div className="skeleton-line short"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="product-grid-container">
        <h2 className="section-title">{title}</h2>
        <div className="error-message">
          <div className="error-icon">⚠️</div>
          <h3>Oops! Something went wrong</h3>
          <p>{error}</p>
          <button 
            className="retry-button"
            onClick={() => window.location.reload()}
          >
            <span>🔄</span> Try Again
          </button>
        </div>
      </div>
    );
  }

  // Handle empty products
  if (!products || products.length === 0) {
    return (
      <div className="product-grid-container">
        <h2 className="section-title">{title}</h2>
        <div className="empty-products">
          <div className="empty-icon">📦</div>
          <h3>No products found</h3>
          <p>We're working hard to bring you amazing eco-friendly products!</p>
          <p className="empty-subtitle">Check back soon for new sustainable items</p>
        </div>
      </div>
    );
  }

  // Limit products displayed
  const displayProducts = products.slice(0, maxDisplay);
  const totalProducts = products.length;

  return (
    <div className="product-grid-container">
      <div className="section-header">
        <h2 className="section-title">{title}</h2>
        {showViewAll && totalProducts > maxDisplay && (
          <button 
            className="view-all-button"
            onClick={() => navigate(`/search?query=all&category=${products[0]?.category || ''}`)}
          >
            View All ({totalProducts}) →
          </button>
        )}
      </div>
      
      <div className="product-grid">
        {displayProducts.map((product) => (
          <ProductCard
            key={product._id}
            product={product}
          />
        ))}
      </div>

      {/* Show more button for mobile */}
      {showViewAll && totalProducts > maxDisplay && (
        <div className="show-more-mobile">
          <button 
            className="show-more-button"
            onClick={() => navigate(`/search?query=all&category=${products[0]?.category || ''}`)}
          >
            Show {totalProducts - maxDisplay} More Products
          </button>
        </div>
      )}
    </div>
  );
};

export default ProductGrid;
