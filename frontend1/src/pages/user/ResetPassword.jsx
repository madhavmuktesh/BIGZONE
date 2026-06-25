import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';

const ResetPassword = () => {
    // This grabs the token parameter from the URL
    const { token } = useParams(); 
    const navigate = useNavigate();
    
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (password.length < 6) {
            return toast.error("Password must be at least 6 characters");
        }
        if (password !== confirmPassword) {
            return toast.error("Passwords do not match!");
        }

        setLoading(true);
        try {
            const response = await fetch(`/api/v1/users/reset-password/${token}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ password })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                toast.success("Password reset successfully!");
                // Give the toast a second to show before navigating
                setTimeout(() => {
                    navigate('/signin');
                }, 2000);
            } else {
                throw new Error(data.message || "Invalid or expired token");
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
            <Toaster position="top-center" />
            <div style={{ maxWidth: '400px', width: '100%', padding: '30px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', borderRadius: '8px', backgroundColor: '#fff' }}>
                <h2 style={{ textAlign: 'center', marginBottom: '20px' }}>Create New Password</h2>
                
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <input
                        type="password"
                        placeholder="New Password (min 6 characters)"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        style={{ padding: '12px', borderRadius: '4px', border: '1px solid #ccc', width: '100%' }}
                    />
                    <input
                        type="password"
                        placeholder="Confirm New Password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        style={{ padding: '12px', borderRadius: '4px', border: '1px solid #ccc', width: '100%' }}
                    />
                    <button 
                        type="submit" 
                        disabled={loading}
                        className="btn btn-primary"
                        style={{ padding: '12px', cursor: loading ? 'not-allowed' : 'pointer', marginTop: '10px' }}
                    >
                        {loading ? 'Resetting...' : 'Reset Password'}
                    </button>
                </form>
                
                <div style={{ textAlign: 'center', marginTop: '20px' }}>
                    <Link to="/signin" style={{ color: '#0066cc', textDecoration: 'none' }}>Back to Sign In</Link>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;