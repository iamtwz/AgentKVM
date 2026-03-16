import { SerialPort as SP } from 'serialport';

type Options = {
  path: string;
  baudRate?: number;
};

export class SerialPort {
  readonly SERIAL_BAUD_RATE = 57600;
  readonly READ_TIMEOUT = 500;

  private port: SP | null;
  private buffer: number[] = [];

  constructor() {
    this.port = null;
  }

  async init(options: Options): Promise<void> {
    if (this.port?.isOpen) {
      await this.close();
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    const path = options.path;
    const baudRate = options.baudRate || this.SERIAL_BAUD_RATE;

    return new Promise<void>((resolve, reject) => {
      this.port = new SP({ path, baudRate }, (err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });

      this.buffer = [];

      this.port.on('data', (data: Buffer) => {
        this.buffer.push(...Array.from(data));
      });

      this.port.on('error', (err) => {
        if (this.isDisconnectError(err)) {
          this.handleDisconnect();
        }
      });
    });
  }

  private handleDisconnect(): void {
    if (this.port) {
      this.port.removeAllListeners();
      this.port = null;
    }
    this.buffer = [];
  }

  private isDisconnectError(err: Error): boolean {
    const msg = err.message.toLowerCase();
    return (
      msg.includes('disconnected') ||
      msg.includes('device has been lost') ||
      msg.includes('has been closed') ||
      msg.includes('no such device')
    );
  }

  isConnected(): boolean {
    return this.port?.isOpen ?? false;
  }

  async write(data: number[]): Promise<void> {
    if (!this.port?.isOpen) {
      throw new Error('Serial port not open');
    }

    const uint8Array = new Uint8Array(data);
    return new Promise<void>((resolve, reject) => {
      this.port!.write(uint8Array, (err) => {
        if (err) {
          reject(err);
          return;
        }
        this.port!.drain((drainErr) => {
          if (drainErr) {
            reject(drainErr);
            return;
          }
          resolve();
        });
      });
    });
  }

  async read(minSize: number, sleep: number = 0): Promise<number[]> {
    if (!this.port?.isOpen) {
      throw new Error('Serial port not open');
    }

    const startTime = Date.now();

    while (this.buffer.length < minSize) {
      if (Date.now() - startTime > this.READ_TIMEOUT) {
        return [];
      }
      await new Promise((resolve) => setTimeout(resolve, 10));
    }

    const result = this.buffer.splice(0, Math.max(minSize, this.buffer.length));

    if (sleep > 0) {
      await new Promise((resolve) => setTimeout(resolve, sleep));
    }

    return result;
  }

  async close(): Promise<void> {
    if (this.port?.isOpen) {
      this.port.removeAllListeners();

      await new Promise<void>((resolve, reject) => {
        this.port!.close((err) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });

      this.port = null;
      this.buffer = [];
    }
  }
}
