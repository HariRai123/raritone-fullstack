AI Body Analysis API

1. Overview

The AI Body Analysis API accepts a user image, detects human pose
landmarks using MediaPipe, and calculates relative body proportions.

Processing pipeline

Image
  ↓
OpenCV image decoding
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

Important: The measurements returned by this API are relative
proportions/ratios. They are not guaranteed physical measurements in
centimetres. Accurate physical measurements require calibration, a
known reference, suitable camera setup, and additional validation.

2. Base URL

For local development:

http://127.0.0.1:8000

The API is served using Uvicorn.

Example:

http://127.0.0.1:8000/docs

The /docs page provides the interactive Swagger/OpenAPI documentation.

3. Authentication

Authentication is not required for the current local version of the API.

4. API Endpoints

Method                  Endpoint                 Purpose

GET                     /health                Check API/model health

POST                    /api/ai/pose           Detect pose and return
landmarks

5. Health Check

GET /health

Checks whether the API is running and the pose model has been loaded.

Request

GET /health

No parameters are required.

Successful Response

Status: 200 OK

{
  "status": "healthy",
  "model": "pose-v1"
}

Response fields

Field      Type     Description

status   string   API health status
model    string   Pose model identifier

6. Pose Detection

POST /api/ai/pose

Accepts an image and performs pose detection.

Request

The image must be uploaded as multipart/form-data.

Form field

Field    Type   Required

file   File   Yes

Example:

POST http://127.0.0.1:8000/api/ai/pose

Request body:

Content-Type: multipart/form-data

file = <image file>

Successful Response

Status: 200 OK

{
  "person_detected": true,
  "landmarks": {
    "0": {
      "x": 0.536211,
      "y": 0.166313,
      "z": -0.423176,
      "visibility": 0.999938
    }
  },
  "measurements": {},
  "processing_time": 0.1100
}

The actual response contains the detected pose landmarks.

Landmark fields

Each landmark contains:

Field          Description

x            Normalized horizontal coordinate
y            Normalized vertical coordinate
z            Relative depth coordinate
visibility   Landmark visibility/confidence value

The pose model returns 33 landmarks for a detected pose.

7. Body Measurements

POST /api/ai/measurements

Accepts an image, detects the pose, extracts landmarks, and calculates
relative body proportions.

Request

The image must be uploaded as multipart/form-data.

Form field

Field    Type   Required

file   File   Yes

Example:

POST http://127.0.0.1:8000/api/ai/measurements

Successful Response

Status: 200 OK

Example:

{
  "person_detected": true,
  "landmarks": {
    "0": {
      "x": 0.536211,
      "y": 0.166313,
      "z": -0.423176,
      "visibility": 0.999938
    }
  },
  "measurements": {
    "shoulder_width_ratio": 0.173487,
    "hip_width_ratio": 0.096350,
    "left_arm_ratio": 0.238788,
    "right_arm_ratio": 0.244691,
    "left_leg_ratio": 0.350932,
    "right_leg_ratio": 0.349535,
    "torso_ratio": 0.271976,
    "shoulder_to_hip_ratio": 1.800594
  },
  "processing_time": 0.1617
}

Measurement fields

Field                               Description

shoulder_width_ratio              Relative distance between shoulder
landmarks

hip_width_ratio                   Relative distance between hip
landmarks

left_arm_ratio                    Relative left arm length

right_arm_ratio                   Relative right arm length

left_leg_ratio                    Relative left leg length

right_leg_ratio                   Relative right leg length

torso_ratio                       Relative torso length

These values represent relative body proportions. They must not be
presented as guaranteed centimetre measurements without calibration.

8. No Person Detected

If an image is valid but no person is detected, the API returns a
successful response with person_detected set to false.

Example:

{
  "person_detected": false,
  "landmarks": {},
  "measurements": {},
  "processing_time": 0.049
}

Status: 200 OK

This is different from an invalid image. The image itself is valid, but
the pose detector did not find a person.

9. Error Handling

The API uses HTTP status codes to indicate request and processing
problems.

400 Bad Request

Used for invalid or unusable image input and image-limit violations.

Invalid image

{
  "detail": "Invalid image"
}

Empty image

{
  "detail": "Empty image file"
}

