"""
core/speech_analyzer.py
=======================
Speech analysis from video files using faster-whisper for transcription.

Extracts audio from uploaded videos, transcribes speech, and computes:
- transcript
- word_count
- duration_seconds
- words_per_minute (WPM)
- filler_word_count and filler_words_found
- repeated_word_count
- speech_score (0-100)

Never crashes; returns a clean error dictionary on any failure.
"""

import os
import re
import tempfile
from collections import Counter
from pathlib import Path
from typing import Dict, List, Set, Tuple, Union

# ---------------------------------------------------------------------------
# Safe imports: gracefully handle missing packages
# ---------------------------------------------------------------------------
MOVIEPIPY_AVAILABLE = False
FASTER_WHISPER_AVAILABLE = False

try:
    from moviepy.editor import AudioFileClip
    MOVIEPIPY_AVAILABLE = True
except Exception:
    pass

try:
    from faster_whisper import WhisperModel
    FASTER_WHISPER_AVAILABLE = True
except Exception:
    pass


# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------
FILLER_WORDS: List[str] = [
    "um", "uh", "like", "you know", "actually", "basically",
    "so", "right", "okay", "i mean",
]

# WPM scoring
WPM_GOOD_MIN = 110
WPM_GOOD_MAX = 160
WPM_TOO_SLOW = 90
WPM_TOO_FAST = 180

# Scoring weights
WEIGHT_WPM = 30
WEIGHT_FILLERS = 35
WEIGHT_REPEATED = 20
WEIGHT_DURATION = 15


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------
def _error_dict(message: str) -> Dict[str, Union[str, float, int, list]]:
    """Return a clean error dictionary with all expected keys."""
    return {
        "status": "error",
        "transcript": "",
        "word_count": 0,
        "duration_seconds": 0.0,
        "words_per_minute": 0.0,
        "filler_word_count": 0,
        "filler_words_found": [],
        "repeated_word_count": 0,
        "repeated_words": [],
        "speech_score": 0,
        "warnings": [message],
        "message": message,
    }


def _extract_audio(video_path: str, output_wav: str) -> float:
    """
    Extract audio from video to a WAV file using moviepy.
    Returns audio duration in seconds.
    """
    if not MOVIEPIPY_AVAILABLE:
        raise RuntimeError("moviepy is not installed.")

    clip = AudioFileClip(video_path)
    # Write mono 16kHz WAV for Whisper compatibility
    clip.write_audiofile(
        output_wav,
        fps=16000,
        nbytes=2,
        codec="pcm_s16le",
        verbose=False,
        logger=None,
    )
    duration = float(clip.duration or 0)
    clip.close()
    return duration


def _transcribe_audio(audio_path: str) -> str:
    """
    Transcribe audio using faster-whisper base model.
    Returns the full transcript text.
    """
    if not FASTER_WHISPER_AVAILABLE:
        raise RuntimeError("faster-whisper is not installed.")

    # Use tiny model for speed in MVP; upgrade to base if needed
    model = WhisperModel("tiny", device="cpu", compute_type="int8")
    segments, _info = model.transcribe(audio_path, beam_size=5)
    texts = [segment.text.strip() for segment in segments]
    return " ".join(texts)


def _count_filler_words(text: str) -> Tuple[int, List[str]]:
    """
    Count occurrences of filler words/phrases in the transcript.
    Returns (total_count, list_of_found_phrases).
    """
    lower = text.lower()
    found: List[str] = []
    total = 0
    for phrase in FILLER_WORDS:
        # Use word-boundary-safe counting for single words
        if " " in phrase:
            count = lower.count(phrase)
        else:
            # Match whole words only
            pattern = r"\b" + re.escape(phrase) + r"\b"
            count = len(re.findall(pattern, lower))
        if count > 0:
            total += count
            found.append(f"{phrase}: {count}")
    return total, found


