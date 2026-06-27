import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import '../../styles/profilepage.css';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';

// ─── Eco Score Badge ──────────────────────────────────────────────────────────
const EcoScoreBadge = ({ score }) => {
  const getColor = (s) => {
    if (s >= 70) return '#01696f';   // teal — high
    if (s >= 40) return '#d19900';   // gold — medium
    return '#964219';                // warning — low
  };

  const getLabel = (s) => {
    if (s >= 70) return 'Eco Champion 🌿';
    if (s >= 40) return 'Green Aware 🌱';
    return 'Getting Started 🌍';
  };

  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(100, Math.max(0, score));
  const strokeDashoffset = circumference - (progress / 100) * circumference;
  const color = getColor(score);

  return (
    <div className="eco-badge-wrapper">
      <svg width="100" height="100" viewBox="0 0 100 100">
        {/* background track */}
        <circle
          cx="50" cy="50" r={radius}
          fill="none"
          stroke="var(--color-surface-offset)"
          strokeWidth="8"
        />
        {/* progress arc */}
        <circle
          cx="50" cy="50" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          transform="rotate(-90 50 50)"
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
        <text x="50" y="46" textAnchor="middle" fontSize="18" fontWeight="700" fill={color}>
          {progress}
        </text>
        <text x="50" y="60" textAnchor="middle" fontSize="9" fill="var(--color-text-muted)">
          ECO SCORE
        </text>
      </svg>
      <span className="eco-badge-label" style={{ color }}>{getLabel(score)}</span>
    </div>
  );
};

// ─── Action Tile (unchanged) ──────────────────────────────────────────────────
const ActionTile = ({ tone = 'primary', title, description, onClick, icon, disabled = false }) => (
  <button
    type="button"
    className={`setting-card setting-card-button ${disabled ? 'is-disabled' : ''}`}
    onClick={onClick}
    disabled={disabled}
  >
    <div className="setting-card-content">
      <div className={`setting-icon-wrapper ${tone}`}>
        <svg className="setting-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {icon}
        </svg>
      </div>
      <div className="setting-text">
        <h4>{title}</h4>
        <p>{description}</p>
      </div>
      <svg className="setting-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
      </svg>
    </div>
  </button>
);

