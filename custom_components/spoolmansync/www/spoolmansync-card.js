class SpoolmanSyncCard extends HTMLElement {
  set hass(hass) {
    if (!this.content) {
      this.innerHTML = `
        <ha-card header="SpoolmanSync AMS">
          <div class="card-content"></div>
        </ha-card>
      `;
      this.content = this.querySelector(".card-content");
    }

    const entities = this.config.entities || [];
    this.content.innerHTML = "";

    const grid = document.createElement("div");
    grid.style.display = "grid";
    grid.style.gridTemplateColumns = "repeat(2, 1fr)";
    grid.style.gap = "8px";

    entities.forEach(entityId => {
      const tile = document.createElement("ha-tile-card");
      tile.hass = hass;
      tile.config = {
        entity: entityId,
        icon: "mdi:printer-3d-nozzle",
        color: "blue"
      };
      grid.appendChild(tile);
    });

    this.content.appendChild(grid);
  }

  setConfig(config) {
    if (!config.entities) {
      throw new Error("You need to define entities");
    }
    this.config = config;
  }

  static getConfigElement() {
    return document.createElement("spoolmansync-card-editor");
  }

  static getStubConfig() {
    return { entities: [] };
  }
}

customElements.define("spoolmansync-card", SpoolmanSyncCard);

class SpoolmanSyncCardEditor extends HTMLElement {
  set hass(hass) {
    this._hass = hass;
    if (!this.initialized) {
      this.render();
      this.initialized = true;
    }
  }

  setConfig(config) {
    this._config = config;
  }

  render() {
    this.innerHTML = `
      <div class="card-config">
        <p>Select AMS Tray Entities:</p>
        <div id="entities"></div>
      </div>
    `;
    
    // In a real implementation, we would use ha-entity-picker
    // For this demo, we'll just show a text area for entity IDs
    const container = this.querySelector("#entities");
    const input = document.createElement("ha-textarea");
    input.label = "Entities (one per line)";
    input.value = (this._config.entities || []).join("\n");
    input.addEventListener("change", (ev) => {
      const entities = ev.target.value.split("\n").filter(e => e.trim() !== "");
      const event = new CustomEvent("config-changed", {
        detail: { config: { ...this._config, entities } },
        bubbles: true,
        composed: true,
      });
      this.dispatchEvent(event);
    });
    container.appendChild(input);
  }
}

customElements.define("spoolmansync-card-editor", SpoolmanSyncCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "spoolmansync-card",
  name: "SpoolmanSync AMS Card",
  description: "A card to manage your SpoolmanSync AMS trays",
  preview: true,
});
