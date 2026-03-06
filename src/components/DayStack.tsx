"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  Category, TaskCard,
  fmtTime, fmtMin, getCatFromList, buildCatSummary, todayStr,
} from "@/lib/constants";
import { useAuth } from "@/lib/hooks/useAuth";
import { useCategories } from "@/lib/hooks/useCategories";
import { useTasks } from "@/lib/hooks/useTasks";
import { shareToTwitter, copyShareImage } from "@/lib/shareUtils";
import TimerRing from "@/components/TimerRing";
import ShareImage from "@/components/ShareImage";
import CategoryEditor from "@/components/CategoryEditor";
import WeeklyDNA from "@/components/WeeklyDNA";

type ViewMode = "today" | "summary" | "share";

interface ActiveTimer {
  id: number;
  category: string;
  title: string;
  startTime: Date;
  elapsed: number;
}

interface DayStackProps {
  userId: string;
}

export default function DayStack({ userId }: DayStackProps) {
  const { signOut } = useAuth();
  const {
    categories, loading: catLoading,
    updateCategory, addCategory, deleteCategory, reorderCategories,
  } = useCategories(userId);
  const {
    cards, loading: taskLoading,
    addTask, updateTask, deleteTask, fetchWeek, fetchDate,
  } = useTasks(userId);

  const [view, setView] = useState<ViewMode>("today");
  const [showCatEditor, setShowCatEditor] = useState(false);

  // Timer — supports parallel timers
  const [activeTimers, setActiveTimers] = useState<ActiveTimer[]>([]);
  const [focusedTimerId, setFocusedTimerId] = useState<number | null>(null);
  const [newTimerCategory, setNewTimerCategory] = useState("deepwork");
  const [newTimerTitle, setNewTimerTitle] = useState("");
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [showParallelForm, setShowParallelForm] = useState(false);

  // Manual entry
  const [showManual, setShowManual] = useState(false);
  const [manualTitle, setManualTitle] = useState("");
  const [manualCategory, setManualCategory] = useState("deepwork");
  const [manualStart, setManualStart] = useState("");
  const [manualEnd, setManualEnd] = useState("");

  // Card interaction
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editStart, setEditStart] = useState("");
  const [editEnd, setEditEnd] = useState("");

  // Summary date navigation
  const [summaryDate, setSummaryDate] = useState(todayStr());
  const [summaryCards, setSummaryCards] = useState<TaskCard[]>([]);
  const [summaryLoading, setSummaryLoading] = useState(false);

  // Weekly data
  const [weekTasks, setWeekTasks] = useState<TaskCard[]>([]);

  // Share
  const shareRef = useRef<HTMLDivElement>(null);
  const [shareStatus, setShareStatus] = useState<string | null>(null);

  const handleShareTwitter = useCallback(async () => {
    if (!shareRef.current) return;
    setShareStatus("画像を準備中...");
    try {
      await shareToTwitter(shareRef.current);
      setShareStatus("画像をダウンロードしました");
    } catch {
      setShareStatus("エラーが発生しました");
    }
    setTimeout(() => setShareStatus(null), 3000);
  }, []);

  const handleCopy = useCallback(async () => {
    if (!shareRef.current) return;
    setShareStatus("コピー中...");
    try {
      const copied = await copyShareImage(shareRef.current);
      setShareStatus(copied ? "コピーしました ✓" : "画像をダウンロードしました");
    } catch {
      setShareStatus("エラーが発生しました");
    }
    setTimeout(() => setShareStatus(null), 3000);
  }, []);

  // Derived timer state
  const isRunning = activeTimers.length > 0;
  const focusedTimer = activeTimers.find(t => t.id === focusedTimerId) || activeTimers[0] || null;
  const elapsed = focusedTimer?.elapsed ?? 0;

  // Pulse animation
  const [pulse, setPulse] = useState(false);
  useEffect(() => {
    if (!isRunning) return;
    const p = setInterval(() => setPulse((v) => !v), 1500);
    return () => clearInterval(p);
  }, [isRunning]);

  // Timer tick — updates all active timers
  const hasActiveTimers = isRunning;
  useEffect(() => {
    if (hasActiveTimers) {
      intervalRef.current = setInterval(() => {
        setActiveTimers(prev => prev.map(t => ({ ...t, elapsed: t.elapsed + 1 })));
      }, 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [hasActiveTimers]);

  // Fetch summary cards when summaryDate changes
  useEffect(() => {
    if (view !== "summary") return;
    if (summaryDate === todayStr()) {
      setSummaryCards(cards);
      return;
    }
    setSummaryLoading(true);
    fetchDate(summaryDate).then((data) => {
      setSummaryCards(data);
      setSummaryLoading(false);
    });
  }, [view, summaryDate, fetchDate, cards]);

  // Fetch week data when switching to summary or share
  useEffect(() => {
    if (view === "summary" || view === "share") {
      fetchWeek().then(setWeekTasks);
    }
  }, [view, fetchWeek]);

  const getCat = (id: string) => getCatFromList(categories, id);

  const startTimer = () => {
    const id = Date.now();
    const newTimer: ActiveTimer = {
      id,
      category: newTimerCategory,
      title: newTimerTitle,
      startTime: new Date(),
      elapsed: 0,
    };
    setActiveTimers(prev => [...prev, newTimer]);
    setFocusedTimerId(id);
    setNewTimerTitle("");
  };

  const stopTimer = (timerId?: number) => {
    const targetId = timerId ?? focusedTimer?.id;
    const timer = activeTimers.find(t => t.id === targetId);
    if (!timer) return;

    const now = new Date();
    // 壁時計ベースで正確な経過秒を算出
    const realSec = Math.round((now.getTime() - timer.startTime.getTime()) / 1000);
    const minutes = Math.max(1, Math.round(realSec / 60));
    const startStr = timer.startTime.toTimeString().slice(0, 5);
    const endStr = now.toTimeString().slice(0, 5);
    const cat = getCat(timer.category);
    addTask({
      id: timer.id,
      title: timer.title.trim() || cat.label,
      category: timer.category,
      minutes,
      startTime: startStr,
      endTime: endStr,
    });

    setActiveTimers(prev => prev.filter(t => t.id !== targetId));
    if (focusedTimerId === targetId) {
      setFocusedTimerId(null);
    }
  };

  const submitManual = () => {
    if (!manualStart || !manualEnd) return;
    const [sh, sm] = manualStart.split(":").map(Number);
    const [eh, em] = manualEnd.split(":").map(Number);
    let diff = (eh * 60 + em) - (sh * 60 + sm);
    if (diff <= 0) diff += 24 * 60; // 日跨ぎ
    const minutes = Math.max(1, diff);
    const cat = getCat(manualCategory);
    addTask({
      id: Date.now(),
      title: manualTitle.trim() || cat.label,
      category: manualCategory,
      minutes,
      startTime: manualStart,
      endTime: manualEnd,
    });
    setManualTitle("");
    setManualCategory("deepwork");
    setManualStart("");
    setManualEnd("");
    setShowManual(false);
  };

  const removeCard = (id: number) => deleteTask(id);

  const startEdit = (card: TaskCard) => {
    setEditingId(card.id);
    setEditTitle(card.title);
    setEditCategory(card.category);
    setEditStart(card.startTime);
    setEditEnd(card.endTime);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const saveEdit = (id: number) => {
    const [sh, sm] = editStart.split(":").map(Number);
    const [eh, em] = editEnd.split(":").map(Number);
    let diff = (eh * 60 + em) - (sh * 60 + sm);
    if (diff <= 0) diff += 24 * 60;
    const minutes = Math.max(1, diff);
    updateTask(id, {
      title: editTitle.trim() || getCat(editCategory).label,
      category: editCategory,
      startTime: editStart,
      endTime: editEnd,
      minutes,
    });
    setEditingId(null);
  };

  const shiftDate = (dateStr: string, delta: number): string => {
    const d = new Date(dateStr + "T00:00:00");
    d.setDate(d.getDate() + delta);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };

  const formatDateLabel = (dateStr: string): string => {
    const d = new Date(dateStr + "T00:00:00");
    const dayNames = ["日", "月", "火", "水", "木", "金", "土"];
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日（${dayNames[d.getDay()]}）`;
  };

  const isToday = summaryDate === todayStr();

  const loading = catLoading || taskLoading;
  const totalMin = cards.reduce((s, c) => s + c.minutes, 0);
  const now = new Date();
  const dayNames = ["日", "月", "火", "水", "木", "金", "土"];
  const dateStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日（${dayNames[now.getDay()]}）`;
  const activeCat = focusedTimer ? getCat(focusedTimer.category) : getCat(newTimerCategory);
  const catSummary = buildCatSummary(categories, cards);

  // Summary view calculations
  const summaryTotalMin = summaryCards.reduce((s, c) => s + c.minutes, 0);
  const summaryCatSummary = buildCatSummary(categories, summaryCards);

  if (loading && categories.length === 0) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(180deg, #07070a 0%, #0d0d14 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          color: "#555", fontSize: 14,
          fontFamily: "'Helvetica Neue', 'Hiragino Sans', 'Noto Sans JP', sans-serif",
        }}
      >
        読み込み中...
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #07070a 0%, #0d0d14 100%)",
        fontFamily: "'Helvetica Neue', 'Hiragino Sans', 'Noto Sans JP', sans-serif",
        color: "#e8e8ec",
        position: "relative",
      }}
    >
      {showCatEditor && (
        <CategoryEditor
          categories={categories}
          onUpdate={updateCategory}
          onAdd={addCategory}
          onDelete={deleteCategory}
          onReorder={reorderCategories}
          onClose={() => setShowCatEditor(false)}
        />
      )}

      {/* Ambient glow */}
      <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, pointerEvents: "none", zIndex: 0 }}>
        <div
          style={{
            position: "absolute", top: "5%", left: "50%", transform: "translateX(-50%)",
            width: 300, height: 300, borderRadius: "50%",
            background: activeTimers.length > 0 ? getCat(activeTimers[0].category).color : "#4ECDC4",
            opacity: activeTimers.length > 0 ? 0.06 : 0.02,
            filter: "blur(80px)", transition: "all 1s ease",
          }}
        />
      </div>

      <div style={{ position: "relative", zIndex: 1, maxWidth: 520, margin: "0 auto", padding: "0 20px" }}>
        {/* ─── Header ─── */}
        <header style={{ paddingTop: 40, marginBottom: 24 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 34, height: 34, borderRadius: 9,
                  background: "linear-gradient(135deg, #4ECDC4 0%, #44B09E 100%)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 17, fontWeight: 800, color: "#000",
                  boxShadow: "0 4px 16px rgba(78,205,196,0.25)",
                }}
              >
                D
              </div>
              <div>
                <span style={{ fontSize: 19, fontWeight: 700, letterSpacing: -0.5 }}>DayStack</span>
                <span
                  style={{
                    marginLeft: 8, padding: "2px 8px", borderRadius: 6,
                    fontSize: 10, fontWeight: 700,
                    background: "rgba(78,205,196,0.15)", color: "#4ECDC4",
                    letterSpacing: 0.5,
                  }}
                >
                  BETA
                </span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <button
                onClick={() => setShowCatEditor(true)}
                title="カテゴリ設定"
                style={{
                  width: 32, height: 32, borderRadius: 8,
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.03)", color: "#666",
                  fontSize: 15, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                ⚙️
              </button>
              <button
                onClick={signOut}
                title="サインアウト"
                style={{
                  width: 32, height: 32, borderRadius: 8,
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.03)", color: "#666",
                  fontSize: 13, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                ↩
              </button>
              <div
                style={{
                  display: "flex", gap: 3,
                  background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: 3,
                }}
              >
                {(
                  [
                    { key: "today", label: "タイマー" },
                    { key: "summary", label: "サマリー" },
                    { key: "share", label: "シェア" },
                  ] as { key: ViewMode; label: string }[]
                ).map((v) => (
                  <button
                    key={v.key}
                    onClick={() => setView(v.key)}
                    style={{
                      padding: "5px 12px", borderRadius: 6, border: "none", cursor: "pointer",
                      fontSize: 11, fontWeight: 600, transition: "all 0.2s",
                      background: view === v.key ? "rgba(78,205,196,0.15)" : "transparent",
                      color: view === v.key ? "#4ECDC4" : "#555",
                    }}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div style={{ fontSize: 12, color: "#555", marginTop: 6 }}>
            {dateStr} — {cards.length}タスク・{fmtMin(totalMin)}
          </div>
        </header>

        {/* ─── TIMER VIEW ─── */}
        {view === "today" && (
          <div>
            <div
              style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                padding: "20px 0 32px", marginBottom: 20,
                borderBottom: "1px solid rgba(255,255,255,0.04)",
              }}
            >
              {/* Timer rings — single or parallel */}
              {activeTimers.length === 0 ? (
                <>
                  {/* Idle ring */}
                  <div style={{ position: "relative", width: 200, height: 200, marginBottom: 20 }}>
                    <TimerRing elapsed={0} isRunning={false} color={activeCat.color} />
                    <div
                      style={{
                        position: "absolute", top: "50%", left: "50%",
                        transform: "translate(-50%, -50%)", textAlign: "center",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 36, fontWeight: 800, letterSpacing: -1,
                          fontVariantNumeric: "tabular-nums", color: "#555",
                        }}
                      >
                        {fmtTime(0)}
                      </div>
                    </div>
                  </div>

                  {/* Category pills */}
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center", marginBottom: 16 }}>
                    {categories.map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setNewTimerCategory(cat.id)}
                        style={{
                          padding: "7px 14px", borderRadius: 20, border: "none",
                          cursor: "pointer",
                          fontSize: 12, fontWeight: 600, transition: "all 0.25s",
                          background: newTimerCategory === cat.id ? cat.color + "25" : "rgba(255,255,255,0.04)",
                          color: newTimerCategory === cat.id ? cat.color : "#666",
                          boxShadow: newTimerCategory === cat.id ? `0 0 12px ${cat.color}15` : "none",
                        }}
                      >
                        {cat.icon} {cat.label}
                      </button>
                    ))}
                  </div>

                  {/* Title input */}
                  <input
                    value={newTimerTitle}
                    onChange={(e) => setNewTimerTitle(e.target.value)}
                    placeholder="タスク名（省略可）"
                    style={{
                      width: "80%", maxWidth: 320, padding: "10px 16px", borderRadius: 12,
                      border: "1px solid rgba(255,255,255,0.08)",
                      background: "rgba(0,0,0,0.3)", color: "#fff", fontSize: 14,
                      textAlign: "center", outline: "none", boxSizing: "border-box",
                    }}
                  />

                  {/* START */}
                  <button
                    onClick={startTimer}
                    style={{
                      marginTop: 20, width: 180, padding: "14px 0", borderRadius: 16,
                      border: "none", cursor: "pointer", fontSize: 16, fontWeight: 800,
                      letterSpacing: 1, transition: "all 0.3s",
                      background: "linear-gradient(135deg, #4ECDC4, #44B09E)",
                      color: "#000",
                      boxShadow: "0 8px 32px rgba(78,205,196,0.25)",
                    }}
                  >
                    ▶  START
                  </button>
                </>
              ) : (
                <>
                  {/* Active timer rings — displayed side by side */}
                  <div style={{
                    display: "flex", gap: activeTimers.length >= 2 ? 12 : 0,
                    justifyContent: "center", alignItems: "flex-start",
                    marginBottom: 20, flexWrap: "wrap",
                  }}>
                    {activeTimers.map((timer) => {
                      const tCat = getCat(timer.category);
                      const ringSize = activeTimers.length === 1 ? 200 : 150;
                      const fontSize = activeTimers.length === 1 ? 36 : 24;
                      const labelSize = activeTimers.length === 1 ? 11 : 10;
                      return (
                        <div key={timer.id} style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
                          {/* Ring + overlay */}
                          <div style={{ position: "relative", width: ringSize, height: ringSize, marginBottom: 10 }}>
                            <TimerRing elapsed={timer.elapsed} isRunning={true} color={tCat.color} size={ringSize} />
                            <div
                              style={{
                                position: "absolute", top: "50%", left: "50%",
                                transform: "translate(-50%, -50%)", textAlign: "center",
                              }}
                            >
                              <div
                                style={{
                                  fontSize, fontWeight: 800, letterSpacing: -1,
                                  fontVariantNumeric: "tabular-nums", color: "#fff",
                                }}
                              >
                                {fmtTime(timer.elapsed)}
                              </div>
                              <div style={{ fontSize: labelSize, color: tCat.color, marginTop: 2, fontWeight: 600 }}>
                                {tCat.icon} {tCat.label}
                              </div>
                            </div>
                          </div>

                          {/* Title input per timer */}
                          <input
                            value={timer.title}
                            onChange={(e) => {
                              const val = e.target.value;
                              setActiveTimers(prev => prev.map(t =>
                                t.id === timer.id ? { ...t, title: val } : t
                              ));
                            }}
                            placeholder="何をやってる？"
                            style={{
                              width: activeTimers.length === 1 ? "80%" : "100%",
                              maxWidth: activeTimers.length === 1 ? 320 : 150,
                              padding: activeTimers.length === 1 ? "10px 16px" : "7px 10px",
                              borderRadius: 10,
                              border: `1px solid ${tCat.color}30`,
                              background: "rgba(0,0,0,0.3)", color: "#fff",
                              fontSize: activeTimers.length === 1 ? 14 : 12,
                              textAlign: "center", outline: "none", boxSizing: "border-box",
                            }}
                          />

                          {/* STOP button per timer */}
                          <button
                            onClick={() => stopTimer(timer.id)}
                            style={{
                              marginTop: 10,
                              width: activeTimers.length === 1 ? 180 : 120,
                              padding: activeTimers.length === 1 ? "14px 0" : "10px 0",
                              borderRadius: activeTimers.length === 1 ? 16 : 12,
                              border: "none", cursor: "pointer",
                              fontSize: activeTimers.length === 1 ? 16 : 13,
                              fontWeight: 800, letterSpacing: 1, transition: "all 0.3s",
                              background: "linear-gradient(135deg, #FF6B6B, #ee5a24)",
                              color: "#000",
                              boxShadow: `0 8px 32px rgba(255,107,107,${pulse ? 0.4 : 0.2})`,
                              transform: pulse ? "scale(1.02)" : "scale(1)",
                            }}
                          >
                            ■  STOP
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {/* Add parallel timer */}
                  {!showParallelForm && (
                    <button
                      onClick={() => setShowParallelForm(true)}
                      style={{
                        padding: "8px 16px", borderRadius: 10, border: "none",
                        background: "rgba(255,255,255,0.04)", color: "#666",
                        fontSize: 12, fontWeight: 600, cursor: "pointer",
                        transition: "all 0.2s",
                      }}
                    >
                      ＋ 並行タスクを追加
                    </button>
                  )}
                  {showParallelForm && (
                    <div
                      style={{
                        marginTop: 8, padding: 16, borderRadius: 14, width: "90%", maxWidth: 360,
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        boxSizing: "border-box",
                      }}
                    >
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 10 }}>
                        {categories.map((cat) => (
                          <button
                            key={cat.id}
                            onClick={() => setNewTimerCategory(cat.id)}
                            style={{
                              padding: "5px 10px", borderRadius: 14, border: "none",
                              cursor: "pointer", fontSize: 11, fontWeight: 600,
                              transition: "all 0.2s",
                              background: newTimerCategory === cat.id ? cat.color + "25" : "rgba(255,255,255,0.04)",
                              color: newTimerCategory === cat.id ? cat.color : "#666",
                            }}
                          >
                            {cat.icon} {cat.label}
                          </button>
                        ))}
                      </div>
                      <input
                        value={newTimerTitle}
                        onChange={(e) => setNewTimerTitle(e.target.value)}
                        placeholder="タスク名（省略可）"
                        style={{
                          width: "100%", padding: "9px 12px", borderRadius: 10,
                          border: "1px solid rgba(255,255,255,0.08)",
                          background: "rgba(0,0,0,0.3)", color: "#fff",
                          fontSize: 13, outline: "none", marginBottom: 10, boxSizing: "border-box",
                        }}
                      />
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                        <button
                          onClick={() => { setShowParallelForm(false); setNewTimerTitle(""); }}
                          style={{
                            padding: "8px 14px", borderRadius: 10, border: "none",
                            background: "rgba(255,255,255,0.06)", color: "#888",
                            fontSize: 12, fontWeight: 600, cursor: "pointer",
                          }}
                        >
                          キャンセル
                        </button>
                        <button
                          onClick={() => { startTimer(); setShowParallelForm(false); }}
                          style={{
                            padding: "8px 20px", borderRadius: 10, border: "none",
                            background: "linear-gradient(135deg, #4ECDC4, #44B09E)",
                            color: "#000", fontSize: 12, fontWeight: 700, cursor: "pointer",
                          }}
                        >
                          ▶ START
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Mini progress bar */}
            {cards.length > 0 && (
              <div style={{ display: "flex", height: 5, borderRadius: 3, overflow: "hidden", marginBottom: 16, gap: 2 }}>
                {catSummary.map((c) => (
                  <div key={c.id} style={{ flex: c.pct, background: c.color, borderRadius: 3, transition: "flex 0.5s" }} />
                ))}
              </div>
            )}

            {/* Records header */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <span style={{ fontSize: 12, color: "#666", fontWeight: 600, letterSpacing: 0.5 }}>今日の記録</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 11, color: "#444" }}>{cards.length}件</span>
                <button
                  onClick={() => setShowManual((v) => !v)}
                  style={{
                    padding: "4px 10px", borderRadius: 8, border: "none",
                    background: showManual ? "rgba(78,205,196,0.15)" : "rgba(255,255,255,0.06)",
                    color: showManual ? "#4ECDC4" : "#888",
                    fontSize: 11, fontWeight: 600, cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  ＋ 手動で追加
                </button>
              </div>
            </div>

            {/* Manual entry form */}
            {showManual && (
              <div
                style={{
                  marginBottom: 12, padding: 16, borderRadius: 14,
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                {/* Category pills */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 12 }}>
                  {categories.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setManualCategory(cat.id)}
                      style={{
                        padding: "5px 10px", borderRadius: 14, border: "none",
                        cursor: "pointer", fontSize: 11, fontWeight: 600,
                        transition: "all 0.2s",
                        background: manualCategory === cat.id ? cat.color + "25" : "rgba(255,255,255,0.04)",
                        color: manualCategory === cat.id ? cat.color : "#666",
                      }}
                    >
                      {cat.icon} {cat.label}
                    </button>
                  ))}
                </div>
                {/* Title */}
                <input
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  placeholder="タスク名（省略可）"
                  style={{
                    width: "100%", padding: "9px 12px", borderRadius: 10,
                    border: "1px solid rgba(255,255,255,0.08)",
                    background: "rgba(0,0,0,0.3)", color: "#fff",
                    fontSize: 13, outline: "none", marginBottom: 10, boxSizing: "border-box",
                  }}
                />
                {/* Time inputs */}
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                  <input
                    type="time"
                    value={manualStart}
                    onChange={(e) => setManualStart(e.target.value)}
                    style={{
                      flex: 1, padding: "8px 10px", borderRadius: 10,
                      border: "1px solid rgba(255,255,255,0.08)",
                      background: "rgba(0,0,0,0.3)", color: "#fff",
                      fontSize: 13, outline: "none",
                    }}
                  />
                  <span style={{ color: "#555", fontSize: 13 }}>→</span>
                  <input
                    type="time"
                    value={manualEnd}
                    onChange={(e) => setManualEnd(e.target.value)}
                    style={{
                      flex: 1, padding: "8px 10px", borderRadius: 10,
                      border: "1px solid rgba(255,255,255,0.08)",
                      background: "rgba(0,0,0,0.3)", color: "#fff",
                      fontSize: 13, outline: "none",
                    }}
                  />
                </div>
                {/* Actions */}
                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                  <button
                    onClick={() => { setShowManual(false); setManualTitle(""); setManualStart(""); setManualEnd(""); }}
                    style={{
                      padding: "8px 16px", borderRadius: 10, border: "none",
                      background: "rgba(255,255,255,0.06)", color: "#888",
                      fontSize: 12, fontWeight: 600, cursor: "pointer",
                    }}
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={submitManual}
                    disabled={!manualStart || !manualEnd}
                    style={{
                      padding: "8px 20px", borderRadius: 10, border: "none",
                      background: manualStart && manualEnd
                        ? "linear-gradient(135deg, #4ECDC4, #44B09E)"
                        : "rgba(255,255,255,0.06)",
                      color: manualStart && manualEnd ? "#000" : "#555",
                      fontSize: 12, fontWeight: 700, cursor: manualStart && manualEnd ? "pointer" : "default",
                      transition: "all 0.2s",
                    }}
                  >
                    追加
                  </button>
                </div>
              </div>
            )}

            {/* Card list */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {cards.map((card) => {
                const cat = getCat(card.category);
                const isHovered = hoveredCard === card.id;
                const isEditing = editingId === card.id;

                if (isEditing) {
                  const editCat = getCat(editCategory);
                  return (
                    <div
                      key={card.id}
                      style={{
                        padding: 16, borderRadius: 14,
                        background: "rgba(255,255,255,0.04)",
                        border: `1px solid ${editCat.color}33`,
                      }}
                    >
                      {/* Category pills */}
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 10 }}>
                        {categories.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => setEditCategory(c.id)}
                            style={{
                              padding: "4px 10px", borderRadius: 14, border: "none",
                              cursor: "pointer", fontSize: 11, fontWeight: 600,
                              transition: "all 0.2s",
                              background: editCategory === c.id ? c.color + "25" : "rgba(255,255,255,0.04)",
                              color: editCategory === c.id ? c.color : "#666",
                            }}
                          >
                            {c.icon} {c.label}
                          </button>
                        ))}
                      </div>
                      {/* Title */}
                      <input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        placeholder="タスク名（省略可）"
                        autoFocus
                        style={{
                          width: "100%", padding: "8px 12px", borderRadius: 10,
                          border: `1px solid ${editCat.color}33`,
                          background: "rgba(0,0,0,0.3)", color: "#fff",
                          fontSize: 13, outline: "none", marginBottom: 10, boxSizing: "border-box",
                        }}
                      />
                      {/* Time inputs */}
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                        <input
                          type="time"
                          value={editStart}
                          onChange={(e) => setEditStart(e.target.value)}
                          style={{
                            flex: 1, padding: "7px 10px", borderRadius: 10,
                            border: "1px solid rgba(255,255,255,0.08)",
                            background: "rgba(0,0,0,0.3)", color: "#fff",
                            fontSize: 13, outline: "none",
                          }}
                        />
                        <span style={{ color: "#555", fontSize: 13 }}>→</span>
                        <input
                          type="time"
                          value={editEnd}
                          onChange={(e) => setEditEnd(e.target.value)}
                          style={{
                            flex: 1, padding: "7px 10px", borderRadius: 10,
                            border: "1px solid rgba(255,255,255,0.08)",
                            background: "rgba(0,0,0,0.3)", color: "#fff",
                            fontSize: 13, outline: "none",
                          }}
                        />
                      </div>
                      {/* Actions */}
                      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                        <button
                          onClick={cancelEdit}
                          style={{
                            padding: "7px 14px", borderRadius: 10, border: "none",
                            background: "rgba(255,255,255,0.06)", color: "#888",
                            fontSize: 12, fontWeight: 600, cursor: "pointer",
                          }}
                        >
                          キャンセル
                        </button>
                        <button
                          onClick={() => saveEdit(card.id)}
                          disabled={!editStart || !editEnd}
                          style={{
                            padding: "7px 18px", borderRadius: 10, border: "none",
                            background: editStart && editEnd
                              ? "linear-gradient(135deg, #4ECDC4, #44B09E)"
                              : "rgba(255,255,255,0.06)",
                            color: editStart && editEnd ? "#000" : "#555",
                            fontSize: 12, fontWeight: 700,
                            cursor: editStart && editEnd ? "pointer" : "default",
                            transition: "all 0.2s",
                          }}
                        >
                          保存
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={card.id}
                    onMouseEnter={() => setHoveredCard(card.id)}
                    onMouseLeave={() => setHoveredCard(null)}
                    style={{
                      display: "flex", alignItems: "center", gap: 12,
                      padding: "12px 16px", borderRadius: 12,
                      background: isHovered ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.02)",
                      border: `1px solid ${isHovered ? cat.color + "22" : "rgba(255,255,255,0.03)"}`,
                      transition: "all 0.25s", cursor: "default",
                    }}
                  >
                    <div
                      style={{
                        width: 4, height: 36, borderRadius: 2,
                        background: cat.color, opacity: 0.6, flexShrink: 0,
                      }}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 13, fontWeight: 600,
                          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                        }}
                      >
                        {card.title}
                      </div>
                      <div style={{ display: "flex", gap: 8, fontSize: 11, color: "#666", marginTop: 2 }}>
                        <span style={{ color: cat.color + "bb" }}>{cat.label}</span>
                        <span>
                          {card.startTime} → {card.endTime}
                        </span>
                        <span>{fmtMin(card.minutes)}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => startEdit(card)}
                      title="編集"
                      style={{
                        width: 22, height: 22, borderRadius: 6, border: "none",
                        background: isHovered ? "rgba(78,205,196,0.12)" : "transparent",
                        color: isHovered ? "#4ECDC4" : "transparent",
                        cursor: "pointer", fontSize: 12,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "all 0.2s", flexShrink: 0,
                      }}
                    >
                      ✎
                    </button>
                    <button
                      onClick={() => removeCard(card.id)}
                      title="削除"
                      style={{
                        width: 22, height: 22, borderRadius: 6, border: "none",
                        background: isHovered ? "rgba(255,107,107,0.12)" : "transparent",
                        color: isHovered ? "#FF6B6B" : "transparent",
                        cursor: "pointer", fontSize: 13,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "all 0.2s", flexShrink: 0,
                      }}
                    >
                      ×
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ─── SUMMARY VIEW ─── */}
        {view === "summary" && (
          <div>
            {/* Date navigation */}
            <div
              style={{
                display: "flex", alignItems: "center", justifyContent: "center",
                gap: 16, marginBottom: 20,
              }}
            >
              <button
                onClick={() => setSummaryDate(shiftDate(summaryDate, -1))}
                style={{
                  width: 36, height: 36, borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.03)", color: "#888",
                  fontSize: 16, cursor: "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                ‹
              </button>
              <div style={{ textAlign: "center", minWidth: 180 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#ccc" }}>
                  {formatDateLabel(summaryDate)}
                </div>
                <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>
                  {summaryCards.length}タスク・{fmtMin(summaryTotalMin)}
                </div>
              </div>
              <button
                onClick={() => setSummaryDate(shiftDate(summaryDate, 1))}
                disabled={isToday}
                style={{
                  width: 36, height: 36, borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "rgba(255,255,255,0.03)",
                  color: isToday ? "#333" : "#888",
                  fontSize: 16, cursor: isToday ? "default" : "pointer",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                ›
              </button>
              {!isToday && (
                <button
                  onClick={() => setSummaryDate(todayStr())}
                  style={{
                    padding: "6px 12px", borderRadius: 8, border: "none",
                    background: "rgba(78,205,196,0.15)", color: "#4ECDC4",
                    fontSize: 11, fontWeight: 600, cursor: "pointer",
                  }}
                >
                  今日
                </button>
              )}
            </div>

            {summaryLoading ? (
              <div style={{ textAlign: "center", padding: "40px 0", color: "#555", fontSize: 13 }}>
                読み込み中...
              </div>
            ) : summaryCards.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 0", color: "#444", fontSize: 13 }}>
                この日の記録はありません
              </div>
            ) : (
              <>
                {/* Time breakdown */}
                <div
                  style={{
                    background: "rgba(255,255,255,0.03)", borderRadius: 20, padding: 24,
                    border: "1px solid rgba(255,255,255,0.06)", marginBottom: 20,
                  }}
                >
                  <div style={{ fontSize: 13, color: "#888", marginBottom: 12, fontWeight: 600 }}>⏱ 時間配分</div>
                  <div style={{ display: "flex", height: 44, borderRadius: 12, overflow: "hidden", gap: 3, marginBottom: 16 }}>
                    {summaryCatSummary.map((c) => (
                      <div
                        key={c.id}
                        style={{
                          flex: c.pct,
                          background: `linear-gradient(180deg, ${c.color} 0%, ${c.color}aa 100%)`,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 13, fontWeight: 700, color: "#000", borderRadius: 4,
                          minWidth: c.pct > 10 ? "auto" : 0, transition: "flex 0.5s ease",
                        }}
                      >
                        {c.pct > 14 ? `${c.pct}%` : ""}
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "10px 20px" }}>
                    {summaryCatSummary.map((c) => (
                      <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 10, height: 10, borderRadius: 3, background: c.color }} />
                        <span style={{ fontSize: 13, color: "#ccc" }}>{c.label}</span>
                        <span style={{ fontSize: 12, color: "#666" }}>
                          {c.minutes}m ({c.pct}%)
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Timeline */}
                <div
                  style={{
                    background: "rgba(255,255,255,0.03)", borderRadius: 20, padding: 24,
                    border: "1px solid rgba(255,255,255,0.06)", marginBottom: 20,
                  }}
                >
                  <div style={{ fontSize: 13, color: "#888", marginBottom: 16, fontWeight: 600 }}>📅 タイムライン</div>
                  <div style={{ position: "relative", paddingLeft: 20 }}>
                    <div
                      style={{
                        position: "absolute", left: 5, top: 4, bottom: 4,
                        width: 2, background: "rgba(255,255,255,0.06)", borderRadius: 1,
                      }}
                    />
                    {summaryCards.map((card, i) => {
                      const cat = getCat(card.category);
                      return (
                        <div key={card.id} style={{ position: "relative", marginBottom: i < summaryCards.length - 1 ? 16 : 0 }}>
                          <div
                            style={{
                              position: "absolute", left: -18, top: 6,
                              width: 10, height: 10, borderRadius: "50%",
                              background: cat.color, border: "2px solid #0d0d14",
                            }}
                          />
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                            <span style={{ fontSize: 13, fontWeight: 600 }}>{card.title}</span>
                            <span style={{ fontSize: 11, color: "#555", flexShrink: 0, marginLeft: 8 }}>
                              {fmtMin(card.minutes)}
                            </span>
                          </div>
                          <div style={{ fontSize: 11, color: "#555", marginTop: 2 }}>
                            {card.startTime} → {card.endTime}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Metrics */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
                  {[
                    {
                      label: "合計タスク",
                      value: `${summaryCards.length}件`,
                      sub: summaryCards.length >= 6 ? "よく頑張った！" : "いいペース",
                    },
                    {
                      label: "総作業時間",
                      value: fmtMin(summaryTotalMin),
                      sub: summaryTotalMin > 360 ? "ハードな1日" : "バランス◎",
                    },
                    {
                      label: "集中作業率",
                      value: `${summaryCatSummary.find((c) => c.id === "deepwork")?.pct || 0}%`,
                      sub:
                        (summaryCatSummary.find((c) => c.id === "deepwork")?.pct || 0) >= 30
                          ? "🔥 高い！"
                          : "もう少し確保",
                    },
                    {
                      label: "会議率",
                      value: `${summaryCatSummary.find((c) => c.id === "meeting")?.pct || 0}%`,
                      sub:
                        (summaryCatSummary.find((c) => c.id === "meeting")?.pct || 0) > 40 ? "⚠️ 多め" : "✅ 適正",
                    },
                  ].map((m, i) => (
                    <div
                      key={i}
                      style={{
                        padding: "16px 14px", borderRadius: 14,
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(255,255,255,0.06)",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 10, color: "#888", marginBottom: 4,
                          letterSpacing: 0.5, textTransform: "uppercase",
                        }}
                      >
                        {m.label}
                      </div>
                      <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: -1, marginBottom: 2 }}>
                        {m.value}
                      </div>
                      <div style={{ fontSize: 11, color: "#555" }}>{m.sub}</div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Weekly DNA */}
            <div style={{ marginBottom: 20 }}>
              <WeeklyDNA categories={categories} weekTasks={weekTasks} />
            </div>

            {/* AI Insight — 準備中 */}
            <div
              style={{
                padding: 20, borderRadius: 16,
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.06)",
                position: "relative", overflow: "hidden",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#888" }}>🤖 AI振り返り</span>
                <span
                  style={{
                    padding: "2px 8px", borderRadius: 6, fontSize: 10, fontWeight: 700,
                    background: "rgba(255,255,255,0.06)", color: "#666", letterSpacing: 0.5,
                  }}
                >
                  準備中
                </span>
              </div>
              <div style={{ fontSize: 13, lineHeight: 1.8, color: "#555" }}>
                AIがあなたの1日を分析し、働き方の傾向や改善ポイントを自動でフィードバックします。
                API連携の準備が整い次第、利用可能になります。
              </div>
              <div
                style={{
                  position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                  background:
                    "repeating-linear-gradient(135deg, transparent, transparent 10px, rgba(255,255,255,0.01) 10px, rgba(255,255,255,0.01) 20px)",
                  pointerEvents: "none",
                }}
              />
            </div>
          </div>
        )}

        {/* ─── SHARE VIEW ─── */}
        {view === "share" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
            <div style={{ marginBottom: 24, textAlign: "center" }}>
              <div style={{ fontSize: 14, color: "#ccc", marginBottom: 4 }}>今日のDayStackをシェア</div>
              <div style={{ fontSize: 12, color: "#555" }}>画像を長押しまたは右クリックで保存</div>
            </div>
            <div ref={shareRef}>
              <ShareImage cards={cards} dateStr={dateStr} categories={categories} />
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 28 }}>
              <button
                onClick={handleShareTwitter}
                style={{
                  padding: "12px 28px", borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "#1a1a2e", color: "#fff",
                  fontSize: 14, fontWeight: 600, cursor: "pointer",
                }}
              >
                𝕏 でシェア
              </button>
              <button
                onClick={handleCopy}
                style={{
                  padding: "12px 28px", borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(255,255,255,0.08)", color: "#ccc",
                  fontSize: 14, fontWeight: 600, cursor: "pointer",
                }}
              >
                コピー
              </button>
            </div>
            {shareStatus && (
              <div style={{ marginTop: 12, fontSize: 13, color: "#4ECDC4", fontWeight: 600 }}>
                {shareStatus}
              </div>
            )}
            <div style={{ marginTop: 40, width: "100%" }}>
              <WeeklyDNA categories={categories} weekTasks={weekTasks} />
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ textAlign: "center", padding: "48px 0 32px", fontSize: 11, color: "#2a2a2a" }}>
          DayStack β — Stack your day, own your time.
        </div>
      </div>
    </div>
  );
}
