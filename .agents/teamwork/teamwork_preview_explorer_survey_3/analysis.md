# Explorer 3 Analysis Report: Data Bindings & Leaflet Map Integration

**Author**: Explorer 3 (Data Bindings & Leaflet Map Integration)  
**Target Repository**: `c:\Users\DOST ASTI PDRRMO\tarlac-sitrep`  
**Core Target File**: `public/index.html`  
**Date**: October 9, 2026  
**Status**: Comprehensive Read-Only Audit Complete  

---

## 1. Executive Summary

This investigation surveys the DOM architecture, JavaScript data bindings, Chart.js instances, and interactive components in `public/index.html` to establish strict non-breaking contracts for the upcoming Executive Analytics Dashboard redesign. 

### Key Findings
1. **Zero-ID Breaking Rule**: Exactly **69 unique HTML `id` attributes** are embedded in `public/index.html`. Every single one is tightly coupled to active Firestore listeners, Chart.js contexts, TomSelect dropdown filter bindings, empty state triggers, or KPI calculations. If any of these IDs are altered or removed, unhandled `TypeErrors` will immediately halt execution of `calculateKPIs()` and chart updates.
2. **Leaflet Map Integration Status**: `public/index.html` currently does not load Leaflet. The repository already provides two ready-to-use high-resolution GeoJSON boundary files: `public/Tarlac_mun.geojson` (17 municipalities + Tarlac City) and `public/tarlac_brgy.geojson` (all barangays). Integration requires adding Leaflet 1.9.4 CDN assets, defining a dedicated map container (e.g., `<div id="map"></div>`), and enforcing a reactive `map.invalidateSize()` lifecycle (via `ResizeObserver` and window resize handlers) to eliminate tile clipping and gray-box rendering.
3. **Print Button Removal Verified**: In `public/index_backup_before_glass.html`, a Print button (`<button class="btn-ghost" onclick="window.print()">`) was present in `.hero-ctl`. In the current `public/index.html`, this button is verified to be removed. Acceptance criteria requiring that the Print button remains removed is confirmed and must be strictly maintained.
4. **Layout Restructuring Risks**: Identified 5 critical architectural risks during glassmorphic conversion: Chart.js container flex-collapse, TomSelect dropdown clipping caused by `backdrop-filter` containing block changes and `overflow-y: auto`, zoom reset button orphan links, missing empty-state DOM elements, and Leaflet z-index collisions.

---

## 2. Complete HTML `id` Attribute Catalog

Every `id` attribute currently present in `public/index.html` (specifically lines 135–1153) is cataloged below, grouped by functional zone with its HTML tag and JavaScript consumer:

### Group A: Modal & Navigation Shell (5 IDs)
| # | HTML ID | Element Tag | Current Function & JS Reference | Criticality |
|---|---|---|---|---|
| 1 | `narrativeModal` | `<div>` (modal overlay) | Target for `openNarrativeModal()` & `closeNarrativeModal(event)` (lines 232, 237) | High: Modal crashes if missing |
| 2 | `modalTitle` | `<h3>` | Modal header heading, aria-labelledby target (line 135) | Medium: Accessibility & title |
| 3 | `modalBodyContent` | `<div>` | Target for `document.getElementById('modalBodyContent').innerHTML` (line 231) | High: Breaks narrative view |
| 4 | `mainSidebar` | `<header>` | Target for `document.getElementById('mainSidebar')` (lines 155, 156, 159, 160) | High: Shell navigation / toggle |
| 5 | `toggleSidebarBtn` | `<button>` | Target for `document.getElementById('toggleSidebarBtn')` (lines 154, 158) | High: Sidebar collapse event |

