"use client";

import { useState, useEffect, useRef } from "react";
import {
  Category, TaskCard,
  fmtTime, fmtMin, getCatFromList, buildCatSummary, todayStr,
} from "@/lib/constants";
import { useAuth } from "@/lib/hooks/useAuth";
import { useCategories } from "@/lib/hooks/useCategories";
import { useTasks } from "@/lib/hooks/useTasks";
import TimerRing from "@/components/TimerRing";
import ShareImage from "@/components/ShareImage";
import CategoryEditor from "@/components/CategoryEditor";
import WeeklyDNA from "@/components/WeeklyDNA";

type ViewMode = "today" | "summary" | "share";

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
    addTask, updateTask, deleteTask, fetchWeek,
  } = useTasks(userId);

  const [view, setView] = useState<ViewMode>("today");
  const [showCatEditor, setShowCatEditor] = useState(false);

  // Timer
  const [isRunning, setIsRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [timerCategory, setTimerCategory] = useState("deepwork");
  const [timerTitle, setTimerTitle] = useState("");
  const [timerStartTime, setTimerStartTime] = useState<Date | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Card interaction
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");

  // Weekly data
  const [weekTasks, setWeekTasks] = useState<TaskCard[]>([]);

  // Pulse animation
  const [pulse, setPulse] = useState(false);
  useEffect(() => {
    if (!isRunning) return;
    const p = setInterval(() => setPulse((v) => !v), 1500);
    return () => clearInterval(p);
  }, [isRunning]);

  // Timer tick
  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isRunning]);

  // Fetch week data when switching to summary or share
  useEffect(() => {
    if (view === "summary" || view === "share") {
      fetchWeek().then(setWeekTasks);
    }
  }, [view, fetchWeek]);

  const getCat = (id: string) => getCatFromList(categories, id);

  const startTimer = () => {
    setElapsed(0);
    setTimerStartTime(new Date());
    setIsRunning(true);
  };

  const stopTimer = () => {
    setIsRunning(false);
    const minutes = Math.max(1, Math.round(elapsed / 60));
    const startStr = timerStartTime ? timerStartTime.toTimeString().slice(0, 5) : "--:--";
    const endStr = new Date().toTimeString().slice(0, 5);
    const cat = getCat(timerCategory);
    const newTask = {
      id: Date.now(),
      title: timerTitle.trim() || cat.label,
      category: timerCategory,
      minutes,
      startTime: startStr,
      endTime: endStr,
    };
    addTask(newTask);
    setTimerTitle("");
    setElapsed(0);
    setTimerStartTime(null);
  };

  const removeCard = (id: number) => deleteTask(id);

  const startEdit = (card: TaskCard) => {
    setEditingId(card.id);
    setEditTitle(card.title);
  };

  const saveEdit = (id: number) => {
    updateTask(id, { title: editTitle });
    setEditingId(null);
  };

  const loading = catLoading || taskLoading;
  const totalMin = cards.reduce((s, c) => s + c.minutes, 0);
  const now = new Date();
  const dayNames = ["日", "月", "火", "水", "木", "金", "土"];
  const dateStr = `${now.getFullYear()}年${now.getMonth() + 1}月${now.getDate()}日（${dayNames[now.getDay()]}）`;
  const activeCat = getCat(timerCategory);
  const catSummary = buildCatSummary(categories, cards);

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
            background: isRunning ? activeCat.color : "#4ECDC4",
            opacity: isRunning ? 0.06 : 0.02,
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
              {/* Ring */}
              <div style={{ position: "relative", width: 200, height: 200, marginBottom: 20 }}>
                <TimerRing elapsed={elapsed} isRunning={isRunning} color={activeCat.color} />
                <div
                  style={{
                    position: "absolute", top: "50%", left: "50%",
                    transform: "translate(-50%, -50%)", textAlign: "center",
                  }}
                >
                  <div
                    style={{
                      fontSize: 36, fontWeight: 800, letterSpacing: -1,
                      fontVariantNumeric: "tabular-nums",
                      color: isRunning ? "#fff" : "#555",
                      transition: "color 0.3s",
                    }}
                  >
                    {fmtTime(elapsed)}
                  </div>
                  {isRunning && (
                    <div style={{ fontSize: 11, color: activeCat.color, marginTop: 2, fontWeight: 600 }}>
                      {activeCat.icon} {activeCat.label}
                    </div>
                  )}
                </div>
              </div>

              {/* Category pills */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, justifyContent: "center", marginBottom: 16 }}>
                {categories.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => !isRunning && setTimerCategory(cat.id)}
                    style={{
                      padding: "7px 14px", borderRadius: 20, border: "none",
                      cursor: isRunning ? "default" : "pointer",
                      fontSize: 12, fontWeight: 600, transition: "all 0.25s",
                      background: timerCategory === cat.id ? cat.color + "25" : "rgba(255,255,255,0.04)",
                      color: timerCategory === cat.id ? cat.color : "#666",
                      boxShadow: timerCategory === cat.id ? `0 0 12px ${cat.color}15` : "none",
                      opacity: isRunning && timerCategory !== cat.id ? 0.3 : 1,
                    }}
                  >
                    {cat.icon} {cat.label}
                  </button>
                ))}
              </div>

              {/* Title input */}
              <input
                value={timerTitle}
                onChange={(e) => setTimerTitle(e.target.value)}
                placeholder={isRunning ? "何をやってる？（後からでもOK）" : "タスク名（省略可）"}
                style={{
                  width: "80%", maxWidth: 320, padding: "10px 16px", borderRadius: 12,
                  border: `1px solid ${isRunning ? activeCat.color + "30" : "rgba(255,255,255,0.08)"}`,
                  background: "rgba(0,0,0,0.3)", color: "#fff", fontSize: 14,
                  textAlign: "center", outline: "none",
                  transition: "border-color 0.3s", boxSizing: "border-box",
                }}
              />

              {/* Start/Stop */}
              <button
                onClick={isRunning ? stopTimer : startTimer}
                style={{
                  marginTop: 20, width: 180, padding: "14px 0", borderRadius: 16,
                  border: "none", cursor: "pointer", fontSize: 16, fontWeight: 800,
                  letterSpacing: 1, transition: "all 0.3s",
                  background: isRunning
                    ? "linear-gradient(135deg, #FF6B6B, #ee5a24)"
                    : "linear-gradient(135deg, #4ECDC4, #44B09E)",
                  color: "#000",
                  boxShadow: isRunning
                    ? `0 8px 32px rgba(255,107,107,${pulse ? 0.4 : 0.2})`
                    : "0 8px 32px rgba(78,205,196,0.25)",
                  transform: pulse && isRunning ? "scale(1.02)" : "scale(1)",
                }}
              >
                {isRunning ? "■  STOP" : "▶  START"}
              </button>
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
              <span style={{ fontSize: 11, color: "#444" }}>{cards.length}件</span>
            </div>

            {/* Card list */}
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {cards.map((card) => {
                const cat = getCat(card.category);
                const isHovered = hoveredCard === card.id;
                const isEditing = editingId === card.id;
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
                      {isEditing ? (
                        <input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          onBlur={() => saveEdit(card.id)}
                          onKeyDown={(e) => e.key === "Enter" && saveEdit(card.id)}
                          autoFocus
                          style={{
                            width: "100%", background: "rgba(0,0,0,0.3)",
                            border: `1px solid ${cat.color}44`,
                            borderRadius: 6, padding: "4px 8px",
                            color: "#fff", fontSize: 13, outline: "none", boxSizing: "border-box",
                          }}
                        />
                      ) : (
                        <div
                          onClick={() => startEdit(card)}
                          style={{
                            fontSize: 13, fontWeight: 600, cursor: "text",
                            whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                          }}
                        >
                          {card.title}
                        </div>
                      )}
                      <div style={{ display: "flex", gap: 8, fontSize: 11, color: "#666", marginTop: 2 }}>
                        <span style={{ color: cat.color + "bb" }}>{cat.label}</span>
                        <span>
                          {card.startTime} → {card.endTime}
                        </span>
                        <span>{fmtMin(card.minutes)}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => removeCard(card.id)}
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
            {/* Time breakdown */}
            <div
              style={{
                background: "rgba(255,255,255,0.03)", borderRadius: 20, padding: 24,
                border: "1px solid rgba(255,255,255,0.06)", marginBottom: 20,
              }}
            >
              <div style={{ fontSize: 13, color: "#888", marginBottom: 12, fontWeight: 600 }}>⏱ 時間配分</div>
              <div style={{ display: "flex", height: 44, borderRadius: 12, overflow: "hidden", gap: 3, marginBottom: 16 }}>
                {catSummary.map((c) => (
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
                {catSummary.map((c) => (
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
                {cards.map((card, i) => {
                  const cat = getCat(card.category);
                  return (
                    <div key={card.id} style={{ position: "relative", marginBottom: i < cards.length - 1 ? 16 : 0 }}>
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
                  value: `${cards.length}件`,
                  sub: cards.length >= 6 ? "よく頑張った！" : "いいペース",
                },
                {
                  label: "総作業時間",
                  value: fmtMin(totalMin),
                  sub: totalMin > 360 ? "ハードな1日" : "バランス◎",
                },
                {
                  label: "集中作業率",
                  value: `${catSummary.find((c) => c.id === "deepwork")?.pct || 0}%`,
                  sub:
                    (catSummary.find((c) => c.id === "deepwork")?.pct || 0) >= 30
                      ? "🔥 高い！"
                      : "もう少し確保",
                },
                {
                  label: "会議率",
                  value: `${catSummary.find((c) => c.id === "meeting")?.pct || 0}%`,
                  sub:
                    (catSummary.find((c) => c.id === "meeting")?.pct || 0) > 40 ? "⚠️ 多め" : "✅ 適正",
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
            <ShareImage cards={cards} dateStr={dateStr} categories={categories} />
            <div style={{ display: "flex", gap: 12, marginTop: 28 }}>
              {[
                { label: "𝕏 でシェア", bg: "#1a1a2e", color: "#fff" },
                { label: "コピー", bg: "rgba(255,255,255,0.08)", color: "#ccc" },
              ].map((btn, i) => (
                <button
                  key={i}
                  style={{
                    padding: "12px 28px", borderRadius: 12,
                    border: "1px solid rgba(255,255,255,0.1)",
                    background: btn.bg, color: btn.color,
                    fontSize: 14, fontWeight: 600, cursor: "pointer",
                  }}
                >
                  {btn.label}
                </button>
              ))}
            </div>
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
