import { useCallback } from "react";
import { EditorState, Ayah, Surah } from "@/types";
import { exportVideo } from "@/utils/exportVideo";

export function useVideoExport(
  state: EditorState,
  selectedAyahs: Ayah[],
  selectedSurah: Surah,
  setIsPlaying: (playing: boolean) => void,
  setCurrentAyahIndex: (index: number) => void,
  setIsExporting: (exporting: boolean) => void,
  setExportProgress: (progress: number) => void
) {
  const handleExport = useCallback(async () => {
    if (selectedAyahs.length === 0) return;

    setIsExporting(true);
    setExportProgress(0);
    setIsPlaying(false);

    try {
      await exportVideo({
        state,
        selectedAyahs,
        selectedSurah,
        onProgress: setExportProgress,
      });
    } catch (err) {
      console.error("Export error:", err);
      alert("حدث خطأ أثناء التصدير. يرجى مراجعة وحدة التحكم (Console).");
    } finally {
      setIsExporting(false);
      setCurrentAyahIndex(0);
    }
  }, [
    state,
    selectedAyahs,
    selectedSurah,
    setIsPlaying,
    setCurrentAyahIndex,
    setIsExporting,
    setExportProgress,
  ]);

  return { handleExport };
}
