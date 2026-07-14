import { ReactNode } from "react";
import { FileQuestion, Inbox } from "lucide-react";

interface Props {
  title?: string;
  message?: string;
  icon?: ReactNode;
  action?: ReactNode;
}

export default function EmptyState({
  title = "Nothing here yet",
  message = "Data will appear once you start using the app.",
  icon,
  action,
}: Props) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-slate-700/20 bg-[#111a2e]/60 p-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800/80 text-slate-500">
        {icon || <Inbox className="h-6 w-6" />}
      </div>
      <h3 className="mt-4 text-sm font-semibold text-slate-300">{title}</h3>
      <p className="mt-1 max-w-xs text-xs text-slate-500">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ErrorState({
  title = "Something went wrong",
  message = "Please try again or check your connection.",
  action,
}: Props) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-red-500/15 bg-red-500/5 p-10 text-center">
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-500/10 text-red-400">
        <FileQuestion className="h-6 w-6" />
      </div>
      <h3 className="mt-4 text-sm font-semibold text-red-300">{title}</h3>
      <p className="mt-1 max-w-xs text-xs text-slate-400">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
