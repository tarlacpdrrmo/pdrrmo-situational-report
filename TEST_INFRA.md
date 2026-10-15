# E2E Test Infra: Tarlac PDRRMO Executive Analytics Dashboard

## Test Philosophy
- Opaque-box and structural verification derived from user requirements in `ORIGINAL_REQUEST.md`.
- Methodology: Category-Partition + Boundary Value Analysis + Pairwise + Workload Testing across 4 tiers.

## Feature Inventory & Test Mapping
| # | Feature | Source (Requirement) | Tier 1 | Tier 2 | Tier 3 | Tier 4 |
|---|---------|----------------------|:------:|:------:|:------:|:------:|
| F1 | Split-screen layout (left sidebar, right map) | ORIGINAL_REQUEST §R1 | 5 | 5 | ✓ | ✓ |
| F2 | Permanent Leaflet map integration & resize | ORIGINAL_REQUEST §R1, AC | 5 | 5 | ✓ | ✓ |
| F3 | Dual-layer glassmorphism (`backdrop-filter`) | ORIGINAL_REQUEST §R2 | 5 | 5 | ✓ | ✓ |
| F4 | 1080p & LED wall responsive scaling (no h-scroll) | ORIGINAL_REQUEST §R1, §R2, AC | 5 | 5 | ✓ | ✓ |
| F5 | All 69 DOM IDs & Chart canvas preserved | ORIGINAL_REQUEST §R3, AC | 5 | 5 | ✓ | ✓ |
| F6 | "Print" button remains removed | ORIGINAL_REQUEST AC | 5 | 5 | ✓ | ✓ |

## Test Architecture
- **Automated Validation Script**: Node.js DOM / CSS / ID analyzer verifying HTML file syntax, DOM element presence, CSS property constraints, Leaflet initialization script, and ID completeness.
- **Empirical Browser Verification**: Check rendering behavior, map tile loading, canvas dimensions, TomSelect positioning, and scroll synchronization.
- **Thresholds**:
  - Tier 1: 30+ checks covering features in isolation.
  - Tier 2: 30+ checks on boundary values, clamping, z-index layering, empty states.
  - Tier 3: Pairwise tests verifying map + sidebar interactions, chart resize + zoom resets.
  - Tier 4: Real-world executive dashboard scenario on 1080p and TV/LED wall viewing.
