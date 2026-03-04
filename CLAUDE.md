# CLAUDE.md

## プロジェクト概要
DayStackは、デスクワーカー向けのタイマー式ワークログWebアプリ。
1日の仕事をSTART/STOPで記録し、時間配分を可視化、SNSでシェアできる。

## 技術構成
- Next.js 14 (App Router) + TypeScript
- スタイリング: インラインCSS（CSS-in-JS移行は未定）
- 状態管理: React hooks（useState/useEffect/useRef）
- DB/認証: 未実装（今後Supabase等を検討）

## コーディング規約
- コンポーネントは `src/components/` に配置
- 型定義・定数・ユーティリティは `constants.ts` に集約
- "use client" ディレクティブを各クライアントコンポーネントに付与
- 日本語UIテキストはハードコード（i18n未導入）

## 開発コマンド
```bash
npm install    # 依存インストール
npm run dev    # 開発サーバー起動 (localhost:3000)
npm run build  # プロダクションビルド
npm run lint   # ESLint実行
```

## 現在の状態
- フロントエンドUIモック完成（タイマー/サマリー/シェアの3画面）
- データは全てメモリ上（永続化なし）
- AI振り返り機能はUI上「準備中」表示
- サンプルデータが初期表示される（SAMPLE_CARDS in constants.ts）

## 次の開発優先順位
1. データ永続化（Supabase推奨）
2. ユーザー認証
3. OGP画像生成（シェア機能の実装）
4. PWA対応
5. AI振り返り（Claude API）
