interface Props {
  modes: string[];
  selected: string;
  onSelect: (mode: string) => void;
  loading?: boolean;
}

export default function PracticeModeSelector({ modes, selected, onSelect, loading }: Props) {
  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-slate-300">Practice Mode</label>
      {loading ? (
        <div className="h-10 rounded-lg bg-slate-800 animate-pulse" />
      ) : (
        <select
          value={selected}
          onChange={(e) => onSelect(e.target.value)}
          className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2.5 text-sm text-white outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500"
        >
          {modes.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}
