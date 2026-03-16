import { IncomingMessage, ServerResponse } from 'node:http';
import { readFileSync, unlinkSync } from 'node:fs';
import { Device } from '../protocol/device.js';
import { SerialQueue } from './queue.js';
import { sendSuccess, sendError, parseBody } from './router.js';
import {
  actionType, actionKey, actionMouseMove, actionMouseClick,
  actionMouseScroll, actionMouseDrag, actionScreenshot,
  type MouseContext
} from '../actions/index.js';
import type { ServerConfig } from './index.js';

type Handler = (req: IncomingMessage, res: ServerResponse) => Promise<void>;

export function createHandlers(
  device: Device,
  queue: SerialQueue,
  config: ServerConfig
): Record<string, Handler> {
  const ctx: MouseContext = {
    resWidth: config.resolution.width,
    resHeight: config.resolution.height,
    crop: config.crop,
    coordinateMode: config.coordinateMode
  };

  return {
    'GET /api/status': async (_req, res) => {
      sendSuccess(res, {
        connected: device.isConnected(),
        serialPort: config.serialPort
      });
    },

    'GET /api/info': async (_req, res) => {
      await queue.enqueue(async () => {
        const info = await device.getInfo();
        sendSuccess(res, {
          chipVersion: info.CHIP_VERSION,
          isConnected: info.IS_CONNECTED,
          numLock: info.NUM_LOCK,
          capsLock: info.CAPS_LOCK,
          scrollLock: info.SCROLL_LOCK
        });
      });
    },

    'GET /api/screenshot': async (req, res) => {
      const url = new URL(req.url || '/', `http://${req.headers.host}`);
      const format = url.searchParams.get('format') || 'image';

      try {
        const path = await actionScreenshot({
          device: config.videoDevice,
          resolution: `${config.resolution.width}x${config.resolution.height}`,
          outputDir: config.outputDir,
          crop: config.crop
        });

        if (format === 'json') {
          const data = readFileSync(path);
          const base64 = data.toString('base64');
          unlinkSync(path);
          sendSuccess(res, {
            image: base64,
            width: config.crop?.width || config.resolution.width,
            height: config.crop?.height || config.resolution.height
          });
        } else {
          const data = readFileSync(path);
          unlinkSync(path);
          res.writeHead(200, {
            'Content-Type': 'image/png',
            'Content-Length': data.length
          });
          res.end(data);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        sendError(res, 500, `Screenshot failed: ${msg}`);
      }
    },

    'POST /api/type': async (req, res) => {
      const body = await parseBody(req) as { text?: string; delay?: number } | undefined;
      if (!body?.text) {
        sendError(res, 400, 'Missing required field: text');
        return;
      }
      await queue.enqueue(async () => {
        const count = await actionType(device, body.text!, body.delay);
        sendSuccess(res, { typed: count });
      });
    },

    'POST /api/key': async (req, res) => {
      const body = await parseBody(req) as { combo?: string; hold?: number } | undefined;
      if (!body?.combo) {
        sendError(res, 400, 'Missing required field: combo');
        return;
      }
      await queue.enqueue(async () => {
        await actionKey(device, body.combo!, body.hold);
        sendSuccess(res, { combo: body.combo });
      });
    },

    'POST /api/mouse/move': async (req, res) => {
      const body = await parseBody(req) as { x?: number; y?: number } | undefined;
      if (body?.x == null || body?.y == null) {
        sendError(res, 400, 'Missing required fields: x, y');
        return;
      }
      await queue.enqueue(async () => {
        await actionMouseMove(device, body.x!, body.y!, ctx);
        sendSuccess(res, { x: body.x, y: body.y });
      });
    },

    'POST /api/mouse/click': async (req, res) => {
      const body = await parseBody(req) as { x?: number; y?: number; button?: string; double?: boolean } | undefined;
      if (body?.x == null || body?.y == null) {
        sendError(res, 400, 'Missing required fields: x, y');
        return;
      }
      await queue.enqueue(async () => {
        await actionMouseClick(device, body.x!, body.y!, ctx, body.button, body.double);
        sendSuccess(res, { x: body.x, y: body.y, button: body.button || 'left' });
      });
    },

    'POST /api/mouse/scroll': async (req, res) => {
      const body = await parseBody(req) as { x?: number; y?: number; delta?: number } | undefined;
      if (body?.x == null || body?.y == null || body?.delta == null) {
        sendError(res, 400, 'Missing required fields: x, y, delta');
        return;
      }
      await queue.enqueue(async () => {
        await actionMouseScroll(device, body.x!, body.y!, ctx, body.delta!);
        sendSuccess(res, { x: body.x, y: body.y, delta: body.delta });
      });
    },

    'POST /api/mouse/drag': async (req, res) => {
      const body = await parseBody(req) as { x1?: number; y1?: number; x2?: number; y2?: number; button?: string; steps?: number } | undefined;
      if (body?.x1 == null || body?.y1 == null || body?.x2 == null || body?.y2 == null) {
        sendError(res, 400, 'Missing required fields: x1, y1, x2, y2');
        return;
      }
      await queue.enqueue(async () => {
        await actionMouseDrag(device, body.x1!, body.y1!, body.x2!, body.y2!, ctx, body.button, body.steps);
        sendSuccess(res, { x1: body.x1, y1: body.y1, x2: body.x2, y2: body.y2 });
      });
    }
  };
}
