function selectIncident(type) {
    const input = document.getElementById("incident");
    input.value = type;
    
    // Update active class for tag buttons
    const tags = document.querySelectorAll(".tag");
    tags.forEach(tag => {
        if (tag.textContent.toLowerCase().includes(type.replace('_', ' '))) {
            tag.classList.add("active");
        } else {
            tag.classList.remove("active");
        }
    });
}

function formatUnitFriendly(rawUnitStr, isPrimary) {
    const match = rawUnitStr.match(/^([a-zA-Z0-9_]+)\s*\(([^)]+)\)$/);
    if (!match) return rawUnitStr;

    const rawName = match[1];
    const distance = match[2];

    const cleanName = rawName
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');

    if (isPrimary) {
        return `🚨 <strong>${cleanName}</strong> is the nearest unit (<strong>${distance}</strong> away) and has been designated for immediate dispatch.`;
    } else {
        return `<strong>${cleanName}</strong> is nearby (<strong>${distance}</strong> away) and is available to assist.`;
    }
}

function dispatch() {
    const incidentInput = document.getElementById("incident").value;
    const incident = incidentInput.trim().toLowerCase();
    const severity = document.getElementById("severity").value;

    const primaryEl = document.getElementById("primary");
    const supportEl = document.getElementById("support");

    if (!incident) {
        primaryEl.innerHTML = "Please select or type an incident.";
        primaryEl.className = "result-display error";
        supportEl.innerHTML = "No active dispatch";
        supportEl.className = "result-display empty";
        return;
    }

    // Set loading state
    primaryEl.innerHTML = "Querying coordination system...";
    primaryEl.className = "result-display empty";
    supportEl.innerHTML = "Querying coordination system...";
    supportEl.className = "result-display empty";

    fetch(`http://localhost:8080/recommend?incident=${incident}&severity=${severity}`)
        .then(res => {
            if (!res.ok) {
                throw new Error(`System offline or failed (HTTP ${res.status})`);
            }
            return res.json();
        })
        .then(data => {
            // Update Primary Response
            if (data.primary && data.primary !== "No primary unit") {
                primaryEl.innerHTML = formatUnitFriendly(data.primary, true);
                primaryEl.className = "result-display active";
            } else {
                primaryEl.innerHTML = "No primary unit allocated for this incident.";
                primaryEl.className = "result-display empty";
            }

            // Update Support Units Response
            if (data.support && data.support !== "No support units") {
                const supportUnits = data.support.split(', ');
                const unitsList = supportUnits.map(unit => `<li>🔷 ${formatUnitFriendly(unit, false)}</li>`).join('');
                supportEl.innerHTML = `<ul>${unitsList}</ul>`;
                supportEl.className = "result-display active-support";
            } else {
                supportEl.innerHTML = "No support units required.";
                supportEl.className = "result-display empty";
            }
        })
        .catch(err => {
            primaryEl.innerHTML = `⚠️ Error: ${err.message}`;
            primaryEl.className = "result-display error";
            supportEl.innerHTML = "Dispatch coordination failed.";
            supportEl.className = "result-display error";
        });
}

// Add event listener to clear button active tags if user types manually
document.getElementById("incident").addEventListener("input", function() {
    const val = this.value.trim().toLowerCase();
    const tags = document.querySelectorAll(".tag");
    tags.forEach(tag => {
        if (tag.textContent.toLowerCase() === val) {
            tag.classList.add("active");
        } else {
            tag.classList.remove("active");
        }
    });
});