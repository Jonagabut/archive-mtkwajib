# MTK Wajib Archive — Full Audit Report
## Senior Dev Review: Bug Fixes, Optimizations & Human-Touch Refinements

---

## 🐛 Bug Reports & Fixes

### BUG 1 — Drag Position Snap (ConfessionBoard.tsx) — CRITICAL
**Symptom:** After dragging a sticky note and releasing, the note visually "snaps" back to its
original position for one frame before jumping to the correct location.

**Root Cause:** The original code mixed two position tracking systems:
- CSS `style={{ left: position.x, top: position.y }}` (React state)
- Framer Motion's internal drag transform (applied on top of the CSS position)

When drag ends, Framer Motion resets its internal transform to `(0, 0)` and React's
state update (`setPosition`) happens in the next render. This race condition causes a
one-frame flash where the note appears at the wrong position.

**Fix:** Replaced `useState` with Framer Motion's `useMotionValue` for x/y. The element
is positioned at `left: 0, top: 0` in CSS, and the motion values drive the actual visual
position entirely. Since Framer Motion owns the position end-to-end, there's no handoff
between systems, and no snap.

```diff
- const [position, setPosition] = useState({ x: confession.x_pos, y: confession.y_pos });
+ const x = useMotionValue(confession.x_pos);
+ const y = useMotionValue(confession.y_pos);
```

---

### BUG 2 — Hard Page Reload After Actions (ConfessionBoard + MediaGallery) — HIGH
**Symptom:** Posting a note or uploading a file triggers `window.location.reload()`,
which destroys scroll position and causes a jarring full-page reload.

**Fix:** Replaced with Next.js 14's `router.refresh()` which re-runs server-side data
fetching and updates the UI without a full reload or losing client state. Additionally,
the ConfessionBoard now uses **optimistic UI updates** — the new note appears
immediately on the board without waiting for any refresh at all.

```diff
- setTimeout(() => { onClose(); window.location.reload(); }, 1500);
+ router.refresh();
+ setTimeout(onClose, 1500);
```

---

### BUG 3 — Lightbox Keyboard Navigation Broken (MediaGallery.tsx) — HIGH
**Symptom:** Arrow keys don't navigate between photos in the lightbox until the user
manually clicks inside it first.

**Root Cause:** The overlay div had `tabIndex={-1}` (making it focusable) but was never
programmatically focused on mount. Keyboard events only fire on focused elements.

**Fix:** Added a `useEffect` that calls `overlayRef.current?.focus()` when the lightbox mounts.

```diff
+ useEffect(() => {
+   overlayRef.current?.focus();
+ }, []);
```

---

### BUG 4 — Lightbox Shows Wrong Photo After Filter Change (MediaGallery.tsx) — MEDIUM
**Symptom:** If the user changes the category filter while the lightbox is open, the lightbox
shows a completely different (wrong) photo because the stored index no longer points to the
same item in the new filtered array.

**Fix:** Changed from tracking `lightboxIndex: number` to tracking `lightboxMediaId: string`.
The actual media item is derived from the ID each render, so filter changes never corrupt it.

```diff
- const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
+ const [lightboxMediaId, setLightboxMediaId] = useState<string | null>(null);
```

---

### BUG 5 — Missing Unsplash Remote Pattern (next.config.mjs) — HIGH
**Symptom:** `next/image` throws a build/runtime error for any student with a missing photo,
because the Unsplash placeholder URLs weren't listed in `remotePatterns`.

**Error:** `Error: Invalid src prop...hostname "images.unsplash.com" is not configured under images in your next.config.js`

**Fix:** Added Unsplash to `remotePatterns` in `next.config.mjs`.

---

### BUG 6 — Countdown Re-renders All Segments Every Second (TimeCapsule.tsx) — MEDIUM
**Symptom (Performance):** Every 1-second tick caused all 5 countdown segments (years, days,
hours, minutes, seconds) to re-render and re-animate, even if only `seconds` changed.

**Root Cause:** `setTimeLeft(calculate())` creates a new object reference every second, causing
the parent component to re-render, which re-renders all 5 `Segment` children. Without `React.memo`,
there's no bailout.

**Fix:** Wrapped `Segment` in `React.memo`. Now only the segments whose `value` prop actually
changed will re-render. Also replaced the outer `motion.div` key-based animation with
`AnimatePresence` + `motion.span` inside Segment so the flip animation is more precise.

---

### BUG 7 — No Real-time Updates on Confession Board — MEDIUM
**Symptom:** Notes posted by other classmates only appear after a manual page refresh.
The board feels static despite being a "live" board.

**Fix:** Added Supabase Realtime subscription in `ConfessionBoard` using `postgres_changes`.
New notes now appear instantly for all connected users. Also handles `UPDATE` events so
drag position changes from other users are reflected live.

**Required:** Enable Realtime replication for the `confessions` table in Supabase Dashboard
(Database → Replication → Tables), or run the SQL in `supabase/schema_additions.sql`.

