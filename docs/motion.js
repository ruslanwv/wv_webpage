(() => {
  const root = document.documentElement;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)');
  const hero = document.querySelector('.hero');
  const contact = document.querySelector('.contact');
  const floaters = [...document.querySelectorAll('.floating-card')];
  const productCards = [...document.querySelectorAll('.product-card')];
  const revealTargets = [];
  let observer;
  let frame = 0;
  let currentScroll = window.scrollY;
  let targetScroll = currentScroll;
  let maxScroll = 1;
  let heroHeight = 1;
  let contactTop = 0;
  let active = false;
  let slots = [];
  const pointer = { x: 0, y: 0, currentX: 0, currentY: 0 };
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  function reveal(element, type = 'item', delay = 0) {
    if (!element) return;
    element.dataset.reveal = type;
    element.style.setProperty('--reveal-delay', `${delay}ms`);
    revealTargets.push(element);
  }
  document.querySelectorAll('.hero-content > .eyebrow, .hero-content > h1, .hero-content > p, .hero-actions').forEach((el, i) => reveal(el, i === 1 ? 'title' : 'item', i * 115));
  document.querySelectorAll('.section-heading, .approach-title, .contact').forEach(section => {
    section.querySelectorAll('.eyebrow, h2, p, .text-link, .button').forEach((el, i) => reveal(el, el.tagName === 'H2' ? 'title' : 'item', Math.min(i * 85, 255)));
  });
  document.querySelectorAll('.filters, .capabilities, .footer-top').forEach(el => reveal(el));
  document.querySelectorAll('.approach-steps article, .news-list > a').forEach((el, i) => reveal(el, 'item', (i % 3) * 115));

  // Layout anchors stay stable while their cards move inside the grid.
  productCards.forEach((card, i) => {
    const slot = document.createElement('div');
    slot.className = 'product-slot';
    card.before(slot);
    slot.append(card);
    slot.hidden = card.hidden;
    reveal(card, 'card', (i % 3) * 120);
    slots.push({ element: slot, card, index: i, top: 0, height: 0 });
  });

  function measure() {
    maxScroll = Math.max(1, root.scrollHeight - window.innerHeight);
    heroHeight = hero.offsetHeight;
    contactTop = contact.getBoundingClientRect().top + window.scrollY;
    slots.forEach(slot => {
      const drift = parseFloat(slot.element.style.getPropertyValue('--card-drift')) || 0;
      slot.top = slot.element.getBoundingClientRect().top + window.scrollY - drift;
      slot.height = slot.element.offsetHeight;
    });
    requestFrame();
  }
  function requestFrame() {
    if (active && !frame && !document.hidden) frame = requestAnimationFrame(render);
  }
  function render() {
    frame = 0;
    if (!active || document.hidden) return;
    currentScroll += (targetScroll - currentScroll) * 0.16;
    pointer.currentX += (pointer.x - pointer.currentX) * 0.1;
    pointer.currentY += (pointer.y - pointer.currentY) * 0.1;
    root.style.setProperty('--page-progress', clamp(targetScroll / maxScroll, 0, 1));
    root.style.setProperty('--grid-y', `${-(currentScroll * 0.025) % 28}px`);
    if (currentScroll < heroHeight + 100) {
      root.style.setProperty('--hero-drift', `${clamp(currentScroll * 0.13, 0, 90)}px`);
      root.style.setProperty('--video-drift', `${clamp(currentScroll * 0.065, 0, 45)}px`);
      floaters.forEach(el => {
        const depth = Number(el.dataset.depth);
        el.style.setProperty('--depth-y', `${-clamp(currentScroll, 0, heroHeight) * depth}px`);
        el.style.setProperty('--pointer-x', `${pointer.currentX * depth * 40}px`);
        el.style.setProperty('--pointer-y', `${pointer.currentY * depth * 25}px`);
      });
    }
    const small = window.innerWidth <= 760;
    slots.forEach(slot => {
      if (slot.element.hidden) return;
      const center = slot.top + slot.height / 2 - currentScroll;
      if (center < -slot.height || center > window.innerHeight + slot.height) return;
      const progress = clamp((center - window.innerHeight / 2) / window.innerHeight, -1, 1);
      const depth = [12, -9, 15][slot.index % 3];
      slot.element.style.setProperty('--card-drift', `${progress * depth * (small ? .35 : 1)}px`);
    });
    const contactProgress = clamp((currentScroll + window.innerHeight - contactTop) / window.innerHeight, 0, 1);
    contact.style.setProperty('--contact-drift', `${(contactProgress - .5) * 35}px`);
    if (Math.abs(targetScroll - currentScroll) > .15 || Math.abs(pointer.x - pointer.currentX) > .005 || Math.abs(pointer.y - pointer.currentY) > .005) requestFrame();
  }
  function reset() {
    active = false;
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
    observer?.disconnect();
    root.classList.remove('motion-enabled');
    ['--grid-y', '--hero-drift', '--video-drift'].forEach(name => root.style.removeProperty(name));
    floaters.forEach(el => ['--depth-y', '--pointer-x', '--pointer-y'].forEach(name => el.style.removeProperty(name)));
    slots.forEach(slot => {
      slot.element.style.removeProperty('--card-drift');
      slot.card.style.removeProperty('--tilt-x');
      slot.card.style.removeProperty('--tilt-y');
    });
    contact.style.removeProperty('--contact-drift');
  }
  function enable() {
    reset();
    if (reduced.matches || !('IntersectionObserver' in window)) return;
    active = true;
    root.classList.add('motion-enabled');
    observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-revealed');
        observer.unobserve(entry.target);
      });
    }, { threshold: .08, rootMargin: '0px 0px -32px 0px' });
    revealTargets.forEach(el => {
      if (!el.classList.contains('is-revealed')) observer.observe(el);
    });
    targetScroll = currentScroll = window.scrollY;
    measure();
  }
  window.addEventListener('scroll', () => { targetScroll = window.scrollY; requestFrame(); }, { passive: true });
  window.addEventListener('resize', measure, { passive: true });
  window.addEventListener('experiences:layout', measure);
  window.addEventListener('solutions:filter', () => {
    slots.forEach(slot => {
      if (!slot.element.hidden) {
        slot.card.classList.add('is-revealed');
        observer?.unobserve(slot.card);
      }
    });
    measure();
  });
  hero.addEventListener('pointermove', event => {
    if (!active || !finePointer.matches) return;
    const rect = hero.getBoundingClientRect();
    pointer.x = clamp((event.clientX - rect.left) / rect.width - .5, -.5, .5);
    pointer.y = clamp((event.clientY - rect.top) / rect.height - .5, -.5, .5);
    requestFrame();
  }, { passive: true });
  hero.addEventListener('pointerleave', () => { pointer.x = pointer.y = 0; requestFrame(); });
  productCards.forEach(card => {
    card.addEventListener('pointermove', event => {
      if (!active || !finePointer.matches) return;
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--tilt-x', `${clamp((event.clientX - rect.left) / rect.width - .5, -.5, .5) * 5}deg`);
      card.style.setProperty('--tilt-y', `${clamp((event.clientY - rect.top) / rect.height - .5, -.5, .5) * -5}deg`);
    }, { passive: true });
    card.addEventListener('pointerleave', () => {
      card.style.setProperty('--tilt-x', '0deg');
      card.style.setProperty('--tilt-y', '0deg');
    });
  });
  document.addEventListener('focusin', event => {
    const el = event.target.closest('[data-reveal]');
    if (el) { el.classList.add('is-revealed'); observer?.unobserve(el); }
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && frame) { cancelAnimationFrame(frame); frame = 0; }
    else requestFrame();
  });
  reduced.addEventListener('change', enable);
  if ('ResizeObserver' in window) new ResizeObserver(measure).observe(document.querySelector('main'));
  document.fonts?.ready.then(measure);
  enable();
})();
