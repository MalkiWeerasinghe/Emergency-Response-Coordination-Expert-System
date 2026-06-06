# Emergency Response Coordination Expert System

This repository contains a simple, production-grade **Emergency Response Coordination Expert System** designed to facilitate real-time decision-making for emergency dispatch centers. 

The system utilizes **logical inference** to match reported incidents to the nearest available primary response teams and coordinate supporting units based on the severity of the situation.

---

## 🏗️ System Architecture

The project is split into two components:
1. **Backend (Prolog)**: A logical knowledge base and rule engine served via SWI-Prolog's HTTP server.
2. **Frontend (HTML/CSS/JS)**: A modern, responsive dashboard with a dark-slate theme that makes requests to the backend and displays recommendations in friendly, natural language.

```
├── backend/
│   ├── data.pl         # Database: active units, availability states, and incident-to-unit mappings.
│   ├── rules.pl        # Logic engine: nearest unit computation and recommendation queries.
│   ├── main.pl         # Consultant loader for data.pl and rules.pl.
│   └── server.pl       # HTTP API Router and CORS handling.
└── frontend/
    ├── index.html      # Control room UI structure.
    ├── style.css       # Premium Dashboard Styling and micro-animations.
    └── app.js          # Fetch requests, input sanitization, and output translation.
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
Open the file `frontend/index.html` directly in any web browser. You can do this by double-clicking the file in your explorer or hosting it using a simple HTTP server (e.g. `npx serve` or Live Server).

---

## 🧠 Expert System Logic & Data Rules

### 1. The Database (`data.pl`)
The system tracks emergency response assets as facts:
- **`unit(Name, Type, Distance)`**: e.g., `unit(fire_team_a, fire, 5).`
- **`available(UnitName)`**: Tracks which teams are free to be dispatched.
- **`primary_unit(IncidentType, MainUnitType)`**: Mappings such as `primary_unit(fire, fire).` or `primary_unit(flood, rescue).`
- **`supports(SupportUnitType, IncidentType)`**: Secondary assistance rules such as `supports(medical, fire).`

### 2. The Rule Engine (`rules.pl`)
When a request is submitted:
- **Primary Units**: The engine filters active units by category, checks availability, and finds the closest unit using the `nearest/2` distance comparison rules.
- **Support Units**: For `critical` severity cases, a `findall/3` operation matches all supporting units mapped to the incident, resolves their nearest available units, and compiles a support listing.
- **Response Formatting**: Handled on the frontend via JavaScript to present recommendations in clear, natural language instructions (e.g., *"Fire Team A is the nearest unit (5 km away) and has been designated for immediate dispatch"*).

---

## 🌟 Features
- **Intelligent Normalization**: Sanitizes input strings (ignores casing/spaces, mapping inputs like *"  Fire "* to `"fire"` automatically).
- **CORS Allowed**: Configured to safely accept incoming requests from local origins.
- **Preflight Support**: Handles `OPTIONS` HTTP requests out-of-the-box.
- **Quick-Select Dashboard**: Provides button tags for common pre-defined incidents in the database.
