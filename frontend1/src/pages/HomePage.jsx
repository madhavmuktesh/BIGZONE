// src/pages/HomePage.jsx
import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Dashboard from '../components/Dashboard';
import ProductGrid from '../components/ProductGrid';
import '../styles/HomePage.css';
import { fetchAllProductsAPI } from '../services/apiService'; // Your API service

const HomePage = () => {
  const [products, setProducts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setIsLoading(true);
        const data = await fetchAllProductsAPI();
        if (data.success) {
          setProducts(data.products);
        } else {
          throw new Error(data.message || 'Failed to fetch products.');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadProducts();
  }, []); // Runs once on component mount

  return (
    <>
      <Header />
      <main className="container app-container">
        <Dashboard />
        <ProductGrid 
          products={products}
          isLoading={isLoading}
          error={error}
        />
      </main>
    </>
  );
};

export default HomePage;