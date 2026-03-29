import HeroSection     from "@/components/hero/HeroSection";
import NavBar          from "@/components/layout/NavBar";
import StudentRoster   from "@/components/roster/StudentRoster";
import MediaGallery    from "@/components/gallery/MediaGallery";
import ConfessionBoard from "@/components/board/ConfessionBoard";
import Footer          from "@/components/layout/Footer";
import MusicPlayer     from "@/components/music/MusicPlayer";
import { createAdminClient } from "@/lib/supabase/server";
import type { Student, GalleryMedia, Confession } from "@/lib/supabase/database.types";
import type { Track } from "@/components/music/MusicPlayer";

export const revalidate = 10; // 10s cukup — realtime + router.refresh() handle update instan

async function getStudents(): Promise<Student[]> {
  const { data } = await createAdminClient()
    .from("students").select("*").order("class_number", { ascending: true });
  return (data ?? []) as Student[];
}

async function getGalleryMedia(): Promise<GalleryMedia[]> {
  const { data } = await createAdminClient()
    .from("gallery_media").select("*")
    .order("created_at", { ascending: false }).limit(80);
  return (data ?? []) as GalleryMedia[];
}

async function getConfessions(): Promise<Confession[]> {
  const { data } = await createAdminClient()
    .from("confessions").select("*")
    .order("created_at", { ascending: false }).limit(100);
  return (data ?? []) as Confession[];
}

async function getSongs(): Promise<Track[]> {
  try {
    const { data, error } = await createAdminClient()
      .from("songs").select("id,title,artist,storage_url,cover_url")
      .eq("is_active", true).order("track_order", { ascending: true });
    if (error || !data) return [];
    return (data as Array<{ id: string; title: string; artist: string; storage_url: string; cover_url: string | null }>)
      .map((r) => ({ id: r.id, title: r.title, artist: r.artist, src: r.storage_url, cover: r.cover_url ?? undefined }));
  } catch { return []; }
}

export default async function HomePage() {
  const [students, galleryMedia, confessions, songs] = await Promise.all([
    getStudents(), getGalleryMedia(), getConfessions(), getSongs(),
  ]);

  return (
    <main className="relative">
      <NavBar />
      <HeroSection />

      {/* ── Roster ── */}
      <section id="roster" className="relative py-16 md:py-24 grid-bg"
        style={{ background: "var(--surface)" }}>
        <div className="container mx-auto px-4 md:px-8 relative z-10">
          <div className="mb-10 md:mb-14 text-center">
            <p className="section-eyebrow mb-3">Angkatan 2026</p>
            <h2 className="section-title">
              Warga <em style={{ color: "var(--gold)" }}>Kelas</em>
            </h2>
            <p className="mt-3 font-body text-sm max-w-sm mx-auto"
              style={{ color: "var(--muted)", lineHeight: 1.7 }}>
              Enam orang, satu circle. Dari pusing bareng di kelas sampe salaman di hari-H.
            </p>
          </div>
          <StudentRoster students={students} />
        </div>
      </section>

      {/* ── Gallery ── */}
      <section id="gallery" className="relative py-16 md:py-24"
        style={{ background: "var(--void)" }}>
        <div className="container mx-auto px-4 md:px-8">
          <div className="mb-10 md:mb-14 text-center">
            <p className="section-eyebrow mb-3">Memories</p>
            <h2 className="section-title">
              The <em style={{ color: "var(--gold)" }}>Archive</em>
            </h2>
            <p className="mt-3 font-body text-sm max-w-sm mx-auto"
              style={{ color: "var(--muted)", lineHeight: 1.7 }}>
              Foto dan video dari semua momen—yang bikin ketawa, nangis, dan malu sekaligus.
            </p>
          </div>
          <MediaGallery initialMedia={galleryMedia} />
        </div>
      </section>

      {/* ── Confession Board ── */}
      <section id="board" className="relative py-16 md:py-24 grid-bg"
        style={{ background: "var(--surface)" }}>
        <div className="container mx-auto px-4 md:px-8 relative z-10">
          <div className="mb-10 md:mb-14 text-center">
            <p className="section-eyebrow mb-3">Anonymous</p>
            <h2 className="section-title">
              Confession <em style={{ color: "var(--gold)" }}>Board</em>
            </h2>
            <p className="mt-3 font-body text-sm max-w-sm mx-auto"
              style={{ color: "var(--muted)", lineHeight: 1.7 }}>
              Curhat, roast, atau bilang sesuatu yang belum pernah lo bilang langsung.
            </p>
          </div>
          <ConfessionBoard initialConfessions={confessions} />
        </div>
      </section>

      <Footer />
      <MusicPlayer tracks={songs} />
    </main>
  );
}
