"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { toast } from "sonner";

// Services & Types
import { arkimeService } from "@/lib/elasticsearch";
import {
  TimeRangeValue,
  TimePickerTranslations,
} from "@/modules/dashboard/components/advanced-time-selector";

// Components
import { Layer3TopNav } from "@/components/layer3/Layer3TopNav";
import { Layer3Histogram } from "@/components/layer3/Layer3Histogram";
import { Layer3Table } from "@/components/layer3/Layer3Table";
import { Layer3Flyout } from "@/components/layer3/Layer3Flyout";

// Context & Locales
import { useLanguage } from "@/context/LanguageContext";
import { translations } from "@/locales/dict";
import { layer3Dict } from "@/locales/layer3dict"; 

dayjs.extend(utc);
dayjs.extend(timezone);

const getOrgId = () => {
  if (typeof window === "undefined") return null;
  return (
    localStorage.getItem("orgId") ||
    localStorage.getItem("currentOrgId") ||
    null
  );
};

export default function Layer3Page() {
  // --- 1. Global Language Management ---
  const { language, setLanguage } = useLanguage();
  const langKey = (language === "TH" ? "TH" : "EN") as "EN" | "TH";
  const dict = layer3Dict[langKey]; 

  const toggleLanguage = () => {
    const nextLang = language === "EN" ? "TH" : "EN";
    setLanguage(nextLang);
  };

  // --- 2. State Management ---
  const [searchInput, setSearchInput] = useState("");
  const [luceneQuery, setLuceneQuery] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const [timeRange, setTimeRange] = useState<TimeRangeValue>({
    type: "relative",
    value: "15m",
    label: "Last 15 minutes",
  });

  const [sessions, setSessions] = useState<any[]>([]);
  const [fieldsMetadata, setFieldsMetadata] = useState<any[]>([]); 
  const [totalHits, setTotalHits] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const [histogramData, setHistogramData] = useState<any[]>([]);
  const [currentInterval, setCurrentInterval] = useState("60s");

  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const [detailSession, setDetailSession] = useState<any | null>(null);

  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const timeDict: TimePickerTranslations = useMemo(() => {
    const picker = (translations as any).timePicker?.[language] || (translations as any).timePicker?.EN || {};
    return {
      absoluteTitle: picker.absoluteTitle || "Absolute Range",
      from: picker.from || "From",
      to: picker.to || "To",
      apply: picker.apply || "Apply",
      searchPlaceholder: picker.searchPlaceholder || "Search...",
      customRange: picker.customRange || "Custom Range",
      last5m: picker.last5m || "Last 5 minutes",
      last15m: picker.last15m || "Last 15 minutes",
      last30m: picker.last30m || "Last 30 minutes",
      last1h: picker.last1h || "Last 1 hour",
      last3h: picker.last3h || "Last 3 hours",
      last6h: picker.last6h || "Last 6 hours",
      last12h: picker.last12h || "Last 12 hours",
      last24h: picker.last24h || "Last 24 hours",
      last2d: picker.last2d || "Last 2 days",
      last7d: picker.last7d || "Last 7 days",
      last30d: picker.last30d || "Last 30 days",
      ...picker,
    };
  }, [language]);

  const maxDocCount = useMemo(() => {
    if (!histogramData || histogramData.length === 0) return 1;
    return Math.max(...histogramData.map((b) => b.doc_count || 0), 1);
  }, [histogramData]);

  const fetchMetadata = useCallback(async () => {
    const orgId = getOrgId();
    try {
      const data = await arkimeService.getFields(orgId as string);
      if (data && !Array.isArray(data) && typeof data === 'object') {
        const arrayData = Object.entries(data).map(([key, value]: any) => ({
          dbField: key,
          exp: value.exp || key,
          friendlyName: value.friendlyName || key
        }));
        setFieldsMetadata(arrayData);
      }
    } catch (err) {}
  }, []);

  const fetchData = useCallback(async () => {
    const orgId = getOrgId();
    setIsLoading(true);
    try {
      const bounds = (() => {
        const now = dayjs();
        let start = now.subtract(15, "minute"), end = now;
        if (timeRange.type === "relative") {
          const num = parseInt(timeRange.value.replace(/\D/g, ""));
          const unit = timeRange.value.replace(/\d/g, "");
          start = now.subtract(num, unit === "m" ? "minute" : unit === "h" ? "hour" : "day");
        } else if (timeRange.type === "absolute" && timeRange.start && timeRange.end) {
          start = dayjs.unix(timeRange.start); end = dayjs.unix(timeRange.end);
        }
        return { start, end };
      })();

      const response = await arkimeService.getSessions(orgId as string, {
        startTime: bounds.start.unix(),
        stopTime: bounds.end.unix(),
        expression: luceneQuery,
        length: itemsPerPage, 
        start: (page - 1) * itemsPerPage, 
      });

      const mappedSessions = response.data.map((item: any) => {
        const pkts = item["network.packets"] ?? item.totPackets ?? item.network?.packets ?? 0;
        const bts = item["network.bytes"] ?? item.totBytes ?? item.network?.bytes ?? 0;

        const sIp = item["source.ip"] || item.source?.ip || "-";
        const sPort = item["source.port"] ?? item.source?.port ?? 0;
        const dIp = item["destination.ip"] || item.destination?.ip || "-";
        const dPort = item["destination.port"] ?? item.destination?.port ?? 0;

        const getSeq = (val: any) => {
          if (val === undefined || val === null || val === "" || val === "-") return "-";
          const num = Array.isArray(val) ? val[0] : val; 
          const parsed = Number(num);
          return isNaN(parsed) ? String(num) : parsed.toLocaleString();
        };

        const seqSrcRaw = item.tcpseqSrc ?? item["tcpseq.src"] ?? item.tcpseq?.src ?? item["source.tcp_seq"] ?? item.source?.tcp_seq;
        const seqDstRaw = item.tcpseqDst ?? item["tcpseq.dst"] ?? item.tcpseq?.dst ?? item["destination.tcp_seq"] ?? item.destination?.tcp_seq;
        
        const seqSrc = getSeq(seqSrcRaw);
        const seqDst = getSeq(seqDstRaw);

        const ttlSrc = item.srcTTL ?? item["source.ttl"] ?? item.source?.ttl ?? "-";
        const ttlDst = item.dstTTL ?? item["destination.ttl"] ?? item.destination?.ttl ?? "-";

        let parsedTcpFlags = "-";
        const flagsArray: string[] = [];
        const extractFlag = (label: string, key: string) => {
          const val = item[`tcpflags.${key}`] ?? (item.tcpflags ? item.tcpflags[key] : undefined);
          if (val !== undefined) flagsArray.push(`${label} ${val}`);
        };
        extractFlag("SYN", "syn");
        extractFlag("SYN-ACK", "syn-ack");
        extractFlag("ACK", "ack");
        extractFlag("PSH", "psh");
        extractFlag("RST", "rst");
        extractFlag("FIN", "fin");
        extractFlag("URG", "urg");

        if (flagsArray.length > 0) {
          parsedTcpFlags = flagsArray.join("  ");
        } else if (item.tcpflags && typeof item.tcpflags === 'string') {
          parsedTcpFlags = item.tcpflags;
        } else if (item.tcpflags && typeof item.tcpflags === 'object') {
          parsedTcpFlags = Object.entries(item.tcpflags).map(([k, v]) => `${k.toUpperCase()} ${v}`).join("  ");
        }

        const buildPayload8 = (hex?: string, utf8?: string) => {
          if (!hex && !utf8) return "";
          return `${hex || ''}${utf8 ? ` ( ${utf8} )` : ""}`;
        };

        const srcP8Hex = item["payload8.src.hex"] ?? item.payload8?.src?.hex ?? item.srcPayload8;
        const srcP8Utf8 = item["payload8.src.utf8"] ?? item.payload8?.src?.utf8 ?? item.srcPayload8UTF8;
        const dstP8Hex = item["payload8.dst.hex"] ?? item.payload8?.dst?.hex ?? item.dstPayload8;
        const dstP8Utf8 = item["payload8.dst.utf8"] ?? item.payload8?.dst?.utf8 ?? item.dstPayload8UTF8;

        const p8Arr: string[] = [];
        const sP8Str = buildPayload8(srcP8Hex, srcP8Utf8);
        if (sP8Str) p8Arr.push(`Src ${sP8Str}`);
        
        const dP8Str = buildPayload8(dstP8Hex, dstP8Utf8);
        if (dP8Str) p8Arr.push(`Dst ${dP8Str}`);

        let finalPayload8 = p8Arr.length > 0 ? p8Arr.join("  ") : "-";

        if (finalPayload8 === "-" && item.payload8) {
          if (typeof item.payload8 === 'string') {
            finalPayload8 = item.payload8;
          } else if (Array.isArray(item.payload8)) {
            finalPayload8 = item.payload8.map((p: string | Record<string, string>) => {
              if (typeof p === 'object' && p !== null) {
                const hex = p.hex || '';
                const utf8 = p.utf8 ? ` (${p.utf8})` : '';
                return `${hex}${utf8}`;
              }
              return String(p);
            }).join(" | ");
          } else if (typeof item.payload8 === 'object') {
             finalPayload8 = JSON.stringify(item.payload8);
          }
        }

        const formatMac = (rawMac: any) => {
          if (!rawMac || rawMac === "-") return "-";
          if (Array.isArray(rawMac)) return rawMac.length > 0 ? `Mac ${rawMac.join(", ")}` : "-";
          return `Mac ${rawMac}`;
        };

        const srcMacRaw = item["source.mac"] ?? item.source?.mac ?? item.srcMac ?? item.mac1 ?? item["mac1-term"] ?? "-";
        const dstMacRaw = item["destination.mac"] ?? item.destination?.mac ?? item.dstMac ?? item.mac2 ?? item["mac2-term"] ?? "-";

        return {
          id: item.id,
          rootId: item.rootId || item.id,
          communityId: item.communityId || item["network.community_id"] || item.network?.community_id || "-", 
          node: item.node || "-",
          startTime: dayjs(item.firstPacket).format("MMM D, YYYY HH:mm:ss"),
          stopTime: dayjs(item.lastPacket).format("MMM D, YYYY HH:mm:ss"),
          protocol: item.ipProtocol === 6 ? "TCP" : item.ipProtocol === 17 ? "UDP" : (item.ipProtocol === 58 ? "ICMPv6" : "ICMP"),
          ipProtocol: item.ipProtocol,
          
          srcIp: sIp,
          srcPort: sPort,
          dstIp: dIp,
          dstPort: dPort,
          
          packets: pkts.toLocaleString(),
          bytes: bts.toLocaleString(),
          databytes: (item.totDataBytes || 0).toLocaleString(), 

          tcp_seq_src: seqSrc,
          tcp_seq_dst: seqDst,
          ttl_src: ttlSrc,
          ttl_dst: ttlDst,
          
          source: { 
            ...(item.source || {}), 
            ip: sIp,
            port: sPort,
            mac: formatMac(srcMacRaw),
            packets: item["source.packets"] ?? item.source?.packets ?? 0,
            bytes: item["source.bytes"] ?? item.source?.bytes ?? 0,
            databytes: item["client.bytes"] ?? item.client?.bytes ?? 0,
          },
          destination: { 
            ...(item.destination || {}), 
            ip: dIp,
            port: dPort,
            mac: formatMac(dstMacRaw),
            packets: item["destination.packets"] ?? item.destination?.packets ?? 0,
            bytes: item["destination.bytes"] ?? item.destination?.bytes ?? 0,
            databytes: item["server.bytes"] ?? item.server?.bytes ?? 0,
          },
          
          payload8: finalPayload8,
          tags: Array.isArray(item.tags) ? item.tags : (item.tags ? [item.tags] : []),
          tcpflags: parsedTcpFlags,
          
          ssh: item.ssh ? {
            versions: item.ssh.version ? (Array.isArray(item.ssh.version) ? item.ssh.version.join(" ") : item.ssh.version) : "-",
            hassh: item.ssh.hassh || "-",
            hasshServer: item.ssh.hasshServer || "-"
          } : null,
          protocols: item.dns ? ["DNS"] : (item.protocols || []),
          etherType: item.ethertype || item.etherType || "2,048 (IPv4)"
        };
      });

      setSessions(mappedSessions);
      setTotalHits(response.recordsFiltered || 0);

      let tcpCount = 0, udpCount = 0, icmpCount = 0;
      mappedSessions.forEach((s: any) => {
        if (s.protocol === "TCP") tcpCount++;
        else if (s.protocol === "UDP") udpCount++;
        else icmpCount++;
      });
      const dataTotal = Math.max(tcpCount + udpCount + icmpCount, 1);
      const ratioTcp = tcpCount / dataTotal;
      const ratioUdp = udpCount / dataTotal;

      if (response.graph && response.graph.sessionsHisto) {
        const intervalSec = response.graph.interval || 60;
        const displayInterval = intervalSec >= 60 ? `${Math.floor(intervalSec / 60)}m` : `${intervalSec}s`;
        
        const buckets = response.graph.sessionsHisto.map((bucket: [number, number]) => {
          const timestamp = bucket[0];
          const totalCount = bucket[1];
          const estTcp = Math.round(totalCount * ratioTcp);
          const estUdp = Math.round(totalCount * ratioUdp);
          const estIcmp = totalCount - estTcp - estUdp;

          return {
            key: timestamp,
            doc_count: totalCount,
            by_protocol: {
              buckets: [
                { key: "tcp", doc_count: estTcp },
                { key: "udp", doc_count: estUdp },
                { key: "icmp", doc_count: Math.max(0, estIcmp) }
              ]
            }
          };
        });
        
        setHistogramData(buckets);
        setCurrentInterval(displayInterval);
      } else {
        setHistogramData([]);
        setCurrentInterval("60s");
      }

    } catch (err: any) {
      console.error(err);
      toast.error("Fetch failed. Please check connection.");
    } finally {
      setIsLoading(false);
    }
  }, [luceneQuery, timeRange, page, itemsPerPage, refreshKey]);

  useEffect(() => { 
    fetchData(); 
    fetchMetadata(); 
  }, [fetchData, fetchMetadata]);

  return (
    <div className="flex h-full bg-slate-950 text-slate-200 font-sans overflow-hidden">
      <div className="flex-1 flex flex-col min-w-0 relative">
        <Layer3TopNav
          luceneQuery={searchInput}
          onQueryChange={setSearchInput}
          onQuerySubmit={() => { setLuceneQuery(searchInput); setPage(1); }}
          timeRange={timeRange}
          onTimeRangeChange={(val) => { setTimeRange(val); setPage(1); }}
          timeDict={timeDict}
          onRefresh={() => setRefreshKey((k) => k + 1)} 
          isLoading={isLoading}
          
          dict={dict.header} 
          currentLang={langKey}
          onLangToggle={toggleLanguage}
          fields={fieldsMetadata}
        />
        
        <div className="relative flex-none w-full">
          <Layer3Histogram 
            data={histogramData} 
            totalHits={totalHits} 
            interval={currentInterval} 
            maxDocCount={maxDocCount} 
            isLoading={isLoading} 
          />
        </div>
        
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <Layer3Table
            sessions={sessions} 
            totalHits={totalHits} 
            isLoading={isLoading} 
            page={page} 
            itemsPerPage={itemsPerPage}
            selectedId={highlightedId} 
            onSelect={(session: any) => setHighlightedId(session.id)} 
            onRowClick={(session: any) => { 
                setHighlightedId(session.id); 
                setDetailSession(session); 
            }}
            onPageChange={setPage} 
            onItemsPerPageChange={setItemsPerPage}

            t={dict.table}
          />
        </div>
        
        <Layer3Flyout 
          data={detailSession} 
          fields={fieldsMetadata} 
          isOpen={!!detailSession} 
          onClose={() => setDetailSession(null)} 

          t={dict.flyout}
        />
      </div>
    </div>
  );
}