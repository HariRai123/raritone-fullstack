import time
import json

from src.pose_detector import PoseDetector
from src.measurements import calculate_measurements


detector = PoseDetector()

start_time = time.time()

result = detector.detect(
    "test_images/person.jpg"
)

if result["person_detected"]:

    measurements = calculate_measurements(
        result["landmarks"]
    )

else:

    measurements = {}


processing_time = time.time() - start_time

response = {
    "person_detected": result["person_detected"],
    "landmarks": result["landmarks"],
    "measurements": measurements,
    "processing_time": round(
        processing_time,
        4
    )
}

print("\nFinal JSON Response:\n")



print(
    json.dumps(
        response,
        indent=4
    )
)

detector.close()