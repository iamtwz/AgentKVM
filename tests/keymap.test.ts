import { describe, it, expect } from 'vitest';
import {
  ModifierBits, ModifierMap, KeycodeMap,
  isModifier, getModifierBit, getKeycode
} from '../src/hid/keymap.js';

describe('ModifierBits', () => {
  it('should have correct bit positions', () => {
    expect(ModifierBits.LeftCtrl).toBe(0x01);
    expect(ModifierBits.LeftShift).toBe(0x02);
    expect(ModifierBits.LeftAlt).toBe(0x04);
    expect(ModifierBits.LeftMeta).toBe(0x08);
    expect(ModifierBits.RightCtrl).toBe(0x10);
    expect(ModifierBits.RightShift).toBe(0x20);
    expect(ModifierBits.RightAlt).toBe(0x40);
    expect(ModifierBits.RightMeta).toBe(0x80);
  });

  it('should have all 8 unique bits', () => {
    const bits = Object.values(ModifierBits);
    const combined = bits.reduce((a, b) => a | b, 0);
    expect(combined).toBe(0xff);
  });
});

describe('ModifierMap', () => {
  it('should map all 8 modifier keys', () => {
    expect(Object.keys(ModifierMap).length).toBe(8);
  });

  it('should map ControlLeft to LeftCtrl', () => {
    expect(ModifierMap['ControlLeft']).toBe(ModifierBits.LeftCtrl);
  });

  it('should map MetaRight to RightMeta', () => {
    expect(ModifierMap['MetaRight']).toBe(ModifierBits.RightMeta);
  });
});

describe('KeycodeMap', () => {
  it('should map letters A-Z to 0x04-0x1d', () => {
    for (let i = 0; i < 26; i++) {
      const key = `Key${String.fromCharCode(65 + i)}`;
      expect(KeycodeMap[key]).toBe(0x04 + i);
    }
  });

  it('should map digits 0-9', () => {
    expect(KeycodeMap['Digit1']).toBe(0x1e);
    expect(KeycodeMap['Digit9']).toBe(0x26);
    expect(KeycodeMap['Digit0']).toBe(0x27);
  });

  it('should map common special keys', () => {
    expect(KeycodeMap['Enter']).toBe(0x28);
    expect(KeycodeMap['Escape']).toBe(0x29);
    expect(KeycodeMap['Backspace']).toBe(0x2a);
    expect(KeycodeMap['Tab']).toBe(0x2b);
    expect(KeycodeMap['Space']).toBe(0x2c);
    expect(KeycodeMap['Delete']).toBe(0x4c);
  });

  it('should map function keys F1-F12', () => {
    for (let i = 1; i <= 12; i++) {
      expect(KeycodeMap[`F${i}`]).toBe(0x39 + i);
    }
  });

  it('should map arrow keys', () => {
    expect(KeycodeMap['ArrowRight']).toBe(0x4f);
    expect(KeycodeMap['ArrowLeft']).toBe(0x50);
    expect(KeycodeMap['ArrowDown']).toBe(0x51);
    expect(KeycodeMap['ArrowUp']).toBe(0x52);
  });

  it('should map modifier key codes (0xE0-0xE7)', () => {
    expect(KeycodeMap['ControlLeft']).toBe(0xe0);
    expect(KeycodeMap['ShiftLeft']).toBe(0xe1);
    expect(KeycodeMap['AltLeft']).toBe(0xe2);
    expect(KeycodeMap['MetaLeft']).toBe(0xe3);
    expect(KeycodeMap['ControlRight']).toBe(0xe4);
    expect(KeycodeMap['ShiftRight']).toBe(0xe5);
    expect(KeycodeMap['AltRight']).toBe(0xe6);
    expect(KeycodeMap['MetaRight']).toBe(0xe7);
  });

  it('should have WinLeft as alias for MetaLeft', () => {
    expect(KeycodeMap['WinLeft']).toBe(KeycodeMap['MetaLeft']);
  });
});

describe('isModifier', () => {
  it('should return true for modifier keys', () => {
    expect(isModifier('ControlLeft')).toBe(true);
    expect(isModifier('ShiftLeft')).toBe(true);
    expect(isModifier('AltLeft')).toBe(true);
    expect(isModifier('MetaLeft')).toBe(true);
    expect(isModifier('ControlRight')).toBe(true);
    expect(isModifier('ShiftRight')).toBe(true);
    expect(isModifier('AltRight')).toBe(true);
    expect(isModifier('MetaRight')).toBe(true);
  });

  it('should return false for regular keys', () => {
    expect(isModifier('KeyA')).toBe(false);
    expect(isModifier('Enter')).toBe(false);
    expect(isModifier('F1')).toBe(false);
    expect(isModifier('Space')).toBe(false);
  });
});

describe('getModifierBit', () => {
  it('should return correct bit for known modifier', () => {
    expect(getModifierBit('ControlLeft')).toBe(0x01);
    expect(getModifierBit('ShiftLeft')).toBe(0x02);
  });

  it('should return 0 for unknown code', () => {
    expect(getModifierBit('KeyA')).toBe(0);
    expect(getModifierBit('Unknown')).toBe(0);
  });
});

describe('getKeycode', () => {
  it('should return keycode for known key', () => {
    expect(getKeycode('KeyA')).toBe(0x04);
    expect(getKeycode('Enter')).toBe(0x28);
  });

  it('should return undefined for unknown key', () => {
    expect(getKeycode('UnknownKey')).toBeUndefined();
  });
});
