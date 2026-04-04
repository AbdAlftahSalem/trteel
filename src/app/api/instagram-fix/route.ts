import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import path from "path";
import fs from "fs/promises";
import os from "os";
import ffmpeg from "ffmpeg-static";
import { promisify } from "util";

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

    // Re-encode for Instagram Story compatibility:
    // - H.264 Baseline Profile Level 3.0  → widest device support
    // - yuv420p pixel format              → required by Instagram
    // - movflags +faststart               → moov atom at file start (Instagram requirement)
    // - AAC 128 kbps, 44100 Hz            → standard audio
    const ffmpegCmd =
      `"${ffmpegPath}" -y -i "${inputPath}" ` +
      `-c:v libx264 -preset fast -profile:v baseline -level 3.0 -pix_fmt yuv420p ` +
      `-c:a aac -b:a 128k -ar 44100 -ac 2 ` +
      `-movflags +faststart ` +
      `"${outputPath}"`;

    await execAsync(ffmpegCmd, { maxBuffer: 1024 * 1024 * 10 });

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
