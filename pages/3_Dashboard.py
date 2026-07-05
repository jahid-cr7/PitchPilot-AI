"""
PitchPilot AI - Dashboard Page
==============================
Shows progress metrics, score comparisons, and trends from SQLite data.
"""

import datetime

import pandas as pd
import streamlit as st

from core.database import get_dashboard_stats, get_all_sessions
from core.ui_utils import render_sidebar

# ---------------------------------------------------------------------------
# Page configuration
# ---------------------------------------------------------------------------
st.set_page_config(page_title="Dashboard | PitchPilot AI", page_icon="📊")

# ---------------------------------------------------------------------------
# Shared sidebar
# ---------------------------------------------------------------------------
render_sidebar()

# ---------------------------------------------------------------------------
# UI Header
# ---------------------------------------------------------------------------
st.title("📊 Dashboard")
st.markdown("Track your progress and view trends across practice sessions.")
st.divider()

# ---------------------------------------------------------------------------
# Load real stats from SQLite
# ---------------------------------------------------------------------------
stats = get_dashboard_stats()
sessions = get_all_sessions(limit=50)
has_sessions = len(sessions) > 0

# ---------------------------------------------------------------------------
# Final score highlight (from current session state or latest DB)
# ---------------------------------------------------------------------------
final_fb = st.session_state.get("final_feedback")
ai_res = st.session_state.get("ai_result")

if final_fb is not None and final_fb.get("status") == "success":
    with st.container(border=True):
        st.subheader("🏆 Current Session Score")
        d1, d2, d3, d4, d5 = st.columns(5)
        d1.metric("Overall", f"{final_fb.get('overall_score', 0)}/100")
        d2.metric("Video", final_fb.get("video_score", 0))
        d3.metric("Camera", final_fb.get("camera_score", 0))
        d4.metric("Speech", final_fb.get("speech_score", 0))
        d5.metric("Answer", final_fb.get("answer_score", 0))

        # Bar chart: component comparison for current session
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
        st.divider()

# ---------------------------------------------------------------------------
# KPI metrics from database
# ---------------------------------------------------------------------------
st.subheader("Key Metrics")

kpi1, kpi2, kpi3, kpi4 = st.columns(4)
kpi1.metric("Total Sessions", stats["total_sessions"])
kpi2.metric("Avg Overall Score", f"{stats['avg_overall_score']}/100")
kpi3.metric("Best Score", f"{stats['best_score']}/100")
kpi4.metric("Latest Score", f"{stats['latest_score']}/100")

kpi5, kpi6 = st.columns(2)
kpi5.metric("Avg Speech Score", f"{stats['avg_speech_score']}/100")
kpi6.metric("Avg Camera Score", f"{stats['avg_camera_score']}/100")

st.divider()

# ---------------------------------------------------------------------------
# Overall score trend from real data
# ---------------------------------------------------------------------------
st.subheader("Overall Score Trend Over Time")
st.caption(
    "This chart shows how your overall performance score changes across saved sessions. "
    "A rising trend means you're improving."
)

if sessions:
    trend_df = pd.DataFrame(sessions)
    # created_at is ISO string; convert to datetime then date
    trend_df["created_at"] = pd.to_datetime(trend_df["created_at"], utc=True)
    trend_df = trend_df.sort_values("created_at")
    trend_df["Date"] = trend_df["created_at"].dt.date

    chart_df = trend_df.set_index("Date")[["overall_score"]].rename(
        columns={"overall_score": "Overall Score"}
    )
    st.line_chart(chart_df, width="stretch")
else:
    st.info("No saved sessions yet. Save a session from the Feedback page to see trends.")

st.divider()

# ---------------------------------------------------------------------------
# Latest saved session component breakdown
# ---------------------------------------------------------------------------
st.subheader("Latest Saved Session Breakdown")
st.caption(
    "This bar chart compares the component scores from your most recently saved session."
)

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
    st.info("Save a session to see the component breakdown.")

st.divider()

# ---------------------------------------------------------------------------
# Saved sessions table
# ---------------------------------------------------------------------------
st.subheader("Saved Sessions")

if sessions:
    display_df = pd.DataFrame(sessions)
    display_cols = [
        "id", "created_at", "video_filename", "interview_question",
        "target_role", "overall_score", "performance_level",
        "camera_score", "speech_score", "answer_score",
    ]
    # Only include columns that exist
    display_cols = [c for c in display_cols if c in display_df.columns]
    st.dataframe(display_df[display_cols], width="stretch")
else:
    st.info("No saved sessions yet. Complete analyses and save from the Feedback page.")

st.divider()

# ---------------------------------------------------------------------------
# Insights
# ---------------------------------------------------------------------------
st.subheader("💡 Insights")
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

st.caption("Dashboard metrics are computed from your saved session history.")
