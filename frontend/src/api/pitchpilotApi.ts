/**
 * PitchPilot AI API helper.
 * Thin fetch wrapper around the FastAPI backend.
 *
 * Auth integration
 * ----------------
 * - Every request runs through ``authorizedFetch``, which reads the current
 *   JWT via ``authTokenProvider`` (registered by ``AuthContext``) and appends
 *   ``Authorization: Bearer <token>`` when present.
 * - When the backend replies with HTTP 401, the ``unauthorizedHandler`` fires
 *   so the auth context can clear its local state and redirect to /login.
 */

import type {
  DashboardStats,
  ReportExportResponse,
  SessionDetail,
  SessionSummary,
} from "../types/pitchpilot";

const DEFAULT_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

const REQUEST_TIMEOUT = 30000; // 30 seconds

// -------- auth wiring (set by AuthContext at startup) ----------------------
let authTokenProvider: (() => string | null) | null = null;
let unauthorizedHandler: (() => void) | null = null;

function getBaseUrl(): string {
  return localStorage.getItem("pp_api_url") || DEFAULT_BASE_URL;
}

function buildUrl(path: string): string {
  const base = getBaseUrl().replace(/\/$/, "");
  return `${base}${path}`;
}

function withAuthHeaders(init: RequestInit = {}): RequestInit {
  const token = authTokenProvider?.() ?? null;
  if (!token) {
    return init;
  }
  const headers = new Headers(init.headers as HeadersInit | undefined);
  if (!headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  return { ...init, headers };
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout = REQUEST_TIMEOUT,
): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(url, {
      ...withAuthHeaders(options),
      signal: controller.signal,
    });
    return res;
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("Request timed out. Backend may be slow or offline.");
    }
    throw new Error(
      "Cannot connect to backend. Make sure FastAPI is running on port 8000.",
    );
  } finally {
    clearTimeout(id);
  }
}

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    if (res.status === 401) {
      unauthorizedHandler?.();
      throw new Error("Your session expired. Please log in again.");
    }
    let text = "Unknown error";
    try {
      const body = await res.json();
      if (body && typeof body === "object" && "detail" in body) {
        const detail = (body as { detail: unknown }).detail;
        if (typeof detail === "string") {
          text = detail;
        }
      }
    } catch {
      try {
        text = await res.text();
      } catch {
        // ignore
      }
    }
    if (res.status === 0 || !navigator.onLine) {
      throw new Error("You appear to be offline. Check your connection.");
    }
    if (res.status === 413) {
      throw new Error("File too large. Maximum allowed is 200 MB.");
    }
    if (res.status === 404) {
      throw new Error(text || "Not found.");
    }
    throw new Error(`HTTP ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}

export const pitchpilotApi = {
  setBaseUrl(url: string) {
    localStorage.setItem("pp_api_url", url);
  },

  getBaseUrl,

  resetBaseUrl() {
    localStorage.removeItem("pp_api_url");
  },

  // --- Auth wiring (called by AuthContext) ---------------------------------
  setAuthTokenProvider(provider: (() => string | null) | null) {
    authTokenProvider = provider;
  },

  setUnauthorizedHandler(handler: (() => void) | null) {
    unauthorizedHandler = handler;
  },

  async getHealth() {
    const res = await fetchWithTimeout(buildUrl("/health"), {}, 5000);
    return handleResponse<{ status: string }>(res);
  },

  async getPracticeModes() {
    const res = await fetchWithTimeout(buildUrl("/api/v1/questions/modes"), {});
    return handleResponse<{ modes: string[] }>(res);
  },

  async getQuestionsForMode(mode: string) {
    const res = await fetchWithTimeout(
      buildUrl(`/api/v1/questions/${encodeURIComponent(mode)}`),
      {},
    );
    return handleResponse<{ mode: string; questions: string[] }>(res);
  },

  async getRandomQuestion(mode: string) {
    const res = await fetchWithTimeout(
      buildUrl(`/api/v1/questions/${encodeURIComponent(mode)}/random`),
      {},
    );
    return handleResponse<{ mode: string; question: string }>(res);
  },

  async getDefaultRole(mode: string) {
    const res = await fetchWithTimeout(
      buildUrl(`/api/v1/questions/${encodeURIComponent(mode)}/default-role`),
      {},
    );
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
    const res = await fetchWithTimeout(buildUrl("/api/v1/ai/analyze-answer"), {
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
    const res = await fetchWithTimeout(buildUrl("/api/v1/score/final"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    return handleResponse<Record<string, unknown>>(res);
  },

  async analyzeVideo(file: File) {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetchWithTimeout(buildUrl("/api/v1/analyze/video"), {
      method: "POST",
      body: fd,
    });
    return handleResponse<Record<string, unknown>>(res);
  },

  async analyzeCamera(file: File) {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetchWithTimeout(buildUrl("/api/v1/analyze/camera"), {
      method: "POST",
      body: fd,
    });
    return handleResponse<Record<string, unknown>>(res);
  },

  async analyzeSpeech(file: File) {
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetchWithTimeout(buildUrl("/api/v1/analyze/speech"), {
      method: "POST",
      body: fd,
    });
    return handleResponse<Record<string, unknown>>(res);
  },

  async analyzeFull(
    file: File,
    opts?: {
      question?: string;
      role?: string;
      api_key?: string;
      base_url?: string;
      model?: string;
    },
  ) {
    const fd = new FormData();
    fd.append("file", file);
    if (opts?.question) fd.append("question", opts.question);
    if (opts?.role) fd.append("role", opts.role);
    if (opts?.api_key) fd.append("api_key", opts.api_key);
    if (opts?.base_url) fd.append("base_url", opts.base_url);
    if (opts?.model) fd.append("model", opts.model);
    // Analysis uploads can be big — use a longer timeout window.
    const res = await fetchWithTimeout(
      buildUrl("/api/v1/analyze/full"),
      { method: "POST", body: fd },
      300000, // 5 minutes
    );
    return handleResponse<Record<string, unknown>>(res);
  },

  // Session History (protected)
  async getSessions() {
    const res = await fetchWithTimeout(buildUrl("/api/v1/sessions"), {});
    return handleResponse<{ status: string; sessions: SessionSummary[] }>(res);
  },

  async getSessionDetail(sessionId: number) {
    const res = await fetchWithTimeout(
      buildUrl(`/api/v1/sessions/${sessionId}`),
      {},
    );
    return handleResponse<{ status: string; session: SessionDetail }>(res);
  },

  async deleteSession(sessionId: number) {
    const res = await fetchWithTimeout(
      buildUrl(`/api/v1/sessions/${sessionId}`),
      { method: "DELETE" },
    );
    return handleResponse<{ status: string; message: string }>(res);
  },

  // Dashboard (protected)
  async getDashboardStats() {
    const res = await fetchWithTimeout(buildUrl("/api/v1/dashboard/stats"), {});
    return handleResponse<DashboardStats>(res);
  },

  // Reports (protected)
  async exportHtmlReport(sessionId: number) {
    const res = await fetchWithTimeout(
      buildUrl(`/api/v1/reports/${sessionId}/html`),
      {},
    );
    return handleResponse<ReportExportResponse>(res);
  },

  async exportCsvReport(sessionId: number) {
    const res = await fetchWithTimeout(
      buildUrl(`/api/v1/reports/${sessionId}/csv`),
      {},
    );
    return handleResponse<ReportExportResponse>(res);
  },
};
