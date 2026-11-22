// app.js - గణితం (plain ES module, no libraries)
import { openDB, put, get, getAll, clearStore } from './db.js';

const CONTENT_FILES = [
  'content/real-numbers.json',
  'content/polynomials.json',
  'content/linear-equations.json',
];
const AVATARS = ['🐯', '🦁', '🐼', '🐸', '🦊', '🐵', '🐰', '🐧'];
const DEFAULT_DIFFICULTY = 1;


const DOUBT_KEYWORDS = [
  {
    words: ['HCF', 'గరిష్ట ఉమ్మడి భాజకం'], chapter: 'real-numbers',
    te: 'HCF (గరిష్ట ఉమ్మడి భాజకం): రెండు సంఖ్యలను సమానంగా భాగించే అతి పెద్ద సంఖ్య. యూక్లిడ్ భాగహార సూత్రం లేదా ప్రధాన కారణాంకీకరణతో కనుగొనండి.',
    en: 'HCF: the largest number that divides both numbers exactly. Find it with Euclid\'s division lemma or prime factorisation.',
  },
  {
    words: ['LCM', 'లఘు ఉమ్మడి గుణిజం', 'కనిష్ట ఉమ్మడి గుణిజం'], chapter: 'real-numbers',
    te: 'LCM (లఘు ఉమ్మడి గుణిజం): రెండు సంఖ్యలకూ గుణిజంగా ఉండే అతి చిన్న సంఖ్య. ప్రధాన కారణాంకాలలో ప్రతి ప్రధాన సంఖ్యకు అత్యధిక ఘాతం తీసుకోండి.',
    en: 'LCM: the smallest number that is a multiple of both. Take the highest power of every prime in the prime factorisation.',
  },
  {
    words: ['remainder', 'శేషం'], chapter: 'real-numbers',
    te: 'శేషం: a = bq + r లో r శేషం. r ఎప్పుడూ 0 నుండి b కంటే తక్కువ మధ్య ఉంటుంది.',
    en: 'Remainder: in a = bq + r, r is the remainder; it is always from 0 up to, but less than, b.',
  },
  {
    words: ['irrational', 'కరణీయ'], chapter: 'real-numbers',
    te: 'అకరణీయ (irrational) సంఖ్య: p/q రూపంలో రాయలేని సంఖ్య, ఉదా. √2. దశాంశ రూపం అంతం కాకుండా, పునరావృతం కాకుండా ఉంటుంది.',
    en: 'Irrational number: cannot be written as p/q, e.g. √2. Its decimal goes on forever without repeating.',
  },
  {
    words: ['polynomial', 'బహుపది'], chapter: 'polynomials',
    te: 'బహుపది: x యొక్క పూర్ణాంక ఘాతాలతో కూడిన బీజీయ సమాసం, ఉదా. x² − 3x + 2.',
    en: 'Polynomial: an algebraic expression with whole-number powers of x, e.g. x² − 3x + 2.',
  },
  {
    words: ['zero', 'శూన్యక'], chapter: 'polynomials',
    te: 'బహుపది శూన్యకం: p(x) = 0 చేసే x విలువ. n డిగ్రీ బహుపదికి గరిష్టంగా n శూన్యకాలు ఉంటాయి.',
    en: 'Zero of a polynomial: the value of x that makes p(x) = 0. A polynomial of degree n has at most n zeros.',
  },
  {
    words: ['linear', 'సరళ'], chapter: 'linear-equations',
    te: 'సరళ సమీకరణం: ప్రతి చరానికి ఘాతం 1 మాత్రమే ఉండే సమీకరణం. రెండు చరాలు ఉంటే దాని గ్రాఫ్ ఒక సరళరేఖ.',
    en: 'Linear equation: an equation where each variable has power 1. In two variables, its graph is a straight line.',
  },
  {
    words: ['equation', 'సమీకరణ'], chapter: 'linear-equations',
    te: 'రెండు చరాల సమీకరణాల జత: ప్రతిక్షేపణ లేదా తొలగింపు పద్ధతిలో x, y విలువలు కనుగొనండి.',
    en: 'Pair of linear equations in two variables: find x and y by substitution or elimination.',
  },
];

