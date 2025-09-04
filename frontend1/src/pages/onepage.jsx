import React, { useState, useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import { useCart } from '../context/CartContext';
import "../styles/bigzone1.css"

// Import all components
import Header from '../components/Header/Headermain.jsx';
import HeroCarousel from '../components/HeroCarousel/HeroCarousel.jsx';
import Categories from '../components/Categories/Categories.jsx';
import Promotions from '../components/Promotions/Promotions.jsx';
import ProductsSection from '../components/ProductsSection/ProductsSectionmain.jsx';
import TrustSignals from '../components/TrustSignals/TrustSignals.jsx';
import Footer from '../components/Footer/Footer.jsx';

function Onepage() {
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [deliveryLocation, setDeliveryLocation] = useState("New York");
    const [wishlist, setWishlist] = useState(new Set());

    const { error: cartError, clearError } = useCart();

    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            setError(null);
            try {
                const apiUrl = "http://localhost:5000/api/v1";
                const response = await fetch(`${apiUrl}/products`);

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const data = await response.json();

                if (data.success) {
                    setProducts(data.products);
                    const uniqueCategories = [...new Set(data.products.map(p => p.category))];
                    setCategories(uniqueCategories);
                } else {
                    throw new Error(data.message || 'Failed to load products.');
                }

            } catch(err) {
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

        setWishlist(prevWishlist => {
            const newWishlist = new Set(prevWishlist);
            if (newWishlist.has(productId)) {
                newWishlist.delete(productId);
                toast.success(`Removed "${product.productname}" from wishlist!`);
            } else {
                newWishlist.add(productId);
                toast.success(`Added "${product.productname}" to wishlist!`, { icon: '❤️' });
            }
            return newWishlist;
        });
    };

    if (loading) return <div style={{textAlign: 'center', padding: '5rem', fontSize: '1.5rem', color: 'white', background: '#1a1a1a', height: '100vh'}}>Loading your products...</div>
    if (error) return <div style={{textAlign: 'center', padding: '5rem', color: '#ff8a80', background: '#1a1a1a', height: '100vh'}}>Error: {error}. Please check the API connection.</div>

    return (
        <div style={{ overflowX: 'hidden' }}>
            <Toaster position="top-center" reverseOrder={false} />
            <HeroCarousel />
            <Categories categories={categories} />
            <Promotions />
            <section className="section bg-white">
                <div className="container">
                    <ProductsSection
                        title="Our Products"
                        products={products}
                        onToggleWishlist={handleToggleWishlist}
                        wishlist={wishlist}
                    />
                    {products.length > 8 && (
                        <ProductsSection
                            title="Recommended for You"
                            products={[...products].reverse().slice(0, 8)}
                            onToggleWishlist={handleToggleWishlist}
                            wishlist={wishlist}
                        />
                    )}
                </div>
            </section>
            <TrustSignals />
            <Footer />
        </div>
    );
};

export default Onepage;
