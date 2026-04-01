import { EditorState, Ayah, Surah } from "@/types";
import { EXPORT_QUALITIES } from "@/constants";

export interface ExportConfig {
  state: EditorState;
  selectedAyahs: Ayah[];
  selectedSurah: Surah;
  onProgress: (progress: number) => void;
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
    bgVideoRange,
    showAyahGlassEffect,
    ayahGlassBlur,
    ayahGlassOpacity,
    ayahGlassPadding,
    ayahGlassBorderRadius,
    ayahGlassGlow,
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
    videoBG.muted = true;
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

  const drawFrame = (text: string, phase: number) => {
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
    ctx.save();
    ctx.font = `500 ${fs}px Tajawal, sans-serif`;
    ctx.fillStyle = ayahColor;
    ctx.shadowColor = ayahShadowColor + "80";
    ctx.shadowBlur = 10 * SC;
    ctx.textAlign = "center";
    ctx.direction = "rtl";

    const tx = (xPosition / 100) * CW;
    const textBlockBottom = CH - (yPosition / 100) * CH;
    const words = text.split(" ");
    const lines: string[] = [];
    let cur = "";
    const maxW = CW * 0.85;
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
    const totalTextH = lines.length * lh;
    
    // Glass Effect Calculations
    const pad = ayahGlassPadding * SC;
    const radius = ayahGlassBorderRadius * SC;
    const glassW = maxW + pad * 2;
    const glassH = totalTextH + pad * 2;
    const glassX = tx - glassW / 2;
    const glassY = textBlockBottom - totalTextH - pad;

    if (showAyahGlassEffect) {
      ctx.save();
      // 1. Shadow/Glow
      if (ayahGlassGlow) {
        ctx.shadowColor = `rgba(255, 255, 255, ${ayahGlassOpacity * 0.5})`;
        ctx.shadowBlur = 20 * SC;
      }
      
      // 2. Background Blur Simulation (Clip & Redraw background with blur)
      // Note: Real-time blur on every frame can be slow, but for export it's acceptable.
      ctx.beginPath();
      if ((ctx as any).roundRect) {
        (ctx as any).roundRect(glassX, glassY, glassW, glassH, radius);
      } else {
        ctx.rect(glassX, glassY, glassW, glassH);
      }
      ctx.clip();
      
      // Redraw background with extra blur
      if (bgType === "video" && videoBG) {
        ctx.filter = `blur(${(bgBlur + ayahGlassBlur) * SC}px)`;
        const s = Math.max(CW / (videoBG.videoWidth || 1), CH / (videoBG.videoHeight || 1));
        const w = videoBG.videoWidth * s;
        const h = videoBG.videoHeight * s;
        ctx.drawImage(videoBG, (CW - w) / 2, (CH - h) / 2, w, h);
      } else if (bgEl) {
        ctx.filter = `blur(${ayahGlassBlur * SC}px)`; // bgEl might already be blurred
        const s = bgEl instanceof HTMLCanvasElement ? 1 : Math.max(CW / ((bgEl as HTMLImageElement).naturalWidth || 1), CH / ((bgEl as HTMLImageElement).naturalHeight || 1));
        const w = "naturalWidth" in bgEl ? bgEl.naturalWidth * s : bgEl.width * s;
        const h = "naturalHeight" in bgEl ? bgEl.naturalHeight * s : bgEl.height * s;
        ctx.drawImage(bgEl, (CW - w) / 2, (CH - h) / 2, w, h);
      }
      ctx.filter = "none";
      
      // 3. Semi-transparent overlay
      ctx.fillStyle = `rgba(255, 255, 255, ${ayahGlassOpacity})`;
      ctx.fill();
      
      // 4. Border (the "shine" edge)
      ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
      ctx.lineWidth = 1.5 * SC;
      ctx.stroke();
      
      ctx.restore();
    }

    let sy = textBlockBottom - totalTextH + lh * 0.8;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 4 * SC;
    lines.forEach((ln) => {
      if (showAyahGlassEffect) {
        ctx.shadowBlur = 0; // Remove shadow when glass is active for a cleaner look
        ctx.shadowColor = "transparent";
      }
      ctx.fillText(ln, tx, sy);
      sy += lh;
    });
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

  // RENDER FRAMES Deterministically
  const totalFrames = Math.ceil(totalDuration * FPS);
  const frameBlobs: Blob[] = new Array(totalFrames);
  
  // Use a pool of offscreen canvases for blob conversion to avoid blocking the main drawing
  const blobPoolSize = 6;
  const blobPool = Array.from({ length: blobPoolSize }, () => {
    const c = document.createElement("canvas");
    c.width = CW;
    c.height = CH;
    const cx = c.getContext("2d", { alpha: false })!;
    return { canvas: c, ctx: cx };
  });

  const blobPromises: Promise<void>[] = [];
  const CONCURRENCY = 12;

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
    const ayahText = selectedAyahs[currentData.ayahIdx]?.text || "";
    
    phase += frameTime * ((2 * Math.PI) / 1.6);
    drawFrame(ayahText, phase);
    
    // Copy to a pool canvas and start blob conversion
    const poolIdx = f % blobPoolSize;
    const poolEl = blobPool[poolIdx];
    poolEl.ctx.drawImage(canvas, 0, 0);
    
    const blobPromise = new Promise<void>(res => {
      poolEl.canvas.toBlob((b) => {
        if (b) frameBlobs[f] = b;
        res();
      }, "image/jpeg", 0.70);
    });
    
    blobPromises.push(blobPromise);
    
    // Throttle promises to avoid memory exhaustion
    if (blobPromises.length >= CONCURRENCY) {
      await Promise.all(blobPromises);
      blobPromises.length = 0;
    }
    
    if (f % 60 === 0) {
      onProgress(20 + (f / totalFrames) * 60);
      await new Promise(r => setTimeout(r, 0));
    }
  }
  await Promise.all(blobPromises); // Wait for remaining blobs

  onProgress(85);

  // MIX AUDIO
  const sampleRate = audioCtx.sampleRate;
  const offlineCtx = new OfflineAudioContext(2, Math.max(1, Math.ceil(totalDuration * sampleRate)), sampleRate);
  for (const data of audioData) {
    if (data.buffer) {
      const source = offlineCtx.createBufferSource();
      source.buffer = data.buffer;
      source.connect(offlineCtx.destination);
      source.start(data.start);
    }
  }
  const mixedAudioBuffer = await offlineCtx.startRendering();
  const audioBlob = audioBufferToWav(mixedAudioBuffer);

  onProgress(90);

  // POST TO SERVER
  const qualityData = EXPORT_QUALITIES.find(q => q.id === exportQuality) || EXPORT_QUALITIES[1];
  const formData = new FormData();
  formData.append("audio", audioBlob);
  frameBlobs.forEach((blob, idx) => {
    formData.append("frames", blob, `frame_${String(idx).padStart(6, '0')}.jpg`);
  });
  formData.append("settings", JSON.stringify({
    bitrate: qualityData.bitrate,
    fps: FPS,
    preset: exportPreset
  }));

  try {
    const response = await fetch("/api/export", { method: "POST", body: formData });
    if (!response.ok) throw new Error(await response.text());

    const finalBlob = await response.blob();
    const downloadName = `trteel-${selectedSurah.name.en.replace(/\s+/g, "-")}-${new Date().getTime()}.mp4`;
    const url = URL.createObjectURL(finalBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = downloadName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    onProgress(100);
  } catch (error: any) {
    alert("Export failed: " + error.message);
  }

  audioCtx.close();
}
