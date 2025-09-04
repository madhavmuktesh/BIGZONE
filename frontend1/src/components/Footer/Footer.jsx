import React from 'react';

const Footer = () => {
    return (
        <footer className="footer">
            <div className="container">
                <div className="footer-content">
                    <div className="footer-section">
                        <h3>BIGZONE</h3>
                        <p className="footer-description">Your ultimate shopping destination.</p>
                        <div className="social-links">
                            <a href="#" className="social-link"><i className="fab fa-facebook-f"></i></a>
                            <a href="#" className="social-link"><i className="fab fa-twitter"></i></a>
                            <a href="#" className="social-link"><i className="fab fa-instagram"></i></a>
                            <a href="#" className="social-link"><i className="fab fa-youtube"></i></a>
                        </div>
                    </div>
                    <div className="footer-section">
                        <h4>Customer Service</h4>
                        <ul className="footer-links">
                            <li><a href="#">Contact Us</a></li>
                            <li><a href="#">FAQ</a></li>
                            <li><a href="#">Shipping Info</a></li>
                            <li><a href="#">Returns</a></li>
                        </ul>
                    </div>
                    <div className="footer-section">
                        <h4>Company</h4>
                        <ul className="footer-links">
                            <li><a href="#">About Us</a></li>
                            <li><a href="#">Careers</a></li>
                            <li><a href="#">Privacy Policy</a></li>
                            <li><a href="#">Terms of Service</a></li>
                        </ul>
                    </div>
                    <div className="footer-section">
                        <h4>Newsletter</h4>
                        <p className="footer-description">Get special offers and updates.</p>
                        <div className="newsletter-form">
                            <input type="email" placeholder="Enter your email" className="newsletter-input" />
                            <button className="newsletter-button">Subscribe</button>
                        </div>
                    </div>
                </div>
                <div className="footer-bottom">
                    <p>&copy; 2024 BIGZONE. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
