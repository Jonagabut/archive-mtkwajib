"use client";
// components/music/MusicPlayer.tsx
//
// A floating music player widget for the class archive.
// Uses the browser's native Audio API directly — no library needed.
//
// WHY native Audio over a library:
//   Libraries like Howler.js add 30-50kb for features we don't need.
//   The Web Audio API and HTMLAudioElement are powerful enough here,
//   and we have full control over cleanup (no memory leaks).
//
// MEMORY LEAK PREVENTION:
//   Every time the current track changes, we create a NEW Audio element
//   and DESTROY the old one completely (pause, clear src, remove all listeners).
//   This is the only reliable way — just removing the src isn't enough because
//   some browsers keep the decode buffer alive.
//
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

// Small spinning vinyl record animation (pure CSS/SVG, no extra package)
function VinylRecord({ spinning }: { spinning: boolean }) {
  return (
    <motion.div
      animate={{ rotate: spinning ? 360 : 0 }}
      transition={{
        duration: 3,
        repeat: spinning ? Infinity : 0,
        ease: "linear",
        // When stopped mid-rotation, animate smoothly back to 0
        ...(spinning ? {} : { type: "tween", duration: 0.5 }),
      }}
      className="w-10 h-10 rounded-full bg-void border-2 border-border flex items-center justify-center overflow-hidden flex-shrink-0"
      style={{
        background: "radial-gradient(circle at 40% 40%, #2a2a3a, #08080e)",
      }}
    >
      {/* Vinyl grooves — purely decorative */}
      <div className="w-2 h-2 rounded-full bg-faint border border-border/50" />
    </motion.div>
  );
}

interface MusicPlayerProps {
  tracks: Track[];
}

