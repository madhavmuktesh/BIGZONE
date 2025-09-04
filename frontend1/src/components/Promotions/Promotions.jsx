import React from 'react';
import { promotionsData } from './promotionsData';

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
                                <span className="promotion-time">{promo.time}</span>
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
