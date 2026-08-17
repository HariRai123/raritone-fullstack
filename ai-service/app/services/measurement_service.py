from app.services.pose_service import KEYPOINTS
from app.utils.geometry import distance, safe_ratio


def get_point(keypoints, name):
    index = KEYPOINTS[name]

    point = keypoints[index]

    x = float(point[0])
    y = float(point[1])

    return (x, y)


def get_confidence(keypoints, name):
    index = KEYPOINTS[name]

    point = keypoints[index]

    if len(point) >= 3:
        return float(point[2])

    return 1.0


def calculate_measurements(keypoints):

    required_points = [
        "left_shoulder",
        "right_shoulder",
        "left_hip",
        "right_hip",
        "left_ankle",
        "right_ankle",
    ]

    confidence_values = [
        get_confidence(keypoints, point)
        for point in required_points
    ]

    average_confidence = sum(confidence_values) / len(
        confidence_values
    )

    left_shoulder = get_point(
        keypoints,
        "left_shoulder"
    )

    right_shoulder = get_point(
        keypoints,
        "right_shoulder"
    )

    left_hip = get_point(
        keypoints,
        "left_hip"
    )

    right_hip = get_point(
        keypoints,
        "right_hip"
    )

    left_ankle = get_point(
        keypoints,
        "left_ankle"
    )

    right_ankle = get_point(
        keypoints,
        "right_ankle"
    )

    shoulder_width = distance(
        left_shoulder,
        right_shoulder
    )

    hip_width = distance(
        left_hip,
        right_hip
    )

    body_height = max(
        distance(left_shoulder, left_ankle),
        distance(right_shoulder, right_ankle)
    )

    arm_length = (
        distance(
            left_shoulder,
            get_point(keypoints, "left_elbow")
        )
        +
        distance(
            get_point(keypoints, "left_elbow"),
            get_point(keypoints, "left_wrist")
        )
    )

    leg_length = (
        distance(
            left_hip,
            get_point(keypoints, "left_knee")
        )
        +
        distance(
            get_point(keypoints, "left_knee"),
            left_ankle
        )
    )

    return {
        "confidence": round(average_confidence, 4),
        "shoulder_ratio": safe_ratio(
            shoulder_width,
            body_height
        ),
        "hip_ratio": safe_ratio(
            hip_width,
            body_height
        ),
        "arm_ratio": safe_ratio(
            arm_length,
            body_height
        ),
        "leg_ratio": safe_ratio(
            leg_length,
            body_height
        ),
    }
