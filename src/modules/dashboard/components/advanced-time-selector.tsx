"use client";

import { useState, useEffect } from "react";
import { Clock, ChevronDown, Check } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import dayjs, { Dayjs } from "dayjs";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import { ThemeProvider, createTheme } from "@mui/material/styles";

// Ensure dark mode for MUI components to match the app
const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: {
      main: "#8b5cf6", // Violet-500
    },
    background: {
      paper: "#0f172a", // Slate-900
      default: "#0f172a",
    },
  },
  typography: {
    fontFamily: "inherit",
  },
  components: {
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: "0.5rem",
          borderColor: "#334155", // Slate-700
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: "#475569", // Slate-600
          },
        },
        input: {
          padding: "8px 12px",
          color: "#e2e8f0", // Slate-200
          fontSize: "0.875rem",
        },
      },
    },
  },
});

export type TimeRangeType = "relative" | "absolute";

export interface TimeRangeValue {
  type: TimeRangeType;
  value: string; // "5m", "1h" for relative
  start?: number; // timestamp in seconds for absolute
  end?: number; // timestamp in seconds for absolute
  label?: string; // "Last 5 minutes", "Custom Range"
}

export interface TimePickerTranslations {
  absoluteTitle: string;
  from: string;
  to: string;
  apply: string;
  searchPlaceholder: string;
  customRange: string;
  last5m: string;
  last15m: string;
  last30m: string;
  last1h: string;
  last3h: string;
  last6h: string;
  last12h: string;
  last24h: string;
  last2d: string;
  last7d: string;
  last30d: string;
}

interface AdvancedTimeRangeSelectorProps {
  value: TimeRangeValue;
  onChange: (value: TimeRangeValue) => void;
  disabled?: boolean;
  translations: TimePickerTranslations;
}

const QUICK_RANGE_KEYS: { value: string; key: keyof TimePickerTranslations }[] = [
  { value: "5m", key: "last5m" },
  { value: "15m", key: "last15m" },
  { value: "30m", key: "last30m" },
  { value: "1h", key: "last1h" },
  { value: "3h", key: "last3h" },
  { value: "6h", key: "last6h" },
  { value: "12h", key: "last12h" },
  { value: "24h", key: "last24h" },
  { value: "2d", key: "last2d" },
  { value: "7d", key: "last7d" },
  { value: "30d", key: "last30d" },
];

