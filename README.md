# 🛍️ BIGZONE — Eco-Friendly E-Commerce Platform

[![Live Demo](https://img.shields.io/badge/Live-bigzone--nu.vercel.app-blue)](https://bigzone-nu.vercel.app)
[![License: ISC](https://img.shields.io/badge/License-ISC-green.svg)](https://opensource.org/licenses/ISC)

> A full-stack **MERN e-commerce application** with an integrated **EcoZone** — a dedicated section for sustainable and eco-friendly products powered by **Google Gemini AI** for automatic eco-scoring.

---

## 🌟 Features

### 🛒 Core E-Commerce
- ✅ User registration, login, and JWT-based authentication
- ✅ Role-based access control: `user`, `seller`, `admin`
- ✅ Product listing with search, filtering, and category browsing
- ✅ Product detail pages with image gallery and reviews
- ✅ Shopping cart with quantity management
- ✅ Checkout with order placement (Cash on Delivery)
- ✅ Order tracking with status history (pending → confirmed → processing → shipped → delivered)
- ✅ Address management (add, edit, delete multiple addresses)

### 🌿 EcoZone (AI-Powered Sustainability)
- 🤖 Dedicated eco-friendly product section
- 🤖 **Google Gemini AI** (`gemini-1.5-flash`) automatically analyzes each product and generates:
  - **EcoScore** (0–100): Rates sustainability of materials and manufacturing
  - **CO₂ Saved (kg)**: Estimates carbon savings vs. conventional alternatives
  - **Justification**: One-sentence qualitative explanation
- ⚡ Results are cached via SHA-256 hashing to avoid redundant API calls

### 👤 User Features
- 📝 Profile management with photo upload
- 🎨 Seller Dashboard for managing own product listings
- 📄 Order history with PDF invoice generation (PDFKit)
- 🌱 Eco stats tracking per user (total eco score, CO₂ saved, eco orders)

### 🔐 Security
- 🔒 Password hashing with `bcryptjs`
- 🎟️ JWT token authentication (HTTP-only cookies)
- 🔑 Password reset via email token (SHA-256 hashed, 10-min expiry)
- 🛡️ Rate limiting with `express-rate-limit`
- 🪖 HTTP security headers via `helmet`
- 🌐 CORS configured for dev and production origins

---

## 🏗️ Tech Stack

### Backend
| Technology | Purpose |
|-----------|----------|
| Node.js + Express 5 | REST API server |
| MongoDB + Mongoose | Database & ODM |
| JWT + bcryptjs | Auth & password security |
| Cloudinary + Multer | Image upload & storage |
| **Google Gemini AI** | 🤖 Eco score generation |
| PDFKit | PDF invoice generation |
| Helmet, CORS, Rate-Limit | Security middleware |
| Morgan | Request logging |
| Nodemon | Dev hot-reloading |

### Frontend
| Technology | Purpose |
|-----------|----------|
| React 19 + Vite 7 | UI framework & build tool |
| React Router DOM v7 | Client-side routing |
| TanStack React Query | Server state & data fetching |
| React Hook Form + Zod | Form validation |
| Lucide React | Icon library |
| React Hot Toast | Notifications |
| Context API | Auth & Cart global state |

---

## 📁 Project Structure

```
BIGZONE/
├── backend/
│   ├── config/
│   │   └── db.js                  # MongoDB connection
│   ├── controllers/               # Route handler logic
│   │   ├── user.controller.js
│   │   ├── product.controller.js
│   │   ├── orders.controller.js
│   │   ├── cart.controller.js
│   │   └── address.controller.js
│   ├── middlewares/
│   │   ├── isAuthenticated.js     # JWT auth guard
│   │   ├── isAdmin.js             # Admin role guard
│   │   ├── multer.js              # File upload handler
│   │   ├── rateLimiter.js         # API rate limiting
│   │   └── validation.js          # Request validation
│   ├── models/
│   │   ├── user.model.js          # User schema (auth, eco stats)
│   │   ├── product.model.js       # Product schema (eco fields)
│   │   ├── orders.model.js        # Order schema (status history)
│   │   ├── cart.model.js          # Cart schema
│   │   ├── Address.js             # Address schema
│   │   └── dashboard.model.js     # Dashboard/analytics schema
│   ├── routes/
│   │   ├── user.route.js
│   │   ├── product.route.js
│   │   ├── orders.route.js
│   │   ├── cart.route.js
│   │   ├── address.route.js
│   │   └── upload.route.js
│   ├── services/
│   │   └── geminiService.js       # 🤖 AI eco score service
│   ├── package.json
│   └── server.js                  # App entry point
├── frontend1/
│   ├── public/
│   └── src/
│       ├── assets/
│       ├── components/            # Reusable UI components
│       ├── context/
│       │   ├── AuthContext.jsx    # Auth state
│       │   └── CartContext.jsx    # Cart state
│       ├── hooks/                 # Custom React hooks
│       ├── pages/
│       │   ├── HomePage.jsx
│       │   ├── ecozone/           # EcoZone pages
│       │   ├── orders/            # Order & cart pages
│       │   ├── user/              # Auth pages
│       │   ├── SellerDashboard.jsx
│       │   ├── SearchResults.jsx
│       │   └── form.jsx           # Product upload form
│       ├── services/              # API call functions
│       ├── styles/
│       ├── utils/
│       ├── App.jsx                # Routes & providers
│       └── index.css
└── .gitignore
```

---

## 🔌 API Endpoints

All routes are prefixed with `/api/v1`

### Users — `/api/v1/users`
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/register` | Register new user | Public |
| POST | `/login` | Login user | Public |
| POST | `/logout` | Logout user | Protected |
| GET | `/profile` | Get current user profile | Protected |
| PUT | `/update-profile` | Update profile info | Protected |
| PUT | `/update-photo` | Update profile photo | Protected |
| POST | `/forgot-password` | Send password reset email | Public |
| POST | `/reset-password/:token` | Reset password | Public |
| PUT | `/change-password` | Change current password | Protected |
| GET | `/all` | Get all users | Admin |
| DELETE | `/delete-account` | Delete own account | Protected |

### Products — `/api/v1/products`
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | Get all products (with filters) | Public |
| GET | `/:id` | Get product by ID | Public |
| POST | `/` | Create product (auto eco-score) | Seller/Admin |
| PUT | `/:id` | Update product | Seller/Admin |
| DELETE | `/:id` | Delete product | Seller/Admin |
| POST | `/:id/review` | Add product review | Protected |

### Orders — `/api/v1/orders`
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/` | Place new order | Protected |
| GET | `/my-orders` | Get user's orders | Protected |
| GET | `/:id` | Get order by ID | Protected |
| PUT | `/:id/status` | Update order status | Admin |
| GET | `/:id/invoice` | Download PDF invoice | Protected |

### Cart — `/api/v1/cart`
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | Get user cart | Protected |
| POST | `/add` | Add item to cart | Protected |
| PUT | `/update` | Update item quantity | Protected |
| DELETE | `/remove/:productId` | Remove item | Protected |
| DELETE | `/clear` | Clear entire cart | Protected |

### Addresses — `/api/v1/addresses`
| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | `/` | Get all addresses | Protected |
| POST | `/` | Add new address | Protected |
| PUT | `/:id` | Update address | Protected |
| DELETE | `/:id` | Delete address | Protected |

---

## ⚙️ Environment Variables

Create a `.env` file in the **backend/** directory:

```env
# Server
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=your_mongodb_connection_string

# Authentication
JWT_SECRET=your_jwt_secret_key

# Cloudinary (Image Uploads)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Google Gemini AI (EcoZone)
GEMINI_API_KEY=your_gemini_api_key

# Email (Password Reset - Optional)
EMAIL_USER=your_email@example.com
EMAIL_PASS=your_email_password
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** v18+ and **npm**
- **MongoDB** (local or MongoDB Atlas)
- **Cloudinary** account ([Sign up here](https://cloudinary.com/))
- **Google Gemini API** key ([Get one here](https://aistudio.google.com/app/apikey))

### 1. Clone the Repository
```bash
git clone https://github.com/madhavmuktesh/BIGZONE.git
cd BIGZONE
```

### 2. Install Backend Dependencies
```bash
cd backend
npm install
```

### 3. Install Frontend Dependencies
```bash
cd ../frontend1
npm install
```

### 4. Configure Environment Variables
Create a `.env` file in the `backend/` directory and fill in all the required values (see above section).

### 5. Run the Development Servers

**Backend** (from `backend/` directory):
```bash
npm run dev
# Server runs on http://localhost:5000/api/v1
```

**Frontend** (from `frontend1/` directory):
```bash
npm run dev
# App runs on http://localhost:5173
```

### 6. Access the Application
Open your browser and navigate to:
- **Frontend**: `http://localhost:5173`
- **Backend API**: `http://localhost:5000/api/v1/health`

---

## 📊 Data Models

### User Model
- **Identity**: `fullname`, `email`, `phoneNumber`
- **Auth**: `password` (bcrypt hashed), `role` (user/seller/admin), `isVerified`
- **Profile**: `profilePhoto` (Cloudinary URL), bio, addresses array
- **Eco Stats**: `totalEcoScore`, `totalCo2SavedKg`, `ecoOrderCount`
- **Methods**: `comparePassword()`, `generateAuthToken()`, `createPasswordResetToken()`

### Product Model
- **Info**: `productname`, `slug`, `sku` (auto-generated), `productprice`, `originalPrice`, `productdescription`
- **Media**: `images[]` (url + public_id from Cloudinary)
- **Specs**: brand, model, color, weight, dimensions, warranty
- **Reviews**: `productreviews[]`, `reviewStats` (averageRating, totalReviews)
- **Category**: Smartphones, Electronics, Clothing, Home & Kitchen, Books, Toys, Sports, Beauty, etc.
- **Inventory**: `stock.quantity`
- **🌱 Eco Fields**: `ecoScore`, `co2SavedKg`, `ecoAnalysisJustification` (auto-generated by Gemini AI)
- **Virtuals**: `isInStock`, `discountPercentage`

### Order Model
- **Status Lifecycle**: `pending` → `confirmed` → `processing` → `shipped` → `delivered` / `cancelled`
- **Payment**: method (`COD`), status (`pending/completed/failed/refunded`)
- **Items**: Product references with quantity, price, and eco data
- **Tracking**: Full status history with timestamps for audit trail

---

## 🌱 EcoZone — How It Works

1. 📦 A seller uploads a product with name, description, category, and tags.
2. 🤖 The backend calls **Google Gemini AI** with a sustainability analysis prompt.
3. 📊 Gemini returns a JSON response with:
   - `ecoScore` (0-100)
   - `co2SavedKg` (kilograms)
   - `justification` (one-sentence explanation)
4. ⚡ Results are **cached** using a SHA-256 hash of product details to prevent redundant API calls.
5. 🌍 Products with eco scores are displayed in the **EcoZone** section of the storefront.
6. 💰 Users accumulate eco stats with every eco-friendly purchase.

---

## 👥 User Roles

| Role | Capabilities |
|------|-------------|
| **user** | Browse products, add to cart, purchase, review products, manage profile & orders |
| **seller** | All user capabilities + upload/edit/delete own products, access seller dashboard |
| **admin** | All seller capabilities + manage all users, update order statuses, full system access |

---

## 🛠️ Development Scripts

### Backend
```bash
npm run dev      # Start with nodemon (hot-reload)
npm start        # Start production server
```

### Frontend
```bash
npm run dev      # Start Vite dev server
npm run build    # Build for production
npm run preview  # Preview production build
```

---

## 🚀 Deployment

### Backend (Node.js)
Deploy to platforms like:
- **Render** / **Railway** / **Fly.io** / **Heroku**
- Set environment variables in platform dashboard
- Connect MongoDB Atlas for production database

### Frontend (React)
Deploy to:
- **Vercel** (recommended for React + Vite)
- **Netlify**
- **Cloudflare Pages**

**Current Deployment**: [https://bigzone-nu.vercel.app](https://bigzone-nu.vercel.app)

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a Pull Request

---

## 📝 License

This project is licensed under the **ISC License**.

---

## 👨‍💻 Author

**Madhav Muktesh**  
🔗 [GitHub](https://github.com/madhavmuktesh)  
🌐 [Live Demo](https://bigzone-nu.vercel.app)

---

## 💖 Acknowledgments

- **Google Gemini AI** for powering the EcoZone sustainability feature
- **Cloudinary** for seamless image management
- **MongoDB Atlas** for cloud database hosting
- **Vercel** for frontend deployment

---

<div align="center">
  <strong>Built with ❤️ using the MERN stack and powered by Google Gemini AI</strong>
</div>
