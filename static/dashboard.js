// ===========================================================================
// SERS dashboard client. Shared by /user and /admin — every lookup below is
// guarded with a null check so the same file works on both pages without
// throwing on elements that only exist on one of them.
// ===========================================================================
const REGION_CENTER = [13.09, 74.83];
const REGION_PALETTE = ["#2f80ed", "#9b5de5", "#0eb8a0", "#f5a623", "#ef4444", "#2ecc71"];
const PAGE = document.body.dataset.page || "";

function $(id) { return document.getElementById(id); }
function on(id, event, handler) {
  const el = typeof id === "string" ? $(id) : id;
  if (el) el.addEventListener(event, handler);
  return el;
}

// ---------------------------------------------------------------------
// Map (only present on /user and /admin, not on the landing page)
// ---------------------------------------------------------------------
let map = null;
let facilityLayer, alertLayer, highlightLayer, lookupLayer;
if ($("map")) {
  map = L.map("map", { zoomControl: true }).setView(REGION_CENTER, 11);

  // Tile source. Plain OpenStreetMap "Standard" tiles need no API key and
  // have no watermark, but they render each place's raw OSM `name` tag
  // as-is with no language fallback — for big features like the Arabian
  // Sea that tag is sometimes in Arabic script rather than English. That's
  // expected upstream OSM behavior (every site using these tiles sees the
  // same thing), not something wrong with this app.
  //
  // If a free CARTO API key is set (CARTO_API_KEY env var — takes a
  // minute to get at carto.com/basemaps/apikey, no card required, 5M
  // tile requests/month free), we use CARTO's Voyager basemap instead,
  // which consistently labels everything in Latin/English script.
  const cartoKey = window.CARTO_API_KEY || "";
  if (cartoKey) {
    L.tileLayer(`https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key=${cartoKey}`, {
      attribution: "&copy; OpenStreetMap contributors &copy; CARTO",
      subdomains: "abcd",
      maxZoom: 20,
    }).addTo(map);
  } else {
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);
  }

  facilityLayer = L.layerGroup().addTo(map);
  alertLayer = L.layerGroup().addTo(map);
  highlightLayer = L.layerGroup().addTo(map);
  lookupLayer = L.layerGroup().addTo(map);
}

let knownAlertIds = new Set();
let hasLoadedAlertsOnce = false; // guards the auto-pan below from firing on initial page load
let regionColorMap = {};
let latestFacilities = null;

// mapClickMode: null | "sos" | "pick-place" | "pick-hospital" | "pick-police" | "pick-user" | "pick-sos" | "pick-manual"
let mapClickMode = null;

// ---------------------------------------------------------------------
// Connectivity: the LIVE / OFFLINE badge reflects whether the Flask
// server actually answered the last request.
// ---------------------------------------------------------------------
let isLive = true;

function setLive(live) {
  if (live === isLive) return;
  isLive = live;
  const wrap = $("conn");
  const label = $("conn-label");
  if (wrap) wrap.classList.toggle("offline", !live);
  if (label) label.textContent = live ? "LIVE" : "OFFLINE";
}

async function fetchJSON(url, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    clearTimeout(timeoutId);
    setLive(true);
    return res;
  } catch (err) {
    clearTimeout(timeoutId);
    setLive(false);
    throw err;
  }
}

// ---------------------------------------------------------------------
// Facilities (hospitals / police / ambulances) — reloaded on every poll
// so admin-added pins and ambulance status show up live.
// ---------------------------------------------------------------------
function dotIcon(cls) {
  return L.divIcon({
    className: "",
    html: `<div class="facility-dot ${cls}"></div>`,
    iconSize: [13, 13],
    iconAnchor: [6, 6],
  });
}

function assignRegionColors(regions) {
  regionColorMap = {};
  regions.forEach((r, i) => {
    regionColorMap[r.name] = REGION_PALETTE[i % REGION_PALETTE.length];
  });
}

async function loadFacilities() {
  let res;
  try {
    res = await fetchJSON("/api/facilities");
  } catch (e) {
    return;
  }
  const data = await res.json();
  latestFacilities = data;

  assignRegionColors(data.regions);
  populateRegionSelects(data.regions);
  if ($("ambulance-region")) {
    populateHospitalSelect(data.hospitals, $("ambulance-region").value);
  }

  if (facilityLayer) {
    facilityLayer.clearLayers();

    data.regions.forEach((r) => {
      L.marker([r.lat, r.lon], { icon: dotIcon("place") })
        .bindPopup(`<b>${r.name}</b><br>Place${r.telegram_configured ? " &middot; Telegram bot configured" : ""}`)
        .addTo(facilityLayer);
    });

    data.hospitals.forEach((h) => {
      L.marker([h.lat, h.lon], { icon: dotIcon("hospital") })
        .bindPopup(`<b>${h.name}</b><br>Hospital &middot; ${h.phone || "&mdash;"}`)
        .addTo(facilityLayer);
    });

    data.police_stations.forEach((p) => {
      L.marker([p.lat, p.lon], { icon: dotIcon("police") })
        .bindPopup(`<b>${p.name}</b><br>Police Station &middot; ${p.phone || "&mdash;"}`)
        .addTo(facilityLayer);
    });

    data.ambulances.forEach((a) => {
      const cls = a.status === "available" ? "amb-available" : "amb-dispatched";
      L.marker([a.lat, a.lon], { icon: dotIcon(cls) })
        .bindPopup(`<b>${a.code}</b><br>Ambulance &middot; ${a.status}`)
        .addTo(facilityLayer);
    });
  }

  renderRegionStripFromCache();
}

