"""
core/camera_analyzer.py
=======================
Camera presence and face position analysis using OpenCV Haar Cascade.

Provides interview-practice feedback:
- Face visibility percentage
- Framing classification
- Distance estimation
- Movement level
- Overall camera score
- Actionable warnings list

No face recognition, emotion, gender, or age detection is performed.
"""

from pathlib import Path
from typing import Dict, List, Union
import math

import cv2


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
MAX_SAMPLE_FRAMES = 60

# Framing thresholds (relative 0-1 coordinates)
FRAMING_CENTER_MIN = 0.40
FRAMING_CENTER_MAX = 0.60
FRAMING_UNSTABLE_STD = 0.12

# Distance thresholds (face width as fraction of frame width)
DISTANCE_TOO_CLOSE = 0.50
DISTANCE_TOO_FAR = 0.15

# Movement thresholds (std dev of face center positions)
MOVEMENT_LOW_STD = 0.05
MOVEMENT_MEDIUM_STD = 0.15

# Scoring weights (sum = 100)
WEIGHT_VISIBILITY = 40
WEIGHT_FRAMING = 20
WEIGHT_DISTANCE = 20
WEIGHT_MOVEMENT = 20


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _error_dict(message: str) -> Dict[str, Union[str, float, int, list]]:
    """Return a clean error dictionary with all expected keys."""
    return {
        "status": "error",
        "face_detected": False,
        "face_visible_percent": 0.0,
        "framing": "unknown",
        "distance_feedback": "unknown",
        "movement_level": "unknown",
        "camera_score": 0,
        "face_center_x": 0.0,
        "face_center_y": 0.0,
        "face_width_ratio": 0.0,
        "face_height_ratio": 0.0,
        "sampled_frames": 0,
        "faces_detected": 0,
        "detector_used": "opencv_haar",
        "warnings": [message],
        "message": message,
    }


def _load_haar_cascade():
    """Load the OpenCV Haar Cascade classifier for frontal faces."""
    cascade_path = str(
        cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
    )
    classifier = cv2.CascadeClassifier(cascade_path)
    if classifier.empty():
        raise RuntimeError(
            "Failed to load Haar Cascade classifier. "
            f"Path: {cascade_path}"
        )
    return classifier


