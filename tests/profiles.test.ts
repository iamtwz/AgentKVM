import { describe, it, expect } from 'vitest';
import {
  getProfile, getAllProfiles, resolveCoordinateMode,
  isBuiltinProfile, getBuiltinProfiles, type DeviceProfile
} from '../src/config/profiles.js';

describe('getBuiltinProfiles', () => {
  it('should include all 5 built-in profiles', () => {
    const profiles = getBuiltinProfiles();
    expect(Object.keys(profiles)).toEqual(
      expect.arrayContaining(['iphone', 'android', 'pc', 'mac', 'linux'])
    );
    expect(Object.keys(profiles).length).toBe(5);
  });
});

describe('getProfile', () => {
  it('should return iphone profile', () => {
    const p = getProfile('iphone');
    expect(p).toBeDefined();
    expect(p!.name).toBe('iPhone');
    expect(p!.coordinateMode).toBe('device');
  });

  it('should return pc profile', () => {
    const p = getProfile('pc');
    expect(p).toBeDefined();
    expect(p!.coordinateMode).toBe('frame');
  });

  it('should be case-insensitive', () => {
    expect(getProfile('iPhone')).toBeDefined();
    expect(getProfile('IPHONE')).toBeDefined();
    expect(getProfile('iphone')).toBeDefined();
  });

  it('should return undefined for unknown type', () => {
    expect(getProfile('nintendo')).toBeUndefined();
  });

  it('should return undefined for undefined input', () => {
    expect(getProfile(undefined)).toBeUndefined();
  });

  it('should prioritize custom profiles over built-in', () => {
    const custom: Record<string, DeviceProfile> = {
      iphone: {
        name: 'Custom iPhone',
        coordinateMode: 'frame',
        description: 'Overridden'
      }
    };
    const p = getProfile('iphone', custom);
    expect(p!.name).toBe('Custom iPhone');
    expect(p!.coordinateMode).toBe('frame');
  });

  it('should resolve custom profile not in built-in', () => {
    const custom: Record<string, DeviceProfile> = {
      steamdeck: {
        name: 'Steam Deck',
        coordinateMode: 'device',
        description: 'Handheld gaming'
      }
    };
    const p = getProfile('steamdeck', custom);
    expect(p).toBeDefined();
    expect(p!.name).toBe('Steam Deck');
  });
});

describe('getAllProfiles', () => {
  it('should merge custom and built-in profiles', () => {
    const custom: Record<string, DeviceProfile> = {
      steamdeck: { name: 'Steam Deck', coordinateMode: 'device', description: 'test' }
    };
    const all = getAllProfiles(custom);
    expect(all['iphone']).toBeDefined();
    expect(all['steamdeck']).toBeDefined();
    expect(Object.keys(all).length).toBe(6);
  });

  it('should work with no custom profiles', () => {
    const all = getAllProfiles();
    expect(Object.keys(all).length).toBe(5);
  });
});

describe('resolveCoordinateMode', () => {
  it('should return "device" for iphone', () => {
    expect(resolveCoordinateMode('iphone')).toBe('device');
  });

  it('should return "device" for android', () => {
    expect(resolveCoordinateMode('android')).toBe('device');
  });

  it('should return "frame" for pc', () => {
    expect(resolveCoordinateMode('pc')).toBe('frame');
  });

  it('should return "frame" for mac', () => {
    expect(resolveCoordinateMode('mac')).toBe('frame');
  });

  it('should return "frame" for linux', () => {
    expect(resolveCoordinateMode('linux')).toBe('frame');
  });

  it('should default to "device" for unknown type', () => {
    expect(resolveCoordinateMode('unknown')).toBe('device');
  });

  it('should default to "device" for undefined', () => {
    expect(resolveCoordinateMode(undefined)).toBe('device');
  });
});

describe('isBuiltinProfile', () => {
  it('should return true for built-in profiles', () => {
    expect(isBuiltinProfile('iphone')).toBe(true);
    expect(isBuiltinProfile('pc')).toBe(true);
    expect(isBuiltinProfile('mac')).toBe(true);
    expect(isBuiltinProfile('linux')).toBe(true);
    expect(isBuiltinProfile('android')).toBe(true);
  });

  it('should return false for non-built-in profiles', () => {
    expect(isBuiltinProfile('steamdeck')).toBe(false);
    expect(isBuiltinProfile('custom')).toBe(false);
  });
});
