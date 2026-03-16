import { Command } from 'commander';
import { loadConfig, saveConfig } from '../config/index.js';
import {
  getAllProfiles, getProfile, isBuiltinProfile,
  type CoordinateMode, type DeviceProfile
} from '../config/profiles.js';
import { printError, printSuccess } from '../utils/output.js';

export function registerDeviceCommand(program: Command): void {
  const deviceCmd = program
    .command('device')
    .description('Manage device profiles');

  // --- set ---
  deviceCmd
    .command('set <type>')
    .description('Set the active device type (e.g., iphone, pc, android, mac, linux)')
    .action((type: string) => {
      const config = loadConfig();
      const profile = getProfile(type, config.customProfiles);
      if (!profile) {
        const all = Object.keys(getAllProfiles(config.customProfiles));
        printError(`Unknown device type "${type}". Available: ${all.join(', ')}`);
        return;
      }

      config.deviceType = type.toLowerCase();
      saveConfig(config);
      printSuccess(`Device type set to "${type}" (${profile.coordinateMode} mode)`);
    });

  // --- list ---
  deviceCmd
    .command('list')
    .description('List all available device profiles')
    .action(() => {
      const config = loadConfig();
      const profiles = getAllProfiles(config.customProfiles);
      const active = config.deviceType;

      const result = Object.entries(profiles).map(([key, p]) => ({
        type: key,
        name: p.name,
        coordinateMode: p.coordinateMode,
        description: p.description,
        active: key === active,
        builtin: isBuiltinProfile(key)
      }));

      printSuccess(result);
    });

  // --- info ---
  deviceCmd
    .command('info')
    .description('Show current device configuration')
    .action(() => {
      const config = loadConfig();
      const deviceType = config.deviceType || '(not set, defaults to device mode)';
      const profile = config.deviceType
        ? getProfile(config.deviceType, config.customProfiles)
        : undefined;

      printSuccess({
        deviceType,
        coordinateMode: profile?.coordinateMode ?? 'device',
        profile: profile ? { name: profile.name, description: profile.description } : null,
        resolution: config.resolution || { width: 1920, height: 1080 },
        crop: config.crop || null,
        serialPort: config.serialPort || null
      });
    });

  // --- add ---
  deviceCmd
    .command('add <name>')
    .description('Add a custom device profile')
    .requiredOption('--mode <mode>', 'coordinate mode: device or frame')
    .option('--description <text>', 'profile description', '')
    .action((name: string, opts: { mode: string; description: string }) => {
      if (opts.mode !== 'device' && opts.mode !== 'frame') {
        printError('Mode must be "device" or "frame"');
        return;
      }

      const key = name.toLowerCase();
      if (isBuiltinProfile(key)) {
        printError(`Cannot override built-in profile "${key}"`);
        return;
      }

      const config = loadConfig();
      if (!config.customProfiles) {
        config.customProfiles = {};
      }

      config.customProfiles[key] = {
        name,
        coordinateMode: opts.mode as CoordinateMode,
        description: opts.description || `Custom profile: ${name}`
      };

      saveConfig(config);
      printSuccess(`Added custom profile "${name}" (${opts.mode} mode)`);
    });

  // --- remove ---
  deviceCmd
    .command('remove <name>')
    .description('Remove a custom device profile')
    .action((name: string) => {
      const key = name.toLowerCase();

      if (isBuiltinProfile(key)) {
        printError(`Cannot remove built-in profile "${key}"`);
        return;
      }

      const config = loadConfig();
      if (!config.customProfiles?.[key]) {
        printError(`Custom profile "${name}" not found`);
        return;
      }

      delete config.customProfiles[key];
      if (config.deviceType === key) {
        delete config.deviceType;
      }
      saveConfig(config);
      printSuccess(`Removed custom profile "${name}"`);
    });
}
