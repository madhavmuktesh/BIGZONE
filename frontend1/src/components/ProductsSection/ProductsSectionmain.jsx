import React from 'react';
import ProductCard from '../ProductCard/ProductCardmain';

const ProductsSection = ({ title, products, onToggleWishlist, wishlist }) => {
    return (
        <div className="products-section">
            <div className="products-header">
                <h2 className="products-title">{title}</h2>
                <a href="#" className="view-all-link">View All →</a>
            </div>
            <div className="products-grid">
                {products.map((product) => (
                    <ProductCard 
                        key={product._id} 
                        product={product} 
                        onToggleWishlist={onToggleWishlist}
                        isWishlisted={wishlist.has(product._id)}
                    />
                ))}
            </div>
        </div>
    );
};

export default ProductsSection;
