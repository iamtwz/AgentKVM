import { describe, it, expect } from 'vitest';
import { pixelToNormalized, normalizedToAbsolute } from '../src/utils/coordinates.js';

describe('pixelToNormalized with coordinateMode', () => {
  const crop = { x: 738, y: 55, width: 447, height: 970 };

  describe('device mode (default)', () => {
    it('should normalize against crop dimensions', () => {
      const result = pixelToNormalized(223, 485, 1920, 1080, crop, 'device');
      expect(result.x).toBeCloseTo(223 / 447, 4);
      expect(result.y).toBeCloseTo(485 / 970, 4);
    });

    it('should map crop origin to (0,0)', () => {
      const result = pixelToNormalized(0, 0, 1920, 1080, crop, 'device');
      expect(result.x).toBe(0);
      expect(result.y).toBe(0);
    });

    it('should map crop full extent to (1,1)', () => {
      const result = pixelToNormalized(447, 970, 1920, 1080, crop, 'device');
      expect(result.x).toBe(1);
      expect(result.y).toBe(1);
    });

    it('should be the default when mode is omitted', () => {
      const withMode = pixelToNormalized(223, 485, 1920, 1080, crop, 'device');
      const withDefault = pixelToNormalized(223, 485, 1920, 1080, crop);
      expect(withMode).toEqual(withDefault);
    });
  });

  describe('frame mode', () => {
    it('should normalize against full resolution with crop offset', () => {
      // pixel (223, 485) in cropped image → full frame (738+223, 55+485) = (961, 540)
      const result = pixelToNormalized(223, 485, 1920, 1080, crop, 'frame');
      expect(result.x).toBeCloseTo(961 / 1920, 4);
      expect(result.y).toBeCloseTo(540 / 1080, 4);
    });

    it('should map crop origin to crop offset on full frame', () => {
      const result = pixelToNormalized(0, 0, 1920, 1080, crop, 'frame');
      expect(result.x).toBeCloseTo(738 / 1920, 4);
      expect(result.y).toBeCloseTo(55 / 1080, 4);
    });

    it('should map crop extent to crop end on full frame', () => {
      // (447, 970) → full frame (738+447, 55+970) = (1185, 1025)
      const result = pixelToNormalized(447, 970, 1920, 1080, crop, 'frame');
      expect(result.x).toBeCloseTo(1185 / 1920, 4);
      expect(result.y).toBeCloseTo(1025 / 1080, 4);
    });

    it('should clamp if exceeds full frame', () => {
      const result = pixelToNormalized(5000, 5000, 1920, 1080, crop, 'frame');
      expect(result.x).toBe(1);
      expect(result.y).toBe(1);
    });
  });

  describe('device vs frame: center comparison', () => {
    it('device mode center should span full HID range', () => {
      // Device mode: pixel 0 → abs 0, pixel 447 → abs 4096
      const left = normalizedToAbsolute(
        ...Object.values(pixelToNormalized(0, 0, 1920, 1080, crop, 'device')) as [number, number]
      );
      const right = normalizedToAbsolute(
        ...Object.values(pixelToNormalized(447, 970, 1920, 1080, crop, 'device')) as [number, number]
      );
      expect(left.x).toBe(0);
      expect(right.x).toBe(4096);
    });

    it('frame mode center should map to partial HID range', () => {
      // Frame mode: pixel 0 → abs ~1574, pixel 447 → abs ~2527
      const left = normalizedToAbsolute(
        ...Object.values(pixelToNormalized(0, 0, 1920, 1080, crop, 'frame')) as [number, number]
      );
      const right = normalizedToAbsolute(
        ...Object.values(pixelToNormalized(447, 970, 1920, 1080, crop, 'frame')) as [number, number]
      );
      // Should NOT span 0-4096 in frame mode
      expect(left.x).toBeGreaterThan(0);
      expect(right.x).toBeLessThan(4096);
    });
  });

  describe('no crop: both modes identical', () => {
    it('should give same result regardless of mode when no crop', () => {
      const device = pixelToNormalized(960, 540, 1920, 1080, undefined, 'device');
      const frame = pixelToNormalized(960, 540, 1920, 1080, undefined, 'frame');
      expect(device).toEqual(frame);
    });
  });
});
