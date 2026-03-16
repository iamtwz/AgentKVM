import { Command } from 'commander';
import { Device } from '../protocol/device.js';
import { getRemote, getSerialPort } from './helpers.js';
import { remoteKey } from '../remote/client.js';
import { actionKey } from '../actions/index.js';
import { printError, printSuccess } from '../utils/output.js';

export function registerKeyCommand(program: Command): void {
  program
    .command('key <combo>')
    .description('Press a key combination (e.g., enter, ctrl+c, alt+f4)')
    .option('--hold <ms>', 'time to hold keys before release', '50')
    .action(async (combo: string, opts: { hold: string }) => {
      const holdMs = parseInt(opts.hold, 10) || 50;

      const remote = getRemote(program);
      if (remote) {
        try {
          const res = await remoteKey(remote, combo, holdMs);
          printSuccess(res.data);
        } catch (err: unknown) {
          printError(`Remote error: ${err instanceof Error ? err.message : String(err)}`);
        }
        return;
      }

      const device = new Device();
      try {
        await device.connect(getSerialPort(program));
        await actionKey(device, combo, holdMs);
        printSuccess(`Key pressed: ${combo}`);
      } catch (err: unknown) {
        printError(`Failed to send key: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        await device.disconnect();
      }
    });
}
