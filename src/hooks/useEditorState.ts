import { useState, useCallback } from "react";
import { BACKGROUNDS, surahs, reciters } from "@/constants";
import { EditorState } from "@/types";

export function useEditorState() {
  const [state, setState] = useState<EditorState>({
    selectedSurahNumber: surahs[0].number,
    fromAyah: 1,
    toAyah: Math.min(5, surahs[0].verses_count),
    yPosition: 50,
    xPosition: 50,
    surahYPosition: 8,
    surahXPosition: 50,
    ayahFontSize: 16,
    surahFontSize: 12,
    ayahColor: "#a1a1aa",
    ayahShadowColor: "#000000",
    surahColor: "#ffffff",
    surahShadowColor: "#000000",
    waveColor: "#ffffff",
    waveX: 50,
    waveY: 0,
    waveHeight: 25,
    showWave: true,
    showSurahName: true,
    aspectRatio: "9/16",
    bgType: "image",
    bgImage: BACKGROUNDS[0],
    bgVideo: null,
    bgVideoRange: [0, 10], // Default 10s range
    bgVideoDuration: 0,
    showWatermark: false,
    watermarkMode: "image",
    watermarkImage: null,
    watermarkText: "Trteel",
    watermarkTextColor: "#ffffff",
    watermarkSize: 40,
    watermarkOpacity: 0.5,
    watermarkX: 5,
    watermarkY: 5,
    bgBlur: 0,
    bgDim: 0.3,
    selectedReciterId: reciters[0].id,
    isDarkMode: false,
    exportQuality: "medium",
    exportPreset: "story",
    showSafeArea: false,
    showAyahGlassEffect: false,
    ayahGlassBlur: 10,
    ayahGlassOpacity: 0.15,
    ayahGlassPadding: 20,
    ayahGlassBorderRadius: 24,
    ayahGlassGlow: true,
    enableWordSync: true,
    wordSyncStyle: "karaoke",
    wordSyncActiveColor: "#ffffff",
    audioEffect: "none",
  });

  const updateState = useCallback(
    (updates: Partial<EditorState>) => {
      setState((prev) => ({ ...prev, ...updates }));
    },
    []
  );

  return {
    state,
    updateState,
    setState,
  };
}
