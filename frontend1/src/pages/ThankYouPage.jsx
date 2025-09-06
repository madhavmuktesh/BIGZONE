import React from 'react';
import '../styles/ThankYouPage.css';

// SVG icons as small, reusable components for cleanliness
const SuccessIcon = () => (
    <svg className="icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
    </svg>
);

const EmailIcon = () => (
    <svg className="icon" fill="currentColor" viewBox="0 0 20 20">
        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"></path>
        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"></path>
    </svg>
);


const ThankYouPage = () => {
    return (
        <div className="page-container">
            <div className="card-wrapper">
                {/* Main Card */}
                <div className="thank-you-card">
                    
                    {/* Success Icon */}
                    <div className="icon-section">
                        <div className="success-icon-wrapper">
                            <SuccessIcon />
                        </div>
                    </div>

                    {/* Brand Name */}
                    <div className="brand-section">
                        <h1 className="brand-name">BIGZONE</h1>
                        <div className="brand-underline"></div>
                    </div>

                    {/* Thank You Message */}
                    <div className="message-section">
                        <h2 className="thank-you-title">Thank You for Choosing Us!</h2>
                        <p className="thank-you-text">
                            We truly appreciate your trust in BIGZONE. Your support means the world to us and helps us continue to provide exceptional service.
                        </p>
                    </div>

                    {/* Contact Information */}
                    <div className="contact-info-box">
                        <h3 className="contact-title">Have Any Queries?</h3>
                        <p className="contact-subtitle">We're here to help! Feel free to reach out to us anytime.</p>
                        
                        <div className="contact-email-group">
                            <div className="email-icon-wrapper">
                                <EmailIcon />
                            </div>
                            <a href="mailto:contact@gmail.com" className="email-link">
                                contact@gmail.com
                            </a>
                        </div>
                    </div>

                    {/* Decorative Elements */}
                    <div className="decorative-dots">
                        <div className="dot"></div>
                        <div className="dot"></div>
                        <div className="dot"></div>
                    </div>
                </div>

                {/* Footer */}
                <footer className="page-footer">
                    <p className="footer-text">© 2024 BIGZONE. All rights reserved.</p>
                </footer>
            </div>
        </div>
    );
};

export default ThankYouPage;
