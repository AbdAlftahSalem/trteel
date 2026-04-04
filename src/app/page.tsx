"use client";

import { useMemo, useState } from "react";
import { useEditorState } from "@/hooks/useEditorState";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { useVideoExport } from "@/hooks/useVideoExport";
import { VideoPreview } from "@/components/VideoPreview";
import { SettingsSidebar } from "@/components/SettingsSidebar";
import { quranData, quranEnData, quranEsData, quranFrData, surahs } from "@/constants";

export default function Home() {
  const { state, updateState } = useEditorState();
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<number>(0);

  const selectedSurah = useMemo(
    () => surahs.find((surah) => surah.number === state.selectedSurahNumber) ?? surahs[0],
    [state.selectedSurahNumber]
  );

  const selectedAyahs = useMemo(() => {
    const surah = quranData.data.surahs.find((s) => s.number === state.selectedSurahNumber);
    if (!surah) return [];

    let translationData = quranEnData;
    if (state.selectedLanguage === "es") translationData = quranEsData;
    else if (state.selectedLanguage === "fr") translationData = quranFrData;

    const translationSurah = translationData.data.surahs.find((s) => s.number === state.selectedSurahNumber);

    return surah.ayahs
      .filter((ayah) => ayah.numberInSurah >= state.fromAyah && ayah.numberInSurah <= state.toAyah)
      .map((ayah) => {
        const trans = translationSurah?.ayahs.find((ta) => ta.numberInSurah === ayah.numberInSurah);
        return {
          ...ayah,
          translation: trans?.text,
        };
      });
  }, [state.selectedSurahNumber, state.fromAyah, state.toAyah, state.selectedLanguage]);

  const {
    audioRef,
    isPlaying,
    setIsPlaying,
    currentAyahIndex,
    setCurrentAyahIndex,
    handleAudioEnded,
    togglePlayback,
  } = useAudioPlayer(state.selectedSurahNumber, state.selectedReciterId, selectedAyahs, isExporting, state.audioEffect);

  const { handleExport } = useVideoExport(
    state,
    selectedAyahs,
    selectedSurah,
    setIsPlaying,
    setCurrentAyahIndex,
    setIsExporting,
    setExportProgress
  );

  return (
    <>
      <style jsx global>{`
        ::-webkit-scrollbar {
          width: 9px;
        }
        ::-webkit-scrollbar-track {
          background: ${state.isDarkMode ? "#0f1619" : "#dde8de"};
        }
        ::-webkit-scrollbar-thumb {
          background: ${state.isDarkMode ? "#2f6f77" : "#1b8a64"};
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: ${state.isDarkMode ? "#3f8c96" : "#106e4d"};
        }
        scrollbar-width: thin;
        scrollbar-color: ${state.isDarkMode ? "#2f6f77 #0f1619" : "#1b8a64 #dde8de"};
      `}</style>
      <main
        className={`app-noise relative flex h-[100dvh] w-full items-center justify-center overflow-hidden p-0 transition-colors duration-500 md:p-5 ${
          state.isDarkMode ? "bg-[#081113]" : "bg-[#eef4ef]"
        }`}
        dir="ltr"
      >
        <div
          className={`pointer-events-none absolute -left-20 top-0 h-80 w-80 rounded-full blur-3xl ${
            state.isDarkMode ? "bg-[#11606e]/40" : "bg-[#94d6bd]/60"
          }`}
        />
        <div
          className={`pointer-events-none absolute -bottom-20 right-10 h-96 w-96 rounded-full blur-3xl ${
            state.isDarkMode ? "bg-[#085f50]/30" : "bg-[#9fd9f3]/55"
          }`}
        />

        <section
          className={`relative flex h-full w-full max-w-[1740px] flex-col overflow-hidden rounded-none border-0 shadow-[0_30px_90px_rgba(10,18,14,0.22)] transition-all duration-500 md:flex-row md:rounded-[28px] md:border ${
            state.isDarkMode
              ? "glass-panel md:bg-gradient-to-br md:from-[#0e1a1d] md:to-[#0a1416] bg-[#0e1a1d]"
              : "glass-panel md:border-[#d4e1d8] md:bg-gradient-to-br md:from-[#f4fbf6] md:to-[#ebf2ee] bg-[#f4fbf6]"
          }`}
          style={{ animation: "intro-rise 500ms ease-out" }}
        >
          <div
            className={`relative flex h-[46dvh] shrink-0 items-center justify-center p-4 transition-colors duration-500 md:h-auto md:flex-1 md:p-10 ${
              state.isDarkMode ? "bg-[#0d1719]" : "bg-[#e8f0ea]"
            }`}
          >
            <div className="absolute left-5 top-5 z-20 flex items-center gap-2">
              <span
                className={`rounded-full px-3 py-1 text-[10px] font-extrabold tracking-wide ${
                  state.isDarkMode ? "bg-[#10333b] text-[#7be1ff]" : "bg-[#dcfff0] text-[#0a7b53]"
                }`}
              >
                Studio Live Preview
              </span>
              <span
                className={`rounded-full px-3 py-1 text-[10px] font-bold ${
                  state.isDarkMode ? "bg-white/8 text-[#c4d2d6]" : "bg-white/80 text-[#33413e]"
                }`}
              >
                {selectedSurah.name.ar} • {state.fromAyah}-{state.toAyah}
              </span>
            </div>

            <div
              className={`pointer-events-none absolute -left-20 top-8 h-56 w-56 rounded-full blur-3xl transition-colors ${
                state.isDarkMode ? "bg-[#0f3a56]" : "bg-[#caecdc]"
              }`}
            />
            <div
              className={`pointer-events-none absolute -bottom-16 right-8 h-64 w-64 rounded-full blur-3xl transition-colors ${
                state.isDarkMode ? "bg-[#123636]" : "bg-[#cfe2f7]"
              }`}
            />

            <div className="absolute inset-4 md:inset-10 flex items-center justify-center z-10" style={{ containerType: 'size' }}>
              <VideoPreview
                state={state}
                selectedAyahs={selectedAyahs}
                selectedSurah={selectedSurah}
                maxAyah={selectedSurah.verses_count}
                currentAyahIndex={currentAyahIndex}
                setCurrentAyahIndex={setCurrentAyahIndex}
                isPlaying={isPlaying}
                togglePlayback={togglePlayback}
                audioRef={audioRef}
                handleAudioEnded={handleAudioEnded}
              />
            </div>
          </div>

          <SettingsSidebar
            state={state}
            updateState={updateState}
            maxAyah={selectedSurah.verses_count}
            isExporting={isExporting}
            exportProgress={exportProgress}
            handleExport={handleExport}
          />
        </section>
      </main>
    </>
  );
}
