# గణితం

A mobile-first Progressive Web App (PWA) that helps Class 10 students in Andhra Pradesh government schools practise Maths in Telugu. It needs almost no typing: answers are chosen with large buttons. Explanations and practice are in Telugu, with English alongside for exam understanding.

## Chapters

1. Real Numbers (వాస్తవ సంఖ్యలు)
2. Polynomials (బహుపదులు)
3. Linear Equations in Two Variables (రెండు చరరాశులలో రేఖీయ సమీకరణాలు)

## Run on Windows

1. Open a terminal (PowerShell or Command Prompt) in the `telugu-maths-tutor` folder.
2. Start a local server:
   ```
   python -m http.server 8000
   ```
3. On the PC, open http://localhost:8000
4. On an Android phone on the same Wi-Fi, open Chrome and go to `http://<PC-IP-address>:8000` (find the PC's IP with `ipconfig` in the terminal).
5. To install: in Android Chrome, open the menu and tap **Add to Home screen**.

## Offline behaviour

The service worker precaches the app shell and the lesson content, so the app works without data after the first load.

## Data and privacy

- All progress data stays on the device, in IndexedDB. Nothing is sent to a server.
- No phone number, email address or real name is collected.
- The content is original, written for this app, and is not textbook text.
- The English fields are there to help students understand exam questions.

## Parent view and share code

The app creates a share code that summarises a student's progress: a base64url-encoded JSON snapshot, a dot, and a short checksum. The snapshot contains a nickname, mastery per topic, streak days and recent attempts. The code works offline with no server.

Open `parent.html` (linked from the app) and paste the code. The page decodes it in the browser and shows the results. It stores nothing and makes no network calls.

## Files

- `index.html`, `app.js`, `styles.css` – the app
- `db.js` – IndexedDB storage
- `sw.js`, `manifest.webmanifest` – offline support and installation
- `parent.html` – share-code viewer

