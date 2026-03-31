import { useState, useRef, useEffect, useCallback } from "react";
import { Ayah } from "@/types";

export function useAudioPlayer(
  selectedSurahNumber: number,
  selectedReciterId: string,
  selectedAyahs: Ayah[],
  isExporting: boolean
) {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentAyahIndex, setCurrentAyahIndex] = useState<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Reset when surah or ayahs change
  useEffect(() => {
    setCurrentAyahIndex(0);
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
    }
  }, [selectedSurahNumber, selectedAyahs.length]);

  // Handle Playback
  useEffect(() => {
    if (isPlaying && selectedAyahs[currentAyahIndex]) {
      const ayah = selectedAyahs[currentAyahIndex];
      const s = String(selectedSurahNumber).padStart(3, "0");
      const a = String(ayah.numberInSurah).padStart(3, "0");
      const audioUrl = `/audio-proxy/${selectedReciterId}/${s}${a}.mp3`;

      if (audioRef.current && audioRef.current.src !== window.location.origin + audioUrl) {
        audioRef.current.src = audioUrl;
      }
      audioRef.current?.play().catch((err) => console.error("Playback failed", err));
    } else if (!isPlaying && audioRef.current) {
      audioRef.current.pause();
    }
  }, [isPlaying, currentAyahIndex, selectedAyahs, selectedReciterId, selectedSurahNumber]);

  const handleAudioEnded = useCallback(() => {
    if (currentAyahIndex < selectedAyahs.length - 1) {
      setCurrentAyahIndex((prev) => prev + 1);
    } else {
      setIsPlaying(false);
      if (!isExporting) {
        setCurrentAyahIndex(0);
      }
    }
  }, [currentAyahIndex, selectedAyahs.length, isExporting]);

  const togglePlayback = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  return {
    audioRef,
    isPlaying,
    setIsPlaying,
    currentAyahIndex,
    setCurrentAyahIndex,
    handleAudioEnded,
    togglePlayback,
  };
}
