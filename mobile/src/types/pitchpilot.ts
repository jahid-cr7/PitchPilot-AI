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

export interface FullAnalysisResponse {
  status: string;
  session_id?: number | null;
  save_warning?: string | null;
  video_result: Record<string, unknown>;
  camera_result: Record<string, unknown>;
  speech_result: Record<string, unknown>;
  ai_result: Record<string, unknown>;
  final_feedback: Record<string, unknown>;
}

export type ScreenName = 'home' | 'practice' | 'feedback' | 'settings';

export interface AppState {
  backendUrl: string;
  selectedMode: string | null;
  selectedQuestion: string | null;
  selectedRole: string | null;
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
export interface AuthUser {
  id: number;
  name: string;
  email: string;
  created_at?: string | null;
}

export interface AuthTokenResponse {
  access_token: string;
  token_type: string;
  user: AuthUser;
}

export interface MeResponse {
  user: AuthUser;
}

// ---------------------------------------------------------------------------
// Coaching Plan
// ---------------------------------------------------------------------------
export interface CoachingPlan {
  focus_area: string;
  current_level: string;
  weekly_goal: string;
  recommended_practice_mode: string;
  recommended_question: string;
  action_steps: string[];
  metrics_to_watch: string[];
  next_milestone: string;
  ai_note?: string | null;
}

/**
 * The backend returns the coaching plan fields at the top level alongside
 * `status` (see CoachingPlanResponse in api/schemas.py). Some callers may also
 * receive a nested `plan` object, so both shapes are accepted.
 */
export interface CoachingPlanResponse extends Partial<CoachingPlan> {
  status: string;
  plan?: CoachingPlan;
}
