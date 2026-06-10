let recommendedUnits = [];

// Helper to format names like fire_team_a -> Fire Team A
function formatName(rawName) {
    return rawName
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

// Calculate Euclidean distance in Javascript
function calculateDistance(x1, y1, x2, y2) {
    const dist = Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
    return Math.round(dist * 100) / 100;
}

// Select incident tag helper
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

    // Automatically trigger recommendations
    dispatch();
}

// Helper to format unit display strings in recommendations
function formatUnitFriendly(rawUnitStr, isPrimary) {
    const match = rawUnitStr.match(/^([a-zA-Z0-9_]+)\s*\(([^)]+)\)$/);
    if (!match) return rawUnitStr;

    const rawName = match[1];
    const distance = match[2];
    const cleanName = formatName(rawName);

    if (isPrimary) {
        return `🚨 <strong>${cleanName}</strong> is the nearest unit (<strong>${distance}</strong> away) and has been designated for immediate dispatch.`;
    } else {
        return `<strong>${cleanName}</strong> is nearby (<strong>${distance}</strong> away) and is available to assist.`;
    }
}

// Plot active unit markers on the tactical map
function drawMapMarkers(units) {
    const map = document.getElementById("tactical-map");
    if (!map) return;

    // Clear existing markers (do not delete the crosshair)
    const markers = map.querySelectorAll(".map-marker");
    markers.forEach(m => m.remove());

    units.forEach(unit => {
        const marker = document.createElement("div");
        marker.className = `map-marker ${unit.available ? '' : 'busy'}`;
        marker.setAttribute("data-type", unit.type);
        marker.setAttribute("data-name", unit.name);

        // Position marker using Cartesian percentage (X=left, Y=bottom)
        marker.style.left = `${unit.x}%`;
        marker.style.top = `${100 - unit.y}%`;

        // Create hover tooltip
        const formattedName = formatName(unit.name);
        const statusText = unit.available ? 'Available' : 'On Mission';
        const tooltip = document.createElement("div");
        tooltip.className = "map-marker-tooltip";
        tooltip.innerHTML = `
            <strong>${formattedName}</strong> (${unit.type.toUpperCase()})<br>
            Sector: (${unit.x}, ${unit.y})<br>
            Status: ${statusText}
        `;
        marker.appendChild(tooltip);
        map.appendChild(marker);
    });
}

// Load status of all units
function loadUnits() {
    const container = document.getElementById("unit-groups-container");
    if (!container) return;

    fetch("http://localhost:8080/units")
        .then(res => {
            if (!res.ok) throw new Error("Could not fetch units");
            return res.json();
        })
        .then(units => {
            container.innerHTML = "";
            
            // Plot units on the tactical map
            drawMapMarkers(units);

            // 1. Group units by type
            const groups = {};
            units.forEach(unit => {
                if (!groups[unit.type]) {
                    groups[unit.type] = [];
                }
                groups[unit.type].push(unit);
            });

            // 2. Define friendly names & emojis for types
            const typeMeta = {
                fire: { title: "Fire Response", emoji: "🚒" },
                medical: { title: "Medical Response", emoji: "🚑" },
                police: { title: "Police Security", emoji: "👮" },
                rescue: { title: "Search & Rescue", emoji: "🧗" },
                hazmat: { title: "Hazmat Response", emoji: "☢️" },
                surveillance: { title: "Surveillance & Drones", emoji: "🛸" },
                engineering: { title: "Tactical Engineering", emoji: "🏗️" },
                k9: { title: "K9 Support", emoji: "🐕" }
            };

            // 3. Render each group
            Object.keys(groups).forEach(type => {
                const meta = typeMeta[type] || { title: type, emoji: "📦" };
                const groupUnits = groups[type];

                const groupCard = document.createElement("div");
                groupCard.className = "unit-type-group";
                groupCard.setAttribute("data-type", type);

                let rowsHtml = "";
                groupUnits.forEach(unit => {
                    const isAvailable = unit.available;
                    const formattedName = formatName(unit.name);
                    const statusText = isAvailable ? 'Available' : 'On Mission';

                    rowsHtml += `
                        <div class="unit-row-item">
                            <div class="unit-info">
                                <span class="unit-name">${formattedName}</span>
                            </div>
                            <div class="unit-controls">
                                <span class="unit-status-dot ${isAvailable ? 'available' : 'busy'}" 
                                      title="${statusText}"></span>
                                <span class="unit-status-text ${isAvailable ? 'available' : 'busy'}">${statusText}</span>
                                <button class="btn-card-action ${isAvailable ? 'dispatch' : 'release'}" 
                                        onclick="toggleUnitAvailability('${unit.name}', ${isAvailable})">
                                    ${isAvailable ? 'Dispatch' : 'Release'}
                                </button>
                            </div>
                        </div>
                    `;
                });

                groupCard.innerHTML = `
                    <div class="type-group-header">
                        <span class="type-group-emoji">${meta.emoji}</span>
                        <span class="type-group-title">${meta.title}</span>
                    </div>
                    <div class="type-group-list">
                        ${rowsHtml}
                    </div>
                `;
                container.appendChild(groupCard);
            });
        })
        .catch(err => {
            console.error("Error loading units:", err);
            container.innerHTML = `<p class="result-display error">⚠️ Failed to connect to coordination server: ${err.message}</p>`;
        });
}

