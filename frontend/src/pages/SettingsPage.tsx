import { useState } from "react";
import { pitchpilotApi } from "../api/pitchpilotApi";

export default function SettingsPage() {
  const [url, setUrl] = useState(pitchpilotApi.getBaseUrl());
  const [saved, setSaved] = useState(false);

  function handleSave() {
    pitchpilotApi.setBaseUrl(url);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-sm text-slate-400">
          Configure the backend API connection and provider preferences.
        </p>
      </div>

      <div className="rounded-xl border border-slate-700/60 bg-slate-800/60 p-5 space-y-4">
        <h3 className="text-lg font-semibold text-white">Backend URL</h3>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-300">
            API Base URL
          </label>
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
            placeholder="http://127.0.0.1:8000"
          />
          <p className="text-xs text-slate-500">
            Current: {pitchpilotApi.getBaseUrl()}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleSave}
            className="inline-flex items-center rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-semibold text-white shadow hover:bg-brand-500 transition"
          >
            Save URL
          </button>
          {saved && (
            <span className="text-sm text-emerald-400">Saved!</span>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-slate-700/60 bg-slate-800/60 p-5 space-y-4">
        <h3 className="text-lg font-semibold text-white">API Documentation</h3>
        <p className="text-sm text-slate-400">
          Open the interactive Swagger UI to explore and test all endpoints.
        </p>
        <a
          href={`${url.replace(/\/$/, "")}/docs`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center rounded-lg bg-slate-700 px-5 py-2.5 text-sm font-semibold text-slate-200 border border-slate-600 hover:bg-slate-600 transition"
        >
          Open API Docs
        </a>
      </div>

      <div className="rounded-xl border border-slate-700/60 bg-slate-800/60 p-5 space-y-3">
        <h3 className="text-lg font-semibold text-white">Provider Hints</h3>
        <div className="space-y-2 text-sm text-slate-300">
          <div className="rounded-lg border border-slate-700 bg-slate-900/60 px-4 py-3">
            <p className="font-medium text-white">OpenAI</p>
            <p className="text-slate-400">Leave Base URL empty. Model: gpt-4o-mini</p>
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-900/60 px-4 py-3">
            <p className="font-medium text-white">Gemini</p>
            <p className="text-slate-400">
              Base URL: https://generativelanguage.googleapis.com/v1beta/openai/
            </p>
            <p className="text-slate-400">Model: gemini-3.5-flash</p>
          </div>
          <div className="rounded-lg border border-slate-700 bg-slate-900/60 px-4 py-3">
            <p className="font-medium text-white">Groq</p>
            <p className="text-slate-400">Base URL: https://api.groq.com/openai/v1</p>
            <p className="text-slate-400">Model: llama3-8b-8192</p>
          </div>
        </div>
      </div>
    </div>
  );
}
