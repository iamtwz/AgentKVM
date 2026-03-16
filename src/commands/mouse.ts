import { Command } from 'commander';
import { Device } from '../protocol/device.js';
import { getCrop, getCoordinateMode, getRemote, getResolution, getSerialPort } from './helpers.js';
import {
  remoteMouseMove, remoteMouseClick, remoteMouseScroll, remoteMouseDrag
} from '../remote/client.js';
import {
  actionMouseMove, actionMouseClick, actionMouseScroll, actionMouseDrag,
  type MouseContext
} from '../actions/index.js';
import { printError, printSuccess } from '../utils/output.js';

function getMouseContext(program: Command): MouseContext {
  return {
    resWidth: getResolution(program).width,
    resHeight: getResolution(program).height,
    crop: getCrop(program),
    coordinateMode: getCoordinateMode(program)
  };
}

export function registerMouseCommand(program: Command): void {
  const mouseCmd = program
    .command('mouse')
    .description('Mouse operations (move, click, scroll, drag)');

  mouseCmd
    .command('move <x> <y>')
    .description('Move mouse to absolute pixel position')
    .action(async (xStr: string, yStr: string) => {
      const [x, y] = [Number(xStr), Number(yStr)];

      const remote = getRemote(program);
      if (remote) {
        try {
          const res = await remoteMouseMove(remote, x, y);
          printSuccess(res.data);
        } catch (err: unknown) {
          printError(`Remote error: ${err instanceof Error ? err.message : String(err)}`);
        }
        return;
      }

      const device = new Device();
      try {
        await device.connect(getSerialPort(program));
        await actionMouseMove(device, x, y, getMouseContext(program));
        printSuccess(`Mouse moved to (${x}, ${y})`);
      } catch (err: unknown) {
        printError(`Failed to move mouse: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        await device.disconnect();
      }
    });

  mouseCmd
    .command('click <x> <y>')
    .description('Click at pixel position')
    .option('--button <name>', 'button name: left, right, middle', 'left')
    .option('--double', 'double click')
    .action(async (xStr: string, yStr: string, opts: { button: string; double?: boolean }) => {
      const [x, y] = [Number(xStr), Number(yStr)];

      const remote = getRemote(program);
      if (remote) {
        try {
          const res = await remoteMouseClick(remote, x, y, opts.button, opts.double);
          printSuccess(res.data);
        } catch (err: unknown) {
          printError(`Remote error: ${err instanceof Error ? err.message : String(err)}`);
        }
        return;
      }

      const device = new Device();
      try {
        await device.connect(getSerialPort(program));
        await actionMouseClick(device, x, y, getMouseContext(program), opts.button, opts.double);
        const clickType = opts.double ? 'Double clicked' : 'Clicked';
        printSuccess(`${clickType} ${opts.button} at (${x}, ${y})`);
      } catch (err: unknown) {
        printError(`Failed to click: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        await device.disconnect();
      }
    });

  mouseCmd
    .command('scroll <x> <y>')
    .description('Scroll at pixel position')
    .requiredOption('--delta <n>', 'scroll steps (positive=up, negative=down)')
    .action(async (xStr: string, yStr: string, opts: { delta: string }) => {
      const [x, y] = [Number(xStr), Number(yStr)];
      const delta = parseInt(opts.delta, 10);

      const remote = getRemote(program);
      if (remote) {
        try {
          const res = await remoteMouseScroll(remote, x, y, delta);
          printSuccess(res.data);
        } catch (err: unknown) {
          printError(`Remote error: ${err instanceof Error ? err.message : String(err)}`);
        }
        return;
      }

      const device = new Device();
      try {
        await device.connect(getSerialPort(program));
        await actionMouseScroll(device, x, y, getMouseContext(program), delta);
        printSuccess(`Scrolled ${delta} steps at (${x}, ${y})`);
      } catch (err: unknown) {
        printError(`Failed to scroll: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        await device.disconnect();
      }
    });

  mouseCmd
    .command('drag <x1> <y1> <x2> <y2>')
    .description('Drag from (x1,y1) to (x2,y2)')
    .option('--button <name>', 'button name: left, right', 'left')
    .option('--steps <n>', 'interpolation steps', '20')
    .action(async (
      x1Str: string, y1Str: string, x2Str: string, y2Str: string,
      opts: { button: string; steps: string }
    ) => {
      const [x1, y1, x2, y2] = [Number(x1Str), Number(y1Str), Number(x2Str), Number(y2Str)];
      const steps = parseInt(opts.steps, 10) || 20;

      const remote = getRemote(program);
      if (remote) {
        try {
          const res = await remoteMouseDrag(remote, x1, y1, x2, y2, opts.button, steps);
          printSuccess(res.data);
        } catch (err: unknown) {
          printError(`Remote error: ${err instanceof Error ? err.message : String(err)}`);
        }
        return;
      }

      const device = new Device();
      try {
        await device.connect(getSerialPort(program));
        await actionMouseDrag(device, x1, y1, x2, y2, getMouseContext(program), opts.button, steps);
        printSuccess(`Dragged from (${x1}, ${y1}) to (${x2}, ${y2})`);
      } catch (err: unknown) {
        printError(`Failed to drag: ${err instanceof Error ? err.message : String(err)}`);
      } finally {
        await device.disconnect();
      }
    });
}
