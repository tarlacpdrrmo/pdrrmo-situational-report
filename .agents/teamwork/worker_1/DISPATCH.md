# DISPATCH — Worker 1 (UI & Map Implementation)

You are teamwork_preview_worker.
Your working directory: c:\Users\DOST ASTI PDRRMO\tarlac-sitrep\.agents\teamwork\worker_1
Parent Orchestrator: 232fc0df-96a7-4667-b184-3fa3caf69690
Authoritative Request: c:\Users\DOST ASTI PDRRMO\tarlac-sitrep\.agents\teamwork\ORIGINAL_REQUEST.md
Project Plan: c:\Users\DOST ASTI PDRRMO\tarlac-sitrep\PROJECT.md

Exclusively Owned File:
- `c:\Users\DOST ASTI PDRRMO\tarlac-sitrep\public\index.html`

Input Blueprints:
- DOM Blueprint: `c:\Users\DOST ASTI PDRRMO\tarlac-sitrep\.agents\teamwork\teamwork_preview_explorer_survey_1\analysis.md`
- CSS Blueprint: `c:\Users\DOST ASTI PDRRMO\tarlac-sitrep\.agents\teamwork\teamwork_preview_explorer_survey_2\analysis.md`
- Data Bindings & Leaflet Blueprint: `c:\Users\DOST ASTI PDRRMO\tarlac-sitrep\.agents\teamwork\teamwork_preview_explorer_survey_3\analysis.md`

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_preview_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Core Tasks:
1. Add Leaflet 1.9.4 CSS & JS to `<head>`.
2. Restructure `public/index.html` into a split-screen layout:
   - Header `<header class="sidebar" id="mainSidebar">` pinned at top.
   - Container `<main class="main-content">` holding:
     - Map layer `<div id="map" class="executive-map"></div>` as the interactive background / right side.
     - Left glassmorphic sidebar `<aside class="data-sidebar" id="dataSidebar">` containing hero, tabs, and chart/feed sections.
   - Place `#narrativeModal` directly under `<body>` to avoid CSS containing block trap.
3. Apply modern glassmorphism styling:
   - Frosted glass sidebar and panels with `backdrop-filter: blur(...)` and semi-transparent backgrounds.
   - Ensure WCAG AAA text contrast (>12:1).
   - Ensure single-column card flow in sidebar with `min-width: 0` on chart containers so 17-municipality Chart.js bars are not squished.
   - Guarantee zero horizontal scrollbar on 1080p desktop and LED walls.
4. Leaflet map integration:
   - Initialize Leaflet map on `#map`, add CartoDB Positron tiles.
   - Fetch/render `Tarlac_mun.geojson` boundaries with sleek styling.
   - Fit bounds with left padding offset for sidebar.
   - Attach `ResizeObserver` and window resize event to call `map.invalidateSize()`.
   - Update `IntersectionObserver` root to `#dataSidebar`.
5. Strict ID preservation:
   - Preserve all 69 HTML element IDs cataloged in Explorer 3's report verbatim.
   - Ensure the Print button remains removed.
6. Verify your implementation:
   - Run verification checks (e.g. node script to verify all 69 IDs exist, syntax is valid, Leaflet is loaded).
   - Document verification commands and results in your handoff report.

Deliverables:
- Write changes to `public/index.html`.
- Write progress updates to `c:\Users\DOST ASTI PDRRMO\tarlac-sitrep\.agents\teamwork\worker_1\progress.md`.
- Write handoff report to `c:\Users\DOST ASTI PDRRMO\tarlac-sitrep\.agents\teamwork\worker_1\handoff.md`.
- Send completion message to parent orchestrator.
