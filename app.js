// Linky - app.js - كل تفاعلات الموقع بمكان واحد
document.documentElement.classList.add('js');

// بعض WebView القديمة لا تدعم واجهات الحركة والمراقبة؛ الموقع يظل يعمل بدونها.
const motionPreference = typeof window.matchMedia === 'function'
  ? window.matchMedia('(prefers-reduced-motion: reduce)')
  : { matches: false };
const supportsIntersectionObserver = typeof window.IntersectionObserver === 'function';

// ===== 1. ظهور العناصر عند النزول =====
const revealObserver = supportsIntersectionObserver ? new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.08 }) : null;

document.querySelectorAll('.reveal').forEach(el => {
  if (revealObserver) revealObserver.observe(el);
  else el.classList.add('visible');
});

// تأخير خفيف للمجموعات - بدون ما نأخر الكيبورد
document.querySelectorAll('.service-list, .steps, .identity-grid, .work-grid, .reviews-grid, .pricing-grid').forEach(group => {
  [...group.children].forEach((el, i) => el.style.setProperty('--reveal-delay', `${i * 85}ms`));
});
document.querySelectorAll('.contact-copy, #brief-form, .faq > div:first-child, footer').forEach(el => {
  el.classList.add('reveal');
  if (revealObserver) revealObserver.observe(el);
  else el.classList.add('visible');
});

// ===== 2. شريط التقدم فوق =====
const progress = document.querySelector('.progress');
let progressScheduled = false;
function updateProgress() {
  const max = document.documentElement.scrollHeight - innerHeight;
  if (progress) progress.style.width = (max > 0 ? scrollY / max * 100 : 0) + '%';
  progressScheduled = false;
}
addEventListener('scroll', () => {
  if (!progressScheduled) {
    const schedule = window.requestAnimationFrame || (callback => window.setTimeout(callback, 16));
    schedule(updateProgress);
    progressScheduled = true;
  }
}, { passive: true });
updateProgress();

// ===== 4. هيدر - القائمة + الحبة المتحركة + رجوع لفوق =====
const header = document.getElementById('siteHeader');
const nav = document.querySelector('.header-luxe nav');
const pill = document.getElementById('navPill');
const links = nav ? [...nav.querySelectorAll('a')] : [];
const menuBtn = document.getElementById('menuBtn');
const headerProgressBar = document.getElementById('headerProgressBar');
const backToTop = document.getElementById('backToTop');
let activeLink = nav?.querySelector('a.active') || null;
let isClickScrolling = false;
let navTouchPointer = null;
let navTouchStart = null;
let navTouchScrubbed = false;
let suppressNextNavClick = false;

function movePillTo(el) {
  if (!el || !pill || !nav) return;
  const navRect = nav.getBoundingClientRect();
  const r = el.getBoundingClientRect();
  pill.style.right = (navRect.right - r.right) + 'px';
  pill.style.width = r.width + 'px';
  pill.style.top = el.offsetTop + 'px';
  pill.style.height = el.offsetHeight + 'px';
  pill.classList.add('show');
}
function setActive(link, move = true) {
  if (!link) return;
  links.forEach(l => l.classList.remove('active'));
  link.classList.add('active');
  activeLink = link;
  if (move) movePillTo(link);
}

function navLinkAtPoint(x, y) {
  const link = document.elementFromPoint(x, y)?.closest('a');
  return link && nav?.contains(link) && links.includes(link) ? link : null;
}

function closeMobileNav() {
  header?.classList.remove('mobile-open');
  if (menuBtn) { menuBtn.classList.remove('active'); menuBtn.textContent = '☰'; }
}

function goToNavLink(link) {
  if (!link) return;
  setActive(link);
  isClickScrolling = true;
  closeMobileNav();
  document.querySelector(link.getAttribute('href'))?.scrollIntoView({ behavior: 'smooth' });
  setTimeout(() => { isClickScrolling = false; }, 900);
}

links.forEach(link => {
  link.addEventListener('click', event => {
    if (suppressNextNavClick) {
      event.preventDefault();
      suppressNextNavClick = false;
      return;
    }
    isClickScrolling = true;
    setActive(link);
    closeMobileNav();
    setTimeout(() => { isClickScrolling = false; }, 900);
  });
});

