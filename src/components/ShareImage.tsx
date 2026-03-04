"use client";

import { Category, TaskCard, fmtMin, buildCatSummary } from "@/lib/constants";

interface ShareImageProps {
  cards: TaskCard[];
  dateStr: string;
  categories: Category[];
}

export default function ShareImage({ cards, dateStr, categories }: ShareImageProps) {
  const totalMin = cards.reduce((s, c) => s + c.minutes, 0);
  const catSummary = buildCatSummary(categories, cards);
  const topCat = catSummary[0];

  return (
    <div
      style={{
        width: 400,
        background: "linear-gradient(145deg, #0a0a0f 0%, #1a1a2e 50%, #16213e 100%)",
        borderRadius: 24,
        padding: "32px 28px",
        color: "#fff",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute", top: -60, right: -60,
          width: 200, height: 200, borderRadius: "50%",
          background: topCat?.color || "#4ECDC4",
          opacity: 0.08, filter: "blur(40px)",
        }}
      />
      <div style={{ fontSize: 11, letterSpacing: 4, color: "#888", textTransform: "uppercase", marginBottom: 4 }}>
        DayStack
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 2 }}>{dateStr}</div>
      <div style={{ fontSize: 13, color: "#aaa", marginBottom: 24 }}>
        {cards.length}タスク・{fmtMin(totalMin)}
      </div>

      {/* Stacked bar */}
      <div style={{ display: "flex", height: 32, borderRadius: 8, overflow: "hidden", marginBottom: 20, gap: 2 }}>
        {catSummary.map((c) => (
          <div
            key={c.id}
            style={{
              flex: c.pct,
              background: c.color,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 11, fontWeight: 600, color: "#000",
              minWidth: c.pct > 8 ? "auto" : 0,
            }}
          >
            {c.pct > 12 ? `${c.pct}%` : ""}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "8px 16px", marginBottom: 16 }}>
        {catSummary.map((c) => (
          <div key={c.id} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: c.color }} />
            <span style={{ color: "#ccc" }}>{c.label}</span>
            <span style={{ color: "#666" }}>{c.minutes}m</span>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 8, textAlign: "center", fontSize: 10, color: "#444" }}>daystack.app</div>
    </div>
  );
}
