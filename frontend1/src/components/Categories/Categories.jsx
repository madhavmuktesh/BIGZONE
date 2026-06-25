import React from "react";
import { useNavigate } from "react-router-dom";
import { categoryDetails } from "./categoryDetails";

const Categories = ({ categories = [] }) => {
  const navigate = useNavigate();

  const goToCategory = (name) => {
    const qs = new URLSearchParams({ category: name }).toString();
    navigate(`/search?query=${encodeURIComponent(name)}`);
  };

  if (!categories.length) return null;

  return (
    <section className="section section-surface">
      <div className="container">
        <h2 className="section-title">Shop by Category</h2>

        <div className="categories-grid">
          {categories.map((categoryName) => {
            const details = categoryDetails[categoryName] || categoryDetails.Others || {};

            return (
              <button
                key={categoryName}
                type="button"
                className="category-card"
                onClick={() => goToCategory(categoryName)}
                aria-label={`View ${categoryName} products`}
              >
                <div className={`category-icon ${details.color || 'gray'}`}>
                  {details.imageUrl ? (
                    <img src={details.imageUrl} alt={categoryName} className="category-image" />
                  ) : details.icon ? (
                    <i className={details.icon} aria-hidden="true" />
                  ) : (
                    <span>{categoryName.charAt(0).toUpperCase()}</span>
                  )}
                </div>
                <h3 className="category-name">{categoryName}</h3>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Categories;