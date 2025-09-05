// src/components/Dashboard.js
import React from 'react';
import { UserIcon, StarIcon, CheckCircleIcon, HeartIcon, GlobeIcon, RefreshIcon } from './Icons'; // We'll create this file next

const Dashboard = () => {
  return (
    <div className="dashboard">
      {/* Left: User Profile & Progress */}
      <div className="user-profile">
        <div className="profile-avatar-wrapper">
          <div className="profile-avatar">
            <UserIcon />
          </div>
          <div className="level-badge">
            <span>5</span>
          </div>
        </div>
        <h3>Eco Warrior Level 5</h3>
        <p className="subtitle">Keep going! You're making a difference</p>
        <div className="progress-bar-container">
          <div className="progress-labels">
            <span className="label-text">Progress to Level 6</span>
            <span className="label-value">15/60 coins</span>
          </div>
          <div className="progress-bar-bg">
            <div className="progress-bar-fg" style={{ width: '25%' }}></div>
          </div>
        </div>
      </div>

      {/* Center: Quick Stats */}
      <div className="quick-stats">
        <StatCard icon={<StarIcon />} value="847" label="Eco Points" />
        <StatCard icon={<CheckCircleIcon />} value="23" label="Orders" />
        <StatCard icon={<HeartIcon />} value="156" label="Wishlist" />
        <StatCard icon={<GlobeIcon />} value="92" label="CO₂ Saved" />
      </div>

      {/* Right: Recent Activity & Achievements */}
      <div className="actions-container">
        <div className="action-card">
          <h4><StarIcon /> Recent Achievement</h4>
          <p className="achievement-text">🌱 Eco Champion - Saved 50kg CO₂ this month!</p>
        </div>
        <div className="action-card">
          <h4><RefreshIcon /> Quick Actions</h4>
          <div className="quick-actions-buttons">
            <button className="btn-reorder">Reorder</button>
            <button className="btn-track">Track</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper component for stat cards
const StatCard = ({ icon, value, label }) => (
  <div className="stat-card">
    <div className="stat-icon">{icon}</div>
    <div className="stat-value">{value}</div>
    <div className="stat-label">{label}</div>
  </div>
);

export default Dashboard;