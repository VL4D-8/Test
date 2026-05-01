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
    a.innerHTML = `<div class="info"><div class="title">Open "${query}" on YouTube ↗</div><div class="ch">Add an API key to search in-page</div></div>`;
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
      card.innerHTML = `
        <img src="${sn.thumbnails?.high?.url || sn.thumbnails?.default?.url}" alt="" />
        <div class="info">
          <div class="title">${escapeHtml(sn.title)}</div>
          <div class="ch">${escapeHtml(sn.channelTitle)}</div>
        </div>
        <button class="add" type="button">Add to feed</button>
      `;
      card.querySelector('.add').addEventListener('click', () => {
        addToFeed({
          id,
          videoId: id,
          channel: sn.channelTitle,
          avatar: 'https://i.pravatar.cc/100?u=' + sn.channelId,
          caption: sn.title,
          audio: 'Original sound',
          likes: 0,
          comments: 0,
        });
        closeResearch();
      });
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
renderChips();
setupResearch();
