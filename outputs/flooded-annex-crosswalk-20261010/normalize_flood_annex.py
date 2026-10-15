import csv
import json
import re
import unicodedata
from datetime import datetime, timezone, timedelta
from pathlib import Path


ROOT = Path(__file__).resolve().parent
SOURCE = ROOT / "ANNEX_Flooded_Area_Review.csv"
GEOJSON = Path(__file__).resolve().parents[2] / "public" / "tarlac_brgy.geojson"
OUTPUT = ROOT / "ANNEX_Flooded_Area_Event_Observations.json"
SUMMARY = ROOT / "ANNEX_Flooded_Area_Event_Exceptions.csv"
PH_TZ = timezone(timedelta(hours=8))
DEFAULT_YEAR = 2026
MONTHS = {
    "jan": 1, "january": 1, "feb": 2, "february": 2, "mar": 3,
    "march": 3, "apr": 4, "april": 4, "may": 5, "jun": 6,
    "june": 6, "jul": 7, "july": 7, "aug": 8, "august": 8,
    "sep": 9, "sept": 9, "september": 9, "oct": 10, "october": 10,
    "nov": 11, "november": 11, "dec": 12, "december": 12,
}
MANUAL_BOUNDARY_ALIASES = {
    ("Concepcion", "talimundocmarimla"): "Talimunduc Marimla",
    ("La Paz", "bantog"): "Bantog-Caricutan",
    ("La Paz", "guevara"): "Guevarra",
    ("Moncada", "camp1norte"): "Camposanto 1 - Norte",
    ("Paniqui", "pobnorte"): "Poblacion Norte",
    ("Paniqui", "pobsur"): "Poblacion Sur",
    ("Ramos", "pobsouth"): "Poblacion South",
}


def key(value):
    return re.sub(r"[^a-z0-9]", "", (value or "").lower())


def place_keys(value):
    text = (value or "").lower().replace("\u00c3\u00b1", "n")
    text = "".join(c for c in unicodedata.normalize("NFKD", text) if not unicodedata.combining(c))
    text = re.sub(r"\bsta\.?(?=\s|$)", "santa", text)
    text = re.sub(r"\bsto\.?(?=\s|$)", "santo", text)
    text = re.sub(r"\bbrgy\.?(?=\s|$)|\bbarangay\b|\bportion(?:s)?\b|\bpart(?:s)?\b|\bof\b", " ", text)
    text = re.sub(r"\b1st\b|\bfirst\b", "1", text)
    text = re.sub(r"\b2nd\b|\bsecond\b", "2", text)
    text = re.sub(r"\b3rd\b|\bthird\b", "3", text)
    text = re.sub(r"\b4th\b|\bfourth\b", "4", text)
    # Annex spellings often use Roman suffixes while the boundary file uses ordinals.
    text = re.sub(r"\biii\b", "3", text)
    text = re.sub(r"\bii\b", "2", text)
    text = re.sub(r"\bi\b", "1", text)
    return key(text)


def boundary_name_variants(value):
    text = (value or "").strip()
    variants = [text]
    variants.extend(re.findall(r"\(([^()]*)\)", text))
    variants.append(re.sub(r"\s*\([^()]*\)", "", text).strip())
    return {place_keys(item) for item in variants if place_keys(item)}


def parse_date(value):
    text = (value or "").replace("\n", " ").strip()
    if not text:
        return None
    iso = re.search(r"\b(20\d{2})[-/](\d{1,2})[-/](\d{1,2})\b", text)
    if iso:
        return int(iso.group(1)), int(iso.group(2)), int(iso.group(3))
    month_first = re.search(
        r"\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|"
        r"Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|Nov(?:ember)?|"
        r"Dec(?:ember)?)\.?\s*(\d{1,2})(?:st|nd|rd|th)?"
        r"(?:\s*[,/]?\s*(20\d{2}))?",
        text,
        re.IGNORECASE,
    )
    if month_first:
        month_name, day, year = month_first.groups()
        month = MONTHS.get(month_name.lower())
        if month:
            return int(year or DEFAULT_YEAR), month, int(day)
    day_first = re.search(
        r"\b(\d{1,2})[-/ ]+(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|"
        r"May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:t(?:ember)?)?|Oct(?:ober)?|"
        r"Nov(?:ember)?|Dec(?:ember)?)[.]?[-/ ]*(20\d{2})?\b",
        text,
        re.IGNORECASE,
    )
    if day_first:
        day, month_name, year = day_first.groups()
        month = MONTHS.get(month_name.lower())
        if month:
            return int(year or DEFAULT_YEAR), month, int(day)
    return None


