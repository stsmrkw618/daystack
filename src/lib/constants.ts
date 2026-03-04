// ─── Types ───
export interface Category {
  id: string;
  label: string;
  color: string;
  icon: string;
}

export interface TaskCard {
  id: number;
  title: string;
  category: string;
  minutes: number;
  startTime: string;
  endTime: string;
  date: string; // "YYYY-MM-DD"
}

export interface CatSummary extends Category {
  minutes: number;
  pct: number;
}

// ─── Default Categories ───
export const DEFAULT_CATEGORIES: Category[] = [
  { id: "meeting", label: "会議", color: "#FF6B6B", icon: "🗣" },
  { id: "deepwork", label: "集中作業", color: "#4ECDC4", icon: "🔥" },
  { id: "email", label: "メール/チャット", color: "#FFE66D", icon: "✉️" },
  { id: "planning", label: "企画/思考", color: "#A8E6CF", icon: "💡" },
  { id: "admin", label: "事務/雑務", color: "#DDA0DD", icon: "📋" },
  { id: "learning", label: "学習/インプット", color: "#87CEEB", icon: "📚" },
];

export const COLOR_PALETTE = [
  "#FF6B6B", "#4ECDC4", "#FFE66D", "#A8E6CF", "#DDA0DD", "#87CEEB",
  "#FF8A5C", "#6C5CE7", "#FD79A8", "#00CEC9", "#E17055", "#74B9FF",
  "#FDCB6E", "#55E6C1", "#E056A0", "#A29BFE",
];

export const ICON_PALETTE = [
  "🗣", "🔥", "✉️", "💡", "📋", "📚", "💻", "📞", "✏️", "🎯",
  "📊", "🤝", "🧪", "🎨", "📝", "⚙️", "🔍", "📱", "🏃", "☕",
];

// ─── Utilities ───
export const todayStr = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export const fmtTime = (sec: number): string => {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
    : `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
};

export const fmtMin = (min: number): string => {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};

export const getCatFromList = (categories: Category[], id: string): Category => {
  return categories.find((c) => c.id === id) || categories[0];
};

export const buildCatSummary = (categories: Category[], cards: TaskCard[]): CatSummary[] => {
  const totalMin = cards.reduce((s, c) => s + c.minutes, 0);
  return categories
    .map((cat) => {
      const min = cards.filter((c) => c.category === cat.id).reduce((s, c) => s + c.minutes, 0);
      return { ...cat, minutes: min, pct: totalMin ? Math.round((min / totalMin) * 100) : 0 };
    })
    .filter((c) => c.minutes > 0)
    .sort((a, b) => b.minutes - a.minutes);
};
