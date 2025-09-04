import React, { useState } from 'react';
import { Link } from 'react-router-dom'; // Import Link for routing
import "../styles/ecozone.css";

// --- Reusable Components (Copied from Bigzone for consistency) ---

const Header = () => (
    <header className="header">
        <nav className="container">
            <div className="nav-container">
                <Link to="/" className="logo">Luxe</Link>
                
                <div className="search-bar-container">
                    <input type="text" placeholder="Search for products..." className="search-input" />
                    <button className="search-button">
                        <svg style={{height: '1.25rem', width: '1.25rem'}} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                        </svg>
                    </button>
                </div>

                <div className="header-actions">
                    {/* Changed to BIGZONE button linking to homepage */}
                    <Link to="/" className="header-action-btn">BIGZONE</Link>
                    <Link to="/cart" className="header-action-btn cart-btn">
                        <svg style={{height: '1.5rem', width: '1.5rem'}} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                        <span>CART</span>
                    </Link>
                </div>
            </div>
        </nav>
    </header>
);

const SubNav = ({ onMenuClick }) => (
    <div className="sub-nav-bar">
        <div className="container sub-nav-container">
            <div className="sub-nav-links">
                <a href="#">Profile</a>
                <a href="#">Orders</a>
                <a href="#">Contact Us</a>
            </div>
            <button className="menu-button" onClick={onMenuClick}>
                Menu
                <svg style={{height: '1.25rem', width: '1.25rem', marginLeft: '0.5rem'}} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
            </button>
        </div>
    </div>
);

const DropdownMenu = ({ isOpen }) => (
    <div className={`dropdown-menu ${isOpen ? 'open' : ''}`}>
        <a href="#">Sell on Bigzone</a>
        <a href="#">Gift Cards</a>
        <a href="#">Customer Service</a>
        <a href="#">Help</a>
    </div>
);


