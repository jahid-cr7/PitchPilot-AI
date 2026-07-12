import AiCoachPanel from "../components/AiCoachPanel";

export default function FeedbackPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Feedback</h1>
        <p className="text-sm text-slate-400">
          Paste your answer and run the AI Coach to get structured feedback.
        </p>
      </div>
      <AiCoachPanel />
    </div>
  );
}
