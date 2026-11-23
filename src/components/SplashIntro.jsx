import React, { useEffect } from "react";
import { motion } from "framer-motion";
import { Crown, Play, Sparkles } from "lucide-react";

export default function SplashIntro({ onFinish }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onFinish();
    }, 3400);
    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.08, filter: "blur(12px)" }}
      transition={{ duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#06060b] px-6 text-center overflow-hidden"
    >
      {/* Luxury Aura Orbs */}
      <motion.div
        animate={{ scale: [1, 1.28, 1], opacity: [0.25, 0.55, 0.25] }}
        transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -top-24 w-96 h-96 rounded-full bg-gradient-to-br from-rose-600/35 via-amber-500/25 to-fuchsia-700/20 blur-3xl pointer-events-none"
      />
      <motion.div
        animate={{ scale: [1.2, 0.95, 1.2], opacity: [0.2, 0.45, 0.2] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute -bottom-24 w-96 h-96 rounded-full bg-gradient-to-tr from-amber-500/25 via-rose-600/30 to-indigo-700/20 blur-3xl pointer-events-none"
      />

      {/* Crown & Cinema Badge */}
      <motion.div
        initial={{ scale: 0, rotate: -140, opacity: 0 }}
        animate={{ scale: 1, rotate: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 130, damping: 14 }}
        className="relative mb-6 flex items-center justify-center w-24 h-24 rounded-[2rem] bg-gradient-to-br from-rose-600 via-red-500 to-amber-400 p-[2px] shadow-[0_0_60px_rgba(244,63,94,0.55)]"
      >
        <div className="w-full h-full rounded-[1.9rem] bg-[#0c0c16] flex items-center justify-center relative">
          <Play className="w-10 h-10 text-amber-400 fill-amber-400 ml-1" />
          <motion.div
            animate={{ y: [-2, 2, -2] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute -top-3.5 bg-gradient-to-r from-amber-400 to-rose-500 p-1.5 rounded-full shadow-lg"
          >
            <Crown className="w-4 h-4 text-black fill-black" />
          </motion.div>
        </div>
      </motion.div>

      {/* Brand Title */}
      <motion.div
        initial={{ y: 24, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.35, duration: 0.7 }}
        className="space-y-2 max-w-md"
      >
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/30 text-amber-300 text-[11px] font-bold tracking-widest uppercase">
          <Sparkles className="w-3.5 h-3.5" /> Exclusive Short Cinema
        </div>

        <h1 className="text-2xl sm:text-3xl font-black tracking-wide bg-gradient-to-r from-white via-amber-200 to-rose-400 bg-clip-text text-transparent">
          M4zk1pL4yDramaBox
        </h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.75, duration: 0.7 }}
          className="text-sm sm:text-base font-medium text-zinc-200 leading-relaxed pt-1"
        >
          Selamat datang di apk <span className="text-amber-400 font-bold">M4zk1pL4yDramaBox</span> selamat menonton
        </motion.p>
      </motion.div>

      {/* Progress Indicator */}
      <div className="w-56 h-1.5 bg-zinc-800/90 rounded-full mt-8 overflow-hidden border border-white/5">
        <motion.div
          initial={{ x: "-100%" }}
          animate={{ x: "0%" }}
          transition={{ duration: 3.1, ease: "easeInOut" }}
          className="h-full bg-gradient-to-r from-rose-500 via-amber-400 to-rose-500"
        />
      </div>

      <button
        onClick={onFinish}
        className="mt-6 text-xs text-zinc-400 hover:text-white underline underline-offset-4 transition"
      >
        Lewati Intro
      </button>
    </motion.div>
  );
}
