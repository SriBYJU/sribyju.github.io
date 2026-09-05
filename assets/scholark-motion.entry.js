import { animate, inView, stagger } from 'framer-motion/dom';

const reduced = () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const cleanups = [];
const onCleanup = (fn) => cleanups.push(fn);

const svgIcons = {
  chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 19V5M4 19h16"/><path d="m7 15 3-4 3 2 5-7"/></svg>',
  target: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path d="M12 2v3M22 12h-3M12 22v-3M2 12h3"/></svg>',
  compass: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="m15.8 8.2-2 5.6-5.6 2 2-5.6 5.6-2Z"/></svg>',
  pen: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m14 6 4 4M4 20l3.3-.7L19.5 7.1a2.1 2.1 0 0 0-3-3L4.3 16.3 4 20Z"/><path d="M13 4.5 19.5 11"/></svg>',
  book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21V5.5Z"/><path d="M4 5.5V21M8 7h8M8 11h7"/></svg>',
  path: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="6" cy="18" r="2"/><circle cx="18" cy="6" r="2"/><path d="M8 18h3a4 4 0 0 0 4-4v-1a4 4 0 0 1 4-4M6 16V8a4 4 0 0 1 4-4h2"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>',
  lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5" y="10" width="14" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>'
};

function installIcons() {
  document.querySelectorAll('[data-sk5-icon]').forEach((node) => {
    const icon = svgIcons[node.dataset.sk5Icon];
    if (icon && !node.firstElementChild) node.innerHTML = icon;
  });
}

function setRevealState(nodes) {
  nodes.forEach((node) => {
    node.style.opacity = '0';
    node.style.transform = 'translateY(18px)';
  });
}

function reveal(nodes, options = {}) {
  if (!nodes.length) return;
  if (reduced()) {
    nodes.forEach((node) => { node.style.opacity = '1'; node.style.transform = 'none'; });
    return;
  }
  setRevealState(nodes);
  const controls = animate(nodes, { opacity: 1, y: 0 }, {
    duration: options.duration ?? 0.62,
    delay: stagger(options.stagger ?? 0.07, { startDelay: options.startDelay ?? 0 }),
    ease: [0.22, 1, 0.36, 1]
  });
  onCleanup(() => controls.stop());
}

function animateHome() {
  const intro = document.querySelector('.sk5-home-intro');
  if (!intro) return;
  const copy = [...intro.querySelectorAll('.sk5-intro-copy > *')];
  const launch = intro.querySelector('.sk5-launchpad');
  const workspace = document.querySelector('.sk5-workspace');
  const cards = [...document.querySelectorAll('.sk5-tool')];
  const trust = [...document.querySelectorAll('.sk5-trust .trust-item')];
  reveal(copy, { stagger: 0.1, startDelay: 0.05 });
  if (launch) {
    if (reduced()) { launch.style.opacity = '1'; launch.style.transform = 'none'; }
    else {
      launch.style.opacity = '0';
      launch.style.transform = 'translateY(24px) rotate(1.2deg)';
      const controls = animate(launch, { opacity: 1, y: 0, rotate: 1.2 }, { duration: 0.78, delay: 0.18, ease: [0.22, 1, 0.36, 1] });
      onCleanup(() => controls.stop());
    }
  }
  if (workspace) {
    const stop = inView(workspace, () => {
      reveal(cards, { stagger: 0.06 });
      return () => cards.forEach((card) => { card.style.opacity = ''; card.style.transform = ''; });
    }, { amount: 0.1 });
    onCleanup(stop);
  }
  const trustSection = document.querySelector('.sk5-trust');
  if (trust.length && trustSection) {
    const stop = inView(trustSection, () => reveal(trust, { stagger: 0.09, duration: 0.5 }), { amount: 0.15 });
    onCleanup(stop);
  }
}

function animateActivePage(page) {
  if (!page || page.id === 'page-home' || reduced()) return;
  const children = [...page.children].filter((node) => node.nodeType === 1);
  if (!children.length) return;
  children.forEach((node) => { node.style.opacity = '0'; node.style.transform = 'translateY(10px)'; });
  const controls = animate(children, { opacity: 1, y: 0 }, { duration: 0.38, delay: stagger(0.045), ease: [0.22, 1, 0.36, 1] });
  onCleanup(() => controls.stop());
}

function installPageObserver() {
  const observePage = (page) => {
    if (page?.classList?.contains('page')) observer.observe(page, { attributes: true });
  };
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
        const page = mutation.target;
        if (page.classList.contains('active')) animateActivePage(page);
      }
      if (mutation.type === 'childList') {
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === 1) {
            observePage(node);
            node.querySelectorAll?.('.page').forEach(observePage);
          }
        });
      }
    }
  });
  document.querySelectorAll('.page').forEach(observePage);
  observer.observe(document.body, { childList: true, subtree: true });
  onCleanup(() => observer.disconnect());
}

function installHoverLift() {
  if (reduced() || !window.matchMedia?.('(hover: hover) and (pointer: fine)')?.matches) return;
  document.querySelectorAll('.sk5-tool').forEach((card) => {
    const enter = () => animate(card, { y: -5, rotate: card.classList.contains('sk5-tool-college') ? -0.5 : 0 }, { duration: 0.24, ease: [0.22, 1, 0.36, 1] });
    const leave = () => animate(card, { y: 0, rotate: 0 }, { duration: 0.3, ease: [0.22, 1, 0.36, 1] });
    card.addEventListener('pointerenter', enter);
    card.addEventListener('pointerleave', leave);
    onCleanup(() => { card.removeEventListener('pointerenter', enter); card.removeEventListener('pointerleave', leave); });
  });
}

function boot() {
  installIcons();
  animateHome();
  installPageObserver();
  installHoverLift();
  window.addEventListener('pagehide', () => cleanups.splice(0).forEach((cleanup) => cleanup()), { once: true });
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot, { once: true });
else boot();
