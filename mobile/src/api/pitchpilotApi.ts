/**
 * PitchPilot API helper
 * Uses fetch() with configurable backend URL and clean error handling.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import {
  PracticeModesResponse,
  QuestionsResponse,
  RandomQuestionResponse,
  DefaultRoleResponse,
  AnalyzeAnswerRequest,
  AnalyzeAnswerResponse,
  HealthResponse,
  MetaResponse,
  SessionSummary,
  SessionDetail,
  DashboardStats,
  ReportExportResponse,
  FullAnalysisResponse,
  CoachingPlan,
  CoachingPlanResponse,
} from '../types/pitchpilot';

export class PitchPilotApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public responseBody?: string
  ) {
    super(message);
    this.name = 'PitchPilotApiError';
  }
}

let _backendUrl = 'http://127.0.0.1:8000';

const BACKEND_URL_KEY = 'pp_backend_url';
const LAST_ANALYSIS_KEY = 'pp_last_analysis';
const SAVE_HISTORY_KEY = 'pp_save_history';
const SPEECH_ANALYSIS_KEY = 'pp_speech_analysis';

// ---------------------------------------------------------------------------
// Auth wiring — populated by AuthContext at startup.
// The API client never reaches into AsyncStorage directly for the token; it
// asks the provider so there is a single source of truth.
// ---------------------------------------------------------------------------
let _authTokenProvider: (() => string | null) | null = null;
let _unauthorizedHandler: (() => void) | null = null;

export function setAuthTokenProvider(provider: (() => string | null) | null): void {
  _authTokenProvider = provider;
}

export function setUnauthorizedHandler(handler: (() => void) | null): void {
  _unauthorizedHandler = handler;
}

function getAuthHeader(): Record<string, string> {
  const token = _authTokenProvider?.() ?? null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function extractErrorDetail(response: Response): Promise<string> {
  try {
    const cloned = response.clone();
    const body = await cloned.json();
    if (body && typeof body === 'object' && 'detail' in body) {
      const detail = (body as { detail: unknown }).detail;
      if (typeof detail === 'string' && detail.trim()) return detail;
    }
  } catch {
    // fall through to text
  }
  try {
    const text = await response.text();
    if (text && text.trim()) return text;
  } catch {
    // ignore
  }
  return `HTTP ${response.status}: ${response.statusText || 'Request failed'}`;
}

export async function initBackendUrl(): Promise<void> {
  try {
    const saved = await AsyncStorage.getItem(BACKEND_URL_KEY);
    if (saved) {
      _backendUrl = saved.replace(/\/$/, '');
    }
  } catch {
    // ignore
  }
}

export function setBackendUrl(url: string): void {
  _backendUrl = url.replace(/\/$/, '');
  AsyncStorage.setItem(BACKEND_URL_KEY, _backendUrl).catch(() => {});
}

export function getBackendUrl(): string {
  return _backendUrl;
}

// ---------------------------------------------------------------------------
// Settings persistence
// ---------------------------------------------------------------------------
export async function getSaveHistorySetting(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(SAVE_HISTORY_KEY);
    return raw === null ? true : raw === 'true';
  } catch {
    return true;
  }
}

export async function setSaveHistorySetting(value: boolean): Promise<void> {
  await AsyncStorage.setItem(SAVE_HISTORY_KEY, String(value)).catch(() => {});
}

export async function getSpeechAnalysisSetting(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(SPEECH_ANALYSIS_KEY);
    return raw === null ? true : raw === 'true';
  } catch {
    return true;
  }
}

export async function setSpeechAnalysisSetting(value: boolean): Promise<void> {
  await AsyncStorage.setItem(SPEECH_ANALYSIS_KEY, String(value)).catch(() => {});
}

// ---------------------------------------------------------------------------
// Analysis persistence
// ---------------------------------------------------------------------------
export async function saveLastAnalysis(data: Record<string, unknown>): Promise<void> {
  try {
    await AsyncStorage.setItem(LAST_ANALYSIS_KEY, JSON.stringify(data));
  } catch {
    // ignore
  }
}

export async function loadLastAnalysis(): Promise<Record<string, unknown> | null> {
  try {
    const raw = await AsyncStorage.getItem(LAST_ANALYSIS_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export async function clearLastAnalysis(): Promise<void> {
  try {
    await AsyncStorage.removeItem(LAST_ANALYSIS_KEY);
  } catch {
    // ignore
  }
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${_backendUrl}${path}`;
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        ...getAuthHeader(),
        ...(options?.headers as Record<string, string> | undefined),
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        _unauthorizedHandler?.();
        throw new PitchPilotApiError(
          'Your session expired. Please log in again.',
          401
        );
      }
      const detail = await extractErrorDetail(response);
      throw new PitchPilotApiError(detail, response.status, detail);
    }

    const data = (await response.json()) as T;
    return data;
  } catch (err) {
    if (err instanceof PitchPilotApiError) {
      throw err;
    }
    if (err instanceof TypeError) {
      throw new PitchPilotApiError(
        `Network error. Is the backend running at ${_backendUrl}?`
      );
    }
    throw new PitchPilotApiError(
      err instanceof Error ? err.message : 'Unknown API error'
    );
  }
}

// ---------------------------------------------------------------------------
// Health / Meta
// ---------------------------------------------------------------------------
export async function getHealth(): Promise<HealthResponse> {
  return apiFetch<HealthResponse>('/health');
}

export async function getMeta(): Promise<MetaResponse> {
  return apiFetch<MetaResponse>('/');
}

// ---------------------------------------------------------------------------
// Question Bank
// ---------------------------------------------------------------------------
export async function getPracticeModes(): Promise<PracticeModesResponse> {
  return apiFetch<PracticeModesResponse>('/api/v1/questions/modes');
}

export async function getQuestionsForMode(mode: string): Promise<QuestionsResponse> {
  return apiFetch<QuestionsResponse>(`/api/v1/questions/${encodeURIComponent(mode)}`);
}

export async function getRandomQuestion(mode: string): Promise<RandomQuestionResponse> {
  return apiFetch<RandomQuestionResponse>(`/api/v1/questions/${encodeURIComponent(mode)}/random`);
}

export async function getDefaultRole(mode: string): Promise<DefaultRoleResponse> {
  return apiFetch<DefaultRoleResponse>(`/api/v1/questions/${encodeURIComponent(mode)}/default-role`);
}

// ---------------------------------------------------------------------------
// AI Coach
// ---------------------------------------------------------------------------
export async function analyzeAnswer(
  payload: AnalyzeAnswerRequest
): Promise<AnalyzeAnswerResponse> {
  return apiFetch<AnalyzeAnswerResponse>('/api/v1/ai/analyze-answer', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// ---------------------------------------------------------------------------
// Full Video Analysis
// ---------------------------------------------------------------------------
export interface FullVideoAsset {
  uri: string;
  name?: string | null;
  mimeType?: string | null;
  size?: number | null;
  /** Only present on Expo web when DocumentPicker returns a real File. */
  file?: File | null;
}

