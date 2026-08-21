from src.pose_detector import PoseDetector
from src.measurements import calculate_measurements


detector = PoseDetector()

result = detector.detect(
    "test_images/person.jpg"
)

if result["person_detected"]:

    measurements = calculate_measurements(
        result["landmarks"]
    )

    print("\nPerson detected:")
    print(result["person_detected"])

    print("\nMeasurements:")

    for name, value in measurements.items():
        print(f"{name}: {value}")

else:

    print("No person detected")


detector.close()