const MAX_ABS_COORD = 4096;

const MouseButtons = {
  Left: 1 << 0,
  Right: 1 << 1,
  Middle: 1 << 2,
  Back: 1 << 3,
  Forward: 1 << 4
} as const;

export function getMouseButtonBit(name: string): number {
  switch (name) {
    case 'left': return MouseButtons.Left;
    case 'right': return MouseButtons.Right;
    case 'middle': return MouseButtons.Middle;
    case 'back': return MouseButtons.Back;
    case 'forward': return MouseButtons.Forward;
    default: return MouseButtons.Left;
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export class MouseAbsoluteReport {
  private buttons: number = 0;

  buttonDown(bit: number): void {
    this.buttons |= bit;
  }

  buttonUp(bit: number): void {
    this.buttons &= ~bit;
  }

  buildReport(x: number, y: number, wheel: number = 0): number[] {
    const xAbs = Math.floor(clamp(x, 0, 1) * MAX_ABS_COORD);
    const yAbs = Math.floor(clamp(y, 0, 1) * MAX_ABS_COORD);

    const x1 = xAbs & 0xff;
    const x2 = (xAbs >> 8) & 0xff;
    const y1 = yAbs & 0xff;
    const y2 = (yAbs >> 8) & 0xff;
    const scroll = clamp(Math.round(wheel), -127, 127) & 0xff;

    return [this.buttons, x1, x2, y1, y2, scroll];
  }

  reset(): number[] {
    this.buttons = 0;
    return this.buildReport(0, 0, 0);
  }
}

export class MouseRelativeReport {
  private buttons: number = 0;

  buttonDown(bit: number): void {
    this.buttons |= bit;
  }

  buttonUp(bit: number): void {
    this.buttons &= ~bit;
  }

  buildReport(deltaX: number, deltaY: number, wheel: number = 0): number[] {
    const x = clamp(Math.round(deltaX), -127, 127) & 0xff;
    const y = clamp(Math.round(deltaY), -127, 127) & 0xff;
    const scroll = clamp(Math.round(wheel), -127, 127) & 0xff;
    return [this.buttons, x, y, scroll];
  }

  reset(): number[] {
    this.buttons = 0;
    return this.buildReport(0, 0, 0);
  }
}
