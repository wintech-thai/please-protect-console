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
import {
  TerminalExitConfirmDialog,
  useTerminalExitConfirm,
} from "@/modules/system/components/terminal-exit-confirm";
import {
  TerminalSquare,
  RefreshCw,
  Power,
  PowerOff,
  Loader2,
  Palette,
  Check,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { translations } from "@/locales/dict";

/**
 * Full-screen web-based shell terminal (like Google Cloud Shell).
 *
 * Architecture:
 *   xterm.js  ──ws──►  Next.js server  ──wss──►  Backend API
 */

// ── Preset text-colour themes ─────────────────────────────────────────────────
const TEXT_COLOR_PRESETS = [
  // 1. Classic hacker grey  (default GitHub-dark style)
  { id: "default", label: "Ghost Grey", fg: "#c9d1d9", bg: "#0d1117" },
  // 2. Neon green            (old-school phosphor green)
  { id: "matrix", label: "Matrix Green", fg: "#00ff41", bg: "#0a0a0a" },
  // 3. Warm amber / orange   (vintage amber CRT)
  { id: "amber", label: "Amber CRT", fg: "#ffb347", bg: "#0d0800" },
  // 4. Gold / yellow         (high-contrast solarised feel)
  { id: "yellow", label: "Solar Yellow", fg: "#ffd700", bg: "#0d1117" },
  // 5. Electric cyan         (cyberpunk / teal)
  { id: "cyan", label: "Cyber Cyan", fg: "#00e5ff", bg: "#00111a" },
  // 6. Magenta / pink        (Dracula accent)
  { id: "magenta", label: "Dracula Pink", fg: "#ff79c6", bg: "#0d0d17" },
  // 7. Soft lavender         (light-on-dark purple)
  { id: "lavender", label: "Lavender", fg: "#d2a8ff", bg: "#0d0917" },
  // 8. Paper white           (high contrast, clean read)
  { id: "paper", label: "Paper White", fg: "#f8f8f2", bg: "#111111" },
] as const;

type TextColorPreset = (typeof TEXT_COLOR_PRESETS)[number]["id"];

export default function ShellTerminalView() {
  const { language } = useLanguage();
  const t = translations.shellTerminal[language];

  const router = useRouter();
  const terminalContainerRef = useRef<HTMLDivElement>(null);

  const xtermRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);

  const [termStatus, setTermStatus] = useState<TerminalStatus>("disconnected");

  // ── Text colour state ─────────────────────────────────────────────────────
  const [textColorId, setTextColorId] = useState<TextColorPreset>(() => {
    if (typeof window === "undefined") return "default";
    const saved = localStorage.getItem(
      "terminal-text-color",
    ) as TextColorPreset | null;
    return TEXT_COLOR_PRESETS.some((p) => p.id === saved) ? saved! : "default";
  });
  const [colorMenuOpen, setColorMenuOpen] = useState(false);
  const colorPickerRef = useRef<HTMLDivElement>(null);

  // Close the colour menu when user clicks outside it.
  // Only attach listener while menu is open — avoids firing setColorMenuOpen
  // on every terminal click (which would trigger React re-renders while typing).
  useEffect(() => {
    if (!colorMenuOpen) return;
    const handleOutside = (e: MouseEvent) => {
      if (
        colorPickerRef.current &&
        !colorPickerRef.current.contains(e.target as Node)
      ) {
        setColorMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, [colorMenuOpen]);

  // Apply theme to live terminal without full reinit
  // Uses direct DOM style for the fade — no React re-render, zero typing stutter
  const applyTheme = useCallback((presetId: TextColorPreset) => {
    const preset =
      TEXT_COLOR_PRESETS.find((p) => p.id === presetId) ??
      TEXT_COLOR_PRESETS[0];
    const term = xtermRef.current;
    const el = terminalContainerRef.current;
    if (!term || !el) return;

    // Fade out
    el.style.transition = "opacity 120ms ease-in-out";
    el.style.opacity = "0";

    setTimeout(() => {
      // Assign only the theme — spreading the whole options object throws because
      // constructor-only fields like `cols`/`rows` cannot be set after init.
      term.options.theme = {
        ...term.options.theme,
        background: preset.bg,
        foreground: preset.fg,
      };
      el.style.backgroundColor = preset.bg;
      // Fade back in
      el.style.opacity = "1";
    }, 120);
  }, []);

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
    },
  );

  // ── Initialise xterm.js ───────────────────────────────────────────────────
  useEffect(() => {
    if (!terminalContainerRef.current) return;

    const preset =
      TEXT_COLOR_PRESETS.find((p) => p.id === textColorId) ??
      TEXT_COLOR_PRESETS[0];

    const term = new Terminal({
      cursorBlink: true,
      fontSize: 14,
      fontFamily:
        '"JetBrains Mono", "Fira Code", "Cascadia Code", Menlo, Monaco, "Courier New", monospace',
      theme: {
        background: preset.bg,
        foreground: preset.fg,
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

    const containerEl = terminalContainerRef.current;
    term.open(containerEl);

    // Fit to container
    requestAnimationFrame(() => {
      fitAddon.fit();
    });

    xtermRef.current = term;
    fitAddonRef.current = fitAddon;

    // Send user input to WebSocket (xterm → backend)
    const disposeOnData = term.onData((data) => {
      send(data);
    });

    const disposeOnBinary = term.onBinary((data) => {
      send(data);
    });

    // Write welcome message
    term.writeln("\x1b[1;36m╔══════════════════════════════════════╗\x1b[0m");
    term.writeln(
      `\x1b[1;36m║\x1b[0m   \x1b[1;37m${t.messages.welcomeHeader}\x1b[0m   \x1b[1;36m║\x1b[0m`,
    );
    term.writeln("\x1b[1;36m╚══════════════════════════════════════╝\x1b[0m");
    term.writeln("");
    term.writeln(`\x1b[90m${t.messages.welcomeHint}\x1b[0m`);
    term.writeln("");

    // ── Clipboard shortcuts & UX ────────────────────────────────────────────
    // - Ctrl+Insert: Copy selection
    // - Shift+Insert: Paste
    // - Ctrl+Shift+C: Copy selection (web terminal standard)
    // - Ctrl+Shift+V: Paste (web terminal standard)
    // - Right click: Paste (optional)
    term.attachCustomKeyEventHandler((e: KeyboardEvent): boolean => {
      if (e.type !== "keydown") return true;

      const key = e.key;

      // Ctrl+Insert = Copy
      if (e.ctrlKey && key === "Insert") {
        const selection = term.getSelection();
        if (selection) {
          if (navigator.clipboard?.writeText) {
            void navigator.clipboard.writeText(selection).catch(() => {
              // fallback to copy event listener
              document.execCommand("copy");
            });
          } else {
            document.execCommand("copy");
          }
        }
        return false;
      }

      // Shift+Insert = Paste
      if (e.shiftKey && key === "Insert") {
        void navigator.clipboard
          .readText()
          .then((text) => term.paste(text))
          .catch(() => {});
        return false;
      }

      // Ctrl+Shift+C = Copy
      if (e.ctrlKey && e.shiftKey && (key === "c" || key === "C")) {
        const selection = term.getSelection();
        if (selection) {
          void navigator.clipboard?.writeText(selection).catch(() => {
            document.execCommand("copy");
          });
        }
        return false;
      }

      // Ctrl+Shift+V = Paste
      if (e.ctrlKey && e.shiftKey && (key === "v" || key === "V")) {
        void navigator.clipboard
          .readText()
          .then((text) => term.paste(text))
          .catch(() => {});
        return false;
      }

      return true;
    });

    // Copy fallback: when execCommand('copy') runs, this ensures clipboard has xterm selection
    const onCopy = (ev: ClipboardEvent) => {
      const selection = term.getSelection();
      if (!selection) return;
      ev.clipboardData?.setData("text/plain", selection);
      ev.preventDefault();
    };
    containerEl.addEventListener("copy", onCopy);

    // Optional: right click paste (comment out if you want native context menu)
    const onContextMenu = (ev: MouseEvent) => {
      ev.preventDefault();
      void navigator.clipboard
        .readText()
        .then((text) => term.paste(text))
        .catch(() => {});
    };
    containerEl.addEventListener("contextmenu", onContextMenu);

    // Resize handler
    const handleResize = () => {
      requestAnimationFrame(() => {
        fitAddon.fit();
      });
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      containerEl.removeEventListener("copy", onCopy);
      containerEl.removeEventListener("contextmenu", onContextMenu);
      disposeOnData.dispose();
      disposeOnBinary.dispose();
      term.dispose();
      xtermRef.current = null;
      fitAddonRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // run once on mount only

  // ── Refit when status changes (terminal might have been hidden) ───────────
  useEffect(() => {
    if (termStatus === "connected") {
      requestAnimationFrame(() => {
        fitAddonRef.current?.fit();
      });
      xtermRef.current?.writeln(
        `\r\n\x1b[1;32m${t.messages.connected}\x1b[0m\r\n`,
      );
      xtermRef.current?.focus();
    } else if (termStatus === "error") {
      xtermRef.current?.writeln(`\r\n\x1b[1;31m${t.messages.error}\x1b[0m\r\n`);
    } else if (termStatus === "disconnected") {
      // Only write if terminal is initialised and we previously had a connection
    }
  }, [termStatus, t.messages.connected, t.messages.error]);

  // ── Action handlers ───────────────────────────────────────────────────────
  const handleConnect = () => {
    xtermRef.current?.clear();
    xtermRef.current?.writeln(`\x1b[90m${t.messages.connecting}\x1b[0m\r\n`);
    connect();
  };

  const handleDisconnect = () => {
    disconnect();
    xtermRef.current?.writeln(
      `\r\n\x1b[33m${t.messages.disconnected}\x1b[0m\r\n`,
    );
  };

  const handleReconnect = () => {
    disconnect();
    xtermRef.current?.clear();
    xtermRef.current?.writeln(`\x1b[90m${t.messages.reconnecting}\x1b[0m\r\n`);
    setTimeout(() => connect(), 300);
  };

  // ── Status badge ──────────────────────────────────────────────────────────
  const statusConfig: Record<TerminalStatus, { label: string; color: string }> =
    {
      disconnected: { label: t.status.disconnected, color: "bg-gray-500" },
      connecting: {
        label: t.status.connecting,
        color: "bg-yellow-500 animate-pulse",
      },
      connected: { label: t.status.connected, color: "bg-emerald-500" },
      error: { label: t.status.error, color: "bg-red-500" },
    };

  const { label: statusLabel, color: statusColor } = statusConfig[termStatus];
  const activePreset =
    TEXT_COLOR_PRESETS.find((p) => p.id === textColorId) ??
    TEXT_COLOR_PRESETS[0];

  return (
    <div className="flex flex-col h-full bg-[#0d1117]">
      {/* ── Toolbar ──────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between px-3 sm:px-4 py-3 sm:py-4 bg-[#161b22] border-b border-[#30363d] gap-2 min-w-0">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <TerminalSquare className="size-5 text-cyan-400 shrink-0" />
          <span className="text-sm font-semibold text-slate-200 tracking-wide whitespace-nowrap">
            {t.title}
          </span>

          {/* Status badge */}
          <div className="flex items-center gap-1.5 sm:ml-2">
            <span
              className={`inline-block size-2 rounded-full shrink-0 ${statusColor}`}
            />
            <span className="text-xs text-slate-400 whitespace-nowrap hidden sm:inline">
              {statusLabel}
            </span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* ── Text Colour Picker ── */}
          <div ref={colorPickerRef} className="relative">
            <button
              id="terminal-color-picker-btn"
              onClick={() => setColorMenuOpen((v) => !v)}
              title={t.actions.textColor}
              className="inline-flex items-center gap-1.5 rounded-md bg-slate-700 hover:bg-slate-600 px-2 sm:px-3 py-2 text-xs font-medium text-slate-200 transition-colors"
            >
              <Palette className="size-3.5" />
              {/* tiny colour swatch */}
              <span
                className="hidden sm:inline size-3 rounded-sm border border-white/20"
                style={{ background: activePreset.fg }}
              />
            </button>

            {/* Dropdown */}
            {colorMenuOpen && (
              <div className="absolute right-0 top-full mt-1 z-50 min-w-45 rounded-lg border border-[#30363d] bg-[#161b22] shadow-xl py-1">
                {TEXT_COLOR_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => {
                      setTextColorId(preset.id);
                      localStorage.setItem("terminal-text-color", preset.id);
                      applyTheme(preset.id);
                      setColorMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-700 transition-colors"
                  >
                    {/* Dual swatch: bg | fg */}
                    <span className="flex shrink-0 rounded-sm overflow-hidden border border-white/20">
                      <span
                        className="inline-block size-3"
                        style={{ background: preset.bg }}
                      />
                      <span
                        className="inline-block size-3"
                        style={{ background: preset.fg }}
                      />
                    </span>
                    <span className="flex-1 text-left">{preset.label}</span>
                    {textColorId === preset.id && (
                      <Check className="size-3 text-emerald-400 shrink-0" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {termStatus === "disconnected" || termStatus === "error" ? (
            <button
              onClick={handleConnect}
              className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 px-2 sm:px-3 py-2 text-xs font-medium text-white transition-colors"
            >
              <Power className="size-3.5" />
              <span className="hidden sm:inline">{t.actions.connect}</span>
            </button>
          ) : termStatus === "connecting" ? (
            <button
              disabled
              className="inline-flex items-center gap-1.5 rounded-md bg-slate-700 px-2 sm:px-3 py-2 text-xs font-medium text-slate-400 cursor-not-allowed"
            >
              <Loader2 className="size-3.5 animate-spin" />
              <span className="hidden sm:inline">{t.actions.connecting}</span>
            </button>
          ) : (
            <>
              <button
                onClick={handleReconnect}
                className="inline-flex items-center gap-1.5 rounded-md bg-slate-700 hover:bg-slate-600 px-2 sm:px-3 py-2 text-xs font-medium text-slate-200 transition-colors"
              >
                <RefreshCw className="size-3.5" />
                <span className="hidden sm:inline">{t.actions.reconnect}</span>
              </button>
              <button
                onClick={handleDisconnect}
                className="inline-flex items-center gap-1.5 rounded-md bg-red-600/80 hover:bg-red-500 px-2 sm:px-3 py-2 text-xs font-medium text-white transition-colors"
              >
                <PowerOff className="size-3.5" />
                <span className="hidden sm:inline">{t.actions.disconnect}</span>
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
