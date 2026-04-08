"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { toast } from "sonner";
import { Filter, X, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

// Services & Types
import { arkimeService } from "@/lib/elasticsearch";
import {
  TimeRangeValue,
  TimePickerTranslations,
} from "@/components/ui/advanced-time-selector";

import { Layer4TopNav } from "@/components/layer4/Layer4TopNav";
import { Layer4Histogram } from "@/components/layer4/Layer4Histogram";
import { Layer4Table } from "@/components/layer4/Layer4Table";
import { Layer4Flyout } from "@/components/layer4/Layer4Flyout";

// 🚀 1. นำเข้า Component PcapDownloadModal ที่เราเพิ่งสร้าง
import { PcapDownloadModal, PcapEventData } from "@/components/pcap-download-modal";

import { useLanguage } from "@/context/LanguageContext";
import { translations } from "@/locales/dict";
import { layer4Dict } from "@/locales/layer4dict";

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

interface FilterItem {
  id: string;
  key: string;
  value: any;
  operator: "==" | "!=";
}

const needsQuotes = (key: string, val: any) => {
  if (typeof val !== "string") return false;
  if (key.match(/\.(ip|port|packets|bytes|ttl)$/i) || key === "ipProtocol")
    return false;
  if (!isNaN(Number(val)) && val.trim() !== "") return false;

  return true;
};

export default function Layer4Page() {
  const { language, setLanguage } = useLanguage();
  const langKey = (language === "TH" ? "TH" : "EN") as "EN" | "TH";
  const dict = layer4Dict[langKey];

  const toggleLanguage = () => {
    const nextLang = language === "EN" ? "TH" : "EN";
    setLanguage(nextLang);
  };

  const [searchInput, setSearchInput] = useState("");
  const [luceneQuery, setLuceneQuery] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const [activeFilters, setActiveFilters] = useState<FilterItem[]>([]);

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

  // 🚀 2. State สำหรับควบคุม PCAP Modal
  const [isPcapModalOpen, setIsPcapModalOpen] = useState(false);
  const [selectedPcapData, setSelectedPcapData] = useState<PcapEventData | null>(null);

  const timeDict: TimePickerTranslations = useMemo(() => {
    const picker =
      (translations as any).timePicker?.[language] ||
      (translations as any).timePicker?.EN ||
      {};
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

  const handleAddFilter = useCallback(
    (key: string, value: any, operator: "==" | "!=") => {
      if (typeof value === "object" && value !== null) return;

      let processedValue = value;

      if (typeof processedValue === "string") {
        processedValue = processedValue.replace(/^['"](.*)['"]$/, "$1");
      }

      const caseSensitiveFields = [
        "id",
        "rootId",
        "network.community_id",
        "communityId",
        "payload8",
        "ssh.hassh",
        "ssh.hasshServer",
      ];

      if (
        typeof processedValue === "string" &&
        !caseSensitiveFields.includes(key)
      ) {
        processedValue = processedValue.toLowerCase();
      }

      setActiveFilters((prev) => {
        const filtered = prev.filter(
          (f) => !(f.key === key && f.value === processedValue),
        );
        return [
          ...filtered,
          {
            id: `${key}-${processedValue}-${Date.now()}`,
            key,
            value: processedValue,
            operator,
          },
        ];
      });
      setPage(1);
    },
    [],
  );

  // 🚀 3. ฟังก์ชันจัดเตรียมข้อมูลเพื่อเปิด Modal
  const handleOpenPcapModal = useCallback((session: any) => {
    // เราใช้ startTime ของ session (ที่ format แล้ว) แปลงกลับเป็น Date
    const sessionTime = new Date(session.startTime);
    
    setSelectedPcapData({
      srcIp: session.srcIp,
      srcPort: session.srcPort,
      destIp: session.dstIp,
      destPort: session.dstPort,
      timestamp: sessionTime,
    });
    setIsPcapModalOpen(true);
  }, []);

  // 🚀 4. ฟังก์ชันยิง API เมื่อกดยืนยันดาวน์โหลดใน Modal
  const handleConfirmPcapDownload = async (data: PcapEventData, startTime: Date, endTime: Date) => {
    try {
      const orgId = getOrgId();
      if (!orgId) throw new Error("Organization ID is missing.");

      // ใช้ Toast แบบ Loading เพื่อให้ลูกค้ารู้ว่ากำลังโหลดอยู่ (ป้องกันการกดรัว)
      const toastId = toast.loading("Preparing PCAP file for download...");

      const startUnix = Math.floor(startTime.getTime() / 1000);
      const endUnix = Math.floor(endTime.getTime() / 1000);

      await arkimeService.downloadPcap(
        orgId,
        data.srcIp,
        data.srcPort,
        data.destIp,
        data.destPort,
        startUnix,
        endUnix
      );

      toast.success("PCAP downloaded successfully!", { id: toastId });
    } catch (error) {
      console.error("PCAP Download failed:", error);
      toast.error("Failed to download PCAP. Please try again or check connection.");
    }
  };

  const fetchMetadata = useCallback(async () => {
    const orgId = getOrgId();
    try {
      const data = await arkimeService.getFields(orgId as string);
      if (data && !Array.isArray(data) && typeof data === "object") {
        const arrayData = Object.entries(data).map(([key, value]: any) => ({
          dbField: key,
          exp: value.exp || key,
          friendlyName: value.friendlyName || key,
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
        const now = dayjs().utc();
        let start = now.subtract(15, "minute"),
          end = now;
        if (timeRange.type === "relative") {
          const num = parseInt(timeRange.value.replace(/\D/g, ""));
          const unit = timeRange.value.replace(/\d/g, "");
          start = now.subtract(
            num,
            unit === "m" ? "minute" : unit === "h" ? "hour" : "day",
          );
        } else if (
          timeRange.type === "absolute" &&
          timeRange.start &&
          timeRange.end
        ) {
          start = dayjs.unix(timeRange.start).utc();
          end = dayjs.unix(timeRange.end).utc();
        }
        return { start, end };
      })();

      let finalExpression = luceneQuery ? `(${luceneQuery})` : "";
      if (activeFilters.length > 0) {
        const filterExprs = activeFilters.map((f) => {
          let safeValue = f.value;

          if (needsQuotes(f.key, safeValue)) {
            if (!safeValue.startsWith('"') && !safeValue.endsWith('"')) {
              safeValue = `"${safeValue}"`;
            }
          }
          return `${f.key} ${f.operator} ${safeValue}`;
        });
        const combinedFilters = filterExprs.join(" && ");
        finalExpression = finalExpression
          ? `${finalExpression} && ${combinedFilters}`
          : combinedFilters;
      }

      console.group("🚀 Layer 4 - Arkime API Request");
      console.log("📝 Expression:", finalExpression || "(none)");
      console.log("⏰ Time (UTC):", {
        start: bounds.start.format("YYYY-MM-DD HH:mm:ss"),
        end: bounds.end.format("YYYY-MM-DD HH:mm:ss"),
        startUnix: bounds.start.unix(),
        endUnix: bounds.end.unix()
      });
      console.log("📄 Paging:", { page, itemsPerPage, offset: (page - 1) * itemsPerPage });
      console.groupEnd();

      const response = await arkimeService.getSessions(orgId as string, {
        startTime: bounds.start.unix(),
        stopTime: bounds.end.unix(),
        expression: finalExpression,
        length: itemsPerPage,
        start: (page - 1) * itemsPerPage,
        order: "firstPacket:desc"
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
        } else if (item.tcpflags && typeof item.tcpflags === "string") {
          parsedTcpFlags = item.tcpflags;
        } else if (item.tcpflags && typeof item.tcpflags === "object") {
          parsedTcpFlags = Object.entries(item.tcpflags).map(([k, v]) => `${k.toUpperCase()} ${v}`).join("  ");
        }

        const buildPayload8 = (hex?: string, utf8?: string) => {
          if (!hex && !utf8) return "";
          return `${hex || ""}${utf8 ? ` ( ${utf8} )` : ""}`;
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
          if (typeof item.payload8 === "string") {
            finalPayload8 = item.payload8;
          } else if (Array.isArray(item.payload8)) {
            finalPayload8 = item.payload8.map((p: string | Record<string, string>) => {
              if (typeof p === "object" && p !== null) {
                const hex = p.hex || "";
                const utf8 = p.utf8 ? ` (${p.utf8})` : "";
                return `${hex}${utf8}`;
              }
              return String(p);
            }).join(" | ");
          } else if (typeof item.payload8 === "object") {
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

        let infoProtocols = item.protocols || [];
        if (infoProtocols.length === 0 && (item.ipProtocol === 1 || item.ipProtocol === 58)) {
          infoProtocols = ["icmp"];
        } else {
          infoProtocols = infoProtocols.map((p: string) =>
            (p.toLowerCase() === "icmp6" || p.toLowerCase() === "icmpv6") ? "icmp" : p
          );
        }

        return {
          id: item.id,
          rootId: item.rootId || item.id,
          communityId: item.communityId || item["network.community_id"] || item.network?.community_id || "-",
          node: item.node || "-",
          startTime: dayjs(item.firstPacket).format("MMM D, YYYY HH:mm:ss"),
          stopTime: dayjs(item.lastPacket).format("MMM D, YYYY HH:mm:ss"),
          protocol: item.ipProtocol === 6 ? "TCP" : item.ipProtocol === 17 ? "UDP" : item.ipProtocol === 58 ? "ICMP6" : "ICMP",
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
          protocols: infoProtocols,
          tags: Array.isArray(item.tags) ? item.tags : (item.tags ? [item.tags] : []),
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
          tcpflags: parsedTcpFlags,
          ssh: item.ssh ? {
            versions: item.ssh.version ? Array.isArray(item.ssh.version) ? item.ssh.version.join(" ") : item.ssh.version : "-",
            hassh: item.ssh.hassh || "-",
            hasshServer: item.ssh.hasshServer || "-",
          } : null,
          etherType: item.ethertype || item.etherType || "2,048 (IPv4)",

          http: {
            host: item["host.http"] ?? item.host?.http ?? item["http.host"] ?? item.http?.host,
          },

          tls: {
            version: item["tls.version"] ?? item.tls?.version,
            cipher: item["tls.cipher"] ?? item.tls?.cipher,
            srcSessionId: item["tls.sessionid"] ?? item.tls?.sessionid ?? item["tls.session_id"] ?? item.tls?.session_id ?? item["tls.sessionId"] ?? item.tls?.sessionId,
            ja3: item["tls.ja3"] ?? item.tls?.ja3 ?? item.ja3,
            ja3s: item["tls.ja3s"] ?? item.tls?.ja3s ?? item.ja3s,
            ja4: item["tls.ja4"] ?? item.tls?.ja4 ?? item.ja4,
          },
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
        const diffSec = bounds.end.unix() - bounds.start.unix();
        const originalIntervalSec = response.graph.interval || 60;

        let targetIntervalSec = Math.ceil(diffSec / 60);

        if (targetIntervalSec <= 1) targetIntervalSec = 1;
        else if (targetIntervalSec <= 5) targetIntervalSec = 5;
        else if (targetIntervalSec <= 10) targetIntervalSec = 10;
        else if (targetIntervalSec <= 15) targetIntervalSec = 15;
        else if (targetIntervalSec <= 30) targetIntervalSec = 30;
        else if (targetIntervalSec <= 60) targetIntervalSec = 60;
        else if (targetIntervalSec <= 5 * 60) targetIntervalSec = 5 * 60;
        else if (targetIntervalSec <= 10 * 60) targetIntervalSec = 10 * 60;
        else if (targetIntervalSec <= 30 * 60) targetIntervalSec = 30 * 60;
        else if (targetIntervalSec <= 60 * 60) targetIntervalSec = 60 * 60;

        targetIntervalSec = Math.max(originalIntervalSec, targetIntervalSec);

        const intervalMs = targetIntervalSec * 1000;
        const displayInterval = targetIntervalSec >= 60 ? `${Math.floor(targetIntervalSec / 60)}m` : `${targetIntervalSec}s`;

        const dataMap = new Map();
        response.graph.sessionsHisto.forEach((bucket: [number, number]) => {
          const snappedMs = Math.floor(bucket[0] / intervalMs) * intervalMs;
          dataMap.set(snappedMs, (dataMap.get(snappedMs) || 0) + bucket[1]);
        });

        const startMs = Math.floor(bounds.start.valueOf() / intervalMs) * intervalMs;
        const endMs = Math.ceil(bounds.end.valueOf() / intervalMs) * intervalMs;

        const fullBuckets = [];
        let currentMs = startMs;

        while (currentMs <= endMs) {
          const totalCount = dataMap.get(currentMs) || 0;

          const estTcp = totalCount > 0 ? Math.round(totalCount * ratioTcp) : 0;
          const estUdp = totalCount > 0 ? Math.round(totalCount * ratioUdp) : 0;
          const estIcmp = totalCount > 0 ? totalCount - estTcp - estUdp : 0;

          fullBuckets.push({
            key: currentMs,
            doc_count: totalCount,
            by_protocol: {
              buckets: totalCount > 0 ? [
                { key: "tcp", doc_count: estTcp },
                { key: "udp", doc_count: estUdp },
                { key: "icmp", doc_count: Math.max(0, estIcmp) },
              ] : [],
            },
          });

          currentMs += intervalMs;
        }

        setHistogramData(fullBuckets);
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
  }, [luceneQuery, activeFilters, timeRange, page, itemsPerPage, refreshKey]);

  useEffect(() => {
    fetchData();
    fetchMetadata();
  }, [fetchData, fetchMetadata]);

  return (
    <div className="flex h-full bg-slate-950 text-slate-200 font-sans overflow-hidden">
      <div className="flex-1 flex flex-col min-w-0 relative">
        <Layer4TopNav
          luceneQuery={searchInput}
          onQueryChange={setSearchInput}
          onQuerySubmit={() => {
            setLuceneQuery(searchInput);
            setPage(1);
          }}
          timeRange={timeRange}
          onTimeRangeChange={(val) => {
            setTimeRange(val);
            setPage(1);
          }}
          timeDict={timeDict}
          onRefresh={() => {
            setLuceneQuery(searchInput);
            setPage(1);
            setRefreshKey((k) => k + 1);
          }}
          isLoading={isLoading}
          dict={dict.header}
          currentLang={langKey}
          onLangToggle={toggleLanguage}
          fields={fieldsMetadata}
        />

        {activeFilters.length > 0 && (
          <div className="flex-none px-4 py-2 bg-slate-900/40 border-b border-slate-800 flex flex-wrap gap-2 items-center z-20">
            <div className="flex items-center gap-1.5 mr-1 text-slate-500">
              <Filter className="w-3 h-3" />
              <span className="text-[10px] font-bold uppercase tracking-wider">
                Filters
              </span>
            </div>
            {activeFilters.map((f) => (
              <div
                key={f.id}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] border transition-all",
                  f.operator === "=="
                    ? "bg-blue-500/10 border-blue-500/30 text-blue-400"
                    : "bg-rose-500/10 border-rose-500/30 text-rose-400",
                )}
              >
                <span className="font-bold opacity-70">
                  {f.key} {f.operator}
                </span>
                <span className="font-mono">
                  {needsQuotes(f.key, f.value)
                    ? `"${String(f.value)}"`
                    : String(f.value)}
                </span>
                <button
                  onClick={() =>
                    setActiveFilters((prev) =>
                      prev.filter((i) => i.id !== f.id),
                    )
                  }
                  className="ml-1 hover:bg-white/10 rounded-full p-0.5 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            <button
              onClick={() => {
                setActiveFilters([]);
                setPage(1);
              }}
              className="text-[10px] text-slate-500 hover:text-white flex items-center gap-1 ml-2 transition-colors"
            >
              <Trash2 className="w-3 h-3" /> Clear all
            </button>
          </div>
        )}

        <div className="relative flex-none w-full">
          <Layer4Histogram
            data={histogramData}
            totalHits={totalHits}
            interval={currentInterval}
            maxDocCount={maxDocCount}
            isLoading={isLoading}
          />
        </div>

        <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <Layer4Table
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
            onAddFilter={handleAddFilter}
            onDownloadPcap={handleOpenPcapModal}
          />
        </div>

        <Layer4Flyout
          data={detailSession}
          events={sessions}
          currentIndex={sessions.findIndex((s) => s.id === detailSession?.id)}
          onNavigate={(idx) => {
            setDetailSession(sessions[idx]);
            setHighlightedId(sessions[idx].id);
          }}
          onClose={() => setDetailSession(null)}
          onAddFilter={handleAddFilter}
          t={dict}
        />
        
        {/* 🚀 6. วาง Modal Component */}
        <PcapDownloadModal 
          isOpen={isPcapModalOpen}
          onClose={() => setIsPcapModalOpen(false)}
          onConfirm={handleConfirmPcapDownload}
          eventData={selectedPcapData}
        />
      </div>
    </div>
  );
}