"""
reports/report_generator.py
===========================
Generate exportable HTML and CSV reports from saved practice sessions.

No external dependencies beyond Python standard library.
Cross-platform: produces plain text / HTML suitable for Windows and Ubuntu.
"""

import csv
import io
from datetime import datetime
from typing import Dict, List, Optional


def build_report_filename(session: dict, extension: str) -> str:
    """
    Build a clean report filename from session metadata.

    Parameters
    ----------
    session : dict
        Saved session dictionary from the database.
    extension : str
        File extension without the leading dot (e.g., 'html', 'csv').

    Returns
    -------
    str
        Sanitized filename.
    """
    sid = session.get("id", 0)
    created = session.get("created_at", "")
    # Extract YYYY-MM-DD from ISO timestamp if available
    date_part = ""
    if created and isinstance(created, str):
        date_part = created[:10]
    if not date_part:
        date_part = datetime.now().strftime("%Y-%m-%d")

    ext = extension.lstrip(".")
    return f"pitchpilot_report_session_{sid}_{date_part}.{ext}"


def generate_html_report(session: dict) -> str:
    """
    Generate a self-contained HTML report for a practice session.

    Parameters
    ----------
    session : dict
        Saved session dictionary from the database.

    Returns
    -------
    str
        Complete HTML document as a string.
    """
    sid = session.get("id", 0)
    created = session.get("created_at", "")
    question = session.get("interview_question", "N/A") or "N/A"
    role = session.get("target_role", "N/A") or "N/A"
    level = session.get("performance_level", "N/A") or "N/A"
    overall = session.get("overall_score", 0)
    video_score = session.get("movement_score", 0)
    camera_score = session.get("camera_score", 0)
    speech_score = session.get("speech_score", 0)
    answer_score = session.get("answer_score", 0)
    word_count = session.get("word_count", 0)
    wpm = session.get("words_per_minute", 0)
    filler_count = session.get("filler_word_count", 0)
    repeat_count = session.get("repeated_word_count", 0)
    face_visible = session.get("face_visible_percent", 0)
    framing = session.get("framing", "N/A") or "N/A"
    distance = session.get("distance_feedback", "N/A") or "N/A"
    strengths = session.get("strengths", []) or []
    weak_points = session.get("weak_points", []) or []
    next_task = session.get("next_practice_task", "Keep practicing!") or "Keep practicing!"
    summary = session.get("summary", "No summary available.") or "No summary available."
    transcript = session.get("transcript", "") or ""
    duration = session.get("duration_seconds", 0)
    resolution = session.get("resolution", "N/A") or "N/A"

    # Build strengths list HTML
    strengths_html = ""
    if strengths:
        for s in strengths:
            strengths_html += f"<li>{_escape_html(str(s))}</li>\n"
    else:
        strengths_html = "<li>No strengths recorded.</li>\n"

    # Build weak points list HTML
    weak_html = ""
    if weak_points:
        for w in weak_points:
            weak_html += f"<li>{_escape_html(str(w))}</li>\n"
    else:
        weak_html = "<li>No weak points recorded.</li>\n"

    # Build transcript block
    transcript_block = (
        f'<pre style="background:#f4f4f4;padding:12px;border-radius:6px;overflow-x:auto;">'
        f"{_escape_html(transcript)}"
        f"</pre>"
        if transcript
        else "<p>No transcript available.</p>"
    )

    html = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>PitchPilot AI - Session #{sid} Report</title>
