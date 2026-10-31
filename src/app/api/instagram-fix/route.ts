import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs/promises";
import os from "os";
import { attachmentHeader, errorMessage, runFFmpeg } from "../_lib/ffmpeg";

// Allow up to 5 minutes for FFmpeg to process large videos.
// Without this, Vercel serverless functions time out at 10 s (hobby) / 60 s (pro default),
// which silently kills the process and leaves the browser fetch() hanging forever.
export const maxDuration = 300;
export const dynamic = "force-dynamic";

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

    // Re-encode for Instagram Story / Post compatibility:
    // - H.264 Main profile, Level 4.0
    //   Level 3.0 was WRONG — it only supports ~360p@30fps.
    //   1080×1920 @ 30fps needs Level 4.0+ (243k macroblocks/s), and an
    //   incorrect level header makes Instagram silently reject the video
    //   (infinite loading).
    // - yuv420p: required pixel format for Instagram
    // - scale filter: guarantees even dimensions (yuv420p requires width & height
    //   to be divisible by 2 — odd canvas sizes would make FFmpeg error out)
    // - movflags +faststart: moov atom at front of file (Instagram requirement)
    // - AAC 128 kbps, 44100 Hz, stereo: standard audio
    await runFFmpeg(
      [
        "-y", "-i", inputPath,
        "-map_metadata", "-1",
        "-c:v", "libx264", "-preset", "fast", "-profile:v", "main", "-level", "4.0", "-r", "30", "-g", "60",
        "-vf", "scale=trunc(iw/2)*2:trunc(ih/2)*2", "-pix_fmt", "yuv420p",
        "-color_primaries", "bt709", "-color_trc", "bt709", "-colorspace", "bt709",
        "-c:a", "aac", "-b:a", "128k", "-ar", "44100", "-ac", "2", "-profile:a", "aac_low",
        "-shortest", "-movflags", "+faststart",
        outputPath,
      ],
      { timeout: 280000 },
    );

    const outputBuffer = await fs.readFile(outputPath);
    await fs.rm(tempDir, { recursive: true, force: true });

    return new NextResponse(outputBuffer, {
      headers: {
        "Content-Type": "video/mp4",
        "Content-Disposition": attachmentHeader(fileName),
      },
    });
  } catch (error: unknown) {
    console.error("Instagram fix error:", error);
    await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 });
  }
}
