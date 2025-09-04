// src/components/ImageGallery.jsx
import React, { useState } from 'react';
import { StarIcon } from './Icons';

const ImageGallery = ({ images = [], productName = "Product" }) => {
  const [activeThumbnail, setActiveThumbnail] = useState(0);

  // Fallback for when no images are provided
  const displayImages = images.length > 0 ? images : [{ url: '/placeholder-image.jpg', public_id: 'placeholder' }];

  return (
    <div className="image-gallery-container">
      <div className="thumbnail-gallery">
        {displayImages.map((image, index) => (
          <div
            key={image.public_id || index}
            className={`thumbnail ${activeThumbnail === index ? 'active' : ''}`}
            onClick={() => setActiveThumbnail(index)}
          >
            <img 
              src={image.url} 
              alt={`${productName} thumbnail ${index + 1}`}
              onError={(e) => {
                e.target.src = '/placeholder-image.jpg';
              }}
            />
          </div>
        ))}
      </div>
      <div className="main-image-container">
        <img 
          src={displayImages[activeThumbnail]?.url || '/placeholder-image.jpg'} 
          alt={productName}
          onError={(e) => {
            e.target.src = '/placeholder-image.jpg';
          }}
        />
      </div>
    </div>
  );
};

export default ImageGallery;
