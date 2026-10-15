# Project: Tarlac PDRRMO Executive Analytics Dashboard Redesign

## Architecture
- **Application Type**: Executive Real-Time Dashboard (SPA served statically via Firebase Hosting).
- **Core Technology Stack**: Vanilla HTML5, Custom CSS with `:root` design tokens, Vanilla JavaScript (ES6+), Leaflet 1.9.4, Chart.js 4.4.1, TomSelect, FontAwesome 6, Google Fonts ('Plus Jakarta Sans').
- **Layout Architecture**: Split-screen responsive model:
  - **Fixed Top Header**: `<header class="sidebar" id="mainSidebar">` pinned at `top: 0`, `height: 60px`, `z-index: 100`.
  - **Main Viewport**: `<main class="main-content">` filling `height: calc(100vh - 60px)`, `width: 100%`, `position: fixed`, `top: 60px`, `overflow: hidden`.
  - **Permanently Anchored Map**: `<div id="map" class="executive-map">` mounted as an underlay/right layer (`position: absolute; inset: 0; z-index: 1`), displaying CartoDB Positron basemap, centering Tarlac province `[15.482, 120.596]`, styled GeoJSON boundaries (`Tarlac_mun.geojson`), and responsive `invalidateSize()` handling via `ResizeObserver`.
  - **Glassmorphic Left Sidebar**: `<aside class="data-sidebar" id="dataSidebar">` positioned left (`position: absolute; top: 0; left: 0; bottom: 0; width: clamp(580px, 36vw, 740px); z-index: 10; overflow-y: auto; overflow-x: hidden; backdrop-filter: blur(20px) saturate(180%); -webkit-backdrop-filter: blur(20px) saturate(180%); background: rgba(242, 244, 248, 0.75); border-right: 1px solid rgba(255, 255, 255, 0.4);`).
  - **Internal Data Cards**:
    - Frosted white panels (`.panel`) with `background: rgba(255, 255, 255, 0.84)`, `backdrop-filter: blur(14px)`, specular border `1px solid rgba(255, 255, 255, 0.85)`, subtle shadow, maintaining >16:1 WCAG AAA text contrast.
    - Frosted ink navy hero card (`.hero`) with `background: linear-gradient(135deg, rgba(11,23,48,0.90), rgba(20,35,71,0.84))`, `backdrop-filter: blur(16px)`, border `1px solid rgba(255,255,255,0.18)`, preserving white typography and >18:1 contrast.
  - **Modals**: `#narrativeModal` placed directly under `<body>` to prevent stacking context bugs caused by `backdrop-filter`.

## Feature Inventory
| # | Feature | Description | Milestone | Source | Status |
|---|---------|-------------|-----------|--------|--------|
| 1 | Responsive Split-Screen Layout | Left-aligned scrolling sidebar and permanently anchored right-aligned/underlaid map | M1 | ORIGINAL_REQUEST §R1 | DONE |
| 2 | Permanent Leaflet Map Anchor | Leaflet 1.9.4 integration with container `#map`, CartoDB tiles, GeoJSON boundary layer, and ResizeObserver | M1 | ORIGINAL_REQUEST §R1, AC | DONE |
| 3 | Dual-Layer Glassmorphic Styling | Frosted glass aesthetic on sidebar and data panels using `backdrop-filter: blur(...)` and semi-transparent fills | M2 | ORIGINAL_REQUEST §R2 | DONE |
| 4 | Executive Typography & 1080p/LED Wall Scaling | Clean scaling up to 1920px width, single-column stacked panels, 0px horizontal scrolling, WCAG AAA contrast | M2 | ORIGINAL_REQUEST §R1, §R2, AC | DONE |
| 5 | Complete HTML ID & Binding Preservation | All 69 cataloged HTML IDs and canvas elements preserved verbatim for un-interrupted Firestore/JS data feeds | M3 | ORIGINAL_REQUEST §R3, AC | DONE |
| 6 | Removal of Print Button Enforced | The Print button remains removed from `.hero-ctl` and throughout the dashboard | M3 | ORIGINAL_REQUEST AC | DONE |
| 7 | Full E2E & Visual Verification | End-to-end multi-viewport validation, canvas render checks, TomSelect overflow, and integrity audit | M4 | ORIGINAL_REQUEST AC | DONE |

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Layout Restructuring & Map Anchor | Convert DOM in `public/index.html` to split-screen, add Leaflet CDN & map container, Leaflet init script | none | DONE |
| M2 | Glassmorphic Styling & LED Scaling | CSS frosted glass variables, glass cards, single-column card flow, 1080p / LED wall scaling rules | M1 | DONE |
| M3 | Data Bindings & Functional Integrity | Audit and preserve all 69 IDs, Chart.js canvas sizing (`min-width: 0`), TomSelect z-index, Print button absent | M1, M2 | DONE |
| M4 | E2E Testing, Adversarial Verification & Audit | Multi-viewport DOM verification, no console errors, Leaflet bounds check, forensic audit | M1, M2, M3 | DONE |

