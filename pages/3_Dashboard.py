"""
PitchPilot AI - Dashboard Page
==============================
SaaS-style analytics dashboard showing progress metrics,
score comparisons, and trends from SQLite data.
"""

import pandas as pd
import streamlit as st

from core.database import get_dashboard_stats, get_all_sessions
from core.ui_utils import (
    render_sidebar,
    inject_custom_css,
    render_page_header,
    render_footer,
    metric_card,
    section_card,
    render_empty_state,
)

# ---------------------------------------------------------------------------
# Page configuration
# ---------------------------------------------------------------------------
st.set_page_config(page_title="Dashboard | PitchPilot AI", page_icon="📊")

# ---------------------------------------------------------------------------
# Shared UI
# ---------------------------------------------------------------------------
inject_custom_css()
render_sidebar()

# ---------------------------------------------------------------------------
# Page Header
# ---------------------------------------------------------------------------
render_page_header(
    "Progress Dashboard",
    "Track your improvement with session intelligence and trend analytics.",
    "📊",
)

# ---------------------------------------------------------------------------
# Load real stats from SQLite
# ---------------------------------------------------------------------------
stats = get_dashboard_stats()
sessions = get_all_sessions(limit=50)
has_sessions = len(sessions) > 0

# ---------------------------------------------------------------------------
# KPI Cards
# ---------------------------------------------------------------------------
with section_card("Key Performance Indicators"):
    k1, k2, k3, k4 = st.columns(4)
    with k1:
        metric_card("Total Sessions", f"{stats['total_sessions']}", "saved practice sessions")
    with k2:
        metric_card("Average Score", f"{stats['avg_overall_score']}", "/100 overall")
    with k3:
        metric_card("Best Score", f"{stats['best_score']}", "/100 overall")
    with k4:
        metric_card("Latest Score", f"{stats['latest_score']}", "/100 overall")

    k5, k6, k7, k8 = st.columns(4)
    with k5:
        metric_card("Avg Speech", f"{stats['avg_speech_score']}", "/100")
    with k6:
        metric_card("Avg Camera", f"{stats['avg_camera_score']}", "/100")
    with k7:
        metric_card("", "")
    with k8:
        metric_card("", "")

# ---------------------------------------------------------------------------
# Current Session Score (from state)
# ---------------------------------------------------------------------------
final_fb = st.session_state.get("final_feedback")

if final_fb is not None and final_fb.get("status") == "success":
    with section_card("Current Session Score", "Component breakdown for your most recent practice session."):
        d1, d2, d3, d4, d5 = st.columns(5)
        with d1:
            metric_card("Overall", f"{final_fb.get('overall_score', 0)}", "/100")
        with d2:
            metric_card("Video", f"{final_fb.get('video_score', 0)}", "/100")
        with d3:
            metric_card("Camera", f"{final_fb.get('camera_score', 0)}", "/100")
        with d4:
            metric_card("Speech", f"{final_fb.get('speech_score', 0)}", "/100")
        with d5:
            metric_card("Answer", f"{final_fb.get('answer_score', 0)}", "/100")

        st.markdown("**Component Comparison** — see how each dimension scored in this session.")
        component_data = pd.DataFrame({
            "Component": ["Video", "Camera", "Speech", "Answer"],
            "Score": [
                final_fb.get("video_score", 0),
                final_fb.get("camera_score", 0),
                final_fb.get("speech_score", 0),
                final_fb.get("answer_score", 0),
            ],
        })
        component_data = component_data.set_index("Component")
        st.bar_chart(component_data, width="stretch")

# ---------------------------------------------------------------------------
# Trend Chart
# ---------------------------------------------------------------------------
with section_card("Overall Score Trend", "Track how your overall performance changes across saved sessions."):
    if sessions:
        trend_df = pd.DataFrame(sessions)
        trend_df["created_at"] = pd.to_datetime(trend_df["created_at"], utc=True)
        trend_df = trend_df.sort_values("created_at")
        trend_df["Date"] = trend_df["created_at"].dt.date

        chart_df = trend_df.set_index("Date")[["overall_score"]].rename(
            columns={"overall_score": "Overall Score"}
        )
        st.line_chart(chart_df, width="stretch")
        st.caption("A rising trend means you are improving. Save more sessions to build this chart.")
    else:
        render_empty_state(
            icon="📉",
            title="No Trend Data Yet",
            text="Save a session from the Feedback page to start building your progress chart. Or load Demo Data to see a sample trend.",
        )

# ---------------------------------------------------------------------------
# Latest Session Breakdown
# ---------------------------------------------------------------------------
with section_card("Latest Session Breakdown", "Component scores from your most recently saved session."):
    latest = get_all_sessions(limit=1)
    if latest:
        latest = latest[0]
        latest_components = pd.DataFrame({
            "Component": ["Camera", "Speech", "Answer"],
            "Score": [
                latest.get("camera_score", 0),
                latest.get("speech_score", 0),
                latest.get("answer_score", 0),
            ],
        })
        st.bar_chart(latest_components.set_index("Component"), width="stretch")
    else:
        render_empty_state(
            icon="📊",
            title="No Session Breakdown",
            text="Complete a practice session, generate a final score, and save it to see the component breakdown.",
        )

# ---------------------------------------------------------------------------
# Saved Sessions Table
# ---------------------------------------------------------------------------
with section_card("Practice History", "All saved sessions with key metrics."):
    if sessions:
        display_df = pd.DataFrame(sessions)
        display_cols = [
            "id", "created_at", "video_filename", "interview_question",
            "target_role", "overall_score", "performance_level",
            "camera_score", "speech_score", "answer_score",
        ]
        display_cols = [c for c in display_cols if c in display_df.columns]
        st.dataframe(display_df[display_cols], width="stretch")
    else:
        render_empty_state(
            icon="📚",
            title="No Saved Sessions",
            text="Your practice history will appear here once you save sessions from the Feedback page.",
        )

# ---------------------------------------------------------------------------
# Insights
# ---------------------------------------------------------------------------
with section_card("Coaching Insights"):
    insights = [
        "Run all three analyses (Video, Camera, Speech) and save sessions to build your history.",
        "Consistent practice is the key to improvement in interviews.",
    ]
    if sessions:
        insights.insert(
            0,
            f"You have {stats['total_sessions']} saved session(s). "
            f"Average overall score: {stats['avg_overall_score']:.0f}/100."
        )
        if stats["best_score"] > 0:
            insights.insert(
                1,
                f"Your best score so far is {stats['best_score']:.0f}/100. Keep pushing!"
            )
    for insight in insights:
        st.info(insight)

render_footer()
