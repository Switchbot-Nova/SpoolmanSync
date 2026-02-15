import logging
import asyncio
import os
from datetime import timedelta
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import CONF_URL, Platform
from homeassistant.core import HomeAssistant
from homeassistant.helpers.aiohttp_client import async_get_clientsession
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator, UpdateFailed

_LOGGER = logging.getLogger(__name__)

DOMAIN = "spoolmansync"
PLATFORMS = [Platform.SELECT, Platform.SENSOR]

async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up SpoolmanSync from a config entry."""
    url = entry.data[CONF_URL]
    session = async_get_clientsession(hass)

    async def async_get_data():
        try:
            # Fetch printers and spools from SpoolmanSync API
            async with session.get(f"{url}/api/printers") as response:
                if response.status != 200:
                    raise UpdateFailed(f"Error fetching printers: {response.status}")
                printers_data = await response.json()

            async with session.get(f"{url}/api/spools") as response:
                if response.status != 200:
                    raise UpdateFailed(f"Error fetching spools: {response.status}")
                spools_data = await response.json()

            return {
                "printers": printers_data.get("printers", []),
                "spools": spools_data.get("spools", [])
            }
        except Exception as err:
            raise UpdateFailed(f"Error communicating with SpoolmanSync: {err}")

    coordinator = DataUpdateCoordinator(
        hass,
        _LOGGER,
        name="spoolmansync",
        update_method=async_get_data,
        update_interval=timedelta(seconds=30),
    )

    await coordinator.async_config_entry_first_refresh()

    hass.data.setdefault(DOMAIN, {})
    hass.data[DOMAIN][entry.entry_id] = coordinator

    # Register custom card
    await async_register_custom_card(hass)

    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)

    return True

async def async_register_custom_card(hass: HomeAssistant):
    """Register the custom card with Home Assistant."""
    # This registers the www directory of the integration as a local resource
    # accessible at /spoolmansync/local/
    www_path = hass.config.path("custom_components", DOMAIN, "www")
    if not os.path.exists(www_path):
        return

    hass.http.register_static_path(
        f"/{DOMAIN}/local",
        www_path,
        cache_headers=False
    )

    # We can't automatically add it to the resources list via Python easily in modern HA
    # but registering the static path makes it available.
    # HACS usually handles the resource registration.

async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload a config entry."""
    unload_ok = await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
    if unload_ok:
        hass.data[DOMAIN].pop(entry.entry_id)

    return unload_ok