def _count_repeated_words(text: str) -> Tuple[int, List[str]]:
    """
    Count repeated words (words said 3+ times).
    Returns (total_excess_count, list_of_repeated_words).
    """
    words = re.findall(r"\b[a-z]+\b", text.lower())
    counts = Counter(words)

    # Filter out very common short words
    stopwords = {"the", "a", "an", "is", "are", "was", "were", "be", "been",
                 "being", "have", "has", "had", "do", "does", "did", "will",
                 "would", "could", "should", "may", "might", "must", "shall",
                 "can", "need", "dare", "ought", "used", "to", "of", "in",
                 "for", "on", "with", "at", "by", "from", "as", "into",
                 "through", "during", "before", "after", "above", "below",
                 "between", "under", "and", "but", "or", "yet", "so",
                 "if", "because", "although", "though", "while", "where",
                 "when", "that", "which", "who", "whom", "whose", "what",
                 "this", "these", "those", "i", "you", "he", "she", "it",
                 "we", "they", "me", "him", "her", "us", "them", "my",
                 "your", "his", "its", "our", "their", "mine", "yours",
                 "hers", "ours", "theirs", "myself", "yourself", "himself",
                 "herself", "itself", "ourselves", "yourselves", "themselves",
                 "all", "each", "every", "both", "few", "more", "most",
                 "other", "some", "such", "no", "nor", "not", "only",
                 "own", "same", "than", "too", "very", "just", "now",
                 "then", "here", "there", "once", "again", "also", "back",
                 "still", "even", "already", "almost", "enough", "quite",
                 "rather", "almost", "about", "up", "out", "down", "off",
                 "over", "away", "around", "well", "yes", "no", "ok", "go",
                 "get", "got", "getting", "gotten", "make", "made", "making",
                 "take", "took", "taken", "taking", "come", "came", "coming",
                 "see", "saw", "seen", "seeing", "know", "knew", "known",
                 "knowing", "think", "thought", "thinking", "say", "said",
                 "saying", "want", "wanted", "wanting", "use", "used",
                 "using", "find", "found", "finding", "give", "gave",
                 "given", "giving", "tell", "told", "telling", "become",
                 "became", "becoming", "leave", "left", "leaving", "feel",
                 "felt", "feeling", "put", "putting", "bring", "brought",
                 "bringing", "begin", "began", "begun", "beginning", "keep",
                 "kept", "keeping", "hold", "held", "holding", "write",
                 "wrote", "written", "writing", "stand", "stood", "standing",
                 "hear", "heard", "hearing", "let", "letting", "mean",
                 "meant", "meaning", "set", "setting", "meet", "met",
                 "meeting", "pay", "paid", "paying", "sit", "sat",
                 "sitting", "speak", "spoke", "spoken", "speaking", "lie",
                 "lay", "lain", "lying", "lead", "led", "leading", "read",
                 "reading", "grow", "grew", "grown", "growing", "lose",
                 "lost", "losing", "fall", "fell", "fallen", "falling",
                 "send", "sent", "sending", "build", "built", "building",
                 "understand", "understood", "understanding", "draw", "drew",
                 "drawn", "drawing", "break", "broke", "broken", "breaking",
                 "spend", "spent", "spending", "cut", "cutting", "rise",
                 "rose", "risen", "rising", "drive", "drove", "driven",
                 "driving", "buy", "bought", "buying", "wear", "wore",
                 "worn", "wearing", "choose", "chose", "chosen", "choosing"}

    repeated = []
    total_excess = 0
    for word, count in counts.most_common():
        if count >= 3 and word not in stopwords and len(word) > 2:
            excess = count - 2  # penalize beyond 2 occurrences
            total_excess += excess
            repeated.append(f"{word}: {count}")
    return total_excess, repeated


def _calculate_speech_score(
    wpm: float,
    filler_count: int,
    word_count: int,
    repeated_excess: int,
    duration: float,
) -> int:
    """
    Compute overall speech score (0-100).

    - WPM (30 pts): optimal 110-160
    - Filler words (35 pts): penalized proportionally
    - Repeated words (20 pts): penalized proportionally
    - Duration (15 pts): minimum 30s to get full points
    """
    score = 0

    # WPM score (0-30)
    if WPM_GOOD_MIN <= wpm <= WPM_GOOD_MAX:
        score += WEIGHT_WPM
    elif wpm < WPM_TOO_SLOW:
        score += max(0, int(WEIGHT_WPM * (wpm / WPM_TOO_SLOW)))
    elif wpm > WPM_TOO_FAST:
        score += max(0, int(WEIGHT_WPM * (1 - (wpm - WPM_TOO_FAST) / 100)))
    else:
        # Between good zone and too slow/fast boundaries
        score += int(WEIGHT_WPM * 0.7)

    # Filler words (0-35)
    if word_count > 0:
        filler_ratio = filler_count / word_count
        score += max(0, int(WEIGHT_FILLERS * (1 - filler_ratio * 5)))
    else:
        score += WEIGHT_FILLERS

    # Repeated words (0-20)
    if word_count > 0:
        repeat_ratio = repeated_excess / word_count
        score += max(0, int(WEIGHT_REPEATED * (1 - repeat_ratio * 3)))
    else:
        score += WEIGHT_REPEATED

    # Duration (0-15)
    if duration >= 30:
        score += WEIGHT_DURATION
    elif duration > 0:
        score += int(WEIGHT_DURATION * (duration / 30))
    else:
        score += 0

    return max(0, min(100, score))


