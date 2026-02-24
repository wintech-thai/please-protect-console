"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight, Hash, Globe, Clock, Type, X, Plus, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export function Layer3Sidebar({ isOpen }: { isOpen: boolean }) {
  if (!isOpen) return null;

  const sections = [
    { title: "Selected Fields", fields: [
      { name: "@timestamp", icon: <Clock size={12} /> },
      { name: "source.ip", icon: <Globe size={12} /> },
      { name: "destination.ip", icon: <Globe size={12} /> },
    ]},
    { title: "Popular Fields", fields: [
      { name: "network.protocol", icon: <Type size={12} /> },
    ]},
    { title: "Available Fields", fields: [
      { name: "community_id", icon: <Hash size={12} /> },
      { name: "source.port", icon: <Hash size={12} /> },
      { name: "destination.port", icon: <Hash size={12} /> },
    ]}
  ];

  return (
    <div className="flex flex-col h-full bg-[#0B1120] select-none">
      <div className="p-4 border-b border-slate-800 bg-slate-900/20">
        <div className="relative group">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-600 group-focus-within:text-blue-500" />
          <input 
            type="text" 
            placeholder="Search field names" 
            className="w-full bg-slate-950 border border-slate-800 rounded py-1.5 pl-9 pr-3 text-[11px] focus:outline-none focus:border-blue-500/50 transition-all"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar pb-10">
        {sections.map((section) => (
          <div key={section.title} className="border-b border-slate-800/50 last:border-0">
            <div className="px-4 py-3 flex items-center justify-between hover:bg-slate-900/50 cursor-pointer">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                <ChevronDown size={12} /> {section.title} <span className="text-[9px] opacity-50">({section.fields.length})</span>
              </span>
            </div>
            <div className="py-1">
              {section.fields.map(field => (
                <div key={field.name} className="group flex items-center gap-3 px-4 py-1.5 hover:bg-blue-500/10 cursor-pointer transition-colors">
                  <div className="text-slate-600 group-hover:text-blue-400">{field.icon}</div>
                  <span className="text-xs text-slate-400 group-hover:text-slate-200 flex-1 truncate">{field.name}</span>
                  {section.title === "Selected Fields" ? (
                    <X size={12} className="text-orange-500 opacity-0 group-hover:opacity-100" />
                  ) : (
                    <Plus size={12} className="text-blue-500 opacity-0 group-hover:opacity-100" />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}