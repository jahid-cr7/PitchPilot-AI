interface Props {
  questions: string[];
  selected: string;
  onSelect: (q: string) => void;
  onRandom: () => void;
  role: string;
  onRoleChange: (r: string) => void;
  loading?: boolean;
}

export default function QuestionPanel({ questions, selected, onSelect, onRandom, role, onRoleChange, loading }: Props) {
  return (
    <div className="space-y-4 rounded-xl border border-slate-700/60 bg-slate-800/60 p-5">
      <div className="space-y-3">
        <label className="block text-sm font-medium text-slate-300">Interview Question</label>
        {loading ? (
          <div className="h-10 rounded-lg bg-slate-700/60 animate-pulse" />
        ) : (
          <select
            value={selected}
            onChange={(e) => onSelect(e.target.value)}
            className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          >
            {questions.map((q, i) => (
              <option key={i} value={q}>
                {q}
              </option>
            ))}
          </select>
        )}
        <button
          onClick={onRandom}
          disabled={loading}
          className="inline-flex items-center rounded-md bg-slate-700 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-600 disabled:opacity-50 transition"
        >
          🎲 Random Question
        </button>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-300">Target Role</label>
        <input
          type="text"
          value={role}
          onChange={(e) => onRoleChange(e.target.value)}
          className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2.5 text-sm text-white outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
          placeholder="e.g., Software Developer"
        />
      </div>
    </div>
  );
}
