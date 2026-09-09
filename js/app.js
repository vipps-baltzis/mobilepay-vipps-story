(() => {
  const languageButtons = [...document.querySelectorAll('.language-button')];
  const languageVersions = [...document.querySelectorAll('[data-language-version]')];
  const brandChangeText = document.querySelector('.brand-change-text');
  const heroTitle = document.querySelector('.hero-title');
  const tldrButton = document.querySelector('.tldr-toggle');
  const tldrView = document.querySelector('.tldr-view');
  const floatingControls = [...document.querySelectorAll('.language-toggle, .site-nav, .tldr-toggle')];
  const themeToggle = document.querySelector('.theme-toggle');

  let activeLanguage = localStorage.getItem('core-story-language') || 'da';
  let tldrActive = false;
  let invertedTheme = localStorage.getItem('core-story-inverted-theme') === 'true';
  if (!['da','en','fi'].includes(activeLanguage)) activeLanguage = 'da';

  function translateStatic(language) {
    document.querySelectorAll(`[data-${language}]`).forEach(el => {
      const value = el.dataset[language];
      if (value != null) el.textContent = value;
    });
  }

  const tldrLabels = {
    da: {
      short: 'Giv mig den korte version',
      full: 'Hele historien',
      shortLabel: 'Giv mig den korte version',
      fullLabel: 'Vis hele historien'
    },
    en: {
      short: 'Give me the short version',
      full: 'Full story',
      shortLabel: 'Give me the short version',
      fullLabel: 'Show the full story'
    },
    fi: {
      short: 'Näytä lyhyt versio',
      full: 'Koko tarina',
      shortLabel: 'Näytä lyhyt versio',
      fullLabel: 'Näytä koko tarina'
    }
  };

  const pageTitles = {
    story: {
      da: 'Hvorfor MobilePay skifter navn til Vipps den 12. januar',
      en: 'Why MobilePay is changing its name to Vipps on the 12th of January',
      fi: 'Miksi MobilePay vaihtaa nimekseen Vipps 12. tammikuuta'
    },
    faq: {
      da: 'FAQ | MobilePay skifter navn til Vipps',
      en: 'FAQ | MobilePay is changing its name to Vipps',
      fi: 'FAQ | MobilePay vaihtaa nimekseen Vipps'
    }
  };

  function renderFAQ(language) {
    const root = document.getElementById('faq-root');
    if (!root || !window.FAQ_DATA) return;
    root.replaceChildren();

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
        title.textContent =
          language === 'da'
            ? 'Hvis du har en butik'
            : language === 'fi'
              ? 'Asiakaspalvelun kysymykset'
              : 'Questions from customer support';

        root.appendChild(title);

        section = document.createElement('div');
        section.className = 'faq-list faq-list--support';
        root.appendChild(section);
      }

      const q =
        language === 'da'
          ? daQ
          : language === 'fi'
            ? fiQ
            : enQ;

      const a =
        language === 'da'
          ? daA
          : language === 'fi'
            ? fiA
            : enA;

      const details = document.createElement('details');
      details.className = 'faq-item';

      const summary = document.createElement('summary');
      summary.className = 'faq-question';

      const number = document.createElement('span');
      number.className = 'faq-number';
      number.textContent = String(n);

      const questionText = document.createElement('span');
      questionText.textContent = q;

      const plus = document.createElement('span');
      plus.className = 'faq-plus';
      plus.setAttribute('aria-hidden', 'true');

      summary.append(number, questionText, plus);

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

  function syncStoryMode() {
    if (!tldrButton || !tldrView) return;

    heroTitle.hidden = tldrActive;
    tldrView.hidden = !tldrActive;

    languageVersions.forEach(version => {
      version.hidden =
        tldrActive ||
        version.dataset.languageVersion !== activeLanguage;
    });

    const labels = tldrLabels[activeLanguage] || tldrLabels.en;

    tldrButton.textContent = tldrActive ? labels.full : labels.short;
    tldrButton.classList.toggle('is-active', tldrActive);
    tldrButton.setAttribute('aria-pressed', String(tldrActive));
    tldrButton.setAttribute(
      'aria-label',
      tldrActive ? labels.fullLabel : labels.shortLabel
    );
  }

  let stateTransitionTimeline = null;

  function animateStateChange(update, { animate = true } = {}) {
    const target = document.querySelector('.content, .faq-shell');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const canAnimate =
      animate &&
      target &&
      typeof window.gsap !== 'undefined' &&
      !reduced;

    if (!canAnimate) {
      update();
      requestAnimationFrame(syncFloatingTheme);
      return;
    }

    // One state animation at a time. Killing the previous timeline prevents
    // rapid language/TLDR clicks from stacking transforms and opacity tweens.
    if (stateTransitionTimeline) {
      stateTransitionTimeline.kill();
      stateTransitionTimeline = null;
    }
    window.gsap.killTweensOf(target);

    stateTransitionTimeline = window.gsap.timeline({
      defaults: { overwrite: 'auto' },
      onComplete: () => {
        window.gsap.set(target, { clearProps: 'opacity,transform,willChange' });
        stateTransitionTimeline = null;
        syncFloatingTheme();
      }
    });

    stateTransitionTimeline
      .set(target, { willChange: 'transform,opacity' })
      .to(target, {
        opacity: 0,
        y: -5,
        duration: 0.14,
        ease: 'power1.in'
      })
      .add(() => {
        update();
        // Start the new content just a few pixels lower. This is intentionally
        // subtle so the language feels like it changes in-place.
        window.gsap.set(target, { y: 6 });
      })
      .to(target, {
        opacity: 1,
        y: 0,
        duration: 0.24,
        ease: 'power2.out'
      });
  }

  function setTldr(active, { animate = true } = {}) {
    if (!tldrButton || !tldrView || active === tldrActive) return;

    animateStateChange(() => {
      tldrActive = active;
      syncStoryMode();
    }, { animate });
  }

  tldrButton?.addEventListener('click', () => {
    setTldr(!tldrActive);
  });

  function applyLanguage(language) {
    activeLanguage = language;

    localStorage.setItem(
      'core-story-language',
      language
    );

    document.documentElement.lang = language;

    languageVersions.forEach(v => {
      v.hidden =
        v.dataset.languageVersion !== language;
    });

    languageButtons.forEach(button => {
      const active =
        button.dataset.language === language;

      button.classList.toggle(
        'is-active',
        active
      );

      button.setAttribute(
        'aria-pressed',
        String(active)
      );
    });

    if (brandChangeText?.dataset[language]) {
      brandChangeText.textContent =
        brandChangeText.dataset[language];
    }

    if (heroTitle?.dataset[language]) {
      heroTitle.textContent =
        heroTitle.dataset[language];
    }

    translateStatic(language);
    renderFAQ(language);
    syncStoryMode();

    const currentPage =
      document.body.dataset.page === 'faq' ||
      document.body.classList.contains('faq-page')
        ? 'faq'
        : 'story';

    document.title =
      pageTitles[currentPage][language];
  }

  function setLanguage(
    language,
    { animate = true } = {}
  ) {
    if (!['da','en','fi'].includes(language)) return;
    if (language === activeLanguage && animate) return;

    animateStateChange(() => {
      applyLanguage(language);
    }, { animate });
  }

  languageButtons.forEach(button =>
    button.addEventListener('click', () => {
      setLanguage(
        button.dataset.language
      );
    })
  );

  function applyInvertedTheme(active) {
    invertedTheme = Boolean(active);
    document.body.classList.toggle('theme-inverted', invertedTheme);
    localStorage.setItem('core-story-inverted-theme', String(invertedTheme));

    if (themeToggle) {
      themeToggle.setAttribute('aria-pressed', String(invertedTheme));
      themeToggle.setAttribute(
        'aria-label',
        invertedTheme ? 'Use original colours' : 'Invert colours'
      );
      themeToggle.title = invertedTheme ? 'Use original colours' : 'Invert colours';
    }

    requestAnimationFrame(syncFloatingTheme);
  }

  themeToggle?.addEventListener('click', () => {
    applyInvertedTheme(!invertedTheme);
  });

  const tooltip =
    document.getElementById('tooltip');

  if (tooltip) {
    const tooltipTitle =
      tooltip.querySelector('h2');

    const tooltipText =
      tooltip.querySelector('p');

    const tooltipClose =
      tooltip.querySelector('.tooltip-close');

    const terms =
      [...document.querySelectorAll('.term')];

    let activeTerm = null;
    let closeTimer = null;

    function positionTooltip(target) {
      if (
        window.matchMedia(
          '(max-width: 600px)'
        ).matches
      ) {
        tooltip.style.left = '50%';
        tooltip.style.top = '50%';
        return;
      }

      const rect =
        target.getBoundingClientRect();

      const w =
        tooltip.offsetWidth || 320;

      const h =
        tooltip.offsetHeight || 230;

      const padding = 20;
      const gap = 28;

      let left =
        rect.right + gap;

      let top =
        rect.top +
        rect.height / 2 -
        h / 2;

      if (
        left + w >
        window.innerWidth - padding
      ) {
        left =
          rect.left - w - gap;
      }

      if (left < padding) {
        left =
          (window.innerWidth - w) / 2;
      }

      top = Math.max(
        padding,
        Math.min(
          top,
          window.innerHeight -
          h -
          padding
        )
      );

      tooltip.style.left =
        `${left}px`;

      tooltip.style.top =
        `${top}px`;
    }

    function openTooltip(target) {
      clearTimeout(closeTimer);

      activeTerm = target;

      tooltipTitle.textContent =
        target.dataset.title;

      tooltipText.textContent =
        target.dataset.explanation;

      tooltip.classList.add(
        'is-open'
      );

      tooltip.setAttribute(
        'aria-hidden',
        'false'
      );

      requestAnimationFrame(() =>
        positionTooltip(target)
      );
    }

    function closeTooltip() {
      clearTimeout(closeTimer);

      tooltip.classList.remove(
        'is-open'
      );

      tooltip.setAttribute(
        'aria-hidden',
        'true'
      );

      activeTerm = null;
    }

    function scheduleClose() {
      clearTimeout(closeTimer);

      closeTimer =
        setTimeout(
          closeTooltip,
          130
        );
    }

    terms.forEach(term => {
      term.addEventListener(
        'mouseenter',
        () => openTooltip(term)
      );

      term.addEventListener(
        'mouseleave',
        scheduleClose
      );

      term.addEventListener(
        'focus',
        () => openTooltip(term)
      );

      term.addEventListener(
        'blur',
        scheduleClose
      );

      term.addEventListener(
        'click',
        e => {
          e.stopPropagation();
          openTooltip(term);
        }
      );
    });

    tooltip.addEventListener(
      'mouseenter',
      () => clearTimeout(closeTimer)
    );

    tooltip.addEventListener(
      'mouseleave',
      scheduleClose
    );

    tooltipClose.addEventListener(
      'click',
      e => {
        e.stopPropagation();
        closeTooltip();
      }
    );

    document.addEventListener(
      'click',
      e => {
        if (
          !tooltip.contains(e.target) &&
          !e.target.closest('.term')
        ) {
          closeTooltip();
        }
      }
    );

    document.addEventListener(
      'keydown',
      e => {
        if (e.key === 'Escape') {
          closeTooltip();
        }
      }
    );

    window.addEventListener(
      'resize',
      () => {
        if (activeTerm) {
          positionTooltip(activeTerm);
        }
      }
    );

    window.addEventListener(
      'scroll',
      () => {
        if (activeTerm) {
          positionTooltip(activeTerm);
        }
      },
      {
        passive: true
      }
    );
  }

  function syncFloatingTheme() {
    const isFAQ =
      document.body.dataset.page === 'faq' ||
      document.body.classList.contains(
        'faq-page'
      );

    if (isFAQ || document.body.classList.contains('theme-inverted')) {
      floatingControls.forEach(
        control => control.classList.add('on-light')
      );
      return;
    }

    const lightSurfaces = [
      ...document.querySelectorAll(
        '[data-surface="light"]'
      )
    ];

    floatingControls.forEach(
      control => {
        const controlRect =
          control.getBoundingClientRect();

        const controlY =
          controlRect.top +
          controlRect.height / 2;

        const isOverLightSurface =
          lightSurfaces.some(
            surface => {
              const surfaceRect =
                surface.getBoundingClientRect();

              return (
                controlY >=
                  surfaceRect.top &&
                controlY <=
                  surfaceRect.bottom
              );
            }
          );

        control.classList.toggle(
          'on-light',
          isOverLightSurface
        );
      }
    );
  }

  window.addEventListener(
    'scroll',
    syncFloatingTheme,
    {
      passive: true
    }
  );

  window.addEventListener(
    'resize',
    syncFloatingTheme
  );

  window.addEventListener(
    'pageshow',
    () => {
      requestAnimationFrame(
        syncFloatingTheme
      );
    }
  );

  window.addEventListener(
    'pagereveal',
    () => {
      requestAnimationFrame(() =>
        requestAnimationFrame(
          syncFloatingTheme
        )
      );
    }
  );


  /* =======================================================
     GSAP MOTION
     ======================================================= */

  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  const hasGSAP = typeof window.gsap !== 'undefined';

  function animatePageEntrance() {
    const internalNavigation = sessionStorage.getItem('core-story-internal-nav') === '1';
    if (internalNavigation) {
      sessionStorage.removeItem('core-story-internal-nav');
      return;
    }

    if (!hasGSAP || prefersReducedMotion) return;

    const shell = document.querySelector('.content, .faq-shell');
    if (!shell) return;

    window.gsap.fromTo(
      shell,
      { opacity: 0.92, y: 3 },
      {
        opacity: 1,
        y: 0,
        duration: 0.2,
        ease: 'power2.out',
        clearProps: 'opacity,transform'
      }
    );
  }

  function setupScrollTextReveals() {
    if (!hasGSAP || prefersReducedMotion || !('IntersectionObserver' in window)) {
      return;
    }

    const targets = [
      ...document.querySelectorAll(
        '.story:not([hidden]) p, .story:not([hidden]) .brand-change, .faq-item, .faq-section-title, .faq-footer'
      )
    ];

    if (!targets.length) return;

    targets.forEach(el => {
      if (el.dataset.gsapRevealReady === 'true') return;
      el.dataset.gsapRevealReady = 'true';
      window.gsap.set(el, { opacity: 0, y: 18 });
    });

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;

          window.gsap.to(entry.target, {
            opacity: 1,
            y: 0,
            duration: 0.52,
            ease: 'power2.out',
            overwrite: true,
            onComplete: () => {
              window.gsap.set(entry.target, { clearProps: 'opacity,transform,willChange' });
            }
          });

          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' }
    );

    targets.forEach(el => observer.observe(el));
  }

  function setupGSAPHovers() {
    if (!hasGSAP || prefersReducedMotion) return;

    // Keep GSAP hover motion away from the TLDR control: that button uses a
    // CSS translateX(-50%) for centering, and competing transform writers can
    // create a visible jump. Its existing CSS hover treatment is enough.
    const hoverTargets = document.querySelectorAll(
      '.site-nav a, .language-button, .faq-back'
    );

    hoverTargets.forEach(el => {
      el.addEventListener('mouseenter', () => {
        window.gsap.to(el, {
          scale: 1.035,
          duration: 0.16,
          ease: 'power2.out',
          overwrite: true
        });
      });

      el.addEventListener('mouseleave', () => {
        window.gsap.to(el, {
          scale: 1,
          duration: 0.18,
          ease: 'power2.out',
          overwrite: true,
          onComplete: () => window.gsap.set(el, { clearProps: 'transform' })
        });
      });
    });

    document.addEventListener('mouseover', event => {
      const question = event.target.closest('.faq-question');
      if (!question || question.contains(event.relatedTarget)) return;
      window.gsap.to(question, {
        x: 4,
        duration: 0.16,
        ease: 'power2.out',
        overwrite: true
      });
    });

    document.addEventListener('mouseout', event => {
      const question = event.target.closest('.faq-question');
      if (!question || question.contains(event.relatedTarget)) return;
      window.gsap.to(question, {
        x: 0,
        duration: 0.18,
        ease: 'power2.out',
        overwrite: true,
        onComplete: () => window.gsap.set(question, { clearProps: 'transform' })
      });
    });
  }

  function setupPageTransitions() {
    // Cross-document animation is handled by the browser View Transition API.
    // We intentionally do NOT fade/transform the outgoing DOM here; doing so
    // was the source of the visible blink on real document navigation.
    document.addEventListener('click', event => {
      const link = event.target.closest('a[href]');
      if (!link) return;

      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.shiftKey ||
        event.altKey ||
        link.target === '_blank' ||
        link.hasAttribute('download')
      ) {
        return;
      }

      const destination = new URL(link.href, window.location.href);
      if (destination.origin !== window.location.origin) return;

      const current = new URL(window.location.href);
      if (
        destination.pathname === current.pathname &&
        destination.search === current.search &&
        destination.hash === current.hash
      ) {
        return;
      }

      sessionStorage.setItem('core-story-internal-nav', '1');
    });
  }



  setLanguage(
    activeLanguage,
    {
      animate: false
    }
  );

  if (themeToggle) {
    applyInvertedTheme(invertedTheme);
  }

  animatePageEntrance();
  setupGSAPHovers();
  setupPageTransitions();

  requestAnimationFrame(() => {
    setupScrollTextReveals();
    syncFloatingTheme();
  });
})();