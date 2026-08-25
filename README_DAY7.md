# Raritone — Day 7 Production-Ready Full-Stack Build

This package contains the Raritone frontend, Express/MongoDB backend, and AI body-analysis service integration used by the current application.

## Main improvements

- Shared product catalog cache prevents Products and Try-On from independently downloading the same product list.
- Product API returns only catalog fields needed by the UI and uses `lean()` plus a short cache policy.
- Try-On session lifecycle is now `pending -> processing -> completed` or `failed`.
- `GET /api/tryon/session/:id` returns the real backend session state.
- `POST /api/tryon/session/:id/retry` retries failed sessions.
- Try-On Result polls while the backend reports `pending` or `processing`.
- AI timeout/unavailable errors become a visible failed state with retry.
- Try-On image upload validates JPG/JPEG/PNG and 10 MB maximum on both frontend and backend.
- Product existence and authenticated session ownership are checked on the backend.
- Result page includes Before/After, status, body proportions, processing details, Try Another, Saved Automatically, Add to Cart, View Product, View History and Share.
- Existing Profile, Cart, Wishlist, Orders, Navbar, Footer and admin pages remain included and responsive.
- Razorpay is intentionally not included because payment integration was deferred.

## API flow

`React -> Express -> MongoDB`

Try-On:

`React POST /api/tryon -> store image -> create pending session -> background AI processing -> MongoDB -> React GET /api/tryon/session/:id`

AI credentials remain on the backend.

## Run

### Backend

1. Copy `backend/.env.example` to `backend/.env`.
2. Add MongoDB, ImageKit, JWT and AI service values.
3. Run `npm install` inside `backend`.
4. Run `npm run dev`.

### Frontend

1. Copy `frontend/.env.example` to `frontend/.env`.
2. Run `npm install` inside `frontend`.
3. Run `npm run dev`.

Do not commit `.env` files or private credentials.

## Validation performed before packaging

- All backend JavaScript files pass `node --check` syntax validation.
- The modified Try-On/Product frontend files pass ESLint.
- The uploaded project already contains the full existing UI page/component set.

The package intentionally excludes `node_modules`, Git history and secret `.env` files. Run `npm install` in each application folder after extraction.
