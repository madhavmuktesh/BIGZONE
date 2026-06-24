import React from "react";
import { useNavigate } from "react-router-dom";
import { categoryDetails } from "./categoryDetails";

const Categories = ({ categories = [] }) => {
  const navigate = useNavigate();

  const goToCategory = (name) => {
    const qs = new URLSearchParams({ category: name }).toString();
    navigate(`/search?${qs}`);
  };

  if (!categories || categories.length === 0) return null;

  return (
    <section className="section bg-white" style={{ padding: '40px 0' }}>
      <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 20px' }}>
        <h2 className="section-title" style={{ textAlign: 'center', marginBottom: '30px' }}>Shop by Category</h2>
        
        <div className="categories-grid" style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(120px, 1fr))', 
            gap: '20px', 
            justifyItems: 'center' 
        }}>
          {categories.map((categoryName, index) => {
            const details = categoryDetails[categoryName] || categoryDetails["Others"] || {};
            
            return (
              <button
                key={index}
                type="button"
                className="category-item"
                onClick={() => goToCategory(categoryName)}
                aria-label={`View ${categoryName} products`}
                style={{ 
                    background: 'none', 
                    border: 'none', 
                    cursor: 'pointer', 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center',
                    transition: 'transform 0.2s',
                }}
                onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
                onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <div 
                    className={`category-icon ${details.color || ''}`} 
                    style={{ 
                        width: '80px', 
                        height: '80px', 
                        borderRadius: '50%', 
                        backgroundColor: details.bgColor || '#f3f4f6',
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center',
                        overflow: 'hidden',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                        marginBottom: '10px'
                    }}
                >
                  {/* Render Image if available, otherwise fallback to Icon/Text */}
                  {details.imageUrl ? (
                    <img 
                        src={details.imageUrl} 
                        alt={categoryName} 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                  ) : details.icon ? (
                    <i className={details.icon} style={{ fontSize: '30px', color: '#555' }}></i>
                  ) : (
                    <span style={{ fontSize: '24px', fontWeight: 'bold', color: '#555' }}>
                        {categoryName.charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>
                <h3 className="category-name" style={{ fontSize: '1rem', color: '#374151', margin: 0 }}>
                    {categoryName}
                </h3>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Categories;