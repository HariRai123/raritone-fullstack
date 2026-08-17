import numpy as np
from ultralytics import YOLO


MODEL_NAME = "yolo26n-pose.pt"

model = YOLO(MODEL_NAME)


KEYPOINTS = {
    "nose": 0,
    "left_shoulder": 5,
    "right_shoulder": 6,
    "left_elbow": 7,
    "right_elbow": 8,
    "left_wrist": 9,
    "right_wrist": 10,
    "left_hip": 11,
    "right_hip": 12,
    "left_knee": 13,
    "right_knee": 14,
    "left_ankle": 15,
    "right_ankle": 16,
}


def analyze_pose(image):
    results = model.predict(
        source=np.array(image),
        conf=0.40,
        verbose=False
    )

    if not results:
        return None

    result = results[0]

    if result.keypoints is None:
        return None

    if len(result.keypoints.data) == 0:
        return None

    # Select the person with the largest bounding box.
    if result.boxes is not None and len(result.boxes) > 1:
        boxes = result.boxes.xyxy.cpu().numpy()

        areas = []

        for box in boxes:
            x1, y1, x2, y2 = box
            areas.append((x2 - x1) * (y2 - y1))

        person_index = int(np.argmax(areas))
    else:
        person_index = 0

    keypoints = (
        result.keypoints.data[person_index]
        .cpu()
        .numpy()
    )

    return keypoints