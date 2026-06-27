# 🚇 Metro Sathi

**Your Namma Metro Companion** — A client-side, dynamic Single-Page Application (SPA) for Bangalore's Namma Metro. It guides users step-by-step on how to travel between any two stations with platform numbers, direction guidance, interchange instructions, real-time GPS tracking, and a smart conversational transit guide.

🌐 **Live App:** [rrb-24.github.io/metro_sathi](https://rrb-24.github.io/metro_sathi/)

---

## ✨ Features

- **Route Finding & Navigation** — Instant shortest-path calculation between any two stations using a Breadth-First Search (BFS) graph algorithm.
- **Dynamic SPA Router** — Clean History API-driven URLs (e.g. `/`, `/metro-lines`, `/metro-lines/purple`, `/chat-guide`) with dynamic view template injection and a robust `404.html` redirection fallback simulator for static hosts.
- **AI Chat Guide** — Conversational transit assistant that helps commuters plan itineraries, discover landmarks, and estimate travel costs, maintaining active session recovery across page updates.
- **Live GPS Proximity Tracker** — Station-by-station path tracker with automatic geo-fencing (approaching/arrived alerts) and an intelligent time-based underground simulator for signal-deprived tunnels.
- **Registry-driven Metro Directory** — Modular configuration directory where lines and stations are loaded dynamically from a single central registry file.
- **Platform Numbers & Overrides** — Direction-aware platform listings at each station with transit interchange override capabilities.
- **Fuzzy Autocomplete** — Fast search filter matching any of the 140+ stations as you type.
- **Premium Solid Light Design** — Sleek layouts designed under the Google Stitch guidelines featuring rich colors, card sections, and mobile-responsive views.

---

## 🗺️ Supported Metro Lines

| Line | Terminals | Status |
|------|-----------|--------|
| 🟢 Green | Madavara ↔ Silk Institute (32 stations) | ✅ Operational |
| 🟣 Purple | Whitefield ↔ Challaghatta (37 stations) | ✅ Operational |
| 🟡 Yellow | RV Road ↔ Bommasandra (16 stations) | ✅ Operational |
| 🟤 Grey | Madhavara ↔ Peenya (5 stations) | ✅ Operational |
| 🩷 Pink | Kalena Agrahara ↔ Nagawara (18 stations) | ⏳ Under Development |
| 🔵 Blue | Silk Board ↔ KIA Terminal (30 stations) | ⏳ Under Development |

**Interchange Stations:** Majestic (Green ↔ Purple), RV Road (Green ↔ Yellow), K.R.Pura (Purple ↔ Blue), MG Road (Purple ↔ Pink), Jayadeva (Yellow ↔ Pink), Silk Board (Yellow ↔ Blue), Nagawara (Pink ↔ Blue), Yeshwanthpur (Green ↔ Indian Railways Interchange Hub)

---

## 🛠️ Tech Stack

- **Frontend Core:** Plain HTML5, Javascript (ES6), and HSL-tailored CSS variables.
- **Dynamic Views:** Fetch API template caching system and history-based state updates.
- **Pathfinder:** Adjacency list graph built dynamically from static JSON registry configurations.
- **Hosting:** Static hosting ready (e.g., GitHub Pages).

---

## 📁 Project Structure

```
metro_sathi/
├── index.html                # SPA Shell Layout
├── 404.html                  # SPA Redirect Proxy (Static Host Fallback)
├── css/
│   └── style.css             # Unified Stitch Design tokens & rules
├── js/
│   ├── metro-data.js         # Registry loader, graph builder, station registry
│   ├── route-finder.js       # BFS pathfinding & segment grouping
│   ├── gps-tracker.js        # Geolocation tracker & underground fallback timer
│   ├── chat.js               # Conversational assistant & session recovery
│   ├── ui.js                 # Autocomplete, sections layout, details views
│   └── router.js             # SPA clean URL history manager
├── views/                    # Dynamic HTML page templates
│   ├── home.html             # Pathfinder UI & Chat interface
│   ├── metro-lines.html      # Metro Line list sections & timelines
│   ├── buy-tickets.html      # Mobile ticket instructions
│   ├── privacy.html          # Privacy Policy copy
│   ├── terms.html            # Terms of Service / Disclaimer copy
│   └── support.html          # Interactive Support form & FAQs
└── station_details/          # Modular Metro Line configurations
    ├── registry.json         # Master list of active JSON paths
    ├── green_line.json
    ├── purple_line.json
    ├── yellow_line.json
    ├── grey_line.json
    ├── pink_line.json
    └── blue_line.json
```

---

## 📐 JSON Data Format

All metro lines are declared inside `registry.json` and follow the unified schema below:

```json
{
  "is_active": true,
  "line_name": "GREEN",
  "line_number_label": "Line 02",
  "color": "#4CAF50",
  "length": "30.37 km",
  "corridor": "North-South Corridor",
  "terminals": {
    "start": "Madavara",
    "end": "Silk Institute"
  },
  "stations": ["Madavara", "...", "Silk Institute"],
  "platforms": {
    "default": { "towards_start": 1, "towards_end": 2 },
    "overrides": {
      "Yeshwanthpur": { "towards_start": 1, "towards_end": 2 }
    }
  },
  "interchanges": {
    "Majestic": {
      "display_name": "Majestic (Nadaprabhu Kempegowda)",
      "lines": ["PURPLE"],
      "desc": "Transfer between Purple and Green lines.",
      "icon": "hub"
    }
  }
}
```

- `is_active` — Boolean flag indicating whether the line is operational.
- `stations` — Ordered array representing sequence of travel.
- `interchanges` — Unified dictionary defining connected lines, displays, descriptions, and Google Material Symbol icons.

---

## 🚀 Run Locally

The project runs completely client-side. Serve the workspace locally:

```bash
# Serve locally on port 8085
npx serve . -p 8085
```

Open `http://localhost:8085` in your browser.

> **Note:** Opening `index.html` directly via `file://` won't work because modern browsers restrict dynamic `fetch()` requests on local filesystems. You must run a local web server.

---

## 🤝 Contributing

1. Update or create station data files in `station_details/*.json`.
2. Add new files to `station_details/registry.json`.
3. Test locally using `npx serve . -p 8085`.
4. Submit a Pull Request.

---

Made with ♥ for Bengaluru commuters.