// ---------------------------------------------------------------------
// Alerts: feed cards + map pins + route lines
// ---------------------------------------------------------------------
function pulseIcon() {
  return L.divIcon({
    className: "",
    html: `<div class="pulse-marker"><div class="ring"></div><div class="core"></div></div>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

function timeAgo(iso) {
  const then = new Date(iso).getTime();
  const diff = Math.max(0, Date.now() - then) / 1000;
  if (diff < 60) return `${Math.floor(diff)}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  return `${Math.floor(diff / 3600)}h ago`;
}

function telegramBadge(alert) {
  // Telegram status labels are intentionally not shown on alert cards.
  return "";
}

function renderAlertCard(alert, isNew, withResolve) {
  const card = document.createElement("div");
  card.className = `alert-card status-${alert.status}${isNew ? " is-new" : ""}`;
  card.dataset.id = alert.id;

  const pillLabel = alert.status.charAt(0).toUpperCase() + alert.status.slice(1);
  const reporter = alert.user
    ? `<div class="alert-row"><span class="k">Reported by</span><span class="v">${alert.user.name} <span class="user-id-pill">#${alert.user.id}</span></span></div>`
    : (alert.guest_label
      ? `<div class="alert-row"><span class="k">Reported by</span><span class="v">${alert.guest_label} <span class="user-id-pill">guest</span></span></div>`
      : "");

  // Two connection chips (police : ambulance, 2:1) — "connected" once
  // that responder is assigned, "searching" while none is set yet.
  const connectRow = alert.status !== "resolved" ? `
    <div class="connect-row">
      <div class="connect-chip ${alert.police_station ? "connected" : "searching"}">
        <span class="cc-dot"></span>
        <span class="cc-label">Police</span>
        <span class="cc-value">${alert.police_station ? alert.police_station.name : "Searching\u2026"}</span>
      </div>
      <div class="connect-chip ${alert.ambulance ? "connected" : "searching"}">
        <span class="cc-dot"></span>
        <span class="cc-label">Amb</span>
        <span class="cc-value">${alert.ambulance ? alert.ambulance.code : "Searching\u2026"}</span>
      </div>
    </div>` : "";

  // The AI review isn't shown as text on the card anymore — it just
  // quietly decides which action button is offered once an alert has
  // been approved & dispatched: a "Yes" (likely satisfied) prediction
  // allows resolving normally; a "No" prediction withholds the Resolve
  // button so admin has to use Mark pending and take another look
  // instead of closing the case out.
  const reviewBlocksResolve = alert.ai_review && alert.ai_review.label === "No";
  const canResolve = alert.status === "dispatched" && !reviewBlocksResolve;

  card.innerHTML = `
    <div class="alert-top">
      <span class="alert-region">${alert.region || "Unknown region"}</span>
      <span class="alert-time" data-created="${alert.created_at}">${timeAgo(alert.created_at)}</span>
    </div>
    <div class="alert-coords">${alert.victim_lat.toFixed(5)}, ${alert.victim_lon.toFixed(5)} &middot; ${alert.device_id || "device"}
      ${map ? `<button class="locate-btn" data-id="${alert.id}" title="Center the map on this alert">\u{1F4CD} Locate</button>` : ""}
    </div>
    ${connectRow}
    <div class="alert-rows">
      ${reporter}
      <div class="alert-row"><span class="k">Hospital</span><span class="v">${alert.hospital ? alert.hospital.name : "&mdash;"}</span></div>
      <div class="alert-row"><span class="k">Police</span><span class="v">${alert.police_station ? `Yes \u2014 ${alert.police_station.name}` : (alert.status === "resolved" ? "No" : "Pending\u2026")}</span></div>
      <div class="alert-row"><span class="k">Ambulance</span><span class="v">${alert.ambulance ? `Dispatched \u2014 ${alert.ambulance.code}` : "None free"}</span></div>
    </div>
    <span class="status-pill ${alert.status}">${pillLabel}</span>
    ${telegramBadge(alert)}
    ${withResolve && alert.status !== "resolved" ? `
    <div class="alert-actions">
      ${alert.status === "pending" ? `<button class="approve-btn" data-id="${alert.id}">&#10003; Approve &amp; Dispatch</button>` : ""}
      ${alert.status !== "pending" ? `<button class="pending-btn" data-id="${alert.id}">Mark pending</button>` : ""}
      ${canResolve ? `<button class="resolve-btn" data-id="${alert.id}">Mark resolved</button>` : ""}
    </div>` : ""}
  `;

  const locateBtn = card.querySelector(".locate-btn");
  if (locateBtn) {
    locateBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      if (!map) return;
      map.flyTo([alert.victim_lat, alert.victim_lon], Math.max(map.getZoom(), 15), { duration: 1 });
      if (alertLayer) {
        alertLayer.eachLayer((layer) => {
          if (layer._alertId === alert.id && layer.openPopup) layer.openPopup();
        });
      }
    });
  }

  const btn = card.querySelector(".resolve-btn");
  if (btn) {
    btn.addEventListener("click", async () => {
      try {
        await fetchJSON(`/api/alerts/${alert.id}/resolve`, { method: "POST" });
      } catch (e) { /* offline — next poll will retry the UI state */ }
      refreshAll();
    });
  }

  const pendingBtn = card.querySelector(".pending-btn");
  if (pendingBtn) {
    pendingBtn.addEventListener("click", async () => {
      try {
        await adminFetch(`/api/alerts/${alert.id}/status`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "pending" }),
        });
      } catch (e) { /* offline — next poll will retry the UI state */ }
      refreshAll();
    });
  }

  // Approve & Dispatch — only shown for pending alerts on the admin page.
  // Claims the nearest available ambulance and flips the alert to
  // "dispatched"; if none is free right now, it stays pending and we
  // surface why.
  const approveBtn = card.querySelector(".approve-btn");
  if (approveBtn) {
    approveBtn.addEventListener("click", async () => {
      approveBtn.disabled = true;
      approveBtn.textContent = "Dispatching\u2026";
      try {
        const res = await adminFetch(`/api/alerts/${alert.id}/approve`, { method: "POST" });
        const result = await res.json().catch(() => ({}));
        if (!res.ok) {
          showToast(result.error || "Couldn't approve this alert.", "pending");
          approveBtn.disabled = false;
          approveBtn.textContent = "\u2713 Approve & Dispatch";
          return;
        }
      } catch (e) {
        approveBtn.disabled = false;
        approveBtn.textContent = "\u2713 Approve & Dispatch";
        return;
      }
      refreshAll();
    });
  }

  return card;
}

// Resolved SOS pins go dim/static; unresolved ones keep the red blink.
function resolvedIcon() {
  return L.divIcon({
    className: "",
    html: `<div class="facility-dot sos-resolved"></div>`,
    iconSize: [13, 13],
    iconAnchor: [6, 6],
  });
}

