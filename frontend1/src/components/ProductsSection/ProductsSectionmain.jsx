import React from "react";
import { Link } from "react-router-dom";
import ProductCard from "../ProductCard/ProductCardmain";
import "../ProductsSection/ProductsSection.css";

const ProductsSection = ({
  title,
  products = [],
  onToggleWishlist,
  wishlist,
  viewAllHref = "/search",
}) => {
  return (
    <section className="products-section-block">
      <div className="products-section-header">
        <h2 className="products-section-title">{title}</h2>

        <Link to={viewAllHref} className="products-section-view-all-link">
          View All →
        </Link>
      </div>

      <div className="products-section-grid">
        {products.map((product) => (
          <ProductCard
            key={product._id}
            product={product}
            onToggleWishlist={onToggleWishlist}
            isWishlisted={wishlist.has(product._id)}
          />
        ))}
      </div>
    </section>
  );
};

export default ProductsSection;