export function AdvancedTimeRangeSelector({
  value,
  onChange,
  disabled,
  translations: tp,
}: AdvancedTimeRangeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [fromDate, setFromDate] = useState<Dayjs | null>(null);
  const [toDate, setToDate] = useState<Dayjs | null>(null);
  const [activeTab, setActiveTab] = useState<"absolute" | "quick">("quick");

  // Initialize absolute dates when opening if absolute is selected

  useEffect(() => {
    if (isOpen) {
      if (value.type === "absolute" && value.start && value.end) {
        setFromDate(dayjs(value.start * 1000));
        setToDate(dayjs(value.end * 1000));
      } else if (value.type === "relative") {
        // Set default absolute range relative to now for better UX
        const range = value.value;
        const now = dayjs();
        let start = now;

        const num = parseInt(range.replace(/\D/g, ""));
        const unit = range.replace(/\d/g, "");

        if (unit === "m") start = now.subtract(num, "minute");
        if (unit === "h") start = now.subtract(num, "hour");
        if (unit === "d") start = now.subtract(num, "day");

        setFromDate(start);
        setToDate(now);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  const handleApplyAbsolute = () => {
    if (fromDate && toDate) {
      onChange({
        type: "absolute",
        value: "custom",
        start: fromDate.unix(),
        end: toDate.unix(),
        label: `${fromDate.format("MMM D, HH:mm")} to ${toDate.format("MMM D, HH:mm")}`,
      });
      setIsOpen(false);
    }
  };

  const handleSelectRelative = (range: (typeof QUICK_RANGE_KEYS)[0]) => {
    onChange({
      type: "relative",
      value: range.value,
      label: tp[range.key],
    });
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          disabled={disabled}
          className={cn(
            "w-full sm:w-auto sm:min-w-50 justify-between text-left font-normal bg-slate-900 border-slate-700 hover:bg-slate-800 text-slate-200",
            !value && "text-muted-foreground",
          )}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Clock className="shrink-0 h-4 w-4 text-slate-400" />
            <span className="truncate text-sm">
              {value.type === "relative"
                ? tp[QUICK_RANGE_KEYS.find((r) => r.value === value.value)?.key ?? "last5m"]
                : value.label || tp.customRange}
            </span>
          </div>
          <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[calc(100vw-2rem)] sm:w-150 max-w-150 p-0 bg-slate-950 border-slate-800 text-slate-200"
        align="end"
        sideOffset={8}
      >
        {/* Mobile Tabs */}
        <div className="flex sm:hidden border-b border-slate-800">
          <button
            onClick={() => setActiveTab("quick")}
            className={cn(
              "flex-1 py-2.5 text-xs font-medium transition-colors",
              activeTab === "quick"
                ? "text-violet-400 border-b-2 border-violet-500 bg-slate-900/50"
                : "text-slate-500 hover:text-slate-300",
            )}
          >
            {tp.searchPlaceholder.replace("...", "").trim() || "Quick Ranges"}
          </button>
          <button
            onClick={() => setActiveTab("absolute")}
            className={cn(
              "flex-1 py-2.5 text-xs font-medium transition-colors",
              activeTab === "absolute"
                ? "text-violet-400 border-b-2 border-violet-500 bg-slate-900/50"
                : "text-slate-500 hover:text-slate-300",
            )}
          >
            {tp.absoluteTitle}
          </button>
        </div>

        <div className="flex flex-col sm:flex-row h-90 sm:h-100">
          {/* Left Column: Absolute Range Picker */}
          <div
            className={cn(
              "flex-1 p-4 sm:border-r border-slate-800 flex flex-col gap-4",
              activeTab !== "absolute" && "hidden sm:flex",
            )}
          >
            <h4 className="hidden sm:block font-semibold text-sm text-slate-100 mb-2">
              {tp.absoluteTitle}
            </h4>

            <ThemeProvider theme={darkTheme}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-slate-400">{tp.from}</label>
                    <DateTimePicker
                      value={fromDate}
                      onChange={(newValue) => setFromDate(newValue)}
                      slotProps={{
                        textField: { size: "small", fullWidth: true },
                      }}
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs text-slate-400">{tp.to}</label>
                    <DateTimePicker
                      value={toDate}
                      onChange={(newValue) => setToDate(newValue)}
                      slotProps={{
                        textField: { size: "small", fullWidth: true },
                      }}
                    />
                  </div>
                </div>
              </LocalizationProvider>
            </ThemeProvider>

            <div className="mt-auto pt-4 flex gap-2">
              <Button
                className="w-full bg-violet-600 hover:bg-violet-700 text-white"
                onClick={handleApplyAbsolute}
                disabled={!fromDate || !toDate}
              >
                {tp.apply}
              </Button>
            </div>
          </div>

          {/* Right Column: Quick Ranges List */}
          <div
            className={cn(
              "w-full sm:w-50 flex flex-col sm:border-l border-slate-800/50 bg-slate-900/30",
              activeTab !== "quick" && "hidden sm:flex",
            )}
          >
            <div className="p-3 border-b border-slate-800">
              <input
                type="text"
                placeholder={tp.searchPlaceholder}
                className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-slate-300 focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-1">
              {QUICK_RANGE_KEYS.map((range) => (
                <button
                  key={range.value}
                  onClick={() => handleSelectRelative(range)}
                  className={cn(
                    "w-full text-left px-3 py-2 text-sm rounded-md transition-colors flex items-center justify-between group",
                    value.type === "relative" && value.value === range.value
                      ? "bg-violet-500/10 text-violet-400 border-l-2 border-violet-500"
                      : "text-slate-400 hover:bg-slate-800 hover:text-slate-200",
                  )}
                >
                  <span>{tp[range.key]}</span>
                  {value.type === "relative" && value.value === range.value && (
                    <Check className="w-3 h-3" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
