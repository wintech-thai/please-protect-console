"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { X, Search, Loader2, MapPin } from "lucide-react";
import type { GeoLocation } from "../hooks/use-geolocation";

export interface GeoPickerTranslations {
  geoPickerTitle: string;
  geoSearchPlaceholder: string;
  geoSearchBtn: string;
  geoLatitude: string;
  geoLongitude: string;
  geoCountry: string;
  geoCity: string;
  geoSiteName: string;
  geoSitePlaceholder: string;
  geoSaveBtn: string;
  cancel: string;
}

interface GeoLocationPickerModalProps {
  initial: GeoLocation | null;
  onConfirm: (geo: GeoLocation) => void;
  onClose: () => void;
  t: GeoPickerTranslations;
}

interface NominatimResult {
  lat: string;
  lon: string;
  display_name: string;
  address?: {
    country_code?: string;
    city?: string;
    town?: string;
    village?: string;
    suburb?: string;
    road?: string;
  };
}

async function reverseGeocode(lat: number, lng: number): Promise<Partial<GeoLocation>> {
  try {
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
      { headers: { "Accept-Language": "en" } }
    );
    const data = await res.json();
    const addr = data.address || {};
    return {
      country: addr.country_code?.toUpperCase() ?? "",
      city: addr.city || addr.town || addr.village || addr.suburb || "",
      site_name: addr.road || addr.suburb || addr.city || "",
    };
  } catch {
    return {};
  }
}

