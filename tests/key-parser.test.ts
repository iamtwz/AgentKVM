import { describe, it, expect } from 'vitest';
import { parseKeyCombo } from '../src/hid/key-parser.js';

describe('parseKeyCombo', () => {
  describe('single keys', () => {
    it('should parse "enter" as a regular key', () => {
      const result = parseKeyCombo('enter');
      expect(result.modifiers).toEqual([]);
      expect(result.keys).toEqual(['Enter']);
    });

    it('should parse "esc" alias', () => {
      const result = parseKeyCombo('esc');
      expect(result.keys).toEqual(['Escape']);
    });

    it('should parse "escape" alias', () => {
      const result = parseKeyCombo('escape');
      expect(result.keys).toEqual(['Escape']);
    });

    it('should parse "backspace" alias', () => {
      const result = parseKeyCombo('backspace');
      expect(result.keys).toEqual(['Backspace']);
    });

    it('should parse "bs" alias', () => {
      const result = parseKeyCombo('bs');
      expect(result.keys).toEqual(['Backspace']);
    });

    it('should parse "tab"', () => {
      const result = parseKeyCombo('tab');
      expect(result.keys).toEqual(['Tab']);
    });

    it('should parse "space"', () => {
      const result = parseKeyCombo('space');
      expect(result.keys).toEqual(['Space']);
    });

    it('should parse "delete" and "del"', () => {
      expect(parseKeyCombo('delete').keys).toEqual(['Delete']);
      expect(parseKeyCombo('del').keys).toEqual(['Delete']);
    });
  });

  describe('single letter keys', () => {
    it('should parse "a" as KeyA', () => {
      const result = parseKeyCombo('a');
      expect(result.keys).toEqual(['KeyA']);
    });

    it('should parse "z" as KeyZ', () => {
      const result = parseKeyCombo('z');
      expect(result.keys).toEqual(['KeyZ']);
    });

    it('should be case-insensitive for letters', () => {
      const result = parseKeyCombo('A');
      expect(result.keys).toEqual(['KeyA']);
    });
  });

  describe('digit keys', () => {
    it('should parse "0" as Digit0', () => {
      const result = parseKeyCombo('0');
      expect(result.keys).toEqual(['Digit0']);
    });

    it('should parse "9" as Digit9', () => {
      const result = parseKeyCombo('9');
      expect(result.keys).toEqual(['Digit9']);
    });
  });

  describe('function keys', () => {
    it('should parse "f1" as F1', () => {
      const result = parseKeyCombo('f1');
      expect(result.keys).toEqual(['F1']);
    });

    it('should parse "f12" as F12', () => {
      const result = parseKeyCombo('f12');
      expect(result.keys).toEqual(['F12']);
    });

    it('should parse "f24" as F24', () => {
      const result = parseKeyCombo('f24');
      expect(result.keys).toEqual(['F24']);
    });

    it('should parse "F5" case-insensitively', () => {
      const result = parseKeyCombo('F5');
      expect(result.keys).toEqual(['F5']);
    });
  });

  describe('arrow keys', () => {
    it('should parse arrow aliases', () => {
      expect(parseKeyCombo('up').keys).toEqual(['ArrowUp']);
      expect(parseKeyCombo('down').keys).toEqual(['ArrowDown']);
      expect(parseKeyCombo('left').keys).toEqual(['ArrowLeft']);
      expect(parseKeyCombo('right').keys).toEqual(['ArrowRight']);
    });
  });

  describe('navigation keys', () => {
    it('should parse navigation aliases', () => {
      expect(parseKeyCombo('home').keys).toEqual(['Home']);
      expect(parseKeyCombo('end').keys).toEqual(['End']);
      expect(parseKeyCombo('pageup').keys).toEqual(['PageUp']);
      expect(parseKeyCombo('pgup').keys).toEqual(['PageUp']);
      expect(parseKeyCombo('pagedown').keys).toEqual(['PageDown']);
      expect(parseKeyCombo('pgdn').keys).toEqual(['PageDown']);
      expect(parseKeyCombo('insert').keys).toEqual(['Insert']);
      expect(parseKeyCombo('ins').keys).toEqual(['Insert']);
    });
  });

  describe('modifier-only', () => {
    it('should parse "ctrl" as modifier', () => {
      const result = parseKeyCombo('ctrl');
      expect(result.modifiers).toEqual(['ControlLeft']);
      expect(result.keys).toEqual([]);
    });

    it('should parse all ctrl aliases', () => {
      expect(parseKeyCombo('ctrl').modifiers).toEqual(['ControlLeft']);
      expect(parseKeyCombo('control').modifiers).toEqual(['ControlLeft']);
    });

    it('should parse all meta aliases', () => {
      expect(parseKeyCombo('meta').modifiers).toEqual(['MetaLeft']);
      expect(parseKeyCombo('win').modifiers).toEqual(['MetaLeft']);
      expect(parseKeyCombo('cmd').modifiers).toEqual(['MetaLeft']);
      expect(parseKeyCombo('command').modifiers).toEqual(['MetaLeft']);
      expect(parseKeyCombo('super').modifiers).toEqual(['MetaLeft']);
    });

    it('should parse "alt" and "option"', () => {
      expect(parseKeyCombo('alt').modifiers).toEqual(['AltLeft']);
      expect(parseKeyCombo('option').modifiers).toEqual(['AltLeft']);
    });
  });

  describe('combo keys', () => {
    it('should parse "ctrl+c"', () => {
      const result = parseKeyCombo('ctrl+c');
      expect(result.modifiers).toEqual(['ControlLeft']);
      expect(result.keys).toEqual(['KeyC']);
    });

    it('should parse "ctrl+shift+delete"', () => {
      const result = parseKeyCombo('ctrl+shift+delete');
      expect(result.modifiers).toEqual(['ControlLeft', 'ShiftLeft']);
      expect(result.keys).toEqual(['Delete']);
    });

    it('should parse "alt+f4"', () => {
      const result = parseKeyCombo('alt+f4');
      expect(result.modifiers).toEqual(['AltLeft']);
      expect(result.keys).toEqual(['F4']);
    });

    it('should parse "ctrl+shift+a"', () => {
      const result = parseKeyCombo('ctrl+shift+a');
      expect(result.modifiers).toEqual(['ControlLeft', 'ShiftLeft']);
      expect(result.keys).toEqual(['KeyA']);
    });

    it('should parse "super+l" (Windows lock)', () => {
      const result = parseKeyCombo('super+l');
      expect(result.modifiers).toEqual(['MetaLeft']);
      expect(result.keys).toEqual(['KeyL']);
    });

    it('should handle spaces around +', () => {
      const result = parseKeyCombo('ctrl + shift + a');
      expect(result.modifiers).toEqual(['ControlLeft', 'ShiftLeft']);
      expect(result.keys).toEqual(['KeyA']);
    });
  });

  describe('punctuation keys', () => {
    it('should parse punctuation aliases', () => {
      expect(parseKeyCombo('minus').keys).toEqual(['Minus']);
      expect(parseKeyCombo('equal').keys).toEqual(['Equal']);
      expect(parseKeyCombo('comma').keys).toEqual(['Comma']);
      expect(parseKeyCombo('period').keys).toEqual(['Period']);
      expect(parseKeyCombo('dot').keys).toEqual(['Period']);
      expect(parseKeyCombo('slash').keys).toEqual(['Slash']);
      expect(parseKeyCombo('backslash').keys).toEqual(['Backslash']);
    });

    it('should parse "ctrl+minus"', () => {
      const result = parseKeyCombo('ctrl+minus');
      expect(result.modifiers).toEqual(['ControlLeft']);
      expect(result.keys).toEqual(['Minus']);
    });
  });

  describe('special keys', () => {
    it('should parse lock keys', () => {
      expect(parseKeyCombo('capslock').keys).toEqual(['CapsLock']);
      expect(parseKeyCombo('numlock').keys).toEqual(['NumLock']);
      expect(parseKeyCombo('scrolllock').keys).toEqual(['ScrollLock']);
    });

    it('should parse "prtsc" and "printscreen"', () => {
      expect(parseKeyCombo('prtsc').keys).toEqual(['PrintScreen']);
      expect(parseKeyCombo('printscreen').keys).toEqual(['PrintScreen']);
    });

    it('should parse "menu" and "contextmenu"', () => {
      expect(parseKeyCombo('menu').keys).toEqual(['ContextMenu']);
      expect(parseKeyCombo('contextmenu').keys).toEqual(['ContextMenu']);
    });
  });

  describe('passthrough', () => {
    it('should pass through already-valid code names', () => {
      const result = parseKeyCombo('Enter');
      expect(result.keys).toEqual(['Enter']);
    });
  });
});
