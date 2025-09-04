import React from 'react';

export const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
        if (i <= Math.floor(rating)) stars.push(<i key={i} className="fas fa-star"></i>);
        else if (i <= rating) stars.push(<i key={i} className="fas fa-star-half-alt"></i>);
        else stars.push(<i key={i} className="far fa-star"></i>);
    }
    return stars;
};
