"""
PitchPilot AI - Practice Page
=============================
Guided workflow for uploading videos and running analyses.
Results are stored in st.session_state so other pages can access them.
"""

from pathlib import Path
import streamlit as st

from core.video_analyzer import analyze_video
from core.camera_analyzer import analyze_camera_presence
from core.speech_analyzer import analyze_speech
from core.question_bank import (
    get_practice_modes,
    get_questions_for_mode,
    get_random_question,
    get_default_role_for_mode,
)
from core.ui_utils import (
    render_sidebar,
    inject_custom_css,
    render_page_header,
    render_footer,
    render_workflow_steps,
    section_card,
    render_empty_state,
)

# ---------------------------------------------------------------------------
# Page configuration
# ---------------------------------------------------------------------------
st.set_page_config(page_title="Practice | PitchPilot AI", page_icon="🎥")

# ---------------------------------------------------------------------------
# Shared UI
# ---------------------------------------------------------------------------
inject_custom_css()
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
# Determine workflow step
# ---------------------------------------------------------------------------
vid_res = st.session_state.get("video_analysis_result")
cam_res = st.session_state.get("camera_analysis_result")
sp_res = st.session_state.get("speech_result")
has_upload = st.session_state.get("last_uploaded_name") is not None

if sp_res is not None and sp_res.get("status") == "success":
    current_step = "feedback"
elif cam_res is not None and cam_res.get("status") == "success":
    current_step = "speech"
elif vid_res is not None and vid_res.get("status") == "success":
    current_step = "camera"
elif has_upload:
    current_step = "video"
else:
    current_step = "upload"

workflow_steps = [
    {"key": "upload", "label": "Upload", "done": has_upload},
    {"key": "video", "label": "Video Analysis", "done": vid_res is not None and vid_res.get("status") == "success"},
    {"key": "camera", "label": "Camera Analysis", "done": cam_res is not None and cam_res.get("status") == "success"},
    {"key": "speech", "label": "Speech Analysis", "done": sp_res is not None and sp_res.get("status") == "success"},
    {"key": "feedback", "label": "Feedback", "done": sp_res is not None and sp_res.get("status") == "success"},
]

# ---------------------------------------------------------------------------
# UI Header
# ---------------------------------------------------------------------------
render_page_header(
    "Practice",
    "Upload your interview video and run the analysis pipeline.",
    "🎥",
)

# ---------------------------------------------------------------------------
# Workflow Steps
# ---------------------------------------------------------------------------
render_workflow_steps(workflow_steps, current_step=current_step)

# Demo mode indicator
if vid_res is not None and vid_res.get("status") == "success":
    st.info("ℹ️ Demo data or previous analysis results are loaded. Upload a new video to replace them.")

# ---------------------------------------------------------------------------
# Practice Mode Selector
# ---------------------------------------------------------------------------
with section_card("Practice Setup", "Choose a practice mode and question to focus your session."):
    modes = get_practice_modes()
    current_mode = st.session_state.get("practice_mode", modes[0])

    selected_mode = st.selectbox(
        "Practice Mode",
        modes,
        index=modes.index(current_mode) if current_mode in modes else 0,
    )
    st.session_state["practice_mode"] = selected_mode

    questions = get_questions_for_mode(selected_mode)
    current_question = st.session_state.get("interview_question", questions[0] if questions else "Tell me about yourself.")

    c1, c2 = st.columns([3, 1])
    with c1:
        selected_question = st.selectbox(
            "Interview Question",
            questions,
            index=questions.index(current_question) if current_question in questions else 0,
        )
    with c2:
        st.markdown("<div style='height:1.7rem;'></div>", unsafe_allow_html=True)
        if st.button("🎲 Random", width="stretch"):
            selected_question = get_random_question(selected_mode)
            st.session_state["interview_question"] = selected_question
            st.rerun()

    st.session_state["interview_question"] = selected_question

    default_role = get_default_role_for_mode(selected_mode)
    current_role = st.session_state.get("target_role", default_role)
    st.session_state["target_role"] = st.text_input(
        "Target Role",
        value=current_role,
        placeholder="e.g., Software Developer",
    )

    st.info(f"**Current setup:** {selected_mode} — *{selected_question}* — Role: {st.session_state['target_role']}")

# ---------------------------------------------------------------------------
# Upload Card
# ---------------------------------------------------------------------------
with section_card("Step 1: Upload Video", "Supported format: MP4. Maximum file size: 200 MB."):
    uploaded_file = st.file_uploader(
        label="Choose a video file",
        type=ALLOWED_TYPES,
        accept_multiple_files=False,
        help=f"Supported format: MP4. Max size: {MAX_FILE_SIZE_MB} MB.",
    )

