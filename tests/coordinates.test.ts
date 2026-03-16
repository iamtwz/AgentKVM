import { describe, it, expect } from 'vitest';
import { pixelToNormalized, normalizedToAbsolute } from '../src/utils/coordinates.js';

describe('pixelToNormalized', () => {
  describe('without crop', () => {
    it('should normalize center of 1920x1080 to (0.5, 0.5)', () => {
      const result = pixelToNormalized(960, 540, 1920, 1080);
      expect(result.x).toBeCloseTo(0.5);
      expect(result.y).toBeCloseTo(0.5);
    });

    it('should normalize origin to (0, 0)', () => {
      const result = pixelToNormalized(0, 0, 1920, 1080);
      expect(result.x).toBe(0);
      expect(result.y).toBe(0);
    });

    it('should normalize bottom-right to (1, 1)', () => {
      const result = pixelToNormalized(1920, 1080, 1920, 1080);
      expect(result.x).toBe(1);
      expect(result.y).toBe(1);
    });

    it('should clamp values exceeding resolution to 1', () => {
      const result = pixelToNormalized(3000, 2000, 1920, 1080);
      expect(result.x).toBe(1);
      expect(result.y).toBe(1);
    });

    it('should clamp negative values to 0', () => {
      const result = pixelToNormalized(-100, -50, 1920, 1080);
      expect(result.x).toBe(0);
      expect(result.y).toBe(0);
    });

    it('should handle quarter position', () => {
      const result = pixelToNormalized(480, 270, 1920, 1080);
      expect(result.x).toBeCloseTo(0.25);
      expect(result.y).toBeCloseTo(0.25);
    });
  });

  describe('with crop (device screen mapping)', () => {
    // iPhone scenario: 1920x1080 frame, iPhone screen at x=738, 447x970
    const crop = { x: 738, y: 55, width: 447, height: 970 };

    it('should map crop center to normalized (0.5, 0.5)', () => {
      // Center of 447x970 cropped image = (223, 485)
      // Maps to center of device screen = (0.5, 0.5)
      const result = pixelToNormalized(223, 485, 1920, 1080, crop);
      expect(result.x).toBeCloseTo(223 / 447, 3);
      expect(result.y).toBeCloseTo(485 / 970, 3);
    });

    it('should map crop origin (0,0) to normalized (0,0)', () => {
      const result = pixelToNormalized(0, 0, 1920, 1080, crop);
      expect(result.x).toBe(0);
      expect(result.y).toBe(0);
    });

    it('should map crop bottom-right to normalized (1,1)', () => {
      const result = pixelToNormalized(447, 970, 1920, 1080, crop);
      expect(result.x).toBe(1);
      expect(result.y).toBe(1);
    });

    it('should map crop left edge to abs 0', () => {
      const result = pixelToNormalized(0, 485, 1920, 1080, crop);
      const abs = normalizedToAbsolute(result.x, result.y);
      expect(abs.x).toBe(0);
    });

    it('should map crop right edge to abs 4096', () => {
      const result = pixelToNormalized(447, 485, 1920, 1080, crop);
      const abs = normalizedToAbsolute(result.x, result.y);
      expect(abs.x).toBe(4096);
    });

    it('should handle wider crop (e.g., 607x1080)', () => {
      const wideCrop = { x: 656, y: 0, width: 607, height: 1080 };
      const result = pixelToNormalized(303, 540, 1920, 1080, wideCrop);
      expect(result.x).toBeCloseTo(303 / 607, 3);
      expect(result.y).toBeCloseTo(0.5);
    });

    it('should clamp if pixel exceeds crop dimensions', () => {
      const result = pixelToNormalized(2000, 2000, 1920, 1080, crop);
      expect(result.x).toBe(1);
      expect(result.y).toBe(1);
    });

    it('should clamp negative pixel values to 0', () => {
      const result = pixelToNormalized(-10, -10, 1920, 1080, crop);
      expect(result.x).toBe(0);
      expect(result.y).toBe(0);
    });
  });
});

describe('normalizedToAbsolute', () => {
  it('should map (0, 0) to absolute (0, 0)', () => {
    const result = normalizedToAbsolute(0, 0);
    expect(result.x).toBe(0);
    expect(result.y).toBe(0);
  });

  it('should map (1, 1) to absolute (4096, 4096)', () => {
    const result = normalizedToAbsolute(1, 1);
    expect(result.x).toBe(4096);
    expect(result.y).toBe(4096);
  });

  it('should map (0.5, 0.5) to absolute (2048, 2048)', () => {
    const result = normalizedToAbsolute(0.5, 0.5);
    expect(result.x).toBe(2048);
    expect(result.y).toBe(2048);
  });

  it('should map (0.25, 0.75) to (1024, 3072)', () => {
    const result = normalizedToAbsolute(0.25, 0.75);
    expect(result.x).toBe(1024);
    expect(result.y).toBe(3072);
  });

  it('should clamp values above 1', () => {
    const result = normalizedToAbsolute(1.5, 2.0);
    expect(result.x).toBe(4096);
    expect(result.y).toBe(4096);
  });

  it('should clamp negative values to 0', () => {
    const result = normalizedToAbsolute(-0.5, -1.0);
    expect(result.x).toBe(0);
    expect(result.y).toBe(0);
  });

  it('should floor fractional results', () => {
    // 0.1 * 4096 = 409.6 -> floor = 409
    const result = normalizedToAbsolute(0.1, 0.1);
    expect(result.x).toBe(409);
    expect(result.y).toBe(409);
  });
});

describe('end-to-end coordinate pipeline', () => {
  it('should correctly convert pixel -> normalized -> absolute for center of screen', () => {
    const norm = pixelToNormalized(960, 540, 1920, 1080);
    const abs = normalizedToAbsolute(norm.x, norm.y);
    expect(abs.x).toBe(2048);
    expect(abs.y).toBe(2048);
  });

  it('should correctly convert with crop for iPhone scenario', () => {
    const crop = { x: 738, y: 55, width: 447, height: 970 };
    // AI clicks center of cropped image: (223, 485)
    // With device mapping: norm = pixel / crop_size
    const norm = pixelToNormalized(223, 485, 1920, 1080, crop);
    const abs = normalizedToAbsolute(norm.x, norm.y);

    // norm_x = 223/447 ≈ 0.4989, abs_x = floor(0.4989 * 4096) = 2043
    expect(abs.x).toBe(Math.floor((223 / 447) * 4096));
    // norm_y = 485/970 = 0.5, abs_y = 2048
    expect(abs.y).toBe(2048);
  });

  it('should map crop edges to full HID range', () => {
    const crop = { x: 738, y: 55, width: 447, height: 970 };

    // Left edge -> abs 0
    const left = pixelToNormalized(0, 485, 1920, 1080, crop);
    expect(normalizedToAbsolute(left.x, left.y).x).toBe(0);

    // Right edge -> abs 4096
    const right = pixelToNormalized(447, 485, 1920, 1080, crop);
    expect(normalizedToAbsolute(right.x, right.y).x).toBe(4096);
  });
});
