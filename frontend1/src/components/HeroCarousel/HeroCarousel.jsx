import React, { useState, useEffect } from 'react';
import Slide from './Slide';
import "./herocarousel.css"

const HeroCarousel = () => {
    // We added the exact search paths to each slide's data
    const slides = [
        {
            title: "Discover Our New Electronics Collection",
            buttonText: "Shop Electronics",
            imageUrl: "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?q=80&w=2264&auto=format&fit=crop",
            link: "/search?query=Electronics"
        },
        {
            title: "Upgrade Your Style with the Latest Fashion",
            buttonText: "Explore Fashion",
            imageUrl: "https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=2371&auto=format&fit=crop",
            link: "/search?query=Clothing"
        },
        {
            title: "Create Your Dream Home Oasis",
            buttonText: "View Home Goods",
            imageUrl: "https://images.unsplash.com/photo-1556020685-ae41abfc9365?q=80&w=2187&auto=format&fit=crop",
            link: "/search?query=Home%20%26%20Kitchen"
        },
    ];

    const [activeIndex, setActiveIndex] = useState(0);

    const handleNext = () => setActiveIndex((prev) => (prev + 1) % slides.length);
    const handlePrev = () => setActiveIndex((prev) => (prev - 1 + slides.length) % slides.length);

    useEffect(() => {
        const interval = setInterval(handleNext, 5000);
        return () => clearInterval(interval);
    }, []);

    return (
        <section className="hero-carousel-wrapper" style={{ overflow: 'hidden', width: '100%', position: 'relative' }}>
            {/* Using a bulletproof CSS percentage transform instead of offsetWidth pixels */}
            <div 
                className="hero-carousel-track" 
                style={{ 
                    display: 'flex', 
                    width: '100%',
                    transition: 'transform 0.5s ease-in-out',
                    transform: `translateX(-${activeIndex * 100}%)` 
                }}
            >
                {slides.map((slide, index) => (
                    <div key={index} style={{ minWidth: '100%', flexShrink: 0 }}>
                        <Slide slide={slide} isActive={index === activeIndex} />
                    </div>
                ))}
            </div>
            
            <div className="hero-carousel-controls" style={{ position: 'absolute', top: '50%', width: '100%', display: 'flex', justifyContent: 'space-between', transform: 'translateY(-50%)', padding: '0 20px', pointerEvents: 'none' }}>
                <button className="hero-carousel-control previous" onClick={handlePrev} style={{ pointerEvents: 'auto' }}>
                    <i className="fas fa-arrow-left"></i>
                </button>
                <button className="hero-carousel-control next" onClick={handleNext} style={{ pointerEvents: 'auto' }}>
                    <i className="fas fa-arrow-right"></i>
                </button>
            </div>
        </section>
    );
};

export default HeroCarousel;