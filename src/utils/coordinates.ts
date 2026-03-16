import type { Viewport } from '../config/index.js';
import type { CoordinateMode } from '../config/profiles.js';

const MAX_ABS_COORD = 4096;

export function pixelToNormalized(
  pixelX: number,
  pixelY: number,
  resWidth: number,
  resHeight: number,
  crop?: Viewport,
  coordinateMode: CoordinateMode = 'device'
): { x: number; y: number } {
  if (crop) {
    if (coordinateMode === 'device') {
      // "device" mode (iPhone/Android): the crop region IS the target device's
      // full screen. HID 0-4096 maps to the device's own screen, so normalize
      // AI pixel coordinates against crop dimensions directly.
      return {
        x: Math.max(0, Math.min(1, pixelX / crop.width)),
        y: Math.max(0, Math.min(1, pixelY / crop.height))
      };
    }

    // "frame" mode (PC/Mac/Linux): crop is just a visual focus area. HID 0-4096
    // maps to the full monitor. Translate AI pixel coordinates back to full-frame
    // coordinates, then normalize against the full resolution.
    return {
      x: Math.max(0, Math.min(1, (crop.x + pixelX) / resWidth)),
      y: Math.max(0, Math.min(1, (crop.y + pixelY) / resHeight))
    };
  }

  // No crop: normalize against full frame resolution
  return {
    x: Math.max(0, Math.min(1, pixelX / resWidth)),
    y: Math.max(0, Math.min(1, pixelY / resHeight))
  };
}

export function normalizedToAbsolute(normX: number, normY: number): { x: number; y: number } {
  return {
    x: Math.floor(Math.max(0, Math.min(1, normX)) * MAX_ABS_COORD),
    y: Math.floor(Math.max(0, Math.min(1, normY)) * MAX_ABS_COORD)
  };
}
