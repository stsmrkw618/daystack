# DayStack β

> Stack your day, own your time.

1日の仕事をタイマーで記録し、時間の使い方を可視化するワークログアプリ。

## セットアップ

```bash
npm install
npm run dev
```

http://localhost:3000 で起動します。

## プロジェクト構成

```
src/
├── app/
│   ├── layout.tsx          # ルートレイアウト（メタデータ含む）
│   └── page.tsx            # エントリーポイント
├── components/
│   ├── constants.ts        # 型定義・定数・ユーティリティ関数
│   ├── DayStack.tsx        # メインコンポーネント（タイマー/サマリー/シェア）
│   ├── TimerRing.tsx       # SVGタイマーリング
│   ├── ShareImage.tsx      # SNSシェア用ビジュアルカード
│   ├── CategoryEditor.tsx  # カテゴリ設定モーダル
│   └── WeeklyDNA.tsx       # 週次ワークパターン可視化
└── styles/
    └── globals.css         # グローバルCSS
```

## 機能一覧

### 実装済み
- ⏱ タイマー式タスク記録（START/STOP）
- 🏷 カスタムカテゴリ（追加・編集・並び替え・削除）
- 📊 時間配分サマリー（棒グラフ + メトリクス）
- 📅 タイムラインビュー
- 📈 Weekly DNA（週次パターン可視化）
- 🖼 SNSシェア用ビジュアルカード
- ✏️ タスク名のインライン編集

### 準備中（API連携待ち）
- 🤖 AI振り返りフィードバック

## 今後の開発TODO

- [ ] データ永続化（Supabase / PlanetScale 等）
- [ ] ユーザー認証
- [ ] AI振り返り機能（Claude API連携）
- [ ] SNSシェア実装（OGP画像生成）
- [ ] PWA対応（モバイルでの常時利用）
- [ ] 月次Work DNA
- [ ] CSV/PDFエクスポート
- [ ] チーム機能（将来）

## 技術スタック

- Next.js 14 (App Router)
- React 18
- TypeScript
