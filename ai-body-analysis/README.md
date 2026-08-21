# AI Body Analysis API

An AI-powered body analysis API that detects human pose landmarks from an image and calculates relative body proportions using MediaPipe, OpenCV, and FastAPI.

## 🚀 Features

- Image upload
- Human pose detection
- 33 MediaPipe pose landmarks
- Landmark coordinate extraction
- Body proportion calculation
- FastAPI REST API
- JSON responses
- Image validation
- File-size validation
- Image-dimension validation
- Error handling
- Swagger/OpenAPI documentation
- Postman API collection

## 🔄 AI Pipeline

```text
User Image
    ↓
OpenCV
    ↓
MediaPipe Pose Detection
    ↓
33 Pose Landmarks
    ↓
Body Proportion Calculation
    ↓
FastAPI
    ↓
JSON Response

**Technologies Used**
Python
FastAPI
Uvicorn
OpenCV
MediaPipe
NumPy
Python Multipart
**Project Structure**
AI-Body-Analysis/
│
├── Postman/
│   └── AI Body Analysis API.postman_collection.json
│
├── src/
│   ├── init.py
│   ├── main.py
│   ├── pose_detector.py
│   └── measurements.py
│
├── test_images/
│   ├── 01_valid_person.jpg
│   ├── 02_no_person.jpg
│   ├── 03_multiple_people.png
│   ├── 04_large_person.jpg
│   ├── 05_invalid.txt
│   └── person.jpg
│
├── API_DOCUMENTATION.md
├── README.md
├── requirements.txt
├── pose_landmarker.task
├── test_api_response.py
├── test_measurements.py
└── test_pose.py
**Installation**
1. Clone the repository
git clone https://github.com/Yashaswini719/ai-body-analysis.git
cd ai-body-analysis
2. Create virtual environment
python -m venv venv
Windows
venv\Scripts\activate
3. Install dependencies
pip install -r requirements.txt
Run the API

Start the FastAPI server:

uvicorn src.main:app --reload

The API will be available at:

http://127.0.0.1:8000
Swagger Documentation

Interactive API documentation:

http://127.0.0.1:8000/docs

OpenAPI specification:

http://127.0.0.1:8000/openapi.json