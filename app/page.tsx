// app/page.tsx
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

export const revalidate = 60;

async function getStudents(): Promise<Student[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("students")
    .select("*")
    .order("class_number", { ascending: true });
  return (data ?? []) as Student[];
}

async function getGalleryMedia(): Promise<GalleryMedia[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("gallery_media")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(80);
  return (data ?? []) as GalleryMedia[];
}

async function getConfessions(): Promise<Confession[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("confessions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);
  return (data ?? []) as Confession[];
}

async function getSongs(): Promise<Track[]> {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("songs")
      .select("id, title, artist, storage_url, cover_url")
      .eq("is_active", true)
      .order("track_order", { ascending: true });

    if (error || !data) return [];

    return (data as Array<{
      id: string;
      title: string;
      artist: string;
      storage_url: string;
      cover_url: string | null;
    }>).map((row) => ({
      id:     row.id,
      title:  row.title,
      artist: row.artist,
      src:    row.storage_url,
      cover:  row.cover_url ?? undefined,
    }));
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const [students, galleryMedia, confessions, songs] = await Promise.all([
    getStudents(),
    getGalleryMedia(),
    getConfessions(),
    getSongs(),
  ]);

  return (
    <main className="relative overflow-x-hidden">
      <NavBar />

      <HeroSection />

      <section id="roster" className="relative py-16 md:py-24 bg-surface">
        <div className="absolute inset-0 bg-grid-lines bg-grid opacity-100 pointer-events-none" />
        <div className="container mx-auto px-4 md:px-8 relative z-10">
          <div className="mb-10 md:mb-14 text-center">
            <p className="section-label mb-3">Angkatan 2026</p>
            <h2 className="section-title">Warga <span className="text-gold">Kelas</span></h2>
            <p className="mt-4 text-muted max-w-md mx-auto font-body text-sm">
              Semua wajah yang pernah berjuang bareng—dari MTK sampai wisuda.
            </p>
          </div>
          <StudentRoster students={students} />
        </div>
      </section>

      <section id="gallery" className="relative py-16 md:py-24 bg-void">
        <div className="container mx-auto px-4 md:px-8">
          <div className="mb-10 md:mb-14 text-center">
            <p className="section-label mb-3">Memories</p>
            <h2 className="section-title">The <span className="text-gold">Archive</span></h2>
            <p className="mt-4 text-muted max-w-md mx-auto font-body text-sm">
              Foto dan video dari semua momen—yang bikin ketawa, nangis, dan malu sekaligus.
            </p>
          </div>
          <MediaGallery initialMedia={galleryMedia} />
        </div>
      </section>

      <section id="board" className="relative py-16 md:py-24 bg-surface">
        <div className="absolute inset-0 bg-grid-lines bg-grid opacity-100 pointer-events-none" />
        <div className="container mx-auto px-4 md:px-8 relative z-10">
          <div className="mb-10 md:mb-14 text-center">
            <p className="section-label mb-3">Anonymous</p>
            <h2 className="section-title">Confession <span className="text-gold">Board</span></h2>
            <p className="mt-4 text-muted max-w-md mx-auto font-body text-sm">
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