if uploaded_file is not None:
    file_size_mb = len(uploaded_file.getvalue()) / (1024 * 1024)
    if file_size_mb > MAX_FILE_SIZE_MB:
        st.error(
            f"File too large ({file_size_mb:.1f} MB). "
            f"Please upload a file under {MAX_FILE_SIZE_MB} MB."
        )
    else:
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
        with section_card("Preview"):
            st.video(uploaded_file)

        # -------------------------------------------------------------------
        # Analysis Pipeline
        # -------------------------------------------------------------------
        if file_path is not None and file_path.exists():
            st.divider()
            render_page_header("Analysis Pipeline", "Run each analysis in order. All processing happens locally on your machine.")

            # -- Video Analysis --
            with section_card("Step 2: Video Intelligence", "Extracts duration, FPS, resolution, and motion score using OpenCV."):
                if st.button("🔍 Analyze Video", type="primary", key="btn_video_analysis"):
                    try:
                        with st.spinner("Analyzing video structure and motion..."):
                            result = analyze_video(str(file_path))
                        st.session_state["video_analysis_result"] = result
                    except Exception as exc:
                        st.error(f"Video analysis failed: {exc}")
                        st.session_state["video_analysis_result"] = None

                vid_res = st.session_state.get("video_analysis_result")
                if vid_res is not None:
                    if vid_res.get("status") == "success":
                        st.success(vid_res.get("message", "Video analysis complete."))
                        m1, m2, m3, m4 = st.columns(4)
                        m1.metric("Duration", f"{vid_res.get('duration_seconds', 0)} s")
                        m2.metric("FPS", vid_res.get("fps", 0))
                        m3.metric("Resolution", vid_res.get("resolution", "N/A"))
                        m4.metric("Movement Score", vid_res.get("movement_score", 0))

                        with st.expander("📐 Video Details"):
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

            # -- Camera Analysis --
            with section_card("Step 3: Camera Presence", "Detects face visibility, framing, distance, and movement using OpenCV Haar Cascade."):
                if st.button("📷 Analyze Camera Presence", type="primary", key="btn_camera_analysis"):
                    try:
                        with st.spinner("Checking camera presence and face positioning..."):
                            cam_result = analyze_camera_presence(str(file_path))
                        st.session_state["camera_analysis_result"] = cam_result
                    except Exception as exc:
                        st.error(f"Camera analysis failed: {exc}")
                        st.session_state["camera_analysis_result"] = None

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

                        for warning in cam_res.get("warnings", []):
                            st.warning(f"⚠️ {warning}")

                        with st.expander("📐 Camera Details"):
                            st.markdown(
                                f"""
                                | Property | Value |
                                |----------|-------|
                                | Face Detected | {cam_res.get('face_detected', False)} |
                                | Sampled Frames | {cam_res.get('sampled_frames', 0):,} |
                                | Faces Detected | {cam_res.get('faces_detected', 0):,} |
                                | Detector | {cam_res.get('detector_used', 'unknown')} |
                                """
                            )
                    else:
                        st.error(cam_res.get("message", "Camera analysis returned an error."))

            # -- Speech Analysis --
            with section_card("Step 4: Speech Analytics", "Extracts audio and transcribes speech with faster-whisper. Counts words, WPM, fillers, and repetitions."):
                if st.button("🎤 Analyze Speech", type="primary", key="btn_speech_analysis"):
                    try:
                        with st.spinner("Transcribing speech and analyzing delivery..."):
                            speech_result = analyze_speech(str(file_path))
                        st.session_state["speech_result"] = speech_result
                    except Exception as exc:
                        st.error(f"Speech analysis failed: {exc}")
                        st.session_state["speech_result"] = None

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

                        for warning in sp_res.get("warnings", []):
                            st.warning(f"⚠️ {warning}")

                        with st.expander("📝 Transcript"):
                            st.text(sp_res.get("transcript", "[No transcript available.]"))

                        with st.expander("📐 Speech Details"):
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

            # Next step CTA
            if sp_res is not None and sp_res.get("status") == "success":
                st.success("All analyses complete! Head to the Feedback page to review your coaching report.")
                if st.button("📝 Go to Feedback", type="primary"):
                    st.switch_page("pages/2_Feedback.py")
        else:
            st.warning("File not saved to disk; analysis is unavailable.")

        # Session metadata
        with section_card("Session Info"):
            st.markdown(
                f"""
                | Property | Value |
                |----------|-------|
                | Filename | `{uploaded_file.name}` |
                | Size | {file_size_mb:.2f} MB |
                | Type | {uploaded_file.type} |
                """
            )
else:
    render_empty_state(
        icon="📤",
        title="Upload a Practice Video",
        text="Upload an MP4 file to start the analysis pipeline. Or load Demo Data from the Home page to explore without a video.",
    )

# ---------------------------------------------------------------------------
# Manage existing uploads
# ---------------------------------------------------------------------------
with st.expander("Manage existing uploads"):
    existing_files = sorted(UPLOAD_DIR.glob("*.mp4"))
    if not existing_files:
        st.write("No uploaded videos found.")
    else:
        for vid in existing_files:
            size_mb = vid.stat().st_size / (1024 * 1024)
            st.write(f"- `{vid.name}` ({size_mb:.2f} MB)")

render_footer()
