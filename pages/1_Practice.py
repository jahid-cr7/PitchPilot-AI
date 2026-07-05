"""
PitchPilot AI - Practice Page
=============================
Allows users to upload MP4 video files, preview them, and run analysis.
Results are stored in st.session_state so other pages (e.g., Feedback)
can access them later.

Cross-platform: uses pathlib.Path for all file system operations.
"""

from pathlib import Path
import streamlit as st

# Import our analyzers with safe fallback
from core.video_analyzer import analyze_video
from core.camera_analyzer import analyze_camera_presence
from core.speech_analyzer import analyze_speech
from core.ui_utils import render_sidebar

# ---------------------------------------------------------------------------
# Page configuration
# ---------------------------------------------------------------------------
st.set_page_config(page_title="Practice | PitchPilot AI", page_icon="🎥")

# ---------------------------------------------------------------------------
# Shared sidebar
# ---------------------------------------------------------------------------
render_sidebar()

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
UPLOAD_DIR = Path(__file__).resolve().parent.parent / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)

ALLOWED_TYPES = ["mp4"]
MAX_FILE_SIZE_MB = 200

# ---------------------------------------------------------------------------
# Session state initialization
# ---------------------------------------------------------------------------
for key in (
    "video_analysis_result",
    "camera_analysis_result",
    "speech_result",
    "last_uploaded_name",
):
    if key not in st.session_state:
        st.session_state[key] = None

# ---------------------------------------------------------------------------
# UI
# ---------------------------------------------------------------------------
st.title("🎥 Practice")
st.markdown("Upload your interview or pitch video to get started.")

# Demo mode indicator
if st.session_state.get("video_analysis_result") is not None:
    st.info("ℹ️ Demo data is loaded. You can also upload a new video to replace it.")

st.divider()

# ---------------------------------------------------------------------------
# Video uploader
# ---------------------------------------------------------------------------
uploaded_file = st.file_uploader(
    label="Choose a video file",
    type=ALLOWED_TYPES,
    accept_multiple_files=False,
    help=f"Supported format: MP4. Max size: {MAX_FILE_SIZE_MB} MB.",
)

