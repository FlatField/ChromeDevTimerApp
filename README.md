# Timer - Chrome Extension

シンプルでエレガントなフローティングタイマー Chrome拡張機能

## 機能

- ⏱️ シンプルなカウントダウンタイマー
- 🎯 1分単位での時間設定
- 🕐 60分以上は時間:分:秒形式で表示
- 🪟 独立したフローティングウィンドウ
- 💾 タイマー状態の自動保存
- 🍎 Apple風のミニマルデザイン

## 使い方

1. **Start**: タイマーを開始
2. **Stop**: タイマーを一時停止 → ボタンが「End Timer」に変化
3. **Resume**: 一時停止中のタイマーを再開
4. **End Timer**: タイマーをリセットして終了

## インストール方法

### 1. アイコンの生成

1. `icons/generate-icons.html` をブラウザで開く
2. 「すべてダウンロード」ボタンをクリック
3. ダウンロードされた3つのPNGファイルを `icons/` フォルダに移動：
   - `icon16.png`
   - `icon48.png`
   - `icon128.png`

### 2. Chrome への読み込み

1. Chrome で `chrome://extensions/` を開く
2. 右上の「デベロッパーモード」をオンにする
3. 「パッケージ化されていない拡張機能を読み込む」をクリック
4. `TimerApp` フォルダを選択

### 3. 使用開始

- ツールバーのタイマーアイコンをクリック
- フローティングウィンドウが表示されます
- 時間を入力して Start ボタンを押すだけ！

## ファイル構成

```
TimerApp/
├── manifest.json      # 拡張機能の設定
├── background.js      # フローティングウィンドウ制御
├── timer.html         # タイマーUI
├── timer.css          # スタイル（Apple風デザイン）
├── timer.js           # タイマーロジック
├── icons/
│   ├── icon.svg       # ソースアイコン
│   ├── icon16.png     # 16x16アイコン
│   ├── icon48.png     # 48x48アイコン
│   └── icon128.png    # 128x128アイコン
└── README.md
```

## デザイン

- ダークモード対応のApple風UIデザイン
- SF Pro系フォントを使用
- すりガラス効果（backdrop-filter）
- 滑らかなアニメーション

---

Made with ❤️ for productivity

# ChromeDevTimerApp
# ChromeDevTimerApp
