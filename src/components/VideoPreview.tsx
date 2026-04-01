import Image from "next/image";
import { Play, Pause, SkipForward, SkipBack } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { EditorState, Ayah, Surah } from "@/types";

export interface VideoPreviewProps {
  state: EditorState;
  selectedAyahs: Ayah[];
  selectedSurah: Surah;
  maxAyah: number;
  currentAyahIndex: number;
  setCurrentAyahIndex: React.Dispatch<React.SetStateAction<number>>;
  isPlaying: boolean;
  togglePlayback: () => void;
  audioRef: React.MutableRefObject<HTMLAudioElement | null>;
  handleAudioEnded: () => void;
}

export function VideoPreview({
  state,
  selectedAyahs,
  selectedSurah,
  maxAyah,
  currentAyahIndex,
  setCurrentAyahIndex,
  isPlaying,
  togglePlayback,
  audioRef,
  handleAudioEnded,
}: VideoPreviewProps) {
  const previewRef = useRef<HTMLDivElement | null>(null);
  const [previewWidth, setPreviewWidth] = useState<number>(400);
  const previewScale = previewWidth / 400;
  const bgVideoRef = useRef<HTMLVideoElement | null>(null);

  const {
    bgType,
    bgImage,
    bgVideo,
    bgVideoMuted,
    bgVideoRange,
    bgBlur,
    bgDim,
    aspectRatio,
    showWave,
    waveColor,
    waveHeight,
    waveX,
    waveY,
    showWatermark,
    watermarkMode,
    watermarkImage,
    watermarkText,
    watermarkTextColor,
    watermarkSize,
    watermarkOpacity,
    watermarkX,
    watermarkY,
    ayahFontSize,
    ayahColor,
    ayahShadowColor,
    yPosition,
    xPosition,
    showSurahName,
    surahFontSize,
    surahColor,
    surahShadowColor,
    surahYPosition,
    surahXPosition,
    showSafeArea,
    showAyahGlassEffect,
    ayahGlassBlur,
    ayahGlassOpacity,
    ayahGlassPadding,
    ayahGlassBorderRadius,
    ayahGlassGlow,
    enableWordSync,
    wordSyncStyle,
    wordSyncActiveColor,
  } = state;

  const [currentAudioTime, setCurrentAudioTime] = useState<number>(0);

  useEffect(() => {
    const el = previewRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width;
      if (w && w > 0) setPreviewWidth(w);
    });
    ro.observe(el);
    if (el.clientWidth > 0) setPreviewWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const video = bgVideoRef.current;
    if (!video || bgType !== "video") return;

    if (isPlaying) {
      video.play();
    } else {
      video.pause();
    }
  }, [isPlaying, bgType]);

  useEffect(() => {
    const video = bgVideoRef.current;
    if (!video || bgType !== "video") return;

    video.currentTime = bgVideoRange[0];
    
    const handleTimeUpdate = () => {
      if (video.currentTime >= bgVideoRange[1]) {
        video.currentTime = bgVideoRange[0];
      }
    };

    video.addEventListener("timeupdate", handleTimeUpdate);
    return () => video.removeEventListener("timeupdate", handleTimeUpdate);
  }, [bgVideo, bgVideoRange, bgType]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    
    const handleUpdate = () => {
      setCurrentAudioTime(audio.currentTime);
    };
    
    audio.addEventListener("timeupdate", handleUpdate);
    return () => audio.removeEventListener("timeupdate", handleUpdate);
  }, [audioRef.current, currentAyahIndex]);

    const {
    showTranslation,
    translationFontSize,
    translationColor
  } = state;

  return (
    <div
      ref={previewRef}
      className="relative h-full max-h-[min(85vh,720px)] w-auto max-w-full overflow-hidden rounded-[36px] border-[6px] border-[#1e3630] shadow-[0_34px_90px_rgba(4,22,18,0.4)] transition-all duration-500 ease-in-out"
      style={{ aspectRatio }}
    >
      {bgType === "image" ? (
        <Image
          src={bgImage}
          alt="Quran video preview"
          fill
          priority
          loading="eager"
          className={`object-cover transition-transform duration-[10000ms] ease-linear ${
            isPlaying ? "scale-110" : "scale-100"
          }`}
          style={{ filter: `blur(${bgBlur}px)` }}
        />
      ) : (
        bgVideo && (
          <video
            ref={bgVideoRef}
            src={bgVideo}
            muted={bgVideoMuted}
            loop
            playsInline
            className="absolute inset-0 h-full w-full object-cover"
            style={{ filter: `blur(${bgBlur}px)` }}
          />
        )
      )}
      <style jsx global>{`
        @keyframes word-pop {
          0% { transform: scale(1); }
          50% { transform: scale(1.08); }
          100% { transform: scale(1.05); }
        }
        @keyframes word-highlight {
          from { filter: brightness(1); }
          to { filter: brightness(1.3) drop-shadow(0 0 8px ${wordSyncActiveColor}40); }
        }
        .active-word-karaoke {
          display: inline-block;
          animation: word-pop 0.4s cubic-bezier(0.23, 1, 0.32, 1) forwards !important;
        }
        .active-word-fade {
          display: inline-block;
          transition: all 0.6s cubic-bezier(0.23, 1, 0.32, 1);
        }
      `}</style>
      <div
        className={`absolute inset-0 transition-all duration-500`}
        style={{ backgroundColor: `rgba(0, 0, 0, ${bgDim})` }}
      />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/15 via-transparent to-black/70" />

      <div className="absolute inset-0 z-30 group/player">
        <div className="absolute inset-0 cursor-pointer pointer-events-auto" onClick={togglePlayback} />

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className={`transition-all duration-300 ${isPlaying ? "opacity-0 scale-150" : "opacity-100 scale-100"}`}>
            {!isPlaying && (
              <div className="flex h-24 w-24 items-center justify-center rounded-full border border-white/30 bg-black/45 text-white shadow-2xl backdrop-blur-xl">
                <Play fill="white" size={46} className="translate-x-1" />
              </div>
            )}
          </div>
        </div>

        <div className="pointer-events-none absolute bottom-0 left-0 right-0 translate-y-4 bg-gradient-to-t from-black/85 via-black/45 to-transparent p-6 opacity-0 transition-all duration-500 group-hover/player:translate-y-0 group-hover/player:opacity-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4 pointer-events-auto">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  currentAyahIndex > 0 && setCurrentAyahIndex((prev) => prev - 1);
                }}
                disabled={currentAyahIndex === 0}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-all hover:bg-white/20 disabled:opacity-30"
              >
                <SkipForward size={20} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  togglePlayback();
                }}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-[#0d8f5b] shadow-lg transition-all hover:scale-110"
              >
                {isPlaying ? <Pause fill="currentColor" size={24} /> : <Play fill="currentColor" size={24} className="translate-x-0.5" />}
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  currentAyahIndex < selectedAyahs.length - 1 && setCurrentAyahIndex((prev) => prev + 1);
                }}
                disabled={currentAyahIndex === selectedAyahs.length - 1}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-all hover:bg-white/20 disabled:opacity-30"
              >
                <SkipBack size={20} />
              </button>
            </div>
            <div className="text-right pointer-events-none">
              <div className="mb-1 text-[10px] font-bold uppercase tracking-widest text-[#56e0ab]">الآن يعرض</div>
              <div className="text-xs font-bold text-white">
                آية {selectedAyahs[currentAyahIndex]?.numberInSurah} من {maxAyah}
              </div>
            </div>
          </div>
          <div className="relative h-1.5 w-full rounded-full bg-white/20 overflow-hidden group/bar pointer-events-auto cursor-pointer">
            <div
              className="absolute right-0 top-0 h-full bg-[#1cd792] shadow-[0_0_15px_rgba(28,215,146,0.8)] transition-all duration-300"
              style={{ width: `${((currentAyahIndex + 1) / (selectedAyahs.length || 1)) * 100}%` }}
            />
          </div>
        </div>
      </div>

      <div
        className="absolute z-10 flex w-[85%] -translate-x-1/2 flex-col items-center justify-center text-center text-white transition-all duration-300 ease-out gap-4"
        style={{ bottom: `${yPosition}%`, left: `${xPosition}%` }}
      >
        <div 
          className={`max-h-[80%] w-full text-center transition-all duration-500 ${
            showAyahGlassEffect 
              ? "border border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)]" 
              : ""
          }`}
          style={showAyahGlassEffect ? {
            backdropFilter: `blur(${ayahGlassBlur}px)`,
            backgroundColor: `rgba(255, 255, 255, ${ayahGlassOpacity})`,
            padding: `${ayahGlassPadding * previewScale}px`,
            borderRadius: `${ayahGlassBorderRadius * previewScale}px`,
            boxShadow: ayahGlassGlow ? `0 0 20px rgba(255,255,255,${ayahGlassOpacity * 0.5})` : undefined,
          } : {
            padding: "0 24px"
          }}
        >
          {selectedAyahs.map(
            (ayah, index) => {
              if (index !== currentAyahIndex) return null;

              return (
                <div key={ayah.number} className="flex flex-col gap-4">
                  <div dir="rtl">
                    {!enableWordSync ? (
                      <p
                        className="text-balance font-medium transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]"
                        style={{
                          fontSize: `${ayahFontSize * previewScale}px`,
                          color: ayahColor,
                          lineHeight: 1.6,
                          textShadow: showAyahGlassEffect ? "none" : `0 4px 12px ${ayahShadowColor}80`,
                          animation: "fade-slide-up 0.8s forwards",
                        }}
                      >
                        {ayah.text}
                      </p>
                    ) : (
                      // Word Syncing Logic for Arabic Text
                      <div 
                        className="flex flex-wrap justify-center gap-x-[0.35em] text-balance font-medium"
                        style={{
                          fontSize: `${ayahFontSize * previewScale}px`,
                          lineHeight: 1.6,
                          direction: "rtl"
                        }}
                      >
                        {(ayah.text.split(/\s+/).filter(w => w.length > 0)).map((word, wIdx) => {
                          const words = ayah.text.split(/\s+/).filter(w => w.length > 0);
                          const totalDuration = audioRef.current?.duration || 4;
                          const wordLengths = words.map(w => w.length);
                          const totalLength = wordLengths.reduce((a, b) => a + b, 0);
                          let cumulativeTime = 0;
                          for(let i=0; i<wIdx; i++) cumulativeTime += (wordLengths[i] / totalLength) * totalDuration;
                          
                          const wordDuration = (wordLengths[wIdx] / totalLength) * totalDuration;
                          const startTime = cumulativeTime;
                          const endTime = cumulativeTime + wordDuration;

                          const isActive = currentAudioTime >= startTime && currentAudioTime < endTime;
                          const isFuture = currentAudioTime < startTime;
                          const isPast = currentAudioTime >= endTime;

                          const style: React.CSSProperties = {
                            color: ayahColor,
                            textShadow: showAyahGlassEffect ? "none" : `0 4px 12px ${ayahShadowColor}80`,
                            transition: "all 0.6s cubic-bezier(0.23, 1, 0.32, 1)",
                          };

                          let className = "inline-block";
                          if (wordSyncStyle === "karaoke") {
                            if (isActive) {
                              style.color = wordSyncActiveColor;
                              style.fontWeight = "bold";
                              style.textShadow = `0 0 20px ${wordSyncActiveColor}60`;
                              className += " active-word-karaoke";
                            } else if (isPast) style.opacity = 0.7;
                            else style.opacity = 0.4;
                          } else if (wordSyncStyle === "fade") {
                            if (isFuture) {
                              style.opacity = 0;
                              style.transform = "translateY(8px) scale(0.9)";
                            } else {
                              style.opacity = 1;
                              style.transform = "translateY(0) scale(1)";
                              if (isActive) {
                                style.color = wordSyncActiveColor;
                                style.fontWeight = "bold";
                              }
                            }
                          }

                          return (
                            <span key={wIdx} className={className} style={style}>
                              {word}
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {showTranslation && ayah.translation && (
                    <p
                      dir="ltr"
                      className="text-balance font-medium transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]"
                      style={{
                        fontSize: `${translationFontSize * previewScale}px`,
                        color: translationColor,
                        lineHeight: 1.4,
                        opacity: 0.9,
                        textShadow: showAyahGlassEffect ? "none" : `0 2px 8px ${ayahShadowColor}60`,
                        animation: "fade-slide-up 1s forwards",
                      }}
                    >
                      {ayah.translation}
                    </p>
                  )}
                </div>
              );
            }
          )}
        </div>
        <audio ref={audioRef} onEnded={handleAudioEnded} className="hidden" />
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
              fontSize: `${surahFontSize * previewScale}px`,
              color: surahColor,
              textShadow: `0 2px 4px ${surahShadowColor}`,
            }}
          >
            سورة {selectedSurah.name.ar}
          </h2>
          <p
            className="mt-1 text-xs font-medium opacity-80"
            style={{
              color: surahColor,
              textShadow: `0 1px 2px ${surahShadowColor}`,
            }}
          >
            {selectedSurah.name.transliteration}
          </p>
        </div>
      )}

      {showWave && (
        <div
          className="absolute z-10 flex -translate-x-1/2 items-end justify-center transition-all duration-300 ease-out"
          style={{
            bottom: `${waveY}%`,
            left: `${waveX}%`,
            height: `${waveHeight * previewScale}px`,
            gap: `${4 * previewScale}px`,
          }}
        >
          {[0.4, 0.7, 0.9, 0.5, 0.8, 0.6, 0.9, 0.7, 0.4, 0.8, 0.5, 0.7].map((h, i) => (
            <div
              key={i}
              className="rounded-full opacity-80"
              style={{
                width: `${3 * previewScale}px`,
                height: `${h * 100}%`,
                backgroundColor: waveColor,
                boxShadow: `0 0 10px ${waveColor}60`,
                animation: `wave-bounce 0.8s ease-in-out infinite alternate`,
                animationDelay: `${i * 0.05}s`,
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
              style={{ width: `${watermarkSize * previewScale}px`, height: "auto" }}
            />
          ) : watermarkMode === "text" ? (
            <span
              style={{
                fontSize: `${watermarkSize * previewScale}px`,
                color: watermarkTextColor,
                fontWeight: "bold",
                textShadow: "0 1px 2px rgba(0,0,0,0.5)",
              }}
            >
              {watermarkText}
            </span>
          ) : null}
        </div>
      )}
      {showSafeArea && (
        <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
          {/* Top Safe Area (15%) */}
          <div className="absolute top-0 left-0 right-0 h-[15%] border-b border-dashed border-red-500/50 bg-red-500/5 flex items-end justify-center">
             <span className="text-[10px] text-red-500 font-bold bg-black/50 px-1 rounded">SAFE AREA TOP</span>
          </div>
          {/* Bottom Safe Area (25%) */}
          <div className="absolute bottom-0 left-0 right-0 h-[25%] border-t border-dashed border-red-500/50 bg-red-500/5 flex items-start justify-center">
             <span className="text-[10px] text-red-500 font-bold bg-black/50 px-1 rounded">SAFE AREA BOTTOM</span>
          </div>
          {/* Center Lines */}
          <div className="absolute left-1/2 top-0 bottom-0 w-[1px] bg-white/20 -translate-x-1/2" />
          <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-white/20 -translate-y-1/2" />
        </div>
      )}
    </div>
  );
}
