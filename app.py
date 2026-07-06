"""
PitchPilot AI - Main Entry Point
================================
Streamlit multipage app for AI-powered interview and presentation coaching.
Startup-style landing page with SaaS-quality polish.
"""

import streamlit as st

from core.database import init_db
from core.ui_utils import (
    render_sidebar,
    inject_custom_css,
    render_page_header,
    render_footer,
    status_badge,
    render_badges,
    render_workflow_steps,
)

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
# Shared UI
# ---------------------------------------------------------------------------
inject_custom_css()
render_sidebar()

# ---------------------------------------------------------------------------
# Hero Section
# ---------------------------------------------------------------------------
st.markdown(
    """
    <div class="pp-hero">
      <h1>🎯 PitchPilot AI</h1>
      <p>Practice smarter with role-based modes, a curated interview question bank, and random question practice.</p>
    </div>
    """,
    unsafe_allow_html=True,
)

# Badges
render_badges([
    ("MVP", "info"),
    ("Offline Fallback", "success"),
    ("API-Ready", "warning"),
    ("Local SQLite", "neutral"),
    ("Ethical Practice Tool", "neutral"),
])

# ---------------------------------------------------------------------------
# CTAs
# ---------------------------------------------------------------------------
c1, c2, c3 = st.columns(3)
with c1:
    if st.button("🚀 Start Practice", type="primary", width="stretch"):
        st.switch_page("pages/1_Practice.py")
with c2:
    if st.button("📊 View Dashboard", type="secondary", width="stretch"):
        st.switch_page("pages/3_Dashboard.py")
with c3:
    if st.button("🧪 Load Demo Data", type="secondary", width="stretch"):
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
# Value Proposition
# ---------------------------------------------------------------------------
render_page_header("Why PitchPilot AI?", "Turn practice into measurable progress.")

vp1, vp2, vp3, vp4 = st.columns(4)
with vp1:
    with st.container(border=True):
        st.markdown("### 🤖 AI Coaching")
        st.markdown("Get structured feedback on your answer content, structure, and relevance.")
with vp2:
    with st.container(border=True):
        st.markdown("### 📹 Multimodal Feedback")
        st.markdown("Analyze body language, camera presence, speech clarity, and content in one place.")
with vp3:
    with st.container(border=True):
        st.markdown("### 📈 Progress Tracking")
        st.markdown("Save sessions, view trend charts, and watch your scores improve over time.")
with vp4:
    with st.container(border=True):
        st.markdown("### 📥 Export Reports")
        st.markdown("Download HTML or CSV reports to share with coaches or mentors.")

st.divider()

# ---------------------------------------------------------------------------
# How It Works
# ---------------------------------------------------------------------------
render_page_header("How It Works", "From upload to insight in four steps.")

render_workflow_steps(
    steps=[
        {"key": "upload", "label": "Upload Video", "done": False},
        {"key": "analyze", "label": "Run Analyses", "done": False},
        {"key": "coach", "label": "AI Coach", "done": False},
        {"key": "track", "label": "Track Progress", "done": False},
    ],
    current_step="upload",
)

hw1, hw2, hw3, hw4 = st.columns(4)
with hw1:
    with st.container(border=True):
        st.markdown("**1. Upload or Load Demo**")
        st.caption("Upload an MP4 interview video or use Demo Mode for instant testing.")
with hw2:
    with st.container(border=True):
        st.markdown("**2. Run Analyses**")
        st.caption("Video motion, camera presence, and speech transcription run locally.")
with hw3:
    with st.container(border=True):
        st.markdown("**3. AI Coach Review**")
        st.caption("Enter your question and role. The AI scores your answer structure and relevance.")
with hw4:
    with st.container(border=True):
        st.markdown("**4. Track & Export**")
        st.caption("Generate a final score, save the session, and export reports.")

st.divider()

# ---------------------------------------------------------------------------
# Feature Cards
# ---------------------------------------------------------------------------
render_page_header("Feature Overview", "Everything you need to level up your interviews.")

f1, f2, f3 = st.columns(3)
with f1:
    with st.container(border=True):
        st.markdown("### 🎬 Video Intelligence")
        st.markdown("OpenCV-powered motion analysis, duration, FPS, and resolution extraction.")
with f2:
    with st.container(border=True):
        st.markdown("### 📷 Camera Presence")
        st.markdown("Face detection, framing analysis, distance feedback, and movement scoring.")
with f3:
    with st.container(border=True):
        st.markdown("### 🎤 Speech Analytics")
        st.markdown("faster-whisper transcription with WPM, filler words, and repetition counts.")

f4, f5, f6 = st.columns(3)
with f4:
    with st.container(border=True):
        st.markdown("### 🤖 AI Coach Mode")
        st.markdown("LLM-powered content analysis with intelligent offline fallback.")
with f5:
    with st.container(border=True):
        st.markdown("### 📊 Progress Dashboard")
        st.markdown("Trend charts, KPIs, and component breakdowns from your session history.")
with f6:
    with st.container(border=True):
        st.markdown("### 📥 Report Export")
        st.markdown("Professional HTML and CSV reports for sharing and archiving.")

f7, f8, f9 = st.columns(3)
with f7:
    with st.container(border=True):
        st.markdown("### 🎯 Question Bank")
        st.markdown("Curated interview questions for 7 practice modes: Software, AI/ML, Data, University, Presentation, Sales, and Behavioral.")
with f8:
    with st.container(border=True):
        st.markdown("### 🎲 Random Question")
        st.markdown("Pick a random question from your selected mode to keep practice sessions fresh.")
with f9:
    with st.container(border=True):
        st.markdown("### ⚙️ AI Settings")
        st.markdown("Configure AI provider, test connections, and manage temporary API keys.")

st.divider()

# ---------------------------------------------------------------------------
# Use Cases
# ---------------------------------------------------------------------------
render_page_header("Built For", "Who can benefit from PitchPilot AI?")

uc1, uc2, uc3, uc4, uc5 = st.columns(5)
with uc1:
    with st.container(border=True):
        st.markdown("**🎓 Students**")
        st.caption("Prepare for campus placements and internship interviews with objective feedback.")
with uc2:
    with st.container(border=True):
        st.markdown("**💼 Job Seekers**")
        st.caption("Practice common questions, refine answers, and build confidence before the real interview.")
with uc3:
    with st.container(border=True):
        st.markdown("**📢 Sales Teams**")
        st.caption("Rehearse pitches, improve delivery, and track presentation skills over time.")
with uc4:
    with st.container(border=True):
        st.markdown("**🏫 Teachers**")
        st.caption("Coach students on public speaking with structured, repeatable feedback.")
with uc5:
    with st.container(border=True):
        st.markdown("**🏢 Career Centers**")
        st.caption("Provide scalable interview coaching with session history and exportable reports.")

st.divider()

# ---------------------------------------------------------------------------
# Tech Stack
# ---------------------------------------------------------------------------
render_page_header("Tech Stack", "Modern, modular, and cross-platform.")

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
render_page_header("Ethical Use", "Designed for practice, not live interview cheating.")

st.markdown(
    """
    PitchPilot AI is a **practice and self-improvement tool** only.

    - Use it to rehearse and refine your interview skills ahead of time.
    - Do **not** use this tool during live interviews or assessments.
    - The goal is to build genuine confidence, not to bypass evaluation.
    """
)

st.info(
    "🤝 **Fair Use Pledge:** This app is a coach, not a cheat sheet. "
    "Practice hard, show up prepared, and earn your success."
)

render_footer()