// Dispatch or Release a unit manually
function toggleUnitAvailability(unitName, currentlyAvailable) {
    const endpoint = currentlyAvailable ? 'dispatch' : 'release';
    
    fetch(`http://localhost:8080/${endpoint}?unit=${unitName}`, { method: 'POST' })
        .then(res => {
            if (!res.ok) throw new Error(`Failed to update unit ${unitName}`);
            return res.json();
        })
        .then(data => {
            if (data.success) {
                loadUnits();
                // If the user has an active query, rerun the recommendation to keep it in sync
                const incident = document.getElementById("incident").value.trim().toLowerCase();
                if (incident) {
                    dispatch();
                }
            } else {
                alert(data.message);
            }
        })
        .catch(err => {
            alert(`Error: ${err.message}`);
        });
}

// Get recommendations and update UI
function dispatch() {
    const incidentInput = document.getElementById("incident").value;
    const incident = incidentInput.trim().toLowerCase();
    const severity = document.getElementById("severity").value;

    const xInput = document.getElementById("incident-x");
    const yInput = document.getElementById("incident-y");
    const xVal = xInput ? xInput.value.trim() : "25";
    const yVal = yInput ? yInput.value.trim() : "25";

    const primaryEl = document.getElementById("primary");
    const supportEl = document.getElementById("support");

    if (!incident) {
        primaryEl.innerHTML = "Please select or type an incident.";
        primaryEl.className = "result-display error";
        supportEl.innerHTML = "No active dispatch";
        supportEl.className = "result-display empty";
        hideDispatchActions();
        return;
    }

    // Set loading state
    primaryEl.innerHTML = "Querying coordination system...";
    primaryEl.className = "result-display empty";
    supportEl.innerHTML = "Querying coordination system...";
    supportEl.className = "result-display empty";
    hideDispatchActions();

    fetch(`http://localhost:8080/recommend?incident=${incident}&severity=${severity}&x=${xVal}&y=${yVal}`)
        .then(res => {
            if (!res.ok) {
                throw new Error(`System offline or failed (HTTP ${res.status})`);
            }
            return res.json();
        })
        .then(data => {
            recommendedUnits = [];

            // Update Primary Response
            if (data.primary && data.primary !== "No primary unit mapped" && !data.primary.includes("busy")) {
                primaryEl.innerHTML = formatUnitFriendly(data.primary, true);
                primaryEl.className = "result-display active";
                
                // Parse unit name for dispatching
                const primaryMatch = data.primary.match(/^([a-zA-Z0-9_]+)\s*\(([^)]+)\)$/);
                if (primaryMatch) {
                    recommendedUnits.push(primaryMatch[1]);
                }
            } else if (data.primary && data.primary.includes("busy")) {
                primaryEl.innerHTML = `⚠️ <strong>Unavailable:</strong> ${data.primary}`;
                primaryEl.className = "result-display warning";
            } else {
                primaryEl.innerHTML = "No primary unit mapped for this incident type.";
                primaryEl.className = "result-display empty";
            }

            // Update Support Units Response
            if (data.support && data.support !== "No support units mapped" && data.support !== "No support units required" && !data.support.includes("busy")) {
                const supportUnits = data.support.split(', ');
                const unitsList = supportUnits.map(unit => {
                    const supportMatch = unit.match(/^([a-zA-Z0-9_]+)\s*\(([^)]+)\)$/);
                    if (supportMatch) {
                        recommendedUnits.push(supportMatch[1]);
                    }
                    return `<li>🔷 ${formatUnitFriendly(unit, false)}</li>`;
                }).join('');
                supportEl.innerHTML = `<ul>${unitsList}</ul>`;
                supportEl.className = "result-display active-support";
            } else if (data.support && data.support.includes("busy")) {
                supportEl.innerHTML = `⚠️ <strong>Unavailable:</strong> ${data.support}`;
                supportEl.className = "result-display warning";
            } else {
                supportEl.innerHTML = data.support === "No support units required" ? "No support units required." : "No support units mapped for this incident.";
                supportEl.className = "result-display empty";
            }

            // Display dispatch actions if any units are recommended
            if (recommendedUnits.length > 0) {
                showDispatchActions();
            }
        })
        .catch(err => {
            primaryEl.innerHTML = `⚠️ Error: ${err.message}`;
            primaryEl.className = "result-display error";
            supportEl.innerHTML = "Dispatch coordination failed.";
            supportEl.className = "result-display error";
            hideDispatchActions();
        });
}