## Interface Contracts
### DOM Structure Contract (`public/index.html`)
- `header.sidebar#mainSidebar`: Pinned at top, contains navigation brand and nav links.
- `main.main-content`: Top-level wrapper below header, required for SPA slide transitions (`slide-in-left`).
- `div#map.executive-map`: Map container occupying full background / right side, initialized with Leaflet.
- `aside#dataSidebar.data-sidebar`: Left scrolling container hosting the dashboard controls, hero section, jump tabs, and data sections.
- `div#narrativeModal`: Placed directly under `body` (outside `.data-sidebar`) to avoid `backdrop-filter` containing block capture.

### Map Lifecycle Contract
- Container ID: `map`
- Center: `[15.482, 120.596]`, zoom: 10 (or auto-fitted to `Tarlac_mun.geojson` with left padding offset `[offsetLeft + 30, 30]`).
- Tiles: CartoDB Positron (`https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png`) with OSM fallback.
- Boundary: Fetch and render `Tarlac_mun.geojson` with stroke `#2F6BFF` and fill `rgba(47, 107, 255, 0.08)`.
- Invalidation: Handled by layout settle timeout, `ResizeObserver`, and window `resize` listener calling `map.invalidateSize()`.

### CSS & Stacking Contract
- Sidebar `z-index`: 10
- Header `z-index`: 100
- Map `z-index`: 1
- TomSelect Dropdown `.ts-dropdown`: `z-index: 1000 !important;`
- Modal Overlay `.modal-overlay`: `z-index: 100000;`
- Glassmorphic panels: `backdrop-filter: blur(14px) saturate(180%); -webkit-backdrop-filter: blur(14px) saturate(180%);`
- Contrast guarantee: Dark ink text `#0F172A` on `rgba(255,255,255,0.84)` (16.7:1 ratio), white text on hero (18.1:1 ratio).

## Code Layout
- `public/index.html`: The authoritative single-page application entry point. Contains embedded `<style>`, HTML structure, embedded `<script>` modules.
- `public/Tarlac_mun.geojson`: Spatial boundary polygon for Tarlac's 18 municipalities.
- `public/tarlac_brgy.geojson`: Spatial boundary polygon for Tarlac's 519 barangays.
- `.agents/teamwork/`: Orchestration and agent metadata only.

## E2E Acceptance & Verification Plan
1. **ID Integrity**: 100% of the 69 IDs exist in `public/index.html` with exact matches and 0 duplicates (PASSED).
2. **Print Button**: Zero occurrences of `window.print()` or `fa-print` (PASSED).
3. **Leaflet Map**: Container `#map` exists, Leaflet CSS/JS imported, script initializes map, bounds offset calculated, ResizeObserver attached (PASSED).
4. **Glassmorphism**: `.data-sidebar` and `.panel` have `backdrop-filter` rules, translucent backgrounds, specular borders, and WCAG AAA contrast (PASSED).
5. **Layout & Responsiveness**: At 1920px (1080p desktop) and 4K LED wall dimensions, 0px horizontal scrollbar, charts occupy optimal single-column dimensions without label squishing (PASSED).
6. **Forensic Integrity**: Independent forensic audit confirms genuine implementation, zero cheating/facades (CLEAN).
