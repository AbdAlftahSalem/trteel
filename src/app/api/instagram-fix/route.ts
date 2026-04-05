import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import path from "path";
import fs from "fs/promises";
import os from "os";
import ffmpeg from "ffmpeg-static";
import { promisify } from "util";

// Allow up to 5 minutes for FFmpeg to process large videos.
// Without this, Vercel serverless functions time out at 10 s (hobby) / 60 s (pro default),
// which silently kills the process and leaves the browser fetch() hanging forever.
export const maxDuration = 300;
export const dynamic = "force-dynamic";

const execAsync = promisify(exec);

const getFFmpegPath = (): string => {
  if (typeof ffmpeg !== "string" || !ffmpeg) {
    throw new Error("ffmpeg-static did not provide a valid binary path");
  }
  let p = ffmpeg;
  if (p.includes("ROOT")) {
    const parts = p.split(/[\\/]ROOT[\\/]/);
    p = path.join(process.cwd(), parts[1] || parts[0]);
  } else if (!path.isAbsolute(p)) {
    p = path.resolve(process.cwd(), p);
  }
  return p;
};

export async function POST(req: NextRequest) {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "trteel-ig-"));

  try {
    const formData = await req.formData();
    const videoFile = formData.get("video") as Blob;
    const fileName = (formData.get("filename") as string) || "instagram-story.mp4";

    if (!videoFile) {
      return NextResponse.json({ error: "Missing video file" }, { status: 400 });
    }

    const inputPath = path.join(tempDir, "input.mp4");
    const outputPath = path.join(tempDir, "output.mp4");

    await fs.writeFile(inputPath, Buffer.from(await videoFile.arrayBuffer()));

    const ffmpegPath = getFFmpegPath();

    // Re-encode for Instagram Story / Post compatibility:
    // - H.264 Baseline Profile, Level 4.1
    //   Level 3.0 was WRONG — it only supports ~360p@30fps.
    //   1080×1920 @ 30fps needs Level 4.0+ (243k macroblocks/s).
    //   Instagram encodes/decodes assume Level 4.1, so an incorrect
    //   level header causes it to silently reject the video (infinite loading).
    // - yuv420p: required pixel format for Instagram
    // - scale filter: guarantees even dimensions (yuv420p requires width & height
    //   to be divisible by 2 — odd canvas sizes would make FFmpeg error out)
    // - movflags +faststart: moov atom at front of file (Instagram requirement)
    // - AAC 128 kbps, 44100 Hz, stereo: standard audio
    const ffmpegCmd =
      `"${ffmpegPath}" -y -i "${inputPath}" ` +
      `-c:v libx264 -preset fast -profile:v baseline -level 4.1 ` +
      `-vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" -pix_fmt yuv420p ` +
      `-c:a aac -b:a 128k -ar 44100 -ac 2 ` +
      `-movflags +faststart ` +
      `"${outputPath}"`;

    // maxBuffer=500 MB to handle large HD video output from ffmpeg
    await execAsync(ffmpegCmd, { maxBuffer: 1024 * 1024 * 500, timeout: 280000 });

    const outputBuffer = await fs.readFile(outputPath);
    await fs.rm(tempDir, { recursive: true, force: true });

    return new NextResponse(outputBuffer, {
      headers: {
        "Content-Type": "video/mp4",
        "Content-Disposition": `attachment; filename="${fileName}"`,
      },
    });
  } catch (error: any) {
    console.error("Instagram fix error:", error);
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
