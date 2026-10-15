/**
 * Automated Verification Harness: Leaflet Map & Interactive Behavior
 * Challenger 2 (Map Integration & Interactive Behavior Stress Testing)
 * 
 * Verifies:
 * 1. Leaflet CDN links (CSS & JS)
 * 2. #map DOM placement and CSS positioning (inset: 0, z-index: 1)
 * 3. Stacking context hierarchy (#map < #dataSidebar < #mainSidebar < .ts-dropdown < .modal-overlay)
 * 4. Tarlac_mun.geojson schema, 18 municipalities, Mun_Name keys
 * 5. Leaflet initialization logic (center, zoom, tiles, fetch, error handling, ResizeObserver, invalidateSize)
 * 6. IntersectionObserver scroll spy root scoping to #dataSidebar and variable name collision avoidance
 */

const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const htmlPath = path.join(projectRoot, 'public', 'index.html');
const geojsonPath = path.join(projectRoot, 'public', 'Tarlac_mun.geojson');

const results = {
    total: 0,
    passed: 0,
    failed: 0,
    failures: []
};

function assert(condition, testName, details = '') {
    results.total++;
    if (condition) {
        results.passed++;
        console.log(`  [PASS] ${testName}`);
    } else {
        results.failed++;
        results.failures.push({ testName, details });
        console.error(`  [FAIL] ${testName} - ${details}`);
    }
}

console.log('================================================================');
console.log('CHALLENGER 2: LEAFLET MAP & INTERACTION VERIFICATION HARNESS');
console.log('================================================================\n');

// 1. Files existence check
console.log('TEST SUITE 1: FILE EXISTENCE');
assert(fs.existsSync(htmlPath), 'index.html exists', `Path: ${htmlPath}`);
assert(fs.existsSync(geojsonPath), 'Tarlac_mun.geojson exists', `Path: ${geojsonPath}`);

const htmlContent = fs.readFileSync(htmlPath, 'utf8');

