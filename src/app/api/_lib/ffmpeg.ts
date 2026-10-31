import { execFile } from "child_process";
import path from "path";
import ffmpeg from "ffmpeg-static";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

/** Absolute path of the bundled ffmpeg binary, resolved for the Next.js server. */
export const getFFmpegPath = (): string => {
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

/**
 * Runs ffmpeg with an argument list. No shell is involved, so values sent by
 * the browser can never be run as commands.
 */
export const runFFmpeg = (args: string[], options: { timeout?: number } = {}) =>
  execFileAsync(getFFmpegPath(), args, {
    maxBuffer: 1024 * 1024 * 500,
    timeout: options.timeout,
  });

/** `attachment` header value that is safe for any file name (Arabic included). */
export const attachmentHeader = (fileName: string): string => {
  const ascii = fileName.replace(/[^\x20-\x7E]/g, "_").replace(/["\\]/g, "_") || "video.mp4";
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
};

/** Message of an unknown error value. */
export const errorMessage = (error: unknown): string =>
  error instanceof Error ? error.message : String(error);
