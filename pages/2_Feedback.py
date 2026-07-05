"""
PitchPilot AI - Feedback Page
=============================
Professional coaching report that aggregates analysis results
and displays structured feedback with a final performance score.
"""

import streamlit as st

from core.scoring_engine import calculate_overall_score
from core.ai_coach_agent import analyze_answer_with_ai
from core.database import save_practice_session
from core.ui_utils import (
    render_sidebar,
    inject_custom_css,
    render_page_header,
    render_footer,
    metric_card,
    section_card,
    status_badge,
    render_empty_state,
)

# ---------------------------------------------------------------------------
# Page configuration
# ---------------------------------------------------------------------------
st.set_page_config(page_title="Feedback | PitchPilot AI", page_icon="📝")

# ---------------------------------------------------------------------------
# Shared UI
# ---------------------------------------------------------------------------
inject_custom_css()
render_sidebar()

# ---------------------------------------------------------------------------
# Gather results from session state
# ---------------------------------------------------------------------------
vid_res = st.session_state.get("video_analysis_result")
cam_res = st.session_state.get("camera_analysis_result")
sp_res = st.session_state.get("speech_result")
final_fb = st.session_state.get("final_feedback")
ai_res = st.session_state.get("ai_result")

has_any_result = any(
    r is not None and r.get("status") == "success"
    for r in (vid_res, cam_res, sp_res)
)

# ---------------------------------------------------------------------------
# Page Header
# ---------------------------------------------------------------------------
render_page_header(
    "Coaching Report",
    "Review your session intelligence, communication scores, and coaching insights.",
    "📝",
)

if not has_any_result:
    render_empty_state(
        icon="📭",
        title="No Session Data",
        text="Upload a video on the Practice page and run the analyses, or load Demo Data from the Home page to see a sample coaching report.",
        action_label="🚀 Load Demo Data",
        action_page="app.py",
    )
    render_footer()
    st.stop()

# ---------------------------------------------------------------------------
# Session Summary Bar
# ---------------------------------------------------------------------------
st.markdown("#### Session Intelligence")
summary_cols = st.columns(4)
with summary_cols[0]:
    status = "Ready" if vid_res is not None and vid_res.get("status") == "success" else "Missing"
    badge_color = "success" if status == "Ready" else "danger"
    st.markdown(f"Video: {status_badge(status, badge_color)}", unsafe_allow_html=True)
with summary_cols[1]:
    status = "Ready" if cam_res is not None and cam_res.get("status") == "success" else "Missing"
    badge_color = "success" if status == "Ready" else "danger"
    st.markdown(f"Camera: {status_badge(status, badge_color)}", unsafe_allow_html=True)
with summary_cols[2]:
    status = "Ready" if sp_res is not None and sp_res.get("status") == "success" else "Missing"
    badge_color = "success" if status == "Ready" else "danger"
    st.markdown(f"Speech: {status_badge(status, badge_color)}", unsafe_allow_html=True)
with summary_cols[3]:
    status = "Ready" if ai_res is not None and ai_res.get("status") in ("success", "fallback") else "Missing"
    badge_color = "success" if status == "Ready" else "danger"
    st.markdown(f"AI Coach: {status_badge(status, badge_color)}", unsafe_allow_html=True)

st.divider()

# ---------------------------------------------------------------------------
# Video Analysis Feedback
# ---------------------------------------------------------------------------
if vid_res is not None and vid_res.get("status") == "success":
    with section_card("🎬 Video Intelligence", "Motion analysis and video metadata from OpenCV."):
        col1, col2, col3, col4 = st.columns(4)
        with col1:
            metric_card("Duration", f"{vid_res.get('duration_seconds', 0)} s", "seconds")
        with col2:
            metric_card("FPS", f"{vid_res.get('fps', 0)}", "frames per second")
        with col3:
            metric_card("Resolution", vid_res.get("resolution", "N/A"))
        with col4:
            metric_card("Movement", f"{vid_res.get('movement_score', 0)}", "lower is calmer")

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

# ---------------------------------------------------------------------------
# Camera Presence Feedback
# ---------------------------------------------------------------------------
if cam_res is not None and cam_res.get("status") == "success":
    with section_card("📷 Camera Presence", "Face detection, framing, distance, and positioning analysis."):
        c1, c2, c3, c4, c5 = st.columns(5)
        with c1:
            metric_card("Face Visible", f"{cam_res.get('face_visible_percent', 0)}%")
        with c2:
            metric_card("Framing", str(cam_res.get("framing", "unknown")).replace("_", " ").title())
        with c3:
            metric_card("Distance", str(cam_res.get("distance_feedback", "unknown")).replace("_", " ").title())
        with c4:
            metric_card("Movement", str(cam_res.get("movement_level", "unknown")).title())
        with c5:
            metric_card("Camera Score", f"{cam_res.get('camera_score', 0)}", "/100")

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