// 2. Leaflet CDN Links
console.log('\nTEST SUITE 2: LEAFLET CDN ASSETS');
const leafletCssMatch = htmlContent.match(/<link[^>]+href=["']([^"']*leaflet[^"']*\.css)["'][^>]*>/i);
const leafletJsMatch = htmlContent.match(/<script[^>]+src=["']([^"']*leaflet[^"']*\.js)["'][^>]*>/i);

assert(!!leafletCssMatch, 'Leaflet CSS link present in head', leafletCssMatch ? leafletCssMatch[0] : 'Not found');
if (leafletCssMatch) {
    assert(leafletCssMatch[1].includes('1.9.4'), 'Leaflet CSS version is 1.9.4', leafletCssMatch[1]);
}

assert(!!leafletJsMatch, 'Leaflet JS script present in head', leafletJsMatch ? leafletJsMatch[0] : 'Not found');
if (leafletJsMatch) {
    assert(leafletJsMatch[1].includes('1.9.4'), 'Leaflet JS version is 1.9.4', leafletJsMatch[1]);
}

// 3. DOM Structure & #map placement
console.log('\nTEST SUITE 3: DOM PLACEMENT & STRUCTURE');
assert(htmlContent.includes('<div id="map" class="executive-map"'), '#map container exists with class executive-map');
const mapIndex = htmlContent.indexOf('id="map"');
const mainIndex = htmlContent.indexOf('class="main-content"');
const sidebarIndex = htmlContent.indexOf('id="dataSidebar"');

assert(mainIndex !== -1 && mapIndex > mainIndex, '#map is placed inside .main-content', `main at ${mainIndex}, map at ${mapIndex}`);
assert(sidebarIndex !== -1 && mapIndex < sidebarIndex, '#map is mounted before #dataSidebar (underlay sibling structure)', `map at ${mapIndex}, sidebar at ${sidebarIndex}`);

// 4. CSS Positioning & Stacking Rules
console.log('\nTEST SUITE 4: CSS POSITIONING & STACKING HIERARCHY');
const mapCssRegex = /#map\.executive-map\s*\{([^}]+)\}/;
const mapCssMatch = htmlContent.match(mapCssRegex);
assert(!!mapCssMatch, 'CSS rule for #map.executive-map found');

if (mapCssMatch) {
    const rules = mapCssMatch[1];
    assert(rules.includes('position: absolute'), '#map position is absolute', rules);
    assert(rules.includes('inset: 0'), '#map inset is 0', rules);
    assert(rules.includes('z-index: 1'), '#map z-index is 1', rules);
    assert(rules.includes('width: 100%'), '#map width is 100%', rules);
    assert(rules.includes('height: 100%'), '#map height is 100%', rules);
}

const dataSidebarCssRegex = /\.data-sidebar\s*\{([^}]+)\}/;
const dataSidebarCssMatch = htmlContent.match(dataSidebarCssRegex);
assert(!!dataSidebarCssMatch, 'CSS rule for .data-sidebar found');
if (dataSidebarCssMatch) {
    const rules = dataSidebarCssMatch[1];
    assert(rules.includes('z-index: 10'), '.data-sidebar z-index is 10 (sits above map layer 1)', rules);
    assert(rules.includes('position: absolute'), '.data-sidebar position is absolute', rules);
    assert(rules.includes('overflow-y: auto'), '.data-sidebar has independent vertical scrolling', rules);
    assert(rules.includes('clamp(580px, 36vw, 740px)'), '.data-sidebar width clamped between 580px and 740px', rules);
}

const mainSidebarCssRegex = /\.sidebar#mainSidebar\s*\{([^}]+)\}/;
const mainSidebarCssMatch = htmlContent.match(mainSidebarCssRegex);
assert(!!mainSidebarCssMatch, 'CSS rule for .sidebar#mainSidebar found');
if (mainSidebarCssMatch) {
    const rules = mainSidebarCssMatch[1];
    assert(rules.includes('z-index: 100'), '#mainSidebar header z-index is 100 (pinned above sidebar & map)', rules);
}

const tsDropdownRegex = /\.ts-wrapper\s+\.ts-dropdown\s*\{([^}]+)\}/;
const tsDropdownMatch = htmlContent.match(tsDropdownRegex);
assert(!!tsDropdownMatch, 'CSS rule for .ts-wrapper .ts-dropdown found');
if (tsDropdownMatch) {
    const rules = tsDropdownMatch[1];
    assert(rules.includes('z-index: 1000 !important'), '.ts-dropdown has z-index: 1000 !important to escape overflow clipping', rules);
}

// 5. GeoJSON File Validation
console.log('\nTEST SUITE 5: GEOJSON FILE VALIDATION');
let geojson = null;
try {
    const rawGeo = fs.readFileSync(geojsonPath, 'utf8');
    geojson = JSON.parse(rawGeo);
    assert(true, 'Tarlac_mun.geojson is valid JSON');
} catch (e) {
    assert(false, 'Tarlac_mun.geojson is valid JSON', e.message);
}

if (geojson) {
    assert(geojson.type === 'FeatureCollection', 'GeoJSON type is FeatureCollection', geojson.type);
    assert(Array.isArray(geojson.features), 'GeoJSON features is an array');
    assert(geojson.features.length === 18, 'GeoJSON contains exactly 18 municipalities', `Actual: ${geojson.features.length}`);

    const expectedMunicipalities = [
        'Anao', 'Bamban', 'Camiling', 'Capas', 'Concepcion', 'Gerona',
        'La Paz', 'Mayantoc', 'Moncada', 'Paniqui', 'Pura', 'Ramos',
        'San Clemente', 'San Manuel', 'Santa Ignacia', 'City of Tarlac (Capital)',
        'Victoria', 'San Jose'
    ];

    const actualMunicipalities = geojson.features.map(f => f.properties && f.properties.Mun_Name);
    const allHaveMunName = geojson.features.every(f => f.properties && typeof f.properties.Mun_Name === 'string' && f.properties.Mun_Name.length > 0);
    assert(allHaveMunName, '100% of features possess non-empty Mun_Name property');

    const missingMunicipalities = expectedMunicipalities.filter(name => !actualMunicipalities.includes(name));
    assert(missingMunicipalities.length === 0, 'All 18 canonical Tarlac municipalities are present', `Missing: ${missingMunicipalities.join(', ')}`);

    const allHavePolygons = geojson.features.every(f => f.geometry && (f.geometry.type === 'MultiPolygon' || f.geometry.type === 'Polygon'));
    assert(allHavePolygons, 'All features have valid Polygon/MultiPolygon geometry');
}

