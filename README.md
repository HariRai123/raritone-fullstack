# Raritone — MERN E-Commerce with AI Try-On

Raritone is a full-stack e-commerce application built using the MERN stack and integrated with an AI/ML service for body and pose analysis.

The application allows authenticated users to browse products, log in securely, and use the **Try-On Studio** to upload a full-body image and receive AI-based body and pose analysis results.

---

## 🚀 Project Overview

### Main Technology Stack

**Frontend**

* React
* Vite
* React Router
* Axios
* CSS

**Backend**

* Node.js
* Express.js
* MongoDB
* Mongoose
* JWT Authentication
* Multer
* Axios

**AI/ML Service**

* Python
* FastAPI
* AI/ML pose and body analysis service

---

## 🏗️ Architecture

```text
React Frontend
      ↓
Express Backend
      ↓
FastAPI AI Service
      ↓
Pose + Body Analysis
      ↓
Express Backend
      ↓
MongoDB
      ↓
React Result
```

The React application does not communicate directly with the private AI service.

The Express backend acts as the integration layer between the frontend and FastAPI.

---

## 📁 Project Structure

```text
raritone/
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   │   └── TryOn.jsx
│   │   ├── services/
│   │   ├── hooks/
│   │   ├── assets/
│   │   └── App.jsx
│   │
│   └── package.json
│
├── backend/
│   ├── controllers/
│   ├── routes/
│   ├── middleware/
│   ├── models/
│   ├── services/
│   │   └── aiService.js
│   ├── server.js
│   └── package.json
│
├── ai-service/
│   ├── ...
│   └── requirements.txt
│
└── README.md
```

---

# 🔐 Authentication

Raritone uses JWT-based authentication.

The authentication flow is:

```text
User Login
    ↓
Express Backend
    ↓
JWT Token
    ↓
Frontend
    ↓
Authenticated Requests
```

The authenticated user's token is stored on the frontend and sent with protected API requests.

Protected routes ensure that only authenticated users can access private functionality such as Try-On analysis history.

---

# 🛍️ Product Management

Products are stored in MongoDB and retrieved through the Express API.

The frontend does not depend on hardcoded product data.

### Product APIs

```text
GET /api/products
GET /api/products/:id
POST /api/products
```

Product information includes fields such as:

* Product ID
* Name
* Category
* Price
* Description
* Brand
* Stock
* Image

Product images are uploaded through the backend and stored using the configured image-storage service.

---

# 👗 Try-On Studio

The Try-On Studio is available at:

```text
/try-on
```

The page allows an authenticated user to:

* Upload a full-body image
* Use the camera option
* Preview the selected image
* Remove the image
* Analyze the image
* View a loading state
* View errors
* View AI analysis results
* Retry failed analysis

### User Flow

```text
Login
  ↓
Try-On Studio
  ↓
Upload Full-Body Photo
  ↓
Preview
  ↓
Analyze
  ↓
Processing...
  ↓
Express Backend
  ↓
FastAPI AI Service
  ↓
Pose + Body Analysis
  ↓
Save Analysis
  ↓
Display Result
```

---

# 🤖 AI/ML Integration

The MERN backend integrates with the AI/ML team's FastAPI service.

The frontend does **not** call FastAPI directly.

Instead:

```text
React
  ↓
POST /api/tryon/analyze
  ↓
Express
  ↓
FastAPI
  ↓
AI Analysis
  ↓
Express
  ↓
React
```

The FastAPI URL and related configuration are kept in environment variables.

---

## Try-On Analyze API

### Endpoint

```http
POST /api/tryon/analyze
```

### Authentication

This endpoint requires an authenticated user.

### Request

The request uses `multipart/form-data`.

```text
image = full-body image
```

Supported image formats should be validated before sending the image to the AI service.

---

## Backend AI Integration

The Express backend performs the following operations:

1. Receives the uploaded image.
2. Validates that a file exists.
3. Validates the image type.
4. Validates the image size.
5. Sends the image to FastAPI.
6. Receives the AI response.
7. Validates the AI response.
8. Saves the analysis in MongoDB.
9. Returns the result to React.

The AI-service communication is handled through:

```text
backend/services/aiService.js
```

---

# 📊 AI Analysis Result

The Try-On Studio displays information returned from the AI service.

Example result structure:

```text
Person Detected ✓

Pose Analysis ✓

Body Proportions
-------------------------
Shoulder Ratio
Hip Ratio
Arm Ratio
Leg Ratio
Torso Ratio

Processing Time
Model Version
```

