
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

  function setLanguage(language) {
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
  }

  languageButtons.forEach(button => button.addEventListener('click', () => setLanguage(button.dataset.language)));

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

  // Invert floating controls automatically whenever they sit over a light surface.
  function syncFloatingTheme() {
    floatingControls.forEach(control => {
      const r = control.getBoundingClientRect();
      const x = Math.min(window.innerWidth - 1, Math.max(0, r.left + r.width / 2));
      const y = Math.min(window.innerHeight - 1, Math.max(0, r.top + r.height / 2));
      control.style.pointerEvents = 'none';
      const under = document.elementFromPoint(x, y);
      control.style.pointerEvents = '';
      const surface = under?.closest?.('[data-surface]');
      control.classList.toggle('on-light', surface?.dataset.surface === 'light');
    });
  }
  window.addEventListener('scroll', syncFloatingTheme, {passive:true});
  window.addEventListener('resize', syncFloatingTheme);

  setLanguage(activeLanguage);
  requestAnimationFrame(syncFloatingTheme);
})();
