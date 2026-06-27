// components/EcoToast.jsx
import { useEffect, useState } from "react";

export default function EcoToast({ product }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (product?.ecoScore > 0) {
      setVisible(true);
      const t = setTimeout(() => setVisible(false), 4000);
      return () => clearTimeout(t);
    }
  }, [product]);

  if (!visible || !product?.ecoScore) return null;

  return (
    <div className={`eco-toast ${visible ? "eco-toast--show" : ""}`}>
      <span className="eco-toast__icon">🌿</span>
      <div>
        <p className="eco-toast__title">Eco-friendly choice!</p>
        <p className="eco-toast__body">
          +{product.ecoScore} eco points · saves ~{product.co2SavedKg}kg CO₂
        </p>
      </div>
    </div>
  );
}