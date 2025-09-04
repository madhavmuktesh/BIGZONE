// src/components/RatingBar.jsx
import React from 'react';

const RatingBar = ({ label, percentage }) => {
  return (
    <div className="rating-bar-wrapper">
      <div className="rating-bar-labels">
        <span className="label">{label}</span>
        <span className="percentage">{percentage}%</span>
      </div>
      <div className="rating-bar-track">
        <div className="rating-bar-fill" style={{ width: `${percentage}%` }}></div>
      </div>
    </div>
  );
};

export default RatingBar;