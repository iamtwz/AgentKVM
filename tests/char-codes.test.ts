import { describe, it, expect } from 'vitest';
import { CharCodes, ShiftChars } from '../src/hid/char-codes.js';

describe('CharCodes', () => {
  describe('lowercase letters', () => {
    it('should map a-z to 0x04-0x1d', () => {
      for (let i = 0; i < 26; i++) {
        const ascii = 97 + i; // 'a' = 97
        expect(CharCodes[ascii]).toBe(0x04 + i);
      }
    });
  });

  describe('uppercase letters', () => {
    it('should map A-Z to same keycodes as a-z (0x04-0x1d)', () => {
      for (let i = 0; i < 26; i++) {
        const lower = 97 + i;
        const upper = 65 + i;
        expect(CharCodes[upper]).toBe(CharCodes[lower]);
      }
    });
  });

  describe('digits', () => {
    it('should map 1-9 to 0x1e-0x26', () => {
      for (let i = 1; i <= 9; i++) {
        const ascii = 48 + i; // '1' = 49
        expect(CharCodes[ascii]).toBe(0x1e + i - 1);
      }
    });

    it('should map 0 to 0x27', () => {
      expect(CharCodes[48]).toBe(0x27);
    });
  });

  describe('special characters', () => {
    it('should map space to 0x2c', () => {
      expect(CharCodes[32]).toBe(0x2c);
    });

    it('should have mappings for common punctuation', () => {
      expect(CharCodes[45]).toBeDefined(); // -
      expect(CharCodes[46]).toBeDefined(); // .
      expect(CharCodes[44]).toBeDefined(); // ,
      expect(CharCodes[47]).toBeDefined(); // /
      expect(CharCodes[59]).toBeDefined(); // ;
      expect(CharCodes[91]).toBeDefined(); // [
      expect(CharCodes[93]).toBeDefined(); // ]
      expect(CharCodes[92]).toBeDefined(); // \
    });

    it('should map tab (9) and enter (10)', () => {
      expect(CharCodes[9]).toBeDefined();
      expect(CharCodes[10]).toBeDefined();
    });
  });

  describe('shifted characters have matching base keycodes', () => {
    it('! should use same keycode as 1', () => {
      expect(CharCodes[33]).toBe(CharCodes[49]); // ! and 1
    });

    it('@ should use same keycode as 2', () => {
      expect(CharCodes[64]).toBe(CharCodes[50]); // @ and 2
    });

    it('+ should use same keycode as =', () => {
      expect(CharCodes[43]).toBe(CharCodes[61]); // + and =
    });

    it('_ should use same keycode as -', () => {
      expect(CharCodes[95]).toBe(CharCodes[45]); // _ and -
    });
  });
});

describe('ShiftChars', () => {
  it('should mark shifted symbols as true', () => {
    const shiftedAscii = [33, 64, 35, 36, 37, 94, 38, 42, 40, 41, 95, 43, 123, 124, 125, 58, 34, 126, 60, 62, 63];
    // !  @  #  $  %  ^  &  *  (  )  _  +  {   |   }   :  "   ~   <  >  ?
    for (const ascii of shiftedAscii) {
      expect(ShiftChars[ascii]).toBe(true);
    }
  });

  it('should not mark unshifted characters', () => {
    // lowercase letters, digits, and basic punctuation should NOT be in ShiftChars
    expect(ShiftChars[97]).toBeUndefined(); // a
    expect(ShiftChars[48]).toBeUndefined(); // 0
    expect(ShiftChars[45]).toBeUndefined(); // -
    expect(ShiftChars[61]).toBeUndefined(); // =
    expect(ShiftChars[91]).toBeUndefined(); // [
    expect(ShiftChars[93]).toBeUndefined(); // ]
    expect(ShiftChars[59]).toBeUndefined(); // ;
    expect(ShiftChars[39]).toBeUndefined(); // '
    expect(ShiftChars[44]).toBeUndefined(); // ,
    expect(ShiftChars[46]).toBeUndefined(); // .
    expect(ShiftChars[47]).toBeUndefined(); // /
  });

  it('should correctly identify uppercase typing needs shift', () => {
    // The type command checks: (ascii >= 65 && ascii <= 90) || ShiftChars[ascii]
    for (let ascii = 65; ascii <= 90; ascii++) {
      // Uppercase A-Z: these rely on the range check, not ShiftChars
      expect(CharCodes[ascii]).toBeDefined();
    }
  });
});
