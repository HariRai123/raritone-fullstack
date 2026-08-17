from pydantic import BaseModel
from typing import Optional


class BodyMeasurements(BaseModel):
    shoulder_ratio: Optional[float] = None
    hip_ratio: Optional[float] = None
    arm_ratio: Optional[float] = None
    leg_ratio: Optional[float] = None


class PoseAnalysis(BaseModel):
    valid: bool
    confidence: float
    message: str


class AnalysisResponse(BaseModel):
    success: bool
    person_detected: bool
    pose_analysis: PoseAnalysis
    body_measurements: BodyMeasurements
    processing_time: float
    model_version: str