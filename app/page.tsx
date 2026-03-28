"use client";

import Image from "next/image";
import { useMemo, useState, useRef, useEffect } from "react";
import { Play, Pause, SkipForward, SkipBack, ALargeSmall, AudioLines, ChevronDown, Clapperboard, ImagePlus, Layers, Moon, MoveHorizontal, MoveVertical, Palette, UserRound, Download } from "lucide-react";
import bg1 from "@/assets/images/1.svg";
import bg2 from "@/assets/images/2.svg";
import bg3 from "@/assets/images/3.svg";
import bg4 from "@/assets/images/4.svg";
import bg5 from "@/assets/images/5.svg";
import surahsData from "@/assets/quran_surahs.json";
import quranDataRaw from "@/assets/quran.json";
import recitersDataRaw from "@/assets/reciters.json";

type Reciter = {
  id: string;
  name: string;
  name_ar?: string;
  sample: string;
};

const recitersData = recitersDataRaw as { reciters: Reciter[] };
const reciters = recitersData.reciters;


type Surah = {
  number: number;
  name: {
    ar: string;
    en: string;
    transliteration: string;
  };
  verses_count: number;
};

type Ayah = {
  number: number;
  text: string;
  numberInSurah: number;
};

type QuranData = {
  data: {
    surahs: {
      number: number;
      ayahs: Ayah[];
    }[];
  };
};

const quranData = quranDataRaw as unknown as QuranData;

type AspectRatio = {
  id: string;
  label: string;
  desc: string;
};

const fallbackSurah: Surah = {
  number: 1,
  name: {
    ar: "الفاتحة",
    en: "The Opening",
    transliteration: "Al-Fatihah",
  },
  verses_count: 7,
};

const surahSource = surahsData as { result?: Surah[] };
const surahs = surahSource.result?.length ? surahSource.result : [fallbackSurah];

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const parseAyah = (
  value: string,
  fallback: number,
  min: number,
  max: number,
) => {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return clamp(Math.floor(parsed), min, max);
};

const ASPECT_RATIOS: AspectRatio[] = [
  { id: "9/16", label: "طولي (9:16)", desc: "Reels, TikTok, Stories" },
  { id: "1/1", label: "مربع (1:1)", desc: "Instagram Post" },
  { id: "16/9", label: "عرضي (16:9)", desc: "YouTube, Facebook" },
  { id: "4/5", label: "طولي (4:5)", desc: "Instagram Social Feed" },
];

