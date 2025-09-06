import React, { useState, useEffect, useRef } from 'react';

// The Slide component that was missing from your code.
// It renders the image, title, and button for each item in the carousel.
const Slide = ({ slide, isActive }) => (
    <div className="hero-carousel-slide">
        <div className="hero-carousel-slide-inner">
            <img 
                src={slide.imageUrl} 
                alt={slide.title} 
                className="hero-carousel-image" 
            />
            <div className="hero-carousel-image-overlay"></div>
            <article className={`hero-carousel-article ${isActive ? 'active' : ''}`}>
                <h2 className="hero-carousel-title">{slide.title}</h2>
                <div className="hero-carousel-button-wrapper">
                    <button className="hero-carousel-button">
                        {slide.buttonText}
                    </button>
                </div>
            </article>
        </div>
    </div>
);

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
    const intervalRef = useRef(null); // Ref to hold the interval ID

    const handleNext = () => {
        setActiveIndex((prevIndex) => (prevIndex + 1) % slides.length);
    };

    const handlePrev = () => {
        setActiveIndex((prevIndex) => (prevIndex - 1 + slides.length) % slides.length);
    };

    const resetInterval = () => {
        clearInterval(intervalRef.current);
        intervalRef.current = setInterval(handleNext, 5000);
    };
    
    // Set up the auto-play interval
    useEffect(() => {
        resetInterval(); // Start the interval initially
        return () => clearInterval(intervalRef.current); // Cleanup on unmount
    }, []);

    // Effect to handle the sliding animation
    useEffect(() => {
        if (trackRef.current && trackRef.current.children[0]) {
            const slideWidth = trackRef.current.children[0].offsetWidth;
            trackRef.current.style.transform = `translateX(-${activeIndex * slideWidth}px)`;
        }
    }, [activeIndex]);


    const onPrevClick = () => {
        handlePrev();
        resetInterval(); // Reset timer on manual navigation
    };

    const onNextClick = () => {
        handleNext();
        resetInterval(); // Reset timer on manual navigation
    };


    return (
        <section className="hero-carousel-wrapper">
            <div className="hero-carousel-track" ref={trackRef}>
                {slides.map((slide, index) => (
                    <Slide key={index} slide={slide} isActive={index === activeIndex} />
                ))}
            </div>
            <div className="hero-carousel-controls">
                {/* MODIFIED: Replaced <i> tags with SVG icons */}
                <button className="hero-carousel-control previous" onClick={onPrevClick} aria-label="Previous slide">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 12L6 8L10 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </button>
                <button className="hero-carousel-control next" onClick={onNextClick} aria-label="Next slide">
                     <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                </button>
            </div>
        </section>
    );
};

export default HeroCarousel;
