"""
core/ui_utils.py
================

Shared UI helpers for PitchPilot AI.

This file contains reusable Streamlit UI components used across the app:
- CSS injection
- Sidebar
- Page headers
- Metric cards
- Section cards
- Status badges
- Workflow steps
- Footer

Important:
- This file does not change analysis logic.
- This file only improves visual presentation.
"""

from __future__ import annotations

from html import escape
from typing import Optional, Sequence, Union

import streamlit as st


# ---------------------------------------------------------------------------
# Global CSS
# ---------------------------------------------------------------------------
def inject_global_css() -> None:
    """
    Inject global startup/SaaS-style CSS.

    This function is safe to call on every page.
    """
    st.markdown(
        """
        <style>
        :root {
            --pp-bg: #f8fafc;
            --pp-card: #ffffff;
            --pp-text: #0f172a;
            --pp-muted: #64748b;
            --pp-border: rgba(148, 163, 184, 0.28);
            --pp-primary: #2563eb;
            --pp-primary-dark: #1d4ed8;
            --pp-purple: #7c3aed;
            --pp-success: #16a34a;
            --pp-warning: #d97706;
            --pp-danger: #dc2626;
            --pp-shadow: 0 12px 35px rgba(15, 23, 42, 0.08);
            --pp-soft-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
            --pp-radius: 18px;
        }

        .block-container {
            padding-top: 2rem;
            padding-bottom: 3rem;
            max-width: 1180px;
        }

        h1, h2, h3 {
            letter-spacing: -0.03em;
        }

        .pp-hero {
            border-radius: 28px;
            padding: 2.5rem;
            background:
                radial-gradient(circle at top left, rgba(255,255,255,0.28), transparent 32%),
                linear-gradient(135deg, #0f172a 0%, #1d4ed8 52%, #7c3aed 100%);
            color: white;
            box-shadow: 0 24px 70px rgba(30, 64, 175, 0.28);
            margin-bottom: 1.5rem;
        }

        .pp-hero h1 {
            color: white;
            font-size: clamp(2.1rem, 5vw, 4rem);
            line-height: 1.05;
            margin-bottom: 0.75rem;
        }

        .pp-hero p {
            color: rgba(255,255,255,0.88);
            font-size: 1.08rem;
            max-width: 760px;
            margin-bottom: 0;
        }

        .pp-card {
            border: 1px solid var(--pp-border);
            border-radius: var(--pp-radius);
            padding: 1.25rem;
            background: var(--pp-card);
            box-shadow: var(--pp-soft-shadow);
            margin-bottom: 1rem;
        }

        .pp-section-card {
            border: 1px solid var(--pp-border);
            border-radius: 22px;
            padding: 1.35rem;
            background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
            box-shadow: var(--pp-soft-shadow);
            margin: 1rem 0;
        }

        .pp-section-card h3 {
            margin: 0 0 0.35rem 0;
            color: var(--pp-text);
        }

        .pp-section-card p {
            margin: 0;
            color: var(--pp-muted);
        }

        .pp-metric-card {
            border: 1px solid var(--pp-border);
            border-radius: 18px;
            padding: 1.15rem;
            background: #ffffff;
            box-shadow: var(--pp-soft-shadow);
            height: 100%;
        }

        .pp-metric-label {
            color: var(--pp-muted);
            font-size: 0.86rem;
            font-weight: 600;
            margin-bottom: 0.35rem;
        }

        .pp-metric-value {
            color: var(--pp-text);
            font-size: 1.75rem;
            font-weight: 800;
            line-height: 1.1;
        }

        .pp-metric-helper {
            color: var(--pp-muted);
            font-size: 0.82rem;
            margin-top: 0.45rem;
        }

        .pp-badge {
            display: inline-flex;
            align-items: center;
            gap: 0.35rem;
            padding: 0.28rem 0.7rem;
            border-radius: 999px;
            font-size: 0.78rem;
            font-weight: 700;
            margin: 0.15rem 0.2rem 0.15rem 0;
            border: 1px solid transparent;
            white-space: nowrap;
        }

        .pp-badge-neutral {
            background: #f1f5f9;
            color: #334155;
            border-color: #e2e8f0;
        }

        .pp-badge-success {
            background: #ecfdf5;
            color: #047857;
            border-color: #bbf7d0;
        }

        .pp-badge-warning {
            background: #fffbeb;
            color: #b45309;
            border-color: #fde68a;
        }

        .pp-badge-danger {
            background: #fef2f2;
            color: #b91c1c;
            border-color: #fecaca;
        }

        .pp-badge-info {
            background: #eff6ff;
            color: #1d4ed8;
            border-color: #bfdbfe;
        }

        .pp-workflow {
            display: flex;
            flex-wrap: wrap;
            align-items: center;
            gap: 0.6rem;
            margin: 1rem 0 1.25rem 0;
        }

        .pp-step {
            display: inline-flex;
            align-items: center;
            gap: 0.45rem;
            padding: 0.55rem 0.85rem;
            border-radius: 999px;
            border: 1px solid var(--pp-border);
            background: #ffffff;
            color: #475569;
            font-size: 0.86rem;
            font-weight: 700;
            box-shadow: 0 4px 14px rgba(15, 23, 42, 0.04);
        }

        .pp-step-active {
            background: linear-gradient(135deg, #2563eb, #7c3aed);
            color: white;
            border-color: transparent;
        }

        .pp-step-done {
            background: #ecfdf5;
            color: #047857;
            border-color: #bbf7d0;
        }

        .pp-footer {
            color: var(--pp-muted);
            font-size: 0.85rem;
            text-align: center;
            padding: 2rem 0 0.5rem 0;
            border-top: 1px solid rgba(148, 163, 184, 0.2);
            margin-top: 2rem;
        }

        .pp-empty {
            border: 1px dashed rgba(148, 163, 184, 0.55);
            border-radius: 22px;
            padding: 1.5rem;
            background: #f8fafc;
            text-align: center;
            color: #475569;
            margin: 1rem 0;
        }

        .pp-danger-zone {
            border: 1px solid #fecaca;
            border-radius: 18px;
            padding: 1rem;
            background: #fef2f2;
            margin-top: 1rem;
        }

        div[data-testid="stMetric"] {
            background: #ffffff;
            border: 1px solid rgba(148, 163, 184, 0.24);
            padding: 1rem;
            border-radius: 16px;
            box-shadow: 0 6px 18px rgba(15, 23, 42, 0.04);
        }

        section[data-testid="stSidebar"] {
            border-right: 1px solid rgba(148, 163, 184, 0.18);
        }

        .stButton > button {
            border-radius: 999px;
            font-weight: 700;
            border: 1px solid rgba(37, 99, 235, 0.18);
        }

        .stDownloadButton > button {
            border-radius: 999px;
            font-weight: 700;
        }

        textarea {
            border-radius: 16px !important;
        }

        @media (max-width: 768px) {
            .pp-hero {
                padding: 1.5rem;
                border-radius: 22px;
            }

            .pp-workflow {
                gap: 0.45rem;
            }

            .pp-step {
                font-size: 0.78rem;
                padding: 0.45rem 0.65rem;
            }
        }
        </style>
        """,
        unsafe_allow_html=True,
    )


