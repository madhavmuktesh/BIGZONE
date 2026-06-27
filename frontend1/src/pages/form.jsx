import React, { useState, useEffect } from 'react';
import "../styles/form.css";
import Header from '../components/Header/Headermain';
import { useParams, useNavigate } from 'react-router-dom';


const ProductUploadForm = () => {
    const { productId } = useParams();
    const navigate = useNavigate();
    const isEditMode = Boolean(productId);

    const getEmptyProduct = () => ({
        id: Date.now() + Math.random(),
        productname: '',
        productprice: '',
        productdescription: '',
        category: '',
        images: [],
        originalPrice: '',
        subcategory: '',
        tags: [],
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
        stock: {
            quantity: 1
        },
        ecoScore: 0,
        co2SavedKg: 0,
        isEcoFriendly: false,
    });

    const [products, setProducts] = useState([getEmptyProduct()]);
    const [activeProductIndex, setActiveProductIndex] = useState(0);
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [tagInput, setTagInput] = useState('');
    const [uploadProgress, setUploadProgress] = useState(0);

    // ── EDIT MODE: Fetch existing product data ───────────────────────────────
    useEffect(() => {
        if (!isEditMode) return;

        const fetchProduct = async () => {
            try {
            setIsLoading(true);

            const res = await fetch(`/api/v1/products/${productId}`, {
                credentials: 'include',
            });

            const data = await res.json();

            if (!res.ok || !data.success) {
                throw new Error(data.message || 'Failed to load product');
            }

            const p = data.product;

            const mappedImages = (p.images || []).map((img) => ({
                url: typeof img === 'string' ? img : img.url,
                alt_text: typeof img === 'string' ? 'Product image' : (img.alt_text || 'Product image'),
                size: 0,
                file: null,
                isExisting: true,
            }));

            setProducts([{
                id: p._id,
                productname: p.productname || '',
                productprice: p.productprice ?? '',
                productdescription: p.productdescription || '',
                category: p.category || '',
                subcategory: p.subcategory || '',
                originalPrice: p.originalPrice ?? '',
                tags: p.tags || [],
                images: mappedImages,
                specifications: {
                brand: p.specifications?.brand || '',
                model: p.specifications?.model || '',
                color: p.specifications?.color || '',
                weight: p.specifications?.weight || '',
                dimensions: {
                    length: p.specifications?.dimensions?.length || '',
                    width: p.specifications?.dimensions?.width || '',
                    height: p.specifications?.dimensions?.height || '',
                },
                warranty: p.specifications?.warranty || '',
                },
                stock: {
                quantity: p.stock?.quantity ?? 1,
                },
                ecoScore: p.ecoScore ?? 0,
                co2SavedKg: p.co2SavedKg ?? 0,
                isEcoFriendly: p.isEcoFriendly || false,
            }]);
            } catch (err) {
            console.error('Error fetching product:', err);
            alert('Could not load product: ' + err.message);
            navigate('/sellerdashboard');
            } finally {
            setIsLoading(false);
            }
        };

        fetchProduct();
        }, [productId, isEditMode, navigate]);
    // ────────────────────────────────────────────────────────────────────────

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
                        isExisting: false,
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

        e.target.value = '';
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
        } else if (product.productdescription.length > 5000) {
            newErrors.productdescription = 'Product description cannot exceed 5000 characters';
        }

        if (!product.category) {
            newErrors.category = 'Category is required';
        }

        if (product.images.length === 0) {
            newErrors.images = 'At least one image is required';
        } else if (product.images.length > 10) {
            newErrors.images = 'Maximum 10 images allowed';
        }

        if (product.originalPrice && product.productprice && parseFloat(product.originalPrice) < parseFloat(product.productprice)) {
            newErrors.originalPrice = 'Original price must be greater than or equal to current price';
        }

        if (product.stock.quantity < 0) {
            newErrors['stock.quantity'] = 'Stock quantity cannot be negative';
        }

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

            if (product.originalPrice) {
                submitProduct.originalPrice = parseFloat(product.originalPrice);
            }
            if (product.subcategory) {
                submitProduct.subcategory = product.subcategory;
            }
            if (product.tags.length > 0) {
                submitProduct.tags = JSON.stringify(product.tags);
            }

            const hasSpecs = Object.values(product.specifications).some(value => {
                if (typeof value === 'object') {
                    return Object.values(value).some(v => v !== '');
                }
                return value !== '';
            });
            if (hasSpecs) {
                submitProduct.specifications = JSON.stringify(product.specifications);
            }

            submitProduct.stock = JSON.stringify(product.stock);

            // Eco fields
            if (product.ecoScore) submitProduct.ecoScore = product.ecoScore;
            if (product.co2SavedKg) submitProduct.co2SavedKg = product.co2SavedKg;
            submitProduct.isEcoFriendly = product.isEcoFriendly;

            return submitProduct;
        });
    };

    // ── MAIN SUBMIT — branches into EDIT (PATCH) or CREATE (POST) ──────────
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
            if (isEditMode) {
            const product = products[0];
            const formData = new FormData();

            formData.append('productname', product.productname.trim());
            formData.append('productprice', parseFloat(product.productprice));
            formData.append('productdescription', product.productdescription.trim());
            formData.append('category', product.category);

            if (product.subcategory) {
                formData.append('subcategory', product.subcategory);
            }

            if (product.originalPrice) {
                formData.append('originalPrice', parseFloat(product.originalPrice));
            }

            if (product.tags.length > 0) {
                formData.append('tags', JSON.stringify(product.tags));
            }

            formData.append('stock', JSON.stringify(product.stock));
            formData.append('ecoScore', product.ecoScore || 0);
            formData.append('co2SavedKg', product.co2SavedKg || 0);
            formData.append('isEcoFriendly', product.isEcoFriendly || false);

            const hasSpecs = Object.values(product.specifications).some(value => {
                if (typeof value === 'object') {
                return Object.values(value).some(v => v !== '');
                }
                return value !== '';
            });

            if (hasSpecs) {
                formData.append('specifications', JSON.stringify(product.specifications));
            }

            const existingImages = product.images
                .filter(img => img.isExisting)
                .map(img => img.url);

            formData.append('existingImages', JSON.stringify(existingImages));

            product.images.forEach(image => {
                if (image.file) {
                formData.append('images', image.file);
                }
            });

            const response = await fetch(`/api/v1/products/${productId}`, {
                method: 'PUT',
                body: formData,
                credentials: 'include',
            });

            setUploadProgress(100);

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.message || 'Update failed');
            }

            setSuccessMessage('Product updated successfully!');
            setTimeout(() => navigate('/sellerdashboard'), 2000);
            } else {
            const preparedProducts = prepareProductsForSubmission();
            const formData = new FormData();
            const API_BASE = '/api/v1';
            let endpoint;

            if (products.length === 1) {
                endpoint = `${API_BASE}/products/create`;
                const product = preparedProducts[0];

                Object.keys(product).forEach(key => {
                if (product[key] !== undefined) {
                    formData.append(key, product[key]);
                }
                });

                products[0].images.forEach(image => {
                if (image.file) {
                    formData.append('images', image.file);
                }
                });
            } else {
                endpoint = `${API_BASE}/products/bulk-create`;
                formData.append('products', JSON.stringify(preparedProducts));

                products.forEach((product, productIndex) => {
                product.images.forEach(image => {
                    if (image.file) {
                    formData.append(`images_${productIndex}`, image.file);
                    }
                });
                });
            }

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
                credentials: 'include',
            });

            clearInterval(progressInterval);
            setUploadProgress(100);

            const result = await response.json();

            if (!response.ok || !result.success) {
                throw new Error(result.message || 'Upload failed');
            }

            const message =
                result.message ||
                `${products.length} product${products.length > 1 ? 's' : ''} uploaded successfully!`;

            setSuccessMessage(message);

            if (result.errors && result.errors.length > 0) {
                setSuccessMessage(message + ` (${result.errors.length} products had errors)`);
            }

            setTimeout(() => {
                setProducts([getEmptyProduct()]);
                setActiveProductIndex(0);
                setSuccessMessage('');
                setUploadProgress(0);
            }, 3000);
            }
        } catch (error) {
            console.error('Error submitting product:', error);

            if (error.name === 'TypeError' && error.message.includes('fetch')) {
            setErrors({ submit: 'Network error. Please check your connection and try again.' });
            } else if (error.message.includes('413')) {
            setErrors({ submit: 'Files too large. Please reduce image sizes and try again.' });
            } else if (error.message.includes('401') || error.message.includes('403')) {
            setErrors({ submit: 'Authentication failed. Please log in and try again.' });
            } else {
            setErrors({ submit: error.message || 'Failed to save product. Please try again.' });
            }
        } finally {
            setIsLoading(false);
            setTimeout(() => setUploadProgress(0), 2000);
        }
        };
    // ────────────────────────────────────────────────────────────────────────

    return (
        <div className="form-container">
            <div className="form-header">
                <h1>
                    <i className={`fas ${isEditMode ? 'fa-edit' : 'fa-plus-circle'}`}></i>{' '}
                    {isEditMode ? 'Edit Product' : 'Add New Products'}
                </h1>
                <p>
                    {isEditMode
                        ? 'Update the details below to edit your product'
                        : 'Fill in the details below to add products to your store'}
                </p>
                {!isEditMode && (
                    <div style={{ marginTop: '1rem', fontSize: '1rem', opacity: 0.9 }}>
                        <i className="fas fa-layer-group"></i> Managing {products.length} product{products.length > 1 ? 's' : ''}
                    </div>
                )}
            </div>

            {/* Loading overlay while fetching product data in edit mode */}
            {isEditMode && isLoading && uploadProgress === 0 && (
                <div style={{ textAlign: 'center', padding: '3rem', fontSize: '1.1rem', color: '#6b7280' }}>
                    <i className="fas fa-spinner fa-spin" style={{ marginRight: '0.5rem' }}></i>
                    Loading product data...
                </div>
            )}

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
                        {isEditMode ? 'Saving...' : 'Uploading...'} {uploadProgress}%
                    </div>
                </div>
            )}

            {/* Product Tabs — only shown in create mode */}
            {!isEditMode && (
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
            )}

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
                                placeholder="Describe your product in detail (10-5000 characters)..."
                                maxLength="5000"
                                rows="10"
                            />
                            <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
                                {currentProduct.productdescription.length}/5000 characters
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
                        <p>
                            {isEditMode
                                ? 'Existing images are shown below. Add new ones or remove existing ones.'
                                : 'Upload product images (1-10 images required)'}
                        </p>
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
                                        {/* Badge for existing vs new images in edit mode */}
                                        {isEditMode && (
                                            <div style={{
                                                fontSize: '0.65rem',
                                                fontWeight: 600,
                                                padding: '2px 6px',
                                                borderRadius: '4px',
                                                marginBottom: '4px',
                                                display: 'inline-block',
                                                background: image.isExisting ? '#d1fae5' : '#dbeafe',
                                                color: image.isExisting ? '#065f46' : '#1e40af',
                                            }}>
                                                {image.isExisting ? 'Existing' : 'New'}
                                            </div>
                                        )}
                                        <div className="image-preview">
                                            <img src={image.url} alt={image.alt_text} />
                                        </div>
                                        {!image.isExisting && (
                                            <div style={{ fontSize: '0.75rem', color: '#6b7280', marginBottom: '0.5rem' }}>
                                                {(image.size / 1024 / 1024).toFixed(2)} MB
                                            </div>
                                        )}
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

                {/* Eco Details */}
                <div className="form-section">
                    <h2 className="section-title">
                        <i className="fas fa-leaf"></i> Eco Details
                    </h2>
                    <div className="form-grid">
                        <div className="form-group">
                            <label className="form-label">Eco Score (0-100)</label>
                            <input
                                type="number"
                                name="ecoScore"
                                value={currentProduct.ecoScore}
                                onChange={handleInputChange}
                                className="form-input"
                                placeholder="0"
                                min="0"
                                max="100"
                            />
                        </div>

                        <div className="form-group">
                            <label className="form-label">CO₂ Saved (kg)</label>
                            <input
                                type="number"
                                name="co2SavedKg"
                                value={currentProduct.co2SavedKg}
                                onChange={handleInputChange}
                                className="form-input"
                                placeholder="0.00"
                                min="0"
                                step="0.01"
                            />
                        </div>

                        <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', paddingTop: '1.5rem' }}>
                            <input
                                type="checkbox"
                                name="isEcoFriendly"
                                id="isEcoFriendly"
                                checked={currentProduct.isEcoFriendly}
                                onChange={handleInputChange}
                                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                            />
                            <label htmlFor="isEcoFriendly" className="form-label" style={{ margin: 0, cursor: 'pointer' }}>
                                Mark as Eco-Friendly Product
                            </label>
                        </div>
                    </div>
                </div>

                {errors.submit && (
                    <div className="error-message" style={{ marginTop: '1rem', textAlign: 'center' }}>
                        <i className="fas fa-exclamation-triangle"></i> {errors.submit}
                    </div>
                )}

                {/* Form Actions */}
                <div className={`form-actions ${isLoading ? 'loading' : ''}`}>
                    <button
                        type="button"
                        onClick={() => isEditMode ? navigate('/sellerdashboard') : window.history.back()}
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
                        <i className={`fas ${isEditMode ? 'fa-save' : 'fa-upload'}`}></i>{' '}
                        {isLoading
                            ? (isEditMode ? `Saving... ${uploadProgress}%` : `Uploading... ${uploadProgress}%`)
                            : (isEditMode ? 'Save Changes' : `Upload ${products.length} Product${products.length > 1 ? 's' : ''}`)}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ProductUploadForm;
