import { Command } from 'commander';
import { Device } from '../protocol/device.js';
import { getRemote, getSerialPort } from './helpers.js';
import { remoteStatus } from '../remote/client.js';
import { printError, printSuccess } from '../utils/output.js';

export function registerStatusCommand(program: Command): void {
  program
    .command('status')
    .description('Check device connection status')
    .action(async () => {
      const remote = getRemote(program);
      if (remote) {
        try {
          const res = await remoteStatus(remote);
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
          serialPort: port,
          connected: true,
          chipVersion: info.CHIP_VERSION,
          targetConnected: info.IS_CONNECTED
        });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        printError(`Device not responding: ${msg}`);
      } finally {
        await device.disconnect();
      }
    });
}