If no person is detected:

```text
No person detected.
Please upload a clear full-body image.
```

---

# 🗄️ MongoDB Integration

AI analysis results are stored in MongoDB.

The collection/model is:

```text
bodyAnalyses
```

### Stored Information

```text
userId
imageReference
poseResult
measurements
modelVersion
processingTime
createdAt
```

Each analysis is associated with the authenticated user.

---

# 📚 Try-On History

Users can retrieve their previous body-analysis results.

### Get Analysis History

```http
GET /api/tryon/history
```

Returns analysis history belonging to the authenticated user.

### Get Specific Analysis

```http
GET /api/tryon/history/:id
```

Returns a specific analysis belonging to the authenticated user.

Users cannot access another user's analysis history.

---

# 🔒 Protected Try-On Flow

The Try-On APIs use authentication middleware.

```text
JWT Token
    ↓
Authentication Middleware
    ↓
Verify User
    ↓
Controller
    ↓
AI Service / MongoDB
```

The authenticated user's ID is used when storing and retrieving analysis records.

---

# ⚠️ Error Handling

The application handles errors at multiple levels.

### Frontend Errors

The UI handles:

* No image selected
* Unsupported image format
* Oversized image
* Invalid/corrupted image
* AI service errors
* Network errors
* Authentication errors
* Request timeout

Users are provided with an appropriate error message and retry option.

### Backend Errors

The Express backend validates:

* Authentication
* File existence
* File type
* File size
* FastAPI availability
* FastAPI response
* Database operations

---

# ⏳ Loading State

During AI processing, the Try-On Studio displays a loading state.

```text
Uploading image...
       ↓
Processing...
       ↓
AI Analysis
       ↓
Result
```

The Analyze button is prevented from triggering unnecessary duplicate requests while processing.

---

# 🔁 Retry

If AI analysis fails, the user can retry the request without having to restart the entire Try-On flow.

```text
Analysis Failed
      ↓
Retry
      ↓
Express
      ↓
FastAPI
      ↓
Result
```

---

# ⏱️ API Timeout

The backend uses timeout handling when communicating with the FastAPI service.

If the AI service does not respond within the configured timeout, the backend returns an appropriate error instead of leaving the request hanging indefinitely.

---

# 🧪 Testing

The Try-On workflow should be tested with the following cases.

## Valid Tests

```text
✓ JPG image
✓ PNG image
✓ Full-body image
✓ Different image sizes
```

## Invalid Tests

```text
✓ No file
✓ Unsupported format
✓ Oversized file
✓ Corrupted image
✓ Unauthenticated request
✓ AI service unavailable
✓ AI service returns an error
```

---

# 🔄 End-to-End Verification

The complete request flow is:

```text
React Try-On Studio
        ↓
Express POST /api/tryon/analyze
        ↓
Authentication Middleware
        ↓
Image Validation
        ↓
FastAPI AI Service
        ↓
Pose + Body Analysis
        ↓
FastAPI Response
        ↓
Express Response Validation
        ↓
MongoDB bodyAnalyses
        ↓
React
        ↓
AI Results
```

---

# 📮 Postman Testing

The backend APIs can be tested using Postman.

Important endpoints:

```text
GET  /api/products
GET  /api/products/:id

POST /api/auth/register
POST /api/auth/login
GET  /api/auth/profile

POST /api/tryon/analyze
GET  /api/tryon/history
GET  /api/tryon/history/:id
```

For the Try-On analyze endpoint, use:

```text
Body → form-data

Key: image
Type: File
Value: <full-body-image>
```

Include the JWT authentication token for protected endpoints.

---

# 🔑 Environment Variables

Sensitive configuration should be stored in environment variables.

Example backend `.env`:

```env
PORT=3000

MONGO_URI=your_mongodb_connection_string

JWT_SECRET=your_jwt_secret

AI_SERVICE_URL=http://localhost:8000
AI_SERVICE_TIMEOUT=30000
```

Do not commit `.env` files to GitHub.

Add them to `.gitignore`:

```text
.env
node_modules/
```

---

# ▶️ Running the Project

## 1. Clone the Repository

```bash
git clone <your-github-repository-url>
cd raritone
```

---

## 2. Start Backend

```bash
cd backend
npm install
npm run dev
```

Backend:

```text
http://localhost:3000
```

---

## 3. Start Frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend will run on the Vite development URL shown in the terminal.

---

## 4. Start AI Service

Navigate to the AI service:

```bash
cd ai-service
```

