import { useState, useRef, useEffect, useCallback } from "react";
import { Ayah } from "@/types";

export function useAudioPlayer(
  selectedSurahNumber: number,
  selectedReciterId: string,
  selectedAyahs: Ayah[],
  isExporting: boolean,
  audioEffect: "none" | "studio" | "mosque"
) {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentAyahIndex, setCurrentAyahIndex] = useState<number>(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const effectNodeRef = useRef<AudioNode | null>(null);

  const setupAudioGraph = useCallback(() => {
    if (!audioRef.current || isExporting) return;

    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }

    const ctx = audioContextRef.current;
    
    // Resume context on first user interaction if needed
    if (ctx.state === "suspended") {
      ctx.resume();
    }

    if (!sourceNodeRef.current && audioRef.current) {
      sourceNodeRef.current = ctx.createMediaElementSource(audioRef.current);
    }

    const source = sourceNodeRef.current!;
    source.disconnect();

    if (audioEffect === "none") {
      source.connect(ctx.destination);
    } else {
      // Create a nice reverb/echo
      if (audioEffect === "studio") {
        // Simple Convolver-like reverb simulation using multiple delays
        const merger = ctx.createChannelMerger(2);
        const reverb = ctx.createConvolver();
        
        // Generate an impulse response
        const sampleRate = ctx.sampleRate;
        const length = sampleRate * 1.5;
        const impulse = ctx.createBuffer(2, length, sampleRate);
        for (let i = 0; i < 2; i++) {
          const chan = impulse.getChannelData(i);
          for (let j = 0; j < length; j++) {
            chan[j] = (Math.random() * 2 - 1) * Math.pow(1 - j / length, 4);
          }
        }
        reverb.buffer = impulse;
        
        const dryGain = ctx.createGain();
        const wetGain = ctx.createGain();
        dryGain.gain.value = 0.8;
        wetGain.gain.value = 0.4;

        source.connect(dryGain);
        source.connect(reverb);
        reverb.connect(wetGain);

        dryGain.connect(ctx.destination);
        wetGain.connect(ctx.destination);
        effectNodeRef.current = reverb;
      } else if (audioEffect === "mosque") {
        // High delay with feedback for echo
        const delay = ctx.createDelay();
        const feedback = ctx.createGain();
        const wetGain = ctx.createGain();
        const dryGain = ctx.createGain();

        delay.delayTime.value = 0.45;
        feedback.gain.value = 0.6;
        wetGain.gain.value = 0.35;
        dryGain.gain.value = 1.0;

        source.connect(dryGain);
        source.connect(delay);
        delay.connect(feedback);
        feedback.connect(delay);
        delay.connect(wetGain);

        dryGain.connect(ctx.destination);
        wetGain.connect(ctx.destination);
        effectNodeRef.current = delay;
      }
    }
  }, [audioEffect, isExporting]);

  useEffect(() => {
    if (isPlaying) {
      setupAudioGraph();
    }
  }, [isPlaying, setupAudioGraph]);

  // Reset when surah or ayahs change (state is adjusted during render, as
  // React recommends; the playback effect below then pauses the audio).
  const resetKey = `${selectedSurahNumber}:${selectedAyahs.length}`;
  const [previousResetKey, setPreviousResetKey] = useState(resetKey);
  if (previousResetKey !== resetKey) {
    setPreviousResetKey(resetKey);
    setCurrentAyahIndex(0);
    setIsPlaying(false);
  }

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
