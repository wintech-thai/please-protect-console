"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { keepPreviousData } from "@tanstack/react-query";
import {
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
  MoreHorizontal,
  Plus,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useConfirm } from "@/hooks/use-confirm";
import {
  useAlertChannels,
  useEnableAlertChannel,
  useDisableAlertChannel,
  useDeleteAlertChannel,
} from "../hooks/use-alert-channel";
import type { AlertChannel } from "../api/alert-channel.api";
import { toast } from "sonner";
import Link from "next/link";
import { useSelectedRowStore } from "@/lib/selected-row-store";
import { useLanguage } from "@/context/LanguageContext";
import { alertChannelDict } from "../alert-channel.dict";

export default function AlertChannelView() {
  const router = useRouter();
  const { language } = useLanguage();
  const t = alertChannelDict[language as keyof typeof alertChannelDict] || alertChannelDict.EN;

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const { selectedId, setSelectedId } = useSelectedRowStore("alerts");

  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(25);

  const [searchTerm, setSearchTerm] = useState("");
  const [activeSearch, setActiveSearch] = useState("");

  const rowRefs = useRef<{ [key: string]: HTMLTableRowElement | null }>({});

  // Confirmation dialogs using use-confirm hook
  const [EnableConfirmDialog, confirmEnable] = useConfirm({
    title: t.confirm.enableTitle,
    message: t.confirm.enableMessage,
    variant: "default",
    confirmButton: t.buttons.confirm,
    cancelButton: t.buttons.cancel,
  });

  const [DisableConfirmDialog, confirmDisable] = useConfirm({
    title: t.confirm.disableTitle,
    message: t.confirm.disableMessage,
    variant: "destructive",
    confirmButton: t.buttons.confirm,
    cancelButton: t.buttons.cancel,
  });

  const [DeleteConfirmDialog, confirmDelete] = useConfirm({
    title: t.confirm.deleteTitle,
    message: t.confirm.deleteMessage,
    variant: "destructive",
    confirmButton: t.buttons.confirm,
    cancelButton: t.buttons.cancel,
  });

  // Query hooks
  const { data: channelsData, isLoading: isQueryLoading } = useAlertChannels({
    fullTextSearch: activeSearch,
  }, {
    placeholderData: keepPreviousData
  });

  const enableMutation = useEnableAlertChannel();
  const disableMutation = useDisableAlertChannel();
  const deleteMutation = useDeleteAlertChannel();

  const handleSearchTrigger = () => {
    setPage(1);
    setActiveSearch(searchTerm);
  };

  const handleEnableChannel = async (channelId: string) => {
    try {
      await enableMutation.mutateAsync(channelId);
      toast.success(t.toast.enableSuccess);
    } catch (error: unknown) {
      console.error(error);
      const errorMsg = error instanceof Error ? error.message : t.toast.enableError;
      toast.error(errorMsg);
    }
  };

  const handleDisableChannel = async (channelId: string) => {
    try {
      await disableMutation.mutateAsync(channelId);
      toast.success(t.toast.disableSuccess);
    } catch (error: unknown) {
      console.error(error);
      const errorMsg = error instanceof Error ? error.message : t.toast.disableError;
      toast.error(errorMsg);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    try {
      const ok = await confirmDelete();
      if (!ok) return;
      await Promise.all(selectedIds.map(id => deleteMutation.mutateAsync(id)));
      toast.success(t.toast.deleteSuccess.replace("{count}", selectedIds.length.toString()));
      setSelectedIds([]);
    } catch (error: unknown) {
      console.error(error);
      const errorMsg = error instanceof Error ? error.message : t.toast.deleteError;
      toast.error(errorMsg);
    }
  };

  const handleEnableClick = async (channel: AlertChannel) => {
    try {
     const ok = await confirmEnable();

      if (!ok) return;

      await handleEnableChannel(channel.id);

    } catch (error: unknown) {
      console.error(error);
      const errorMsg = error instanceof Error ? error.message : t.toast.enableError;
      toast.error(errorMsg);
    }
  };

  const handleDisableClick = async (channel: AlertChannel) => {
    try {
      const ok = await confirmDisable();

      if (!ok) return;

      await handleDisableChannel(channel.id);

    } catch (error: unknown) {
      console.error(error);
      const errorMsg = error instanceof Error ? error.message : t.toast.disableError;
      toast.error(errorMsg);
    }
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) setSelectedIds(channels.map(c => c.id));
    else setSelectedIds([]);
  };

  const handleSelectOne = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const renderTags = (tags: string) => {
    if (!tags || tags.trim() === "") return <span className="text-slate-600">-</span>;
    const tagArray = tags.split(',').map((tag: string) => tag.trim()).filter((tag: string) => tag !== "");
    return (
      <div className="flex flex-wrap gap-1">
        {tagArray.map((tag: string, idx: number) => (
          <span key={idx} className="bg-blue-600 px-2 py-1 rounded-md text-[10px] font-semibold text-white">
            {tag}
          </span>
        ))}
      </div>
    );
  };

  const channels = Array.isArray(channelsData) ? channelsData : [];
  const totalCount = channels.length;
  const totalPages = Math.ceil(totalCount / itemsPerPage);
  const startRow = totalCount === 0 ? 0 : (page - 1) * itemsPerPage + 1;
  const endRow = Math.min(page * itemsPerPage, totalCount);

  // Pagination logic for display
  const paginatedChannels = channels.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-4 duration-500 text-slate-200 relative font-sans">
      {/* Confirmation Dialogs */}
      <EnableConfirmDialog />
      <DisableConfirmDialog />
      <DeleteConfirmDialog />

      {/* Header */}
      <div className="flex-none pt-6 px-4 md:px-6 mb-2">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">{t.title}</h1>
            <p className="text-slate-400 text-xs md:text-sm">{t.subHeader}</p>
          </div>
        </div>
      </div>

      {/* Search and Add Button */}
      <div className="flex-none py-4">
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center bg-slate-900/50 p-4 rounded-xl border border-slate-800 shadow-sm">
          <div className="flex flex-col sm:flex-row w-full lg:w-auto gap-2">
            <div className="relative w-full sm:w-auto lg:min-w-[300px]">
              <Input
                type="text"
                placeholder={t.searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSearchTrigger()}
                className="bg-slate-950 border-slate-700 text-slate-200 text-sm placeholder:text-slate-600"
              />
            </div>
            <Button
              onClick={handleSearchTrigger}
              variant="default"
              className="w-full sm:w-auto h-10 bg-blue-600 hover:bg-blue-500"
            >
              <Search className="size-4" />
            </Button>
          </div>

          <div className="flex gap-2 w-full lg:w-auto justify-end">
            <Button
              onClick={handleBulkDelete}
              disabled={selectedIds.length === 0}
              className="flex-1 lg:flex-none justify-center px-6 py-2.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/50 text-sm font-semibold rounded-lg uppercase transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            >
              {t.buttons.delete}
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="flex-1 lg:flex-none justify-center px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold rounded-lg uppercase transition-all">
                  <Plus className="w-4 h-4 mr-2" />
                  {t.buttons.add}
                  <ChevronDown className="w-4 h-4 ml-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800 text-slate-200 min-w-[180px]">
                <DropdownMenuItem
                  onClick={() => router.push("/system/notifications/alerts-channels/create?type=Discord")}
                  className="cursor-pointer hover:bg-slate-800"
                >
                  {t.buttons.discord}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-hidden flex flex-col min-h-0">
        <div className="flex-1 bg-slate-900 border border-slate-800 rounded-t-xl shadow-2xl overflow-hidden flex flex-col">
          <div className="flex-1 overflow-auto no-scrollbar">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead className="bg-slate-950 sticky top-0 z-10 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                <tr>
                  <th className="p-4 border-b border-slate-800 w-[50px]">
                    <input
                      type="checkbox"
                      onChange={handleSelectAll}
                      checked={paginatedChannels.length > 0 && selectedIds.length === paginatedChannels.length}
                      className="rounded border-slate-700 bg-slate-950"
                    />
                  </th>
                  <th className="p-4 border-b border-slate-800">{t.columns.channelName}</th>
                  <th className="p-4 border-b border-slate-800">{t.columns.description}</th>
                  <th className="p-4 border-b border-slate-800">{t.columns.tags}</th>
                  <th className="p-4 border-b border-slate-800">{t.columns.type}</th>
                  <th className="p-4 border-b border-slate-800">{t.columns.status}</th>
                  <th className="p-4 border-b border-slate-800 text-center">{t.columns.action}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {isQueryLoading ? (
                  <tr>
                    <td colSpan={7} className="p-20 text-center">
                      <div className="flex flex-col items-center gap-3">
                        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                        <span className="text-slate-500">{t.loading}</span>
                      </div>
                    </td>
                  </tr>
                ) : paginatedChannels.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-20 text-center text-slate-500">{t.noData}</td>
                    </tr>
                  ) : (
                    paginatedChannels.map((channel, idx) => {
                      const isHighlighted = selectedId === channel.id;
                      const isEnabled = channel.status === "Enabled";

                      return (
                        <tr
                          key={channel.id || idx}
                          ref={(el) => { if (el) rowRefs.current[channel.id] = el; }}
                          className={`transition-all duration-300 group text-sm cursor-pointer border-b border-slate-800/50
                            ${isHighlighted
                              ? "bg-blue-500/10 border-l-4 border-l-blue-500 pl-[12px]"
                              : "hover:bg-slate-800/40 border-l-4 border-l-transparent pl-[12px]"
                            }
                          `}
                          onClick={() => setSelectedId(channel.id)}
                        >
                          <td className="p-4">
                            <input
                              type="checkbox"
                              checked={selectedIds.includes(channel.id)}
                              onChange={() => handleSelectOne(channel.id)}
                              className="rounded border-slate-700 bg-slate-950"
                            />
                          </td>

                          <td className="p-4 font-medium text-slate-200 underline">
                            <Link href={`/system/notifications/alerts-channels/${channel.id}/update`} className="block w-full h-full">
                              {channel.channelName || "-"}
                            </Link>
                          </td>

                          <td className="p-4 text-slate-300 max-w-[250px] truncate">
                            {channel.description || "-"}
                          </td>

                          <td className="p-4">
                            {renderTags(channel.tags)}
                          </td>

                          <td className="p-4 text-slate-300">
                            {channel.type || "-"}
                          </td>

                          <td className="p-4 font-medium">
                            <span className={isEnabled ? "text-green-400" : "text-slate-500"}>
                              {isEnabled ? t.status.enabled : t.status.disabled}
                            </span>
                          </td>

                          <td className="p-4 text-center">
                            <DropdownMenu modal={false}>
                              <DropdownMenuTrigger asChild>
                                <button className="p-1.5 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors border border-transparent hover:border-slate-700">
                                  <MoreHorizontal className="w-4 h-4" />
                                </button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800 text-slate-200 min-w-[160px]">
                                {isEnabled ? (
                                  <DropdownMenuItem
                                    onClick={() => handleDisableClick(channel)}
                                    className="cursor-pointer focus:bg-slate-800 focus:text-red-400 text-red-400"
                                  >
                                    {t.buttons.disable}
                                  </DropdownMenuItem>
                                ) : (
                                  <DropdownMenuItem
                                    onClick={() => handleEnableClick(channel)}
                                    className="cursor-pointer focus:bg-slate-800 focus:text-green-400 text-green-400"
                                  >
                                    {t.buttons.enable}
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex-none flex items-center justify-between sm:justify-end px-4 py-3 border-t border-slate-800 bg-slate-950 z-20 gap-4 sm:gap-6">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <span>{t.rowsPerPage}</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => { setItemsPerPage(Number(e.target.value)); setPage(1); }}
                  className="bg-transparent border-none text-slate-200 focus:ring-0 cursor-pointer font-medium"
                >
                  <option value={25} className="bg-slate-900">25</option>
                  <option value={50} className="bg-slate-900">50</option>
                  <option value={100} className="bg-slate-900">100</option>
                </select>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-xs text-slate-400">{totalCount === 0 ? '0-0' : `${startRow}-${endRow}`} {t.of} {totalCount}</div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-1.5 rounded hover:bg-slate-800 text-slate-400 disabled:opacity-30 transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages || totalPages === 0}
                    className="p-1.5 rounded hover:bg-slate-800 text-slate-400 disabled:opacity-30 transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
