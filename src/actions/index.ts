import { Device } from '../protocol/device.js';
import { KeyboardReport } from '../hid/keyboard.js';
import { MouseAbsoluteReport, getMouseButtonBit } from '../hid/mouse.js';
import { CharCodes, ShiftChars } from '../hid/char-codes.js';
import { getModifierBit } from '../hid/keymap.js';
import { parseKeyCombo } from '../hid/key-parser.js';
import { pixelToNormalized } from '../utils/coordinates.js';
import { captureScreenshot, type ScreenshotOptions } from '../capture/screenshot.js';
import type { Viewport } from '../config/index.js';
import type { CoordinateMode } from '../config/profiles.js';

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export interface MouseContext {
  resWidth: number;
  resHeight: number;
  crop?: Viewport;
  coordinateMode?: CoordinateMode;
}

function toNorm(x: number, y: number, ctx: MouseContext) {
  return pixelToNormalized(x, y, ctx.resWidth, ctx.resHeight, ctx.crop, ctx.coordinateMode);
}

export async function actionType(device: Device, text: string, delay: number = 50): Promise<number> {
  let count = 0;
  for (const char of text) {
    const ascii = char.charCodeAt(0);
    const code = CharCodes[ascii];
    if (code === undefined) continue;

    let modifier = 0;
    if ((ascii >= 65 && ascii <= 90) || ShiftChars[ascii]) {
      modifier |= getModifierBit('ShiftLeft');
    }

    await device.sendKeyboardData([modifier, 0, code, 0, 0, 0, 0, 0]);
    await sleep(delay);
    await device.sendKeyboardData([0, 0, 0, 0, 0, 0, 0, 0]);
    count++;
  }
  return count;
}

export async function actionKey(device: Device, combo: string, holdMs: number = 50): Promise<void> {
  const keyboard = new KeyboardReport();
  const parsed = parseKeyCombo(combo);

  let report: number[] = [];
  for (const mod of parsed.modifiers) {
    report = keyboard.keyDown(mod);
  }
  for (const key of parsed.keys) {
    report = keyboard.keyDown(key);
  }

  await device.sendKeyboardData(report);
  await sleep(holdMs);
  await device.sendKeyboardData(keyboard.reset());
}

export async function actionMouseMove(
  device: Device, x: number, y: number, ctx: MouseContext
): Promise<void> {
  const norm = toNorm(x, y, ctx);
  const mouse = new MouseAbsoluteReport();
  await device.sendMouseAbsolute(mouse.buildReport(norm.x, norm.y));
}

export async function actionMouseClick(
  device: Device, x: number, y: number, ctx: MouseContext,
  button: string = 'left', double: boolean = false
): Promise<void> {
  const norm = toNorm(x, y, ctx);
  const buttonBit = getMouseButtonBit(button);
  const clicks = double ? 2 : 1;

  for (let i = 0; i < clicks; i++) {
    if (i > 0) await sleep(100);

    const mouse = new MouseAbsoluteReport();
    await device.sendMouseAbsolute(mouse.buildReport(norm.x, norm.y));
    await sleep(10);

    mouse.buttonDown(buttonBit);
    await device.sendMouseAbsolute(mouse.buildReport(norm.x, norm.y));
    await sleep(50);

    mouse.buttonUp(buttonBit);
    await device.sendMouseAbsolute(mouse.buildReport(norm.x, norm.y));
  }
}

export async function actionMouseScroll(
  device: Device, x: number, y: number, ctx: MouseContext, delta: number
): Promise<void> {
  const norm = toNorm(x, y, ctx);
  const steps = Math.abs(delta);
  const direction = delta > 0 ? 1 : -1;

  for (let i = 0; i < steps; i++) {
    const mouse = new MouseAbsoluteReport();
    await device.sendMouseAbsolute(mouse.buildReport(norm.x, norm.y, direction));
    await sleep(50);
  }
}

export async function actionMouseDrag(
  device: Device,
  x1: number, y1: number, x2: number, y2: number,
  ctx: MouseContext,
  button: string = 'left', steps: number = 20
): Promise<void> {
  const startNorm = toNorm(x1, y1, ctx);
  const endNorm = toNorm(x2, y2, ctx);
  const buttonBit = getMouseButtonBit(button);

  const mouse = new MouseAbsoluteReport();
  await device.sendMouseAbsolute(mouse.buildReport(startNorm.x, startNorm.y));
  await sleep(50);

  mouse.buttonDown(buttonBit);
  await device.sendMouseAbsolute(mouse.buildReport(startNorm.x, startNorm.y));
  await sleep(50);

  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const nx = startNorm.x + (endNorm.x - startNorm.x) * t;
    const ny = startNorm.y + (endNorm.y - startNorm.y) * t;
    await device.sendMouseAbsolute(mouse.buildReport(nx, ny));
    await sleep(25);
  }

  mouse.buttonUp(buttonBit);
  await device.sendMouseAbsolute(mouse.buildReport(endNorm.x, endNorm.y));
}

export async function actionScreenshot(options: ScreenshotOptions): Promise<string> {
  return captureScreenshot(options);
}
