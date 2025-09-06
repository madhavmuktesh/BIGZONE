import React from "react";
import { useNavigate } from "react-router-dom";
import { categoryDetails } from "./categoryDetails";
import "./Categories.css";


const Categories = ({ categories }) => {
  const navigate = useNavigate();

  const goToCategory = (name) => {
    const qs = new URLSearchParams({ category: name }).toString();
    navigate(`/search?${qs}`);
  };

  return (
    <section className="section bg-white">
      <div className="container">
        <h2 className="section-title">Shop by Category</h2>
        <div className="categories-grid">
          {categories.map((categoryName, index) => {
            const details = categoryDetails[categoryName] || categoryDetails["Others"];
            return (
              <button
                key={index}
                type="button"
                className="category-item"
                onClick={() => goToCategory(categoryName)}
                aria-label={`View ${categoryName} products`}
              >
                <img src={details.img} alt={categoryName} className="category-img" />
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
