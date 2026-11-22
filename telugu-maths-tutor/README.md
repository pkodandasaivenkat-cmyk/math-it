# మ్యాత్ ఇట్ (Math It)

## What it is

Math It is a Class 10 Maths practice app in Telugu and English, made for Telugu-medium learners. It is a Progressive Web App (PWA) with 3 chapters:

1. Real Numbers (వాస్తవ సంఖ్యలు)
2. Polynomials (బహుపదులు)
3. Linear Equations in Two Variables (రెండు చరరాశులలో రేఖీయ సమీకరణాలు)

## Install as an app (PWA)

1. On an Android phone, open Chrome and go to https://pkodandasaivenkat-cmyk.github.io/math-it/
2. Open the Chrome menu and choose **Install app** or **Add to Home screen**.
3. After the first visit, the app works offline.

## Run locally on Windows

1. Open a terminal (PowerShell or Command Prompt) in the `telugu-maths-tutor` folder.
2. Start a local server:
   ```
   python -m http.server 8000
   ```
3. Open http://localhost:8000/ in your browser.

## Offline and data

- The service worker caches the app shell and the content. The cache name is set in `sw.js` (currently `tmt-v12`).
- Progress is saved in IndexedDB on the phone. Nothing is sent to a server.
- No videos, no CDN and no external fonts. The app uses system fonts only.

## Features

- **Learn**: one lesson card at a time.
- **Practice**: 10 questions per set, with adaptive difficulty and hints after mistakes.
- **Ask**: a rule-based helper, not an AI model.
- **Progress**: topic bars and a streak counter.
- **Share code**: a read-only parent view. Open `parent.html` and paste the code.

## Privacy

- The app stores only a nickname, an avatar and a 4-digit PIN.
- The PIN is stored as a salted hash.
- No phone number, email address or real name is collected.

## Files

- `index.html`, `app.js`, `db.js`, `styles.css` – the app
- `sw.js` – service worker (offline cache)
- `manifest.webmanifest` – install settings
- `icons/icon.svg` – app icon
- `content/*.json` – lesson and question content
- `parent.html` – read-only parent view
