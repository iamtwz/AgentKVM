import { createServer } from 'node:http';
import { Device } from '../protocol/device.js';
import { SerialQueue } from './queue.js';
import { authenticate, sendError } from './router.js';
import { createHandlers } from './handlers.js';
import type { Viewport } from '../config/index.js';
import type { CoordinateMode } from '../config/profiles.js';

export interface ServerConfig {
  host: string;
  port: number;
  token?: string;
  serialPort: string;
  baudRate?: number;
  resolution: { width: number; height: number };
  crop?: Viewport;
  coordinateMode: CoordinateMode;
  videoDevice?: string;
  outputDir?: string;
}

export async function startServer(config: ServerConfig): Promise<void> {
  const device = new Device();
  const queue = new SerialQueue();

  // Establish persistent serial connection
  await device.connect(config.serialPort, config.baudRate);
  console.log(`Connected to device on ${config.serialPort}`);

  const handlers = createHandlers(device, queue, config);

  const server = createServer(async (req, res) => {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

    if (req.method === 'OPTIONS') {
      res.writeHead(204);
      res.end();
      return;
    }

    // Authentication
    if (!authenticate(req, config.token)) {
      sendError(res, 401, 'Unauthorized');
      return;
    }

    // Route matching
    const url = new URL(req.url || '/', `http://${req.headers.host}`);
    const routeKey = `${req.method} ${url.pathname}`;
    const handler = handlers[routeKey];

    if (!handler) {
      sendError(res, 404, `Not found: ${req.method} ${url.pathname}`);
      return;
    }

    try {
      await handler(req, res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      sendError(res, 500, msg);
    }
  });

  // Graceful shutdown
  const shutdown = async () => {
    console.log('\nShutting down...');
    server.close();
    await device.disconnect();
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  server.listen(config.port, config.host, () => {
    console.log(`AgentKVM server listening on http://${config.host}:${config.port}`);
    if (config.token) {
      console.log('Authentication: Bearer token required');
    } else {
      console.log('Authentication: disabled (no --token set)');
    }
    console.log(`Device: ${config.serialPort}`);
    console.log(`Resolution: ${config.resolution.width}x${config.resolution.height}`);
    if (config.crop) {
      console.log(`Crop: ${config.crop.x},${config.crop.y},${config.crop.width},${config.crop.height}`);
    }
  });
}
