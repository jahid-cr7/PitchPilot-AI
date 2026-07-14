import { Loader2 } from "lucide-react";

interface Props {
  size?: number;
  className?: string;
}

export default function LoadingSpinner({ size = 20, className = "" }: Props) {
  return (
    <Loader2
      className={`animate-spin text-blue-400 ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
