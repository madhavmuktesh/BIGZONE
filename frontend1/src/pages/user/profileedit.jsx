import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import {
  updateUserProfileAPI,
  updateUserAddressAPI,
  addUserAddressAPI,
  uploadProfilePhotoAPI,
} from '../../services/api.js'; 
import "../../styles/profileedit.css";
import Header from '../../components/Header/Headermain.jsx';

const EditProfile = () => {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    fullname: '',
    email: '',
    phoneNumber: '',
    bio: '',
    address: {
      _id: '', name: '', mobileNumber: '',
      landmark: '', city: '', pincode: '', state: '',
    },
  });
  const [profilePhotoUrl, setProfilePhotoUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (user) {
      setFormData({
        fullname: user.fullname || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
        bio: user.profile?.bio || '',
        address: user.profile?.address?.[0] || {
          _id: '', name: '', mobileNumber: '',
          landmark: '', city: '', pincode: '', state: '',
        },
      });
      setProfilePhotoUrl(user.profilePhoto?.url || '');
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      address: { ...prev.address, [name]: value },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    let updatedUser;

    try {
      // ✅ updateUserProfileAPI instead of ApiService.updateUserProfile
      const profileUpdateResponse = await updateUserProfileAPI({
        fullname: formData.fullname,
        phoneNumber: formData.phoneNumber,
        bio: formData.bio,
      });
      updatedUser = profileUpdateResponse.user;

      const addressHasData =
        formData.address.name ||
        formData.address.city ||
        formData.address.landmark;

      if (addressHasData) {
        if (formData.address._id) {
          // ✅ updateUserAddressAPI instead of ApiService.updateUserAddress
          const addressResponse = await updateUserAddressAPI(
            formData.address._id,
            formData.address
          );
          if (addressResponse.addresses) {
            updatedUser.profile.address = addressResponse.addresses;
          }
        } else {
          // ✅ addUserAddressAPI instead of ApiService.addUserAddress
          const addressResponse = await addUserAddressAPI(formData.address);
          if (addressResponse.addresses) {
            updatedUser.profile.address = addressResponse.addresses;
          }
        }
      }

      setUser(updatedUser);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error("Failed to update profile:", error);
      if (
        error.message.toLowerCase().includes("failed to fetch") ||
        error.response?.status === 401
      ) {
        alert("Your session may have expired. Please log in again.");
        logout();
        return;
      }
      alert(`Error updating profile: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const uploadFormData = new FormData();
      uploadFormData.append('profilePhoto', file);

      try {
        // ✅ uploadProfilePhotoAPI instead of ApiService.uploadProfilePhoto
        const response = await uploadProfilePhotoAPI(uploadFormData);
        setProfilePhotoUrl(response.profilePhoto.url);
        setUser(prevUser => ({
          ...prevUser,
          profilePhoto: response.profilePhoto,
        }));
        alert('Photo uploaded successfully!');
      } catch (error) {
        console.error("Photo upload failed:", error);
        alert(`Photo upload failed: ${error.message}`);
      }
    }
  };

  const handleUploadClick = () => fileInputRef.current.click();
  const handleRemovePhoto = () => alert('Remove photo functionality requires a backend endpoint.');
  const handleCancel = () => navigate('/profile');

  const initials = formData.fullname
    ? formData.fullname.split(' ').map(n => n[0]).join('').toUpperCase()
    : '?';

  return (
    <div className="profile-page-container">
      <main className="main-content">
        <div className="profile-layout">
          <aside className="profile-sidebar">
            <div className="card card-hover sticky-card">
              <h3 className="card-title-lg">Profile Photo</h3>
              <div className="photo-section">
                <div className="avatar-wrapper">
                  {profilePhotoUrl ? (
                    <img
                      src={profilePhotoUrl}
                      alt="Profile"
                      className="profile-avatar-large-img"
                    />
                  ) : (
                    <div className="profile-avatar-large">{initials}</div>
                  )}
                </div>
                <div className="photo-actions">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    style={{ display: 'none' }}
                  />
                  <button className="button-upload" onClick={handleUploadClick}>
                    Upload New Photo
                  </button>
                  <button className="button-remove" onClick={handleRemovePhoto}>
                    Remove Photo
                  </button>
                </div>
              </div>
            </div>
          </aside>

          <div className="profile-main-form">
            <form id="editProfileForm" onSubmit={handleSubmit}>
              <div className="card card-hover">
                <h3 className="card-title-xl">Personal Information</h3>
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label htmlFor="fullname" className="form-label">Full Name</label>
                    <input
                      id="fullname" name="fullname" type="text"
                      value={formData.fullname}
                      onChange={handleInputChange}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group full-width">
                    <label htmlFor="email" className="form-label">
                      Email Address (Cannot be changed)
                    </label>
                    <input
                      id="email" name="email" type="email"
                      value={formData.email}
                      className="form-input"
                      readOnly disabled
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="phoneNumber" className="form-label">Phone Number</label>
                    <input
                      id="phoneNumber" name="phoneNumber" type="tel"
                      value={formData.phoneNumber}
                      onChange={handleInputChange}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group full-width">
                    <label htmlFor="bio" className="form-label">Bio</label>
                    <textarea
                      id="bio" name="bio"
                      value={formData.bio}
                      onChange={handleInputChange}
                      className="form-textarea"
                      rows="4"
                      placeholder="Tell us a little about yourself..."
                    />
                  </div>
                </div>
              </div>

              <div className="card card-hover">
                <h3 className="card-title-xl">Address Information</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label htmlFor="addressName" className="form-label">Contact Name</label>
                    <input
                      id="addressName" name="name" type="text"
                      value={formData.address.name}
                      onChange={handleAddressChange}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="addressMobile" className="form-label">Contact Mobile</label>
                    <input
                      id="addressMobile" name="mobileNumber" type="tel"
                      value={formData.address.mobileNumber}
                      onChange={handleAddressChange}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group full-width">
                    <label htmlFor="landmark" className="form-label">Address / Landmark</label>
                    <input
                      id="landmark" name="landmark" type="text"
                      value={formData.address.landmark}
                      onChange={handleAddressChange}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="city" className="form-label">City</label>
                    <input
                      id="city" name="city" type="text"
                      value={formData.address.city}
                      onChange={handleAddressChange}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="state" className="form-label">State/Province</label>
                    <input
                      id="state" name="state" type="text"
                      value={formData.address.state}
                      onChange={handleAddressChange}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="pincode" className="form-label">ZIP/Pincode</label>
                    <input
                      id="pincode" name="pincode" type="text"
                      value={formData.address.pincode}
                      onChange={handleAddressChange}
                      className="form-input"
                    />
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="action-buttons-container">
                  <button type="button" onClick={handleCancel} className="button-cancel">
                    Cancel
                  </button>
                  <button type="submit" className="btn-primary" disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EditProfile;