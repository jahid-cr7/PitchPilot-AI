import { useEffect, useState } from "react";
import { pitchpilotApi } from "../api/pitchpilotApi";
import PracticeModeSelector from "../components/PracticeModeSelector";
import QuestionPanel from "../components/QuestionPanel";

function loadState<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function saveState(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

export default function PracticePage() {
  const [modes, setModes] = useState<string[]>([]);
  const [selectedMode, setSelectedMode] = useState<string>(
    loadState("pp_mode", "")
  );
  const [questions, setQuestions] = useState<string[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<string>(
    loadState("pp_question", "")
  );
  const [role, setRole] = useState<string>(loadState("pp_role", ""));
  const [loadingModes, setLoadingModes] = useState(true);
  const [loadingQuestions, setLoadingQuestions] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    pitchpilotApi
      .getPracticeModes()
      .then((res) => {
        setModes(res.modes);
        const initial = loadState("pp_mode", res.modes[0] ?? "");
        setSelectedMode(initial);
        setLoadingModes(false);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Failed to load modes");
        setLoadingModes(false);
      });
  }, []);

  useEffect(() => {
    if (!selectedMode) return;
    setLoadingQuestions(true);
    setError("");
    Promise.all([
      pitchpilotApi.getQuestionsForMode(selectedMode),
      pitchpilotApi.getDefaultRole(selectedMode),
    ])
      .then(([qRes, rRes]) => {
        setQuestions(qRes.questions);
        const savedQuestion = loadState("pp_question", "");
        if (savedQuestion && qRes.questions.includes(savedQuestion)) {
          setSelectedQuestion(savedQuestion);
        } else {
          setSelectedQuestion(qRes.questions[0] ?? "");
        }
        const savedRole = loadState("pp_role", "");
        setRole(savedRole || rRes.role);
        setLoadingQuestions(false);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Failed to load questions");
        setLoadingQuestions(false);
      });
  }, [selectedMode]);

  useEffect(() => {
    saveState("pp_mode", selectedMode);
  }, [selectedMode]);

  useEffect(() => {
    saveState("pp_question", selectedQuestion);
  }, [selectedQuestion]);

  useEffect(() => {
    saveState("pp_role", role);
  }, [role]);

  async function handleRandom() {
    if (!selectedMode) return;
    setLoadingQuestions(true);
    try {
      const res = await pitchpilotApi.getRandomQuestion(selectedMode);
      setSelectedQuestion(res.question);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Random question failed");
    } finally {
      setLoadingQuestions(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Practice</h1>
        <p className="text-sm text-slate-400">
          Choose a practice mode and question to focus your session.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-700/40 bg-red-900/20 px-4 py-3 text-sm text-red-200">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1 space-y-4">
          <PracticeModeSelector
            modes={modes}
            selected={selectedMode}
            onSelect={setSelectedMode}
            loading={loadingModes}
          />
        </div>
        <div className="lg:col-span-2">
          <QuestionPanel
            questions={questions}
            selected={selectedQuestion}
            onSelect={setSelectedQuestion}
            onRandom={handleRandom}
            role={role}
            onRoleChange={setRole}
            loading={loadingQuestions}
          />
        </div>
      </div>

      <div className="rounded-xl border border-slate-700/60 bg-slate-800/60 p-5">
        <h3 className="text-sm font-semibold text-slate-200 mb-2">Current Setup</h3>
        <div className="text-sm text-slate-300 space-y-1">
          <p>
            <span className="text-slate-500">Mode:</span> {selectedMode || "—"}
          </p>
          <p>
            <span className="text-slate-500">Question:</span> {selectedQuestion || "—"}
          </p>
          <p>
            <span className="text-slate-500">Role:</span> {role || "—"}
          </p>
        </div>
      </div>
    </div>
  );
}
