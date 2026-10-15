const panel = document.getElementById('floodEventPanel');
let firestoreApi = null;
const firebaseConfig = {
  apiKey: 'AIzaSyAsvM0PXXWCjqGBiEdRiuBsCCiRbm_4gk',
  authDomain: 'tarlac-sitrep-backend-5000e.firebaseapp.com',
  projectId: 'tarlac-sitrep-backend-5000e',
  storageBucket: 'tarlac-sitrep-backend-5000e.firebasestorage.app',
  messagingSenderId: '575825350427',
  appId: '1:575825350427:web:d4e336b580e44a29900dbe'
};

const isExplorerView = document.body.classList.contains('flood-explorer-view');
if (panel && !isExplorerView) {
  const mapNode = document.getElementById('floodEventMap');
  const mapVisualization = mapNode?.parentElement;
  const chartControlNode = document.getElementById('floodMapChartControl');
  if (mapVisualization && chartControlNode) {
    mapVisualization.parentElement.parentElement.after(chartControlNode);
    requestAnimationFrame(() => window.floodAreaStatusChart?.resize());
  }
}

if (panel && isExplorerView) {
  const byId = (id) => document.getElementById(id);
  const mapNode = byId('floodEventMap');
  const state = {
    events: [],
    times: [],
    peakIndex: -1,
    peakFloodedCount: 0,
    selectedTime: null,
    map: null,
    barangayLayer: null,
    areaStates: new Map(),
    selectedBoundary: null,
    selectedPin: null,
    selectedPinTimer: null,
    boundaries: new Map(),
    selectedEventId: 'flood-annex-event-2026',
    eventMeta: new Map(),
    localEvent: null,
    db: null,
    unsubscribeEvents: null,
    playTimer: null
  };

  const colors = {
    Flooded: '#d93025',
    Receding: '#f9ab00',
    Subsided: '#34a853',
    Mixed: '#778395',
    Review: '#8a94a6',
    None: '#dbe2ea'
  };
  const depthPalettes = {
    Flooded: ['#58252A', '#D94B53'],
    Receding: ['#51401F', '#D89B35'],
    Subsided: ['#214633', '#43A56D'],
    Mixed: ['#303844', '#77869A'],
    Review: ['#303844', '#77869A']
  };

  function depthFeet(raw) {
    const value = String(raw ?? '').trim();
    const numbers = [...value.matchAll(/\d+(?:\.\d+)?/g)].map((match) => Number(match[0]));
    if (!numbers.length) return null;
    let feet = numbers.reduce((sum, number) => sum + number, 0) / numbers.length;
    if (/\b(in|inch|inches)\b/i.test(value)) feet /= 12;
    else if (/\b(cm|centimeter|centimeters)\b/i.test(value)) feet /= 30.48;
    else if (/\b(m|meter|meters)\b/i.test(value) && !/\bft\b/i.test(value)) feet *= 3.28084;
    if (/^\s*</.test(value)) feet /= 2;
    return Number.isFinite(feet) ? feet : null;
  }

  function depthShade(status, areas) {
    const values = (areas || []).map((area) => depthFeet(area.depthRaw)).filter((value) => value !== null);
    const deepest = values.length ? Math.max(...values) : null;
    const ratio = deepest === null ? 0.08 : Math.max(0, Math.min(1, deepest / 6));
    const [low, high] = depthPalettes[status] || depthPalettes.Review;
    const rgb = (hex) => hex.match(/[0-9a-f]{2}/gi).map((part) => parseInt(part, 16));
    const from = rgb(low), to = rgb(high);
    const color = from.map((channel, index) => Math.round(channel + (to[index] - channel) * ratio));
    return { color: `rgb(${color.join(',')})`, deepest };
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, (char) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    })[char]);
  }

  function boundaryKey(municipality, barangay) {
    const normalize = (value) => String(value || '')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .toLowerCase().replace(/[^a-z0-9]/g, '');
    return `${normalize(municipality)}::${normalize(barangay)}`;
  }

  function formatTime(iso) {
    if (!iso) return 'Time not resolved';
    return new Intl.DateTimeFormat('en-PH', {
      timeZone: 'Asia/Manila', dateStyle: 'medium', timeStyle: 'short'
    }).format(new Date(iso)) + ' PHT';
  }

  function latestAreaStates(iso) {
    const cutoff = Date.parse(iso);
    const selected = new Map();
    state.events.forEach((event) => {
      const time = Date.parse(event.at);
      if (!Number.isFinite(time) || time > cutoff) return;
      const previous = selected.get(event.areaKey);
      if (!previous || time > Date.parse(previous.at)) {
        selected.set(event.areaKey, { ...event });
      } else if (time === Date.parse(previous.at) && event.status !== previous.status) {
        if (event.recordId === previous.recordId && event.eventType === 'status-observation' && previous.eventType === 'initial-observation') {
          selected.set(event.areaKey, { ...event });
        } else if (!(event.recordId === previous.recordId && event.eventType === 'initial-observation' && previous.eventType === 'status-observation')) {
          selected.set(event.areaKey, { ...previous, status: 'Review', conflictingAt: event.at });
        }
      }
    });
    return selected;
  }

  function indexAreasByBoundary(areaStates) {
    const grouped = new Map();
    areaStates.forEach((area) => {
      if (!area.barangayBoundaryName) return;
      const key = boundaryKey(area.municipality, area.barangayBoundaryName);
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push(area);
    });
    return grouped;
  }

  function statusForAreas(areas) {
    if (!areas?.length) return 'None';
    const statuses = new Set(areas.map((area) => area.status || 'Review'));
    if (statuses.size > 1) return 'Mixed';
    return statuses.values().next().value;
  }

  function featureStyle(feature, groupedAreas) {
    const props = feature.properties || {};
    const key = boundaryKey(props.Mun_Name, props.Brgy_Name);
    const areas = groupedAreas.get(key) || [];
    const status = statusForAreas(areas);
    const shade = depthShade(status, areas);
    return {
      color: status === 'None' ? '#718096' : shade.color,
      weight: status === 'None' ? 0.8 : 1.5,
      opacity: 0.92,
      fillColor: status === 'None' ? '#222a35' : shade.color,
      fillOpacity: status === 'None' ? 0.92 : (status === 'Subsided' ? 0.78 : 0.9),
      dashArray: status === 'Mixed' || status === 'Review' ? '4 3' : null
    };
  }

  function applyBoundaryStyle(layer, groupedAreas = indexAreasByBoundary(state.areaStates)) {
    layer.setStyle(featureStyle(layer.feature, groupedAreas));
    const props = layer.feature?.properties || {};
    const key = boundaryKey(props.Mun_Name, props.Brgy_Name);
    const isSelected = state.selectedBoundary
      && boundaryKey(state.selectedBoundary.municipality, state.selectedBoundary.barangay) === key;
    if (isSelected) {
      layer.setStyle({ color: '#6ED7FF', weight: 3, opacity: 1, fillOpacity: 0.96 });
      layer.bringToFront?.();
    }
  }

  function selectBoundary(layer, directoryContent = null) {
    const props = layer.feature?.properties || {};
    state.selectedBoundary = { municipality: props.Mun_Name || '', barangay: props.Brgy_Name || '' };
    byId('floodExplorerMapReset')?.removeAttribute('hidden');
    state.barangayLayer?.eachLayer((candidate) => applyBoundaryStyle(candidate));
    renderAreaDirectory();
    directoryContent?.scrollTo({ top: 0, behavior: 'smooth' });

    const bounds = layer.getBounds?.();
    if (!bounds?.isValid()) return;
    state.map.flyToBounds(bounds, { maxZoom: 13, padding: [100, 90], duration: 0.8 });
    if (state.selectedPin) state.map.removeLayer(state.selectedPin);
    if (state.selectedPinTimer) clearTimeout(state.selectedPinTimer);
    const label = `${props.Brgy_Name || 'Barangay'}, ${props.Mun_Name || ''}`;
    const icon = window.L.divIcon({
      className: 'flood-selected-pin',
      html: '<span class="flood-selected-pin-pulse"><i class="fa-solid fa-location-dot" aria-hidden="true"></i></span>',
      iconSize: [34, 38],
      iconAnchor: [17, 34]
    });
    state.selectedPin = window.L.marker(bounds.getCenter(), { icon, keyboard: false, interactive: false, zIndexOffset: 1200 })
      .addTo(state.map)
      .bindTooltip(escapeHtml(label), { direction: 'top', offset: [0, -30], className: 'flood-event-tooltip flood-selected-pin-label', permanent: true });
    state.selectedPinTimer = setTimeout(() => {
      if (state.selectedPin) state.map.removeLayer(state.selectedPin);
      state.selectedPin = null;
      state.selectedPinTimer = null;
    }, 2400);
  }

  function featureLabel(feature, areas) {
    const props = feature.properties || {};
    const status = statusForAreas(areas);
    const partialCount = (areas || []).filter((area) => area.boundaryScope === 'partial-area-represented-by-barangay').length;
    const statusText = status === 'None' ? 'No report by selected time' : status;
    const extentText = partialCount ? `<br>${partialCount} report area(s) refer to a portion or purok` : '';
    const depthText = (areas || []).map((area) => area.depthRaw).filter((value) => value && depthFeet(value) !== null);
    const depthSummary = depthText.length ? `<br>Reported depth: ${escapeHtml([...new Set(depthText)].join(' · '))}` : '<br>Depth: not reported';
    return `<strong>${escapeHtml(props.Brgy_Name || 'Barangay')}</strong><br>${escapeHtml(props.Mun_Name || '')}<br>${escapeHtml(statusText)} · ${(areas || []).length} recorded area(s)${depthSummary}${extentText}`;
  }

  function renderCounts(areas) {
    const counts = { Flooded: 0, Receding: 0, Subsided: 0, Review: 0 };
    areas.forEach((area) => {
      if (Object.hasOwn(counts, area.status)) counts[area.status] += 1;
      else counts.Review += 1;
    });
    byId('floodEventCounts').innerHTML = Object.entries(counts).map(([name, count]) =>
      `<span class="flood-event-count"><i class="flood-event-dot" style="background:${colors[name]}"></i>${escapeHtml(name)} <strong>${count}</strong></span>`
    ).join('');
  }

  function refreshFloodChart() {
    const chart = window.floodAreaStatusChart;
    if (!chart) return;
    if (isExplorerView) {
      chart.options.color = '#c7d0dc';
      Object.values(chart.options.scales || {}).forEach((scale) => {
        scale.ticks = { ...scale.ticks, color: '#aeb9c8' };
        scale.grid = { ...scale.grid, color: 'rgba(150, 164, 182, 0.16)' };
      });
    }
    const municipalities = new Set([...state.areaStates.values()].map((area) => area.municipality).filter(Boolean));
    window.syncFloodChartMunicipalities?.(municipalities);
    const filters = window.getFloodChartFilterValues?.() || { municipality: 'ALL', status: 'ALL' };
    const counts = new Map();
    state.areaStates.forEach((area) => {
      const municipality = area.municipality || 'Unknown';
      if (filters.municipality !== 'ALL' && filters.municipality !== municipality) return;
      const status = ['Flooded', 'Receding', 'Subsided'].includes(area.status) ? area.status : 'Review';
      if (!counts.has(municipality)) counts.set(municipality, { Flooded: 0, Receding: 0, Subsided: 0, Review: 0 });
      counts.get(municipality)[status] += 1;
    });
    const labels = [...counts.keys()].sort((a, b) => a.localeCompare(b));
    const statusRows = [
      ['Flooded', '#E05A62'], ['Receding', '#E5AA45'], ['Subsided', '#55B77D'], ['Review', '#8895A8']
    ].filter(([status]) => filters.status === 'ALL' || filters.status === status);
    chart.data.labels = labels;
    chart.data.datasets = statusRows.map(([status, color]) => ({ label: status, fullLabel: `${status} (recorded areas)`, data: labels.map((name) => counts.get(name)[status]), backgroundColor: color, borderRadius: 8 }));
    chart.update('none');
    const empty = byId('floodChart-empty');
    if (empty) empty.style.display = labels.length ? 'none' : 'flex';
  }
  window.refreshFloodEventChart = refreshFloodChart;
  window.floodEventMapControlsChart = true;

  function setTimeline(events, autoLatest = true) {
    state.events = (events || []).filter((event) => event.at && event.areaKey).sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
    state.times = [...new Set(state.events.map((event) => event.at))].sort((a, b) => Date.parse(a) - Date.parse(b));
    state.peakIndex = -1;
    state.peakFloodedCount = 0;
    state.times.forEach((time, index) => {
      const floodedCount = [...latestAreaStates(time).values()].filter((area) => area.status === 'Flooded').length;
      if (floodedCount > state.peakFloodedCount) {
        state.peakFloodedCount = floodedCount;
        state.peakIndex = index;
      }
    });
    renderPeakMarker();
    const slider = byId('floodEventTime');
    slider.max = String(Math.max(0, state.times.length - 1));
    slider.disabled = !state.times.length;
    byId('floodEventPlay').disabled = !state.times.length;
    if (!state.times.length) {
      state.selectedTime = null;
      state.areaStates = new Map();
      byId('floodEventTimeLabel').textContent = 'No flood observations for this event';
      stopPlayback();
      byId('floodEventCounts').innerHTML = '';
      byId('floodEventMapStatus').textContent = 'No flood observations have been recorded for this event yet.';
      state.barangayLayer?.eachLayer((layer) => { layer.setStyle(featureStyle(layer.feature, new Map())); layer.setTooltipContent(featureLabel(layer.feature, [])); });
      renderAreaDirectory();
      refreshFloodChart();
      return;
    }
    const latestIndex = state.times.length - 1;
    const currentIndex = state.times.indexOf(state.selectedTime);
    const index = autoLatest || currentIndex < 0 ? latestIndex : currentIndex;
    slider.value = String(index);
    renderAt(index);
  }

  function selectEvent(eventId, meta) {
    stopPlayback();
    state.selectedEventId = eventId;
    state.eventMeta = meta || state.eventMeta;
    const eventName = state.eventMeta.get(eventId)?.eventName || eventId;
    byId('floodEventSource').textContent = eventName;
    if (state.unsubscribeEvents) state.unsubscribeEvents();
    if (!firestoreApi || !state.db) {
      const isPrepared = eventId === state.localEvent.eventId;
      byId('floodEventSource').textContent = `${eventName} · ${isPrepared ? 'prepared local data' : 'live updates unavailable'}`;
      setTimeline(isPrepared ? state.localEvent.events : [], true);
      return;
    }
    const eventQuery = firestoreApi.query(firestoreApi.collection(state.db, 'flood_emergency_events'), firestoreApi.where('eventId', '==', eventId));
    state.unsubscribeEvents = firestoreApi.onSnapshot(eventQuery, (snapshot) => {
      const events = snapshot.docs.map((document) => document.data());
      if (events.length) {
        byId('floodEventSource').textContent = `${eventName} · live`;
        setTimeline(events, true);
      } else if (eventId === state.localEvent.eventId) {
        byId('floodEventSource').textContent = `${eventName} · prepared local data`;
        setTimeline(state.localEvent.events, true);
      } else {
        byId('floodEventSource').textContent = `${eventName} · waiting for first report`;
        setTimeline([], true);
      }
    }, (error) => {
      console.warn('Flood event listener failed.', error.code || error.message);
      byId('floodEventSource').textContent = `${eventName} · live updates unavailable`;
      if (eventId === state.localEvent.eventId) setTimeline(state.localEvent.events, true);
    });
  }

  function renderAreaDirectory() {
    const list = byId('floodExplorerAreaList');
    if (!list) return;
    const previousScrollTop = list.scrollTop;
    const search = String(byId('floodExplorerAreaSearch')?.value || '').trim().toLocaleLowerCase();
    const grouped = indexAreasByBoundary(state.areaStates);
    const rows = [...state.boundaries.entries()].map(([key, layer]) => {
      const props = layer.feature?.properties || {};
      const municipality = props.Mun_Name || '';
      const barangay = props.Brgy_Name || '';
      const areas = grouped.get(key) || [];
      const status = statusForAreas(areas);
      return { key, layer, municipality, barangay, areas, status, depth: depthShade(status, areas).deepest };
    }).filter((row) => `${row.barangay} ${row.municipality} ${row.status}`.toLocaleLowerCase().includes(search))
      .sort((a, b) => Number(!a.areas.length) - Number(!b.areas.length) || a.municipality.localeCompare(b.municipality) || a.barangay.localeCompare(b.barangay));
    list.innerHTML = rows.map((row) => {
      const selected = state.selectedBoundary && boundaryKey(state.selectedBoundary.municipality, state.selectedBoundary.barangay) === row.key;
      const depth = row.depth === null ? 'Depth not reported' : `${row.depth.toFixed(1)} ft deepest`;
      return `<button type="button" class="flood-explorer-area${selected ? ' is-selected' : ''}" data-boundary-key="${escapeHtml(row.key)}" aria-pressed="${selected ? 'true' : 'false'}">
        <span class="flood-explorer-area-dot" style="--area-status:${colors[row.status] || colors.None}"></span>
        <span class="flood-explorer-area-copy"><strong>${escapeHtml(row.barangay)}</strong><small>${escapeHtml(row.municipality)} · ${escapeHtml(depth)}</small></span>
        <span class="flood-explorer-area-status">${escapeHtml(row.status === 'None' ? 'No report' : row.status)}</span>
      </button>`;
    }).join('');
    list.scrollTop = previousScrollTop;
    const count = byId('floodExplorerAreaCount');
    if (count) count.textContent = `${rows.length} barangay${rows.length === 1 ? '' : 's'}`;
  }

  function renderPeakMarker() {
    const marker = byId('floodEventPeakMarker');
    const label = byId('floodEventPeakLabel');
    if (!marker || !label) return;
    const percent = state.times.length > 1 && state.peakIndex >= 0
      ? (state.peakIndex / (state.times.length - 1)) * 100
      : 0;
    marker.style.left = `${percent}%`;
    const peakTime = state.peakIndex >= 0 ? state.times[state.peakIndex] : null;
    const description = peakTime
      ? `Peak flooded: ${state.peakFloodedCount} areas · ${formatTime(peakTime)}`
      : 'Peak flooded: no flooded areas recorded';
    marker.title = description;
    label.textContent = peakTime ? `Peak ${state.peakFloodedCount} · ${formatTime(peakTime)}` : 'No flood peak';
    label.title = description;
  }

  function renderAt(index) {
    const time = state.times[Math.max(0, Math.min(index, state.times.length - 1))];
    if (!time) return;
    state.selectedTime = time;
    byId('floodEventTime').value = String(index);
    byId('floodEventTimeLabel').textContent = formatTime(time);
    state.areaStates = latestAreaStates(time);
    renderCounts(state.areaStates);
    const grouped = indexAreasByBoundary(state.areaStates);
    state.barangayLayer?.eachLayer((layer) => {
      const props = layer.feature?.properties || {};
      const key = boundaryKey(props.Mun_Name, props.Brgy_Name);
      const areas = grouped.get(key) || [];
      applyBoundaryStyle(layer, grouped);
      layer.setTooltipContent(featureLabel(layer.feature, areas));
    });
    const unmapped = [...state.areaStates.values()].filter((area) => !area.barangayBoundaryName).length;
    byId('floodEventMapStatus').textContent = `${state.areaStates.size} recorded area(s) in timeline · ${unmapped} without a confident barangay boundary match`;
    renderAreaDirectory();
    refreshFloodChart();
  }

  function attachFeature(feature, layer) {
    const props = feature.properties || {};
    const municipality = props.Mun_Name || '';
    const barangay = props.Brgy_Name || '';
    const key = boundaryKey(municipality, barangay);
    state.boundaries.set(key, layer);
    layer.bindTooltip(featureLabel(feature, []), { sticky: true, className: 'flood-event-tooltip' });
    layer.on('click', () => selectBoundary(layer, document.querySelector('.flood-explorer-directory-content')));
  }

  async function initialize() {
    if (!window.L || !mapNode) throw new Error('The local map library is unavailable.');
    const [eventResponse, boundaryResponse] = await Promise.all([
      fetch('flood-annex-event-2026.json'),
      fetch('tarlac_brgy.geojson')
    ]);
    if (!eventResponse.ok || !boundaryResponse.ok) throw new Error('The staged flood event or local barangay boundaries could not be loaded.');
    const [stagedData, barangayData] = await Promise.all([eventResponse.json(), boundaryResponse.json()]);
    state.localEvent = stagedData;
    state.map = window.L.map(mapNode, { scrollWheelZoom: true, wheelDebounceTime: 60, wheelPxPerZoomLevel: 90, zoomControl: false, preferCanvas: true });
    window.L.control.zoom({ position: 'bottomright' }).addTo(state.map);
    const timelineControlNode = byId('floodMapTimelineControl');
    const eventSelector = byId('floodEventSelector');
    const eventLabel = eventSelector.previousElementSibling;
    const eventChooser = document.createElement('div');
    eventChooser.className = 'flood-event-chooser';
    eventChooser.append(eventLabel, eventSelector, byId('floodEventSource'));
    timelineControlNode.append(eventChooser);
    const timelineOverlay = window.L.control({ position: 'topright' });
    timelineOverlay.onAdd = () => timelineControlNode;
    timelineOverlay.addTo(state.map);
    window.L.DomEvent.disableClickPropagation(timelineControlNode);
    window.L.DomEvent.disableScrollPropagation(timelineControlNode);
    const chartControlNode = byId('floodMapChartControl');
    mapNode.parentElement.append(chartControlNode);
    window.L.DomEvent.disableClickPropagation(chartControlNode);
    window.L.DomEvent.disableScrollPropagation(chartControlNode);
    const mapPanel = byId('floodEventPanel');
    const chartPanel = chartControlNode.querySelector('.flood-sitrep-chart-panel');
    const playbackControls = byId('floodEventControls');
    const playbackRow = playbackControls.querySelector('.flood-event-playback');
    playbackRow.append(byId('floodEventTimeLabel'));
    const timelineSlider = byId('floodEventTime');
    const sliderWrap = document.createElement('div');
    sliderWrap.className = 'flood-event-range-wrap';
    timelineSlider.parentNode.insertBefore(sliderWrap, timelineSlider);
    sliderWrap.append(timelineSlider);
    const peakMarker = document.createElement('span');
    peakMarker.className = 'flood-event-peak-marker';
    peakMarker.id = 'floodEventPeakMarker';
    peakMarker.setAttribute('aria-hidden', 'true');
    sliderWrap.append(peakMarker);
    const peakLabel = document.createElement('span');
    peakLabel.className = 'flood-event-peak-label';
    peakLabel.id = 'floodEventPeakLabel';
    playbackRow.prepend(peakLabel);
    const timelineStrip = document.createElement('div');
    timelineStrip.className = 'flood-chart-timeline-strip';
    timelineStrip.append(byId('floodMapChartToggle'), byId('floodEventCounts'), playbackControls);
    const chartHeaderControls = chartPanel.querySelector('.ph .pc');
    const chartZoomHint = chartHeaderControls.querySelector('.hint');
    chartHeaderControls.insertBefore(timelineStrip, chartZoomHint || null);
    chartPanel.prepend(timelineStrip);
    chartPanel.querySelector('.ph')?.remove();
    mapPanel.querySelector('.flood-event-legend')?.remove();
    const directoryControl = document.createElement('div');
    directoryControl.className = 'flood-explorer-directory leaflet-control';
    directoryControl.innerHTML = '<div class="flood-explorer-directory-head"><div><strong>Flood situation</strong><small id="floodExplorerAreaCount">0 barangays</small></div><button type="button" id="floodExplorerMapReset" class="flood-explorer-map-reset" aria-label="Reset map view" title="Reset map view" hidden><i class="fa-solid fa-rotate-left" aria-hidden="true"></i><span>Reset map</span></button></div><div class="flood-explorer-directory-content"><label class="flood-explorer-search"><i class="fa-solid fa-magnifying-glass" aria-hidden="true"></i><input id="floodExplorerAreaSearch" type="search" placeholder="Search barangay or municipality" aria-label="Search barangay or municipality"></label><div class="flood-explorer-directory-detail"></div><div id="floodExplorerAreaList" class="flood-explorer-area-list"></div></div></div>';
    const directoryContent = directoryControl.querySelector('.flood-explorer-directory-content');
    const directoryDetail = directoryControl.querySelector('.flood-explorer-directory-detail');
    byId('floodEventDetail')?.remove();
    directoryContent.insertBefore(byId('floodEventMapStatus'), directoryDetail);
    directoryContent.insertBefore(mapPanel.querySelector('.flood-event-depth-key'), directoryDetail);
    const directoryOverlay = window.L.control({ position: 'topleft' });
    directoryOverlay.onAdd = () => directoryControl;
    directoryOverlay.addTo(state.map);
    window.L.DomEvent.disableClickPropagation(directoryControl);
    window.L.DomEvent.disableScrollPropagation(directoryControl);
    byId('floodExplorerAreaSearch').addEventListener('input', renderAreaDirectory);
    byId('floodExplorerMapReset').addEventListener('click', () => {
      state.selectedBoundary = null;
      if (state.selectedPinTimer) clearTimeout(state.selectedPinTimer);
      state.selectedPinTimer = null;
      if (state.selectedPin) state.map.removeLayer(state.selectedPin);
      state.selectedPin = null;
      state.barangayLayer?.eachLayer((layer) => applyBoundaryStyle(layer));
      renderAreaDirectory();
      byId('floodExplorerMapReset').setAttribute('hidden', '');
      const bounds = state.barangayLayer?.getBounds();
      if (bounds?.isValid()) state.map.fitBounds(bounds, { padding: [38, 38], maxZoom: 10, animate: true });
    });
    directoryControl.querySelector('.flood-explorer-area-list').addEventListener('click', (event) => {
      const button = event.target.closest('.flood-explorer-area');
      if (!button) return;
      const layer = state.boundaries.get(button.dataset.boundaryKey);
      if (!layer) return;
      selectBoundary(layer, directoryContent);
    });
    const chartToggle = byId('floodMapChartToggle');
    chartToggle?.addEventListener('click', () => {
      const collapsed = chartControlNode.classList.toggle('is-collapsed');
      chartToggle.setAttribute('aria-expanded', String(!collapsed));
      chartToggle.setAttribute('aria-label', collapsed ? 'Expand flood chart' : 'Minimize flood chart');
      chartToggle.innerHTML = collapsed
        ? '<i class="fa-solid fa-chevron-up"></i>'
        : '<i class="fa-solid fa-chevron-down"></i>';
      chartToggle.title = collapsed ? 'Expand flood chart' : 'Minimize flood chart';
      requestAnimationFrame(() => { state.map?.invalidateSize({ pan: false }); window.floodAreaStatusChart?.resize(); });
    });
    requestAnimationFrame(() => { state.map.invalidateSize({ pan: false }); window.floodAreaStatusChart?.resize(); });
    state.barangayLayer = window.L.geoJSON(barangayData, {
      style: (feature) => featureStyle(feature, new Map()),
      onEachFeature: attachFeature
    }).addTo(state.map);
    if (state.barangayLayer.getBounds().isValid()) state.map.fitBounds(state.barangayLayer.getBounds(), { padding: [38, 38], maxZoom: 10 });
    renderAreaDirectory();

    try {
      const [appSdk, firestoreSdk] = await Promise.all([
        import('https://www.gstatic.com/firebasejs/10.1.0/firebase-app.js'),
        import('https://www.gstatic.com/firebasejs/10.1.0/firebase-firestore.js')
      ]);
      firestoreApi = { ...firestoreSdk, initializeApp: appSdk.initializeApp };
      state.db = firestoreApi.getFirestore(firestoreApi.initializeApp(firebaseConfig, 'FloodAnnexEventMap'));
    } catch (error) {
      console.warn('Flood map live updates unavailable; showing prepared local event data.', error);
    }

    const selector = byId('floodEventSelector');
    selector.addEventListener('change', () => selectEvent(selector.value));
    const slider = byId('floodEventTime');
    slider.disabled = true;
    byId('floodEventPlay').disabled = true;
    selector.value = stagedData.eventId;
    selectEvent(stagedData.eventId);
    if (firestoreApi) {
      firestoreApi.onSnapshot(firestoreApi.collection(state.db, 'flood_event_registry'), (snapshot) => {
        const eventMeta = new Map([[stagedData.eventId, { eventId: stagedData.eventId, eventName: stagedData.eventName }]]);
        snapshot.docs.forEach((document) => {
          const data = document.data();
          if (data.eventId) eventMeta.set(data.eventId, data);
        });
        const selected = selector.value;
        selector.innerHTML = [...eventMeta.values()].sort((a, b) => String(a.eventName).localeCompare(String(b.eventName))).map((event) =>
          `<option value="${escapeHtml(event.eventId)}">${escapeHtml(event.eventName || event.eventId)}</option>`
        ).join('');
        selector.value = eventMeta.has(selected) ? selected : stagedData.eventId;
        selectEvent(selector.value, eventMeta);
      }, (error) => console.warn('Flood event registry unavailable; showing the prepared annex event only.', error.code || error.message));
    }
    slider.addEventListener('input', () => { stopPlayback(); renderAt(Number(slider.value)); });
    byId('floodEventPlay').addEventListener('click', () => state.playTimer ? stopPlayback() : startPlayback());
    byId('floodEventSpeed').addEventListener('change', () => { if (state.playTimer) { stopPlayback(); startPlayback(); } });
    window.addEventListener('resize', () => state.map?.invalidateSize({ pan: false }));
  }

  function stopPlayback() {
    if (state.playTimer) clearInterval(state.playTimer);
    state.playTimer = null;
    const button = byId('floodEventPlay');
    if (button) {
      button.setAttribute('aria-pressed', 'false');
      button.innerHTML = '<i class="fa-solid fa-play"></i> Play timeline';
    }
  }

  function startPlayback() {
    const slider = byId('floodEventTime');
    if (!state.times.length || slider.disabled) return;
    if (Number(slider.value) >= state.times.length - 1) slider.value = '0';
    const step = () => {
      const next = Number(slider.value) + 1;
      if (next >= state.times.length) { stopPlayback(); return; }
      slider.value = String(next);
      renderAt(next);
    };
    const button = byId('floodEventPlay');
    button.setAttribute('aria-pressed', 'true');
    button.innerHTML = '<i class="fa-solid fa-pause"></i> Pause timeline';
    state.playTimer = setInterval(step, Number(byId('floodEventSpeed').value) || 900);
  }

  initialize().catch((error) => {
    byId('floodEventMapStatus').textContent = 'Emergency annex map unavailable';
    byId('floodEventMap').innerHTML = `<div class="flood-event-error">${escapeHtml(error.message)}</div>`;
  });
}