### Group B: Hero Header & KPI Metric Displays (17 IDs)
| # | HTML ID | Element Tag | Updated in `calculateKPIs()` | Bound Data / Field |
|---|---|---|---|---|
| 6 | `incidentNameDisplay` | `<h2>` | Line 980, 983 | `latestRecord.incidentCause` |
| 7 | `asOfDisplay` | `<span>` | Line 981, 984 | `latestRecord.asOfDate` / `timeMonitored` |
| 8 | `globalSitrepFilter` | `<select>` | Line 264 (`new TomSelect('#globalSitrepFilter')`) | SitRep selection dropdown |
| 9 | `kpi-aff-fam` | `<div>` | Line 1009 | `sumAffFam.toLocaleString()` |
| 10 | `kpi-aff-pax` | `<b>` | Line 1010 | `sumAffPax.toLocaleString() + " Pax"` |
| 11 | `kpi-ec-count` | `<div>` | Line 1011 | `sumActiveEc.toLocaleString()` |
| 12 | `kpi-ec-pax` | `<b>` | Line 1012 | `sumEcPax.toLocaleString() + " Pax Inside"` |
| 13 | `kpi-infra-dmg` | `<div>` | Line 1021 | `formatCurrency(sumInfraCost)` |
| 14 | `kpi-agri-dmg` | `<div>` | Line 1022 | `formatCurrency(sumAgriCost)` |
| 15 | `kpi-ast-total` | `<div>` | Line 1027 | `formatCurrency(sumAstCost)` |
| 16 | `kpi-flood-active` | `<div>` | Line 1035 | `activeFlood.toLocaleString()` |
| 17 | `kpi-flood-sub` | `<span>` | Line 1036 | `subsidedFlood.toLocaleString() + " Subsided"` |
| 18 | `kpi-road-not` | `<div>` | Line 1044 | `notPassable.toLocaleString()` |
| 19 | `kpi-road-pass` | `<span>` | Line 1045 | `passable.toLocaleString() + " Passable"` |
| 20 | `kpi-cas-total` | `<div>` | Line 1054 | `(dead + injured).toLocaleString()` |
| 21 | `kpi-cas-dead` | `<span>` | Line 1055 | `dead.toLocaleString() + " Dead"` |
| 22 | `kpi-cas-inj` | `<span>` | Line 1056 | `injured.toLocaleString() + " Inj/Mis"` |

### Group C: Section Anchor Containers (4 IDs)
| # | HTML ID | Element Tag | Jump Anchor & IntersectionObserver Link |
|---|---|---|---|
| 23 | `sec-pop` | `<section class="sec">` | Observed at line 1153; linked to `<a href="#sec-pop">` |
| 24 | `sec-haz` | `<section class="sec">` | Observed at line 1153; linked to `<a href="#sec-haz">` |
| 25 | `sec-rel` | `<section class="sec">` | Observed at line 1153; linked to `<a href="#sec-rel">` |
| 26 | `sec-ops` | `<section class="sec">` | Observed at line 1153; linked to `<a href="#sec-ops">` |

### Group D: Population & Response Section (`sec-pop`) (19 IDs)
| # | HTML ID | Element Tag | Role / Bound JS Consumer |
|---|---|---|---|
| 27 | `evac-category-filter` | `<select>` | `TomSelect` filter: Affected / Served / Inside ECs (lines 268, 282, 412, 673) |
| 28 | `evac-muni-filter` | `<select>` | `TomSelect` filter: Municipalities (lines 268, 282, 298, 412, 673) |
| 29 | `evacChart-reset` | `<button>` | Zoom reset button for `evacChart` (lines 336, 419) |
| 30 | `evacChart` | `<canvas>` | Chart.js 2D canvas context (line 367) |
| 31 | `evacChart-empty` | `<div>` | Empty state overlay toggle (line 687) |
| 32 | `preemptive-category-filter` | `<select>` | `TomSelect` filter: Individuals / Families (lines 274, 292, 412, 810) |
| 33 | `preemptive-muni-filter` | `<select>` | `TomSelect` filter: Municipalities (lines 274, 292, 298, 412, 810) |
| 34 | `preemptiveChart-reset` | `<button>` | Zoom reset button for `preemptiveChart` (lines 336, 419) |
| 35 | `preemptiveChart` | `<canvas>` | Chart.js 2D canvas context (line 379) |
| 36 | `preemptiveChart-empty` | `<div>` | Empty state overlay toggle (line 823) |
| 37 | `cas-category-filter` | `<select>` | `TomSelect` filter: Dead / Missing / Injured (lines 269, 283, 412, 707) |
| 38 | `cas-view-filter` | `<select>` | `TomSelect` filter: Municipalities (lines 269, 283, 298, 412, 707) |
| 39 | `casChart-reset` | `<button>` | Zoom reset button for `casChart` (lines 336, 419) |
| 40 | `casChart` | `<canvas>` | Chart.js 2D canvas context (line 373) |
| 41 | `casChart-empty` | `<div>` | Empty state overlay toggle (line 719) |
| 42 | `res-muni-filter` | `<select>` | `TomSelect` filter: Municipalities (lines 270, 285, 298, 412, 842) |
| 43 | `resChart-reset` | `<button>` | Zoom reset button for `resChart` (lines 336, 419) |
| 44 | `resChart` | `<canvas>` | Chart.js 2D canvas context (line 391) |
| 45 | `resChart-empty` | `<div>` | Empty state overlay toggle (line 876) |

