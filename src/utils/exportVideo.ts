import { EditorState, Ayah, Surah } from "@/types";
// @ts-ignore
import fixWebmDuration from "webm-duration-fix";

export interface ExportConfig {
  state: EditorState;
  selectedAyahs: Ayah[];
  selectedSurah: Surah;
  onProgress: (progress: number) => void;
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
  } = state;

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
  canvas.style.position = "fixed";
  canvas.style.left = "-10000px";
  canvas.style.top = "-10000px";
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d", { alpha: false })!;

  await document.fonts.ready;

  const types = [
    'video/mp4;codecs="avc1.42E01E, mp4a.40.2"',
    "video/mp4",
    'video/webm;codecs="vp9, opus"',
    'video/webm;codecs="h264, opus"',
    "video/webm",
  ];
  const mimeType = types.find((t) => MediaRecorder.isTypeSupported(t)) || "video/mp4";

  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  if (audioCtx.state === "suspended") await audioCtx.resume();

  const audioDest = audioCtx.createMediaStreamDestination();
  const exportGain = audioCtx.createGain();
  exportGain.gain.value = 1.0;
  exportGain.connect(audioDest);

  const silent = audioCtx.createConstantSource();
  silent.offset.value = 0.0001;
  silent.connect(exportGain);
  silent.start();

  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, CW, CH);

  const videoStream = canvas.captureStream(60);
  const vTracks = videoStream.getVideoTracks();
  const aTracks = audioDest.stream.getAudioTracks();

  if (vTracks.length === 0) {
    document.body.removeChild(canvas);
    throw new Error("No video tracks found from canvas");
  }

  const combined = new MediaStream([...vTracks, ...aTracks]);
  const chunks: Blob[] = [];
  const recorder = new MediaRecorder(combined, {
    mimeType,
    videoBitsPerSecond: 16_000_000,
    audioBitsPerSecond: 320_000,
  });

  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };

  recorder.onerror = (e) => {
    console.error("MediaRecorder error event:", e);
  };

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
  const bgEl = bgSrc ? await loadEl(bgSrc) : null;
  let wmEl: HTMLImageElement | null = null;
  if (showWatermark && watermarkMode === "image" && watermarkImage) {
    wmEl = await loadEl(watermarkImage);
  }

  const waveRelH = [0.4, 0.7, 0.9, 0.5, 0.8, 0.6, 0.9, 0.7, 0.4, 0.8, 0.5, 0.7];

  const drawFrame = (text: string, phase: number) => {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, CW, CH);

    if (bgEl) {
      ctx.save();
      if (bgBlur > 0) ctx.filter = `blur(${bgBlur * SC}px)`;
      const s = Math.max(CW / (bgEl.naturalWidth || 1), CH / (bgEl.naturalHeight || 1));
      ctx.drawImage(
        bgEl,
        (CW - bgEl.naturalWidth * s) / 2,
        (CH - bgEl.naturalHeight * s) / 2,
        bgEl.naturalWidth * s,
        bgEl.naturalHeight * s
      );
      ctx.filter = "none";
      ctx.restore();
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
    let sy = textBlockBottom - totalTextH + lh * 0.8;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 4 * SC;
    lines.forEach((ln) => {
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

  drawFrame(selectedAyahs[0].text, 0);
  recorder.start(200);
  const startTime = Date.now();

  let phase = 0;
  const totalAyahs = selectedAyahs.length;
  for (let i = 0; i < totalAyahs; i++) {
    const ayah = selectedAyahs[i];
    const sNum = String(selectedSurahNumber).padStart(3, "0");
    const aNum = String(ayah.numberInSurah).padStart(3, "0");
    const audioUrl = `/audio-proxy/${selectedReciterId}/${sNum}${aNum}.mp3`;

    let audioBuffer: AudioBuffer | null = null;
    try {
      const resp = await fetch(audioUrl);
      if (resp.ok) {
        const ab = await resp.arrayBuffer();
        audioBuffer = await audioCtx.decodeAudioData(ab);
      }
    } catch (e) {
      console.error("Audio fetch/decode failed", e);
    }

    const dur = audioBuffer?.duration ?? 4;

    let rafId = -1;
    let rafRunning = true;
    let lastTs = -1;
    const animate = (ts: number) => {
      if (!rafRunning) return;
      if (lastTs < 0) lastTs = ts;
      const dt = (ts - lastTs) / 1000;
      lastTs = ts;
      phase += dt * ((2 * Math.PI) / 1.6);
      drawFrame(ayah.text, phase);
      rafId = requestAnimationFrame(animate);
    };
    rafId = requestAnimationFrame(animate);

    if (audioBuffer) {
      const src = audioCtx.createBufferSource();
      src.buffer = audioBuffer;
      src.connect(exportGain);
      src.start();

      const startT = audioCtx.currentTime;
      await new Promise<void>((res) => {
        const tick = setInterval(() => {
          const elapsed = audioCtx.currentTime - startT;
          onProgress(Math.round(((i + Math.min(elapsed / dur, 1)) / totalAyahs) * 100));
          if (elapsed >= dur) {
            clearInterval(tick);
            res();
          }
        }, 100);
        src.onended = () => {
          clearInterval(tick);
          res();
        };
      });
    } else {
      const startT = Date.now();
      await new Promise<void>((res) => {
        const tick = setInterval(() => {
          const elapsed = (Date.now() - startT) / 1000;
          onProgress(Math.round(((i + Math.min(elapsed / 4, 1)) / totalAyahs) * 100));
          if (elapsed >= 4) {
            clearInterval(tick);
            res();
          }
        }, 100);
      });
    }

    rafRunning = false;
    if (rafId !== -1) cancelAnimationFrame(rafId);
  }

  onProgress(100);
  silent.stop();

  await new Promise((r) => setTimeout(r, 1000));

  await new Promise<void>((resolve) => {
    recorder.onstop = () => resolve();
    recorder.stop();
  });

  if (chunks.length > 0) {
    const durationMs = Date.now() - startTime;
    const rawBlob = new Blob(chunks, { type: mimeType });
    const ext = mimeType.includes("mp4") ? "mp4" : "webm";
    const dateStr = new Date().toISOString().replace(/[:.]/g, "-");
    const surahNameSafe = selectedSurah.name.en.replace(/\s+/g, "-");
    const downloadName = `trteel-${surahNameSafe}-${dateStr}.${ext}`;

    const handleDownload = (finalBlob: Blob) => {
      const url = URL.createObjectURL(finalBlob);
      const a = document.createElement("a");
      a.href = url;
      a.download = downloadName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    };

    if (ext === "webm") {
      // @ts-ignore
      fixWebmDuration(rawBlob, durationMs)
        .then(handleDownload)
        .catch((e: Error) => {
          console.warn("Failed to fix webm duration:", e);
          handleDownload(rawBlob);
        });
    } else {
      handleDownload(rawBlob);
    }
  } else {
    console.error("No chunks collected. Recorder failed.");
    alert("فشل تصدير الفيديو: لم يتم تجميع أي بيانات. جرّب تقليل عدد الآيات أو استخدام متصفح مغاير.");
  }

  document.body.removeChild(canvas);
  audioCtx.close();
}
