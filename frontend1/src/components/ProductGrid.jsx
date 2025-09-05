// src/components/ProductGrid.js
import React from 'react';
import ProductCard from './ProductCard';
import { StarIcon, ShoppingBagIcon, GlobeIcon } from './Icons';

// In a real app, this data would come from an API
const products = [
  {
    name: 'Bamboo Toothbrush Set',
    rating: '4.8',
    stars: '★★★★★',
    price: '12.99',
    icon: <StarIcon />
  },
  {
    name: 'Cotton Shopping Bags',
    rating: '4.2',
    stars: '★★★★☆',
    price: '8.50',
    icon: <ShoppingBagIcon />
  },
  {
    name: 'Solar Phone Charger',
    rating: '4.9',
    stars: '★★★★★',
    price: '24.99',
    icon: <GlobeIcon />
  },
  {
    name: 'Organic Soap Bar Set',
    rating: '4.3',
    stars: '★★★★☆',
    price: '15.75',
    icon: <StarIcon />
  },
  {
    name: 'Stainless Steel Straws',
    rating: '4.7',
    stars: '★★★★★',
    price: '6.99',
    icon: <GlobeIcon />
  },
];

const ProductGrid = () => {
  return (
    <div className="product-grid">
      {products.map((product, index) => (
        <ProductCard
          key={index}
          name={product.name}
          rating={product.rating}
          stars={product.stars}
          price={product.price}
          icon={product.icon}
        />
      ))}
    </div>
  );
};

export default ProductGrid;