### Group E: Floods & Infrastructure Section (`sec-haz`) (9 IDs)
| # | HTML ID | Element Tag | Role / Bound JS Consumer |
|---|---|---|---|
| 46 | `flood-status-filter` | `<select>` | `TomSelect` filter: Flooded / Receding / Subsided (lines 271, 286, 412, 888) |
| 47 | `flood-muni-filter` | `<select>` | `TomSelect` filter: Municipalities (lines 271, 286, 298, 412, 888) |
| 48 | `floodChart-reset` | `<button>` | Zoom reset button for `floodChart` (lines 336, 419) |
| 49 | `floodChart` | `<canvas>` | Chart.js 2D canvas context (line 402) |
| 50 | `floodChart-empty` | `<div>` | Empty state overlay toggle (line 910) |
| 51 | `infra-muni-filter` | `<select>` | `TomSelect` filter: Municipalities (lines 272, 287, 298, 412, 583) |
| 52 | `roadsFeed` | `<ul>` | Feed container for roads & bridges updates (line 623) |
| 53 | `utility-muni-filter` | `<select>` | `TomSelect` filter: Municipalities (lines 272, 288, 298, 412, 627) |
| 54 | `utilityFeed` | `<ul>` | Feed container for power/water utilities updates (line 669) |

### Group F: Relief & Damage Section (`sec-rel`) (11 IDs)
| # | HTML ID | Element Tag | Role / Bound JS Consumer |
|---|---|---|---|
| 55 | `ast-source-filter` | `<select>` | `TomSelect` filter: Relief source (lines 275, 284, 298, 412, 739) |
| 56 | `ast-cost-muni-filter` | `<select>` | `TomSelect` filter: Municipalities (lines 275, 284, 298, 412, 739) |
| 57 | `astCostChart-reset` | `<button>` | Zoom reset button for `astCostChart` (lines 336, 419) |
| 58 | `astCostChart` | `<canvas>` | Chart.js 2D canvas context (line 385) |
| 59 | `astCostChart-empty` | `<div>` | Empty state overlay toggle (line 798) |
| 60 | `items-feed-muni-filter` | `<select>` | `TomSelect` filter: Municipalities (lines 275, 293, 298, 412, 531) |
| 61 | `itemsFeed` | `<ul>` | Feed container for distributed relief items (line 579) |
| 62 | `infra-cost-muni-filter` | `<select>` | `TomSelect` filter: Municipalities (lines 273, 290, 298, 412, 498) |
| 63 | `infraCostFeed` | `<ul>` | Feed container for infrastructure damage feed (line 527) |
| 64 | `agri-cost-muni-filter` | `<select>` | `TomSelect` filter: Municipalities (lines 273, 291, 298, 412, 443) |
| 65 | `agriCostFeed` | `<ul>` | Feed container for agriculture damage feed (line 467) |

### Group G: Operations Section (`sec-ops`) (4 IDs)
| # | HTML ID | Element Tag | Role / Bound JS Consumer |
|---|---|---|---|
| 66 | `incidentFeed` | `<ul>` | Feed container for active hazards / incidents (line 480) |
| 67 | `weather-muni-filter` | `<select>` | `TomSelect` filter: Municipalities (lines 273, 289, 298, 412, 427) |
| 68 | `weatherFeed` | `<ul>` | Feed container for local weather conditions (line 439) |
| 69 | `actionsFeed` | `<ul>` | Feed container for LDRRMC actions taken (line 494) |

*Note on JS-only ID*: `global-loader` is queried at line 166 (`document.getElementById('global-loader')`). If an element with this ID is present or omitted, it is safely guarded by `if (loader && isInitialLoad)`.

---

## 3. JavaScript Data Binding & Lifecycle Analysis