if uploaded_file is not None:
    # Basic size guard (file_uploader returns bytes in memory)
    file_size_mb = len(uploaded_file.getvalue()) / (1024 * 1024)
    if file_size_mb > MAX_FILE_SIZE_MB:
        st.error(
            f"File too large ({file_size_mb:.1f} MB). "
            f"Please upload a file under {MAX_FILE_SIZE_MB} MB."
        )
    else:
        # Save to local uploads directory using pathlib (cross-platform)
        file_path = UPLOAD_DIR / uploaded_file.name
        try:
            with open(file_path, "wb") as f:
                f.write(uploaded_file.getbuffer())
            st.success(f"Saved: {uploaded_file.name} ({file_size_mb:.1f} MB)")
            st.session_state["last_uploaded_name"] = uploaded_file.name
        except Exception as exc:
            st.error(f"Failed to save file: {exc}")
            file_path = None

        # Preview
        st.subheader("Preview")
        st.video(uploaded_file)

        # -------------------------------------------------------------------
        # Analysis section
        # -------------------------------------------------------------------
        if file_path is not None and file_path.exists():
            st.divider()
            st.subheader("Analysis")

            # -- Analyze Video (OpenCV metadata + motion) --
            if st.button("🔍 Analyze Video", type="primary", key="btn_video_analysis"):
                try:
                    with st.spinner("Analyzing video with OpenCV..."):
                        result = analyze_video(str(file_path))
                    st.session_state["video_analysis_result"] = result
                except Exception as exc:
                    st.error(f"Video analysis failed: {exc}")
                    st.session_state["video_analysis_result"] = None

            # Display stored video analysis results
            vid_res = st.session_state.get("video_analysis_result")
            if vid_res is not None:
                if vid_res.get("status") == "success":
                    st.success(vid_res.get("message", "Video analysis complete."))

                    m1, m2, m3, m4 = st.columns(4)
                    m1.metric("Duration", f"{vid_res.get('duration_seconds', 0)} s")
                    m2.metric("FPS", vid_res.get("fps", 0))
                    m3.metric("Resolution", vid_res.get("resolution", "N/A"))
                    m4.metric("Movement Score", vid_res.get("movement_score", 0))

                    st.markdown(
                        f"""
                        | Property | Value |
                        |----------|-------|
                        | Total Frames | {vid_res.get('total_frames', 0):,} |
                        | Width | {vid_res.get('width', 0)} px |
                        | Height | {vid_res.get('height', 0)} px |
                        | Sampled Frames | {vid_res.get('sample_frame_count', 0)} |
                        """
                    )
                else:
                    st.error(vid_res.get("message", "Video analysis returned an error."))

            # -- Analyze Camera Presence (OpenCV Haar Cascade face detection) --
            if st.button("📷 Analyze Camera Presence", type="primary", key="btn_camera_analysis"):
                try:
                    with st.spinner("Analyzing camera presence with OpenCV Haar Cascade..."):
                        cam_result = analyze_camera_presence(str(file_path))
                    st.session_state["camera_analysis_result"] = cam_result
                except Exception as exc:
                    st.error(f"Camera analysis failed: {exc}")
                    st.session_state["camera_analysis_result"] = None

            # Display stored camera analysis results
            cam_res = st.session_state.get("camera_analysis_result")
            if cam_res is not None:
                if cam_res.get("status") == "success":
                    st.success(cam_res.get("message", "Camera analysis complete."))

                    c1, c2, c3, c4, c5 = st.columns(5)
                    c1.metric("Face Visible %", f"{cam_res.get('face_visible_percent', 0)}%")
                    c2.metric("Framing", str(cam_res.get("framing", "unknown")).replace("_", " ").title())
                    c3.metric("Distance", str(cam_res.get("distance_feedback", "unknown")).replace("_", " ").title())
                    c4.metric("Movement", str(cam_res.get("movement_level", "unknown")).title())
                    c5.metric("Camera Score", cam_res.get("camera_score", 0))

                    # Show detector used and details
                    st.caption(f"Detector: {cam_res.get('detector_used', 'unknown')}")

                    # Show warnings from the analyzer
                    for warning in cam_res.get("warnings", []):
                        st.warning(f"⚠️ {warning}")

                    st.markdown(
                        f"""
                        | Property | Value |
                        |----------|-------|
                        | Face Detected | {cam_res.get('face_detected', False)} |
                        | Sampled Frames | {cam_res.get('sampled_frames', 0):,} |
                        | Faces Detected | {cam_res.get('faces_detected', 0):,} |
                        | Avg Face Center X | {cam_res.get('face_center_x', 0)} |
                        | Avg Face Center Y | {cam_res.get('face_center_y', 0)} |
                        | Avg Face Width Ratio | {cam_res.get('face_width_ratio', 0)} |
                        | Avg Face Height Ratio | {cam_res.get('face_height_ratio', 0)} |
                        """
                    )
                else:
                    st.error(cam_res.get("message", "Camera analysis returned an error."))

            # -- Analyze Speech (faster-whisper transcription) --
            if st.button("🎤 Analyze Speech", type="primary", key="btn_speech_analysis"):
                try:
                    with st.spinner("Extracting audio and transcribing speech..."):
                        speech_result = analyze_speech(str(file_path))
                    st.session_state["speech_result"] = speech_result
                except Exception as exc:
                    st.error(f"Speech analysis failed: {exc}")
                    st.session_state["speech_result"] = None

            # Display stored speech analysis results
            sp_res = st.session_state.get("speech_result")
            if sp_res is not None:
                if sp_res.get("status") == "success":
                    st.success(sp_res.get("message", "Speech analysis complete."))

                    s1, s2, s3, s4, s5 = st.columns(5)
                    s1.metric("Word Count", sp_res.get("word_count", 0))
                    s2.metric("WPM", sp_res.get("words_per_minute", 0))
                    s3.metric("Filler Words", sp_res.get("filler_word_count", 0))
                    s4.metric("Repeated Words", sp_res.get("repeated_word_count", 0))
                    s5.metric("Speech Score", sp_res.get("speech_score", 0))

                    # Show warnings from the analyzer
                    for warning in sp_res.get("warnings", []):
                        st.warning(f"⚠️ {warning}")

                    # Expandable transcript
                    with st.expander("📝 Transcript"):
                        st.text(sp_res.get("transcript", "[No transcript available.]"))

                    # Additional details
                    st.markdown(
                        f"""
                        | Property | Value |
                        |----------|-------|
                        | Duration | {sp_res.get('duration_seconds', 0)} s |
                        | Filler Details | {', '.join(sp_res.get('filler_words_found', [])) or 'None'} |
                        | Repeated Details | {', '.join(sp_res.get('repeated_words', [])) or 'None'} |
                        """
                    )
                else:
                    st.error(sp_res.get("message", "Speech analysis returned an error."))
        else:
            st.warning("File not saved to disk; analysis is unavailable.")

        # Session metadata
        st.divider()
        st.subheader("Session Info")
        st.markdown(
            f"""
            | Property | Value |
            |----------|-------|
            | Filename | `{uploaded_file.name}` |
            | Size | {file_size_mb:.2f} MB |
            | Type | {uploaded_file.type} |
            """
        )

        st.info(
            "Head over to the **Feedback** page to see analysis results once they are available."
        )
else:
    st.info("Upload an MP4 file to preview it here.")

# ---------------------------------------------------------------------------
# Manage existing uploads
# ---------------------------------------------------------------------------
st.divider()
with st.expander("Manage existing uploads"):
    existing_files = sorted(UPLOAD_DIR.glob("*.mp4"))
    if not existing_files:
        st.write("No uploaded videos found.")
    else:
        for vid in existing_files:
            size_mb = vid.stat().st_size / (1024 * 1024)
            st.write(f"- `{vid.name}` ({size_mb:.2f} MB)")
