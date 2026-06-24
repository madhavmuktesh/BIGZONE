import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast, { Toaster } from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
// import '../styles/SellerDashboard.css'; // Optional: create this if you want specific styling

const SellerDashboard = () => {
    const { user, token, loading } = useAuth();
    const navigate = useNavigate();
    
    const [products, setProducts] = useState([]);
    const [fetching, setFetching] = useState(true);

    useEffect(() => {
        if (!loading && (!user || user.role !== 'seller')) {
            toast.error("Unauthorized access. Sellers only.");
            navigate('/');
            return;
        }

        if (user && user._id) {
            fetchMyProducts();
        }
    }, [user, loading, navigate]);

    const fetchMyProducts = async () => {
        setFetching(true);
        try {
            // Your backend controller getUserProducts expects the userId in the URL
            const response = await fetch(`/api/v1/products/user/${user._id || user.id}`, {
                method: 'GET',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await response.json();
            
            if (response.ok && data.success) {
                setProducts(data.products);
            } else {
                throw new Error(data.message || "Failed to fetch products");
            }
        } catch (error) {
            toast.error(error.message);
        } finally {
            setFetching(false);
        }
    };

    const handleDelete = async (productId) => {
        if (!window.confirm("Are you sure you want to delete this product? This cannot be undone.")) return;

        try {
            const response = await fetch(`/api/v1/products/${productId}`, {
                method: 'DELETE',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' }
            });
            
            const data = await response.json();
            if (response.ok && data.success) {
                toast.success("Product deleted successfully");
                // Remove the product from the local state so the UI updates instantly
                setProducts(products.filter(p => p._id !== productId));
            } else {
                throw new Error(data.message || "Failed to delete product");
            }
        } catch (error) {
            toast.error(error.message);
        }
    };

    const handleEdit = (productId) => {
        // We will navigate to an edit form passing the product ID
        navigate(`/edit-product/${productId}`);
    };

    if (loading || fetching) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading Inventory...</div>;

    return (
        <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '20px' }}>
            <Toaster position="top-center" />
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h1>Seller Dashboard</h1>
                <button onClick={() => navigate('/form')} className="btn btn-primary" style={{ padding: '10px 20px' }}>
                    + Add New Product
                </button>
            </div>

            {products.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', backgroundColor: '#f9f9f9', borderRadius: '8px' }}>
                    <h2>You haven't listed any products yet.</h2>
                    <p>Click "Add New Product" to start selling!</p>
                </div>
            ) : (
                <div style={{ display: 'grid', gap: '15px' }}>
                    {products.map(product => (
                        <div key={product._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px', backgroundColor: '#fff', borderRadius: '8px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                <img 
                                    src={product.images?.[0]?.url || 'https://placehold.co/80x80'} 
                                    alt={product.productname} 
                                    style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '4px' }}
                                />
                                <div>
                                    <h3 style={{ margin: '0 0 5px 0' }}>{product.productname}</h3>
                                    <p style={{ margin: '0 0 5px 0', color: '#666' }}>Category: {product.category}</p>
                                    <p style={{ margin: 0, fontWeight: 'bold' }}>₹{product.productprice.toFixed(2)}</p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <button 
                                    onClick={() => handleEdit(product._id)}
                                    className="btn btn-secondary" 
                                    style={{ padding: '8px 15px' }}
                                >
                                    Edit
                                </button>
                                <button 
                                    onClick={() => handleDelete(product._id)}
                                    className="btn btn-danger" 
                                    style={{ padding: '8px 15px', backgroundColor: '#d93025', color: '#fff', border: 'none', borderRadius: '4px' }}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default SellerDashboard;