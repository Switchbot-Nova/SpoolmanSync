# SpoolmanSync Home Assistant Integration

This integration allows you to manage your Bambu Lab AMS tray assignments directly from Home Assistant.

## Features

- **AMS Tray Entities**: Creates `select` entities for each AMS tray (and external spool) discovered via SpoolmanSync.
- **Spool Assignment**: Change the assigned spool for any tray using the `select` entity.
- **Spool Info**: Provides sensors with detailed information about the currently assigned spool (vendor, material, remaining weight, etc.).

## Installation

1. Copy the `custom_components/spoolmansync` directory to your Home Assistant `custom_components` folder.
2. Restart Home Assistant.
3. Go to **Settings** -> **Devices & Services** -> **Add Integration**.
4. Search for **SpoolmanSync**.
5. Enter your SpoolmanSync URL (e.g., `http://192.168.0.34:3000`).

## Requirements

- **SpoolmanSync** must be running and accessible from Home Assistant.
- **ha-bambulab** integration must be installed and configured in Home Assistant (as SpoolmanSync relies on it for printer discovery).
