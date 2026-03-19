// lib/supabase/database.types.ts
// Manual type definitions for all Supabase tables.
// Keep this in sync with schema.sql whenever you add or change a table.

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
          id:               string;
          name:             string;
          custom_title:     string;
          quote:            string | null;
          destination:      string | null;
          photo_class_url:  string;
          photo_grad_url:   string | null;
          class_number:     number | null;
          is_featured:      boolean;
          created_at:       string;
        };
        Insert: {
          name:             string;
          custom_title:     string;
          quote?:           string | null;
          destination?:     string | null;
          photo_class_url:  string;
          photo_grad_url?:  string | null;
          class_number?:    number | null;
          is_featured?:     boolean;
        };
        Update: {
          name?:            string;
          custom_title?:    string;
          quote?:           string | null;
          destination?:     string | null;
          photo_class_url?: string;
          photo_grad_url?:  string | null;
          class_number?:    number | null;
          is_featured?:     boolean;
        };
      };

      gallery_media: {
        Row: {
          id:               string;
          storage_path:     string;
          storage_url:      string;
          media_type:       MediaType;
          mime_type:        string | null;
          caption:          string | null;
          category:         string;
          uploaded_by:      string | null;
          width:            number | null;
          height:           number | null;
          file_size_bytes:  number | null;
          created_at:       string;
        };
        Insert: {
          storage_path:     string;
          storage_url:      string;
          media_type:       MediaType;
          mime_type?:       string | null;
          caption?:         string | null;
          category?:        string;
          uploaded_by?:     string | null;
          width?:           number | null;
          height?:          number | null;
          file_size_bytes?: number | null;
        };
        Update: {
          storage_path?:    string;
          storage_url?:     string;
          media_type?:      MediaType;
          mime_type?:       string | null;
          caption?:         string | null;
          category?:        string;
          uploaded_by?:     string | null;
          width?:           number | null;
          height?:          number | null;
          file_size_bytes?: number | null;
        };
      };

      confessions: {
        Row: {
          id:           string;
          content:      string;
          color:        NoteColor;
          x_pos:        number;
          y_pos:        number;
          rotation_deg: number;
          created_at:   string;
        };
        Insert: {
          content:       string;
          color?:        NoteColor;
          x_pos?:        number;
          y_pos?:        number;
          rotation_deg?: number;
        };
        Update: {
          content?:      string;
          color?:        NoteColor;
          x_pos?:        number;
          y_pos?:        number;
          rotation_deg?: number;
        };
      };

      // Songs table — used by the floating MusicPlayer widget.
      // Rows are inserted manually via Supabase Dashboard after uploading
      // audio files to the 'music' storage bucket.
      songs: {
        Row: {
          id:          string;
          title:       string;
          artist:      string;
          storage_url: string;
          cover_url:   string | null;
          track_order: number;
          is_active:   boolean;
          created_at:  string;
        };
        Insert: {
          title:        string;
          artist?:      string;
          storage_url:  string;
          cover_url?:   string | null;
          track_order?: number;
          is_active?:   boolean;
        };
        Update: {
          title?:       string;
          artist?:      string;
          storage_url?: string;
          cover_url?:   string | null;
          track_order?: number;
          is_active?:   boolean;
        };
      };
    };

    Views: Record<string, never>;

    Functions: Record<string, never>;

    Enums: Record<string, never>;
  };
}

// Convenience row types — import these in components instead of the full DB type
export type Student     = Database["public"]["Tables"]["students"]["Row"];
export type GalleryMedia = Database["public"]["Tables"]["gallery_media"]["Row"];
export type Confession  = Database["public"]["Tables"]["confessions"]["Row"];
export type Song        = Database["public"]["Tables"]["songs"]["Row"];