Create and activate the Python virtual environment:

### Windows

```bash
python -m venv venv
venv\Scripts\activate
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Start FastAPI:

```bash
uvicorn main:app --reload
```

The AI service will run on the configured FastAPI port.

---

# 🛡️ Security Considerations

The project follows these security practices:

* JWT authentication
* Protected backend routes
* User-specific analysis history
* Environment variables for secrets
* AI service URL stored in environment variables
* Backend-to-AI communication
* File validation
* File-size validation
* API timeout handling
* Error handling

The FastAPI service should not be exposed directly to the React frontend when it is intended to remain private.

---

# 🎯 Today's Integration Deliverables

The following functionality is included in the Try-On integration:

* [x] Try-On Studio UI
* [x] Image upload
* [x] Image preview
* [x] Image removal
* [x] Camera option
* [x] Image validation
* [x] Loading state
* [x] Error state
* [x] Express Try-On API
* [x] FastAPI integration
* [x] AI response handling
* [x] Body analysis result display
* [x] MongoDB analysis storage
* [x] Analysis history APIs
* [x] JWT authentication
* [x] Protected history access
* [x] Retry handling
* [x] API timeout handling
* [x] Postman testing
* [x] README documentation

---

# 📈 Final Success Flow

The complete Raritone Try-On workflow is:

```text
                 ┌───────────────┐
                 │     Login     │
                 └───────┬───────┘
                         ↓
                 ┌───────────────┐
                 │  Try-On Page  │
                 └───────┬───────┘
                         ↓
                 ┌───────────────┐
                 │ Upload Image  │
                 └───────┬───────┘
                         ↓
                 ┌───────────────┐
                 │    React      │
                 └───────┬───────┘
                         ↓
                 ┌───────────────┐
                 │    Express    │
                 └───────┬───────┘
                         ↓
                 ┌───────────────┐
                 │    FastAPI    │
                 └───────┬───────┘
                         ↓
                 ┌───────────────┐
                 │  AI Analysis  │
                 └───────┬───────┘
                         ↓
                 ┌───────────────┐
                 │    Express    │
                 └───────┬───────┘
                         ↓
                 ┌───────────────┐
                 │    MongoDB    │
                 └───────┬───────┘
                         ↓
                 ┌───────────────┐
                 │ React Results │
                 └───────────────┘
```

---

# 👨‍💻 Development

This project is developed as part of the Raritone Full Stack training project.

The MERN team is responsible for:

* React frontend
* Express backend
* MongoDB integration
* Authentication
* API integration
* Error handling
* Testing
* Documentation

The AI/ML team is responsible for:

* FastAPI service
* Pose analysis
* Body analysis
* AI/ML model implementation
* AI response generation



## Today's Try-On Integration

The Full Stack try-on workflow is integrated with the AI/ML team's FastAPI service.

```text
React
  ↓
Express /api/tryon
  ↓
AI/ML FastAPI
  ↓
MediaPipe Pose + body measurements
  ↓
Express
  ↓
MongoDB tryOnSessions
  ↓
React result
```

The current AI/ML package exposes `/api/ai/pose` and `/api/ai/measurements`.
It does not currently expose a garment segmentation or photorealistic clothing-swap endpoint. The application therefore does not fabricate a try-on image. Until that model is available, the result page clearly reports the processed pose/body-analysis state.

### Services

AI service:

```bash
cd ai-body-analysis
python -m venv venv
.\venv\Scripts\activate
pip install -r requirements.txt
uvicorn src.main:app --reload --port 8000
```

Backend:

```bash
cd backend
npm install
npm run dev
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

### Backend environment

```env
PORT=3000
MONGODB_URI=...
JWT_SECRET=...
IMAGE_KIT_PRIVATE_KEY=...
AI_SERVICE_URL=http://127.0.0.1:8000
AI_MEASUREMENTS_ENDPOINT=/api/ai/measurements
```

### Try-On APIs

```text
POST /api/tryon
GET  /api/tryon/history
GET  /api/tryon/history/:id
POST /api/tryon/analyze
```

`POST /api/tryon` expects multipart form data:

```text
image      File
productId  MongoDB Product _id
```

The authenticated user's ID is taken from the JWT; the client cannot choose another user's `userId`.

### AI/ML integration note

The supplied AI/ML service documents MediaPipe pose detection and relative body-proportion calculations. The Full Stack proxy uses its `/api/ai/measurements` endpoint. A future segmentation/VTON endpoint can be connected behind the same Express boundary without exposing the AI service directly to React.
