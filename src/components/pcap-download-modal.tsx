"use client";

import { useState, useEffect } from "react";
import { X, Download, AlertCircle, Clock, ArrowRight, ShieldAlert, Server } from "lucide-react";
import { cn } from "@/lib/utils";

export interface PcapEventData {
  srcIp: string;
  srcPort: string | number;
  destIp: string;
  destPort: string | number;
  timestamp: string | Date; 
}

interface PcapDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: PcapEventData, startTime: Date, endTime: Date) => void;
  eventData: PcapEventData | null;
}

export function PcapDownloadModal({ isOpen, onClose, onConfirm, eventData }: PcapDownloadModalProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [timeWindow, setTimeWindow] = useState<{ start: Date; end: Date } | null>(null);

  useEffect(() => {
    if (eventData?.timestamp) {
      const eventTime = new Date(eventData.timestamp);
      
      const startTime = new Date(eventTime);
      startTime.setMinutes(startTime.getMinutes() - 5); // ถอยหลัง 5 นาที
      
      const endTime = new Date(eventTime);
      endTime.setMinutes(endTime.getMinutes() + 5);   // เดินหน้า 5 นาที
      
      setTimeWindow({ start: startTime, end: endTime });
    }
  }, [eventData]);

  if (!isOpen || !eventData || !timeWindow) return null;

  const handleConfirm = async () => {
    setIsDownloading(true);
    try {
      await onConfirm(eventData, timeWindow.start, timeWindow.end);
      onClose(); 
    } catch (error) {
      console.error("Failed to download:", error);
    } finally {
      setIsDownloading(false);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleString("en-GB", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#020617]/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      
      {/* ตัวกล่อง Modal */}
      <div className="bg-[#0B1120] border border-blue-900/50 rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.5)] w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* --- Header --- */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800/60 bg-[#0B1120]">
          <div className="flex items-center gap-3">
            <div className="bg-cyan-950/50 p-2 rounded-lg border border-cyan-800/50">
              <Download className="w-5 h-5 text-cyan-400" />
            </div>
            <h2 className="text-lg font-bold text-white tracking-tight">Download PCAP File</h2>
          </div>
          <button 
            onClick={onClose}
            disabled={isDownloading}
            className="text-slate-400 hover:text-white p-1 rounded-md hover:bg-slate-800 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* --- Body --- */}
        <div className="p-6 space-y-6">
          
          {/* Banner แจ้งเตือนเรื่องเวลา */}
          <div className="bg-blue-950/30 border border-blue-900/50 p-4 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
            <div className="text-sm text-slate-300 leading-relaxed">
              You are about to download the packet capture (PCAP) for this event. 
              The system will automatically extract traffic from <strong className="text-cyan-400">5 minutes before</strong> and <strong className="text-cyan-400">5 minutes after</strong> the event time.
            </div>
          </div>

          {/* กล่องแสดง Source -> Destination */}
          <div className="bg-[#050B14] rounded-xl border border-slate-800 p-5">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Connection Details</h3>
            
            <div className="flex items-center justify-between">
              {/* ฝั่ง Source */}
              <div className="flex flex-col gap-1 w-[40%]">
                <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1">
                  <Server className="w-3.5 h-3.5" /> Source
                </div>
                <div className="text-sm font-mono text-white bg-slate-900 px-2.5 py-1.5 rounded border border-slate-800 break-all">
                  {eventData.srcIp}
                </div>
                <div className="text-xs font-mono text-cyan-400">
                  Port: {eventData.srcPort}
                </div>
              </div>

              {/* ลูกศรชี้ไปขวา */}
              <div className="flex flex-col items-center justify-center w-[20%]">
                <ArrowRight className="w-5 h-5 text-slate-600" />
              </div>

              {/* ฝั่ง Destination */}
              <div className="flex flex-col gap-1 w-[40%] text-right">
                <div className="flex items-center justify-end gap-1.5 text-xs text-slate-400 mb-1">
                  <ShieldAlert className="w-3.5 h-3.5" /> Destination
                </div>
                <div className="text-sm font-mono text-white bg-slate-900 px-2.5 py-1.5 rounded border border-slate-800 break-all">
                  {eventData.destIp}
                </div>
                <div className="text-xs font-mono text-rose-400">
                  Port: {eventData.destPort}
                </div>
              </div>
            </div>
          </div>

          {/* กล่องแสดงเวลา Start/End */}
          <div className="bg-[#050B14] rounded-xl border border-slate-800 p-5">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5" /> Extraction Window (10 Mins Total)
            </h3>
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Start Time (-5m):</span>
                <span className="font-mono text-emerald-400">{formatTime(timeWindow.start)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">End Time (+5m):</span>
                <span className="font-mono text-rose-400">{formatTime(timeWindow.end)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* --- Footer --- */}
        <div className="p-5 border-t border-slate-800/60 bg-[#0B1120] flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isDownloading}
            className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white bg-transparent hover:bg-slate-800 rounded-lg transition-colors outline-none disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isDownloading}
            className={cn(
              "flex items-center gap-2 px-5 py-2 text-sm font-bold text-white rounded-lg transition-all shadow-lg outline-none",
              isDownloading 
                ? "bg-cyan-600/50 cursor-not-allowed" 
                : "bg-cyan-600 hover:bg-cyan-500 hover:shadow-[0_0_15px_rgba(6,182,212,0.4)]"
            )}
          >
            {isDownloading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" /> Download
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}