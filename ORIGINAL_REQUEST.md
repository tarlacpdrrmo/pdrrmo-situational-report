# Original User Request

## 2026-10-09T04:56:52Z

# Teamwork Project Prompt — Draft

> Status: Step 6 — Setting Acceptance Criteria
> Goal: Craft prompt → get user approval → delegate to teamwork_preview
> Requested team: Full team

Redesign the UI structure for the Tarlac PDRRMO Executive Analytics Dashboard into a professional, modern layout. The left side should feature a sleek, glassmorphic (transparent glossy) sidebar containing the KPIs and charts, while the right side displays an interactive map. The UI must be optimized for viewing by the Governor on both desktop monitors and large TV/LED walls. 

Working directory: c:\Users\DOST ASTI PDRRMO\tarlac-sitrep
Integrity mode: demo

## Requirements

### R1. Responsive Split-Screen Architecture
Implement a resilient layout structure that permanently anchors the interactive map and floats the dashboard controls and charts over it on the left side. The layout must cleanly scale up to large LED walls without blowing up typography, and stack gracefully on standard laptop resolutions without squishing the charts.

### R2. Glassmorphic Data Sidebar
Transform the existing dark, heavy panels (the Hero section and the charts) into a modern, translucent "frosted glass" aesthetic. The data panels must sit above the map layer, allowing the map to subtly show through the backgrounds while ensuring absolute legibility of all numbers and text.

### R3. Safe Integration with Existing Data
The dashboard currently binds data to specific HTML `id` attributes (e.g., `kpi-aff-fam`, `incidentNameDisplay`). The new UI structure must preserve all existing `id` attributes and chart canvas elements so the backend data feeds do not break.

## Acceptance Criteria

### Layout & Aesthetics
- [ ] The dashboard features a left-aligned scrolling panel containing the KPIs/charts, and a permanently visible right-aligned map.
- [ ] The left panel uses a transparent `backdrop-filter` (or equivalent) so the background is visibly glassmorphic.
- [ ] The layout does not require horizontal scrolling on standard 1080p desktop monitors.
- [ ] Typography and margins scale cleanly up to 1920px widths (for the LED wall).

### Functional Preservation
- [ ] No existing JavaScript `id` attributes or data bindings are removed.
- [ ] The "Print" button remains removed.
- [ ] The Leaflet map initializes properly and occupies the right side (or full background) without visual clipping.
