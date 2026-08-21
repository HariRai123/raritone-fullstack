import cv2
import mediapipe as mp


class PoseDetector:

    def __init__(self, model_path="pose_landmarker.task"):

        base_options = mp.tasks.BaseOptions(
            model_asset_path=model_path
        )

        options = mp.tasks.vision.PoseLandmarkerOptions(
            base_options=base_options,
            running_mode=mp.tasks.vision.RunningMode.IMAGE,
            num_poses=1,
            min_pose_detection_confidence=0.5,
            min_pose_presence_confidence=0.5,
            min_tracking_confidence=0.5
        )

        self.detector = (
            mp.tasks.vision.PoseLandmarker
            .create_from_options(options)
        )

    def detect(self, image_path):

        # 1. Read image using OpenCV
        image = cv2.imread(image_path)

        if image is None:
            raise ValueError(
                "Invalid or unreadable image"
            )

        # 2. Convert BGR → RGB
        rgb_image = cv2.cvtColor(
            image,
            cv2.COLOR_BGR2RGB
        )

        # 3. Convert OpenCV image to MediaPipe image
        mp_image = mp.Image(
            image_format=mp.ImageFormat.SRGB,
            data=rgb_image
        )

        # 4. Run pose detection
        result = self.detector.detect(mp_image)

        # 5. No person detected
        if not result.pose_landmarks:

            return {
                "person_detected": False,
                "landmarks": {}
            }

        # 6. Take the first detected person
        pose = result.pose_landmarks[0]

        landmarks = {}

        # 7. Extract all 33 landmarks
        for index, landmark in enumerate(pose):

            landmarks[str(index)] = {
                "x": round(landmark.x, 6),
                "y": round(landmark.y, 6),
                "z": round(landmark.z, 6),
                "visibility": round(
                    landmark.visibility,
                    6
                )
            }

        return {
            "person_detected": True,
            "landmarks": landmarks
        }

    def close(self):
        self.detector.close()