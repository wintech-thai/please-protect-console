"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Globe, Wifi, WifiOff, Loader2 } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { geoipAttackMapDict } from "../geoip-attack-map.dict";
import { useGeoIPWebSocket, type AttackEvent } from "../hooks/use-geoip-websocket";

interface Arc extends AttackEvent {
  startTime: number;
  color: string;
  _pts?: { x: number; y: number }[];
  _pulsePt?: { x: number; y: number };
  _geomVersion?: number;
}

interface FilterOptions {
  datasets: string[];
  srcCountries: string[];
  dstCountries: string[];
}

const DATASET_COLORS: Record<string, string> = {
  "suricata": "#f97316",
  "http": "#22d3ee",
  "https": "#22d3ee",
  "ssl": "#22d3ee",
  "ssh": "#a855f7",
  "telnet": "#a855f7",
  "dns": "#facc15",
  "sql": "#fb923c",
  "rdp": "#ef4444",
  "ftp": "#34d399",
  "connection": "#ec4899",
};

// deterministic hue from a string so the same dataset name always gets the same
// generated color across reloads/tabs/users, without needing a manual color entry
function hashHue(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % 360;
}

function getColor(dataset: string): string {
  // dataset names come in two shapes: plain ("suricata") or namespaced ("zeek.ssh") —
  // the meaningful protocol is the last segment for namespaced names, the whole
  // string for plain ones, so try suffix first and fall back to the prefix.
  const parts = dataset.toLowerCase().split(".");
  const suffix = parts[parts.length - 1];
  const prefix = parts[0];
  const known = DATASET_COLORS[suffix] ?? DATASET_COLORS[prefix];
  if (known) return known;
  // unmapped dataset — auto-generate a distinct, stable color instead of a shared fallback
  return `hsl(${hashHue(suffix || prefix)}, 80%, 62%)`;
}

function getBezierPoint(
  p0: { x: number; y: number },
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  t: number
) {
  const mt = 1 - t;
  return {
    x: mt * mt * p0.x + 2 * mt * t * p1.x + t * t * p2.x,
    y: mt * mt * p0.y + 2 * mt * t * p1.y + t * t * p2.y,
  };
}

const OPTIONS_POLL_INTERVAL = 30_000; // poll every 30s
const SEGMENTS = 60;
const MAX_CONCURRENT_ARCS = 200;
const ARC_TRAVEL_MS = 900; // time for the line to travel src → dst
const ARC_FADE_MS = 2200; // time the fully-drawn line lingers & fades after arriving
const ARC_LIFETIME_MS = ARC_TRAVEL_MS + ARC_FADE_MS;
const MAX_LOG_LINES = 20;

interface LogLine {
  id: string;
  time: number;
  dataset: string;
  color: string;
  text: string;
}