async function searchPlace(query: string): Promise<NominatimResult[]> {
  const res = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`,
    { headers: { "Accept-Language": "en" } }
  );
  return res.json();
}

export function GeoLocationPickerModal({ initial, onConfirm, onClose, t }: GeoLocationPickerModalProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<any>(null);
  const marker = useRef<any>(null);

  const defaultLat = initial?.latitude ?? 13.7563;
  const defaultLng = initial?.longitude ?? 100.5018;

  const [selected, setSelected] = useState<GeoLocation>({
    latitude: defaultLat,
    longitude: defaultLng,
    country: initial?.country ?? "",
    city: initial?.city ?? "",
    site_name: initial?.site_name ?? "",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<NominatimResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isReversing, setIsReversing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  const updateMarker = useCallback((lat: number, lng: number) => {
    if (!leafletMap.current || !marker.current) return;
    marker.current.setLatLng([lat, lng]);
    leafletMap.current.panTo([lat, lng]);
  }, []);

  const handleMapClick = useCallback(async (lat: number, lng: number) => {
    setIsReversing(true);
    updateMarker(lat, lng);
    const geo = await reverseGeocode(lat, lng);
    setSelected((prev) => ({ ...prev, latitude: lat, longitude: lng, ...geo }));
    setIsReversing(false);
  }, [updateMarker]);

  useEffect(() => {
    if (!mapRef.current || leafletMap.current) return;

    import("leaflet").then((L) => {
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      if (!mapRef.current || (mapRef.current as any)._leaflet_id) return;
      const map = L.map(mapRef.current).setView([defaultLat, defaultLng], 10);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(map);

      const m = L.marker([defaultLat, defaultLng], { draggable: true }).addTo(map);
      m.on("dragend", async (e: any) => {
        const pos = e.target.getLatLng();
        await handleMapClick(pos.lat, pos.lng);
      });
      map.on("click", async (e: any) => {
        await handleMapClick(e.latlng.lat, e.latlng.lng);
      });

      leafletMap.current = map;
      marker.current = m;
    });

    return () => {
      leafletMap.current?.remove();
      leafletMap.current = null;
      marker.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Close suggestions on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Debounced autocomplete while typing
  const handleSearchQueryChange = (value: string) => {
    setSearchQuery(value);
    setShowSuggestions(true);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await searchPlace(value.trim());
        setSearchResults(results);
      } finally {
        setIsSearching(false);
      }
    }, 350);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setIsSearching(true);
    setShowSuggestions(true);
    try {
      const results = await searchPlace(searchQuery.trim());
      setSearchResults(results);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectResult = async (result: NominatimResult) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    setShowSuggestions(false);
    setSearchResults([]);
    setSearchQuery(result.display_name.split(",")[0]);
    updateMarker(lat, lng);
    setIsReversing(true);
    const geo = await reverseGeocode(lat, lng);
    setSelected((prev) => ({ ...prev, latitude: lat, longitude: lng, ...geo }));
    setIsReversing(false);
  };

  const handleConfirm = async () => {
    setIsSaving(true);
    await onConfirm(selected);
    setIsSaving(false);
  };

  return (
    <div className="fixed inset-0 z-1000 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl w-full max-w-2xl mx-4 flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <MapPin className="w-4 h-4 text-cyan-400" />
            <span className="text-sm font-bold text-slate-100">{t.geoPickerTitle}</span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 pt-4 pb-2" ref={searchContainerRef}>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearchQueryChange(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                onFocus={() => searchResults.length > 0 && setShowSuggestions(true)}
                placeholder={t.geoSearchPlaceholder}
                className="w-full bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 pr-8 focus:outline-none focus:border-cyan-500 placeholder:text-slate-500"
              />
              {isSearching && (
                <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 animate-spin text-slate-400" />
              )}
            </div>
            <button
              onClick={handleSearch}
              disabled={isSearching}
              className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 flex items-center gap-1.5 shrink-0"
            >
              <Search className="w-3.5 h-3.5" />
              {t.geoSearchBtn}
            </button>
          </div>
        </div>

        {/* Suggestions — in normal flow, above map */}
        {showSuggestions && searchResults.length > 0 && (
          <div className="mx-5 mb-2 bg-slate-900 border border-slate-700 rounded-lg overflow-hidden shadow-lg">
            <div className="px-3 py-1.5 bg-slate-800/60 border-b border-slate-700">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Suggestions</span>
            </div>
            <div className="max-h-40 overflow-y-auto custom-scrollbar">
              {searchResults.map((r, i) => (
                <button
                  key={i}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    handleSelectResult(r);
                  }}
                  className="w-full text-left px-3 py-2.5 text-xs text-slate-300 hover:bg-slate-800 transition-colors border-b border-slate-800 last:border-0 flex items-start gap-2"
                >
                  <MapPin className="w-3 h-3 text-slate-500 mt-0.5 shrink-0" />
                  <span>{r.display_name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Map */}
        <div className="px-5">
          <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
          <div ref={mapRef} className="w-full h-64 rounded-lg overflow-hidden border border-slate-700" />
        </div>

        {/* Info */}
        <div className="px-5 py-3 grid grid-cols-2 gap-3 text-xs">
          {[
            { label: t.geoLatitude,  value: selected.latitude.toFixed(6),  mono: true },
            { label: t.geoLongitude, value: selected.longitude.toFixed(6), mono: true },
            { label: t.geoCountry,   value: selected.country || "—",       mono: false },
            { label: t.geoCity,      value: selected.city || "—",          mono: false },
          ].map(({ label, value, mono }) => (
            <div key={label} className="bg-slate-800/60 rounded-lg px-3 py-2">
              <span className="text-slate-500 block mb-0.5">{label}</span>
              <span className={`text-slate-100 ${mono ? "font-mono" : ""}`}>
                {isReversing ? "..." : value}
              </span>
            </div>
          ))}
          <div className="bg-slate-800/60 rounded-lg px-3 py-2 col-span-2">
            <span className="text-slate-500 block mb-0.5">{t.geoSiteName}</span>
            <input
              type="text"
              value={selected.site_name ?? ""}
              onChange={(e) => setSelected((prev) => ({ ...prev, site_name: e.target.value }))}
              placeholder={t.geoSitePlaceholder}
              className="w-full bg-transparent text-slate-100 text-xs focus:outline-none placeholder:text-slate-600"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-800 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm font-semibold transition-colors">
            {t.cancel}
          </button>
          <button
            onClick={handleConfirm}
            disabled={isSaving || isReversing}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white rounded-lg text-sm font-semibold transition-colors flex items-center gap-1.5"
          >
            {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <MapPin className="w-3.5 h-3.5" />}
            {t.geoSaveBtn}
          </button>
        </div>
      </div>
    </div>
  );
}
