"""
PitchPilot AI - History Page
============================
Browse, inspect, manage, and export saved practice sessions from the SQLite database.
"""

import streamlit as st

from core.database import get_all_sessions, delete_session
from core.ui_utils import render_sidebar
from reports.report_generator import (
    generate_html_report,
    generate_csv_report,
    build_report_filename,
)

# ---------------------------------------------------------------------------
# Page configuration
# ---------------------------------------------------------------------------
st.set_page_config(page_title="History | PitchPilot AI", page_icon="📚")

# ---------------------------------------------------------------------------
# Shared sidebar
# ---------------------------------------------------------------------------
render_sidebar()

# ---------------------------------------------------------------------------
# UI Header
# ---------------------------------------------------------------------------
st.title("📚 Session History")
st.markdown("Review, manage, and export your past practice sessions.")
st.divider()

# ---------------------------------------------------------------------------
# Load sessions
# ---------------------------------------------------------------------------
sessions = get_all_sessions(limit=100)

if not sessions:
    st.info(
        "No saved sessions yet. "
        "Go to the **Practice** page, run analyses, and save a session from the **Feedback** page. "
        "Or load demo data from the **Home** page."
    )
    st.stop()

# ---------------------------------------------------------------------------
# Session selector
# ---------------------------------------------------------------------------
session_labels = [
    f"#{s['id']} — {s.get('created_at', 'unknown')[:19]} — "
    f"{s.get('overall_score', 0):.0f}/100 ({s.get('performance_level', '')})"
    for s in sessions
]
selected_label = st.selectbox("Select a session", session_labels)
selected_index = session_labels.index(selected_label)
session = sessions[selected_index]

st.divider()

# ---------------------------------------------------------------------------
# Session details
# ---------------------------------------------------------------------------
st.subheader(f"Session #{session['id']}")
st.caption(f"Created: {session.get('created_at', 'unknown')}")

# Scores
c1, c2, c3, c4, c5 = st.columns(5)
c1.metric("Overall", f"{session.get('overall_score', 0)}/100")
c2.metric("Camera", session.get("camera_score", 0))
c3.metric("Speech", session.get("speech_score", 0))
c4.metric("Answer", session.get("answer_score", 0))
c5.metric("Performance", session.get("performance_level", "—"))

st.divider()

# Metadata
st.markdown("#### Session Info")
st.markdown(
    f"""
    | Property | Value |
    |----------|-------|
    | Video File | `{session.get('video_filename', 'N/A')}` |
    | Question | {session.get('interview_question', 'N/A')} |
    | Target Role | {session.get('target_role', 'N/A')} |
    | Duration | {session.get('duration_seconds', 0)} s |
    | Resolution | {session.get('resolution', 'N/A')} |
    | WPM | {session.get('words_per_minute', 0)} |
    | Filler Words | {session.get('filler_word_count', 0)} |
    | Repeated Words | {session.get('repeated_word_count', 0)} |
    | AI Model | {session.get('ai_model_used', 'N/A')} |
    """
)

st.divider()

# Transcript
with st.expander("📝 Transcript"):
    transcript = session.get("transcript", "")
    if transcript:
        st.text(transcript)
    else:
        st.write("No transcript available.")

# Strengths
st.markdown("#### ✅ Strengths")
strengths = session.get("strengths", [])
if strengths:
    for item in strengths:
        st.success(item)
else:
    st.write("No strengths recorded.")

# Weak points
st.markdown("#### 🔧 Weak Points")
weak_points = session.get("weak_points", [])
if weak_points:
    for item in weak_points:
        st.warning(item)
else:
    st.write("No weak points recorded.")

# Next task
st.markdown("#### 🎯 Next Practice Task")
st.info(session.get("next_practice_task", "Keep practicing!"))

# Summary
with st.expander("📋 Summary"):
    st.write(session.get("summary", "No summary available."))

st.divider()

# ---------------------------------------------------------------------------
# Export Reports
# ---------------------------------------------------------------------------
st.subheader("📥 Export Report")

html_content = generate_html_report(session)
csv_content = generate_csv_report(session)

html_filename = build_report_filename(session, "html")
csv_filename = build_report_filename(session, "csv")

col_html, col_csv = st.columns(2)

with col_html:
    st.download_button(
        label="Download HTML Report",
        data=html_content,
        file_name=html_filename,
        mime="text/html",
        key=f"dl_html_{session['id']}",
    )

with col_csv:
    st.download_button(
        label="Download CSV Report",
        data=csv_content,
        file_name=csv_filename,
        mime="text/csv",
        key=f"dl_csv_{session['id']}",
    )

st.divider()

# ---------------------------------------------------------------------------
# Delete button
# ---------------------------------------------------------------------------
with st.expander("🗑️ Delete Session"):
    st.warning("This action cannot be undone.")
    confirm = st.checkbox(f"I confirm I want to delete session #{session['id']}")
    if confirm and st.button("Delete", type="primary"):
        try:
            deleted = delete_session(session["id"])
            if deleted:
                st.success(f"Session #{session['id']} deleted.")
                st.rerun()
            else:
                st.error("Session could not be deleted (may not exist).")
        except Exception as exc:
            st.error(f"Delete failed: {exc}")

st.caption("History is stored locally in SQLite.")
