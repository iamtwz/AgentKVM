import { Command } from 'commander';
import { Device } from '../protocol/device.js';
import { getRemote, getSerialPort } from './helpers.js';
import { remoteType } from '../remote/client.js';
import { actionType } from '../actions/index.js';
import { printError, printSuccess } from '../utils/output.js';

export function registerTypeCommand(program: Command): void {
  program
    .command('type <text>')
    .description('Type a text string character by character')
    .option('--delay <ms>', 'delay between keystrokes in ms', '50')
    .action(async (text: string, opts: { delay: string }) => {
      const delayMs = parseInt(opts.delay, 10) || 50;

      const remote = getRemote(program);
      if (remote) {
        try {
          const res = await remoteType(remote, text, delayMs);
          printSuccess(res.data);
        } catch (err: unknown) {
          printError(`Remote error: ${err instanceof Error ? err.message : String(err)}`);
        }
        return;
      }

      const device = new Device();
      try {
        await device.connect(getSerialPort(program));
        const count = await actionType(device, text, delayMs);
        printSuccess(`Typed ${count} characters`);
      } catch (err: unknown) {
        printError(`Failed to type text: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        await device.disconnect();
      }
    });
}