### 3.1. Firestore Listener Call Chain
The data pipeline flows in a reactive hierarchy:
```
Firestore Listeners (watch & onSnapshot) 
   ──> updates dbData array
   ──> calls calculateKPIs()
        ├──> updates 16 Hero KPI innerTexts
        ├──> calls updateCharts()
        │     ├──> updateGlobalSitrepDropdown() [tsGlobal]
        │     ├──> updateEvacChart()           [evacChart, tsInstances, empty state]
        │     ├──> updateCasChart()            [casChart, tsInstances, empty state]
        │     ├──> updateAstCostChart()        [astCostChart, tsInstances, empty state]
        │     ├──> updateResChart()            [resChart, tsInstances, empty state]
        │     ├──> updatePreemptiveChart()     [preemptiveChart, tsInstances, empty state]
        │     ├──> updateFloodChart()          [floodChart, tsInstances, empty state]
        │     ├──> updateRoadsFeed()           [roadsFeed innerHTML]
        │     ├──> updateUtilityFeed()         [utilityFeed innerHTML]
        │     ├──> updateInfraCostFeed()       [infraCostFeed innerHTML]
        │     ├──> updateItemsFeed()           [itemsFeed innerHTML]
        │     ├──> updateAgriCostFeed()        [agriCostFeed innerHTML]
        │     ├──> updateWeatherFeed()         [weatherFeed innerHTML]
        │     ├──> updateIncidentsFeed()       [incidentFeed innerHTML]
        │     └──> updateActionsFeed()         [actionsFeed innerHTML]
        └──> calls hideGlobalLoader()
```

### 3.2. Chart.js Canvases & Plugins
There are **6 active Chart.js instances**:
1. `evacChart`: Bar chart (Affected / Served / Inside ECs)
2. `casChart`: Stacked bar chart (Dead / Missing / Injured)
3. `preemptiveChart`: Stacked bar chart (Individuals / Families)
4. `astCostChart`: Grouped/stacked bar chart (Relief assistance by source)
5. `resChart`: Horizontal stacked bar chart (`indexAxis: 'y'`) (Deployed personnel by agency)
6. `floodChart`: Stacked bar chart (Flooded / Receding / Subsided barangays)

**Plugin & Zoom Contract**:
- Configured with `chartjs-plugin-zoom`: Drag zoom enabled on X axis.
- When zoom completes, it shows button `${chart.canvas.id}-reset`.
- `resetChartZoom(chartId)` expects:
  `const chartMap = { 'evacChart': evacChart, 'casChart': casChart, 'preemptiveChart': preemptiveChart, 'astCostChart': astCostChart, 'resChart': resChart, 'floodChart': floodChart };`
- Chart canvas IDs and reset button IDs must maintain the exact naming convention `${chartId}` and `${chartId}-reset`.

### 3.3. TomSelect Controls
There are **18 TomSelect instances** instantiated on DOM elements:
- 1 Global instance: `tsGlobal` on `#globalSitrepFilter`
- 17 Filter instances in `tsInstances[id]` (listed in `chartFilterIds` array, lines 267–276)
- Helper function `syncTomSelect(id, munisSet)` dynamically repopulates options based on current Firestore data.
- Any change to the HTML `id` of any select element will break `tsInstances[id]` and cause `syncTomSelect` to fail silently or throw exceptions.

---

## 4. Leaflet Map Integration & Sizing Architecture

### 4.1. Current Workspace Status
- `public/index.html` does NOT currently load Leaflet JS or CSS.
- The project already has two GeoJSON files in `public/`:
  - `public/Tarlac_mun.geojson` (Municipality polygons for Tarlac Province: Anao, Bamban, Capas, Concepcion, Gerona, La Paz, Mayantoc, Moncada, Paniqui, Pura, Ramos, San Clemente, San Jose, San Manuel, Santa Ignacia, Tarlac City, Victoria).
  - `public/tarlac_brgy.geojson` (519 barangay polygon features).

### 4.2. Required CDN Dependencies
Add to `<head>`:
```html
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css" />
<script src="https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js"></script>
```
*(Using `cdnjs.cloudflare.com` matches existing dependencies in index.html, e.g. FontAwesome).*

### 4.3. Map Container Architecture & Layout Options
The map container must have a dedicated ID, typically `id="map"` (or `id="pdrrmo-map"`).
The requirements support two responsive layout variations:
- **Option 1: Split-Screen Side-by-Side (Desktop / 1080p / LED Wall)**
  - Left: Scrolling sidebar (`width: 480px` or `width: 42vw`, `max-width: 680px`, `height: calc(100vh - 60px)`, `overflow-y: auto`, `position: relative`, `z-index: 20`).
  - Right: Permanently anchored Leaflet map (`flex: 1`, `height: calc(100vh - 60px)`, `position: sticky; top: 60px;`, `z-index: 10`).
