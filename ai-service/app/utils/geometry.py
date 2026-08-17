import math


def distance(point_a, point_b):
    return math.sqrt(
        (point_a[0] - point_b[0]) ** 2
        + (point_a[1] - point_b[1]) ** 2
    )


def safe_ratio(numerator, denominator):
    if denominator <= 0:
        return None

    return round(numerator / denominator, 4)