import { describe, it, expect } from 'vitest';
import { CmdPacket, CmdEvent, InfoPacket } from '../src/protocol/proto.js';

describe('CmdPacket', () => {
  describe('encode', () => {
    it('should encode a GET_INFO packet with no data', () => {
      const pkt = new CmdPacket(0x00, CmdEvent.GET_INFO);
      const encoded = pkt.encode();

      // [HEAD1, HEAD2, ADDR, CMD, LEN, SUM]
      expect(encoded[0]).toBe(0x57); // HEAD1
      expect(encoded[1]).toBe(0xab); // HEAD2
      expect(encoded[2]).toBe(0x00); // ADDR
      expect(encoded[3]).toBe(0x01); // CMD = GET_INFO
      expect(encoded[4]).toBe(0x00); // LEN = 0
      // SUM = (0x57 + 0xab + 0x00 + 0x01 + 0x00) & 0xff = 0x03
      expect(encoded[5]).toBe(0x03);
      expect(encoded.length).toBe(6);
    });

    it('should encode a keyboard packet with 8-byte HID report', () => {
      const report = [0x02, 0x00, 0x04, 0x00, 0x00, 0x00, 0x00, 0x00]; // Shift + 'a'
      const pkt = new CmdPacket(0x00, CmdEvent.SEND_KB_GENERAL_DATA, report);
      const encoded = pkt.encode();

      expect(encoded[0]).toBe(0x57);
      expect(encoded[1]).toBe(0xab);
      expect(encoded[2]).toBe(0x00);
      expect(encoded[3]).toBe(0x02); // SEND_KB_GENERAL_DATA
      expect(encoded[4]).toBe(0x08); // LEN = 8
      expect(encoded.slice(5, 13)).toEqual(report);
      expect(encoded.length).toBe(14); // 5 header + 8 data + 1 checksum
    });

    it('should compute correct checksum for keyboard data', () => {
      const report = [0x02, 0x00, 0x04, 0x00, 0x00, 0x00, 0x00, 0x00];
      const pkt = new CmdPacket(0x00, CmdEvent.SEND_KB_GENERAL_DATA, report);
      const encoded = pkt.encode();

      // Manual checksum: 0x57 + 0xab + 0x00 + 0x02 + 0x08 + 0x02 + 0x00 + 0x04 + ... = ?
      let sum = 0;
      for (let i = 0; i < encoded.length - 1; i++) {
        sum += encoded[i];
      }
      expect(encoded[encoded.length - 1]).toBe(sum & 0xff);
    });

    it('should encode absolute mouse packet with mode prefix', () => {
      const data = [0x02, 0x00, 0x00, 0x08, 0x00, 0x08, 0x00]; // mode + abs report
      const pkt = new CmdPacket(0x00, CmdEvent.SEND_MS_ABS_DATA, data);
      const encoded = pkt.encode();

      expect(encoded[3]).toBe(0x04); // SEND_MS_ABS_DATA
      expect(encoded[4]).toBe(0x07); // LEN = 7
    });

    it('should encode relative mouse packet with mode prefix', () => {
      const data = [0x01, 0x00, 0x0a, 0xf6, 0x00]; // mode + rel report
      const pkt = new CmdPacket(0x00, CmdEvent.SEND_MS_REL_DATA, data);
      const encoded = pkt.encode();

      expect(encoded[3]).toBe(0x05); // SEND_MS_REL_DATA
      expect(encoded[4]).toBe(0x05); // LEN = 5
    });

    it('should encode RESET packet', () => {
      const pkt = new CmdPacket(0x00, CmdEvent.RESET);
      const encoded = pkt.encode();

      expect(encoded[3]).toBe(0x0f);
      expect(encoded[4]).toBe(0x00);
      expect(encoded.length).toBe(6);
    });
  });

  describe('decode', () => {
    it('should decode a previously encoded packet (roundtrip)', () => {
      const report = [0x02, 0x00, 0x04, 0x00, 0x00, 0x00, 0x00, 0x00];
      const original = new CmdPacket(0x00, CmdEvent.SEND_KB_GENERAL_DATA, report);
      const encoded = original.encode();

      const decoded = new CmdPacket(-1, -1, encoded);
      expect(decoded.ADDR).toBe(0x00);
      expect(decoded.CMD).toBe(0x02);
      expect(decoded.LEN).toBe(8);
      expect(decoded.DATA).toEqual(report);
    });

    it('should decode packet with leading garbage bytes', () => {
      const report = [0x10, 0x20];
      const original = new CmdPacket(0x00, CmdEvent.GET_INFO, report);
      const encoded = original.encode();

      // Prepend garbage
      const withGarbage = [0xff, 0x00, 0x12, ...encoded];
      const decoded = new CmdPacket(-1, -1, withGarbage);
      expect(decoded.ADDR).toBe(0x00);
      expect(decoded.CMD).toBe(0x01);
      expect(decoded.DATA).toEqual(report);
    });

    it('should return -1 for empty data', () => {
      const pkt = new CmdPacket();
      expect(pkt.decode([])).toBe(-1);
    });

    it('should return -1 for data without valid header', () => {
      const pkt = new CmdPacket();
      expect(pkt.decode([0x00, 0x01, 0x02, 0x03, 0x04, 0x05])).toBe(-1);
    });

    it('should return -1 for truncated packet (too short after header)', () => {
      const pkt = new CmdPacket();
      expect(pkt.decode([0x57, 0xab, 0x00])).toBe(-1);
    });

    it('should return -1 for packet with wrong checksum', () => {
      const original = new CmdPacket(0x00, CmdEvent.GET_INFO);
      const encoded = original.encode();
      encoded[encoded.length - 1] = 0xff; // corrupt checksum

      const pkt = new CmdPacket();
      expect(pkt.decode(encoded)).toBe(-1);
    });

    it('should return -1 when data length exceeds available bytes', () => {
      // Header is valid but LEN claims more data than available
      const pkt = new CmdPacket();
      // [HEAD1, HEAD2, ADDR, CMD, LEN=10, ...only 2 data bytes]
      expect(pkt.decode([0x57, 0xab, 0x00, 0x01, 0x0a, 0x01, 0x02])).toBe(-1);
    });
  });

  describe('checksum calculation', () => {
    it('should produce checksum within 0-255 range', () => {
      // Use data that sums to > 255 to test masking
      const data = [0xff, 0xff, 0xff, 0xff];
      const pkt = new CmdPacket(0xff, 0xff, data);
      expect(pkt.SUM).toBeGreaterThanOrEqual(0);
      expect(pkt.SUM).toBeLessThanOrEqual(255);
    });

    it('should handle empty data correctly', () => {
      const pkt = new CmdPacket(0x00, 0x00);
      // SUM = (0x57 + 0xab + 0x00 + 0x00 + 0x00) & 0xff = 0x02
      expect(pkt.SUM).toBe(0x02);
    });
  });
});

