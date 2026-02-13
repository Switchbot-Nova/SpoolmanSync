# Changelog

All notable changes to SpoolmanSync will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.1.0] - 2026-02-13

### Added
- **QR code label generation** - Create and print QR code labels for spools; scan with phone camera to assign to AMS trays
- **NFC tag writing** - Write spool URLs to NFC sticker tags for tap-to-assign on Android devices
- **Dynamic spool assignment page** - QR scans and NFC taps redirect to a dedicated assignment page with tray selection
- **AMS 2 Pro and AMS HT support** - Entity pattern matching for newer AMS hardware variants
- **Auto-recovery for broken HA connections** - Embedded mode silently re-authenticates when tokens are invalidated; shows reconnect form if password was changed (#10)
- **Unraid Community Apps template** - XML template and icon for Unraid CA store

### Fixed
- External spool active tray detection for printers without AMS (#11)
- Crash when assigned spool has missing filament color or material data (#12)
- AMS discovery for entities with renamed or missing printer prefix

## [1.0.0] - 2026-02-09

### Added
- **Dashboard** - View all printers, AMS units, and tray assignments at a glance
- **Spool assignment** - Click any tray to assign a spool from Spoolman inventory
- **QR/barcode scanning** - Scan Spoolman QR codes to quickly look up and assign spools
- **Automatic filament usage tracking** - Deduct used filament weight after prints
- **Multi-AMS support** - Track multiple AMS units per printer
- **A1 AMS Lite support** - Works with Bambu A1/A1 Mini
- **External spool support** - Track filament loaded outside the AMS
- **Bundled Home Assistant** - Embedded mode includes pre-configured HA with HACS and ha-bambulab
- **Bambu Cloud login** - Add printers using Bambu Cloud credentials
- **17 language support** - Works with all ha-bambulab localizations
- **Multi-architecture Docker builds** - Supports amd64 and arm64
