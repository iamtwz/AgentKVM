export type CoordinateMode = 'device' | 'frame';

export interface DeviceProfile {
  name: string;
  coordinateMode: CoordinateMode;
  description: string;
  defaultResolution?: { width: number; height: number };
}

const BUILTIN_PROFILES: Record<string, DeviceProfile> = {
  iphone: {
    name: 'iPhone',
    coordinateMode: 'device',
    description: 'iOS device via HDMI mirror'
  },
  android: {
    name: 'Android',
    coordinateMode: 'device',
    description: 'Android device via HDMI mirror'
  },
  pc: {
    name: 'PC',
    coordinateMode: 'frame',
    description: 'PC/Windows target',
    defaultResolution: { width: 1920, height: 1080 }
  },
  mac: {
    name: 'Mac',
    coordinateMode: 'frame',
    description: 'macOS target',
    defaultResolution: { width: 1920, height: 1080 }
  },
  linux: {
    name: 'Linux',
    coordinateMode: 'frame',
    description: 'Linux target',
    defaultResolution: { width: 1920, height: 1080 }
  }
};

export function getBuiltinProfiles(): Record<string, DeviceProfile> {
  return { ...BUILTIN_PROFILES };
}

export function getAllProfiles(
  customProfiles?: Record<string, DeviceProfile>
): Record<string, DeviceProfile> {
  return { ...BUILTIN_PROFILES, ...(customProfiles || {}) };
}

export function getProfile(
  deviceType: string | undefined,
  customProfiles?: Record<string, DeviceProfile>
): DeviceProfile | undefined {
  if (!deviceType) return undefined;

  const key = deviceType.toLowerCase();

  // Custom profiles take priority
  if (customProfiles?.[key]) {
    return customProfiles[key];
  }

  return BUILTIN_PROFILES[key];
}

export function resolveCoordinateMode(
  deviceType: string | undefined,
  customProfiles?: Record<string, DeviceProfile>
): CoordinateMode {
  const profile = getProfile(deviceType, customProfiles);
  // Default to "device" mode for backward compatibility
  return profile?.coordinateMode ?? 'device';
}

export function isBuiltinProfile(name: string): boolean {
  return name.toLowerCase() in BUILTIN_PROFILES;
}