nav?.addEventListener('pointerdown', event => {
  if (event.pointerType !== 'touch' || !header?.classList.contains('mobile-open')) return;
  const link = navLinkAtPoint(event.clientX, event.clientY);
  if (!link) return;
  navTouchPointer = event.pointerId;
  navTouchStart = { x: event.clientX, y: event.clientY };
  navTouchScrubbed = false;
  setActive(link);
}, { passive: true });

nav?.addEventListener('pointermove', event => {
  if (event.pointerType !== 'touch' || event.pointerId !== navTouchPointer) return;
  if (Math.hypot(event.clientX - navTouchStart.x, event.clientY - navTouchStart.y) > 8) navTouchScrubbed = true;
  const link = navLinkAtPoint(event.clientX, event.clientY);
  if (link) setActive(link);
}, { passive: true });

nav?.addEventListener('pointerup', event => {
  if (event.pointerType !== 'touch' || event.pointerId !== navTouchPointer) return;
  const link = navLinkAtPoint(event.clientX, event.clientY) || activeLink;
  const scrubbed = navTouchScrubbed;
  navTouchPointer = null;
  navTouchStart = null;
  navTouchScrubbed = false;
  if (!scrubbed || !link) return;
  suppressNextNavClick = true;
  goToNavLink(link);
  setTimeout(() => { suppressNextNavClick = false; }, 500);
}, { passive: true });

nav?.addEventListener('pointercancel', event => {
  if (event.pointerId !== navTouchPointer) return;
  navTouchPointer = null;
  navTouchStart = null;
  navTouchScrubbed = false;
}, { passive: true });

const sections = links.map(l => document.querySelector(l.getAttribute('href'))).filter(Boolean);
const navObserver = supportsIntersectionObserver ? new IntersectionObserver(entries => {
  if (isClickScrolling) return;
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const link = links.find(l => l.getAttribute('href') === '#' + entry.target.id);
      if (link) setActive(link);
    }
  });
}, { rootMargin: '-40% 0px -55% 0px' }) : null;
if (navObserver) sections.forEach(s => navObserver.observe(s));

window.addEventListener('scroll', () => {
  const y = window.scrollY;
  document.body.classList.toggle('scrolled', y > 30);
  if (backToTop) backToTop.classList.toggle('show', y > 600);
  const h = document.documentElement.scrollHeight - window.innerHeight;
  const p = h > 0 ? (y / h) * 100 : 0;
  if (headerProgressBar) headerProgressBar.style.width = p + '%';
}, { passive: true });

backToTop?.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
menuBtn?.addEventListener('click', () => {
  if (!header) return;
  const open = header.classList.toggle('mobile-open');
  menuBtn.classList.toggle('active', open);
  menuBtn.textContent = open ? '✕' : '☰';
  if (open && activeLink) setTimeout(() => movePillTo(activeLink), 50);
});
window.addEventListener('load', () => { if (activeLink) movePillTo(activeLink); });
window.addEventListener('resize', () => { if (activeLink) movePillTo(activeLink); });
setTimeout(() => { if (activeLink) movePillTo(activeLink); }, 100);

// ===== 5. الديمو - تجربة المتاجر (اذا موجودة بالصفحة) =====
const demos = {
  shop: { brand: 'أثر / ATHAR', nav: 'قطع مختارة. تفاصيل بتفرق.', kicker: 'مجموعة من التفاصيل اليومية', title: 'أشياء بسيطة.<br>حضور مختلف.', cta: 'اكتشف المجموعة ↖', foot: 'اختياراتك، بمكان واحد.', caption: 'THE EVERYDAY COLLECTION', description: 'مساحة تعطي المنتج حقّه، وتصنيف واضح يساعد الزبون يلاقي اللي بده إياه.' },
  cafe: { brand: 'بُن / BUN', nav: 'خذ وقتك. القهوة جاهزة.', kicker: 'مكانك المفضّل، أقرب إلك', title: 'مزاج حلو.<br>من أول رشفة.', cta: 'اكتشف القائمة ↖', foot: 'القائمة، المكان، وكل التفاصيل.', caption: 'BREWED FOR YOUR MOMENT', description: 'جوّ المكان يبدأ من الموقع: قائمة سهلة، شخصية واضحة، ومعلومات الزيارة والتواصل بمكانها.' },
  service: { brand: 'مدار / MADAR', nav: 'خبرة بتوضّح الطريق.', kicker: 'حلول مصمّمة لاحتياجك', title: 'خلّي خبرتك<br>تحكي عنك.', cta: 'تعرّف على خدماتنا ↖', foot: 'من أول سؤال، لخطوة واضحة.', caption: 'EXPERTISE. WITH DIRECTION.', description: 'قدّم خبرتك وخدماتك بلغة واضحة، وسهّل على الزائر يفهم كيف بتقدر تساعده ويتواصل معك.' }
};

