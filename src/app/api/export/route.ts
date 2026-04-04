import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import path from "path";
import fs from "fs/promises";
import os from "os";
import ffmpeg from "ffmpeg-static";
import { promisify } from "util";

const execAsync = promisify(exec);

// Helper to get absolute ffmpeg path safely in Next.js environment
const getFFmpegPath = () => {
  if (typeof ffmpeg !== 'string') return ffmpeg;
  let p = ffmpeg;
  if (p.includes('ROOT')) {
    const parts = p.split(/[\\/]ROOT[\\/]/);
    p = path.join(process.cwd(), parts[1] || parts[0]);
  } else if (!path.isAbsolute(p)) {
    p = path.resolve(process.cwd(), p);
  }
  return p;
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

    const audioPath = path.join(tempDir, "audio.mp3");
    const outputPath = path.join(tempDir, "output.mp4");
    await fs.writeFile(audioPath, Buffer.from(await audioFile.arrayBuffer()));

    const bitrate = settings.bitrate || "6000k";
    const fps = settings.fps || 30;
    const ffmpegPath = getFFmpegPath();

    let inputCmd = "";

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
      
      inputCmd = `-framerate ${fps} -i "${path.join(framesDir, "frame_%06d.jpg")}" -i "${audioPath}"`;
    } else if (videoFile) {
      // VIDEO INPUT APPROACH
      const videoPath = path.join(tempDir, "input.webm");
      await fs.writeFile(videoPath, Buffer.from(await videoFile.arrayBuffer()));
      inputCmd = `-i "${videoPath}" -i "${audioPath}"`;
    } else {
      return NextResponse.json({ error: "Missing frames or video file" }, { status: 400 });
    }

    // FFmpeg command with requested settings - Added -preset superfast for speed
    const ffmpegCmd = `"${ffmpegPath}" -y ${inputCmd} ` +
      `-c:v libx264 -preset superfast -profile:v baseline -level 3.0 -pix_fmt yuv420p -r ${fps} -b:v ${bitrate} ` +
      `-c:a aac -b:a 128k -ar 44100 -ac 2 -movflags +faststart -shortest "${outputPath}"`;

    console.log("Running FFmpeg:", ffmpegCmd);
    await execAsync(ffmpegCmd);

    const outputBuffer = await fs.readFile(outputPath);

    // Clean up
    await fs.rm(tempDir, { recursive: true, force: true });

    return new NextResponse(outputBuffer, {
      headers: {
        "Content-Type": "video/mp4",
        "Content-Disposition": `attachment; filename="exported-video.mp4"`,
      },
    });
  } catch (error: any) {
    console.error("Export error:", error);
    await fs.rm(tempDir, { recursive: true, force: true });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
