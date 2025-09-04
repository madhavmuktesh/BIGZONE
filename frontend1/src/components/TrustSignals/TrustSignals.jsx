import React from 'react';
import { trustItems } from './trustItemsData';

const TrustSignals = () => {
    return (
        <section className="section bg-gray">
            <div className="container">
                <div className="trust-signals">
                    {trustItems.map((item, index) => (
                        <div key={index} className="trust-item">
                            <div className="trust-icon"><i className={item.icon}></i></div>
                            <h4 className="trust-title">{item.title}</h4>
                            <p className="trust-description">{item.description}</p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default TrustSignals;
