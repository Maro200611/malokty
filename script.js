const C = window.CONFIG, T = C.text, $ = id => document.getElementById(id);
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fx = $('fx');

// نصوص
$('loginTitle').textContent = T.loginTitle; $('pw').placeholder = T.placeholder;
$('enterTxt').textContent = T.enter; $('name').textContent = C.name;
$('songHint').textContent = T.songHint; $('songNote').textContent = T.songNote;
$('counterTitle').textContent = T.counterTitle; $('msgBtn').textContent = T.messageBtn;
$('msgText').textContent = T.message; $('closeBtn').textContent = T.close; $('footer').textContent = T.footer;
$('units').innerHTML = T.units.map((u, i) => `<div class="u"><b id="u${i}">0</b><small>${u}</small></div>`).join('');

// الصورة (لو فشلت تفضل الخلفية المتدرجة)
const img = new Image();
img.onload = () => {
  $('portraitImg').src = C.photo;
  $('avatarL').style.backgroundImage = `url("${C.photo}")`;
  document.body.classList.add('has-photo');
};
img.onerror = () => console.warn('الصورة مش موجودة:', C.photo);
img.src = C.photo;

// قلوب ولمعات
const E = ['❤️', '💖', '💕', '✨'];
function heart(x, y, up = true) {
  if (reduce) return;
  const h = document.createElement('span'); h.className = 'fh';
  h.textContent = E[Math.random() * 4 | 0];
  h.style.left = x + 'px'; h.style.top = y + 'px';
  h.style.fontSize = (1 + Math.random() * 1.2) + 'rem';
  h.style.setProperty('--dy', (up ? -1 : 1) * (120 + Math.random() * 260) + 'px');
  h.style.setProperty('--r', (Math.random() * 120 - 60) + 'deg');
  h.style.animationDuration = (2.5 + Math.random() * 2) + 's';
  fx.appendChild(h); setTimeout(() => h.remove(), 5000);
}
const W = () => innerWidth, H = () => innerHeight;
let ambient;
function ambientOn() {
  clearInterval(ambient);
  ambient = setInterval(() => {
    if (document.hidden || reduce) return;
    heart(Math.random() * W(), H() + 10);
    if (Math.random() < .5) sparkle();
  }, 1100);
}
function sparkle() {
  const s = document.createElement('i'); s.className = 'sp';
  s.style.left = Math.random() * W() + 'px'; s.style.top = Math.random() * H() * .8 + 'px';
  fx.appendChild(s); setTimeout(() => s.remove(), 2500);
}
function burst() {
  for (let i = 0; i < 24; i++) setTimeout(() => heart(Math.random() * W(), H() + 10, true), i * 60);
  for (let i = 0; i < 12; i++) setTimeout(() => heart(Math.random() * W(), -10, false), i * 90);
}
document.addEventListener('pointerdown', e => {
  if (e.target.closest('[data-pop]')) for (let i = 0; i < 5; i++) heart(e.clientX + (Math.random() * 40 - 20), e.clientY);
});

// دخول
const form = $('loginForm'), norm = s => s.toLowerCase().trim().replace(/\s+/g, ' ');
form.addEventListener('submit', e => {
  e.preventDefault();
  if (norm($('pw').value) !== norm(C.password)) {
    $('err').textContent = T.error; form.classList.remove('shake'); void form.offsetWidth; form.classList.add('shake');
    return;
  }
  $('err').textContent = ''; $('pw').blur();
  $('login').classList.add('out'); document.body.classList.remove('locked');
  setTimeout(() => {
    $('login').hidden = true; $('main').hidden = false;
    requestAnimationFrame(() => $('main').classList.add('show'));
    typeWrite(); burst(); ambientOn(); initSpotify();
  }, reduce ? 50 : 1100);
});

function typeWrite() {
  const el = $('tagline'), t = T.tagline; el.textContent = '';
  if (reduce) { el.textContent = t; return; }
  let i = 0; const id = setInterval(() => { el.textContent = t.slice(0, ++i); if (i >= t.length) clearInterval(id); }, 55);
}

// Parallax خفيف
if (!reduce) {
  const bg = $('portrait');
  addEventListener('pointermove', e => { bg.style.transform = `translate(${(e.clientX / W() - .5) * -10}px,${(e.clientY / H() - .5) * -10}px)`; });
  addEventListener('scroll', () => { bg.style.transform = `translateY(${scrollY * .06}px)`; }, { passive: true });
}

// Spotify (الطريقة الرسمية: iFrame API) — التشغيل بعد ضغط المستخدم فقط
let ctrl = null;
function initSpotify() {
  window.onSpotifyIframeApiReady = IFrameAPI => {
    IFrameAPI.createController($('embed'), { uri: 'spotify:track:' + C.spotifyTrack, width: '100%', height: 80, theme: 0 }, c => {
      ctrl = c;
      c.addListener('playback_update', e => document.querySelector('.song').classList.toggle('playing', !e.data.isPaused));
    });
  };
  const s = document.createElement('script'); s.src = 'https://open.spotify.com/embed/iframe-api/v1'; s.async = true;
  s.onerror = () => fallbackEmbed(); document.body.appendChild(s);
  setTimeout(() => { if (!ctrl) fallbackEmbed(); }, 6000);
}
function fallbackEmbed() {
  if (ctrl || $('embed').querySelector('iframe')) return;
  $('embed').innerHTML = `<iframe src="https://open.spotify.com/embed/track/${C.spotifyTrack}?theme=0" height="80" allow="autoplay; encrypted-media" loading="lazy"></iframe>`;
}
$('playBtn').addEventListener('click', () => {
  if (ctrl) ctrl.togglePlay(); else { fallbackEmbed(); $('songNote').textContent = 'دوسي Play في المشغل اللي تحت 🎶'; }
});

// العداد بالتقويم الفعلي (شهور وسنين كبيسة)
const start = new Date(C.startDate);
function addMonths(d, n) {
  const r = new Date(d); r.setDate(1); r.setMonth(r.getMonth() + n);
  r.setDate(Math.min(d.getDate(), new Date(r.getFullYear(), r.getMonth() + 1, 0).getDate())); return r;
}
function tick() {
  const now = new Date(); if (now < start) return;
  let m = (now.getFullYear() - start.getFullYear()) * 12 + now.getMonth() - start.getMonth();
  if (addMonths(start, m) > now) m--;
  let ms = now - addMonths(start, m);
  const d = Math.floor(ms / 864e5); ms %= 864e5;
  const h = Math.floor(ms / 36e5); ms %= 36e5;
  const mi = Math.floor(ms / 6e4), s = Math.floor(ms % 6e4 / 1000);
  [Math.floor(m / 12), m % 12, d, h, mi, s].forEach((v, i) => $('u' + i).textContent = v);
}
tick(); setInterval(tick, 1000);

// الرسالة
let lastFocus;
function openModal() { lastFocus = document.activeElement; const m = $('modal'); m.hidden = false; requestAnimationFrame(() => m.classList.add('open')); $('closeBtn').focus(); for (let i = 0; i < 10; i++) setTimeout(() => heart(Math.random() * W(), H() + 10), i * 70); }
function closeModal() { const m = $('modal'); m.classList.remove('open'); setTimeout(() => { m.hidden = true; lastFocus && lastFocus.focus(); }, reduce ? 0 : 500); }
$('msgBtn').onclick = openModal; $('closeBtn').onclick = closeModal;
$('modal').addEventListener('click', e => { if (e.target === $('modal')) closeModal(); });
addEventListener('keydown', e => { if (e.key === 'Escape' && !$('modal').hidden) closeModal(); });
