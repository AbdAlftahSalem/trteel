import React, { useState } from "react";
import Image from "next/image";
import {
  Palette,
  Moon,
  Layers,
  ALargeSmall,
  ChevronDown,
  ImagePlus,
  AudioLines,
  MoveVertical,
  Clapperboard,
  UploadCloud,
  Scissors,
  Zap,
  Sparkles,
  Volume2,
  VolumeX,
} from "lucide-react";
import { SettingAccordion } from "./SettingAccordion";
import { EditorState } from "@/types";
import { ASPECT_RATIOS, BACKGROUNDS, surahs, reciters, EXPORT_PRESETS, EXPORT_QUALITIES } from "@/constants";
import { parseAyah } from "@/utils/mathHelpers";

export interface SettingsSidebarProps {
  state: EditorState;
  updateState: (updates: Partial<EditorState>) => void;
  maxAyah: number;
  isExporting: boolean;
  exportProgress: number;
  handleExport: () => void;
}

export function SettingsSidebar({
  state,
  updateState,
  maxAyah,
  isExporting,
  exportProgress,
  handleExport,
}: SettingsSidebarProps) {
  const [activeAccordion, setActiveAccordion] = useState<string>("selection");
  const [settingsMode, setSettingsMode] = useState<"simple" | "advanced">("simple");

  // Switching to simple mode closes any section that simple mode hides.
  const switchToSimpleMode = () => {
    setSettingsMode("simple");
    setActiveAccordion((current) => {
      const hiddenInSimple = ["translation", "kinetic", "wave", "audio_effects", "watermark"];
      return hiddenInSimple.includes(current) ? "selection" : current;
    });
  };

  const {
    isDarkMode,
    aspectRatio,
    selectedReciterId,
    selectedSurahNumber,
    fromAyah,
    toAyah,
    bgType,
    bgImage,
    bgVideo,
    bgVideoMuted,
    bgVideoRange,
    bgDim,
    bgBlur,
    ayahFontSize,
    ayahColor,
    yPosition,
    xPosition,
    showSurahName,
    surahFontSize,
    surahYPosition,
    showWave,
    waveColor,
    waveHeight,
    waveY,
    waveX,
    showWatermark,
    watermarkMode,
    watermarkImage,
    watermarkText,
    watermarkTextColor,
    watermarkSize,
    watermarkOpacity,
    watermarkX,
    watermarkY,
    exportQuality,
    exportPreset,
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
    audioEffect,
    showTranslation,
    selectedLanguage,
    translationFontSize,
    translationColor,
  } = state;

  const handleSurahChange = (nextSurahNumber: number) => {
    const nextSurah = surahs.find((surah) => surah.number === nextSurahNumber) ?? surahs[0];
    updateState({
      selectedSurahNumber: nextSurah.number,
      fromAyah: 1,
      toAyah: Math.min(5, nextSurah.verses_count),
    });
  };

  const handleFromAyahChange = (value: string) => {
    const nextFrom = parseAyah(value, fromAyah, 1, maxAyah);
    updateState({
      fromAyah: nextFrom,
      toAyah: toAyah < nextFrom ? nextFrom : toAyah,
    });
  };

  const handleToAyahChange = (value: string) => {
    const nextTo = parseAyah(value, toAyah, fromAyah, maxAyah);
    updateState({ toAyah: nextTo });
  };

  const handlePresetChange = (presetId: string) => {
    const preset = EXPORT_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      updateState({
        exportPreset: presetId as EditorState["exportPreset"],
        aspectRatio: preset.ratio,
      });
    }
  };

  return (
    <aside
      className={`custom-scrollbar flex min-h-0 w-full flex-1 flex-col overflow-y-auto transition-colors duration-500 md:h-full md:max-w-[460px] md:overflow-hidden md:border-l ${
        isDarkMode ? "bg-[#0d171a] border-[#1f373d]" : "bg-[#f9fdf9] border-[#d5e1d8]"
      }`}
      dir="rtl"
    >
      <header
        className={`sticky top-0 z-20 flex items-center justify-between border-b px-5 py-4 backdrop-blur-md transition-colors ${
          isDarkMode ? "border-[#1f373d] bg-[#0d171a]/90" : "border-[#dfe9e1] bg-[#f9fdf9]/90"
        }`}
      >
        <div className="text-right">
          <p className={`text-2xl font-black tracking-tight ${isDarkMode ? "text-[#47c6dd]" : "text-[#0d8f5b]"}`}>
            ترتيل
          </p>
          <p className={`text-[10px] font-bold tracking-[0.12em] ${isDarkMode ? "text-[#8ea1a6]" : "text-[#667a71]"}`}>
            QURAN VIDEO STUDIO
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => updateState({ isDarkMode: !isDarkMode })}
            className={`flex h-11 w-11 items-center justify-center rounded-xl border transition-all ${
              isDarkMode
                ? "border-[#355d66] bg-[#17353c] text-[#ffd35f]"
                : "border-[#e2ded2] bg-[#fbf6ea] text-[#5f5a47]"
            }`}
            aria-label="الوضع الليلي"
          >
            {isDarkMode ? <Palette size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </header>

      <div className="px-5 py-6 md:custom-scrollbar md:flex-1 md:overflow-y-auto">
        <h1 className={`text-2xl font-black transition-colors ${isDarkMode ? "text-white" : "text-[#19342b]"}`}>
          إعدادات العرض
        </h1>
        <p className={`mt-1 text-sm font-medium transition-colors ${isDarkMode ? "text-[#9aadb2]" : "text-[#61796f]"}`}>
          اضبط كل شيء بسرعة: السورة، التصميم، الحركة، والتصدير.
        </p>

        <div className={`mt-4 rounded-xl border p-1 ${isDarkMode ? "border-[#284249] bg-[#122429]" : "border-[#cfe0d3] bg-[#eef7f0]"}`}>
          <div className="grid grid-cols-2 gap-1">
            <button
              type="button"
              onClick={switchToSimpleMode}
              className={`h-9 rounded-lg text-xs font-extrabold transition-all ${
                settingsMode === "simple"
                  ? isDarkMode
                    ? "bg-[#2eaec2] text-[#072126]"
                    : "bg-[#0d8f5b] text-white"
                  : isDarkMode
                  ? "text-[#9db0b5]"
                  : "text-[#567267]"
              }`}
            >
              إعدادات بسيطة
            </button>
            <button
              type="button"
              onClick={() => setSettingsMode("advanced")}
              className={`h-9 rounded-lg text-xs font-extrabold transition-all ${
                settingsMode === "advanced"
                  ? isDarkMode
                    ? "bg-[#2eaec2] text-[#072126]"
                    : "bg-[#0d8f5b] text-white"
                  : isDarkMode
                  ? "text-[#9db0b5]"
                  : "text-[#567267]"
              }`}
            >
              كل الإعدادات
            </button>
          </div>
        </div>

        <div className="mt-4 space-y-3 pb-20" data-settings-mode={settingsMode}>
          <style jsx>{`
            [data-settings-mode="simple"] :global([data-section="translation"]),
            [data-settings-mode="simple"] :global([data-section="kinetic"]),
            [data-settings-mode="simple"] :global([data-section="wave"]),
            [data-settings-mode="simple"] :global([data-section="audio_effects"]),
            [data-settings-mode="simple"] :global([data-section="watermark"]) {
              display: none;
            }
          `}</style>
          <SettingAccordion
            id="dimensions"
            title="أبعاد المقطع"
            icon={<Layers size={16} />}
            isActive={activeAccordion === "dimensions"}
            onToggle={setActiveAccordion}
            isDarkMode={isDarkMode}
          >
            <div className="grid grid-cols-2 gap-2">
              {ASPECT_RATIOS.map((ratio) => (
                <button
                  key={ratio.id}
                  type="button"
                  onClick={() => updateState({ aspectRatio: ratio.id })}
                  className={`flex flex-col items-center justify-center rounded-xl border p-3 text-center transition-all ${
                    aspectRatio === ratio.id
                      ? isDarkMode
                        ? "border-[#1677ff] bg-[#2f3d53] text-white shadow-[0_0_15px_rgba(22,119,255,0.2)]"
                        : "border-[#1677ff] bg-[#f0f7ff] text-[#1677ff] shadow-[0_0_0_2px_rgba(22,119,255,0.1)]"
                      : isDarkMode
                      ? "border-[#2f3545] bg-[#252c3c] text-[#8a93a5] hover:bg-[#2c3346]"
                      : "border-[#e3e7ef] bg-white text-[#5b6373] hover:bg-[#f1f3f9]"
                  }`}
                >
                  <span className="text-xs font-bold">{ratio.label}</span>
                  <span className="mt-1 text-[9px] opacity-70 leading-tight">{ratio.desc}</span>
                </button>
              ))}
            </div>
          </SettingAccordion>

          <SettingAccordion
            id="selection"
            title="اختيار النص والآيات"
            icon={<ALargeSmall size={16} />}
            isActive={activeAccordion === "selection"}
            onToggle={setActiveAccordion}
            isDarkMode={isDarkMode}
          >
            <div className="space-y-4">
              <div>
                <label className={`mb-2 block text-[11px] font-bold ${isDarkMode ? "text-[#6e7786]" : "text-[#81899a]"}`}>
                  القارئ
                </label>
                <div className="relative">
                  <select
                    value={selectedReciterId}
                    onChange={(e) => updateState({ selectedReciterId: e.target.value })}
                    className={`h-12 w-full appearance-none rounded-xl border px-4 text-sm font-bold outline-none transition focus:border-[#2f7dff] ${
                      isDarkMode ? "bg-[#252c3c] border-[#2f3545] text-white" : "bg-white border-[#e3e7ef] text-[#1f2532]"
                    }`}
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
                <label className={`mb-2 block text-[11px] font-bold ${isDarkMode ? "text-[#6e7786]" : "text-[#81899a]"}`}>
                  السورة
                </label>
                <div className="relative">
                  <select
                    value={selectedSurahNumber}
                    onChange={(event) => handleSurahChange(Number(event.target.value))}
                    className={`h-12 w-full appearance-none rounded-xl border px-4 text-sm font-bold outline-none transition focus:border-[#2f7dff] ${
                      isDarkMode ? "bg-[#252c3c] border-[#2f3545] text-white" : "bg-white border-[#e3e7ef] text-[#1f2532]"
                    }`}
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
                    className={`mt-1 block w-full border-0 bg-transparent text-lg font-extrabold outline-none ${
                        isDarkMode ? "text-white" : "text-[#1f2532]"
                    }`}
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
                    className={`mt-1 block w-full border-0 bg-transparent text-lg font-extrabold outline-none ${
                        isDarkMode ? "text-white" : "text-[#1f2532]"
                    }`}
                  />
                </label>
              </div>
            </div>
          </SettingAccordion>

          <SettingAccordion
            id="translation"
            title="الترجمة (Translation)"
            icon={<ALargeSmall size={16} />}
            isActive={activeAccordion === "translation"}
            onToggle={setActiveAccordion}
            isDarkMode={isDarkMode}
          >
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => updateState({ showTranslation: !showTranslation })}
                className="flex w-full items-center justify-between py-1 text-right"
              >
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold ${isDarkMode ? "text-white" : "text-[#1f2532]"}`}>إظهار الترجمة</span>
                  <span className="rounded bg-indigo-500/10 px-1.5 py-0.5 text-[8px] font-bold text-indigo-500">TRANS</span>
                </div>
                <div className={`relative h-5 w-9 rounded-full transition-colors ${showTranslation ? "bg-[#1677ff]" : isDarkMode ? "bg-[#2f3545]" : "bg-[#dde1ea]"}`}>
                  <span className={`absolute top-1 h-3 w-3 rounded-full bg-white transition-all ${showTranslation ? "left-1" : "left-5"}`} />
                </div>
              </button>

              {showTranslation && (
                <div className="mt-4 space-y-4 pr-2 border-r-2 border-indigo-500/20">
                  <div>
                    <label className={`mb-2 block text-[11px] font-bold ${isDarkMode ? "text-[#6e7786]" : "text-[#81899a]"}`}>
                      لغة الترجمة
                    </label>
                    <div className="relative">
                      <select
                        value={selectedLanguage}
                        onChange={(e) => updateState({ selectedLanguage: e.target.value as EditorState["selectedLanguage"] })}
                        className={`h-11 w-full appearance-none rounded-xl border px-3 text-xs font-bold outline-none transition focus:border-[#2f7dff] ${
                          isDarkMode ? "bg-[#252c3c] border-[#2f3545] text-white" : "bg-white border-[#e3e7ef] text-[#1f2532]"
                        }`}
                      >
                        <option value="en">English (الإنجليزية)</option>
                        <option value="es">Spanish (الإسبانية)</option>
                        <option value="fr">French (الفرنسية)</option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#6e7786]" size={14} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="mb-2 text-[10px] font-bold text-[#81899a]">حجم خط الترجمة</div>
                      <div className={`flex items-center gap-3 h-10 px-3 border rounded-xl ${
                          isDarkMode ? "bg-[#252c3c] border-[#2f3545]" : "bg-white border-[#e3e7ef]"
                      }`}>
                        <input
                          type="range"
                          min="8"
                          max="40"
                          value={translationFontSize}
                          onChange={(e) => updateState({ translationFontSize: Number(e.target.value) })}
                          className="h-1 flex-1 accent-[#1677ff]"
                        />
                        <span className={`text-xs font-bold w-4 text-center ${isDarkMode ? "text-white" : "text-[#1f2532]"}`}>{translationFontSize}</span>
                      </div>
                    </div>
                    <div>
                      <div className="mb-2 text-[10px] font-bold text-[#81899a]">لون الترجمة</div>
                      <div className={`flex items-center gap-2 h-10 px-2 border rounded-xl overflow-hidden ${
                          isDarkMode ? "bg-[#252c3c] border-[#2f3545]" : "bg-white border-[#e3e7ef]"
                      }`}>
                        <input
                          type="color"
                          value={translationColor}
                          onChange={(e) => updateState({ translationColor: e.target.value })}
                          className="h-6 w-6 cursor-pointer border-0 bg-transparent"
                        />
                        <span className={`text-[9px] font-mono font-bold uppercase truncate ${
                            isDarkMode ? "text-[#8a93a5]" : "text-[#5b6373]"
                        }`}>{translationColor}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </SettingAccordion>

          <SettingAccordion
            id="background"
            title="الخلفية والمؤثرات"
            icon={<ImagePlus size={16} />}
            isActive={activeAccordion === "background"}
            onToggle={setActiveAccordion}
            isDarkMode={isDarkMode}
          >
            <div className={`flex rounded-lg p-1 mb-4 ${isDarkMode ? "bg-[#252c3c]" : "bg-[#ebedf2]"}`}>
              <button
                onClick={() => updateState({ bgType: "image" })}
                className={`flex-1 rounded-md py-1.5 text-[10px] font-bold transition-all ${
                  bgType === "image"
                    ? isDarkMode ? "bg-[#2f3545] text-white" : "bg-white text-[#1677ff]"
                    : "text-[#5b6373] hover:opacity-80"
                }`}
              >
                صورة
              </button>
              <button
                onClick={() => updateState({ bgType: "video" })}
                className={`flex-1 rounded-md py-1.5 text-[10px] font-bold transition-all ${
                  bgType === "video"
                    ? isDarkMode ? "bg-[#2f3545] text-white" : "bg-white text-[#1677ff]"
                    : "text-[#5b6373] hover:opacity-80"
                }`}
              >
                فيديو
              </button>
            </div>

            {bgType === "image" ? (
              <div className="grid grid-cols-3 gap-3">
                {BACKGROUNDS.map((bg, idx) => (
                  <button
                    key={idx}
                    onClick={() => updateState({ bgImage: bg })}
                    className={`group relative aspect-square flex-shrink-0 cursor-pointer overflow-hidden rounded-xl border-2 transition-all duration-500 hover:scale-110 hover:shadow-[0_0_20px_rgba(22,119,255,0.4)] hover:z-10 hover:brightness-110 ${
                      bgImage === bg
                        ? "border-[#1677ff] shadow-[0_0_25px_rgba(22,119,255,0.5)] scale-[1.05] ring-2 ring-[#1677ff]/40"
                        : "border-transparent"
                    }`}
                  >
                    <Image
                      src={bg}
                      alt={`BG ${idx + 1}`}
                      fill
                      className="object-cover transition-transform duration-700 group-hover:scale-125"
                    />
                    <div className={`absolute inset-0 transition-opacity duration-300 ${bgImage === bg ? "bg-black/0" : "bg-black/30 group-hover:bg-black/0"}`} />
                  </button>
                ))}
                <label className={`flex aspect-square cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-all ${
                    isDarkMode ? "border-[#2f3545] bg-[#252c3c] hover:bg-[#2c3346]" : "border-[#dce6f8] bg-white hover:bg-[#eef4ff]"
                }`}>
                  <ImagePlus size={14} className="text-[#1f6feb]" />
                  <input
                    type="file"
                    hidden
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => updateState({ bgImage: event.target?.result as string });
                        reader.readAsDataURL(file);
                      }
                    }}
                  />
                </label>
              </div>
            ) : (
              <div className="space-y-4">
                <label className={`flex h-24 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed transition-all ${
                    isDarkMode ? "border-[#2f3545] bg-[#252c3c] hover:bg-[#2c3346]" : "border-[#dce6f8] bg-white hover:bg-[#eef4ff]"
                }`}>
                  <UploadCloud size={24} className="text-[#1677ff]" />
                  <span className="text-[10px] font-bold text-[#8a93a5]">
                    {bgVideo ? "تم اختيار فيديو" : "رفع فيديو خلفية (Upload Video)"}
                  </span>
                  <input
                    type="file"
                    hidden
                    accept="video/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const url = URL.createObjectURL(file);
                        const video = document.createElement("video");
                        video.src = url;
                        video.onloadedmetadata = () => {
                          updateState({ bgVideo: url, bgVideoRange: [0, Math.min(15, video.duration)] });
                        };
                      }
                    }}
                  />
                </label>
                {bgVideo && (
                  <div className="rounded-xl border border-[#ebedf2] dark:border-[#2f3545] p-3">
                    <button
                      type="button"
                      onClick={() => updateState({ bgVideoMuted: !bgVideoMuted })}
                      className={`mb-3 flex w-full items-center justify-between rounded-xl border px-3 py-2.5 text-right transition-all ${
                        isDarkMode
                          ? "border-[#335f69] bg-[#1d2f3a] hover:bg-[#243948]"
                          : "border-[#cfe0d3] bg-[#f3faf5] hover:bg-[#edf7f0]"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                            bgVideoMuted
                              ? isDarkMode
                                ? "bg-[#1677ff]/20 text-[#7fb6ff]"
                                : "bg-[#1677ff]/10 text-[#1677ff]"
                              : isDarkMode
                              ? "bg-[#1f6b50]/25 text-[#6be4aa]"
                              : "bg-[#0d8f5b]/10 text-[#0d8f5b]"
                          }`}
                        >
                          {bgVideoMuted ? <VolumeX size={14} /> : <Volume2 size={14} />}
                        </div>
                        <div className="text-right leading-tight">
                          <div className={`text-[11px] font-extrabold ${isDarkMode ? "text-white" : "text-[#1f2532]"}`}>
                            كتم صوت فيديو الخلفية
                          </div>
                          <div className={`text-[9px] font-bold ${isDarkMode ? "text-[#8ea1a6]" : "text-[#748678]"}`}>
                            {bgVideoMuted ? "مفعل" : "غير مفعل"}
                          </div>
                        </div>
                      </div>
                      <div className={`relative h-5 w-10 rounded-full transition-colors ${bgVideoMuted ? "bg-[#1677ff]" : isDarkMode ? "bg-[#2f3545]" : "bg-[#dde1ea]"}`}>
                        <span className={`absolute top-1 h-3 w-3 rounded-full bg-white transition-all ${bgVideoMuted ? "left-1" : "left-6"}`} />
                      </div>
                    </button>

                    <div className="flex items-center justify-between mb-2">
                       <div className="flex items-center gap-2">
                          <Scissors size={12} className="text-[#1677ff]" />
                          <span className="text-[10px] font-extrabold text-[#1f2532] dark:text-white">قص المقطع (Trim)</span>
                       </div>
                       <span className="text-[9px] font-bold text-[#8a93a5]">
                         مدة الفيديو: {bgVideoRange[1] - bgVideoRange[0] > 0 ? (bgVideoRange[1] - bgVideoRange[0]).toFixed(1) : 0}ث
                       </span>
                    </div>
                    <div className="flex items-center gap-3">
                       <div className="flex-1">
                          <label className="mb-1 block text-[9px] font-bold text-[#8a93a5]">البداية</label>
                          <input 
                            type="number" 
                            step="0.1" 
                            min="0" 
                            value={bgVideoRange[0]} 
                            onChange={(e) => updateState({ bgVideoRange: [Number(e.target.value), bgVideoRange[1]] })}
                            className={`w-full h-8 rounded-lg border text-center text-xs font-bold ${isDarkMode ? "bg-[#2f3545] border-[#212735] text-white" : "bg-white border-[#e3e7ef] text-[#1f2532]"}`}
                          />
                       </div>
                       <div className="flex-1">
                          <label className="mb-1 block text-[9px] font-bold text-[#8a93a5]">النهاية (ث)</label>
                          <input 
                            type="number" 
                            step="0.1" 
                            min={bgVideoRange[0] + 0.1}
                            value={bgVideoRange[1]} 
                            onChange={(e) => updateState({ bgVideoRange: [bgVideoRange[0], Number(e.target.value)] })}
                            className={`w-full h-8 rounded-lg border text-center text-xs font-bold ${isDarkMode ? "bg-[#2f3545] border-[#212735] text-white" : "bg-white border-[#e3e7ef] text-[#1f2532]"}`}
                          />
                       </div>
                    </div>
                  </div>
                )}
              </div>
            )}
            <div className="mt-5 space-y-4">
              <div>
                <div className="mb-2 flex items-center justify-between text-[11px] font-bold text-[#5b6373]">
                  <span>تعتيم الخلفية</span>
                  <span className="text-[#1677ff]">{Math.round(bgDim * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="0.9"
                  step="0.01"
                  value={bgDim}
                  onChange={(e) => updateState({ bgDim: Number(e.target.value) })}
                  className={`h-1.5 w-full cursor-pointer appearance-none rounded-lg accent-[#1677ff] ${isDarkMode ? "bg-[#2f3545]" : "bg-[#dde4f0]"}`}
                />
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between text-[11px] font-bold text-[#5b6373]">
                  <span>ضبابية (Blur)</span>
                  <span className="text-[#1677ff]">{bgBlur}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="20"
                  step="1"
                  value={bgBlur}
                  onChange={(e) => updateState({ bgBlur: Number(e.target.value) })}
                  className={`h-1.5 w-full cursor-pointer appearance-none rounded-lg accent-[#1677ff] ${isDarkMode ? "bg-[#2f3545]" : "bg-[#dde4f0]"}`}
                />
              </div>
            </div>
          </SettingAccordion>

          <SettingAccordion
            id="appearance"
            title="تنسيق النصوص والآيات"
            icon={<Palette size={16} />}
            isActive={activeAccordion === "appearance"}
            onToggle={setActiveAccordion}
            isDarkMode={isDarkMode}
          >
            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="mb-2 text-[10px] font-bold text-[#81899a]">حجم الخط</div>
                  <div className={`flex items-center gap-3 h-10 px-3 border rounded-xl ${
                      isDarkMode ? "bg-[#252c3c] border-[#2f3545]" : "bg-white border-[#e3e7ef]"
                  }`}>
                    <input
                      type="range"
                      min="16"
                      max="80"
                      value={ayahFontSize}
                      onChange={(e) => updateState({ ayahFontSize: Number(e.target.value) })}
                      className="h-1 flex-1 accent-[#1677ff]"
                    />
                    <span className={`text-xs font-bold w-6 ${isDarkMode ? "text-white" : "text-[#1f2532]"}`}>{ayahFontSize}</span>
                  </div>
                </div>
                <div>
                  <div className="mb-2 text-[10px] font-bold text-[#81899a]">لون الخط</div>
                  <div className={`flex items-center gap-2 h-10 px-2 border rounded-xl overflow-hidden ${
                      isDarkMode ? "bg-[#252c3c] border-[#2f3545]" : "bg-white border-[#e3e7ef]"
                  }`}>
                    <input
                      type="color"
                      value={ayahColor}
                      onChange={(e) => updateState({ ayahColor: e.target.value })}
                      className="h-6 w-6 cursor-pointer border-0 bg-transparent"
                    />
                    <span className={`text-[9px] font-mono font-bold uppercase truncate ${
                        isDarkMode ? "text-[#8a93a5]" : "text-[#5b6373]"
                    }`}>{ayahColor}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="mb-2 flex items-center justify-between text-[11px] font-bold text-[#5b6373]">
                    <span>الموقع العمودي (Y)</span>
                    <span className="text-[#1677ff]">{yPosition}%</span>
                  </div>
                  <input
                    type="range"
                    min="5"
                    max="85"
                    value={yPosition}
                    onChange={(e) => updateState({ yPosition: Number(e.target.value) })}
                    className="h-1.5 w-full accent-[#1677ff]"
                  />
                </div>
                <div>
                  <div className="mb-2 flex items-center justify-between text-[11px] font-bold text-[#5b6373]">
                    <span>الموقع الأفقي (X)</span>
                    <span className="text-[#1677ff]">{xPosition}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="90"
                    value={xPosition}
                    onChange={(e) => updateState({ xPosition: Number(e.target.value) })}
                    className="h-1.5 w-full accent-[#1677ff]"
                  />
                </div>
              </div>
              <div className="border-t border-[#ebedf2] dark:border-[#2f3545] pt-4">
                <button
                  type="button"
                  onClick={() => updateState({ showAyahGlassEffect: !showAyahGlassEffect })}
                  className="flex w-full items-center justify-between py-1 text-right"
                >
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold ${isDarkMode ? "text-white" : "text-[#1f2532]"}`}>تأثير الزجاج (Glassmorphism)</span>
                    <span className="rounded bg-blue-500/10 px-1.5 py-0.5 text-[8px] font-bold text-blue-500">PREMIUM</span>
                  </div>
                  <div className={`relative h-5 w-9 rounded-full transition-colors ${showAyahGlassEffect ? "bg-[#1677ff]" : "bg-[#dde1ea] dark:bg-[#2f3545]"}`}>
                    <span className={`absolute top-1 h-3 w-3 rounded-full bg-white transition-all ${showAyahGlassEffect ? "left-1" : "left-5"}`} />
                  </div>
                </button>
                {showAyahGlassEffect && (
                   <div className="mt-4 space-y-4 pr-2 border-r-2 border-blue-500/20">
                     <div className="grid grid-cols-2 gap-3">
                       <div>
                         <div className="mb-2 flex items-center justify-between text-[10px] font-bold text-[#81899a]">
                            <span>الضبابية (Blur)</span>
                            <span className="text-[#1677ff]">{ayahGlassBlur}px</span>
                         </div>
                         <input type="range" min="0" max="40" value={ayahGlassBlur} onChange={(e) => updateState({ ayahGlassBlur: Number(e.target.value) })} className="w-full h-1 accent-[#1677ff]" />
                       </div>
                       <div>
                         <div className="mb-2 flex items-center justify-between text-[10px] font-bold text-[#81899a]">
                            <span>الشفافية</span>
                            <span className="text-[#1677ff]">{Math.round(ayahGlassOpacity * 100)}%</span>
                         </div>
                         <input type="range" min="0" max="0.6" step="0.01" value={ayahGlassOpacity} onChange={(e) => updateState({ ayahGlassOpacity: Number(e.target.value) })} className="w-full h-1 accent-[#1677ff]" />
                       </div>
                     </div>
                     <div className="grid grid-cols-2 gap-3">
                       <div>
                         <div className="mb-2 flex items-center justify-between text-[10px] font-bold text-[#81899a]">
                            <span>الحواف (Radius)</span>
                            <span className="text-[#1677ff]">{ayahGlassBorderRadius}px</span>
                         </div>
                         <input type="range" min="0" max="100" value={ayahGlassBorderRadius} onChange={(e) => updateState({ ayahGlassBorderRadius: Number(e.target.value) })} className="w-full h-1 accent-[#1677ff]" />
                       </div>
                       <div>
                         <div className="mb-2 flex items-center justify-between text-[10px] font-bold text-[#81899a]">
                            <span>الهوامش (Padding)</span>
                            <span className="text-[#1677ff]">{ayahGlassPadding}px</span>
                         </div>
                         <input type="range" min="0" max="100" value={ayahGlassPadding} onChange={(e) => updateState({ ayahGlassPadding: Number(e.target.value) })} className="w-full h-1 accent-[#1677ff]" />
                       </div>
                     </div>
                     <button
                        type="button"
                        onClick={() => updateState({ ayahGlassGlow: !ayahGlassGlow })}
                        className="flex w-full items-center justify-between py-1 text-right opacity-80"
                      >
                        <span className={`text-[10px] font-bold ${isDarkMode ? "text-[#8a93a5]" : "text-[#5b6373]"}`}>وهج خفيف (Subtle Glow)</span>
                        <div className={`relative h-4 w-7 rounded-full transition-colors ${ayahGlassGlow ? "bg-[#1677ff]" : "bg-[#dde1ea] dark:bg-[#2f3545]"}`}>
                          <span className={`absolute top-0.5 h-3 w-3 rounded-full bg-white transition-all ${ayahGlassGlow ? "left-0.5" : "left-3.5"}`} />
                        </div>
                      </button>
                   </div>
                )}
              </div>
              <div className="border-t border-[#ebedf2] pt-4">
                <button
                  type="button"
                  onClick={() => updateState({ showSurahName: !showSurahName })}
                  className="flex w-full items-center justify-between py-1 text-right"
                >
                  <span className={`text-xs font-bold ${isDarkMode ? "text-white" : "text-[#1f2532]"}`}>إظهار اسم السورة</span>
                  <div className={`relative h-5 w-9 rounded-full transition-colors ${showSurahName ? "bg-[#1677ff]" : "bg-[#dde1ea]"}`}>
                    <span className={`absolute top-1 h-3 w-3 rounded-full bg-white transition-all ${showSurahName ? "left-1" : "left-5"}`} />
                  </div>
                </button>
                {showSurahName && (
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div>
                      <div className="mb-1 text-[10px] font-bold text-[#81899a]">الحجم</div>
                      <input type="range" min="12" max="60" value={surahFontSize} onChange={(e) => updateState({ surahFontSize: Number(e.target.value) })} className="w-full h-1" />
                    </div>
                    <div>
                      <div className="mb-1 text-[10px] font-bold text-[#81899a]">الموقع Y</div>
                      <input type="range" min="2" max="95" value={surahYPosition} onChange={(e) => updateState({ surahYPosition: Number(e.target.value) })} className="w-full h-1" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </SettingAccordion>

          <SettingAccordion
            id="kinetic"
            title="تزامن الكلمات (Kinetic)"
            icon={<Zap size={16} />}
            isActive={activeAccordion === "kinetic"}
            onToggle={setActiveAccordion}
            isDarkMode={isDarkMode}
          >
            <div className="space-y-5">
              <button
                type="button"
                onClick={() => updateState({ enableWordSync: !enableWordSync })}
                className="flex w-full items-center justify-between py-1 text-right"
              >
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold ${isDarkMode ? "text-white" : "text-[#1f2532]"}`}>تفعيل تزامن الكلمات</span>
                  <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[8px] font-bold text-amber-500">NEW</span>
                </div>
                <div className={`relative h-5 w-9 rounded-full transition-colors ${enableWordSync ? "bg-[#1677ff]" : "bg-[#dde1ea] dark:bg-[#2f3545]"}`}>
                  <span className={`absolute top-1 h-3 w-3 rounded-full bg-white transition-all ${enableWordSync ? "left-1" : "left-5"}`} />
                </div>
              </button>

              {enableWordSync && (
                <div className="mt-4 space-y-5 pr-2 border-r-2 border-amber-500/20">
                  <div>
                    <label className={`mb-2 block text-[11px] font-bold ${isDarkMode ? "text-[#6e7786]" : "text-[#81899a]"}`}>
                      نمط الحركة
                    </label>
                    <div className={`flex rounded-lg p-1 ${isDarkMode ? "bg-[#252c3c]" : "bg-[#ebedf2]"}`}>
                      <button
                        onClick={() => updateState({ wordSyncStyle: "karaoke" })}
                        className={`flex-1 rounded-md py-1.5 text-[10px] font-bold transition-all ${
                          wordSyncStyle === "karaoke"
                            ? isDarkMode ? "bg-[#2f3545] text-white shadow-sm" : "bg-white text-[#1677ff] shadow-sm"
                            : "text-[#5b6373] hover:opacity-80"
                        }`}
                      >
                        كاريوكي (Highlight)
                      </button>
                      <button
                        onClick={() => updateState({ wordSyncStyle: "fade" })}
                        className={`flex-1 rounded-md py-1.5 text-[10px] font-bold transition-all ${
                          wordSyncStyle === "fade"
                            ? isDarkMode ? "bg-[#2f3545] text-white shadow-sm" : "bg-white text-[#1677ff] shadow-sm"
                            : "text-[#5b6373] hover:opacity-80"
                        }`}
                      >
                        ظهور تدريجي (Fade)
                      </button>
                    </div>
                  </div>

                  <div>
                    <div className="mb-2 text-[10px] font-bold text-[#81899a]">لون الكلمة النشطة</div>
                    <div className={`flex items-center gap-2 h-11 px-3 border rounded-xl overflow-hidden ${
                        isDarkMode ? "bg-[#252c3c] border-[#2f3545]" : "bg-white border-[#e3e7ef]"
                    }`}>
                      <input
                        type="color"
                        value={wordSyncActiveColor}
                        onChange={(e) => updateState({ wordSyncActiveColor: e.target.value })}
                        className="h-7 w-7 cursor-pointer border-2 border-white/20 rounded-full bg-transparent"
                      />
                      <div className="flex-1 text-[10px] font-mono font-bold uppercase truncate pr-2 text-left bg-black/5 dark:bg-white/5 py-1 px-2 rounded">
                        {wordSyncActiveColor}
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl bg-blue-500/5 p-3 border border-blue-500/10">
                    <p className="text-[9px] font-bold text-[#1677ff] leading-relaxed">
                      يتم توزيع زمن الآية على الكلمات بشكل ذكي بناءً على طول كل كلمة لضمان أفضل تزامن ممكن.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </SettingAccordion>

          <SettingAccordion
            id="wave"
            title="موجة الصوت (Waveform)"
            icon={<AudioLines size={16} />}
            isActive={activeAccordion === "wave"}
            onToggle={setActiveAccordion}
            isDarkMode={isDarkMode}
          >
            <div className="space-y-5">
              <button
                type="button"
                onClick={() => updateState({ showWave: !showWave })}
                className="flex w-full items-center justify-between py-1 text-right"
              >
                <span className={`text-xs font-bold ${isDarkMode ? "text-white" : "text-[#1f2532]"}`}>تفعيل الموجة</span>
                <div className={`relative h-5 w-9 rounded-full transition-colors ${
                    showWave ? "bg-[#1677ff]" : isDarkMode ? "bg-[#2f3545]" : "bg-[#dde1ea]"
                }`}>
                  <span className={`absolute top-1 h-3 w-3 rounded-full bg-white transition-all ${showWave ? "left-1" : "left-5"}`} />
                </div>
              </button>
              {showWave && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="mb-2 text-[10px] font-bold text-[#81899a]">اللون</div>
                      <input type="color" value={waveColor} onChange={(e) => updateState({ waveColor: e.target.value })} className="w-full h-8 cursor-pointer border-0 bg-transparent" />
                    </div>
                    <div>
                      <div className="mb-2 text-[10px] font-bold text-[#81899a]">الارتفاع</div>
                      <input type="range" min="5" max="150" value={waveHeight} onChange={(e) => updateState({ waveHeight: Number(e.target.value) })} className="w-full h-1" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="mb-1 text-[10px] font-bold text-[#81899a]">موقع Y</div>
                      <input type="range" min="0" max="95" value={waveY} onChange={(e) => updateState({ waveY: Number(e.target.value) })} className="w-full h-1" />
                    </div>
                    <div>
                      <div className="mb-1 text-[10px] font-bold text-[#81899a]">موقع X</div>
                      <input type="range" min="0" max="100" value={waveX} onChange={(e) => updateState({ waveX: Number(e.target.value) })} className="w-full h-1" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </SettingAccordion>

          <SettingAccordion
            id="audio_effects"
            title="مؤثرات الصوت (Audio FX)"
            icon={<Sparkles size={16} />}
            isActive={activeAccordion === "audio_effects"}
            onToggle={setActiveAccordion}
            isDarkMode={isDarkMode}
          >
            <div className="space-y-4">
              <p className={`text-[10px] font-bold ${isDarkMode ? "text-[#6e7786]" : "text-[#81899a]"}`}>
                اختر نوع المعالجة الصوتية لتحسين تجربة الاستماع
              </p>
              <div className="grid grid-cols-1 gap-2">
                <button
                  onClick={() => updateState({ audioEffect: "none" })}
                  className={`flex items-center justify-between rounded-xl border p-3 transition-all ${
                    audioEffect === "none"
                      ? "border-[#1677ff] bg-[#1677ff]/5 text-[#1677ff]"
                      : isDarkMode ? "border-[#2f3545] bg-[#252c3c] text-[#8a93a5]" : "border-[#e3e7ef] bg-white text-[#5b6373]"
                  }`}
                >
                  <span className="text-xs font-bold">بدون مؤثرات (Natural)</span>
                  {audioEffect === "none" && <div className="h-2 w-2 rounded-full bg-[#1677ff]" />}
                </button>
                <button
                  onClick={() => updateState({ audioEffect: "studio" })}
                  className={`flex items-center justify-between rounded-xl border p-3 transition-all ${
                    audioEffect === "studio"
                      ? "border-[#1677ff] bg-[#1677ff]/5 text-[#1677ff]"
                      : isDarkMode ? "border-[#2f3545] bg-[#252c3c] text-[#8a93a5]" : "border-[#e3e7ef] bg-white text-[#5b6373]"
                  }`}
                >
                  <div className="flex flex-col text-right">
                    <span className="text-xs font-bold">صدى استوديو (Studio Reverb)</span>
                    <span className="text-[9px] opacity-60">صدى خفيف واحترافي يحاكي غرف التسجيل</span>
                  </div>
                  {audioEffect === "studio" && <div className="h-2 w-2 rounded-full bg-[#1677ff]" />}
                </button>
                <button
                  onClick={() => updateState({ audioEffect: "mosque" })}
                  className={`flex items-center justify-between rounded-xl border p-3 transition-all ${
                    audioEffect === "mosque"
                      ? "border-[#1677ff] bg-[#1677ff]/5 text-[#1677ff]"
                      : isDarkMode ? "border-[#2f3545] bg-[#252c3c] text-[#8a93a5]" : "border-[#e3e7ef] bg-white text-[#5b6373]"
                  }`}
                >
                  <div className="flex flex-col text-right">
                    <span className="text-xs font-bold">صدى المسجد (Mosque Echo)</span>
                    <span className="text-[9px] opacity-60">صدى عميق وواسع يحاكي أجواء الجوامع الكبيرة</span>
                  </div>
                  {audioEffect === "mosque" && <div className="h-2 w-2 rounded-full bg-[#1677ff]" />}
                </button>
              </div>
            </div>
          </SettingAccordion>

          <SettingAccordion
            id="export_engine"
            title="محرك التصدير (Export Engine)"
            icon={<Clapperboard size={16} />}
            isActive={activeAccordion === "export_engine"}
            onToggle={setActiveAccordion}
            isDarkMode={isDarkMode}
          >
            <div className="space-y-5">
              <div>
                <label className={`mb-2 block text-[11px] font-bold ${isDarkMode ? "text-[#6e7786]" : "text-[#81899a]"}`}>
                  قالب النشر (Preset)
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {EXPORT_PRESETS.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => handlePresetChange(p.id)}
                      className={`flex items-center justify-center rounded-xl border py-2.5 px-2 text-center text-[10px] font-bold transition-all ${
                        exportPreset === p.id
                          ? "border-[#1677ff] bg-[#1677ff]/10 text-[#1677ff]"
                          : isDarkMode
                          ? "border-[#2f3545] bg-[#252c3c] text-[#8a93a5]"
                          : "border-[#e3e7ef] bg-white text-[#5b6373]"
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={`mb-2 block text-[11px] font-bold ${isDarkMode ? "text-[#6e7786]" : "text-[#81899a]"}`}>
                  جودة الفيديو (Quality)
                </label>
                <div className="flex rounded-xl p-1 bg-black/5 dark:bg-white/5">
                  {EXPORT_QUALITIES.map((q) => (
                    <button
                      key={q.id}
                      onClick={() => updateState({ exportQuality: q.id as EditorState["exportQuality"] })}
                      className={`flex-1 rounded-lg py-2 text-[10px] font-bold transition-all ${
                        exportQuality === q.id
                          ? "bg-[#1677ff] text-white shadow-lg shadow-[#1677ff]/30"
                          : "text-[#8a93a5] hover:text-[#1677ff]"
                      }`}
                    >
                      {q.id.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-[#ebedf2] dark:border-[#2f3545] pt-4">
                <button
                  type="button"
                  onClick={() => updateState({ showSafeArea: !showSafeArea })}
                  className="flex w-full items-center justify-between py-1 text-right"
                >
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-bold ${isDarkMode ? "text-white" : "text-[#1f2532]"}`}>منطقة الأمان (Safe Area)</span>
                  </div>
                  <div className={`relative h-5 w-9 rounded-full transition-colors ${showSafeArea ? "bg-[#1677ff]" : "bg-[#dde1ea] dark:bg-[#2f3545]"}`}>
                    <span className={`absolute top-1 h-3 w-3 rounded-full bg-white transition-all ${showSafeArea ? "left-1" : "left-5"}`} />
                  </div>
                </button>
                <p className="mt-1 text-[9px] text-[#6e7786]">أظهر حدود مناطق الأمان لمنصات التواصل لتجنب تغطية النصوص</p>
              </div>
            </div>
          </SettingAccordion>

          <SettingAccordion
            id="watermark"
            title="العلامة المائية (Logo)"
            icon={<MoveVertical size={16} />}
            isActive={activeAccordion === "watermark"}
            onToggle={setActiveAccordion}
            isDarkMode={isDarkMode}
          >
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => updateState({ showWatermark: !showWatermark })}
                className="flex w-full items-center justify-between py-1 text-right"
              >
                <span className={`text-xs font-bold ${isDarkMode ? "text-white" : "text-[#1f2532]"}`}>تفعيل الشعار</span>
                <div className={`relative h-5 w-9 rounded-full transition-colors ${
                    showWatermark ? "bg-[#1677ff]" : isDarkMode ? "bg-[#2f3545]" : "bg-[#dde1ea]"
                }`}>
                  <span className={`absolute top-1 h-3 w-3 rounded-full bg-white transition-all ${showWatermark ? "left-1" : "left-5"}`} />
                </div>
              </button>
              {showWatermark && (
                <div className="space-y-4">
                  <div className={`flex rounded-lg p-1 ${isDarkMode ? "bg-[#252c3c]" : "bg-[#ebedf2]"}`}>
                    <button
                      onClick={() => updateState({ watermarkMode: "image" })}
                      className={`flex-1 rounded-md py-1.5 text-[10px] font-bold transition-all ${
                        watermarkMode === "image"
                          ? isDarkMode
                            ? "bg-[#2f3545] text-white"
                            : "bg-white text-[#1677ff]"
                          : "text-[#5b6373] hover:opacity-80"
                      }`}
                    >
                      صورة
                    </button>
                    <button
                      onClick={() => updateState({ watermarkMode: "text" })}
                      className={`flex-1 rounded-md py-1.5 text-[10px] font-bold transition-all ${
                        watermarkMode === "text"
                          ? isDarkMode
                            ? "bg-[#2f3545] text-white"
                            : "bg-white text-[#1677ff]"
                          : "text-[#5b6373] hover:opacity-80"
                      }`}
                    >
                      نص
                    </button>
                  </div>

                  {watermarkMode === "image" && (
                    <div className="mt-2 text-right">
                       <label className={`flex h-16 cursor-pointer items-center justify-center gap-3 rounded-xl border-2 border-dashed transition-all ${
                          isDarkMode ? "border-[#2f3545] bg-[#252c3c] hover:bg-[#2c3346]" : "border-[#dce6f8] bg-white hover:bg-[#eef4ff]"
                       }`}>
                         {watermarkImage ? (
                           <div className="flex items-center gap-3 px-4 w-full">
                             <div className="relative h-10 w-10 overflow-hidden rounded-lg border border-[#ebedf2] dark:border-[#2f3545]">
                               <img src={watermarkImage} className="object-contain w-full h-full" alt="Logo preview" />
                             </div>
                             <div className="flex flex-col">
                               <span className="text-[10px] font-bold text-[#1677ff]">تم رفع الشعار</span>
                               <span className="text-[9px] text-[#8a93a5]">اضغط لتغيير الصورة</span>
                             </div>
                           </div>
                         ) : (
                           <>
                             <ImagePlus size={16} className="text-[#1677ff]" />
                             <span className="text-[10px] font-bold text-[#8a93a5]">رفع شعار (Logo)</span>
                           </>
                         )}
                         <input
                           type="file"
                           hidden
                           accept="image/*"
                           onChange={(e) => {
                             const file = e.target.files?.[0];
                             if (file) {
                               const reader = new FileReader();
                               reader.onload = (event) => updateState({ watermarkImage: event.target?.result as string });
                               reader.readAsDataURL(file);
                             }
                           }}
                         />
                       </label>
                    </div>
                  )}

                  {watermarkMode === "text" && (
                    <div className="mt-2 space-y-3 text-right" dir="rtl">
                      <div>
                        <div className="mb-1 text-[10px] font-bold text-[#81899a]">نص الشعار</div>
                        <input
                          type="text"
                          value={watermarkText}
                          onChange={(e) => updateState({ watermarkText: e.target.value })}
                          className={`h-10 w-full rounded-xl border px-3 text-sm font-bold outline-none focus:border-[#1677ff] transition-all ${
                            isDarkMode ? "bg-[#252c3c] border-[#2f3545] text-white" : "bg-white border-[#e3e7ef] text-[#1f2532]"
                          }`}
                          placeholder="اكتب اسم القناة أو الشعار..."
                        />
                      </div>
                      <div>
                        <div className="mb-1 text-[10px] font-bold text-[#81899a]">لون النص</div>
                        <div className={`flex items-center gap-2 h-10 px-2 border rounded-xl overflow-hidden ${
                            isDarkMode ? "bg-[#252c3c] border-[#2f3545]" : "bg-white border-[#e3e7ef]"
                        }`}>
                          <input
                            type="color"
                            value={watermarkTextColor}
                            onChange={(e) => updateState({ watermarkTextColor: e.target.value })}
                            className="h-6 w-6 cursor-pointer border-0 bg-transparent"
                          />
                          <span className={`text-[9px] font-mono font-bold uppercase truncate ${
                              isDarkMode ? "text-[#8a93a5]" : "text-[#5b6373]"
                          }`}>{watermarkTextColor}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="mb-1 text-[10px] font-bold text-[#81899a]">الحجم</div>
                      <input type="range" min="10" max="200" value={watermarkSize} onChange={(e) => updateState({ watermarkSize: Number(e.target.value) })} className="w-full h-1" />
                    </div>
                    <div>
                      <div className="mb-1 text-[10px] font-bold text-[#81899a]">الشفافية</div>
                      <input type="range" min="0" max="1" step="0.01" value={watermarkOpacity} onChange={(e) => updateState({ watermarkOpacity: Number(e.target.value) })} className="w-full h-1" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <div className="mb-1 text-[10px] font-bold text-[#81899a]">الموقع X</div>
                      <input type="range" min="0" max="50" value={watermarkX} onChange={(e) => updateState({ watermarkX: Number(e.target.value) })} className="w-full h-1" />
                    </div>
                    <div>
                      <div className="mb-1 text-[10px] font-bold text-[#81899a]">الموقع Y</div>
                      <input type="range" min="0" max="50" value={watermarkY} onChange={(e) => updateState({ watermarkY: Number(e.target.value) })} className="w-full h-1" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </SettingAccordion>
        </div>
      </div>

      <footer
        className={`flex flex-col gap-4 border-t p-5 transition-colors md:shrink-0 ${
          isDarkMode ? "bg-[#0d171a] border-[#1f373d]" : "bg-[#f9fdf9] border-[#dfe9e1]"
        }`}
      >
        <button
          type="button"
          onClick={handleExport}
          disabled={isExporting}
          className="group relative flex h-16 w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-[#0d8f5b] to-[#0f6d8a] text-xl font-extrabold text-white shadow-[0_14px_32px_rgba(13,143,91,0.35)] transition-all hover:brightness-105 active:scale-[0.98] disabled:opacity-70"
        >
          {isExporting ? (
            <div className="flex flex-col items-center">
              <div className="flex items-center gap-3">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                <span>جاري تصدير الفيديو... ({Math.round(exportProgress)}%)</span>
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
              <span>تصدير المقطع</span>
            </>
          )}
        </button>

        <a
          href="https://wa.me/972598045064"
          target="_blank"
          rel="noreferrer"
          className={`group block overflow-hidden rounded-[20px] border transition-all duration-500 hover:scale-[1.02] active:scale-[0.98] ${
            isDarkMode
              ? "bg-gradient-to-br from-[#1c2230] to-[#11141d] border-[#212735] shadow-lg"
              : "bg-gradient-to-br from-[#f8faff] to-white border-[#eceff4] shadow-sm"
          }`}
        >
          <div className="p-3.5 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-500 ${
                  isDarkMode ? "bg-[#1677ff]/10 text-[#3489ff]" : "bg-[#1677ff]/5 text-[#1677ff]"
                }`}
              >
                <Clapperboard size={18} />
              </div>
              <div className="text-right">
                <p
                  className={`text-[7px] font-bold uppercase tracking-[0.2em] ${
                    isDarkMode ? "text-[#5b6373]" : "text-[#8a93a5]"
                  }`}
                >
                  الـتـطـويـر والـبـرمـجـة
                </p>
                <h3 className={`text-xs font-black ${isDarkMode ? "text-white" : "text-[#1f2532]"}`}>
                  عبد الفتاح الـشـنـطـي
                </h3>
              </div>
            </div>
            <div className="group relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg bg-[#25d366] text-white transition-all shadow-md">
              <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 group-hover:translate-x-full" />
              <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
            </div>
          </div>
        </a>
      </footer>
    </aside>
  );
}
