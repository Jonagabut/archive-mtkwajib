"use server";
// app/actions/capsule.ts
import { createAdminClient, validatePasscode } from "@/lib/supabase/server";

interface ActionResult {
  error?: string;
  data?: { id: string };
}

export async function submitCapsuleAction(
  formData: FormData
): Promise<ActionResult> {
  // ── 1. Passcode check ──
  const passcode = formData.get("passcode") as string;
  if (!validatePasscode(passcode)) {
    return { error: "Passcode salah. Minta ke admin kelas." };
  }

  // ── 2. Extract fields ──
  const content = (formData.get("content") as string)?.trim();
  const authorName = (formData.get("authorName") as string)?.trim() || null;

  if (!content || content.length === 0) {
    return { error: "Pesan tidak boleh kosong." };
  }
  if (content.length > 1000) {
    return { error: "Pesan terlalu panjang. Maksimum 1000 karakter." };
  }

  // ── 3. Sanitize author name ──
  const sanitizedAuthor =
    authorName && authorName.length > 0
      ? authorName.slice(0, 80)
      : null;

  // ── 4. Insert with unlock_at locked to 2031 ──
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("time_capsule")
    .insert({
      content,
      author_name: sanitizedAuthor,
      unlock_at: "2031-07-01T00:00:00+00:00",
    })
    .select("id")
    .single();

  if (error) {
    console.error("[capsule submit] DB error:", error);
    return { error: "Gagal menyimpan pesan. Coba lagi." };
  }

  return { data: { id: data.id } };
}

// ── Read unlocked messages (only works after 2031-07-01) ──
export async function getUnlockedMessagesAction(): Promise<{
  data?: Array<{ id: string; author_name: string | null; content: string; created_at: string }>;
  error?: string;
  locked?: boolean;
}> {
  const unlockDate = new Date("2031-07-01T00:00:00Z");
  const now = new Date();

  if (now < unlockDate) {
    return {
      locked: true,
      error: `Capsule masih terkunci sampai ${unlockDate.toLocaleDateString("id-ID", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })}.`,
    };
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("time_capsule")
    .select("id, author_name, content, created_at")
    .lte("unlock_at", now.toISOString())
    .order("created_at", { ascending: true });

  if (error) {
    return { error: "Gagal memuat pesan." };
  }

  return { data: data ?? [] };
}
