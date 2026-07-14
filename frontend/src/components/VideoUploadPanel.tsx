import { useState, useRef } from "react";
import { pitchpilotApi } from "../api/pitchpilotApi";
import ScoreCard from "./ScoreCard";

interface Props {
  question: string;
  role: string;
}

export default function VideoUploadPanel({ question, role }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState<string | null>(null);

  const [videoResult, setVideoResult] = useState<Record<string, unknown> | null>(null);
  const [cameraResult, setCameraResult] = useState<Record<string, unknown> | null>(null);
  const [speechResult, setSpeechResult] = useState<Record<string, unknown> | null>(null);
  const [fullResult, setFullResult] = useState<Record<string, unknown> | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setError("");
    setVideoResult(null);
    setCameraResult(null);
    setSpeechResult(null);
    setFullResult(null);

    if (!f) {
      setFile(null);
      return;
    }
    if (!f.name.toLowerCase().endsWith(".mp4")) {
      setError("Only MP4 files are supported.");
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    if (f.size === 0) {
      setError("File is empty.");
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    const maxMb = 200;
    if (f.size > maxMb * 1024 * 1024) {
      setError(`File too large. Maximum size is ${maxMb} MB.`);
      setFile(null);
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    setFile(f);
  }

  async function runAnalyze(type: "video" | "camera" | "speech" | "full") {
    if (!file) {
      setError("Please select an MP4 file first.");
      return;
    }
    setError("");
    setLoading(type);
    try {
      let res: Record<string, unknown>;
      if (type === "video") {
        res = await pitchpilotApi.analyzeVideo(file);
        setVideoResult(res);
      } else if (type === "camera") {
        res = await pitchpilotApi.analyzeCamera(file);
        setCameraResult(res);
      } else if (type === "speech") {
        res = await pitchpilotApi.analyzeSpeech(file);
        setSpeechResult(res);
      } else {
        res = await pitchpilotApi.analyzeFull(file, {
          question,
          role,
        });
        setFullResult(res);
        if (res.video_result) setVideoResult(res.video_result as Record<string, unknown>);
        if (res.camera_result) setCameraResult(res.camera_result as Record<string, unknown>);
        if (res.speech_result) setSpeechResult(res.speech_result as Record<string, unknown>);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : `${type} analysis failed.`);
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-5 rounded-xl border border-slate-700/60 bg-slate-800/60 p-5">
      <h3 className="text-lg font-semibold text-white">Video Analysis</h3>

      <div className="space-y-2">
        <input
          ref={inputRef}
          type="file"
          accept=".mp4,video/mp4"
          onChange={handleFileChange}
          className="block w-full text-sm text-slate-300 file:mr-4 file:rounded-lg file:border-0 file:bg-brand-600 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-brand-500"
        />
        {file && (
          <p className="text-xs text-slate-400">
            Selected: {file.name} ({(file.size / (1024 * 1024)).toFixed(2)} MB)
          </p>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-700/40 bg-red-900/20 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {([
          { key: "video", label: "Analyze Video" },
          { key: "camera", label: "Analyze Camera" },
          { key: "speech", label: "Analyze Speech" },
          { key: "full", label: "Run Full Analysis" },
        ] as const).map((btn) => (
          <button
            key={btn.key}
            onClick={() => runAnalyze(btn.key)}
            disabled={!!loading}
            className="inline-flex items-center rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-brand-500 disabled:opacity-60 transition"
          >
            {loading === btn.key ? "Processing..." : btn.label}
          </button>
        ))}
      </div>

      {/* Video Result */}
      {videoResult && videoResult.status === "success" && (
        <div className="rounded-xl border border-slate-700/40 bg-slate-900/40 p-4 space-y-3">
          <h4 className="text-sm font-semibold text-brand-300">Video Intelligence</h4>
          <div className="grid gap-3 sm:grid-cols-4">
            <ScoreCard
              title="Duration"
              value={`${(videoResult.duration_seconds as number) ?? 0}s`}
            />
            <ScoreCard title="FPS" value={(videoResult.fps as number) ?? 0} />
            <ScoreCard title="Resolution" value={String(videoResult.resolution ?? "—")} />
            <ScoreCard title="Movement" value={(videoResult.movement_score as number) ?? 0} />
          </div>
        </div>
      )}

      {/* Camera Result */}
      {cameraResult && cameraResult.status === "success" && (
        <div className="rounded-xl border border-slate-700/40 bg-slate-900/40 p-4 space-y-3">
          <h4 className="text-sm font-semibold text-brand-300">Camera Presence</h4>
          <div className="grid gap-3 sm:grid-cols-4">
            <ScoreCard
              title="Face Visible"
              value={`${(cameraResult.face_visible_percent as number) ?? 0}%`}
            />
            <ScoreCard title="Framing" value={String(cameraResult.framing ?? "—")} />
            <ScoreCard title="Distance" value={String(cameraResult.distance_feedback ?? "—")} />
            <ScoreCard title="Camera Score" value={(cameraResult.camera_score as number) ?? 0} />
          </div>
        </div>
      )}

      {/* Speech Result */}
      {speechResult && speechResult.status === "success" && (
        <div className="rounded-xl border border-slate-700/40 bg-slate-900/40 p-4 space-y-3">
          <h4 className="text-sm font-semibold text-brand-300">Speech Analytics</h4>
          <div className="grid gap-3 sm:grid-cols-5">
            <ScoreCard title="Words" value={(speechResult.word_count as number) ?? 0} />
            <ScoreCard title="WPM" value={(speechResult.words_per_minute as number) ?? 0} />
            <ScoreCard title="Fillers" value={(speechResult.filler_word_count as number) ?? 0} />
            <ScoreCard
              title="Repeated"
              value={(speechResult.repeated_word_count as number) ?? 0}
            />
            <ScoreCard title="Speech Score" value={(speechResult.speech_score as number) ?? 0} />
          </div>
          {(speechResult.transcript as string) && (
            <details className="group">
              <summary className="cursor-pointer text-xs font-medium text-slate-400 hover:text-slate-200">
                View transcript
              </summary>
              <p className="mt-2 text-sm text-slate-300 whitespace-pre-wrap">
                {String(speechResult.transcript)}
              </p>
            </details>
          )}
        </div>
      )}

      {/* Full / Final Result */}
      {fullResult && fullResult.status === "success" && (
        <div className="rounded-xl border border-brand-700/30 bg-brand-900/20 p-4 space-y-4">
          <h4 className="text-sm font-semibold text-brand-200">Final Performance Score</h4>
          {!!fullResult.final_feedback && (
            <>
              <div className="grid gap-3 sm:grid-cols-5">
                <ScoreCard
                  title="Overall"
                  value={(fullResult.final_feedback as Record<string, unknown>).overall_score as number}
                  subtitle={String(
                    (fullResult.final_feedback as Record<string, unknown>).performance_level ?? ""
                  )}
                />
                <ScoreCard
                  title="Video"
                  value={(fullResult.final_feedback as Record<string, unknown>).video_score as number}
                />
                <ScoreCard
                  title="Camera"
                  value={(fullResult.final_feedback as Record<string, unknown>).camera_score as number}
                />
                <ScoreCard
                  title="Speech"
                  value={(fullResult.final_feedback as Record<string, unknown>).speech_score as number}
                />
                <ScoreCard
                  title="Answer"
                  value={(fullResult.final_feedback as Record<string, unknown>).answer_score as number}
                />
              </div>

              {(fullResult.ai_result as Record<string, unknown>)?.content_strengths && (
                <div>
                  <h5 className="text-xs font-semibold text-emerald-300 mb-1">Content Strengths</h5>
                  <ul className="space-y-1">
                    {(
                      (fullResult.ai_result as Record<string, unknown>)
                        .content_strengths as string[]
                    )?.map((s, i) => (
                      <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-emerald-400" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {(fullResult.ai_result as Record<string, unknown>)?.content_weak_points && (
                <div>
                  <h5 className="text-xs font-semibold text-amber-300 mb-1">Weak Points</h5>
                  <ul className="space-y-1">
                    {(
                      (fullResult.ai_result as Record<string, unknown>)
                        .content_weak_points as string[]
                    )?.map((w, i) => (
                      <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-amber-400" />
                        {w}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {(fullResult.final_feedback as Record<string, unknown>)?.next_practice_task && (
                <p className="text-sm text-brand-200">
                  <span className="font-semibold">Next Task:</span>{" "}
                  {String(
                    (fullResult.final_feedback as Record<string, unknown>).next_practice_task
                  )}
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
