"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!email.trim()) return;
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/confirm`,
      },
    });

    setLoading(false);
    if (authError) {
      setError(authError.message);
    } else {
      setSent(true);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(180deg, #07070a 0%, #0d0d14 100%)",
        fontFamily: "'Helvetica Neue', 'Hiragino Sans', 'Noto Sans JP', sans-serif",
        color: "#e8e8ec",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div style={{ width: "100%", maxWidth: 400, padding: "0 20px" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div
            style={{
              width: 56, height: 56, borderRadius: 14,
              background: "linear-gradient(135deg, #4ECDC4 0%, #44B09E 100%)",
              display: "inline-flex", alignItems: "center", justifyContent: "center",
              fontSize: 28, fontWeight: 800, color: "#000",
              boxShadow: "0 8px 32px rgba(78,205,196,0.25)",
              marginBottom: 16,
            }}
          >
            D
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.5 }}>DayStack</div>
          <div style={{ fontSize: 13, color: "#555", marginTop: 4 }}>
            Stack your day, own your time.
          </div>
        </div>

        {!sent ? (
          <div>
            <div
              style={{
                background: "rgba(255,255,255,0.03)",
                borderRadius: 20,
                padding: 28,
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>ログイン</div>
              <div style={{ fontSize: 12, color: "#555", marginBottom: 20 }}>
                メールアドレスにMagic Linkを送信します
              </div>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                placeholder="you@example.com"
                autoFocus
                style={{
                  width: "100%", padding: "12px 16px", borderRadius: 12,
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(0,0,0,0.3)", color: "#fff",
                  fontSize: 15, outline: "none", boxSizing: "border-box",
                  marginBottom: 12,
                }}
              />

              {error && (
                <div style={{ fontSize: 12, color: "#FF6B6B", marginBottom: 12 }}>
                  {error}
                </div>
              )}

              <button
                onClick={handleLogin}
                disabled={loading || !email.trim()}
                style={{
                  width: "100%", padding: "14px 0", borderRadius: 14,
                  border: "none", cursor: loading ? "wait" : "pointer",
                  fontSize: 15, fontWeight: 700,
                  background: loading
                    ? "rgba(78,205,196,0.3)"
                    : "linear-gradient(135deg, #4ECDC4, #44B09E)",
                  color: "#000",
                  boxShadow: "0 8px 32px rgba(78,205,196,0.2)",
                  transition: "all 0.3s",
                  opacity: !email.trim() ? 0.5 : 1,
                }}
              >
                {loading ? "送信中..." : "Magic Linkを送信"}
              </button>
            </div>
          </div>
        ) : (
          <div
            style={{
              background: "rgba(78,205,196,0.06)",
              borderRadius: 20,
              padding: 32,
              border: "1px solid rgba(78,205,196,0.15)",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 40, marginBottom: 16 }}>✉️</div>
            <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>
              メールを確認してください
            </div>
            <div style={{ fontSize: 13, color: "#888", lineHeight: 1.6 }}>
              <span style={{ color: "#4ECDC4", fontWeight: 600 }}>{email}</span>
              <br />
              にログインリンクを送信しました。
              <br />
              メール内のリンクをクリックしてログインしてください。
            </div>
            <button
              onClick={() => { setSent(false); setEmail(""); }}
              style={{
                marginTop: 20, padding: "10px 24px", borderRadius: 10,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "transparent", color: "#888",
                fontSize: 13, cursor: "pointer",
              }}
            >
              別のメールアドレスで試す
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
