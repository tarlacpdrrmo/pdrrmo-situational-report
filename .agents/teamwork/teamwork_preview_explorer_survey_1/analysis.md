# DOM & Layout Architecture Analysis — Tarlac PDRRMO Executive Dashboard

**Explorer**: Explorer 1 (DOM & Layout Architecture)  
**Date**: 2026-10-09  
**Status**: Completed  
**Reference Request**: `c:\Users\DOST ASTI PDRRMO\tarlac-sitrep\.agents\teamwork\ORIGINAL_REQUEST.md`  

---

## Executive Summary

The Tarlac PDRRMO Executive Analytics Dashboard is currently built as a single-page static application served directly from Firebase Hosting (`public/` directory) with vanilla HTML5, CSS, and client-side ES modules connected to Firebase Cloud Firestore. Currently, the dashboard is structured as a single vertically scrolling column centered in a 1480px wrapper, containing the incident hero section, 8 big KPI cards/strips, sticky section jump tabs, 6 Chart.js canvases, and 8 incident feed lists. There is currently **no map container or Leaflet integration** on the active `index.html`.

To fulfill requirements **R1 (Responsive Split-Screen Architecture)** and **R2 (Glassmorphic Data Sidebar)** for the Governor's executive overview and TV/LED wall command-center display, this analysis outlines the structural DOM and CSS refactoring needed. The optimal architectural solution anchors an interactive Leaflet map in the background/right-side viewport while positioning a sleek, frosted-glass scrolling sidebar on the left (`width: clamp(620px, 40vw, 780px)`). All 43+ existing JavaScript `id` attributes, Chart.js contexts, TomSelect filter controls, and Firestore listeners are preserved with 100% integrity.

---

## 1. Project File Tree & Entry Point Architecture

### 1.1 Hosting & Entry Point Discovery
- **Hosting Engine**: Firebase Hosting configured in `firebase.json`:
  ```json
  "hosting": {
    "public": "public",
    "rewrites": [{ "source": "**", "destination": "/index.html" }]
  }
  ```
- **Primary Dashboard Entry Point**: `public/index.html` (1,156 lines, ~92 KB).
- **Template Architecture**: None. There are no server-side templating engines (e.g., EJS, Pug, Jinja, Blade) or frontend build bundles (Vite, Webpack, React, Vue). Each page in `public/` is a self-contained, standalone HTML document.
- **Related Pages in Workspace**:
  - `public/trend_analysis.html`: Trend analysis charts
  - `public/data_entry.html`: Command Workspace (incident report forms)
  - `public/inventory.html`: Relief inventory management
  - `public/archives.html`: Archived SitReps
  - `public/infographic.html`: Infographic export view
  - `public/admin.html`: System administrative console
  - `public/flood_matrix.html`: Flood passability data matrix
  - `public/map_test.html`: Standalone experimental 3D map prototype (MapLibre GL JS)
  - `public/Tarlac_mun.geojson`: 957 KB polygon boundaries for all 17 Tarlac municipalities + 1 city (Tarlac City)
  - `public/tarlac_brgy.geojson`: 1.93 MB polygon boundaries for all Tarlac barangays

### 1.2 Soft SPA Navigation Dependency
`public/index.html` contains a soft SPA routing script (lines 1100–1150) that intercepts clicks on `.dashboard-link` and adds directional slide animations (`slide-out-left`, `slide-in-right`, etc.) to the container `<main class="main-content">`.
- **Constraint**: The element `<main class="main-content">` **must remain in the DOM** as the top-level container for dashboard views so page navigation transitions remain smooth and error-free.

---

## 2. Current DOM Layout Hierarchy

The current DOM tree in `public/index.html` flows as follows:

