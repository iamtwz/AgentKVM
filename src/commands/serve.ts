import { Command } from 'commander';
import { loadConfig } from '../config/index.js';
import { getResolution, getCrop, getSerialPort, getCoordinateMode } from './helpers.js';
import { startServer, type ServerConfig } from '../server/index.js';

export function registerServeCommand(program: Command): void {
  program
    .command('serve')
    .description('Start HTTP server for remote agent access')
    .option('--host <addr>', 'bind address', '0.0.0.0')
    .option('--server-port <n>', 'HTTP port', '7070')
    .option('--token <secret>', 'authentication token (or set AGENTKVM_TOKEN env var)')
    .action(async (opts: { host: string; serverPort: string; token?: string }) => {
      try {
        const config = loadConfig();

        const serverConfig: ServerConfig = {
          host: opts.host || config.serverHost || '0.0.0.0',
          port: parseInt(opts.serverPort, 10) || config.serverPort || 7070,
          token: opts.token || process.env.AGENTKVM_TOKEN || config.serverToken,
          serialPort: getSerialPort(program),
          baudRate: config.baudRate,
          resolution: getResolution(program),
          crop: getCrop(program),
          coordinateMode: getCoordinateMode(program),
          videoDevice: config.videoDevice,
          outputDir: config.outputDir
        };

        await startServer(serverConfig);
      } catch (err: unknown) {
        console.error(`Failed to start server: ${err instanceof Error ? err.message : String(err)}`);
        process.exit(1);
      }
    });
}