def parse_clock(value):
    match = re.search(r"\b(\d{1,2})(?::(\d{2}))?\s*(AM|PM)\b", value or "", re.IGNORECASE)
    if not match:
        return None
    hour, minute, meridiem = match.groups()
    hour, minute = int(hour), int(minute or 0)
    if not 1 <= hour <= 12 or minute > 59:
        return None
    hour = hour % 12 + (12 if meridiem.upper() == "PM" else 0)
    return hour, minute


def iso_time(raw, default_date_raw=None, use_default_even_if_observed_has_time=False):
    date = parse_date(raw) or parse_date(default_date_raw)
    if not date:
        return None, "No parseable date"
    clock = None if use_default_even_if_observed_has_time else parse_clock(raw)
    fallback = clock is None
    hour, minute = clock or (18, 0)
    try:
        value = datetime(date[0], date[1], date[2], hour, minute, tzinfo=PH_TZ)
    except ValueError:
        return None, "Invalid calendar date"
    note = "6:00 PM Asia/Manila fallback" if fallback else "Parsed source time"
    return value.isoformat(), note


def status_label(text):
    value = (text or "").lower()
    if "subsided" in value:
        return "Subsided"
    if "reced" in value:
        return "Receding"
    if "flooded" in value:
        return "Flooded"
    return None


def parse_status_candidates(status_raw, observed_raw):
    """Resolve each status phrase independently; retain source order and dedupe repeats."""
    matches = list(re.finditer(r"(?i)\b(flooded|reced(?:ed|ing)|subsided)\b", status_raw or ""))
    candidates = []
    seen = set()
    for index, match in enumerate(matches):
        end = matches[index + 1].start() if index + 1 < len(matches) else len(status_raw)
        segment = status_raw[match.start():end].strip(" ;,|\n\t-")
        status = status_label(match.group(0))
        # A phrase without its own date uses the associated observation date at 6 PM.
        own_date = parse_date(segment)
        at, note = iso_time(segment, observed_raw)
        if at and not own_date:
            at, note = iso_time(observed_raw, use_default_even_if_observed_has_time=True)
        if not at:
            continue
        identity = (status, at)
        if identity in seen:
            continue
        seen.add(identity)
        candidates.append({"status": status, "at": at, "resolution": note, "sourceText": segment})
    return candidates


