import time

from fastapi import APIRouter, UploadFile, File, HTTPException

from app.services.image_service import validate_image
from app.services.pose_service import analyze_pose
from app.services.measurement_service import calculate_measurements


router = APIRouter()


@router.post("/analyze")
async def analyze(file: UploadFile = File(...)):

    start_time = time.perf_counter()

    try:
        _, image = await validate_image(file)

        keypoints = analyze_pose(image)

        if keypoints is None:
            return {
                "success": False,
                "person_detected": False,
                "pose_analysis": {
                    "valid": False,
                    "confidence": 0,
                    "message": (
                        "No person detected. "
                        "Please upload a clear full-body image."
                    ),
                },
                "body_measurements": {
                    "shoulder_ratio": None,
                    "hip_ratio": None,
                    "arm_ratio": None,
                    "leg_ratio": None,
                },
                "processing_time": round(
                    time.perf_counter() - start_time,
                    3
                ),
                "model_version": "yolo26n-pose-v1",
            }

        measurements = calculate_measurements(
            keypoints
        )

        confidence = measurements.pop(
            "confidence"
        )

        valid_pose = confidence >= 0.50

        processing_time = round(
            time.perf_counter() - start_time,
            3
        )

        return {
            "success": valid_pose,
            "person_detected": True,
            "pose_analysis": {
                "valid": valid_pose,
                "confidence": confidence,
                "message": (
                    "Pose detected successfully."
                    if valid_pose
                    else
                    "Pose confidence is too low."
                ),
            },
            "body_measurements": measurements,
            "processing_time": processing_time,
            "model_version": "yolo26n-pose-v1",
        }

    except ValueError as error:
        raise HTTPException(
            status_code=400,
            detail=str(error)
        )

    except Exception as error:
        print("AI analysis error:", error)

        raise HTTPException(
            status_code=500,
            detail="AI analysis failed."
        )