<style>
  body {{
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    line-height: 1.6;
    max-width: 800px;
    margin: 40px auto;
    padding: 0 20px;
    color: #333;
    background: #fff;
  }}
  h1 {{ color: #1a1a2e; border-bottom: 3px solid #e94560; padding-bottom: 10px; }}
  h2 {{ color: #16213e; margin-top: 30px; border-bottom: 1px solid #ddd; padding-bottom: 6px; }}
  .meta {{ color: #666; font-size: 0.95em; margin-bottom: 20px; }}
  .score-grid {{
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
    gap: 12px;
    margin: 20px 0;
  }}
  .score-card {{
    background: #f8f9fa;
    border-radius: 8px;
    padding: 14px;
    text-align: center;
    border-left: 4px solid #e94560;
  }}
  .score-card .label {{ font-size: 0.85em; color: #666; }}
  .score-card .value {{ font-size: 1.6em; font-weight: bold; color: #1a1a2e; }}
  table {{ width: 100%; border-collapse: collapse; margin: 14px 0; }}
  th, td {{ text-align: left; padding: 10px; border-bottom: 1px solid #eee; }}
  th {{ background: #f4f4f4; font-weight: 600; }}
  ul {{ margin: 8px 0; padding-left: 22px; }}
  li {{ margin: 6px 0; }}
  .strength {{ color: #2e7d32; }}
  .weak {{ color: #c62828; }}
  .task {{ background: #e3f2fd; padding: 12px; border-radius: 6px; border-left: 4px solid #2196f3; }}
  .summary {{ background: #fff8e1; padding: 12px; border-radius: 6px; border-left: 4px solid #ffc107; }}
  footer {{ margin-top: 40px; font-size: 0.85em; color: #999; text-align: center; }}
</style>
</head>
<body>
  <h1>PitchPilot AI Feedback Report</h1>
  <p class="meta">
    <strong>Session ID:</strong> #{sid} &nbsp;|&nbsp;
    <strong>Date:</strong> {_escape_html(str(created))} &nbsp;|&nbsp;
    <strong>Performance Level:</strong> {_escape_html(str(level))}
  </p>

  <div class="score-grid">
    <div class="score-card">
      <div class="label">Overall</div>
      <div class="value">{overall}/100</div>
    </div>
    <div class="score-card">
      <div class="label">Video</div>
      <div class="value">{video_score}</div>
    </div>
    <div class="score-card">
      <div class="label">Camera</div>
      <div class="value">{camera_score}</div>
    </div>
    <div class="score-card">
      <div class="label">Speech</div>
      <div class="value">{speech_score}</div>
    </div>
    <div class="score-card">
      <div class="label">Answer</div>
      <div class="value">{answer_score}</div>
    </div>
  </div>

  <h2>Session Details</h2>
  <table>
    <tr><th>Property</th><th>Value</th></tr>
    <tr><td>Interview Question</td><td>{_escape_html(str(question))}</td></tr>
    <tr><td>Target Role</td><td>{_escape_html(str(role))}</td></tr>
    <tr><td>Video Duration</td><td>{duration} s</td></tr>
    <tr><td>Resolution</td><td>{_escape_html(str(resolution))}</td></tr>
  </table>

  <h2>Speech Analysis</h2>
  <table>
    <tr><th>Property</th><th>Value</th></tr>
    <tr><td>Word Count</td><td>{word_count}</td></tr>
    <tr><td>Words Per Minute</td><td>{wpm}</td></tr>
    <tr><td>Filler Words</td><td>{filler_count}</td></tr>
    <tr><td>Repeated Words</td><td>{repeat_count}</td></tr>
    <tr><td>Speech Score</td><td>{speech_score}</td></tr>
  </table>

  <h2>Camera Presence</h2>
  <table>
    <tr><th>Property</th><th>Value</th></tr>
    <tr><td>Face Visible %</td><td>{face_visible}%</td></tr>
    <tr><td>Framing</td><td>{_escape_html(str(framing))}</td></tr>
    <tr><td>Distance Feedback</td><td>{_escape_html(str(distance))}</td></tr>
    <tr><td>Camera Score</td><td>{camera_score}</td></tr>
  </table>

  <h2>Strengths</h2>
  <ul class="strength">
    {strengths_html}
  </ul>

  <h2>Weak Points</h2>
  <ul class="weak">
    {weak_html}
  </ul>

  <h2>Next Practice Task</h2>
  <div class="task">
    {_escape_html(str(next_task))}
  </div>

  <h2>Summary</h2>
  <div class="summary">
    {_escape_html(str(summary))}
  </div>

  <h2>Transcript</h2>
  {transcript_block}

  <footer>
    Generated by PitchPilot AI &middot; Cross-platform interview coaching
  </footer>
</body>
</html>
"""
    return html


def generate_csv_report(session: dict) -> str:
    """
    Generate a one-row CSV report for a practice session.

    Parameters
    ----------
    session : dict
        Saved session dictionary from the database.

    Returns
    -------
    str
        CSV content as a string.
    """
    output = io.StringIO()
    writer = csv.writer(output)

    headers = [
        "created_at",
        "interview_question",
        "target_role",
        "video_score",
        "camera_score",
        "speech_score",
        "answer_score",
        "overall_score",
        "performance_level",
        "word_count",
        "words_per_minute",
        "filler_word_count",
        "repeated_word_count",
        "duration_seconds",
        "resolution",
        "face_visible_percent",
        "framing",
        "distance_feedback",
        "camera_score_detail",
        "ai_model_used",
    ]

    row = [
        session.get("created_at", ""),
        session.get("interview_question", ""),
        session.get("target_role", ""),
        session.get("movement_score", 0),
        session.get("camera_score", 0),
        session.get("speech_score", 0),
        session.get("answer_score", 0),
        session.get("overall_score", 0),
        session.get("performance_level", ""),
        session.get("word_count", 0),
        session.get("words_per_minute", 0),
        session.get("filler_word_count", 0),
        session.get("repeated_word_count", 0),
        session.get("duration_seconds", 0),
        session.get("resolution", ""),
        session.get("face_visible_percent", 0),
        session.get("framing", ""),
        session.get("distance_feedback", ""),
        session.get("camera_score", 0),
        session.get("ai_model_used", ""),
    ]

    writer.writerow(headers)
    writer.writerow(row)
    return output.getvalue()


def _escape_html(text: str) -> str:
    """Escape special HTML characters to prevent XSS in reports."""
    return (
        text.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )
