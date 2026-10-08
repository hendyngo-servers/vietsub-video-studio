import React, { useState, useMemo } from "react";
import {
  Terminal,
  Network,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  Trash2,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Download,
  Search,
  Filter,
} from "lucide-react";
import { SystemLogEntry, LogSeverity, SubsystemType } from "../types/logs";

interface SystemLogsTableProps {
  logs: SystemLogEntry[];
  onClearLogs: () => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
  onOpenArchitecture?: () => void;
}

export const SystemLogsTable: React.FC<SystemLogsTableProps> = ({
  logs,
  onClearLogs,
  isExpanded = true,
  onToggleExpand,
  onOpenArchitecture,
}) => {
  const [selectedSeverity, setSelectedSeverity] = useState<string>("all");
  const [selectedSubsystem, setSelectedSubsystem] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Statistics
  const stats = useMemo(() => {
    let errorCount = 0;
    let warnCount = 0;
    let infoCount = 0;
    let successCount = 0;

    for (const log of logs) {
      if (log.severity === "error") errorCount++;
      else if (log.severity === "warn") warnCount++;
      else if (log.severity === "info") infoCount++;
      else if (log.severity === "success") successCount++;
    }

    return { total: logs.length, errorCount, warnCount, infoCount, successCount };
  }, [logs]);

  // Filtered logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (selectedSeverity !== "all" && log.severity !== selectedSeverity) {
        return false;
      }
      if (selectedSubsystem !== "all" && log.subsystem !== selectedSubsystem) {
        return false;
      }
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchMsg = log.message.toLowerCase().includes(query);
        const matchDetails = log.details?.toLowerCase().includes(query);
        const matchSub = log.subsystem.toLowerCase().includes(query);
        if (!matchMsg && !matchDetails && !matchSub) return false;
      }
      return true;
    });
  }, [logs, selectedSeverity, selectedSubsystem, searchQuery]);

  const handleCopyLog = (log: SystemLogEntry) => {
    const text = `[${log.timestamp}] [${log.severity.toUpperCase()}] [${log.subsystem}] ${log.message}${
      log.details ? `\nDetails: ${log.details}` : ""
    }`;
    navigator.clipboard.writeText(text);
    setCopiedId(log.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportJson = () => {
    const dataStr = JSON.stringify(logs, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `system-logs-${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getSeverityBadge = (severity: LogSeverity) => {
    switch (severity) {
      case "error":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/25">
            <AlertCircle className="w-3 h-3 text-rose-400 shrink-0" />
            ERROR
          </span>
        );
      case "warn":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/25">
            <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
            WARN
          </span>
        );
      case "success":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/25">
            <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
            OK
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-500/15 text-blue-400 border border-blue-500/25">
            <Info className="w-3 h-3 text-blue-400 shrink-0" />
            INFO
          </span>
        );
    }
  };

  const getSubsystemBadge = (subsystem: SubsystemType) => {
    const colors: Record<SubsystemType, string> = {
      GEMINI_AI: "text-purple-300 bg-purple-900/30 border-purple-500/30",
      AUDIO_ENGINE: "text-amber-300 bg-amber-900/30 border-amber-500/30",
      CANVAS_RENDERER: "text-cyan-300 bg-cyan-900/30 border-cyan-500/30",
      CLOUDFLARE_AI: "text-orange-300 bg-orange-900/30 border-orange-500/30",
      UI: "text-slate-300 bg-slate-800/60 border-slate-700/50",
    };

    return (
      <span
        className={`px-2 py-0.5 rounded font-mono text-[10px] font-medium border ${
          colors[subsystem] || "text-slate-400 bg-slate-800 border-slate-700"
        }`}
      >
        {subsystem}
      </span>
    );
  };

  return (
    <div className="glass-panel rounded-2xl overflow-hidden border border-white/[0.08] flex flex-col shadow-xl">
      {/* Table Header / Action Toolbar */}
      <div className="p-3.5 sm:p-4 border-b border-white/[0.08] flex flex-wrap items-center justify-between gap-3 bg-slate-900/40">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0 border border-purple-500/30 shadow-xs">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-sm text-white flex items-center gap-1.5">
                System Logs & Telemetry
              </h3>
              {stats.errorCount > 0 ? (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  {stats.errorCount} lỗi
                </span>
              ) : (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Ổn định
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Theo dõi chi tiết lỗi API Gemini, âm thanh, Web Video và kết nối hệ thống thời gian thực.
            </p>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-2">
          {/* Quick summary counts */}
          <div className="hidden md:flex items-center gap-1 text-[11px] text-slate-400 bg-black/40 px-2.5 py-1 rounded-lg border border-white/5 font-mono tabular-nums">
            <span className="text-slate-300">Tổng: {stats.total}</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="text-rose-400 font-semibold">{stats.errorCount} Lỗi</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="text-amber-400">{stats.warnCount} Cảnh báo</span>
          </div>

          {onOpenArchitecture && (
            <button
              onClick={onOpenArchitecture}
              className="p-1.5 rounded-lg bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 transition text-xs flex items-center gap-1"
              title="Xem sơ đồ kiến trúc hệ thống tổng quan"
            >
              <Network className="w-3.5 h-3.5 text-indigo-400" />
              <span className="hidden sm:inline">Kiến Trúc</span>
            </button>
          )}

          <button
            onClick={handleExportJson}
            disabled={logs.length === 0}
            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/5 disabled:opacity-40 transition text-xs flex items-center gap-1"
            title="Tải tệp JSON nhật ký"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Xuất JSON</span>
          </button>

          <button
            onClick={onClearLogs}
            disabled={logs.length === 0}
            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 disabled:opacity-40 transition text-xs flex items-center gap-1"
            title="Xóa tất cả nhật ký"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Xóa</span>
          </button>

          {onToggleExpand && (
            <button
              onClick={onToggleExpand}
              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition"
              title={isExpanded ? "Thu gọn bảng log" : "Mở rộng bảng log"}
            >
              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {isExpanded && (
        <>
          {/* Filter Bar */}
          <div className="px-3.5 py-2.5 border-b border-white/[0.06] bg-black/30 flex flex-wrap items-center justify-between gap-2.5 text-xs">
            {/* Search Input */}
            <div className="relative flex-1 min-w-[180px] max-w-xs">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Tìm kiếm log, thông điệp, mã lỗi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-2.5 py-1 rounded-lg bg-slate-900/80 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
              />
            </div>

            {/* Severity Filter Buttons */}
            <div className="flex items-center gap-1 bg-black/40 p-0.5 rounded-lg border border-white/5 text-[11px]">
              <button
                onClick={() => setSelectedSeverity("all")}
                className={`px-2 py-0.5 rounded transition ${
                  selectedSeverity === "all" ? "bg-white/10 text-white font-medium" : "text-slate-400 hover:text-white"
                }`}
              >
                Tất cả ({logs.length})
              </button>
              <button
                onClick={() => setSelectedSeverity("error")}
                className={`px-2 py-0.5 rounded transition ${
                  selectedSeverity === "error"
                    ? "bg-rose-500/20 text-rose-300 font-medium"
                    : "text-slate-400 hover:text-rose-400"
                }`}
              >
                Lỗi ({stats.errorCount})
              </button>
              <button
                onClick={() => setSelectedSeverity("warn")}
                className={`px-2 py-0.5 rounded transition ${
                  selectedSeverity === "warn"
                    ? "bg-amber-500/20 text-amber-300 font-medium"
                    : "text-slate-400 hover:text-amber-400"
                }`}
              >
                Cảnh báo ({stats.warnCount})
              </button>
              <button
                onClick={() => setSelectedSeverity("info")}
                className={`px-2 py-0.5 rounded transition ${
                  selectedSeverity === "info"
                    ? "bg-blue-500/20 text-blue-300 font-medium"
                    : "text-slate-400 hover:text-blue-400"
                }`}
              >
                Info ({stats.infoCount + stats.successCount})
              </button>
            </div>

            {/* Subsystem Filter Dropdown */}
            <div className="flex items-center gap-1.5 text-slate-400">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedSubsystem}
                onChange={(e) => setSelectedSubsystem(e.target.value)}
                className="bg-slate-900 border border-white/10 rounded-lg px-2 py-1 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
              >
                <option value="all">Tất cả phân hệ</option>
                <option value="GEMINI_AI">Gemini AI</option>
                <option value="AUDIO_ENGINE">Audio Engine</option>
                <option value="CANVAS_RENDERER">Canvas Renderer</option>
                <option value="UI">UI / Client</option>
                <option value="CLOUDFLARE_AI">Cloudflare AI</option>
              </select>
            </div>
          </div>

          {/* Table Body */}
          <div className="overflow-x-auto max-h-[340px] overflow-y-auto">
            {filteredLogs.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <CheckCircle2 className="w-8 h-8 text-emerald-500/40 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-300">Không có nhật ký phù hợp</p>
                <p className="text-xs text-slate-500 mt-1">
                  Hệ thống đang vận hành danh mục này mà không phát sinh cảnh báo hoặc lỗi.
                </p>
              </div>
            ) : (
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-black/40 text-slate-400 text-[11px] uppercase tracking-wider sticky top-0 z-10 backdrop-blur-md">
                    <th className="py-2 px-3 w-28">Thời Gian</th>
                    <th className="py-2 px-3 w-24">Mức Độ</th>
                    <th className="py-2 px-3 w-36">Phân Hệ</th>
                    <th className="py-2 px-3">Chi Tiết Sự Kiện & Lỗi</th>
                    <th className="py-2 px-3 text-right w-20">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 font-sans">
                  {filteredLogs.map((log) => {
                    const isExpandedRow = expandedLogId === log.id;
                    return (
                      <React.Fragment key={log.id}>
                        <tr
                          className={`hover:bg-white/[0.04] transition cursor-pointer ${
                            log.severity === "error" ? "bg-rose-950/10" : ""
                          }`}
                          onClick={() => setExpandedLogId(isExpandedRow ? null : log.id)}
                        >
                          {/* Timestamp */}
                          <td className="py-2.5 px-3 font-mono text-[11px] text-slate-400 whitespace-nowrap tabular-nums">
                            {log.timestamp}
                          </td>

                          {/* Severity */}
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            {getSeverityBadge(log.severity)}
                          </td>

                          {/* Subsystem */}
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            {getSubsystemBadge(log.subsystem)}
                          </td>

                          {/* Message */}
                          <td className="py-2.5 px-3 text-slate-200">
                            <div className="font-medium truncate max-w-xl">
                              {log.message}
                            </div>
                            {log.details && !isExpandedRow && (
                              <div className="text-[11px] text-slate-400 font-mono truncate max-w-xl mt-0.5">
                                {log.details}
                              </div>
                            )}
                          </td>

                          {/* Copy / Actions */}
                          <td
                            className="py-2.5 px-3 text-right"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleCopyLog(log)}
                                className="p-1 rounded hover:bg-white/10 text-slate-400 hover:text-white transition"
                                title="Sao chép dòng log"
                              >
                                {copiedId === log.id ? (
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                ) : (
                                  <Copy className="w-3.5 h-3.5" />
                                )}
                              </button>
                            </div>
                          </td>
                        </tr>

                        {/* Expanded details view */}
                        {isExpandedRow && log.details && (
                          <tr className="bg-black/60 border-b border-white/5">
                            <td colSpan={5} className="p-3">
                              <div className="p-2.5 rounded-lg bg-slate-950 border border-white/10 font-mono text-[11px] text-slate-300 overflow-x-auto whitespace-pre-wrap select-text">
                                <div className="text-slate-400 font-bold mb-1 text-[10px] uppercase tracking-wider">
                                  Technical Diagnostic Details:
                                </div>
                                {log.details}
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
};
export default SystemLogsTable;
