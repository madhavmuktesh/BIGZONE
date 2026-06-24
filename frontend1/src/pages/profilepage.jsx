import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import '../styles/ProfilePage.css';
import Header from '../components/Header/Headermain.jsx';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';

const ProfilePage = () => {
    const { user, loading, logout } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const navigate = useNavigate();

    // Password & Deletion States
    const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' });
    const [deletePassword, setDeletePassword] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const handleEditProfileClick = () => {
        navigate('/editprofile');
    };

    const handleActionClick = (page) => {
        navigate(`/${page.toLowerCase().replace(/\s+/g, '')}`);
    };

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

    if (loading) return <div className="loading-container">Loading Profile...</div>;
    if (!user) return <div className="loading-container">Please log in to view your profile.</div>;

    const initials = user.fullname ? user.fullname.split(' ').map(n => n[0]).join('').toUpperCase() : 'U';

    return (
        <div className="profile-body">
            <Toaster />
            <Header />
            <main className="main-container">
                <div className="main-grid">
                    {/* PROFILE CARD */}
                    <div className="card profile-card">
                        <div className="profile-avatar-wrapper">
                            {user.profilePhoto?.url ? <img src={user.profilePhoto.url} className="profile-avatar-lg"/> : <div className="profile-avatar-lg">{initials}</div>}
                        </div>
                        <h2 className="profile-name">{user.fullname}</h2>
                        <p className="profile-email">{user.email}</p>
                        <button onClick={handleEditProfileClick} className="btn-primary">Edit Profile</button>
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
            </main>
        </div>
    );
};

export default ProfilePage;