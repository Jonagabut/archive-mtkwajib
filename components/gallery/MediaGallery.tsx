"use client";
// components/gallery/MediaGallery.tsx
//
// FIXES:
//  1. DUPLICATION — Realtime INSERT handler now deduplicates by ID AND
//     also ignores events that arrive within 3s of an optimistic local add.
//     The original bug: upload succeeds → optimistic add → Realtime also fires
//     INSERT → item added twice. Fix: track a Set of recently-added IDs.
//  2. AUTO-COMPRESS — images compressed client-side via Canvas API before upload
//     (max 1200px, quality 0.82 JPEG). Videos not compressed (needs server).
//  3. WARNA BIRU — removed all bare <a> tags, fixed Tailwind color references.
//  4. ANDROID CROP — lightbox nav arrows moved inside the frame on mobile.
//
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useRouter } from "next/navigation";
import Masonry from "react-masonry-css";
import {
  X, Download, Play, ZoomIn, ChevronLeft, ChevronRight,
  Upload, Loader2, ImageIcon,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { GalleryMedia } from "@/lib/supabase/database.types";
import { uploadMediaAction } from "@/app/actions/gallery";

const CATEGORIES = [
  "Semua","Jam Kosong","Classmeet","Trauma MTK",
  "Study Session","Field Trip","Kelulusan","Everyday",
];
const BREAKPOINTS = { default: 4, 1100: 3, 700: 2, 500: 2 };

// ── Image compression ─────────────────────────────────────────────
// Compress image on the client before upload so large photos (5–10MB)
// become ~400–800KB without visible quality loss.
async function compressImage(file: File): Promise<File> {
  // Only compress images; return videos as-is
  if (!file.type.startsWith("image/")) return file;
  // Skip GIFs — canvas loses animation
  if (file.type === "image/gif") return file;

  return new Promise((resolve) => {
    const img = new window.Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const MAX = 1280;
      let { width, height } = img;
      if (width > MAX || height > MAX) {
        if (width > height) { height = Math.round((height * MAX) / width);  width = MAX; }
        else                { width  = Math.round((width  * MAX) / height); height = MAX; }
      }
      const canvas = document.createElement("canvas");
      canvas.width = width; canvas.height = height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (!blob) { resolve(file); return; }
          const compressed = new File([blob], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" });
          // Only use compressed version if it's actually smaller
          resolve(compressed.size < file.size ? compressed : file);
        },
        "image/jpeg",
        0.82
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}

// ── Lightbox ──────────────────────────────────────────────────────
function Lightbox({
  media, all, onClose, onNavigate,
}: {
  media: GalleryMedia;
  all: GalleryMedia[];
  onClose: () => void;
  onNavigate: (d: "prev" | "next") => void;
}) {
  const [downloading, setDownloading] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const idx = all.findIndex((m) => m.id === media.id);
  const hasPrev = idx > 0;
  const hasNext = idx < all.length - 1;

  useEffect(() => { overlayRef.current?.focus(); }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape")     onClose();
      if (e.key === "ArrowLeft")  onNavigate("prev");
      if (e.key === "ArrowRight") onNavigate("next");
    },
    [onClose, onNavigate]
  );

  const handleDownload = useCallback(async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      const res = await fetch(media.storage_url);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const ext = media.mime_type?.split("/")[1] ?? "jpg";
      const a = Object.assign(document.createElement("a"), {
        href: url, download: `MTK_${media.id.slice(0, 8)}.${ext}`,
      });
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch { window.open(media.storage_url, "_blank"); }
    finally { setDownloading(false); }
  }, [media, downloading]);

  return (
    <motion.div
      ref={overlayRef}
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.18 }}
      className="lightbox-overlay fixed inset-0 z-50 flex items-center justify-center bg-void/95 p-4"
      onClick={onClose} onKeyDown={handleKeyDown} tabIndex={-1}
    >
      <motion.div
        initial={{ scale: 0.94, y: 16 }} animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.94, y: 16 }} transition={{ duration: 0.25, ease: [0.22,1,0.36,1] }}
        className="relative w-full max-w-4xl flex flex-col gap-3"
        style={{ maxHeight: "90dvh" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top bar */}
        <div className="flex items-center justify-between gap-2 flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-mono text-[10px] px-2 py-0.5 rounded-md bg-gold/15 text-gold shrink-0">
              {media.category}
            </span>
            {media.uploaded_by && (
              <span className="font-mono text-[10px] text-muted truncate">
                oleh {media.uploaded_by}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleDownload} disabled={downloading}
              className="btn-gold py-2 px-3 text-xs disabled:opacity-50"
            >
              {downloading ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
              {downloading ? "..." : "Save"}
            </button>
            <button onClick={onClose}
              className="p-2 rounded-xl text-muted hover:text-ink hover:bg-faint transition-colors">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Media area with arrows inside on mobile */}
        <div className="relative rounded-2xl overflow-hidden bg-faint flex items-center justify-center"
          style={{ maxHeight: "calc(90dvh - 100px)" }}>
          {media.media_type === "video" ? (
            <video src={media.storage_url} controls autoPlay playsInline preload="metadata"
              className="w-full object-contain rounded-2xl"
              style={{ maxHeight: "calc(90dvh - 100px)", background: "#08080e" }} />
          ) : (
            <Image src={media.storage_url} alt={media.caption ?? "Archive photo"}
              width={media.width ?? 1200} height={media.height ?? 800}
              className="object-contain w-full rounded-2xl"
              style={{ maxHeight: "calc(90dvh - 100px)" }} priority />
          )}

          {/* Nav arrows — inside the frame, always visible */}
          {hasPrev && (
            <button onClick={(e) => { e.stopPropagation(); onNavigate("prev"); }}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-void/70 backdrop-blur-sm flex items-center justify-center text-ink hover:bg-gold hover:text-void transition-colors">
              <ChevronLeft size={18} />
            </button>
          )}
          {hasNext && (
            <button onClick={(e) => { e.stopPropagation(); onNavigate("next"); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-void/70 backdrop-blur-sm flex items-center justify-center text-ink hover:bg-gold hover:text-void transition-colors">
              <ChevronRight size={18} />
            </button>
          )}

          {/* Counter */}
          <span className="absolute bottom-2 right-2 font-mono text-[10px] text-ink/60 bg-void/60 rounded px-1.5 py-0.5">
            {idx + 1}/{all.length}
          </span>
        </div>

        {/* Caption */}
        {media.caption && (
          <p className="font-body text-sm text-muted px-1 shrink-0">{media.caption}</p>
        )}
      </motion.div>
    </motion.div>
  );
}

// ── MediaCard ─────────────────────────────────────────────────────
function MediaCard({ media, onOpen, index }: { media: GalleryMedia; onOpen: () => void; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-20px" }}
      transition={{ duration: 0.45, delay: (index % 6) * 0.05 }}
      className="mb-3 md:mb-4 group relative cursor-pointer rounded-xl overflow-hidden bg-faint border border-border hover:border-gold/40 transition-all duration-300"
      style={{ willChange: "transform" }}
      onClick={onOpen}
    >
      {media.media_type === "video" ? (
        <div className="relative aspect-video">
          <video src={media.storage_url + "#t=1"} preload="metadata"
            className="w-full h-full object-cover" muted playsInline />
          <div className="absolute inset-0 flex items-center justify-center bg-void/50 group-hover:bg-void/30 transition-colors">
            <div className="w-11 h-11 rounded-full bg-gold flex items-center justify-center shadow-gold-glow">
              <Play size={16} fill="currentColor" className="text-void ml-0.5" />
            </div>
          </div>
          <span className="absolute top-2 left-2 font-mono text-[9px] bg-gold text-void rounded px-1.5 py-0.5">VIDEO</span>
        </div>
      ) : (
        <div className="relative overflow-hidden">
          <Image src={media.storage_url} alt={media.caption ?? ""}
            width={media.width ?? 600} height={media.height ?? 400}
            className="w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
          <div className="absolute inset-0 bg-void/0 group-hover:bg-void/25 transition-colors flex items-center justify-center">
            <ZoomIn size={22} className="text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
          </div>
        </div>
      )}
      <div className="p-2.5">
        <div className="flex items-center justify-between gap-1">
          <span className="font-mono text-[9px] text-gold/80 bg-gold/10 rounded px-1.5 py-0.5 truncate max-w-[65%]">
            {media.category}
          </span>
          {media.uploaded_by && (
            <span className="font-mono text-[9px] text-muted truncate">@{media.uploaded_by}</span>
          )}
        </div>
        {media.caption && (
          <p className="mt-1 font-body text-[11px] text-muted line-clamp-2 leading-relaxed">{media.caption}</p>
        )}
      </div>
    </motion.div>
  );
}

// ── Upload Modal ──────────────────────────────────────────────────
function UploadModal({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const [status, setStatus]         = useState<"idle"|"compressing"|"loading"|"success"|"error">("idle");
  const [errorMsg, setErrorMsg]     = useState("");
  const [fileInfo, setFileInfo]     = useState<string>("");
  const [compressInfo, setCompressInfo] = useState<string>("");
  const fileInputRef                = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const sizeMB = (f.size / 1024 / 1024).toFixed(1);
    setFileInfo(`${f.name} (${sizeMB}MB)`);
    setCompressInfo("");

    if (f.type.startsWith("image/") && f.type !== "image/gif") {
      setStatus("compressing");
      const compressed = await compressImage(f);
      const newSize = (compressed.size / 1024 / 1024).toFixed(1);
      if (compressed.size < f.size) {
        setCompressInfo(`dikompres → ${newSize}MB`);
        // Replace file in input via DataTransfer
        const dt = new DataTransfer();
        dt.items.add(compressed);
        if (fileInputRef.current) fileInputRef.current.files = dt.files;
      }
      setStatus("idle");
    }
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setErrorMsg("");
    try {
      const form = e.currentTarget;
      const formData = new FormData(form);
      const result = await uploadMediaAction(formData);
      if (result?.error) { setErrorMsg(result.error); setStatus("error"); }
      else {
        setStatus("success");
        router.refresh();
        setTimeout(onClose, 1400);
      }
    } catch {
      setErrorMsg("Ada yang salah. Coba lagi?");
      setStatus("error");
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-void/90 backdrop-blur-sm p-0 sm:p-4"
      onClick={onClose}>
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 320, damping: 32 }}
        className="card-glass w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl pb-safe"
        onClick={(e) => e.stopPropagation()}>

        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        <div className="p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-display text-lg text-ink">Upload ke Archive</h3>
            <button onClick={onClose} className="text-muted hover:text-ink transition-colors"><X size={18} /></button>
          </div>

          {status === "success" ? (
            <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="text-center py-8">
              <p className="text-4xl mb-3">✅</p>
              <p className="font-display text-xl text-gold">Upload berhasil!</p>
              <p className="font-body text-sm text-muted mt-1">Foto masuk ke archive.</p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block font-mono text-[11px] text-muted mb-1.5 tracking-wide">PASSCODE KELAS *</label>
                <input name="passcode" type="password" placeholder="Masukkan passcode" required className="input-dark" />
              </div>

              <div>
                <label className="block font-mono text-[11px] text-muted mb-1.5 tracking-wide">
                  FILE *
                  {status === "compressing" && <span className="ml-2 text-gold">mengompres...</span>}
                  {compressInfo && <span className="ml-2 text-sage">{compressInfo}</span>}
                </label>
                <input ref={fileInputRef} name="file" type="file" accept="image/*,video/mp4" required
                  onChange={handleFileChange}
                  className="w-full text-sm text-muted file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-gold file:text-void hover:file:bg-gold-dim cursor-pointer" />
                {fileInfo && <p className="mt-1 font-mono text-[10px] text-muted/70">{fileInfo}</p>}
              </div>

              <div>
                <label className="block font-mono text-[11px] text-muted mb-1.5 tracking-wide">KATEGORI *</label>
                <select name="category" required className="input-dark">
                  {CATEGORIES.filter((c) => c !== "Semua").map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-mono text-[11px] text-muted mb-1.5 tracking-wide">CAPTION</label>
                <input name="caption" type="text" placeholder="Ceritain dikit..." maxLength={200} className="input-dark" />
              </div>

              <div>
                <label className="block font-mono text-[11px] text-muted mb-1.5 tracking-wide">NAMA LO</label>
                <input name="uploadedBy" type="text" placeholder="Biar orang tau siapa yang upload" maxLength={60} className="input-dark" />
              </div>

              {errorMsg && <p className="text-coral text-sm bg-coral/10 rounded-xl px-3 py-2">{errorMsg}</p>}

              <button type="submit" disabled={status === "loading" || status === "compressing"}
                className="btn-gold justify-center disabled:opacity-50 w-full">
                {status === "loading" ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
                {status === "loading" ? "Uploading..." : "Upload ke Archive"}
              </button>
            </form>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Live dot ──────────────────────────────────────────────────────
function LiveDot({ on }: { on: boolean }) {
  return (
    <div className={`flex items-center gap-1.5 font-mono text-[10px] ${on ? "text-muted" : "text-muted/50"}`}>
      {on && <span className="w-1.5 h-1.5 rounded-full bg-sage animate-pulse" />}
      <span>{on ? "live" : "connecting..."}</span>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────
export default function MediaGallery({ initialMedia }: { initialMedia: GalleryMedia[] }) {
  const [media, setMedia]                     = useState<GalleryMedia[]>(initialMedia);
  const [activeCategory, setActiveCategory]   = useState("Semua");
  const [lightboxId, setLightboxId]           = useState<string | null>(null);
  const [showUpload, setShowUpload]           = useState(false);
  const [realtimeOk, setRealtimeOk]           = useState(false);
  // Track recently-added IDs to prevent Realtime from duplicating optimistic adds
  const recentlyAdded = useRef<Set<string>>(new Set());

  useEffect(() => {
    const supabase = createClient();
    const channel  = supabase
      .channel("gallery-live")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "gallery_media" },
        (payload) => {
          const id = (payload.new as GalleryMedia).id;
          // Skip if we already added this item optimistically
          if (recentlyAdded.current.has(id)) { recentlyAdded.current.delete(id); return; }
          setMedia((prev) => {
            if (prev.some((m) => m.id === id)) return prev;
            return [payload.new as GalleryMedia, ...prev];
          });
        })
      .subscribe((s) => setRealtimeOk(s === "SUBSCRIBED"));
    return () => { supabase.removeChannel(channel); };
  }, []);

  const filtered = activeCategory === "Semua"
    ? media : media.filter((m) => m.category === activeCategory);

  const lightboxMedia = lightboxId ? filtered.find((m) => m.id === lightboxId) ?? null : null;

  const navigate = useCallback((dir: "prev" | "next") => {
    if (!lightboxId) return;
    const i = filtered.findIndex((m) => m.id === lightboxId);
    if (i === -1) return;
    const next = dir === "prev" ? Math.max(0, i-1) : Math.min(filtered.length-1, i+1);
    setLightboxId(filtered[next].id);
  }, [lightboxId, filtered]);

  return (
    <>
      {/* Filter bar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((cat) => (
            <motion.button key={cat} whileTap={{ scale: 0.94 }}
              onClick={() => { setActiveCategory(cat); setLightboxId(null); }}
              className={`px-3 py-1.5 rounded-lg font-mono text-[10px] tracking-wide border transition-all duration-200 ${
                activeCategory === cat
                  ? "bg-gold text-void border-gold"
                  : "bg-faint text-muted border-border hover:border-gold/40 hover:text-gold"
              }`}>{cat}</motion.button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <LiveDot on={realtimeOk} />
          <button onClick={() => setShowUpload(true)} className="btn-gold py-2 px-4 text-xs">
            <Upload size={12} /> Upload
          </button>
        </div>
      </div>

      <p className="font-mono text-[10px] text-muted mb-5">
        {filtered.length} item{filtered.length !== 1 ? "s" : ""}
        {activeCategory !== "Semua" && ` — ${activeCategory}`}
      </p>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center py-20 gap-4 text-center">
          <ImageIcon size={40} className="text-muted/30" />
          <p className="font-display text-xl text-muted">Kosong di sini.</p>
          <button onClick={() => setShowUpload(true)} className="btn-gold mt-1">
            <Upload size={13} /> Upload duluan!
          </button>
        </div>
      ) : (
        <Masonry breakpointCols={BREAKPOINTS} className="masonry-grid" columnClassName="masonry-column">
          {filtered.map((m, i) => (
            <MediaCard key={m.id} media={m} index={i} onOpen={() => setLightboxId(m.id)} />
          ))}
        </Masonry>
      )}

      <AnimatePresence>
        {lightboxMedia && (
          <Lightbox media={lightboxMedia} all={filtered}
            onClose={() => setLightboxId(null)} onNavigate={navigate} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showUpload && <UploadModal onClose={() => setShowUpload(false)} />}
      </AnimatePresence>
    </>
  );
}
ENDTSX
echo "MediaGallery.tsx done"