// Bearing in degrees (0 = north, clockwise) from point A to point B —
// used to orient the little connector arrows on the map.
function bearingDeg(lat1, lon1, lat2, lon2) {
  const toRad = (d) => (d * Math.PI) / 180;
  const toDeg = (r) => (r * 180) / Math.PI;
  const y = Math.sin(toRad(lon2 - lon1)) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(toRad(lon2 - lon1));
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

function arrowIcon(color, angleDeg) {
  return L.divIcon({
    className: "",
    html: `<div class="route-arrow" style="border-bottom-color:${color};transform:rotate(${angleDeg}deg)"></div>`,
    iconSize: [14, 14],
    iconAnchor: [7, 7],
  });
}

// Draws a dashed connector line from the SOS point toward a responder,
// plus a small rotated arrowhead partway along it, showing direction.
function drawConnector(layer, from, to, color) {
  if (!layer || !to) return;
  const toPoint = [to.lat, to.lon];
  L.polyline([from, toPoint], { color, weight: 2.5, dashArray: "5,6", opacity: 0.8 }).addTo(layer);
  const t = 0.62;
  const midLat = from[0] + (toPoint[0] - from[0]) * t;
  const midLon = from[1] + (toPoint[1] - from[1]) * t;
  const angle = bearingDeg(from[0], from[1], toPoint[0], toPoint[1]);
  L.marker([midLat, midLon], { icon: arrowIcon(color, angle), interactive: false }).addTo(layer);
}

function plotAlertOnMap(alert) {
  if (!alertLayer) return;
  const isResolved = alert.status === "resolved";
  const reporterLine = alert.user
    ? `<br>Reported by ${alert.user.name} (#${alert.user.id})`
    : (alert.guest_label ? `<br>Reported by ${alert.guest_label} (guest)` : "");
  const marker = L.marker([alert.victim_lat, alert.victim_lon], {
    icon: isResolved ? resolvedIcon() : pulseIcon(),
  }).bindPopup(`<b>SOS #${alert.id}</b><br>${alert.message || ""}<br>${alert.status}${reporterLine}`);
  marker._alertId = alert.id;
  marker.addTo(alertLayer);

  if (!isResolved) {
    const from = [alert.victim_lat, alert.victim_lon];
    // Two arrows: nearest connected/searching police station and ambulance,
    // plus the hospital line kept for context.
    drawConnector(alertLayer, from, alert.hospital, "#ef4444");
    drawConnector(alertLayer, from, alert.police_station, "#9b5de5");
    if (alert.ambulance) {
      drawConnector(alertLayer, from, alert.ambulance, "#22c55e");
    }
  }
}

async function loadAlerts() {
  // Admin page uses a split active/history layout; other pages (or a
  // plain single list, if present) fall back to one combined feed.
  const activeEl = $("alert-list-active") || $("alert-list");
  const historyEl = $("alert-list-history");
  if (!activeEl) return;

  let res;
  try {
    res = await fetchJSON("/api/alerts");
  } catch (e) {
    return;
  }
  const alerts = await res.json();

  const active = alerts.filter((a) => a.status !== "resolved");
  const resolved = alerts.filter((a) => a.status === "resolved");

  const countEl = $("feed-count");
  if (countEl) countEl.textContent = `${active.length} alert${active.length === 1 ? "" : "s"}`;
  const historyCountEl = $("feed-count-history");
  if (historyCountEl) historyCountEl.textContent = `${resolved.length} resolved`;

  if (alertLayer) alertLayer.clearLayers();
  activeEl.innerHTML = "";
  if (historyEl) historyEl.innerHTML = "";

  const activeSource = historyEl ? active : alerts; // combined feed keeps everything in one list

  if (activeSource.length === 0) {
    activeEl.innerHTML = `<p class="empty-state">No alerts yet. Waiting for an SOS signal from the field units&hellip;</p>`;
  } else {
    activeSource.forEach((alert) => {
      const isNew = !knownAlertIds.has(alert.id);
      activeEl.appendChild(renderAlertCard(alert, isNew, true));
    });
  }

  if (historyEl) {
    if (resolved.length === 0) {
      historyEl.innerHTML = `<p class="empty-state">Resolved alerts will show up here.</p>`;
    } else {
      resolved.forEach((alert) => historyEl.appendChild(renderAlertCard(alert, false, false)));
    }
  }

  // Map always reflects every alert (blinking while active, dim once resolved).
  alerts.forEach((alert) => plotAlertOnMap(alert));

  // Auto-pinpoint: the first time we ever see a given active alert (i.e.
  // an SOS that just came in over LoRa/Wi-Fi since the last 2s poll),
  // fly the map straight to it so it's visible without the admin having
  // to hunt for the pin or hit "Locate" themselves. Skipped on the very
  // first load of the page so opening /admin doesn't yank the view to
  // whatever the latest historical alert happens to be.
  if (map && hasLoadedAlertsOnce) {
    const freshlyArrived = active.filter((a) => !knownAlertIds.has(a.id));
    if (freshlyArrived.length) {
      const newest = freshlyArrived.reduce((a, b) => (a.id > b.id ? a : b));
      map.flyTo([newest.victim_lat, newest.victim_lon], Math.max(map.getZoom(), 15), { duration: 1.2 });
    }
  }
  hasLoadedAlertsOnce = true;

  knownAlertIds = new Set(alerts.map((a) => a.id));
}

let knownMyAlertStatus = {};

async function loadMyAlerts() {
  const listEl = $("my-alert-list");
  if (!listEl) return;
  const user = getCurrentUser();
  if (!user) return;

  let res;
  try {
    res = await fetchJSON(`/api/alerts?user_id=${user.id}`);
  } catch (e) {
    return;
  }
  const alerts = await res.json();

  // Notify the user the moment one of their alerts changes status —
  // e.g. an ambulance gets dispatched, or admin marks it resolved —
  // instead of them having to notice a quiet change in the list.
  alerts.forEach((alert) => {
    const prev = knownMyAlertStatus[alert.id];
    if (prev && prev !== alert.status) {
      if (alert.status === "dispatched") {
        showToast(`Help is on the way \u2014 your SOS has been dispatched.`, "dispatched");
      } else if (alert.status === "resolved") {
        showToast(`Your SOS has been marked resolved by the response team.`, "resolved");
      }
    }
    knownMyAlertStatus[alert.id] = alert.status;
  });

  listEl.innerHTML = "";
  if (alerts.length === 0) {
    listEl.innerHTML = `<p class="empty-state">No alerts from your account yet.</p>`;
    return;
  }
  alerts.forEach((alert) => listEl.appendChild(renderAlertCard(alert, false, false)));
}

// ---------------------------------------------------------------------
// Toast banner (user page) — brief, dismissable status notification.
// ---------------------------------------------------------------------
function showToast(text, kind) {
  let host = $("toast-host");
  if (!host) {
    host = document.createElement("div");
    host.id = "toast-host";
    host.className = "toast-host";
    document.body.appendChild(host);
  }
  const toast = document.createElement("div");
  toast.className = `toast-banner ${kind || ""}`;
  toast.textContent = text;
  host.appendChild(toast);
  setTimeout(() => toast.classList.add("hide"), 5000);
  setTimeout(() => toast.remove(), 5600);
}

// ---------------------------------------------------------------------
// Status strip + ticker
// ---------------------------------------------------------------------
let latestStatus = null;

function renderRegionStripFromCache() {
  const strip = $("region-strip");
  if (!strip || !latestStatus) return;
  strip.innerHTML = "";
  latestStatus.alerts_by_region.forEach((r) => {
    const color = regionColorMap[r.region] || "#2f80ed";
    const chip = document.createElement("div");
    chip.className = "region-chip";
    chip.style.borderTopColor = color;
    chip.innerHTML = `<span class="swatch" style="background:${color}"></span><span class="name">${r.region}</span><span class="count">${r.count}</span>`;
    strip.appendChild(chip);
  });
}

async function loadStatus() {
  let res;
  try {
    res = await fetchJSON("/api/status");
  } catch (e) {
    return;
  }
  const s = await res.json();
  latestStatus = s;

  if ($("tk-pending")) $("tk-pending").textContent = s.pending;
  if ($("tk-dispatched")) $("tk-dispatched").textContent = s.dispatched;
  if ($("tk-resolved")) $("tk-resolved").textContent = s.resolved;
  if ($("tk-amb")) $("tk-amb").textContent = `${s.ambulances_available}/${s.ambulances_total}`;

  renderRegionStripFromCache();
}

// ---------------------------------------------------------------------
// Analytics — hand-rolled inline SVG charts, no external chart library.
// ---------------------------------------------------------------------
function svgEl(tag, attrs) {
  const el = document.createElementNS("http://www.w3.org/2000/svg", tag);
  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, v));
  return el;
}

function renderBarChart(containerId, rows, { labelKey, totalKey, resolvedKey }) {
  const box = $(containerId);
  if (!box) return;
  box.innerHTML = "";
  if (!rows || rows.length === 0) {
    box.innerHTML = `<p class="chart-empty">No data yet.</p>`;
    return;
  }
  const w = Math.max(340, rows.length * 64);
  const h = 170;
  const padL = 6, padB = 34, padT = 16;
  const maxVal = Math.max(1, ...rows.map((r) => r[totalKey] || 0));
  const barW = Math.min(38, (w - padL * 2) / rows.length - 14);
  const svg = svgEl("svg", { viewBox: `0 0 ${w} ${h}`, width: w, height: h });

  rows.forEach((r, i) => {
    const slot = (w - padL * 2) / rows.length;
    const x = padL + i * slot + (slot - barW) / 2;
    const total = r[totalKey] || 0;
    const resolved = resolvedKey ? r[resolvedKey] || 0 : 0;
    const totalH = ((h - padT - padB) * total) / maxVal;
    const resolvedH = ((h - padT - padB) * resolved) / maxVal;
    const yTotal = h - padB - totalH;
    const yResolved = h - padB - resolvedH;

    svg.appendChild(svgEl("rect", { x, y: yTotal, width: barW, height: Math.max(totalH, 0), class: "cbar total", rx: 3 }));
    if (resolvedKey) {
      svg.appendChild(svgEl("rect", { x, y: yResolved, width: barW, height: Math.max(resolvedH, 0), class: "cbar", rx: 3 }));
    }
    const valText = svgEl("text", { x: x + barW / 2, y: yTotal - 5, class: "cbar-value", "text-anchor": "middle" });
    valText.textContent = total;
    svg.appendChild(valText);

    const label = String(r[labelKey] || "").slice(0, 12);
    const labelText = svgEl("text", { x: x + barW / 2, y: h - padB + 14, class: "cbar-label", "text-anchor": "middle" });
    labelText.textContent = label;
    svg.appendChild(labelText);
  });

  svg.appendChild(svgEl("line", { x1: padL, y1: h - padB, x2: w - padL, y2: h - padB, class: "caxis" }));
  box.appendChild(svg);
}

