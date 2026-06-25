import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import { useCart } from '../context/CartContext.jsx';
import "../styles/bigzone1.css";

import Header from '../components/Header/Headermain.jsx';
import HeroCarousel from '../components/HeroCarousel/HeroCarousel.jsx';
import Categories from '../components/Categories/Categories.jsx';
import Promotions from '../components/Promotions/Promotions.jsx';
import ProductsSection from '../components/ProductsSection/ProductsSectionmain.jsx';
import TrustSignals from '../components/TrustSignals/TrustSignals.jsx';
import Footer from '../components/Footer/Footer.jsx';

function Homepage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [wishlist, setWishlist] = useState(new Set());
  const { error: cartError, clearError } = useCart();

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/v1/products`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const data = await response.json();

        if (data.success) {
          const list = data.products || [];
          setProducts(list);
          setCategories([...new Set(list.map((p) => p.category).filter(Boolean))]);
        } else {
          throw new Error(data.message || 'Failed to load products.');
        }
      } catch (err) {
        setError(err.message);
        toast.error(`API Error: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    if (cartError) {
      toast.error(cartError);
      clearError();
    }
  }, [cartError, clearError]);

  const handleToggleWishlist = (productId) => {
    const product = products.find((p) => p._id === productId);
    if (!product) return;

    setWishlist((prevWishlist) => {
      const next = new Set(prevWishlist);
      if (next.has(productId)) {
        next.delete(productId);
        toast.success(`Removed "${product.productname}" from wishlist!`);
      } else {
        next.add(productId);
        toast.success(`Added "${product.productname}" to wishlist!`, { icon: '❤️' });
      }
      return next;
    });
  };

  if (loading) {
    return (
      <div className="home-state">
        Loading your products...
      </div>
    );
  }

  if (error) {
    return (
      <div className="home-state home-state-error">
        Error: {error}. Please check the API connection.
      </div>
    );
  }

  return (
    <div className="home-page">
      <Toaster position="top-center" reverseOrder={false} />
      <main className="home-main">
        <HeroCarousel />
        <Categories categories={categories} />
        <Promotions />
        <section className="section section-surface">
          <div className="container">
            <ProductsSection
              title="Our Products"
              products={products}
              onToggleWishlist={handleToggleWishlist}
              wishlist={wishlist}
              viewAllHref="/search"
            />
            {products.length > 8 && (
              <ProductsSection
                title="Recommended for You"
                products={[...products].slice(0, 8)}
                onToggleWishlist={handleToggleWishlist}
                wishlist={wishlist}
                viewAllHref="/search"
              />
            )}
          </div>
        </section>
        <TrustSignals />
      </main>
      <Footer />
    </div>
  );
}

export default Homepage;