import { describe, it, expect } from 'vitest';
import { KeyboardReport } from '../src/hid/keyboard.js';

describe('KeyboardReport', () => {
  describe('buildReport format', () => {
    it('should return 8-byte report', () => {
      const kb = new KeyboardReport();
      const report = kb.reset();
      expect(report.length).toBe(8);
    });

    it('should have reserved byte at index 1 always 0', () => {
      const kb = new KeyboardReport();
      kb.keyDown('ControlLeft');
      kb.keyDown('KeyA');
      const report = kb.keyDown('KeyB');
      expect(report[1]).toBe(0);
    });
  });

  describe('modifier keys', () => {
    it('should set LeftCtrl bit (0x01)', () => {
      const kb = new KeyboardReport();
      const report = kb.keyDown('ControlLeft');
      expect(report[0]).toBe(0x01);
    });

    it('should set LeftShift bit (0x02)', () => {
      const kb = new KeyboardReport();
      const report = kb.keyDown('ShiftLeft');
      expect(report[0]).toBe(0x02);
    });

    it('should set LeftAlt bit (0x04)', () => {
      const kb = new KeyboardReport();
      const report = kb.keyDown('AltLeft');
      expect(report[0]).toBe(0x04);
    });

    it('should set LeftMeta bit (0x08)', () => {
      const kb = new KeyboardReport();
      const report = kb.keyDown('MetaLeft');
      expect(report[0]).toBe(0x08);
    });

    it('should combine multiple modifiers with OR', () => {
      const kb = new KeyboardReport();
      kb.keyDown('ControlLeft');
      const report = kb.keyDown('ShiftLeft');
      expect(report[0]).toBe(0x01 | 0x02); // 0x03
    });

    it('should clear modifier bit on keyUp', () => {
      const kb = new KeyboardReport();
      kb.keyDown('ControlLeft');
      kb.keyDown('ShiftLeft');
      const report = kb.keyUp('ControlLeft');
      expect(report[0]).toBe(0x02); // only Shift remains
    });

    it('should not put modifier keycodes in bytes 2-7', () => {
      const kb = new KeyboardReport();
      const report = kb.keyDown('ControlLeft');
      expect(report.slice(2)).toEqual([0, 0, 0, 0, 0, 0]);
    });
  });

  describe('regular keys', () => {
    it('should place keycode of KeyA (0x04) in byte 2', () => {
      const kb = new KeyboardReport();
      const report = kb.keyDown('KeyA');
      expect(report[0]).toBe(0); // no modifier
      expect(report[2]).toBe(0x04);
    });

    it('should place Enter (0x28) in byte 2', () => {
      const kb = new KeyboardReport();
      const report = kb.keyDown('Enter');
      expect(report[2]).toBe(0x28);
    });

    it('should support multiple simultaneous keys', () => {
      const kb = new KeyboardReport();
      kb.keyDown('KeyA');
      kb.keyDown('KeyB');
      const report = kb.keyDown('KeyC');
      expect(report[2]).toBe(0x04); // a
      expect(report[3]).toBe(0x05); // b
      expect(report[4]).toBe(0x06); // c
      expect(report[5]).toBe(0);
    });

    it('should enforce 6-key rollover limit', () => {
      const kb = new KeyboardReport();
      kb.keyDown('KeyA');
      kb.keyDown('KeyB');
      kb.keyDown('KeyC');
      kb.keyDown('KeyD');
      kb.keyDown('KeyE');
      kb.keyDown('KeyF');
      const report = kb.keyDown('KeyG'); // 7th key, should be ignored
      const keycodes = report.slice(2);
      expect(keycodes).toEqual([0x04, 0x05, 0x06, 0x07, 0x08, 0x09]);
    });

    it('should remove key on keyUp', () => {
      const kb = new KeyboardReport();
      kb.keyDown('KeyA');
      kb.keyDown('KeyB');
      const report = kb.keyUp('KeyA');
      expect(report[2]).toBe(0x05); // only B remains
      expect(report[3]).toBe(0);
    });

    it('should ignore unknown key codes', () => {
      const kb = new KeyboardReport();
      const report = kb.keyDown('UnknownKey');
      expect(report).toEqual([0, 0, 0, 0, 0, 0, 0, 0]);
    });
  });

  describe('combined modifier + key', () => {
    it('should produce Ctrl+C report', () => {
      const kb = new KeyboardReport();
      kb.keyDown('ControlLeft');
      const report = kb.keyDown('KeyC');
      expect(report[0]).toBe(0x01); // Ctrl
      expect(report[2]).toBe(0x06); // C
    });

    it('should produce Ctrl+Shift+Delete report', () => {
      const kb = new KeyboardReport();
      kb.keyDown('ControlLeft');
      kb.keyDown('ShiftLeft');
      const report = kb.keyDown('Delete');
      expect(report[0]).toBe(0x03); // Ctrl + Shift
      expect(report[2]).toBe(0x4c); // Delete
    });
  });

  describe('reset', () => {
    it('should clear all modifiers and keys', () => {
      const kb = new KeyboardReport();
      kb.keyDown('ControlLeft');
      kb.keyDown('ShiftLeft');
      kb.keyDown('KeyA');
      kb.keyDown('KeyB');
      const report = kb.reset();
      expect(report).toEqual([0, 0, 0, 0, 0, 0, 0, 0]);
    });
  });
});
