import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, mkdirSync, rmSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';

describe('config serialization', () => {
  const testDir = join(tmpdir(), `agentkvm-test-${Date.now()}`);
  const testFile = join(testDir, 'config.json');

  beforeEach(() => {
    if (!existsSync(testDir)) {
      mkdirSync(testDir, { recursive: true });
    }
  });

  afterEach(() => {
    if (existsSync(testDir)) {
      rmSync(testDir, { recursive: true, force: true });
    }
  });

  it('should write and read config as valid JSON', () => {
    const config = {
      serialPort: '/dev/tty.usbmodem1101',
      baudRate: 57600,
      resolution: { width: 1920, height: 1080 },
      videoDevice: '0',
      outputDir: '/tmp/screenshots'
    };

    writeFileSync(testFile, JSON.stringify(config, null, 2) + '\n');

    const raw = readFileSync(testFile, 'utf-8');
    const parsed = JSON.parse(raw);

    expect(parsed.serialPort).toBe('/dev/tty.usbmodem1101');
    expect(parsed.baudRate).toBe(57600);
    expect(parsed.resolution).toEqual({ width: 1920, height: 1080 });
    expect(parsed.videoDevice).toBe('0');
    expect(parsed.outputDir).toBe('/tmp/screenshots');
  });

  it('should handle config with crop viewport', () => {
    const config = {
      serialPort: '/dev/tty.usbmodem1101',
      resolution: { width: 1920, height: 1080 },
      crop: { x: 656, y: 0, width: 607, height: 1080 }
    };

    writeFileSync(testFile, JSON.stringify(config, null, 2) + '\n');

    const raw = readFileSync(testFile, 'utf-8');
    const parsed = JSON.parse(raw);

    expect(parsed.crop).toEqual({ x: 656, y: 0, width: 607, height: 1080 });
  });

  it('should handle empty config', () => {
    writeFileSync(testFile, JSON.stringify({}, null, 2) + '\n');

    const raw = readFileSync(testFile, 'utf-8');
    const parsed = JSON.parse(raw);

    expect(parsed).toEqual({});
  });

  it('should detect non-existent file', () => {
    const nonExistent = join(testDir, 'nonexistent.json');
    expect(existsSync(nonExistent)).toBe(false);
  });

  it('should handle invalid JSON gracefully', () => {
    writeFileSync(testFile, 'not valid json{{{');

    const raw = readFileSync(testFile, 'utf-8');
    let parsed = {};
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = {};
    }

    expect(parsed).toEqual({});
  });

  it('should preserve all config fields through serialization', () => {
    const config = {
      serialPort: '/dev/tty.usbmodem1101',
      baudRate: 115200,
      resolution: { width: 3840, height: 2160 },
      videoDevice: '1',
      outputDir: '/home/user/screenshots',
      crop: { x: 100, y: 200, width: 800, height: 600 }
    };

    writeFileSync(testFile, JSON.stringify(config, null, 2) + '\n');

    const raw = readFileSync(testFile, 'utf-8');
    const parsed = JSON.parse(raw);

    expect(parsed).toEqual(config);
  });
});