// Show/hide dispatch action bar
function showDispatchActions() {
    let actionContainer = document.getElementById("dispatch-actions");
    if (!actionContainer) {
        const resultsSection = document.querySelector(".results-section");
        if (resultsSection) {
            actionContainer = document.createElement("div");
            actionContainer.id = "dispatch-actions";
            actionContainer.className = "dispatch-actions-container";
            resultsSection.appendChild(actionContainer);
        }
    }
    
    if (actionContainer) {
        actionContainer.innerHTML = `
            <button class="btn-dispatch-recommend" id="btn-dispatch-recommend" onclick="dispatchRecommended()">
                🚀 Confirm & Dispatch Recommended Teams
            </button>
        `;
        actionContainer.style.display = "flex";
    }
}

function hideDispatchActions() {
    const actionContainer = document.getElementById("dispatch-actions");
    if (actionContainer) {
        actionContainer.style.display = "none";
    }
}

// Dispatch all recommended units in one transaction
function dispatchRecommended() {
    if (recommendedUnits.length === 0) return;
    
    const btn = document.getElementById("btn-dispatch-recommend");
    if (btn) {
        btn.disabled = true;
        btn.textContent = "Dispatching...";
        btn.classList.add("dispatched");
    }

    const promises = recommendedUnits.map(unitName => 
        fetch(`http://localhost:8080/dispatch?unit=${unitName}`, { method: 'POST' })
    );

    Promise.all(promises)
        .then(() => {
            recommendedUnits = [];
            loadUnits();
            dispatch(); // Rerun the recommendation engine (will now recommend other units or empty)
        })
        .catch(err => {
            console.error("Error dispatching recommended units:", err);
            alert("An error occurred during dispatch. Some units may not have been updated.");
            loadUnits();
        });
}

// Preset location sectors selector handler
function selectPresetLocation(value) {
    if (value === "custom") return;

    const parts = value.split(',');
    const xCoord = parseInt(parts[0]);
    const yCoord = parseInt(parts[1]);

    // Update hidden inputs
    document.getElementById("incident-x").value = xCoord;
    document.getElementById("incident-y").value = yCoord;

    // Update HUD display indicators
    document.getElementById("hud-x").textContent = xCoord;
    document.getElementById("hud-y").textContent = yCoord;

    // Position crosshairs marker
    const crosshair = document.getElementById("incident-crosshair");
    if (crosshair) {
        crosshair.style.left = `${xCoord}%`;
        crosshair.style.top = `${100 - yCoord}%`;
    }

    // Recalculate relative unit distances
    loadUnits();

    // Rerun recommendations if an incident type is selected
    const incident = document.getElementById("incident").value.trim();
    if (incident) {
        dispatch();
    }
}

