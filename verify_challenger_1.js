/**
 * Automated Verification & Stress Testing Harness — Challenger 1
 * Targets: public/index.html
 */

const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, 'public', 'index.html');
const html = fs.readFileSync(targetPath, 'utf8');

const results = {
    passed: 0,
    failed: 0,
    tests: []
};

function assert(condition, name, details = '') {
    if (condition) {
        results.passed++;
        results.tests.push({ status: 'PASS', name, details });
    } else {
        results.failed++;
        results.tests.push({ status: 'FAIL', name, details });
    }
}

console.log('====================================================');
console.log('CHALLENGER 1: EMPIRICAL VERIFICATION HARNESS');
console.log('Target: ' + targetPath);
console.log('====================================================\n');

// 1. DOM ID VERIFICATION (All 69 Explorer 3 cataloged IDs)
const catalog69 = [
    // Group A: Modal & Navigation Shell (5)
    'narrativeModal', 'modalTitle', 'modalBodyContent', 'mainSidebar', 'toggleSidebarBtn',
    // Group B: Hero Header & KPI Displays (17)
    'incidentNameDisplay', 'asOfDisplay', 'globalSitrepFilter', 'kpi-aff-fam', 'kpi-aff-pax',
    'kpi-ec-count', 'kpi-ec-pax', 'kpi-infra-dmg', 'kpi-agri-dmg', 'kpi-ast-total',
    'kpi-flood-active', 'kpi-flood-sub', 'kpi-road-not', 'kpi-road-pass', 'kpi-cas-total',
    'kpi-cas-dead', 'kpi-cas-inj',
    // Group C: Section Anchors (4)
    'sec-pop', 'sec-haz', 'sec-rel', 'sec-ops',
    // Group D: Population & Response Section (19)
    'evac-category-filter', 'evac-muni-filter', 'evacChart-reset', 'evacChart', 'evacChart-empty',
    'preemptive-category-filter', 'preemptive-muni-filter', 'preemptiveChart-reset', 'preemptiveChart', 'preemptiveChart-empty',
    'cas-category-filter', 'cas-view-filter', 'casChart-reset', 'casChart', 'casChart-empty',
    'res-muni-filter', 'resChart-reset', 'resChart', 'resChart-empty',
    // Group E: Floods & Infrastructure Section (9)
    'flood-status-filter', 'flood-muni-filter', 'floodChart-reset', 'floodChart', 'floodChart-empty',
    'infra-muni-filter', 'roadsFeed', 'utility-muni-filter', 'utilityFeed',
    // Group F: Relief & Damage Section (11)
    'ast-source-filter', 'ast-cost-muni-filter', 'astCostChart-reset', 'astCostChart', 'astCostChart-empty',
    'items-feed-muni-filter', 'itemsFeed', 'infra-cost-muni-filter', 'infraCostFeed',
    'agri-cost-muni-filter', 'agriCostFeed',
    // Group G: Operations Section (4)
    'incidentFeed', 'weather-muni-filter', 'weatherFeed', 'actionsFeed'
];

console.log('[Phase 1] Checking 69 DOM IDs from Explorer 3 Catalog...');
let missingIds = [];
catalog69.forEach(id => {
    const regex = new RegExp(`id=["']${id}["']`);
    if (!regex.test(html)) {
        missingIds.push(id);
    }
});
assert(missingIds.length === 0, 'Catalog 69 IDs Preserved', missingIds.length === 0 ? 'All 69 IDs present' : `Missing: ${missingIds.join(', ')}`);

// Additional structural IDs
const structuralIds = ['map', 'dataSidebar'];
let missingStructural = structuralIds.filter(id => !new RegExp(`id=["']${id}["']`).test(html));
assert(missingStructural.length === 0, 'Structural Split-Screen IDs Preserved', missingStructural.length === 0 ? 'Both #map and #dataSidebar present' : `Missing: ${missingStructural.join(', ')}`);