# ---------------------------------------------------------------------------
# Speech Analysis Feedback
# ---------------------------------------------------------------------------
if sp_res is not None and sp_res.get("status") == "success":
    with section_card("🎤 Speech Analytics", "Transcription, pacing, filler words, and delivery quality."):
        s1, s2, s3, s4, s5 = st.columns(5)
        with s1:
            metric_card("Words", sp_res.get("word_count", 0))
        with s2:
            metric_card("WPM", sp_res.get("words_per_minute", 0), "words per minute")
        with s3:
            metric_card("Fillers", sp_res.get("filler_word_count", 0))
        with s4:
            metric_card("Repeated", sp_res.get("repeated_word_count", 0))
        with s5:
            metric_card("Speech Score", f"{sp_res.get('speech_score', 0)}", "/100")

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

# ---------------------------------------------------------------------------
# AI Coach Agent Section
# ---------------------------------------------------------------------------
with section_card("🤖 AI Coach Mode", "Analyze your answer content for structure, relevance, and clarity."):
    # Pre-fill transcript from speech result if available
    default_transcript = ""
    if sp_res is not None and sp_res.get("status") == "success":
        default_transcript = sp_res.get("transcript", "")

    with st.form("ai_coach_form"):
        user_transcript = st.text_area(
            "Your Answer / Transcript",
            value=default_transcript,
            height=200,
            placeholder="Paste your answer here or run Speech Analysis to auto-fill...",
        )
        cq1, cq2 = st.columns(2)
        with cq1:
            interview_question = st.text_input(
                "Interview Question",
                value=st.session_state.get("interview_question", "Tell me about yourself."),
                placeholder="e.g., Tell me about yourself.",
            )
        with cq2:
            target_role = st.text_input(
                "Target Role",
                value=st.session_state.get("target_role", "Software Developer"),
                placeholder="e.g., Software Developer",
            )
        submitted = st.form_submit_button("🚀 Generate Coaching Insights")

    if not user_transcript.strip():
        st.info("Please run Speech Analysis or paste your answer manually to enable AI Coach.")

    if submitted:
        st.session_state["interview_question"] = interview_question
        st.session_state["target_role"] = target_role
        if not user_transcript.strip():
            st.warning("Please run Speech Analysis or paste your answer manually.")
        else:
            try:
                with st.spinner("Generating coaching insights..."):
                    ai_result = analyze_answer_with_ai(
                        transcript=user_transcript,
                        question=interview_question,
                        role=target_role,
                        speech_result=sp_res,
                        api_key=st.session_state.get("temp_ai_api_key"),
                        base_url=st.session_state.get("temp_ai_base_url"),
                        model=st.session_state.get("temp_ai_model"),
                    )
                st.session_state["ai_result"] = ai_result
            except Exception as exc:
                st.error(f"AI Coach failed: {exc}")
                st.session_state["ai_result"] = None

    # Display stored AI result
    ai_res = st.session_state.get("ai_result")
    if ai_res is not None:
        if ai_res.get("status") in ("success", "fallback"):
            if ai_res.get("status") == "fallback":
                st.info(
                    "AI Coach is running in **offline fallback mode** (no API key detected). "
                    "Set `PITCHPILOT_AI_API_KEY` for AI-powered analysis.  \n\n"
                    "Mode: **fallback_rules** | Model: fallback_rules"
                )
            else:
                st.success("AI Coach analysis complete via real AI API.")

            a1, a2, a3 = st.columns(3)
            with a1:
                metric_card("Answer Score", f"{ai_res.get('answer_score', 0)}", "/100")
            with a2:
                metric_card("Model", ai_res.get("model_used", "unknown"))
            with a3:
                mode_label = "real_ai" if ai_res.get("status") == "success" else ai_res.get("status", "unknown")
                metric_card("Mode", mode_label)

            st.markdown(f"**Structure Feedback:** {ai_res.get('structure_feedback', '')}")

            st.markdown("#### ✅ Content Strengths")
            for item in ai_res.get("content_strengths", []):
                st.success(item)

            st.markdown("#### 🔧 Content Weak Points")
            for item in ai_res.get("content_weak_points", []):
                st.warning(item)

            with st.expander("💡 Improved Answer"):
                st.write(ai_res.get("improved_answer", "[No suggestion available.]"))

            st.info(f"🎯 **Next Content Task:** {ai_res.get('next_content_task', '')}")

            with st.expander("📋 Coaching Summary"):
                st.write(ai_res.get("summary", ""))
        else:
            st.error(ai_res.get("message", "AI Coach returned an error."))

