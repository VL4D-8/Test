// Real YouTube Shorts (vertical, Creative Commons / official content).
// Replace `videoId` with any YouTube short/video id you like.
const SHORTS = [
  {
    id: 'tPEE9ZwTmy0',
    videoId: 'tPEE9ZwTmy0',
    channel: '@YouTube',
    avatar: 'https://i.pravatar.cc/100?img=12',
    caption: 'A short clip to demo the player ✨ #shorts',
    audio: 'Original sound',
    likes: 18420,
    comments: 312,
  },
  {
    id: 'aqz-KE-bpKQ',
    videoId: 'aqz-KE-bpKQ',
    channel: '@blender',
    avatar: 'https://i.pravatar.cc/100?img=32',
    caption: 'Big Buck Bunny — open movie classic 🐰',
    audio: 'Big Buck Bunny OST',
    likes: 92100,
    comments: 1840,
  },
  {
    id: 'ScMzIvxBSi4',
    videoId: 'ScMzIvxBSi4',
    channel: '@nature',
    avatar: 'https://i.pravatar.cc/100?img=5',
    caption: 'Beautiful nature in 4K 🌿',
    audio: 'Nature ambience',
    likes: 5421,
    comments: 87,
  },
  {
    id: 'jNQXAC9IVRw',
    videoId: 'jNQXAC9IVRw',
    channel: '@jawed',
    avatar: 'https://i.pravatar.cc/100?img=15',
    caption: 'Me at the zoo — the very first YouTube video 🦁',
    audio: 'Original sound - jawed',
    likes: 233000,
    comments: 4502,
  },
  {
    id: 'dQw4w9WgXcQ',
    videoId: 'dQw4w9WgXcQ',
    channel: '@rickastleyVEVO',
    avatar: 'https://i.pravatar.cc/100?img=23',
    caption: 'A timeless classic 🎶',
    audio: 'Never Gonna Give You Up - Rick Astley',
    likes: 7820000,
    comments: 41500,
  },
];

const feed = document.getElementById('feed');
const tpl = document.getElementById('short-template');

function formatCount(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(n);
}

const players = new Map(); // short element -> YT.Player
let apiReady = false;
const pendingMounts = [];

window.onYouTubeIframeAPIReady = () => {
  apiReady = true;
  pendingMounts.splice(0).forEach((fn) => fn());
};

function mountPlayer(short, videoId) {
  const target = short.querySelector('.yt-player');
  const mount = () => {
    const player = new YT.Player(target, {
      videoId,
      playerVars: {
        autoplay: 0,
        controls: 0,
        modestbranding: 1,
        rel: 0,
        playsinline: 1,
        loop: 1,
        playlist: videoId,
        mute: 1,
        iv_load_policy: 3,
        fs: 0,
        disablekb: 1,
      },
      events: {
        onReady: () => {
          short.classList.remove('loading');
        },
        onStateChange: (e) => {
          if (e.data === YT.PlayerState.PLAYING) short.classList.remove('paused');
          if (e.data === YT.PlayerState.PAUSED) short.classList.add('paused');
        },
      },
    });
    players.set(short, player);
  };
  if (apiReady) mount();
  else pendingMounts.push(mount);
}

function buildShort(data) {
  const node = tpl.content.firstElementChild.cloneNode(true);
  node.dataset.id = data.id;
  node.classList.add('loading');

  node.querySelector('.channel-name').textContent = data.channel;
  node.querySelector('.caption').textContent = data.caption;
  node.querySelector('.audio-name').textContent = data.audio;
  node.querySelector('.channel-pic img').src = data.avatar;

  const likeBtn = node.querySelector('.action.like');
  const likeCount = likeBtn.querySelector('.count');
  likeCount.textContent = formatCount(data.likes);
  likeBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const liked = likeBtn.classList.toggle('liked');
    data.likes += liked ? 1 : -1;
    likeCount.textContent = formatCount(data.likes);
  });

  const commentBtn = node.querySelector('[data-action="comment"]');
  commentBtn.querySelector('.count').textContent = formatCount(data.comments);
  commentBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    alert(`${data.comments.toLocaleString()} comments — UI coming soon`);
  });

  const shareBtn = node.querySelector('[data-action="share"]');
  shareBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    const url = `https://youtube.com/shorts/${data.videoId}`;
    const shareData = { title: 'Shorts', text: data.caption, url };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(url);
        shareBtn.querySelector('.count').textContent = 'Copied';
      } catch {}
    }
  });

  const subBtn = node.querySelector('.subscribe-btn');
  subBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    const subbed = subBtn.classList.toggle('subscribed');
    subBtn.textContent = subbed ? 'Subscribed' : 'Subscribe';
  });

  node.querySelector('.tap-layer').addEventListener('click', () => togglePlay(node));

  mountPlayer(node, data.videoId);
  return node;
}

