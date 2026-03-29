"use client";
// components/music/MusicPlayer.tsx
// FIX: stale closure bug on isPlaying, volume, isMuted inside track-change effect
// — now uses refs to always read latest values without re-creating the Audio element
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play, Pause, SkipBack, SkipForward,
  Volume2, VolumeX, Music2, ChevronDown,
} from "lucide-react";

export interface Track {
  id: string;
  title: string;
  artist: string;
  src: string;
  cover?: string;
}

function formatDuration(secs: number): string {
  if (!isFinite(secs) || isNaN(secs)) return "0:00";
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function VinylRecord({ spinning }: { spinning: boolean }) {
  return (
    <motion.div
      animate={{ rotate: spinning ? 360 : 0 }}
      transition={{ duration: 3, repeat: spinning ? Infinity : 0, ease: "linear",
        ...(spinning ? {} : { type: "tween", duration: 0.5 }) }}
      className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
      style={{ background: "radial-gradient(circle at 40% 40%, #2a2a3a, #08080e)", border: "2px solid #252535" }}
    >
      <div className="w-2 h-2 rounded-full bg-faint border border-border/50" />
    </motion.div>
  );
}

interface MusicPlayerProps { tracks: Track[] }

export default function MusicPlayer({ tracks }: MusicPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying]       = useState(false);
  const [progress, setProgress]         = useState(0);
  const [duration, setDuration]         = useState(0);
  const [elapsed, setElapsed]           = useState(0);
  const [volume, setVolume]             = useState(0.75);
  const [isMuted, setIsMuted]           = useState(false);
  const [isMinimized, setIsMinimized]   = useState(false);
  const [isVisible, setIsVisible]       = useState(false);
  const [isLoading, setIsLoading]       = useState(false);

  const audioRef       = useRef<HTMLAudioElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  // ── Refs that always hold the LATEST state values ──────────────
  // These prevent stale closures inside the track-change effect
  const isPlayingRef = useRef(isPlaying);
  const volumeRef    = useRef(volume);
  const isMutedRef   = useRef(isMuted);

  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  useEffect(() => { volumeRef.current    = volume;    }, [volume]);
  useEffect(() => { isMutedRef.current   = isMuted;   }, [isMuted]);
  // ──────────────────────────────────────────────────────────────

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 3500);
    return () => clearTimeout(timer);
  }, []);

  // Track-change effect — reads latest values via refs, not stale closures
  useEffect(() => {
    const track = tracks[currentIndex];
    if (!track?.src) return;

    setIsLoading(true);
    setElapsed(0); setProgress(0); setDuration(0);

    const audio = new Audio();
    audioRef.current = audio;
    audio.preload = "metadata";
    // ✅ Read from refs — always current, no stale closure
    audio.volume = isMutedRef.current ? 0 : volumeRef.current;

    const onTime     = () => {
      setElapsed(audio.currentTime);
      setProgress(audio.duration && isFinite(audio.duration)
        ? audio.currentTime / audio.duration : 0);
    };
    const onDuration = () => { setDuration(audio.duration); setIsLoading(false); };
    const onCanPlay  = () => setIsLoading(false);
    const onEnded    = () => {
      setCurrentIndex((i) => (i + 1) % tracks.length);
      setIsPlaying(true); // ensure playing state for next track
    };
    const onError = () => {
      setIsLoading(false);
      setCurrentIndex((i) => (i + 1) % tracks.length);
    };

    audio.addEventListener("timeupdate",     onTime);
    audio.addEventListener("durationchange", onDuration);
    audio.addEventListener("canplay",        onCanPlay);
    audio.addEventListener("ended",          onEnded);
    audio.addEventListener("error",          onError);
    audio.src = track.src;

    // ✅ Use ref value — not stale isPlaying from closure
    if (isPlayingRef.current) {
      audio.play().catch((err) => {
        if (err.name !== "AbortError") setIsPlaying(false);
      });
    }

    return () => {
      audio.pause(); audio.src = "";
      audio.removeEventListener("timeupdate",     onTime);
      audio.removeEventListener("durationchange", onDuration);
      audio.removeEventListener("canplay",        onCanPlay);
      audio.removeEventListener("ended",          onEnded);
      audio.removeEventListener("error",          onError);
      audioRef.current = null;
    };
  }, [currentIndex, tracks]); // intentionally excludes isPlaying/volume/isMuted — handled by refs

  // Play/pause effect
  useEffect(() => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.play().catch((err) => {
        if (err.name !== "AbortError") setIsPlaying(false);
      });
    } else {
      audioRef.current.pause();
    }
  }, [isPlaying]);

  // Volume/mute effect
  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  const goToPrev = useCallback(() => {
    if (elapsed > 3 && audioRef.current) {
      audioRef.current.currentTime = 0;
      return;
    }
    setCurrentIndex((i) => (i - 1 + tracks.length) % tracks.length);
    setIsPlaying(true);
  }, [elapsed, tracks.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((i) => (i + 1) % tracks.length);
    setIsPlaying(true);
  }, [tracks.length]);

  const handleProgressClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || !audioRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const pct  = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    audioRef.current.currentTime = pct * duration;
    setProgress(pct);
  }, [duration]);

  if (!tracks.length || !tracks.some((t) => t.src)) return null;
  const currentTrack = tracks[currentIndex];

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 26 }}
          className="fixed bottom-0 left-0 right-0 sm:bottom-5 sm:left-auto sm:right-5 sm:w-72 z-50"
          role="region"
          aria-label="Music player"
        >
          <div className="card-glass rounded-t-2xl sm:rounded-2xl overflow-hidden shadow-gold-glow">
            {/* Header */}
            <button
              className="w-full flex items-center justify-between px-4 py-3 border-b border-border/50 hover:bg-faint/50 transition-colors"
              onClick={() => setIsMinimized((v) => !v)}
              aria-expanded={!isMinimized}
            >
              <div className="flex items-center gap-2">
                <Music2 size={12} className="text-gold" />
                <span className="font-mono text-[10px] text-muted tracking-widest uppercase">Class Playlist</span>
              </div>
              <motion.div animate={{ rotate: isMinimized ? 0 : 180 }} transition={{ duration: 0.22 }}>
                <ChevronDown size={14} className="text-muted" />
              </motion.div>
            </button>

            {/* Player body */}
            <AnimatePresence initial={false}>
              {!isMinimized && (
                <motion.div key="body"
                  initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                  style={{ overflow: "hidden" }}>
                  <div className="px-4 py-3 flex flex-col gap-3">
                    {/* Track info */}
                    <div className="flex items-center gap-3">
                      <VinylRecord spinning={isPlaying} />
                      <div className="overflow-hidden flex-1 min-w-0">
                        <p className="font-display text-sm text-ink leading-tight truncate" title={currentTrack?.title}>
                          {isLoading ? "Memuat..." : (currentTrack?.title ?? "—")}
                        </p>
                        <p className="font-mono text-[10px] text-muted mt-0.5 truncate">{currentTrack?.artist}</p>
                      </div>
                      <span className="font-mono text-[9px] text-muted/60 shrink-0">{currentIndex + 1}/{tracks.length}</span>
                    </div>

                    {/* Progress bar */}
                    <div className="flex flex-col gap-1">
                      <div ref={progressBarRef} onClick={handleProgressClick}
                        className="relative h-1.5 bg-faint rounded-full cursor-pointer group"
                        role="slider" aria-valuemin={0} aria-valuemax={100}
                        aria-valuenow={Math.round(progress * 100)} aria-label="Progress lagu">
                        <div className="absolute inset-y-0 left-0 bg-gold rounded-full" style={{ width: `${progress * 100}%` }} />
                        <div className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-gold rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ left: `calc(${progress * 100}% - 6px)` }} />
                      </div>
                      <div className="flex justify-between font-mono text-[9px] text-muted/70">
                        <span>{formatDuration(elapsed)}</span><span>{formatDuration(duration)}</span>
                      </div>
                    </div>

                    {/* Controls */}
                    <div className="flex items-center justify-between">
                      <button onClick={() => setIsMuted((v) => !v)}
                        className="text-muted hover:text-gold transition-colors p-1 rounded-lg hover:bg-faint"
                        aria-label={isMuted ? "Unmute" : "Mute"}>
                        {isMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                      </button>

                      <div className="flex items-center gap-4">
                        <button onClick={goToPrev} className="text-muted hover:text-ink transition-colors" aria-label="Sebelumnya">
                          <SkipBack size={16} />
                        </button>
                        <motion.button whileTap={{ scale: 0.88 }}
                          onClick={() => setIsPlaying((v) => !v)}
                          className="w-9 h-9 rounded-full bg-gold flex items-center justify-center text-void shadow-gold-glow hover:bg-gold-dim transition-colors"
                          aria-label={isPlaying ? "Pause" : "Play"}>
                          <AnimatePresence mode="wait" initial={false}>
                            {isPlaying
                              ? <motion.span key="pause" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ duration: 0.1 }}><Pause size={14} fill="currentColor" /></motion.span>
                              : <motion.span key="play"  initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} transition={{ duration: 0.1 }}><Play  size={14} fill="currentColor" className="ml-0.5" /></motion.span>
                            }
                          </AnimatePresence>
                        </motion.button>
                        <button onClick={goToNext} className="text-muted hover:text-ink transition-colors" aria-label="Berikutnya">
                          <SkipForward size={16} />
                        </button>
                      </div>

                      {/* Volume slider — shown on sm+ only */}
                      <div className="hidden sm:flex items-center gap-1.5 w-16">
                        <input type="range" min={0} max={1} step={0.05}
                          value={isMuted ? 0 : volume}
                          onChange={(e) => {
                            const v = parseFloat(e.target.value);
                            setVolume(v);
                            if (v > 0) setIsMuted(false);
                          }}
                          className="w-full h-1 appearance-none rounded-full bg-faint cursor-pointer"
                          style={{ accentColor: "#f5c842" }} aria-label="Volume" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
