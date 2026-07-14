import { motion, AnimatePresence } from "framer-motion";
import { Upload, Video, FileVideo, X, AlertCircle } from "lucide-react";
import { useRef, useState } from "react";

interface Props {
  onFileSelect: (file: File | null) => void;
  file: File | null;
  onError?: (message: string) => void;
  maxSizeMB?: number;
}

function formatSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

export default function UploadDropzone({
  onFileSelect,
  file,
  onError,
  maxSizeMB = 200,
}: Props) {
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function validateFile(f: File): boolean {
    const isMp4 = f.type === "video/mp4" || f.name.toLowerCase().endsWith(".mp4");
    if (!isMp4) {
      onError?.("Please upload an MP4 video file.");
      return false;
    }
    if (f.size > maxSizeMB * 1024 * 1024) {
      onError?.(`File too large. Maximum allowed is ${maxSizeMB} MB.`);
      return false;
    }
    return true;
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (!f) return;
    if (validateFile(f)) {
      onFileSelect(f);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (validateFile(f)) {
      onFileSelect(f);
    }
    // reset input so same file can be selected again
    e.target.value = "";
  }

  function clearFile() {
    onFileSelect(null);
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={handleDrop}
      className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition-all ${
        dragOver
          ? "border-blue-400/60 bg-blue-500/10 shadow-lg shadow-blue-500/10"
          : file
          ? "border-emerald-500/30 bg-emerald-500/5"
          : "border-slate-700/40 bg-slate-800/40 hover:border-slate-600/50"
      }`}
    >
      <AnimatePresence mode="wait">
        {file ? (
          <motion.div
            key="file"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="flex w-full items-center gap-4"
          >
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-blue-500/20">
              <FileVideo className="h-6 w-6 text-emerald-400" />
            </div>
            <div className="min-w-0 flex-1 text-left">
              <p className="truncate text-sm font-medium text-[#e5edff]">
                {file.name}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                {formatSize(file.size)}
              </p>
            </div>
            <button
              onClick={clearFile}
              className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-700/40 hover:text-slate-300 transition"
              title="Remove file"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="flex flex-col items-center"
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500/20 to-violet-500/20">
              <Video className="h-6 w-6 text-blue-400" />
            </div>
            <p className="mt-4 text-sm font-medium text-slate-300">
              Drop your MP4 video here
            </p>
            <p className="mt-1 text-xs text-slate-500">
              or click to browse
            </p>
            <div className="mt-4 flex items-center gap-1.5 text-[11px] text-slate-500">
              <AlertCircle className="h-3 w-3" />
              Max {maxSizeMB} MB · MP4 only
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <input
        ref={inputRef}
        type="file"
        accept="video/mp4,.mp4"
        onChange={handleChange}
        className="hidden"
      />

      {!file && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          onClick={() => inputRef.current?.click()}
          className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-slate-700/60 px-4 py-2 text-xs font-medium text-slate-200 hover:bg-slate-700 transition"
        >
          <Upload className="h-3.5 w-3.5" />
          Browse Files
        </motion.button>
      )}
    </motion.div>
  );
}