// 6. Leaflet Initialization Script Audit
console.log('\nTEST SUITE 6: LEAFLET SCRIPT INITIALIZATION AUDIT');
assert(htmlContent.includes("document.addEventListener('DOMContentLoaded'"), 'Map initialization waits for DOMContentLoaded');
assert(htmlContent.includes("typeof L === 'undefined'"), 'Script guards against un-loaded Leaflet global (L)');
assert(htmlContent.includes("center: [15.482, 120.596]"), 'Map center configured to Tarlac Province coordinates [15.482, 120.596]');
assert(htmlContent.includes("zoom: 10"), 'Map initial zoom level set to 10');
assert(htmlContent.includes("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"), 'Map tile layer uses CartoDB Positron');
assert(htmlContent.includes("fetch('Tarlac_mun.geojson')"), 'Script fetches Tarlac_mun.geojson relative overlay');
assert(htmlContent.includes(".catch("), 'GeoJSON fetch includes error handling catch block');
assert(htmlContent.includes("fitMapBoundsWithOffset"), 'Script defines offset bounding helper to avoid sidebar occlusion');
assert(htmlContent.includes("paddingTopLeft: [offsetLeft + 30, 30]"), 'fitBounds includes left padding offset matching sidebar width');
assert(htmlContent.includes("map.invalidateSize()"), 'map.invalidateSize() is explicitly invoked');
assert(htmlContent.includes("ResizeObserver"), 'ResizeObserver implemented to track map element container resizes');
assert(htmlContent.includes("window.addEventListener('resize'"), 'Window resize event listener handles viewport dimensions');
assert(htmlContent.includes("className: 'leaflet-muni-tooltip'"), 'Interactive tooltip styled with leaflet-muni-tooltip class');
assert(htmlContent.includes("layer.on('mouseover'"), 'GeoJSON polygon mouseover interaction handler attached');
assert(htmlContent.includes("layer.on('mouseout'"), 'GeoJSON polygon mouseout interaction handler attached');

// 7. IntersectionObserver Scroll Spy Verification
console.log('\nTEST SUITE 7: INTERSECTION OBSERVER & SCROLL SPY');
assert(htmlContent.includes("new IntersectionObserver"), 'IntersectionObserver instance created');
assert(htmlContent.includes("root: dataSidebarEl"), 'IntersectionObserver root scoped to #dataSidebar scrolling container');
assert(htmlContent.includes("const jumpNavLinks"), 'Scroll spy links renamed to jumpNavLinks (avoiding collision with Leaflet L)');
assert(!htmlContent.includes("const L = [...document.querySelectorAll('.jump a')]"), 'Old variable name "const L" completely eliminated');
assert(htmlContent.includes("rootMargin: '-10% 0px -70% 0px'"), 'rootMargin configured appropriately for section tracking');

// Check that all jump tab hrefs correspond to existing sections
const jumpTabsMatch = [...htmlContent.matchAll(/<nav class="jump"[^>]*>([\s\S]*?)<\/nav>/g)];
if (jumpTabsMatch.length > 0) {
    const jumpNavHtml = jumpTabsMatch[0][1];
    const hrefs = [...jumpNavHtml.matchAll(/href="#([^"]+)"/g)].map(m => m[1]);
    assert(hrefs.length === 4, 'Found 4 section jump links in .jump nav', `Found: ${hrefs.length} (${hrefs.join(', ')})`);
    
    hrefs.forEach(id => {
        const hasSection = htmlContent.includes(`id="${id}"`);
        assert(hasSection, `Jump link #${id} has matching section element in DOM`);
    });
}

console.log('\n================================================================');
console.log(`TOTAL CHECKS: ${results.total}`);
console.log(`PASSED: ${results.passed}`);
console.log(`FAILED: ${results.failed}`);
console.log('================================================================');

if (results.failed === 0) {
    console.log('\nVERDICT: CONFIRM_CORRECTNESS');
    process.exit(0);
} else {
    console.error('\nVERDICT: REJECT');
    process.exit(1);
}
