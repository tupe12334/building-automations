const TTS_TEXTS = [
  "Welcome to Building Automations — an interactive guide to the Wednesday AI Week session. In this session you will learn how to turn a repeated manual investigation into a skill that runs automatically, fetches evidence from multiple systems in parallel, and produces a consistent triage report in seconds instead of minutes. Press the right arrow to begin.",
  "The demo case is a real crash: TypeError, cannot read properties of undefined, reading set video uploaded. It hit four hundred and forty three users, over seven thousand times, since December twenty twenty four. It was marked resolved and assigned. It is still firing today. The question is not how to fix this one. The question is how to stop spending thirty minutes on the next one.",
  "The problem: every time a desktop-app crash alert lands, someone spends twenty to thirty minutes on the same steps. Open Sentry. Scroll two hundred breadcrumbs. Query GCP logs for the affected user. Find the FullStory session. Form a hypothesis. Write it up. Then do it all again tomorrow for the next alert. A skill collapses this to ten seconds. It triggers automatically, dispatches Sentry, GCP, and FullStory in parallel, reconstructs the timeline, and outputs a root-cause report. Once. For everyone. Every time.",
  "The story is in the breadcrumbs. The recording starts, screenshots fire every two hundred milliseconds, steps are added. Then the user pauses. Stop is called. The server is closed. The recording object is deleted. But at this point, in-flight screenshot upload callbacks are still in flight. They resolve after the recording object is gone. When they try to call set video uploaded, the object is undefined. The crash happens. The breadcrumb trail makes this visible in under a minute. A human digging through the same two hundred lines takes twenty.",
  "The pipeline: an alert arrives with a Sentry issue ID. The skill dispatches three things simultaneously: fetch the Sentry issue details, breadcrumbs, and recent events; query GCP Cloud Run logs for the five minutes around the crash; and retrieve the FullStory session transcript. All three run in parallel. When they all return, the skill synthesizes a timeline, identifies the root cause, and suggests a fix direction.",
  "The key pattern: dispatch everything in a single message. When you send multiple tool calls in one message, the model runs them in parallel. The wall time equals the slowest single task, not the sum of all tasks. Three sequential messages at two, three, and two seconds costs seven seconds plus three round trips. One message with three parallel calls costs three seconds, period. This is the most important pattern in agentic design.",
  "Every automation pipeline runs through three distinct layers, each with different design rules. The Gather layer is pure data fetch — Sentry breadcrumbs, G C P logs, FullStory sessions. It makes no judgments. Design it for maximum parallelism and encode only stable parameters. When it fails, it produces wrong data, catchable downstream. The Analyse layer is where judgment lives: timeline reconstruction, root cause identification, pattern matching. Encode known patterns here and always output a confidence level. When it fails, it produces wrong conclusions, often through hallucination when data is sparse. The Act layer takes actions with side effects. It has three authority tiers. Notify — Slack messages, P R comments — is always safe; humans read and correct. Draft — Jira tickets, P R drafts — requires at least medium confidence. Mutate — closing issues, assigning, merging — requires high confidence only. The design rule: authority must match confidence. Never skip from Analyse directly to Mutate. That path leads to automation accidents.",
  "Triggering the skill requires no server and no GitHub Actions. Claude Code Routines, shipped in April twenty twenty six, give every saved routine a slash fire endpoint — a unique HTTPS URL with a bearer token. Configure a Sentry webhook to POST to that URL and the routine runs automatically whenever an alert fires. No middleware. No pipeline. No extra infrastructure. The same routine can also run on a schedule — a cron expression like zero star star star star runs it every hour, querying Sentry for new or regressed issues. Set it up once in claude dot ai slash code: write the prompt, connect your Sentry and Slack connectors, and copy the endpoint. From that point, every alert produces a triage report. Important: slash schedule creates cloud-only routines. They run on Anthropic's infrastructure with no access to your local machine, files, or environment variables. For local execution, use slash loop within your current Claude Code session, or a system cron job that invokes the claude CLI directly.",
  "A Claude Code Routine is an isolated session that runs on Anthropic's infrastructure, not on your machine. Each run gets a fresh git checkout of your repo, the MCP connectors you configured, your chosen model, and the tools you allowed — but it cannot access your local machine, local files, or local environment variables. You configure a routine once: the prompt, the git repo, which MCP connectors to attach, and either a recurring cron expression — minimum one hour interval — or a run once at timestamp for a one-time execution. If you need local machine access, do not use slash schedule. Instead, use slash loop for a self-paced recurring task within your current Claude Code session, or set up a system crontab entry that calls the claude CLI directly. Create routines with the slash schedule command. Manage and delete them at claude dot ai slash code slash routines.",
  "Five things to remember. One: do it manually first. Understand the steps before you automate them. The skill is a distillation of what you already know. Two: dispatch in parallel. One message, all tool calls, wall time equals the slowest task. Three: encode what's stable, discover the rest. Operational knowledge in the skill, implementation details at runtime. Four: any repeated investigation is a candidate. Alert triage, PR impact checks, CI failure diagnosis, deploy status. Five: skills compound. Each run teaches the skill something new. When you discover a crash pattern that wasn't in the known-patterns section, add it. After six months of runs, that section becomes your crash taxonomy — assembled automatically as a side effect of the automation itself. Now build one.",
];

