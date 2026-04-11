import { EditorState, Ayah, Surah } from "@/types";
import { EXPORT_QUALITIES } from "@/constants";
import * as Mp4Muxer from 'mp4-muxer';

export interface ExportConfig {
  state: EditorState;
  selectedAyahs: Ayah[];
  selectedSurah: Surah;
  onProgress: (progress: number) => void;
}

interface AyahLayout {
  lines: string[];
  transLines: string[];
  lh: number;
  tlh: number;
  totalTextH: number;
  wordData: Array<{
    words: string[];
    lineWidth: number;
    wordWidths: number[];
    spaceWidth: number;
    /** pre-computed wLen/totalCharLength for each word (multiply by totalDur to get wDur) */
    charFractions: number[];
  }>;
}

// Simple WAV encoder for AudioBuffer
function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numOfChan = buffer.numberOfChannels;
  const length = buffer.length * numOfChan * 2 + 44;
  const bufferArr = new ArrayBuffer(length);
  const view = new DataView(bufferArr);
  const channels = [];
  let i;
  let sample;
  let offset = 0;
  let pos = 0;

  function writeString(s: string) {
    for (i = 0; i < s.length; i++) {
      view.setUint8(pos + i, s.charCodeAt(i));
    }
    pos += s.length;
  }

  function setUint16(data: number) {
    view.setUint16(pos, data, true);
    pos += 2;
  }

  function setUint32(data: number) {
    view.setUint32(pos, data, true);
    pos += 4;
  }

  writeString("RIFF");
  setUint32(length - 8);
  writeString("WAVE");
  writeString("fmt ");
  setUint32(16);
  setUint16(1);
  setUint16(numOfChan);
  setUint32(buffer.sampleRate);
  setUint32(buffer.sampleRate * 2 * numOfChan);
  setUint16(numOfChan * 2);
  setUint16(16);
  writeString("data");
  setUint32(length - pos - 4);

  for (i = 0; i < buffer.numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  while (pos < length) {
    for (i = 0; i < numOfChan; i++) {
      sample = Math.max(-1, Math.min(1, channels[i][offset]));
      sample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
      view.setInt16(pos, sample, true);
      pos += 2;
    }
    offset++;
  }

  return new Blob([bufferArr], { type: "audio/wav" });
}

