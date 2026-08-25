# Raritone Try-On — MERN Integration (VTON deferred)

This package contains the MERN-side production flow. The VTON model/inference implementation is intentionally left for the AI/ML integration step. The Express layer is already structured to call the FastAPI VTON service through `AI_SERVICE_URL`.

## Architecture

React → Express → FastAPI VTON → Express → MongoDB → React

The React app creates a TryOnSession and immediately navigates to the result page. The result page polls the session while the backend moves it through `pending → processing → completed/failed`.

## 1. Backend

```powershell
cd backend
npm install
```

Create `backend/.env` from `.env.example` and provide your existing MongoDB, JWT, ImageKit/storage and AI-service values. Keep secrets out of Git.

Start backend:

```powershell
npm run dev
```

The try-on endpoints are:

- `POST /api/tryon/session` — create a session
- `GET /api/tryon/session/:id` — get session status/result
- `POST /api/tryon/session/:id/retry` — retry failed session
- `GET /api/tryon/history` — authenticated user's history

`POST /api/tryon` is retained as a backwards-compatible alias.

## 2. Frontend

Open another terminal:

```powershell
cd frontend
npm install
npm run dev
```

Open the Vite URL shown in the terminal, normally `http://localhost:5173`.

## 3. AI/VTON service

The VTON implementation is intentionally not changed in this package. Configure the backend `AI_SERVICE_URL` to the FastAPI service when the AI/ML team provides a runnable VTON endpoint.

Expected FastAPI contract:

`POST /try-on` multipart form:
- `person_image`
- `garment_image`
- `category` (`tops`, `bottoms`, `one-pieces`)

The service returns the generated PNG image.

## 4. End-to-end test

1. Start MongoDB.
2. Start Express backend.
3. Start the FastAPI VTON service (when available).
4. Start React.
5. Login.
6. Open Products and choose Try On.
7. Upload a JPG/PNG person image (max 10 MB).
8. Select a product.
9. Click Try On.
10. Confirm the session page shows `pending`/`processing` rather than freezing the browser.
11. Wait for `completed` or `failed`.
12. On success, verify Before/After, product details, Add to Cart and History.
13. On failure, use Retry Try-On.

## Security checks

- JWT middleware protects try-on routes.
- Session queries are scoped to the authenticated user.
- Product data is loaded from MongoDB on the backend; frontend price is not trusted.
- AI credentials stay on the backend.
- Uploads accept JPG/JPEG/PNG only and are limited to 10 MB.
- Do not commit `.env`.
