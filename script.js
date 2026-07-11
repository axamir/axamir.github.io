(() => {
  'use strict';

  const root = document.documentElement;
  const body = document.body;
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

  // Language system
  const translatable = [...document.querySelectorAll('[data-en][data-fa]')];
  const languageToggle = document.querySelector('[data-language-toggle]');
  const languageOptions = [...document.querySelectorAll('[data-lang-option]')];

  function setLanguage(lang) {
    const next = lang === 'fa' ? 'fa' : 'en';
    root.lang = next;
    root.dir = next === 'fa' ? 'rtl' : 'ltr';
    body.classList.toggle('lang-fa', next === 'fa');
    translatable.forEach((node) => {
      node.textContent = node.dataset[next];
    });
    document.querySelectorAll('[data-placeholder-en][data-placeholder-fa]').forEach((node) => {
      node.placeholder = node.dataset[`placeholder${next === 'fa' ? 'Fa' : 'En'}`];
    });
    languageOptions.forEach((item) => item.classList.toggle('active', item.dataset.langOption === next));
    languageToggle?.setAttribute('aria-label', next === 'fa' ? 'Switch to English' : 'تغییر زبان به فارسی');
    document.title = next === 'fa'
      ? 'امیر احمدی — سیستم‌های انسان و هوش مصنوعی و آرشیوهای قابل‌راستی‌آزمایی'
      : 'Amir Ahmadi — Human–AI Systems & Verifiable Archives';
    try { localStorage.setItem('axamir-language', next); } catch (_) {}
  }

  let storedLanguage = null;
  try { storedLanguage = localStorage.getItem('axamir-language'); } catch (_) {}
  const initialLanguage = storedLanguage || (navigator.language?.toLowerCase().startsWith('fa') ? 'fa' : 'en');
  setLanguage(initialLanguage);
  languageToggle?.addEventListener('click', () => setLanguage(root.lang === 'fa' ? 'en' : 'fa'));

  // Mobile navigation
  const menuButton = document.querySelector('[data-menu-button]');
  const mobileMenu = document.querySelector('[data-mobile-menu]');
  function toggleMenu(open) {
    menuButton?.setAttribute('aria-expanded', String(open));
    mobileMenu?.classList.toggle('open', open);
    mobileMenu?.setAttribute('aria-hidden', String(!open));
    body.style.overflow = open ? 'hidden' : '';
  }
  menuButton?.addEventListener('click', () => toggleMenu(menuButton.getAttribute('aria-expanded') !== 'true'));
  mobileMenu?.querySelectorAll('a').forEach((link) => link.addEventListener('click', () => toggleMenu(false)));
  window.addEventListener('keydown', (event) => { if (event.key === 'Escape') toggleMenu(false); });

  // Reveal choreography
  const revealItems = [...document.querySelectorAll('.reveal')];
  if ('IntersectionObserver' in window && !prefersReducedMotion) {
    const revealObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    revealItems.forEach((item) => revealObserver.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add('is-visible'));
  }

  // Active chapter, header, progress, and scroll-linked variables
  const header = document.querySelector('[data-header]');
  const progressBar = document.querySelector('.page-progress span');
  const railProgress = document.querySelector('.rail-line i');
  const hero = document.querySelector('.hero');
  const timeline = document.querySelector('[data-timeline]');
  const sections = [...document.querySelectorAll('[data-section]')];
  const navLinks = [...document.querySelectorAll('.desktop-nav a, .chapter-rail a')];
  let lastScroll = window.scrollY;
  let scheduled = false;

  function updateScrollState() {
    const scrollY = window.scrollY;
    const pageMax = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    const pageProgress = clamp(scrollY / pageMax);
    progressBar.style.transform = `scaleX(${pageProgress})`;
    railProgress.style.height = `${pageProgress * 100}%`;

    header.classList.toggle('scrolled', scrollY > 32);
    header.classList.toggle('hidden', scrollY > 450 && scrollY > lastScroll + 4 && !mobileMenu?.classList.contains('open'));

    if (hero) {
      const heroMax = Math.max(1, hero.offsetHeight - window.innerHeight);
      root.style.setProperty('--hero-progress', clamp((scrollY - hero.offsetTop) / heroMax).toFixed(3));
    }

    if (timeline) {
      const rect = timeline.getBoundingClientRect();
      const timelineProgress = clamp((window.innerHeight * .72 - rect.top) / Math.max(1, rect.height));
      timeline.style.setProperty('--timeline-progress', timelineProgress.toFixed(3));
    }

    let active = sections[0]?.id;
    const marker = window.innerHeight * .46;
    sections.forEach((section) => {
      if (section.getBoundingClientRect().top <= marker) active = section.id;
    });
    navLinks.forEach((link) => link.classList.toggle('active', link.getAttribute('href') === `#${active}`));

    lastScroll = scrollY;
    scheduled = false;
  }

  window.addEventListener('scroll', () => {
    if (!scheduled) {
      scheduled = true;
      requestAnimationFrame(updateScrollState);
    }
  }, { passive: true });
  window.addEventListener('resize', updateScrollState, { passive: true });
  updateScrollState();

  // Count-up metrics
  const counters = [...document.querySelectorAll('[data-count]')];
  function animateCount(node) {
    const target = Number(node.dataset.count);
    const start = performance.now();
    const duration = 1200;
    const tick = (now) => {
      const progress = clamp((now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      node.textContent = String(Math.round(target * eased)).padStart(target > 9 ? 2 : 1, '0');
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }
  if ('IntersectionObserver' in window) {
    const countObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        animateCount(entry.target);
        observer.unobserve(entry.target);
      });
    }, { threshold: .6 });
    counters.forEach((counter) => countObserver.observe(counter));
  } else {
    counters.forEach((counter) => { counter.textContent = counter.dataset.count; });
  }

  // Copy-only WhatsApp username until a canonical public URL is supplied
  const toast = document.querySelector('[data-toast]');
  let toastTimer;
  document.querySelectorAll('[data-copy]').forEach((button) => {
    button.addEventListener('click', async () => {
      const value = button.dataset.copy;
      try { await navigator.clipboard.writeText(value); }
      catch (_) {
        const input = document.createElement('textarea');
        input.value = value;
        body.appendChild(input);
        input.select();
        document.execCommand('copy');
        input.remove();
      }
      toast?.classList.add('show');
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => toast?.classList.remove('show'), 2200);
    });
  });
  document.querySelectorAll('[data-year]').forEach((node) => { node.textContent = new Date().getFullYear(); });

  // Professional request pathway. Formspree records the request and sends Amir an
  // email notification; direct channel links remain available as optional follow-up.
  const requestCards = [...document.querySelectorAll('[data-request-type]')];
  const requestForm = document.querySelector('[data-request-form]');
  const requestSelect = document.querySelector('[data-request-select]');
  const requestResult = document.querySelector('[data-request-result]');
  const requestError = document.querySelector('[data-request-error]');
  const requestCopy = document.querySelector('[data-request-copy]');
  const requestSubmit = document.querySelector('[data-submit-request]');
  let preparedRequest = '';

  function selectRequestType(value, scrollToForm = false) {
    if (requestSelect) requestSelect.value = value;
    requestCards.forEach((card) => {
      const active = card.dataset.requestType === value;
      card.classList.toggle('active', active);
      card.setAttribute('aria-pressed', String(active));
    });
    if (scrollToForm) {
      document.querySelector('#request-form')?.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'center' });
      window.setTimeout(() => requestForm?.querySelector('input')?.focus({ preventScroll: true }), prefersReducedMotion ? 0 : 550);
    }
  }

  requestCards.forEach((card) => card.addEventListener('click', () => selectRequestType(card.dataset.requestType, true)));
  requestSelect?.addEventListener('change', () => selectRequestType(requestSelect.value));

  async function copyPreparedRequest() {
    if (!preparedRequest) return;
    try { await navigator.clipboard.writeText(preparedRequest); }
    catch (_) {
      const input = document.createElement('textarea');
      input.value = preparedRequest;
      body.appendChild(input);
      input.select();
      document.execCommand('copy');
      input.remove();
    }
  }

  requestCopy?.addEventListener('click', copyPreparedRequest);
  requestForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!requestForm.reportValidity()) return;
    const data = new FormData(requestForm);
    const labels = root.lang === 'fa'
      ? { title: 'درخواست همکاری جدید', name: 'نام', email: 'ایمیل', type: 'نوع درخواست', problem: 'مسئله', outcome: 'نتیجه موردنظر', timeline: 'زمان‌بندی', budget: 'بودجه تقریبی', link: 'لینک مرتبط' }
      : { title: 'New professional request', name: 'Name', email: 'Email', type: 'Request type', problem: 'Problem / context', outcome: 'Desired outcome', timeline: 'Timeline', budget: 'Indicative budget', link: 'Relevant link' };
    preparedRequest = [
      labels.title,
      '—',
      `${labels.name}: ${data.get('name')}`,
      `${labels.email}: ${data.get('email')}`,
      `${labels.type}: ${data.get('type')}`,
      `${labels.timeline}: ${data.get('timeline')}`,
      `${labels.budget}: ${data.get('budget')}`,
      `${labels.link}: ${data.get('link') || '—'}`,
      '',
      `${labels.problem}:`,
      data.get('problem'),
      '',
      `${labels.outcome}:`,
      data.get('outcome')
    ].join('\n');
    const subject = `${labels.title} — ${data.get('type')} — ${data.get('name')}`;
    data.append('_subject', subject);
    data.append('language', root.lang);

    const telegramUrl = `https://t.me/go2fragment?text=${encodeURIComponent(preparedRequest)}`;
    const whatsappUrl = `https://wa.me/989392616116?text=${encodeURIComponent(preparedRequest)}`;
    const emailUrl = `mailto:starship.amir@gmail.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(preparedRequest)}`;
    document.querySelectorAll('[data-request-telegram]').forEach((link) => { link.href = telegramUrl; });
    document.querySelectorAll('[data-request-whatsapp]').forEach((link) => { link.href = whatsappUrl; });
    document.querySelectorAll('[data-request-email]').forEach((link) => { link.href = emailUrl; });

    if (requestResult) requestResult.hidden = true;
    if (requestError) requestError.hidden = true;
    if (requestSubmit) {
      requestSubmit.disabled = true;
      const label = requestSubmit.querySelector('span');
      if (label) label.textContent = root.lang === 'fa' ? 'در حال ارسال…' : 'Sending…';
    }

    try {
      const response = await fetch(requestForm.action, {
        method: 'POST',
        body: data,
        headers: { Accept: 'application/json' }
      });
      if (!response.ok) throw new Error(`Formspree request failed: ${response.status}`);
      await copyPreparedRequest();
      if (requestResult) requestResult.hidden = false;
      requestResult?.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'center' });
    } catch (_) {
      if (requestError) requestError.hidden = false;
    } finally {
      if (requestSubmit) {
        requestSubmit.disabled = false;
        const label = requestSubmit.querySelector('span');
        if (label) label.textContent = label.dataset[root.lang];
      }
    }
  });

  // Subtle card depth on fine pointers
  if (window.matchMedia('(pointer: fine)').matches && !prefersReducedMotion) {
    document.querySelectorAll('.project-card--hero').forEach((card) => {
      card.addEventListener('pointermove', (event) => {
        const rect = card.getBoundingClientRect();
        const x = (event.clientX - rect.left) / rect.width - .5;
        const y = (event.clientY - rect.top) / rect.height - .5;
        card.style.transform = `perspective(1200px) rotateX(${-y * 1.5}deg) rotateY(${x * 1.5}deg) translateY(-4px)`;
      });
      card.addEventListener('pointerleave', () => { card.style.transform = ''; });
    });
  }

  // Signal field canvas
  const canvas = document.getElementById('signal-canvas');
  if (!canvas || prefersReducedMotion) return;
  const context = canvas.getContext('2d', { alpha: true });
  const pointer = { x: .5, y: .5 };
  let particles = [];
  let width = 0;
  let height = 0;
  let dpr = 1;

  function resizeCanvas() {
    dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    const count = width < 720 ? 30 : Math.min(70, Math.round(width / 22));
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - .5) * .12,
      vy: (Math.random() - .5) * .12,
      r: Math.random() * 1.15 + .35,
      a: Math.random() * .45 + .08
    }));
  }

  window.addEventListener('pointermove', (event) => {
    pointer.x = event.clientX / width;
    pointer.y = event.clientY / height;
  }, { passive: true });
  window.addEventListener('resize', resizeCanvas, { passive: true });
  resizeCanvas();

  function drawSignal(time) {
    context.clearRect(0, 0, width, height);
    const driftX = (pointer.x - .5) * 8;
    const driftY = (pointer.y - .5) * 8;

    particles.forEach((particle, index) => {
      particle.x += particle.vx;
      particle.y += particle.vy;
      if (particle.x < -20) particle.x = width + 20;
      if (particle.x > width + 20) particle.x = -20;
      if (particle.y < -20) particle.y = height + 20;
      if (particle.y > height + 20) particle.y = -20;
      const x = particle.x + driftX * (particle.r / 2);
      const y = particle.y + driftY * (particle.r / 2);

      context.beginPath();
      context.arc(x, y, particle.r, 0, Math.PI * 2);
      context.fillStyle = `rgba(173,193,255,${particle.a})`;
      context.fill();

      for (let j = index + 1; j < particles.length; j += 1) {
        const other = particles[j];
        const dx = particle.x - other.x;
        const dy = particle.y - other.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        if (distance < 105) {
          context.beginPath();
          context.moveTo(x, y);
          context.lineTo(other.x + driftX * (other.r / 2), other.y + driftY * (other.r / 2));
          context.strokeStyle = `rgba(95,140,255,${(1 - distance / 105) * .075})`;
          context.lineWidth = .6;
          context.stroke();
        }
      }
    });

    const pulse = (Math.sin(time * .0007) + 1) / 2;
    const gradient = context.createRadialGradient(width * .68, height * .42, 0, width * .68, height * .42, 160 + pulse * 70);
    gradient.addColorStop(0, `rgba(95,140,255,${.035 + pulse * .025})`);
    gradient.addColorStop(1, 'rgba(95,140,255,0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);
    requestAnimationFrame(drawSignal);
  }
  requestAnimationFrame(drawSignal);
})();
