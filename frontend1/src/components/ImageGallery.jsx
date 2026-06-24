import React, { useState } from 'react';

const ImageGallery = ({ images = [], productName = "Product" }) => {
  const [activeThumbnail, setActiveThumbnail] = useState(0);

  const displayImages = images.length > 0 ? images : [{ url: '/placeholder-image.jpg', public_id: 'placeholder' }];

  const handleNext = () => {
      setActiveThumbnail((prev) => (prev + 1) % displayImages.length);
  };

  const handlePrev = () => {
      setActiveThumbnail((prev) => (prev - 1 + displayImages.length) % displayImages.length);
  };

  return (
    <div className="image-gallery-container">
      <div className="thumbnail-gallery">
        {displayImages.map((image, index) => (
          <div
            key={image.public_id || index}
            className={`thumbnail ${activeThumbnail === index ? 'active' : ''}`}
            onClick={() => setActiveThumbnail(index)}
            style={{ cursor: 'pointer', border: activeThumbnail === index ? '2px solid #0066cc' : '1px solid #ddd' }}
          >
            <img 
              src={image.url} 
              alt={`${productName} thumbnail ${index + 1}`}
              onError={(e) => { e.target.src = '/placeholder-image.jpg'; }}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        ))}
      </div>
      
      <div className="main-image-container" style={{ position: 'relative', overflow: 'hidden' }}>
        {displayImages.length > 1 && (
            <button 
                onClick={handlePrev} 
                style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.8)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer', zIndex: 2, fontSize: '20px' }}
            >
                &#8592;
            </button>
        )}
        
        <img 
          src={displayImages[activeThumbnail]?.url || '/placeholder-image.jpg'} 
          alt={productName}
          onError={(e) => { e.target.src = '/placeholder-image.jpg'; }}
          style={{ width: '100%', height: 'auto', objectFit: 'contain' }}
        />

        {displayImages.length > 1 && (
            <button 
                onClick={handleNext} 
                style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'rgba(255,255,255,0.8)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', cursor: 'pointer', zIndex: 2, fontSize: '20px' }}
            >
                &#8594;
            </button>
        )}
      </div>
    </div>
  );
};

export default ImageGallery;