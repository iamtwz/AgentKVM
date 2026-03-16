import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import type { DeviceProfile } from './profiles.js';

export interface Viewport {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface AgentKVMConfig {
  serialPort?: string;
  baudRate?: number;
  resolution?: { width: number; height: number };
  videoDevice?: string;
  outputDir?: string;
  crop?: Viewport;
  deviceType?: string;
  customProfiles?: Record<string, DeviceProfile>;
  serverHost?: string;
  serverPort?: number;
  serverToken?: string;
  remoteUrl?: string;
  remoteToken?: string;
}

const DEFAULT_RESOLUTION = { width: 1920, height: 1080 };

const CONFIG_DIR = join(homedir(), '.config', 'agentkvm');
const CONFIG_FILE = join(CONFIG_DIR, 'config.json');

// Legacy path for migration
const LEGACY_CONFIG_DIR = join(homedir(), '.agentkvm');
const LEGACY_CONFIG_FILE = join(LEGACY_CONFIG_DIR, 'config.json');

let configCache: AgentKVMConfig | null = null;

export function loadConfig(): AgentKVMConfig {
  if (configCache) return configCache;

  try {
    // Try new path first, fall back to legacy
    let filePath = CONFIG_FILE;
    if (!existsSync(filePath) && existsSync(LEGACY_CONFIG_FILE)) {
      filePath = LEGACY_CONFIG_FILE;
    }

    if (existsSync(filePath)) {
      const raw = readFileSync(filePath, 'utf-8');
      configCache = JSON.parse(raw) as AgentKVMConfig;
      return configCache;
    }
  } catch {
    // Ignore parse errors, return defaults
  }
  configCache = {};
  return configCache;
}

export function clearConfigCache(): void {
  configCache = null;
}

export function saveConfig(config: AgentKVMConfig): void {
  if (!existsSync(CONFIG_DIR)) {
    mkdirSync(CONFIG_DIR, { recursive: true });
  }
  writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2) + '\n');
  configCache = config;
}

export function getConfigPath(): string {
  return CONFIG_FILE;
}

export { DEFAULT_RESOLUTION };
