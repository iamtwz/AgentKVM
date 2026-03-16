# AgentKVM Quick Start Guide

> This guide is designed to be read by your AI agent. Share this file with your agent and let it walk you through the setup process.

## Installation

```bash
npm install -g agentkvm
```

**Prerequisites:**
- [NanoKVM-USB](https://wiki.sipeed.com/nanokvm) hardware connected to your computer
- [ffmpeg](https://ffmpeg.org/) installed (for screenshot capture)
- Node.js >= 18

## Setup Steps

### 1. Find the serial port

```bash
agentkvm list
```

Pick the correct serial port from the output (e.g. `/dev/tty.usbserial-2140` on macOS, `/dev/ttyUSB0` on Linux).

### 2. Check connection

```bash
agentkvm --port <your-serial-port> status
```

### 3. Take a test screenshot

```bash
agentkvm --port <your-serial-port> screenshot
```

### 4. Save config

Create `~/.config/agentkvm/config.json`:

```json
{
  "serialPort": "<your-serial-port>",
  "resolution": { "width": 1920, "height": 1080 },
  "videoDevice": "USB3 Video",
  "deviceType": "iphone",
  "crop": { "x": 738, "y": 55, "width": 447, "height": 970 }
}
```

Now all commands work without flags:

```bash
agentkvm screenshot
agentkvm mouse click 223 485
```

## Configuration

Config file: `~/.config/agentkvm/config.json`

```json
{
  "serialPort": "/dev/tty.usbserial-2140",
  "baudRate": 57600,
  "resolution": { "width": 1920, "height": 1080 },
  "videoDevice": "USB3 Video",
  "outputDir": "/tmp/screenshots",
  "deviceType": "iphone",
  "crop": { "x": 738, "y": 55, "width": 447, "height": 970 },
  "customProfiles": {},
  "serverHost": "0.0.0.0",
  "serverPort": 7070,
  "serverToken": "my-secret",
  "remoteUrl": "http://192.168.1.100:7070",
  "remoteToken": "my-secret"
}
```

All fields are optional. CLI flags override config values.

## Commands

### Screenshot

```bash
agentkvm screenshot [--json] [--device <id>] [--output <dir>]
agentkvm screenshot --list-devices
```

### Keyboard

```bash
agentkvm type <text> [--delay <ms>]        # Type a string character by character
agentkvm key <combo> [--hold <ms>]          # Press a key combination
```

Key combo examples: `enter`, `tab`, `escape`, `ctrl+c`, `cmd+space`, `alt+f4`, `ctrl+alt+del`, `shift+ctrl+l`

### Mouse

```bash
agentkvm mouse move <x> <y>
agentkvm mouse click <x> <y> [--button left|right|middle] [--double]
agentkvm mouse scroll <x> <y> --delta <n>    # positive=up, negative=down
agentkvm mouse drag <x1> <y1> <x2> <y2> [--button left|right] [--steps <n>]
```

### Device Profiles

```bash
agentkvm device list                        # List all profiles
agentkvm device set iphone                  # Set active device type
agentkvm device info                        # Show current configuration
agentkvm device add mydevice --mode device  # Add custom profile
agentkvm device remove mydevice             # Remove custom profile
```

Built-in profiles:

| Type | Coordinate Mode | Use Case |
|------|----------------|----------|
| `iphone` | device | iPhone via HDMI adapter |
| `android` | device | Android via HDMI adapter |
| `pc` | frame | Windows PC |
| `mac` | frame | macOS computer |
| `linux` | frame | Linux machine |

### Status & Info

```bash
agentkvm list                               # List serial ports
agentkvm status                             # Check device connection
agentkvm info                               # Get hardware info (chip version, LED states)
```

## Coordinate System

Coordinates are always **pixel positions relative to the screenshot image** (top-left = `0, 0`). AgentKVM translates them to hardware coordinates internally.

Two modes determine how this translation works:

- **`device` mode** (iPhone, Android) — The crop region is the device's full screen. HID coordinates 0–4096 map to the crop area only. Use this when the HDMI output contains the device screen within a larger frame.

- **`frame` mode** (PC, Mac, Linux) — The crop region is a visual focus area. HID coordinates 0–4096 map to the full monitor. Use this when controlling a computer whose display resolution matches the capture.

## Remote Mode

### Start the server

On the machine with the NanoKVM-USB connected:

```bash
agentkvm serve --token my-secret
```

### Control remotely

From any other machine, use the same CLI commands with `--remote`:

```bash
agentkvm --remote http://192.168.1.100:7070 --token my-secret screenshot --json
agentkvm --remote http://192.168.1.100:7070 --token my-secret mouse click 223 485
agentkvm --remote http://192.168.1.100:7070 --token my-secret type "hello"
agentkvm --remote http://192.168.1.100:7070 --token my-secret key ctrl+c
```

Or save remote config:

```json
{
  "remoteUrl": "http://192.168.1.100:7070",
  "remoteToken": "my-secret"
}
```

Then commands automatically route to the remote server.

### HTTP API

The server also exposes a REST API for direct integration:

| Method | Endpoint | Body |
|--------|----------|------|
| `GET` | `/api/status` | — |
| `GET` | `/api/info` | — |
| `GET` | `/api/screenshot?format=json` | — |
| `POST` | `/api/type` | `{ "text": "hello", "delay": 50 }` |
| `POST` | `/api/key` | `{ "combo": "ctrl+c" }` |
| `POST` | `/api/mouse/move` | `{ "x": 100, "y": 200 }` |
| `POST` | `/api/mouse/click` | `{ "x": 100, "y": 200, "button": "left" }` |
| `POST` | `/api/mouse/scroll` | `{ "x": 100, "y": 200, "delta": -3 }` |
| `POST` | `/api/mouse/drag` | `{ "x1": 0, "y1": 0, "x2": 100, "y2": 200 }` |

Authentication: `Authorization: Bearer <token>` header.

## JSON Output

All commands support `--json` for machine-readable output:

```bash
$ agentkvm --json screenshot
{"success":true,"data":{"path":"/tmp/screenshot-20260317-120000.png","fullResolution":"1920x1080","crop":{"x":738,"y":55,"width":447,"height":970},"imageSize":"447x970"}}

$ agentkvm --json status
{"success":true,"data":{"serialPort":"/dev/tty.usbserial-2140","connected":true,"chipVersion":"V1.8","targetConnected":true}}
```
