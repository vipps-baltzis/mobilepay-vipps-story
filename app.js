(() => {
  const languageButtons = [...document.querySelectorAll('.language-button')];
  const languageVersions = [...document.querySelectorAll('[data-language-version]')];
  const brandChangeText = document.querySelector('.brand-change-text');
  const heroTitle = document.querySelector('.hero-title');
  const floatingControls = [...document.querySelectorAll('.language-toggle, .site-nav')];

  let activeLanguage = localStorage.getItem('core-story-language') || 'da';
  if (!['da','en','fi'].includes(activeLanguage)) activeLanguage = 'da';

  function translateStatic(language) {
    document.querySelectorAll(`[data-${language}]`).forEach(el => {
      const value = el.dataset[language];
      if (value != null) el.textContent = value;
    });
  }

const pageTitles = {
  story: {
    da: 'MobilePay skifter navn til Vipps',
    en: 'MobilePay is changing its name to Vipps',
    fi: 'MobilePay vaihtaa nimekseen Vipps'
  },
  faq: {
    da: 'FAQ – MobilePay skifter navn til Vipps',
    en: 'FAQ – MobilePay is changing its name to Vipps',
    fi: 'FAQ – MobilePay vaihtaa nimekseen Vipps'
  }
};

  function renderFAQ(language) {
    const root = document.getElementById('faq-root');
    if (!root || !window.FAQ_DATA) return;
    root.innerHTML = '';

    let section = null;
    window.FAQ_DATA.forEach(item => {
      const [n, enQ, enA, daQ, daA, fiQ, fiA] = item;
      if (n === 1) {
        section = document.createElement('div');
        section.className = 'faq-list';
        root.appendChild(section);
      }
      if (n === 36) {
        const title = document.createElement('h2');
        title.className = 'faq-section-title';
        title.textContent = language === 'da' ? 'Spørgsmål fra kundeservice' : language === 'fi' ? 'Asiakaspalvelun kysymykset' : 'Questions from customer support';
        root.appendChild(title);
        section = document.createElement('div');
        section.className = 'faq-list';
        root.appendChild(section);
      }
      const q = language === 'da' ? daQ : language === 'fi' ? fiQ : enQ;
      const a = language === 'da' ? daA : language === 'fi' ? fiA : enA;
      const details = document.createElement('details');
      details.className = 'faq-item';
      const summary = document.createElement('summary');
      summary.className = 'faq-question';
      summary.innerHTML = `<span class="faq-number">${n}</span><span>${escapeHTML(q)}</span><span class="faq-plus" aria-hidden="true"></span>`;
      const answer = document.createElement('div');
      answer.className = 'faq-answer';
      a.split(/\n\n+/).forEach(paragraph => {
        const p = document.createElement('p');
        p.textContent = paragraph;
        answer.appendChild(p);
      });
      details.append(summary, answer);
      section.appendChild(details);
    });
  }

  function escapeHTML(value) {
    return value.replace(/[&<>'"]/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#039;','"':'&quot;'}[ch]));
  }

  function applyLanguage(language) {
    activeLanguage = language;
    localStorage.setItem('core-story-language', language);
    document.documentElement.lang = language;

    languageVersions.forEach(v => { v.hidden = v.dataset.languageVersion !== language; });
    languageButtons.forEach(button => {
      const active = button.dataset.language === language;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', String(active));
    });
    if (brandChangeText?.dataset[language]) brandChangeText.textContent = brandChangeText.dataset[language];
    if (heroTitle?.dataset[language]) heroTitle.textContent = heroTitle.dataset[language];
    translateStatic(language);
    renderFAQ(language);
    
    const currentPage =
  document.body.dataset.page === 'faq' ||
  document.body.classList.contains('faq-page')
    ? 'faq'
    : 'story';

document.title = pageTitles[currentPage][language];
  }

  function setLanguage(language, { animate = true } = {}) {
    if (!['da','en','fi'].includes(language)) return;

    // No need to animate when the selected language is already active.
    if (language === activeLanguage && animate) return;

    const target = document.querySelector('.content, .faq-shell');
    const canAnimate =
      animate &&
      target &&
      typeof document.startViewTransition === 'function' &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!canAnimate) {
      applyLanguage(language);
      requestAnimationFrame(syncFloatingTheme);
      return;
    }

    // Give only the changing content a named transition. The nav and
    // language picker remain ordinary fixed elements and stay rock solid.
    target.classList.add('language-transition-target');

    const transition = document.startViewTransition(() => {
      applyLanguage(language);
    });

    transition.finished.finally(() => {
      target.classList.remove('language-transition-target');
      syncFloatingTheme();
    });
  }

  languageButtons.forEach(button => button.addEventListener('click', () => {
    setLanguage(button.dataset.language);
  }));

  // Story tooltip behaviour, only on the story page.
  const tooltip = document.getElementById('tooltip');
  if (tooltip) {
    const tooltipTitle = tooltip.querySelector('h2');
    const tooltipText = tooltip.querySelector('p');
    const tooltipClose = tooltip.querySelector('.tooltip-close');
    const terms = [...document.querySelectorAll('.term')];
    let activeTerm = null;
    let closeTimer = null;

    function positionTooltip(target) {
      if (window.matchMedia('(max-width: 600px)').matches) {
        tooltip.style.left = '50%'; tooltip.style.top = '50%'; return;
      }
      const rect = target.getBoundingClientRect();
      const w = tooltip.offsetWidth || 320, h = tooltip.offsetHeight || 230, padding = 20, gap = 28;
      let left = rect.right + gap;
      let top = rect.top + rect.height / 2 - h / 2;
      if (left + w > window.innerWidth - padding) left = rect.left - w - gap;
      if (left < padding) left = (window.innerWidth - w) / 2;
      top = Math.max(padding, Math.min(top, window.innerHeight - h - padding));
      tooltip.style.left = `${left}px`; tooltip.style.top = `${top}px`;
    }
    function openTooltip(target) {
      clearTimeout(closeTimer); activeTerm = target;
      tooltipTitle.textContent = target.dataset.title; tooltipText.textContent = target.dataset.explanation;
      tooltip.classList.add('is-open'); tooltip.setAttribute('aria-hidden','false');
      requestAnimationFrame(() => positionTooltip(target));
    }
    function closeTooltip() {
      clearTimeout(closeTimer); tooltip.classList.remove('is-open'); tooltip.setAttribute('aria-hidden','true'); activeTerm = null;
    }
    function scheduleClose() { clearTimeout(closeTimer); closeTimer = setTimeout(closeTooltip,130); }
    terms.forEach(term => {
      term.addEventListener('mouseenter', () => openTooltip(term)); term.addEventListener('mouseleave', scheduleClose);
      term.addEventListener('focus', () => openTooltip(term)); term.addEventListener('blur', scheduleClose);
      term.addEventListener('click', e => { e.stopPropagation(); openTooltip(term); });
    });
    tooltip.addEventListener('mouseenter', () => clearTimeout(closeTimer)); tooltip.addEventListener('mouseleave', scheduleClose);
    tooltipClose.addEventListener('click', e => { e.stopPropagation(); closeTooltip(); });
    document.addEventListener('click', e => { if (!tooltip.contains(e.target) && !e.target.closest('.term')) closeTooltip(); });
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeTooltip(); });
    window.addEventListener('resize', () => { if (activeTerm) positionTooltip(activeTerm); });
    window.addEventListener('scroll', () => { if (activeTerm) positionTooltip(activeTerm); }, {passive:true});
  }

  // Invert floating controls based on known page/section geometry.
  // Avoid elementFromPoint(): View Transition snapshots can temporarily sit
  // above the real DOM and make that kind of paint-based detection unreliable.
  function syncFloatingTheme() {
    const isFAQ =
      document.body.dataset.page === 'faq' ||
      document.body.classList.contains('faq-page');

    if (isFAQ) {
      floatingControls.forEach(control => control.classList.add('on-light'));
      return;
    }

    const lightSurfaces = [...document.querySelectorAll('[data-surface="light"]')];

    floatingControls.forEach(control => {
      const controlRect = control.getBoundingClientRect();
      const controlY = controlRect.top + controlRect.height / 2;

      const isOverLightSurface = lightSurfaces.some(surface => {
        const surfaceRect = surface.getBoundingClientRect();
        return controlY >= surfaceRect.top && controlY <= surfaceRect.bottom;
      });

      control.classList.toggle('on-light', isOverLightSurface);
    });
  }

  window.addEventListener('scroll', syncFloatingTheme, {passive:true});
  window.addEventListener('resize', syncFloatingTheme);
  window.addEventListener('pageshow', () => {
    requestAnimationFrame(syncFloatingTheme);
  });
  window.addEventListener('pagereveal', () => {
    requestAnimationFrame(() => requestAnimationFrame(syncFloatingTheme));
  });

  setLanguage(activeLanguage, { animate: false });
  requestAnimationFrame(syncFloatingTheme);
})();