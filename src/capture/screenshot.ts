import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { platform } from 'node:os';
import { join, resolve } from 'node:path';
import type { Viewport } from '../config/index.js';

const FFMPEG_TIMEOUT = 10_000;
const DEVICE_LIST_TIMEOUT = 5_000;

function formatTimestamp(): string {
  const now = new Date();
  const pad = (n: number) => n.toString().padStart(2, '0');
  return (
    `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}-` +
    `${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
  );
}

function getStderr(err: unknown): string {
  if (err && typeof err === 'object' && 'stderr' in err) {
    const stderr = (err as { stderr: Buffer }).stderr;
    if (Buffer.isBuffer(stderr)) return stderr.toString();
  }
  return err instanceof Error ? err.message : 'Unknown error';
}

export interface ScreenshotOptions {
  device?: string;
  resolution?: string;
  outputDir?: string;
  crop?: Viewport;
}

export function captureScreenshot(options: ScreenshotOptions): string {
  const resolution = options.resolution || '1920x1080';
  const outputDir = options.outputDir || process.cwd();
  const filename = `screenshot-${formatTimestamp()}.png`;
  const outputPath = resolve(join(outputDir, filename));

  const args: string[] = [];
  const currentPlatform = platform();

  if (currentPlatform === 'darwin') {
    args.push(
      '-f', 'avfoundation',
      '-video_size', resolution,
      '-framerate', '30',
      '-i', options.device || '0'
    );
  } else {
    args.push(
      '-f', 'v4l2',
      '-video_size', resolution,
      '-i', options.device || '/dev/video0'
    );
  }

  if (options.crop) {
    const { width, height, x, y } = options.crop;
    args.push('-vf', `crop=${width}:${height}:${x}:${y}`);
  }

  args.push('-frames:v', '1', '-y', outputPath);

  try {
    execFileSync('ffmpeg', args, {
      stdio: ['pipe', 'pipe', 'pipe'],
      timeout: FFMPEG_TIMEOUT
    });
  } catch (err: unknown) {
    throw new Error(`ffmpeg capture failed: ${getStderr(err)}`);
  }

  if (!existsSync(outputPath)) {
    throw new Error('Screenshot file was not created');
  }

  return outputPath;
}

export function listVideoDevices(): string[] {
  const currentPlatform = platform();

  try {
    if (currentPlatform === 'darwin') {
      execFileSync('ffmpeg', [
        '-f', 'avfoundation', '-list_devices', 'true', '-i', ''
      ], { stdio: ['pipe', 'pipe', 'pipe'], timeout: DEVICE_LIST_TIMEOUT });
      return [];
    } else {
      const result = execFileSync('ls', ['/dev/video*'], {
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: true,
        timeout: DEVICE_LIST_TIMEOUT
      });
      return result.toString().trim().split('\n').filter(Boolean);
    }
  } catch (err: unknown) {
    // ffmpeg outputs device list to stderr even on non-zero exit
    const stderr = getStderr(err);
    if (stderr.includes('AVFoundation') || stderr.includes('video')) {
      const devices: string[] = [];
      for (const line of stderr.split('\n')) {
        const match = line.match(/\[(\d+)]\s+(.+)/);
        if (match) {
          devices.push(`[${match[1]}] ${match[2]}`);
        }
      }
      return devices.length > 0 ? devices : [stderr];
    }
    return [];
  }
}
