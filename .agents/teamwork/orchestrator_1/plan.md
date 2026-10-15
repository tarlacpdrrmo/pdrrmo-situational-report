# Orchestration Plan: Tarlac PDRRMO Executive Analytics Dashboard Redesign

## Objective
Redesign the UI structure for the Tarlac PDRRMO Executive Analytics Dashboard into a professional, modern layout.
- Left side: Sleek, glassmorphic (frosted glass) scrolling sidebar containing KPIs and charts.
- Right side: Permanently anchored interactive Leaflet map without visual clipping.
- Optimized for desktop monitors (1080p) and large TV/LED walls (1920px+).
- Strict functional preservation: all existing HTML IDs and chart canvas bindings preserved, Print button remains removed.

## Phases

### Phase 0: Survey & Codebase Exploration
- Spawn 3 parallel Explorers:
  - **Explorer 1 (DOM & HTML Architecture)**: Map existing HTML structure, DOM layout, panels, container hierarchy, and elements.
  - **Explorer 2 (CSS & Glassmorphic Styling System)**: Examine styling framework, CSS rules, glassmorphism implementation options, responsive scaling for 1080p and LED walls.
  - **Explorer 3 (JS Data Bindings & Leaflet Map Integration)**: Audit all element IDs, chart canvas bindings, Leaflet map container and lifecycle (`invalidateSize`), ensuring non-breaking preservation.
- Aggregate survey reports and generate `PROJECT.md` with full Feature Inventory and interface contracts.

### Phase 1: Milestone Decomposition & Track Definition
- Milestone 1: Layout Restructure & Map Permanent Anchor (Split-screen architecture).
- Milestone 2: Glassmorphic Sidebar & Data Cards Styling (Frosted glass aesthetics, legibility, responsive scaling).
- Milestone 3: Functional Verification & Script/Map Integration (ID integrity, Leaflet resize handling, chart rendering).
- E2E / Validation Track: Automated and empirical checks for DOM integrity, CSS properties, visual clipping, and script errors.

### Phase 2: Implementation & Verification Loop
- Dispatch Worker to implement changes per specifications with strict file ownership.
- Dispatch Reviewers (2) for code quality, layout conformance, and ID preservation.
- Dispatch Challengers (2) for empirical verification on multiple viewport sizes (1080p, TV/LED wall) and edge cases.
- Dispatch Forensic Auditor for integrity and authentic implementation checks (zero hardcoded facades).

### Phase 3: Gate Evaluation & Final Reporting
- Evaluate GATE_STATUS against strict criteria.
- Complete handoff and report to parent caller.