def _detect_largest_face(
    gray_frame,
    classifier,
    frame_width: int,
    frame_height: int,
):
    """
    Detect faces in a grayscale frame and return the largest face bounding box.
    Returns normalized (xmin, ymin, width, height) or None if no face found.
    """
    faces = classifier.detectMultiScale(
        gray_frame,
        scaleFactor=1.1,
        minNeighbors=5,
        minSize=(max(30, frame_width // 20), max(30, frame_height // 20)),
    )

    if len(faces) == 0:
        return None

    # Pick the largest face (by area) — most likely the main subject
    largest = max(faces, key=lambda r: r[2] * r[3])
    x, y, w, h = largest

    # Normalize to 0-1 range
    return {
        "xmin": x / frame_width,
        "ymin": y / frame_height,
        "width": w / frame_width,
        "height": h / frame_height,
    }


def _classify_framing(avg_x: float, std_x: float) -> str:
    """Classify framing based on average face X and its stability."""
    if std_x > FRAMING_UNSTABLE_STD:
        return "unstable"
    if avg_x < FRAMING_CENTER_MIN:
        return "too_left"
    if avg_x > FRAMING_CENTER_MAX:
        return "too_right"
    return "centered"


def _classify_distance(avg_width_ratio: float) -> str:
    """Estimate distance based on average face width relative to frame."""
    if avg_width_ratio > DISTANCE_TOO_CLOSE:
        return "too_close"
    if avg_width_ratio < DISTANCE_TOO_FAR:
        return "too_far"
    return "good"


def _classify_movement(std_x: float, std_y: float) -> str:
    """Classify movement level from positional variance."""
    combined_std = math.sqrt(std_x**2 + std_y**2)
    if combined_std < MOVEMENT_LOW_STD:
        return "low"
    if combined_std < MOVEMENT_MEDIUM_STD:
        return "medium"
    return "high"


def _calculate_camera_score(
    visible_percent: float,
    framing: str,
    distance: str,
    movement: str,
) -> int:
    """Compute overall camera score (0-100)."""
    score = 0

    # Visibility (0-40)
    score += int(WEIGHT_VISIBILITY * (visible_percent / 100.0))

    # Framing (0-20)
    if framing == "centered":
        score += WEIGHT_FRAMING
    elif framing == "unstable":
        score += WEIGHT_FRAMING // 4
    else:
        score += WEIGHT_FRAMING // 2

    # Distance (0-20)
    if distance == "good":
        score += WEIGHT_DISTANCE
    else:
        score += WEIGHT_DISTANCE // 2

    # Movement / stability (0-20)
    if movement == "low":
        score += WEIGHT_MOVEMENT
    elif movement == "medium":
        score += int(WEIGHT_MOVEMENT * 0.7)
    else:
        score += WEIGHT_MOVEMENT // 2

    return max(0, min(100, score))


def _build_warnings(cam_result: Dict[str, Union[str, float, int]]) -> List[str]:
    """Build a list of actionable warnings from camera analysis results."""
    warnings = []
    if cam_result["face_visible_percent"] < 50:
        warnings.append(
            "Your face was not visible for a significant portion of the video. "
            "Ensure consistent lighting and camera positioning."
        )
    if cam_result["framing"] == "too_left":
        warnings.append(
            "Your face is positioned too far to the left. Center yourself in the frame."
        )
    elif cam_result["framing"] == "too_right":
        warnings.append(
            "Your face is positioned too far to the right. Center yourself in the frame."
        )
    elif cam_result["framing"] == "unstable":
        warnings.append(
            "Your framing is unstable. Try to keep your head in a consistent position."
        )
    if cam_result["distance_feedback"] == "too_close":
        warnings.append(
            "You are too close to the camera. Move back slightly so your face fills about 1/3 of the frame."
        )
    elif cam_result["distance_feedback"] == "too_far":
        warnings.append(
            "You are too far from the camera. Move closer so your face is clearly visible."
        )
    if cam_result["movement_level"] == "high":
        warnings.append(
            "Excessive movement detected. Try to minimize unnecessary head and body motion."
        )
    return warnings


# ---------------------------------------------------------------------------
# Main function
# ---------------------------------------------------------------------------
def analyze_camera_presence(video_path: str) -> Dict[str, Union[str, float, int, list]]:
    """
    Analyze camera presence using OpenCV Haar Cascade face detection.

    Parameters
    ----------
    video_path : str
        Path to the video file (cross-platform, pathlib-compatible).

    Returns
    -------
    dict
        A dictionary with the following keys:
        - status (str): "success" or "error"
        - face_detected (bool)
        - face_visible_percent (float)
        - framing (str): "centered", "too_left", "too_right", "unstable", "no_face", "unknown"
        - distance_feedback (str): "too_close", "good", "too_far", "unknown"
        - movement_level (str): "low", "medium", "high", "unknown"
        - camera_score (int): 0-100
        - face_center_x (float)
        - face_center_y (float)
        - face_width_ratio (float)
        - face_height_ratio (float)
        - sampled_frames (int)
        - faces_detected (int)
        - detector_used (str): "opencv_haar"
        - warnings (list[str])
        - message (str)
    """
    cap = None
    try:
        # Load Haar Cascade classifier safely
        try:
            classifier = _load_haar_cascade()
        except Exception as exc:
            return _error_dict(f"Failed to load face detector: {exc}")

        cap = cv2.VideoCapture(str(video_path))
        if not cap.isOpened():
            return _error_dict("Could not open video file.")

        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

        if total_frames <= 0 or width <= 0 or height <= 0:
            return _error_dict("Invalid video metadata (zero frames or dimensions).")

        # Sample up to MAX_SAMPLE_FRAMES evenly across the video
        sample_interval = max(1, total_frames // MAX_SAMPLE_FRAMES)
        sampled_frames = 0
        faces_detected = 0

        face_centers_x: List[float] = []
        face_centers_y: List[float] = []
        face_widths: List[float] = []
        face_heights: List[float] = []

        for frame_idx in range(0, total_frames, sample_interval):
            cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
            ret, frame = cap.read()
            if not ret:
                break

            sampled_frames += 1

            # Haar Cascade works on grayscale
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            bbox = _detect_largest_face(gray, classifier, width, height)

            if bbox is not None:
                cx = bbox["xmin"] + bbox["width"] / 2.0
                cy = bbox["ymin"] + bbox["height"] / 2.0

                face_centers_x.append(cx)
                face_centers_y.append(cy)
                face_widths.append(bbox["width"])
                face_heights.append(bbox["height"])
                faces_detected += 1

        if sampled_frames == 0:
            return _error_dict("No frames could be sampled from the video.")

        # -------------------------------------------------------------------
        # Compute metrics
        # -------------------------------------------------------------------
        face_visible_percent = round((faces_detected / sampled_frames) * 100, 2)

        if faces_detected > 0:
            avg_x = sum(face_centers_x) / faces_detected
            avg_y = sum(face_centers_y) / faces_detected
            avg_w = sum(face_widths) / faces_detected
            avg_h = sum(face_heights) / faces_detected

            std_x = (
                math.sqrt(
                    sum((x - avg_x) ** 2 for x in face_centers_x) / faces_detected
                )
                if faces_detected > 1
                else 0.0
            )
            std_y = (
                math.sqrt(
                    sum((y - avg_y) ** 2 for y in face_centers_y) / faces_detected
                )
                if faces_detected > 1
                else 0.0
            )

            framing = _classify_framing(avg_x, std_x)
            distance = _classify_distance(avg_w)
            movement = _classify_movement(std_x, std_y)
            camera_score = _calculate_camera_score(
                face_visible_percent, framing, distance, movement
            )

            result = {
                "status": "success",
                "face_detected": True,
                "face_visible_percent": face_visible_percent,
                "framing": framing,
                "distance_feedback": distance,
                "movement_level": movement,
                "camera_score": camera_score,
                "face_center_x": round(avg_x, 4),
                "face_center_y": round(avg_y, 4),
                "face_width_ratio": round(avg_w, 4),
                "face_height_ratio": round(avg_h, 4),
                "sampled_frames": sampled_frames,
                "faces_detected": faces_detected,
                "detector_used": "opencv_haar",
                "warnings": [],
                "message": "Camera presence analysis completed successfully.",
            }
            result["warnings"] = _build_warnings(result)
            return result
        else:
            # No faces detected at all
            return {
                "status": "success",
                "face_detected": False,
                "face_visible_percent": 0.0,
                "framing": "no_face",
                "distance_feedback": "unknown",
                "movement_level": "unknown",
                "camera_score": 0,
                "face_center_x": 0.0,
                "face_center_y": 0.0,
                "face_width_ratio": 0.0,
                "face_height_ratio": 0.0,
                "sampled_frames": sampled_frames,
                "faces_detected": 0,
                "detector_used": "opencv_haar",
                "warnings": [
                    "No faces were detected in the sampled frames. "
                    "Ensure your face is clearly visible and well-lit."
                ],
                "message": (
                    "No faces were detected in the sampled frames. "
                    "Ensure your face is clearly visible."
                ),
            }

    except Exception as exc:
        return _error_dict(f"An unexpected error occurred: {exc}")

    finally:
        if cap is not None:
            cap.release()
