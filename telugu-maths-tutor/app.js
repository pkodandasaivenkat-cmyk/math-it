// app.js - Telugu Maths Tutor (plain ES module, no libraries)
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

function navBar() {
  return el('nav', { class: 'nav-bar' },
    el('button', { class: 'btn-small', on: { click: () => history.back() } }, '← వెనక్కి / Back'),
    el('button', { class: 'btn-small', on: { click: () => go('#/home') } }, '🏠 హోమ్ / Home'));
}

function speak(text, lang = 'te-IN') {
  if (!('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang = lang;
  speechSynthesis.speak(u);
}

function speakButton(text, lang) {
  if (!('speechSynthesis' in window)) return null;
  return el('button', {
    class: 'speak', 'aria-label': 'Read aloud',
    on: { click: (e) => { e.stopPropagation(); speak(text, lang); } },
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
  return el('section', { class: 'screen' }, navBar(),
    el('p', null, 'పేజీ కనుగొనబడలేదు / Page not found'));
}

async function sha256Hex(text) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

function randomHex(bytes) {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr).map((b) => b.toString(16).padStart(2, '0')).join('');
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
    appEl.replaceChildren(el('p', { class: 'loading' }, 'లోడ్ అవుతోంది... / Loading...'));
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
    case 'doubt': view = viewDoubt(); break;
    case 'progress': view = await viewProgress(); break;
    case 'profile': view = viewProfile(); break;
    case 'home': view = viewHome(); break;
    default: view = notFound();
  }
  if (token !== renderToken) return;
  appEl.replaceChildren(view);
}

// ---------- home ----------

function viewHome() {
  const items = [
    { te: 'పాఠం', en: 'Learn', icon: '📖', go: '#/learn' },
    { te: 'అభ్యాసం', en: 'Practice', icon: '✏️', go: '#/practice' },
    { te: 'సందేహం', en: 'Ask a Doubt', icon: '❓', go: '#/doubt' },
    { te: 'పురోగతి', en: 'My Progress', icon: '📊', go: '#/progress' },
  ];
  return el('section', { class: 'screen' },
    el('div', { class: 'who' }, `${state.profile.avatar} ${state.profile.nick}`),
    el('div', { class: 'home-grid' },
      items.map((it) => el('div', { class: 'big-wrap' },
        el('button', {
          class: 'big-btn',
          on: { click: () => go(it.go) },
        }, el('span', { class: 'icon' }, it.icon),
          el('span', { class: 'te' }, it.te),
          el('span', { class: 'en' }, it.en)),
        speakButton(it.te, 'te-IN')))),
    el('button', {
      class: 'btn switch',
      on: { click: () => { state.unlocked = false; go('#/profile'); } },
    }, 'ప్రొఫైల్ మార్చు / Switch profile'));
}

// ---------- learn ----------

function chapterPicker(kind) {
  return el('section', { class: 'screen' }, navBar(),
    el('h2', null, kind === 'learn'
      ? 'పాఠం ఎంచుకోండి / Choose a chapter'
      : 'అభ్యాసం ఎంచుకోండి / Choose a chapter'),
    state.chapters.map((ch) => el('button', {
      class: 'chapter-btn',
      on: { click: () => go(`#/${kind}/${ch.id}`) },
    }, ch.title, el('span', { class: 'en' }, ' / ' + ch.title_en))));
}

function viewLearn(chapterId) {
  if (!chapterId) return chapterPicker('learn');
  const ch = findChapter(chapterId);
  if (!ch || !ch.lessons.length) return notFound();
  const idx = state.lessonIndex[ch.id] || 0;
  const lesson = ch.lessons[idx];
  return el('section', { class: 'screen' }, navBar(),
    el('h2', null, ch.title, ' / ', ch.title_en),
    el('div', { class: 'card' },
      el('p', { class: 'counter' }, `పాఠం ${idx + 1} / ${ch.lessons.length}`,
        ` · Lesson ${idx + 1} of ${ch.lessons.length}`),
      el('h3', null, lesson.title, ' / ', lesson.title_en),
      lesson.lines.map((t, i) => el('div', { class: 'line' },
        el('div', { class: 'te' }, t),
        el('div', { class: 'en' }, (lesson.lines_en || [])[i] || ''))),
      el('div', { class: 'example' },
        el('div', { class: 'te' }, lesson.example),
        el('div', { class: 'en' }, lesson.example_en)),
      el('p', { class: 'keyterm' }, 'Key term: ', lesson.keyTerm),
      el('button', {
        class: 'btn',
        on: { click: () => speak(lesson.lines.join(' ')) },
      }, '🔊 చదివి వినిపించు / Read aloud')),
    el('div', { class: 'row' },
      el('button', {
        class: 'btn', disabled: idx === 0,
        on: { click: () => { state.lessonIndex[ch.id] = idx - 1; render(); } },
      }, '◀ మునుపటి / Prev'),
      el('button', {
        class: 'btn', disabled: idx >= ch.lessons.length - 1,
        on: { click: () => { state.lessonIndex[ch.id] = idx + 1; render(); } },
      }, 'తదుపరి / Next ▶')),
    el('button', {
      class: 'btn primary',
      on: { click: () => go(`#/practice/${ch.id}`) },
    }, 'అభ్యాసం / Practice'));
}

// ---------- practice ----------

async function viewPractice(chapterId) {
  if (!chapterId) return chapterPicker('practice');
  const ch = findChapter(chapterId);
  if (!ch || !ch.questions.length) return notFound();
  if (!state.practice || state.practice.chapterId !== ch.id) {
    state.practice = { chapterId: ch.id, question: null, answered: null, lastId: null, stats: null };
  }
  const p = state.practice;
  if (!p.question) {
    p.stats = await loadStats(topicKey(ch));
    p.question = pickQuestion(ch, p.stats, p.lastId);
    p.answered = null;
  }
  const q = p.question;
  const ans = p.answered;
  const hintMode = (p.stats.consecutiveWrong || 0) >= 2;

  const options = q.options.map((opt, i) => {
    let cls = 'option';
    if (ans) {
      if (i === ans.choice) cls += ans.ok ? ' correct' : ' wrong';
      else if (!ans.ok && i === q.correct) cls += ' correct';
    }
    return el('button', {
      class: cls,
      disabled: !!ans,
      on: { click: () => answer(i) },
    }, el('div', { class: 'te' }, opt), el('div', { class: 'en' }, q.options_en[i]));
  });

  return el('section', { class: 'screen' }, navBar(),
    el('h2', null, ch.title, ' / ', ch.title_en),
    el('p', { class: 'counter' }, `స్థాయి / Level ${q.difficulty}`),
    el('div', { class: 'card question' },
      el('div', { class: 'te big' }, q.question),
      el('div', { class: 'en' }, q.question_en),
      speakButton(q.question, 'te-IN')),
    hintMode ? el('div', { class: 'hint' },
      el('div', { class: 'te' }, 'సూచన: ', q.mistake),
      el('div', { class: 'en' }, 'Hint: ', q.mistake_en)) : null,
    el('div', { class: 'options' }, options),
    ans ? el('div', { class: ans.ok ? 'feedback correct' : 'feedback wrong' },
      el('div', { class: 'te big' }, ans.ok ? 'సరైనది' : 'తప్పు'),
      el('div', { class: 'en' }, ans.ok ? 'Correct' : 'Wrong')) : null,
    ans && !ans.ok ? el('div', { class: 'mistake' },
      el('div', { class: 'te' }, q.mistake),
      el('div', { class: 'en' }, q.mistake_en)) : null,
    ans ? el('button', {
      class: 'btn primary',
      on: { click: nextQuestion },
    }, 'తదుపరి / Next ▶') : null);
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
  return el('div', { class: 'card explain' },
    el('div', { class: 'te' }, hit.te),
    el('div', { class: 'en' }, hit.en),
    ch ? el('button', {
      class: 'btn',
      on: { click: () => go(`#/learn/${ch.id}`) },
    }, `${ch.title} / ${ch.title_en} — పాఠం / Learn`) : null);
}

function chapterSummary(ch) {
  return el('div', { class: 'card explain' },
    el('div', { class: 'te' }, ch.title),
    el('div', { class: 'en' }, ch.title_en),
    ch.lessons.map((l) => el('div', { class: 'line' },
      el('div', { class: 'te' }, l.title),
      el('div', { class: 'en' }, l.title_en),
      el('div', { class: 'en' }, 'Key term: ', l.keyTerm))));
}

function viewDoubt() {
  const out = el('div', { class: 'answer-box' });
  const transcript = el('div', { class: 'transcript' });

  const showFor = (text) => {
    transcript.replaceChildren(text ? el('div', { class: 'te' }, text) : el('div', { class: 'en' }, ''));
    const hit = explainFor(text);
    out.replaceChildren(hit ? explanationCard(hit)
      : el('p', null, 'క్షమించండి, అర్థం కాలేదు / Sorry, no explanation found. Try a chapter below.'));
  };

  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const micBtn = SR ? el('button', {
    class: 'btn big-mic',
    on: {
      click: () => {
        const rec = new SR();
        rec.lang = 'te-IN';
        rec.onresult = (e) => showFor(e.results[0][0].transcript);
        rec.onerror = () => out.replaceChildren(el('p', null, 'మైక్ పని చేయలేదు / Microphone failed'));
        rec.start();
      },
    },
  }, '🎤 మాట్లాడండి / Speak') : null;

  const preview = el('img', { class: 'preview', alt: 'Photo preview', style: 'display:none' });
  const camInput = el('input', {
    type: 'file', accept: 'image/*', capture: 'environment',
    on: {
      change: (e) => {
        const f = e.target.files && e.target.files[0];
        if (!f) return;
        preview.src = URL.createObjectURL(f);
        preview.style.display = 'block';
      },
    },
  });

  return el('section', { class: 'screen' }, navBar(),
    el('h2', null, 'సందేహం / Ask a Doubt'),
    el('div', { class: 'row' },
      micBtn,
      el('label', { class: 'btn' }, '📷 ఫోటో / Photo', camInput)),
    preview,
    transcript,
    out,
    el('h3', null, 'అధ్యాయాలు / Chapters'),
    el('div', { class: 'chips' }, state.chapters.map((ch) => el('button', {
      class: 'chip',
      on: { click: () => out.replaceChildren(chapterSummary(ch)) },
    }, ch.title, ' / ', ch.title_en))));
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
    return el('div', { class: 'progress-row' },
      el('div', { class: 'te' }, ch.title),
      el('div', { class: 'en' }, ch.title_en),
      el('div', { class: 'bar' },
        el('div', { class: m >= 60 ? 'bar-fill good' : 'bar-fill weak', style: `width:${m}%` })),
      el('div', null, `${m}%`));
  });
  const codeBox = el('textarea', { class: 'share-code', readonly: true, rows: 4 });
  const shareBtn = el('button', {
    class: 'btn primary',
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
  }, 'తెలియజేయి / Share');
  const note = el('p', { class: 'note' },
    'ఇది ఆఫ్‌లైన్ ఎన్‌కోడింగ్; కోడ్‌లో పురోగతి సమాచారం స్వయంగా ఉంటుంది. ',
    'This is an offline encoding; the code carries the progress snapshot itself.');
  note.hidden = true;

  return el('section', { class: 'screen' }, navBar(),
    el('h2', null, 'పురోగతి / My Progress'),
    el('p', null, `🔥 రోజులు / Streak: ${streak} ${streak === 1 ? 'day' : 'days'}`),
    rows,
    shareBtn,
    codeBox,
    note);
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
    type: 'password', inputmode: 'numeric', maxlength: 4, placeholder: 'PIN (4 అంకెలు / 4 digits)',
  });
  const submit = async () => {
    const pin = pinInput.value.trim();
    const hash = await sha256Hex(state.profile.salt + ':' + pin);
    if (hash === state.profile.pinHash) {
      state.unlocked = true;
      render();
    } else {
      msg.textContent = 'PIN తప్పు / Wrong PIN';
    }
  };
  return el('section', { class: 'screen' }, navBar(),
    el('h2', null, 'PIN నిర్ధారించండి / Confirm PIN'),
    pinInput,
    el('button', { class: 'btn primary', on: { click: submit } }, 'సరే / OK'),
    msg);
}

