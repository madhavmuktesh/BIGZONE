import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext'; // Assuming AuthContext.jsx is in the same folder
import '../styles/ProfilePage.css';
import Header from '../components/Header/Headermain.jsx';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';

const ProfilePage = () => {
    const { user, loading, logout } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [notification, setNotification] = useState(null);
    const editProfileButtonRef = useRef(null);
    const navigate = useNavigate();

    const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' });
    const [deletePassword, setDeletePassword] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Effect to clear notification after 3 seconds
    useEffect(() => {
        if (notification) {
            const timer = setTimeout(() => setNotification(null), 3000);
            return () => clearTimeout(timer);
        }
    }, [notification]);

    const handleEditProfileClick = () => {
        if (isEditing) return;
        navigate('/editprofile');
        // Simulating an API call
        setIsEditing(true);
        setTimeout(() => {
            setIsEditing(false);
        }, 1500);
    };

    const handleActionClick = (page) => {
        navigate(`/${page}`);
    };


    if (loading) {
        return <div className="loading-container">Loading Profile...</div>;
    }

    if (!user) {
        return <div className="loading-container">Please log in to view your profile.</div>;
    }

    // --- SECURE ACTIONS ---
    const handlePasswordChange = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch('/api/v1/users/change-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(passwords)
            });
            const data = await res.json();
            if (data.success) {
                toast.success("Password updated!");
                setPasswords({ currentPassword: '', newPassword: '' });
            } else throw new Error(data.message);
        } catch (err) { toast.error(err.message); }
    };

    const handleDeleteAccount = async () => {
        if (!window.confirm("PERMANENT ACTION: Are you sure?")) return;
        try {
            const res = await fetch('/api/v1/users/delete-account', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: deletePassword })
            });
            if (res.ok) {
                await logout();
                navigate('/');
            } else throw new Error("Deletion failed");
        } catch (err) { toast.error(err.message); }
    };

    const initials = user.fullname ? user.fullname.split(' ').map(n => n[0]).join('').toUpperCase() : 'U';

    return (
        <div className="profile-body">
            {notification && <div className="notification-bar">{notification}</div>}

            <main className="main-container">
                <div className="main-grid">
                    <div className="card profile-card card-hover">
                        <div className="profile-card-content">
                            <div className="profile-avatar-wrapper">
                                {user.profilePhoto && user.profilePhoto.url ? (
                                    <img src={user.profilePhoto.url} alt="Profile" className="profile-avatar-lg"/>
                                ) : (
                                    <div className="profile-avatar-lg">{initials}</div>
                                )}
                                {user.isVerified && (
                                    <div className="verified-badge">
                                        <svg className="verified-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                                        </svg>
                                    </div>
                                )}
                            </div>
                            <h2 className="profile-name">{user.fullname}</h2>
                            <p className="profile-status">{user.role || 'Member'}</p>
                            <p className="profile-email">{user.email}</p>
                            
                            {/* User Details Section - Updated */}
                            <div className="profile-details">
                                <div className="detail-item">
                                    <strong>Phone:</strong>
                                    <span>{user.phoneNumber || 'Not Provided'}</span>
                                </div>
                                <div className="detail-item">
                                    <strong>Address:</strong>
                                    {/* Displays the first address, if available */}
                                    <span>
                                        {user.profile?.address?.length > 0
                                            ? `${user.profile.address[0].city}, ${user.profile.address[0].pincode}`
                                            : 'No address on file'}
                                    </span>
                                </div>
                            </div>
                            
                            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                                <button onClick={handleEditProfileClick} className="btn-primary">Edit Profile</button>
                                
                                {/* Only show the Seller Dashboard button if the user is a seller */}
                                {user.role === 'seller' && (
                                    <button 
                                        onClick={() => navigate('/seller-dashboard')} 
                                        className="btn-secondary" 
                                        style={{ backgroundColor: '#28a745', color: 'white', border: 'none' }}
                                    >
                                        Manage My Inventory
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="bottom-cards-container">
                        <div className="card card-hover">
                            <h3 className="card-title">Quick Actions</h3>
                            <div className="settings-grid">
                                <div className="setting-card" onClick={() => handleActionClick('My Orders')}>
                                    <div className="setting-card-content">
                                        <div className="setting-icon-wrapper primary"><svg className="setting-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"></path></svg></div>
                                        <div className="setting-text">
                                            <h4>My Orders</h4>
                                            <p>View and track all your orders</p>
                                        </div>
                                        <svg className="setting-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                                    </div>
                                </div>
                                 <div className="setting-card" onClick={() => handleActionClick('Wishlist')}>
                                    <div className="setting-card-content">
                                        <div className="setting-icon-wrapper teal"><svg className="setting-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg></div>
                                        <div className="setting-text">
                                            <h4>WishList</h4>
                                            <p>View WishList Items</p>
                                        </div>
                                        <svg className="setting-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="card card-hover">
                            <h3 className="card-title">Account Settings</h3>
                            <div className="settings-grid">
                                <div className="setting-card" onClick={() => handleActionClick('address')}>
                                    <div className="setting-card-content">
                                        <div className="setting-icon-wrapper primary"><svg className="setting-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path></svg></div>
                                        <div className="setting-text">
                                            <h4>Address Book</h4>
                                            <p>Manage shipping and billing addresses</p>
                                        </div>
                                        <svg className="setting-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                                    </div>
                                </div>
                                 <div className="setting-card" onClick={() => handleActionClick('Payment Methods')}>
                                    <div className="setting-card-content">
                                        <div className="setting-icon-wrapper teal"><svg className="setting-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"></path></svg></div>
                                        <div className="setting-text">
                                            <h4>Payment Methods</h4>
                                            <p>Manage cards and payment options</p>
                                        </div>
                                        <svg className="setting-arrow" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* SECURITY & SETTINGS */}
                        <div className="bottom-cards-container">
                            {/* Change Password */}
                            <div className="card">
                                <h3>Security</h3>
                                <form onSubmit={handlePasswordChange} style={{display:'flex', flexDirection:'column', gap:'10px'}}>
                                    <input type="password" placeholder="Current Password" onChange={(e) => setPasswords({...passwords, currentPassword: e.target.value})} required />
                                    <input type="password" placeholder="New Password" onChange={(e) => setPasswords({...passwords, newPassword: e.target.value})} required />
                                    <button type="submit" className="btn-secondary">Update Password</button>
                                </form>
                            </div>

                            {/* Danger Zone */}
                            <div className="card" style={{border: '1px solid red'}}>
                                <h3 style={{color:'red'}}>Danger Zone</h3>
                                {!showDeleteConfirm ? (
                                    <button onClick={() => setShowDeleteConfirm(true)} className="btn-danger">Delete Account</button>
                                ) : (
                                    <>
                                        <input type="password" placeholder="Confirm Password" onChange={(e) => setDeletePassword(e.target.value)} />
                                        <button onClick={handleDeleteAccount} className="btn-danger">Confirm Permanent Deletion</button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

export default ProfilePage;