function buildSafeName(name?: string | null): string {
  if (name && /\.(mp4|mov)$/i.test(name)) return name;
  return 'practice-video.mp4';
}

export async function analyzeFullVideo(
  asset: FullVideoAsset,
  opts?: {
    question?: string;
    role?: string;
    api_key?: string;
    base_url?: string;
    model?: string;
    save_session?: boolean;
  }
): Promise<FullAnalysisResponse> {
  const url = `${_backendUrl}/api/v1/analyze/full`;
  const safeName = buildSafeName(asset.name);
  const mime = asset.mimeType || 'video/mp4';
  const fd = new FormData();

  if (Platform.OS === 'web') {
    // Expo web: prefer the real File the browser handed us; otherwise fetch the
    // blob: URI and wrap it as a typed Blob with an explicit filename so the
    // FastAPI UploadFile receives file.filename correctly.
    if (asset.file && typeof File !== 'undefined' && asset.file instanceof File) {
      fd.append('file', asset.file, safeName);
    } else {
      const raw = await fetch(asset.uri).then((r) => r.blob());
      const typedBlob = raw.type ? raw : new Blob([raw], { type: mime });
      fd.append('file', typedBlob, safeName);
    }
  } else {
    // React Native: FormData accepts a { uri, name, type } object.
    // We cast to any because RN's FormData typings only expose Blob | string.
    fd.append('file', {
      uri: asset.uri,
      name: safeName,
      type: mime,
    } as any);
  }

  const question = (opts?.question ?? '').trim();
  const role = (opts?.role ?? '').trim() || 'General';
  fd.append('question', question);
  fd.append('role', role);
  fd.append(
    'save_session',
    opts?.save_session === false ? 'false' : 'true'
  );
  if (opts?.api_key) fd.append('api_key', opts.api_key);
  if (opts?.base_url) fd.append('base_url', opts.base_url);
  if (opts?.model) fd.append('model', opts.model);

  if (__DEV__) {
    // Debug-only: help diagnose upload issues without leaking secrets.
    // eslint-disable-next-line no-console
    console.log('[analyzeFullVideo] upload', {
      platform: Platform.OS,
      strategy:
        Platform.OS === 'web'
          ? asset.file instanceof (typeof File !== 'undefined' ? File : Object)
            ? 'web-file'
            : 'web-blob'
          : 'native-uri',
      name: safeName,
      mimeType: mime,
      size: asset.size ?? null,
      question_length: question.length,
      role,
    });
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      body: fd,
      // IMPORTANT: do NOT set Content-Type — fetch will add the correct
      // multipart boundary automatically. Only Authorization is added.
      headers: getAuthHeader(),
    });

    if (!response.ok) {
      if (response.status === 401) {
        _unauthorizedHandler?.();
        throw new PitchPilotApiError(
          'Your session expired. Please log in again.',
          401
        );
      }
      const detail = await extractErrorDetail(response);
      throw new PitchPilotApiError(detail, response.status, detail);
    }

    return (await response.json()) as FullAnalysisResponse;
  } catch (err) {
    if (err instanceof PitchPilotApiError) throw err;
    if (err instanceof TypeError) {
      throw new PitchPilotApiError(
        `Network error. Is the backend running at ${_backendUrl}?`
      );
    }
    throw new PitchPilotApiError(
      err instanceof Error ? err.message : 'Unknown API error'
    );
  }
}

