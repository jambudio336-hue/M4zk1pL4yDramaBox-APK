import React, { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import {
  ArrowLeft,
  Download,
  Gauge,
  Layers,
  Pause,
  Play,
  SkipForward,
  Volume2,
  VolumeX
} from "lucide-react";
import { DramaBoxAPI } from "../services/apiClient";
import { attachClearKeyIfNeeded } from "../services/mediaDecryptor";

const SPEEDS = [1, 1.25, 1.5, 2];

export default function VerticalPlayer({ drama, startEpIndex = 0, onClose, onProgress }) {
  const videoRef = useRef(null);
  const [epIndex, setEpIndex] = useState(
    Math.min(Math.max(0, startEpIndex), Math.max(0, drama.episodes.length - 1))
  );
  const [quality, setQuality] = useState("720p");
  const [qualities, setQualities] = useState([]);
  const [streamUrl, setStreamUrl] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [speedIdx, setSpeedIdx] = useState(0);
  const [showEpisodes, setShowEpisodes] = useState(false);

  const currentEp = drama.episodes[epIndex] || { number: 1, title: "Episode 1" };
  const currentSpeed = SPEEDS[speedIdx];

  useEffect(() => {
    let hlsInstance = null;
    let cancelled = false;

    async function loadAndPlay() {
      setLoading(true);
      setErrorMsg("");

      try {
        const resolved = await DramaBoxAPI.resolvePlayback(drama, currentEp, quality);
        if (cancelled) return;

        setQualities(resolved.qualities || []);
        const url = resolved.streamUrl;
        setStreamUrl(url);

        if (onProgress) {
          onProgress(drama, epIndex);
        }

        const video = videoRef.current;
        if (!video) return;

        if (!url) {
          setErrorMsg("URL video belum tersedia untuk episode ini.");
          setLoading(false);
          return;
        }

        if (resolved.selectedQuality?.kid && resolved.selectedQuality?.key) {
          await attachClearKeyIfNeeded(
            video,
            resolved.selectedQuality.kid,
            resolved.selectedQuality.key
          );
        }

        if (url.includes(".m3u8") && Hls.isSupported()) {
          hlsInstance = new Hls({ enableWorker: true });
          hlsInstance.loadSource(url);
          hlsInstance.attachMedia(video);
          hlsInstance.on(Hls.Events.MANIFEST_PARSED, () => {
            video.playbackRate = currentSpeed;
            video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
          });
          hlsInstance.on(Hls.Events.ERROR, (_, data) => {
            if (data.fatal && !cancelled) {
              setErrorMsg("Gagal memuat aliran HLS. Coba ganti kualitas atau episode lain.");
            }
          });
        } else {
          video.src = url;
          video.playbackRate = currentSpeed;
          await video.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
        }
      } catch (err) {
        if (!cancelled) {
          setErrorMsg(err.message || "Terjadi kesalahan saat memutar video.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadAndPlay();

    return () => {
      cancelled = true;
      if (hlsInstance) {
        hlsInstance.destroy();
      }
    };
  }, [drama, epIndex, quality]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().then(() => setIsPlaying(true)).catch(() => {});
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const handleNextSpeed = () => {
    const next = (speedIdx + 1) % SPEEDS.length;
    setSpeedIdx(next);
    if (videoRef.current) {
      videoRef.current.playbackRate = SPEEDS[next];
    }
  };

  const handleNextQuality = () => {
    if (!qualities.length) return;
    const idx = qualities.findIndex((q) => q.label === quality);
    const next = qualities[(idx + 1) % qualities.length];
    if (next) setQuality(next.label);
  };

  const handleNextEpisode = () => {
    if (epIndex + 1 < drama.episodes.length) {
      setEpIndex(epIndex + 1);
    }
  };

  const handleDownload = async () => {
    const dlUrl = await DramaBoxAPI.getDownloadLink(drama, currentEp, quality, streamUrl);
    if (dlUrl) {
      window.open(dlUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <div className="fixed inset-0 z-40 bg-black flex flex-col justify-between select-none">
      {/* Top Overlay Header */}
      <div className="absolute top-0 inset-x-0 z-20 flex items-center justify-between gap-2 p-4 bg-gradient-to-b from-black/85 via-black/40 to-transparent">
        <button
          onClick={onClose}
          aria-label="Kembali"
          className="p-2.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md text-white transition"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="min-w-0 flex-1 text-center">
          <h2 className="text-sm font-bold text-white truncate">{drama.title}</h2>
          <p className="text-[11px] font-semibold text-amber-400">
            Episode {currentEp.number} / {drama.episodes.length}
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          {qualities.length > 0 && (
            <button
              onClick={handleNextQuality}
              className="px-2.5 py-1 rounded-full bg-rose-600/90 hover:bg-rose-500 text-[11px] font-extrabold text-white transition"
            >
              {quality}
            </button>
          )}
          <button
            onClick={handleNextSpeed}
            className="px-2.5 py-1 rounded-full bg-white/15 hover:bg-white/25 text-[11px] font-bold text-white flex items-center gap-1 transition"
          >
            <Gauge className="w-3.5 h-3.5" />
            {currentSpeed}x
          </button>
        </div>
      </div>

      {/* Main Video Surface */}
      <div
        onClick={togglePlay}
        className="relative w-full h-full flex items-center justify-center bg-[#050508]"
      >
        {loading && (
          <div className="absolute z-10 flex flex-col items-center gap-2">
            <div className="w-11 h-11 border-4 border-rose-500 border-t-amber-400 rounded-full animate-spin" />
            <span className="text-xs text-zinc-300 font-medium">Memuat sinematik...</span>
          </div>
        )}

        {errorMsg && !loading && (
          <div className="z-10 max-w-xs mx-4 p-4 rounded-2xl bg-zinc-900/95 border border-rose-500/40 text-center space-y-3">
            <p className="text-xs text-rose-300">{errorMsg}</p>
            <div className="flex justify-center gap-2">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setQuality((q) => (q === "720p" ? "480p" : "720p"));
                }}
                className="px-3 py-1.5 rounded-xl bg-zinc-800 text-xs font-bold text-white"
              >
                Coba Resolusi Lain
              </button>
              {epIndex + 1 < drama.episodes.length && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNextEpisode();
                  }}
                  className="px-3 py-1.5 rounded-xl bg-rose-600 text-xs font-bold text-white"
                >
                  Episode Berikutnya
                </button>
              )}
            </div>
          </div>
        )}

        <video
          ref={videoRef}
          className="w-full h-full object-contain"
          playsInline
          controls={false}
          muted={isMuted}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={handleNextEpisode}
        />

        {!isPlaying && !loading && !errorMsg && (
          <div className="absolute z-10 p-4 rounded-full bg-black/55 backdrop-blur-sm border border-white/15 text-white">
            <Play className="w-10 h-10 fill-white" />
          </div>
        )}
      </div>

      {/* Right Action Dock */}
      <div className="absolute right-3 bottom-28 z-20 flex flex-col items-center gap-4">
        <button
          onClick={() => setIsMuted(!isMuted)}
          aria-label="Toggle Mute"
          className="p-3 rounded-full bg-zinc-900/85 border border-white/10 text-white hover:bg-zinc-800 transition"
        >
          {isMuted ? <VolumeX className="w-5 h-5 text-rose-400" /> : <Volume2 className="w-5 h-5" />}
        </button>

        <button
          onClick={() => setShowEpisodes(true)}
          className="flex flex-col items-center gap-1 text-white"
        >
          <div className="p-3 rounded-full bg-gradient-to-br from-rose-600 to-amber-500 shadow-lg shadow-rose-600/30">
            <Layers className="w-5 h-5" />
          </div>
          <span className="text-[10px] font-bold">Episode</span>
        </button>

        <button
          onClick={handleDownload}
          className="flex flex-col items-center gap-1 text-white"
        >
          <div className="p-3 rounded-full bg-zinc-900/85 border border-white/10 hover:bg-zinc-800 transition">
            <Download className="w-5 h-5 text-amber-400" />
          </div>
          <span className="text-[10px] font-bold">Unduh</span>
        </button>

        {epIndex + 1 < drama.episodes.length && (
          <button
            onClick={handleNextEpisode}
            className="flex flex-col items-center gap-1 text-amber-400"
          >
            <div className="p-3 rounded-full bg-zinc-900/85 border border-amber-400/30 hover:bg-zinc-800 transition">
              <SkipForward className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-bold">Lanjut</span>
          </button>
        )}
      </div>

      {/* Bottom Info & Synopsis */}
      <div className="absolute bottom-0 inset-x-0 z-10 p-4 bg-gradient-to-t from-black via-black/75 to-transparent pointer-events-none">
        <div className="pr-16 space-y-1">
          <p className="text-xs font-bold text-amber-300">
            {drama.title} • {currentEp.title}
          </p>
          <p className="text-[11px] text-zinc-300 line-clamp-2 leading-relaxed">
            {drama.synopsis}
          </p>
        </div>
      </div>

      {/* Episode Selector Modal */}
      {showEpisodes && (
        <div
          onClick={() => setShowEpisodes(false)}
          className="fixed inset-0 z-30 bg-black/75 backdrop-blur-sm flex items-end justify-center"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl max-h-[70vh] bg-[#11111b] border-t border-white/10 rounded-t-3xl p-5 overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-white">Daftar Episode</h3>
                <p className="text-[11px] text-zinc-400">{drama.episodes.length} Episode Tersedia</p>
              </div>
              <button
                onClick={() => setShowEpisodes(false)}
                className="px-3 py-1 rounded-full bg-zinc-800 text-xs font-bold text-rose-400"
              >
                Tutup
              </button>
            </div>

            <div className="grid grid-cols-5 sm:grid-cols-8 gap-2">
              {drama.episodes.map((ep, idx) => {
                const active = idx === epIndex;
                return (
                  <button
                    key={`${ep.number}-${idx}`}
                    onClick={() => {
                      setEpIndex(idx);
                      setShowEpisodes(false);
                    }}
                    className={`py-2.5 rounded-xl text-xs font-extrabold transition ${
                      active
                        ? "bg-gradient-to-r from-rose-600 to-amber-500 text-white shadow-md shadow-rose-600/30"
                        : "bg-zinc-800/90 text-zinc-300 hover:bg-zinc-700"
                    }`}
                  >
                    {ep.number}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