export default function Home() {
  const [selectedSurahNumber, setSelectedSurahNumber] = useState<number>(
    surahs[0].number,
  );
  const [fromAyah, setFromAyah] = useState<number>(1);
  const [toAyah, setToAyah] = useState<number>(Math.min(5, surahs[0].verses_count));
  const [yPosition, setYPosition] = useState<number>(50);
  const [xPosition, setXPosition] = useState<number>(50);
  const [surahYPosition, setSurahYPosition] = useState<number>(8);
  const [surahXPosition, setSurahXPosition] = useState<number>(50);
  const [ayahFontSize, setAyahFontSize] = useState<number>(16);
  const [surahFontSize, setSurahFontSize] = useState<number>(12);
  const [ayahColor, setAyahColor] = useState<string>("#ffffff");
  const [ayahShadowColor, setAyahShadowColor] = useState<string>("#000000");
  const [surahColor, setSurahColor] = useState<string>("#ffffff");
  const [surahShadowColor, setSurahShadowColor] = useState<string>("#000000");
  const [waveColor, setWaveColor] = useState<string>("#ffffff");
  const [waveX, setWaveX] = useState<number>(50);
  const [waveY, setWaveY] = useState<number>(0);
  const [waveHeight, setWaveHeight] = useState<number>(25);
  const [showWave, setShowWave] = useState<boolean>(true);
  const [showSurahName, setShowSurahName] = useState<boolean>(true);
  const [aspectRatio, setAspectRatio] = useState<string>("9/16");
  const [bgImage, setBgImage] = useState<any>(bg1);
  const [showWatermark, setShowWatermark] = useState<boolean>(false);
  const [watermarkMode, setWatermarkMode] = useState<"image" | "text">("image");
  const [watermarkImage, setWatermarkImage] = useState<string | null>(null);
  const [watermarkText, setWatermarkText] = useState<string>("Trteel");
  const [watermarkTextColor, setWatermarkTextColor] = useState<string>("#ffffff");
  const [watermarkSize, setWatermarkSize] = useState<number>(40);
  const [watermarkOpacity, setWatermarkOpacity] = useState<number>(0.5);
  const [watermarkX, setWatermarkX] = useState<number>(5);
  const [watermarkY, setWatermarkY] = useState<number>(5);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentAyahIndex, setCurrentAyahIndex] = useState<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<number>(0);
  const [activeAccordion, setActiveAccordion] = useState<string>("selection");
  const [bgBlur, setBgBlur] = useState<number>(0);
  const [bgDim, setBgDim] = useState<number>(0.3);
  const [selectedReciterId, setSelectedReciterId] = useState<string>(reciters[0].id);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);
  const previewRef = useRef<HTMLDivElement | null>(null);

  const selectedSurah = useMemo(
    () =>
      surahs.find((surah) => surah.number === selectedSurahNumber) ?? surahs[0],
    [selectedSurahNumber],
  );

  const selectedAyahs = useMemo(() => {
    const surah = quranData.data.surahs.find(
      (s) => s.number === selectedSurahNumber,
    );
    if (!surah) return [];
    return surah.ayahs.filter(
      (ayah) =>
        ayah.numberInSurah >= fromAyah && ayah.numberInSurah <= toAyah,
    );
  }, [selectedSurahNumber, fromAyah, toAyah]);

  useEffect(() => {
    setCurrentAyahIndex(0);
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
    }
  }, [selectedSurahNumber, fromAyah, toAyah]);

  useEffect(() => {
    if (isPlaying && selectedAyahs[currentAyahIndex]) {
      const ayah = selectedAyahs[currentAyahIndex];
      // Formula: /audio-proxy/{reciter_id}/{surah_3_digits}{ayah_3_digits}.mp3
      const s = String(selectedSurahNumber).padStart(3, "0");
      const a = String(ayah.numberInSurah).padStart(3, "0");
      const audioUrl = `/audio-proxy/${selectedReciterId}/${s}${a}.mp3`;

      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play().catch(err => console.error("Playback failed", err));
      }
    }
  }, [isPlaying, currentAyahIndex, selectedAyahs, selectedReciterId]);

  const handleAudioEnded = () => {
    if (currentAyahIndex < selectedAyahs.length - 1) {
      setCurrentAyahIndex(prev => prev + 1);
    } else {
      setIsPlaying(false);
      if (!isExporting) {
        setCurrentAyahIndex(0);
      }
    }
  };

  const togglePlayback = () => {
    setIsPlaying(prev => !prev);
  };

  const handleExport = async () => {
    if (selectedAyahs.length === 0) return;

    setIsExporting(true);
    setExportProgress(0);
    setIsPlaying(false);

    try {
      const RES: Record<string, { w: number; h: number }> = {
        "9/16": { w: 1080, h: 1920 },
        "1/1": { w: 1080, h: 1080 },
        "16/9": { w: 1920, h: 1080 },
        "4/5": { w: 1080, h: 1350 },
      };
      const { w: CW, h: CH } = RES[aspectRatio] ?? { w: 1080, h: 1920 };
      const SC = CW / 400;

      const canvas = document.createElement("canvas");
      canvas.width = CW;
      canvas.height = CH;
      canvas.style.position = "fixed";
      canvas.style.left = "-10000px";
      canvas.style.top = "-10000px";
      document.body.appendChild(canvas);

      const ctx = canvas.getContext("2d", { alpha: false })!;

      await document.fonts.ready;

      // ── Codec Selection ──────────────────────────────────────────────────────
      const types = [
        "video/webm",
        "video/webm;codecs=vp8,opus",
        "video/webm;codecs=h264,opus",
        "video/mp4"
      ];
      const mimeType = types.find(t => MediaRecorder.isTypeSupported(t)) || "video/webm";

      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      if (audioCtx.state === "suspended") await audioCtx.resume();

      const audioDest = audioCtx.createMediaStreamDestination();
      const exportGain = audioCtx.createGain();
      exportGain.gain.value = 1.0;
      exportGain.connect(audioDest);

      // Keep audio track alive with a tiny constant signal
      const silent = audioCtx.createConstantSource();
      silent.offset.value = 0.0001;
      silent.connect(exportGain);
      silent.start();

      // Draw initial frame
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, CW, CH);

      const videoStream = canvas.captureStream(30);

      const vTracks = videoStream.getVideoTracks();
      const aTracks = audioDest.stream.getAudioTracks();

      if (vTracks.length === 0) {
        document.body.removeChild(canvas);
        throw new Error("No video tracks found from canvas");
      }

      const combined = new MediaStream([
        ...vTracks,
        ...aTracks,
      ]);

      const chunks: Blob[] = [];
      const recorder = new MediaRecorder(combined, {
        mimeType,
        videoBitsPerSecond: 2_500_000,
        audioBitsPerSecond: 128_000,
      });

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onerror = (e) => {
        console.error("MediaRecorder error event:", e);
      };

      // ── Load Assets ──────────────────────────────────────────────────────────
      const loadEl = async (src: string): Promise<HTMLImageElement | null> => {
        return new Promise((resolve) => {
          const el = new (window as any).Image();
          if (src.startsWith("http")) el.crossOrigin = "anonymous";
          el.onload = () => resolve(el);
          el.onerror = () => resolve(null);
          el.src = src;
        });
      };

      const bgSrc = typeof bgImage === "string" ? bgImage : bgImage?.src;
      const bgEl = bgSrc ? await loadEl(bgSrc) : null;
      let wmEl: HTMLImageElement | null = null;
      if (showWatermark && watermarkMode === "image" && watermarkImage) {
        wmEl = await loadEl(watermarkImage);
      }

      const waveRelH = [0.4, 0.7, 0.9, 0.5, 0.8, 0.6, 0.9, 0.7, 0.4, 0.8, 0.5, 0.7];

      const drawFrame = (text: string, phase: number) => {
        ctx.fillStyle = "#000";
        ctx.fillRect(0, 0, CW, CH);

        if (bgEl) {
          ctx.save();
          if (bgBlur > 0) ctx.filter = `blur(${bgBlur * SC}px)`;
          const s = Math.max(CW / (bgEl.naturalWidth || 1), CH / (bgEl.naturalHeight || 1));
          ctx.drawImage(bgEl, (CW - bgEl.naturalWidth * s) / 2, (CH - bgEl.naturalHeight * s) / 2,
            bgEl.naturalWidth * s, bgEl.naturalHeight * s);
          ctx.restore();
        }

        ctx.fillStyle = `rgba(0,0,0,${bgDim})`;
        ctx.fillRect(0, 0, CW, CH);

        const fs = ayahFontSize * SC;
        ctx.save();
        ctx.font = `500 ${fs}px Tajawal, sans-serif`;
        ctx.fillStyle = ayahColor;
        ctx.shadowColor = ayahShadowColor + "80";
        ctx.shadowBlur = 10 * SC;
        ctx.textAlign = "center";
        ctx.direction = "rtl";
        const tx = (xPosition / 100) * CW;
        const ty = CH - (yPosition / 100) * CH;

        const words = text.split(" ");
        const lines: string[] = [];
        let cur = "";
        const maxW = CW * 0.85;
        for (const w of words) {
          const t = cur ? `${cur} ${w}` : w;
          if (ctx.measureText(t).width > maxW && cur) { lines.push(cur); cur = w; }
          else { cur = t; }
        }
        if (cur) lines.push(cur);

        const lh = fs * 1.5;
        let sy = ty - ((lines.length - 1) * lh) / 2;
        lines.forEach(ln => {
          ctx.fillText(ln, tx, sy);
          sy += lh;
        });
        ctx.restore();

        if (showSurahName) {
          const sfs = surahFontSize * SC;
          ctx.save();
          ctx.textAlign = "center"; ctx.direction = "rtl";
          const sx = (surahXPosition / 100) * CW;
          const sbase = CH - (surahYPosition / 100) * CH;
          ctx.font = `bold ${sfs}px Tajawal, sans-serif`;
          ctx.fillStyle = surahColor;
          ctx.shadowColor = surahShadowColor; ctx.shadowBlur = 5 * SC;
          ctx.fillText(`سورة ${selectedSurah.name.ar}`, sx, sbase);
          ctx.font = `${sfs * 0.7}px Tajawal, sans-serif`;
          ctx.globalAlpha = 0.8;
          ctx.fillText(selectedSurah.name.transliteration, sx, sbase + sfs + 5 * SC);
          ctx.restore();
        }

        if (showWave) {
          const bW = Math.max(4, CW * 0.005);
          const gap = bW * 1.8; // Match UI gap more closely
          const totalWW = waveRelH.length * (bW + gap);
          const wbx = (waveX / 100) * CW - totalWW / 2;
          const wby = CH - (waveY / 100) * CH;
          ctx.save();
          waveRelH.forEach((rh, idx) => {
            // Synchronized with CSS 0.8s infinite alternate animation
            const ph = (phase + idx * 0.35) % (Math.PI * 2);
            const bH = rh * waveHeight * SC * (0.55 + 0.45 * Math.sin(ph));
            ctx.fillStyle = waveColor;
            ctx.shadowColor = waveColor;
            ctx.shadowBlur = 10 * SC;
            ctx.globalAlpha = 0.85;

            // Draw with rounded ends to match UI
            ctx.beginPath();
            if ((ctx as any).roundRect) {
              (ctx as any).roundRect(wbx + idx * gap, wby - bH, bW, bH, bW / 2);
            } else {
              ctx.rect(wbx + idx * gap, wby - bH, bW, bH); // Fallback
            }
            ctx.fill();
          });
          ctx.restore();
        }

        if (showWatermark) {
          ctx.save(); ctx.globalAlpha = watermarkOpacity;
          const wx = CW - (watermarkX / 100) * CW;
          const wy = (watermarkY / 100) * CH;
          const wmS = watermarkSize * SC;
          if (watermarkMode === "image" && wmEl) {
            const wh = (wmS / (wmEl.naturalWidth || 100)) * (wmEl.naturalHeight || 100);
            ctx.drawImage(wmEl, wx - wmS, wy, wmS, wh);
          } else if (watermarkMode === "text" && watermarkText) {
            ctx.font = `bold ${wmS}px Tajawal, sans-serif`;
            ctx.fillStyle = watermarkTextColor; ctx.textAlign = "right";
            ctx.fillText(watermarkText, wx, wy + wmS);
          }
          ctx.restore();
        }
      };

      // Draw initial frame before starting
      drawFrame(selectedAyahs[0].text, 0);
      recorder.start(1000);

      const totalAyahs = selectedAyahs.length;
      for (let i = 0; i < totalAyahs; i++) {
        const ayah = selectedAyahs[i];
        // setCurrentAyahIndex(i); // Stay on current view during export

        const sNum = String(selectedSurahNumber).padStart(3, "0");
        const aNum = String(ayah.numberInSurah).padStart(3, "0");
        const audioUrl = `/audio-proxy/${selectedReciterId}/${sNum}${aNum}.mp3`;

        let audioBuffer: AudioBuffer | null = null;
        try {
          const resp = await fetch(audioUrl);
          if (resp.ok) {
            const ab = await resp.arrayBuffer();
            audioBuffer = await audioCtx.decodeAudioData(ab);
          }
        } catch (e) {
          console.error("Audio fetch/decode failed", e);
        }

        const dur = audioBuffer?.duration ?? 4;
        let phase = 0;

        const frameInterval = setInterval(() => {
          drawFrame(ayah.text, phase);
          phase += 0.25;
        }, 33);

        if (audioBuffer) {
          const src = audioCtx.createBufferSource();
          src.buffer = audioBuffer;
          src.connect(exportGain);
          // Silent export - no connection to audioCtx.destination
          src.start();

          const startT = audioCtx.currentTime;
          await new Promise<void>(res => {
            const tick = setInterval(() => {
              const elapsed = audioCtx.currentTime - startT;
              setExportProgress(Math.round(((i + Math.min(elapsed / dur, 1)) / totalAyahs) * 100));
              if (elapsed >= dur) {
                clearInterval(tick);
                res();
              }
            }, 100);
            src.onended = () => {
              clearInterval(tick);
              res();
            };
          });
        } else {
          // Fallback if no audio
          const startT = Date.now();
          await new Promise<void>(res => {
            const tick = setInterval(() => {
              const elapsed = (Date.now() - startT) / 1000;
              setExportProgress(Math.round(((i + Math.min(elapsed / 4, 1)) / totalAyahs) * 100));
              if (elapsed >= 4) {
                clearInterval(tick);
                res();
              }
            }, 100);
          });
        }

        clearInterval(frameInterval);
      }

      setExportProgress(100);

      // Stop constant signal
      silent.stop();

      // Wait for a few more frames to ensure everything is captured
      await new Promise(r => setTimeout(r, 1000));

      await new Promise<void>((resolve) => {
        recorder.onstop = () => resolve();
        recorder.stop();
      });

      if (chunks.length > 0) {
        const blob = new Blob(chunks, { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        const ext = mimeType.includes("mp4") ? "mp4" : "webm";
        const dateStr = new Date().toISOString().replace(/[:.]/g, '-');
        const surahNameSafe = selectedSurah.name.en.replace(/\s+/g, '-');
        a.download = `trteel-${surahNameSafe}-${dateStr}.${ext}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 60000);
      } else {
        console.error("No chunks collected. Recorder failed.");
        alert("فشل تصدير الفيديو: لم يتم تجميع أي بيانات. جرّب تقليل عدد الآيات أو استخدام متصفح مغاير.");
      }

      document.body.removeChild(canvas);
      audioCtx.close();
    } catch (err) {
      console.error("Export error:", err);
      alert("حدث خطأ أثناء التصدير. يرجى مراجعة وحدة التحكم (Console).");
    } finally {
      setIsExporting(false);
      setCurrentAyahIndex(0);
    }
  };

  const maxAyah = selectedSurah.verses_count;

  const handleSurahChange = (nextSurahNumber: number) => {
    const nextSurah =
      surahs.find((surah) => surah.number === nextSurahNumber) ?? surahs[0];

    setSelectedSurahNumber(nextSurah.number);
    setFromAyah(1);
    setToAyah(Math.min(5, nextSurah.verses_count));
  };

  const handleFromAyahChange = (value: string) => {
    const nextFrom = parseAyah(value, fromAyah, 1, maxAyah);
    setFromAyah(nextFrom);
    setToAyah((currentTo) => (currentTo < nextFrom ? nextFrom : currentTo));
  };

  const handleToAyahChange = (value: string) => {
    const nextTo = parseAyah(value, toAyah, fromAyah, maxAyah);
    setToAyah(nextTo);
  };

  return (
    <>
      <style jsx global>{`
        ::-webkit-scrollbar {
          width: 8px;
        }
        ::-webkit-scrollbar-track {
          background: ${isDarkMode ? "#0a0c10" : "#ececf1"};
        }
        ::-webkit-scrollbar-thumb {
          background: ${isDarkMode ? "#2f3545" : "#ccc"};
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: ${isDarkMode ? "#3c435a" : "#999"};
        }
        scrollbar-width: thin;
        scrollbar-color: ${isDarkMode ? "#2f3545 #0a0c10" : "#ccc #ececf1"};
      `}</style>
      <main className={`flex h-[100dvh] w-full items-center justify-center p-1.5 md:p-5 transition-colors duration-500 ${isDarkMode ? "bg-[#0a0c10]" : "bg-[#ececf1]"}`} dir="ltr">
        <section className={`relative flex h-full w-full max-w-[1720px] flex-col-reverse overflow-hidden rounded-[24px] border transition-colors duration-500 shadow-[0_24px_70px_rgba(16,24,40,0.12)] md:flex-row ${isDarkMode ? "bg-[#11141d] border-[#1d232e]" : "bg-[#efeff3] border-[#d9dbe3]"}`}>
          <div className={`relative flex flex-[1.4] items-center justify-center p-6 md:flex-1 md:p-12 transition-colors duration-500 ${isDarkMode ? "bg-[#161a23]" : "bg-[#ebedf2]"}`}>
            <div className={`pointer-events-none absolute -left-20 top-8 h-56 w-56 rounded-full blur-3xl transition-colors ${isDarkMode ? "bg-[#16274d]" : "bg-[#d5e4ff]"}`} />
            <div className={`pointer-events-none absolute -bottom-16 right-8 h-64 w-64 rounded-full blur-3xl transition-colors ${isDarkMode ? "bg-[#1a1740]" : "bg-[#d9dbff]"}`} />

            <div
              ref={previewRef}
              className="relative h-full max-h-[min(85vh,720px)] w-auto max-w-full overflow-hidden rounded-[34px] border-[6px] border-[#20252e] shadow-[0_30px_80px_rgba(10,16,28,0.35)] transition-all duration-500 ease-in-out"
              style={{ aspectRatio }}
            >
              <Image
                src={bgImage}
                alt="Quran video preview"
                fill
                priority
                loading="eager"
                className={`object-cover transition-transform duration-[10000ms] ease-linear ${isPlaying ? "scale-110" : "scale-100"}`}
                style={{ filter: `blur(${bgBlur}px)` }}
              />
              {/* Dynamic Dimming Overlay */}
              <div
                className={`absolute inset-0 transition-all duration-500`}
                style={{ backgroundColor: `rgba(0, 0, 0, ${bgDim})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60 pointer-events-none" />

              {/* Pro Playback Controls Overlay (Relative to entire preview) */}
              <div className="absolute inset-0 z-30 group/player">
                {/* Clickable Area for Play/Pause */}
                <div
                  className="absolute inset-0 cursor-pointer pointer-events-auto"
                  onClick={togglePlayback}
                />

                {/* Center Play/Pause Indicator (Flashes on change) */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className={`transition-all duration-300 ${isPlaying ? "opacity-0 scale-150" : "opacity-100 scale-100"}`}>
                    {!isPlaying && (
                      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-black/40 backdrop-blur-xl border border-white/20 text-white shadow-2xl">
                        <Play fill="white" size={48} className="translate-x-1" />
                      </div>
                    )}
                  </div>
                </div>

                {/* Bottom Control Bar */}
                <div className="absolute bottom-0 left-0 right-0 p-6 pointer-events-none opacity-0 group-hover/player:opacity-100 transition-all duration-500 translate-y-4 group-hover/player:translate-y-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4 pointer-events-auto">
                      <button
                        onClick={(e) => { e.stopPropagation(); currentAyahIndex > 0 && setCurrentAyahIndex(prev => prev - 1); }}
                        disabled={currentAyahIndex === 0}
                        className="h-10 w-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-all disabled:opacity-30"
                      >
                        <SkipForward size={20} />
                      </button>

                      <button
                        onClick={(e) => { e.stopPropagation(); togglePlayback(); }}
                        className="h-12 w-12 flex items-center justify-center rounded-full bg-white text-[#1677ff] hover:scale-110 transition-all shadow-lg"
                      >
                        {isPlaying ? <Pause fill="currentColor" size={24} /> : <Play fill="currentColor" size={24} className="translate-x-0.5" />}
                      </button>

                      <button
                        onClick={(e) => { e.stopPropagation(); currentAyahIndex < selectedAyahs.length - 1 && setCurrentAyahIndex(prev => prev + 1); }}
                        disabled={currentAyahIndex === selectedAyahs.length - 1}
                        className="h-10 w-10 flex items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20 transition-all disabled:opacity-30"
                      >
                        <SkipBack size={20} />
                      </button>
                    </div>

                    <div className="text-right pointer-events-none">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-[#1677ff] mb-1">الآن يعرض</div>
                      <div className="text-xs font-bold text-white">آية {selectedAyahs[currentAyahIndex]?.numberInSurah} من {maxAyah}</div>
                    </div>
                  </div>

                  {/* Modern Docked Progress Bar */}
                  <div className="relative h-1.5 w-full rounded-full bg-white/20 overflow-hidden group/bar pointer-events-auto cursor-pointer">
                    <div
                      className={`absolute top-0 right-0 h-full bg-[#1677ff] transition-all duration-300 shadow-[0_0_15px_rgba(22,119,255,0.8)]`}
                      style={{ width: `${((currentAyahIndex + 1) / (selectedAyahs.length || 1)) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Top Info Badge */}
                <div className="absolute top-6 left-6 pointer-events-none">
                  <div className="flex items-center gap-2 rounded-full bg-black/40 backdrop-blur-md border border-white/10 px-3 py-1.5 text-white">
                    <div className={`h-2 w-2 rounded-full ${isPlaying ? "bg-red-500 animate-pulse" : "bg-white/40"}`} />
                    <span className="text-[10px] font-bold tracking-tight uppercase">Preview Studio</span>
                  </div>
                </div>
              </div>

              <div
                className="absolute z-10 flex w-[85%] -translate-x-1/2 flex-col items-center justify-center text-center text-white transition-all duration-300 ease-out"
                style={{ bottom: `${yPosition}%`, left: `${xPosition}%` }}
                dir="rtl"
              >
                <div className="max-h-[80%] w-full px-6 text-center">
                  {selectedAyahs.map((ayah, index) => (
                    index === currentAyahIndex && (
                      <p
                        key={ayah.number}
                        className="text-balance font-medium leading-[1.6] transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]"
                        style={{
                          fontSize: `${ayahFontSize}px`,
                          color: ayahColor,
                          textShadow: `0 4px 12px ${ayahShadowColor}80`,
                          animation: "fade-slide-up 0.8s forwards"
                        }}
                      >
                        {ayah.text}
                      </p>
                    )
                  ))}
                </div>

                <audio
                  ref={audioRef}
                  onEnded={handleAudioEnded}
                  className="hidden"
                />
              </div>

              {showSurahName && (
                <div
                  className="absolute z-10 -translate-x-1/2 flex flex-col items-center text-center text-white transition-all duration-300 ease-out"
                  style={{ bottom: `${surahYPosition}%`, left: `${surahXPosition}%` }}
                  dir="rtl"
                >
                  <h2
                    className="font-bold leading-tight"
                    style={{
                      fontSize: `${surahFontSize}px`,
                      color: surahColor,
                      textShadow: `0 2px 4px ${surahShadowColor}`
                    }}
                  >
                    سورة {selectedSurah.name.ar}
                  </h2>
                  <p
                    className="mt-1 text-xs font-medium opacity-80"
                    style={{
                      color: surahColor,
                      textShadow: `0 1px 2px ${surahShadowColor}`
                    }}
                  >
                    {selectedSurah.name.transliteration}
                  </p>
                </div>
              )}

              {showWave && (
                <div
                  className="absolute z-10 flex -translate-x-1/2 items-end justify-center gap-1 transition-all duration-300 ease-out"
                  style={{
                    bottom: `${waveY}%`,
                    left: `${waveX}%`,
                    height: `${waveHeight}px`
                  }}
                >
                  {[0.4, 0.7, 0.9, 0.5, 0.8, 0.6, 0.9, 0.7, 0.4, 0.8, 0.5, 0.7].map((h, i) => (
                    <div
                      key={i}
                      className="w-[3px] rounded-full opacity-80"
                      style={{
                        height: `${h * 100}%`,
                        backgroundColor: waveColor,
                        boxShadow: `0 0 10px ${waveColor}60`,
                        animation: `wave-bounce 0.8s ease-in-out infinite alternate`,
                        animationDelay: `${i * 0.05}s`
                      }}
                    />
                  ))}
                </div>
              )}

              {showWatermark && (
                <div
                  className="absolute z-20 transition-all duration-300 ease-out"
                  style={{
                    top: `${watermarkY}%`,
                    right: `${watermarkX}%`,
                    opacity: watermarkOpacity,
                  }}
                >
                  {watermarkMode === "image" && watermarkImage ? (
                    <img
                      src={watermarkImage}
                      alt="Watermark"
                      style={{ width: `${watermarkSize}px`, height: "auto" }}
                    />
                  ) : watermarkMode === "text" ? (
                    <span
                      style={{
                        fontSize: `${watermarkSize}px`,
                        color: watermarkTextColor,
                        fontWeight: "bold",
                        textShadow: "0 1px 2px rgba(0,0,0,0.5)"
                      }}
                    >
                      {watermarkText}
                    </span>
                  ) : null}
                </div>
              )}
            </div>
          </div>

          <aside
            className={`flex h-full w-full flex-1 flex-col transition-colors duration-500 md:max-w-[450px] md:border-l ${isDarkMode ? "bg-[#161a23] border-[#212735]" : "bg-white border-[#dde1ea]"}`}
            dir="rtl"
          >
            <header className={`flex items-center justify-between border-b px-6 py-5 transition-colors ${isDarkMode ? "border-[#212735]" : "border-[#eceff4]"}`}>
              <div className="text-right">
                <p className={`text-xl font-extrabold ${isDarkMode ? "text-[#3489ff]" : "text-[#1677ff]"}`}>ترتيل</p>
                <p className={`text-xs font-semibold ${isDarkMode ? "text-[#8a93a5]" : "text-[#8a93a5]"}`}>Quran Video Studio</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className={`flex h-11 w-11 items-center justify-center rounded-xl border transition-all ${isDarkMode ? "border-[#2f3545] bg-[#212735] text-[#3489ff]" : "border-[#dce6f8] bg-[#eef4ff] text-[#1f6feb]"}`}
                  aria-label="الملف الشخصي"
                >
                  <UserRound size={20} />
                </button>
                <button
                  type="button"
                  onClick={() => setIsDarkMode(!isDarkMode)}
                  className={`flex h-11 w-11 items-center justify-center rounded-xl border transition-all ${isDarkMode ? "border-[#2f3545] bg-[#212735] text-[#ffcc33]" : "border-[#e7e7eb] bg-[#f4f4f6] text-[#303540]"}`}
                  aria-label="الوضع الليلي"
                >
                  {isDarkMode ? <Palette size={20} /> : <Moon size={20} />}
                </button>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto px-6 py-7">
              <h1 className={`text-2xl font-extrabold transition-colors ${isDarkMode ? "text-white" : "text-[#1f2532]"}`}>إعدادات العرض</h1>
              <p className={`mt-1 text-sm font-medium transition-colors ${isDarkMode ? "text-[#8a93a5]" : "text-[#6a7385]"}`}>
                تحكّم في أبعاد المقطع وموقع النصوص والآيات المختارة
              </p>

              <div className="mt-7 space-y-3 pb-20">
                {/* Dimensions */}
                <div className={`overflow-hidden rounded-2xl border transition-all duration-300 ${activeAccordion === "dimensions" ? (isDarkMode ? "border-[#1677ff] bg-[#212735] shadow-sm" : "border-[#1677ff] bg-white shadow-sm") : isDarkMode ? "border-[#212735] bg-[#1d232e]" : "border-[#e3e7ef] bg-[#f8f9fc]"}`}>
                  <button
                    onClick={() => setActiveAccordion(activeAccordion === "dimensions" ? "" : "dimensions")}
                    className={`flex w-full items-center justify-between px-5 py-4 text-right ${activeAccordion === "dimensions" ? (isDarkMode ? "text-white" : "text-[#1677ff]") : isDarkMode ? "text-[#8a93a5]" : "text-[#1f2532]"}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${activeAccordion === "dimensions" ? "bg-[#1677ff] text-white" : isDarkMode ? "bg-[#252c3c] text-[#8a93a5]" : "bg-[#ebedf2] text-[#5b6373]"}`}>
                        <Layers size={16} />
                      </div>
                      <span className={`text-sm font-bold ${activeAccordion === "dimensions" ? "text-[#1677ff]" : ""}`}>أبعاد المقطع</span>
                    </div>
                    <ChevronDown size={18} className={`transition-transform duration-300 ${activeAccordion === "dimensions" ? "rotate-180" : "text-[#8a93a5]"}`} />
                  </button>

                  <div className={`grid transition-all duration-300 ease-in-out ${activeAccordion === "dimensions" ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                    <div className="overflow-hidden">
                      <div className="px-5 pb-5 pt-1">
                        <div className="grid grid-cols-2 gap-2">
                          {ASPECT_RATIOS.map((ratio: AspectRatio) => (
                            <button
                              key={ratio.id}
                              type="button"
                              onClick={() => setAspectRatio(ratio.id)}
                              className={`flex flex-col items-center justify-center rounded-xl border p-3 text-center transition-all ${aspectRatio === ratio.id
                                ? (isDarkMode ? "border-[#1677ff] bg-[#2f3d53] text-white shadow-[0_0_15px_rgba(22,119,255,0.2)]" : "border-[#1677ff] bg-[#f0f7ff] text-[#1677ff] shadow-[0_0_0_2px_rgba(22,119,255,0.1)]")
                                : isDarkMode ? "border-[#2f3545] bg-[#252c3c] text-[#8a93a5] hover:bg-[#2c3346]" : "border-[#e3e7ef] bg-white text-[#5b6373] hover:bg-[#f1f3f9]"
                                }`}
                            >
                              <span className="text-xs font-bold">{ratio.label}</span>
                              <span className="mt-1 text-[9px] opacity-70 leading-tight">{ratio.desc}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Selection */}
                <div className={`overflow-hidden rounded-2xl border transition-all duration-300 ${activeAccordion === "selection" ? (isDarkMode ? "border-[#1677ff] bg-[#212735] shadow-sm" : "border-[#1677ff] bg-white shadow-sm") : isDarkMode ? "border-[#212735] bg-[#1d232e]" : "border-[#e3e7ef] bg-[#f8f9fc]"}`}>
                  <button
                    onClick={() => setActiveAccordion(activeAccordion === "selection" ? "" : "selection")}
                    className={`flex w-full items-center justify-between px-5 py-4 text-right ${activeAccordion === "selection" ? (isDarkMode ? "text-white" : "text-[#1677ff]") : isDarkMode ? "text-[#8a93a5]" : "text-[#1f2532]"}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${activeAccordion === "selection" ? "bg-[#1677ff] text-white" : isDarkMode ? "bg-[#252c3c] text-[#8a93a5]" : "bg-[#ebedf2] text-[#5b6373]"}`}>
                        <ALargeSmall size={16} />
                      </div>
                      <span className={`text-sm font-bold ${activeAccordion === "selection" ? "text-[#1677ff]" : ""}`}>اختيار النص والآيات</span>
                    </div>
                    <ChevronDown size={18} className={`text-[#8a93a5] transition-transform duration-300 ${activeAccordion === "selection" ? "rotate-180" : ""}`} />
                  </button>

                  <div className={`grid transition-all duration-300 ease-in-out ${activeAccordion === "selection" ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                    <div className="overflow-hidden">
                      <div className="space-y-4 px-5 pb-5 pt-1">
                        <div>
                          <label className={`mb-2 block text-[11px] font-bold ${isDarkMode ? "text-[#6e7786]" : "text-[#81899a]"}`}>القارئ</label>
                          <div className="relative">
                            <select
                              value={selectedReciterId}
                              onChange={(e) => setSelectedReciterId(e.target.value)}
                              className={`h-12 w-full appearance-none rounded-xl border px-4 text-sm font-bold outline-none transition focus:border-[#2f7dff] ${isDarkMode ? "bg-[#252c3c] border-[#2f3545] text-white" : "bg-white border-[#e3e7ef] text-[#1f2532]"}`}
                            >
                              {reciters.map((r) => (
                                <option key={r.id} value={r.id}>
                                  {r.name_ar || r.name}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#6e7786]" size={16} />
                          </div>
                        </div>
                        <div>
                          <label htmlFor="surahSelect" className={`mb-2 block text-[11px] font-bold ${isDarkMode ? "text-[#6e7786]" : "text-[#81899a]"}`}>السورة</label>
                          <div className="relative">
                            <select
                              id="surahSelect"
                              value={selectedSurahNumber}
                              onChange={(event) => handleSurahChange(Number(event.target.value))}
                              className={`h-12 w-full appearance-none rounded-xl border px-4 text-sm font-bold outline-none transition focus:border-[#2f7dff] ${isDarkMode ? "bg-[#252c3c] border-[#2f3545] text-white" : "bg-white border-[#e3e7ef] text-[#1f2532]"}`}
                            >
                              {surahs.map((surah) => (
                                <option key={surah.number} value={surah.number}>
                                  {surah.number}. {surah.name.ar}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#6e7786]" size={16} />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <label className={`rounded-xl border px-3 py-2 transition-colors ${isDarkMode ? "bg-[#252c3c] border-[#2f3545]" : "bg-white border-[#e3e7ef]"}`}>
                            <span className={`text-[10px] font-bold ${isDarkMode ? "text-[#6e7786]" : "text-[#81899a]"}`}>من آية</span>
                            <input
                              type="number"
                              min={1}
                              max={maxAyah}
                              value={fromAyah}
                              onChange={(e) => handleFromAyahChange(e.target.value)}
                              className={`mt-1 block w-full border-0 bg-transparent text-lg font-extrabold outline-none ${isDarkMode ? "text-white" : "text-[#1f2532]"}`}
                            />
                          </label>
                          <label className={`rounded-xl border px-3 py-2 transition-colors ${isDarkMode ? "bg-[#252c3c] border-[#2f3545]" : "bg-white border-[#e3e7ef]"}`}>
                            <span className={`text-[10px] font-bold ${isDarkMode ? "text-[#6e7786]" : "text-[#81899a]"}`}>إلى آية</span>
                            <input
                              type="number"
                              min={fromAyah}
                              max={maxAyah}
                              value={toAyah}
                              onChange={(e) => handleToAyahChange(e.target.value)}
                              className={`mt-1 block w-full border-0 bg-transparent text-lg font-extrabold outline-none ${isDarkMode ? "text-white" : "text-[#1f2532]"}`}
                            />
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Background */}
                <div className={`overflow-hidden rounded-2xl border transition-all duration-300 ${activeAccordion === "background" ? (isDarkMode ? "border-[#1677ff] bg-[#212735] shadow-sm" : "border-[#1677ff] bg-white shadow-sm") : isDarkMode ? "border-[#212735] bg-[#1d232e]" : "border-[#e3e7ef] bg-[#f8f9fc]"}`}>
                  <button
                    onClick={() => setActiveAccordion(activeAccordion === "background" ? "" : "background")}
                    className={`flex w-full items-center justify-between px-5 py-4 text-right ${activeAccordion === "background" ? (isDarkMode ? "text-white" : "text-[#1677ff]") : isDarkMode ? "text-[#8a93a5]" : "text-[#1f2532]"}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${activeAccordion === "background" ? "bg-[#1677ff] text-white" : isDarkMode ? "bg-[#252c3c] text-[#8a93a5]" : "bg-[#ebedf2] text-[#5b6373]"}`}>
                        <ImagePlus size={16} />
                      </div>
                      <span className={`text-sm font-bold ${activeAccordion === "background" ? "text-[#1677ff]" : ""}`}>الخلفية والمؤثرات</span>
                    </div>
                    <ChevronDown size={18} className={`text-[#8a93a5] transition-transform duration-300 ${activeAccordion === "background" ? "rotate-180" : ""}`} />
                  </button>

                  <div className={`grid transition-all duration-300 ease-in-out ${activeAccordion === "background" ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                    <div className="overflow-hidden">
                      <div className="px-5 pb-5 pt-1">
                        <div className="grid grid-cols-4 gap-2">
                          {[bg1, bg2, bg3, bg4, bg5].map((bg, idx) => (
                            <button
                              key={idx}
                              onClick={() => setBgImage(bg)}
                              className={`relative aspect-video flex-shrink-0 cursor-pointer overflow-hidden rounded-lg border-2 transition-all ${bgImage === bg ? "border-[#1677ff] shadow-sm" : "border-transparent"}`}
                            >
                              <Image src={bg} alt={`BG ${idx + 1}`} fill className="object-cover" />
                            </button>
                          ))}
                          <label className={`flex aspect-video cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-all ${isDarkMode ? "border-[#2f3545] bg-[#252c3c] hover:bg-[#2c3346]" : "border-[#dce6f8] bg-white hover:bg-[#eef4ff]"}`}>
                            <ImagePlus size={14} className="text-[#1f6feb]" />
                            <input type="file" hidden accept="image/*" onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (event) => setBgImage(event.target?.result as string);
                                reader.readAsDataURL(file);
                              }
                            }} />
                          </label>
                        </div>
                        <div className="mt-5 space-y-4">
                          <div>
                            <div className="mb-2 flex items-center justify-between text-[11px] font-bold text-[#5b6373]">
                              <span>تعتيم الخلفية</span>
                              <span className="text-[#1677ff]">{Math.round(bgDim * 100)}%</span>
                            </div>
                            <input
                              type="range" min="0" max="0.9" step="0.01" value={bgDim}
                              onChange={(e) => setBgDim(Number(e.target.value))}
                              className={`h-1.5 w-full cursor-pointer appearance-none rounded-lg accent-[#1677ff] ${isDarkMode ? "bg-[#2f3545]" : "bg-[#dde4f0]"}`}
                            />
                          </div>
                          <div>
                            <div className="mb-2 flex items-center justify-between text-[11px] font-bold text-[#5b6373]">
                              <span>ضبابية (Blur)</span>
                              <span className="text-[#1677ff]">{bgBlur}px</span>
                            </div>
                            <input
                              type="range" min="0" max="20" step="1" value={bgBlur}
                              onChange={(e) => setBgBlur(Number(e.target.value))}
                              className={`h-1.5 w-full cursor-pointer appearance-none rounded-lg accent-[#1677ff] ${isDarkMode ? "bg-[#2f3545]" : "bg-[#dde4f0]"}`}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Appearance */}
                <div className={`overflow-hidden rounded-2xl border transition-all duration-300 ${activeAccordion === "appearance" ? (isDarkMode ? "border-[#1677ff] bg-[#212735] shadow-sm" : "border-[#1677ff] bg-white shadow-sm") : isDarkMode ? "border-[#212735] bg-[#1d232e]" : "border-[#e3e7ef] bg-[#f8f9fc]"}`}>
                  <button
                    onClick={() => setActiveAccordion(activeAccordion === "appearance" ? "" : "appearance")}
                    className={`flex w-full items-center justify-between px-5 py-4 text-right ${activeAccordion === "appearance" ? (isDarkMode ? "text-white" : "text-[#1677ff]") : isDarkMode ? "text-[#8a93a5]" : "text-[#1f2532]"}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${activeAccordion === "appearance" ? "bg-[#1677ff] text-white" : isDarkMode ? "bg-[#252c3c] text-[#8a93a5]" : "bg-[#ebedf2] text-[#5b6373]"}`}>
                        <Palette size={16} />
                      </div>
                      <span className={`text-sm font-bold ${activeAccordion === "appearance" ? "text-[#1677ff]" : ""}`}>تنسيق النصوص والآيات</span>
                    </div>
                    <ChevronDown size={18} className={`text-[#8a93a5] transition-transform duration-300 ${activeAccordion === "appearance" ? "rotate-180" : ""}`} />
                  </button>

                  <div className={`grid transition-all duration-300 ease-in-out ${activeAccordion === "appearance" ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                    <div className="overflow-hidden">
                      <div className="space-y-5 px-5 pb-5 pt-1">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="mb-2 text-[10px] font-bold text-[#81899a]">حجم الخط</div>
                            <div className={`flex items-center gap-3 h-10 px-3 border rounded-xl ${isDarkMode ? "bg-[#252c3c] border-[#2f3545]" : "bg-white border-[#e3e7ef]"}`}>
                              <input type="range" min="16" max="80" value={ayahFontSize} onChange={(e) => setAyahFontSize(Number(e.target.value))} className="h-1 flex-1 accent-[#1677ff]" />
                              <span className={`text-xs font-bold w-6 ${isDarkMode ? "text-white" : "text-[#1f2532]"}`}>{ayahFontSize}</span>
                            </div>
                          </div>
                          <div>
                            <div className="mb-2 text-[10px] font-bold text-[#81899a]">لون الخط</div>
                            <div className={`flex items-center gap-2 h-10 px-2 border rounded-xl overflow-hidden ${isDarkMode ? "bg-[#252c3c] border-[#2f3545]" : "bg-white border-[#e3e7ef]"}`}>
                              <input type="color" value={ayahColor} onChange={(e) => setAyahColor(e.target.value)} className="h-6 w-6 cursor-pointer border-0 bg-transparent" />
                              <span className={`text-[9px] font-mono font-bold uppercase truncate ${isDarkMode ? "text-[#8a93a5]" : "text-[#5b6373]"}`}>{ayahColor}</span>
                            </div>
                          </div>
                        </div>
                        <div className="space-y-4">
                          <div>
                            <div className="mb-2 flex items-center justify-between text-[11px] font-bold text-[#5b6373]">
                              <span>الموقع العمودي (Y)</span>
                              <span className="text-[#1677ff]">{yPosition}%</span>
                            </div>
                            <input type="range" min="5" max="85" value={yPosition} onChange={(e) => setYPosition(Number(e.target.value))} className="h-1.5 w-full accent-[#1677ff]" />
                          </div>
                          <div>
                            <div className="mb-2 flex items-center justify-between text-[11px] font-bold text-[#5b6373]">
                              <span>الموقع الأفقي (X)</span>
                              <span className="text-[#1677ff]">{xPosition}%</span>
                            </div>
                            <input type="range" min="10" max="90" value={xPosition} onChange={(e) => setXPosition(Number(e.target.value))} className="h-1.5 w-full accent-[#1677ff]" />
                          </div>
                        </div>
                        <div className="border-t border-[#ebedf2] pt-4">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-bold text-[#1f2532]">إظهار اسم السورة</span>
                            <button onClick={() => setShowSurahName(!showSurahName)} className={`relative h-5 w-9 rounded-full transition-colors ${showSurahName ? "bg-[#1677ff]" : "bg-[#dde1ea]"}`}>
                              <span className={`absolute top-1 h-3 w-3 rounded-full bg-white transition-all ${showSurahName ? "left-1" : "left-5"}`} />
                            </button>
                          </div>
                          {showSurahName && (
                            <div className="grid grid-cols-2 gap-3 mt-3">
                              <div>
                                <div className="mb-1 text-[10px] font-bold text-[#81899a]">الحجم</div>
                                <input type="range" min="12" max="60" value={surahFontSize} onChange={(e) => setSurahFontSize(Number(e.target.value))} className="w-full h-1" />
                              </div>
                              <div>
                                <div className="mb-1 text-[10px] font-bold text-[#81899a]">الموقع Y</div>
                                <input type="range" min="2" max="95" value={surahYPosition} onChange={(e) => setSurahYPosition(Number(e.target.value))} className="w-full h-1" />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Waveform */}
                <div className={`overflow-hidden rounded-2xl border transition-all duration-300 ${activeAccordion === "wave" ? (isDarkMode ? "border-[#1677ff] bg-[#212735] shadow-sm" : "border-[#1677ff] bg-white shadow-sm") : isDarkMode ? "border-[#212735] bg-[#1d232e]" : "border-[#e3e7ef] bg-[#f8f9fc]"}`}>
                  <button
                    onClick={() => setActiveAccordion(activeAccordion === "wave" ? "" : "wave")}
                    className={`flex w-full items-center justify-between px-5 py-4 text-right ${activeAccordion === "wave" ? (isDarkMode ? "text-white" : "text-[#1677ff]") : isDarkMode ? "text-[#8a93a5]" : "text-[#1f2532]"}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${activeAccordion === "wave" ? "bg-[#1677ff] text-white" : isDarkMode ? "bg-[#252c3c] text-[#8a93a5]" : "bg-[#ebedf2] text-[#5b6373]"}`}>
                        <AudioLines size={16} />
                      </div>
                      <span className={`text-sm font-bold ${activeAccordion === "wave" ? "text-[#1677ff]" : ""}`}>موجة الصوت (Waveform)</span>
                    </div>
                    <ChevronDown size={18} className={`text-[#8a93a5] transition-transform duration-300 ${activeAccordion === "wave" ? "rotate-180" : ""}`} />
                  </button>

                  <div className={`grid transition-all duration-300 ease-in-out ${activeAccordion === "wave" ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                    <div className="overflow-hidden">
                      <div className="space-y-5 px-5 pb-5 pt-1">
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-bold ${isDarkMode ? "text-white" : "text-[#1f2532]"}`}>تفعيل الموجة</span>
                          <button onClick={() => setShowWave(!showWave)} className={`relative h-5 w-9 rounded-full transition-colors ${showWave ? "bg-[#1677ff]" : isDarkMode ? "bg-[#2f3545]" : "bg-[#dde1ea]"}`}>
                            <span className={`absolute top-1 h-3 w-3 rounded-full bg-white transition-all ${showWave ? "left-1" : "left-5"}`} />
                          </button>
                        </div>
                        {showWave && (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <div className="mb-2 text-[10px] font-bold text-[#81899a]">اللون</div>
                                <input type="color" value={waveColor} onChange={(e) => setWaveColor(e.target.value)} className="w-full h-8 cursor-pointer border-0 bg-transparent" />
                              </div>
                              <div>
                                <div className="mb-2 text-[10px] font-bold text-[#81899a]">الارتفاع</div>
                                <input type="range" min="20" max="150" value={waveHeight} onChange={(e) => setWaveHeight(Number(e.target.value))} className="w-full h-1" />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <div className="mb-1 text-[10px] font-bold text-[#81899a]">موقع Y</div>
                                <input type="range" min="0" max="95" value={waveY} onChange={(e) => setWaveY(Number(e.target.value))} className="w-full h-1" />
                              </div>
                              <div>
                                <div className="mb-1 text-[10px] font-bold text-[#81899a]">موقع X</div>
                                <input type="range" min="0" max="100" value={waveX} onChange={(e) => setWaveX(Number(e.target.value))} className="w-full h-1" />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Watermark */}
                <div className={`overflow-hidden rounded-2xl border transition-all duration-300 ${activeAccordion === "watermark" ? (isDarkMode ? "border-[#1677ff] bg-[#212735] shadow-sm" : "border-[#1677ff] bg-white shadow-sm") : isDarkMode ? "border-[#212735] bg-[#1d232e]" : "border-[#e3e7ef] bg-[#f8f9fc]"}`}>
                  <button
                    onClick={() => setActiveAccordion(activeAccordion === "watermark" ? "" : "watermark")}
                    className={`flex w-full items-center justify-between px-5 py-4 text-right ${activeAccordion === "watermark" ? (isDarkMode ? "text-white" : "text-[#1677ff]") : isDarkMode ? "text-[#8a93a5]" : "text-[#1f2532]"}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg transition-colors ${activeAccordion === "watermark" ? "bg-[#1677ff] text-white" : isDarkMode ? "bg-[#252c3c] text-[#8a93a5]" : "bg-[#ebedf2] text-[#5b6373]"}`}>
                        <MoveVertical size={16} />
                      </div>
                      <span className={`text-sm font-bold ${activeAccordion === "watermark" ? "text-[#1677ff]" : ""}`}>العلامة المائية (Logo)</span>
                    </div>
                    <ChevronDown size={18} className={`text-[#8a93a5] transition-transform duration-300 ${activeAccordion === "watermark" ? "rotate-180" : ""}`} />
                  </button>

                  <div className={`grid transition-all duration-300 ease-in-out ${activeAccordion === "watermark" ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
                    <div className="overflow-hidden">
                      <div className="space-y-4 px-5 pb-5 pt-1">
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-bold ${isDarkMode ? "text-white" : "text-[#1f2532]"}`}>تفعيل الشعار</span>
                          <button onClick={() => setShowWatermark(!showWatermark)} className={`relative h-5 w-9 rounded-full transition-colors ${showWatermark ? "bg-[#1677ff]" : isDarkMode ? "bg-[#2f3545]" : "bg-[#dde1ea]"}`}>
                            <span className={`absolute top-1 h-3 w-3 rounded-full bg-white transition-all ${showWatermark ? "left-1" : "left-5"}`} />
                          </button>
                        </div>
                        {showWatermark && (
                          <div className="space-y-4">
                            <div className={`flex rounded-lg p-1 ${isDarkMode ? "bg-[#252c3c]" : "bg-[#ebedf2]"}`}>
                              <button onClick={() => setWatermarkMode("image")} className={`flex-1 rounded-md py-1.5 text-[10px] font-bold transition-all ${watermarkMode === "image" ? (isDarkMode ? "bg-[#2f3545] text-white" : "bg-white text-[#1677ff]") : "text-[#5b6373] hover:opacity-80"}`}>صورة</button>
                              <button onClick={() => setWatermarkMode("text")} className={`flex-1 rounded-md py-1.5 text-[10px] font-bold transition-all ${watermarkMode === "text" ? (isDarkMode ? "bg-[#2f3545] text-white" : "bg-white text-[#1677ff]") : "text-[#5b6373] hover:opacity-80"}`}>نص</button>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <div className="mb-1 text-[10px] font-bold text-[#81899a]">الحجم</div>
                                <input type="range" min="10" max="200" value={watermarkSize} onChange={(e) => setWatermarkSize(Number(e.target.value))} className="w-full h-1" />
                              </div>
                              <div>
                                <div className="mb-1 text-[10px] font-bold text-[#81899a]">الشفافية</div>
                                <input type="range" min="0" max="1" step="0.01" value={watermarkOpacity} onChange={(e) => setWatermarkOpacity(Number(e.target.value))} className="w-full h-1" />
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <div className="mb-1 text-[10px] font-bold text-[#81899a]">الموقع X</div>
                                <input type="range" min="0" max="50" value={watermarkX} onChange={(e) => setWatermarkX(Number(e.target.value))} className="w-full h-1" />
                              </div>
                              <div>
                                <div className="mb-1 text-[10px] font-bold text-[#81899a]">الموقع Y</div>
                                <input type="range" min="0" max="50" value={watermarkY} onChange={(e) => setWatermarkY(Number(e.target.value))} className="w-full h-1" />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <footer className={`border-t p-5 transition-colors ${isDarkMode ? "bg-[#161a23] border-[#212735]" : "bg-white border-[#eceff4]"}`}>
              <button
                type="button"
                onClick={handleExport}
                disabled={isExporting}
                className="group relative flex h-16 w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-[#0f73ff] to-[#3489ff] text-xl font-extrabold text-white shadow-[0_14px_32px_rgba(15,115,255,0.35)] transition-all hover:brightness-105 active:scale-[0.98] disabled:opacity-70"
              >
                {isExporting ? (
                  <div className="flex flex-col items-center">
                    <div className="flex items-center gap-3">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      <span>جاري تصدير الفيديو... ({exportProgress}%)</span>
                    </div>
                    <div className="mt-2 h-1 w-48 rounded-full bg-white/20">
                      <div
                        className="h-full bg-white transition-all duration-300"
                        style={{ width: `${exportProgress}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
                    <Clapperboard size={22} className="transition-transform group-hover:rotate-12" />
                    <span>تصدير المقطع </span>
                  </>
                )}
              </button>
            </footer>
          </aside>
        </section>
      </main>
    </>
  );
}