File too large

The current maximum file size is 10 MB.

{
  "detail": "Image file is too large. Maximum allowed size is 10 MB."
}

Image dimensions too large

The current maximum dimensions are 4000 × 4000 pixels.

{
  "detail": "Image dimensions are too large. Maximum allowed dimensions are 4000x4000 pixels."
}

404 Not Found

Returned when the requested endpoint does not exist.

Example:

{
  "detail": "Not Found"
}

422 Unprocessable Entity

FastAPI returns 422 when required request data is missing or fails
request validation.

For example, if the file field is not provided:

{
  "detail": [
    {
      "type": "missing",
      "loc": [
        "body",
        "file"
      ],
      "msg": "Field required"
    }
  ]
}

500 Internal Server Error

Unexpected processing errors are handled and returned as 500.

Example:

{
  "detail": "Processing failed: <error message>"
}

10. Image Validation Limits

The API currently validates:

Empty uploads

File size

Image decoding

Image dimensions

Current limits:

Maximum file size: 10 MB
Maximum width:     4000 px
Maximum height:    4000 px

For example, an 8000 × 8000 image can be rejected even when its
compressed file size is below 10 MB.

11. Multiple People

The current pose detector is configured for the current body-analysis
workflow and processes a single detected pose.

For an image containing multiple people, the API may return the pose of
one detected person rather than separate measurements for every person.

Multi-person analysis is not currently exposed as a separate response
structure.

12. Processing Time

Every successful pose/measurement response includes:

"processing_time": 0.1617

This value represents the approximate processing time for the API
request in seconds.

The exact value varies depending on the image and system performance.

13. Testing

The API was tested using Swagger/OpenAPI and Postman.

Test cases

Test case              Expected result              Status

Valid person image     Pose/measurements returned   PASS
No image               Validation error             PASS
Invalid image          400 Invalid image          PASS
Image with no person   person_detected: false     PASS
Multiple people        One pose processed           PASS / limitation documented
Very large image       Dimension validation         PASS
Invalid endpoint       404 Not Found              PASS

14. Postman

The project includes a Postman collection containing:

GET  /health
POST /api/ai/pose
POST /api/ai/measurements

For the POST requests, use:

Body → form-data
Key  → file
Type → File

Example local endpoint:

http://127.0.0.1:8000/api/ai/pose

15. Running the API

Activate the virtual environment and start the FastAPI server:

uvicorn src.main:app --reload

The API will be available at:

http://127.0.0.1:8000

Swagger documentation:

http://127.0.0.1:8000/docs

OpenAPI specification:

http://127.0.0.1:8000/openapi.json

16. Example End-to-End Flow

User uploads image
       ↓
POST /api/ai/measurements
       ↓
FastAPI receives multipart/form-data
       ↓
File size validation
       ↓
OpenCV decodes image
       ↓
Image dimension validation
       ↓
MediaPipe Pose Detection
       ↓
33 pose landmarks
       ↓
Relative measurement calculation
       ↓
JSON response

Example final response structure:

{
  "person_detected": true,
  "landmarks": {},
  "measurements": {
    "shoulder_width_ratio": 0.173487,
    "hip_width_ratio": 0.096350,
    "left_arm_ratio": 0.238788,
    "right_arm_ratio": 0.244691,
    "left_leg_ratio": 0.350932,
    "right_leg_ratio": 0.349535,
    "torso_ratio": 0.271976,
    "shoulder_to_hip_ratio": 1.800594
  },
  "processing_time": 0.1617
}

17. Known Limitations

The current API returns relative body proportions, not guaranteed
physical measurements in centimetres.

Physical measurements require calibration and a controlled capture
setup.

The current pose-analysis workflow processes one detected pose.

Pose quality can vary depending on image quality, visibility, body
position, occlusion, and camera angle.

Landmark visibility values may be lower for partially hidden body
parts.

The API is currently configured for local development and does not
include authentication.

Performance depends on image resolution and local hardware.

API Success Standard

The expected successful workflow is:

Upload image
     ↓
FastAPI
     ↓
Pose detection
     ↓
Landmark extraction
     ↓
Body proportion calculation
     ↓
JSON response

This completes the AI Body Analysis API workflow.