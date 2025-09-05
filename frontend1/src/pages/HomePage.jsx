// src/pages/HomePage.jsx
import React from 'react';
import Header from '../components/Header';
import Dashboard from '../components/Dashboard';
import ProductGrid from '../components/ProductGrid';
import '../styles/Homepage.css';

const HomePage = () => {
  return (
    <>
      <Header />
      <main className="container app-container">
        <Dashboard />
        <ProductGrid />
      </main>
    </>
  );
};

export default HomePage;

/*
// src/pages/HomePage.jsx
import React from 'react';


// Import the components for the home page
import Header from '../components/Header';
import MenuBar from '../components/MenuBar';
import Dashboard from '../components/Dashboard';
import ProductGrid from '../components/ProductGrid';

// Import the main stylesheet
import '../App.css';

const HomePage = () => {
  return (
    <>
      <Header />
      <MenuBar />
      <main className="container app-container">
        <Dashboard />
        <ProductGrid />
      </main>
    </>
  );
};

export default HomePage; */