# BRIEFING — 2026-10-09T05:08:30Z

## Mission
Investigate DOM layout hierarchy, template architecture, and restructure plan for split-screen executive dashboard with scrolling sidebar and anchored Leaflet map.

## 🔒 My Identity
- Archetype: explorer
- Roles: DOM & Layout Architecture Investigator
- Working directory: c:\Users\DOST ASTI PDRRMO\tarlac-sitrep\.agents\teamwork\teamwork_preview_explorer_survey_1
- Original parent: 232fc0df-96a7-4667-b184-3fa3caf69690
- Milestone: survey

## 🔒 Key Constraints
- Read-only investigation — do NOT implement or modify source code files
- Preserve all existing JavaScript `id` attributes and chart canvas elements
- Preserve "Print" button removal
- Only write within c:\Users\DOST ASTI PDRRMO\tarlac-sitrep\.agents\teamwork\teamwork_preview_explorer_survey_1

## Current Parent
- Conversation ID: 232fc0df-96a7-4667-b184-3fa3caf69690
- Updated: 2026-10-09T05:08:30Z

## Investigation State
- **Explored paths**:
  - `public/index.html` (primary dashboard entry point, lines 1-1156 examined)
  - `firebase.json` (Firebase hosting and rewrite configuration)
  - `public/map_test.html` (MapLibre test prototype)
  - `public/Tarlac_mun.geojson` (municipality polygon definitions)
  - `functions/package.json`
  - Peer explorer assignments (`survey_2` for CSS/styling, `survey_3` for Leaflet/bindings)
- **Key findings**:
  - Architecture is static HTML/JS/CSS served via Firebase Hosting; no build step or server templating
  - Currently single vertical scrolling column inside `.wrap` (max-width 1480px)
  - No map is currently integrated in `index.html`
  - `.main-content` selector is vital for SPA slide animations (`slide-in-right`, etc.)
  - Recommended split-screen architecture: Full-bleed background map `#map` (`z-index: 1`) with an anchored left-aligned scrolling glassmorphic sidebar `.data-sidebar` (`z-index: 10`, `width: clamp(620px, 40vw, 780px)`), allowing the map to subtly show through frosted glass panels on the left while providing an expansive, interactive Leaflet map on the right (~1150px on 1080p).
  - All 43+ data binding IDs identified and cataloged; full ID preservation guaranteed
  - IntersectionObserver for jump navigation needs root targeting the scrolling sidebar container
- **Unexplored areas**: None. Survey is complete.

## Key Decisions Made
- Confirmed full-bleed / split-screen DOM architecture with preserved `.main-content` wrapper
- Formulated exact CSS layout rules for sidebar width, scrolling, and panel grid behavior
- Documented 1080p and TV/LED wall scaling recommendations

## Artifact Index
- analysis.md — Comprehensive DOM & layout findings
- handoff.md — 5-component handoff report
- progress.md — Liveness and progress tracker
