import { Command } from 'commander';
import { SerialPort as SP } from 'serialport';
import { printError, printSuccess } from '../utils/output.js';

export function registerListCommand(program: Command): void {
  program
    .command('list')
    .description('List available serial ports')
    .action(async () => {
      try {
        const ports = await SP.list();

        // Sort: USB ports first
        ports.sort((a, b) => {
          const aIsUsb = a.path.toLowerCase().includes('usb') ? 0 : 1;
          const bIsUsb = b.path.toLowerCase().includes('usb') ? 0 : 1;
          return aIsUsb - bIsUsb;
        });

        const result = ports.map((p) => ({
          path: p.path,
          manufacturer: p.manufacturer || undefined,
          serialNumber: p.serialNumber || undefined,
          vendorId: p.vendorId || undefined,
          productId: p.productId || undefined
        }));

        printSuccess(result);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        printError(`Failed to list serial ports: ${msg}`);
      }
    });
}
