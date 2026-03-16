import { request } from 'node:http';
import { request as httpsRequest } from 'node:https';
import { writeFileSync } from 'node:fs';
import { URL } from 'node:url';

export interface RemoteConfig {
  baseUrl: string;
  token?: string;
}

interface RemoteResponse {
  success: boolean;
  data?: unknown;
  error?: string;
}

function normalizeBaseUrl(baseUrl: string): string {
  return baseUrl.replace(/\/+$/, '');
}

function doRequest(
  method: string,
  url: string,
  token?: string,
  body?: unknown
): Promise<{ status: number; data: Buffer }> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const isHttps = parsed.protocol === 'https:';
    const requester = isHttps ? httpsRequest : request;

    const bodyStr = body !== undefined ? JSON.stringify(body) : undefined;

    const req = requester(
      url,
      {
        method,
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...(bodyStr ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(bodyStr).toString() } : {})
        }
      },
      (res) => {
        const chunks: Buffer[] = [];
        res.on('data', (chunk: Buffer) => chunks.push(chunk));
        res.on('end', () => {
          resolve({ status: res.statusCode || 0, data: Buffer.concat(chunks) });
        });
      }
    );

    req.on('error', reject);

    if (bodyStr) {
      req.write(bodyStr);
    }
    req.end();
  });
}

async function jsonRequest(
  method: string,
  remote: RemoteConfig,
  path: string,
  body?: unknown
): Promise<RemoteResponse> {
  const url = `${normalizeBaseUrl(remote.baseUrl)}${path}`;
  const { status, data } = await doRequest(method, url, remote.token, body);

  if (status === 401) {
    throw new Error('Authentication failed. Check your --token.');
  }

  const text = data.toString();
  try {
    return JSON.parse(text) as RemoteResponse;
  } catch {
    throw new Error(`Server returned non-JSON (status ${status}): ${text.slice(0, 200)}`);
  }
}

async function rawRequest(
  method: string,
  remote: RemoteConfig,
  path: string
): Promise<Buffer> {
  const url = `${normalizeBaseUrl(remote.baseUrl)}${path}`;
  const { status, data } = await doRequest(method, url, remote.token);

  if (status === 401) {
    throw new Error('Authentication failed. Check your --token.');
  }
  if (status !== 200) {
    throw new Error(`Server error (status ${status}): ${data.toString().slice(0, 200)}`);
  }

  return data;
}

// --- API client functions ---

export async function remoteInfo(remote: RemoteConfig): Promise<RemoteResponse> {
  return jsonRequest('GET', remote, '/api/info');
}

export async function remoteStatus(remote: RemoteConfig): Promise<RemoteResponse> {
  return jsonRequest('GET', remote, '/api/status');
}

export async function remoteScreenshotJson(remote: RemoteConfig): Promise<RemoteResponse> {
  return jsonRequest('GET', remote, '/api/screenshot?format=json');
}

export async function remoteScreenshotImage(
  remote: RemoteConfig,
  outputPath: string
): Promise<string> {
  const data = await rawRequest('GET', remote, '/api/screenshot?format=image');
  writeFileSync(outputPath, data);
  return outputPath;
}

export async function remoteType(
  remote: RemoteConfig,
  text: string,
  delay?: number
): Promise<RemoteResponse> {
  return jsonRequest('POST', remote, '/api/type', { text, delay });
}

export async function remoteKey(
  remote: RemoteConfig,
  combo: string,
  hold?: number
): Promise<RemoteResponse> {
  return jsonRequest('POST', remote, '/api/key', { combo, hold });
}

export async function remoteMouseMove(
  remote: RemoteConfig,
  x: number,
  y: number
): Promise<RemoteResponse> {
  return jsonRequest('POST', remote, '/api/mouse/move', { x, y });
}

export async function remoteMouseClick(
  remote: RemoteConfig,
  x: number,
  y: number,
  button?: string,
  double?: boolean
): Promise<RemoteResponse> {
  return jsonRequest('POST', remote, '/api/mouse/click', { x, y, button, double });
}

export async function remoteMouseScroll(
  remote: RemoteConfig,
  x: number,
  y: number,
  delta: number
): Promise<RemoteResponse> {
  return jsonRequest('POST', remote, '/api/mouse/scroll', { x, y, delta });
}

export async function remoteMouseDrag(
  remote: RemoteConfig,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  button?: string,
  steps?: number
): Promise<RemoteResponse> {
  return jsonRequest('POST', remote, '/api/mouse/drag', { x1, y1, x2, y2, button, steps });
}
