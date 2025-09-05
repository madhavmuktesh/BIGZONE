import React, { useState, useMemo, useEffect } from 'react';
import '../AddressPage.css';
import { Link } from 'react-router-dom';
import axios from 'axios';

const Icon = ({ name, className }) => {
  const icons = {
    home: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    ),
    office: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
    ),
    phone: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    ),
  };
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      {icons[name]}
    </svg>
  );
};

const AddressCard = ({ address, onRemove }) => (
  <div className="address-card">
    <div className="card-main-content">
      <div className="card-header">
        <div className="card-icon-wrapper">
          <Icon name={address.icon || 'home'} className="card-icon" />
        </div>
        <div>
          <h3 className="card-name">
            {address.fullName || address.name}
            {address.makeDefault && (
              <>
                <svg className="star-icon" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
                <span className="default-badge">Default</span>
              </>
            )}
          </h3>
          <p className="card-address-type">{address.type || 'Address'}</p>
        </div>
      </div>
      <div className="address-details-box">
        <p className="address-line font-medium">{address.house}, {address.area}</p>
        <p className="address-line">{address.city}, {address.state} - {address.pincode}</p>
        <p className="address-line">{address.country}</p>
        <div className="address-phone">
          <Icon name="phone" className="phone-icon" />
          <span>{address.mobile}</span>
        </div>
      </div>
    </div>
    <div className="card-actions">
  <Link to={`/address/edit/${address._id}`} className="btn btn-dark">
    <svg className="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
    </svg>
    <span>Edit</span>
  </Link>

  <button className="btn btn-light" onClick={() => onRemove(address._id)}>
    <svg className="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
    </svg>
    <span>Remove</span>
  </button>
</div>
  </div>
);

const AddressPage = () => {
  const [addresses, setAddresses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch addresses from backend
  useEffect(() => {
  axios.get('http://localhost:5000/api/v1/addresses', { withCredentials: true })
    .then((res) => {
      setAddresses(res.data.addresses || res.data);
    })
    .catch((err) => console.error('Error fetching addresses:', err));
}, []);



  const handleRemoveAddress = async (id) => {
    if (window.confirm('Are you sure you want to remove this address?')) {
      try {
        await axios.delete(`http://localhost:5000/api/v1/addresses/${id}`, { withCredentials: true });
        setAddresses(prev => prev.filter(addr => addr._id !== id));

      } catch (err) {
        console.error('Error deleting address:', err);
      }
    }
  };

  const filteredAddresses = useMemo(() => {
    return addresses.filter((address) =>
      JSON.stringify(address).toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [addresses, searchTerm]);

  return (
    <div className="page-background">
      <nav className="header-nav">
        <div className="container header-content">
          <div className="header-left">
            <button className="icon-button">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
              </svg>
            </button>
            <h1 className="header-title">Ecozone</h1>
          </div>
          <div className="header-right">
            <span>Account Settings</span>
          </div>
        </div>
      </nav>

      <main className="container main-container">
        <div className="breadcrumb">
          <Link to="/account">Account</Link>
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
          </svg>
          <span>Addresses</span>
        </div>

        <div className="page-header">
          <div>
            <h1 className="page-title">Your Addresses</h1>
            <p className="page-subtitle">Manage your delivery addresses</p>
          </div>
          <div className="search-wrapper">
            <input
              type="text"
              placeholder="Search addresses..."
              className="search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <svg className="search-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>
        </div>

        <div className="add-button-container">
          <Link to="/address/add" className="btn btn-primary">
            <svg className="btn-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
            </svg>
            <span>Add New Address</span>
          </Link>
        </div>

        <div className="address-list">
          {filteredAddresses.map((address) => (
            <AddressCard key={address._id} address={address} onRemove={handleRemoveAddress} />
          ))}
        </div>

        <div className="info-box">
          <div className="info-icon-wrapper">
            <svg className="info-icon" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
          </div>
          <div>
            <h4 className="info-title">Address Management Tips</h4>
            <ul className="info-list">
              <li>• Set a default address for faster checkout</li>
              <li>• Include landmarks for easier delivery</li>
              <li>• Keep your phone number updated for delivery coordination</li>
              <li>• You can have up to 10 saved addresses</li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AddressPage;
