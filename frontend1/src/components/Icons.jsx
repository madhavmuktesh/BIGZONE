// src/components/Icons.js
// This file centralizes all SVGs for easier management.

import React from 'react';

// --- Icons from HomePage ---

export const UserIcon = (props) => (
  <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
  </svg>
);

export const StarIcon = (props) => (
  <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
    <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
  </svg>
);

export const ShoppingBagIcon = (props) => (
    <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
        <path d="M19 7h-3V6a4 4 0 0 0-8 0v1H5a1 1 0 0 0-1 1v11a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V8a1 1 0 0 0-1-1zM10 6a2 2 0 0 1 4 0v1h-4V6zm8 13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V9h2v1a1 1 0 0 0 2 0V9h4v1a1 1 0 0 0 2 0V9h2v10z" />
    </svg>
);

export const RefreshIcon = (props) => (
    <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
        <path d="M13 3c-4.97 0-9 4.03-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0013 21c4.97 0 9-4.03 9-9s-4.03-9-9-9z" />
    </svg>
);


// --- Icons from ProductDetailPage & Header ---

export const ChevronLeftIcon = (props) => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
    </svg>
);

export const HeartIcon = (props) => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
    </svg>
);

export const ShoppingCartIcon = (props) => (
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01"></path>
    </svg>
);

export const ShareIcon = (props) => (
    <svg className="w-6 h-6 text-evergreen" fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z"></path>
    </svg>
);

export const CheckIcon = (props) => (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" {...props}>
        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
    </svg>
);

export const CheckCircleIcon = (props) => (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" {...props}>
         <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
    </svg>
);

export const GlobeIcon = (props) => (
    <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" />
    </svg>
);

export const LeafIcon = (props) => (
    <svg fill="currentColor" viewBox="0 0 24 24" {...props}>
        <path d="M17 8C8 10 5.9 16.17 3.82 21.34l1.89.66.95-2.3c.48.17.98.3 1.34.3C19 20 22 3 22 3c-1 2-8 2.25-13 3.25S2 11.5 2 13.5s1.75 3.75 1.75 3.75S7 8 17 8z"/>
    </svg>
);


// --- NEW ICONS FOR THE CART PAGE ---

export const MinusIcon = (props) => (
    <svg className="w-4 h-4 text-evergreen" fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4"></path>
    </svg>
);

export const PlusIcon = (props) => (
    <svg className="w-4 h-4 text-evergreen" fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
    </svg>
);

export const TrashIcon = (props) => (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
    </svg>
);

export const EcoIcon = (props) => (
    <svg className="w-4 h-4 text-last-lettuce" fill="currentColor" viewBox="0 0 24 24" {...props}>
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.94-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
    </svg>
);