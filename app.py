"""
PitchPilot AI - Main Entry Point
================================
Streamlit multipage app for AI-powered interview and presentation coaching.
This file serves as the landing page with project overview and navigation hints.
"""

import streamlit as st

from core.database import init_db
from core.ui_utils import render_sidebar

# ---------------------------------------------------------------------------
# Initialize database safely on startup
# ---------------------------------------------------------------------------
try:
    init_db()
except Exception as exc:
    st.error(f"Database initialization failed: {exc}")

# ---------------------------------------------------------------------------
# Page configuration
# ---------------------------------------------------------------------------
st.set_page_config(
    page_title="PitchPilot AI",
    page_icon="🎯",
    layout="centered",
    initial_sidebar_state="expanded",
)

# ---------------------------------------------------------------------------
# Shared sidebar
# ---------------------------------------------------------------------------
render_sidebar()

# ---------------------------------------------------------------------------
# Hero Section
# ---------------------------------------------------------------------------
st.title("🎯 PitchPilot AI")
st.subheader("AI Interview & Presentation Coach")
st.markdown(
    """
    Welcome to **PitchPilot AI** — your personal coach for mastering interviews,
    pitches, and public speaking. Upload practice videos, receive structured feedback,
    and track your improvement over time.
    """
)

st.divider()

# ---------------------------------------------------------------------------
# Project Overview
# ---------------------------------------------------------------------------
st.header("📖 Project Overview")
st.markdown(
    """
    PitchPilot AI is an end-to-end coaching platform that helps job candidates and
    speakers improve their delivery through automated video, audio, and content analysis.

    The system extracts insights from your practice recordings and translates them into
    actionable feedback — from body language and camera presence to speech clarity and
    answer structure.
    """
)

st.divider()

# ---------------------------------------------------------------------------
# Feature Cards
# ---------------------------------------------------------------------------
st.header("✨ Features")

col1, col2, col3 = st.columns(3)

with col1:
    st.markdown("### 🎥 Practice")
    st.markdown(
        """
        Record or upload your interview or pitch videos (MP4).
        Run video, camera, and speech analyses in one place.
        """
    )

with col2:
    st.markdown("### 📝 Feedback")
    st.markdown(
        """
        Review AI-generated feedback on clarity, pacing, tone, and body language.
        Get an AI Coach review of your answer content and structure.
        """
    )

with col3:
    st.markdown("### 📊 Dashboard")
    st.markdown(
        """
        Track your progress with key metrics and visual trends.
        See how your skills evolve session by session.
        """
    )

st.divider()

# ---------------------------------------------------------------------------
# Demo Workflow
# ---------------------------------------------------------------------------
st.header("🧪 Demo Workflow")
st.markdown(
    """
    Try the app instantly without uploading a video:

    1. Click **🚀 Load Demo Data** below.
    2. Go to the **Feedback** page to see sample analysis results.
    3. Explore the **Dashboard** to view trend charts.
    4. Visit **History** to see how sessions are stored and exported.

    > 💡 This lets you evaluate the full UI and feature set in seconds.
    """
)

