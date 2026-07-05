"""
core/ui_utils.py
================
Shared UI components for PitchPilot AI pages.
"""

import streamlit as st


def render_sidebar() -> None:
    """Render the shared sidebar with project info and navigation hints."""
    with st.sidebar:
        st.markdown("## 🎯 PitchPilot AI")
        st.markdown(
            """
            **AI Interview & Presentation Coach**

            Practice smarter. Get structured feedback.
            Track your improvement over time.
            """
        )
        st.divider()
        st.markdown("### 🧭 Navigation")
        st.markdown(
            """
            - **Practice** — Upload & analyze videos
            - **Feedback** — Review AI coaching results
            - **Dashboard** — Track progress & trends
            - **History** — Browse & export past sessions
            """
        )
        st.divider()
        st.markdown("**Version:** v1.0 MVP")
        st.caption("Built with Streamlit · Cross-platform ready")