def main():
    with SOURCE.open(encoding="utf-8-sig", newline="") as stream:
        rows = list(csv.DictReader(stream))
    geometry = json.loads(GEOJSON.read_text(encoding="utf-8"))
    features = geometry.get("features", [])
    observations, excluded, exceptions, events = [], [], [], []
    for row in rows:
        status_raw = (row.get("Flood status / status time (Annex wording)") or "").strip()
        observed_raw = (row.get("Monitored or reported date/time (Annex wording)") or "").strip()
        location_raw = (row.get("Location / area (Annex wording)") or "").strip()
        record_id = row.get("Record ID", "")
        flags = []
        if not status_raw and not observed_raw:
            excluded.append({
                "recordId": record_id,
                "sourcePage": row.get("Annex PDF page"),
                "municipality": row.get("Municipality"),
                "locationRaw": location_raw,
                "observedAtRaw": observed_raw,
                "statusRaw": status_raw,
                "reason": "No reported status and no observation date/time; excluded from figures",
            })
            continue

        observed_at, observed_note = iso_time(observed_raw)
        if observed_raw and not observed_at:
            flags.append("Could not parse observation date/time: " + observed_note)
        status_count = len(re.findall(r"(?i)\b(?:flooded|reced(?:ed|ing)|subsided)\b", status_raw))
        status_candidates = parse_status_candidates(status_raw, observed_raw)
        normalized_status = None
        status_at = None
        status_note = None
        if status_raw:
            if status_count > 1:
                flags.append("Multiple status phrases in one source cell; each dated status is retained for review")
            if status_candidates:
                valid_candidates = []
                for candidate in status_candidates:
                    if observed_at and datetime.fromisoformat(candidate["at"]) < datetime.fromisoformat(observed_at):
                        flags.append("A dated status precedes the later monitored Flooded observation; retained as possible re-flood history")
                    valid_candidates.append(candidate)
                if valid_candidates:
                    latest = max(valid_candidates, key=lambda candidate: candidate["at"])
                    normalized_status, status_at, status_note = latest["status"], latest["at"], latest["resolution"]
                elif not status_candidates:
                    flags.append("Status date/time could not be resolved from the source")
            elif observed_at:
                flags.append("Status cell has no recognized status; using the dated flooded-area observation as Flooded")
                normalized_status = "Flooded"
                status_at = observed_at
                status_note = "Initial Flooded state inferred from dated flooded-area entry"
            else:
                flags.append("Status wording is not recognized")
        elif observed_at:
            # The annex is a list of flooded areas; a dated observation with depth is an initial flood observation.
            normalized_status = "Flooded"
            status_at = observed_at
            status_note = "Initial Flooded state inferred from dated flooded-area entry"

        # Match only when the annex municipality and a barangay name both agree.
        municipality_key = place_keys(row.get("Municipality"))
        location_key = place_keys(location_raw)
        candidates = []
        for feature in features:
            props = feature.get("properties") or {}
            if place_keys(props.get("Mun_Name")) != municipality_key:
                continue
            barangay_name = props.get("Brgy_Name") or ""
            for barangay_key in boundary_name_variants(barangay_name):
                if barangay_key and barangay_key in location_key:
                    candidates.append((len(barangay_key), barangay_name))
        boundary_name = None
        if candidates:
            longest = max(length for length, _ in candidates)
            matches = sorted({name for length, name in candidates if length == longest})
            if len(matches) == 1:
                boundary_name = matches[0]
            else:
                flags.append("Location matches multiple barangay boundaries")
        if not boundary_name:
            alias = MANUAL_BOUNDARY_ALIASES.get((row.get("Municipality", ""), location_key))
            if alias:
                boundary_name = alias
        if not boundary_name:
            flags.append("No confident barangay boundary match; keep location out of polygon counts")

        area_key = municipality_key + ":" + location_key
        partial_scope = bool(re.search(r"(?i)\b(?:portion|portions|part|parts|purok|sitio)\b", location_raw))
        if observed_at:
            events.append({
                "eventId": "flood-annex-event-2026",
                "areaKey": area_key,
                "at": observed_at,
                "status": "Flooded",
                "eventType": "initial-observation",
                "recordId": record_id,
                "sourcePage": row.get("Annex PDF page"),
                "municipality": row.get("Municipality"),
                "locationRaw": location_raw,
                "observedAtRaw": observed_raw,
                "statusRaw": status_raw,
                "barangayBoundaryName": boundary_name,
                "boundaryScope": "partial-area-represented-by-barangay" if partial_scope else "barangay-or-area-as-written",
                "depthRaw": row.get("Water depth (Annex wording)"),
                "reviewFlags": flags,
            })
        if status_candidates:
            for candidate in status_candidates:
                if candidate["status"] == "Flooded" and observed_at == candidate["at"]:
                    continue
                events.append({
                    "eventId": "flood-annex-event-2026",
                    "areaKey": area_key,
                    "at": candidate["at"],
                    "status": candidate["status"],
                    "eventType": "status-observation",
                    "recordId": record_id,
                    "sourcePage": row.get("Annex PDF page"),
                    "municipality": row.get("Municipality"),
                    "locationRaw": location_raw,
                    "observedAtRaw": observed_raw,
                    "statusRaw": status_raw,
                    "barangayBoundaryName": boundary_name,
                    "boundaryScope": "partial-area-represented-by-barangay" if partial_scope else "barangay-or-area-as-written",
                    "depthRaw": row.get("Water depth (Annex wording)"),
                    "reviewFlags": flags,
                })
        elif status_at and normalized_status and not (normalized_status == "Flooded" and observed_at == status_at):
            events.append({
                "eventId": "flood-annex-event-2026", "areaKey": area_key, "at": status_at,
                "status": normalized_status, "eventType": "status-observation", "recordId": record_id,
                "sourcePage": row.get("Annex PDF page"), "municipality": row.get("Municipality"),
                "locationRaw": location_raw, "observedAtRaw": observed_raw, "statusRaw": status_raw,
                "barangayBoundaryName": boundary_name,
                "boundaryScope": "partial-area-represented-by-barangay" if partial_scope else "barangay-or-area-as-written",
                "depthRaw": row.get("Water depth (Annex wording)"), "reviewFlags": flags,
            })

        item = {
            "eventId": "flood-annex-event-2026",
            "recordId": record_id,
            "sourcePage": row.get("Annex PDF page"),
            "municipality": row.get("Municipality"),
            "areaKey": area_key,
            "locationRaw": location_raw,
            "barangayBoundaryName": boundary_name,
            "boundaryScope": "partial-area-represented-by-barangay" if partial_scope else "barangay-or-area-as-written",
            "observedAtRaw": observed_raw,
            "observedAt": observed_at,
            "observedAtResolution": observed_note if observed_at else None,
            "depthRaw": row.get("Water depth (Annex wording)"),
            "statusRaw": status_raw,
            "status": normalized_status,
            "statusAt": status_at,
            "statusAtResolution": status_note,
            "needsReview": bool(flags),
            "reviewFlags": flags,
        }
        observations.append(item)
        if flags:
            exceptions.append({
                "recordId": record_id,
                "sourcePage": row.get("Annex PDF page"),
                "municipality": row.get("Municipality"),
                "locationRaw": location_raw,
                "observedAtRaw": observed_raw,
                "statusRaw": status_raw,
                "observedAt": observed_at or "",
                "statusAt": status_at or "",
                "barangayBoundaryName": boundary_name or "",
                "reviewFlags": "; ".join(flags),
            })

    result = {
        "eventId": "flood-annex-event-2026",
        "eventName": "Emergency Flood Annex",
        "sourceFile": "ANNEX_Flooded Area.pdf",
        "timeZone": "Asia/Manila",
        "defaultTime": "18:00",
        "defaultYear": DEFAULT_YEAR,
        "timestampRules": {
            "dateWithoutClock": "Resolve to 6:00 PM Asia/Manila on the stated date",
            "subsidedWithoutClockOrDate": "Resolve to 6:00 PM on the associated report date",
            "datedFloodAreaWithoutStatus": "Use the monitored time as an initial Flooded observation",
            "missingStatusAndObservationDate": "Exclude from map and figures, but preserve in excludedRecords",
        },
        "carryForward": "Latest resolved status per normalized municipality/location area key at or before the selected event time",
        "sourceRecordCount": len(rows),
        "excludedFromFiguresCount": len(excluded),
        "reviewRequiredCount": len(exceptions),
        "observationCount": len(observations),
        "eventCount": len(events),
        "observations": observations,
        "events": sorted(events, key=lambda event: event["at"]),
        "excludedRecords": excluded,
    }
    OUTPUT.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    if exceptions:
        with SUMMARY.open("w", encoding="utf-8-sig", newline="") as stream:
            writer = csv.DictWriter(stream, fieldnames=list(exceptions[0].keys()))
            writer.writeheader()
            writer.writerows(exceptions)
    else:
        SUMMARY.write_text("recordId,reviewFlags\n", encoding="utf-8-sig")
    print(json.dumps({
        "sourceRows": len(rows),
        "observations": len(observations),
        "excluded": len(excluded),
        "reviewRequired": len(exceptions),
        "resolvedStatusTime": sum(bool(x["statusAt"]) for x in observations),
        "unmatchedBarangay": sum(not x["barangayBoundaryName"] for x in observations),
        "output": str(OUTPUT),
        "exceptions": str(SUMMARY),
    }, indent=2))


if __name__ == "__main__":
    main()
