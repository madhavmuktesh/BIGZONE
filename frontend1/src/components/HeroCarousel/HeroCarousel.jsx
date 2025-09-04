import React, { useState, useEffect, useRef } from 'react';
import Slide from './Slide';

const HeroCarousel = () => {
    const slides = [
        {
            title: "Discover Our New Electronics Collection",
            buttonText: "Shop Electronics",
            imageUrl: "https://images.unsplash.com/photo-1525547719571-a2d4ac8945e2?q=80&w=2264&auto=format&fit=crop"
        },
        {
            title: "Upgrade Your Style with the Latest Fashion",
            buttonText: "Explore Fashion",
            imageUrl: "https://images.unsplash.com/photo-1445205170230-053b83016050?q=80&w=2371&auto=format&fit=crop"
        },
        {
            title: "Create Your Dream Home Oasis",
            buttonText: "View Home Goods",
            imageUrl: "https://images.unsplash.com/photo-1556020685-ae41abfc9365?q=80&w=2187&auto=format&fit=crop"
        },
    ];

    const [activeIndex, setActiveIndex] = useState(0);
    const trackRef = useRef(null);

    const handleNext = () => {
        setActiveIndex((prevIndex) => (prevIndex + 1) % slides.length);
    };

    const handlePrev = () => {
        setActiveIndex((prevIndex) => (prevIndex - 1 + slides.length) % slides.length);
    };

    useEffect(() => {
        const interval = setInterval(handleNext, 5000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (trackRef.current && trackRef.current.children[0]) {
            const slideWidth = trackRef.current.children[0].offsetWidth;
            trackRef.current.style.transform = `translateX(-${activeIndex * slideWidth}px)`;
        }
    }, [activeIndex]);

    return (
        <section className="hero-carousel-wrapper">
            <div className="hero-carousel-track" ref={trackRef}>
                {slides.map((slide, index) => (
                    <Slide key={index} slide={slide} isActive={index === activeIndex} />
                ))}
            </div>
            <div className="hero-carousel-controls">
                <button className="hero-carousel-control previous" onClick={handlePrev}>
                    <i className="fas fa-arrow-left"></i>
                </button>
                <button className="hero-carousel-control next" onClick={handleNext}>
                    <i className="fas fa-arrow-right"></i>
                </button>
            </div>
        </section>
    );
};

export default HeroCarousel;