function renderLineChart(containerId, rows) {
  const box = $(containerId);
  if (!box) return;
  box.innerHTML = "";
  if (!rows || rows.length === 0) {
    box.innerHTML = `<p class="chart-empty">No resolved alerts yet.</p>`;
    return;
  }
  const w = Math.max(340, rows.length * 60);
  const h = 170;
  const padL = 30, padB = 30, padT = 16, padR = 14;
  const maxVal = Math.max(1, ...rows.map((r) => r.count));
  const stepX = (w - padL - padR) / Math.max(1, rows.length - 1);
  const svg = svgEl("svg", { viewBox: `0 0 ${w} ${h}`, width: w, height: h });

  const points = rows.map((r, i) => {
    const x = padL + i * stepX;
    const y = h - padB - ((h - padT - padB) * r.count) / maxVal;
    return [x, y];
  });

  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${p[0]},${p[1]}`).join(" ");
  svg.appendChild(svgEl("path", { d: path, class: "cline" }));

  points.forEach(([x, y], i) => {
    svg.appendChild(svgEl("circle", { cx: x, cy: y, r: 3.5, class: "cdot" }));
    if (rows.length <= 14 || i % Math.ceil(rows.length / 14) === 0) {
      const labelText = svgEl("text", { x, y: h - padB + 14, class: "cbar-label", "text-anchor": "middle" });
      labelText.textContent = rows[i].date.slice(5);
      svg.appendChild(labelText);
    }
  });

  svg.appendChild(svgEl("line", { x1: padL, y1: h - padB, x2: w - padR, y2: h - padB, class: "caxis" }));
  box.appendChild(svg);
}

async function loadAnalytics() {
  const target = $("analytics-body");
  if (!target) return;
  let res;
  try {
    res = await fetchJSON("/api/analytics");
  } catch (e) {
    return;
  }
  const data = await res.json();
  renderLineChart("chart-resolved-by-date", data.resolved_by_date);
  renderBarChart("chart-by-hospital", data.by_hospital, { labelKey: "hospital", totalKey: "total", resolvedKey: "resolved" });
  renderBarChart("chart-by-region", data.by_region, { labelKey: "region", totalKey: "total", resolvedKey: "resolved" });
}

// ---------------------------------------------------------------------
// Training analytics — the "Colab" half of /admin/analytics: charts
// drawn from final_updated_data.csv (the 400-row set the AI review
// model was trained on) plus the model's own feature importances.
// Admin-token-gated, only present on the /admin/analytics page.
// ---------------------------------------------------------------------
function renderFeatureImportanceChart(containerId, rows) {
  const box = $(containerId);
  if (!box) return;
  box.innerHTML = "";
  if (!rows || rows.length === 0) {
    box.innerHTML = `<p class="chart-empty">Model file not available on the server.</p>`;
    return;
  }
  const max = Math.max(...rows.map((r) => r.total), 0.0001);
  rows.forEach((r) => {
    const pct = Math.max(2, Math.round((r.total / max) * 100));
    const row = document.createElement("div");
    row.className = "fi-row";
    row.innerHTML = `
      <span class="fi-label">${r.feature}</span>
      <span class="fi-bar-track"><span class="fi-bar-fill" style="width:${pct}%"></span></span>
      <span class="fi-value">${(r.total * 100).toFixed(1)}%</span>
    `;
    box.appendChild(row);
  });
}

async function loadTrainingAnalytics() {
  const target = $("training-analytics-body");
  if (!target) return;
  let res;
  try {
    res = await adminFetch("/api/admin/training_analytics");
  } catch (e) {
    return;
  }
  if (!res.ok) return;
  const data = await res.json();

  if ($("training-total-rows")) $("training-total-rows").textContent = data.total_rows;
  if ($("training-overall-rate")) $("training-overall-rate").textContent = `${data.overall_satisfaction_rate}%`;
  if ($("training-model-status")) {
    $("training-model-status").textContent = data.model_available ? "Loaded" : "Unavailable";
    $("training-model-status").className = data.model_available ? "stat-value ok" : "stat-value err";
  }
  if ($("training-live-logged")) $("training-live-logged").textContent = data.live_predictions_logged;

  renderBarChart("chart-satisfaction-by-place", data.by_place, { labelKey: "place", totalKey: "total", resolvedKey: "satisfied" });
  renderBarChart("chart-satisfaction-by-hospital", data.by_hospital_assigned, { labelKey: "label", totalKey: "total", resolvedKey: "satisfied" });
  renderBarChart("chart-satisfaction-by-police", data.by_police_assigned, { labelKey: "label", totalKey: "total", resolvedKey: "satisfied" });
  renderBarChart("chart-satisfaction-by-ambulance", data.by_ambulance_assigned, { labelKey: "label", totalKey: "total", resolvedKey: "satisfied" });
  renderFeatureImportanceChart("chart-feature-importance", data.feature_importances);
}

// ---------------------------------------------------------------------
// Training diagnostics — correlation heatmap, confusion matrix, ROC
// curve, and accuracy/precision/recall/F1, all computed server-side
// from the same 400-row Colab dataset and the trained model itself.
// Plain HTML/CSS tables for the heatmaps (easier to label than SVG),
// a small hand-rolled SVG for the ROC curve.
// ---------------------------------------------------------------------
function heatColor(value, min, max) {
  // Diverging blue (negative) -> white (zero) -> red (positive) scale
  // for correlation; a plain white->blue scale works fine too when min
  // is 0 (confusion matrix counts), which this also handles.
  if (value == null || Number.isNaN(value)) return "#eee";
  if (min < 0) {
    const t = value / Math.max(Math.abs(min), Math.abs(max), 0.0001);
    if (t >= 0) {
      const a = Math.min(1, t);
      return `rgba(239, 68, 68, ${(a * 0.85).toFixed(2)})`; // red
    }
    const a = Math.min(1, -t);
    return `rgba(47, 128, 237, ${(a * 0.85).toFixed(2)})`; // blue
  }
  const t = max > 0 ? value / max : 0;
  return `rgba(14, 184, 160, ${(Math.min(1, t) * 0.85).toFixed(2)})`; // teal
}

function renderHeatmap(containerId, labels, matrix, { diverging = true, cellLabels = null } = {}) {
  const box = $(containerId);
  if (!box) return;
  if (!matrix || matrix.length === 0) {
    box.innerHTML = `<p class="chart-empty">Not enough data.</p>`;
    return;
  }
  let min = 0, max = 0;
  matrix.forEach((row) => row.forEach((v) => {
    if (v == null) return;
    if (v < min) min = v;
    if (v > max) max = v;
  }));
  if (!diverging) min = 0;

  let html = `<table class="heatmap"><thead><tr><th></th>${labels.map((l) => `<th>${l}</th>`).join("")}</tr></thead><tbody>`;
  matrix.forEach((row, i) => {
    html += `<tr><th>${labels[i]}</th>`;
    row.forEach((v, j) => {
      const display = cellLabels ? cellLabels[i][j] : (v == null ? "" : v.toFixed(2));
      html += `<td style="background:${heatColor(v, min, max)}">${display}</td>`;
    });
    html += `</tr>`;
  });
  html += `</tbody></table>`;
  box.innerHTML = html;
}

function renderRocCurve(containerId, fpr, tpr, aucValue) {
  const box = $(containerId);
  if (!box) return;
  if (!fpr || fpr.length === 0) {
    box.innerHTML = `<p class="chart-empty">ROC curve not available.</p>`;
    return;
  }
  const W = 320, H = 220, PAD = 32;
  const sx = (x) => PAD + x * (W - PAD * 1.5);
  const sy = (y) => (H - PAD) - y * (H - PAD * 1.5);

  const points = fpr.map((x, i) => `${sx(x)},${sy(tpr[i])}`).join(" ");
  const svg = `
    <svg viewBox="0 0 ${W} ${H}" width="100%" style="max-width:${W}px;">
      <line class="caxis" x1="${sx(0)}" y1="${sy(0)}" x2="${sx(0)}" y2="${sy(1)}" />
      <line class="caxis" x1="${sx(0)}" y1="${sy(0)}" x2="${sx(1)}" y2="${sy(0)}" />
      <line x1="${sx(0)}" y1="${sy(0)}" x2="${sx(1)}" y2="${sy(1)}" stroke="var(--border)" stroke-dasharray="3,3" />
      <polyline points="${points}" fill="none" stroke="var(--purple)" stroke-width="2.5" />
      <text x="${sx(0)}" y="${H - 6}" class="cbar-label">FPR 0</text>
      <text x="${sx(1) - 20}" y="${H - 6}" class="cbar-label">FPR 1</text>
      <text x="4" y="${sy(1) + 4}" class="cbar-label">TPR 1</text>
      <text x="4" y="${sy(0)}" class="cbar-label">TPR 0</text>
      <text x="${sx(0.5) - 30}" y="16" class="cbar-value">AUC = ${aucValue}</text>
    </svg>`;
  box.innerHTML = svg;
}

async function loadTrainingDiagnostics() {
  const target = $("training-diagnostics-body");
  if (!target) return;
  let res;
  try {
    res = await adminFetch("/api/admin/training_diagnostics");
  } catch (e) {
    return;
  }
  if (!res.ok) {
    // Fail visibly instead of leaving the charts blank forever — makes
    // a server-side error (missing dependency, bad model file, etc.)
    // obvious instead of silently doing nothing.
    const msg = `<p class="chart-empty">Couldn't load diagnostics (server returned ${res.status}). Check the server log for details.</p>`;
    ["chart-correlation-heatmap", "chart-confusion-matrix", "chart-roc-curve", "chart-class-balance"].forEach((id) => {
      if ($(id)) $(id).innerHTML = msg;
    });
    return;
  }
  const data = await res.json();

  if (data.correlation) {
    renderHeatmap("chart-correlation-heatmap", data.correlation.labels, data.correlation.matrix, { diverging: true });
  }

  if (data.confusion_matrix) {
    const cm = data.confusion_matrix.matrix;
    renderHeatmap("chart-confusion-matrix", data.confusion_matrix.labels, cm, {
      diverging: false,
      cellLabels: cm.map((row) => row.map((v) => String(v))),
    });
  } else if ($("chart-confusion-matrix")) {
    $("chart-confusion-matrix").innerHTML = `<p class="chart-empty">Model not available.</p>`;
  }

  if (data.metrics) {
    if ($("diag-accuracy")) $("diag-accuracy").textContent = data.metrics.accuracy;
    if ($("diag-precision")) $("diag-precision").textContent = data.metrics.precision;
    if ($("diag-recall")) $("diag-recall").textContent = data.metrics.recall;
    if ($("diag-f1")) $("diag-f1").textContent = data.metrics.f1;
  }

  if (data.roc) {
    renderRocCurve("chart-roc-curve", data.roc.fpr, data.roc.tpr, data.roc.auc);
  }

  if (data.class_balance && $("chart-class-balance")) {
    renderBarChart("chart-class-balance", [
      { label: "Satisfied (Yes)", total: data.class_balance.yes, resolved: data.class_balance.yes },
      { label: "Not satisfied (No)", total: data.class_balance.no, resolved: 0 },
    ], { labelKey: "label", totalKey: "total", resolvedKey: "resolved" });
  }
}

