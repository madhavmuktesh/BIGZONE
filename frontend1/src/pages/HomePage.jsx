import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Dashboard from '../components/Dashboard';
import ProductGrid from '../components/ProductGrid';
import '../styles/Homepage.css';

const HomePage = () => {
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- THIS IS THE ONLY ADDITION ---
  // This hook manages the background theme for this page only.
  useEffect(() => {
    // When this page loads, add the class.
    document.body.classList.add('ecozone-theme');
    
    // When you navigate away from this page, remove the class.
    return () => {
      document.body.classList.remove('ecozone-theme');
    };
  }, []); // The empty [] means this runs only on page load and unload.

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/v1/products');
      const data = await response.json();
      
      if (data.success) {
        setAllProducts(data.products);
      } else {
        setError(data.message || 'Failed to fetch products');
      }
    } catch (err) {
      console.error('Error fetching products:', err);
      setError('Failed to connect to server');
    } finally {
      setLoading(false);
    }
  };

  // Filter products by category for different sections
  const featuredProducts = allProducts.slice(0, 10);
  const beautyProducts = allProducts.filter(p => p.category === 'Beauty').slice(0, 6);
  const homeProducts = allProducts.filter(p => p.category === 'Home & Kitchen').slice(0, 6);
  const electronicsProducts = allProducts.filter(p => p.category === 'Electronics').slice(0, 6);

  return (
    <>
      <Header />
      <main className="container app-container">
        <Dashboard />
        
        {/* Featured Products Section */}
        <ProductGrid 
          products={featuredProducts}
          loading={loading}
          error={error}
          title="🌟 Featured Eco-Friendly Products"
          maxDisplay={10}
          showViewAll={true}
        />

        {/* Category-based Product Sections */}
        {!loading && !error && allProducts.length > 0 && (
          <>
            {/* Beauty Products */}
            {beautyProducts.length > 0 && (
              <ProductGrid 
                products={beautyProducts}
                title="🌸 Eco Beauty & Personal Care"
                maxDisplay={6}
                showViewAll={true}
              />
            )}

            {/* Home & Kitchen Products */}
            {homeProducts.length > 0 && (
              <ProductGrid 
                products={homeProducts}
                title="🏠 Sustainable Home Essentials"
                maxDisplay={6}
                showViewAll={true}
              />
            )}

            {/* Electronics Products */}
            {electronicsProducts.length > 0 && (
              <ProductGrid 
                products={electronicsProducts}
                title="⚡ Green Technology"
                maxDisplay={6}
                showViewAll={true}
              />
            )}
          </>
        )}

        {/* Eco Highlights Section */}
        <section className="eco-highlights">
          <h2 className="section-title">🌍 Why Choose Eco-Friendly?</h2>
          <div className="eco-benefits">
            <div className="benefit-card">
              <div className="benefit-icon">🌱</div>
              <h3>Sustainable Materials</h3>
              <p>Products made from renewable and biodegradable materials that protect our planet</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">♻️</div>
              <h3>Recyclable Packaging</h3>
              <p>Minimal plastic, maximum recyclability in all our packaging solutions</p>
            </div>
            <div className="benefit-card">
              <div className="benefit-icon">🌍</div>
              <h3>Carbon Neutral</h3>
              <p>We offset our carbon footprint with every purchase you make</p>
            </div>
          </div>
        </section>

        {/* Sustainability Stats */}
        <section className="sustainability-stats">
          <h2 className="section-title">📊 Our Impact Together</h2>
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-number">25,000+</div>
              <div className="stat-label">Plastic Items Avoided</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">500+</div>
              <div className="stat-label">Trees Saved</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">10,000+</div>
              <div className="stat-label">Happy Customers</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">100%</div>
              <div className="stat-label">Carbon Neutral</div>
            </div>
          </div>
        </section>
      </main>
    </>
  );
};

export default HomePage;