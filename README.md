# 🚇 Metro Sathi

**Your Namma Metro Companion** — A route-finding web app for Bangalore's Namma Metro that guides users step-by-step on how to travel between any two stations, with platform numbers, direction guidance, and interchange instructions.

🌐 **Live App:** [rrb-24.github.io/metro_sathi](https://rrb-24.github.io/metro_sathi/)

---

## ✨ Features

- **Route Finding** — Shortest path between any two stations using BFS algorithm
- **Step-by-Step Guidance** — Board at station X, Platform Y, towards Z, deboard after N stops
- **Cross-Line Routes** — Handles interchanges across all 5 metro lines automatically
- **Platform Numbers** — Shows correct platform based on direction of travel, with interchange overrides
- **Autocomplete Search** — Fuzzy search across 133 stations as you type
- **Swap Stations** — Quick swap button to reverse your journey
- **Coming Soon Lines** — Routes through upcoming lines (Blue, Pink) shown with a badge
- **Fully Offline** — No backend, no API calls — everything runs in the browser
- **Mobile-First** — Responsive dark-mode UI designed for use at metro stations

## 🗺️ Supported Metro Lines

| Line | Stations | Status |
|------|----------|--------|
| 🟢 Green | Madavara ↔ Silk Institute (32 stations) | ✅ Active |
| 🟣 Purple | Whitefield ↔ Challaghatta (37 stations) | ✅ Active |
| 🟡 Yellow | RV Road ↔ Bommasandra (16 stations) | ✅ Active |
| 🩷 Pink | Kalena Agrahara ↔ Nagawara (18 stations) | ⏳ Upcoming |
| 🔵 Blue | Silk Board ↔ KIA Terminal (30 stations) | ⏳ Upcoming |

**Interchange Stations:** Majestic (Green ↔ Purple), RV Road (Green ↔ Yellow), K.R.Pura (Purple ↔ Blue), MG Road (Purple ↔ Pink), Jayadeva (Yellow ↔ Pink), Silk Board (Yellow ↔ Blue), Nagawara (Pink ↔ Blue)

## 🛠️ Tech Stack

- **HTML/CSS/JS** — No frameworks, no build tools, no npm dependencies
- **JSON Data** — Station data stored in static JSON files (~6 KB total)
- **BFS Algorithm** — Breadth-first search on an adjacency graph for shortest path
- **GitHub Pages** — Free static hosting

## 📁 Project Structure

```
metro_sathi/
├── index.html                # Main single-page app
├── css/
│   └── style.css             # Dark glassmorphism design system
├── js/
│   ├── metro-data.js         # Data loading, graph building, station registry
│   ├── route-finder.js       # BFS pathfinding, segment builder, platform lookup
│   └── ui.js                 # Autocomplete, route rendering, animations
└── station_details/          # Metro line data
    ├── green_line.json
    ├── purple_line.json
    ├── yellow_line.json
    ├── pink_line.json
    └── blue_line.json
```

## 📐 JSON Data Format

Each metro line file follows this structure:

```json
{
  "is_active": true,
  "line_name": "GREEN",
  "color": "#4CAF50",
  "terminals": {
    "start": "Madavara",
    "end": "Silk Institute"
  },
  "stations": ["Madavara", "...", "Silk Institute"],
  "platforms": {
    "default": { "towards_start": 1, "towards_end": 2 },
    "overrides": {
      "Interchange Station Name": { "towards_start": 3, "towards_end": 4 }
    }
  },
  "interchanges": {
    "Interchange Station Name": ["OTHER_LINE"]
  }
}
```

- `stations` — Ordered array; position = station number, order = direction
- `terminals` — Makes `towards_start`/`towards_end` self-documenting
- `platforms.default` — Covers most stations; `overrides` only for interchange exceptions
- `interchanges` — Which other lines connect at each interchange station

## 🚀 Run Locally

No install needed. Just serve the files:

```bash
# Option 1: npx serve
npx serve .

# Option 2: Python
python -m http.server 3000

# Option 3: VS Code Live Server extension
```

Open `http://localhost:3000` in your browser.

> **Note:** Opening `index.html` directly via `file://` won't work because browsers block `fetch()` for local files. You need a local server.

## 🤝 Contributing

1. Fork the repo
2. Update station data in `station_details/*.json`
3. Test locally with `npx serve .`
4. Submit a PR

**To update platform numbers:** Edit the `platforms.overrides` section in the relevant line JSON. The `default` covers regular stations; only interchange stations need overrides.

## 📄 License

RRB

---

Made with ♥ for Bengaluru commuters