- **Option 2: Full-Bleed Map Underlay with Frosted Glass Floating Panel**
  - Background: Map container (`position: fixed; top: 60px; right: 0; bottom: 0; left: 0; z-index: 1; width: 100vw; height: calc(100vh - 60px);`).
  - Left: Glassmorphic panel floats over the left portion of the map (`position: relative; z-index: 20; width: 500px; height: calc(100vh - 60px); overflow-y: auto; backdrop-filter: blur(16px); background: rgba(15, 23, 42, 0.75);`).

### 4.4. Crucial Leaflet Behavior: `map.invalidateSize()`
Leaflet relies on container pixel dimensions to build its tile grid. If dimensions change or are computed before layout settles, the map will render gray tiles or misaligned boundaries.
**Mandatory Lifecycle Handling**:
1. **Initial Initialization**:
   ```javascript
   const map = L.map('map', {
       center: [15.482, 120.596],
       zoom: 10,
       zoomControl: false // move zoomControl to top-right to avoid left sidebar collision
   });
   L.control.zoom({ position: 'top-right' }).addTo(map);

   // Free clean basemap (CartoDB Positron for light theme, or Dark Matter for dark executive theme)
   L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
       attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
       maxZoom: 19
   }).addTo(map);

   // Invalidate size once DOM settles
   setTimeout(() => { map.invalidateSize(); }, 250);
   ```

2. **ResizeObserver & Window Resize**:
   ```javascript
   // Auto-invalidation on window resize
   window.addEventListener('resize', () => { map.invalidateSize(); });

   // Native ResizeObserver on container to handle sidebar toggling or CSS transitions
   const mapElem = document.getElementById('map');
   if (mapElem && window.ResizeObserver) {
       new ResizeObserver(() => { map.invalidateSize(); }).observe(mapElem);
   }
   ```

3. **GeoJSON Boundary Overlay**:
   ```javascript
   fetch('Tarlac_mun.geojson')
       .then(res => res.json())
       .then(data => {
           const geoLayer = L.geoJSON(data, {
               style: {
                   color: '#2F6BFF',
                   weight: 1.5,
                   opacity: 0.8,
                   fillColor: '#2F6BFF',
                   fillOpacity: 0.08
               },
               onEachFeature: (feature, layer) => {
                   if (feature.properties && feature.properties.Mun_Name) {
                       layer.bindTooltip(`<b>${feature.properties.Mun_Name}</b>`, {
                           permanent: false,
                           direction: 'center',
                           className: 'leaflet-muni-label'
                       });
                   }
               }
           }).addTo(map);
           map.fitBounds(geoLayer.getBounds(), { padding: [20, 20] });
       })
       .catch(err => console.warn('Could not load Tarlac_mun.geojson', err));
   ```

---

## 5. Print Button Status & Functional Preservation

### 5.1. Audit Result
- In `public/index_backup_before_glass.html` at line 135:
  ```html
  <div class="hero-ctl">
      <select id="globalSitrepFilter" class="global-sitrep-select"></select>
      <button class="btn-ghost" onclick="window.print()"><i class="fa-solid fa-print"></i> Print</button>
  </div>
  ```
- In the active `public/index.html` at line 135:
  ```html
  <div class="hero-ctl">
      <select id="globalSitrepFilter" class="global-sitrep-select"></select>
  </div>
  ```
- **Conclusion**: The "Print" button has already been removed in `public/index.html`.
- **Constraint for Workers**: The Print button MUST NOT be re-added anywhere in the new layout.

---

## 6. Technical Risk Matrix & Mitigation Blueprint

