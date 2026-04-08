"use server";
import { createAdminClient, validatePasscode } from "@/lib/supabase/server";

type NoteColor = "yellow" | "pink" | "lavender";

interface ActionResult {
  error?: string;
  data?: { id: string };
}

export async function postConfessionAction(
  formData: FormData
): Promise<ActionResult> {
  const passcode = formData.get("passcode") as string;
  if (!validatePasscode(passcode)) {
    return { error: "Passcode salah, bro." };
  }

  const content = (formData.get("content") as string)?.trim();
  const color   = (formData.get("color") as NoteColor) || "yellow";

  if (!content || content.length === 0) {
    return { error: "Tulis sesuatu dulu!" };
  }
  if (content.length > 300) {
    return { error: "Terlalu panjang. Maksimum 300 karakter." };
  }

  const validColors: NoteColor[] = ["yellow", "pink", "lavender"];
  if (!validColors.includes(color)) {
    return { error: "Warna tidak valid." };
  }

  const x_pos        = Math.random() * 600 + 40;
  const y_pos        = Math.random() * 400 + 40;
  const rotation_deg = (Math.random() - 0.5) * 8;

  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("confessions")
    .insert({ content, color, x_pos, y_pos, rotation_deg })
    .select("id")
    .single();

  if (error) {
    console.error("[confession post] DB error:", error);
    return { error: "Gagal posting note. Coba lagi." };
  }

  return { data: { id: (data as { id: string }).id } };
}

export async function updateConfessionPositionAction(
  id: string,
  x_pos: number,
  y_pos: number
): Promise<{ error?: string }> {
  if (!/^[0-9a-f-]{36}$/.test(id)) {
    return { error: "Invalid ID." };
  }

  const clampedX = Math.max(0, Math.min(x_pos, 2000));
  const clampedY = Math.max(0, Math.min(y_pos, 2000));

  const supabase = createAdminClient();

  const { error } = await supabase
    .from("confessions")
    .update({ x_pos: clampedX, y_pos: clampedY })
    .eq("id", id);

  if (error) {
    console.error("[confession position] DB error:", error);
    return { error: "Gagal menyimpan posisi." };
  }

  return {};
}

/**
 * Increments the reaction count for a note.
 * REQUIRES: 'likes_count' column in 'confessions' table.
 */
export async function reactToConfessionAction(
  id: string
): Promise<{ error?: string; count?: number }> {
  if (!/^[0-9a-f-]{36}$/.test(id)) return { error: "Invalid ID." };

  const supabase = createAdminClient();

  // We use a simple increment logic. 
  // In a real high-traffic app, you'd use a postgres function (rpc) 
  // to prevent race conditions, but for a class archive this is fine.
  const { data, error } = await supabase
    .from("confessions")
    .select("likes_count")
    .eq("id", id)
    .single();

  if (error) return { error: "Gagal ambil data love." };

  const newCount = ((data as any).likes_count || 0) + 1;

  const { error: updError } = await supabase
    .from("confessions")
    .update({ likes_count: newCount })
    .eq("id", id);

  if (updError) return { error: "Gagal ngasih love." };

  return { count: newCount };
}