def _build_warnings(
    wpm: float,
    filler_count: int,
    repeated_excess: int,
) -> List[str]:
    """Build actionable warnings from speech metrics."""
    warnings = []
    if wpm < WPM_TOO_SLOW:
        warnings.append(
            f"Speaking pace is slow ({wpm:.0f} WPM). Try to speak a bit faster to maintain engagement."
        )
    elif wpm > WPM_TOO_FAST:
        warnings.append(
            f"Speaking pace is fast ({wpm:.0f} WPM). Try to slow down for clarity."
        )
    if filler_count > 3:
        warnings.append(
            f"Found {filler_count} filler words. Try to reduce fillers for more confident delivery."
        )
    if repeated_excess > 5:
        warnings.append(
            f"Detected {repeated_excess} repeated-word instances. Vary your vocabulary for stronger impact."
        )
    return warnings


# ---------------------------------------------------------------------------
# Main function
# ---------------------------------------------------------------------------
def analyze_speech(video_path: str) -> Dict[str, Union[str, float, int, list]]:
    """
    Analyze speech from a video file.

    Parameters
    ----------
    video_path : str
        Path to the video file.

    Returns
    -------
    dict
        A dictionary with:
        - status (str): "success" or "error"
        - transcript (str)
        - word_count (int)
        - duration_seconds (float)
        - words_per_minute (float)
        - filler_word_count (int)
        - filler_words_found (list[str])
        - repeated_word_count (int)
        - repeated_words (list[str])
        - speech_score (int): 0-100
        - warnings (list[str])
        - message (str)
    """
    temp_audio_path = None
    try:
        if not MOVIEPIPY_AVAILABLE:
            return _error_dict(
                "moviepy is not installed. Please install it: pip install moviepy"
            )
        if not FASTER_WHISPER_AVAILABLE:
            return _error_dict(
                "faster-whisper is not installed. Please install it: pip install faster-whisper"
            )

        # Extract audio to a temporary WAV file
        temp_dir = tempfile.gettempdir()
        temp_audio_path = os.path.join(temp_dir, f"pitchpilot_{Path(video_path).stem}.wav")
        duration = _extract_audio(video_path, temp_audio_path)

        if duration <= 0:
            return _error_dict("Could not determine audio duration from the video.")

        # Transcribe
        transcript = _transcribe_audio(temp_audio_path)

        if not transcript.strip():
            return _error_dict("No speech detected in the video. Ensure the audio is clear.")

        # Compute metrics
        words = transcript.split()
        word_count = len(words)
        wpm = round((word_count / duration) * 60, 2) if duration > 0 else 0.0

        filler_count, filler_found = _count_filler_words(transcript)
        repeated_excess, repeated_words = _count_repeated_words(transcript)

        speech_score = _calculate_speech_score(
            wpm, filler_count, word_count, repeated_excess, duration
        )
        warnings = _build_warnings(wpm, filler_count, repeated_excess)

        return {
            "status": "success",
            "transcript": transcript,
            "word_count": word_count,
            "duration_seconds": round(duration, 2),
            "words_per_minute": wpm,
            "filler_word_count": filler_count,
            "filler_words_found": filler_found,
            "repeated_word_count": repeated_excess,
            "repeated_words": repeated_words,
            "speech_score": speech_score,
            "warnings": warnings,
            "message": "Speech analysis completed successfully.",
        }

    except Exception as exc:
        return _error_dict(f"Speech analysis failed: {exc}")

    finally:
        # Clean up temporary audio file
        if temp_audio_path and os.path.exists(temp_audio_path):
            try:
                os.remove(temp_audio_path)
            except Exception:
                pass
