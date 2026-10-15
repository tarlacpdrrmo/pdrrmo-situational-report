# HANDOFF REPORT — Explorer 1 (DOM & Layout Architecture)

**Agent**: Explorer 1 (`teamwork_preview_explorer_survey_1`)  
**Date**: 2026-10-09  
**Recipient**: Parent Orchestrator (`232fc0df-96a7-4667-b184-3fa3caf69690`)  
**Handoff Type**: Hard (Task Complete)  

---

## 1. Observation

- **Entry Point and Serving Config**:
  - `firebase.json` (lines 22–35):
    ```json
    "hosting": {
      "public": "public",
      "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
      "rewrites": [{ "source": "**", "destination": "/index.html" }]
    }
    ```
    Confirms that Firebase Hosting serves static assets directly from `public/` and rewrites to `/index.html`. No server-side templating engine (Pug, EJS) or build bundler (Vite, Webpack) is used.
  - Primary dashboard HTML entry point is `public/index.html` (1,156 lines, 92,402 bytes).

- **Current DOM Hierarchy in `public/index.html`**:
  - Line 134: `<body>`
  - Line 135: Contains the modal overlay (`#narrativeModal`), top navigation bar (`header.sidebar#mainSidebar`), and main content (`main.main-content > div.wrap`).
  - Line 57 (CSS): `.wrap{max-width:1480px;margin:0 auto;padding:20px 28px 60px}` centers all content in a single vertical column.
  - The hero card (`section.hero`), section jump navigation (`div.tabs > nav.jump`), and four sections (`#sec-pop`, `#sec-haz`, `#sec-rel`, `#sec-ops`) are stacked vertically.
  - There is currently **no Leaflet map or map container** in `public/index.html`.
  - The Print button was previously removed from `public/index.html` (verified in `index_backup_before_glass.html` line 135 vs `index.html` line 135 where `hero-ctl` contains only `#globalSitrepFilter`).

- **JavaScript SPA Dependencies**:
  - `public/index.html` line 1101: `const mainContent = document.querySelector('.main-content');`
  - Line 1114: `mainContent.classList.add('slide-in-left');`
  - Line 1153:
    ```javascript
    const L=[...document.querySelectorAll('.jump a')];
    const io=new IntersectionObserver(es=>es.forEach(e=>{
        if(e.isIntersecting)L.forEach(a=>a.classList.toggle('on',a.hash==='#'+e.target.id))
    }),{rootMargin:'-30% 0px -60% 0px'});
    document.querySelectorAll('.sec').forEach(x=>io.observe(x));
    ```

- **Data Binding IDs**:
  - 43 distinct HTML IDs were cataloged across lines 135 to 1095, including:
    - Incident & metadata: `incidentNameDisplay`, `asOfDisplay`, `globalSitrepFilter`
    - Big KPIs: `kpi-aff-fam`, `kpi-aff-pax`, `kpi-ec-count`, `kpi-ec-pax`, `kpi-infra-dmg`, `kpi-agri-dmg`, `kpi-ast-total`
    - Mini KPIs: `kpi-flood-active`, `kpi-flood-sub`, `kpi-road-not`, `kpi-road-pass`, `kpi-cas-total`, `kpi-cas-dead`, `kpi-cas-inj`
    - Chart Canvases: `evacChart`, `preemptiveChart`, `casChart`, `resChart`, `floodChart`, `astCostChart`
    - Feed lists: `roadsFeed`, `utilityFeed`, `itemsFeed`, `infraCostFeed`, `agriCostFeed`, `incidentFeed`, `weatherFeed`, `actionsFeed`
    - Filter dropdowns: 17 TomSelect instances matching `chartFilterIds` (lines 267–276).

---

## 2. Logic Chain

