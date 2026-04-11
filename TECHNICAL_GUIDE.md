# Trteel – Technical Guide

Last updated: 2026-04-11

## 1. Purpose
Trteel is a browser-first Quran video studio that lets creators cut ayah ranges, style visuals, add translations/watermarks, and export social-ready MP4s with synchronized audio. This document gives incoming developers the architecture, code map, and export flow so they can extend or debug the app quickly.

## 2. Stack at a Glance
- **Framework:** Next.js 16 (App Router)
- **UI:** React 19, TypeScript 5, Tailwind CSS v4 utilities in `globals.css` (no runtime import)
- **Icons:** lucide-react
- **Media:** WebCodecs + `mp4-muxer` for client H.264/AAC mux; `html2canvas` helpers (not central); `ffmpeg-static` + `fluent-ffmpeg` for server recode
- **Fonts:** Tajawal & Cairo via `next/font/google` (RTL defaults)

## 3. Runbook
```bash
npm install
npm run dev      # localhost
npm run build    # production bundle
npm start        # serve production
npm run lint
```
Node 18+ required. ffmpeg is bundled by `ffmpeg-static`; no system install needed for the API routes.

## 4. Directory Map (key paths)
- `src/app/layout.tsx` – RTL html, font wiring, root metadata.
- `src/app/page.tsx` – Main composition: preview pane + settings sidebar; owns editor state hooks.
- `src/app/api/export/route.ts` – Legacy frame/video+audio to MP4 endpoint (ffmpeg).
- `src/app/api/instagram-fix/route.ts` – Re-encode client MP4s for IG/TikTok/WhatsApp compatibility.
- `src/components/VideoPreview.tsx` – Live canvas-like preview: bg image/video, ayah+translation, waveform, watermark, safe areas, player overlay, word-sync visuals.
- `src/components/SettingsSidebar.tsx` – All controls; simple/advanced modes; triggers state updates.
- `src/hooks/useEditorState.ts` – Central state schema & defaults.
- `src/hooks/useAudioPlayer.ts` – Audio playback, Web Audio FX graph, ayah sequencing.
- `src/hooks/useVideoExport.ts` – Wrapper that stops playback and calls export pipeline.
- `src/utils/exportVideo.ts` – Client-side render/encode/mux/export pipeline (primary path).
- `src/constants/index.ts` – Aspect ratios, presets, reciters, Quran datasets, backgrounds.
- `src/assets/quran/*.json` – Quran text + translations + reciters.

## 5. Data & Assets
- **Quran text**: `quran.json` (Arabic) + `quran_en/es/fr.json` translations; structure: `data.surahs[].ayahs[]`.
- **Reciters**: `reciters.json` with `id`, names, sample URL fragments; audio is pulled via rewrite.
- **Backgrounds**: Five SVGs in `src/assets/images` used as defaults; user can upload custom image/video.
- **Fonts**: Tajawal/Cairo loaded in layout; canvas/text rendering assumes these families.

## 6. Routing & Network
- Rewrite in `next.config.ts`: `/audio-proxy/:path* -> https://everyayah.com/data/:path*` so playback/export can fetch MP3s per ayah without CORS hassle.
- App Router structure: only the root page; API routes under `src/app/api/*` for media processing.

## 7. State Model (EditorState)
Defined in `src/types/index.ts`, instantiated in `useEditorState` with sensible defaults:
- **Content selection:** `selectedSurahNumber`, `fromAyah`, `toAyah`, `selectedReciterId`.
- **Layout:** `aspectRatio`, ayah/surah positions, font sizes, colors, shadows.
- **Background:** `bgType` (image|video), `bgImage`, `bgVideo`, `bgVideoRange`, `bgVideoMuted`, `bgBlur`, `bgDim`.
- **Effects:** Waveform toggles/placement, word-sync toggle & style, `wordSyncActiveColor`, glass effect parameters.
- **Translation:** visibility, language (en/es/fr), font size, color.
- **Branding:** Watermark mode (image/text), position, size, opacity, colors; safe-area overlay.
- **Export:** preset (story/post/tiktok/youtube/whatsapp), quality (low/medium/high), dark mode flag.

## 8. UI Flow (page.tsx)
1. **State** from `useEditorState` flows into both preview and sidebar.
2. **SelectedAyahs** are derived from Quran data + chosen translation.
3. **Audio**: `useAudioPlayer` streams ayah MP3s in sequence, applies Web Audio effect (none/studio reverb/mosque echo), exposes `audioRef` for preview + export sync.
4. **Export**: `handleExport` from `useVideoExport` stops playback, drives progress, calls `exportVideo`.