# ---------------------------------------------------------------------------
# Demo Mode Button
# ---------------------------------------------------------------------------
if st.button("🚀 Load Demo Data", type="primary", key="btn_demo_mode"):
    demo_transcript = (
        "Hello, thank you for having me today. My name is Alex, and I'm a software "
        "developer with over five years of experience building web applications. "
        "I studied computer science at State University, and since graduating, I've "
        "worked at two startups where I led the development of customer-facing dashboards "
        "using React and Python. In my last role, I managed a small team of three engineers "
        "and we increased platform performance by forty percent. I'm passionate about clean "
        "code and user-centered design. I'm excited about this opportunity because your "
        "company's mission aligns perfectly with my values. Thank you for considering my application."
    )

    st.session_state["video_analysis_result"] = {
        "status": "success",
        "duration_seconds": 62.0,
        "fps": 30.0,
        "resolution": "1920x1080",
        "movement_score": 35.0,
        "total_frames": 1860,
        "width": 1920,
        "height": 1080,
        "sample_frame_count": 62,
        "message": "Video analysis complete.",
    }

    st.session_state["camera_analysis_result"] = {
        "status": "success",
        "face_visible_percent": 95.0,
        "framing": "centered",
        "distance_feedback": "good_distance",
        "movement_level": "low",
        "camera_score": 82,
        "detector_used": "haar_cascade",
        "face_detected": True,
        "sampled_frames": 62,
        "faces_detected": 59,
        "face_center_x": 960,
        "face_center_y": 540,
        "face_width_ratio": 0.25,
        "face_height_ratio": 0.35,
        "warnings": [],
        "message": "Camera analysis complete.",
    }

    st.session_state["speech_result"] = {
        "status": "success",
        "word_count": 95,
        "words_per_minute": 142.0,
        "filler_word_count": 2,
        "repeated_word_count": 1,
        "speech_score": 78,
        "transcript": demo_transcript,
        "duration_seconds": 62.0,
        "filler_words_found": ["um", "uh"],
        "repeated_words": ["developer"],
        "warnings": [],
        "message": "Speech analysis complete.",
    }

    st.session_state["interview_question"] = "Tell me about yourself."
    st.session_state["target_role"] = "Software Developer"

    st.session_state["ai_result"] = {
        "status": "fallback",
        "answer_score": 80,
        "content_strengths": [
            "Good introduction — you opened with a greeting and self-introduction.",
            "Work experience is mentioned — good focus on practical background.",
            "Strong closing — you expressed interest and gratitude.",
            "Answer length is in a good range — concise yet informative.",
        ],
        "content_weak_points": [
            "Answer seems generic. Try to tailor it more to the Software Developer role.",
        ],
        "improved_answer": (
            "Connect your skills directly to the Software Developer role. "
            "Add specific technical achievements with metrics."
        ),
        "structure_feedback": (
            "Structure: Introduction ✓ | Background ✓ | Closing ✓ | "
            "Role relevance: 4/10 keywords matched."
        ),
        "next_content_task": (
            "Rewrite your answer using the improved structure above. "
            "Then record yourself again and compare the scores."
        ),
        "summary": (
            "Answer analysis (rule-based): Score 80/100. "
            "Strengths: 4. Weak points: 1. Model: fallback_rules."
        ),
        "model_used": "fallback_rules",
    }

    st.session_state["final_feedback"] = {
        "status": "success",
        "video_score": 79,
        "camera_score": 82,
        "speech_score": 78,
        "answer_score": 80,
        "overall_score": 79.5,
        "performance_level": "Good",
        "strengths": [
            "Good video presence and natural body movement.",
            "Strong camera presence — clear framing and good positioning.",
            "Speech is understandable with room for polish.",
            "Good answer structure and relevance.",
        ],
        "weak_points": [
            "No major weak points detected. Keep refining your delivery.",
        ],
        "next_practice_task": (
            "Practice reading a paragraph aloud at 130-150 WPM to build consistent pacing."
        ),
        "summary": (
            "Overall Performance: Good (79/100). Strengths: 4 identified. "
            "Areas to improve: 1. Next task: Practice reading a paragraph aloud at 130-150 WPM."
        ),
        "message": "Overall score calculated successfully.",
    }

    st.session_state["session_saved"] = False
    st.success("Demo data loaded! Navigate to Feedback, Dashboard, or History to explore.")

st.divider()

# ---------------------------------------------------------------------------
# Tech Stack
# ---------------------------------------------------------------------------
st.header("🛠️ Tech Stack")

tech_col1, tech_col2, tech_col3 = st.columns(3)

with tech_col1:
    st.markdown("**Frontend & App**")
    st.markdown("- Streamlit")
    st.markdown("- Python 3.12+")

with tech_col2:
    st.markdown("**AI & Analysis**")
    st.markdown("- OpenCV (video / camera)")
    st.markdown("- faster-whisper (speech)")
    st.markdown("- OpenAI-compatible LLM (content)")

with tech_col3:
    st.markdown("**Data & Reports**")
    st.markdown("- SQLite (local history)")
    st.markdown("- Pandas (dashboard)")
    st.markdown("- HTML / CSV export")

st.divider()

# ---------------------------------------------------------------------------
# Ethical Note
# ---------------------------------------------------------------------------
st.header("🛡️ Ethical Use")
st.markdown(
    """
    PitchPilot AI is designed as a **practice and self-improvement tool** only.

    - Use it to rehearse and refine your interview skills ahead of time.
    - Do **not** use this tool during live interviews or assessments.
    - The goal is to build genuine confidence, not to bypass evaluation.
    """
)

st.info(
    "🤝 **Fair Use Pledge:** This app is a coach, not a cheat sheet. "
    "Practice hard, show up prepared, and earn your success."
)

st.divider()

# ---------------------------------------------------------------------------
# Footer
# ---------------------------------------------------------------------------
st.caption("PitchPilot AI MVP | Built with Streamlit | Cross-platform ready")
