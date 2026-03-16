import { join, resolve } from 'node:path';
import { Command } from 'commander';
import { captureScreenshot, listVideoDevices } from '../capture/screenshot.js';
import { getCrop, getRemote, getResolution } from './helpers.js';
import { isJsonMode, printError, printSuccess } from '../utils/output.js';
import { loadConfig } from '../config/index.js';
import { remoteScreenshotImage, remoteScreenshotJson } from '../remote/client.js';

export function registerScreenshotCommand(program: Command): void {
  program
    .command('screenshot')
    .description('Capture a screenshot from the USB video device')
    .option('--device <id>', 'video device index or path')
    .option('--output <dir>', 'output directory')
    .option('--list-devices', 'list available video devices')
    .action(async (opts: { device?: string; output?: string; listDevices?: boolean }) => {
      if (opts.listDevices) {
        try {
          const devices = listVideoDevices();
          printSuccess(devices);
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          printError(`Failed to list video devices: ${msg}`);
        }
        return;
      }

      const remote = getRemote(program);
      if (remote) {
        try {
          if (isJsonMode()) {
            const res = await remoteScreenshotJson(remote);
            printSuccess(res.data);
          } else {
            const outputDir = opts.output || process.cwd();
            const filename = `screenshot-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.png`;
            const outputPath = resolve(join(outputDir, filename));
            await remoteScreenshotImage(remote, outputPath);
            console.log(outputPath);
          }
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          printError(`Remote error: ${msg}`);
        }
        return;
      }

      try {
        const config = loadConfig();
        const res = getResolution(program);
        const crop = getCrop(program);
        const resolution = `${res.width}x${res.height}`;

        const path = captureScreenshot({
          device: opts.device || config.videoDevice,
          resolution,
          outputDir: opts.output || config.outputDir,
          crop
        });

        if (isJsonMode()) {
          const data: Record<string, unknown> = {
            path,
            fullResolution: resolution
          };
          if (crop) {
            data.crop = crop;
            data.imageSize = `${crop.width}x${crop.height}`;
          }
          printSuccess(data);
        } else {
          console.log(path);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        printError(`Failed to capture screenshot: ${msg}`);
      }
    });
}
