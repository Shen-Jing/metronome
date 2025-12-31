# Metronome

A high-precision, web-based metronome application built with Vanilla JavaScript, HTML, and CSS. Designed for pianists and musicians who need advanced rhythm control without installing any software.

## Features

- **Precision Timing**: Built on the Web Audio API for accurate, drift-free timing.
- **Customizable Patterns**: Create complex polyrhythms or odd time signatures.
    - **Pattern Length**: Define the number of steps in your loop (up to 128).
    - **Steps per Beat**: Define how many steps constitute one main beat (e.g., 4 steps for 16th notes).
- **Subdivision BPM**: View and control the tempo based on the speed of individual steps (clicks).
- **Pattern Editor**: Interactive grid to toggle specific beats or subdivisions on/off.
- **Accent Control**: Toggle a high-pitched accent on the first beat of the cycle.
- **Bilingual Interface**: Fully localized UI in both English and Traditional Chinese.
- **Premium Design**: Sleek dark mode aesthetics with neon accents, optimized for both desktop and mobile.
- **Smart Persistence**:
    - **Auto-Save**: Automatically remembers your last used settings/rhythm when you return.
    - **Presets**: Save multiple named configurations (e.g., "Jazz Swing", "Speed Drill") and switch between them instantly.
- **Zero Dependencies**: Pure static files. No build process or servers required.

## Usage

1. Open `index.html` in any modern web browser.
2. **Set Tempo**: Adjust the **BPM** slider or input box.
3. **Configure Rhythm**:
    - **Pattern Length**: Set how many total steps are in your measure/loop.
    - **Steps per Beat**: Set how many steps equal one beat of your specified BPM.
4. **Edit Pattern**: Click on the grid blocks to mute/unmute specific steps.
5. **Save Presets** (Optional):
    - Type a name in the "Presets" section and click **Save**.
    - Click any saved preset to load it.
6. **Play**: Click the large Play button to start.

---

# 節拍器 (Metronome)

這是一個使用原生 JavaScript、HTML 和 CSS 構建的高精準度網頁節拍器。專為需要進階節奏控制的鋼琴家和音樂家設計，無需安裝任何軟體即可使用。

## 功能特色

- **精準計時**：基於 Web Audio API 構建，確保節拍準確不飄移。
- **自定義節奏樣式**：輕鬆創建複雜的複節奏 (Polyrhythms) 或奇數拍子。
    - **樣式長度 (Pattern Length)**：設定循環中的總步數 (最多 128 步)。
    - **每拍步數 (Steps per Beat)**：設定多少步數構成一個主拍 (例如：16 分音符設為 4)。
- **細分拍速度控制**：可根據單個步數 (點擊聲) 的速度來查看或控制速度。
- **樣式編輯器**：互動式網格，可點擊以開啟或關閉特定節拍的聲音。
- **首拍強調**：可切換是否在循環的第一拍發出高音提示。
- **雙語介面**：完整支援繁體中文與英文介面。
- **精美設計**：極簡深色模式搭配霓虹配色，針對桌面與行動裝置優化。
- **智慧儲存**：
    - **自動儲存**：自動記憶您上次使用的所有設定，重新整理頁面後即可繼續使用。
    - **多組預設 (Presets)**：可將特定設定儲存為不同名稱 (例如 "搖滾節奏", "五連音練習") 並隨時切換。
- **零依賴**：純靜態檔案，無需任何建置過程或伺服器。

## 使用說明

1. 在任何現代瀏覽器中打開 `index.html`。
2. **設定速度**：調整 **速度 BPM** 滑桿或輸入框。
3. **設定節奏**：
    - **樣式長度**：設定一個小節/循環中共有多少個步數。
    - **每拍步數**：設定多少個步數等於 BPM 的一拍。
4. **編輯樣式**：點擊網格方塊來將特定的步數靜音或開啟。
5. **預設組 (Presets)**：
    - 在下方輸入名稱並點擊 **儲存 (Save)** 即可將當前設定存起來。
    - 點擊列表中的名稱即可立即讀取。
6. **播放**：點擊大播放按鈕開始。