// ---------------------------------------------------------------------
// Map click modes: Simulate SOS (admin) + Send SOS (user) + "pick on
// map" for any lat/lon field. Arms the map with a crosshair cursor and
// visibly confirms the picked point so it's obvious the click landed.
// ---------------------------------------------------------------------
const simBtn = $("sim-btn");

function disarmAllPickers() {
  if (simBtn) {
    simBtn.classList.remove("armed");
    simBtn.textContent = "Simulate SOS";
  }
  document.querySelectorAll(".pick-btn[data-pick]").forEach((b) => {
    b.classList.remove("armed");
    b.textContent = "Pick on map";
  });
  if (map) map.getContainer().style.cursor = "";
}

function setMapMode(mode) {
  disarmAllPickers();
  mapClickMode = mode;
  if (!map) return;
  if (mode === "sos") {
    if (simBtn) {
      simBtn.classList.add("armed");
      simBtn.textContent = "Click the map\u2026";
    }
    map.getContainer().style.cursor = "crosshair";
  } else if (mode && mode.startsWith("pick-")) {
    const btn = document.querySelector(`.pick-btn[data-pick="${mode.replace("pick-", "")}"]`);
    if (btn) {
      btn.classList.add("armed");
      btn.textContent = "Click the map\u2026";
    }
    map.getContainer().style.cursor = "crosshair";
  }
}

if (simBtn) {
  simBtn.addEventListener("click", () => {
    setMapMode(mapClickMode === "sos" ? null : "sos");
  });
}

document.querySelectorAll(".pick-btn[data-pick]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const target = `pick-${btn.dataset.pick}`;
    setMapMode(mapClickMode === target ? null : target);
  });
});

function fillPicked(prefix, lat, lng) {
  const latEl = $(`${prefix}-lat`);
  const lonEl = $(`${prefix}-lon`);
  if (latEl) latEl.value = lat.toFixed(6);
  if (lonEl) lonEl.value = lng.toFixed(6);
}

if (map) {
  map.on("click", async (e) => {
    if (!mapClickMode) return;
    const { lat, lng } = e.latlng;

    if (mapClickMode === "sos") {
      setMapMode(null);
      try {
        await fetchJSON("/api/sos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lat, lon: lng,
            device_id: "DEMO-SIM",
            message: "Simulated SOS press",
          }),
        });
      } catch (err) { /* offline — surfaced via LIVE badge */ }
      refreshAll();
      return;
    }

    if (mapClickMode === "pick-sos") {
      fillPicked("sos", lat, lng);
      flashNewPin(lat, lng, "#ef4444");
    } else if (mapClickMode === "pick-place") {
      fillPicked("place", lat, lng);
      flashNewPin(lat, lng, "#2f80ed");
    } else if (mapClickMode === "pick-hospital") {
      fillPicked("hospital", lat, lng);
      flashNewPin(lat, lng, "#0eb8a0");
    } else if (mapClickMode === "pick-police") {
      fillPicked("police", lat, lng);
      flashNewPin(lat, lng, "#9b5de5");
    } else if (mapClickMode === "pick-user") {
      fillPicked("lookup", lat, lng);
      flashNewPin(lat, lng, "#0eb8a0");
    } else if (mapClickMode === "pick-manual") {
      fillPicked("manual", lat, lng);
      flashNewPin(lat, lng, "#ef4444");
    }
    setMapMode(null);
  });
}