# ---------------------------------------------------------------------------
# Final Overall Score
# ---------------------------------------------------------------------------
with section_card("🏆 Final Performance Score", "Weighted aggregation of all four coaching dimensions."):
    all_success = (
        vid_res is not None and vid_res.get("status") == "success"
        and cam_res is not None and cam_res.get("status") == "success"
        and sp_res is not None and sp_res.get("status") == "success"
    )

    if not all_success:
        st.warning(
            "Run **all three analyses** (Video, Camera, Speech) on the Practice page "
            "to generate the final overall score."
        )
    else:
        ai_res = st.session_state.get("ai_result")
        if st.button("✨ Generate Final Performance Score", type="primary", key="btn_final_feedback"):
            try:
                with st.spinner("Calculating overall performance score..."):
                    result = calculate_overall_score(vid_res, cam_res, sp_res, ai_res)
                st.session_state["final_feedback"] = result
                st.session_state["session_saved"] = False
            except Exception as exc:
                st.error(f"Final feedback generation failed: {exc}")
                st.session_state["final_feedback"] = None

        final_fb = st.session_state.get("final_feedback")
        if final_fb is not None:
            if final_fb.get("status") == "success":
                st.success(final_fb.get("message", "Feedback generated."))

                overall = final_fb.get("overall_score", 0)
                level = final_fb.get("performance_level", "Unknown")

                # Highlighted score
                score_col, level_col = st.columns([1, 1])
                with score_col:
                    st.markdown(
                        f"""
                        <div class="pp-score-highlight">
                          <div class="pp-score-highlight__value">{overall}</div>
                          <div class="pp-score-highlight__label">Overall Score / 100</div>
                        </div>
                        """,
                        unsafe_allow_html=True,
                    )
                with level_col:
                    st.markdown(
                        f"""
                        <div class="pp-score-highlight" style="background:linear-gradient(135deg,#f0fdf4 0%,#dcfce7 100%);border-color:#86efac;">
                          <div class="pp-score-highlight__value" style="color:#15803d;">{level}</div>
                          <div class="pp-score-highlight__label" style="color:#16a34a;">Performance Level</div>
                        </div>
                        """,
                        unsafe_allow_html=True,
                    )

                st.markdown("#### Component Breakdown")
                b1, b2, b3, b4 = st.columns(4)
                with b1:
                    metric_card("Video", f"{final_fb.get('video_score', 0)}", "/100")
                with b2:
                    metric_card("Camera", f"{final_fb.get('camera_score', 0)}", "/100")
                with b3:
                    metric_card("Speech", f"{final_fb.get('speech_score', 0)}", "/100")
                with b4:
                    metric_card("Answer", f"{final_fb.get('answer_score', 0)}", "/100")

                st.divider()

                st.markdown("#### ✅ Strengths")
                for item in final_fb.get("strengths", []):
                    st.success(item)

                st.markdown("#### 🔧 Weak Points")
                for item in final_fb.get("weak_points", []):
                    st.warning(item)

                st.markdown("#### 🎯 Next Practice Task")
                st.info(final_fb.get("next_practice_task", "Keep practicing!"))

                with st.expander("📋 Full Coaching Summary"):
                    st.write(final_fb.get("summary", ""))

                # Save Session
                st.divider()
                if not st.session_state.get("session_saved", False):
                    if st.button("💾 Save Session to History", type="primary", key="btn_save_session"):
                        try:
                            with st.spinner("Saving session to database..."):
                                session_id = save_practice_session(
                                    video_result=vid_res,
                                    camera_result=cam_res,
                                    speech_result=sp_res,
                                    ai_result=ai_res,
                                    final_feedback=final_fb,
                                    video_filename=st.session_state.get("last_uploaded_name", ""),
                                )
                            st.session_state["session_saved"] = True
                            st.session_state["last_saved_session_id"] = session_id
                            st.success(f"Session saved successfully! ID: {session_id}")
                        except Exception as exc:
                            st.error(f"Failed to save session: {exc}")
                else:
                    saved_id = st.session_state.get("last_saved_session_id")
                    st.info(f"✅ This session has already been saved (ID: {saved_id}).")
            else:
                st.error(final_fb.get("message", "Final feedback generation returned an error."))

render_footer()
