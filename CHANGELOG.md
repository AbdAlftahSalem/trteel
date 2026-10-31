# Changelog

## 0.2.0

- **Security:** `/api/export` built its FFmpeg command as a shell string from the `fps` and `bitrate` sent by the browser, so anyone could run commands on the server (e.g. `"bitrate": "500k; <command>"`). Both API routes now run FFmpeg with an argument list (no shell), and `fps` / `bitrate` are validated (400 on bad values).
- **Fix:** `/api/instagram-fix` put the file name straight into the `Content-Disposition` header, which breaks on non-ASCII names (e.g. Arabic). It now sends a safe ASCII name plus the UTF-8 name.
- **Fix:** `/api/export` used H.264 level 3.0 (≈360p only) for full-HD output; it now uses 4.0 like the Instagram route.
- **Security:** Next.js 16.2.1 → 16.4.3 (critical DoS and middleware bypass advisories). `npm audit --omit=dev` now reports 0 vulnerabilities.
- Removed unused dependencies: `fluent-ffmpeg` (deprecated), `form-data`, `html2canvas`, `webm-duration-fix`.
- Removed copies of Next.js-generated type files from `src/types` (Next regenerates them in `.next/types`).
- `npm run lint` passes (it failed with 48 errors): typed the `any`s and moved two state updates out of effects (simple-mode switch, surah reset). The karaoke timing now reads the audio duration from state instead of a ref during render.
- README: the export flow (in-browser WebCodecs + optional FFmpeg pass), API endpoints, Node 20.9+, and the license section, in English and Arabic.
- GitHub Actions CI (lint + build).
