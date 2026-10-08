import React, { useState, useRef, useEffect, useMemo } from "react";
import {
  Plus,
  Trash2,
  Clock,
  Search,
  ArrowDownNarrowWide,
  Check,
  ChevronDown,
  Sparkles,
  MoveRight,
  RotateCcw,
  GitMerge,
  Volume2,
  Users,
} from "lucide-react";
import { SubtitleCue, SpeakerVoicePersona } from "../types";
import { formatSecondsToDisplay, formatSecondsToSrtTime } from "../utils/subtitleFormatters";
import {
  previewVoice,
  stopVoicePreview,
  previewSpeakerPersona,
  getPersonaInfo,
  SPEAKER_PERSONAS,
} from "../utils/voiceoverEngine";

interface SubtitleListProps {
  cues: SubtitleCue[];
  currentTime: number;
  onSelectCue: (time: number) => void;
  onUpdateCue: (updatedCue: SubtitleCue) => void;
  onDeleteCue: (id: number) => void;
  onAddCue: (atTime?: number) => void;
  onShiftAllCues: (offsetSeconds: number) => void;
  onOpenRefineModal: () => void;
  onSaveEdits?: () => void;
  onMergeCues?: (firstCueId: number, secondCueId: number) => void;
  onOpenVoiceoverModal?: () => void;
  onDetectSpeakers?: () => void;
  isDetectingSpeakers?: boolean;
}

export const SubtitleList: React.FC<SubtitleListProps> = ({
  cues,
  currentTime,
  onSelectCue,
  onUpdateCue,
  onDeleteCue,
  onAddCue,
  onShiftAllCues,
  onOpenRefineModal,
  onSaveEdits,
  onMergeCues,
  onOpenVoiceoverModal,
  onDetectSpeakers,
  isDetectingSpeakers,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [autoScroll, setAutoScroll] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [timeShiftVal, setTimeShiftVal] = useState<number>(0.2);
  const [showShiftDropdown, setShowShiftDropdown] = useState(false);
  const [selectedCueIds, setSelectedCueIds] = useState<number[]>([]);
  const [activePlayingCueId, setActivePlayingCueId] = useState<number | null>(null);

  const activeCardRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Toggle selection of a cue for merging
  const handleToggleSelectCue = (cueId: number) => {
    setSelectedCueIds((prev) => {
      if (prev.includes(cueId)) {
        return prev.filter((id) => id !== cueId);
      }
      if (prev.length >= 2) {
        return [cueId];
      }
      return [...prev, cueId];
    });
  };

  // Analyze selected cues to determine if they are adjacent
  const selectedCuesAnalysis = useMemo(() => {
    if (selectedCueIds.length !== 2) {
      return {
        isAdjacent: false,
        firstCue: null as SubtitleCue | null,
        secondCue: null as SubtitleCue | null,
        firstIndex: -1,
        secondIndex: -1,
      };
    }

    const idx0 = cues.findIndex((c) => c.id === selectedCueIds[0]);
    const idx1 = cues.findIndex((c) => c.id === selectedCueIds[1]);

    if (idx0 === -1 || idx1 === -1) {
      return { isAdjacent: false, firstCue: null, secondCue: null, firstIndex: -1, secondIndex: -1 };
    }

    const firstIndex = Math.min(idx0, idx1);
    const secondIndex = Math.max(idx0, idx1);
    const isAdjacent = secondIndex - firstIndex === 1;

    return {
      isAdjacent,
      firstCue: cues[firstIndex],
      secondCue: cues[secondIndex],
      firstIndex,
      secondIndex,
    };
  }, [cues, selectedCueIds]);

  // Handle merging the two adjacent cues
  const handleMergeSelected = () => {
    if (!selectedCuesAnalysis.isAdjacent || !selectedCuesAnalysis.firstCue || !selectedCuesAnalysis.secondCue) {
      return;
    }

    const { firstCue, secondCue } = selectedCuesAnalysis;
    if (onMergeCues) {
      onMergeCues(firstCue.id, secondCue.id);
    } else {
      const mergedCue: SubtitleCue = {
        ...firstCue,
        end: secondCue.end,
        endTime: secondCue.endTime,
        textVi: `${firstCue.textVi.trim()} ${secondCue.textVi.trim()}`.trim(),
        textOriginal: [firstCue.textOriginal?.trim(), secondCue.textOriginal?.trim()]
          .filter(Boolean)
          .join(" ")
          .trim(),
      };
      onUpdateCue(mergedCue);
      onDeleteCue(secondCue.id);
    }

    setSelectedCueIds([]);
  };

  // Auto scroll to active cue
  useEffect(() => {
    if (autoScroll && activeCardRef.current && scrollContainerRef.current) {
      activeCardRef.current.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
      });
    }
  }, [currentTime, autoScroll]);

  const filteredCues = cues.filter(
    (c) =>
      c.textVi.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.textOriginal.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleTimeAdjust = (cue: SubtitleCue, field: "start" | "end", delta: number) => {
    const newStart = field === "start" ? Math.max(0, Number((cue.start + delta).toFixed(2))) : cue.start;
    const newEnd = field === "end" ? Math.max(newStart + 0.2, Number((cue.end + delta).toFixed(2))) : cue.end;

    onUpdateCue({
      ...cue,
      start: newStart,
      end: newEnd,
      startTime: formatSecondsToSrtTime(newStart).replace(",", "."),
      endTime: formatSecondsToSrtTime(newEnd).replace(",", "."),
    });
  };

  return (
    <div
      id="subtitle-list-container"
      className="flex flex-col h-full bg-slate-900/90 rounded-2xl border border-slate-800 overflow-hidden shadow-xl"
    >
      {/* List Header */}
      <div className="p-3 sm:p-4 border-b border-slate-800 bg-slate-900/95 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-slate-100 text-sm sm:text-base flex items-center gap-1.5">
              <span>Danh sách phụ đề</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 font-semibold border border-rose-500/30">
                {cues.length} câu
              </span>
            </h3>
            <span
              className="hidden xl:inline-flex items-center gap-1 text-[11px] text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded border border-slate-700/60"
              title="Nhấn Ctrl + Enter bất kỳ lúc nào để lưu chỉnh sửa"
            >
              <kbd className="font-mono text-[10px] text-amber-400 font-semibold">Ctrl+Enter</kbd> Lưu
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {/* AI Refine Button */}
            <button
              id="btn-trigger-refine-modal"
              onClick={onOpenRefineModal}
              className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-500/40 transition-all font-medium"
              title="AI tối ưu hoá câu chữ, rút gọn hoặc sửa ngữ pháp"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>AI Tối ưu</span>
            </button>

            {/* Time shift dropdown */}
            <div className="relative">
              <button
                id="btn-toggle-shift-dropdown"
                onClick={() => setShowShiftDropdown(!showShiftDropdown)}
                className="flex items-center gap-1 text-xs px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-all"
                title="Lệch mốc thời gian phụ đề (+/- sync)"
              >
                <Clock className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Lệch giờ</span>
                <ChevronDown className="w-3 h-3" />
              </button>

              {showShiftDropdown && (
                <div className="absolute right-0 mt-1 w-52 bg-slate-800 border border-slate-700 rounded-xl p-3 shadow-2xl z-50 text-xs text-slate-200">
                  <div className="font-semibold mb-2 text-white">Dịch chuyển toàn bộ mốc:</div>
                  <div className="flex items-center gap-2 mb-2">
                    <button
                      onClick={() => {
                        onShiftAllCues(-timeShiftVal);
                        setShowShiftDropdown(false);
                      }}
                      className="flex-1 py-1 px-2 rounded bg-slate-700 hover:bg-slate-600 text-center text-rose-300"
                    >
                      -{timeShiftVal}s
                    </button>
                    <button
                      onClick={() => {
                        onShiftAllCues(timeShiftVal);
                        setShowShiftDropdown(false);
                      }}
                      className="flex-1 py-1 px-2 rounded bg-slate-700 hover:bg-slate-600 text-center text-emerald-300"
                    >
                      +{timeShiftVal}s
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
                    <span>Bước:</span>
                    {[0.1, 0.2, 0.5, 1.0].map((v) => (
                      <button
                        key={v}
                        onClick={() => setTimeShiftVal(v)}
                        className={`px-1.5 py-0.5 rounded ${
                          timeShiftVal === v ? "bg-rose-500 text-white font-bold" : "bg-slate-700/60"
                        }`}
                      >
                        {v}s
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Merge Selected Cues Button (Header) */}
            {selectedCuesAnalysis.isAdjacent && (
              <button
                id="btn-merge-cues-header"
                onClick={handleMergeSelected}
                className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-md active:scale-95 transition-all animate-pulse"
                title={`Gộp câu #${selectedCuesAnalysis.firstIndex + 1} và #${selectedCuesAnalysis.secondIndex + 1}`}
              >
                <GitMerge className="w-3.5 h-3.5" />
                <span>Gộp (#{selectedCuesAnalysis.firstIndex + 1} & #{selectedCuesAnalysis.secondIndex + 1})</span>
              </button>
            )}

            {/* Auto Detect Speakers / Multi-voice Dubbing Button */}
            {onOpenVoiceoverModal && (
              <button
                id="btn-open-voiceover-toolbar"
                onClick={onOpenVoiceoverModal}
                className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-rose-950/80 via-purple-950/80 to-slate-900 hover:from-rose-900 hover:to-purple-900 text-rose-300 border border-rose-500/40 font-semibold shadow-sm active:scale-95 transition-all"
                title="Tự động nhận diện giọng nói Nam/Nữ/Già/Trẻ để thuyết minh phụ đề tiếng Việt"
              >
                <Users className="w-3.5 h-3.5 text-rose-400" />
                <span className="hidden sm:inline">Phân vai lồng tiếng</span>
              </button>
            )}

            {/* Add Cue Button */}
            <button
              id="btn-add-subtitle-cue"
              onClick={() => onAddCue(currentTime)}
              className="flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium shadow-md active:scale-95 transition-all"
              title="Thêm phụ đề mới tại thời điểm hiện tại"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Thêm dòng</span>
            </button>
          </div>
        </div>

        {/* Search and Auto-scroll toggle */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              id="input-search-subtitles"
              type="text"
              placeholder="Tìm kiếm nội dung phụ đề..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500 transition-colors"
            />
          </div>

          <button
            id="btn-toggle-auto-scroll"
            onClick={() => setAutoScroll(!autoScroll)}
            className={`px-2 py-1.5 rounded-lg text-xs font-medium border flex items-center gap-1 transition-all ${
              autoScroll
                ? "bg-slate-800 text-slate-200 border-slate-700"
                : "bg-slate-950 text-slate-500 border-slate-800"
            }`}
            title="Tự động cuộn theo video"
          >
            <ArrowDownNarrowWide className={`w-3.5 h-3.5 ${autoScroll ? "text-rose-400" : "text-slate-600"}`} />
            <span className="hidden md:inline">Cuộn tự động</span>
          </button>
        </div>
      </div>

      {/* Merge Selection Bar Banner */}
      {selectedCueIds.length > 0 && (
        <div id="merge-selection-banner">
          {selectedCuesAnalysis.isAdjacent ? (
            <div className="px-3 sm:px-4 py-2.5 bg-emerald-950/90 border-b border-emerald-500/50 flex items-center justify-between text-xs text-emerald-200 shadow-md">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-md bg-emerald-500/20 text-emerald-400">
                  <GitMerge className="w-4 h-4" />
                </div>
                <div>
                  <span>
                    Đã chọn 2 câu liền kề: <strong className="text-white">#{selectedCuesAnalysis.firstIndex + 1}</strong> và <strong className="text-white">#{selectedCuesAnalysis.secondIndex + 1}</strong>
                  </span>
                  <div className="text-[11px] text-emerald-400/80">
                    Sẽ ghép nối nội dung và lấy mốc kết thúc của câu #{selectedCuesAnalysis.secondIndex + 1}.
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  id="btn-merge-subtitles"
                  onClick={handleMergeSelected}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg active:scale-95 transition-all"
                  title="Gộp 2 câu phụ đề đã chọn"
                >
                  <GitMerge className="w-3.5 h-3.5" />
                  <span>Gộp 2 câu (Merge)</span>
                </button>
                <button
                  onClick={() => setSelectedCueIds([])}
                  className="text-emerald-300 hover:text-white text-xs px-2 py-1 rounded hover:bg-emerald-900/40"
                >
                  Hủy
                </button>
              </div>
            </div>
          ) : selectedCueIds.length === 1 ? (
            <div className="px-3 sm:px-4 py-2 bg-slate-800/95 border-b border-slate-700/80 flex items-center justify-between text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <span>
                  Đã chọn câu <strong className="text-amber-400">#{cues.findIndex((c) => c.id === selectedCueIds[0]) + 1}</strong>. Hãy tích chọn thêm 1 câu liền kề (trước hoặc sau) để gộp.
                </span>
              </div>
              <button
                onClick={() => setSelectedCueIds([])}
                className="text-slate-400 hover:text-white text-[11px] px-2 py-0.5 rounded hover:bg-slate-700"
              >
                Hủy chọn
              </button>
            </div>
          ) : (
            <div className="px-3 sm:px-4 py-2 bg-amber-950/90 border-b border-amber-500/40 flex items-center justify-between text-xs text-amber-200">
              <span>
                ⚠️ Hai câu được chọn không nằm liền kề nhau. Vui lòng chọn 2 câu liên tiếp để thực hiện gộp (Merge).
              </span>
              <button
                onClick={() => setSelectedCueIds([])}
                className="text-amber-300 hover:text-white text-xs underline ml-2"
              >
                Chọn lại
              </button>
            </div>
          )}
        </div>
      )}

      {/* Subtitles Scrollable Area */}
      <div
        ref={scrollContainerRef}
        id="subtitles-cards-list"
        className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5"
      >
        {filteredCues.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-slate-500 text-center px-4">
            <p className="text-sm mb-2 font-medium">Chưa có đoạn phụ đề nào khớp</p>
            <p className="text-xs text-slate-600">
              Nhấn "Tạo Vietsub bằng AI" trên thanh công cụ hoặc thêm dòng thủ công bằng nút (+) ở góc trên.
            </p>
          </div>
        ) : (
          filteredCues.map((cue, index) => {
            const isActive = currentTime >= cue.start && currentTime <= cue.end;
            const cueIndexInAll = cues.findIndex((c) => c.id === cue.id);
            const isSelected = selectedCueIds.includes(cue.id);
            const singleSelectedId = selectedCueIds.length === 1 ? selectedCueIds[0] : null;
            const singleSelectedIdx = singleSelectedId !== null ? cues.findIndex((c) => c.id === singleSelectedId) : -1;
            const isNeighborOfSelected =
              singleSelectedIdx !== -1 && Math.abs(cueIndexInAll - singleSelectedIdx) === 1;

            return (
              <div
                key={cue.id}
                ref={isActive ? activeCardRef : null}
                id={`subtitle-card-${cue.id}`}
                className={`p-3 rounded-xl border transition-all duration-200 ${
                  isSelected
                    ? "bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/40 shadow-lg"
                    : isActive
                    ? "bg-slate-800/90 border-rose-500/80 shadow-md ring-1 ring-rose-500/40"
                    : isNeighborOfSelected
                    ? "bg-slate-900/90 border-dashed border-emerald-500/50 hover:border-emerald-400"
                    : "bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/60"
                }`}
              >
                {/* Header: Index, Timestamps, Adjust Buttons, Delete */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {/* Checkbox to select cue for merging */}
                    <input
                      type="checkbox"
                      id={`checkbox-select-cue-${cue.id}`}
                      checked={isSelected}
                      onChange={() => handleToggleSelectCue(cue.id)}
                      className="w-3.5 h-3.5 rounded border-slate-700 bg-slate-900 text-emerald-500 accent-emerald-500 cursor-pointer"
                      title={
                        isSelected
                          ? "Bỏ chọn câu này"
                          : isNeighborOfSelected
                          ? "Chọn câu này để gộp với câu đã chọn"
                          : "Tích chọn câu này để gộp"
                      }
                    />

                    <span
                      onClick={() => onSelectCue(cue.start)}
                      className={`font-mono text-xs font-bold px-1.5 py-0.5 rounded cursor-pointer transition-colors ${
                        isSelected
                          ? "bg-emerald-600 text-white"
                          : isActive
                          ? "bg-rose-500 text-white"
                          : "bg-slate-800 text-slate-400 hover:text-white"
                      }`}
                      title="Nhấn để phát video từ mốc này"
                    >
                      #{index + 1}
                    </span>

                    {/* Time scrubber controls */}
                    <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800">
                      <span
                        onClick={() => onSelectCue(cue.start)}
                        className="hover:text-rose-400 cursor-pointer"
                        title="Bắt đầu"
                      >
                        {formatSecondsToDisplay(cue.start)}
                      </span>
                      <MoveRight className="w-2.5 h-2.5 text-slate-600" />
                      <span
                        onClick={() => onSelectCue(cue.end)}
                        className="hover:text-rose-400 cursor-pointer"
                        title="Kết thúc"
                      >
                        {formatSecondsToDisplay(cue.end)}
                      </span>
                      <span className="text-slate-600 pl-1">
                        ({(cue.end - cue.start).toFixed(1)}s)
                      </span>
                    </div>

                    {isNeighborOfSelected && !isSelected && (
                      <span className="hidden sm:inline-block text-[10px] text-emerald-400 bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-500/30">
                        Liền kề
                      </span>
                    )}
                  </div>

                  {/* Micro nudge buttons, quick merge & delete */}
                  <div className="flex items-center gap-1">
                    {/* Quick merge shortcut with next cue */}
                    {cueIndexInAll < cues.length - 1 && (
                      <button
                        id={`btn-quick-merge-${cue.id}`}
                        type="button"
                        onClick={() => {
                          const nextCue = cues[cueIndexInAll + 1];
                          if (nextCue) {
                            setSelectedCueIds([cue.id, nextCue.id]);
                          }
                        }}
                        className="p-1 rounded text-slate-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                        title={`Chọn gộp câu #${cueIndexInAll + 1} với câu liền kề #${cueIndexInAll + 2}`}
                      >
                        <GitMerge className="w-3.5 h-3.5" />
                      </button>
                    )}

                    {/* Time start micro adjustment */}
                    <div className="hidden sm:flex items-center bg-slate-900 rounded border border-slate-800 text-[10px] font-mono">
                      <button
                        onClick={() => handleTimeAdjust(cue, "start", -0.2)}
                        className="px-1 py-0.5 hover:bg-slate-800 text-slate-400 hover:text-white"
                        title="Lùi mốc bắt đầu 0.2s"
                      >
                        -0.2s
                      </button>
                      <span className="text-slate-600 px-0.5">|</span>
                      <button
                        onClick={() => handleTimeAdjust(cue, "start", 0.2)}
                        className="px-1 py-0.5 hover:bg-slate-800 text-slate-400 hover:text-white"
                        title="Tăng mốc bắt đầu 0.2s"
                      >
                        +0.2s
                      </button>
                    </div>

                    {/* Quick Listen Voiceover for this cue with persona */}
                    <button
                      id={`btn-listen-cue-${cue.id}`}
                      type="button"
                      onClick={() => {
                        if (activePlayingCueId === cue.id) {
                          stopVoicePreview();
                          setActivePlayingCueId(null);
                        } else {
                          setActivePlayingCueId(cue.id);
                          const persona =
                            cue.voicePersona ||
                            (cue.speakerGender === "male"
                              ? cue.speakerAge === "elderly"
                                ? "male_elderly"
                                : "male_young"
                              : cue.speakerAge === "elderly"
                              ? "female_elderly"
                              : "female_young");

                          previewSpeakerPersona(
                            persona,
                            cue.textVi || cue.textOriginal,
                            () => {
                              setActivePlayingCueId(null);
                            }
                          );
                        }
                      }}
                      className={`p-1 rounded transition-colors ${
                        activePlayingCueId === cue.id
                          ? "text-rose-400 bg-rose-500/20 animate-pulse"
                          : "text-slate-500 hover:text-rose-400 hover:bg-slate-800"
                      }`}
                      title="Nghe thử giọng nhân vật này"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete button */}
                    <button
                      id={`btn-delete-cue-${cue.id}`}
                      onClick={() => onDeleteCue(cue.id)}
                      className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Xóa phụ đề này"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Main Vietnamese Text Input */}
                <div className="space-y-1.5">
                  <div className="relative">
                    <textarea
                      id={`textarea-vietnamese-${cue.id}`}
                      rows={2}
                      value={cue.textVi}
                      onChange={(e) =>
                        onUpdateCue({
                          ...cue,
                          textVi: e.target.value,
                        })
                      }
                      onKeyDown={(e) => {
                        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                          e.preventDefault();
                          (e.target as HTMLElement).blur();
                          onSaveEdits?.();
                        }
                      }}
                      placeholder="Nhập nội dung phụ đề tiếng Việt..."
                      className="w-full bg-slate-900/90 border border-slate-800 rounded-lg p-2 text-xs sm:text-sm text-slate-100 focus:outline-none focus:border-rose-500/80 focus:ring-1 focus:ring-rose-500/30 resize-none font-medium"
                    />
                  </div>

                  {/* Spoken original text (optional view & edit) */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] uppercase tracking-wider text-slate-500 font-semibold w-12 shrink-0">
                      Gốc:
                    </span>
                    <input
                      id={`input-original-${cue.id}`}
                      type="text"
                      value={cue.textOriginal}
                      onChange={(e) =>
                        onUpdateCue({
                          ...cue,
                          textOriginal: e.target.value,
                        })
                      }
                      onKeyDown={(e) => {
                        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
                          e.preventDefault();
                          (e.target as HTMLElement).blur();
                          onSaveEdits?.();
                        }
                      }}
                      placeholder="Lời thoại gốc (tiếng Anh, Nhật,...)"
                      className="flex-1 bg-slate-950/60 border border-slate-800/60 rounded px-2 py-0.5 text-[11px] text-slate-400 focus:text-slate-200 focus:outline-none focus:border-slate-700"
                    />
                  </div>

                  {/* Speaker Persona & Character Role Tag */}
                  {(() => {
                    const persona =
                      cue.voicePersona ||
                      (cue.speakerGender === "male"
                        ? cue.speakerAge === "elderly"
                          ? "male_elderly"
                          : "male_young"
                        : cue.speakerAge === "elderly"
                        ? "female_elderly"
                        : "female_young");
                    const meta = getPersonaInfo(persona);

                    return (
                      <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/60 text-[11px]">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">{meta.icon}</span>
                          <span className="text-slate-400">
                            {cue.speakerRole ? (
                              <strong className="text-slate-200">{cue.speakerRole}</strong>
                            ) : (
                              "Nhân vật"
                            )}
                          </span>
                          <span
                            className={`px-1.5 py-0.2 rounded text-[10px] font-semibold border ${meta.bgBadge}`}
                          >
                            {meta.shortLabel}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <span className="text-slate-500 text-[10px] hidden sm:inline">Chất giọng:</span>
                          <select
                            value={persona}
                            onChange={(e) => {
                              const newPersona = e.target.value as SpeakerVoicePersona;
                              onUpdateCue({
                                ...cue,
                                voicePersona: newPersona,
                              });
                            }}
                            className="bg-slate-900 border border-slate-800 rounded px-1.5 py-0.5 text-[10px] text-slate-300 focus:outline-none focus:border-rose-500 cursor-pointer"
                          >
                            {(Object.keys(SPEAKER_PERSONAS) as SpeakerVoicePersona[]).map((pKey) => {
                              const pMeta = SPEAKER_PERSONAS[pKey];
                              return (
                                <option key={pKey} value={pKey}>
                                  {pMeta.icon} {pMeta.shortLabel}
                                </option>
                              );
                            })}
                          </select>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
