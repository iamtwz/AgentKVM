import { describe, it, expect } from 'vitest';
import { MouseAbsoluteReport, MouseRelativeReport, getMouseButtonBit } from '../src/hid/mouse.js';

describe('getMouseButtonBit', () => {
  it('should return Left=0x01', () => {
    expect(getMouseButtonBit('left')).toBe(0x01);
  });

  it('should return Right=0x02', () => {
    expect(getMouseButtonBit('right')).toBe(0x02);
  });

  it('should return Middle=0x04', () => {
    expect(getMouseButtonBit('middle')).toBe(0x04);
  });

  it('should return Back=0x08', () => {
    expect(getMouseButtonBit('back')).toBe(0x08);
  });

  it('should return Forward=0x10', () => {
    expect(getMouseButtonBit('forward')).toBe(0x10);
  });

  it('should default to Left for unknown button', () => {
    expect(getMouseButtonBit('unknown')).toBe(0x01);
  });
});

describe('MouseAbsoluteReport', () => {
  describe('buildReport format', () => {
    it('should return 6-byte report', () => {
      const mouse = new MouseAbsoluteReport();
      const report = mouse.buildReport(0.5, 0.5);
      expect(report.length).toBe(6);
    });
  });

  describe('coordinate conversion', () => {
    it('should map (0, 0) to all zeros', () => {
      const mouse = new MouseAbsoluteReport();
      const report = mouse.buildReport(0, 0);
      expect(report[0]).toBe(0); // buttons
      expect(report[1]).toBe(0); // x_lo
      expect(report[2]).toBe(0); // x_hi
      expect(report[3]).toBe(0); // y_lo
      expect(report[4]).toBe(0); // y_hi
      expect(report[5]).toBe(0); // wheel
    });

    it('should map (1, 1) to 4096 (0x1000)', () => {
      const mouse = new MouseAbsoluteReport();
      const report = mouse.buildReport(1, 1);
      // 4096 = 0x1000 -> lo=0x00, hi=0x10
      expect(report[1]).toBe(0x00); // x_lo
      expect(report[2]).toBe(0x10); // x_hi
      expect(report[3]).toBe(0x00); // y_lo
      expect(report[4]).toBe(0x10); // y_hi
    });

    it('should map (0.5, 0.5) to 2048 (0x0800)', () => {
      const mouse = new MouseAbsoluteReport();
      const report = mouse.buildReport(0.5, 0.5);
      // 2048 = 0x0800 -> lo=0x00, hi=0x08
      expect(report[1]).toBe(0x00); // x_lo
      expect(report[2]).toBe(0x08); // x_hi
      expect(report[3]).toBe(0x00); // y_lo
      expect(report[4]).toBe(0x08); // y_hi
    });

    it('should map (0.25, 0.75) correctly', () => {
      const mouse = new MouseAbsoluteReport();
      const report = mouse.buildReport(0.25, 0.75);
      // 0.25 * 4096 = 1024 = 0x0400 -> lo=0x00, hi=0x04
      expect(report[1]).toBe(0x00);
      expect(report[2]).toBe(0x04);
      // 0.75 * 4096 = 3072 = 0x0C00 -> lo=0x00, hi=0x0C
      expect(report[3]).toBe(0x00);
      expect(report[4]).toBe(0x0c);
    });

    it('should clamp values above 1.0', () => {
      const mouse = new MouseAbsoluteReport();
      const report = mouse.buildReport(1.5, 2.0);
      expect(report[1]).toBe(0x00);
      expect(report[2]).toBe(0x10); // clamped to 4096
    });

    it('should clamp negative values to 0', () => {
      const mouse = new MouseAbsoluteReport();
      const report = mouse.buildReport(-0.5, -1.0);
      expect(report[1]).toBe(0);
      expect(report[2]).toBe(0);
      expect(report[3]).toBe(0);
      expect(report[4]).toBe(0);
    });
  });

  describe('buttons', () => {
    it('should set left button', () => {
      const mouse = new MouseAbsoluteReport();
      mouse.buttonDown(0x01);
      const report = mouse.buildReport(0.5, 0.5);
      expect(report[0]).toBe(0x01);
    });

    it('should set right button', () => {
      const mouse = new MouseAbsoluteReport();
      mouse.buttonDown(0x02);
      const report = mouse.buildReport(0.5, 0.5);
      expect(report[0]).toBe(0x02);
    });

    it('should combine multiple buttons', () => {
      const mouse = new MouseAbsoluteReport();
      mouse.buttonDown(0x01); // left
      mouse.buttonDown(0x02); // right
      const report = mouse.buildReport(0.5, 0.5);
      expect(report[0]).toBe(0x03);
    });

    it('should clear button on buttonUp', () => {
      const mouse = new MouseAbsoluteReport();
      mouse.buttonDown(0x01);
      mouse.buttonDown(0x02);
      mouse.buttonUp(0x01);
      const report = mouse.buildReport(0.5, 0.5);
      expect(report[0]).toBe(0x02); // only right
    });
  });

  describe('wheel', () => {
    it('should set positive scroll value', () => {
      const mouse = new MouseAbsoluteReport();
      const report = mouse.buildReport(0.5, 0.5, 3);
      expect(report[5]).toBe(3);
    });

    it('should set negative scroll as unsigned byte', () => {
      const mouse = new MouseAbsoluteReport();
      const report = mouse.buildReport(0.5, 0.5, -3);
      expect(report[5]).toBe((-3) & 0xff); // 253
    });

    it('should clamp wheel to 127', () => {
      const mouse = new MouseAbsoluteReport();
      const report = mouse.buildReport(0.5, 0.5, 200);
      expect(report[5]).toBe(127);
    });

    it('should clamp wheel to -127', () => {
      const mouse = new MouseAbsoluteReport();
      const report = mouse.buildReport(0.5, 0.5, -200);
      expect(report[5]).toBe((-127) & 0xff); // 129
    });
  });

  describe('reset', () => {
    it('should clear buttons and return origin report', () => {
      const mouse = new MouseAbsoluteReport();
      mouse.buttonDown(0x01);
      const report = mouse.reset();
      expect(report).toEqual([0, 0, 0, 0, 0, 0]);
    });
  });
});