const GUIDE_TEXTS = [
  // 0 — Intro
  [
    "Navigate with → / ← keys, nav buttons, or swipe. Each slide animates on arrival.",
    "▶ reads the slide aloud via Kokoro TTS — runs in-browser, ~50 MB first load, fully private.",
    "Three-part pattern: Alert fires → Skill triggers → Pipeline fetches + synthesises → Report.",
  ],
  // 1 — Demo Case
  [
    "Real crash from Guidde production: <a href=\"https://guiddeco.sentry.io/issues/DESKTOP-APP-QB\" target=\"_blank\" rel=\"noopener\">DESKTOP-APP-QB</a> — 443 users, 7,041 events since Dec 2024.",
    "'Marked resolved · still firing' — the fix was partial, or the same pattern recurred on a different code path.",
    "The question isn't how to fix this crash. It's how to stop spending 30 min on the next one.",
  ],
  // 2 — Manual vs Automated
  [
    "Left (dashed border): the same 30-min ritual, repeated by someone on the team every single time.",
    "SKILL.md (the arrow): a markdown file that encodes the workflow once, runs it for everyone forever.",
    "Right: automated path — triggers on alert, fetches Sentry + GCP + FullStory in parallel, outputs a consistent report.",
    "The skill doesn't replace judgment — it distils what you already know how to do.",
  ],
  // 3 — Breadcrumb Timeline
  [
    "Left branch (ALGORITHM): happy path — recording starts, screenshots fire every ~200 ms, steps accumulate.",
    "Dashed line marks teardown: user stops → server closes → recording object deleted.",
    "Right branch (IN-FLIGHT): screenshot-upload callbacks still in flight haven't returned when teardown runs.",
    "Late 'Step added successfully' fires after teardown → tries to call setVideoUploaded on the deleted object → crash.",
    "Diagnostic signal: any ALGORITHM event appearing after 'Deleting recording…' in the breadcrumb trail.",
  ],
  // 4 — Pipeline
  [
    "Three data sources fetched simultaneously from a single Claude message.",
    "<a href=\"https://guiddeco.sentry.io/issues/DESKTOP-APP-QB\" target=\"_blank\" rel=\"noopener\">Sentry DESKTOP-APP-QB</a>: issue metadata + last 200 breadcrumbs + recent events for the same fingerprint.",
    "GCP Logs: cloud_run_revision logs ±5 min around the crash timestamp, filtered to /c/v1/ errors.",
    "FullStory: session events for the affected user ID around the same timeframe.",
    "Synthesise step merges all three into a unified timeline, names the root cause, suggests fix direction.",
  ],
  // 5 — Parallel Dispatch
  [
    "Sequential (left): each tool call waits for the previous result — 2 s + 3 s + 2 s + round-trip overhead.",
    "Parallel (right): all three calls in one message — wall time = max(2 s, 3 s, 2 s) = 3 s, not the sum.",
    "Rule: if two tool calls don't depend on each other's results, put them in the same message.",
    "This is the highest-leverage pattern in agentic Claude design.",
  ],
  // 6 — Three Layers
  [
    "Three layers, three failure modes — design each independently, not as one monolithic pipeline.",
    "Gather: pure fetch, no judgment. Maximise parallelism, encode stable params. Fails with wrong data (recoverable).",
    "Analyse: stochastic judgment. Encode known patterns, always output confidence level. Fails with wrong conclusions.",
    "Act: three authority tiers — NOTIFY (always safe) · DRAFT (≥ MEDIUM) · MUTATE (HIGH only · confirm).",
    "Never skip from Analyse to MUTATE without a confidence gate — the single most common automation design mistake.",
  ],
  // 7 — Trigger / Routines
  [
    "Claude Code Routines (Apr 2026): every saved routine gets a unique HTTPS fire endpoint with a bearer token.",
    "Webhook path: Sentry alert → POST /routines/{id}/fire → runs on Anthropic's cloud → Slack / Jira report.",
    "Schedule path: cron expression (e.g. 0 * * * *) → Sentry query for new / regressed issues → same pipeline.",
    "No GitHub Actions, no Lambda, no self-hosted infrastructure needed.",
    "Set up at <a href=\"https://claude.ai/code\" target=\"_blank\" rel=\"noopener\">claude.ai/code</a>: write the prompt, connect Sentry + Slack connectors, copy the fire URL.",
    "/schedule creates cloud-only (CCR) routines — no access to local machine, files, or env vars. For local execution: /loop (current session) or crontab -e calling the claude CLI directly.",
  ],
  // 8 — Routines Anatomy
  [
    "Routines run on Anthropic's cloud — isolated per-run sessions with a fresh git checkout. No local machine access.",
    "Configure once: prompt + model, git repo (GitHub), MCP connectors, cron schedule or run_once_at timestamp.",
    "Minimum cron interval: 1 hour. One-time runs use run_once_at (RFC3339 UTC) and auto-disable after firing.",
    "Need local access? /loop runs a recurring task inside your current Claude Code session with full local access.",
    "Or: crontab -e + claude CLI — system cron, full local env and file access, no Anthropic cloud involved.",
    "Create via /schedule · manage and delete at <a href=\"https://claude.ai/code/routines\" target=\"_blank\" rel=\"noopener\">claude.ai/code/routines</a>.",
  ],
  // 9 — Takeaways
  [
    "Manual first: the skill is a distillation of what you already know — you can't automate what you haven't done yourself.",
    "Parallel dispatch: one message, all independent tool calls → wall time = slowest task, not the sum.",
    "Stable vs volatile: encode operational facts (org slugs, project IDs), discover implementation details at runtime.",
    "Any repeated investigation qualifies: alert triage, CI failure diagnosis, deploy status, PR impact checks.",
    "Skills compound: new crash patterns → PR to known-patterns section → next run is smarter. The skill learns.",
    "Start small: one alert type, one skill file. Iterate as you learn new patterns.",
  ],
];

