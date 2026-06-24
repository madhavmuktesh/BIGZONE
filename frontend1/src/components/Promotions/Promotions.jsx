import React, { useState, useEffect } from 'react';
import { promotionsData } from './promotionsData';

// NEW: Live ticking countdown timer component
const LiveCountdown = ({ hours, minutes }) => {
    const [secondsLeft, setSecondsLeft] = useState((hours * 3600) + (minutes * 60));

    useEffect(() => {
        if (secondsLeft <= 0) return;
        const timer = setInterval(() => {
            setSecondsLeft(prev => prev - 1);
        }, 1000);
        return () => clearInterval(timer);
    }, [secondsLeft]);

    const h = Math.floor(secondsLeft / 3600);
    const m = Math.floor((secondsLeft % 3600) / 60);
    const s = secondsLeft % 60;

    // Formatting to ensure double digits (e.g., 09s instead of 9s)
    const format = (num) => num.toString().padStart(2, '0');

    return (
        <span style={{ color: '#d93025', fontWeight: 'bold' }}>
            Ends in: {format(h)}h {format(m)}m {format(s)}s
        </span>
    );
};

const Promotions = () => {
    return (
        <section className="section bg-gray">
            <div className="container">
                <h2 className="section-title">Limited Time Offers</h2>
                <div className="promotions-grid">
                    {promotionsData.map((promo, index) => (
                        <div key={index} className={`promotion-card ${promo.color}`}>
                            <div className="promotion-header">
                                <h3 className="promotion-title">{promo.title}</h3>
                                <span className="promotion-badge">{promo.badge}</span>
                            </div>
                            <p className="promotion-description">{promo.description}</p>
                            
                            <div className="promotion-footer">
                                {/* FIXED: Render live timer if it's the Flash Sale */}
                                <span className="promotion-time">
                                    {promo.title === "Flash Sale" ? (
                                        <LiveCountdown hours={2} minutes={45} />
                                    ) : (
                                        promo.time
                                    )}
                                </span>
                                <button className="promotion-button">{promo.buttonText}</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Promotions;