// Listen for clicks on the tactical map grid to relocate incident
function setupTacticalMap() {
    const map = document.getElementById("tactical-map");
    if (!map) return;

    map.addEventListener("click", function(e) {
        // Prevent click events originating from child elements (markers, axis labels) from triggering map move
        if (e.target.classList.contains("map-marker") || e.target.closest(".map-marker") || e.target.classList.contains("axis-label")) {
            return;
        }

        const rect = map.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        // Convert coordinates to 0-100 percentage values
        const xPercent = (clickX / rect.width) * 100;
        const yPercent = 100 - ((clickY / rect.height) * 100);

        // Round and clamp values
        const xCoord = Math.max(0, Math.min(100, Math.round(xPercent)));
        const yCoord = Math.max(0, Math.min(100, Math.round(yPercent)));

        // Reset preset selector dropdown to Custom
        const presetSelect = document.getElementById("location-preset");
        if (presetSelect) {
            presetSelect.value = "custom";
        }

        // Update hidden inputs
        document.getElementById("incident-x").value = xCoord;
        document.getElementById("incident-y").value = yCoord;

        // Update HUD display indicators
        document.getElementById("hud-x").textContent = xCoord;
        document.getElementById("hud-y").textContent = yCoord;

        // Position crosshairs marker
        const crosshair = document.getElementById("incident-crosshair");
        if (crosshair) {
            crosshair.style.left = `${xCoord}%`;
            crosshair.style.top = `${100 - yCoord}%`;
        }

        // Recalculate relative unit distances
        loadUnits();

        // Rerun recommendations if an incident type is selected
        const incident = document.getElementById("incident").value.trim();
        if (incident) {
            dispatch();
        }
    });

    // Mousemove event for dynamic coordinates tooltip
    map.addEventListener("mousemove", function(e) {
        // Prevent tooltip from showing when hovering markers or labels directly
        if (e.target.classList.contains("map-marker") || e.target.closest(".map-marker") || e.target.classList.contains("axis-label")) {
            const hoverBadge = document.getElementById("map-hover-coords");
            if (hoverBadge) hoverBadge.style.display = "none";
            return;
        }

        const rect = map.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        const xPercent = (clickX / rect.width) * 100;
        const yPercent = 100 - ((clickY / rect.height) * 100);

        const xCoord = Math.max(0, Math.min(100, Math.round(xPercent)));
        const yCoord = Math.max(0, Math.min(100, Math.round(yPercent)));

        let hoverBadge = document.getElementById("map-hover-coords");
        if (!hoverBadge) {
            hoverBadge = document.createElement("div");
            hoverBadge.id = "map-hover-coords";
            hoverBadge.className = "map-hover-coords";
            map.appendChild(hoverBadge);
        }

        hoverBadge.textContent = `Sector: (${xCoord}, ${yCoord})`;
        
        // Offset tooltip by 12px from mouse cursor
        hoverBadge.style.left = `${clickX + 12}px`;
        hoverBadge.style.top = `${clickY + 12}px`;
        hoverBadge.style.display = "block";
    });

    // Hide tooltip on mouse leave
    map.addEventListener("mouseleave", function() {
        const hoverBadge = document.getElementById("map-hover-coords");
        if (hoverBadge) {
            hoverBadge.style.display = "none";
        }
    });
}

// Add event listeners and load page contents
document.addEventListener("DOMContentLoaded", () => {
    loadUnits();
    setupTacticalMap();

    const incidentInput = document.getElementById("incident");
    if (incidentInput) {
        incidentInput.addEventListener("input", function() {
            const val = this.value.trim().toLowerCase();
            const tags = document.querySelectorAll(".tag");
            tags.forEach(tag => {
                if (tag.textContent.toLowerCase() === val) {
                    tag.classList.add("active");
                } else {
                    tag.classList.remove("active");
                }
            });
            // Automatically trigger recommendations
            dispatch();
        });
    }
});