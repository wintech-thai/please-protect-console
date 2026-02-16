import { Search, X, Plus, Loader2 } from "lucide-react";
import { getFieldIcon } from "./constants";

interface SidebarProps {
  isOpen: boolean;
  search: string;
  onSearchChange: (val: string) => void;
  selectedFields: string[];
  availableFields: string[];
  expandedField: string | null;
  fieldStats: Record<string, any>;
  isLoadingStats: boolean;
  onToggleField: (field: string) => void; // สำหรับ Expand ดู Stats
  onSelectField: (field: string) => void; // สำหรับเลือกเข้า/ออก ตาราง
}

export function Layer7Sidebar({
  isOpen,
  search,
  onSearchChange,
  selectedFields,
  availableFields,
  expandedField,
  fieldStats,
  isLoadingStats,
  onToggleField,
  onSelectField,
}: SidebarProps) {
  return (
    <div className={`${isOpen ? "w-[280px]" : "w-0"} transition-all duration-200 border-r border-[#343741] bg-[#1b1d21] flex flex-col overflow-hidden`}>
      <div className="p-4 border-b border-[#343741]">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#535966]" />
          <input
            type="text"
            className="w-full bg-[#16171c] border border-[#343741] rounded-md py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#0077cc] focus:border-transparent text-[#dfe5ef]"
            placeholder="Search field names"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        {/* Selected Fields */}
        <FieldSection
          title="Selected fields"
          count={selectedFields.filter((f) => f !== "actions").length}
          fields={selectedFields.filter((f) => f !== "actions")}
          icon={<X className="w-3.5 h-3.5 text-[#98a2b3] hover:text-white" />}
          expandedField={expandedField}
          fieldStats={fieldStats}
          isLoadingStats={isLoadingStats}
          onToggleField={onToggleField}
          onSelectField={onSelectField}
        />

        {/* Available Fields */}
        <FieldSection
          title="Available fields"
          count={availableFields.length}
          fields={availableFields}
          icon={<Plus className="w-3.5 h-3.5 text-[#0077cc]" />}
          expandedField={expandedField}
          fieldStats={fieldStats}
          isLoadingStats={isLoadingStats}
          onToggleField={onToggleField}
          onSelectField={onSelectField}
        />
      </div>
    </div>
  );
}

// Sub-component 
function FieldSection({ title, count, fields, icon, expandedField, fieldStats, isLoadingStats, onToggleField, onSelectField }: any) {
  return (
    <div>
      <div className="px-4 py-3 flex items-center justify-between bg-[#1b1d21] sticky top-0 z-10 border-b border-[#343741]">
        <span className="text-sm font-semibold text-[#98a2b3] flex items-center gap-2">
          {title}
          <span className="text-xs bg-[#0077cc] text-white px-2 py-0.5 rounded-full font-medium">{count}</span>
        </span>
      </div>
      <div className="py-1">
        {fields.map((field: string) => (
          <div key={field} className="group">
            <div
              className={`flex items-center gap-2.5 px-4 py-2 hover:bg-[#25282f] cursor-pointer transition-colors ${expandedField === field ? "bg-[#25282f]" : ""}`}
              onClick={() => onToggleField(field)}
            >
              <div className="text-[#69707d]">{getFieldIcon(field)}</div>
              <span className="text-sm truncate flex-1 text-[#dfe5ef] font-medium">{field}</span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectField(field);
                }}
                className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-[#343741] rounded"
              >
                {icon}
              </button>
            </div>
            {expandedField === field && (
              <div className="px-4 pb-3 pt-1 bg-[#14151b] border-t border-[#343741]">
                {isLoadingStats ? (
                  <div className="flex justify-center py-3"><Loader2 className="w-4 h-4 animate-spin text-[#0077cc]" /></div>
                ) : (
                  <div className="space-y-2 mt-2">
                    {field === "@timestamp" ? (
                      <div className="text-xs text-[#98a2b3] italic">Date field</div>
                    ) : (
                      fieldStats[field]?.buckets?.slice(0, 5).map((bucket: any, idx: number) => {
                        const percentage = Math.round((bucket.doc_count / (fieldStats[field].total || 1)) * 100);
                        return (
                          <div key={idx} className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-[#dfe5ef] truncate max-w-[160px] font-medium">{bucket.key}</span>
                              <span className="text-[#98a2b3]">{percentage}%</span>
                            </div>
                            <div className="h-1 w-full bg-[#343741] rounded-sm overflow-hidden">
                              <div className="h-full bg-[#54b399]" style={{ width: `${percentage}%` }}></div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}