import React, { useRef } from 'react';

const Slide = ({ slide, isActive }) => {
    const slideRef = useRef(null);

    const handleMouseMove = (e) => {
        if (!slideRef.current) return;
        const { clientX, clientY, currentTarget } = e;
        const { left, top, width, height } = currentTarget.getBoundingClientRect();
        const x = (clientX - left) / width - 0.5;
        const y = (clientY - top) / height - 0.5;
        const rotateX = y * -20;
        const rotateY = x * 20;
        slideRef.current.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    };
    
    const handleMouseLeave = () => {
        if (slideRef.current) {
            slideRef.current.style.transform = `rotateX(0deg) rotateY(0deg)`;
        }
    };

    return (
        <div className="hero-carousel-perspective-wrapper">
            <div className={`hero-carousel-slide ${isActive ? 'active' : ''}`}>
                <div 
                    className="hero-carousel-slide-inner"
                    ref={slideRef}
                    onMouseMove={handleMouseMove}
                    onMouseLeave={handleMouseLeave}
                >
                    <img src={slide.imageUrl} alt={slide.title} className="hero-carousel-image" />
                    <div className="hero-carousel-image-overlay"></div>
                    <article className={`hero-carousel-article ${isActive ? 'active' : ''}`}>
                        <h2 className="hero-carousel-title">{slide.title}</h2>
                        <div className="hero-carousel-button-wrapper">
                            <button className="hero-carousel-button">{slide.buttonText}</button>
                        </div>
                    </article>
                </div>
            </div>
        </div>
    );
};

export default Slide;
