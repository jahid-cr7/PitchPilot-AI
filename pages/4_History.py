"""
PitchPilot AI - History Page
============================
Saved reports center for browsing, inspecting, managing,
and exporting saved practice sessions from the SQLite database.
"""

import streamlit as st

from core.database import get_all_sessions, delete_session
from core.ui_utils import (
    render_sidebar,
    inject_custom_css,
    render_page_header,
    render_footer,
    metric_card,
    section_card,
    render_empty_state,
    status_badge,
)
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
# Shared UI
# ---------------------------------------------------------------------------
inject_custom_css()
render_sidebar()

# ---------------------------------------------------------------------------
# Page Header
# ---------------------------------------------------------------------------
render_page_header(
    "Practice History",
    "Browse, inspect, and export your saved coaching sessions.",
    "📚",
)

# ---------------------------------------------------------------------------
# Load sessions
# ---------------------------------------------------------------------------
sessions = get_all_sessions(limit=100)

if not sessions:
    render_empty_state(
        icon="📭",
        title="No Saved Sessions",
        text="Go to the Practice page, run analyses, and save a session from the Feedback page. Or load Demo Data from the Home page.",
        action_label="🚀 Load Demo Data",
        action_page="app.py",
    )
    render_footer()
    st.stop()

# ---------------------------------------------------------------------------
# Session Selector
# ---------------------------------------------------------------------------
with section_card("Select a Session"):
    session_labels = [
        f"#{s['id']} — {s.get('created_at', 'unknown')[:19]} — "
        f"{s.get('overall_score', 0):.0f}/100 ({s.get('performance_level', '')})"
        for s in sessions
    ]
    selected_label = st.selectbox("Session", session_labels, label_visibility="collapsed")
    selected_index = session_labels.index(selected_label)
    session = sessions[selected_index]

# ---------------------------------------------------------------------------
# Session Detail Card
# ---------------------------------------------------------------------------
with section_card(f"Session #{session['id']} — Coaching Report", f"Created: {session.get('created_at', 'unknown')}"):
    # Score summary
    c1, c2, c3, c4, c5 = st.columns(5)
    with c1:
        metric_card("Overall", f"{session.get('overall_score', 0)}", "/100")
    with c2:
        metric_card("Camera", f"{session.get('camera_score', 0)}", "/100")
    with c3:
        metric_card("Speech", f"{session.get('speech_score', 0)}", "/100")
    with c4:
        metric_card("Answer", f"{session.get('answer_score', 0)}", "/100")
    with c5:
        perf = session.get("performance_level", "—")
        badge_html = status_badge(perf, "primary" if perf in ("Excellent", "Good") else "warning")
        st.markdown(f"<div style='text-align:center; margin-top:0.5rem;'><div style='font-size:0.75rem; font-weight:600; color:#64748b; margin-bottom:0.25rem;'>PERFORMANCE</div>{badge_html}</div>", unsafe_allow_html=True)

    st.divider()

    # Metadata
    st.markdown("#### Session Metadata")
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

# ---------------------------------------------------------------------------
# Transcript & Feedback
# ---------------------------------------------------------------------------
with section_card("Transcript & Feedback"):
    with st.expander("📝 Transcript"):
        transcript = session.get("transcript", "")
        if transcript:
            st.text(transcript)
        else:
            st.write("No transcript available.")

    st.markdown("#### ✅ Strengths")
    strengths = session.get("strengths", [])
    if strengths:
        for item in strengths:
            st.success(item)
    else:
        st.write("No strengths recorded.")

    st.markdown("#### 🔧 Weak Points")
    weak_points = session.get("weak_points", [])
    if weak_points:
        for item in weak_points:
            st.warning(item)
    else:
        st.write("No weak points recorded.")

    st.markdown("#### 🎯 Next Practice Task")
    st.info(session.get("next_practice_task", "Keep practicing!"))

    with st.expander("📋 Full Summary"):
        st.write(session.get("summary", "No summary available."))

# ---------------------------------------------------------------------------
# Export Reports
# ---------------------------------------------------------------------------
with section_card("Export Report"):
    html_content = generate_html_report(session)
    csv_content = generate_csv_report(session)

    html_filename = build_report_filename(session, "html")
    csv_filename = build_report_filename(session, "csv")

    col_html, col_csv = st.columns(2)
    with col_html:
        st.download_button(
            label="📄 Download HTML Report",
            data=html_content,
            file_name=html_filename,
            mime="text/html",
            key=f"dl_html_{session['id']}",
            use_container_width=True,
        )
    with col_csv:
        st.download_button(
            label="📊 Download CSV Report",
            data=csv_content,
            file_name=csv_filename,
            mime="text/csv",
            key=f"dl_csv_{session['id']}",
            use_container_width=True,
        )

# ---------------------------------------------------------------------------
# Danger Zone — Delete Session
# ---------------------------------------------------------------------------
st.divider()
st.markdown("<p style='color:#991b1b; font-weight:700; font-size:0.9rem;'>⚠️ Danger Zone</p>", unsafe_allow_html=True)

with st.container(border=True):
    st.warning("Deleting a session is permanent and cannot be undone.")
    confirm = st.checkbox(f"I confirm I want to delete session #{session['id']}")
    if confirm and st.button("🗑️ Delete Session", type="primary"):
        try:
            deleted = delete_session(session["id"])
            if deleted:
                st.success(f"Session #{session['id']} deleted.")
                st.rerun()
            else:
                st.error("Session could not be deleted (may not exist).")
        except Exception as exc:
            st.error(f"Delete failed: {exc}")

render_footer()
