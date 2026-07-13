/**
 * PitchPilot API helper
 * Uses fetch() with configurable backend URL and clean error handling.
 */

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

export function setBackendUrl(url: string): void {
  _backendUrl = url.replace(/\/$/, '');
}

export function getBackendUrl(): string {
  return _backendUrl;
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${_backendUrl}${path}`;
  try {
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      ...options,
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new PitchPilotApiError(
        `HTTP ${response.status}: ${response.statusText}`,
        response.status,
        body
      );
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
