/**
 * SpoolmanSync AMS Card
 */
class SpoolmanSyncCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  set hass(hass) {
    this._hass = hass;
    if (!this.content) {
      this.render();
    } else {
      this.update();
    }
  }

  setConfig(config) {
    this._config = config;
  }

  render() {
    this.shadowRoot.innerHTML = `
      <style>
        ha-card {
          padding: 16px;
        }
        .grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
        }
      </style>
      <ha-card header="SpoolmanSync AMS">
        <div class="grid"></div>
      </ha-card>
    `;
    this.content = this.shadowRoot.querySelector(".grid");
    this.update();
  }

  update() {
    if (!this.content || !this._config || !this._hass) return;

    const entities = this._config.entities || [];
    this.content.innerHTML = "";

    entities.forEach(entityId => {
      const tile = document.createElement("ha-tile-card");
      tile.hass = this._hass;
      tile.config = {
        entity: entityId,
        icon: "mdi:printer-3d-nozzle",
        color: "blue"
      };
      this.content.appendChild(tile);
    });
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
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

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
    this.shadowRoot.innerHTML = `
      <style>
        .card-config {
          padding: 16px;
        }
        ha-textarea {
          width: 100%;
        }
      </style>
      <div class="card-config">
        <p>Enter AMS Tray Entity IDs (one per line):</p>
        <ha-textarea
          label="Entities"
          .value="${(this._config?.entities || []).join("\n")}"
        ></ha-textarea>
      </div>
    `;
    
    const input = this.shadowRoot.querySelector("ha-textarea");
    input.addEventListener("change", (ev) => {
      const entities = ev.target.value.split("\n").filter(e => e.trim() !== "");
      const event = new CustomEvent("config-changed", {
        detail: { config: { ...this._config, entities } },
        bubbles: true,
        composed: true,
      });
      this.dispatchEvent(event);
    });
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

console.info(
  "%c SPOOLMANSYNC-CARD %c 1.1.8 ",
  "color: white; background: #03a9f4; font-weight: 700;",
  "color: #03a9f4; background: white; font-weight: 700;"
);