const tabs = [...document.querySelectorAll('[role=tab]')];
let demoRevision = 0, demoAnimations = [];
const reduceMotion = motionPreference;
const motionAllowed = () => !document.body.classList.contains('motion-off') && !reduceMotion.matches;

function cancelDemoAnimations() { demoAnimations.forEach(a => { try { a.cancel(); } catch {} }); demoAnimations = []; }
function applyDemo(tab) {
  const d = demos[tab.dataset.demo];
  const panel = document.getElementById('demo');
  if (!d || !panel) return;
  panel.className = 'demo ' + tab.dataset.demo;
  panel.setAttribute('aria-labelledby', tab.id);
  const map = { 'demo-brand': d.brand, 'demo-nav-text': d.nav, 'demo-kicker': d.kicker, 'demo-cta': d.cta, 'demo-foot': d.foot, 'object-caption': d.caption, 'demo-explanation': d.description };
  for (const [id, value] of Object.entries(map)) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  }
  const title = document.getElementById('demo-title');
  if (title) title.innerHTML = d.title;
}

async function selectDemo(tab, focus = false) {
  if (focus) tab.focus();
  if (tab.getAttribute('aria-selected') === 'true') return;
  const previous = tabs.findIndex(t => t.getAttribute('aria-selected') === 'true');
  const direction = tabs.indexOf(tab) > previous ? 1 : -1;
  const revision = ++demoRevision;
  cancelDemoAnimations();
  tabs.forEach(t => { const chosen = t === tab; t.setAttribute('aria-selected', String(chosen)); t.tabIndex = chosen ? 0 : -1; });
  const panel = document.getElementById('demo');
  if (!panel) return;
  const object = panel.querySelector('.demo-object');
  const copy = panel.querySelector('.demo-content > div:first-child');
  const description = document.getElementById('demo-explanation');
  if (!motionAllowed()) { applyDemo(tab); return; }
  const animate = (el, frames, options) => {
    if (!el || typeof el.animate !== 'function') return null;
    try { const animation = el.animate(frames, options); demoAnimations.push(animation); return animation; }
    catch { return null; }
  };
  const exits = [
    animate(object, [{ opacity: 1, translate: '0 0', rotate: '0deg' }, { opacity: 0, translate: `${-direction * 35}px 12px`, rotate: `${-direction * 6}deg` }], { duration: 180, easing: 'ease-in', fill: 'forwards' }),
    animate(copy, [{ opacity: 1, translate: '0 0' }, { opacity: 0, translate: `${-direction * 18}px -8px` }], { duration: 150, easing: 'ease-in', fill: 'forwards' })
  ].filter(Boolean);
  await Promise.all(exits.map(a => Promise.resolve(a.finished).catch(() => undefined)));
  if (revision !== demoRevision) return;
  cancelDemoAnimations(); applyDemo(tab);
  if (!motionAllowed()) return;
  const ease = 'cubic-bezier(.16,1,.3,1)';
  animate(object, [{ opacity: 0, translate: `${direction * 55}px 18px`, rotate: `${direction * 8}deg`, scale: '.88' }, { opacity: 1, translate: '0 0', rotate: '0deg', scale: '1' }], { duration: 700, easing: ease });
  if (copy) [...copy.children].forEach((el, i) => animate(el, [{ opacity: 0, translate: '0 18px' }, { opacity: 1, translate: '0 0' }], { duration: 500, delay: 45 + i * 65, easing: ease, fill: 'backwards' }));
  animate(description, [{ opacity: 0, translate: '0 8px' }, { opacity: 1, translate: '0 0' }], { duration: 400, easing: ease });
  animate(panel.querySelector('.demo-nav'), [{ opacity: .25 }, { opacity: 1 }], { duration: 500 });
  animate(panel.querySelector('.demo-foot'), [{ opacity: 0 }, { opacity: 1 }], { duration: 550 });
}

tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectDemo(tab));
  tab.addEventListener('keydown', event => {
    let next;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowDown') next = (index + 1) % tabs.length;
    if (event.key === 'ArrowRight' || event.key === 'ArrowUp') next = (index - 1 + tabs.length) % tabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = tabs.length - 1;
    if (next !== undefined) { event.preventDefault(); selectDemo(tabs[next], true); }
  });
});

// ===== 6. الفورم - بيروح واتساب برسالة جاهزة =====
const briefForm = document.getElementById('brief-form');
briefForm?.addEventListener('submit', event => {
  event.preventDefault();
  try {
    const data = new FormData(event.currentTarget);
    const name = (data.get('name') || '').toString().trim();
    const type = data.get('type') || '';
    const brief = (data.get('brief') || '').toString().trim();

    const message =
`مرحبا Linky! 👋
أنا: ${name}
بدي: ${type}
عن مشروعي: ${brief}

شفت موقعكم وبدي موقع زي شغلكم.`;

    const url = 'https://wa.me/962777171753?text=' + encodeURIComponent(message);
    const opened = window.open(url, '_blank');
    if (opened) opened.opener = null;
    else window.location.href = url;
  } catch (error) {
    console.error('تعذر تجهيز طلب واتساب:', error);
    window.location.href = 'https://wa.me/962777171753';
  }
});

// ===== 7. كروت الخدمات - بتعبّي الفورم لحالها =====
document.querySelectorAll('[data-request]').forEach(link => {
  link.addEventListener('click', event => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button > 0) return;
    const typeSelect = document.getElementById('type');
    const nameInput = document.getElementById('name');
    if (typeSelect) {
      // نطابق النص مع الخيارات الموجودة
      const wanted = link.dataset.request;
      const opt = [...typeSelect.options].find(o => o.text.includes(wanted) || wanted.includes(o.text));
      if (opt) typeSelect.value = opt.value || opt.text;
      else typeSelect.value = wanted;
    }
    // نأخر الفوكس شوي عشان السكرول يخلص
    setTimeout(() => nameInput?.focus({ preventScroll: true }), 600);
  });
});

// ===== 8. زر إيقاف الحركة + سنة الفوتر =====
const motionButton = document.getElementById('motion-toggle');
let stopped = reduceMotion.matches;

function applyMotion() {
  if (stopped) {
    ++demoRevision;
    cancelDemoAnimations();
    const selected = tabs.find(t => t.getAttribute('aria-selected') === 'true');
    if (selected) applyDemo(selected);
  }
  document.body.classList.toggle('motion-off', stopped);
  if (motionButton) {
    motionButton.setAttribute('aria-pressed', String(stopped));
    motionButton.textContent = stopped ? 'تشغيل الحركة ◌' : 'إيقاف الحركة ◌';
  }
}
applyMotion();
motionButton?.addEventListener('click', () => { stopped = !stopped; applyMotion(); });

const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

const handleMotionPreference = event => {
  if (event.matches) { stopped = true; applyMotion(); }
};
if (typeof reduceMotion.addEventListener === 'function') reduceMotion.addEventListener('change', handleMotionPreference);
else if (typeof reduceMotion.addListener === 'function') reduceMotion.addListener(handleMotionPreference);

// ===== 9. الأسئلة - أنيميشن خفيف عند الفتح =====
document.querySelectorAll('details').forEach(detail => {
  detail.addEventListener('toggle', () => {
    if (detail.open && motionAllowed()) {
      const p = detail.querySelector('p');
      if (p && typeof p.animate === 'function') {
        try { p.animate([{ opacity: 0, translate: '0 -8px' }, { opacity: 1, translate: '0 0' }], { duration: 320, easing: 'ease-out' }); }
        catch { /* تجاهل تعذر الحركة مع إبقاء الإجابة ظاهرة */ }
      }
    }
  });
});

