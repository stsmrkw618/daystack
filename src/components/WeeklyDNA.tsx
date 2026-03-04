"use client";

import { Category, TaskCard, fmtMin } from "@/lib/constants";

interface WeeklyDNAProps {
  categories: Category[];
  weekTasks: TaskCard[];
}

export default function WeeklyDNA({ categories, weekTasks }: WeeklyDNAProps) {
  const days = ["月", "火", "水", "木", "金"];

  // Build week data from real tasks
  const now = new Date();
  const dayOfWeek = now.getDay();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((dayOfWeek + 6) % 7));

  const weekDates = days.map((_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  });

  const weekDateLabel = (() => {
    const m = monday;
    const f = new Date(monday);
    f.setDate(monday.getDate() + 4);
    return `${m.getMonth() + 1}/${m.getDate()} 〜 ${f.getMonth() + 1}/${f.getDate()}`;
  })();

  const weekData = weekDates.map((dateStr) => {
    const dayTasks = weekTasks.filter((t) => t.date === dateStr);
    return categories
      .map((cat) => {
        const min = dayTasks
          .filter((t) => t.category === cat.id)
          .reduce((s, t) => s + t.minutes, 0);
        return { ...cat, minutes: min };
      })
      .filter((c) => c.minutes > 0);
  });

  const hasData = weekData.some((d) => d.length > 0);

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.03)",
        borderRadius: 20,
        padding: 24,
        border: "1px solid rgba(255,255,255,0.06)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ fontSize: 13, color: "#888", fontWeight: 600 }}>📊 My Work DNA（週次）</div>
        <div style={{ fontSize: 11, color: "#444" }}>{weekDateLabel}</div>
      </div>

      {!hasData ? (
        <div style={{ textAlign: "center", padding: "20px 0", fontSize: 12, color: "#444" }}>
          今週のデータはまだありません
        </div>
      ) : (
        <>
          <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 16 }}>
            {days.map((d, di) => {
              const dayTotal = weekData[di].reduce((s, c) => s + c.minutes, 0);
              return (
                <div key={d} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1 }}>
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 2,
                      height: 120,
                      justifyContent: "flex-end",
                      width: "100%",
                    }}
                  >
                    {weekData[di].map((cat, j) => (
                      <div
                        key={j}
                        style={{
                          width: "100%",
                          height: dayTotal > 0 ? Math.max(4, (cat.minutes / dayTotal) * 100) : 0,
                          borderRadius: 3,
                          background: cat.color + "88",
                        }}
                      />
                    ))}
                  </div>
                  <div style={{ fontSize: 11, color: "#666", marginTop: 6 }}>{d}</div>
                  <div style={{ fontSize: 10, color: "#444" }}>{dayTotal > 0 ? fmtMin(dayTotal) : "-"}</div>
                </div>
              );
            })}
          </div>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 14px", justifyContent: "center" }}>
            {categories.slice(0, 4).map((cat) => (
              <div key={cat.id} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11 }}>
                <div style={{ width: 7, height: 7, borderRadius: 2, background: cat.color }} />
                <span style={{ color: "#888" }}>{cat.label}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
