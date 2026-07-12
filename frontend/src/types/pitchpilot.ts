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