const state = {
  chapters: [],
  profile: null,
  unlocked: false,
  lessonIndex: {},
  practice: null,
};
let renderToken = 0;
const appEl = document.getElementById('app');

// ---------- small helpers ----------

function el(tag, attrs, ...children) {
  const node = document.createElement(tag);
  if (attrs) {
    for (const [k, v] of Object.entries(attrs)) {
      if (v === null || v === undefined || v === false) continue;
      if (k === 'class') node.className = v;
      else if (k === 'on') {
        for (const [ev, fn] of Object.entries(v)) node.addEventListener(ev, fn);
      } else if (k === 'disabled') node.disabled = !!v;
      else if (k === 'style') node.setAttribute('style', v);
      else node.setAttribute(k, v === true ? '' : String(v));
    }
  }
  for (const c of children.flat()) {
    if (c === null || c === undefined || c === false) continue;
    node.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return node;
}

function go(hash) {
  if (location.hash === hash) render();
  else location.hash = hash;
}

// ---------- app shell: top bar, bottom tabs ----------

const SVG_OPEN = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
  'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">';
const TABS = [
  {
    label: 'సాధన', go: '#/practice', routes: ['practice'],
    icon: SVG_OPEN + '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>' +
      '<rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>',
  },
  {
    label: 'నేర్చుకోండి', go: '#/learn', routes: ['learn'],
    icon: SVG_OPEN + '<path d="M2 4h6a4 4 0 0 1 4 4v12a3 3 0 0 0-3-3H2z"/><path d="M22 4h-6a4 4 0 0 0-4 4v12a3 3 0 0 1 3-3h7z"/></svg>',
  },
  {
    label: 'అడగండి', go: '#/home', routes: ['home', 'doubt'],
    icon: SVG_OPEN + '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/></svg>',
  },
  {
    label: 'పురోగతి', go: '#/progress', routes: ['progress'],
    icon: SVG_OPEN + '<path d="M5 20v-7"/><path d="M12 20V5"/><path d="M19 20v-10"/></svg>',
  },
];

const TAB_SCREENS = ['home', 'learn', 'practice', 'doubt', 'progress'];

function appTop(route) {
  const isTab = TAB_SCREENS.includes(route.name) && !route.arg;
  const logo = el('span', { class: 'app-logo', 'aria-hidden': 'true' });
  logo.innerHTML = '<svg viewBox="0 0 28 28" width="28" height="28" focusable="false">' +
    '<rect width="28" height="28" rx="6" fill="#FACC15"/>' +
    '<path d="M7 20V8l7 9 7-9v12" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" fill="none"/>' +
    '</svg>';
  return el('header', { class: 'app-top' },
    isTab ? null : el('button', {
      class: 'back-btn',
      'aria-label': 'Back',
      on: { click: () => history.back() },
    }, '←'),
    el('div', { class: 'app-brand' },
      logo,
      el('div', null,
        el('span', { class: 'app-name' }, 'మ్యాత్ ఇట్'),
        el('span', { class: 'app-sub' }, 'గణిత మిత్రుడు'))));

}

function appBottom(route) {
  return el('nav', { class: 'app-bottom' },
    TABS.map((t) => {
      const icon = el('span', { class: 'tab-icon', 'aria-hidden': 'true' });
      icon.innerHTML = t.icon;
      return el('button', {
        class: 'tab' + (t.routes.includes(route.name) ? ' active' : ''),
        on: { click: () => go(t.go) },
      }, icon, el('span', { class: 'tab-label' }, t.label));
    }));
}

function mountShell(route) {
  const top = appTop(route);
  const bottom = appBottom(route);
  const oldTop = document.querySelector('.app-top');
  const oldBottom = document.querySelector('.app-bottom');
  if (oldTop) oldTop.replaceWith(top);
  else document.body.prepend(top);
  if (oldBottom) oldBottom.replaceWith(bottom);
  else document.body.append(bottom);
}

// Reads Telugu text aloud; does nothing when the browser has no speech synthesis.
function speakTelugu(text) {
  if (!('speechSynthesis' in window)) return;
  const u = new SpeechSynthesisUtterance(text);
  u.lang = 'te-IN';
  u.rate = 0.95;
  speechSynthesis.speak(u);
}

function speakButton(text) {
  return el('button', {
    class: 'speak-btn', 'aria-label': 'Listen',
    on: { click: (e) => { e.stopPropagation(); speakTelugu(text); } },
  }, '🔊');
}

function localDate(d = new Date()) {
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

function findChapter(id) {
  return state.chapters.find((c) => c.id === id) || null;
}

function notFound() {
  return el('section', { class: 'screen' },
    el('p', null, 'Page not found'));
}

// crypto.subtle is missing on phones opening the app over plain http on the LAN, so fall back to pure JS SHA-256.
async function sha256Hex(text) {
  const bytes = new TextEncoder().encode(text);
  if (window.crypto && crypto.subtle) {
    const buf = await crypto.subtle.digest('SHA-256', bytes);
    return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
  }
  return sha256Pure(bytes);
}

// SHA-256 per FIPS 180-4, used only when crypto.subtle is unavailable. Returns lowercase hex.
const SHA256_K = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
];

function rotr32(x, n) {
  return (x >>> n) | (x << (32 - n));
}

function sha256Pure(bytes) {
  const H = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
  const bitLen = bytes.length * 8;
  const padded = new Uint8Array(((bytes.length + 9 + 63) >> 6) << 6);
  padded.set(bytes);
  padded[bytes.length] = 0x80;
  const dv = new DataView(padded.buffer);
  dv.setUint32(padded.length - 8, Math.floor(bitLen / 0x100000000));
  dv.setUint32(padded.length - 4, bitLen >>> 0);
  const W = new Uint32Array(64);
  for (let off = 0; off < padded.length; off += 64) {
    for (let t = 0; t < 16; t++) W[t] = dv.getUint32(off + t * 4);
    for (let t = 16; t < 64; t++) {
      const x = W[t - 15];
      const y = W[t - 2];
      const s0 = rotr32(x, 7) ^ rotr32(x, 18) ^ (x >>> 3);
      const s1 = rotr32(y, 17) ^ rotr32(y, 19) ^ (y >>> 10);
      W[t] = (W[t - 16] + s0 + W[t - 7] + s1) >>> 0;
    }
    let [a, b, c, d, e, f, g, h] = H;
    for (let t = 0; t < 64; t++) {
      const S1 = rotr32(e, 6) ^ rotr32(e, 11) ^ rotr32(e, 25);
      const ch = (e & f) ^ (~e & g);
      const t1 = (h + S1 + ch + SHA256_K[t] + W[t]) >>> 0;
      const S0 = rotr32(a, 2) ^ rotr32(a, 13) ^ rotr32(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const t2 = (S0 + maj) >>> 0;
      h = g; g = f; f = e;
      e = (d + t1) >>> 0;
      d = c; c = b; b = a;
      a = (t1 + t2) >>> 0;
    }
    const v = [a, b, c, d, e, f, g, h];
    for (let i = 0; i < 8; i++) H[i] = (H[i] + v[i]) >>> 0;
  }
  return H.map((v) => v.toString(16).padStart(8, '0')).join('');
}

function randomHex(bytes) {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr).map((b) => b.toString(16).padStart(2, '0')).join('');
}

// ---------- theme ----------

const THEME_KEY = 'tmt-theme';
const THEME_NEXT = { auto: 'dark', dark: 'light', light: 'auto' };
const THEME_LABEL = { light: 'Theme: Dark', dark: 'Theme: Light', auto: 'Theme: Auto' };

function currentTheme() {
  const saved = localStorage.getItem(THEME_KEY);
  return THEME_NEXT[saved] ? saved : 'auto';
}

// choice: 'dark' | 'light' | 'auto' (auto removes the attribute so the phone setting applies)
function applyTheme(choice) {
  const theme = THEME_NEXT[choice] ? choice : 'auto';
  if (theme === 'auto') delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = theme;
  localStorage.setItem(THEME_KEY, theme);
}

// ---------- content ----------

async function loadContent() {
  const docs = await Promise.all(CONTENT_FILES.map((f) =>
    fetch(f).then((r) => {
      if (!r.ok) throw new Error(`Failed to load ${f}`);
      return r.json();
    })));
  state.chapters = docs.map((doc) => ({
    id: doc.id,
    title: doc.title,
    title_en: doc.title_en,
    lessons: doc.lessons || [],
    questions: doc.questions || [],
  }));
}

// Topic key for progress and adaptivity is always the chapter title.
function topicKey(ch) {
  return ch.title;
}

// ---------- adaptive practice ----------

async function loadStats(topic) {
  return (await get('topicStats', topic)) || {
    topic, attempted: 0, correct: 0, consecutiveWrong: 0, consecutiveRight: 0,
    difficulty: DEFAULT_DIFFICULTY,
  };
}

function pickQuestion(ch, stats, lastId) {
  const target = stats.consecutiveWrong >= 2 ? 1 : stats.difficulty;
  let candidates = ch.questions.filter((q) => q.id !== lastId);
  if (!candidates.length) candidates = ch.questions;
  const minDist = Math.min(...candidates.map((q) => Math.abs(q.difficulty - target)));
  const pool = candidates.filter((q) => Math.abs(q.difficulty - target) === minDist);
  return pool[Math.floor(Math.random() * pool.length)];
}

function applyAnswer(stats, ok) {
  const s = { ...stats };
  s.attempted += 1;
  if (ok) {
    s.correct += 1;
    s.consecutiveRight += 1;
    s.consecutiveWrong = 0;
    if (s.consecutiveRight >= 3) {
      s.difficulty = Math.min(3, s.difficulty + 1);
      s.consecutiveRight = 0;
    }
  } else {
    s.consecutiveWrong += 1;
    s.consecutiveRight = 0;
    if (s.consecutiveWrong >= 2) s.difficulty = Math.max(1, s.difficulty - 1);
  }
  return s;
}

function masteryPercent(stats) {
  const attempted = stats ? stats.attempted : 0;
  const correct = stats ? stats.correct : 0;
  return Math.round(100 * (correct + 1) / (attempted + 2));
}

async function bumpStreak(date) {
  const rec = (await get('streaks', date)) || { id: date, answers: 0 };
  rec.answers += 1;
  await put('streaks', rec);
}

// ---------- routing ----------

function parseRoute() {
  const parts = (location.hash || '#/home').replace(/^#\/?/, '').split('/');
  return { name: parts[0] || 'home', arg: parts[1] || '' };
}

async function render() {
  const token = ++renderToken;
  if (!state.chapters.length) {
    appEl.replaceChildren(el('p', { class: 'loading' }, 'Loading...'));
    return;
  }
  const route = parseRoute();
  if (!state.profile && route.name !== 'profile') {
    go('#/profile');
    return;
  }
  let view;
  switch (route.name) {
    case 'learn': view = viewLearn(route.arg); break;
    case 'practice': view = await viewPractice(route.arg); break;
    case 'doubt': view = renderAsk(); break;
    case 'progress': view = await viewProgress(); break;
    case 'profile': view = viewProfile(); break;
    case 'home': view = renderAsk(); break;
    default: view = notFound();
  }
  if (token !== renderToken) return;
  mountShell(route);
  appEl.replaceChildren(view);
}

// ---------- home ----------
// Home renders the shared renderAsk() hero (see the doubt section below).


// ---------- learn ----------

function chapterPicker(kind) {
  return el('section', { class: 'screen' },
    el('h2', null, 'అధ్యాయాన్ని ఎంచుకోండి'),
    el('div', { class: 'chapter-list' },
      state.chapters.map((ch) => el('button', {
        class: 'btn btn-secondary chapter-btn',
        on: { click: () => go(`#/${kind}/${ch.id}`) },
      }, ch.title))));
}


function viewLearn(chapterId) {
  if (!chapterId) return chapterPicker('learn');
  const ch = findChapter(chapterId);
  if (!ch || !ch.lessons.length) return notFound();
  localStorage.setItem('tmt-last', ch.id);
  const idx = state.lessonIndex[ch.id] || 0;
  const lesson = ch.lessons[idx];
  return el('section', { class: 'screen' },
    el('div', { class: 'counter' }, `Lesson ${idx + 1} of ${ch.lessons.length}`),
    el('div', { class: 'card' },
      el('h2', { class: 'te' }, lesson.title),
      speakButton(lesson.lines.join('\n')),
      lesson.lines.map((t) => el('p', { class: 'te' }, t)),
      el('div', { class: 'card' },
        el('p', { class: 'te' }, lesson.example)),
      el('p', null, 'Key term: ', lesson.keyTerm)),
    el('button', {
      class: 'btn btn-primary', disabled: idx >= ch.lessons.length - 1,
      on: { click: () => { state.lessonIndex[ch.id] = idx + 1; render(); } },
    }, 'Next'),
    el('button', {
      class: 'btn btn-secondary', disabled: idx === 0,
      on: { click: () => { state.lessonIndex[ch.id] = idx - 1; render(); } },
    }, 'Previous'));
}


// ---------- practice ----------

async function viewPractice(chapterId) {
  if (!chapterId) return chapterPicker('practice');
  const ch = findChapter(chapterId);
  if (!ch || !ch.questions.length) return notFound();
  localStorage.setItem('tmt-last', ch.id);
  if (!state.practice || state.practice.chapterId !== ch.id) {
    state.practice = { chapterId: ch.id, question: null, answered: null, lastId: null, stats: null };
  }
  const p = state.practice;
  if (!p.question) {
    p.stats = await loadStats(topicKey(ch));
    p.question = pickQuestion(ch, p.stats, p.lastId);
    p.answered = null;
    p.n = (p.n || 0) % 10 + 1;
  }
  const q = p.question;
  const ans = p.answered;
  const hintMode = (p.stats.consecutiveWrong || 0) >= 2;

  const options = q.options.map((opt, i) => {
    let cls = 'btn-answer';
    if (ans) {
      if (i === ans.choice) cls += ans.ok ? ' correct' : ' wrong';
      else if (!ans.ok && i === q.correct) cls += ' correct';
    }
    return el('button', {
      class: cls,
      disabled: !!ans,
      on: { click: () => answer(i) },
    }, el('div', { class: 'te' }, opt));
  });

  return el('section', { class: 'screen' },
    el('div', { class: 'progress-track' },
      el('div', { class: 'progress-fill', style: `width: ${(p.n / 10) * 100}%` })),
    el('div', { class: 'counter' }, `Question ${p.n} of 10`),
    el('div', { class: 'card' },
      el('p', { class: 'te' }, q.question, speakButton(q.question))),
    hintMode ? el('div', { class: 'hint' },
      'Hint: ', el('span', { class: 'te' }, q.mistake)) : null,
    el('div', { class: 'options' }, options),
    ans ? el('div', { class: 'notice' },
      el('p', null, ans.ok ? 'Correct!' : 'Wrong'),
      ans.ok ? null : el('p', { class: 'te' }, q.mistake)) : null,
    ans ? el('button', {
      class: 'btn btn-primary',
      on: { click: nextQuestion },
    }, 'Next') : null);
}


async function answer(choice) {
  const p = state.practice;
  if (!p || !p.question || p.answered) return;
  const ch = findChapter(p.chapterId);
  const q = p.question;
  const ok = choice === q.correct;
  p.answered = { choice, ok };
  const now = Date.now();
  await put('attempts', { topic: topicKey(ch), questionId: q.id, ok, ts: now });
  p.stats = applyAnswer(p.stats, ok);
  await put('topicStats', p.stats);
  await bumpStreak(localDate(new Date(now)));
  render();
}

function nextQuestion() {
  const p = state.practice;
  if (!p) return;
  p.lastId = p.question ? p.question.id : null;
  p.question = null;
  p.answered = null;
  render();
}

// ---------- doubt ----------

function explainFor(text) {
  const t = (text || '').toLowerCase();
  return DOUBT_KEYWORDS.find((k) => k.words.some((w) => t.includes(w.toLowerCase()))) || null;
}

function explanationCard(hit) {
  const ch = findChapter(hit.chapter);
  return el('div', { class: 'notice' },
    el('p', { class: 'te' }, hit.te),
    ch ? el('button', {
      class: 'btn btn-secondary',
      on: { click: () => go(`#/learn/${ch.id}`) },
    }, `Open lesson: ${ch.title_en}`) : null);
}

// Shared Home and Ask screen: hero, then the doubt card (offline keyword answers).
function renderAsk() {
  const out = el('div', { class: 'answer-box' });
  const doubtText = el('textarea', {
    class: 'ask-input', rows: 3, placeholder: 'మీ ప్రశ్న రాయండి... 2x + 5 = 17',
    on: { input: (e) => showFor(e.target.value) },
  });

  const showAnswer = (hit) => out.replaceChildren(hit ? explanationCard(hit)
    : el('p', null, 'Sorry, I could not find an answer. Try another word.'));

  const showFor = (text) => {
    if (!text || !text.trim()) { out.replaceChildren(); return; }
    doubtText.value = text;
    showAnswer(explainFor(text));
  };

  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const micBtn = el('button', {
    class: 'round-btn mic-btn',
    'aria-label': 'మాట్లాడండి',
    disabled: !SR,
    on: {
      click: () => {
        const rec = new SR();
        rec.lang = 'te-IN';
        rec.onresult = (e) => showFor(e.results[0][0].transcript);
        rec.onerror = () => out.replaceChildren(el('p', null, 'Microphone failed'));
        rec.start();
      },
    },
  }, '🎤');
  const micNote = el('div', { class: 'notice' },
    el('p', null, 'Microphone is not available on this phone.'));
  micNote.hidden = !!SR;

  const preview = el('img', { class: 'preview', alt: 'Photo preview', style: 'display:none' });
  const fileName = el('span', { class: 'file-name' }, 'ఫైల్ ఎంచుకోలేదు');
  const camInput = el('input', {
    type: 'file', accept: 'image/*', capture: 'environment', class: 'file-input',
    on: {
      change: (e) => {
        const f = e.target.files && e.target.files[0];
        if (!f) return;
        fileName.textContent = f.name;
        preview.src = URL.createObjectURL(f);
        preview.style.display = 'block';
      },
    },
  });

  const sendBtn = el('button', {
    class: 'send-btn',
    'aria-label': 'పంపండి',
    on: { click: () => showFor(doubtText.value) },
  }, '↑');

  return el('section', { class: 'screen' },
    el('div', { class: 'hero' },
      el('div', { class: 'hero-logo' }, '∑'),
      el('p', { class: 'hero-kicker' }, 'మీ భాషలో. మీ వేగంతో.'),
      el('h1', { class: 'hero-title' }, 'గణితం, సులభంగా.'),
      el('p', { class: 'hero-sub' }, 'మీ సందేహం రాయండి. కలిసి ఒక్కో మెట్టు నేర్చుకుందాం.')),
    el('div', { class: 'ask-card' },
      doubtText,
      el('div', { class: 'ask-foot' },
        el('label', { class: 'file-btn' }, el('span', null, '📷 ఫోటో ఎంచుకోండి'), camInput),
        fileName,
        micBtn,
        sendBtn),
      preview),
    micNote,
    out);

}


// ---------- progress ----------

async function viewProgress() {
  const statsAll = await getAll('topicStats');
  const streakRecs = await getAll('streaks');
  const attempts = await getAll('attempts');
  const streak = computeStreak(streakRecs.map((r) => r.id));
  const rows = state.chapters.map((ch) => {
    const st = statsAll.find((s) => s.topic === topicKey(ch));
    const m = masteryPercent(st);
    return el('div', { class: 'card' },
      el('p', null, ch.title_en),
      el('div', { class: 'bar-row' },
        el('div', { class: 'bar-label' }, `${m}%`),
        el('div', { class: 'bar-track' },
          el('div', { class: m >= 60 ? 'bar-fill good' : 'bar-fill weak', style: `width: ${m}%` }))));
  });
  const codeBox = el('textarea', { class: 'share-code', readonly: true, rows: 4 });
  const shareBtn = el('button', {
    class: 'btn btn-secondary',
    on: {
      click: () => {
        const recent = attempts
          .slice()
          .sort((a, b) => b.ts - a.ts)
          .slice(0, 10)
          .map((a) => ({ topic: a.topic, ok: a.ok, ts: a.ts }));
        const mastery = {};
        for (const ch of state.chapters) {
          mastery[ch.title] = masteryPercent(statsAll.find((s) => s.topic === topicKey(ch)));
        }
        const snap = {
          v: 1,
          nick: state.profile ? state.profile.nick : '',
          mastery,
          recent,
          streak,
        };
        codeBox.textContent = encodeSnapshot(snap);
        note.hidden = false;
      },
    },
  }, 'Share');
  const note = el('p', { class: 'note' }, 'Show this code to your parent or teacher.');
  note.hidden = true;

  return el('section', { class: 'screen' },
    el('h2', null, 'My Progress'),
    el('span', { class: 'streak-badge' }, `🔥 ${streak} days`),
    rows,
    shareBtn,
    codeBox,
    note,
    settingsCard());
}

// theme cycle and profile switch; switch relocks so the PIN is asked again
function settingsCard() {
  return el('div', { class: 'card' },
    el('p', null, 'Settings'),
    el('button', {
      class: 'btn btn-secondary',
      on: { click: () => { applyTheme(THEME_NEXT[currentTheme()]); render(); } },
    }, THEME_LABEL[currentTheme()]),
    el('button', {
      class: 'btn btn-secondary',
      on: { click: () => { state.unlocked = false; go('#/profile'); } },
    }, 'Switch profile'));
}


// consecutive dates with an answer, counting back from today (or yesterday if today is empty)
function computeStreak(dateIds) {
  const set = new Set(dateIds);
  const d = new Date();
  if (!set.has(localDate(d))) d.setDate(d.getDate() - 1);
  let count = 0;
  while (set.has(localDate(d))) {
    count += 1;
    d.setDate(d.getDate() - 1);
  }
  return count;
}

function encodeSnapshot(snap) {
  const json = JSON.stringify(snap);
  const binary = encodeURIComponent(json).replace(/%([0-9A-F]{2})/g,
    (_, hex) => String.fromCharCode(parseInt(hex, 16)));
  const payload = btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  let sum = 0;
  for (let i = 0; i < payload.length; i++) sum += payload.charCodeAt(i);
  const checksum = (sum % 65536).toString(36).padStart(4, '0');
  return `${payload}.${checksum}`;
}

// ---------- profile ----------

function viewProfile() {
  const p = state.profile;
  if (p && !state.unlocked) return pinGate();
  return profileForm(p);
}

function pinGate() {
  const msg = el('p', { class: 'error' });
  const pinInput = el('input', {
    class: 'pin-input', type: 'password', inputmode: 'numeric', maxlength: 4, pattern: '[0-9]{4}',
    placeholder: '••••',
  });
  const submit = async () => {
    const pin = pinInput.value.trim();
    const hash = await sha256Hex(state.profile.salt + ':' + pin);
    if (hash === state.profile.pinHash) {
      state.unlocked = true;
      render();
    } else {
      msg.textContent = 'Wrong PIN. Try again.';
    }
  };
  return el('section', { class: 'screen' },
    el('div', { class: 'big-card' },
      el('h2', null, 'Confirm PIN'),
      el('div', { class: 'form-field' },
        el('label', { class: 'label' }, 'Enter your 4-digit PIN'),
        pinInput),
      el('button', {
        class: 'btn btn-primary', type: 'button', style: 'width:100%', on: { click: submit },
      }, 'Unlock'),
      msg));
}

function profileForm(existing) {
  const msg = el('p', { class: 'error' });
  const nickInput = el('input', {
    class: 'input', type: 'text', maxlength: 20, required: true,
    placeholder: 'e.g. Ravi',
    value: existing ? existing.nick : '',
  });
  let avatar = existing ? existing.avatar : AVATARS[0];
  const avatarBtns = AVATARS.map((a) => el('button', {
    class: 'avatar-opt' + (a === avatar ? ' selected' : ''),
    type: 'button',
    on: {
      click: () => {
        avatar = a;
        avatarBtns.forEach((b, i) => b.classList.toggle('selected', AVATARS[i] === a));
      },
    },
  }, a));
  const pinInput = el('input', {
    class: 'pin-input', type: 'password', inputmode: 'numeric', maxlength: 4, pattern: '[0-9]{4}',
    placeholder: existing ? 'leave blank to keep' : '••••',
  });

  const save = async () => {
    try {
      const nick = nickInput.value.trim();
      if (!nick) { msg.textContent = 'Please enter a nickname.'; return; }
      const pin = pinInput.value.trim();
      if (!existing && !pin) { msg.textContent = 'Please enter a 4-digit PIN.'; return; }
      if (pin && !/^\d{4}$/.test(pin)) { msg.textContent = 'PIN must be exactly 4 digits.'; return; }
      let rec;
      if (!existing) {
        const salt = randomHex(16);
        rec = { id: 'active', nick, avatar, salt, pinHash: await sha256Hex(salt + ':' + pin) };
      } else {
        rec = { ...existing, nick, avatar };
        if (pin) {
          const salt = randomHex(16);
          rec.salt = salt;
          rec.pinHash = await sha256Hex(salt + ':' + pin);
        }
      }
      await put('profiles', rec);
      state.profile = rec;
      state.unlocked = true;
      go('#/home');
    } catch (err) {
      msg.replaceChildren('Could not save. Please try again.', el('small', null, ' ' + err.message));
    }
  };

  return el('section', { class: 'screen' },
    el('div', { class: 'big-card' },
      el('h2', null, existing ? 'Profile' : 'Create your profile'),
      existing ? null : el('p', { class: 'note' }, 'Only a nickname and a PIN. No phone or email.'),
      el('div', { class: 'form-field' },
        el('label', { class: 'label' }, 'Nickname'),
        nickInput),
      el('div', { class: 'form-field' },
        el('span', { class: 'label' }, 'Choose an avatar'),
        el('div', { class: 'avatar-grid' }, avatarBtns)),
      el('div', { class: 'form-field' },
        el('label', { class: 'label' }, '4-digit PIN'),
        pinInput),
      el('button', {
        class: 'btn btn-primary', type: 'button', style: 'width:100%', on: { click: save },
      }, 'Save and continue'),
      msg));
}

// ---------- startup ----------

async function init() {
  applyTheme(currentTheme());
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      // The app remains usable if offline caching is unavailable.
    });
  }
  try {
    await openDB();
    state.profile = (await get('profiles', 'active')) || null;
    await loadContent();
  } catch (err) {
    appEl.replaceChildren(el('p', { class: 'error' }, 'Error: ' + err.message));
    return;
  }
  window.addEventListener('hashchange', render);
  render();
}

init();

export { clearStore };
