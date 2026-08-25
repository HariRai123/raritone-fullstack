# Raritone — MERN + VTON Try-On

This package keeps the Raritone MERN frontend/backend and uses the AI/ML team's VTON FastAPI backend as a separate `ai-service`. The AI team's frontend has been removed.

## Architecture

React → Express → MongoDB + ImageKit → VTON FastAPI → ImageKit → MongoDB → React

The Express API creates a `TryOnSession` immediately and returns the session id. VTON processing runs in the background, so the browser does not wait for inference. The React result page polls the session endpoint until `completed` or `failed`.

## Run the MERN backend

```bash
cd backend
npm install
copy .env.example .env
npm run dev
```

Set MongoDB, JWT and ImageKit values in `.env` and set `AI_SERVICE_URL=http://127.0.0.1:8000` for local development.

## Run the AI VTON service

```bash
cd ai-service/backend
uv sync
uv run uvicorn src.main:app --host 0.0.0.0 --port 8000
```

The VTON model weights are not included in the AI team's ZIP. Put the supplied weights under `ai-service/backend/models` or set `FASHN_WEIGHTS_DIR` to their location.

## Run the frontend

```bash
cd frontend
npm install
npm run dev
```

## Try-On endpoints

- `POST /api/tryon` — validates the upload, creates a session, and returns immediately.
- `GET /api/tryon/session/:id` — authenticated polling endpoint.
- `POST /api/tryon/session/:id/retry` — retries a failed session.
- `GET /api/tryon/history` — returns only the logged-in user's sessions.

The client sends only `productId`. Product image, category and price are read from MongoDB by Express, so the client cannot control the garment price used by the server.

## AI contract

Express calls `POST /try-on` with multipart fields `person_image`, `garment_image`, and `category` (`tops`, `bottoms`, or `one-pieces`). The AI service returns a PNG. Express uploads that result to ImageKit and stores the URL in `TryOnSession.resultImageReference`.
