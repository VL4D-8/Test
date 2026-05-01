const SHORTS = [
  {
    id: 's1',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    channel: '@bigbuckbunny',
    avatar: 'https://i.pravatar.cc/100?img=12',
    caption: 'When the bonfire hits different 🔥 #shorts #vibes',
    audio: 'Original sound - bigbuckbunny',
    likes: 18420,
    comments: 312,
  },
  {
    id: 's2',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    channel: '@dreamscape',
    avatar: 'https://i.pravatar.cc/100?img=32',
    caption: 'A tiny moment from a big dream ✨',
    audio: 'Dream Theme - dreamscape',
    likes: 92100,
    comments: 1840,
  },
  {
    id: 's3',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/SubaruOutbackOnStreetAndDirt.mp4',
    channel: '@offroad.daily',
    avatar: 'https://i.pravatar.cc/100?img=5',
    caption: 'Took the Subaru where it was never meant to go 🚙💨',
    audio: 'Dust & Engines - offroad.daily',
    likes: 5421,
    comments: 87,
  },
  {
    id: 's4',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    channel: '@scifi.cuts',
    avatar: 'https://i.pravatar.cc/100?img=15',
    caption: 'Sci-fi short of the week 🚀 which one is your favorite?',
    audio: 'Synthwave Drift - scifi.cuts',
    likes: 233000,
    comments: 4502,
  },
  {
    id: 's5',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/VolkswagenGTIReview.mp4',
    channel: '@quickreviews',
    avatar: 'https://i.pravatar.cc/100?img=23',
    caption: 'GTI in 30 seconds — would you daily it?',
    audio: 'Hot Hatch Beat - quickreviews',
    likes: 7820,
    comments: 415,
  },
];

const feed = document.getElementById('feed');
const tpl = document.getElementById('short-template');

function formatCount(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(n);
}

function buildShort(data) {
  const node = tpl.content.firstElementChild.cloneNode(true);
  node.dataset.id = data.id;

  const video = node.querySelector('.short-video');
  video.src = data.videoUrl;
  video.muted = true; // start muted so autoplay works

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
    const shareData = { title: 'Shorts', text: data.caption, url: location.href };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(location.href);
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

  // Tap video to toggle play/pause
  node.addEventListener('click', () => togglePlay(node));

  // Progress bar
  const fill = node.querySelector('.progress-fill');
  video.addEventListener('timeupdate', () => {
    if (!video.duration) return;
    fill.style.width = (video.currentTime / video.duration) * 100 + '%';
  });

  return node;
}

function togglePlay(short) {
  const video = short.querySelector('.short-video');
  if (video.paused) {
    video.play();
    short.classList.remove('paused');
  } else {
    video.pause();
    short.classList.add('paused');
  }
}

function render() {
  SHORTS.forEach((s) => feed.appendChild(buildShort(s)));
}

// Auto-play whichever short is most visible; pause others
const io = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      const video = entry.target.querySelector('.short-video');
      if (entry.isIntersecting && entry.intersectionRatio >= 0.6) {
        video.currentTime = 0;
        const p = video.play();
        if (p && p.catch) p.catch(() => {});
        entry.target.classList.remove('paused');
      } else {
        video.pause();
      }
    });
  },
  { threshold: [0, 0.6, 1] }
);

function observeAll() {
  document.querySelectorAll('.short').forEach((el) => io.observe(el));
}

// Unmute on first user interaction
function unmuteOnInteract() {
  const handler = () => {
    document.querySelectorAll('.short-video').forEach((v) => (v.muted = false));
    window.removeEventListener('click', handler);
    window.removeEventListener('keydown', handler);
  };
  window.addEventListener('click', handler, { once: true });
  window.addEventListener('keydown', handler, { once: true });
}

// Keyboard navigation: arrow up/down to jump between shorts
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

render();
observeAll();
unmuteOnInteract();
setupKeyboardNav();
