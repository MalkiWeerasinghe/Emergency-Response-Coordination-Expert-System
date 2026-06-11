# Emergency Response Coordination System

This repository contains a production-grade **Emergency Response Coordination Expert System** designed to facilitate real-time decision-making for emergency dispatch centers.

The system uses **logical inference** powered by SWI-Prolog to match reported incidents to the nearest available primary response teams and coordinate supporting units based on incident severity. Unit and landmark locations are tracked on a 2D tactical grid, and Euclidean distance calculations are used to identify the closest available responder.

---

## 🏗️ System Architecture

The project is split into two components:
1. **Backend (Prolog)**: A logical knowledge base and rule engine served via SWI-Prolog's built-in HTTP server.
2. **Frontend (HTML/CSS/JS)**: A modern, responsive dashboard that communicates with the backend via REST API calls and displays recommendations in friendly, natural language.

```
├── backend/
│   ├── data.pl         # Knowledge base: units, availability, landmarks, and incident-to-unit mappings.
│   ├── rules.pl        # Rule engine: distance calculations, nearest-unit search, dispatch/release logic.
│   ├── main.pl         # Consultant loader for data.pl and rules.pl.
│   └── server.pl       # HTTP API router with CORS handling and all endpoint handlers.
└── frontend/
    ├── index.html      # Control room UI structure.
    ├── style.css       # Premium dashboard styling and micro-animations.
    └── app.js          # Fetch requests, map interaction, input handling, and output translation.
```

---

## 🛠️ Installation & Setup

### Prerequisites
You need **SWI-Prolog** installed on your system.
- Download it from [swi-prolog.org](https://www.swi-prolog.org/download/stable) or install it via your package manager.

### 1. Launch the Backend Server
Navigate to the `backend` folder and run the server on port `8080`:
```powershell
cd backend
swipl -s server.pl -g "server(8080), thread_get_message(_)"
```
The server will boot and listen for API calls at `http://localhost:8080/`.

### 2. Launch the Frontend UI
Open the file `frontend/index.html` directly in any web browser. You can do this by double-clicking the file in Explorer or hosting it with a simple HTTP server (e.g., `npx serve` or VS Code Live Server).

---

## 🧠 Expert System Logic & Data Rules

### 1. The Knowledge Base (`data.pl`)

The system tracks all emergency assets and map data as Prolog facts:

- **`unit(Name, Type, X, Y)`**: Registers a response unit with its type and grid coordinates.
  ```prolog
  unit(fire_team_a, fire, 12, 18).
  unit(medical_team_b, medical, 30, 40).
  ```
- **`available(UnitName)`**: A dynamic fact that tracks which units are currently free.
  ```prolog
  :- dynamic available/1.
  available(fire_team_a).
  ```
- **`landmark(Name, X, Y)`**: Registers named geographic locations where incidents may occur. These are served dynamically to the frontend via the `/landmarks` API endpoint.
  ```prolog
  landmark('Central Business District', 25, 25).
  landmark('Chemical Processing Plant', 30, 40).
  ```
- **`primary_unit(IncidentType, UnitType)`**: Maps incident types to their primary response category.
  ```prolog
  primary_unit(fire, fire).
  primary_unit(flood, rescue).
  ```
- **`supports(SupportUnitType, IncidentType)`**: Maps secondary assistance rules for critical-severity incidents.
  ```prolog
  supports(medical, fire).
  supports(police, building_collapse).
  ```

### 2. The Rule Engine (`rules.pl`)

The rule engine is structured in five layers from high-level APIs to low-level math helpers:

1. **Public APIs** (`dispatch_unit/1`, `release_unit/1`, `recommend/5`): Entry points for state changes and recommendations.
2. **Intermediate Selection** (`primary_response/4`, `support_responses/4`): Routes an incident to the correct unit type and collects all support units.
3. **Core Geographic Search** (`nearest_available/4`): Uses `findall/3` to collect all available units of a type, then finds the one with the minimum Euclidean distance to the incident coordinates.
4. **String Formatting** (`format_unit/2`, `format_units/2`): Converts internal `unit(Name, Dist)` terms into human-readable strings.
5. **Low-Level Math** (`calculate_distance/5`, `nearest/2`): Computes the Euclidean distance (Pythagorean theorem) and recursively finds the minimum in a list.

### 3. The API Server (`server.pl`)

SWI-Prolog's HTTP library is used to expose the rule engine as a REST API. All endpoints support CORS and handle `OPTIONS` preflight requests.

| Endpoint | Method | Description |
|---|---|---|
| `/recommend` | `GET` | Returns primary and (if critical) support unit recommendations for a given incident, severity, and X/Y coordinates. |
| `/units` | `GET` | Returns the full list of all units with their type, coordinates, and current availability status. |
| `/landmarks` | `GET` | Returns all landmark facts from `data.pl` as a JSON array. |
| `/dispatch` | `POST` | Marks a named unit as busy (retracts `available/1` from memory). |
| `/release` | `POST` | Marks a named unit as available again (asserts `available/1` back into memory). |

---

## 🌟 Features

- **Proximity-Based Routing**: Calculates Euclidean distance on the fly to always find the single closest available responder to the incident coordinates.
- **Tiered Severity Logic**: Normal incidents get a single primary responder. Critical incidents additionally trigger the support rules, pulling in all mapped supporting unit types.
- **Interactive Tactical Map**: Dispatchers can click anywhere on the 100×100 grid to pinpoint the exact incident location. Unit markers are plotted live with hover tooltips showing their name, type, sector, and status.
- **Dynamic Landmark Loading**: The "Select Incident Location" dropdown is populated at page load by fetching `landmark/3` facts directly from the Prolog backend — no hardcoded HTML options.
- **Live Unit State Management**: Units can be manually dispatched or released from the Unit Status Board, and the recommendation engine always reflects the latest state.
- **Intelligent Input Handling**: Input is sanitized and normalised (trims whitespace, lowercases) before querying the backend.
- **CORS & Preflight Support**: Configured to safely accept requests from local origins and handle `OPTIONS` requests out-of-the-box.