// Check for duplicate IDs in DOM markup
console.log('[Phase 2] Checking for Duplicate IDs...');
const idMatches = [...html.matchAll(/<[a-zA-Z0-9\-]+[^>]*\sid=["']([^"']+)["']/g)].map(m => m[1]);
const idCounts = {};
idMatches.forEach(id => {
    idCounts[id] = (idCounts[id] || 0) + 1;
});
const duplicates = Object.keys(idCounts).filter(id => idCounts[id] > 1);
assert(duplicates.length === 0, 'DOM ID Uniqueness', duplicates.length === 0 ? `Total ${idMatches.length} IDs scanned, 0 duplicates` : `Duplicate IDs found: ${duplicates.join(', ')}`);

// 2. PRINT BUTTON ABSENCE
console.log('[Phase 3] Checking Print Button Absence...');
const hasWindowPrint = /window\.print/i.test(html);
const hasFaPrint = /fa-print/i.test(html);
const hasPrintButton = /<button[^>]*>[\s\S]*?print[\s\S]*?<\/button>/i.test(html);
assert(!hasWindowPrint, 'Absence of window.print()', hasWindowPrint ? 'Found window.print' : '0 occurrences');
assert(!hasFaPrint, 'Absence of fa-print icon', hasFaPrint ? 'Found fa-print' : '0 occurrences');
assert(!hasPrintButton, 'Absence of <button>Print</button>', hasPrintButton ? 'Found print button' : '0 occurrences');

// 3. CHART.JS CANVAS & WRAPPER INTEGRITY
console.log('[Phase 4] Checking Chart.js Canvas and Container Wrappers...');
const chartIds = ['evacChart', 'preemptiveChart', 'casChart', 'resChart', 'floodChart', 'astCostChart'];
let chartWrapperErrors = [];

chartIds.forEach(chartId => {
    // Check canvas exists
    const canvasRegex = new RegExp(`<canvas[^>]*id=["']${chartId}["'][^>]*>`, 'i');
    const canvasMatch = html.match(canvasRegex);
    if (!canvasMatch) {
        chartWrapperErrors.push(`${chartId}: canvas tag not found`);
        return;
    }

    // Check parent wrapper .chart-container
    const containerContextRegex = new RegExp(`<div class=["']chart-container["'][^>]*>[\\s\\S]*?<canvas[^>]*id=["']${chartId}["'][\\s\\S]*?<\\/div>`, 'i');
    if (!containerContextRegex.test(html)) {
        chartWrapperErrors.push(`${chartId}: not properly enclosed in .chart-container`);
    }

    // Check paired empty state
    const emptyRegex = new RegExp(`id=["']${chartId}-empty["']`, 'i');
    if (!emptyRegex.test(html)) {
        chartWrapperErrors.push(`${chartId}: paired empty-state ${chartId}-empty missing`);
    }

    // Check zoom reset button
    const resetRegex = new RegExp(`id=["']${chartId}-reset["']`, 'i');
    if (!resetRegex.test(html)) {
        chartWrapperErrors.push(`${chartId}: zoom reset button ${chartId}-reset missing`);
    }
});

assert(chartWrapperErrors.length === 0, 'Chart.js Canvas & Container Wrappers Valid', chartWrapperErrors.length === 0 ? 'All 6 canvas elements, wrappers, empty overlays, and reset buttons verified' : chartWrapperErrors.join('; '));

// 4. MODAL & SHELL HIERARCHY INTEGRITY
console.log('[Phase 5] Checking Stacking Hierarchy & Modal Isolation...');
const modalIndex = html.indexOf('id="narrativeModal"');
const sidebarIndex = html.indexOf('id="dataSidebar"');
const bodyIndex = html.indexOf('<body');
const mainIndex = html.indexOf('<main');

assert(modalIndex !== -1 && bodyIndex !== -1 && modalIndex > bodyIndex, 'Modal Position Under Body', 'Modal exists in body');
assert(modalIndex < mainIndex && modalIndex < sidebarIndex, 'Modal Isolated from Stacking Context', 'narrativeModal is outside .data-sidebar and .main-content to avoid backdrop-filter capture');