def inject_custom_css() -> None:
    """
    Backward-compatible CSS injector.

    Some pages call inject_custom_css().
    The main implementation lives in inject_global_css().
    """
    inject_global_css()


# ---------------------------------------------------------------------------
# Sidebar
# ---------------------------------------------------------------------------
def render_sidebar() -> None:
    """Render the shared sidebar used across pages."""
    with st.sidebar:
        st.markdown("## 🎙️ PitchPilot AI")
        st.caption("AI communication coach for interview and presentation practice.")

        st.markdown(
            """
            <div style="margin: 0.75rem 0 1rem 0;">
                <span class="pp-badge pp-badge-info">MVP</span>
                <span class="pp-badge pp-badge-success">Offline fallback</span>
                <span class="pp-badge pp-badge-neutral">API-ready</span>
                <span class="pp-badge pp-badge-neutral">Local SQLite</span>
            </div>
            """,
            unsafe_allow_html=True,
        )

        st.divider()

        st.markdown("### Workspace")
        st.markdown(
            """
            - 🏠 **Home** — product overview and demo mode  
            - 🎬 **Practice** — upload and analyze a session  
            - 📝 **Feedback** — AI coach and final score  
            - 📊 **Dashboard** — progress analytics  
            - 🗂️ **History** — saved reports and exports  
            - ⚙️ **Settings** — AI provider and configuration  
            """
        )

        st.divider()

        st.markdown("### Recommended Flow")
        st.markdown(
            """
            1. Upload video or load demo  
            2. Run video/camera/speech analysis  
            3. Run AI Coach  
            4. Generate final feedback  
            5. Save and export report  
            """
        )

        st.divider()
        st.caption("Version: v1.0 MVP")
        st.caption("Designed for practice, not live interview cheating.")


