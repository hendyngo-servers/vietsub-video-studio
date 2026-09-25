import React, { useState, useMemo } from "react";
import {
  X,
  Sparkles,
  Users,
  Volume2,
  VolumeX,
  Play,
  Pause,
  CheckCircle,
  Sliders,
  Settings2,
  Mic,
  RefreshCw,
  Info,
  ChevronRight,
  Headphones,
  Check,
} from "lucide-react";
import {
  SubtitleCue,
  VoiceoverConfig,
  SpeakerVoicePersona,
  SpeakerGender,
  SpeakerAge,
} from "../types";
import {
  SPEAKER_PERSONAS,
  getPersonaInfo,
  previewSpeakerPersona,
  stopVoicePreview,
  AVAILABLE_VOICES,
} from "../utils/voiceoverEngine";

interface AutoVoiceoverModalProps {
  isOpen: boolean;
  onClose: () => void;
  cues: SubtitleCue[];
  onUpdateCues: (updatedCues: SubtitleCue[]) => void;
  voiceoverConfig: VoiceoverConfig;
  onUpdateVoiceoverConfig: (config: VoiceoverConfig) => void;
  videoTitle?: string;
  onNotify?: (text: string, type?: "success" | "error" | "info") => void;
}

export const AutoVoiceoverModal: React.FC<AutoVoiceoverModalProps> = ({
  isOpen,
  onClose,
  cues,
  onUpdateCues,
  voiceoverConfig,
  onUpdateVoiceoverConfig,
  videoTitle,
  onNotify,
}) => {
  const [isScanning, setIsScanning] = useState(false);
  const [activePreviewPersona, setActivePreviewPersona] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<"roles" | "config" | "cues">("roles");
  const [searchFilter, setSearchFilter] = useState("");

  // Aggregate statistics of detected personas across all cues
  const stats = useMemo(() => {
    const counts: Record<SpeakerVoicePersona, number> = {
      male_young: 0,
      male_adult: 0,
      male_elderly: 0,
      female_young: 0,
      female_adult: 0,
      female_elderly: 0,
      child: 0,
    };

    let identifiedCount = 0;
    cues.forEach((cue) => {
      const persona = cue.voicePersona || (cue.speakerGender === "male" ? "male_young" : "female_young");
      if (counts[persona] !== undefined) {
        counts[persona]++;
        identifiedCount++;
      }
    });

    return { counts, identifiedCount };
  }, [cues]);

  // Aggregate unique character roles detected in the video
  const characterRoles = useMemo(() => {
    const roleMap = new Map<
      string,
      {
        roleName: string;
        voicePersona: SpeakerVoicePersona;
        gender: SpeakerGender;
        age: SpeakerAge;
        count: number;
        sampleText: string;
      }
    >();

    cues.forEach((cue) => {
      const roleName = cue.speakerRole || "Chưa phân vai";
      const persona = cue.voicePersona || (cue.speakerGender === "male" ? "male_young" : "female_young");
      const existing = roleMap.get(roleName);

      if (existing) {
        existing.count++;
        if (!existing.sampleText && cue.textVi) {
          existing.sampleText = cue.textVi;
        }
      } else {
        roleMap.set(roleName, {
          roleName,
          voicePersona: persona,
          gender: cue.speakerGender || "unknown",
          age: cue.speakerAge || "young",
          count: 1,
          sampleText: cue.textVi || cue.textOriginal || "",
        });
      }
    });

    return Array.from(roleMap.values()).sort((a, b) => b.count - a.count);
  }, [cues]);

  // Trigger Gemini AI to detect speakers and cast roles
  const handleScanSpeakersAI = async () => {
    if (cues.length === 0) {
      if (onNotify) onNotify("Chưa có phụ đề để phân tích giọng nói.", "error");
      return;
    }

    setIsScanning(true);
    try {
      const response = await fetch("/api/vietsub/detect-speakers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cues,
          videoTitle: videoTitle || "Video",
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Không thể phân tích giọng nói.");
      }

      if (data.cues && Array.isArray(data.cues)) {
        onUpdateCues(data.cues);
        if (onNotify) {
          onNotify(
            `Đã nhận diện thành công ${data.characters?.length || "nhiều"} nhân vật (Nam/Nữ/Già/Trẻ) cho ${data.cues.length} câu phụ đề!`,
            "success"
          );
        }
      }
    } catch (err: any) {
      console.error(err);
      if (onNotify) {
        onNotify(err.message || "Lỗi khi quét nhận diện nhân vật bằng AI.", "error");
      }
    } finally {
      setIsScanning(false);
    }
  };

  // Preview a specific persona voice
  const handlePlayPersonaPreview = (personaKey: SpeakerVoicePersona, customText?: string) => {
    if (activePreviewPersona === personaKey) {
      stopVoicePreview();
      setActivePreviewPersona(null);
      return;
    }

    setActivePreviewPersona(personaKey);
    const meta = getPersonaInfo(personaKey);
    const textToSpeak = customText || `Xin chào! Tôi là giọng đọc ${meta.label} cho phim của bạn.`;

    previewSpeakerPersona(personaKey, textToSpeak, () => {
      setActivePreviewPersona(null);
    });
  };

  // Change persona for all cues with a given role
  const handleChangeRolePersona = (roleName: string, newPersona: SpeakerVoicePersona) => {
    const updated = cues.map((cue) => {
      if ((cue.speakerRole || "Chưa phân vai") === roleName) {
        return {
          ...cue,
          voicePersona: newPersona,
        };
      }
      return cue;
    });
    onUpdateCues(updated);
  };

  // Filtered cues for the inspector tab
  const filteredCues = useMemo(() => {
    if (!searchFilter.trim()) return cues;
    const lower = searchFilter.toLowerCase();
    return cues.filter(
      (c) =>
        c.textVi.toLowerCase().includes(lower) ||
        c.textOriginal.toLowerCase().includes(lower) ||
        (c.speakerRole && c.speakerRole.toLowerCase().includes(lower))
    );
  }, [cues, searchFilter]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div
        id="auto-voiceover-modal"
        className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl shadow-2xl overflow-hidden text-slate-100 flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-rose-950/70 via-purple-950/70 to-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-rose-500 to-indigo-600 text-white shadow-lg shadow-rose-500/20">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-white tracking-wide">
                  Tự Động Nhận Diện Giọng Nói & Thuyết Minh Tiếng Việt
                </h3>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  Nam / Nữ / Già / Trẻ
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Phân tích hội thoại ngữ cảnh bằng Gemini AI để lồng tiếng đa giọng chuẩn từng vai diễn
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              stopVoicePreview();
              onClose();
            }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Callout Bar */}
        <div className="px-5 py-3 bg-slate-950/70 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              id="btn-scan-speakers-ai"
              onClick={handleScanSpeakersAI}
              disabled={isScanning || cues.length === 0}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs shadow-lg transition-all ${
                isScanning
                  ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 hover:from-rose-500 hover:to-purple-500 text-white active:scale-95 shadow-rose-600/30"
              }`}
            >
              {isScanning ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Đang phân tích kịch bản bằng Gemini AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                  <span>Quét Tự Động Phân Vai Bằng AI</span>
                </>
              )}
            </button>

            <span className="text-[11px] text-slate-400 hidden md:inline">
              Đã gán giọng cho {stats.identifiedCount}/{cues.length} câu thoại
            </span>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setSelectedTab("roles")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                selectedTab === "roles"
                  ? "bg-rose-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Phân Vai Nhân Vật ({characterRoles.length})
            </button>
            <button
              onClick={() => setSelectedTab("cues")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                selectedTab === "cues"
                  ? "bg-rose-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Chi Tiết Từng Câu ({cues.length})
            </button>
            <button
              onClick={() => setSelectedTab("config")}
              className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                selectedTab === "config"
                  ? "bg-rose-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              Cài Đặt Thuyết Minh
            </button>
          </div>
        </div>

        {/* Persona Demographic Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 p-3 bg-slate-900/60 border-b border-slate-800 text-xs">
          {(Object.keys(SPEAKER_PERSONAS) as SpeakerVoicePersona[]).map((key) => {
            const meta = SPEAKER_PERSONAS[key];
            const count = stats.counts[key] || 0;
            const isPlaying = activePreviewPersona === key;

            return (
              <div
                key={key}
                onClick={() => handlePlayPersonaPreview(key)}
                className={`p-2 rounded-xl border cursor-pointer transition-all hover:scale-102 flex flex-col justify-between ${
                  isPlaying
                    ? "bg-rose-950/60 border-rose-500 shadow-md ring-1 ring-rose-500/40"
                    : count > 0
                    ? "bg-slate-950/70 border-slate-800 hover:border-slate-700"
                    : "bg-slate-950/30 border-slate-900 opacity-60 hover:opacity-100"
                }`}
                title={`Nhấn để nghe thử giọng ${meta.label}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-base">{meta.icon}</span>
                  <button
                    type="button"
                    className={`p-1 rounded-md transition-colors ${
                      isPlaying
                        ? "bg-rose-500 text-white"
                        : "bg-slate-800 text-slate-400 hover:text-white"
                    }`}
                  >
                    {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                  </button>
                </div>
                <div>
                  <div className="font-semibold text-slate-200 truncate text-[11px]">
                    {meta.shortLabel}
                  </div>
                  <div className="text-[10px] text-slate-500">
                    <span className={`font-bold ${count > 0 ? "text-rose-400" : "text-slate-600"}`}>
                      {count}
                    </span>{" "}
                    câu thoại
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5">
          {selectedTab === "roles" && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-200 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-rose-400" />
                    <span>Bảng Phân Vai Nhân Vật & Giọng Thuyết Minh</span>
                  </h4>
                  <p className="text-xs text-slate-400">
                    Mỗi nhân vật được Gemini AI nhận diện giọng nói phù hợp. Bạn có thể thay đổi giọng tùy thích.
                  </p>
                </div>
              </div>

              {characterRoles.length === 0 ? (
                <div className="p-8 rounded-xl border border-dashed border-slate-800 text-center">
                  <Sparkles className="w-8 h-8 text-rose-400 mx-auto mb-2 opacity-70" />
                  <p className="text-sm font-medium text-slate-300">Chưa có phân vai nhân vật nào</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                    Bấm "Quét Tự Động Phân Vai Bằng AI" để Gemini tự động phân tích toàn bộ câu thoại và gán vai Nam, Nữ, Già, Trẻ.
                  </p>
                  <button
                    onClick={handleScanSpeakersAI}
                    disabled={isScanning}
                    className="mt-3 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg inline-flex items-center gap-2"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Quét Tự Động Ngay</span>
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {characterRoles.map((role) => {
                    const meta = getPersonaInfo(role.voicePersona);
                    const isPlaying = activePreviewPersona === `${role.roleName}`;

                    return (
                      <div
                        key={role.roleName}
                        className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between"
                      >
                        <div className="flex items-start justify-between gap-3 mb-2.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-xl shadow-inner">
                              {meta.icon}
                            </div>
                            <div>
                              <div className="font-bold text-sm text-white flex items-center gap-1.5">
                                <span>{role.roleName}</span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${meta.bgBadge}`}>
                                  {meta.badge}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-400">
                                Xuất hiện: <strong className="text-slate-200">{role.count}</strong> câu thoại
                              </div>
                            </div>
                          </div>

                          {/* Quick Voice Play */}
                          <button
                            type="button"
                            onClick={() => {
                              if (isPlaying) {
                                stopVoicePreview();
                                setActivePreviewPersona(null);
                              } else {
                                setActivePreviewPersona(role.roleName);
                                previewSpeakerPersona(
                                  role.voicePersona,
                                  role.sampleText || "Xin chào, tôi là nhân vật trong phim.",
                                  () => setActivePreviewPersona(null)
                                );
                              }
                            }}
                            className={`p-2 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all ${
                              isPlaying
                                ? "bg-rose-500 text-white shadow-md shadow-rose-500/20"
                                : "bg-slate-900 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800"
                            }`}
                            title="Nghe thử giọng nhân vật này"
                          >
                            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                            <span className="hidden sm:inline">Nghe thử</span>
                          </button>
                        </div>

                        {/* Sample Dialogue line */}
                        {role.sampleText && (
                          <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800/80 text-xs text-slate-300 italic mb-3 line-clamp-2">
                            "{role.sampleText}"
                          </div>
                        )}

                        {/* Voice Persona Selector */}
                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800/70 text-xs">
                          <span className="text-slate-400 text-[11px]">Chất giọng lồng:</span>
                          <select
                            value={role.voicePersona}
                            onChange={(e) =>
                              handleChangeRolePersona(
                                role.roleName,
                                e.target.value as SpeakerVoicePersona
                              )
                            }
                            className="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-200 text-xs focus:ring-1 focus:ring-rose-500 focus:outline-none cursor-pointer"
                          >
                            {(Object.keys(SPEAKER_PERSONAS) as SpeakerVoicePersona[]).map(
                              (pKey) => {
                                const pMeta = SPEAKER_PERSONAS[pKey];
                                return (
                                  <option key={pKey} value={pKey}>
                                    {pMeta.icon} {pMeta.label}
                                  </option>
                                );
                              }
                            )}
                          </select>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {selectedTab === "cues" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <input
                  type="text"
                  placeholder="Tìm kiếm câu thoại hoặc nhân vật..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className="w-full max-w-sm px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
                <span className="text-xs text-slate-400">
                  Hiển thị {filteredCues.length} / {cues.length} câu
                </span>
              </div>

              <div className="space-y-2">
                {filteredCues.map((cue, index) => {
                  const persona =
                    cue.voicePersona ||
                    (cue.speakerGender === "male" ? "male_young" : "female_young");
                  const meta = getPersonaInfo(persona);
                  const isPlaying = activePreviewPersona === `cue-${cue.id}`;

                  return (
                    <div
                      key={cue.id}
                      className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 hover:border-slate-700 transition-all flex items-start justify-between gap-3 text-xs"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="font-mono text-[11px] font-bold text-slate-400 bg-slate-900 px-1.5 py-0.5 rounded">
                            #{index + 1}
                          </span>
                          <span className="font-mono text-[10px] text-slate-500">
                            {cue.startTime} → {cue.endTime}
                          </span>
                          <span
                            className={`px-2 py-0.2 rounded-full text-[10px] font-semibold border ${meta.bgBadge}`}
                          >
                            {meta.icon} {cue.speakerRole || meta.shortLabel}
                          </span>
                        </div>
                        <div className="text-slate-100 font-medium text-xs sm:text-sm">
                          {cue.textVi || cue.textOriginal}
                        </div>
                        {cue.textOriginal && cue.textVi && (
                          <div className="text-[11px] text-slate-500 italic mt-0.5 truncate">
                            {cue.textOriginal}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {/* Persona Dropdown per cue */}
                        <select
                          value={persona}
                          onChange={(e) => {
                            const newPersona = e.target.value as SpeakerVoicePersona;
                            const updated = cues.map((c) =>
                              c.id === cue.id ? { ...c, voicePersona: newPersona } : c
                            );
                            onUpdateCues(updated);
                          }}
                          className="bg-slate-900 border border-slate-700 rounded-lg px-2 py-1 text-slate-300 text-[11px] focus:outline-none focus:border-rose-500 cursor-pointer"
                        >
                          {(Object.keys(SPEAKER_PERSONAS) as SpeakerVoicePersona[]).map(
                            (pKey) => {
                              const pMeta = SPEAKER_PERSONAS[pKey];
                              return (
                                <option key={pKey} value={pKey}>
                                  {pMeta.icon} {pMeta.shortLabel}
                                </option>
                              );
                            }
                          )}
                        </select>

                        {/* Listen Cue */}
                        <button
                          type="button"
                          onClick={() => {
                            if (isPlaying) {
                              stopVoicePreview();
                              setActivePreviewPersona(null);
                            } else {
                              setActivePreviewPersona(`cue-${cue.id}`);
                              previewSpeakerPersona(
                                persona,
                                cue.textVi || cue.textOriginal,
                                () => setActivePreviewPersona(null)
                              );
                            }
                          }}
                          className={`p-1.5 rounded-lg border transition-colors ${
                            isPlaying
                              ? "bg-rose-500 border-rose-500 text-white"
                              : "bg-slate-900 border-slate-700 text-slate-400 hover:text-white"
                          }`}
                          title="Nghe câu này với giọng được gán"
                        >
                          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {selectedTab === "config" && (
            <div className="max-w-xl mx-auto space-y-5">
              {/* Multi-voice dramatization toggle */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-200 text-sm flex items-center gap-2">
                      <Users className="w-4 h-4 text-rose-400" />
                      <span>Thuyết minh phân vai tự động (Multi-Voice)</span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      Tự động chuyển đổi giọng Nam, Nữ, Già, Trẻ theo từng nhân vật khi video phát
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={voiceoverConfig.autoMultiVoice}
                    onChange={(e) =>
                      onUpdateVoiceoverConfig({
                        ...voiceoverConfig,
                        autoMultiVoice: e.target.checked,
                      })
                    }
                    className="w-5 h-5 rounded border-slate-700 bg-slate-900 text-rose-500 accent-rose-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Master Voiceover Toggle */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-200 text-sm flex items-center gap-2">
                      <Mic className="w-4 h-4 text-rose-400" />
                      <span>Bật Thuyết Minh Khi Xem Video</span>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      Phát giọng đọc đồng bộ theo thời gian xuất hiện của từng dòng phụ đề
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={voiceoverConfig.enabled}
                    onChange={(e) =>
                      onUpdateVoiceoverConfig({
                        ...voiceoverConfig,
                        enabled: e.target.checked,
                      })
                    }
                    className="w-5 h-5 rounded border-slate-700 bg-slate-900 text-rose-500 accent-rose-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* Speed / Rate slider */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-200">Tốc độ thuyết minh:</span>
                  <span className="font-mono text-rose-400 font-bold">{voiceoverConfig.speechRate}x</span>
                </div>
                <input
                  type="range"
                  min="0.8"
                  max="1.3"
                  step="0.05"
                  value={voiceoverConfig.speechRate}
                  onChange={(e) =>
                    onUpdateVoiceoverConfig({
                      ...voiceoverConfig,
                      speechRate: parseFloat(e.target.value),
                    })
                  }
                  className="w-full accent-rose-500 cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-500">
                  <span>Chậm (0.8x)</span>
                  <span>Chuẩn (1.0x)</span>
                  <span>Nhanh (1.3x)</span>
                </div>
              </div>

              {/* Audio Ducking slider */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-200">Âm lượng video gốc khi có lời thoại (Audio Ducking):</span>
                    <p className="text-[11px] text-slate-400">
                      Tự động giảm âm lượng nền để giọng thuyết minh rõ nét
                    </p>
                  </div>
                  <span className="font-mono text-rose-400 font-bold">
                    {Math.round(voiceoverConfig.originalVolumeDucking * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.1"
                  max="0.6"
                  step="0.05"
                  value={voiceoverConfig.originalVolumeDucking}
                  onChange={(e) =>
                    onUpdateVoiceoverConfig({
                      ...voiceoverConfig,
                      originalVolumeDucking: parseFloat(e.target.value),
                    })
                  }
                  className="w-full accent-rose-500 cursor-pointer"
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Info className="w-3.5 h-3.5 text-rose-400" />
            <span>Giọng đọc được tối ưu hóa cho phim điện ảnh, web drama và video ngắn.</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                stopVoicePreview();
                onClose();
              }}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-colors"
            >
              Đóng
            </button>
            <button
              onClick={() => {
                stopVoicePreview();
                if (onNotify) {
                  onNotify("Đã áp dụng cấu hình thuyết minh phân vai đa giọng!", "success");
                }
                onClose();
              }}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-indigo-600 hover:from-rose-500 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 flex items-center gap-1.5 transition-all"
            >
              <Check className="w-4 h-4" />
              <span>Áp Dụng Thuyết Minh</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
