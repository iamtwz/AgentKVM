import { getKeycode, getModifierBit, isModifier } from './keymap.js';

const MAX_KEYS = 6;

export class KeyboardReport {
  private modifier: number = 0;
  private pressedKeys: Map<string, number> = new Map();

  keyDown(code: string): number[] {
    if (isModifier(code)) {
      this.modifier |= getModifierBit(code);
    } else {
      const keycode = getKeycode(code);
      if (keycode !== undefined && this.pressedKeys.size < MAX_KEYS) {
        this.pressedKeys.set(code, keycode);
      }
    }
    return this.buildReport();
  }

  keyUp(code: string): number[] {
    if (isModifier(code)) {
      this.modifier &= ~getModifierBit(code);
    } else {
      this.pressedKeys.delete(code);
    }
    return this.buildReport();
  }

  reset(): number[] {
    this.modifier = 0;
    this.pressedKeys.clear();
    return this.buildReport();
  }

  private buildReport(): number[] {
    const report = [this.modifier, 0, 0, 0, 0, 0, 0, 0];

    let i = 2;
    for (const keycode of this.pressedKeys.values()) {
      if (i >= 8) break;
      report[i++] = keycode;
    }

    return report;
  }
}