describe('InfoPacket', () => {
  it('should parse version V1.0', () => {
    const info = new InfoPacket([0x30, 0x01, 0x00]);
    expect(info.CHIP_VERSION).toBe('V1.0');
  });

  it('should parse version V1.4', () => {
    const info = new InfoPacket([0x34, 0x01, 0x00]);
    expect(info.CHIP_VERSION).toBe('V1.4');
  });

  it('should parse version V1.9', () => {
    const info = new InfoPacket([0x39, 0x01, 0x00]);
    expect(info.CHIP_VERSION).toBe('V1.9');
  });

  it('should parse connection status as connected', () => {
    const info = new InfoPacket([0x30, 0x01, 0x00]);
    expect(info.IS_CONNECTED).toBe(true);
  });

  it('should parse connection status as disconnected', () => {
    const info = new InfoPacket([0x30, 0x00, 0x00]);
    expect(info.IS_CONNECTED).toBe(false);
  });

  it('should parse NUM_LOCK on', () => {
    const info = new InfoPacket([0x30, 0x01, 0b001]);
    expect(info.NUM_LOCK).toBe(true);
    expect(info.CAPS_LOCK).toBe(false);
    expect(info.SCROLL_LOCK).toBe(false);
  });

  it('should parse CAPS_LOCK on', () => {
    const info = new InfoPacket([0x30, 0x01, 0b010]);
    expect(info.NUM_LOCK).toBe(false);
    expect(info.CAPS_LOCK).toBe(true);
    expect(info.SCROLL_LOCK).toBe(false);
  });

  it('should parse SCROLL_LOCK on', () => {
    const info = new InfoPacket([0x30, 0x01, 0b100]);
    expect(info.NUM_LOCK).toBe(false);
    expect(info.CAPS_LOCK).toBe(false);
    expect(info.SCROLL_LOCK).toBe(true);
  });

  it('should parse all locks on', () => {
    const info = new InfoPacket([0x30, 0x01, 0b111]);
    expect(info.NUM_LOCK).toBe(true);
    expect(info.CAPS_LOCK).toBe(true);
    expect(info.SCROLL_LOCK).toBe(true);
  });

  it('should throw on invalid version byte', () => {
    expect(() => new InfoPacket([0x20, 0x01, 0x00])).toThrow('version error');
  });
});