1. **SPA Compatibility Reasoning**: Because line 1101 attaches slide animations specifically to `document.querySelector('.main-content')`, removing or renaming `<main class="main-content">` would cause page transition errors. Therefore, `.main-content` must serve as the top-level viewport wrapper for the split-screen layout.
2. **Split-Screen & Glassmorphism Model Reasoning**: Requirement R2 specifies that "data panels must sit above the map layer, allowing the map to subtly show through the backgrounds while ensuring absolute legibility of all numbers and text." Acceptance Criteria notes that the Leaflet map "occupies the right side (or full background)". Anchoring the map `#map` as a full-bleed layer (`position: absolute; inset: 0; z-index: 1`) under a floating left-aligned scrolling sidebar (`.data-sidebar`, `z-index: 10`, `backdrop-filter: blur(20px)`) satisfies both requirements: the map tiles show subtly through the frosted glass on the left, while the right ~60% of the screen displays an unobstructed, interactive Leaflet map.
3. **Scaling & Width Reasoning**: On a 1080p display (1920px wide), fixing the sidebar to `width: clamp(620px, 40vw, 780px)` allocates ~768px to the sidebar and ~1,152px to the map. At 768px width, stacking chart panels into a single column (`grid-column: span 12`) gives each Chart.js canvas ~720px width x 300px height. This avoids horizontal squishing of Tarlac's 17 municipality bar labels on the X-axis while ensuring zero horizontal overflow on desktop and LED walls.
4. **Scroll & Observer Isolation Reasoning**: If `.data-sidebar` has `overflow-y: auto`, the document window does not scroll. The default `IntersectionObserver` in line 1153 uses `root: null` (viewport), which would fail to detect section intersections inside an internally scrolling container. Setting `root: document.getElementById('dataSidebar')` ensures section jump tabs remain synchronized.

---

## 3. Caveats

1. **Leaflet Script Injection**: `public/index.html` currently lacks the Leaflet CDN script and stylesheet tags (`leaflet.js` and `leaflet.css`). These must be added in `<head>` by the implementer.
2. **Map Offset on Full Canvas**: When using a full-bleed map behind a 768px sidebar, Leaflet's `fitBounds` must include left padding (`paddingTopLeft: [800, 30]`) so Tarlac province centers within the uncovered right viewport area rather than behind the frosted glass sidebar.
3. **No Terminal Commands Run**: Verification was conducted strictly via static file inspection (`view_file`, `list_dir`) and code tracing, per read-only constraints.

---

## 4. Conclusion

The repository is structured as a static Firebase web application. Restructuring `public/index.html` to achieve the required split-screen layout requires:
1. Retaining `<header class="sidebar" id="mainSidebar">` pinned at `top: 0` (height 60px).
2. Sizing `<main class="main-content">` to `height: calc(100vh - 60px); width: 100%; position: fixed; top: 60px; overflow: hidden;`.
3. Inserting `<div id="map" class="executive-map"></div>` (`z-index: 1`) as the full background / right-side map layer.
4. Wrapping all existing hero KPI figures, tabs, and chart sections into `<aside class="data-sidebar" id="dataSidebar">` (`width: clamp(620px, 40vw, 780px); height: 100%; overflow-y: auto; z-index: 10; backdrop-filter: blur(20px)`).
5. Ensuring panels stack in a single column within the sidebar (`grid-column: span 12`), preserving all 43+ existing element IDs and leaving the Print button removed.
6. Updating the `IntersectionObserver` root to target `#dataSidebar`.

Detailed architectural blueprints and code samples are documented in:  
`c:\Users\DOST ASTI PDRRMO\tarlac-sitrep\.agents\teamwork\teamwork_preview_explorer_survey_1\analysis.md`.

---

## 5. Verification Method

1. **Inspect Layout Blueprint**: Open and review `analysis.md` in this directory to confirm all DOM hierarchy changes, CSS container rules, and ID preservation mappings.
2. **DOM Element Integrity Spot-Check**: Verify against `public/index.html` that every listed ID in Section 6.1 of `analysis.md` matches verbatim the IDs referenced in the JavaScript functions (lines 154–1095).
3. **Responsive Width Check**: Mathematically verify that at 1920px (1080p), `clamp(620px, 40vw, 780px)` resolves to 768px sidebar width + 1,152px uncovered map width = 1,920px with 0px horizontal scrollbar.