function togglePlay(short) {
  const player = players.get(short);
  if (!player || !player.getPlayerState) return;
  const state = player.getPlayerState();
  if (state === YT.PlayerState.PLAYING) player.pauseVideo();
  else player.playVideo();
}

function render() {
  SHORTS.forEach((s) => feed.appendChild(buildShort(s)));
}

const io = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      const player = players.get(entry.target);
      if (!player || !player.playVideo) return;
      if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
        try { player.seekTo(0, true); } catch {}
        player.playVideo();
        entry.target.classList.remove('paused');
      } else {
        player.pauseVideo();
      }
    });
  },
  { threshold: [0, 0.6, 1] }
);

function observeAll() {
  document.querySelectorAll('.short').forEach((el) => io.observe(el));
}

function startProgressLoop() {
  const tick = () => {
    players.forEach((player, short) => {
      if (!player || !player.getDuration || !player.getCurrentTime) return;
      const fill = short.querySelector('.progress-fill');
      if (!fill) return;
      try {
        const dur = player.getDuration();
        const cur = player.getCurrentTime();
        if (dur > 0) {
          const pct = Math.max(0, Math.min(100, (cur / dur) * 100));
          fill.style.width = pct + '%';
        }
      } catch {}
    });
    requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function unmuteOnInteract() {
  const handler = () => {
    players.forEach((p) => { try { p.unMute(); } catch {} });
    window.removeEventListener('click', handler);
    window.removeEventListener('keydown', handler);
  };
  window.addEventListener('click', handler, { once: true });
  window.addEventListener('keydown', handler, { once: true });
}

function setupKeyboardNav() {
  window.addEventListener('keydown', (e) => {
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp' && e.key !== ' ') return;
    const t = e.target;
    if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
    if (researchEl && researchEl.classList.contains('open')) return;
    e.preventDefault();
    if (e.key === ' ') {
      const current = currentShort();
      if (current) togglePlay(current);
      return;
    }
    const shorts = [...document.querySelectorAll('.short')];
    const current = currentShort();
    const idx = shorts.indexOf(current);
    const next = e.key === 'ArrowDown' ? shorts[idx + 1] : shorts[idx - 1];
    if (next) next.scrollIntoView({ behavior: 'smooth' });
  });
}

function currentShort() {
  const shorts = [...document.querySelectorAll('.short')];
  const center = window.innerHeight / 2;
  return shorts.find((s) => {
    const r = s.getBoundingClientRect();
    return r.top <= center && r.bottom >= center;
  });
}

// --- Categories + research drawer ---

const CATEGORIES = [
  { id: 'all', label: 'All', query: 'shorts' },
  { id: 'tech', label: 'Tech', query: 'tech shorts' },
  { id: 'cooking', label: 'Cooking', query: 'cooking shorts recipe' },
  { id: 'fitness', label: 'Fitness', query: 'fitness shorts workout' },
  { id: 'travel', label: 'Travel', query: 'travel shorts' },
  { id: 'comedy', label: 'Comedy', query: 'comedy shorts' },
  { id: 'gaming', label: 'Gaming', query: 'gaming shorts' },
  { id: 'music', label: 'Music', query: 'music shorts' },
  { id: 'cars', label: 'Cars', query: 'car shorts' },
  { id: 'science', label: 'Science', query: 'science shorts' },
];

const KEY_STORAGE = 'yt_data_api_key';

const chipsEl = document.getElementById('chips');
const researchEl = document.getElementById('research');
const resultsEl = document.getElementById('results');
const searchForm = document.getElementById('search-form');
const searchInput = document.getElementById('search-input');
const apiKeyInput = document.getElementById('api-key');

function renderChips() {
  CATEGORIES.forEach((c, i) => {
    const b = document.createElement('button');
    b.className = 'chip' + (i === 0 ? ' active' : '');
    b.textContent = c.label;
    b.addEventListener('click', () => {
      chipsEl.querySelectorAll('.chip').forEach((x) => x.classList.remove('active'));
      b.classList.add('active');
      openResearch(c.query);
    });
    chipsEl.appendChild(b);
  });
}

function openResearch(query) {
  researchEl.classList.add('open');
  researchEl.setAttribute('aria-hidden', 'false');
  if (query) {
    searchInput.value = query;
    runSearch(query);
  }
}

function closeResearch() {
  researchEl.classList.remove('open');
  researchEl.setAttribute('aria-hidden', 'true');
}

function getKey() {
  return localStorage.getItem(KEY_STORAGE) || '';
}

async function runSearch(query) {
  resultsEl.innerHTML = '';
  const key = getKey();
  if (!key) {
    const a = document.createElement('a');
    a.href = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&sp=EgIYAQ%253D%253D`;
    a.target = '_blank';
    a.rel = 'noopener';
    a.className = 'result';
    a.innerHTML = `<div class="info"><div class="title">Open "${escapeHtml(query)}" on YouTube ↗</div><div class="ch">Add an API key to search in-page</div></div>`;
    resultsEl.appendChild(a);
    return;
  }
  resultsEl.textContent = 'Searching…';
  try {
    const url = new URL('https://www.googleapis.com/youtube/v3/search');
    url.search = new URLSearchParams({
      part: 'snippet',
      type: 'video',
      videoDuration: 'short',
      maxResults: '12',
      q: query,
      key,
    }).toString();
    const r = await fetch(url);
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const data = await r.json();
    resultsEl.innerHTML = '';
    (data.items || []).forEach((item) => {
      const id = item.id.videoId;
      const sn = item.snippet;
      const card = document.createElement('div');
      card.className = 'result';
      const thumb = sn.thumbnails?.high?.url || sn.thumbnails?.default?.url;
      const idea = {
        videoId: id,
        title: sn.title,
        channel: sn.channelTitle,
        channelId: sn.channelId,
        thumb,
      };
      card.appendChild(buildResultCardBody(idea));
      resultsEl.appendChild(card);
    });
    if (!resultsEl.children.length) {
      resultsEl.textContent = 'No results.';
    }
  } catch (err) {
    resultsEl.textContent = `Search failed: ${err.message}. Check the API key.`;
  }
}

function escapeHtml(s) {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

// --- Saved ideas (localStorage) ---

const SAVED_KEY = 'yt_saved_ideas';

function loadSaved() {
  try { return JSON.parse(localStorage.getItem(SAVED_KEY) || '[]'); }
  catch { return []; }
}

function persistSaved(list) {
  localStorage.setItem(SAVED_KEY, JSON.stringify(list));
  updateSavedBadge();
}

function isSaved(videoId) {
  return loadSaved().some((s) => s.videoId === videoId);
}

function toggleSave(idea) {
  const list = loadSaved();
  const i = list.findIndex((s) => s.videoId === idea.videoId);
  if (i >= 0) list.splice(i, 1);
  else list.unshift(idea);
  persistSaved(list);
  renderSaved();
  return i < 0;
}

function updateSavedBadge() {
  const el = document.getElementById('saved-count');
  if (el) el.textContent = String(loadSaved().length);
}

function buildResultCardBody(idea) {
  const frag = document.createDocumentFragment();
  const img = document.createElement('img');
  img.src = idea.thumb || '';
  img.alt = '';
  frag.appendChild(img);

  const info = document.createElement('div');
  info.className = 'info';
  info.innerHTML = `
    <div class="title">${escapeHtml(idea.title)}</div>
    <div class="ch">${escapeHtml(idea.channel || '')}</div>
  `;
  frag.appendChild(info);

  const row = document.createElement('div');
  row.className = 'row';

  const addBtn = document.createElement('button');
  addBtn.type = 'button';
  addBtn.className = 'primary';
  addBtn.textContent = 'Add';
  addBtn.addEventListener('click', () => {
    addToFeed({
      id: idea.videoId,
      videoId: idea.videoId,
      channel: idea.channel || '@channel',
      avatar: 'https://i.pravatar.cc/100?u=' + (idea.channelId || idea.videoId),
      caption: idea.title,
      audio: 'Original sound',
      likes: 0,
      comments: 0,
    });
    closeResearch();
  });
  row.appendChild(addBtn);

  const saveBtn = document.createElement('button');
  saveBtn.type = 'button';
  const setSaveLabel = () => {
    const saved = isSaved(idea.videoId);
    saveBtn.textContent = saved ? '★ Saved' : '☆ Save';
    saveBtn.classList.toggle('saved', saved);
  };
  setSaveLabel();
  saveBtn.addEventListener('click', () => {
    toggleSave(idea);
    setSaveLabel();
  });
  row.appendChild(saveBtn);

  const outlineBtn = document.createElement('button');
  outlineBtn.type = 'button';
  outlineBtn.textContent = 'Outline';
  outlineBtn.addEventListener('click', () => {
    switchTab('outline');
    document.getElementById('outline-input').value = idea.title;
    renderOutline(idea.title);
  });
  row.appendChild(outlineBtn);

  frag.appendChild(row);
  return frag;
}

function renderSaved() {
  const el = document.getElementById('saved-list');
  if (!el) return;
  const list = loadSaved();
  el.innerHTML = '';
  if (!list.length) {
    el.innerHTML = '<p class="hint">No saved ideas yet. Star results in the Search tab.</p>';
    return;
  }
  list.forEach((idea) => {
    const card = document.createElement('div');
    card.className = 'result';
    card.appendChild(buildResultCardBody(idea));
    el.appendChild(card);
  });
}

// --- Tabs ---

function switchTab(name) {
  document.querySelectorAll('.tab').forEach((t) => t.classList.toggle('active', t.dataset.tab === name));
  document.querySelectorAll('.tab-panel').forEach((p) => p.classList.toggle('active', p.dataset.panel === name));
  if (name === 'saved') renderSaved();
}

function setupTabs() {
  document.querySelectorAll('.tab').forEach((tab) => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });
}

// --- Outline generator (template-based, no API) ---

const ANGLES = [
  'Contrarian take: argue the opposite of the conventional wisdom.',
  'Beginner POV: "I tried this for the first time — here\'s what nobody tells you."',
  'Expert breakdown: slow-mo + frame-by-frame analysis with one expert insight.',
  '30-day challenge: document attempting it daily and show the transformation.',
  'Cheap vs expensive: same outcome, two budgets, side-by-side.',
  'Speed-run: do it in under 60 seconds and show the timer.',
  'Mistake compilation: 3 things people get wrong, fixed in one short.',
  'Behind the scenes: show the prep/setup nobody else films.',
];

const HOOKS = [
  'Stop scrolling — {topic} in 30 seconds.',
  'Nobody talks about this when it comes to {topic}.',
  'I was wrong about {topic}. Here\'s what changed my mind.',
  'You\'re doing {topic} wrong. Here\'s the fix.',
  'The {topic} trick they don\'t teach you.',
  'POV: you finally understand {topic}.',
];

function pick(arr, n) {
  const copy = [...arr];
  const out = [];
  while (out.length < n && copy.length) {
    out.push(copy.splice(Math.floor(Math.random() * copy.length), 1)[0]);
  }
  return out;
}

function renderOutline(rawTitle) {
  const out = document.getElementById('outline-output');
  out.innerHTML = '';
  const title = (rawTitle || '').trim();
  if (!title) return;
  const topic = title.replace(/^\d+\s+/, '').toLowerCase();

  const hooks = pick(HOOKS, 3).map((h) => h.replace('{topic}', topic));
  const angles = pick(ANGLES, 3);

  const beats = [
    { t: '0–3s', text: `Hook: ${hooks[0]}` },
    { t: '3–8s', text: `Setup: state the problem or question in one sentence.` },
    { t: '8–22s', text: `Payoff: deliver 2–3 concrete points or steps about "${topic}". Visuals over words.` },
    { t: '22–28s', text: `Twist: a counter-intuitive detail or surprising result.` },
    { t: '28–30s', text: `CTA / loop: ask one question OR loop visually back to the hook.` },
  ];

  out.appendChild(section('Hook options', `<ul>${hooks.map((h) => `<li>${escapeHtml(h)}</li>`).join('')}</ul>`));

  const beatsHtml = beats.map((b) => `<div class="beat"><div class="t">${b.t}</div><div>${escapeHtml(b.text)}</div></div>`).join('');
  out.appendChild(section('30-second beat sheet', beatsHtml));

  out.appendChild(section('Original angles to make this YOURS', `<ol>${angles.map((a) => `<li>${escapeHtml(a)}</li>`).join('')}</ol>`));

  out.appendChild(section('Originality checklist', `
    <ul>
      <li>Shoot all video yourself (or use licensed/CC stock — Pexels, Pixabay, Mixkit).</li>
      <li>Write your own script and record your own voice/captions.</li>
      <li>Add a perspective the original didn't have (your data, story, mistake, result).</li>
      <li>Change the format — different aspect of the topic, different structure, different ending.</li>
      <li>Don't reuse clips, music, or thumbnails from the source video.</li>
    </ul>
  `));
}

function section(heading, innerHtml) {
  const el = document.createElement('div');
  el.className = 'outline-section';
  el.innerHTML = `<h3>${escapeHtml(heading)}</h3>${innerHtml}`;
  return el;
}

function setupOutline() {
  document.getElementById('outline-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('outline-input').value.trim();
    if (!title) return;
    const useClaude = document.getElementById('use-claude').checked;
    if (useClaude && getAnthropicKey()) {
      generateOutlineWithClaude(title);
    } else {
      if (useClaude) {
        const out = document.getElementById('outline-output');
        out.innerHTML = '';
        out.appendChild(section('Add an Anthropic API key', '<p class="hint">Open the API key panel below and paste a key, then try again. Falling back to the template generator now.</p>'));
      }
      renderOutline(title);
    }
  });

  const anthropicInput = document.getElementById('anthropic-key');
  anthropicInput.value = getAnthropicKey();
  document.getElementById('save-anthropic-key').addEventListener('click', () => {
    localStorage.setItem(ANTHROPIC_KEY_STORAGE, anthropicInput.value.trim());
  });
  document.getElementById('clear-anthropic-key').addEventListener('click', () => {
    localStorage.removeItem(ANTHROPIC_KEY_STORAGE);
    anthropicInput.value = '';
  });
}

// --- Claude integration ---

const ANTHROPIC_KEY_STORAGE = 'anthropic_api_key';

function getAnthropicKey() {
  return localStorage.getItem(ANTHROPIC_KEY_STORAGE) || '';
}

const SYSTEM_PROMPT = `You are a YouTube Shorts content strategist helping creators turn an existing video idea into ORIGINAL content of their own (not a re-upload).

Given a video title or topic, output a complete outline in this exact Markdown format and nothing else:

## Hook options
- <hook 1, written as the actual on-screen line>
- <hook 2>
- <hook 3>

## 30-second beat sheet
- 0–3s: <what happens on screen and what's said>
- 3–8s: <setup>
- 8–22s: <payoff / main content — be concrete and specific to the topic>
- 22–28s: <twist or surprising detail>
- 28–30s: <CTA or visual loop>

## Original angles
- <angle 1: a specific take that makes this the creator's own>
- <angle 2>
- <angle 3>

## Originality checklist
- <topic-specific reminder 1>
- <topic-specific reminder 2>
- <topic-specific reminder 3>

Rules:
- Be specific to the topic — do not produce generic placeholders.
- Never suggest reusing footage, audio, or thumbnails from the source video.
- Keep each bullet to one line.
- Output Markdown only — no preamble, no closing remarks.`;

async function generateOutlineWithClaude(title) {
  const out = document.getElementById('outline-output');
  out.innerHTML = '';
  const status = section('Generating with Claude…', '<p class="hint">Streaming response…</p>');
  out.appendChild(status);

  const key = getAnthropicKey();
  let buffer = '';

  try {
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-opus-4-7',
        max_tokens: 2048,
        stream: true,
        thinking: { type: 'adaptive' },
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: `Video title or topic: ${title}` }],
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      out.innerHTML = '';
      out.appendChild(section('Claude request failed', `<p class="hint">${escapeHtml(`HTTP ${resp.status}: ${errText.slice(0, 500)}`)}</p>`));
      return;
    }

    out.innerHTML = '';
    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let sseBuffer = '';

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      sseBuffer += decoder.decode(value, { stream: true });
      const lines = sseBuffer.split('\n');
      sseBuffer = lines.pop();
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const payload = line.slice(6);
        if (payload === '[DONE]') continue;
        try {
          const ev = JSON.parse(payload);
          if (ev.type === 'content_block_delta' && ev.delta?.type === 'text_delta') {
            buffer += ev.delta.text;
            renderClaudeMarkdown(out, buffer);
          }
        } catch {
          // ignore malformed lines
        }
      }
    }
    renderClaudeMarkdown(out, buffer);
  } catch (err) {
    out.innerHTML = '';
    out.appendChild(section('Claude request failed', `<p class="hint">${escapeHtml(err.message || String(err))}</p>`));
  }
}

function renderClaudeMarkdown(container, markdown) {
  container.innerHTML = '';
  const sections = markdown.split(/^## /m).filter((s) => s.trim());
  for (const raw of sections) {
    const lines = raw.split('\n');
    const heading = (lines.shift() || '').trim();
    const body = lines.join('\n').trim();

    const beatLines = body.split('\n').filter((l) => /^-\s*\d+(?:[–-]\d+)?\s*s\s*:/i.test(l.trim()));
    const isBeatSheet = beatLines.length >= 2;

    let inner;
    if (isBeatSheet) {
      inner = beatLines
        .map((l) => {
          const m = l.trim().match(/^-\s*([^:]+):\s*(.*)$/);
          if (!m) return '';
          return `<div class="beat"><div class="t">${escapeHtml(m[1].trim())}</div><div>${escapeHtml(m[2].trim())}</div></div>`;
        })
        .join('');
    } else {
      const items = body
        .split('\n')
        .map((l) => l.trim())
        .filter((l) => l.startsWith('-'))
        .map((l) => `<li>${escapeHtml(l.replace(/^-\s*/, ''))}</li>`)
        .join('');
      inner = items ? `<ul>${items}</ul>` : `<p class="hint">${escapeHtml(body)}</p>`;
    }
    container.appendChild(section(heading, inner));
  }
}

function addToFeed(data) {
  const node = buildShort(data);
  feed.appendChild(node);
  io.observe(node);
  node.scrollIntoView({ behavior: 'smooth' });
}

function setupResearch() {
  document.getElementById('open-research').addEventListener('click', () => openResearch(''));
  document.getElementById('close-research').addEventListener('click', closeResearch);
  searchForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const q = searchInput.value.trim();
    if (q) runSearch(q);
  });
  apiKeyInput.value = getKey();
  document.getElementById('save-key').addEventListener('click', () => {
    localStorage.setItem(KEY_STORAGE, apiKeyInput.value.trim());
  });
  document.getElementById('clear-key').addEventListener('click', () => {
    localStorage.removeItem(KEY_STORAGE);
    apiKeyInput.value = '';
  });
}

render();
observeAll();
unmuteOnInteract();
setupKeyboardNav();
startProgressLoop();
renderChips();
setupResearch();
setupTabs();
setupOutline();
updateSavedBadge();
