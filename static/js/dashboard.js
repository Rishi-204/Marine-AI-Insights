// ══════════════════════════════════════════
//  Marine AI Insights — Dashboard Logic
//  File: static/js/dashboard.js
// ══════════════════════════════════════════

const API = '';   // Flask serves on same origin, so no prefix needed

const STATE_COLORS = {
  'Gujarat':        '#0077b6',
  'Karnataka':      '#00b4d8',
  'Kerala':         '#06d6a0',
  'Tamil Nadu':     '#48cae4',
  'Maharashtra':    '#f77f00',
  'Andhra Pradesh': '#9b59b6',
  'Goa':            '#e63946',
  'Odisha':         '#ffd166',
  'West Bengal':    '#2ec4b6'
};

Chart.defaults.font.family = "'Outfit', sans-serif";
Chart.defaults.font.size   = 12;
Chart.defaults.color       = '#64748b';
Chart.defaults.borderColor = '#e2e8f0';

// Global data store (filled by loadAllData)
let ALL_LOCS   = [];
let ALL_STATES = [];
let ALL_TS     = [];
let sortField  = 'avg_prod';
let sortDir    = -1;

// ══════════════════════════════════════════
// DATA FETCHING
// ══════════════════════════════════════════
async function fetchJSON(endpoint) {
  const res = await fetch(API + endpoint);
  return res.json();
}

async function loadAllData() {
  const [summary, states, ts, locs] = await Promise.all([
    fetchJSON('/api/summary'),
    fetchJSON('/api/production-by-state'),
    fetchJSON('/api/timeseries'),
    fetchJSON('/api/locations')
  ]);

  ALL_LOCS   = locs;
  ALL_STATES = states;
  ALL_TS     = ts;

  renderKPIs(summary);
  initCharts();
  populateStateFilter();
  renderDataTable(ALL_LOCS);
  renderSpeciesTable();
  renderMapTable();
}

// ══════════════════════════════════════════
// KPIs
// ══════════════════════════════════════════
function renderKPIs(s) {
  document.getElementById('kpi-records').textContent   = s.total_records;
  document.getElementById('kpi-locations').textContent = s.total_locations;
  document.getElementById('kpi-states').textContent    = s.total_states;
  document.getElementById('kpi-prod').textContent      = s.avg_production;
  document.getElementById('kpi-temp').textContent      = s.avg_temp + '°';
  document.getElementById('kpi-sal').textContent       = s.avg_salinity;
}

