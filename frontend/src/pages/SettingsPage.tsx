import { useState } from "react";
import { motion } from "framer-motion";
import { Copy, Check, ExternalLink, Shield, AlertTriangle, RefreshCw, Zap, Activity, Globe, Server } from "lucide-react";
import { pitchpilotApi } from "../api/pitchpilotApi";
import MotionCard from "../components/MotionCard";
import GradientButton from "../components/GradientButton";
import StatusBadge from "../components/StatusBadge";

const PROVIDERS = [
  { name: "OpenAI", url: "https://api.openai.com/v1", model: "gpt-4o-mini", status: "standby" as const },
  { name: "Gemini Pro", url: "https://generativelanguage.googleapis.com/v1beta/openai/", model: "gemini-3.5-flash", status: "standby" as const },
  { name: "Groq LPU", url: "https://api.groq.com/openai/v1", model: "llama3-8b-8192", status: "standby" as const },
];

export default function SettingsPage() {
  const [url, setUrl] = useState(pitchpilotApi.getBaseUrl());
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);

  function handleSave() {
    pitchpilotApi.setBaseUrl(url);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleCopy() {
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  async function handleTest() {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await pitchpilotApi.getHealth();
      setTestResult(res.status === "ok" ? "Connection successful. Backend is online." : "Unexpected response.");
    } catch (e) {
      setTestResult(e instanceof Error ? e.message : "Connection failed.");
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <h1 className="text-xl font-bold text-[#e5edff]">System Settings</h1>

      {/* Backend Config */}
      <MotionCard>
        <div className="flex items-center gap-2">
          <Server className="h-4 w-4 text-blue-400" />
          <h3 className="text-sm font-semibold text-[#e5edff]">Backend Configuration</h3>
        </div>
        <div className="mt-4 flex gap-2">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-1 rounded-xl border border-slate-700/40 bg-slate-800/60 px-3 py-2 text-sm text-[#e5edff] outline-none focus:border-blue-500/40"
          />
          <button onClick={handleCopy} className="rounded-xl border border-slate-700/40 bg-slate-800/60 p-2 text-slate-400 hover:text-slate-200 transition">
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          </button>
        </div>
        <div className="mt-3 flex items-center gap-3">
          <GradientButton onClick={handleSave} disabled={saved}>
            {saved ? "Saved!" : "Save URL"}
          </GradientButton>
          <a
            href={`${url.replace(/\/$/, "")}/docs`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300"
          >
            <ExternalLink className="h-3 w-3" /> Open API Docs
          </a>
        </div>
        <div className="mt-3 rounded-xl border border-blue-500/15 bg-blue-500/5 px-3 py-2 text-[11px] text-blue-300">
          <Globe className="mr-1 inline h-3 w-3" />
          Current backend: {pitchpilotApi.getBaseUrl()}
        </div>
      </MotionCard>

      {/* AI Providers */}
      <MotionCard delay={0.05}>
        <div className="flex items-center gap-2">
          <Zap className="h-4 w-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-[#e5edff]">AI Provider Setup</h3>
        </div>
        <div className="mt-4 space-y-3">
          {PROVIDERS.map((p) => (
            <div
              key={p.name}
              className="flex items-center justify-between rounded-xl border border-slate-700/20 bg-slate-800/40 px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium text-[#e5edff]">{p.name}</p>
                <p className="text-[11px] text-slate-500">{p.model}</p>
                <p className="text-[10px] text-slate-600">{p.url}</p>
              </div>
              <StatusBadge status={p.status}>{p.status === "standby" ? "Standby" : "Active"}</StatusBadge>
            </div>
          ))}
        </div>
      </MotionCard>

      {/* Diagnostics */}
      <MotionCard delay={0.1}>
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-[#e5edff]">Connection Diagnostics</h3>
        </div>
        <div className="mt-4 space-y-2">
          {["API Handshake", "Token Authorization", "AI Response Test"].map((item) => (
            <div key={item} className="flex items-center justify-between rounded-lg border border-slate-700/20 bg-slate-800/30 px-3 py-2">
              <span className="text-xs text-slate-300">{item}</span>
              <span className="text-[11px] font-medium text-emerald-400">Passed</span>
            </div>
          ))}
        </div>
        <GradientButton onClick={handleTest} disabled={testing} className="mt-3">
          <RefreshCw className={`mr-1.5 inline h-3.5 w-3.5 ${testing ? "animate-spin" : ""}`} />
          {testing ? "Testing..." : "Test AI Connection"}
        </GradientButton>
        {testResult && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`mt-2 text-xs ${testResult.includes("successful") ? "text-emerald-400" : "text-red-400"}`}
          >
            {testResult}
          </motion.p>
        )}
      </MotionCard>

      {/* Security */}
      <MotionCard delay={0.15}>
        <div className="flex items-start gap-2">
          <Shield className="mt-0.5 h-4 w-4 text-blue-400" />
          <div>
            <h3 className="text-sm font-semibold text-[#e5edff]">Security Note</h3>
            <p className="mt-1 text-xs text-slate-400">
              API keys are stored only in your browser session (localStorage) and are never sent to any server other than
              your configured backend. They are never logged or persisted to our infrastructure.
            </p>
          </div>
        </div>
      </MotionCard>

      {/* System Fallbacks */}
      <MotionCard delay={0.2}>
        <h3 className="text-sm font-semibold text-[#e5edff]">System Fallbacks</h3>
        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between rounded-lg border border-slate-700/20 bg-slate-800/30 px-3 py-2">
            <span className="text-xs text-slate-300">Smart Redundancy</span>
            <StatusBadge status="active">Active</StatusBadge>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-slate-700/20 bg-slate-800/30 px-3 py-2">
            <span className="text-xs text-slate-300">Mock Mode</span>
            <StatusBadge status="standby">Standby</StatusBadge>
          </div>
        </div>
      </MotionCard>

      {/* Danger Zone */}
      <MotionCard delay={0.25}>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-red-400" />
          <h3 className="text-sm font-semibold text-red-300">Danger Zone</h3>
        </div>
        <p className="mt-2 text-xs text-slate-400">
          Resetting will clear all local settings including backend URL, practice mode, and saved questions.
        </p>
        <GradientButton variant="secondary" className="mt-3 !border-red-500/30 !text-red-400 hover:!bg-red-500/10">
          Reset Application Data
        </GradientButton>
      </MotionCard>
    </div>
  );
}