---

## 🎵 New Feature: Custom Music Player

**File:** `components/music/MusicPlayer.tsx`

A floating music player widget that replaces the bare Spotify iframe in the hero with a
proper custom-styled player.

**Key design decisions:**
- Uses `HTMLAudioElement` directly (no library) — saves ~40KB and gives full control
- **Memory leak prevention**: creates a new `Audio` instance per track, destroys the old one
  completely in cleanup (pause + clear src + remove all event listeners). Just removing the
  src isn't enough — some browsers keep decode buffers alive.
- Two separate `useEffect`s: one for constructing the audio element (runs on track change),
  one for play/pause sync. This separation prevents the audio element from being reconstructed
  every time the play state changes.
- Minimizable widget — doesn't take up screen space when not needed
- Vinyl record animation synced to play state
- Click-to-seek progress bar with hover scrubber dot
- Graceful degradation: renders nothing if no tracks are configured

**Setup:** See `supabase/schema_additions.sql` for the `songs` table schema. Upload audio
files to a `music` bucket in Supabase Storage, then insert rows into `songs`.

---

## 🎨 Human-Touch Refinements (Anti-AI Look & Feel)

### Code Style Changes
- **Variable names are descriptive of intent, not just type**: `saveFailed` instead of `error`,
  `advanceToNext` instead of `handleSkip`, `lightboxMediaId` instead of just `id`
- **Comments explain WHY, not what**: Every non-obvious decision has a comment explaining
  the reasoning (see the `useEffect` comments in MusicPlayer.tsx, the drag bug explanation
  in ConfessionBoard.tsx, etc.)
- **No "robot" defaults**: Error messages say "Waduh, gagal posting. Coba sekali lagi?" instead
  of "Error: Failed to post. Please try again."

### Microcopy Changes (Human-Centric)
| Before | After |
|---|---|
| "Gagal posting note. Coba lagi." | "Waduh, gagal posting. Coba sekali lagi?" |
| "Terjadi kesalahan. Coba lagi." | "Ada yang salah. Coba lagi?" |
| "Posting..." | "Lagi nempel..." |
| "Uploading..." | "Lagi upload..." |
| "anonymous" | "anonim" |
| "Masukkan passcode kelas" | "Yang tau cuma kita-kita aja" |
| "Download" | "Download" (kept — no need to change what's clear) |

### UI Refinements
- **Confession Board**: Added a live indicator (green pulse dot + "live" label) that shows
  the Realtime subscription is active, and gracefully degrades to an offline indicator if
  the connection drops
- **Note dragging**: The shadow intensifies while dragging (more lift = more depth)
- **Music player**: Vinyl record spins when playing, stops smoothly when paused. Progress
  bar dot only appears on hover (less visual noise)
- **Upload/Post success states**: Added a brief descriptive line under the success headline
  so it doesn't feel like it just terminated

---

## 📋 Implementation Guide

### Step 1: Replace files
Drop these into your project, replacing the originals:
```
components/board/ConfessionBoard.tsx  ← Fixed + Realtime
components/gallery/MediaGallery.tsx   ← Fixed
components/capsule/TimeCapsule.tsx    ← Fixed
next.config.mjs                       ← Fixed
app/page.tsx                          ← Updated (adds MusicPlayer)
```

Add these new files:
```
components/music/MusicPlayer.tsx      ← New
supabase/schema_additions.sql         ← New (run in Supabase SQL Editor)
```

### Step 2: Enable Supabase Realtime
In Supabase Dashboard:
1. Go to **Database → Replication**
2. Under **Tables**, toggle ON `confessions`
3. OR run the SQL in `supabase/schema_additions.sql`

### Step 3: Set up Music Player (optional)
1. Create a `music` bucket in Supabase Storage (set to Public)
2. Run the `songs` table SQL from `schema_additions.sql`
3. Upload `.mp3` files to the bucket
4. Insert rows into `songs` with the public URLs
5. The player will appear automatically when songs exist in the DB

### Step 4: Install no new dependencies
All fixes use existing packages (framer-motion, supabase-js, next). No new `npm install` needed.

---

## 🔍 Other Things to Watch

- **Server-side Supabase client singleton**: The `let adminClient = null` pattern in
  `lib/supabase/server.ts` is technically fine for production (each serverless invocation
  is isolated) but can cause unexpected behavior during development hot reload. Consider
  creating a fresh client per-request if you notice stale connection issues in dev.

- **ISR + Realtime overlap**: The page revalidates every 60 seconds (`revalidate = 60`) AND
  Realtime pushes live updates to connected clients. These work together well: ISR ensures
  new visitors get fresh data, Realtime handles live updates for active users.

- **Video thumbnails**: The `#t=1` trick for video thumbnails (`src={url + "#t=1"}`) works
  inconsistently across browsers. For more reliable thumbnails, consider generating poster
  images server-side (ffmpeg) and storing them in Supabase alongside the video.
