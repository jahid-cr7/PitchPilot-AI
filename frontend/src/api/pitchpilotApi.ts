/**
 * PitchPilot AI API helper.
 * Thin fetch wrapper around the FastAPI backend.
 */

const DEFAULT_BASE_URL = "http://127.0.0.1:8000";

function getBaseUrl(): string {
  return localStorage.getItem("pp_api_url") || DEFAULT_BASE_URL;
}

function buildUrl(path: string): string {
  const base = getBaseUrl().replace(/\/$/, "");
  return `${base}${path}`;
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => "Unknown error");
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export const pitchpilotApi = {
  setBaseUrl(url: string) {
    localStorage.setItem("pp_api_url", url);
  },

  getBaseUrl,

  async getHealth() {
    const res = await fetch(buildUrl("/health"));
    return handleResponse<{ status: string }>(res);
  },

  async getPracticeModes() {
    const res = await fetch(buildUrl("/api/v1/questions/modes"));
    return handleResponse<{ modes: string[] }>(res);
  },

  async getQuestionsForMode(mode: string) {
    const res = await fetch(buildUrl(`/api/v1/questions/${encodeURIComponent(mode)}`));
    return handleResponse<{ mode: string; questions: string[] }>(res);
  },

  async getRandomQuestion(mode: string) {
    const res = await fetch(buildUrl(`/api/v1/questions/${encodeURIComponent(mode)}/random`));
    return handleResponse<{ mode: string; question: string }>(res);
  },

  async getDefaultRole(mode: string) {
    const res = await fetch(buildUrl(`/api/v1/questions/${encodeURIComponent(mode)}/default-role`));
    return handleResponse<{ mode: string; role: string }>(res);
  },

  async analyzeAnswer(payload: {
    transcript: string;
    question: string;
    role: string;
    api_key?: string | null;
    base_url?: string | null;
    model?: string | null;
  }) {
    const res = await fetch(buildUrl("/api/v1/ai/analyze-answer"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return handleResponse<Record<string, unknown>>(res);
  },

  async calculateFinalScore(payload: {
    video_result: Record<string, unknown>;
    camera_result: Record<string, unknown>;
    speech_result: Record<string, unknown>;
    ai_result?: Record<string, unknown> | null;
  }) {
    const res = await fetch(buildUrl("/api/v1/score/final"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return handleResponse<Record<string, unknown>>(res);
  },
};
