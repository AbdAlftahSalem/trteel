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

  const drawFrame = (ayah: Ayah, phase: number, ayahTime: number, totalDur: number) => {
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
    const words = ayah.text.split(" ");
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
    const arabicTextH = lines.length * lh;

    // Translation lines
    const transLines: string[] = [];
    let transBlockH = 0;
    const tfs = translationFontSize * SC;
    const tlh = tfs * 1.4;
    
    if (showTranslation && ayah.translation) {
      ctx.save();
      ctx.font = `${tfs}px Tajawal, sans-serif`;
      ctx.direction = "ltr";
      const tWords = ayah.translation.split(" ");
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
      ctx.restore();
    }

    const gap = 16 * SC;
    const totalTextH = arabicTextH + (showTranslation && transLines.length ? (gap + transBlockH) : 0);
    
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
      
      ctx.fillStyle = `rgba(255, 255, 255, ${ayahGlassOpacity})`;
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
          ctx.shadowBlur = 0;
          ctx.shadowColor = "transparent";
        }
        ctx.fillText(ln, tx, sy);
        sy += lh;
      });
    } else {
      const allWords = ayah.text.split(/\s+/).filter(w => w.length > 0);
      const wordLengths = allWords.map(w => w.length);
      const totalCharLength = wordLengths.reduce((a, b) => a + b, 0);
      let cumulativeTime = 0;

      lines.forEach((ln) => {
        const lineWordsArr = ln.split(/\s+/).filter(w => w.length > 0);
        const lineW = ctx.measureText(ln).width;
        let curX = tx + (lineW / 2); 

        lineWordsArr.forEach((word) => {
          const wLen = word.length;
          const wDur = (wLen / totalCharLength) * totalDur;
          const startTime = cumulativeTime;
          const endTime = cumulativeTime + wDur;
          cumulativeTime = endTime;

          const isActive = ayahTime >= startTime && ayahTime < endTime;
          const isFuture = ayahTime < startTime;
          const isPast = ayahTime >= endTime;

          ctx.save();
          const wordW = ctx.measureText(word).width;
          const spaceW = ctx.measureText(" ").width;

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
            ctx.shadowBlur = 0;
            ctx.shadowColor = "transparent";
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
        ctx.shadowBlur = 0;
        ctx.shadowColor = "transparent";
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
    const ayah = selectedAyahs[currentData.ayahIdx];
    const ayahTime = currentTime - currentData.start;
    
    phase += frameTime * ((2 * Math.PI) / 1.6);
    if (ayah) drawFrame(ayah, phase, ayahTime, currentData.duration);
    
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