describe('MouseRelativeReport', () => {
  describe('buildReport format', () => {
    it('should return 4-byte report', () => {
      const mouse = new MouseRelativeReport();
      const report = mouse.buildReport(0, 0);
      expect(report.length).toBe(4);
    });
  });

  describe('movement', () => {
    it('should encode positive movement', () => {
      const mouse = new MouseRelativeReport();
      const report = mouse.buildReport(10, 20);
      expect(report[0]).toBe(0); // buttons
      expect(report[1]).toBe(10); // dx
      expect(report[2]).toBe(20); // dy
      expect(report[3]).toBe(0);  // wheel
    });

    it('should encode negative movement as unsigned bytes', () => {
      const mouse = new MouseRelativeReport();
      const report = mouse.buildReport(-10, -20);
      expect(report[1]).toBe((-10) & 0xff); // 246
      expect(report[2]).toBe((-20) & 0xff); // 236
    });

    it('should clamp movement to 127', () => {
      const mouse = new MouseRelativeReport();
      const report = mouse.buildReport(200, 300);
      expect(report[1]).toBe(127);
      expect(report[2]).toBe(127);
    });

    it('should clamp movement to -127', () => {
      const mouse = new MouseRelativeReport();
      const report = mouse.buildReport(-200, -300);
      expect(report[1]).toBe((-127) & 0xff); // 129
      expect(report[2]).toBe((-127) & 0xff);
    });

    it('should round fractional values', () => {
      const mouse = new MouseRelativeReport();
      const report = mouse.buildReport(5.7, -3.2);
      expect(report[1]).toBe(6);
      expect(report[2]).toBe((-3) & 0xff);
    });
  });

  describe('buttons', () => {
    it('should set and clear buttons', () => {
      const mouse = new MouseRelativeReport();
      mouse.buttonDown(0x01);
      let report = mouse.buildReport(0, 0);
      expect(report[0]).toBe(0x01);

      mouse.buttonUp(0x01);
      report = mouse.buildReport(0, 0);
      expect(report[0]).toBe(0x00);
    });
  });

  describe('reset', () => {
    it('should clear all state', () => {
      const mouse = new MouseRelativeReport();
      mouse.buttonDown(0x01);
      const report = mouse.reset();
      expect(report).toEqual([0, 0, 0, 0]);
    });
  });
});
