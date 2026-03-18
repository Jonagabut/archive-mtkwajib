export type MediaType = "image" | "video";
export type NoteColor = "yellow" | "pink" | "lavender";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      students: {
        Row: {
          id: string;
          name: string;
          custom_title: string;
          quote: string | null;
          destination: string | null;
          photo_class_url: string;
          photo_grad_url: string | null;
          class_number: number | null;
          is_featured: boolean;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["students"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["students"]["Insert"]>;
      };
      gallery_media: {
        Row: {
          id: string;
          storage_path: string;
          storage_url: string;
          media_type: MediaType;
          mime_type: string | null;
          caption: string | null;
          category: string;
          uploaded_by: string | null;
          width: number | null;
          height: number | null;
          file_size_bytes: number | null;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["gallery_media"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["gallery_media"]["Insert"]>;
      };
      confessions: {
        Row: {
          id: string;
          content: string;
          color: NoteColor;
          x_pos: number;
          y_pos: number;
          rotation_deg: number;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["confessions"]["Row"], "id" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["confessions"]["Insert"]>;
      };
      time_capsule: {
        Row: {
          id: string;
          author_name: string | null;
          content: string;
          unlock_at: string;
          is_locked: boolean;
          created_at: string;
        };
        Insert: Omit<Database["public"]["Tables"]["time_capsule"]["Row"], "id" | "is_locked" | "created_at">;
        Update: Partial<Database["public"]["Tables"]["time_capsule"]["Insert"]>;
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_capsule_stats: {
        Args: Record<string, never>;
        Returns: Json;
      };
    };
    Enums: Record<string, never>;
  };
}

export type Student = Database["public"]["Tables"]["students"]["Row"];
export type GalleryMedia = Database["public"]["Tables"]["gallery_media"]["Row"];
export type Confession = Database["public"]["Tables"]["confessions"]["Row"];
export type TimeCapsuleEntry = Database["public"]["Tables"]["time_capsule"]["Row"];
