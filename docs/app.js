const menu = document.querySelector('.menu-toggle');
const navigation = document.querySelector('#navigation');
menu.addEventListener('click', () => {
  const open = menu.getAttribute('aria-expanded') !== 'true';
  menu.setAttribute('aria-expanded', String(open));
  navigation.classList.toggle('open', open);
});
navigation.addEventListener('click', event => {
  if (event.target.closest('a')) {
    navigation.classList.remove('open');
    menu.setAttribute('aria-expanded', 'false');
  }
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && navigation.classList.contains('open')) {
    navigation.classList.remove('open');
    menu.setAttribute('aria-expanded', 'false');
    menu.focus();
  }
});
const filters = document.querySelectorAll('.filter');
const cards = document.querySelectorAll('.product-card');
filters.forEach(filter => filter.addEventListener('click', () => {
  filters.forEach(button => {
    const selected = button === filter;
    button.classList.toggle('active', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
  let count = 0;
  cards.forEach(card => {
    card.hidden = filter.dataset.filter !== 'all' && card.dataset.category !== filter.dataset.filter;
    const slot = card.closest('.product-slot');
    if (slot) slot.hidden = card.hidden;
    if (!card.hidden) count++;
  });
  document.querySelector('#filter-status').textContent = `${count} ${count === 1 ? 'solution' : 'solutions'} shown`;
  window.dispatchEvent(new Event('solutions:filter'));
}));
const backgroundVideo = document.querySelector('.hero-video');
const motionToggle = document.querySelector('.motion-toggle');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
let wantsMotion = !reducedMotion.matches;
let usingFallback = false;
let startingPlayback = false;
backgroundVideo.muted = true;
backgroundVideo.defaultMuted = true;
backgroundVideo.playsInline = true;
backgroundVideo.autoplay = wantsMotion;
function syncVideoButton() {
  motionToggle.textContent = backgroundVideo.paused ? 'Play background video' : 'Pause background video';
  motionToggle.setAttribute('aria-pressed', String(!backgroundVideo.paused));
}
async function startPlayback() {
  if (!wantsMotion || document.hidden || startingPlayback) return;
  startingPlayback = true;
  try {
    await backgroundVideo.play();
    if (!wantsMotion || document.hidden) backgroundVideo.pause();
  } catch (error) {
    // Autoplay can be blocked by device settings; a direct click can retry.
    if (error.name === 'NotAllowedError') wantsMotion = false;
  } finally {
    startingPlayback = false;
    syncVideoButton();
  }
}
backgroundVideo.addEventListener('play', syncVideoButton);
backgroundVideo.addEventListener('pause', syncVideoButton);
backgroundVideo.addEventListener('canplay', () => {
  if (backgroundVideo.paused) startPlayback();
});
backgroundVideo.addEventListener('error', () => {
  if (!usingFallback) {
    usingFallback = true;
    backgroundVideo.src = backgroundVideo.dataset.fallbackSrc;
    backgroundVideo.load();
  } else {
    motionToggle.textContent = 'Retry background video';
    motionToggle.setAttribute('aria-pressed', 'false');
  }
});
motionToggle.addEventListener('click', () => {
  wantsMotion = backgroundVideo.paused;
  if (wantsMotion) {
    if (backgroundVideo.error) {
      usingFallback = false;
      backgroundVideo.src = 'https://waverity.ai/media/documents/waverity.mp4';
      backgroundVideo.load();
    }
    startPlayback();
  } else backgroundVideo.pause();
});
if (wantsMotion) startPlayback();
else backgroundVideo.pause();
syncVideoButton();
reducedMotion.addEventListener('change', event => {
  if (event.matches) {
    wantsMotion = false;
    backgroundVideo.autoplay = false;
    backgroundVideo.pause();
  }
});
document.addEventListener('visibilitychange', () => {
  if (document.hidden) backgroundVideo.pause();
  else if (wantsMotion) startPlayback();
});