// ===== 10. لمعان الزجاج يتبع حركة الماوس =====
const liquidGlassSelector = '.header-luxe, .service-row, .work-card, .review-card, .price-card, .steps article, .faq-list details, .faq-cta, .st-card, #brief-form, .ba-card, .contact, .statement-cta, .header-luxe .nav-cta, .hero .button.lime, #brief-form .button.lime, .price-btn, .sticky-cta a, .footer-socials a, .wa-btn, .instagram-btn';
const mouseTiltSelector = '.review-card, .statement-cta, .faq-list details, .faq-cta';
const activeTouchGlass = new Map();
const activeTouchEvents = new Map();

function updateLiquidGlass(surface, event) {
  const rect = surface.getBoundingClientRect();
  const x = Math.max(0, Math.min(100, ((event.clientX - rect.left) / rect.width) * 100));
  const y = Math.max(0, Math.min(100, ((event.clientY - rect.top) / rect.height) * 100));
  surface.style.setProperty('--glass-x', `${x}%`);
  surface.style.setProperty('--glass-y', `${y}%`);
  if (surface.matches(mouseTiltSelector)) {
    surface.style.setProperty('--glass-tilt-x', `${((50 - y) / 50) * 3.5}deg`);
    surface.style.setProperty('--glass-tilt-y', `${((x - 50) / 50) * 3.5}deg`);
  }
  surface.classList.add('glass-active');
}

function resetLiquidGlass(surface) {
  surface.classList.remove('glass-active');
  surface.style.setProperty('--glass-x', '50%');
  surface.style.setProperty('--glass-y', '50%');
  surface.style.setProperty('--glass-tilt-x', '0deg');
  surface.style.setProperty('--glass-tilt-y', '0deg');
}

document.addEventListener('pointerdown', event => {
  if (event.pointerType !== 'touch') return;
  const surface = event.target.closest?.(liquidGlassSelector);
  if (!surface) return;
  activeTouchGlass.set(event.pointerId, surface);
  updateLiquidGlass(surface, event);
}, { passive: true });

document.addEventListener('pointermove', event => {
  const surface = event.pointerType === 'mouse'
    ? event.target.closest?.(liquidGlassSelector)
    : event.pointerType === 'touch'
      ? activeTouchGlass.get(event.pointerId)
      : null;
  if (!surface) return;
  updateLiquidGlass(surface, event);
}, { passive: true });

document.addEventListener('pointerout', event => {
  if (event.pointerType !== 'mouse') return;
  const surface = event.target.closest?.(liquidGlassSelector);
  if (!surface || surface.contains(event.relatedTarget)) return;
  resetLiquidGlass(surface);
}, { passive: true });

function finishTouchGlass(event) {
  const surface = activeTouchGlass.get(event.pointerId);
  if (!surface) return;
  activeTouchGlass.delete(event.pointerId);
  setTimeout(() => {
    if (![...activeTouchGlass.values()].includes(surface) && ![...activeTouchEvents.values()].includes(surface) && !surface.matches(':active')) resetLiquidGlass(surface);
  }, 220);
}
document.addEventListener('pointerup', finishTouchGlass, { passive: true });
document.addEventListener('pointercancel', finishTouchGlass, { passive: true });

// Fallback for touch browsers that cancel pointer movement while scrolling.
document.addEventListener('touchstart', event => {
  const surface = event.target.closest?.(liquidGlassSelector);
  if (!surface) return;
  [...event.changedTouches].forEach(touch => {
    activeTouchEvents.set(touch.identifier, surface);
    updateLiquidGlass(surface, touch);
  });
}, { passive: true });
document.addEventListener('touchmove', event => {
  [...event.changedTouches].forEach(touch => {
    const surface = activeTouchEvents.get(touch.identifier);
    if (surface) updateLiquidGlass(surface, touch);
  });
}, { passive: true });
function finishTouchEvents(event) {
  [...event.changedTouches].forEach(touch => {
    const surface = activeTouchEvents.get(touch.identifier);
    if (!surface) return;
    activeTouchEvents.delete(touch.identifier);
    setTimeout(() => {
      if (![...activeTouchEvents.values()].includes(surface) && ![...activeTouchGlass.values()].includes(surface) && !surface.matches(':active')) resetLiquidGlass(surface);
    }, 220);
  });
}
document.addEventListener('touchend', finishTouchEvents, { passive: true });
document.addEventListener('touchcancel', finishTouchEvents, { passive: true });
