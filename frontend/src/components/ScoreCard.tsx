interface Props {
  title: string;
  value: string | number;
  subtitle?: string;
}

export default function ScoreCard({ title, value, subtitle }: Props) {
  return (
    <div className="rounded-xl border border-slate-700/60 bg-slate-800/60 p-4 text-center">
      <div className="text-xs font-medium uppercase tracking-wide text-slate-400">{title}</div>
      <div className="mt-1 text-2xl font-extrabold text-white">{value}</div>
      {subtitle && <div className="mt-0.5 text-xs text-slate-400">{subtitle}</div>}
    </div>
  );
}
