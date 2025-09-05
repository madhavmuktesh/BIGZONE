import React from 'react';
import { Link } from 'react-router-dom';
import { HeartIcon } from './Icons';

const ProductCard = ({ name, rating, stars, price, icon }) => {
  return (
    <div className="product-card">
      <div className="product-image-container">
        <div className="product-image">
          {icon}
        </div>
        <button className="wishlist-button">
          <HeartIcon />
        </button>
      </div>
      <div className="product-info">
        <h3>{name}</h3>
        <div className="product-rating">
          <div className="rating-stars">{stars}</div>
          <span className="rating-count">({rating})</span>
        </div>
        <div className="product-price">${price}</div>
        <div className="product-buttons">
          <Link to={`/product/${name.replace(/\s+/g, '-').toLowerCase()}`}>
            <button className="btn-view">View</button>
          </Link>
          <button className="btn-add">Add</button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