```
<body>
 ├── <div class="modal-overlay" id="narrativeModal">...</div>      [Fixed modal overlay, z-index: 100000]
 ├── <header class="sidebar" id="mainSidebar">...</div>            [Sticky top navigation bar, 60px height, z-index: 100]
 └── <main class="main-content">                                   [Main content wrapper]
      └── <div class="wrap">                                       [Centered column: max-width: 1480px, padding: 20px 28px]
           ├── <section class="hero">                              [Dark background card #0B1730, radius 22px]
           │    ├── <div class="hero-top">                         [Incident Title, As-of Date, Sitrep Dropdown]
           │    ├── <div class="figs">                             [5 Big KPI blocks: Affected, ECs, Infra, Agri, Relief]
           │    └── <div class="strips">                           [3 Mini KPI strips: Floods, Roads, Casualties]
           ├── <div class="tabs">                                  [Sticky jump links bar: #sec-pop, #sec-haz, #sec-rel, #sec-ops]
           ├── <section class="sec" id="sec-pop">                  [Population and response: 4 panels]
           │    ├── .panel.s7 (#evacChart)
           │    ├── .panel.s5 (#preemptiveChart)
           │    ├── .panel.s5 (#casChart)
           │    └── .panel.s7 (#resChart)
           ├── <section class="sec" id="sec-haz">                  [Floods and infrastructure: 3 panels]
           │    ├── .panel.s7 (#floodChart)
           │    ├── .panel.s5 (#roadsFeed)
           │    └── .panel.s12.cols2 (#utilityFeed)
           ├── <section class="sec" id="sec-rel">                  [Relief and damage: 4 panels]
           │    ├── .panel.s7 (#astCostChart)
           │    ├── .panel.s5 (#itemsFeed)
           │    ├── .panel.s6 (#infraCostFeed)
           │    └── .panel.s6 (#agriCostFeed)
           └── <section class="sec" id="sec-ops">                  [Operations: 3 panels]
                ├── .panel.s4 (#incidentFeed)
                ├── .panel.s4 (#weatherFeed)
                └── .panel.s4 (#actionsFeed)
```

### Critical Observations of Existing Structure:
1. **Header Naming Paradox**: The top navigation bar is classed `.sidebar` and identified by `#mainSidebar`, but is visually styled as a horizontal navbar (`height: 60px; position: sticky; top: 0;`).
2. **Single-Column Stacking**: All data panels and charts are wrapped inside `.wrap` with `margin: 0 auto`. The entire window scrolls vertically.
3. **Absence of Map**: There is currently no `<div id="map">` element in `index.html`.
4. **Print Button**: The Print button (`<button class="btn-ghost" onclick="window.print()">`) was previously removed from `hero-ctl`. Acceptance Criteria confirms it must **remain removed**.

---

## 3. Split-Screen Layout Architecture & Restructure Plan

### 3.1 Architectural Models Evaluated

| Feature | Model A: Rigid Split-Screen Grid | Model B: Full-Bleed Map + Floating Glassmorphic Sidebar (Recommended) |
|---|---|---|
| **Structure** | `display: flex;` with left column for cards and right column for map | `#map` pinned to full canvas (`z-index: 1`), `.data-sidebar` pinned on left (`z-index: 10`) |
| **Glassmorphic Effect** | Sidebar blurs only empty background color; no map underneath | Sidebar's `backdrop-filter: blur(16px)` blurs actual map tiles and municipal polygons |
| **Visual Impression** | Standard split screen (like two separate browser frames) | Executive Command HUD / Mission Control display for the Governor |
| **Requirement Compliance** | Meets basic AC | Fully implements R1, R2 ("sit above the map layer, allowing the map to subtly show through"), and AC ("occupies the right side or full background") |

### 3.2 Recommended DOM Restructure Blueprint

To preserve the SPA router, Leaflet initialization, and all data feeds, the DOM structure should be refactored as follows:

