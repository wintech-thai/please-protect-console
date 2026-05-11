"use client";

import { useRef, useCallback, useEffect, useState } from "react";

export type GeoIPStatus = "connecting" | "live" | "disconnected";

export interface AttackEvent {
  id: string;
  src_lat: number;
  src_lng: number;
  dst_lat: number;
  dst_lng: number;
  src_country: string;
  dst_country: string;
  dataset: string;
  src_ip: string;
  dst_ip: string;
}

interface UseGeoIPWebSocketOptions {
  orgId: string;
  onAttack: (event: AttackEvent) => void;
}

export function useGeoIPWebSocket({ orgId, onAttack }: UseGeoIPWebSocketOptions) {
  const wsRef = useRef<WebSocket | null>(null);
  const [status, setStatus] = useState<GeoIPStatus>("connecting");
  const onAttackRef = useRef(onAttack);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const genRef = useRef(0); // generation counter — increments on every connect/cleanup

  useEffect(() => { onAttackRef.current = onAttack; }, [onAttack]);

  const connect = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }

    // Close existing connection
    const old = wsRef.current;
    wsRef.current = null;
    old?.close();

    const myGen = ++genRef.current; // this connection's generation

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host;
    const wsUrl = `${protocol}//${host}/ws-geoip?orgId=${encodeURIComponent(orgId)}`;

    setStatus("connecting");
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      if (genRef.current !== myGen) return;
      try {
        const msg = JSON.parse(event.data as string) as Record<string, unknown>;
        if (msg.type === "connected") { setStatus("live"); return; }
        if (msg.type === "attack") { onAttackRef.current(msg as unknown as AttackEvent); return; }
        if (msg.type === "error" || msg.type === "disconnected") { setStatus("disconnected"); }
      } catch {}
    };

    ws.onerror = () => {
      if (genRef.current !== myGen) return;
      setStatus("disconnected");
    };

    ws.onclose = () => {
      if (genRef.current !== myGen) return; // superseded connection — don't reconnect
      setStatus("disconnected");
      reconnectTimerRef.current = setTimeout(() => {
        if (genRef.current === myGen) connect();
      }, 3000);
    };
  }, [orgId]);

  useEffect(() => {
    connect();
    return () => {
      genRef.current++; // invalidate current connection's generation
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      wsRef.current?.close();
      wsRef.current = null;
    };
  }, [connect]);

  return { status };
}
