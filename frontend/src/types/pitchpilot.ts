export interface AiAnalyzeRequest {
  transcript: string;
  question: string;
  role: string;
  api_key?: string | null;
  base_url?: string | null;
  model?: string | null;
}

export interface AiAnalyzeResponse {
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

export interface PracticeMode {
  name: string;
}

export interface QuestionResponse {
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

export interface FinalScoreResponse {
  status: string;
  video_score: number;
  camera_score: number;
  speech_score: number;
  answer_score: number;
  overall_score: number;
  performance_level: string;
  strengths: string[];
  weak_points: string[];
  next_practice_task: string;
  summary: string;
  message: string;
}

export interface MetaResponse {
  app: string;
  version: string;
  status: string;
}

export interface HealthResponse {
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

// ---------------------------------------------------------------------------
// User Analytics & Profile (v1.3.0)
// ---------------------------------------------------------------------------
export interface SkillAverages {
  video: number;
  camera: number;
  speech: number;
  answer: number;
}

export interface ScoreTrendPoint {
  date: string;
  score: number;
}

export interface UserAnalytics {
  status: string;
  total_sessions: number;
  average_score: number;
  best_score: number;
  latest_score: number;
  score_trend: ScoreTrendPoint[];
  skill_averages: SkillAverages;
  top_strengths: string[];
  common_weaknesses: string[];
  recent_sessions: SessionSummary[];
}

export interface UserProfileSummary {
  status: string;
  id: number;
  name: string;
  email: string;
  created_at?: string | null;
  total_sessions: number;
  latest_session_date?: string | null;
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
// Coaching Plan & Goals (v2.0.0)
// ---------------------------------------------------------------------------
export interface CoachingPlan {
  status: string;
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

export interface UserGoal {
  id: number;
  user_id: number;
  title: string;
  target_metric: string;
  target_value: number;
  current_value: number;
  status: string;
  created_at: string;
  completed_at?: string | null;
}

export interface GoalsListResponse {
  status: string;
  goals: UserGoal[];
}

export interface GoalDetailResponse {
  status: string;
  goal: UserGoal;
}

export interface GoalDeleteResponse {
  status: string;
  message: string;
}

export interface GoalCreateRequest {
  title: string;
  target_metric: string;
  target_value: number;
  current_value?: number;
}

export interface GoalUpdateRequest {
  title?: string;
  target_metric?: string;
  target_value?: number;
  current_value?: number;
  status?: string;
}

// ---------------------------------------------------------------------------
// Robot Coach Lesson (v1.4.0)
// ---------------------------------------------------------------------------
export interface SubtitleItem {
  time: number;
  text: string;
}

export interface RobotLesson {
  title: string;
  coach_name: string;
  lesson_type: string;
  focus_area: string;
  problem_summary: string;
  why_it_matters: string;
  correct_method: string;
  better_example: string;
  practice_steps: string[];
  spoken_script: string;
  subtitles: SubtitleItem[];
  estimated_duration_seconds: number;
}

export interface RobotLessonResponse {
  status: string;
  lesson_id: number;
  lesson: RobotLesson;
}

export interface RobotLessonSummary {
  id: number;
  session_id: number;
  title: string;
  coach_name: string;
  lesson_type: string;
  focus_area: string;
  estimated_duration_seconds: number;
  created_at: string;
}

export interface RobotLessonsListResponse {
  status: string;
  lessons: RobotLessonSummary[];
}