```html
<!-- Main Content Area as Split-Screen Container -->
<main class="main-content dashboard-viewport">
  
  <!-- 1. Interactive Leaflet Map Layer (Occupies right side & full background) -->
  <div id="map" class="executive-map" aria-label="Interactive Map of Tarlac Province"></div>

  <!-- 2. Left-Aligned Glassmorphic Data Sidebar -->
  <aside class="data-sidebar" id="dataSidebar" aria-label="Executive Analytics Sidebar">
    <div class="sidebar-inner-wrap">
      
      <!-- HERO SECTION (Glassmorphic Container) -->
      <section class="hero glass-panel">
        <div class="hero-top">
          <div>
            <h2 id="incidentNameDisplay">Loading incident data...</h2>
            <p><span class="live" title="Updates automatically"></span><span id="asOfDisplay">--</span></p>
          </div>
          <div class="hero-ctl">
            <select id="globalSitrepFilter" class="global-sitrep-select"></select>
          </div>
        </div>

        <!-- 5 KPI Big Figures -->
        <div class="figs">
          <a class="fig" href="#sec-pop" style="--c:#5B8CFF">
            <div class="fig-label"><span class="dot"></span>Total affected</div>
            <div class="fig-value" id="kpi-aff-fam">0</div>
            <div class="fig-sub"><span>families</span><b id="kpi-aff-pax">0 Pax</b></div>
          </a>
          <a class="fig" href="#sec-pop" style="--c:#FF9F5A">
            <div class="fig-label"><span class="dot"></span>Evacuation centers</div>
            <div class="fig-value" id="kpi-ec-count">0</div>
            <div class="fig-sub"><span>active centers</span><b id="kpi-ec-pax">0 Pax Inside</b></div>
          </a>
          <a class="fig" href="#sec-rel" style="--c:#FF6B72">
            <div class="fig-label"><span class="dot"></span>Infrastructure damage</div>
            <div class="fig-value" id="kpi-infra-dmg">₱0</div>
            <div class="fig-sub"><span>infrastructure sub-total</span></div>
          </a>
          <a class="fig" href="#sec-rel" style="--c:#F5B301">
            <div class="fig-label"><span class="dot"></span>Agriculture damage</div>
            <div class="fig-value" id="kpi-agri-dmg">₱0</div>
            <div class="fig-sub"><span>Dept. of Agriculture</span></div>
          </a>
          <a class="fig" href="#sec-rel" style="--c:#34D399">
            <div class="fig-label"><span class="dot"></span>Relief and assistance</div>
            <div class="fig-value" id="kpi-ast-total">₱0</div>
            <div class="fig-sub"><span>total cost provided</span></div>
          </a>
        </div>

        <!-- 3 KPI Mini Strips -->
        <div class="strips">
          <div class="strip">
            <div>
              <div class="strip-t">Flooded areas</div>
              <div class="strip-v" id="kpi-flood-active">0</div>
              <small>currently flooded</small>
            </div>
            <div class="chips"><span class="chip ok" id="kpi-flood-sub">0 Subsided</span></div>
          </div>
          <div class="strip">
            <div>
              <div class="strip-t">Roads and bridges</div>
              <div class="strip-v" id="kpi-road-not">0</div>
              <small style="color:var(--hot)">not passable</small>
            </div>
            <div class="chips"><span class="chip ok" id="kpi-road-pass">0 Passable</span></div>
          </div>
          <div class="strip">
            <div>
              <div class="strip-t">Casualties</div>
              <div class="strip-v" id="kpi-cas-total" style="color:var(--hot)">0</div>
              <small>total recorded</small>
            </div>
            <div class="chips"><span class="chip" id="kpi-cas-dead">0 Dead</span><span class="chip bad" id="kpi-cas-inj">0 Inj / Mis</span></div>
          </div>
        </div>
      </section>

      <!-- STICKY SECTION JUMP BAR -->
      <div class="tabs glass-tabs">
        <nav class="jump" aria-label="Sections">
          <a href="#sec-pop">Population and response</a>
          <a href="#sec-haz">Floods and infrastructure</a>
          <a href="#sec-rel">Relief and damage</a>
          <a href="#sec-ops">Operations</a>
        </nav>
      </div>

      <!-- SECTIONS (All Canvas Elements, Feeds, and IDs Preserved) -->
      <section class="sec" id="sec-pop">
        <div class="sec-h"><h2>Population and response</h2><p>Who is affected, who has moved, and what has been deployed</p></div>
        <div class="sidebar-cards">
          <!-- Evac Chart Panel -->
          <div class="panel glass-card">
            <div class="ph">
              <div class="pt"><i class="fa-solid fa-users-between-lines" style="color:var(--accent-orange)"></i><h3>Affected, served, and inside evacuation centers</h3></div>
              <div class="pc">
                <select id="evac-category-filter" class="chart-filter"><option value="ALL">All Categories</option><option value="Affected">Affected</option><option value="Served">Served</option><option value="Inside ECs">Inside ECs</option></select>
                <select id="evac-muni-filter" class="chart-filter"><option value="ALL">All Municipalities</option></select>
                <button id="evacChart-reset" class="btn-reset-zoom" style="display:none" onclick="resetChartZoom('evacChart')">Reset zoom</button>
                <button class="btn-chart-reset" onclick="resetChart('evac-category-filter');resetChart('evac-muni-filter');resetChartZoom('evacChart');" title="Reset filters"><i class="fa-solid fa-rotate-left"></i></button>
                <span class="hint">Drag to zoom</span>
              </div>
            </div>
            <div class="pb"><div class="chart-container"><canvas id="evacChart" role="img"></canvas><div id="evacChart-empty" class="chart-empty-message" style="display:none"><i class="fa-solid fa-users-slash"></i><span>No population data reported</span></div></div></div>
          </div>
          <!-- Preemptive Chart Panel -->
          <div class="panel glass-card">
            <div class="ph">
              <div class="pt"><i class="fa-solid fa-person-walking-arrow-right" style="color:var(--accent-teal)"></i><h3>Pre-emptive evacuations</h3></div>
              <div class="pc">
                <select id="preemptive-category-filter" class="chart-filter"><option value="ALL">All Categories</option><option value="Individuals">Individuals</option><option value="Families">Families</option></select>
                <select id="preemptive-muni-filter" class="chart-filter"><option value="ALL">All Municipalities</option></select>
                <button id="preemptiveChart-reset" class="btn-reset-zoom" style="display:none" onclick="resetChartZoom('preemptiveChart')">Reset zoom</button>
                <button class="btn-chart-reset" onclick="resetChart('preemptive-category-filter');resetChart('preemptive-muni-filter');resetChartZoom('preemptiveChart');" title="Reset filters"><i class="fa-solid fa-rotate-left"></i></button>
                <span class="hint">Drag to zoom</span>
              </div>
            </div>
            <div class="pb"><div class="chart-container"><canvas id="preemptiveChart" role="img"></canvas><div id="preemptiveChart-empty" class="chart-empty-message" style="display:none"><i class="fa-solid fa-person-walking-dashed-line-arrow-right"></i><span>No pre-emptive evacuations reported</span></div></div></div>
          </div>
          <!-- Casualties Chart Panel -->
          <div class="panel glass-card">
            <div class="ph">
              <div class="pt"><i class="fa-solid fa-truck-medical" style="color:var(--accent-red)"></i><h3>Casualties by location</h3></div>
              <div class="pc">
                <select id="cas-category-filter" class="chart-filter"><option value="ALL">All Categories</option><option value="Dead">Dead</option><option value="Missing">Missing</option><option value="Injured">Injured</option></select>
                <select id="cas-view-filter" class="chart-filter"><option value="ALL">All Municipalities</option></select>
                <button id="casChart-reset" class="btn-reset-zoom" style="display:none" onclick="resetChartZoom('casChart')">Reset zoom</button>
                <button class="btn-chart-reset" onclick="resetChart('cas-category-filter');resetChart('cas-view-filter');resetChartZoom('casChart');" title="Reset filters"><i class="fa-solid fa-rotate-left"></i></button>
                <span class="hint">Drag to zoom</span>
              </div>
            </div>
            <div class="pb"><div class="chart-container"><canvas id="casChart" role="img"></canvas><div id="casChart-empty" class="chart-empty-message" style="display:none"><i class="fa-solid fa-truck-medical"></i><span>No casualties reported</span></div></div></div>
          </div>
          <!-- Assets Deployed Panel -->
          <div class="panel glass-card">
            <div class="ph">
              <div class="pt"><i class="fa-solid fa-truck-fast" style="color:var(--accent-purple)"></i><h3>Deployed assets by agency</h3></div>
              <div class="pc">
                <select id="res-muni-filter" class="chart-filter"><option value="ALL">All Municipalities</option></select>
                <button id="resChart-reset" class="btn-reset-zoom" style="display:none" onclick="resetChartZoom('resChart')">Reset zoom</button>
                <button class="btn-chart-reset" onclick="resetChart('res-muni-filter');resetChartZoom('resChart');" title="Reset filters"><i class="fa-solid fa-rotate-left"></i></button>
                <span class="hint">Drag to zoom</span>
              </div>
            </div>
            <div class="pb"><div class="chart-container"><canvas id="resChart" role="img"></canvas><div id="resChart-empty" class="chart-empty-message" style="display:none"><i class="fa-solid fa-truck-ramp-box"></i><span>No deployed assets reported</span></div></div></div>
          </div>
        </div>
      </section>

      <!-- Sections #sec-haz, #sec-rel, #sec-ops similarly structured inside .data-sidebar -->
      ...
    </div>
  </aside>
</main>
```