function profileForm(existing) {
  const msg = el('p', { class: 'error' });
  const nickInput = el('input', {
    type: 'text', maxlength: 20, placeholder: 'పేరు / Nickname',
    value: existing ? existing.nick : '',
  });
  let avatar = existing ? existing.avatar : AVATARS[0];
  const avatarBtns = AVATARS.map((a) => el('button', {
    class: 'avatar' + (a === avatar ? ' selected' : ''),
    on: {
      click: () => {
        avatar = a;
        avatarBtns.forEach((b, i) => b.classList.toggle('selected', AVATARS[i] === a));
      },
    },
  }, a));
  const pinInput = el('input', {
    type: 'password', inputmode: 'numeric', maxlength: 4, placeholder: existing ? 'PIN మార్చకపోతే ఖాళీ / leave blank' : 'PIN (4 అంకెలు / 4 digits)',
  });

  const save = async () => {
    const nick = nickInput.value.trim();
    if (!nick) { msg.textContent = 'పేరు ఇవ్వండి / Enter a nickname'; return; }
    const pin = pinInput.value.trim();
    if (!existing && !/^\d{4}$/.test(pin)) {
      msg.textContent = '4 అంకెల PIN ఇవ్వండి / Enter a 4-digit PIN';
      return;
    }
    if (existing && pin && !/^\d{4}$/.test(pin)) {
      msg.textContent = '4 అంకెల PIN ఇవ్వండి / Enter a 4-digit PIN';
      return;
    }
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
  };

  return el('section', { class: 'screen' }, navBar(),
    el('h2', null, existing ? 'ప్రొఫైల్ / Profile' : 'కొత్త ప్రొఫైల్ / Create profile'),
    el('label', null, 'పేరు / Nickname', nickInput),
    el('div', { class: 'avatars' }, avatarBtns),
    el('label', null, 'PIN', pinInput),
    el('button', { class: 'btn primary', on: { click: save } }, 'సేవ్ / Save'),
    msg);
}

// ---------- startup ----------

async function init() {
  try {
    await openDB();
    state.profile = (await get('profiles', 'active')) || null;
    await loadContent();
  } catch (err) {
    appEl.replaceChildren(el('p', { class: 'error' }, 'లోపం / Error: ' + err.message));
    return;
  }
  window.addEventListener('hashchange', render);
  render();
}

init();

export { clearStore };
