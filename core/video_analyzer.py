"""
core/video_analyzer.py
======================
Basic video analysis using OpenCV.

This module provides a cross-platform helper to extract metadata and a simple
movement score from a video file without relying on AI models, MediaPipe,
Whisper, or external APIs.
"""

import cv2
from pathlib import Path
from typing import Dict, Union


def analyze_video(video_path: str) -> Dict[str, Union[str, float, int]]:
    """
    Analyze a video file using OpenCV.

    Parameters
    ----------
    video_path : str
        Absolute or relative path to the video file.

    Returns
    -------
    dict
        A dictionary with the following keys:
        - status (str): "success" or "error"
        - duration_seconds (float): Video length in seconds
        - fps (float): Frames per second
        - total_frames (int): Total frame count
        - width (int): Frame width in pixels
        - height (int): Frame height in pixels
        - resolution (str): "widthxheight" string
        - sample_frame_count (int): Number of frames sampled for analysis
        - movement_score (float): Basic motion metric (0-100)
        - message (str): Human-readable status message
    """
    cap = None
    try:
        cap = cv2.VideoCapture(str(video_path))

        # Verify the file opened successfully
        if not cap.isOpened():
            return {
                "status": "error",
                "duration_seconds": 0.0,
                "fps": 0.0,
                "total_frames": 0,
                "width": 0,
                "height": 0,
                "resolution": "0x0",
                "sample_frame_count": 0,
                "movement_score": 0.0,
                "message": "Could not open video file. It may be corrupted or in an unsupported format.",
            }

        # Extract metadata
        fps = cap.get(cv2.CAP_PROP_FPS)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))

        # Guard against invalid or zero FPS to prevent division by zero
        if fps <= 0 or total_frames <= 0:
            return {
                "status": "error",
                "duration_seconds": 0.0,
                "fps": 0.0,
                "total_frames": total_frames,
                "width": width,
                "height": height,
                "resolution": f"{width}x{height}",
                "sample_frame_count": 0,
                "movement_score": 0.0,
                "message": "Could not determine frame rate or frame count. The video may be incomplete.",
            }

        duration_seconds = total_frames / fps

        # -------------------------------------------------------------------
        # Basic movement analysis
        # -------------------------------------------------------------------
        # Sample roughly 30 frames evenly distributed across the video to
        # estimate average inter-frame motion (proxy for body movement).
        sample_interval = max(1, total_frames // 30)
        prev_gray = None
        frame_diffs = []
        frame_count = 0

        for frame_idx in range(0, total_frames, sample_interval):
            cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
            ret, frame = cap.read()
            if not ret:
                break

            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            if prev_gray is not None:
                diff = cv2.absdiff(prev_gray, gray)
                mean_diff = float(diff.mean())
                frame_diffs.append(mean_diff)
            prev_gray = gray
            frame_count += 1

        # Normalize raw mean pixel difference to a 0-100 scale
        movement_score = 0.0
        if frame_diffs:
            raw_mean = sum(frame_diffs) / len(frame_diffs)
            # diff.mean() maxes at 255; divide by 2.55 to scale to 0-100
            movement_score = min(100.0, round(raw_mean / 2.55, 2))

        return {
            "status": "success",
            "duration_seconds": round(duration_seconds, 2),
            "fps": round(fps, 2),
            "total_frames": total_frames,
            "width": width,
            "height": height,
            "resolution": f"{width}x{height}",
            "sample_frame_count": frame_count,
            "movement_score": movement_score,
            "message": "Video analysis completed successfully.",
        }

    except Exception as exc:
        return {
            "status": "error",
            "duration_seconds": 0.0,
            "fps": 0.0,
            "total_frames": 0,
            "width": 0,
            "height": 0,
            "resolution": "0x0",
            "sample_frame_count": 0,
            "movement_score": 0.0,
            "message": f"An unexpected error occurred during analysis: {exc}",
        }

    finally:
        if cap is not None:
            cap.release()
