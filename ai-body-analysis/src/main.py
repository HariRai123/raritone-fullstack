import time
import cv2
import numpy as np

from fastapi import FastAPI, UploadFile, File, HTTPException

from src.pose_detector import PoseDetector
from src.measurements import calculate_measurements


# Upload limits
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10 MB
MAX_IMAGE_WIDTH = 4000
MAX_IMAGE_HEIGHT = 4000


app = FastAPI(
    title="AI Body Analysis API",
    description="Pose detection and body proportion API",
    version="1.0.0"
)


# Load MediaPipe model once when the server starts
pose_detector = PoseDetector()


@app.get("/health")
def health():
    return {
        "status": "healthy",
        "model": "pose-v1"
    }


# ============================================================
# POSE DETECTION
# ============================================================

@app.post("/api/ai/pose")
async def pose_detection(
    file: UploadFile = File(...)
):

    start_time = time.time()

    # Read uploaded file
    contents = await file.read()

    # Check file size
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail="Image file is too large. Maximum allowed size is 10 MB."
        )

    # Check empty file
    if not contents:
        raise HTTPException(
            status_code=400,
            detail="Empty image file"
        )

    # Convert bytes to NumPy array
    image_array = np.frombuffer(
        contents,
        dtype=np.uint8
    )

    # Decode image using OpenCV
    image = cv2.imdecode(
        image_array,
        cv2.IMREAD_COLOR
    )

    # Check valid image
    if image is None:
        raise HTTPException(
            status_code=400,
            detail="Invalid image"
        )

    # Check image dimensions
    height, width = image.shape[:2]

    if (
        width > MAX_IMAGE_WIDTH
        or height > MAX_IMAGE_HEIGHT
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Image dimensions are too large. "
                "Maximum allowed dimensions are 4000x4000 pixels."
            )
        )

    # Save temporary image
    temp_path = "temp_uploaded_image.jpg"

    success = cv2.imwrite(
        temp_path,
        image
    )

    if not success:
        raise HTTPException(
            status_code=500,
            detail="Could not save image"
        )

    try:

        # Run MediaPipe pose detection
        result = pose_detector.detect(
            temp_path
        )

        processing_time = (
            time.time() - start_time
        )

        return {
            "person_detected": result[
                "person_detected"
            ],
            "landmarks": result[
                "landmarks"
            ],
            "measurements": {},
            "processing_time": round(
                processing_time,
                4
            )
        }

    except ValueError as e:

        raise HTTPException(
            status_code=400,
            detail=str(e)
        )

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Processing failed: {str(e)}"
        )


# ============================================================
# BODY MEASUREMENTS
# ============================================================

@app.post("/api/ai/measurements")
async def body_measurements(
    file: UploadFile = File(...)
):

    start_time = time.time()

    # Check filename
    if not file.filename:
        raise HTTPException(
            status_code=400,
            detail="No image file provided"
        )

    # Read uploaded file
    contents = await file.read()

    # Check file size
    if len(contents) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=400,
            detail="Image file is too large. Maximum allowed size is 10 MB."
        )

    # Check empty file
    if not contents:
        raise HTTPException(
            status_code=400,
            detail="Empty image file"
        )

    print("Received file:", file.filename)
    print("Content type:", file.content_type)
    print("File size:", len(contents), "bytes")

    # Convert bytes to NumPy array
    image_array = np.frombuffer(
        contents,
        dtype=np.uint8
    )

    # Decode image using OpenCV
    image = cv2.imdecode(
        image_array,
        cv2.IMREAD_COLOR
    )

    # Check valid image
    if image is None:
        raise HTTPException(
            status_code=400,
            detail="Invalid image"
        )

    print(
        "Image decoded successfully:",
        image.shape
    )

    # Check image dimensions
    height, width = image.shape[:2]

    if (
        width > MAX_IMAGE_WIDTH
        or height > MAX_IMAGE_HEIGHT
    ):
        raise HTTPException(
            status_code=400,
            detail=(
                "Image dimensions are too large. "
                "Maximum allowed dimensions are 4000x4000 pixels."
            )
        )

    # Save temporary image
    temp_path = "temp_measurement_image.jpg"

    success = cv2.imwrite(
        temp_path,
        image
    )

    if not success:
        raise HTTPException(
            status_code=500,
            detail="Could not save image"
        )

    try:

        # Run pose detection
        result = pose_detector.detect(
            temp_path
        )

        # No person detected
        if not result["person_detected"]:

            processing_time = (
                time.time() - start_time
            )

            return {
                "person_detected": False,
                "landmarks": {},
                "measurements": {},
                "processing_time": round(
                    processing_time,
                    4
                )
            }

        # Calculate body proportions
        measurements = calculate_measurements(
            result["landmarks"]
        )

        processing_time = (
            time.time() - start_time
        )

        return {
            "person_detected": True,
            "landmarks": result["landmarks"],
            "measurements": measurements,
            "processing_time": round(
                processing_time,
                4
            )
        }

    except ValueError as e:

        raise HTTPException(
            status_code=400,
            detail=str(e)
        )

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=f"Processing failed: {str(e)}"
        )