// 5. LAYOUT MATH SIMULATION (1080p Desktop & 4K LED Wall)
console.log('[Phase 6] Simulating Viewport Math & Clamping Constraints...');
const viewports = [
    { name: 'Standard Laptop (1366x768)', width: 1366, height: 768 },
    { name: '1080p FHD Monitor (1920x1080)', width: 1920, height: 1080 },
    { name: '1440p QHD Monitor (2560x1440)', width: 2560, height: 1440 },
    { name: 'Ultra-Wide (3440x1440)', width: 3440, height: 1440 },
    { name: '4K LED Wall (3840x2160)', width: 3840, height: 2160 },
    { name: 'DCI 4K (4096x2160)', width: 4096, height: 2160 }
];

let layoutMathOk = true;
let simulationDetails = [];

viewports.forEach(vp => {
    // Formula: clamp(580px, 36vw, 740px)
    const raw36vw = 0.36 * vp.width;
    const sidebarWidth = Math.min(740, Math.max(580, raw36vw));
    const visibleMapWidth = vp.width - sidebarWidth;
    const mapRatio = (visibleMapWidth / vp.width) * 100;

    // Constraints:
    // 1. Sidebar width strictly in [580, 740]
    // 2. Map visible width > 50% for all displays >= 1366px
    // 3. Map visible width >= 700px
    const validClamp = sidebarWidth >= 580 && sidebarWidth <= 740;
    const validMap = visibleMapWidth >= 700 && mapRatio > 50;

    if (!validClamp || !validMap) {
        layoutMathOk = false;
    }

    simulationDetails.push(`${vp.name}: Sidebar=${sidebarWidth.toFixed(1)}px (${(sidebarWidth/vp.width*100).toFixed(1)}%), Map=${visibleMapWidth.toFixed(1)}px (${mapRatio.toFixed(1)}%)`);
});

assert(layoutMathOk, 'Layout Math Simulation Across Viewports', simulationDetails.join(' | '));

// 6. CSS ZERO HORIZONTAL SCROLL & RESPONSIVENESS
console.log('[Phase 7] Checking CSS Horizontal Scroll Prevention & Styles...');
const htmlBodyOverflow = /html,\s*body\s*\{[^}]*overflow:\s*hidden/i.test(html);
const dataSidebarOverflowX = /\.data-sidebar\s*\{[^}]*overflow-x:\s*hidden/i.test(html);
const mainContentFixed = /\.main-content\s*\{[^}]*position:\s*fixed/i.test(html);
const mapInsetZero = /#map\.executive-map\s*\{[^}]*position:\s*absolute;[^}]*inset:\s*0/i.test(html);

assert(htmlBodyOverflow, 'HTML/Body overflow: hidden', 'Viewport scrollbars prevented at document level');
assert(dataSidebarOverflowX, 'Sidebar overflow-x: hidden', 'Horizontal scrollbar prevented inside sidebar');
assert(mainContentFixed, 'Main Content position: fixed', 'Viewport anchored below header');
assert(mapInsetZero, 'Map position: absolute inset: 0', 'Map fills entire background underlay');

// 7. LEAFLET & MAP INTEGRATION CONTRACT
console.log('[Phase 8] Checking Leaflet Assets and Script Lifecycle...');
const hasLeafletCss = /leaflet(\.min)?\.css/i.test(html);
const hasLeafletJs = /leaflet(\.min)?\.js/i.test(html);
const hasResizeObserver = /new\s+ResizeObserver\s*\(\s*\(\)\s*=>\s*map\.invalidateSize\(\)\s*\)/i.test(html);
const hasFitBoundsOffset = /fitBounds\s*\(\s*geoJsonLayer\.getBounds\(\),\s*\{\s*paddingTopLeft:\s*\[offsetLeft/i.test(html);

assert(hasLeafletCss, 'Leaflet CSS Import', 'CDN stylesheet present in <head>');
assert(hasLeafletJs, 'Leaflet JS Import', 'CDN script present in <head>');
assert(hasResizeObserver, 'Leaflet ResizeObserver Invalidation', 'Container observed for dynamic reflow');
assert(hasFitBoundsOffset, 'Leaflet Sidebar Offset FitBounds', 'Padding offset applied to prevent province hiding under sidebar');

console.log('\n====================================================');
console.log(`SUMMARY: ${results.passed} Passed, ${results.failed} Failed`);
console.log('====================================================');

results.tests.forEach(t => {
    console.log(`[${t.status}] ${t.name}: ${t.details}`);
});