# ---------------------------------------------------------------------------
# Page Header
# ---------------------------------------------------------------------------
def render_page_header(title: str, subtitle: str = "", icon: str = "✨") -> None:
    """Render a consistent page header."""
    safe_title = escape(title)
    safe_subtitle = escape(subtitle)

    st.markdown(
        f"""
        <div class="pp-section-card">
            <h2>{icon} {safe_title}</h2>
            <p>{safe_subtitle}</p>
        </div>
        """,
        unsafe_allow_html=True,
    )


# ---------------------------------------------------------------------------
# Cards and badges
# ---------------------------------------------------------------------------
def metric_card(label: str, value: Union[str, int, float], helper_text: Optional[str] = None) -> None:
    """Render a custom metric card."""
    safe_label = escape(str(label))
    safe_value = escape(str(value))
    helper_html = ""

    if helper_text:
        helper_html = f'<div class="pp-metric-helper">{escape(str(helper_text))}</div>'

    st.markdown(
        f"""
        <div class="pp-metric-card">
            <div class="pp-metric-label">{safe_label}</div>
            <div class="pp-metric-value">{safe_value}</div>
            {helper_html}
        </div>
        """,
        unsafe_allow_html=True,
    )


def section_card(title: str, description: Optional[str] = None):
    """
    Render a bordered section card and return its Streamlit container.

    Supports:
    - section_card("Title", "Description")
    - with section_card("Title", "Description"):
          st.write("content")
    """
    container = st.container(border=True)
    with container:
        st.markdown(f"### {escape(str(title))}")
        if description:
            st.caption(str(description))
    return container


def status_badge(text: str, status: str = "neutral") -> None:
    """
    Render a status badge.

    Supported statuses:
    - neutral
    - success
    - warning
    - danger
    - info
    """
    allowed = {"neutral", "success", "warning", "danger", "info"}
    badge_status = status if status in allowed else "neutral"
    safe_text = escape(text)

    st.markdown(
        f"""
        <span class="pp-badge pp-badge-{badge_status}">{safe_text}</span>
        """,
        unsafe_allow_html=True,
    )


def render_badges(items) -> None:
    """
    Render multiple badges.

    Supports:
    - ["MVP", "API-ready"]
    - [("MVP", "info"), ("API-ready", "success")]
    - [{"text": "MVP", "status": "info"}]
    """
    html_parts = []
    allowed = {"neutral", "success", "warning", "danger", "info"}

    for item in items:
        if isinstance(item, tuple) and len(item) == 2:
            text, status = item
        elif isinstance(item, dict):
            text = item.get("text", "")
            status = item.get("status", "neutral")
        else:
            text = str(item)
            status = "neutral"

        badge_status = status if status in allowed else "neutral"
        html_parts.append(
            f'<span class="pp-badge pp-badge-{badge_status}">{escape(str(text))}</span>'
        )

    st.markdown("".join(html_parts), unsafe_allow_html=True)