const SLIDE_NAMES = [
  'intro', 'the case', 'manual vs automated', 'breadcrumb timeline',
  'the pipeline', 'parallel dispatch', 'three layers', 'trigger it', 'routines', 'takeaways',
];

const slides = document.querySelectorAll('.slide');
let current = 0;
let tts = null;
let currentSource = null;
let currentAudioCtx = null;
let ttsState = 'idle';

function buildDots() {
  const container = document.getElementById('dots');
  slides.forEach(() => {
    const d = document.createElement('span');
    d.className = 'dot';
    container.appendChild(d);
  });
}

function updateDots() {
  document.querySelectorAll('.dot').forEach((d, i) => {
    d.classList.toggle('dot-active', i === current);
  });
}

function updateStepIndicator() {
  const name = SLIDE_NAMES[current] || '';
  document.getElementById('step-label').textContent =
    `${current + 1} / ${slides.length}  ·  ${name}`;
}

function updateGuideText() {
  const items = GUIDE_TEXTS[current] || [];
  document.getElementById('guide-text').innerHTML =
    items.map(t => `<li>${t}</li>`).join('');
}

function go(n) {
  if (currentSource) { try { currentSource.stop(); } catch (_) {} currentSource = null; }
  if (ttsState === 'playing' || ttsState === 'generating') {
    setTTSState(tts ? 'ready' : 'idle');
  }

  slides[current].classList.remove('active');
  current = Math.max(0, Math.min(n, slides.length - 1));

  slides[current].querySelectorAll('.reveal-group').forEach(g => {
    g.style.animation = 'none';
    void g.offsetWidth;
    g.style.animation = '';
  });

  slides[current].classList.add('active');
  updateDots();
  updateStepIndicator();
  updateGuideText();

  document.getElementById('prev').disabled = current === 0;
  document.getElementById('next').disabled = current === slides.length - 1;

  history.replaceState(null, '', '#s' + current);
}

