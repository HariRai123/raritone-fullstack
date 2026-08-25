from src.pose_detector import PoseDetector


detector = PoseDetector()

result = detector.detect(
    "test_images/person.jpg"
)

print("\nPerson detected:")
print(result["person_detected"])

print("\nNumber of landmarks:")
print(len(result["landmarks"]))

print("\nLandmarks:")

for index, landmark in result["landmarks"].items():
    print(index, landmark)

detector.close()