"use client";
// components/gallery/MediaGallery.tsx
import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
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

// Client-side compression: resize to max 1280px, JPEG 82%
async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;
  return new Promise((resolve) => {
    const img = new window.Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const MAX = 1280;
      let { width, height } = img;
      if (width > MAX || height > MAX) {
        if (width > height) { height = Math.round(height * MAX / width); width = MAX; }
        else { width = Math.round(width * MAX / height); height = MAX; }
      }
      const c = document.createElement("canvas");
      c.width = width; c.height = height;
      c.getContext("2d")!.drawImage(img, 0, 0, width, height);
      c.toBlob((blob) => {
        if (!blob) { resolve(file); return; }
        const out = new File([blob], file.name.replace(/\.\w+$/, ".jpg"), { type: "image/jpeg" });
        resolve(out.size < file.size ? out : file);
      }, "image/jpeg", 0.82);
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}

// ── Lightbox ──────────────────────────────────────────────────────
function Lightbox({ media, all, onClose, onNavigate }: {
  media: GalleryMedia; all: GalleryMedia[];
  onClose: () => void; onNavigate: (d: "prev" | "next") => void;
}) {
  const [downloading, setDownloading] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const idx = all.findIndex((m) => m.id === media.id);

  useEffect(() => { overlayRef.current?.focus(); }, []);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape")     onClose();
    if (e.key === "ArrowLeft")  onNavigate("prev");
    if (e.key === "ArrowRight") onNavigate("next");
  }, [onClose, onNavigate]);

  const handleDownload = useCallback(async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      const blob = await (await fetch(media.storage_url)).blob();
      const url  = URL.createObjectURL(blob);
      const ext  = media.mime_type?.split("/")[1] ?? "jpg";
      const a    = Object.assign(document.createElement("a"), {
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
      transition={{ duration: 0.16 }}
      className="lb-overlay fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5"
      style={{ background: "rgba(3,8,15,0.96)" }}
      onClick={onClose} onKeyDown={handleKeyDown} tabIndex={-1}>
      <motion.div
        initial={{ scale: 0.93, y: 12 }} animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.93, y: 12 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-4xl flex flex-col gap-2.5"
        style={{ maxHeight: "92dvh" }}
        onClick={(e) => e.stopPropagation()}>

        {/* Top bar */}
        <div className="flex items-center justify-between gap-2 flex-shrink-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-mono text-[9px] px-2 py-0.5 rounded"
              style={{ background: "rgba(56,178,255,0.12)", color: "var(--gold)" }}>
              {media.category}
            </span>
            {media.uploaded_by && (
              <span className="font-mono text-[9px] truncate" style={{ color: "var(--muted)" }}>
                oleh {media.uploaded_by}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={handleDownload} disabled={downloading}
              className="btn-gold py-1.5 px-3 text-xs disabled:opacity-50">
              {downloading ? <Loader2 size={11} className="animate-spin" /> : <Download size={11} />}
              {downloading ? "..." : "Save"}
            </button>
            <button onClick={onClose} className="p-2 rounded-xl"
              style={{ color: "var(--muted)" }}>
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Media — arrows inside frame, safe on Android */}
        <div className="relative rounded-2xl overflow-hidden flex items-center justify-center"
          style={{ background: "var(--faint)", maxHeight: "calc(92dvh - 90px)" }}>
          {media.media_type === "video" ? (
            <video src={media.storage_url} controls autoPlay playsInline preload="metadata"
              className="w-full object-contain rounded-2xl"
              style={{ maxHeight: "calc(92dvh - 90px)", background: "#05050a" }} />
          ) : (
            <Image src={media.storage_url} alt={media.caption ?? "Archive photo"}
              width={media.width ?? 1200} height={media.height ?? 800}
              className="object-contain w-full rounded-2xl"
              style={{ maxHeight: "calc(92dvh - 90px)" }} priority />
          )}

          {idx > 0 && (
            <button onClick={(e) => { e.stopPropagation(); onNavigate("prev"); }}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center transition-colors"
              style={{ background: "rgba(3,8,15,0.7)", backdropFilter: "blur(6px)", color: "var(--ink)" }}>
              <ChevronLeft size={18} />
            </button>
          )}
          {idx < all.length - 1 && (
            <button onClick={(e) => { e.stopPropagation(); onNavigate("next"); }}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full flex items-center justify-center transition-colors"
              style={{ background: "rgba(3,8,15,0.7)", backdropFilter: "blur(6px)", color: "var(--ink)" }}>
              <ChevronRight size={18} />
            </button>
          )}

          <span className="absolute bottom-2 right-2 font-mono text-[9px] rounded px-1.5 py-0.5"
            style={{ background: "rgba(3,8,15,0.6)", color: "rgba(218,234,248,0.5)" }}>
            {idx + 1}/{all.length}
          </span>
        </div>

        {media.caption && (
          <p className="font-body text-sm px-1 flex-shrink-0" style={{ color: "var(--muted)" }}>
            {media.caption}
          </p>
        )}
      </motion.div>
    </motion.div>
  );
}

// ── MediaCard ─────────────────────────────────────────────────────
function MediaCard({ media, onOpen, index }: { media: GalleryMedia; onOpen: () => void; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-16px" }}
      transition={{ duration: 0.4, delay: (index % 6) * 0.04 }}
      className="mb-3 md:mb-4 group cursor-pointer rounded-xl overflow-hidden border transition-all duration-300"
      style={{ background: "var(--faint)", borderColor: "var(--border)" }}
      onClick={onOpen}>
      {media.media_type === "video" ? (
        <div className="relative aspect-video">
          <video src={media.storage_url + "#t=1"} preload="metadata"
            className="w-full h-full object-cover" muted playsInline />
          <div className="absolute inset-0 flex items-center justify-center transition-colors"
            style={{ background: "rgba(3,8,15,0.5)" }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center shadow-gold-glow"
              style={{ background: "var(--gold)" }}>
              <Play size={14} fill="currentColor" style={{ color: "#03080f", marginLeft: 2 }} />
            </div>
          </div>
          <span className="absolute top-2 left-2 font-mono text-[8px] rounded px-1.5 py-0.5"
            style={{ background: "var(--gold)", color: "#03080f" }}>VID</span>
        </div>
      ) : (
        <div className="relative overflow-hidden">
          <Image src={media.storage_url} alt={media.caption ?? ""}
            width={media.width ?? 600} height={media.height ?? 400}
            className="w-full object-cover transition-transform duration-500 group-hover:scale-[1.04]" />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ background: "rgba(3,8,15,0.3)" }}>
            <ZoomIn size={20} style={{ color: "white" }} className="drop-shadow-lg" />
          </div>
        </div>
      )}
      <div className="p-2.5">
        <div className="flex items-center justify-between gap-1">
          <span className="font-mono text-[9px] rounded px-1.5 py-0.5 truncate"
            style={{ background: "rgba(56,178,255,0.1)", color: "var(--gold)" }}>
            {media.category}
          </span>
          {media.uploaded_by && (
            <span className="font-mono text-[9px] truncate" style={{ color: "var(--muted)" }}>
              @{media.uploaded_by}
            </span>
          )}
        </div>
        {media.caption && (
          <p className="mt-1 font-body text-[11px] line-clamp-2 leading-relaxed"
            style={{ color: "var(--muted)" }}>
            {media.caption}
          </p>
        )}
      </div>
    </motion.div>
  );
}

// ── Upload Modal ──────────────────────────────────────────────────
function UploadModal({ onClose }: { onClose: () => void }) {
  const router                          = useRouter();
  const fileInputRef                    = useRef<HTMLInputElement>(null);
  const [status, setStatus]             = useState<"idle"|"compressing"|"loading"|"success"|"error">("idle");
  const [errorMsg, setErrorMsg]         = useState("");
  const [fileInfo, setFileInfo]         = useState("");
  const [compressInfo, setCompressInfo] = useState("");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFileInfo(`${f.name} · ${(f.size / 1024 / 1024).toFixed(1)}MB`);
    setCompressInfo("");
    if (f.type.startsWith("image/") && f.type !== "image/gif") {
      setStatus("compressing");
      const comp = await compressImage(f);
      if (comp.size < f.size) {
        setCompressInfo(`dikompres → ${(comp.size / 1024 / 1024).toFixed(1)}MB`);
        const dt = new DataTransfer(); dt.items.add(comp);
        if (fileInputRef.current) fileInputRef.current.files = dt.files;
      }
      setStatus("idle");
    }
  };

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading"); setErrorMsg("");
    try {
      const result = await uploadMediaAction(new FormData(e.currentTarget));
      if (result?.error) { setErrorMsg(result.error); setStatus("error"); }
      else { setStatus("success"); router.refresh(); setTimeout(onClose, 1400); }
    } catch { setErrorMsg("Ada yang salah. Coba lagi?"); setStatus("error"); }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: "rgba(3,8,15,0.88)", backdropFilter: "blur(10px)" }}
      onClick={onClose}>
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", stiffness: 340, damping: 34 }}
        className="card-glass w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl pb-safe"
        onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full" style={{ background: "var(--border)" }} />
        </div>
        <div className="p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-display text-lg" style={{ color: "var(--ink)", fontStyle: "italic" }}>
                Upload ke Archive
              </h3>
              <p className="font-mono text-[9px] mt-0.5" style={{ color: "var(--muted)" }}>
                Foto dikompres otomatis sebelum upload
              </p>
            </div>
            <button onClick={onClose} style={{ color: "var(--muted)" }}><X size={18} /></button>
          </div>

          {status === "success" ? (
            <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="text-center py-8">
              <p className="text-4xl mb-3">✅</p>
              <p className="font-display text-xl" style={{ color: "var(--gold)", fontStyle: "italic" }}>
                Upload berhasil!
              </p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block font-mono text-[11px] mb-1.5 tracking-wide"
                  style={{ color: "var(--muted)" }}>PASSCODE KELAS *</label>
                <input name="passcode" type="password" placeholder="Masukkan passcode" required
                  className="input-void" />
              </div>
              <div>
                <label className="block font-mono text-[11px] mb-1.5 tracking-wide"
                  style={{ color: "var(--muted)" }}>
                  FILE *
                  {status === "compressing" && (
                    <span className="ml-2" style={{ color: "var(--gold)" }}>mengompres...</span>
                  )}
                  {compressInfo && (
                    <span className="ml-2" style={{ color: "var(--sage)" }}>{compressInfo}</span>
                  )}
                </label>
                <input ref={fileInputRef} name="file" type="file" accept="image/*,video/mp4"
                  required onChange={handleFileChange}
                  className="w-full text-sm file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-gold file:text-void hover:file:bg-gold-dim cursor-pointer"
                  style={{ color: "var(--muted)" }} />
                {fileInfo && (
                  <p className="mt-1 font-mono text-[9px]" style={{ color: "rgba(74,106,144,0.7)" }}>
                    {fileInfo}
                  </p>
                )}
              </div>
              <div>
                <label className="block font-mono text-[11px] mb-1.5 tracking-wide"
                  style={{ color: "var(--muted)" }}>KATEGORI *</label>
                <select name="category" required className="input-void">
                  {CATEGORIES.filter((c) => c !== "Semua").map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-mono text-[11px] mb-1.5 tracking-wide"
                  style={{ color: "var(--muted)" }}>CAPTION</label>
                <input name="caption" type="text" placeholder="Ceritain dikit..."
                  maxLength={200} className="input-void" />
              </div>
              <div>
                <label className="block font-mono text-[11px] mb-1.5 tracking-wide"
                  style={{ color: "var(--muted)" }}>NAMA LO</label>
                <input name="uploadedBy" type="text"
                  placeholder="Biar orang tau siapa yang upload"
                  maxLength={60} className="input-void" />
              </div>
              {errorMsg && (
                <p className="text-sm rounded-xl px-3 py-2"
                  style={{ color: "var(--coral)", background: "rgba(255,95,126,0.1)" }}>
                  {errorMsg}
                </p>
              )}
              <button type="submit"
                disabled={status === "loading" || status === "compressing"}
                className="btn-gold justify-center w-full disabled:opacity-50">
                {status === "loading"
                  ? <><Loader2 size={14} className="animate-spin" /> Uploading...</>
                  : <><Upload size={14} /> Upload ke Archive</>
                }
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
    <div className="flex items-center gap-1.5 font-mono text-[10px]"
      style={{ color: on ? "var(--muted)" : "rgba(74,106,144,0.4)" }}>
      {on && <span className="w-1.5 h-1.5 rounded-full animate-pulse"
        style={{ background: "var(--sage)" }} />}
      <span>{on ? "live" : "–"}</span>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────
export default function MediaGallery({ initialMedia }: { initialMedia: GalleryMedia[] }) {
  const [media, setMedia]                   = useState<GalleryMedia[]>(initialMedia);
  const [activeCategory, setActiveCategory] = useState("Semua");
  const [lightboxId, setLightboxId]         = useState<string | null>(null);
  const [showUpload, setShowUpload]         = useState(false);
  const [realtimeOk, setRealtimeOk]         = useState(false);
  const recentlyAdded                       = useRef<Set<string>>(new Set());

  useEffect(() => {
    const sb      = createClient();
    const channel = sb.channel("gallery-live")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "gallery_media" }, (p) => {
        const id = (p.new as GalleryMedia).id;
        if (recentlyAdded.current.has(id)) { recentlyAdded.current.delete(id); return; }
        setMedia((prev) => prev.some((m) => m.id === id) ? prev : [p.new as GalleryMedia, ...prev]);
      })
      .subscribe((s) => setRealtimeOk(s === "SUBSCRIBED"));
    return () => { sb.removeChannel(channel); };
  }, []);

  const filtered = activeCategory === "Semua"
    ? media : media.filter((m) => m.category === activeCategory);

  const lightboxMedia = lightboxId
    ? filtered.find((m) => m.id === lightboxId) ?? null : null;

  const navigate = useCallback((dir: "prev" | "next") => {
    if (!lightboxId) return;
    const i = filtered.findIndex((m) => m.id === lightboxId);
    if (i === -1) return;
    setLightboxId(filtered[dir === "prev" ? Math.max(0, i - 1) : Math.min(filtered.length - 1, i + 1)].id);
  }, [lightboxId, filtered]);

  return (
    <>
      {/* Filter bar */}
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((cat) => (
            <motion.button key={cat} whileTap={{ scale: 0.93 }}
              onClick={() => { setActiveCategory(cat); setLightboxId(null); }}
              className="px-3 py-1.5 rounded-lg font-mono text-[10px] tracking-wide border transition-all duration-200"
              style={activeCategory === cat
                ? { background: "var(--gold)", color: "#03080f", borderColor: "var(--gold)" }
                : { background: "var(--faint)", color: "var(--muted)", borderColor: "var(--border)" }
              }>
              {cat}
            </motion.button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <LiveDot on={realtimeOk} />
          <button onClick={() => setShowUpload(true)} className="btn-gold py-2 px-4 text-xs">
            <Upload size={12} /> Upload
          </button>
        </div>
      </div>

      <p className="font-mono text-[10px] mb-5" style={{ color: "var(--muted)" }}>
        {filtered.length} item{filtered.length !== 1 ? "s" : ""}
        {activeCategory !== "Semua" && ` — ${activeCategory}`}
      </p>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center py-20 gap-4 text-center">
          <ImageIcon size={36} style={{ color: "rgba(74,106,144,0.3)" }} />
          <p className="font-display text-xl" style={{ color: "var(--muted)", fontStyle: "italic" }}>
            Kosong di sini.
          </p>
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