function flashNewPin(lat, lon, color) {
  if (!highlightLayer) return;
  const marker = L.circleMarker([lat, lon], {
    radius: 9,
    color: color,
    weight: 3,
    fillColor: color,
    fillOpacity: 0.35,
  }).addTo(highlightLayer);
  map.flyTo([lat, lon], Math.max(map.getZoom(), 13), { duration: 0.6 });
  setTimeout(() => highlightLayer.removeLayer(marker), 3500);
}

// ---------------------------------------------------------------------
// Geolocation — shared by the "Use my current location" buttons on the
// Find Help and Send SOS panels. Diagnoses *why* it failed instead of a
// single generic message, since the most common real-world cause is the
// page being loaded over plain http on a LAN IP (browsers only allow
// geolocation on https or http://localhost).
// ---------------------------------------------------------------------
function locate(onSuccess, onMessage) {
  if (!window.isSecureContext && location.hostname !== "localhost" && location.hostname !== "127.0.0.1") {
    onMessage("Location needs a secure connection. Open this page via https://, or via http://localhost if you're on this machine, then try again \u2014 or just enter coordinates or a place name.", false);
    return;
  }
  if (!navigator.geolocation) {
    onMessage("This browser doesn't support geolocation \u2014 enter coordinates or a place name instead.", false);
    return;
  }

  const reportError = (err) => {
    const messages = {
      1: "Location permission is blocked for this site. Check your browser's site settings (and your device's Location/GPS toggle), allow location, then try again.",
      2: "Your device couldn't determine a location right now \u2014 make sure Location/GPS is turned on, then try again.",
      3: "Locating you took too long \u2014 try again, or enter coordinates or a place name instead.",
    };
    onMessage(messages[err && err.code] || "Couldn't get your location \u2014 enter coordinates or a place name instead.", false);
  };

  onMessage("Locating you\u2026", true);

  if (navigator.permissions && navigator.permissions.query) {
    navigator.permissions.query({ name: "geolocation" }).then((status) => {
      if (status.state === "denied") {
        reportError({ code: 1 });
        return;
      }
      runGeolocation();
    }).catch(runGeolocation);
  } else {
    runGeolocation();
  }

  function runGeolocation() {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onSuccess(pos.coords.latitude, pos.coords.longitude);
        onMessage("", null);
      },
      reportError,
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 }
    );
  }
}

function showMsg(id, text, ok) {
  const el = $(id);
  if (!el) return;
  if (ok === null) { el.className = "admin-msg"; el.textContent = ""; return; }
  el.textContent = text;
  el.className = `admin-msg show ${ok ? "ok" : "err"}`;
}

on("lookup-geolocate", "click", () => {
  locate(
    (lat, lon) => fillPicked("lookup", lat, lon),
    (text, ok) => showMsg("msg-lookup", text, ok)
  );
});

on("sos-geolocate", "click", () => {
  locate(
    (lat, lon) => fillPicked("sos", lat, lon),
    (text, ok) => showMsg("msg-sos", text, ok)
  );
});

// ---------------------------------------------------------------------
// Admin panel: passcode gate, tabs, add-forms, region/hospital selects
// ---------------------------------------------------------------------
const ADMIN_TOKEN_KEY = "rescue_admin_token";

function getAdminToken() { return localStorage.getItem(ADMIN_TOKEN_KEY) || ""; }
function setAdminToken(token) { localStorage.setItem(ADMIN_TOKEN_KEY, token); }
function clearAdminToken() { localStorage.removeItem(ADMIN_TOKEN_KEY); }

async function adminFetch(url, options = {}) {
  const headers = Object.assign({}, options.headers, { "X-Admin-Token": getAdminToken() });
  return fetchJSON(url, { ...options, headers });
}

if (PAGE === "admin") {
  const authWrap = $("admin-auth-wrap");
  const appMain = $("app-main");
  const logoutBtn = $("admin-logout-btn");

  async function tryEnterAdmin(showError) {
    if (!getAdminToken()) return false;
    try {
      const res = await adminFetch("/api/admin/verify");
      if (res.ok) return true;
    } catch (e) { /* offline */ }
    clearAdminToken();
    if (showError) showMsg("admin-login-msg", "That passcode wasn't accepted.", false);
    return false;
  }

  function enterAdminApp() {
    if (authWrap) authWrap.style.display = "none";
    if (appMain) appMain.style.display = "";
    if (logoutBtn) logoutBtn.style.display = "";
    const analyticsBtn = $("analytics-toggle-btn");
    if (analyticsBtn) analyticsBtn.style.display = "";
    setTimeout(() => map && map.invalidateSize(), 60);
    refreshAll();
  }

  (async () => {
    if (await tryEnterAdmin(false)) enterAdminApp();
  })();

  on("form-admin-login", "submit", async (e) => {
    e.preventDefault();
    setAdminToken($("admin-passcode").value);
    if (await tryEnterAdmin(true)) {
      enterAdminApp();
    }
  });

  on(logoutBtn, "click", () => {
    clearAdminToken();
    location.reload();
  });
}

function showAdminPanel(panelId) {
  document.querySelectorAll(".admin-tab").forEach((t) => t.classList.remove("active"));
  const analyticsBtn = $("analytics-toggle-btn");
  if (analyticsBtn) analyticsBtn.classList.remove("active");
  document.querySelectorAll(".admin-body > .admin-form, .admin-body > .side-panel").forEach((f) => f.classList.remove("active"));
  const target = $(panelId);
  if (target) target.classList.add("active");
  setMapMode(null);
}

document.querySelectorAll(".admin-tab").forEach((tab) => {
  tab.addEventListener("click", () => {
    showAdminPanel($(`form-${tab.dataset.tab}`) ? `form-${tab.dataset.tab}` : `tab-${tab.dataset.tab}`);
    tab.classList.add("active");
    if (tab.dataset.tab === "users") loadUsers();
  });
});

// Analytics opens as its own page (in a new tab) — /admin/analytics —
// instead of an inline tab, so it has room for both the live operational
// charts and the Colab-trained model's charts side by side.
on("analytics-toggle-btn", "click", () => {
  window.open("admin_analytics.html", "_blank");
});

function populateRegionSelects(regions) {
  const selects = ["hospital-region", "police-region", "ambulance-region"];
  selects.forEach((id) => {
    const sel = $(id);
    if (!sel) return;
    const prev = sel.value;
    sel.innerHTML = "";
    regions.forEach((r) => {
      const opt = document.createElement("option");
      opt.value = r.id;
      opt.textContent = r.name;
      sel.appendChild(opt);
    });
    if (prev && [...sel.options].some((o) => o.value === prev)) sel.value = prev;
  });
}

function populateHospitalSelect(hospitals, regionId) {
  const sel = $("ambulance-hospital");
  if (!sel) return;
  const prev = sel.value;
  sel.innerHTML = "";
  hospitals
    .filter((h) => String(h.region_id) === String(regionId))
    .forEach((h) => {
      const opt = document.createElement("option");
      opt.value = h.id;
      opt.textContent = h.name;
      sel.appendChild(opt);
    });
  if (prev && [...sel.options].some((o) => o.value === prev)) sel.value = prev;
}

on("ambulance-region", "change", (e) => {
  if (latestFacilities) populateHospitalSelect(latestFacilities.hospitals, e.target.value);
});