---

## 4. CSS Layout Architecture & Container Rules

### 4.1 Split-Screen Viewport Setup
To anchor the map permanently and enable vertical scrolling strictly inside the left sidebar without page-level jitter:

```css
/* Layout root containment */
html, body {
  height: 100%;
  margin: 0;
  padding: 0;
  overflow: hidden; /* Prevent body scrollbars */
}

/* Header stays pinned at top */
.sidebar#mainSidebar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 60px;
  z-index: 1000;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border-subtle);
}

/* Main viewport container spanning below header */
.main-content.dashboard-viewport {
  position: fixed;
  top: 60px;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: calc(100vh - 60px);
  overflow: hidden;
  display: flex;
}

/* Leaflet Map: full-canvas backdrop */
#map.executive-map {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
}

/* Left Data Sidebar: floating glassmorphic container */
.data-sidebar {
  position: relative;
  z-index: 10;
  width: clamp(620px, 40vw, 780px);
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  background: rgba(248, 250, 252, 0.72);
  backdrop-filter: blur(20px) saturate(180%);
  -webkit-backdrop-filter: blur(20px) saturate(180%);
  border-right: 1px solid rgba(225, 230, 238, 0.6);
  box-shadow: 10px 0 35px rgba(11, 23, 48, 0.12);
  scrollbar-width: thin;
  scrollbar-color: rgba(91, 102, 120, 0.3) transparent;
}

/* Sidebar internal scrolling wrapper */
.sidebar-inner-wrap {
  padding: 18px 20px 48px;
  display: flex;
  flex-direction: column;
  gap: 20px;
}
```

