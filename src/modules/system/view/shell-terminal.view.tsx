"use client";

import { useRef, useEffect, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Terminal } from "@xterm/xterm";
import { FitAddon } from "@xterm/addon-fit";
import { WebLinksAddon } from "@xterm/addon-web-links";
import { Unicode11Addon } from "@xterm/addon-unicode11";
import "@xterm/xterm/css/xterm.css";
import {
  useTerminalWebSocket,
  type TerminalStatus,
} from "@/modules/system/hooks/use-terminal-websocket";
import { TerminalExitConfirmDialog, useTerminalExitConfirm } from "@/modules/system/components/terminal-exit-confirm";
import { TerminalSquare, RefreshCw, Power, PowerOff, Loader2 } from "lucide-react";

/**
 * Full-screen web-based shell terminal (like Google Cloud Shell).
 *
 * Architecture:
 *   xterm.js  ──ws──►  Next.js server  ──wss──►  Backend API
 */
export default function ShellTerminalView() {
  const router = useRouter();
  const terminalContainerRef = useRef<HTMLDivElement>(null);
  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const [termStatus, setTermStatus] = useState<TerminalStatus>("disconnected");

  // ── xterm data handler (backend → xterm) ──────────────────────────────────
  const handleTerminalData = useCallback((data: string) => {
    xtermRef.current?.write(data);
  }, []);

  // ── WebSocket hook ────────────────────────────────────────────────────────
  const { connect, disconnect, send } = useTerminalWebSocket({
    onData: handleTerminalData,
    onStatusChange: setTermStatus,
  });

  // ── Navigation Interceptor (Dialog) ───────────────────────────────────────
  const { showConfirm, confirmExit, cancelExit } = useTerminalExitConfirm(
    termStatus === "connected" || termStatus === "connecting",
    () => {
      disconnect();
    }
  );

  // ── Initialise xterm.js ───────────────────────────────────────────────────
  useEffect(() => {
    if (!terminalContainerRef.current) return;

    const term = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", Menlo, Monaco, "Courier New", monospace',
      theme: {
        background: "#0d1117",
        foreground: "#c9d1d9",
        cursor: "#58a6ff",
        selectionBackground: "#264f78",
        black: "#0d1117",
        red: "#ff7b72",
        green: "#7ee787",
        yellow: "#d29922",
        blue: "#58a6ff",
        magenta: "#bc8cff",
        cyan: "#39c5cf",
        white: "#c9d1d9",
        brightBlack: "#484f58",
        brightRed: "#ffa198",
        brightGreen: "#56d364",
        brightYellow: "#e3b341",
        brightBlue: "#79c0ff",
        brightMagenta: "#d2a8ff",
        brightCyan: "#56d4dd",
        brightWhite: "#f0f6fc",
      },
      scrollback: 10000,
      allowProposedApi: true,
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon();
    const unicode11Addon = new Unicode11Addon();

    term.loadAddon(fitAddon);
    term.loadAddon(webLinksAddon);
    term.loadAddon(unicode11Addon);

    // Activate Unicode 11 for better wide character support (Thai, CJK)
    term.unicode.activeVersion = "11";

    term.open(terminalContainerRef.current);

    // Fit to container
    requestAnimationFrame(() => {
      fitAddon.fit();
    });

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    // Send user input to WebSocket
    term.onData((data) => {
      send(data);
    });

    // Handle binary data (e.g. Ctrl+C)
    term.onBinary((data) => {
      send(data);
    });

    // Write welcome message
    term.writeln("\x1b[1;36m╔══════════════════════════════════════╗\x1b[0m");
    term.writeln("\x1b[1;36m║\x1b[0m   \x1b[1;37mPlease Protect — Shell Terminal\x1b[0m   \x1b[1;36m║\x1b[0m");
    term.writeln("\x1b[1;36m╚══════════════════════════════════════╝\x1b[0m");
    term.writeln("");
    term.writeln('\x1b[90mClick "Connect" to start a terminal session.\x1b[0m');
    term.writeln("");

    // Resize handler
    const handleResize = () => {
      requestAnimationFrame(() => {
        fitAddon.fit();
      });
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      term.dispose();
      xtermRef.current = null;
      fitAddonRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Refit when status changes (terminal might have been hidden) ───────────
  useEffect(() => {
    if (termStatus === "connected") {
      requestAnimationFrame(() => {
        fitAddonRef.current?.fit();
      });
      xtermRef.current?.writeln("\r\n\x1b[1;32m✔ Connected to terminal\x1b[0m\r\n");
      xtermRef.current?.focus();
    } else if (termStatus === "error") {
      xtermRef.current?.writeln("\r\n\x1b[1;31m✘ Connection error\x1b[0m\r\n");
    } else if (termStatus === "disconnected") {
      // Only write if terminal is initialised and we previously had a connection
    }
  }, [termStatus]);

  // ── Action handlers ───────────────────────────────────────────────────────
  const handleConnect = () => {
    xtermRef.current?.clear();
    xtermRef.current?.writeln("\x1b[90mConnecting…\x1b[0m\r\n");
    connect();
  };

  const handleDisconnect = () => {
    disconnect();
    xtermRef.current?.writeln("\r\n\x1b[33m⏻ Disconnected\x1b[0m\r\n");
  };

  const handleReconnect = () => {
    disconnect();
    xtermRef.current?.clear();
    xtermRef.current?.writeln("\x1b[90mReconnecting…\x1b[0m\r\n");
    setTimeout(() => connect(), 300);
  };

  // ── Status badge ──────────────────────────────────────────────────────────
  const statusConfig: Record<TerminalStatus, { label: string; color: string }> = {
    disconnected: { label: "Disconnected", color: "bg-gray-500" },
    connecting:   { label: "Connecting",   color: "bg-yellow-500 animate-pulse" },
    connected:    { label: "Connected",    color: "bg-emerald-500" },
    error:        { label: "Error",        color: "bg-red-500" },
  };

  const { label: statusLabel, color: statusColor } = statusConfig[termStatus];

  return (
    <div className="flex flex-col h-full bg-[#0d1117]">
      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#161b22] border-b border-[#30363d]">
        <div className="flex items-center gap-3">
          <TerminalSquare className="size-5 text-cyan-400" />
          <span className="text-sm font-semibold text-slate-200 tracking-wide">
            Shell Terminal
          </span>

          {/* Status badge */}
          <div className="flex items-center gap-1.5 ml-2">
            <span className={`inline-block size-2 rounded-full ${statusColor}`} />
            <span className="text-xs text-slate-400">{statusLabel}</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          {termStatus === "disconnected" || termStatus === "error" ? (
            <button
              onClick={handleConnect}
              className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 px-3 py-1.5 text-xs font-medium text-white transition-colors"
            >
              <Power className="size-3.5" />
              Connect
            </button>
          ) : termStatus === "connecting" ? (
            <button
              disabled
              className="inline-flex items-center gap-1.5 rounded-md bg-slate-700 px-3 py-1.5 text-xs font-medium text-slate-400 cursor-not-allowed"
            >
              <Loader2 className="size-3.5 animate-spin" />
              Connecting…
            </button>
          ) : (
            <>
              <button
                onClick={handleReconnect}
                className="inline-flex items-center gap-1.5 rounded-md bg-slate-700 hover:bg-slate-600 px-3 py-1.5 text-xs font-medium text-slate-200 transition-colors"
              >
                <RefreshCw className="size-3.5" />
                Reconnect
              </button>
              <button
                onClick={handleDisconnect}
                className="inline-flex items-center gap-1.5 rounded-md bg-red-600/80 hover:bg-red-500 px-3 py-1.5 text-xs font-medium text-white transition-colors"
              >
                <PowerOff className="size-3.5" />
                Disconnect
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Terminal area ─────────────────────────────────────────────────── */}
      <div ref={terminalContainerRef} className="flex-1 p-1" />

      {/* ── Exit Confirmation Dialog ──────────────────────────────────────── */}
      <TerminalExitConfirmDialog
        isOpen={showConfirm}
        onConfirm={confirmExit}
        onCancel={cancelExit}
      />
    </div>
  );
}
