"use client";

import { useState } from "react";
import { Category, COLOR_PALETTE, ICON_PALETTE } from "@/lib/constants";

interface CategoryEditorProps {
  categories: Category[];
  onUpdate: (id: string, updates: Partial<Pick<Category, "label" | "color" | "icon">>) => Promise<void>;
  onAdd: (cat: Category) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onReorder: (newOrder: Category[]) => Promise<void>;
  onClose: () => void;
}

export default function CategoryEditor({ categories, onUpdate, onAdd, onDelete, onReorder, onClose }: CategoryEditorProps) {
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [draft, setDraft] = useState({ label: "", color: "#4ECDC4", icon: "💻" });
  const [showAdd, setShowAdd] = useState(false);
  const [newCat, setNewCat] = useState({ label: "", color: "#FF8A5C", icon: "💻" });

  const startEdit = (i: number) => {
    setEditingIdx(i);
    setDraft({ label: categories[i].label, color: categories[i].color, icon: categories[i].icon });
    setShowAdd(false);
  };

  const saveEdit = async () => {
    if (editingIdx === null || !draft.label.trim()) return;
    const cat = categories[editingIdx];
    await onUpdate(cat.id, { label: draft.label, color: draft.color, icon: draft.icon });
    setEditingIdx(null);
  };

  const deleteCat = async (idx: number) => {
    if (categories.length <= 2) return;
    await onDelete(categories[idx].id);
    setEditingIdx(null);
  };

  const addCat = async () => {
    if (!newCat.label.trim()) return;
    await onAdd({
      id: `custom_${Date.now()}`,
      label: newCat.label,
      color: newCat.color,
      icon: newCat.icon,
    });
    setNewCat({ label: "", color: "#FF8A5C", icon: "💻" });
    setShowAdd(false);
  };

  const moveCat = async (idx: number, dir: number) => {
    const newIdx = idx + dir;
    if (newIdx < 0 || newIdx >= categories.length) return;
    const arr = [...categories];
    [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]];
    await onReorder(arr);
  };

  return (
    <div
      style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)",
        zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 460, maxHeight: "85vh", overflowY: "auto",
          background: "linear-gradient(180deg, #13131a 0%, #0d0d14 100%)",
          borderRadius: 24, border: "1px solid rgba(255,255,255,0.08)", padding: "28px 24px",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: -0.5 }}>カテゴリ設定</div>
            <div style={{ fontSize: 12, color: "#555", marginTop: 2 }}>並び替え・編集・追加</div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 32, height: 32, borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)",
              background: "rgba(255,255,255,0.04)", color: "#888", fontSize: 16, cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            ×
          </button>
        </div>

        {/* Category list */}
        <div style={{ display: "flex", flexDirection: "column", gap: 6, marginBottom: 20 }}>
          {categories.map((cat, i) => {
            const isEditing = editingIdx === i;
            return (
              <div key={cat.id}>
                <div
                  style={{
                    display: "flex", alignItems: "center", gap: 10,
                    padding: "10px 14px", borderRadius: 12,
                    background: isEditing ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.02)",
                    border: `1px solid ${isEditing ? cat.color + "33" : "rgba(255,255,255,0.04)"}`,
                  }}
                >
                  {/* Reorder */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 1, flexShrink: 0 }}>
                    <button
                      onClick={() => moveCat(i, -1)}
                      style={{
                        width: 18, height: 14, border: "none", borderRadius: 3,
                        cursor: i === 0 ? "default" : "pointer",
                        background: "transparent", color: i === 0 ? "#2a2a2a" : "#555",
                        fontSize: 8, display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                    >
                      ▲
                    </button>
                    <button
                      onClick={() => moveCat(i, 1)}
                      style={{
                        width: 18, height: 14, border: "none", borderRadius: 3,
                        cursor: i === categories.length - 1 ? "default" : "pointer",
                        background: "transparent",
                        color: i === categories.length - 1 ? "#2a2a2a" : "#555",
                        fontSize: 8, display: "flex", alignItems: "center", justifyContent: "center",
                      }}
                    >
                      ▼
                    </button>
                  </div>
                  {/* Icon */}
                  <div
                    style={{
                      width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                      background: cat.color + "20",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 17, border: `2px solid ${cat.color}33`,
                    }}
                  >
                    {cat.icon}
                  </div>
                  {/* Label */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 600 }}>{cat.label}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: cat.color }} />
                      <span style={{ fontSize: 10, color: "#555" }}>{cat.color}</span>
                    </div>
                  </div>
                  {/* Edit toggle */}
                  <button
                    onClick={() => (isEditing ? setEditingIdx(null) : startEdit(i))}
                    style={{
                      padding: "5px 12px", borderRadius: 8,
                      border: "1px solid rgba(255,255,255,0.08)",
                      background: isEditing ? "rgba(78,205,196,0.1)" : "rgba(255,255,255,0.03)",
                      color: isEditing ? "#4ECDC4" : "#666",
                      fontSize: 11, fontWeight: 600, cursor: "pointer",
                    }}
                  >
                    {isEditing ? "閉じる" : "編集"}
                  </button>
                </div>

                {/* Inline edit panel */}
                {isEditing && (
                  <div
                    style={{
                      margin: "6px 0 8px 0", padding: 16, borderRadius: 12,
                      background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.06)",
                    }}
                  >
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 11, color: "#666", marginBottom: 4, fontWeight: 600 }}>
                        カテゴリ名
                      </div>
                      <input
                        value={draft.label}
                        onChange={(e) => setDraft({ ...draft, label: e.target.value })}
                        style={{
                          width: "100%", padding: "8px 12px", borderRadius: 8,
                          border: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.4)",
                          color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box",
                        }}
                      />
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <div style={{ fontSize: 11, color: "#666", marginBottom: 4, fontWeight: 600 }}>
                        アイコン
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {ICON_PALETTE.map((ic) => (
                          <button
                            key={ic}
                            onClick={() => setDraft({ ...draft, icon: ic })}
                            style={{
                              width: 34, height: 34, borderRadius: 8, border: "none",
                              cursor: "pointer", fontSize: 16,
                              display: "flex", alignItems: "center", justifyContent: "center",
                              background:
                                draft.icon === ic ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.03)",
                              outline: draft.icon === ic ? `2px solid ${draft.color}` : "none",
                            }}
                          >
                            {ic}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: 11, color: "#666", marginBottom: 4, fontWeight: 600 }}>
                        カラー
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {COLOR_PALETTE.map((cl) => (
                          <button
                            key={cl}
                            onClick={() => setDraft({ ...draft, color: cl })}
                            style={{
                              width: 28, height: 28, borderRadius: 7, border: "none",
                              cursor: "pointer", background: cl,
                              outline: draft.color === cl ? "2px solid #fff" : "2px solid transparent",
                              outlineOffset: 2, transition: "outline 0.15s",
                            }}
                          />
                        ))}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        onClick={saveEdit}
                        style={{
                          flex: 1, padding: "9px", borderRadius: 10, border: "none",
                          background: "linear-gradient(135deg, #4ECDC4, #44B09E)",
                          color: "#000", fontWeight: 700, fontSize: 13, cursor: "pointer",
                        }}
                      >
                        保存
                      </button>
                      <button
                        onClick={() => deleteCat(i)}
                        disabled={categories.length <= 2}
                        style={{
                          padding: "9px 16px", borderRadius: 10,
                          border: "1px solid rgba(255,107,107,0.2)",
                          background: "rgba(255,107,107,0.06)",
                          color: categories.length <= 2 ? "#333" : "#FF6B6B",
                          fontSize: 13, fontWeight: 600,
                          cursor: categories.length <= 2 ? "default" : "pointer",
                        }}
                      >
                        削除
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Add new */}
        {!showAdd ? (
          <button
            onClick={() => {
              setShowAdd(true);
              setEditingIdx(null);
            }}
            style={{
              width: "100%", padding: "12px", borderRadius: 12,
              border: "1px dashed rgba(78,205,196,0.25)",
              background: "rgba(78,205,196,0.04)",
              color: "#4ECDC4", fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}
          >
            + カテゴリを追加
          </button>
        ) : (
          <div
            style={{
              padding: 16, borderRadius: 14,
              background: "rgba(78,205,196,0.04)",
              border: "1px solid rgba(78,205,196,0.12)",
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 700, color: "#4ECDC4", marginBottom: 12 }}>
              新しいカテゴリ
            </div>
            <div style={{ marginBottom: 12 }}>
              <input
                value={newCat.label}
                onChange={(e) => setNewCat({ ...newCat, label: e.target.value })}
                placeholder="カテゴリ名"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && addCat()}
                style={{
                  width: "100%", padding: "8px 12px", borderRadius: 8,
                  border: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.4)",
                  color: "#fff", fontSize: 14, outline: "none", boxSizing: "border-box",
                }}
              />
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, color: "#666", marginBottom: 4, fontWeight: 600 }}>アイコン</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {ICON_PALETTE.map((ic) => (
                  <button
                    key={ic}
                    onClick={() => setNewCat({ ...newCat, icon: ic })}
                    style={{
                      width: 34, height: 34, borderRadius: 8, border: "none",
                      cursor: "pointer", fontSize: 16,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      background:
                        newCat.icon === ic ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.03)",
                      outline: newCat.icon === ic ? `2px solid ${newCat.color}` : "none",
                    }}
                  >
                    {ic}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: "#666", marginBottom: 4, fontWeight: 600 }}>カラー</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                {COLOR_PALETTE.map((cl) => (
                  <button
                    key={cl}
                    onClick={() => setNewCat({ ...newCat, color: cl })}
                    style={{
                      width: 28, height: 28, borderRadius: 7, border: "none",
                      cursor: "pointer", background: cl,
                      outline: newCat.color === cl ? "2px solid #fff" : "2px solid transparent",
                      outlineOffset: 2, transition: "outline 0.15s",
                    }}
                  />
                ))}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={addCat}
                style={{
                  flex: 1, padding: "9px", borderRadius: 10, border: "none",
                  background: "linear-gradient(135deg, #4ECDC4, #44B09E)",
                  color: "#000", fontWeight: 700, fontSize: 13, cursor: "pointer",
                }}
              >
                追加する
              </button>
              <button
                onClick={() => setShowAdd(false)}
                style={{
                  padding: "9px 16px", borderRadius: 10,
                  border: "1px solid rgba(255,255,255,0.08)",
                  background: "transparent", color: "#888", fontSize: 13, cursor: "pointer",
                }}
              >
                やめる
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