### 4.2 Sidebar Internal Card Layout (Grid Adaptation)
Currently, `.grid` uses a 12-column grid where `.s7` and `.s5` sit side-by-side. In a 720px–780px sidebar, having two chart panels side-by-side squishes each chart to ~320px, rendering 17 municipality bar labels illegible.
- **Solution**: Inside `.data-sidebar`, panels should span the full width of the sidebar:
```css
.data-sidebar .sidebar-cards,
.data-sidebar .grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.data-sidebar .panel {
  width: 100%;
  grid-column: span 12 !important;
  border-radius: 16px;
}
```
- **Benefit**: Each Chart.js canvas gets a generous ~660px to 720px width x 280px to 300px height. This is the optimal aspect ratio for Tarlac's 17 municipalities, allowing clean horizontal spacing for bars, labels, and tooltips.

---

## 5. Scaling Analysis: 1080p Desktop & TV/LED Wall Scaling

### 5.1 Resolution Breakdown

| Metric | 1080p Desktop (1920×1080) | 4K TV / Large LED Wall (3840×2160) | Laptop (1366×768) |
|---|---|---|---|
| **Total Width** | 1920 px | 3840 px | 1366 px |
| **Sidebar Width** | 768 px (40vw) | 780 px (clamped) | 620 px (clamped) |
| **Uncovered Map Width** | 1,152 px (~60vw) | 3,060 px (~80vw) | 746 px (~55vw) |
| **Horizontal Scrolling?** | **None (0px)** | **None (0px)** | **None (0px)** |
| **Chart Canvas Width** | ~720 px | ~740 px | ~580 px |
| **Viewing Distance** | 60 cm (desk) | 3–6 m (executive table/wall) | 45 cm |

### 5.2 TV/LED Wall Considerations
1. **Typography Safeguards**:
   - Do NOT use unbounded viewport typography units (`font-size: 4vw`). On a 1080p or 4K screen, `4vw` becomes 76px–153px, blowing up cards and forcing excessive scrolling.
   - Use bounded clamp rules:
     - Hero incident title: `font-size: clamp(20px, 1.8vw, 26px); font-weight: 800;`
     - KPI figures: `font-size: clamp(26px, 2.2vw, 36px); font-weight: 800;`
     - Card headers: `font-size: 15px; font-weight: 700;`
     - Text legibility: High contrast colors (e.g. text main `#0F172A`, text muted `#5B6678`, high-luminosity signal badges).
2. **Leaflet Viewport Centering & Padding**:
   - Because the sidebar occupies the left 768px of the viewport, the geometric center of Tarlac province must NOT be centered at screen coordinate `x = 960px` (which would place it only 192px away from the sidebar edge).
   - Instead, Leaflet's `fitBounds` should incorporate left padding:
     ```javascript
     map.fitBounds(geojsonLayer.getBounds(), {
       paddingTopLeft: [780 + 30, 30], // [sidebarWidth + margin, topMargin]
       paddingBottomRight: [30, 30]
     });
     ```
   - This cleanly centers the geographic boundary of Tarlac inside the visible right area (~1152px wide) on 1080p.
