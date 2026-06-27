// Inside your CartPage.jsx or CartSidebar.jsx

export default function EcoCartSummary({ cartItems }) {
  const totalEcoScore = cartItems.reduce((sum, item) => {
    return sum + (item.product?.ecoScore || 0) * item.quantity;
  }, 0);

  const totalCo2 = cartItems.reduce((sum, item) => {
    return sum + (item.product?.co2SavedKg || 0) * item.quantity;
  }, 0);

  const ecoItemsCount = cartItems.filter(i => i.product?.ecoScore > 0).length;

  if (ecoItemsCount === 0) return null;

  return (
    <div className="eco-summary">
      <div className="eco-summary__header">
        <span>🌱</span>
        <span>Your Eco Impact</span>
      </div>
      <div className="eco-summary__stats">
        <div className="eco-summary__stat">
          <span className="eco-summary__value">+{totalEcoScore}</span>
          <span className="eco-summary__label">Eco Points</span>
        </div>
        <div className="eco-summary__divider" />
        <div className="eco-summary__stat">
          <span className="eco-summary__value">{totalCo2.toFixed(2)}kg</span>
          <span className="eco-summary__label">CO₂ Saved</span>
        </div>
        <div className="eco-summary__divider" />
        <div className="eco-summary__stat">
          <span className="eco-summary__value">{ecoItemsCount}</span>
          <span className="eco-summary__label">Eco Items</span>
        </div>
      </div>
    </div>
  );
}