export default function GeoIPAttackMapView() {
  const { language } = useLanguage();
  const t = geoipAttackMapDict[language as "EN" | "TH"] ?? geoipAttackMapDict.EN;

  const mapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const leafletMap = useRef<any>(null);
  const arcsRef = useRef<Arc[]>([]);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const rafRef = useRef<number | null>(null);
  const geomVersionRef = useRef(0);
  const lastActiveCountRef = useRef(0);
  const lastActiveCountTimeRef = useRef(0);

  const [totalAttacks, setTotalAttacks] = useState(0);
  const [activeCount, setActiveCount] = useState(0);
  const [eventLog, setEventLog] = useState<LogLine[]>([]);
  const [demoMode, setDemoMode] = useState(false);

  const [orgId] = useState(() =>
    typeof window !== "undefined" ? (localStorage.getItem("orgId") ?? "temp") : "temp"
  );

  // Filter options fetched from /api/geoip-attack-map/options
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({ datasets: [], srcCountries: [], dstCountries: [] });

  const [filterDataset, setFilterDataset] = useState("");
  const [filterSrcCountry, setFilterSrcCountry] = useState("");
  const [filterDstCountry, setFilterDstCountry] = useState("");

  // Poll options endpoint periodically
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const res = await fetch("/api/geoip-attack-map/options");
        if (res.ok) {
          const data: FilterOptions = await res.json();
          setFilterOptions(data);
        }
      } catch {}
    };

    fetchOptions();
    const timer = setInterval(fetchOptions, OPTIONS_POLL_INTERVAL);
    return () => clearInterval(timer);
  }, []);

  // canvas draw loop
  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    const map = leafletMap.current;
    if (!canvas || !map) {
      rafRef.current = requestAnimationFrame(draw);
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) {
      rafRef.current = requestAnimationFrame(draw);
      return;
    }

    const now = Date.now();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const alive: Arc[] = [];
    let active = 0;

    for (const arc of arcsRef.current) {
      const elapsed = now - arc.startTime;
      if (elapsed >= ARC_LIFETIME_MS) continue;

      // travel phase: 0 → ARC_TRAVEL_MS, then linger/fade phase: ARC_TRAVEL_MS → ARC_LIFETIME_MS
      const drawT = Math.min(elapsed / ARC_TRAVEL_MS, 1);
      const alpha = elapsed <= ARC_TRAVEL_MS ? 1 : 1 - (elapsed - ARC_TRAVEL_MS) / ARC_FADE_MS;

      try {
        if (arc._geomVersion !== geomVersionRef.current) {
          const srcPt = map.latLngToContainerPoint([arc.src_lat, arc.src_lng]);
          const dstPt = map.latLngToContainerPoint([arc.dst_lat, arc.dst_lng]);

          const mx = (srcPt.x + dstPt.x) / 2;
          const my = (srcPt.y + dstPt.y) / 2;
          const dx = dstPt.x - srcPt.x;
          const dy = dstPt.y - srcPt.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 4) {
            // src/dst collapse to (almost) the same point on screen at this zoom —
            // a line would be invisible, so pulse a ring at that point instead so the
            // event still gets some visible feedback on the map.
            arc._pts = undefined;
            arc._pulsePt = { x: mx, y: my };
          } else {
            const offset = Math.min(dist * 0.35, 180);
            const cp = { x: mx - (dy / dist) * offset, y: my + (dx / dist) * offset };
            const pts: { x: number; y: number }[] = new Array(SEGMENTS + 1);
            for (let i = 0; i <= SEGMENTS; i++) pts[i] = getBezierPoint(srcPt, cp, dstPt, i / SEGMENTS);
            arc._pts = pts;
            arc._pulsePt = undefined;
          }
          arc._geomVersion = geomVersionRef.current;
        }

        if (arc._pulsePt) {
          const p = arc._pulsePt;
          const radius = 3 + drawT * 10;
          ctx.globalAlpha = alpha;
          ctx.strokeStyle = arc.color;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
          ctx.stroke();

          ctx.fillStyle = arc.color;
          ctx.beginPath();
          ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
          ctx.fill();

          ctx.globalAlpha = 1;
        } else if (arc._pts) {
          const pts = arc._pts;
          const steps = Math.floor(SEGMENTS * drawT);

          ctx.strokeStyle = arc.color;
          ctx.beginPath();
          ctx.moveTo(pts[0].x, pts[0].y);
          for (let i = 1; i <= steps; i++) ctx.lineTo(pts[i].x, pts[i].y);

          // soft wide pass + crisp bright pass — cheaper than ctx.shadowBlur on a long stroked path
          ctx.lineWidth = 4;
          ctx.globalAlpha = alpha * 0.25;
          ctx.stroke();

          ctx.lineWidth = 1.5;
          ctx.globalAlpha = alpha;
          ctx.stroke();

          // dot at tip — shadowBlur is cheap here since it's a small, fixed-size shape
          if (drawT > 0) {
            const tip = pts[steps];
            ctx.shadowColor = arc.color;
            ctx.shadowBlur = 6;
            ctx.beginPath();
            ctx.arc(tip.x, tip.y, 3, 0, Math.PI * 2);
            ctx.fillStyle = arc.color;
            ctx.fill();
            ctx.shadowBlur = 0;
          }

          ctx.globalAlpha = 1;
        }
      } catch {}

      alive.push(arc);
      active++;
    }

    arcsRef.current = alive;
    if (active !== lastActiveCountRef.current && now - lastActiveCountTimeRef.current > 200) {
      lastActiveCountRef.current = active;
      lastActiveCountTimeRef.current = now;
      setActiveCount(active);
    }
    rafRef.current = requestAnimationFrame(draw);
  }, []);

  // init Leaflet
  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return;

    import("leaflet").then((L) => {
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      if (!mapRef.current || (mapRef.current as any)._leaflet_id) return;

      const map = L.map(mapRef.current, { zoomControl: true, attributionControl: false }).setView([20, 0], 2);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        subdomains: "abc",
        maxZoom: 19,
        className: "osm-dark-tiles",
      }).addTo(map);

      const syncCanvas = () => {
        const canvas = canvasRef.current;
        const container = mapRef.current;
        if (!canvas || !container) return;
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        geomVersionRef.current++;
      };
      map.on("resize move zoom", syncCanvas);
      syncCanvas();

      leafletMap.current = map;
    });

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      leafletMap.current?.remove();
      leafletMap.current = null;
    };
  }, []); 

  // start animation loop
  useEffect(() => {
    rafRef.current = requestAnimationFrame(draw);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [draw]);

  const filterDatasetRef = useRef(filterDataset);
  const filterSrcCountryRef = useRef(filterSrcCountry);
  const filterDstCountryRef = useRef(filterDstCountry);
  useEffect(() => { filterDatasetRef.current = filterDataset; }, [filterDataset]);
  useEffect(() => { filterSrcCountryRef.current = filterSrcCountry; }, [filterSrcCountry]);
  useEffect(() => { filterDstCountryRef.current = filterDstCountry; }, [filterDstCountry]);

  const handleAttack = useCallback((event: AttackEvent) => {
    if (seenIdsRef.current.has(event.id)) return;
    seenIdsRef.current.add(event.id);
    if (seenIdsRef.current.size > 5000) {
      const first = seenIdsRef.current.values().next().value;
      if (first) seenIdsRef.current.delete(first);
    }

    if (filterDatasetRef.current && event.dataset !== filterDatasetRef.current) return;
    if (filterSrcCountryRef.current && event.src_country !== filterSrcCountryRef.current) return;
    if (filterDstCountryRef.current && event.dst_country !== filterDstCountryRef.current) return;

    const color = getColor(event.dataset);
    arcsRef.current.push({
      ...event,
      startTime: Date.now(),
      color,
    });
    if (arcsRef.current.length > MAX_CONCURRENT_ARCS) arcsRef.current.shift();
    setTotalAttacks((n) => n + 1);

    const country = event.dst_country || event.src_country || "—";
    setEventLog((prev) => [
      {
        id: event.id,
        time: Date.now(),
        dataset: event.dataset,
        color,
        text: `${event.src_ip || "?"} → ${event.dst_ip || "?"} (${country})`,
      },
      ...prev,
    ].slice(0, MAX_LOG_LINES));
  }, []);

  // Demo/stress-test mode — the server generates synthetic events and pushes them
  // over the same WebSocket connection as real traffic (see setDemo below), so this
  // exercises the actual server -> client push path under load, not just rendering.
  useEffect(() => {
    if (demoMode) return;
    // leaving demo mode — clear out simulated data so it doesn't linger mixed in with real counts
    arcsRef.current = [];
    setTotalAttacks(0);
    setActiveCount(0);
    setEventLog([]);
  }, [demoMode]);

  const { status, setDemo } = useGeoIPWebSocket({ orgId, onAttack: handleAttack });

  const handleDemoToggle = (enabled: boolean) => {
    setDemoMode(enabled);
    setDemo(enabled);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 gap-0 custom-scrollbar">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800 shrink-0">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-bold text-slate-100">{t.title}</span>
          <span className="text-xs text-slate-500">{t.subtitle}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">{t.totalAttacks}</span>
              <span className="font-mono font-bold text-slate-100">{totalAttacks.toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">{t.activeArcs}</span>
              <span className="font-mono font-bold text-cyan-400">{activeCount}</span>
            </div>
          </div>
          {status === "connecting" && (
            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <Loader2 className="w-3 h-3 animate-spin" />{t.connecting}
            </div>
          )}
          {status === "live" && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-400">
              <Wifi className="w-3 h-3" />
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              {t.live}
            </div>
          )}
          {status === "disconnected" && (
            <div className="flex items-center gap-1.5 text-xs text-red-400">
              <WifiOff className="w-3 h-3" />{t.disconnected}
            </div>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 px-5 py-2 border-b border-slate-800 shrink-0 overflow-x-auto custom-scrollbar">
        <Select label={t.filterDataset} value={filterDataset} onChange={setFilterDataset} placeholder={t.allDatasets} options={filterOptions.datasets} />
        <Select label={t.filterSrcCountry} value={filterSrcCountry} onChange={setFilterSrcCountry} placeholder={t.allCountries} options={filterOptions.srcCountries} />
        <Select label={t.filterDstCountry} value={filterDstCountry} onChange={setFilterDstCountry} placeholder={t.allCountries} options={filterOptions.dstCountries} />

        <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer select-none shrink-0">
          <button
            type="button"
            role="switch"
            aria-checked={demoMode}
            onClick={() => handleDemoToggle(!demoMode)}
            className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 ${
              demoMode ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]" : "bg-slate-700"
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
                demoMode ? "translate-x-[18px]" : "translate-x-0.5"
              }`}
            />
          </button>
          <span className={demoMode ? "text-amber-400 font-medium" : ""}>{t.simulateLoad}</span>
        </label>

        {/* Legend — reflects the datasets actually seen in the live stream, not a static list */}
        <div className="ml-auto flex items-center gap-3 flex-wrap">
          {filterOptions.datasets.map((ds) => (
            <div key={ds} className="flex items-center gap-1 text-[10px] text-slate-400">
              <span className="inline-block w-3 h-0.5 rounded" style={{ background: getColor(ds) }} />
              {ds.toUpperCase()}
            </div>
          ))}
        </div>
      </div>

      {demoMode && (
        <div className="flex items-center justify-center gap-1.5 px-5 py-1 bg-amber-500/10 border-b border-amber-500/30 text-[11px] font-bold tracking-wide text-amber-400 shrink-0">
          ⚠ {t.demoModeWarning}
        </div>
      )}

      {/* Map */}
      <div className="relative flex-1 min-h-0 isolate">
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <div ref={mapRef} className="w-full h-full" />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 pointer-events-none"
          style={{ zIndex: 500 }}
        />
        {status === "live" && totalAttacks === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 600 }}>
            <div className="flex items-center gap-2 text-sm text-slate-500 bg-slate-900/80 px-4 py-2 rounded-lg border border-slate-700">
              <Loader2 className="w-4 h-4 animate-spin" />
              {t.noData}
            </div>
          </div>
        )}

        {/* Live event feed */}
        {eventLog.length > 0 && (
          <div
            className="absolute bottom-3 left-3 w-95 max-w-[calc(100%-1.5rem)] rounded-lg border border-cyan-900/50 bg-slate-950/80 backdrop-blur-sm font-mono pointer-events-none"
            style={{ zIndex: 600 }}
          >
            <div className="flex items-center gap-1.5 px-2.5 py-1.5 border-b border-slate-800 text-[10px] tracking-wider text-cyan-400">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-cyan-500" />
              </span>
              LIVE EVENT FEED
            </div>
            <div className="flex flex-col px-2.5 py-1.5 max-h-36 overflow-y-auto overflow-x-hidden custom-scrollbar pointer-events-auto">
              {eventLog.map((line) => (
                <div key={line.id} className="animate-log-in flex gap-1.5 whitespace-nowrap overflow-hidden text-[10px] leading-relaxed shrink-0">
                  <span className="text-slate-600 shrink-0">
                    {new Date(line.time).toLocaleTimeString("en-GB")}
                  </span>
                  <span className="font-bold shrink-0" style={{ color: line.color }}>
                    {line.dataset.toUpperCase()}
                  </span>
                  <span className="text-slate-400 truncate">{line.text}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  placeholder,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  options: string[];
}) {
  return (
    <div className="flex items-center gap-1.5 text-xs">
      <span className="text-slate-500 shrink-0">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-md px-2 py-1 focus:outline-none focus:border-cyan-500 custom-scrollbar"
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </select>
    </div>
  );
}
