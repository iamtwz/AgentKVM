import { Command } from 'commander';
import { loadConfig, DEFAULT_RESOLUTION, type Viewport } from '../config/index.js';
import { resolveCoordinateMode, type CoordinateMode } from '../config/profiles.js';
import type { RemoteConfig } from '../remote/client.js';

export function getRemote(program: Command): RemoteConfig | undefined {
  const opts = program.opts();
  const config = loadConfig();
  const url = opts.remote || config.remoteUrl;
  if (!url) return undefined;
  return { baseUrl: url, token: opts.token || config.remoteToken };
}

export function getSerialPort(program: Command): string {
  const port = program.opts().port || loadConfig().serialPort;
  if (!port) {
    console.error('Error: No serial port specified. Use --port <path> or set it in ~/.config/agentkvm/config.json');
    process.exit(1);
  }
  return port;
}

export function getResolution(program: Command): { width: number; height: number } {
  const resStr: string = program.opts().resolution || '';
  if (resStr) {
    const [w, h] = resStr.split('x').map(Number);
    if (w > 0 && h > 0) {
      return { width: w, height: h };
    }
  }
  return loadConfig().resolution ?? DEFAULT_RESOLUTION;
}

export function getCrop(program: Command): Viewport | undefined {
  const cropStr: string | undefined = program.opts().crop;
  if (cropStr) {
    const parts = cropStr.split(',').map(Number);
    if (parts.length === 4 && parts.every((n) => !isNaN(n) && n >= 0)) {
      return { x: parts[0], y: parts[1], width: parts[2], height: parts[3] };
    }
    console.error('Error: Invalid crop format. Use --crop x,y,w,h (e.g., --crop 656,0,607,1080)');
    process.exit(1);
  }
  return loadConfig().crop;
}

export function getCoordinateMode(program: Command): CoordinateMode {
  const config = loadConfig();
  const deviceType = program.opts().deviceType || config.deviceType;
  return resolveCoordinateMode(deviceType, config.customProfiles);
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
