import { IncomingMessage, ServerResponse } from 'node:http';

export function authenticate(req: IncomingMessage, token: string | undefined): boolean {
  if (!token) return true;
  const header = req.headers['authorization'];
  if (!header) return false;
  return header === `Bearer ${token}`;
}

export async function parseBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on('data', (chunk: Buffer) => chunks.push(chunk));
    req.on('end', () => {
      const raw = Buffer.concat(chunks).toString();
      if (!raw) {
        resolve(undefined);
        return;
      }
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error('Invalid JSON body'));
      }
    });
    req.on('error', reject);
  });
}

export function sendJson(res: ServerResponse, status: number, data: unknown): void {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(body)
  });
  res.end(body);
}

export function sendSuccess(res: ServerResponse, data?: unknown): void {
  sendJson(res, 200, { success: true, data });
}

export function sendError(res: ServerResponse, status: number, error: string): void {
  sendJson(res, status, { success: false, error });
}
