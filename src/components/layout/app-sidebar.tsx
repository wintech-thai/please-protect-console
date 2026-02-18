"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChevronDown,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Sheet, SheetContent } from "@/components/ui/sheet";

export interface SidebarMenuItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

export interface SidebarMenuGroup {
  label: string;
  icon: React.ReactNode;
  children: SidebarMenuItem[];
}

export type SidebarEntry = SidebarMenuItem | SidebarMenuGroup;

function isGroup(entry: SidebarEntry): entry is SidebarMenuGroup {
  return "children" in entry;
}

/* ------------------------------------------------------------------ */
/*  Shared nav list (used in expanded desktop + mobile sheet)          */
/* ------------------------------------------------------------------ */

function SidebarNav({
  items,
  expandedGroups,
  onToggleGroup,
  onNavigate,
}: {
  items: SidebarEntry[];
  expandedGroups: Record<string, boolean>;
  onToggleGroup: (label: string) => void;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav className="flex-1 overflow-y-auto no-scrollbar py-2">
      {items.map((entry) => {
        if (!isGroup(entry)) {
          const active = pathname === entry.href;
          return (
            <Link
              key={entry.href}
              href={entry.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 px-4 py-2.5 text-sm font-medium transition-colors rounded-md mx-2 mb-0.5",
                active
                  ? "bg-blue-500/15 text-cyan-400"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
              )}
            >
              {entry.icon}
              {entry.label}
            </Link>
          );
        }

        const isOpen = expandedGroups[entry.label] ?? false;
        const isGroupActive = entry.children.some((c) =>
          pathname.startsWith(c.href)
        );

        return (
          <div key={entry.label} className="mb-0.5">
            <button
              onClick={() => onToggleGroup(entry.label)}
              className={cn(
                "flex items-center gap-3 w-full px-4 py-2.5 text-sm font-medium transition-colors rounded-md mx-2 text-left",
                isGroupActive
                  ? "text-cyan-400"
                  : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200"
              )}
              style={{ width: "calc(100% - 16px)" }}
            >
              {entry.icon}
              <span className="flex-1">{entry.label}</span>
              {isOpen ? (
                <ChevronDown className="w-4 h-4 opacity-50" />
              ) : (
                <ChevronRight className="w-4 h-4 opacity-50" />
              )}
            </button>

            {isOpen && (
              <div className="ml-4 border-l border-slate-800/60 pl-2 mb-1">
                {entry.children.map((child) => {
                  const active = pathname.startsWith(child.href);
                  return (
                    <Link
                      key={child.href}
                      href={child.href}
                      onClick={onNavigate}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2 text-sm transition-colors rounded-md mx-2 mb-0.5",
                        active
                          ? "bg-blue-500/15 text-cyan-400 font-medium"
                          : "text-slate-500 hover:bg-slate-800/60 hover:text-slate-200"
                      )}
                    >
                      {child.icon}
                      {child.label}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}

/* ------------------------------------------------------------------ */
/*  Collapsed icon strip (desktop only)                                */
/* ------------------------------------------------------------------ */

function CollapsedIcons({
  items,
  onClickItem,
}: {
  items: SidebarEntry[];
  onClickItem: (entry: SidebarEntry) => void;
}) {
  const pathname = usePathname();

  return (
    <div className="flex flex-col items-center py-3 gap-1">
      <TooltipProvider delayDuration={0}>
        {items.map((entry) => {
          const isActive = isGroup(entry)
            ? entry.children.some((c) => pathname.startsWith(c.href))
            : pathname === entry.href;

          if (isGroup(entry)) {
            return (
              <Tooltip key={entry.label}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onClickItem(entry)}
                    className={cn(
                      "flex items-center justify-center w-10 h-10 rounded-lg transition-colors",
                      isActive
                        ? "bg-blue-500/15 text-cyan-400"
                        : "text-slate-500 hover:bg-slate-800/60 hover:text-slate-200"
                    )}
                  >
                    {entry.icon}
                  </button>
                </TooltipTrigger>
                <TooltipContent
                  side="right"
                  className="bg-[#0B1120] text-blue-100 border-blue-900/30"
                >
                  {entry.label}
                </TooltipContent>
              </Tooltip>
            );
          }

          return (
            <Tooltip key={entry.label}>
              <TooltipTrigger asChild>
                <Link
                  href={entry.href}
                  onClick={() => onClickItem(entry)}
                  className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-lg transition-colors",
                    isActive
                      ? "bg-blue-500/15 text-cyan-400"
                      : "text-slate-500 hover:bg-slate-800/60 hover:text-slate-200"
                  )}
                >
                  {entry.icon}
                </Link>
              </TooltipTrigger>
              <TooltipContent
                side="right"
                className="bg-[#0B1120] text-blue-100 border-blue-900/30"
              >
                {entry.label}
              </TooltipContent>
            </Tooltip>
          );
        })}
      </TooltipProvider>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main AppSidebar export                                             */
/* ------------------------------------------------------------------ */

export function AppSidebar({
  title,
  items,
  collapsed,
  expandedGroups,
  mobileOpen,
  onCollapse,
  onExpandFromIcon,
  onToggleGroup,
  onMobileOpenChange,
}: {
  title: string;
  items: SidebarEntry[];
  collapsed: boolean;
  expandedGroups: Record<string, boolean>;
  mobileOpen: boolean;
  onCollapse: () => void;
  onExpandFromIcon: (entry: SidebarEntry) => void;
  onToggleGroup: (label: string) => void;
  onMobileOpenChange: (open: boolean) => void;
}) {
  return (
    <>
      {/* ---- Desktop sidebar ---- */}
      <aside
        className={cn(
          "hidden md:flex flex-col border-r border-blue-900/30 bg-[#0B1120] transition-all duration-300 shrink-0 overflow-hidden",
          collapsed ? "w-20" : "w-65"
        )}
      >
        {collapsed ? (
          <CollapsedIcons items={items} onClickItem={onExpandFromIcon} />
        ) : (
          <>
            <div className="flex items-center justify-between px-4 py-3 border-b border-blue-900/30 shrink-0">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500 whitespace-nowrap">
                {title}
              </span>
              <button
                onClick={onCollapse}
                className="p-1 rounded-md text-slate-500 hover:text-white hover:bg-slate-800 transition-colors"
                title="Collapse sidebar"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
            <SidebarNav
              items={items}
              expandedGroups={expandedGroups}
              onToggleGroup={onToggleGroup}
            />
          </>
        )}
      </aside>

      {/* ---- Mobile Sheet sidebar ---- */}
      <div className="md:hidden">
        <Sheet open={mobileOpen} onOpenChange={onMobileOpenChange}>
          <SheetContent side="left" className="pt-12">
            <div className="px-4 pb-3 border-b border-blue-900/30">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-500">
                {title}
              </span>
            </div>
            <SidebarNav
              items={items}
              expandedGroups={expandedGroups}
              onToggleGroup={onToggleGroup}
              onNavigate={() => onMobileOpenChange(false)}
            />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
