import React, { useState, useEffect, useMemo } from 'react';
import '../styles/AddAddressPage.css';
import { Link, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

// Reusable FormField component
const FormField = ({ id, label, value, onChange, onFocus, onBlur, isFocused, children, ...props }) => {
  const wrapperClasses = [
    'form-field-wrapper',
    isFocused ? 'input-focused' : '',
    value ? 'input-filled' : '',
  ].filter(Boolean).join(' ');

  return (
    <div className={wrapperClasses}>
      <input
        id={id}
        value={value || ''}
        onChange={onChange}
        onFocus={() => onFocus(id)}
        onBlur={onBlur}
        className="form-input"
        {...props}
      />
      <label htmlFor={id} className="floating-label">{label}</label>
      {children}
    </div>
  );
};

const AddAddressPage = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = Boolean(id);

  // Fixed: Use import.meta.env for Vite or hardcode for immediate fix
  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';
  // OR use: const API_BASE = 'http://localhost:5000/api/v1';

  const [formData, setFormData] = useState({
    country: 'IN',
    fullName: '',
    mobile: '',
    location: '',
    house: '',
    area: '',
    pincode: '',
    city: '',
    state: '',
    makeDefault: false,
  });

  const [focusedField, setFocusedField] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load draft initially (only for new mode)
  useEffect(() => {
    if (!isEditMode) {
      try {
        const draft = localStorage.getItem('addressDraft');
        if (draft) {
          const data = JSON.parse(draft);
          setFormData(prevData => ({ ...prevData, ...data }));
        }
      } catch (error) {
        console.error("Could not parse address draft:", error);
      }
    }
  }, [isEditMode]);

  // If edit mode, fetch address and prefill
  useEffect(() => {
    if (!isEditMode) return;

    const fetchAddress = async () => {
      setIsLoading(true);
      try {
        const res = await axios.get(`${API_BASE}/addresses/${id}`, { withCredentials: true });
        const address = res.data?.address || res.data;
        if (!address) {
          alert('Address not found');
          navigate('/address');
          return;
        }

        setFormData({
          country: address.country || 'IN',
          fullName: address.fullName || '',
          mobile: address.mobile || '',
          location: address.location || '',
          house: address.house || '',
          area: address.area || '',
          pincode: address.pincode || '',
          city: address.city || '',
          state: address.state || '',
          makeDefault: !!address.makeDefault,
        });
      } catch (err) {
        console.error('Failed to load address for edit:', err);
        alert(err?.response?.data?.message || 'Failed to load address');
        navigate('/address');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAddress();
  }, [id, isEditMode, API_BASE, navigate]);

  const requiredFields = ['country', 'fullName', 'mobile', 'house', 'area', 'pincode', 'city', 'state'];

  const progress = useMemo(() => {
    const filledCount = requiredFields.filter(field => 
      formData[field] && String(formData[field]).trim() !== ''
    ).length;
    if (requiredFields.length === 0) return 0;
    return (filledCount / requiredFields.length) * 100;
  }, [formData, requiredFields]);

  const handleChange = (e) => {
    const { id, value, type, checked } = e.target;
    let processedValue = type === 'checkbox' ? checked : value;

    if (id === 'mobile') {
      const digits = value.replace(/\D/g, '');
      processedValue = digits.slice(0, 10);
    }

    setFormData(prev => ({ ...prev, [id]: processedValue }));
  };

  const handlePincodeBlur = () => {
    setFocusedField(null);
    if (formData.pincode === '500081') {
      setTimeout(() => {
        setFormData(prev => ({ ...prev, city: 'Hyderabad', state: 'Telangana' }));
      }, 500);
    } else if (formData.pincode === '520008') {
      setTimeout(() => {
        setFormData(prev => ({ ...prev, city: 'Vijayawada', state: 'Andhra Pradesh' }));
      }, 500);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (isEditMode) {
        const res = await axios.patch(`${API_BASE}/addresses/${id}`, formData, { 
          withCredentials: true 
        });
        if (res.data?.success) {
          alert('Address updated successfully!');
          navigate('/address');
        } else {
          alert(res.data?.message || 'Failed to update address');
        }
      } else {
        const res = await axios.post(`${API_BASE}/addresses`, formData, { 
          withCredentials: true 
        });
        if (res.data?.success) {
          localStorage.removeItem('addressDraft');
          alert('Address saved successfully!');
          navigate('/address');
        } else {
          alert(res.data?.message || 'Failed to save address');
        }
      }
    } catch (err) {
      console.error('Error saving address:', err?.response?.data || err);
      const msg = err?.response?.data?.message || 
        (err?.response?.data?.errors ? err.response.data.errors.join(', ') : err.message) || 
        'Error saving address';
      alert(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const saveDraft = () => {
    localStorage.setItem('addressDraft', JSON.stringify(formData));
    alert('Draft saved successfully!');
  };

  const goBack = () => {
    if (window.confirm('Are you sure? Unsaved changes will be lost.')) {
      navigate(-1);
    }
  };

  if (isLoading) {
    return (
      <div className="page-background">
        <main className="container main-container">
          <div className="page-header">
            <h1 className="page-title">{isEditMode ? 'Edit Address' : 'Add New Address'}</h1>
            <p>Loading address…</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="page-background">
      <nav className="header-nav">{/* header if any */}</nav>

      <main className="container main-container">
        <div className="breadcrumb">
          <Link to="/account">Account</Link><span>›</span>
          <Link to="/address">Addresses</Link><span>›</span>
          <span className="active">{isEditMode ? 'Edit' : 'Add New'}</span>
        </div>

        <div className="page-header">
          <h1 className="page-title">{isEditMode ? 'Edit Address' : 'Add New Address'}</h1>
          <p className="page-subtitle">Fill in the details below to add a new delivery address.</p>
        </div>

        <div className="progress-container">
          <div className="progress-labels">
            <span>Form Progress</span>
            <span>{Math.round(progress)}% Complete</span>
          </div>
          <div className="progress-bar-outer">
            <div className="progress-bar-inner" style={{ width: `${progress}%` }}></div>
          </div>
        </div>

        <div className="form-card">
          <form onSubmit={handleSave} className="address-form">
            <div className="form-field-wrapper">
              <label htmlFor="country" className="static-label">Country *</label>
              <select 
                id="country" 
                value={formData.country} 
                onChange={handleChange} 
                className="form-input form-select" 
                required
              >
                <option value="IN">India</option>
                <option value="US">United States</option>
                <option value="CA">Canada</option>
              </select>
              <div className="select-arrow"></div>
            </div>

            <FormField 
              id="fullName" 
              label="Full Name *" 
              value={formData.fullName} 
              onChange={handleChange} 
              isFocused={focusedField === 'fullName'} 
              onFocus={setFocusedField} 
              onBlur={() => setFocusedField(null)} 
              type="text" 
              required 
            />
            
            <FormField 
              id="mobile" 
              label="Mobile Number *" 
              value={formData.mobile} 
              onChange={handleChange} 
              isFocused={focusedField === 'mobile'} 
              onFocus={setFocusedField} 
              onBlur={() => setFocusedField(null)} 
              type="tel" 
              maxLength="10" 
              required 
            />
            
            <FormField 
              id="house" 
              label="House/Building *" 
              value={formData.house} 
              onChange={handleChange} 
              isFocused={focusedField === 'house'} 
              onFocus={setFocusedField} 
              onBlur={() => setFocusedField(null)} 
              type="text" 
              required 
            />
            
            <FormField 
              id="area" 
              label="Area/Street *" 
              value={formData.area} 
              onChange={handleChange} 
              isFocused={focusedField === 'area'} 
              onFocus={setFocusedField} 
              onBlur={() => setFocusedField(null)} 
              type="text" 
              required 
            />

            <div className="form-grid">
              <FormField 
                id="pincode" 
                label="Pincode *" 
                value={formData.pincode} 
                onChange={handleChange} 
                isFocused={focusedField === 'pincode'} 
                onFocus={setFocusedField} 
                onBlur={handlePincodeBlur} 
                type="text" 
                required 
              />
              <FormField 
                id="city" 
                label="Town/City *" 
                value={formData.city} 
                onChange={handleChange} 
                isFocused={focusedField === 'city'} 
                onFocus={setFocusedField} 
                onBlur={() => setFocusedField(null)} 
                type="text" 
                required 
              />
            </div>

            <FormField 
              id="state" 
              label="State *" 
              value={formData.state} 
              onChange={handleChange} 
              isFocused={focusedField === 'state'} 
              onFocus={setFocusedField} 
              onBlur={() => setFocusedField(null)} 
              type="text" 
              required 
            />

            <div className="checkbox-wrapper">
              <input 
                type="checkbox" 
                id="makeDefault" 
                checked={formData.makeDefault} 
                onChange={handleChange} 
                className="form-checkbox" 
              />
              <label htmlFor="makeDefault">Make this default</label>
            </div>

            <div className="form-actions">
              <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                {isSubmitting ? <div className="spinner"></div> : '✔'}
                <span>
                  {isSubmitting 
                    ? (isEditMode ? 'Updating...' : 'Saving...') 
                    : (isEditMode ? 'Update Address' : 'Save Address')
                  }
                </span>
              </button>
              {!isEditMode && (
                <button type="button" onClick={saveDraft} className="btn btn-secondary">
                  <span>Save Draft</span>
                </button>
              )}
              <button type="button" onClick={goBack} className="btn btn-tertiary">
                Cancel
              </button>
            </div>
          </form>
        </div>

        <div className="info-box">{/* Address Tips content */}</div>
      </main>
    </div>
  );
};

export default AddAddressPage;