export default function MusicPlayer({ tracks }: MusicPlayerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying]       = useState(false);
  const [progress, setProgress]         = useState(0);     // 0 to 1
  const [duration, setDuration]         = useState(0);
  const [elapsed, setElapsed]           = useState(0);
  const [volume, setVolume]             = useState(0.75);
  const [isMuted, setIsMuted]           = useState(false);
  const [isMinimized, setIsMinimized]   = useState(false);
  const [isVisible, setIsVisible]       = useState(false);
  const [isLoading, setIsLoading]       = useState(false);

  const audioRef       = useRef<HTMLAudioElement | null>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);

  // Don't show the player immediately — let the page settle first
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 3500);
    return () => clearTimeout(timer);
  }, []);

  // Core audio setup: runs whenever the track index changes.
  // We deliberately recreate the Audio element each time to avoid
  // any state leaking between tracks (buffered data, event handlers, etc.)
  useEffect(() => {
    const track = tracks[currentIndex];
    if (!track?.src) return;

    setIsLoading(true);
    setElapsed(0);
    setProgress(0);
    setDuration(0);

    const audio = new Audio();
    audioRef.current = audio;

    audio.preload = "metadata";
    audio.volume  = isMuted ? 0 : volume;

    const handleTimeUpdate  = () => {
      const dur = audio.duration;
      setElapsed(audio.currentTime);
      setProgress(dur && isFinite(dur) ? audio.currentTime / dur : 0);
    };
    const handleDuration    = () => {
      setDuration(audio.duration);
      setIsLoading(false);
    };
    const handleCanPlay     = () => setIsLoading(false);
    const handleEnded       = () => advanceToNext();
    const handleError       = () => {
      // Skip broken tracks silently — don't alarm the user
      console.warn("[MusicPlayer] Error loading track, skipping:", track.src);
      setIsLoading(false);
      advanceToNext();
    };

    audio.addEventListener("timeupdate",    handleTimeUpdate);
    audio.addEventListener("durationchange", handleDuration);
    audio.addEventListener("canplay",       handleCanPlay);
    audio.addEventListener("ended",         handleEnded);
    audio.addEventListener("error",         handleError);

    // Set src AFTER attaching listeners to avoid missing early events
    audio.src = track.src;

    if (isPlaying) {
      audio.play().catch((err) => {
        // AbortError happens when src changes during play — safe to ignore
        if (err.name !== "AbortError") {
          console.warn("[MusicPlayer] Autoplay blocked:", err.message);
          setIsPlaying(false);
        }
      });
    }

    // Cleanup: destroy the element completely — this is what prevents memory leaks
    return () => {
      audio.pause();
      audio.src = "";    // Releases the network request and decode buffer
      audio.removeEventListener("timeupdate",     handleTimeUpdate);
      audio.removeEventListener("durationchange", handleDuration);
      audio.removeEventListener("canplay",        handleCanPlay);
      audio.removeEventListener("ended",          handleEnded);
      audio.removeEventListener("error",          handleError);
      audioRef.current = null;
    };
  // We intentionally exclude `isPlaying` from deps here — play state
  // is managed in a separate effect below to avoid re-mounting the audio element
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentIndex, tracks]);

  // Separate effect for play/pause to avoid reconstructing the Audio element
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.play().catch((err) => {
        if (err.name !== "AbortError") setIsPlaying(false);
      });
    } else {
      audio.pause();
    }
  }, [isPlaying]);

  // Sync volume/mute changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const advanceToNext = useCallback(() => {
    setCurrentIndex((i) => (i + 1) % tracks.length);
    setIsPlaying(true);
  }, [tracks.length]);

  const goToPrev = useCallback(() => {
    // If we've been listening for more than 3 seconds, restart instead of skipping back.
    // This matches what most music apps do and feels more natural.
    if (elapsed > 3 && audioRef.current) {
      audioRef.current.currentTime = 0;
      return;
    }
    setCurrentIndex((i) => (i - 1 + tracks.length) % tracks.length);
    setIsPlaying(true);
  }, [elapsed, tracks.length]);

  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!progressBarRef.current || !audioRef.current) return;
      const rect = progressBarRef.current.getBoundingClientRect();
      const pct  = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      audioRef.current.currentTime = pct * duration;
      setProgress(pct);
    },
    [duration]
  );

  // If no tracks are configured, render nothing — no error, no placeholder
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
          className="fixed bottom-5 right-5 z-30 w-72"
          role="region"
          aria-label="Music player"
        >
          <div className="card-glass rounded-2xl overflow-hidden shadow-gold-glow">
            {/* ── Header (always visible, toggles minimize) ── */}
            <button
              className="w-full flex items-center justify-between px-4 py-3 border-b border-border/50 hover:bg-faint/50 transition-colors cursor-pointer"
              onClick={() => setIsMinimized((v) => !v)}
              aria-expanded={!isMinimized}
              aria-label={isMinimized ? "Buka music player" : "Tutup music player"}
            >
              <div className="flex items-center gap-2">
                <Music2 size={12} className="text-gold" />
                <span className="font-mono text-[10px] text-muted tracking-widest uppercase">
                  Class Playlist
                </span>
              </div>
              <motion.div
                animate={{ rotate: isMinimized ? 0 : 180 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
              >
                <ChevronDown size={14} className="text-muted" />
              </motion.div>
            </button>

            {/* ── Player body ── */}
            <AnimatePresence initial={false}>
              {!isMinimized && (
                <motion.div
                  key="player-body"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                  style={{ overflow: "hidden" }}
                >
                  <div className="px-4 py-3 flex flex-col gap-3">
                    {/* ── Track info ── */}
                    <div className="flex items-center gap-3">
                      <VinylRecord spinning={isPlaying} />
                      <div className="overflow-hidden flex-1 min-w-0">
                        <p
                          className="font-display text-sm text-ink leading-tight"
                          style={{
                            // Scroll text if too long
                            overflow: "hidden",
                            whiteSpace: "nowrap",
                            textOverflow: "ellipsis",
                          }}
                          title={currentTrack?.title}
                        >
                          {isLoading ? "Memuat..." : (currentTrack?.title ?? "—")}
                        </p>
                        <p className="font-mono text-[10px] text-muted mt-0.5 truncate">
                          {currentTrack?.artist}
                        </p>
                      </div>
                      <span className="font-mono text-[9px] text-muted/60 shrink-0">
                        {currentIndex + 1}/{tracks.length}
                      </span>
                    </div>

                    {/* ── Progress bar ── */}
                    <div className="flex flex-col gap-1">
                      <div
                        ref={progressBarRef}
                        onClick={handleProgressClick}
                        className="relative h-1.5 bg-faint rounded-full cursor-pointer group"
                        role="slider"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={Math.round(progress * 100)}
                        aria-label="Progress lagu"
                      >
                        {/* Fill */}
                        <div
                          className="absolute inset-y-0 left-0 bg-gold rounded-full transition-none"
                          style={{ width: `${progress * 100}%` }}
                        />
                        {/* Scrubber dot — only visible on hover */}
                        <div
                          className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-gold rounded-full shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ left: `calc(${progress * 100}% - 6px)` }}
                        />
                      </div>
                      <div className="flex justify-between font-mono text-[9px] text-muted/70">
                        <span>{formatDuration(elapsed)}</span>
                        <span>{formatDuration(duration)}</span>
                      </div>
                    </div>

                    {/* ── Controls ── */}
                    <div className="flex items-center justify-between">
                      {/* Volume toggle */}
                      <button
                        onClick={() => setIsMuted((v) => !v)}
                        className="text-muted hover:text-gold transition-colors p-1 rounded-lg hover:bg-faint"
                        aria-label={isMuted ? "Unmute" : "Mute"}
                      >
                        {isMuted ? (
                          <VolumeX size={14} />
                        ) : (
                          <Volume2 size={14} />
                        )}
                      </button>

                      {/* Playback */}
                      <div className="flex items-center gap-3">
                        <button
                          onClick={goToPrev}
                          className="text-muted hover:text-ink transition-colors"
                          aria-label="Lagu sebelumnya"
                        >
                          <SkipBack size={16} />
                        </button>

                        <motion.button
                          whileTap={{ scale: 0.88 }}
                          onClick={() => setIsPlaying((v) => !v)}
                          className="w-9 h-9 rounded-full bg-gold flex items-center justify-center text-void shadow-gold-glow hover:bg-gold-dim transition-colors"
                          aria-label={isPlaying ? "Pause" : "Play"}
                        >
                          <AnimatePresence mode="wait" initial={false}>
                            {isPlaying ? (
                              <motion.span
                                key="pause"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                                transition={{ duration: 0.12 }}
                              >
                                <Pause size={14} fill="currentColor" />
                              </motion.span>
                            ) : (
                              <motion.span
                                key="play"
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                exit={{ scale: 0 }}
                                transition={{ duration: 0.12 }}
                              >
                                <Play size={14} fill="currentColor" className="ml-0.5" />
                              </motion.span>
                            )}
                          </AnimatePresence>
                        </motion.button>

                        <button
                          onClick={advanceToNext}
                          className="text-muted hover:text-ink transition-colors"
                          aria-label="Lagu berikutnya"
                        >
                          <SkipForward size={16} />
                        </button>
                      </div>

                      {/* Volume slider — hidden on mobile, shown on desktop */}
                      <div className="hidden sm:flex items-center gap-1.5 w-16">
                        <input
                          type="range"
                          min={0}
                          max={1}
                          step={0.05}
                          value={isMuted ? 0 : volume}
                          onChange={(e) => {
                            const v = parseFloat(e.target.value);
                            setVolume(v);
                            if (v > 0) setIsMuted(false);
                          }}
                          className="w-full h-1 appearance-none rounded-full bg-faint cursor-pointer"
                          style={{
                            // Custom thumb using accent color
                            accentColor: "#f5c842",
                          }}
                          aria-label="Volume"
                        />
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
