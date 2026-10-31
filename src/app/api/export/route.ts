import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import os from "os";
import { errorMessage, runFFmpeg } from "../_lib/ffmpeg";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

/** Frames per second sent by the client, limited to 1–60 (default 30). */
const parseFps = (value: unknown): number => {
  const fps = Number(value ?? 30);
  if (!Number.isInteger(fps) || fps < 1 || fps > 60) {
    throw new RangeError("fps must be a whole number from 1 to 60");
  }
  return fps;
};

/** Video bitrate like "6000k" or "8M" (default "6000k"). */
const parseBitrate = (value: unknown): string => {
  const bitrate = String(value ?? "6000k");
  if (!/^\d{1,6}(\.\d{1,3})?[kKmM]?$/.test(bitrate)) {
    throw new RangeError('bitrate must look like "6000k" or "8M"');
  }
  return bitrate;
};

export async function POST(req: NextRequest) {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "trteel-export-"));

  try {
    const formData = await req.formData();
    const audioFile = formData.get("audio") as Blob;
    const settingsStr = formData.get("settings") as string;
    const settings = JSON.parse(settingsStr || "{}");

    // We expect frames as an array or multiple entries
    const frames = formData.getAll("frames") as Blob[];

    // Fallback to single video file if provided (for backward compatibility)
    const videoFile = formData.get("video") as Blob;

    if (!audioFile) {
      return NextResponse.json({ error: "Missing audio file" }, { status: 400 });
    }

    let bitrate: string;
    let fps: number;
    try {
      bitrate = parseBitrate(settings.bitrate);
      fps = parseFps(settings.fps);
    } catch (error: unknown) {
      return NextResponse.json({ error: errorMessage(error) }, { status: 400 });
    }

    const audioPath = path.join(tempDir, "audio.mp3");
    const outputPath = path.join(tempDir, "output.mp4");
    await fs.writeFile(audioPath, Buffer.from(await audioFile.arrayBuffer()));

    let inputArgs: string[] = [];

    if (frames && frames.length > 0) {
      // IMAGE SEQUENCE APPROACH (Best Quality & Reliable)
      const framesDir = path.join(tempDir, "frames");
      await fs.mkdir(framesDir);

      // Save all frames in parallel chunks to speed up I/O
      const CHUNK_SIZE = 50;
      for (let i = 0; i < frames.length; i += CHUNK_SIZE) {
        const chunk = frames.slice(i, i + CHUNK_SIZE);
        await Promise.all(chunk.map(async (frame, index) => {
          const frameIdx = i + index;
          const framePath = path.join(framesDir, `frame_${String(frameIdx).padStart(6, '0')}.jpg`);
          await fs.writeFile(framePath, Buffer.from(await frame.arrayBuffer()));
        }));
      }

      inputArgs = ["-framerate", String(fps), "-i", path.join(framesDir, "frame_%06d.jpg"), "-i", audioPath];
    } else if (videoFile) {
      // VIDEO INPUT APPROACH
      const videoPath = path.join(tempDir, "input.webm");
      await fs.writeFile(videoPath, Buffer.from(await videoFile.arrayBuffer()));
      inputArgs = ["-i", videoPath, "-i", audioPath];
    } else {
      return NextResponse.json({ error: "Missing frames or video file" }, { status: 400 });
    }

    // FFmpeg with the requested settings (-preset superfast for speed).
    // Level 4.0: 1080p needs it; Level 3.0 only covers ~360p@30fps.
    await runFFmpeg(
      [
        "-y", ...inputArgs,
        "-c:v", "libx264", "-preset", "superfast", "-profile:v", "baseline", "-level", "4.0",
        "-pix_fmt", "yuv420p", "-r", String(fps), "-b:v", bitrate,
        "-c:a", "aac", "-b:a", "128k", "-ar", "44100", "-ac", "2",
        "-movflags", "+faststart", "-shortest", outputPath,
      ],
      { timeout: 280000 },
    );

    const outputBuffer = await fs.readFile(outputPath);

    // Clean up
    await fs.rm(tempDir, { recursive: true, force: true });

    return new NextResponse(outputBuffer, {
      headers: {
        "Content-Type": "video/mp4",
        "Content-Disposition": `attachment; filename="exported-video.mp4"`,
      },
    });
  } catch (error: unknown) {
    console.error("Export error:", error);
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 });
  }
}
