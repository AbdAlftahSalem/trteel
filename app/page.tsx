"use client";

import Image from "next/image";
import { useMemo, useState, useRef, useEffect } from "react";
import { Play, Pause, SkipForward, SkipBack, ALargeSmall, AudioLines, ChevronDown, Clapperboard, ImagePlus, Layers, Moon, MoveHorizontal, MoveVertical, Palette, UserRound, Download } from "lucide-react";
import html2canvas from "html2canvas";
import bg1 from "@/assets/images/1.svg";
import bg2 from "@/assets/images/2.svg";
import bg3 from "@/assets/images/3.svg";
import bg4 from "@/assets/images/4.svg";
import bg5 from "@/assets/images/5.svg";
import surahsData from "@/assets/quran_surahs.json";
import quranDataRaw from "@/assets/quran.json";


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
  const [bgBlur, setBgBlur] = useState<number>(0);
  const [bgDim, setBgDim] = useState<number>(0.3);
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
      const audioUrl = `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${ayah.number}.mp3`;

      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play().catch(err => console.error("Playback failed", err));
      }
    }
  }, [isPlaying, currentAyahIndex, selectedAyahs]);

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
    if (selectedAyahs.length === 0 || !previewRef.current) return;

    setIsExporting(true);
    setExportProgress(0);
    setIsPlaying(false);
    setCurrentAyahIndex(0);

    const chunks: Blob[] = [];
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const preview = previewRef.current;

    // Get the actual display size of the preview
    const rect = preview.getBoundingClientRect();
    canvas.width = rect.width * 2; // Supersample for "Production" quality
    canvas.height = rect.height * 2;

    const stream = canvas.captureStream(30); // 30 FPS

    // Create audio context to capture audio stream
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const source = audioCtx.createMediaElementSource(audioRef.current!);
    const destination = audioCtx.createMediaStreamDestination();
    source.connect(destination);
    source.connect(audioCtx.destination); // Also play locally while recording

    // Combine video stream with audio stream
    const combinedStream = new MediaStream([
      ...stream.getVideoTracks(),
      ...destination.stream.getAudioTracks()
    ]);

    const recorder = new MediaRecorder(combinedStream, {
      mimeType: "video/webm;codecs=vp9,opus",
      videoBitsPerSecond: 8000000 // 8 Mbps for high quality
    });

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `trteel-quran-${selectedSurah.name.ar}-${Date.now()}.webm`;
      a.click();
      URL.revokeObjectURL(url);
      setIsExporting(false);
    };

    // Start recording
    recorder.start();
    setIsPlaying(true);

    // Rendering loop
    const totalAyahs = selectedAyahs.length;
    let lastAyahIndex = -1;

    const captureFrame = async () => {
      if (!isExporting) return;

      try {
        const frameCanvas = await html2canvas(preview, {
          useCORS: true,
          scale: 2,
          logging: false,
          backgroundColor: null
        });

        if (ctx) {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(frameCanvas, 0, 0);
        }

        // Update progress based on ayah completion
        const progress = Math.round(((currentAyahIndex + 1) / totalAyahs) * 100);
        setExportProgress(progress);

        if (isPlaying) {
          requestAnimationFrame(captureFrame);
        } else if (currentAyahIndex === totalAyahs - 1) {
          // Finished
          recorder.stop();
          audioCtx.close();
        }
      } catch (err) {
        console.error("Frame capture failed", err);
        setIsExporting(false);
        recorder.stop();
      }
    };

    captureFrame();
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
    <main className="flex h-[100dvh] w-full items-center justify-center bg-[#ececf1] p-1.5 md:p-5" dir="ltr">
      <section className="relative flex h-full w-full max-w-[1720px] flex-col-reverse overflow-hidden rounded-[24px] border border-[#d9dbe3] bg-[#efeff3] shadow-[0_24px_70px_rgba(16,24,40,0.12)] md:flex-row">
        <div className="relative flex flex-[1.4] items-center justify-center bg-[#ebedf2] p-6 md:flex-1 md:p-12">
          <div className="pointer-events-none absolute -left-20 top-8 h-56 w-56 rounded-full bg-[#d5e4ff] blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 right-8 h-64 w-64 rounded-full bg-[#d9dbff] blur-3xl" />

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
          className="flex h-full w-full flex-1 flex-col border-[#dde1ea] bg-white md:max-w-[450px] md:border-l"
          dir="rtl"
        >
          <header className="flex items-center justify-between border-b border-[#eceff4] px-6 py-5">
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#dce6f8] bg-[#eef4ff] text-[#1f6feb]"
                aria-label="الملف الشخصي"
              >
                <UserRound size={20} />
              </button>
              <button
                type="button"
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#e7e7eb] bg-[#f4f4f6] text-[#303540]"
                aria-label="الوضع الليلي"
              >
                <Moon size={20} />
              </button>
            </div>

            <div className="text-right">
              <p className="text-lg font-extrabold text-[#1677ff]">ترتيل</p>
              <p className="text-xs font-semibold text-[#8a93a5]">
                Quran Video Studio
              </p>
            </div>
          </header>

          <div className="flex-1 overflow-y-auto px-6 py-7">
            <h1 className="text-2xl font-extrabold text-[#1f2532]">إعدادات العرض</h1>
            <p className="mt-1 text-sm font-medium text-[#6a7385]">
              تحكّم في أبعاد المقطع وموقع النصوص والآيات المختارة
            </p>

            <div className="mt-7 space-y-5">
              <div>
                <label className="mb-2 block text-sm font-bold text-[#5b6373]">
                  أبعاد الفيديو (Aspect Ratio)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {ASPECT_RATIOS.map((ratio: AspectRatio) => (
                    <button
                      key={ratio.id}
                      type="button"
                      onClick={() => setAspectRatio(ratio.id)}
                      className={`flex flex-col items-center justify-center rounded-xl border p-3 text-center transition-all ${aspectRatio === ratio.id
                        ? "border-[#1677ff] bg-[#f0f7ff] text-[#1677ff] shadow-[0_0_0_2px_rgba(22,119,255,0.1)]"
                        : "border-[#e3e7ef] bg-[#f8f9fc] text-[#5b6373] hover:bg-[#f1f3f9]"
                        }`}
                    >
                      <span className="text-sm font-bold">{ratio.label}</span>
                      <span className="mt-1 text-[10px] opacity-70">
                        {ratio.desc}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="mb-3 block text-sm font-bold text-[#5b6373]">
                  خلفية الفيديو (Background)
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {[bg1, bg2, bg3, bg4, bg5].map((bg, idx) => (
                    <button
                      key={idx}
                      onClick={() => setBgImage(bg)}
                      className={`relative aspect-video flex-shrink-0 cursor-pointer overflow-hidden rounded-xl border-2 transition-all hover:scale-105 active:scale-95 ${bgImage === bg ? "border-[#1677ff] shadow-lg" : "border-transparent"
                        }`}
                    >
                      <Image
                        src={bg}
                        alt={`Background ${idx + 1}`}
                        fill
                        className="object-cover"
                      />
                    </button>
                  ))}
                  <label className="flex aspect-square cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#dce6f8] bg-[#f8f9fc] hover:bg-[#eef4ff] transition-all">
                    <ImagePlus size={20} className="text-[#1f6feb]" />
                    <span className="mt-1 text-[10px] font-bold text-[#1f6feb]">رفع</span>
                    <input
                      type="file"
                      hidden
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) =>
                            setBgImage(event.target?.result as string);
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                </div>

                <div className="mt-5 grid grid-cols-2 gap-4">
                  <div>
                    <div className="mb-2 flex items-center justify-between text-xs font-bold text-[#5b6373]">
                      <div className="flex items-center gap-1.5">
                        <Moon size={14} className="text-[#1f6feb]" />
                        <span>تعتيم الخلفية</span>
                      </div>
                      <span className="text-[#1f6feb]">{Math.round(bgDim * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="0.9"
                      step="0.01"
                      value={bgDim}
                      onChange={(e) => setBgDim(Number(e.target.value))}
                      className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-[#dde4f0] accent-[#1677ff]"
                    />
                  </div>
                  <div>
                    <div className="mb-2 flex items-center justify-between text-xs font-bold text-[#5b6373]">
                      <div className="flex items-center gap-1.5">
                        <Moon size={14} className="text-[#1f6feb]" />
                        <span>ضبابية (Blur)</span>
                      </div>
                      <span className="text-[#1f6feb]">{bgBlur}px</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="20"
                      step="1"
                      value={bgBlur}
                      onChange={(e) => setBgBlur(Number(e.target.value))}
                      className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-[#dde4f0] accent-[#1677ff]"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label
                  htmlFor="surahSelect"
                  className="mb-2 block text-sm font-bold text-[#5b6373]"
                >
                  السورة
                </label>
                <div className="relative">
                  <select
                    id="surahSelect"
                    value={selectedSurahNumber}
                    onChange={(event) =>
                      handleSurahChange(Number(event.target.value))
                    }
                    className="h-14 w-full appearance-none rounded-2xl border border-[#e3e7ef] bg-[#f8f9fc] px-4 text-base font-bold text-[#1f2532] outline-none transition focus:border-[#2f7dff] focus:bg-white focus:ring-4 focus:ring-[#2f7dff]/15"
                  >
                    {surahs.map((surah) => (
                      <option key={surah.number} value={surah.number}>
                        {surah.number}. {surah.name.ar} - {surah.name.transliteration}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#6e7786]" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <label
                  htmlFor="fromAyah"
                  className="rounded-2xl border border-[#e3e7ef] bg-[#f8f9fc] px-4 py-3"
                >
                  <span className="text-xs font-bold text-[#81899a]">من آية</span>
                  <input
                    id="fromAyah"
                    type="number"
                    min={1}
                    max={maxAyah}
                    value={fromAyah}
                    onChange={(event) => handleFromAyahChange(event.target.value)}
                    onBlur={(event) => handleFromAyahChange(event.target.value)}
                    className="mt-2 block w-full border-0 bg-transparent text-2xl font-extrabold text-[#1f2532] outline-none"
                  />
                </label>

                <label
                  htmlFor="toAyah"
                  className="rounded-2xl border border-[#e3e7ef] bg-[#f8f9fc] px-4 py-3"
                >
                  <span className="text-xs font-bold text-[#81899a]">إلى آية</span>
                  <input
                    id="toAyah"
                    type="number"
                    min={fromAyah}
                    max={maxAyah}
                    value={toAyah}
                    onChange={(event) => handleToAyahChange(event.target.value)}
                    onBlur={(event) => handleToAyahChange(event.target.value)}
                    className="mt-2 block w-full border-0 bg-transparent text-2xl font-extrabold text-[#1f2532] outline-none"
                  />
                </label>
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-bold text-[#5b6373]">
                    <MoveVertical size={16} className="text-[#1f6feb]" />
                    <span>موضع النص (عمودياً)</span>
                  </div>
                  <span className="text-sm font-semibold text-[#1f6feb] transition-all">
                    {yPosition}%
                  </span>
                </div>
                <div className="relative flex h-14 w-full items-center rounded-2xl border border-[#e3e7ef] bg-[#f8f9fc] px-4">
                  <input
                    type="range"
                    min="5"
                    max="85"
                    step="1"
                    value={yPosition}
                    onChange={(e) => setYPosition(Number(e.target.value))}
                    className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-[#dde4f0] accent-[#1677ff]"
                  />
                </div>
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-bold text-[#5b6373]">
                    <MoveHorizontal size={16} className="text-[#1f6feb]" />
                    <span>موضع النص (أفقياً)</span>
                  </div>
                  <span className="text-sm font-semibold text-[#1f6feb] transition-all">
                    {xPosition}%
                  </span>
                </div>
                <div className="relative flex h-14 w-full items-center rounded-2xl border border-[#e3e7ef] bg-[#f8f9fc] px-4">
                  <input
                    type="range"
                    min="10"
                    max="90"
                    step="1"
                    value={xPosition}
                    onChange={(e) => setXPosition(Number(e.target.value))}
                    className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-[#dde4f0] accent-[#1677ff]"
                  />
                </div>
              </div>

              <div>
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-bold text-[#5b6373]">
                    <ALargeSmall size={16} className="text-[#1f6feb]" />
                    <span>حجم خط الآيات</span>
                  </div>
                  <span className="text-sm font-semibold text-[#1f6feb] transition-all">
                    {ayahFontSize}px
                  </span>
                </div>
                <div className="relative flex h-14 w-full items-center rounded-2xl border border-[#e3e7ef] bg-[#f8f9fc] px-4">
                  <input
                    type="range"
                    min="16"
                    max="80"
                    step="1"
                    value={ayahFontSize}
                    onChange={(e) => setAyahFontSize(Number(e.target.value))}
                    className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-[#dde4f0] accent-[#1677ff]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="mb-2 flex items-center gap-2 text-xs font-bold text-[#5b6373]">
                    <Palette size={14} className="text-[#1f6feb]" />
                    <span>لون الآيات</span>
                  </div>
                  <div className="flex h-12 items-center gap-3 rounded-xl border border-[#e3e7ef] bg-[#f8f9fc] px-3">
                    <input
                      type="color"
                      value={ayahColor}
                      onChange={(e) => setAyahColor(e.target.value)}
                      className="h-6 w-6 cursor-pointer border-0 bg-transparent"
                    />
                    <span className="text-xs font-mono font-bold uppercase text-[#1f2532]">{ayahColor}</span>
                  </div>
                </div>
                <div>
                  <div className="mb-2 flex items-center gap-2 text-xs font-bold text-[#5b6373]">
                    <Layers size={14} className="text-[#1f6feb]" />
                    <span>ظل الآيات</span>
                  </div>
                  <div className="flex h-12 items-center gap-3 rounded-xl border border-[#e3e7ef] bg-[#f8f9fc] px-3">
                    <input
                      type="color"
                      value={ayahShadowColor}
                      onChange={(e) => setAyahShadowColor(e.target.value)}
                      className="h-6 w-6 cursor-pointer border-0 bg-transparent"
                    />
                    <span className="text-xs font-mono font-bold uppercase text-[#1f2532]">{ayahShadowColor}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-4 border-t border-[#eceff4] pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-bold text-[#1f2532]">
                    <Layers size={18} className="text-[#1677ff]" />
                    <span>إظهار اسم السورة</span>
                  </div>
                  <button
                    onClick={() => setShowSurahName(!showSurahName)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${showSurahName ? "bg-[#1677ff]" : "bg-[#dde1ea]"
                      }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${showSurahName ? "-translate-x-4" : "translate-x-0"
                        }`}
                    />
                  </button>
                </div>

                {showSurahName && (
                  <>
                    <div className="mt-4">
                      <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm font-bold text-[#5b6373]">
                          <MoveVertical size={16} className="text-[#1f6feb]" />
                          <span>موقع السورة (عمودياً)</span>
                        </div>
                        <span className="text-sm font-semibold text-[#1f6feb] transition-all">
                          {surahYPosition}%
                        </span>
                      </div>
                      <div className="relative flex h-14 w-full items-center rounded-2xl border border-[#e3e7ef] bg-[#f8f9fc] px-4">
                        <input
                          type="range"
                          min="2"
                          max="95"
                          step="1"
                          value={surahYPosition}
                          onChange={(e) => setSurahYPosition(Number(e.target.value))}
                          className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-[#dde4f0] accent-[#1677ff]"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm font-bold text-[#5b6373]">
                          <MoveHorizontal size={16} className="text-[#1f6feb]" />
                          <span>موقع السورة (أفقياً)</span>
                        </div>
                        <span className="text-sm font-semibold text-[#1f6feb] transition-all">
                          {surahXPosition}%
                        </span>
                      </div>
                      <div className="relative flex h-14 w-full items-center rounded-2xl border border-[#e3e7ef] bg-[#f8f9fc] px-4">
                        <input
                          type="range"
                          min="5"
                          max="95"
                          step="1"
                          value={surahXPosition}
                          onChange={(e) => setSurahXPosition(Number(e.target.value))}
                          className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-[#dde4f0] accent-[#1677ff]"
                        />
                      </div>
                    </div>

                    <div>
                      <div className="mb-3 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm font-bold text-[#5b6373]">
                          <ALargeSmall size={16} className="text-[#1f6feb]" />
                          <span>حجم خط السورة</span>
                        </div>
                        <span className="text-sm font-semibold text-[#1f6feb] transition-all">
                          {surahFontSize}px
                        </span>
                      </div>
                      <div className="relative flex h-14 w-full items-center rounded-2xl border border-[#e3e7ef] bg-[#f8f9fc] px-4">
                        <input
                          type="range"
                          min="12"
                          max="60"
                          step="1"
                          value={surahFontSize}
                          onChange={(e) => setSurahFontSize(Number(e.target.value))}
                          className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-[#dde4f0] accent-[#1677ff]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pb-2">
                      <div>
                        <div className="mb-2 flex items-center gap-2 text-xs font-bold text-[#5b6373]">
                          <Palette size={14} className="text-[#1f6feb]" />
                          <span>لون السورة</span>
                        </div>
                        <div className="flex h-12 items-center gap-3 rounded-xl border border-[#e3e7ef] bg-[#f8f9fc] px-3">
                          <input
                            type="color"
                            value={surahColor}
                            onChange={(e) => setSurahColor(e.target.value)}
                            className="h-6 w-6 cursor-pointer border-0 bg-transparent"
                          />
                          <span className="text-xs font-mono font-bold uppercase text-[#1f2532]">{surahColor}</span>
                        </div>
                      </div>
                      <div>
                        <div className="mb-2 flex items-center gap-2 text-xs font-bold text-[#5b6373]">
                          <Layers size={14} className="text-[#1f6feb]" />
                          <span>ظل السورة</span>
                        </div>
                        <div className="flex h-12 items-center gap-3 rounded-xl border border-[#e3e7ef] bg-[#f8f9fc] px-3">
                          <input
                            type="color"
                            value={surahShadowColor}
                            onChange={(e) => setSurahShadowColor(e.target.value)}
                            className="h-6 w-6 cursor-pointer border-0 bg-transparent"
                          />
                          <span className="text-xs font-mono font-bold uppercase text-[#1f2532]">{surahShadowColor}</span>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="space-y-4 border-t border-[#eceff4] pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-bold text-[#1f2532]">
                    <AudioLines size={18} className="text-[#1677ff]" />
                    <span>موجة الصوت (Waveform)</span>
                  </div>
                  <button
                    onClick={() => setShowWave(!showWave)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${showWave ? "bg-[#1677ff]" : "bg-[#dde1ea]"
                      }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${showWave ? "-translate-x-4" : "translate-x-0"
                        }`}
                    />
                  </button>
                </div>

                {showWave && (
                  <>
                    <div className="mt-4 grid grid-cols-1 gap-4">
                      <div>
                        <div className="mb-2 flex items-center gap-2 text-xs font-bold text-[#5b6373]">
                          <Palette size={14} className="text-[#1f6feb]" />
                          <span>لون الموجة</span>
                        </div>
                        <div className="flex h-12 items-center gap-3 rounded-xl border border-[#e3e7ef] bg-[#f8f9fc] px-3">
                          <input
                            type="color"
                            value={waveColor}
                            onChange={(e) => setWaveColor(e.target.value)}
                            className="h-6 w-6 cursor-pointer border-0 bg-transparent"
                          />
                          <span className="text-xs font-mono font-bold uppercase text-[#1f2532]">{waveColor}</span>
                        </div>
                      </div>

                      <div>
                        <div className="mb-3 flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs font-bold text-[#5b6373]">
                            <MoveVertical size={14} className="text-[#1f6feb]" />
                            <span>ارتفاع الموجة (السعة)</span>
                          </div>
                          <span className="text-xs font-bold text-[#1f6feb]">{waveHeight}px</span>
                        </div>
                        <div className="relative flex h-14 w-full items-center rounded-2xl border border-[#e3e7ef] bg-[#f8f9fc] px-4">
                          <input
                            type="range"
                            min="20"
                            max="150"
                            value={waveHeight}
                            onChange={(e) => setWaveHeight(Number(e.target.value))}
                            className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-[#dde4f0] accent-[#1677ff]"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="mb-3 flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs font-bold text-[#5b6373]">
                            <MoveVertical size={14} className="text-[#1f6feb]" />
                            <span>موضع الموجة (عمودياً)</span>
                          </div>
                          <span className="text-xs font-bold text-[#1f6feb]">{waveY}%</span>
                        </div>
                        <div className="relative flex h-14 w-full items-center rounded-2xl border border-[#e3e7ef] bg-[#f8f9fc] px-4">
                          <input
                            type="range"
                            min="0"
                            max="95"
                            step="1"
                            value={waveY}
                            onChange={(e) => setWaveY(Number(e.target.value))}
                            className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-[#dde4f0] accent-[#1677ff]"
                          />
                        </div>
                      </div>

                      <div>
                        <div className="mb-3 flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs font-bold text-[#5b6373]">
                            <MoveHorizontal size={14} className="text-[#1f6feb]" />
                            <span>موضع الموجة (أفقياً)</span>
                          </div>
                          <span className="text-xs font-bold text-[#1f6feb]">{waveX}%</span>
                        </div>
                        <div className="relative flex h-14 w-full items-center rounded-2xl border border-[#e3e7ef] bg-[#f8f9fc] px-4">
                          <input
                            type="range"
                            min="0"
                            max="100"
                            step="1"
                            value={waveX}
                            onChange={(e) => setWaveX(Number(e.target.value))}
                            className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-[#dde4f0] accent-[#1677ff]"
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="space-y-4 border-t border-[#eceff4] pt-6 pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-bold text-[#1f2532]">
                    <ImagePlus size={18} className="text-[#1677ff]" />
                    <span>علامة مائية (Logo)</span>
                  </div>
                  <button
                    onClick={() => setShowWatermark(!showWatermark)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${showWatermark ? "bg-[#1677ff]" : "bg-[#dde1ea]"
                      }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${showWatermark ? "-translate-x-4" : "translate-x-0"
                        }`}
                    />
                  </button>
                </div>

                {showWatermark && (
                  <div className="mt-4 space-y-4 rounded-2xl bg-[#f8f9fc] p-4 border border-[#e3e7ef]">
                    <div className="flex rounded-xl bg-[#ebedf2] p-1">
                      <button
                        onClick={() => setWatermarkMode("image")}
                        className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all ${watermarkMode === "image"
                          ? "bg-white text-[#1677ff] shadow-sm"
                          : "text-[#6a7385] hover:text-[#1f2532]"
                          }`}
                      >
                        صورة
                      </button>
                      <button
                        onClick={() => setWatermarkMode("text")}
                        className={`flex-1 rounded-lg py-2 text-xs font-bold transition-all ${watermarkMode === "text"
                          ? "bg-white text-[#1677ff] shadow-sm"
                          : "text-[#6a7385] hover:text-[#1f2532]"
                          }`}
                      >
                        نص
                      </button>
                    </div>

                    {watermarkMode === "image" ? (
                      <div>
                        {!watermarkImage ? (
                          <label className="flex h-20 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#dce6f8] bg-white hover:bg-[#f0f7ff] transition-all">
                            <ImagePlus size={20} className="text-[#1f6feb]" />
                            <span className="mt-1 text-[10px] font-bold text-[#1f6feb]">رفع الشعار (PNG)</span>
                            <input
                              type="file"
                              hidden
                              accept="image/png,image/jpeg"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const reader = new FileReader();
                                  reader.onload = (event) => setWatermarkImage(event.target?.result as string);
                                  reader.readAsDataURL(file);
                                }
                              }}
                            />
                          </label>
                        ) : (
                          <div className="relative group aspect-video rounded-xl overflow-hidden border border-[#dce6f8] bg-white flex items-center justify-center p-4">
                            <img src={watermarkImage} alt="Watermark Preview" className="max-h-full object-contain" />
                            <button
                              onClick={() => setWatermarkImage(null)}
                              className="absolute inset-0 bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs font-bold"
                            >
                              تغيير الصورة
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <input
                          type="text"
                          value={watermarkText}
                          onChange={(e) => setWatermarkText(e.target.value)}
                          placeholder="اكتب النص هنا..."
                          className="h-11 w-full rounded-xl border border-[#e3e7ef] bg-white px-4 text-sm font-bold text-[#1f2532] outline-none transition focus:border-[#1677ff]"
                        />
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-[#5b6373]">لون النص</span>
                          <div className="flex items-center gap-2">
                            <input
                              type="color"
                              value={watermarkTextColor}
                              onChange={(e) => setWatermarkTextColor(e.target.value)}
                              className="h-8 w-8 cursor-pointer border-0 bg-transparent"
                            />
                            <span className="text-[10px] font-mono font-bold uppercase text-[#1f2532]">{watermarkTextColor}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div>
                        <div className="mb-2 flex items-center justify-between text-[11px] font-bold text-[#5b6373]">
                          <span>الحجم</span>
                          <span className="text-[#1677ff]">{watermarkSize}px</span>
                        </div>
                        <input
                          type="range"
                          min="10"
                          max="200"
                          value={watermarkSize}
                          onChange={(e) => setWatermarkSize(Number(e.target.value))}
                          className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-[#dde4f0] accent-[#1677ff]"
                        />
                      </div>
                      <div>
                        <div className="mb-2 flex items-center justify-between text-[11px] font-bold text-[#5b6373]">
                          <span>الشفافية</span>
                          <span className="text-[#1677ff]">{Math.round(watermarkOpacity * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.01"
                          value={watermarkOpacity}
                          onChange={(e) => setWatermarkOpacity(Number(e.target.value))}
                          className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-[#dde4f0] accent-[#1677ff]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 pb-1">
                      <div>
                        <div className="mb-2 flex items-center justify-between text-[11px] font-bold text-[#5b6373]">
                          <span>موقع X</span>
                          <span className="text-[#1677ff]">{watermarkX}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="50"
                          value={watermarkX}
                          onChange={(e) => setWatermarkX(Number(e.target.value))}
                          className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-[#dde4f0] accent-[#1677ff]"
                        />
                      </div>
                      <div>
                        <div className="mb-2 flex items-center justify-between text-[11px] font-bold text-[#5b6373]">
                          <span>موقع Y</span>
                          <span className="text-[#1677ff]">{watermarkY}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="50"
                          value={watermarkY}
                          onChange={(e) => setWatermarkY(Number(e.target.value))}
                          className="h-1.5 w-full cursor-pointer appearance-none rounded-lg bg-[#dde4f0] accent-[#1677ff]"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              

            </div>
          </div>

          <footer className="border-t border-[#eceff4] p-5">
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
  );
}
