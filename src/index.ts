import { Command } from 'commander';
import { setJsonMode } from './utils/output.js';
import { registerListCommand } from './commands/list.js';
import { registerInfoCommand } from './commands/info.js';
import { registerStatusCommand } from './commands/status.js';
import { registerScreenshotCommand } from './commands/screenshot.js';
import { registerTypeCommand } from './commands/type.js';
import { registerKeyCommand } from './commands/key.js';
import { registerMouseCommand } from './commands/mouse.js';
import { registerDeviceCommand } from './commands/device.js';
import { registerServeCommand } from './commands/serve.js';

const program = new Command();

program
  .name('agentkvm')
  .description('AgentKVM - CLI tool for AI agents to control devices through NanoKVM-USB hardware')
  .version('0.2.0')
  .option('--port <path>', 'serial port path')
  .option('--resolution <WxH>', 'screen resolution (e.g., 1920x1080)')
  .option('--crop <x,y,w,h>', 'viewport crop region (e.g., 656,0,607,1080)')
  .option('--device-type <type>', 'device type (e.g., iphone, pc, android)')
  .option('--remote <url>', 'remote server URL (e.g., http://192.168.1.100:7070)')
  .option('--token <secret>', 'auth token for remote server')
  .option('--json', 'output in JSON format')
  .hook('preAction', () => {
    if (program.opts().json) {
      setJsonMode(true);
    }
  });

registerListCommand(program);
registerInfoCommand(program);
registerStatusCommand(program);
registerScreenshotCommand(program);
registerTypeCommand(program);
registerKeyCommand(program);
registerMouseCommand(program);
registerDeviceCommand(program);
registerServeCommand(program);

program.parse();
