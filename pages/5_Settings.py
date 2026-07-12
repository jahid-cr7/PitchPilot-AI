"""
PitchPilot AI - Settings Page
==============================
AI Provider Settings and Health Check.
Allows users to view AI configuration, set temporary session API keys,
and test the AI provider connection safely.
"""

import os

import streamlit as st

from core.ai_coach_agent import test_ai_connection, OPENAI_AVAILABLE
from core.ui_utils import (
    render_sidebar,
    inject_custom_css,
    render_page_header,
    render_footer,
    metric_card,
    section_card,
    status_badge,
)

# ---------------------------------------------------------------------------
# Page configuration
# ---------------------------------------------------------------------------
st.set_page_config(page_title="Settings | PitchPilot AI", page_icon="⚙️")

# ---------------------------------------------------------------------------
# Shared UI
# ---------------------------------------------------------------------------
inject_custom_css()
render_sidebar()

# ---------------------------------------------------------------------------
# Page Header
# ---------------------------------------------------------------------------
render_page_header(
    "AI Provider Settings",
    "Configure your AI provider, test the connection, and manage temporary credentials.",
    "⚙️",
)

# ---------------------------------------------------------------------------
# Resolve current configuration
# ---------------------------------------------------------------------------
env_key = os.environ.get("PITCHPILOT_AI_API_KEY", "")
env_base_url = os.environ.get("PITCHPILOT_AI_BASE_URL", "")
env_model = os.environ.get("PITCHPILOT_AI_MODEL", "gpt-4o-mini")

temp_key = st.session_state.get("temp_ai_api_key")
temp_base_url = st.session_state.get("temp_ai_base_url")
temp_model = st.session_state.get("temp_ai_model")

effective_key = temp_key or env_key or ""
effective_base_url = temp_base_url or env_base_url or ""
effective_model = temp_model or env_model or "gpt-4o-mini"

has_key = bool(effective_key)
mode = "real_ai" if has_key and OPENAI_AVAILABLE else "fallback_rules"

# ---------------------------------------------------------------------------
# Status Card
# ---------------------------------------------------------------------------
with section_card("AI Provider Status"):
    s1, s2, s3, s4 = st.columns(4)
    with s1:
        metric_card("Current Mode", mode)
    with s2:
        metric_card("Model", effective_model)
    with s3:
        metric_card("Base URL", effective_base_url or "Default (OpenAI)")
    with s4:
        metric_card("API Key", "Configured" if has_key else "Not Set")

    st.info(
        "🔐 **Security Note:** API keys are read from environment variables or temporary "
        "session input only. They are **never saved to files, SQLite, or logs.**"
    )

    st.markdown("#### Library Status")
    if OPENAI_AVAILABLE:
        st.success("OpenAI client library is installed.")
    else:
        st.warning(
            "OpenAI client library is **not installed**. Install it with: `pip install openai`. "
            "The AI Coach will use rule-based fallback until it is installed."
        )

st.divider()

# ---------------------------------------------------------------------------
# Temporary Session Settings
# ---------------------------------------------------------------------------
with section_card("Temporary Session Settings"):
    st.markdown(
        "Use these fields to set a temporary API key for this browser session only. "
        "These values are stored in memory and disappear when you close the browser."
    )

    with st.form("ai_settings_form"):
        temp_api_key_input = st.text_input(
            "Temporary API Key",
            value=temp_key or "",
            type="password",
            placeholder="sk-...",
            help="Your OpenAI-compatible API key. Never shown after entry.",
        )
        temp_base_url_input = st.text_input(
            "Base URL",
            value=temp_base_url or env_base_url or "",
            placeholder="https://api.openai.com/v1",
            help="Optional. Leave empty for default OpenAI endpoint.",
        )
        temp_model_input = st.text_input(
            "Model Name",
            value=temp_model or env_model or "gpt-4o-mini",
            placeholder="gpt-4o-mini",
            help="The model ID to use for AI Coach analysis.",
        )
        save_settings = st.form_submit_button("💾 Save Temporary Settings", type="primary")

    st.info(
        "💡 **Provider hints:**\n"
        "- **OpenAI:** leave Base URL empty, use model `gpt-4o-mini`\n"
        "- **Gemini:** Base URL `https://generativelanguage.googleapis.com/v1beta/openai/`, use model `gemini-3.5-flash`\n"
        "- **Groq:** Base URL `https://api.groq.com/openai/v1`, use model `llama3-8b-8192`"
    )

    if save_settings:
        if temp_api_key_input.strip():
            st.session_state["temp_ai_api_key"] = temp_api_key_input.strip()
        else:
            st.session_state.pop("temp_ai_api_key", None)

        if temp_base_url_input.strip():
            st.session_state["temp_ai_base_url"] = temp_base_url_input.strip()
        else:
            st.session_state.pop("temp_ai_base_url", None)

        if temp_model_input.strip():
            st.session_state["temp_ai_model"] = temp_model_input.strip()
        else:
            st.session_state.pop("temp_ai_model", None)

        st.success("Temporary settings saved for this session.")
        st.rerun()

    # Show clear button if any temp settings exist
    if temp_key or temp_base_url or temp_model:
        if st.button("🗑️ Clear Temporary Settings", type="secondary"):
            for k in ("temp_ai_api_key", "temp_ai_base_url", "temp_ai_model"):
                st.session_state.pop(k, None)
            st.success("Temporary settings cleared.")
            st.rerun()

st.divider()

# ---------------------------------------------------------------------------
# Health Check
# ---------------------------------------------------------------------------
with section_card("AI Health Check"):
    st.markdown("Send a minimal test request to verify your AI provider connection.")

    if st.button("🧪 Test AI Connection", type="primary"):
        with st.spinner("Testing connection..."):
            result = test_ai_connection(
                api_key=st.session_state.get("temp_ai_api_key"),
                base_url=st.session_state.get("temp_ai_base_url"),
                model=st.session_state.get("temp_ai_model"),
            )

        if result["status"] == "success":
            st.success(result["message"])
        elif result["status"] == "fallback":
            st.info(result["message"])
        else:
            st.error(result["message"])

        st.markdown("#### Test Result Details")
        c1, c2, c3 = st.columns(3)
        with c1:
            metric_card("Status", result["status"])
        with c2:
            metric_card("Model Used", result["model_used"])
        with c3:
            metric_card("Mode", result["mode"])

render_footer()
