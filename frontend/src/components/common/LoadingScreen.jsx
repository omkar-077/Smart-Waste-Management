import { Trash2 } from "lucide-react";

export default function LoadingScreen() {
  return (
    <div className="min-h-screen bg-dark-950 flex flex-col items-center justify-center gap-4">
      <div className="relative">
        <div className="w-16 h-16 rounded-2xl bg-primary-500/20 flex items-center justify-center">
          <Trash2 size={28} className="text-primary-400" />
        </div>
        <div className="absolute inset-0 rounded-2xl border-2 border-primary-500/30 animate-ping" />
      </div>
      <div className="text-center">
        <div className="text-dark-200 font-semibold">SmartWaste</div>
        <div className="text-dark-500 text-sm mt-1">Loading...</div>
      </div>
    </div>
  );
}
