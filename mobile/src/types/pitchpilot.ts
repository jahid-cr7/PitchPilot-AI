/**
 * PitchPilot AI API types
 */

export interface PracticeModesResponse {
  modes: string[];
}

export interface QuestionsResponse {
  mode: string;
  questions: string[];
}

export interface RandomQuestionResponse {
  mode: string;
  question: string;
}

export interface DefaultRoleResponse {
  mode: string;
  role: string;
}

export interface AnalyzeAnswerRequest {
  transcript: string;
  question: string;
  role: string;
  api_key?: string;
  base_url?: string;
  model?: string;
}

export interface AnalyzeAnswerResponse {
  status: string;
  answer_score: number;
  content_strengths: string[];
  content_weak_points: string[];
  improved_answer: string;
  structure_feedback: string;
  next_content_task: string;
  summary: string;
  model_used: string;
}

export interface HealthResponse {
  status: string;
}

export interface MetaResponse {
  app: string;
  version: string;
  status: string;
}

export interface SessionSummary {
  id: number;
  created_at: string;
  video_filename: string;
  interview_question: string;
  target_role: string;
  overall_score: number;
  video_score: number;
  camera_score: number;
  speech_score: number;
  answer_score: number;
  performance_level: string;
}

export interface SessionDetail extends SessionSummary {
  transcript: string;
  duration_seconds: number;
  fps: number;
  resolution: string;
  movement_score: number;
  face_visible_percent: number;
  framing: string;
  distance_feedback: string;
  camera_movement_level: string;
  word_count: number;
  words_per_minute: number;
  filler_word_count: number;
  repeated_word_count: number;
  strengths: string[];
  weak_points: string[];
  next_practice_task: string;
  summary: string;
  ai_model_used: string;
}

export interface DashboardStats {
  status: string;
  total_sessions: number;
  average_score: number;
  best_score: number;
  latest_score: number;
  average_video_score: number;
  average_camera_score: number;
  average_speech_score: number;
  average_answer_score: number;
  recent_sessions: SessionSummary[];
}

export interface ReportExportResponse {
  status: string;
  filename: string;
  content: string;
}

export type ScreenName = 'home' | 'practice' | 'feedback' | 'settings';

export interface AppState {
  backendUrl: string;
  selectedMode: string | null;
  selectedQuestion: string | null;
  selectedRole: string | null;
}