3. **Leaflet Controls Placement**:
   - Pinned zoom controls (`+` / `-`) and layer switchers must be placed in `top-right` or `bottom-right` so they are never occluded by the left sidebar.

---

## 6. JavaScript & Data Binding Integrity Verification

Every data binding and element ID in `public/index.html` has been verified:

### 6.1 Catalog of Preserved Element IDs
- **Modals & Shell**: `narrativeModal`, `modalTitle`, `modalBodyContent`, `mainSidebar`, `toggleSidebarBtn`, `global-loader`.
- **Hero & Sitrep Controls**: `incidentNameDisplay`, `asOfDisplay`, `globalSitrepFilter`.
- **Top Big KPIs (Figures)**: `kpi-aff-fam`, `kpi-aff-pax`, `kpi-ec-count`, `kpi-ec-pax`, `kpi-infra-dmg`, `kpi-agri-dmg`, `kpi-ast-total`.
- **Mini KPIs (Strips)**: `kpi-flood-active`, `kpi-flood-sub`, `kpi-road-not`, `kpi-road-pass`, `kpi-cas-total`, `kpi-cas-dead`, `kpi-cas-inj`.
- **Chart Canvases & Empty States**:
  - `evacChart`, `evacChart-empty`, `evacChart-reset`
  - `preemptiveChart`, `preemptiveChart-empty`, `preemptiveChart-reset`
  - `casChart`, `casChart-empty`, `casChart-reset`
  - `resChart`, `resChart-empty`, `resChart-reset`
  - `floodChart`, `floodChart-empty`, `floodChart-reset`
  - `astCostChart`, `astCostChart-empty`, `astCostChart-reset`
- **Filter Dropdowns (TomSelect)**:
  - `evac-category-filter`, `evac-muni-filter`
  - `preemptive-category-filter`, `preemptive-muni-filter`
  - `cas-category-filter`, `cas-view-filter`
  - `res-muni-filter`
  - `flood-status-filter`, `flood-muni-filter`
  - `infra-muni-filter`, `utility-muni-filter`
  - `ast-source-filter`, `ast-cost-muni-filter`, `items-feed-muni-filter`
  - `infra-cost-muni-filter`, `agri-cost-muni-filter`, `weather-muni-filter`
- **Feeds & List Containers**:
  - `roadsFeed`, `utilityFeed`, `itemsFeed`, `infraCostFeed`, `agriCostFeed`, `incidentFeed`, `weatherFeed`, `actionsFeed`.
- **Section Anchors**:
  - `sec-pop`, `sec-haz`, `sec-rel`, `sec-ops`.

### 6.2 IntersectionObserver Root Update
In `public/index.html` line 1153:
```javascript
const L=[...document.querySelectorAll('.jump a')];
const io=new IntersectionObserver(es=>es.forEach(e=>{
    if(e.isIntersecting)L.forEach(a=>a.classList.toggle('on',a.hash==='#'+e.target.id))
}),{rootMargin:'-30% 0px -60% 0px'});
document.querySelectorAll('.sec').forEach(x=>io.observe(x));
```
When `.sec` sections are moved inside the scrollable container `.data-sidebar`, the `IntersectionObserver` must define `root: document.getElementById('dataSidebar')`. If `root` is omitted, it defaults to the top-level viewport which does not scroll, causing the active tab indicators to fail. Updating `root: document.getElementById('dataSidebar')` maintains active jump-tab highlighting.

---

## 7. Summary & Recommendations for Implementer

1. **Retain `<main class="main-content">`**: Keep as the viewport container to preserve soft SPA slide animations.
2. **Adopt Full-Bleed Map Behind Frosted Glass**: Insert `<div id="map"></div>` as the first child of `.main-content`, followed by `<aside class="data-sidebar" id="dataSidebar">`.
3. **Use `clamp(620px, 40vw, 780px)` for Sidebar**: Prevents chart squishing while guaranteeing a spacious ~60% viewport width for the Leaflet map on 1080p.
4. **Stack Panels in 1 Column Within the Sidebar**: Ensure panels use full sidebar width (`grid-column: span 12`) to provide optimal ~700px width for Chart.js 17-municipality bar charts.
5. **Set `root` in IntersectionObserver**: Target the scrolling container element so section tabs highlight accurately during scrolling.
6. **Keep All IDs Intact and Print Button Removed**: 100% ID preservation ensures zero regressions in Firestore listeners and TomSelect event handlers.
