export default function SkeletonCard({ count = 1 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-2xl border border-slate-700/20 bg-[#111a2e]/60 p-5"
        >
          <div className="h-4 w-1/3 animate-pulse rounded bg-slate-700/40" />
          <div className="mt-3 h-3 w-2/3 animate-pulse rounded bg-slate-700/30" />
          <div className="mt-2 h-3 w-1/2 animate-pulse rounded bg-slate-700/30" />
        </div>
      ))}
    </>
  );
}
