import React, { useState } from 'react';
import "../styles/form.css";
import Header from '../components/Header/Headermain';

const ProductUploadForm = () => {
    const getEmptyProduct = () => ({
        id: Date.now() + Math.random(),
        // Required fields from controller
        productname: '',
        productprice: '',
        productdescription: '',
        category: '',
        images: [],
        
        // Optional fields from controller
        originalPrice: '',
        subcategory: '',
        tags: [],
        
        // Specifications object matching controller
        specifications: {
            brand: '',
            model: '',
            color: '',
            weight: '',
            dimensions: {
                length: '',
                width: '',
                height: ''
            },
            warranty: ''
        },
        
        // Stock object matching backend model (only quantity)
        stock: {
            quantity: 1
        },
    });

    const [products, setProducts] = useState([getEmptyProduct()]);
    const [activeProductIndex, setActiveProductIndex] = useState(0);
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [tagInput, setTagInput] = useState('');
    const [uploadProgress, setUploadProgress] = useState(0);

    // Categories matching model enum
    const categories = [
        'Smartphones', 'Electronics', 'Clothing', 'Books', 'Home & Kitchen',
        'Beauty', 'Sports', 'Toys', 'Automotive', 'Health', 'Jewelry', 'Others'
    ];

    const subcategories = {
        'Smartphones': ['iPhone', 'Android', 'Accessories', 'Cases', 'Chargers'],
        'Electronics': ['Laptops', 'Tablets', 'Audio', 'Gaming', 'Cameras', 'Smart Home'],
        'Clothing': ['Men', 'Women', 'Kids', 'Shoes', 'Accessories'],
        'Books': ['Fiction', 'Non-Fiction', 'Educational', 'Children', 'Comics'],
        'Home & Kitchen': ['Furniture', 'Decor', 'Kitchen', 'Garden', 'Storage'],
        'Beauty': ['Skincare', 'Makeup', 'Hair Care', 'Fragrance', 'Tools'],
        'Sports': ['Fitness', 'Outdoor', 'Team Sports', 'Water Sports', 'Equipment'],
        'Toys': ['Action Figures', 'Board Games', 'Educational', 'Electronic', 'Dolls'],
        'Automotive': ['Parts', 'Accessories', 'Tools', 'Care', 'Electronics'],
        'Health': ['Supplements', 'Medical', 'Fitness', 'Personal Care', 'Equipment'],
        'Jewelry': ['Rings', 'Necklaces', 'Bracelets', 'Earrings', 'Watches'],
        'Others': ['Miscellaneous', 'Collectibles', 'Art', 'Crafts']
    };

    const currentProduct = products[activeProductIndex];

    const addProduct = () => {
        const newProduct = getEmptyProduct();
        setProducts(prev => [...prev, newProduct]);
        setActiveProductIndex(products.length);
        setErrors({});
        setTagInput('');
    };

    const removeProduct = (index) => {
        if (products.length === 1) return;
        
        const newProducts = products.filter((_, i) => i !== index);
        setProducts(newProducts);
        
        if (activeProductIndex >= newProducts.length) {
            setActiveProductIndex(newProducts.length - 1);
        } else if (activeProductIndex > index) {
            setActiveProductIndex(activeProductIndex - 1);
        }
        setErrors({});
    };

    const duplicateProduct = (index) => {
        const productToDuplicate = { ...products[index] };
        // Deep clone nested objects
        productToDuplicate.specifications = { 
            ...productToDuplicate.specifications,
            dimensions: { ...productToDuplicate.specifications.dimensions }
        };
        productToDuplicate.stock = { ...productToDuplicate.stock };
        productToDuplicate.tags = [...productToDuplicate.tags];
        productToDuplicate.images = [...productToDuplicate.images];
        
        productToDuplicate.id = Date.now() + Math.random();
        productToDuplicate.productname = productToDuplicate.productname + ' (Copy)';
        
        const newProducts = [...products];
        newProducts.splice(index + 1, 0, productToDuplicate);
        setProducts(newProducts);
        setActiveProductIndex(index + 1);
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        
        setProducts(prev => {
            const newProducts = [...prev];
            const product = { ...newProducts[activeProductIndex] };
            
            if (name.includes('.')) {
                const [parent, child, grandchild] = name.split('.');
                if (grandchild) {
                    product[parent] = {
                        ...product[parent],
                        [child]: {
                            ...product[parent][child],
                            [grandchild]: type === 'number' ? (value === '' ? '' : Number(value)) : value
                        }
                    };
                } else {
                    product[parent] = {
                        ...product[parent],
                        [child]: type === 'number' ? (value === '' ? '' : Number(value)) : value
                    };
                }
            } else {
                product[name] = type === 'checkbox' ? checked : (type === 'number' ? (value === '' ? '' : Number(value)) : value);
            }
            
            newProducts[activeProductIndex] = product;
            return newProducts;
        });

        // Clear errors for this field
        if (errors[activeProductIndex]?.[name]) {
            setErrors(prev => ({
                ...prev,
                [activeProductIndex]: {
                    ...prev[activeProductIndex],
                    [name]: ''
                }
            }));
        }
    };

    const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const maxFiles = 10 - currentProduct.images.length;
    const acceptedFiles = [];

    files.slice(0, maxFiles).forEach(file => {
        if (file.type.startsWith('image/') && file.size <= 5 * 1024 * 1024) {
            // ✅ Prevent duplicates by checking file.name + lastModified
            const alreadyExists = currentProduct.images.some(
                img => img.file?.name === file.name && img.file?.lastModified === file.lastModified
            );
            if (!alreadyExists) {
                acceptedFiles.push(file);
            }
        } else {
            alert(`Invalid file: ${file.name}. Please upload images under 5MB.`);
        }
    });

    if (acceptedFiles.length === 0) return;

    const fileReadPromises = acceptedFiles.map(file => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => {
                resolve({
                    file,
                    url: event.target.result,
                    alt_text: file.name,
                    size: file.size,
                });
            };
            reader.onerror = (error) => reject(error);
            reader.readAsDataURL(file);
        });
    });

    Promise.all(fileReadPromises).then(newImages => {
        setProducts(prev => {
            const newProducts = [...prev];
            const updatedImages = [...newProducts[activeProductIndex].images, ...newImages];
            newProducts[activeProductIndex].images = updatedImages;
            return newProducts;
        });
    }).catch(error => {
        console.error("Error reading files:", error);
        alert("There was an error processing your images.");
    });

    e.target.value = ''; // Reset file input
};


    const removeImage = (index) => {
        setProducts(prev => {
            const newProducts = [...prev];
            newProducts[activeProductIndex].images = newProducts[activeProductIndex].images.filter((_, i) => i !== index);
            return newProducts;
        });
    };

    const handleTagInput = (e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            const tag = tagInput.trim().toLowerCase();
            if (tag && !currentProduct.tags.includes(tag) && tag.length <= 20) {
                setProducts(prev => {
                    const newProducts = [...prev];
                    newProducts[activeProductIndex].tags = [...newProducts[activeProductIndex].tags, tag];
                    return newProducts;
                });
            }
            setTagInput('');
        }
    };

    const removeTag = (tagToRemove) => {
        setProducts(prev => {
            const newProducts = [...prev];
            newProducts[activeProductIndex].tags = newProducts[activeProductIndex].tags.filter(tag => tag !== tagToRemove);
            return newProducts;
        });
    };

    const validateProduct = (product) => {
        const newErrors = {};

        // Required field validations matching backend
        if (!product.productname.trim()) {
            newErrors.productname = 'Product name is required';
        } else if (product.productname.length < 3) {
            newErrors.productname = 'Product name must be at least 3 characters long';
        } else if (product.productname.length > 100) {
            newErrors.productname = 'Product name cannot exceed 100 characters';
        }

        if (product.productprice === '' || product.productprice === null || product.productprice === undefined) {
            newErrors.productprice = 'Product price is required';
        } else if (product.productprice < 0) {
            newErrors.productprice = 'Product price cannot be negative';
        }

        if (!product.productdescription.trim()) {
            newErrors.productdescription = 'Product description is required';
        } else if (product.productdescription.length < 10) {
            newErrors.productdescription = 'Product description must be at least 10 characters long';
        } else if (product.productdescription.length > 2000) {
            newErrors.productdescription = 'Product description cannot exceed 2000 characters';
        }

        if (!product.category) {
            newErrors.category = 'Category is required';
        }

        if (product.images.length === 0) {
            newErrors.images = 'At least one image is required';
        } else if (product.images.length > 10) {
            newErrors.images = 'Maximum 10 images allowed';
        }

        // Optional field validations
        if (product.originalPrice && product.productprice && parseFloat(product.originalPrice) < parseFloat(product.productprice)) {
            newErrors.originalPrice = 'Original price must be greater than or equal to current price';
        }

        if (product.stock.quantity < 0) {
            newErrors['stock.quantity'] = 'Stock quantity cannot be negative';
        }

        // Specifications validations
        if (product.specifications.brand && product.specifications.brand.length > 50) {
            newErrors['specifications.brand'] = 'Brand name cannot exceed 50 characters';
        }
        if (product.specifications.model && product.specifications.model.length > 50) {
            newErrors['specifications.model'] = 'Model name cannot exceed 50 characters';
        }
        if (product.specifications.color && product.specifications.color.length > 30) {
            newErrors['specifications.color'] = 'Color name cannot exceed 30 characters';
        }
        if (product.specifications.warranty && product.specifications.warranty.length > 100) {
            newErrors['specifications.warranty'] = 'Warranty info cannot exceed 100 characters';
        }

        return newErrors;
    };

    const validateAllProducts = () => {
        const allErrors = {};
        let hasErrors = false;

        products.forEach((product, index) => {
            const productErrors = validateProduct(product);
            if (Object.keys(productErrors).length > 0) {
                allErrors[index] = productErrors;
                hasErrors = true;
            }
        });

        return { allErrors, hasErrors };
    };

    const prepareProductsForSubmission = () => {
        return products.map(product => {
            const submitProduct = {
                productname: product.productname.trim(),
                productprice: parseFloat(product.productprice),
                productdescription: product.productdescription.trim(),
                category: product.category,
            };

            // Add optional fields only if they have values
            if (product.originalPrice) {
                submitProduct.originalPrice = parseFloat(product.originalPrice);
            }
            if (product.subcategory) {
                submitProduct.subcategory = product.subcategory;
            }
            if (product.tags.length > 0) {
                submitProduct.tags = JSON.stringify(product.tags);
            }

            // Add specifications only if they have values
            const hasSpecs = Object.values(product.specifications).some(value => {
                if (typeof value === 'object') {
                    return Object.values(value).some(v => v !== '');
                }
                return value !== '';
            });
            if (hasSpecs) {
                submitProduct.specifications = JSON.stringify(product.specifications);
            }

            // Add stock
            submitProduct.stock = JSON.stringify(product.stock);

            return submitProduct;
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const { allErrors, hasErrors } = validateAllProducts();
        if (hasErrors) {
            setErrors(allErrors);
            const firstErrorIndex = Object.keys(allErrors)[0];
            setActiveProductIndex(parseInt(firstErrorIndex));
            return;
        }

        setIsLoading(true);
        setSuccessMessage('');
        setErrors({});
        setUploadProgress(0);

        try {
            const preparedProducts = prepareProductsForSubmission();
            const formData = new FormData();
            
            // API endpoints with correct versioning
            const API_BASE = '/api/v1';
            let endpoint;
            
            if (products.length === 1) {
                // Single product submission
                endpoint = `${API_BASE}/products/create`;
                const product = preparedProducts[0];
                
                Object.keys(product).forEach(key => {
                    if (product[key] !== undefined) {
                        formData.append(key, product[key]);
                    }
                });
                
                // Add images for single product
                products[0].images.forEach(image => {
                    if (image.file) {
                        formData.append('images', image.file);
                    }
                });
            } else {
                // Multiple products submission
                endpoint = `${API_BASE}/products/bulk-create`;
                formData.append('products', JSON.stringify(preparedProducts));
                
                // Add images for each product with correct field names
                products.forEach((product, productIndex) => {
                    product.images.forEach(image => {
                        if (image.file) {
                            formData.append(`images_${productIndex}`, image.file);
                        }
                    });
                });
            }

            // Simulate upload progress
            const progressInterval = setInterval(() => {
                setUploadProgress(prev => {
                    if (prev >= 90) {
                        clearInterval(progressInterval);
                        return prev;
                    }
                    return prev + 10;
                });
            }, 200);

            const response = await fetch(endpoint, {
                method: 'POST',
                body: formData,
                credentials: 'include', // Important for cookie-based authentication
            });

            clearInterval(progressInterval);
            setUploadProgress(100);

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.message || 'Upload failed');
            }

            // Handle successful upload
            const message = result.message || `${products.length} product${products.length > 1 ? 's' : ''} uploaded successfully!`;
            setSuccessMessage(message);
            
            // Handle bulk upload errors (partial success)
            if (result.errors && result.errors.length > 0) {
                console.warn('Some products had errors:', result.errors);
                setSuccessMessage(message + ` (${result.errors.length} products had errors)`);
            }
            
            // Reset form after success
            setTimeout(() => {
                setProducts([getEmptyProduct()]);
                setActiveProductIndex(0);
                setSuccessMessage('');
                setUploadProgress(0);
            }, 3000);

        } catch (error) {
            console.error('Error submitting products:', error);
            
            // Handle different types of errors
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                setErrors({ submit: 'Network error. Please check your connection and try again.' });
            } else if (error.message.includes('413')) {
                setErrors({ submit: 'Files too large. Please reduce image sizes and try again.' });
            } else if (error.message.includes('401') || error.message.includes('403')) {
                setErrors({ submit: 'Authentication failed. Please log in and try again.' });
            } else {
                setErrors({ submit: error.message || 'Failed to upload products. Please try again.' });
            }
        } finally {
            setIsLoading(false);
            setTimeout(() => setUploadProgress(0), 2000);
        }
    };

    return (
        <div className="form-container">
            <div className="form-header">
                <h1><i className="fas fa-plus-circle"></i> Add New Products</h1>
                <p>Fill in the details below to add products to your store</p>
                <div style={{ marginTop: '1rem', fontSize: '1rem', opacity: 0.9 }}>
                    <i className="fas fa-layer-group"></i> Managing {products.length} product{products.length > 1 ? 's' : ''}
                </div>
            </div>

            {/* Upload Progress Bar */}
            {isLoading && uploadProgress > 0 && (
                <div className="progress-container" style={{ margin: '1rem 0' }}>
                    <div className="progress-bar" style={{ width: '100%', backgroundColor: '#e5e7eb', borderRadius: '0.5rem', height: '0.5rem' }}>
                        <div 
                            className="progress-fill" 
                            style={{ 
                                width: `${uploadProgress}%`, 
                                backgroundColor: '#3b82f6', 
                                height: '100%', 
                                borderRadius: '0.5rem',
                                transition: 'width 0.3s ease'
                            }}
                        ></div>
                    </div>
                    <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
                        Uploading... {uploadProgress}%
                    </div>
                </div>
            )}

            {/* Product Tabs */}
            <div className="product-tabs">
                {products.map((product, index) => (
                    <div 
                        key={product.id} 
                        className={`product-tab ${index === activeProductIndex ? 'active' : ''}`} 
                        onClick={() => setActiveProductIndex(index)}
                    >
                        {errors[index] && <div className="tab-error-indicator"></div>}
                        <div className="product-tab-name">
                            {product.productname || `Product ${index + 1}`}
                        </div>
                        <div className="product-tab-actions">
                            <button 
                                type="button" 
                                className="tab-action-btn duplicate" 
                                onClick={(e) => { e.stopPropagation(); duplicateProduct(index); }} 
                                title="Duplicate Product"
                            >
                                <i className="fas fa-copy"></i>
                            </button>
                            {products.length > 1 && (
                                <button 
                                    type="button" 
                                    className="tab-action-btn remove" 
                                    onClick={(e) => { e.stopPropagation(); removeProduct(index); }} 
                                    title="Remove Product"
                                >
                                    <i className="fas fa-times"></i>
                                </button>
                            )}
                        </div>
                    </div>
                ))}
                <button 
                    type="button" 
                    className="add-product-tab" 
                    onClick={addProduct} 
                    title="Add New Product"
                >
                    <i className="fas fa-plus"></i> Add Product 
                    <span className="product-counter">{products.length}</span>
                </button>
            </div>

            <form className="form-content" onSubmit={handleSubmit}>
                {successMessage && (
                    <div className="success-message">
                        <i className="fas fa-check-circle"></i> {successMessage}
                    </div>
                )}

                {/* Product Information */}
                <div className="form-section">
                    <h2 className="section-title">
                        <i className="fas fa-info-circle"></i> Product Information
                    </h2>
                    <div className="form-grid">
                        <div className="form-group">
                            <label className="form-label">
                                Product Name <span className="required">*</span>
                            </label>
                            <input 
                                type="text" 
                                name="productname" 
                                value={currentProduct.productname} 
                                onChange={handleInputChange} 
                                className="form-input" 
                                placeholder="Enter product name (3-100 characters)" 
                                maxLength="100"
                            />
                            {errors[activeProductIndex]?.productname && (
                                <div className="error-message">{errors[activeProductIndex].productname}</div>
                            )}
                        </div>

                        <div className="form-group">
                            <label className="form-label">
                                Category <span className="required">*</span>
                            </label>
                            <select 
                                name="category" 
                                value={currentProduct.category} 
                                onChange={handleInputChange} 
                                className="form-select"
                            >
                                <option value="">Select Category</option>
                                {categories.map(cat => (
                                    <option key={cat} value={cat}>{cat}</option>
                                ))}
                            </select>
                            {errors[activeProductIndex]?.category && (
                                <div className="error-message">{errors[activeProductIndex].category}</div>
                            )}
                        </div>

                        <div className="form-group">
                            <label className="form-label">Subcategory</label>
                            <select 
                                name="subcategory" 
                                value={currentProduct.subcategory} 
                                onChange={handleInputChange} 
                                className="form-select" 
                                disabled={!currentProduct.category}
                            >
                                <option value="">Select Subcategory</option>
                                {currentProduct.category && subcategories[currentProduct.category]?.map(sub => (
                                    <option key={sub} value={sub}>{sub}</option>
                                ))}
                            </select>
                        </div>

                        <div className="form-group">
                            <label className="form-label">Tags (max 20 chars each)</label>
                            <div className="tag-input-container">
                                {currentProduct.tags.map((tag, index) => (
                                    <span key={index} className="tag">
                                        {tag}
                                        <button 
                                            type="button" 
                                            className="tag-remove" 
                                            onClick={() => removeTag(tag)}
                                        >
                                            ×
                                        </button>
                                    </span>
                                ))}
                                <input 
                                    type="text" 
                                    className="tag-input" 
                                    placeholder="Add tags (press Enter or comma)" 
                                    value={tagInput} 
                                    onChange={(e) => setTagInput(e.target.value)} 
                                    onKeyDown={handleTagInput} 
                                    maxLength="20"
                                />
                            </div>
                        </div>

                        <div className="form-group full-width">
                            <label className="form-label">
                                Product Description <span className="required">*</span>
                            </label>
                            <textarea 
                                name="productdescription" 
                                value={currentProduct.productdescription} 
                                onChange={handleInputChange} 
                                className="form-textarea" 
                                placeholder="Describe your product in detail (10-2000 characters)..." 
                                maxLength="2000"
                                rows="4"
                            />
                            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
                                {currentProduct.productdescription.length}/2000 characters
                            </div>
                            {errors[activeProductIndex]?.productdescription && (
                                <div className="error-message">{errors[activeProductIndex].productdescription}</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Pricing */}
                <div className="form-section">
                    <h2 className="section-title">
                        <i className="fas fa-dollar-sign"></i> Pricing
                    </h2>
                    <div className="form-grid">
                        <div className="form-group">
                            <label className="form-label">
                                Product Price <span className="required">*</span>
                            </label>
                            <input 
                                type="number" 
                                name="productprice" 
                                value={currentProduct.productprice} 
                                onChange={handleInputChange} 
                                className="form-input" 
                                placeholder="0.00" 
                                min="0" 
                                step="0.01"
                            />
                            {errors[activeProductIndex]?.productprice && (
                                <div className="error-message">{errors[activeProductIndex].productprice}</div>
                            )}
                        </div>

                        <div className="form-group">
                            <label className="form-label">Original Price (for discounts)</label>
                            <input 
                                type="number" 
                                name="originalPrice" 
                                value={currentProduct.originalPrice} 
                                onChange={handleInputChange} 
                                className="form-input" 
                                placeholder="0.00" 
                                min="0" 
                                step="0.01"
                            />
                            {errors[activeProductIndex]?.originalPrice && (
                                <div className="error-message">{errors[activeProductIndex].originalPrice}</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Images */}
                <div className="form-section">
                    <h2 className="section-title">
                        <i className="fas fa-images"></i> Product Images <span className="required">*</span>
                    </h2>
                    <div className="image-upload-section">
                        <i className="fas fa-cloud-upload-alt" style={{ fontSize: '3rem', color: '#9ca3af', marginBottom: '1rem' }}></i>
                        <p>Upload product images (1-10 images required)</p>
                        <p style={{ fontSize: '0.875rem', color: '#6b7280', marginBottom: '1rem' }}>
                            Max 5MB each • Supported: JPG, PNG, WebP, GIF
                        </p>
                        <input 
                            type="file" 
                            accept="image/*" 
                            multiple 
                            onChange={handleImageUpload} 
                            style={{ display: 'none' }} 
                            id="image-upload"
                        />
                        <label htmlFor="image-upload" className="add-image-btn">
                            <i className="fas fa-plus"></i> Choose Images ({currentProduct.images.length}/10)
                        </label>
                        
                        {currentProduct.images.length > 0 && (
                            <div className="image-list">
                                {currentProduct.images.map((image, index) => (
                                    <div key={index} className="image-item">
                                        <div className="image-preview">
                                            <img src={image.url} alt={image.alt_text} />
                                        </div>
                                        <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                                            {(image.size / 1024 / 1024).toFixed(2)} MB
                                        </div>
                                        <button 
                                            type="button" 
                                            onClick={() => removeImage(index)} 
                                            className="remove-image"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                        
                        {errors[activeProductIndex]?.images && (
                            <div className="error-message">{errors[activeProductIndex].images}</div>
                        )}
                    </div>
                </div>

                {/* Specifications */}
                <div className="form-section">
                    <h2 className="section-title">
                        <i className="fas fa-cogs"></i> Specifications
                    </h2>
                    <div className="form-grid">
                        <div className="form-group">
                            <label className="form-label">Brand</label>
                            <input 
                                type="text" 
                                name="specifications.brand" 
                                value={currentProduct.specifications.brand} 
                                onChange={handleInputChange} 
                                className="form-input" 
                                placeholder="Product brand"
                                maxLength="50"
                            />
                            {errors[activeProductIndex]?.['specifications.brand'] && (
                                <div className="error-message">{errors[activeProductIndex]['specifications.brand']}</div>
                            )}
                        </div>

                        <div className="form-group">
                            <label className="form-label">Model</label>
                            <input 
                                type="text" 
                                name="specifications.model" 
                                value={currentProduct.specifications.model} 
                                onChange={handleInputChange} 
                                className="form-input" 
                                placeholder="Product model"
                                maxLength="50"
                            />
                            {errors[activeProductIndex]?.['specifications.model'] && (
                                <div className="error-message">{errors[activeProductIndex]['specifications.model']}</div>
                            )}
                        </div>

                        <div className="form-group">
                            <label className="form-label">Color</label>
                            <input 
                                type="text" 
                                name="specifications.color" 
                                value={currentProduct.specifications.color} 
                                onChange={handleInputChange} 
                                className="form-input" 
                                placeholder="Product color"
                                maxLength="30"
                            />
                            {errors[activeProductIndex]?.['specifications.color'] && (
                                <div className="error-message">{errors[activeProductIndex]['specifications.color']}</div>
                            )}
                        </div>

                        <div className="form-group">
                            <label className="form-label">Weight (kg)</label>
                            <input 
                                type="number" 
                                name="specifications.weight" 
                                value={currentProduct.specifications.weight} 
                                onChange={handleInputChange} 
                                className="form-input" 
                                placeholder="e.g., 0.5" 
                                min="0" 
                                step="0.01"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">Warranty</label>
                            <input 
                                type="text" 
                                name="specifications.warranty" 
                                value={currentProduct.specifications.warranty} 
                                onChange={handleInputChange} 
                                className="form-input" 
                                placeholder="e.g., 1 year"
                                maxLength="100"
                            />
                            {errors[activeProductIndex]?.['specifications.warranty'] && (
                                <div className="error-message">{errors[activeProductIndex]['specifications.warranty']}</div>
                            )}
                        </div>

                        <div className="form-group">
                            <label className="form-label">Dimensions (cm)</label>
                            <div className="dimensions-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem' }}>
                                <input 
                                    type="number" 
                                    name="specifications.dimensions.length" 
                                    value={currentProduct.specifications.dimensions.length} 
                                    onChange={handleInputChange} 
                                    className="form-input" 
                                    placeholder="Length"
                                    min="0"
                                    step="0.1"
                                />
                                <input 
                                    type="number" 
                                    name="specifications.dimensions.width" 
                                    value={currentProduct.specifications.dimensions.width} 
                                    onChange={handleInputChange} 
                                    className="form-input" 
                                    placeholder="Width"
                                    min="0"
                                    step="0.1"
                                />
                                <input 
                                    type="number" 
                                    name="specifications.dimensions.height" 
                                    value={currentProduct.specifications.dimensions.height} 
                                    onChange={handleInputChange} 
                                    className="form-input" 
                                    placeholder="Height"
                                    min="0"
                                    step="0.1"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stock Management */}
                <div className="form-section">
                    <h2 className="section-title">
                        <i className="fas fa-boxes"></i> Stock Management
                    </h2>
                    <div className="form-grid">
                        <div className="form-group">
                            <label className="form-label">Quantity</label>
                            <input 
                                type="number" 
                                name="stock.quantity" 
                                value={currentProduct.stock.quantity} 
                                onChange={handleInputChange} 
                                className="form-input" 
                                placeholder="Available quantity" 
                                min="0"
                            />
                            {errors[activeProductIndex]?.['stock.quantity'] && (
                                <div className="error-message">{errors[activeProductIndex]['stock.quantity']}</div>
                            )}
                        </div>
                    </div>
                </div>

                {errors.submit && (
                    <div className="error-message" style={{ marginTop: '1rem', textAlign: 'center' }}>
                        <i className="fas fa-exclamation-triangle"></i> {errors.submit}
                    </div>
                )}

                {/* === CORRECTED: Actions are now INSIDE the form === */}
                <div className={`form-actions ${isLoading ? 'loading' : ''}`}>
                    <button 
                        type="button" 
                        onClick={() => window.history.back()} 
                        className="btn btn-secondary" 
                        disabled={isLoading}
                    >
                        <i className="fas fa-times"></i> Cancel
                    </button>
                    <button 
                        type="submit" 
                        className="btn btn-primary" 
                        disabled={isLoading}
                    >
                        <i className="fas fa-upload"></i> 
                        {isLoading 
                            ? `Uploading... ${uploadProgress}%` 
                            : `Upload ${products.length} Product${products.length > 1 ? 's' : ''}`
                        }
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ProductUploadForm;