| # | Identified Risk | Impact / Failure Mode | Concrete Mitigation Strategy |
|---|---|---|---|
| 1 | **Chart.js Infinite Flex Expanding** | When placing charts in a flex-column left panel, Chart.js canvases fail to compute width and expand indefinitely or squish to 0px. | Ensure `.chart-container` retains `position: relative`, `height: 280px` (or 300px), and `min-width: 0`. The parent sidebar card must have `min-width: 0` and `overflow: hidden`. |
| 2 | **TomSelect Dropdown Clipping** | Inside an `overflow-y: auto` sidebar, TomSelect dropdowns get clipped by card edges or panel boundaries. | Ensure panel containers have `overflow: visible` where dropdowns exist, OR use `dropdownParent: 'body'` on TomSelect instances if containment clipping occurs. |
| 3 | **Backdrop-Filter Stacking Context** | `backdrop-filter` creates a new containing block for `position: fixed` children, causing modals or tooltips inside the sidebar to misalign. | Keep `#narrativeModal` directly under `<body>` outside the glassmorphic sidebar. Keep Leaflet tooltips inside the map container. |
| 4 | **Missing Empty-State DOM Elements** | If elements like `evacChart-empty` are omitted during HTML template redesign, Firestore snapshot updates fail with `TypeError: Cannot read properties of null (reading 'style')`. | All 6 empty state elements (`evacChart-empty`, `casChart-empty`, `astCostChart-empty`, `preemptiveChart-empty`, `resChart-empty`, `floodChart-empty`) must remain inside their respective `.chart-container` divs. |
| 5 | **Missing Reset Zoom Buttons** | If buttons like `evacChart-reset` are omitted, Chart.js zoom plugin throws `TypeError` on zoom completion. | Keep all 6 zoom reset buttons (`${chartId}-reset`) in their panel header controls (`.pc`). |
| 6 | **IntersectionObserver Jump Links Broken** | `io` in line 1153 observes `.sec` against `window` viewport. If sections are moved inside an inner scrolling container, active tab highlighting won't trigger. | If scrolling is contained in a `.sidebar-scroll` div, configure `root: document.querySelector('.sidebar-scroll')` for the observer, or keep anchor hash links functional. |
| 7 | **Leaflet Z-Index Stacking Collisions** | Leaflet controls (`z-index: 1000`) and tile panes (`z-index: 200-650`) may overlap or bleed over the glassmorphic panel. | Position the glassmorphic sidebar at `z-index: 1010` (or place sidebar and map side-by-side without horizontal overlap). Position Leaflet zoom controls at `top-right`. |

---

## 7. Recommended Implementation Architecture for Downstream Workers

### Layout Recommendation: Split-Screen with Sticky/Fixed Right Map
```html
<body>
  <!-- Modal remains at top level -->
  <div class="modal-overlay" id="narrativeModal" ...>...</div>

  <!-- Top Navigation Header (Sticky, 60px height) -->
  <header class="sidebar" id="mainSidebar">...</header>

  <main class="main-content">
    <div class="dashboard-split-layout">
      
      <!-- LEFT: Glassmorphic Scrollable Data Sidebar -->
      <aside class="glass-sidebar" id="glassSidebar">
        <!-- Hero Section (frosted glass) -->
        <section class="hero glass-card">
          <!-- incidentNameDisplay, asOfDisplay, globalSitrepFilter, KPIs 9-22 -->
        </section>

        <!-- Navigation Jump Tabs -->
        <div class="tabs glass-tabs">
          <nav class="jump">...</nav>
        </div>

        <!-- Section 1: sec-pop -->
        <section class="sec" id="sec-pop">
          <!-- Panels with chart canvases and filters -->
        </section>

        <!-- Section 2: sec-haz -->
        <section class="sec" id="sec-haz">
          <!-- floodChart, roadsFeed, utilityFeed -->
        </section>

        <!-- Section 3: sec-rel -->
        <section class="sec" id="sec-rel">
          <!-- astCostChart, itemsFeed, infraCostFeed, agriCostFeed -->
        </section>

        <!-- Section 4: sec-ops -->
        <section class="sec" id="sec-ops">
          <!-- incidentFeed, weatherFeed, actionsFeed -->
        </section>
      </aside>

      <!-- RIGHT: Permanently Anchored Interactive Leaflet Map -->
      <section class="map-view-container" id="mapContainer">
        <div id="map"></div>
      </section>

    </div>
  </main>
</body>
```

### Essential CSS Blueprint:
```css
.dashboard-split-layout {
  display: flex;
  height: calc(100vh - 60px);
  overflow: hidden;
  position: relative;
}

.glass-sidebar {
  width: 45%;
  min-width: 480px;
  max-width: 720px;
  height: 100%;
  overflow-y: auto;
  padding: 20px;
  background: rgba(255, 255, 255, 0.65);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-right: 1px solid rgba(225, 230, 238, 0.6);
  z-index: 20;
}

.map-view-container {
  flex: 1;
  height: 100%;
  position: relative;
  z-index: 10;
}

#map {
  width: 100%;
  height: 100%;
}
```

This ensures:
1. All 69 DOM IDs remain completely intact.
2. The Leaflet map occupies the full right side permanently without visual clipping.
3. The left sidebar scrolls smoothly without horizontal scrollbars on 1080p and scales cleanly on TV/LED walls up to 1920px.
4. The Print button remains removed.