# ---------------------------------------------------------------------------
# Workflow steps
# ---------------------------------------------------------------------------
def render_workflow_steps(steps=None, current_step=None) -> None:
    """
    Render workflow steps.

    Supports:
    - render_workflow_steps(current_step="upload")
    - render_workflow_steps(workflow_steps, current_step=current_step)
    - string, tuple, and dict step formats
    """

    default_steps = [
        ("upload", "Upload", False),
        ("video", "Video", False),
        ("camera", "Camera", False),
        ("speech", "Speech", False),
        ("feedback", "Feedback", False),
    ]

    # Backward compatibility:
    # If first argument looks like current_step instead of steps
    if isinstance(steps, (int, str)) and current_step is None:
        current_step = steps
        steps = None

    normalized_steps = []

    if steps is None:
        normalized_steps = default_steps
    else:
        for item in steps:
            try:
                if isinstance(item, dict):
                    label = str(item.get("label", item.get("key", "Step")))
                    key = str(item.get("key", label.lower().strip().replace(" ", "_")))
                    done = bool(item.get("done", False))
                elif isinstance(item, tuple) and len(item) >= 2:
                    key = str(item[0])
                    label = str(item[1])
                    done = bool(item[2]) if len(item) >= 3 else False
                else:
                    label = str(item)
                    key = label.lower().strip().replace(" ", "_")
                    done = False

                normalized_steps.append((key.lower(), label, done))
            except Exception:
                normalized_steps.append(("step", "Step", False))

    active_index = None

    if isinstance(current_step, int):
        active_index = current_step
    elif isinstance(current_step, str):
        current_lower = current_step.lower().strip()
        for index, (key, label, done) in enumerate(normalized_steps):
            if current_lower == key.lower() or current_lower == label.lower():
                active_index = index
                break

    html_parts = ['<div class="pp-workflow">']

    for index, (key, label, done) in enumerate(normalized_steps):
        css_class = "pp-step"

        if done:
            css_class += " pp-step-done"
        elif active_index is not None:
            if index < active_index:
                css_class += " pp-step-done"
            elif index == active_index:
                css_class += " pp-step-active"

        number = index + 1
        html_parts.append(
            f'<span class="{css_class}"><strong>{number}</strong> {escape(str(label))}</span>'
        )

    html_parts.append("</div>")
    st.markdown("".join(html_parts), unsafe_allow_html=True)


# ---------------------------------------------------------------------------
# Empty state and footer
# ---------------------------------------------------------------------------
def render_empty_state(
    title: str = "No data yet",
    description: Optional[str] = None,
    action_hint: Optional[str] = None,
    icon: str = "🧭",
    text: Optional[str] = None,
    action_label: Optional[str] = None,
    **kwargs,
) -> None:
    """
    Render a polished empty state block.

    Supports old and new call styles:
    - description="..."
    - text="..."
    - action_hint="..."
    - action_label="..."
    """
    body_text = description or text or ""
    action_text = action_hint or action_label or ""

    action_html = ""
    if action_text:
        action_html = f"<p><strong>Next:</strong> {escape(str(action_text))}</p>"

    st.markdown(
        f"""
        <div class="pp-empty">
            <h3>{escape(str(icon))} {escape(str(title))}</h3>
            <p>{escape(str(body_text))}</p>
            {action_html}
        </div>
        """,
        unsafe_allow_html=True,
    )


def render_footer() -> None:
    """Render shared app footer."""
    st.markdown(
        """
        <div class="pp-footer">
            PitchPilot AI · v1.0 MVP · Ethical interview and presentation practice tool
        </div>
        """,
        unsafe_allow_html=True,
    )


# ---------------------------------------------------------------------------
# Compatibility aliases
# ---------------------------------------------------------------------------
def render_metric_card(label: str, value: Union[str, int, float], helper_text: Optional[str] = None) -> None:
    """Backward-compatible alias for metric_card()."""
    metric_card(label, value, helper_text)


def render_section_card(title: str, description: Optional[str] = None):
    """Backward-compatible alias for section_card()."""
    return section_card(title, description)


def render_status_badge(text: str, status: str = "neutral") -> None:
    """Backward-compatible alias for status_badge()."""
    status_badge(text, status)