import { CmdEvent, CmdPacket, InfoPacket } from './proto.js';
import { SerialPort } from './serial-port.js';

export class Device {
  private addr: number;
  readonly serialPort: SerialPort;

  constructor() {
    this.addr = 0x00;
    this.serialPort = new SerialPort();
  }

  async connect(path: string, baudRate?: number): Promise<void> {
    await this.serialPort.init({ path, baudRate });
  }

  async disconnect(): Promise<void> {
    await this.serialPort.close();
  }

  isConnected(): boolean {
    return this.serialPort.isConnected();
  }

  async getInfo(): Promise<InfoPacket> {
    const data = new CmdPacket(this.addr, CmdEvent.GET_INFO).encode();
    await this.serialPort.write(data);

    const rsp = await this.serialPort.read(14);
    if (rsp.length === 0) {
      throw new Error('No response from device');
    }

    const rspPacket = new CmdPacket(-1, -1, rsp);
    return new InfoPacket(rspPacket.DATA);
  }

  async sendKeyboardData(report: number[]): Promise<void> {
    const cmdData = new CmdPacket(this.addr, CmdEvent.SEND_KB_GENERAL_DATA, report).encode();
    await this.serialPort.write(cmdData);
  }

  async sendMouseAbsolute(report: number[]): Promise<void> {
    // Prepend mode prefix 0x02 for absolute, matching existing NanoKVM-USB protocol
    const data = [0x02, ...report];
    const cmdData = new CmdPacket(this.addr, CmdEvent.SEND_MS_ABS_DATA, data).encode();
    await this.serialPort.write(cmdData);
  }

  async sendMouseRelative(report: number[]): Promise<void> {
    // Prepend mode prefix 0x01 for relative, matching existing NanoKVM-USB protocol
    const data = [0x01, ...report];
    const cmdData = new CmdPacket(this.addr, CmdEvent.SEND_MS_REL_DATA, data).encode();
    await this.serialPort.write(cmdData);
  }

  async reset(): Promise<void> {
    const cmdData = new CmdPacket(this.addr, CmdEvent.RESET).encode();
    await this.serialPort.write(cmdData);
  }
}
