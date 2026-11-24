import React, { useEffect, useState } from "react";
import { AnimatePresence } from "framer-motion";
import {
  Compass,
  Flame,
  History,
  Play,
  Search,
  Server,
  Sparkles,
  Star
} from "lucide-react";
import SplashIntro from "./components/SplashIntro";
import VerticalPlayer from "./components/VerticalPlayer";
import HistoryDrawer from "./components/HistoryDrawer";
import { DramaBoxAPI } from "./services/apiClient";

const PROVIDERS = [
  { id: "melolo", label: "Melolo" },
  { id: "dramabox", label: "DramaBox" },
  { id: "starshort", label: "StarShort" },
  { id: "shortmax", label: "ShortMax" },
  { id: "flickreels", label: "FlickReels" }
];

const GENRES = [
  "romance",
  "action",
  "thriller",
  "comedy",
  "fantasy",
  "horror",
  "historical",
  "modern"
];

const HISTORY_STORAGE_KEY = "m4zk1pl4y_dramabox_history_v1";

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [tab, setTab] = useState("home");
  const [provider, setProvider] = useState("melolo");
  const [genre, setGenre] = useState("romance");
  const [query, setQuery] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [playerState, setPlayerState] = useState(null); // { drama, epIndex }
  const [serverInfo, setServerInfo] = useState(null);
  const [history, setHistory] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(HISTORY_STORAGE_KEY) || "[]");
    } catch {
      return [];
    }
  });

  useEffect(() => {
    fetchHome(provider);
  }, [provider]);

  function saveHistory(drama, epIndex) {
    setHistory((prev) => {
      const filtered = prev.filter(
        (h) => !(h.drama.id === drama.id && h.drama.provider === drama.provider)
      );
      const next = [{ drama, epIndex, updatedAt: Date.now() }, ...filtered].slice(0, 25);
      try {
        localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  }

  function clearHistory() {
    setHistory([]);
    try {
      localStorage.removeItem(HISTORY_STORAGE_KEY);
    } catch {}
  }

  async function fetchHome(prov) {
    setLoading(true);
    try {
      const data = await DramaBoxAPI.getHome(prov, 1);
      setItems(data);
    } catch (err) {
      console.error("Home fetch error:", err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  async function fetchGenre(selectedGenre) {
    setGenre(selectedGenre);
    setLoading(true);
    try {
      const data = await DramaBoxAPI.getByGenre(selectedGenre, 1);
      setItems(data);
    } catch (err) {
      console.error("Genre fetch error:", err);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  async function onSearchSubmit(e) {
    e.preventDefault();
    setLoading(true);
    try {
      const results = await DramaBoxAPI.search(query, provider);
      setItems(results);
    } finally {
      setLoading(false);
    }
  }

  async function openDramaPlayer(dramaItem, startEpIndex = 0) {
    setLoading(true);
    try {
      const fullDrama = await DramaBoxAPI.getDetailAndEpisodes(dramaItem);
      setPlayerState({ drama: fullDrama, epIndex: startEpIndex });
    } catch {
      const fallbackDrama = {
        ...dramaItem,
        episodes: Array.from({ length: dramaItem.episodes || 20 }, (_, i) => ({
          number: i + 1,
          title: `Episode ${i + 1}`,
          locked: false
        }))
      };
      setPlayerState({ drama: fallbackDrama, epIndex: startEpIndex });
    } finally {
      setLoading(false);
    }
  }

  async function openServerTab() {
    setTab("server");
    const statusData = await DramaBoxAPI.getServerStatus();
    setServerInfo(statusData);
  }

  return (
    <div className="min-h-screen bg-[#07070d] text-white pb-24">
      <AnimatePresence>
        {showSplash && <SplashIntro onFinish={() => setShowSplash(false)} />}
      </AnimatePresence>

      {/* Top Sticky Glass Header */}
      <header className="sticky top-0 z-30 bg-[#07070d]/85 backdrop-blur-xl border-b border-white/10 px-4 pt-3.5 pb-3">
        <div className="max-w-6xl mx-auto space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
              <span className="text-base sm:text-xl font-black tracking-wide bg-gradient-to-r from-white via-amber-200 to-rose-400 bg-clip-text text-transparent">
                M4zk1pL4yDramaBox
              </span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-rose-600/25 to-amber-500/25 border border-amber-400/30 text-[10px] font-extrabold text-amber-300 tracking-wider">
              FULLSTACK HD
            </span>
          </div>

          {(tab === "home" || tab === "explore") && (
            <form onSubmit={onSearchSubmit} className="relative">
              <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari drama sinematik, CEO, balas dendam, romansa..."
                className="w-full bg-zinc-900/90 border border-white/10 focus:border-amber-400/60 rounded-2xl pl-10 pr-20 py-2.5 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none transition"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    tab === "home" ? fetchHome(provider) : fetchGenre(genre);
                  }}
                  className="absolute right-3 top-2.5 text-[11px] font-bold text-zinc-400 hover:text-white"
                >
                  Reset
                </button>
              )}
            </form>
          )}

          {tab === "home" && (
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
              {PROVIDERS.map((p) => {
                const active = provider === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setProvider(p.id)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold whitespace-nowrap transition ${
                      active
                        ? "bg-gradient-to-r from-rose-600 to-amber-500 text-white shadow-md shadow-rose-600/25"
                        : "bg-zinc-900 text-zinc-400 border border-white/10 hover:text-white"
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>
          )}

          {tab === "explore" && (
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-0.5">
              {GENRES.map((g) => {
                const active = genre === g;
                return (
                  <button
                    key={g}
                    onClick={() => fetchGenre(g)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold capitalize whitespace-nowrap transition ${
                      active
                        ? "bg-gradient-to-r from-rose-600 to-amber-500 text-white"
                        : "bg-zinc-900 text-zinc-400 border border-white/10 hover:text-white"
                    }`}
                  >
                    {g}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 pt-4">
        {tab === "history" ? (
          <HistoryDrawer
            history={history}
            onResume={(d, idx) => openDramaPlayer(d, idx)}
            onClear={clearHistory}
          />
        ) : tab === "server" ? (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-zinc-900 to-[#11111d] border border-amber-400/20 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-extrabold text-amber-400 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" /> Gateway & API Status
                </h2>
                <p className="text-xs text-zinc-400 mt-1">
                  Uptime: {serverInfo?.uptime || "99.9%"} • Online: {serverInfo?.online ?? 42}/{serverInfo?.totalProviders ?? 42}
                </p>
              </div>
              <span className="px-3 py-1 rounded-full bg-emerald-500/15 text-emerald-400 text-xs font-bold">
                AKTIF
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {(serverInfo?.providers || []).map((srv, idx) => (
                <div
                  key={`${srv.slug || srv.name}-${idx}`}
                  className="p-3.5 rounded-2xl bg-zinc-900/75 border border-white/10 flex items-center justify-between"
                >
                  <div>
                    <p className="text-xs font-bold text-white">{srv.name}</p>
                    <p className="text-[11px] text-zinc-500">{srv.latency ? `${srv.latency} ms` : "Low latency"}</p>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-extrabold uppercase">
                    {srv.status || "online"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
            {Array.from({ length: 10 }).map((_, idx) => (
              <div key={idx} className="aspect-[3/4] rounded-2xl bg-zinc-900 animate-pulse border border-white/5" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <p className="text-sm font-bold text-zinc-300">Drama tidak ditemukan</p>
            <p className="text-xs text-zinc-500">Coba kata kunci lain atau pindah penyedia.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
            {items.map((item, idx) => (
              <div
                key={`${item.provider}-${item.id}-${idx}`}
                onClick={() => openDramaPlayer(item, 0)}
                className="group relative rounded-2xl overflow-hidden bg-zinc-900 border border-white/10 hover:border-amber-400/40 cursor-pointer active:scale-[0.98] transition"
              >
                <div className="aspect-[3/4] w-full overflow-hidden bg-zinc-950">
                  <img
                    src={item.cover}
                    alt={item.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                  />
                </div>

                {item.episodes > 0 && (
                  <span className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/75 backdrop-blur-md text-[10px] font-extrabold text-amber-400">
                    {item.episodes} Ep
                  </span>
                )}

                {item.rating && (
                  <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-rose-600/90 text-[10px] font-extrabold text-white flex items-center gap-0.5">
                    <Star className="w-2.5 h-2.5 fill-white" /> {item.rating}
                  </span>
                )}

                <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black via-black/85 to-transparent">
                  <h3 className="text-xs font-bold text-white line-clamp-2 leading-snug">
                    {item.title}
                  </h3>
                  <div className="mt-1.5 inline-flex items-center gap-1 text-[10px] font-extrabold text-amber-300">
                    <Play className="w-3 h-3 fill-amber-300" /> Tonton
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 inset-x-0 z-30 bg-[#090910]/95 backdrop-blur-xl border-t border-white/10">
        <div className="max-w-xl mx-auto flex items-center justify-around py-2.5">
          <button
            onClick={() => {
              setTab("home");
              fetchHome(provider);
            }}
            className={`flex flex-col items-center gap-1 text-[11px] font-bold transition ${
              tab === "home" ? "text-amber-400" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Flame className="w-5 h-5" />
            Beranda
          </button>

          <button
            onClick={() => {
              setTab("explore");
              fetchGenre(genre);
            }}
            className={`flex flex-col items-center gap-1 text-[11px] font-bold transition ${
              tab === "explore" ? "text-amber-400" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Compass className="w-5 h-5" />
            Genre
          </button>

          <button
            onClick={() => setTab("history")}
            className={`flex flex-col items-center gap-1 text-[11px] font-bold transition ${
              tab === "history" ? "text-amber-400" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <History className="w-5 h-5" />
            Riwayat
          </button>

          <button
            onClick={openServerTab}
            className={`flex flex-col items-center gap-1 text-[11px] font-bold transition ${
              tab === "server" ? "text-amber-400" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <Server className="w-5 h-5" />
            Server
          </button>
        </div>
      </nav>

      {/* Fullscreen Vertical Player */}
      {playerState && (
        <VerticalPlayer
          drama={playerState.drama}
          startEpIndex={playerState.epIndex}
          onProgress={saveHistory}
          onClose={() => setPlayerState(null)}
        />
      )}
    </div>
  );
}
