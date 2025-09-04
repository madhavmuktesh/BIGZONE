// src/pages/ProductDetailPage.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import "../styles/ProductPage.css";

import ProductHeader from "../components/ProductHeader";
import ImageGallery from "../components/ImageGallery";
import ProductInfo from "../components/ProductInfo";
import ApiService from "../services/api";

const ProductDetailPage = () => {
  const { id } = useParams(); // expects /products/:id
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await ApiService.getProduct(id);

        // Ensure product data exists
        if (!response || !response.product) {
          throw new Error("Product not found");
        }

        setProduct(response.product);
      } catch (err) {
        console.error("Failed to fetch product:", err);
        setError(err.message || "Failed to load product");
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchProduct();
  }, [id]);

  if (loading) return <div className="loading">Loading product...</div>;
  if (error) return <div className="error">{error}</div>;
  if (!product) return <div className="error">Product not found</div>;

  return (
    <div className="product-page-body">
      <ProductHeader />
      <main className="product-container">
        <div className="product-card-main">
          <ImageGallery images={product.images || []} />
          <ProductInfo product={product} />
        </div>
      </main>
    </div>
  );
};

export default ProductDetailPage;