// ---------------------------------------------------------------------------
// Session History
// ---------------------------------------------------------------------------
export async function getSessions(): Promise<{ status: string; sessions: SessionSummary[] }> {
  return apiFetch<{ status: string; sessions: SessionSummary[] }>('/api/v1/sessions');
}

export async function getSessionDetail(sessionId: number): Promise<{ status: string; session: SessionDetail }> {
  return apiFetch<{ status: string; session: SessionDetail }>(`/api/v1/sessions/${sessionId}`);
}

export async function deleteSession(sessionId: number): Promise<{ status: string; message: string }> {
  return apiFetch<{ status: string; message: string }>(`/api/v1/sessions/${sessionId}`, {
    method: 'DELETE',
  });
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------
export async function getDashboardStats(): Promise<DashboardStats> {
  return apiFetch<DashboardStats>('/api/v1/dashboard/stats');
}

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------
export async function exportHtmlReport(sessionId: number): Promise<ReportExportResponse> {
  return apiFetch<ReportExportResponse>(`/api/v1/reports/${sessionId}/html`);
}

export async function exportCsvReport(sessionId: number): Promise<ReportExportResponse> {
  return apiFetch<ReportExportResponse>(`/api/v1/reports/${sessionId}/csv`);
}

// ---------------------------------------------------------------------------
// Coaching Plan
// ---------------------------------------------------------------------------
/**
 * Fetch the authenticated user's personalized coaching plan.
 *
 * Requires a valid JWT (injected via getAuthHeader). A 401 is handled by the
 * shared apiFetch/unauthorized handler which clears the session. The backend
 * returns the plan fields at the top level, but a nested `plan` object is also
 * tolerated; both are normalized to a flat CoachingPlan.
 */
export async function getCoachingPlan(): Promise<CoachingPlan> {
  const res = await apiFetch<CoachingPlanResponse>('/api/v1/users/me/coaching-plan');
  const source: Partial<CoachingPlan> = res.plan ?? res;
  return {
    focus_area: source.focus_area ?? '',
    current_level: source.current_level ?? '',
    weekly_goal: source.weekly_goal ?? '',
    recommended_practice_mode: source.recommended_practice_mode ?? '',
    recommended_question: source.recommended_question ?? '',
    action_steps: source.action_steps ?? [],
    metrics_to_watch: source.metrics_to_watch ?? [],
    next_milestone: source.next_milestone ?? '',
    ai_note: source.ai_note ?? null,
  };
}
