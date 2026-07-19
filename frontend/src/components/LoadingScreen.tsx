import LoadingSpinner from "./LoadingSpinner";

export default function LoadingScreen() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0f1e] text-[#e5edff]">
      <LoadingSpinner size={32} />
      <p className="mt-4 text-sm font-medium text-slate-300">
        Loading PitchPilot AI...
      </p>
    </div>
  );
}