// --- Manual distress signal (admin types in lat/lon directly) ---
on("form-manual-signal", "submit", async (e) => {
  e.preventDefault();
  const lat = parseFloat($("manual-lat").value);
  const lon = parseFloat($("manual-lon").value);
  if (Number.isNaN(lat) || Number.isNaN(lon)) {
    showMsg("msg-manual-signal", "Enter a latitude and longitude, or pick a point on the map first.", false);
    return;
  }
  const note = $("manual-note").value.trim();

  try {
    await fetchJSON("/api/sos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lat, lon,
        device_id: "ADMIN-MANUAL",
        message: note || "Manually reported distress signal",
      }),
    });
    showMsg("msg-manual-signal", "Distress signal logged \u2014 nearest hospital, police, and ambulance matched.", true);
    e.target.reset();
    flashNewPin(lat, lon, "#ef4444");
    refreshAll();
  } catch (err) {
    showMsg("msg-manual-signal", "Couldn't reach the server \u2014 check your connection and try again.", false);
  }
});

// --- Add place ---
on("form-place", "submit", async (e) => {
  e.preventDefault();
  const name = $("place-name").value.trim();
  const lat = parseFloat($("place-lat").value);
  const lon = parseFloat($("place-lon").value);
  const telegram_bot_token = $("place-token").value.trim();
  const telegram_chat_id = $("place-chat").value.trim();

  try {
    const res = await adminFetch("/api/admin/regions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, lat, lon, telegram_bot_token, telegram_chat_id }),
    });
    if (!res.ok) throw new Error((await res.json()).error || "failed");
    showMsg("msg-place", `"${name}" added.`, true);
    e.target.reset();
    flashNewPin(lat, lon, "#2f80ed");
    refreshAll();
  } catch (err) {
    showMsg("msg-place", err.message, false);
  }
});

// --- Add hospital ---
on("form-hospital", "submit", async (e) => {
  e.preventDefault();
  const region_id = $("hospital-region").value;
  const name = $("hospital-name").value.trim();
  const lat = parseFloat($("hospital-lat").value);
  const lon = parseFloat($("hospital-lon").value);
  const phone = $("hospital-phone").value.trim();

  try {
    const res = await adminFetch("/api/admin/hospitals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ region_id, name, lat, lon, phone }),
    });
    if (!res.ok) throw new Error((await res.json()).error || "failed");
    showMsg("msg-hospital", `"${name}" added.`, true);
    e.target.reset();
    flashNewPin(lat, lon, "#0eb8a0");
    refreshAll();
  } catch (err) {
    showMsg("msg-hospital", err.message, false);
  }
});

// --- Add police station ---
on("form-police", "submit", async (e) => {
  e.preventDefault();
  const region_id = $("police-region").value;
  const name = $("police-name").value.trim();
  const lat = parseFloat($("police-lat").value);
  const lon = parseFloat($("police-lon").value);
  const phone = $("police-phone").value.trim();

  try {
    const res = await adminFetch("/api/admin/police_stations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ region_id, name, lat, lon, phone }),
    });
    if (!res.ok) throw new Error((await res.json()).error || "failed");
    showMsg("msg-police", `"${name}" added.`, true);
    e.target.reset();
    flashNewPin(lat, lon, "#9b5de5");
    refreshAll();
  } catch (err) {
    showMsg("msg-police", err.message, false);
  }
});

// --- Add ambulance ---
on("form-ambulance", "submit", async (e) => {
  e.preventDefault();
  const region_id = $("ambulance-region").value;
  const hospital_id = $("ambulance-hospital").value;
  const code = $("ambulance-code").value.trim();

  try {
    const res = await adminFetch("/api/admin/ambulances", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ region_id, hospital_id, code }),
    });
    if (!res.ok) throw new Error((await res.json()).error || "failed");
    const added = await res.json();
    showMsg("msg-ambulance", `"${code}" added.`, true);
    e.target.reset();
    flashNewPin(added.lat, added.lon, "#22c55e");
    refreshAll();
  } catch (err) {
    showMsg("msg-ambulance", err.message, false);
  }
});

// --- Users tab (admin) ---
function formatDate(iso) {
  if (!iso) return "\u2014";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "\u2014";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

async function loadUsers() {
  const box = $("users-list");
  if (!box) return;
  let res;
  try {
    res = await adminFetch("/api/admin/users");
  } catch (e) {
    return;
  }
  if (!res.ok) return;
  const users = await res.json();
  if (users.length === 0) {
    box.innerHTML = `<p class="empty-state">No registered users yet.</p>`;
    return;
  }
  box.innerHTML = users.map((u) => {
    const sb = u.status_breakdown || { pending: 0, dispatched: 0, resolved: 0 };
    const ai = u.ai_breakdown || { yes: 0, no: 0 };
    const aiTotal = ai.yes + ai.no;
    return `
    <div class="user-row">
      <div class="ur-main">
        <div class="ur-name">${u.name} <span class="user-id-pill">#${u.id}</span></div>
        <div class="ur-phone">${u.phone}</div>
        <div class="ur-meta">Joined ${formatDate(u.created_at)} &middot; Last alert ${u.last_alert_at ? timeAgo(u.last_alert_at) : "never"}</div>
      </div>
      <div class="ur-right">
        <span class="user-alerts-pill">${u.alerts_count} alert${u.alerts_count === 1 ? "" : "s"}</span>
        <div class="ur-status-pills">
          <span class="mini-pill pending" title="Pending">${sb.pending}p</span>
          <span class="mini-pill dispatched" title="Dispatched">${sb.dispatched}d</span>
          <span class="mini-pill resolved" title="Resolved">${sb.resolved}r</span>
        </div>
        ${aiTotal > 0 ? `<div class="ur-ai" title="AI review outcomes">AI: ${ai.yes} yes / ${ai.no} no</div>` : ""}
      </div>
    </div>
  `;
  }).join("");
}

// ---------------------------------------------------------------------
// User accounts (signup / login) + account box — /user page only
// ---------------------------------------------------------------------
const USER_KEY = "rescue_user";

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY) || "null");
  } catch (e) {
    return null;
  }
}
function setCurrentUser(user) { localStorage.setItem(USER_KEY, JSON.stringify(user)); }
function clearCurrentUser() { localStorage.removeItem(USER_KEY); }

