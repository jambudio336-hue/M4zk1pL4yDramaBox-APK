import React from "react";
import { Clock, Play, Trash2 } from "lucide-react";

export default function HistoryDrawer({ history, onResume, onClear }) {
  if (!history.length) {
    return (
      <div className="p-8 rounded-2xl bg-zinc-900/60 border border-white/10 text-center space-y-2">
        <Clock className="w-8 h-8 text-zinc-500 mx-auto" />
        <p className="text-sm font-bold text-zinc-300">Belum ada riwayat tontonan</p>
        <p className="text-xs text-zinc-500">Pilih drama di Beranda atau Genre untuk mulai menonton.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-extrabold text-amber-400">Riwayat & Lanjutkan Menonton</h2>
        <button
          onClick={onClear}
          className="inline-flex items-center gap-1 text-xs font-bold text-rose-400 hover:text-rose-300"
        >
          <Trash2 className="w-3.5 h-3.5" /> Hapus Riwayat
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {history.map((entry) => (
          <div
            key={`${entry.drama.provider}-${entry.drama.id}`}
            onClick={() => onResume(entry.drama, entry.epIndex)}
            className="flex items-center gap-3 p-3 rounded-2xl bg-zinc-900/80 hover:bg-zinc-900 border border-white/10 cursor-pointer transition"
          >
            <img
              src={entry.drama.cover}
              alt={entry.drama.title}
              className="w-16 h-22 object-cover rounded-xl bg-zinc-800 shrink-0"
            />
            <div className="min-w-0 flex-1">
              <h3 className="text-xs font-bold text-white truncate">{entry.drama.title}</h3>
              <p className="text-[11px] text-amber-400 font-semibold mt-1">
                Terakhir: Episode {entry.epIndex + 1}
              </p>
              <span className="inline-flex items-center gap-1 mt-2 px-2.5 py-1 rounded-full bg-rose-600/20 text-rose-300 text-[10px] font-bold">
                <Play className="w-3 h-3 fill-rose-300" /> Lanjutkan
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