// ══════════════════════════════════════════
// CHARTS
// ══════════════════════════════════════════
function initCharts() {
  // State production bar
  new Chart(document.getElementById('stateBarChart'), {
    type: 'bar',
    data: {
      labels: ALL_STATES.map(s => s.state),
      datasets: [{
        label: 'Avg Daily Production (kg)',
        data: ALL_STATES.map(s => s.avg_prod),
        backgroundColor: ALL_STATES.map(s => STATE_COLORS[s.state] + 'cc'),
        borderColor:     ALL_STATES.map(s => STATE_COLORS[s.state]),
        borderWidth: 1.5, borderRadius: 7, borderSkipped: false
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { grid: { color: '#f1f5f9' }, ticks: { callback: v => v + ' kg' } },
        x: { grid: { display: false }, ticks: { maxRotation: 30 } }
      }
    }
  });

  // State donut
  new Chart(document.getElementById('donutChart'), {
    type: 'doughnut',
    data: {
      labels: ALL_STATES.map(s => s.state),
      datasets: [{
        data: ALL_STATES.map(s => s.avg_prod),
        backgroundColor: ALL_STATES.map(s => STATE_COLORS[s.state]),
        borderColor: '#fff', borderWidth: 2, hoverOffset: 6
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false, cutout: '60%',
      plugins: {
        legend: { position: 'right', labels: { boxWidth: 11, padding: 9, font: { size: 11 } } }
      }
    }
  });

  // Trend line
  new Chart(document.getElementById('trendChart'), {
    type: 'line',
    data: {
      labels: ALL_TS.map(t => t.dates.slice(5)),
      datasets: [{
        label: 'Avg Production (kg)',
        data: ALL_TS.map(t => t.avg_prod),
        borderColor: '#0077b6', backgroundColor: 'rgba(0,119,182,0.08)',
        fill: true, tension: 0.4, pointRadius: 3,
        pointBackgroundColor: '#0077b6', borderWidth: 2
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { grid: { color: '#f1f5f9' } },
        x: { grid: { display: false }, ticks: { maxRotation: 0 } }
      }
    }
  });

  // Scatter: temp vs production
  new Chart(document.getElementById('scatterChart'), {
    type: 'scatter',
    data: {
      datasets: [{
        label: 'Temp vs Production',
        data: ALL_LOCS.map(l => ({ x: l.avg_temp, y: l.avg_prod })),
        backgroundColor: ALL_LOCS.map(l => STATE_COLORS[l.state] + 'bb'),
        borderColor:     ALL_LOCS.map(l => STATE_COLORS[l.state]),
        pointRadius: 7, pointHoverRadius: 10, borderWidth: 1.5
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => `${ALL_LOCS[ctx.dataIndex].location}: ${ctx.parsed.y} kg @ ${ctx.parsed.x}°C` } }
      },
      scales: {
        x: { title: { display: true, text: 'Sea Temp (°C)' }, grid: { color: '#f1f5f9' } },
        y: { title: { display: true, text: 'Avg Prod (kg)' }, grid: { color: '#f1f5f9' } }
      }
    }
  });

  // Env: sea temperature trend
  new Chart(document.getElementById('envTempChart'), {
    type: 'line',
    data: {
      labels: ALL_TS.map(t => t.dates.slice(5)),
      datasets: [{
        label: 'Sea Surface Temp',
        data: ALL_TS.map(t => t.avg_temp),
        borderColor: '#f77f00', backgroundColor: 'rgba(247,127,0,0.07)',
        fill: true, tension: 0.4, pointRadius: 3, borderWidth: 2
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { grid: { color: '#f1f5f9' }, ticks: { callback: v => v + '°' } },
        x: { grid: { display: false } }
      }
    }
  });

  // Env: wind speed per location
  new Chart(document.getElementById('windChart'), {
    type: 'bar',
    data: {
      labels: ALL_LOCS.map(l => l.location.split(' ')[0]),
      datasets: [{
        label: 'Avg Wind (km/h)',
        data: ALL_LOCS.map(l => l.avg_wind),
        backgroundColor: ALL_LOCS.map(l => l.avg_wind > 22 ? '#e6394688' : l.avg_wind > 19 ? '#f77f0088' : '#06d6a088'),
        borderColor:     ALL_LOCS.map(l => l.avg_wind > 22 ? '#e63946'   : l.avg_wind > 19 ? '#f77f00'   : '#06d6a0'),
        borderWidth: 1.5, borderRadius: 4
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { grid: { color: '#f1f5f9' } },
        x: { grid: { display: false }, ticks: { maxRotation: 55, font: { size: 10 } } }
      }
    }
  });

  // Env: salinity
  new Chart(document.getElementById('salinityChart'), {
    type: 'bar',
    data: {
      labels: ALL_LOCS.map(l => l.location.split(' ')[0]),
      datasets: [{
        label: 'Salinity (PSU)',
        data: ALL_LOCS.map(l => l.avg_sal),
        backgroundColor: '#0077b622', borderColor: '#0077b6',
        borderWidth: 1.5, borderRadius: 4
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { grid: { color: '#f1f5f9' }, min: 33, max: 36 },
        x: { grid: { display: false }, ticks: { maxRotation: 55, font: { size: 10 } } }
      }
    }
  });

  // Env: wave height
  new Chart(document.getElementById('waveChart'), {
    type: 'bar',
    data: {
      labels: ALL_LOCS.map(l => l.location.split(' ')[0]),
      datasets: [{
        label: 'Wave Height (m)',
        data: ALL_LOCS.map(l => l.avg_wave),
        backgroundColor: ALL_LOCS.map(l => l.avg_wave > 2 ? '#e6394644' : '#00b4d844'),
        borderColor:     ALL_LOCS.map(l => l.avg_wave > 2 ? '#e63946'   : '#00b4d8'),
        borderWidth: 1.5, borderRadius: 4
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { grid: { color: '#f1f5f9' } },
        x: { grid: { display: false }, ticks: { maxRotation: 55, font: { size: 10 } } }
      }
    }
  });

  // Species frequency
  const speciesCount = {};
  ALL_LOCS.forEach(l => {
    l.species.split(';').forEach(s => {
      const sp = s.trim();
      speciesCount[sp] = (speciesCount[sp] || 0) + 1;
    });
  });
  const sorted = Object.entries(speciesCount).sort((a,b) => b[1]-a[1]).slice(0,12);

  new Chart(document.getElementById('speciesFreqChart'), {
    type: 'bar',
    data: {
      labels: sorted.map(s => s[0]),
      datasets: [{
        label: 'Number of Ports',
        data: sorted.map(s => s[1]),
        backgroundColor: sorted.map((_,i) => `hsla(${190+i*14},65%,50%,0.7)`),
        borderColor:     sorted.map((_,i) => `hsl(${190+i*14},65%,50%)`),
        borderWidth: 1.5, borderRadius: 5
      }]
    },
    options: {
      indexAxis: 'y', responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { color: '#f1f5f9' } },
        y: { grid: { display: false }, ticks: { font: { size: 11 } } }
      }
    }
  });

  // Species by state
  const stateSpecies = {};
  ALL_LOCS.forEach(l => {
    if (!stateSpecies[l.state]) stateSpecies[l.state] = new Set();
    l.species.split(';').forEach(s => stateSpecies[l.state].add(s.trim()));
  });

  new Chart(document.getElementById('speciesChart'), {
    type: 'bar',
    data: {
      labels: Object.keys(stateSpecies),
      datasets: [{
        label: 'Unique Species',
        data: Object.values(stateSpecies).map(s => s.size),
        backgroundColor: Object.keys(stateSpecies).map(s => STATE_COLORS[s] + 'cc'),
        borderColor:     Object.keys(stateSpecies).map(s => STATE_COLORS[s]),
        borderWidth: 1.5, borderRadius: 6
      }]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { grid: { color: '#f1f5f9' }, ticks: { stepSize: 1 } },
        x: { grid: { display: false }, ticks: { maxRotation: 30 } }
      }
    }
  });
}

// ══════════════════════════════════════════
// MAP (Leaflet)
// ══════════════════════════════════════════
let map, markers = [];

function initMap() {
  if (map) return;
  map = L.map('mapContainer').setView([15.5, 76.5], 5);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors', maxZoom: 18
  }).addTo(map);
  renderMarkers('avg_prod');
  renderMapTable();
}

function getColor(val, min, max) {
  const r = (val - min) / (max - min);
  return r < 0.33 ? '#06d6a0' : r < 0.66 ? '#f77f00' : '#e63946';
}

function renderMarkers(metric) {
  markers.forEach(m => map.removeLayer(m));
  markers = [];
  const vals = ALL_LOCS.map(l => l[metric]);
  const min  = Math.min(...vals), max = Math.max(...vals);

  ALL_LOCS.forEach(l => {
    const val    = l[metric];
    const color  = getColor(val, min, max);
    const radius = 8 + ((val - min) / (max - min)) * 18;

    const circle = L.circleMarker([l.lat, l.lng], {
      radius, color, fillColor: color, fillOpacity: 0.7, weight: 2, opacity: 0.9
    }).addTo(map);

    circle.bindPopup(`
      <div style="font-family:'Outfit',sans-serif;min-width:180px">
        <strong style="font-size:14px">${l.location}</strong><br/>
        <span style="color:#64748b;font-size:12px">${l.state}</span>
        <hr style="margin:6px 0;border-color:#e2e8f0"/>
        🐟 Avg Production: <strong>${l.avg_prod} kg/day</strong><br/>
        🌡️ Sea Temp: <strong>${l.avg_temp}°C</strong><br/>
        🧂 Salinity: <strong>${l.avg_sal} PSU</strong><br/>
        💨 Wind: <strong>${l.avg_wind} km/h</strong><br/>
        🌊 Wave: <strong>${l.avg_wave} m</strong><br/>
        🐠 Species: <em style="font-size:11px">${l.species}</em>
      </div>
    `);
    markers.push(circle);
  });
}

function updateMapColors() {
  renderMarkers(document.getElementById('mapMetric').value);
}

function renderMapTable() {
  document.getElementById('mapTableBody').innerHTML = ALL_LOCS.map(l => `
    <tr>
      <td><strong>${l.location}</strong></td>
      <td><span class="state-pill" style="background:${STATE_COLORS[l.state]}22;color:${STATE_COLORS[l.state]}">${l.state}</span></td>
      <td style="font-family:var(--mono)">${l.lat}, ${l.lng}</td>
      <td>${l.avg_prod}</td>
      <td>${l.avg_temp}</td>
      <td>${l.avg_wave}</td>
    </tr>
  `).join('');
}

// ══════════════════════════════════════════
// TABS
// ══════════════════════════════════════════
function switchTab(id, el) {
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  el.classList.add('active');
  document.getElementById('tab-' + id).classList.add('active');
  document.getElementById('breadcrumbLabel').textContent = el.textContent.trim();
  if (id === 'map') setTimeout(initMap, 100);
}

function setNav(el, id) {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  el.classList.add('active');
  const tabEl = document.querySelector(`.tab[onclick*="${id}"]`);
  if (tabEl) switchTab(id, tabEl);
}

// ══════════════════════════════════════════
// DATA EXPLORER TABLE
// ══════════════════════════════════════════
function renderDataTable(data) {
  const sorted  = [...data].sort((a,b) => sortDir * (b[sortField] - a[sortField]));
  const maxProd = Math.max(...ALL_LOCS.map(l => l.avg_prod));

  document.getElementById('dataTableBody').innerHTML = sorted.map(l => `
    <tr>
      <td><strong>${l.location}</strong></td>
      <td><span class="state-pill" style="background:${STATE_COLORS[l.state]}22;color:${STATE_COLORS[l.state]}">${l.state}</span></td>
      <td>
        <div class="bar-mini-wrap">
          ${l.avg_prod}
          <div class="bar-mini" style="width:${Math.round((l.avg_prod/maxProd)*60)}px"></div>
        </div>
      </td>
      <td>${l.avg_temp}</td>
      <td>${l.avg_sal}</td>
      <td style="color:${l.avg_wind > 22 ? '#e63946' : 'inherit'}">${l.avg_wind}</td>
      <td style="color:${l.avg_wave > 2  ? '#e63946' : 'inherit'}">${l.avg_wave}</td>
      <td style="font-size:11px;color:var(--muted)">${l.species}</td>
    </tr>
  `).join('');

  document.getElementById('dataCount').textContent = `Showing ${sorted.length} of ${ALL_LOCS.length} locations`;
}

function sortBy(field) {
  if (sortField === field) sortDir *= -1; else { sortField = field; sortDir = -1; }
  filterDataTable();
}

function filterDataTable() {
  const q = document.getElementById('dataSearch').value.toLowerCase();
  const s = document.getElementById('dataStateFilter').value;
  sortField   = document.getElementById('dataSortBy').value;
  const filtered = ALL_LOCS.filter(l =>
    (l.location.toLowerCase().includes(q) || l.state.toLowerCase().includes(q) || l.species.toLowerCase().includes(q)) &&
    (s === '' || l.state === s)
  );
  renderDataTable(filtered);
}

// ══════════════════════════════════════════
// SPECIES TABLE
// ══════════════════════════════════════════
function renderSpeciesTable() {
  document.getElementById('speciesTableBody').innerHTML = ALL_LOCS.map(l => `
    <tr>
      <td><strong>${l.location}</strong></td>
      <td><span class="state-pill" style="background:${STATE_COLORS[l.state]}22;color:${STATE_COLORS[l.state]}">${l.state}</span></td>
      <td>${l.species.split(';').map(s =>
        `<span style="display:inline-block;background:#f0f9ff;border:1px solid #bae6fd;border-radius:12px;padding:2px 8px;margin:2px;font-size:11px;color:#0077b6">${s.trim()}</span>`
      ).join('')}</td>
      <td>${l.avg_prod} kg/day</td>
    </tr>
  `).join('');
}

// ══════════════════════════════════════════
// SEARCH + SUGGESTIONS
// ══════════════════════════════════════════
function handleSearch(q) {
  const box = document.getElementById('suggestionBox');
  if (!q) { box.classList.remove('show'); return; }

  const allSpecies  = [...new Set(ALL_LOCS.flatMap(l => l.species.split(';').map(s => s.trim())))];
  const locMatches  = ALL_LOCS.filter(l =>
    l.location.toLowerCase().includes(q.toLowerCase()) ||
    l.state.toLowerCase().includes(q.toLowerCase())
  ).slice(0,4);
  const spMatches   = allSpecies.filter(s => s.toLowerCase().includes(q.toLowerCase())).slice(0,3);

  let html = '';
  if (locMatches.length) {
    html += `<div class="suggestion-group-label">Locations</div>`;
    locMatches.forEach(l => {
      html += `<div class="suggestion-item" onclick="goToLocation('${l.location}')">
        <div class="sugg-icon">📍</div>
        <div class="sugg-text"><strong>${l.location}</strong><span>${l.state} · ${l.avg_prod} kg/day avg</span></div>
      </div>`;
    });
  }
  if (spMatches.length) {
    html += `<div class="suggestion-group-label">Species</div>`;
    spMatches.forEach(s => {
      const locs = ALL_LOCS.filter(l => l.species.includes(s));
      html += `<div class="suggestion-item" onclick="searchSpecies('${s}')">
        <div class="sugg-icon">🐠</div>
        <div class="sugg-text"><strong>${s}</strong><span>Found in ${locs.length} location(s)</span></div>
      </div>`;
    });
  }
  if (!html) html = `<div class="suggestion-item"><div class="sugg-text"><strong>No results found</strong></div></div>`;

  box.innerHTML = html;
  box.classList.add('show');
}

function goToLocation(name) {
  document.getElementById('suggestionBox').classList.remove('show');
  document.getElementById('globalSearch').value = name;
  switchTab('data', document.querySelector('.tab[onclick*="data"]'));
  setTimeout(() => { document.getElementById('dataSearch').value = name; filterDataTable(); }, 100);
}

function searchSpecies(name) {
  document.getElementById('suggestionBox').classList.remove('show');
  document.getElementById('globalSearch').value = name;
  switchTab('species', document.querySelector('.tab[onclick*="species"]'));
}

document.addEventListener('click', e => {
  if (!e.target.closest('.search-wrap'))
    document.getElementById('suggestionBox').classList.remove('show');
});

// ══════════════════════════════════════════
// AI SUGGESTIONS
// ══════════════════════════════════════════
function askAI(key) {
  const el = document.getElementById('aiAnswer');
  el.innerHTML = `<span style="color:var(--muted)">🤖 Analyzing data...</span>`;
  el.classList.add('show');

  const answers = {
    best_state: () => {
      const top = ALL_STATES[0];
      return `<strong>Gujarat</strong> leads all coastal states with an average daily production of <strong>${top.avg_prod} kg/day</strong>. The port of <strong>Veraval</strong> alone averages 517 kg/day — nearly 3× the national average. Primary species: Tuna, Ribbonfish, Pomfret, Squid.`;
    },
    temp_risk: () => {
      const hot = ALL_LOCS.filter(l => l.avg_temp > 28.5).sort((a,b) => b.avg_temp - a.avg_temp);
      return `<strong>${hot.length} locations</strong> show above-average SST (>28.5°C): ${hot.map(l => `<strong>${l.location}</strong> (${l.avg_temp}°C)`).join(', ')}. Elevated SST may stress coral reef species and affect sardine migration.`;
    },
    wind_alert: () => {
      const risky = ALL_LOCS.filter(l => l.avg_wind > 22).sort((a,b) => b.avg_wind - a.avg_wind);
      return `⚠️ <strong>${risky.length} high-wind locations</strong>: ${risky.map(l => `<strong>${l.location}</strong> (${l.avg_wind} km/h)`).join(', ')}. Wind above 22 km/h poses risk for small fishing vessels.`;
    },
    best_fishing: () => {
      const best = ALL_LOCS.filter(l => l.avg_wind < 18 && l.avg_wave < 1.7 && l.avg_prod > 100);
      return `Best conditions (low wind + low waves + good catch): ${best.map(l => `<strong>${l.location}</strong>`).join(', ')}.`;
    },
    salinity: () => {
      const low  = ALL_LOCS.filter(l => l.avg_sal < 34.1);
      const high = ALL_LOCS.filter(l => l.avg_sal > 34.9);
      return `Salinity ranges <strong>33.9–34.92 PSU</strong>. Low: ${low.map(l=>`<strong>${l.location}</strong>`).join(', ')}. High: ${high.map(l=>`<strong>${l.location}</strong>`).join(', ')}.`;
    },
    wave_risk: () => {
      const risky = ALL_LOCS.filter(l => l.avg_wave > 1.95).sort((a,b) => b.avg_wave - a.avg_wave);
      return `🌊 <strong>${risky.length} ports</strong> with wave height >1.95m: ${risky.map(l => `<strong>${l.location}</strong> (${l.avg_wave}m)`).join(', ')}. These may restrict artisanal fishing.`;
    }
  };

  setTimeout(() => { el.innerHTML = answers[key](); }, 400);
}

// ══════════════════════════════════════════
// STATE FILTER POPULATE
// ══════════════════════════════════════════
function populateStateFilter() {
  const sel = document.getElementById('dataStateFilter');
  [...new Set(ALL_LOCS.map(l => l.state))].sort().forEach(s => {
    const o = document.createElement('option');
    o.value = s; o.textContent = s;
    sel.appendChild(o);
  });
}

// ══════════════════════════════════════════
// BOOT
// ══════════════════════════════════════════
window.addEventListener('DOMContentLoaded', loadAllData);

// ══════════════════════════════════════════
// AI MODELS TAB
// ══════════════════════════════════════════
async function loadAIModel(type) {
  const card  = document.getElementById('aiOutputCard');
  const body  = document.getElementById('aiOutputBody');
  const title = document.getElementById('aiOutputTitle');
  const sub   = document.getElementById('aiOutputSub');
  const badge = document.getElementById('aiOutputBadge');

  card.style.display = 'block';
  body.innerHTML = `<div class="ai-loading"><div class="ai-spinner"></div> Running model, please wait...</div>`;
  card.scrollIntoView({ behavior: 'smooth' });

  const endpoints = {
    regression: '/api/ai/regression',
    anomalies:  '/api/ai/anomalies',
    importance: '/api/ai/feature-importance',
    forecast:   '/api/ai/forecast'
  };

  try {
    const data = await fetchJSON(endpoints[type]);

    if (type === 'regression')  renderRegression(data, title, sub, badge, body);
    if (type === 'anomalies')   renderAnomalies(data, title, sub, badge, body);
    if (type === 'importance')  renderImportance(data, title, sub, badge, body);
    if (type === 'forecast')    renderForecast(data, title, sub, badge, body);

  } catch(e) {
    body.innerHTML = `<div style="color:var(--red);padding:20px">Error loading model. Make sure Flask is running and scikit-learn is installed.</div>`;
  }
}

// ── Render: Linear Regression ──────────────────────
function renderRegression(d, title, sub, badge, body) {
  title.textContent = 'Linear Regression — Production Predictor';
  sub.textContent   = 'Predicts avg daily fish production from sea temperature, salinity, wind & wave data';
  badge.textContent = 'scikit-learn';

  body.innerHTML = `
    <div class="ai-metric-row">
      <div class="ai-metric"><div class="ai-metric-val" style="color:var(--green)">${d.accuracy_pct}%</div><div class="ai-metric-label">Model Accuracy (R²)</div></div>
      <div class="ai-metric"><div class="ai-metric-val" style="color:var(--orange)">${d.mae}</div><div class="ai-metric-label">Mean Abs Error (kg)</div></div>
      <div class="ai-metric"><div class="ai-metric-val">${d.train_size}</div><div class="ai-metric-label">Training Samples</div></div>
      <div class="ai-metric"><div class="ai-metric-val">${d.test_size}</div><div class="ai-metric-label">Test Samples</div></div>
    </div>

    <div class="ai-insight-box">
      💡 The model explains <strong>${d.accuracy_pct}%</strong> of the variation in fish production.
      Average prediction error is <strong>${d.mae} kg/day</strong>.
      Trained on <strong>${d.train_size}</strong> records, tested on <strong>${d.test_size}</strong>.
    </div>

    <div style="margin-bottom:10px"><strong style="font-size:13px">Feature Coefficients</strong> <span style="font-size:11px;color:var(--muted);margin-left:8px">How much each factor influences production</span></div>
    ${d.coefficients.map(c => {
      const pct = Math.min(Math.abs(c.coefficient) / Math.max(...d.coefficients.map(x=>Math.abs(x.coefficient))) * 100, 100);
      const col = c.coefficient > 0 ? '#0077b6' : '#e63946';
      return `<div class="coeff-bar-wrap">
        <div class="coeff-name">${c.feature}</div>
        <div class="coeff-bar-outer"><div class="coeff-bar-inner" style="width:${pct}%;background:${col}"></div></div>
        <div class="coeff-val" style="color:${col}">${c.coefficient > 0 ? '+':''}${c.coefficient}</div>
      </div>`;
    }).join('')}

    <div style="margin:18px 0 10px"><strong style="font-size:13px">Predicted vs Actual</strong> <span style="font-size:11px;color:var(--muted);margin-left:8px">First 20 test samples</span></div>
    <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:6px">
    ${d.predictions.map((p,i) => `
      <div class="pred-row">
        <span style="color:var(--muted);font-size:11px;width:30px">#${i+1}</span>
        <span style="color:var(--text)">Actual: <strong>${p.actual}</strong></span>
        <span style="color:var(--accent)">→ Predicted: <strong>${p.predicted}</strong></span>
        <span style="font-size:11px;color:${Math.abs(p.actual-p.predicted)<30?'var(--green)':'var(--orange)'}">
          (${p.actual > p.predicted ? '-':'+'}${Math.abs(p.actual-p.predicted).toFixed(1)} kg)
        </span>
      </div>`).join('')}
    </div>`;
}

// ── Render: Anomaly Detection ──────────────────────
function renderAnomalies(d, title, sub, badge, body) {
  title.textContent = 'Anomaly Detection — Isolation Forest';
  sub.textContent   = 'Flags records with abnormal environmental conditions';
  badge.textContent = 'scikit-learn';

  body.innerHTML = `
    <div class="ai-metric-row">
      <div class="ai-metric"><div class="ai-metric-val" style="color:var(--red)">${d.anomaly_count}</div><div class="ai-metric-label">Anomalies Detected</div></div>
      <div class="ai-metric"><div class="ai-metric-val" style="color:var(--green)">${d.normal_count}</div><div class="ai-metric-label">Normal Records</div></div>
      <div class="ai-metric"><div class="ai-metric-val">${d.total_records}</div><div class="ai-metric-label">Total Records</div></div>
      <div class="ai-metric"><div class="ai-metric-val" style="color:var(--orange)">${d.anomaly_rate}%</div><div class="ai-metric-label">Anomaly Rate</div></div>
    </div>
    <div class="ai-insight-box">
      🔍 Isolation Forest identified <strong>${d.anomaly_count} anomalous records</strong> out of ${d.total_records} total
      — an anomaly rate of <strong>${d.anomaly_rate}%</strong>. These are data points where the combination of
      sea temperature, salinity, wind, and wave conditions deviate significantly from normal patterns.
    </div>
    <div style="margin-bottom:12px"><strong style="font-size:13px">Detected Anomalies</strong></div>
    <table>
      <thead><tr><th>Location</th><th>Date</th><th>Temp (°C)</th><th>Salinity</th><th>Wind</th><th>Wave</th><th>Reason</th></tr></thead>
      <tbody>
      ${d.anomalies.map(a => `
        <tr>
          <td><strong>${a.location}</strong></td>
          <td style="font-family:var(--mono);font-size:12px">${a.date}</td>
          <td style="color:${a.temperature>30||a.temperature<25?'var(--red)':'inherit'}">${a.temperature}</td>
          <td style="color:${a.salinity<33.5?'var(--red)':'inherit'}">${a.salinity}</td>
          <td style="color:${a.wind_speed>25?'var(--red)':'inherit'}">${a.wind_speed}</td>
          <td style="color:${a.wave_height>2.5?'var(--red)':'inherit'}">${a.wave_height}</td>
          <td><span class="anomaly-tag">${a.reason}</span></td>
        </tr>`).join('')}
      </tbody>
    </table>`;
}

// ── Render: Feature Importance ─────────────────────
function renderImportance(d, title, sub, badge, body) {
  title.textContent = 'Feature Importance — Random Forest';
  sub.textContent   = 'Ranks which environmental variable drives fish production the most';
  badge.textContent = 'scikit-learn';

  const maxImp = Math.max(...d.features.map(f => f.importance));

  body.innerHTML = `
    <div class="ai-insight-box">
      🌿 According to the Random Forest model, <strong>${d.top_factor}</strong> is the most influential
      factor affecting fish production, accounting for <strong>${d.top_pct}%</strong> of the model's
      decision-making. ${d.insight}
    </div>
    <div style="margin-bottom:12px"><strong style="font-size:13px">Feature Importance Ranking</strong></div>
    ${d.features.map((f, i) => `
      <div class="coeff-bar-wrap" style="padding:12px 0">
        <div class="coeff-name" style="font-size:14px">
          ${['🥇','🥈','🥉','4️⃣'][i]} ${f.feature}
        </div>
        <div class="coeff-bar-outer" style="height:12px">
          <div class="coeff-bar-inner" style="width:${(f.importance/maxImp)*100}%;background:${['#0077b6','#00b4d8','#48cae4','#b3e5fc'][i]}"></div>
        </div>
        <div class="coeff-val" style="color:var(--accent);font-size:13px;font-weight:700">${f.pct}%</div>
      </div>`).join('')}
    <div style="height:260px;margin-top:20px"><canvas id="importanceChart"></canvas></div>`;

  setTimeout(() => {
    new Chart(document.getElementById('importanceChart'), {
      type: 'bar',
      data: {
        labels: d.features.map(f => f.feature),
        datasets: [{ label: 'Importance %', data: d.features.map(f => f.pct),
          backgroundColor: ['#0077b688','#00b4d888','#48cae488','#b3e5fc88'],
          borderColor:     ['#0077b6',  '#00b4d8',  '#48cae4',  '#90caf9'],
          borderWidth: 1.5, borderRadius: 8 }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: {
          y: { grid: { color: '#f1f5f9' }, ticks: { callback: v => v + '%' } },
          x: { grid: { display: false } }
        }
      }
    });
  }, 100);
}

// ── Render: Forecast ───────────────────────────────
function renderForecast(d, title, sub, badge, body) {
  title.textContent = '7-Day Production Forecast';
  sub.textContent   = 'Linear trend model trained on historical data to predict next 7 days';
  badge.textContent = 'scikit-learn + numpy';

  body.innerHTML = `
    <div class="ai-insight-box">
      🔮 ${d.insight}
    </div>
    <div class="grid-2" style="margin-bottom:18px">
      <div>
        <div style="margin-bottom:10px"><strong style="font-size:13px">📅 7-Day Forecast</strong></div>
        ${d.forecast.map(f => `
          <div class="forecast-day">
            <div class="forecast-day-label">${f.day}</div>
            <div>
              <div class="forecast-day-val">${f.predicted} kg</div>
              <div class="forecast-day-range">Range: ${f.lower} – ${f.upper}</div>
            </div>
          </div>`).join('')}
      </div>
      <div>
        <div style="margin-bottom:10px"><strong style="font-size:13px">📈 Historical + Forecast Chart</strong></div>
        <div style="height:300px"><canvas id="forecastChart"></canvas></div>
      </div>
    </div>`;

  setTimeout(() => {
    const histLabels = d.historical.map(h => h.date.slice(5));
    const histVals   = d.historical.map(h => h.value);
    const fcLabels   = d.forecast.map(f => f.day);
    const fcVals     = d.forecast.map(f => f.predicted);

    new Chart(document.getElementById('forecastChart'), {
      type: 'line',
      data: {
        labels: [...histLabels, ...fcLabels],
        datasets: [
          {
            label: 'Historical', data: [...histVals, ...new Array(7).fill(null)],
            borderColor: '#0077b6', backgroundColor: 'rgba(0,119,182,0.08)',
            fill: true, tension: 0.4, pointRadius: 3, borderWidth: 2
          },
          {
            label: 'Forecast', data: [...new Array(histLabels.length).fill(null), ...fcVals],
            borderColor: '#9b59b6', backgroundColor: 'rgba(155,89,182,0.08)',
            borderDash: [6,3], fill: true, tension: 0.4,
            pointRadius: 5, pointBackgroundColor: '#9b59b6', borderWidth: 2
          }
        ]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { position: 'top', labels: { boxWidth: 12, font: { size: 11 } } } },
        scales: {
          y: { grid: { color: '#f1f5f9' } },
          x: { grid: { display: false }, ticks: { maxRotation: 45, font: { size: 10 } } }
        }
      }
    });
  }, 100);
}