## 9. Preview Rendering (VideoPreview)
- Responsive container uses CSS `aspect-ratio` matching selected ratio.
- Background: image with slow zoom; or looping video trimmed to `[start,end]` seconds, optional mute; blur and dim overlays.
- Ayah & translation block at user-set X/Y; optional glass effect clones blurred bg behind text.
- Word sync (heuristic): splits Arabic text into words, estimates timings by word length over total chars vs audio duration; karaoke or fade style; highlights active word with `wordSyncActiveColor`.
- Surah label block (Arabic + transliteration) with independent positioning.
- Waveform: animated bar array; position & height scaled to preview size.
- Watermark: image or text, positioned with opacity/size sliders.
- Safe area: visual top/bottom bands + center lines; no cropping.
- Player chrome: play/pause + ayah skip, progress bar, click-to-toggle overlay.

## 10. Export Pipeline (primary: client-side `exportVideo.ts`)
1. **Canvas setup** at target resolution from aspect ratio map (e.g., 1080x1920 for 9:16).
2. **Background prep**: pre-blur images once to avoid per-frame filters; video bg seeks within trimmed range each frame (timeout guarded).
3. **Layout precompute**: wraps ayah + translation text, caches widths/lines per ayah to avoid `measureText` in the render loop.
4. **Per-frame render @30fps**: draw bg + dim gradient → glass (optional) → ayah text (word-sync aware) → translation → surah label → waveform → watermark → safe-area guides. Emits `VideoFrame` directly from canvas.
5. **Video encode**: WebCodecs `VideoEncoder` H.264 (baseline/main/high fallback), bitrate from quality preset; handles codec reclamation & backpressure.
6. **Audio**: fetch/decode all ayah MP3s in parallel; mix in OfflineAudioContext with optional reverb/echo; stereo 44.1 kHz; encode AAC via `AudioEncoder`.
7. **Mux**: `mp4-muxer` merges encoded chunks; produces MP4 Blob; progress events update UI.
8. **Social recode**: For presets (story/post/tiktok/whatsapp) the client MP4 is POSTed to `/api/instagram-fix` for server ffmpeg recode (H.264 main L4.0, yuv420p, even dimensions, faststart). Falls back to client MP4 if the request fails or times out (4 min timeout).
9. **Download**: Blob URL auto-clicked with filename `trteel-{surah}-{timestamp}.mp4`.

## 11. Server Pipelines
- **/api/instagram-fix**: Re-encode inbound MP4; ensures IG/TikTok acceptance (H.264 main L4.0, yuv420p, 30fps, even dims, AAC 128k, faststart). 5-minute cap to survive long jobs.
- **/api/export** (legacy): Accepts JPEG frame sequence or webm + audio, runs ffmpeg (H.264 baseline L3.0) to MP4. Not called by current UI but kept for compatibility.

## 12. Audio Playback (runtime)
- Each ayah build URL: `/audio-proxy/{reciterId}/{surah}{ayah}.mp3` (zero-padded 3 digits each).
- Web Audio graph rebuilt when playback starts: direct to destination (none) or convolver/feedback delay (studio/mosque). Suspended contexts are resumed on first interaction.
- On ayah end: auto-advance; reset to first ayah when sequence finishes (unless exporting).

## 13. Constraints & Performance Notes
- WebCodecs required; older browsers may fail export (UI logs to console). No server fallback except manual `/api/export` integration.
- Glass effect and 1080p rendering are GPU intensive; bg video seek per frame is capped with timeout (1.2s) to avoid hangs.
- Word-sync is heuristic (length-based). For precise timings, replace with timestamped dataset.
- Background video uploads are stored as data URLs in state; very large files can blow memory.

## 14. Extending Safely
- If altering Next.js behavior, read `node_modules/next/dist/docs/` (project uses Next 16 with breaking changes).
- When adding presets: update `EXPORT_PRESETS` and ensure aspect ratio map in `exportVideo.ts` includes resolution.
- When adding languages: extend translation JSON, update `selectedLanguage` union in types + sidebar select.
- When adding audio FX: expand `useAudioPlayer` and offline mix in `exportVideo.ts` to keep parity.
- If you need server-only export, adapt the client to stream frames/audio to `/api/export` and disable WebCodecs path when unavailable.

## 15. Quick Troubleshooting
- **No audio:** Check reciter ID exists in `reciters.json`; verify EveryAyah path; network tab for 404/403.
- **Export hangs:** Browser lacks WebCodecs or codec reclaimed; see console logs; `/api/instagram-fix` may time out—fallback uses client MP4.
- **IG upload stuck:** Ensure export went through `/api/instagram-fix`; odd dimensions trigger yuv420p errors—route force-even dims.
- **Huge memory:** Long bg videos as data URLs; advise users to trim length and blur only when needed.

---
For open questions or new requirements, capture decisions in this file and keep the date updated.