export async function exportVideo({
  state,
  selectedAyahs,
  selectedSurah,
  onProgress,
}: ExportConfig): Promise<void> {
  if (selectedAyahs.length === 0) return;

  const {
    aspectRatio,
    bgImage,
    bgBlur,
    bgDim,
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
    selectedSurahNumber,
    selectedReciterId,
    exportQuality,
    exportPreset,
    bgType,
    bgVideo,
    bgVideoMuted,
    bgVideoRange,
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
    translationFontSize,
    translationColor
  } = state;

  onProgress(1);

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
  const ctx = canvas.getContext("2d", { alpha: false })!;

  await document.fonts.ready;

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
  const bgElInput = bgSrc ? await loadEl(bgSrc) : null;
  let bgEl: HTMLImageElement | HTMLCanvasElement | null = bgElInput;

  // Video background setup
  let videoBG: HTMLVideoElement | null = null;
  if (bgType === "video" && bgVideo) {
    videoBG = document.createElement("video");
    videoBG.src = bgVideo;
    videoBG.muted = bgVideoMuted;
    videoBG.preload = "auto";
    videoBG.crossOrigin = "anonymous";
    await new Promise((resolve) => {
      if (!videoBG) return resolve(false);
      videoBG.onloadeddata = () => resolve(true);
      videoBG.onerror = () => resolve(false);
    });
  }

  // OPTIMIZATION: Pre-blur background if needed to avoid expensive filter on every frame
  if (bgType === "image" && bgElInput && bgBlur > 0) {
    const blurCanvas = document.createElement("canvas");
    blurCanvas.width = CW;
    blurCanvas.height = CH;
    const bCtx = blurCanvas.getContext("2d", { alpha: false })!;
    bCtx.filter = `blur(${bgBlur * SC}px)`;
    const s = Math.max(CW / (bgElInput.naturalWidth || 1), CH / (bgElInput.naturalHeight || 1));
    const sw = bgElInput.naturalWidth * s;
    const sh = bgElInput.naturalHeight * s;
    bCtx.drawImage(bgElInput, (CW - sw) / 2, (CH - sh) / 2, sw, sh);
    bgEl = blurCanvas;
    bCtx.filter = "none";
  }

  let wmEl: HTMLImageElement | null = null;
  if (showWatermark && watermarkMode === "image" && watermarkImage) {
    wmEl = await loadEl(watermarkImage);
  }

  const waveRelH = [0.4, 0.7, 0.9, 0.5, 0.8, 0.6, 0.9, 0.7, 0.4, 0.8, 0.5, 0.7];

  // Pre-compute text layout for a single ayah so drawFrame never calls measureText in a loop.
  const computeLayout = (ayah: Ayah): AyahLayout => {
    const fs = ayahFontSize * SC;
    const tfs = translationFontSize * SC;
    const maxW = CW * 0.85;

    ctx.save();
    ctx.font = `500 ${fs}px Tajawal, sans-serif`;
    ctx.direction = "rtl";

    // Arabic line wrapping
    const words = ayah.text.trim().split(/\s+/).filter(Boolean);
    const lines: string[] = [];
    let cur = "";
    for (const w of words) {
      const t = cur ? `${cur} ${w}` : w;
      if (ctx.measureText(t).width > maxW && cur) {
        lines.push(cur);
        cur = w;
      } else {
        cur = t;
      }
    }
    if (cur) lines.push(cur);

    const lh = fs * 1.6;

    // Word-sync data: measure once, reuse every frame
    const allLineWords = lines.flatMap(ln => ln.split(/\s+/).filter(Boolean));
    const totalCharLength = allLineWords.reduce((sum, w) => sum + w.length, 0) || 1;
    const wordData = lines.map(ln => {
      const lineWords = ln.split(/\s+/).filter(Boolean);
      const lineWidth = ctx.measureText(ln).width;
      const wordWidths = lineWords.map(w => ctx.measureText(w).width);
      const spaceWidth = ctx.measureText(" ").width;
      const charFractions = lineWords.map(w => w.length / totalCharLength);
      return { words: lineWords, lineWidth, wordWidths, spaceWidth, charFractions };
    });

    // Translation line wrapping
    const transLines: string[] = [];
    let transBlockH = 0;
    const tlh = tfs * 1.4;

    if (showTranslation && ayah.translation) {
      ctx.font = `${tfs}px Tajawal, sans-serif`;
      ctx.direction = "ltr";
      const tWords = ayah.translation.trim().split(/\s+/).filter(Boolean);
      let tCur = "";
      for (const w of tWords) {
        const t = tCur ? `${tCur} ${w}` : w;
        if (ctx.measureText(t).width > maxW && tCur) {
          transLines.push(tCur);
          tCur = w;
        } else {
          tCur = t;
        }
      }
      if (tCur) transLines.push(tCur);
      transBlockH = transLines.length * tlh;
    }

    ctx.restore();

    const gap = 16 * SC;
    const totalTextH = lines.length * lh + (showTranslation && transLines.length ? gap + transBlockH : 0);
    return { lines, transLines, lh, tlh, totalTextH, wordData };
  };

  const drawFrame = (ayah: Ayah, phase: number, ayahTime: number, totalDur: number, layout: AyahLayout) => {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, CW, CH);

    if (bgType === "video" && videoBG) {
      ctx.save();
      if (bgBlur > 0) ctx.filter = `blur(${bgBlur * SC}px)`;
      const s = Math.max(CW / (videoBG.videoWidth || 1), CH / (videoBG.videoHeight || 1));
      const w = videoBG.videoWidth * s;
      const h = videoBG.videoHeight * s;
      ctx.drawImage(videoBG, (CW - w) / 2, (CH - h) / 2, w, h);
      ctx.restore();
    } else if (bgEl) {
      // Use the pre-blurred (or original) background without filter
      const s = bgEl instanceof HTMLCanvasElement ? 1 : Math.max(CW / ((bgEl as HTMLImageElement).naturalWidth || 1), CH / ((bgEl as HTMLImageElement).naturalHeight || 1));
      const w = "naturalWidth" in bgEl ? bgEl.naturalWidth * s : bgEl.width * s;
      const h = "naturalHeight" in bgEl ? bgEl.naturalHeight * s : bgEl.height * s;
      ctx.drawImage(bgEl, (CW - w) / 2, (CH - h) / 2, w, h);
    }

    ctx.fillStyle = `rgba(0,0,0,${bgDim})`;
    ctx.fillRect(0, 0, CW, CH);
    const grad = ctx.createLinearGradient(0, 0, 0, CH);
    grad.addColorStop(0, "rgba(0,0,0,0.20)");
    grad.addColorStop(0.5, "rgba(0,0,0,0.00)");
    grad.addColorStop(1, "rgba(0,0,0,0.60)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, CW, CH);

    const fs = ayahFontSize * SC;
    const tfs = translationFontSize * SC;
    ctx.save();
    ctx.font = `500 ${fs}px Tajawal, sans-serif`;
    ctx.fillStyle = ayahColor;
    ctx.shadowColor = ayahShadowColor + "80";
    ctx.shadowBlur = 10 * SC;
    ctx.textAlign = "center";
    ctx.direction = "rtl";

    const tx = (xPosition / 100) * CW;
    const textBlockBottom = CH - (yPosition / 100) * CH;

    // Use pre-computed layout — no measureText calls per frame
    const { lines, transLines, lh, tlh, totalTextH, wordData: layoutWordData } = layout;
    const arabicTextH = lines.length * lh;
    const transBlockH = transLines.length * tlh;

    const gap = 16 * SC;
    const maxW = CW * 0.85;
    
    // Glass Effect Calculations
    const pad = ayahGlassPadding * SC;
    const radius = ayahGlassBorderRadius * SC;
    const glassW = maxW + pad * 2;
    const glassH = totalTextH + pad * 2;
    const glassX = tx - glassW / 2;
    const glassY = textBlockBottom - totalTextH - pad;

    if (showAyahGlassEffect) {
      ctx.save();
      if (ayahGlassGlow) {
        ctx.shadowColor = `rgba(255, 255, 255, ${ayahGlassOpacity * 0.5})`;
        ctx.shadowBlur = 20 * SC;
      }
      
      ctx.beginPath();
      if ((ctx as any).roundRect) {
        (ctx as any).roundRect(glassX, glassY, glassW, glassH, radius);
      } else {
        ctx.rect(glassX, glassY, glassW, glassH);
      }
      ctx.clip();
      
      if (bgType === "video" && videoBG) {
        ctx.filter = `blur(${(bgBlur + ayahGlassBlur) * SC}px)`;
        const s = Math.max(CW / (videoBG.videoWidth || 1), CH / (videoBG.videoHeight || 1));
        const w = videoBG.videoWidth * s;
        const h = videoBG.videoHeight * s;
        ctx.drawImage(videoBG, (CW - w) / 2, (CH - h) / 2, w, h);
      } else if (bgEl) {
        ctx.filter = `blur(${ayahGlassBlur * SC}px)`; 
        const s = bgEl instanceof HTMLCanvasElement ? 1 : Math.max(CW / ((bgEl as HTMLImageElement).naturalWidth || 1), CH / ((bgEl as HTMLImageElement).naturalHeight || 1));
        const w = "naturalWidth" in bgEl ? bgEl.naturalWidth * s : bgEl.width * s;
        const h = "naturalHeight" in bgEl ? bgEl.naturalHeight * s : bgEl.height * s;
        ctx.drawImage(bgEl, (CW - w) / 2, (CH - h) / 2, w, h);
      }
      ctx.filter = "none";
      
      ctx.fillStyle = `rgba(14, 20, 26, ${Math.min(0.75, 0.2 + ayahGlassOpacity)})`;
      ctx.fill();
      
      ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
      ctx.lineWidth = 1.5 * SC;
      ctx.stroke();
      
      ctx.restore();
    }

    let sy = textBlockBottom - totalTextH + lh * 0.8;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 4 * SC;
    
    // Arabic Rendering
    ctx.save();
    ctx.textAlign = "center";
    ctx.direction = "rtl";
    ctx.fillStyle = ayahColor;
    ctx.font = `500 ${fs}px Tajawal, sans-serif`;

    if (!enableWordSync) {
      lines.forEach((ln) => {
        if (showAyahGlassEffect) {
          ctx.shadowColor = "rgba(0,0,0,0.45)";
          ctx.shadowBlur = 10 * SC;
          ctx.shadowOffsetY = 2 * SC;
        }
        ctx.fillText(ln, tx, sy);
        sy += lh;
      });
    } else {
      let cumulativeTime = 0;

      // Draw synced Arabic words from the right edge so RTL spacing remains natural.
      ctx.textAlign = "right";
      lines.forEach((ln, lineIdx) => {
        const { words: lineWordsArr, lineWidth, wordWidths, spaceWidth, charFractions } = layoutWordData[lineIdx];
        let curX = tx + (lineWidth / 2);

        lineWordsArr.forEach((word, wordIdx) => {
          const wDur = charFractions[wordIdx] * totalDur;
          const startTime = cumulativeTime;
          const endTime = cumulativeTime + wDur;
          cumulativeTime = endTime;

          const isActive = ayahTime >= startTime && ayahTime < endTime;
          const isFuture = ayahTime < startTime;
          const isPast = ayahTime >= endTime;

          ctx.save();
          const wordW = wordWidths[wordIdx];
          const spaceW = spaceWidth;

          if (wordSyncStyle === "karaoke") {
            if (isActive) {
              ctx.fillStyle = wordSyncActiveColor;
              ctx.shadowColor = wordSyncActiveColor + "40";
              ctx.shadowBlur = 15 * SC;
            } else if (isPast) {
              ctx.globalAlpha = 0.8;
            } else {
              ctx.globalAlpha = 0.5;
            }
          } else if (wordSyncStyle === "fade") {
            if (isFuture) {
              ctx.globalAlpha = 0;
            } else {
              ctx.globalAlpha = 1;
            }
          }

          if (showAyahGlassEffect) {
            ctx.shadowColor = "rgba(0,0,0,0.45)";
            ctx.shadowBlur = 10 * SC;
            ctx.shadowOffsetY = 2 * SC;
          }

          ctx.fillText(word, curX, sy);
          ctx.restore();
          
          curX -= (wordW + spaceW);
        });
        sy += lh;
      });
    }
    ctx.restore();

    // Translation Rendering
    if (showTranslation && transLines.length) {
      sy += gap - lh * 0.8 + tlh * 0.8;
      ctx.save();
      ctx.font = `${tfs}px Tajawal, sans-serif`;
      ctx.fillStyle = translationColor;
      ctx.textAlign = "center";
      ctx.direction = "ltr";
      ctx.globalAlpha = 0.9;
      if (showAyahGlassEffect) {
        ctx.shadowColor = "rgba(0,0,0,0.4)";
        ctx.shadowBlur = 8 * SC;
        ctx.shadowOffsetY = 1 * SC;
      } else {
        ctx.shadowColor = ayahShadowColor + "60";
        ctx.shadowBlur = 8 * SC;
      }
      transLines.forEach(ln => {
        ctx.fillText(ln, tx, sy);
        sy += tlh;
      });
      ctx.restore();
    }
    ctx.restore();

    if (showSurahName) {
      const sfs = surahFontSize * SC;
      const transFS = sfs * 0.7;
      ctx.save();
      ctx.textAlign = "center";
      ctx.direction = "rtl";
      const sx = (surahXPosition / 100) * CW;
      const containerBottom = CH - (surahYPosition / 100) * CH;
      const mt1 = 4 * SC;
      const totalSurahBlockH = sfs + mt1 + transFS;
      const h2Baseline = containerBottom - totalSurahBlockH + sfs * 0.85;
      ctx.font = `bold ${sfs}px Tajawal, sans-serif`;
      ctx.fillStyle = surahColor;
      ctx.shadowColor = surahShadowColor;
      ctx.shadowBlur = 5 * SC;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 2 * SC;
      ctx.fillText(`سورة ${selectedSurah.name.ar}`, sx, h2Baseline);
      const transBaseline = h2Baseline + sfs * 0.15 + mt1 + transFS * 0.85;
      ctx.font = `${transFS}px Tajawal, sans-serif`;
      ctx.globalAlpha = 0.8;
      ctx.fillText(selectedSurah.name.transliteration, sx, transBaseline);
      ctx.restore();
    }

    if (showWave) {
      const bW = 3 * SC;
      const bGap = 4 * SC;
      const bStep = bW + bGap;
      const numBars = waveRelH.length;
      const totalWW = (numBars - 1) * bStep + bW;
      const waveGroupLeft = (waveX / 100) * CW - totalWW / 2;
      const containerBottom = CH - (waveY / 100) * CH;
      const containerH = waveHeight * SC;

      ctx.save();
      waveRelH.forEach((rh, idx) => {
        const delay = idx * ((2 * Math.PI * 0.05) / 1.6);
        const ph = (phase + delay) % (Math.PI * 2);
        const sinVal = (Math.sin(ph) + 1) / 2;
        const scaleFactor = 1 + sinVal * 1.2;
        const naturalH = rh * containerH;
        const scaledH = naturalH * scaleFactor;
        const barCenterY = containerBottom - naturalH / 2;
        const barTop = barCenterY - scaledH / 2;
        ctx.fillStyle = waveColor;
        ctx.shadowColor = waveColor + "60";
        ctx.shadowBlur = 10 * SC;
        ctx.globalAlpha = 0.85;
        const bx = waveGroupLeft + idx * bStep;
        ctx.beginPath();
        if ((ctx as any).roundRect) {
          (ctx as any).roundRect(bx, barTop, bW, scaledH, bW / 2);
        } else {
          ctx.rect(bx, barTop, bW, scaledH);
        }
        ctx.fill();
      });
      ctx.restore();
    }

    if (showWatermark) {
      ctx.save();
      ctx.globalAlpha = watermarkOpacity;
      const wx = CW - (watermarkX / 100) * CW;
      const wy = (watermarkY / 100) * CH;
      const wmS = watermarkSize * SC;
      if (watermarkMode === "image" && wmEl) {
        const wh = (wmS / (wmEl.naturalWidth || 100)) * (wmEl.naturalHeight || 100);
        ctx.drawImage(wmEl, wx - wmS, wy, wmS, wh);
      } else if (watermarkMode === "text" && watermarkText) {
        ctx.font = `bold ${wmS}px Tajawal, sans-serif`;
        ctx.fillStyle = watermarkTextColor;
        ctx.textAlign = "right";
        ctx.shadowColor = "rgba(0,0,0,0.5)";
        ctx.shadowBlur = 2 * SC;
        ctx.shadowOffsetY = 1 * SC;
        ctx.fillText(watermarkText, wx, wy + wmS);
      }
      ctx.restore();
    }
  };

  const FPS = 30;
  const frameTime = 1 / FPS;
  // Flush the VideoEncoder every 2 seconds (60 frames) to keep the codec active
  // and prevent "Codec reclaimed due to inactivity" errors in the browser.
  const FLUSH_INTERVAL_FRAMES = FPS * 2;
  // Maximum number of frames allowed in the VideoEncoder queue before backpressuring.
  const MAX_ENCODER_QUEUE_SIZE = 10;
  let phase = 0;
  let totalDuration = 0;

  const audioData: { buffer: AudioBuffer | null, duration: number, start: number, ayahIdx: number }[] = [];
  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();

  onProgress(5);

  // LOAD ALL AUDIOS IN PARALLEL
  const audioPromises = selectedAyahs.map(async (ayah, i) => {
    const sNum = String(selectedSurahNumber).padStart(3, "0");
    const aNum = String(ayah.numberInSurah).padStart(3, "0");
    const audioUrl = `/audio-proxy/${selectedReciterId}/${sNum}${aNum}.mp3`;

    let buffer: AudioBuffer | null = null;
    let dur = 4; // Default duration for missing audio
    try {
      const resp = await fetch(audioUrl);
      if (resp.ok) {
        const ab = await resp.arrayBuffer();
        buffer = await audioCtx.decodeAudioData(ab);
        dur = buffer.duration;
      }
    } catch (e) {
      console.warn("Failed to load ayah audio", audioUrl);
    }
    return { buffer, duration: dur, ayahIdx: i };
  });

  const results = await Promise.all(audioPromises);
  for (const res of results) {
    audioData.push({ ...res, start: totalDuration });
    totalDuration += res.duration;
  }
  onProgress(20);

  // Pre-compute text layouts for all unique ayahs (avoids measureText per frame)
  const ayahLayouts = new Map<number, AyahLayout>();
  for (const ayah of selectedAyahs) {
    if (!ayahLayouts.has(ayah.numberInSurah)) {
      ayahLayouts.set(ayah.numberInSurah, computeLayout(ayah));
    }
  }

  // CLIENT-SIDE EXPORT: single-pass render → VideoFrame → encode (no JPEG round-trip)
  const qualityData = EXPORT_QUALITIES.find(q => q.id === exportQuality) || EXPORT_QUALITIES[1];

  try {
    const muxer = new Mp4Muxer.Muxer({
      target: new Mp4Muxer.ArrayBufferTarget(),
      video: { codec: 'avc', width: CW, height: CH },
      // Audio always encoded as stereo (2 channels) to match the OfflineAudioContext constructor below
      audio: { codec: 'aac', sampleRate: 44100, numberOfChannels: 2 },
      fastStart: 'in-memory'
    });

    const videoEncoder = new VideoEncoder({
      output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
      error: e => {
        console.error("VideoEncoder error: ", e);
        alert(`Video encoding error: ${e.message}`);
      }
    });

    // avc1.PPCCLL — PP=profile, CC=constraint flags, LL=level
    // Baseline (0x42) with constraint_set0+1+2 flags (0xE0), Level 4.1 (0x29) — most Instagram-compatible
    // Main    (0x4d) no extra constraints (0x00), Level 4.1 (0x29)
    // High    (0x64) no extra constraints           (0x00), Level 4.1 (0x29)
    // VP8/VP9 are NOT supported by Instagram — never use as fallback
    let videoConfig: VideoEncoderConfig = {
      codec: 'avc1.42E029', // H.264 Baseline Profile, Level 4.1 — max Instagram compatibility
      width: CW,
      height: CH,
      bitrate: parseInt(qualityData.bitrate) * 1000,
      framerate: FPS,
      avc: { format: 'avc' }
    };

    let isSupported = await VideoEncoder.isConfigSupported(videoConfig);
    if (!isSupported.supported) {
      videoConfig.codec = 'avc1.4d0029'; // Main Profile, Level 4.1
      isSupported = await VideoEncoder.isConfigSupported(videoConfig);
      if (!isSupported.supported) {
        videoConfig.codec = 'avc1.640029'; // High Profile, Level 4.1
        isSupported = await VideoEncoder.isConfigSupported(videoConfig);
        if (!isSupported.supported) {
          // Last resort: Baseline Level 3.0 — supported on every modern browser
          videoConfig.codec = 'avc1.42E01e';
          isSupported = await VideoEncoder.isConfigSupported(videoConfig);
          if (!isSupported.supported) {
            throw new Error('H.264 video encoding is not supported in this browser.');
          }
        }
      }
    }

    videoEncoder.configure(videoConfig);

    const audioEncoder = new AudioEncoder({
      output: (chunk, meta) => muxer.addAudioChunk(chunk, meta),
      error: e => {
        console.error("AudioEncoder error: ", e);
        alert(`Audio encoding error: ${e.message}`);
      }
    });

    audioEncoder.configure({
      codec: 'mp4a.40.2',
      sampleRate: 44100,
      numberOfChannels: 2,
      bitrate: 128000
    });

    // RENDER + ENCODE in a single pass — no JPEG round-trip
    const totalFrames = Math.ceil(totalDuration * FPS);
    for (let f = 0; f < totalFrames; f++) {
      const currentTime = f * frameTime;

      if (bgType === "video" && videoBG) {
        const vStart = bgVideoRange[0];
        const vDur = bgVideoRange[1] - vStart;
        const seekTime = vStart + (currentTime % vDur);
        await new Promise(res => {
          if (!videoBG) return res(null);
          videoBG.onseeked = () => res(null);
          videoBG.currentTime = seekTime;
        });
      }

      const currentData = audioData.find(d => currentTime >= d.start && currentTime < d.start + d.duration) || audioData[audioData.length - 1];
      const ayah = selectedAyahs[currentData.ayahIdx];
      const ayahTime = currentTime - currentData.start;

      phase += frameTime * ((2 * Math.PI) / 1.6);
      if (ayah) {
        const layout = ayahLayouts.get(ayah.numberInSurah) ?? computeLayout(ayah);
        drawFrame(ayah, phase, ayahTime, currentData.duration, layout);
      }

      // Encode directly from canvas — VideoFrame copies the current pixels immediately
      const videoFrame = new VideoFrame(canvas, {
        timestamp: Math.round((f / FPS) * 1e6),
        duration: Math.round((1 / FPS) * 1e6),
      });
      videoEncoder.encode(videoFrame, { keyFrame: f % (FPS * 2) === 0 });
      videoFrame.close();

      // Backpressure: prevent the encoder queue from growing too large
      if (videoEncoder.encodeQueueSize > MAX_ENCODER_QUEUE_SIZE) {
        await new Promise(r => setTimeout(r, 0));
      }

      // Yield periodically to let the encoder drain and keep the UI responsive
      if (f % 30 === 0) {
        onProgress(20 + (f / totalFrames) * 65);
        await new Promise(r => setTimeout(r, 0));
      }

      // Flush periodically to keep the codec active and prevent "Codec reclaimed due to inactivity"
      if (f > 0 && f % FLUSH_INTERVAL_FRAMES === 0) {
        await videoEncoder.flush();
      }
    }

    await videoEncoder.flush();
    onProgress(85);

    // MIX AUDIO
    const sampleRate = audioCtx.sampleRate;
    const offlineCtx = new OfflineAudioContext(2, Math.max(1, Math.ceil(totalDuration * sampleRate)), sampleRate);

    // Audio Effect Nodes for Offline Context
    let effectNode: AudioNode | null = null;
    const dryGain = offlineCtx.createGain();
    const wetGain = offlineCtx.createGain();

    if (audioEffect === "studio") {
      const reverb = offlineCtx.createConvolver();
      const length = sampleRate * 1.5;
      const impulse = offlineCtx.createBuffer(2, length, sampleRate);
      for (let i = 0; i < 2; i++) {
        const chan = impulse.getChannelData(i);
        for (let j = 0; j < length; j++) {
          chan[j] = (Math.random() * 2 - 1) * Math.pow(1 - j / length, 4);
        }
      }
      reverb.buffer = impulse;
      dryGain.gain.value = 0.8;
      wetGain.gain.value = 0.4;
      reverb.connect(wetGain);
      effectNode = reverb;
    } else if (audioEffect === "mosque") {
      const delay = offlineCtx.createDelay();
      const feedback = offlineCtx.createGain();
      delay.delayTime.value = 0.45;
      feedback.gain.value = 0.6;
      dryGain.gain.value = 1.0;
      wetGain.gain.value = 0.35;
      delay.connect(feedback);
      feedback.connect(delay);
      delay.connect(wetGain);
      effectNode = delay;
    } else {
      dryGain.gain.value = 1.0;
    }

    dryGain.connect(offlineCtx.destination);
    wetGain.connect(offlineCtx.destination);

    for (const data of audioData) {
      if (data.buffer) {
        const source = offlineCtx.createBufferSource();
        source.buffer = data.buffer;

        source.connect(dryGain);
        if (effectNode) {
          source.connect(effectNode);
        }

        source.start(data.start);
      }
    }
    const mixedAudioBuffer = await offlineCtx.startRendering();

    onProgress(90);

    // Feed audio to AudioEncoder
    const acA = new OfflineAudioContext(mixedAudioBuffer.numberOfChannels, mixedAudioBuffer.length, 44100);
    // Resample if needed
    if (mixedAudioBuffer.sampleRate !== 44100) {
      const src = acA.createBufferSource();
      src.buffer = mixedAudioBuffer;
      src.connect(acA.destination);
      src.start();
      const resampledBuffer = await acA.startRendering();
      // we encode this buffer
      encodeAudio(resampledBuffer, audioEncoder);
    } else {
      encodeAudio(mixedAudioBuffer, audioEncoder);
    }

    function encodeAudio(buf: AudioBuffer, enc: AudioEncoder) {
      const planarData = new Float32Array(buf.length * buf.numberOfChannels);
      for (let c = 0; c < buf.numberOfChannels; c++) {
        planarData.set(buf.getChannelData(c), c * buf.length);
      }
      const audioData = new AudioData({
        format: 'f32-planar',
        sampleRate: 44100,
        numberOfFrames: buf.length,
        numberOfChannels: buf.numberOfChannels,
        timestamp: 0,
        data: planarData
      });
      enc.encode(audioData);
      audioData.close();
    }

    await audioEncoder.flush();
    muxer.finalize();
    onProgress(99);

    const bufTarget = muxer.target as { buffer: ArrayBuffer };
    let finalBlob = new Blob([bufTarget.buffer], { type: 'video/mp4' });

    const surahSlug = selectedSurah.name.en.replace(/\s+/g, "-");
    const timestamp = new Date().getTime();
    const downloadName = `trteel-${surahSlug}-${timestamp}.mp4`;

    // Instagram / TikTok / WhatsApp presets: run the video through the server-side
    // FFmpeg pipeline to guarantee H.264 Baseline + faststart + yuv420p output,
    // which is the format Instagram's uploader requires to publish successfully.
    const instagramPresets = ["story", "post", "tiktok", "whatsapp"];
    if (instagramPresets.includes(exportPreset)) {
      try {
        onProgress(99);
        const form = new FormData();
        form.append("video", finalBlob, downloadName);
        form.append("filename", downloadName);

        // 4-minute timeout — gives FFmpeg time to re-encode even long videos.
        // Without a timeout, a server crash or Vercel cold-start would leave the
        // browser hanging forever with the loading spinner stuck.
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4 * 60 * 1000);

        try {
          const response = await fetch("/api/instagram-fix", {
            method: "POST",
            body: form,
            signal: controller.signal,
          });
          clearTimeout(timeoutId);

          if (response.ok) {
            finalBlob = await response.blob();
          } else {
            const errText = await response.text();
            console.warn("Instagram fix API failed, using client-side encoded video:", errText);
          }
        } catch (fetchErr: any) {
          clearTimeout(timeoutId);
          if (fetchErr?.name === "AbortError") {
            console.warn("Instagram fix API timed out (4 min), using client-side encoded video.");
          } else {
            console.warn("Instagram fix API unreachable, using client-side encoded video:", fetchErr);
          }
        }
      } catch (setupErr) {
        console.warn("Instagram fix setup error, using client-side encoded video:", setupErr);
      }
    }

    onProgress(100);
    const url = URL.createObjectURL(finalBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = downloadName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  } catch (error: any) {
    onProgress(100);
    alert("Export failed: " + (error.message || error));
  }

  audioCtx.close();
}
