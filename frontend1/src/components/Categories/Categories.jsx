import React from 'react';
import { categoryDetails } from './categoryDetails';

const Categories = ({ categories }) => {
    return (
        <section className="section bg-white">
            <div className="container">
                <h2 className="section-title">Shop by Category</h2>
                <div className="categories-grid">
                    {categories.map((categoryName, index) => {
                        const details = categoryDetails[categoryName] || categoryDetails["Others"];
                        return (
                            <div key={index} className="category-item">
                                <div className={`category-icon ${details.color}`}>
                                    <i className={details.icon}></i>
                                </div>
                                <h3 className="category-name">{categoryName}</h3>
                            </div>
                        )
                    })}
                </div>
            </div>
        </section>
    );
};

export default Categories;
