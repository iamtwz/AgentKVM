import { Command } from 'commander';
import { Device } from '../protocol/device.js';
import { getRemote, getSerialPort } from './helpers.js';
import { remoteInfo } from '../remote/client.js';
import { printError, printSuccess } from '../utils/output.js';

export function registerInfoCommand(program: Command): void {
  program
    .command('info')
    .description('Get device information')
    .action(async () => {
      const remote = getRemote(program);
      if (remote) {
        try {
          const res = await remoteInfo(remote);
          printSuccess(res.data);
        } catch (err: unknown) {
          const msg = err instanceof Error ? err.message : String(err);
          printError(`Remote error: ${msg}`);
        }
        return;
      }

      const device = new Device();
      try {
        const port = getSerialPort(program);
        await device.connect(port);

        const info = await device.getInfo();
        printSuccess({
          chipVersion: info.CHIP_VERSION,
          isConnected: info.IS_CONNECTED,
          numLock: info.NUM_LOCK,
          capsLock: info.CAPS_LOCK,
          scrollLock: info.SCROLL_LOCK
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        printError(`Failed to get device info: ${msg}`);
      } finally {
        await device.disconnect();
      }
    });
}
