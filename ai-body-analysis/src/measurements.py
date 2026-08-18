import math


def distance(point1, point2):
    """
    Calculate 2D Euclidean distance between two landmarks.
    """

    return math.sqrt(
        (point1["x"] - point2["x"]) ** 2
        +
        (point1["y"] - point2["y"]) ** 2
    )


def calculate_measurements(landmarks):

    if not landmarks:
        return {}

    # -----------------------------
    # Get important landmarks
    # -----------------------------

    left_shoulder = landmarks["11"]
    right_shoulder = landmarks["12"]

    left_elbow = landmarks["13"]
    right_elbow = landmarks["14"]

    left_wrist = landmarks["15"]
    right_wrist = landmarks["16"]

    left_hip = landmarks["23"]
    right_hip = landmarks["24"]

    left_knee = landmarks["25"]
    right_knee = landmarks["26"]

    left_ankle = landmarks["27"]
    right_ankle = landmarks["28"]

    # -----------------------------
    # Shoulder width
    # -----------------------------

    shoulder_width = distance(
        left_shoulder,
        right_shoulder
    )

    # -----------------------------
    # Hip width
    # -----------------------------

    hip_width = distance(
        left_hip,
        right_hip
    )

    # -----------------------------
    # Left arm
    # Shoulder → Elbow → Wrist
    # -----------------------------

    left_upper_arm = distance(
        left_shoulder,
        left_elbow
    )

    left_forearm = distance(
        left_elbow,
        left_wrist
    )

    left_arm = (
        left_upper_arm
        +
        left_forearm
    )

    # -----------------------------
    # Right arm
    # Shoulder → Elbow → Wrist
    # -----------------------------

    right_upper_arm = distance(
        right_shoulder,
        right_elbow
    )

    right_forearm = distance(
        right_elbow,
        right_wrist
    )

    right_arm = (
        right_upper_arm
        +
        right_forearm
    )

    # -----------------------------
    # Left leg
    # Hip → Knee → Ankle
    # -----------------------------

    left_thigh = distance(
        left_hip,
        left_knee
    )

    left_lower_leg = distance(
        left_knee,
        left_ankle
    )

    left_leg = (
        left_thigh
        +
        left_lower_leg
    )

    # -----------------------------
    # Right leg
    # Hip → Knee → Ankle
    # -----------------------------

    right_thigh = distance(
        right_hip,
        right_knee
    )

    right_lower_leg = distance(
        right_knee,
        right_ankle
    )

    right_leg = (
        right_thigh
        +
        right_lower_leg
    )

    # -----------------------------
    # Torso
    # -----------------------------

    left_torso = distance(
        left_shoulder,
        left_hip
    )

    right_torso = distance(
        right_shoulder,
        right_hip
    )

    torso = (
        left_torso
        +
        right_torso
    ) / 2

    # -----------------------------
    # Shoulder / Hip ratio
    # -----------------------------

    if hip_width != 0:
        shoulder_to_hip_ratio = (
            shoulder_width / hip_width
        )
    else:
        shoulder_to_hip_ratio = 0

    # -----------------------------
    # Return measurements
    # -----------------------------

    return {
        "shoulder_width_ratio": round(
            shoulder_width,
            6
        ),

        "hip_width_ratio": round(
            hip_width,
            6
        ),

        "left_arm_ratio": round(
            left_arm,
            6
        ),

        "right_arm_ratio": round(
            right_arm,
            6
        ),

        "left_leg_ratio": round(
            left_leg,
            6
        ),

        "right_leg_ratio": round(
            right_leg,
            6
        ),

        "torso_ratio": round(
            torso,
            6
        ),

        "shoulder_to_hip_ratio": round(
            shoulder_to_hip_ratio,
            6
        )
    }