// ─── Profile Page ─────────────────────────────────────────────────────────────
const ProfilePage = () => {
  const { user, loading, logout } = useAuth();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' });
  const [deletePassword, setDeletePassword] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const initials = useMemo(() => {
    return user?.fullname
      ? user.fullname.split(' ').map((n) => n[0]).join('').toUpperCase()
      : 'U';
  }, [user]);

  // ✅ Eco stats derived from user object
  const ecoStats = useMemo(() => ({
    totalEcoScore: user?.ecoStats?.totalEcoScore || 0,
    totalCo2SavedKg: user?.ecoStats?.totalCo2SavedKg || 0,
    ecoOrderCount: user?.ecoStats?.ecoOrderCount || 0,
    // Average eco score across all eco orders
    avgEcoScore: user?.ecoStats?.ecoOrderCount > 0
      ? Math.round((user.ecoStats.totalEcoScore / user.ecoStats.ecoOrderCount))
      : 0,
  }), [user?.ecoStats]);

  const primaryAddress = user?.profile?.address?.[0] || null;

  const handleEditProfileClick = () => {
    if (isEditing) return;
    setIsEditing(true);
    navigate('/editprofile');
  };

  const handleActionClick = (page) => navigate(`/${page}`);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setIsUpdatingPassword(true);
    try {
      const res = await fetch('/api/v1/users/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(passwords),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Unable to update password');
      toast.success('Password updated successfully');
      setPasswords({ currentPassword: '', newPassword: '' });
    } catch (err) {
      toast.error(err.message || 'Failed to update password');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword.trim()) { toast.error('Please enter your password'); return; }
    if (!window.confirm('PERMANENT ACTION: Are you sure you want to delete your account?')) return;
    setIsDeletingAccount(true);
    try {
      const res = await fetch('/api/v1/users/delete-account', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: deletePassword }),
      });
      if (!res.ok) throw new Error('Deletion failed');
      toast.success('Account deleted successfully');
      await logout();
      navigate('/');
    } catch (err) {
      toast.error(err.message || 'Failed to delete account');
    } finally {
      setIsDeletingAccount(false);
    }
  };

  if (loading) return <div className="loading-container">Loading profile...</div>;
  if (!user) return <div className="loading-container">Please log in to view your profile.</div>;

  return (
    <div className="profile-body">
      <Toaster position="top-right" />

      <main className="main-container">
        {/* ── Hero ── */}
        <section className="profile-hero card card-hover">
          <div className="profile-hero-top">
            <div className="profile-avatar-wrapper">
              {user.profilePhoto?.url ? (
                <img src={user.profilePhoto.url} alt="Profile" className="profile-avatar-lg" />
              ) : (
                <div className="profile-avatar-lg">{initials}</div>
              )}
              {user.isVerified && (
                <div className="verified-badge">
                  <svg className="verified-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </div>

            <div className="profile-summary">
              <div className="profile-summary-head">
                <div>
                  <h1 className="profile-name">{user.fullname}</h1>
                  <p className="profile-status">{user.role || 'Member'}</p>
                  <p className="profile-email">{user.email}</p>
                </div>
                <div className="profile-actions">
                  <button onClick={handleEditProfileClick} className="btn-primary" disabled={isEditing}>
                    {isEditing ? 'Opening...' : 'Edit Profile'}
                  </button>
                  {user.role === 'seller' && (
                    <button onClick={() => navigate('/sellerdashboard')} className="btn-secondary btn-seller">
                      Manage My Inventory
                    </button>
                  )}
                </div>
              </div>

              <div className="profile-details-grid">
                <div className="detail-card">
                  <span className="detail-label">Phone</span>
                  <span className="detail-value">{user.phoneNumber || 'Not Provided'}</span>
                </div>
                <div className="detail-card">
                  <span className="detail-label">Primary Address</span>
                  <span className="detail-value">
                    {primaryAddress
                      ? `${primaryAddress.city || ''}${primaryAddress.city && primaryAddress.pincode ? ', ' : ''}${primaryAddress.pincode || ''}`
                      : 'No address on file'}
                  </span>
                </div>
                <div className="detail-card">
                  <span className="detail-label">Verification</span>
                  <span className="detail-value">
                    {user.isVerified ? 'Verified Account' : 'Not Verified'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ✅ ── Eco Impact Section ── */}
        <section className="card card-hover eco-impact-card">
          <h3 className="card-title">🌿 Your Eco Impact</h3>
          <p className="section-copy">
            Track the environmental impact of your eco-conscious purchases.
          </p>

          <div className="eco-impact-body">
            <EcoScoreBadge score={ecoStats.avgEcoScore} />

            <div className="eco-stats-grid">
              <div className="eco-stat-item">
                <span className="eco-stat-value" style={{ color: '#01696f' }}>
                  {ecoStats.totalCo2SavedKg.toFixed(2)} kg
                </span>
                <span className="eco-stat-label">CO₂ Saved</span>
              </div>

              <div className="eco-stat-item">
                <span className="eco-stat-value" style={{ color: '#437a22' }}>
                  {ecoStats.ecoOrderCount}
                </span>
                <span className="eco-stat-label">Eco Orders</span>
              </div>

              <div className="eco-stat-item">
                <span className="eco-stat-value" style={{ color: '#d19900' }}>
                  {ecoStats.totalEcoScore}
                </span>
                <span className="eco-stat-label">Total Score Earned</span>
              </div>
            </div>
          </div>

          {ecoStats.ecoOrderCount === 0 && (
            <p className="eco-empty-note">
              No eco purchases yet. Browse the{' '}
              <button className="eco-link-btn" onClick={() => navigate('/ecozone')}>
                EcoZone
              </button>{' '}
              to start earning scores!
            </p>
          )}
        </section>

        {/* ── Grid (unchanged) ── */}
        <section className="profile-grid">
          <div className="profile-column">
            <div className="card card-hover">
              <h3 className="card-title">Quick Actions</h3>
              <div className="settings-grid">
                <ActionTile
                  tone="primary"
                  title="My Orders"
                  description="View and track all your orders"
                  onClick={() => handleActionClick('orders')}
                  icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />}
                />
                <ActionTile
                  tone="teal"
                  title="Wishlist"
                  description="View your saved items"
                  onClick={() => handleActionClick('cart')}
                  icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />}
                />
              </div>
            </div>

            <div className="card card-hover">
              <h3 className="card-title">Account Settings</h3>
              <div className="settings-grid">
                <ActionTile
                  tone="primary"
                  title="Address Book"
                  description="Manage shipping and billing addresses"
                  onClick={() => handleActionClick('address')}
                  icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />}
                />
                <ActionTile
                  tone="teal"
                  title="Payment Methods"
                  description="Manage cards and payment options"
                  onClick={() => handleActionClick('Payment Methods')}
                  icon={<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />}
                />
              </div>
            </div>
          </div>

          <div className="profile-column">
            <div className="card card-hover">
              <h3 className="card-title">Security</h3>
              <p className="section-copy">Update your password to keep your account secure.</p>
              <form onSubmit={handlePasswordChange} className="security-form">
                <div className="form-group">
                  <label className="form-label" htmlFor="currentPassword">Current Password</label>
                  <input
                    id="currentPassword" type="password" className="form-input"
                    value={passwords.currentPassword}
                    onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="newPassword">New Password</label>
                  <input
                    id="newPassword" type="password" className="form-input"
                    value={passwords.newPassword}
                    onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                    required
                  />
                </div>
                <button type="submit" className="btn-secondary full-btn" disabled={isUpdatingPassword}>
                  {isUpdatingPassword ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </div>

            <div className="card danger-card">
              <h3 className="card-title danger-title">Danger Zone</h3>
              <p className="section-copy">Deleting your account is permanent and cannot be undone.</p>
              {!showDeleteConfirm ? (
                <button type="button" onClick={() => setShowDeleteConfirm(true)} className="btn-danger">
                  Delete Account
                </button>
              ) : (
                <div className="delete-confirm-box">
                  <div className="form-group">
                    <label className="form-label" htmlFor="deletePassword">Confirm Password</label>
                    <input
                      id="deletePassword" type="password" className="form-input danger-input"
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                    />
                  </div>
                  <div className="danger-actions">
                    <button type="button" className="btn-outline"
                      onClick={() => { setShowDeleteConfirm(false); setDeletePassword(''); }}>
                      Cancel
                    </button>
                    <button type="button" onClick={handleDeleteAccount} className="btn-danger" disabled={isDeletingAccount}>
                      {isDeletingAccount ? 'Deleting...' : 'Confirm Permanent Deletion'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default ProfilePage;