const guidePanel = document.getElementById('guide-panel');
document.getElementById('guide-handle').addEventListener('click', () => {
  const open = guidePanel.classList.toggle('guide-open');
  document.getElementById('guide-handle').setAttribute('aria-expanded', String(open));
  document.getElementById('guide-icon').textContent = open ? '▶' : '◀';
});

function setTTSState(state) {
  ttsState = state;
  const btn = document.getElementById('speak-btn');
  btn.className = 'nav-btn tts-btn';
  btn.disabled = false;

  switch (state) {
    case 'loading':
      btn.textContent = '···';
      btn.disabled = true;
      btn.classList.add('tts-loading');
      btn.title = 'Loading Kokoro TTS model (~50 MB, one-time)…';
      break;
    case 'generating':
      btn.textContent = '···';
      btn.disabled = true;
      btn.classList.add('tts-loading');
      btn.title = 'Synthesising speech…';
      break;
    case 'playing':
      btn.textContent = '■';
      btn.classList.add('tts-playing');
      btn.title = 'Stop';
      break;
    case 'error':
      btn.textContent = '✕';
      btn.title = 'TTS unavailable — check console';
      break;
    default:
      btn.textContent = '▶';
      btn.title = 'Read aloud (Kokoro TTS)';
  }
}

async function ensureTTS() {
  if (tts) return true;
  setTTSState('loading');
  try {
    const { KokoroTTS } = await import('https://esm.sh/kokoro-js');
    tts = await KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0', { dtype: 'q8' });
    setTTSState('ready');
    return true;
  } catch (err) {
    console.error('[Kokoro TTS]', err);
    setTTSState('error');
    return false;
  }
}

async function handleSpeak() {
  if (ttsState === 'playing') {
    if (currentSource) { try { currentSource.stop(); } catch (_) {} currentSource = null; }
    setTTSState('ready');
    return;
  }
  if (['loading', 'generating', 'error'].includes(ttsState)) return;

  const text = TTS_TEXTS[current];
  if (!text) return;

  const ok = await ensureTTS();
  if (!ok) return;

  setTTSState('generating');
  try {
    const audio = await tts.generate(text, { voice: 'af_bella' });

    if (currentAudioCtx) { try { currentAudioCtx.close(); } catch (_) {} }
    currentAudioCtx = new AudioContext({ sampleRate: audio.sampling_rate });
    const buffer = currentAudioCtx.createBuffer(1, audio.data.length, audio.sampling_rate);
    buffer.getChannelData(0).set(audio.data);

    currentSource = currentAudioCtx.createBufferSource();
    currentSource.buffer = buffer;
    currentSource.connect(currentAudioCtx.destination);
    currentSource.onended = () => { currentSource = null; setTTSState('ready'); };
    currentSource.start();
    setTTSState('playing');
  } catch (err) {
    console.error('[Kokoro TTS generate]', err);
    setTTSState('error');
  }
}

document.getElementById('speak-btn').addEventListener('click', handleSpeak);
document.getElementById('prev').addEventListener('click', () => go(current - 1));
document.getElementById('next').addEventListener('click', () => go(current + 1));

document.addEventListener('keydown', e => {
  if (e.key === 'ArrowRight' || e.key === 'ArrowDown') go(current + 1);
  if (e.key === 'ArrowLeft'  || e.key === 'ArrowUp')   go(current - 1);
});

let touchX = 0;
document.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
document.addEventListener('touchend', e => {
  const dx = e.changedTouches[0].clientX - touchX;
  if (Math.abs(dx) > 50) go(current + (dx < 0 ? 1 : -1));
}, { passive: true });

buildDots();
const initHash = location.hash.match(/^#s(\d+)$/);
go(initHash ? Math.min(parseInt(initHash[1], 10), slides.length - 1) : 0);

window.addEventListener('hashchange', () => {
  const m = location.hash.match(/^#s(\d+)$/);
  if (m) go(Math.min(parseInt(m[1], 10), slides.length - 1));
});
