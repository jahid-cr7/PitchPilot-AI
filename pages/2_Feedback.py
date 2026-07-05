"""
PitchPilot AI - Feedback Page
=============================
Aggregates analysis results from session state (video, camera, speech, AI)
and displays them as structured feedback.

Includes a final scoring engine that combines all results into an
overall interview performance score.
"""

import streamlit as st

from core.scoring_engine import calculate_overall_score
from core.ai_coach_agent import analyze_answer_with_ai
from core.database import save_practice_session
from core.ui_utils import render_sidebar

# ---------------------------------------------------------------------------
# Page configuration
# ---------------------------------------------------------------------------
st.set_page_config(page_title="Feedback | PitchPilot AI", page_icon="📝")

# ---------------------------------------------------------------------------
# Shared sidebar
# ---------------------------------------------------------------------------
render_sidebar()

# ---------------------------------------------------------------------------
# UI Header
# ---------------------------------------------------------------------------
st.title("📝 Feedback")
st.markdown("Review feedback for your practice sessions.")
st.divider()

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

if not has_any_result:
    st.info(
        "No analysis results found. "
        "Go to the **Practice** page, upload a video, and run the analyses first. "
        "Or load demo data from the **Home** page."
    )
    st.stop()

# ---------------------------------------------------------------------------
# Video Analysis Feedback
# ---------------------------------------------------------------------------
if vid_res is not None and vid_res.get("status") == "success":
    with st.container(border=True):
        st.subheader("🎥 Video Analysis")
        col1, col2, col3, col4 = st.columns(4)
        col1.metric("Duration", f"{vid_res.get('duration_seconds', 0)} s")
        col2.metric("FPS", vid_res.get("fps", 0))
        col3.metric("Resolution", vid_res.get("resolution", "N/A"))
        col4.metric("Movement Score", vid_res.get("movement_score", 0))

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
    with st.container(border=True):
        st.subheader("📷 Camera Presence")
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

# ---------------------------------------------------------------------------
# Speech Analysis Feedback
# ---------------------------------------------------------------------------
if sp_res is not None and sp_res.get("status") == "success":
    with st.container(border=True):
        st.subheader("🎤 Speech Analysis")
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

# ---------------------------------------------------------------------------
# AI Coach Agent Section
# ---------------------------------------------------------------------------
with st.container(border=True):
    st.subheader("🤖 AI Coach")
    st.markdown("Analyze your answer content for structure, relevance, and clarity.")

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
        interview_question = st.text_input(
            "Interview Question",
            value=st.session_state.get("interview_question", "Tell me about yourself."),
            placeholder="e.g., Tell me about yourself.",
        )
        target_role = st.text_input(
            "Target Role",
            value=st.session_state.get("target_role", "Software Developer"),
            placeholder="e.g., Software Developer",
        )
        submitted = st.form_submit_button("🚀 Run AI Coach")

    if not user_transcript.strip():
        st.info("Please run Speech Analysis or paste your answer manually.")

    if submitted:
        st.session_state["interview_question"] = interview_question
        st.session_state["target_role"] = target_role
        if not user_transcript.strip():
            st.warning("Please run Speech Analysis or paste your answer manually.")
        else:
            try:
                with st.spinner("Analyzing answer content..."):
                    ai_result = analyze_answer_with_ai(
                        transcript=user_transcript,
                        question=interview_question,
                        role=target_role,
                        speech_result=sp_res,
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
                    "AI Coach is running in **fallback mode** (no API key detected). "
                    "Set `PITCHPILOT_AI_API_KEY` environment variable for AI-powered analysis.  \n\n"
                    "Mode: **fallback_rules** | Model: fallback_rules"
                )
            else:
                st.success("AI Coach analysis complete via real AI API.")

            a1, a2, a3 = st.columns(3)
            a1.metric("Answer Score", ai_res.get("answer_score", 0))
            a2.metric("Model Used", ai_res.get("model_used", "unknown"))
            mode_label = "real_ai" if ai_res.get("status") == "success" else ai_res.get("status", "unknown")
            a3.metric("Mode", mode_label)

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

            with st.expander("📋 Summary"):
                st.write(ai_res.get("summary", ""))
        else:
            st.error(ai_res.get("message", "AI Coach returned an error."))

# ---------------------------------------------------------------------------
# Final Overall Score
# ---------------------------------------------------------------------------
with st.container(border=True):
    st.subheader("🏆 Final Feedback")

    # Show Generate button only if all three analyses succeeded
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
        if st.button("✨ Generate Final Feedback", type="primary", key="btn_final_feedback"):
            try:
                with st.spinner("Calculating overall performance score..."):
                    result = calculate_overall_score(vid_res, cam_res, sp_res, ai_res)
                st.session_state["final_feedback"] = result
                # Reset saved flag so user can save the new result
                st.session_state["session_saved"] = False
            except Exception as exc:
                st.error(f"Final feedback generation failed: {exc}")
                st.session_state["final_feedback"] = None

        # Display stored final feedback
        final_fb = st.session_state.get("final_feedback")
        if final_fb is not None:
            if final_fb.get("status") == "success":
                st.success(final_fb.get("message", "Feedback generated."))

                # Big overall score — visually highlighted
                overall = final_fb.get("overall_score", 0)
                level = final_fb.get("performance_level", "Unknown")

                score_col, level_col = st.columns(2)
                score_col.metric("Overall Score", f"{overall}/100")
                level_col.metric("Performance Level", level)

                # Component score breakdown
                st.markdown("#### Component Breakdown")
                b1, b2, b3, b4 = st.columns(4)
                b1.metric("Video", final_fb.get("video_score", 0))
                b2.metric("Camera", final_fb.get("camera_score", 0))
                b3.metric("Speech", final_fb.get("speech_score", 0))
                b4.metric("Answer", final_fb.get("answer_score", 0))

                st.divider()

                # Strengths
                st.markdown("#### ✅ Strengths")
                for item in final_fb.get("strengths", []):
                    st.success(item)

                # Weak points
                st.markdown("#### 🔧 Weak Points")
                for item in final_fb.get("weak_points", []):
                    st.warning(item)

                # Next practice task
                st.markdown("#### 🎯 Next Practice Task")
                st.info(final_fb.get("next_practice_task", "Keep practicing!"))

                # Summary
                with st.expander("📋 Full Summary"):
                    st.write(final_fb.get("summary", ""))

                # -------------------------------------------------------------------
                # Save Session to Database
                # -------------------------------------------------------------------
                st.divider()
                if not st.session_state.get("session_saved", False):
                    if st.button("💾 Save Session", type="primary", key="btn_save_session"):
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

st.caption("Feedback is generated from your latest practice session analysis.")