if (PAGE === "user") {
  const authWrap = $("auth-wrap");
  const appMain = $("app-main");

  function renderAccountBox(user) {
    const box = $("account-box");
    if (!box) return;
    box.innerHTML = `
      <div class="account-chip">
        <span class="acc-name">${user.name}</span>
        <span class="acc-id">ID #${user.id}</span>
      </div>
      <button class="logout-btn" id="logout-btn">Log out</button>
    `;
    on("logout-btn", "click", () => {
      clearCurrentUser();
      location.reload();
    });
  }

  function enterUserApp(user) {
    if (authWrap) authWrap.style.display = "none";
    if (appMain) appMain.style.display = "";
    renderAccountBox(user);
    setTimeout(() => map && map.invalidateSize(), 60);
    refreshAll();
    loadMyAlerts();
  }

  const existing = getCurrentUser();
  if (existing) enterUserApp(existing);

  document.querySelectorAll(".auth-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".auth-tab").forEach((t) => t.classList.remove("active"));
      document.querySelectorAll(".auth-card .admin-form").forEach((f) => f.classList.remove("active"));
      tab.classList.add("active");
      $(`form-${tab.dataset.auth}`).classList.add("active");
    });
  });

  on("form-login", "submit", async (e) => {
    e.preventDefault();
    const phone = $("login-phone").value.trim();
    const password = $("login-password").value;
    try {
      const res = await fetchJSON("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Login failed.");
      setCurrentUser(result);
      enterUserApp(result);
    } catch (err) {
      showMsg("msg-login", err.message, false);
    }
  });

  on("form-signup", "submit", async (e) => {
    e.preventDefault();
    const name = $("signup-name").value.trim();
    const phone = $("signup-phone").value.trim();
    const password = $("signup-password").value;
    try {
      const res = await fetchJSON("/api/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, password }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Sign up failed.");
      setCurrentUser(result);
      enterUserApp(result);
    } catch (err) {
      showMsg("msg-signup", err.message, false);
    }
  });

  // --- Side tabs: Find Help / My Alerts / Analytics ---
  document.querySelectorAll(".side-tab").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll(".side-tab").forEach((t) => t.classList.remove("active"));
      document.querySelectorAll(".side-panel").forEach((p) => p.classList.remove("active"));
      tab.classList.add("active");
      $(`side-${tab.dataset.sideTab}`).classList.add("active");
      setMapMode(null);
      if (tab.dataset.sideTab === "mine") loadMyAlerts();
      if (tab.dataset.sideTab === "analytics") loadAnalytics();
    });
  });

  // --- Send SOS modal ---
  const sosOverlay = $("sos-modal-overlay");
  const sosModal = $("sos-modal");
  function openSosModal() {
    if (sosOverlay) sosOverlay.classList.add("open");
    if (sosModal) sosModal.classList.add("open");
  }
  function closeSosModal() {
    if (sosOverlay) sosOverlay.classList.remove("open");
    if (sosModal) sosModal.classList.remove("open");
    setMapMode(null);
    showMsg("msg-sos", "", null);
  }
  on("sos-btn", "click", openSosModal);
  on("sos-cancel", "click", closeSosModal);
  on(sosOverlay, "click", closeSosModal);

  on("sos-confirm", "click", async () => {
    const user = getCurrentUser();
    const lat = parseFloat($("sos-lat").value);
    const lon = parseFloat($("sos-lon").value);
    if (Number.isNaN(lat) || Number.isNaN(lon)) {
      showMsg("msg-sos", "Enter coordinates, use your current location, or pick a point on the map first.", false);
      return;
    }
    const message = $("sos-message").value.trim() || "SOS - immediate assistance required";
    try {
      await fetchJSON("/api/sos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lat, lon,
          device_id: user ? `USER-${user.id}` : "USER-WEB",
          message,
          user_id: user ? user.id : null,
        }),
      });
      showMsg("msg-sos", "SOS sent \u2014 help is on the way.", true);
      setTimeout(closeSosModal, 1200);
      refreshAll();
      loadMyAlerts();
    } catch (err) {
      showMsg("msg-sos", "Couldn't reach the server \u2014 check your connection and try again.", false);
    }
  });
}

// ---------------------------------------------------------------------
// Find nearby help — public lookup panel (no login needed to use, but
// only present on the /user page)
// ---------------------------------------------------------------------
on("form-lookup", "submit", async (e) => {
  e.preventDefault();
  const place = $("lookup-place").value.trim();
  const latVal = $("lookup-lat").value.trim();
  const lonVal = $("lookup-lon").value.trim();

  const body = {};
  if (latVal !== "" && lonVal !== "") {
    body.lat = parseFloat(latVal);
    body.lon = parseFloat(lonVal);
  } else if (place) {
    body.place = place;
  } else {
    showMsg("msg-lookup", "Enter a place name, or coordinates, or use your current location.", false);
    return;
  }

  showMsg("msg-lookup", "Searching\u2026", true);

  try {
    const res = await fetchJSON("/api/lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || "Something went wrong.");
    showMsg("msg-lookup", "", null);
    renderLookupResults(result);
    plotLookupResult(result);
    raiseHelpAlert(result);
  } catch (err) {
    showMsg("msg-lookup", err.message, false);
  }
});

// A "Find nearest help" lookup doesn't just show results locally — it
// also raises an alert so the admin dashboard sees it and can approve a
// dispatch. Unlike the Send SOS button, this never auto-claims an
// ambulance: it always lands as "pending" until an admin approves it.
async function raiseHelpAlert(result) {
  const user = getCurrentUser();
  if (!user) return;
  try {
    await fetchJSON("/api/sos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        lat: result.query_lat,
        lon: result.query_lon,
        device_id: `USER-${user.id}`,
        message: `Requested nearest help near ${result.resolved_label}`,
        user_id: user.id,
        require_approval: true,
      }),
    });
    showMsg("msg-lookup", "Nearest help shown below \u2014 an alert has also been sent to the response team for approval.", true);
    refreshAll();
    loadMyAlerts();
  } catch (err) {
    // Lookup itself already succeeded — a failed alert just means the
    // admin won't see it yet; the next poll / retry can pick it up.
  }
}

function lookupCard(kind, label, item, nameKey, extraLine) {
  if (!item) {
    return `<div class="lookup-card ${kind}"><div class="lc-kind">${label}</div><div class="lookup-empty">None found nearby.</div></div>`;
  }
  return `
    <div class="lookup-card ${kind}">
      <div class="lc-kind">${label}</div>
      <div class="lc-name">${item[nameKey]}</div>
      <div class="lc-meta">
        <span class="dist">${item.distance_km} km away</span>
        ${item.phone ? `<span>${item.phone}</span>` : ""}
        ${extraLine || ""}
      </div>
    </div>`;
}

function renderLookupResults(result) {
  const box = $("lookup-results");
  if (!box) return;
  box.innerHTML = `
    <p class="hint-text">Showing nearest help for <b>${result.resolved_label}</b></p>
    ${lookupCard("region", "Covering place", result.region, "name")}
    ${lookupCard("hospital", "Nearest hospital", result.hospital, "name")}
    ${lookupCard("police", "Nearest police station", result.police_station, "name")}
    ${lookupCard("ambulance", "Nearest available ambulance", result.ambulance, "code")}
  `;
}

function plotLookupResult(result) {
  if (!lookupLayer) return;
  lookupLayer.clearLayers();
  const { query_lat: lat, query_lon: lon } = result;
  const bounds = [[lat, lon]];

  L.marker([lat, lon], { icon: dotIcon("lookup-point") })
    .bindPopup(`<b>You are here</b><br>${result.resolved_label}`)
    .addTo(lookupLayer)
    .openPopup();

  [result.hospital, result.police_station].forEach((item) => {
    if (!item) return;
    L.polyline([[lat, lon], [item.lat, item.lon]], {
      color: "#1c2a3a", weight: 2, dashArray: "4,6", opacity: 0.6,
    }).addTo(lookupLayer);
    bounds.push([item.lat, item.lon]);
  });

  if (bounds.length > 1) {
    map.flyToBounds(bounds, { padding: [60, 60], maxZoom: 15, duration: 0.6 });
  } else {
    map.flyTo([lat, lon], Math.max(map.getZoom(), 13), { duration: 0.6 });
  }
}

// ---------------------------------------------------------------------
// Polling
// ---------------------------------------------------------------------
function refreshAll() {
  loadFacilities();
  loadAlerts();
  loadStatus();
  if (PAGE === "user" && getCurrentUser()) loadMyAlerts();
  if ($("analytics-body")) loadAnalytics();
  if ($("training-analytics-body")) loadTrainingAnalytics();
  if ($("training-diagnostics-body")) loadTrainingDiagnostics();
}

setInterval(() => {
  document.querySelectorAll(".alert-time").forEach((el) => {
    el.textContent = timeAgo(el.dataset.created);
  });
}, 5000);

// Polls every 2s (was 4s) so a freshly raised SOS shows up in the admin
// feed — and status changes show up in My Alerts — without a noticeable lag.
setInterval(refreshAll, 2000);

// On the landing page there's nothing to poll; on /user and /admin the
// role-specific gates above call refreshAll() once the visitor is
// authenticated.
if (PAGE === "user" || PAGE === "admin") {
  // initial ticker/status/map data can load in the background even
  // before login finishes, so the map isn't blank the instant it unlocks
  if (map) loadFacilities();
}
