#!/bin/bash

# SpoolmanSync Home Assistant Entrypoint
# Initializes HA config on first run and starts Home Assistant

set -e

CONFIG_DIR="/config"
DEFAULT_CONFIG_DIR="/default_config"

echo "=== SpoolmanSync Home Assistant Starting ==="
echo "Config dir: $CONFIG_DIR"
echo "Default config dir: $DEFAULT_CONFIG_DIR"

# Debug: Show what's in default_config
echo "Contents of $DEFAULT_CONFIG_DIR:"
ls -la "$DEFAULT_CONFIG_DIR/" 2>/dev/null || echo "  (empty or not found)"

if [ -d "$DEFAULT_CONFIG_DIR/custom_components" ]; then
    echo "Contents of $DEFAULT_CONFIG_DIR/custom_components:"
    ls -la "$DEFAULT_CONFIG_DIR/custom_components/" 2>/dev/null || echo "  (empty)"
fi

# First run detection - if no configuration.yaml exists in /config
if [ ! -f "$CONFIG_DIR/configuration.yaml" ]; then
    echo "=== First run detected - initializing configuration ==="

    # Copy default config files
    echo "Copying configuration.yaml..."
    cp "$DEFAULT_CONFIG_DIR/configuration.yaml" "$CONFIG_DIR/configuration.yaml"

    echo "Copying automations.yaml..."
    cp "$DEFAULT_CONFIG_DIR/automations.yaml" "$CONFIG_DIR/automations.yaml"

    # Note: We don't pre-seed .storage files - HA will create them during onboarding
    # This is more reliable than trying to pre-seed auth files

    # Copy custom_components (HACS, ha-bambulab)
    echo "Copying custom_components..."
    mkdir -p "$CONFIG_DIR/custom_components"
    if [ -d "$DEFAULT_CONFIG_DIR/custom_components" ]; then
        cp -rv "$DEFAULT_CONFIG_DIR/custom_components/"* "$CONFIG_DIR/custom_components/" || echo "Warning: custom_components copy had issues"
    else
        echo "WARNING: No custom_components found in $DEFAULT_CONFIG_DIR"
    fi

    echo "=== Configuration initialized ==="
else
    echo "Existing configuration found, skipping initialization"
fi

# Verify what we have in config
echo "=== Verification ==="
echo "Contents of $CONFIG_DIR:"
ls -la "$CONFIG_DIR/" 2>/dev/null

if [ -d "$CONFIG_DIR/custom_components" ]; then
    echo "Contents of $CONFIG_DIR/custom_components:"
    ls -la "$CONFIG_DIR/custom_components/" 2>/dev/null
fi

if [ -d "$CONFIG_DIR/.storage" ]; then
    echo "Contents of $CONFIG_DIR/.storage:"
    ls -la "$CONFIG_DIR/.storage/" 2>/dev/null
fi

echo "=== Setting permissions for SpoolmanSync ==="
# Allow the SpoolmanSync app container to write to config files
# The app runs as UID 1001 (nextjs user)
chmod 666 "$CONFIG_DIR/configuration.yaml" 2>/dev/null || true
chmod 666 "$CONFIG_DIR/automations.yaml" 2>/dev/null || true
# Make config dir writable so new files can be created
chmod 777 "$CONFIG_DIR" 2>/dev/null || true

echo "=== Starting Home Assistant ==="

# Start Home Assistant with the original init script
exec /init
