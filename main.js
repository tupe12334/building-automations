const GUIDE_TEXTS = [
  // 0 — Intro
  [
    "Navigate with → / ← keys, nav buttons, or swipe. Each slide animates on arrival.",
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
  // 3 — Skill Output
  [
    "This is the output — what the skill actually produces when an alert fires.",
    "Root cause stated plainly: race condition — in-flight callback fires after teardown. No 200-line breadcrumb scroll.",
    "Evidence triangulated from 3 sources: Sentry (event timing), GCP (rules out server-side), FullStory (confirms user action).",
    "Fix direction names two specific callsites — enough for a developer to act without re-investigating.",
    "CONFIDENCE: HIGH means the skill recommends progressing to DRAFT tier (Jira ticket) without extra review.",
    "8 s wall time = max(Sentry 2s, GCP 3s, FullStory 2s) — all three fetched in parallel.",
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
    "Act: three authority tiers — NOTIFY (always safe) · DRAFT (≥ MEDIUM) · MUTATE (HIGH only · PreToolUse gate).",
    "Never skip from Analyse to MUTATE without a confidence gate — the single most common automation design mistake.",
    "PreToolUse(Bash) hook implements the gate: shell script checks confidence level, exit 2 blocks the command before it runs.",
  ],
  // 7 — Hooks title
  [
    "Section: Hooks — the local, event-driven automation layer.",
    "Hooks run inside every Claude Code session on your machine — full local env, no cloud involved.",
  ],
  // 8 — Hooks detail
  [
    "Two purposes: INJECT CONTEXT (left) — add information before Claude acts. GATE · VALIDATE (right) — inspect and optionally block what Claude does.",
    "SessionStart: inject credentials, git branch, open issues — every session starts with full context, not a blank slate.",
    "UserPromptSubmit: append live context to each message automatically — git status, date, alerts. Zero user effort per message.",
    "PreToolUse(Bash): fires before every shell command. exit 2 blocks the command — the confidence gate from the ACT layer, in code.",
    "PostToolUse(Edit · Write): fires after every file change — auto-lint, auto-test before the model's next turn. Catches bad writes before they compound.",
    "Mechanic: JSON payload on stdin → your shell/HTTP/MCP script → exit 0 proceed / exit 2 block. Full local env. 20+ events.",
    "Hooks run on your machine. Routines run on Anthropic's cloud. Orthogonal — use both in the same automation.",
  ],
  // 9 — Routines title
  [
    "Section: Routines — the cloud automation layer.",
    "Routines run on Anthropic's infrastructure, triggered by webhook or cron. No local machine, no server to manage.",
  ],
  // 10 — Trigger / Routines
  [
    "Claude Code Routines (Apr 2026): every saved routine gets a unique HTTPS fire endpoint with a bearer token.",
    "Webhook path: Sentry alert → POST /routines/{id}/fire → runs on Anthropic's cloud → Slack / Jira report.",
    "Schedule path: cron expression (e.g. 0 * * * *) → Sentry query for new / regressed issues → same pipeline.",
    "No GitHub Actions, no Lambda, no self-hosted infrastructure needed.",
    "Set up at <a href=\"https://claude.ai/code\" target=\"_blank\" rel=\"noopener\">claude.ai/code</a>: write the prompt, connect Sentry + Slack connectors, copy the fire URL.",
    "/schedule creates cloud-only (CCR) routines — no access to local machine, files, or env vars. For local execution: /loop (current session) or crontab -e calling the claude CLI directly.",
    "hooks are the in-session complement: PreToolUse · PostToolUse · SessionStart — local, full env, ~/.claude/settings.json (see Hooks slide).",
  ],
  // 11 — Routines Anatomy
  [
    "Routines run on Anthropic's cloud — isolated per-run sessions with a fresh git checkout. No local machine access.",
    "Configure once: prompt + model, git repo (GitHub), MCP connectors, cron schedule or run_once_at timestamp.",
    "Minimum cron interval: 1 hour. One-time runs use run_once_at (RFC3339 UTC) and auto-disable after firing.",
    "Need local access? /loop runs a recurring task inside your current Claude Code session with full local access.",
    "Or: crontab -e + claude CLI — system cron, full local env and file access, no Anthropic cloud involved.",
    "Create via /schedule · manage and delete at <a href=\"https://claude.ai/code/routines\" target=\"_blank\" rel=\"noopener\">claude.ai/code/routines</a>.",
  ],
  // 12 — Hooks vs Routines
  [
    "Full comparison: trigger, runtime, config, and best-for for each.",
    "Hooks: trigger = events inside session · runtime = your machine · config = ~/.claude/settings.json.",
    "Routines: trigger = webhook / cron · runtime = Anthropic's cloud · config = claude.ai/code/routines.",
    "Hooks best for: safety gates · context injection · linting · audit · invariants (every session).",
    "Routines best for: alert triage · nightly scans · async pipelines · runs without your machine.",
    "Orthogonal, not competing — the same automation can use both.",
  ],
  // 13 — Takeaways
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
  'intro', 'the case', 'manual vs automated', 'the output',
  'the pipeline', 'parallel dispatch', 'three layers', 'hooks', 'hooks: events', 'routines', 'trigger it', 'routines: anatomy', 'need local access?', 'claude vs claude -p', 'hooks vs routines', 'takeaways',
];

const slides = document.querySelectorAll('.slide');
let current = 0;

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

function animateCounters(slideEl) {
  slideEl.querySelectorAll('[data-count-to]').forEach(el => {
    const target = parseInt(el.getAttribute('data-count-to'), 10);
    const delay = parseFloat(el.getAttribute('data-count-delay') || '0') * 1000;
    const duration = 700;
    function fmt(n) {
      return n >= 1000 ? Math.floor(n/1000) + ' ' + String(n%1000).padStart(3,'0') : String(n);
    }
    setTimeout(() => {
      const start = performance.now();
      function step(now) {
        const t = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        el.textContent = fmt(Math.round(eased * target));
        if (t < 1) requestAnimationFrame(step);
        else el.textContent = fmt(target);
      }
      requestAnimationFrame(step);
    }, delay);
  });
}

function go(n) {
  const isFirstLoad = !slides[current].classList.contains('active');
  const prevIndex = current;
  const dir = n > current ? 1 : -1;

  current = Math.max(0, Math.min(n, slides.length - 1));

  if (!isFirstLoad && prevIndex !== current) {
    const exitClass = dir > 0 ? 'slide-exit-left' : 'slide-exit-right';
    const enterClass = dir > 0 ? 'slide-enter-right' : 'slide-enter-left';
    const oldSlide = slides[prevIndex];
    oldSlide.classList.add(exitClass);
    setTimeout(() => {
      oldSlide.classList.remove('active', exitClass);
    }, 320);
    slides[current].classList.add(enterClass);
    setTimeout(() => {
      slides[current].classList.remove(enterClass);
    }, 350);
  } else {
    slides[prevIndex].classList.remove('active');
  }

  slides[current].querySelectorAll('.reveal-group, .scan-line, .time-bar, .pop-in, .draw-line').forEach(g => {
    g.style.animation = 'none';
    void g.offsetWidth;
    g.style.animation = '';
  });

  slides[current].classList.add('active');
  updateDots();
  updateStepIndicator();
  updateGuideText();
  animateCounters(slides[current]);

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
