import { isModifier } from './keymap.js';

// Map friendly CLI key names to event.code names used in KeycodeMap/ModifierMap
const KEY_ALIASES: Record<string, string> = {
  // Modifiers
  ctrl: 'ControlLeft',
  control: 'ControlLeft',
  shift: 'ShiftLeft',
  alt: 'AltLeft',
  option: 'AltLeft',
  meta: 'MetaLeft',
  win: 'MetaLeft',
  cmd: 'MetaLeft',
  command: 'MetaLeft',
  super: 'MetaLeft',

  // Common keys
  enter: 'Enter',
  return: 'Enter',
  esc: 'Escape',
  escape: 'Escape',
  backspace: 'Backspace',
  bs: 'Backspace',
  tab: 'Tab',
  space: 'Space',
  delete: 'Delete',
  del: 'Delete',

  // Arrow keys
  up: 'ArrowUp',
  down: 'ArrowDown',
  left: 'ArrowLeft',
  right: 'ArrowRight',

  // Navigation
  home: 'Home',
  end: 'End',
  pageup: 'PageUp',
  pgup: 'PageUp',
  pagedown: 'PageDown',
  pgdn: 'PageDown',
  insert: 'Insert',
  ins: 'Insert',

  // Lock keys
  capslock: 'CapsLock',
  numlock: 'NumLock',
  scrolllock: 'ScrollLock',

  // Special
  printscreen: 'PrintScreen',
  prtsc: 'PrintScreen',
  pause: 'Pause',
  contextmenu: 'ContextMenu',
  menu: 'ContextMenu',

  // Punctuation (for key combos like ctrl+minus)
  minus: 'Minus',
  equal: 'Equal',
  equals: 'Equal',
  comma: 'Comma',
  period: 'Period',
  dot: 'Period',
  slash: 'Slash',
  backslash: 'Backslash',
  semicolon: 'Semicolon',
  quote: 'Quote',
  backquote: 'Backquote',
  bracketleft: 'BracketLeft',
  bracketright: 'BracketRight',
};

function resolveKeyName(name: string): string {
  const lower = name.toLowerCase();

  // Check alias map first
  if (KEY_ALIASES[lower]) {
    return KEY_ALIASES[lower];
  }

  // Single letter: a-z -> KeyA-KeyZ
  if (/^[a-z]$/.test(lower)) {
    return `Key${lower.toUpperCase()}`;
  }

  // Single digit: 0-9 -> Digit0-Digit9
  if (/^[0-9]$/.test(lower)) {
    return `Digit${lower}`;
  }

  // Function keys: f1-f24 -> F1-F24
  const fMatch = lower.match(/^f(\d{1,2})$/);
  if (fMatch) {
    const num = parseInt(fMatch[1], 10);
    if (num >= 1 && num <= 24) {
      return `F${num}`;
    }
  }

  // Numpad keys: numpad0-numpad9, numpadadd, etc.
  if (lower.startsWith('numpad')) {
    return `Numpad${name.slice(6)}`;
  }

  // Already a valid code name (e.g., "Enter", "ArrowUp")
  return name;
}

export interface ParsedKeyCombo {
  modifiers: string[];
  keys: string[];
}

export function parseKeyCombo(combo: string): ParsedKeyCombo {
  const parts = combo.split('+').map((p) => p.trim()).filter(Boolean);
  const modifiers: string[] = [];
  const keys: string[] = [];

  for (const part of parts) {
    const resolved = resolveKeyName(part);
    if (isModifier(resolved)) {
      modifiers.push(resolved);
    } else {
      keys.push(resolved);
    }
  }

  return { modifiers, keys };
}
