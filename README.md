# Raritone Full-Stack Authentication & Product Management

A React + Express + MongoDB e-commerce training project with JWT authentication, protected routes, role-based authorization, and ImageKit uploads.

## Features

### Authentication
- User registration with validation
- Duplicate-email protection
- bcrypt password hashing
- Login with JWT access token
- JWT stored in browser localStorage
- AuthContext for frontend authentication state
- Axios Bearer-token interceptor
- Protected Profile, Cart, Wishlist and Orders routes
- Logout
- Invalid/expired JWT handling

### User profile
- Fetch authenticated profile
- Update name
- Upload/update profile picture through ImageKit
- Profile image preview

### Authorization
- `user`, `admin`, and `vendor` roles in the User model
- Public registration always creates a `user`
- Admin-only product create/update/delete APIs
- Admin-only frontend product-management route
- Forbidden page for authenticated non-admin users

### Products
- Public product listing
- Product details
- Admin create product
- Admin edit product
- Admin delete product
- Product image upload through ImageKit

### Responsive UI
The existing Raritone visual design is preserved. Responsive layout rules support desktop, tablet and mobile screens without changing the color system or overall styling direction.

## Project Structure

```text
fullstack/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── assets/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env.example
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   └── db/
│   ├── .env.example
│   └── package.json
│
├── database/
└── README.md
```

## Environment Variables

Create `backend/.env`:

```env
PORT=3000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_long_random_secret
IMAGE_KIT_PRIVATE_KEY=your_imagekit_private_key
```

Create `frontend/.env` if your backend is not on the default URL:

```env
VITE_API_URL=http://localhost:3000/api
```

Never commit real `.env` files or private ImageKit/JWT credentials.

## Run the project

### Backend

```bash
cd backend
npm install
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

## Authentication Flow

```text
React Register
      ↓
POST /api/auth/register
      ↓
Express + Multer
      ↓
ImageKit (optional profile image)
      ↓
bcrypt password hash
      ↓
MongoDB User
```

```text
React Login
      ↓
POST /api/auth/login
      ↓
MongoDB user lookup
      ↓
bcrypt.compare
      ↓
JWT generated
      ↓
localStorage
      ↓
AuthContext
```

```text
Protected React Route
      ↓
Axios interceptor
      ↓
Authorization: Bearer <JWT>
      ↓
authMiddleware
      ↓
JWT verification
      ↓
Controller
```

## Required Postman Tests

1. `POST /api/auth/register` — valid registration
2. `POST /api/auth/register` — duplicate email
3. `POST /api/auth/register` — missing fields
4. `POST /api/auth/register` — invalid email
5. `POST /api/auth/login` — valid login
6. `POST /api/auth/login` — wrong password
7. `GET /api/auth/profile` — no token → `401`
8. `GET /api/auth/profile` — valid token → `200`
9. `GET /api/auth/profile` — invalid/expired token → `401`
10. Admin `POST /api/products` → allowed
11. User `POST /api/products` → `403`
12. Admin `PUT /api/products/:id` → allowed
13. User `PUT /api/products/:id` → `403`
14. Admin `DELETE /api/products/:id` → allowed
15. User `DELETE /api/products/:id` → `403`

## 5 PM Demonstration Flow

```text
Register
  → MongoDB user
  → password hashed
  → optional ImageKit profile image

Login
  → JWT
  → localStorage
  → AuthContext

Profile
  → protected route
  → Bearer JWT
  → backend verification
  → user details

Admin
  → role authorization
  → product CRUD
  → ImageKit product image

Logout
  → remove token/user
  → protected pages redirect to login
```
