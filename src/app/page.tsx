"use client";

import { useMemo, useState } from "react";
import { useEditorState } from "@/hooks/useEditorState";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { useVideoExport } from "@/hooks/useVideoExport";
import { VideoPreview } from "@/components/VideoPreview";
import { SettingsSidebar } from "@/components/SettingsSidebar";
import { quranData, surahs } from "@/constants";

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
    return surah.ayahs.filter(
      (ayah) => ayah.numberInSurah >= state.fromAyah && ayah.numberInSurah <= state.toAyah
    );
  }, [state.selectedSurahNumber, state.fromAyah, state.toAyah]);

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
          width: 8px;
        }
        ::-webkit-scrollbar-track {
          background: ${state.isDarkMode ? "#0a0c10" : "#ececf1"};
        }
        ::-webkit-scrollbar-thumb {
          background: ${state.isDarkMode ? "#2f3545" : "#ccc"};
          border-radius: 10px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: ${state.isDarkMode ? "#3c435a" : "#999"};
        }
        scrollbar-width: thin;
        scrollbar-color: ${state.isDarkMode ? "#2f3545 #0a0c10" : "#ccc #ececf1"};
      `}</style>
      <main
        className={`flex h-[100dvh] w-full items-center justify-center p-1.5 md:p-5 transition-colors duration-500 ${
          state.isDarkMode ? "bg-[#0a0c10]" : "bg-[#ececf1]"
        }`}
        dir="ltr"
      >
        <section
          className={`relative flex h-full w-full max-w-[1720px] flex-col-reverse overflow-hidden rounded-[24px] border transition-colors duration-500 shadow-[0_24px_70px_rgba(16,24,40,0.12)] md:flex-row ${
            state.isDarkMode ? "bg-[#11141d] border-[#1d232e]" : "bg-[#efeff3] border-[#d9dbe3]"
          }`}
        >
          <div
            className={`relative flex flex-[1.4] items-center justify-center p-6 md:flex-1 md:p-12 transition-colors duration-500 ${
              state.isDarkMode ? "bg-[#161a23]" : "bg-[#ebedf2]"
            }`}
          >
            <div
              className={`pointer-events-none absolute -left-20 top-8 h-56 w-56 rounded-full blur-3xl transition-colors ${
                state.isDarkMode ? "bg-[#16274d]" : "bg-[#d5e4ff]"
              }`}
            />
            <div
              className={`pointer-events-none absolute -bottom-16 right-8 h-64 w-64 rounded-full blur-3xl transition-colors ${
                state.isDarkMode ? "bg-[#1a1740]" : "bg-[#d9dbff]"
              }`}
            />
            
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