const Ecozone = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const toggleDropdown = () => setIsDropdownOpen(!isDropdownOpen);

  const featuredProducts = [
    { id: 1, name: "Bamboo Toothbrush Set", price: "$12.99", img: "https://images.unsplash.com/photo-1591857177580-22b4f3dd388c?q=80&w=1200&auto=format&fit=crop" },
    { id: 2, name: "Reusable Coffee Cup", price: "$16.50", img: "https://images.unsplash.com/photo-1532423549790-8fa3e2b9e6cc?q=80&w=1200&auto=format&fit=crop" },
    { id: 3, name: "Organic Cotton Tote", price: "$9.90", img: "https://images.unsplash.com/photo-1544441893-675973e31985?q=80&w=1200&auto=format&fit=crop" },
    { id: 4, name: "Solar Garden Light", price: "$24.00", img: "https://images.unsplash.com/photo-1502481851512-e9e2529bfbf9?q=80&w=1200&auto=format&fit=crop" },
    { id: 5, name: "Glass Spray Bottle", price: "$14.25", img: "https://images.unsplash.com/photo-1604335399105-a0c9cba3c1a0?q=80&w=1200&auto=format&fit=crop" },
    { id: 6, name: "Stainless Steel Straw Kit", price: "$7.80", img: "https://images.unsplash.com/photo-1556228720-195a672e8a03?q=80&w=1200&auto=format&fit=crop" },
    { id: 7, name: "Compost Bin", price: "$39.99", img: "https://images.unsplash.com/photo-1592982537447-9e23ceab5393?q=80&w=1200&auto=format&fit=crop" },
    { id: 8, name: "Natural Bar Soap", price: "$5.50", img: "https://images.unsplash.com/photo-1587017539504-67cfbddac569?q=80&w=1200&auto=format&fit=crop" },
  ];

  return (
    <div style={{ position: 'relative' }}>
      <Header />
      <SubNav onMenuClick={toggleDropdown} />
      <DropdownMenu isOpen={isDropdownOpen} />

      <main className="ecozone" id="main-content">
        <section className="container hero" aria-label="Hero">
          <div className="hero-media">
            <img
              className="hero-image"
              src="https://images.unsplash.com/photo-1588392382834-a891154bca4d?q=80&w=1470&auto=format&fit=crop"
              alt="Eco-friendly lifestyle products with plants and reusable items"
              loading="eager"
            />
            <div className="hero-overlay" aria-hidden="true"></div>
            <div className="hero-content">
              <div className="hero-inner">
                <span className="hero-kicker">Ecozone</span>
                <h1 className="hero-title">Ecozone — Buy & Sell Eco-Friendly Products</h1>
                <p className="hero-sub">
                  Discover earth-friendly products from responsible sellers and make every purchase count.
                </p>
                <div className="search-wrap">
                  <form className="search-bar" role="search" aria-label="Sitewide search">
                    <input
                      className="search-input"
                      type="search"
                      placeholder="Search for eco-friendly products..."
                      aria-label="Search for eco-friendly products"
                    />
                    <button className="btn btn-primary search-btn" type="submit">Search</button>
                  </form>
                </div>
                <div style={{ marginTop: "0.75rem" }}>
                  <Link to="/products" className="btn btn-primary">Shop Now</Link>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="container categories" aria-labelledby="categories-heading">
          <div className="categories-header">
            <h2 id="categories-heading">Shop by Category</h2>
          </div>
          <div className="category-list">
            <Link className="category-card" to="/products?category=reusables" aria-label="Reusables">
              <div className="category-icon" aria-hidden="true">♻️</div>
              <div>
                <div className="category-name">Reusables</div>
                <div className="category-desc">Bottles, cutlery & bags</div>
              </div>
            </Link>
            <Link className="category-card" to="/products?category=organic" aria-label="Organic">
              <div className="category-icon" aria-hidden="true">🌿</div>
              <div>
                <div className="category-name">Organic</div>
                <div className="category-desc">Food & skincare</div>
              </div>
            </Link>
            <Link className="category-card" to="/products?category=solar" aria-label="Solar">
              <div className="category-icon" aria-hidden="true">☀️</div>
              <div>
                <div className="category-name">Solar</div>
                <div className="category-desc">Lights & chargers</div>
              </div>
            </Link>
            <Link className="category-card" to="/products?category=cleaning" aria-label="Eco Cleaning">
              <div className="category-icon" aria-hidden="true">🧴</div>
              <div>
                <div className="category-name">Eco Cleaning</div>
                <div className="category-desc">Refills & concentrates</div>
              </div>
            </Link>
            <Link className="category-card" to="/products?category=zero-waste" aria-label="Zero Waste">
              <div className="category-icon" aria-hidden="true">🛍️</div>
              <div>
                <div className="category-name">Zero Waste</div>
                <div className="category-desc">Plastic-free essentials</div>
              </div>
            </Link>
            <Link className="category-card" to="/products?category=home-garden" aria-label="Home & Garden">
              <div className="category-icon" aria-hidden="true">🏡</div>
              <div>
                <div className="category-name">Home & Garden</div>
                <div className="category-desc">Composters & tools</div>
              </div>
            </Link>
          </div>
        </section>

        <section className="container featured" aria-labelledby="featured-heading">
          <h2 id="featured-heading">Featured Products</h2>
          <div className="product-grid">
            {featuredProducts.map((product) => (
              <article key={product.id} className="product-card">
                <div className="product-media">
                  <img src={product.img} alt={product.name} loading="lazy" />
                </div>
                <div className="product-body">
                  <h3 className="product-name">{product.name}</h3>
                  <div className="product-price">{product.price}</div>
                  <Link className="btn btn-primary" to={`/products/${product.id}`}>View Details</Link>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="container promo" aria-label="Promotional banner">
          <img src="https://images.unsplash.com/photo-1528194822419-dba499b3a393?q=80&w=1200&auto=format&fit=crop" alt="Top Rated Sellers on Ecozone" loading="lazy" />
        </section>
      </main>

      <footer className="site-footer" role="contentinfo">
        <div className="container footer-inner">
          <div className="footer-grid">
            <article>
              <div className="ez-logo" aria-label="Ecozone">
                <span className="ez-logo-mark" aria-hidden="true"></span>
                Ecozone
              </div>
              <p className="hero-sub" style={{ marginTop: "0.5rem" }}>
                A marketplace for planet-positive products.
              </p>
            </article>
            <article>
              <h3 className="footer-title">Company</h3>
              <div className="footer-links">
                <a href="#">About Us</a>
                <a href="#">Contact</a>
                <a href="#">Terms</a>
                <a href="#">Privacy</a>
              </div>
            </article>
            <article>
              <h3 className="footer-title">Follow Us</h3>
              <div className="social">
                <a href="#" aria-label="Twitter" title="Twitter">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M22.46 6c-.77.35-1.6.58-2.46.69a4.23 4.23 0 0 0 1.86-2.33 8.51 8.51 0 0 1-2.69 1.03 4.23 4.23 0 0 0-7.2 3.86A12 12 0 0 1 3.16 4.9a4.22 4.22 0 0 0 1.31 5.64 4.18 4.18 0 0 1-1.92-.53v.05a4.24 4.24 0 0 0 3.39 4.15 4.2 4.2 0 0 1-1.91.07 4.24 4.24 0 0 0 3.95 2.94A8.49 8.49 0 0 1 2 19.54a12 12 0 0 0 6.49 1.9c7.79 0 12.05-6.45 12.05-12.05 0-.18 0-.35-.01-.53A8.6 8.6 0 0 0 24 6.59a8.38 8.38 0 0 1-2.54.7Z"/></svg>
                </a>
                <a href="#" aria-label="Instagram" title="Instagram">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M7 2C4.24 2 2 4.24 2 7v10c0 2.76 2.24 5 5 5h10c2.76 0 5-2.24 5-5V7c0-2.76-2.24-5-5-5H7Zm10 2a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h10Zm-5 3.5A5.5 5.5 0 1 0 17.5 13 5.51 5.51 0 0 0 12 7.5Zm0 2A3.5 3.5 0 1 1 8.5 13 3.5 3.5 0 0 1 12 9.5ZM18 6.25a.75.75 0 1 0 .75.75.75.75 0 0 0-.75-.75Z"/></svg>
                </a>
                <a href="#" aria-label="Facebook" title="Facebook">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M13.5 22v-8.25H16L16.5 10h-3V8.25c0-.72.23-1.25 1.25-1.25h1.75V4.25C16.18 4.17 15.2 4 14.12 4 11.88 4 10.25 5.5 10.25 8v2H8v3.75h2.25V22h3.25Z"/></svg>
                </a>
              </div>
            </article>
          </div>
          <div className="footer-bottom">
            <div className="container">
              <p>© {new Date().getFullYear()} Ecozone. All rights reserved.</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Ecozone;