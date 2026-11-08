/* =========================================
   HERMETIC LABS — Interactivity
   ========================================= */

document.addEventListener('DOMContentLoaded', () => {

  // ---------- Mobile Nav ----------
  const hamburger = document.getElementById('hamburger');
  const navLinks  = document.getElementById('navLinks');
  const mobileNavQuery = window.matchMedia('(max-width: 960px)');

  const setMobileNavOpen = (isOpen) => {
    const nextOpen = Boolean(isOpen && mobileNavQuery.matches);
    hamburger.classList.toggle('active', nextOpen);
    navLinks.classList.toggle('open', nextOpen);
    hamburger.setAttribute('aria-expanded', String(nextOpen));
    navLinks.inert = mobileNavQuery.matches && !nextOpen;

    if (nextOpen) {
      window.requestAnimationFrame(() => navLinks.querySelector('a')?.focus());
    }
  };

  const syncMobileNavMode = () => {
    if (mobileNavQuery.matches) {
      navLinks.inert = !navLinks.classList.contains('open');
      return;
    }

    hamburger.classList.remove('active');
    navLinks.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    navLinks.inert = false;
  };

  syncMobileNavMode();
  if (mobileNavQuery.addEventListener) {
    mobileNavQuery.addEventListener('change', syncMobileNavMode);
  } else {
    mobileNavQuery.addListener(syncMobileNavMode);
  }

  hamburger.addEventListener('click', () => {
    setMobileNavOpen(!navLinks.classList.contains('open'));
  });

  // Close mobile nav on link click
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      setMobileNavOpen(false);
    });
  });

  // ---------- Compact desktop menus ----------
  const navMenus = Array.from(document.querySelectorAll('[data-nav-menu]'));
  const labsMenu = document.querySelector('.nav-menu--labs');
  let labsHoverCloseTimer;

  const closeNavMenus = (exception) => {
    navMenus.forEach(menu => {
      if (menu === exception) return;
      menu.classList.remove('is-open');
      menu.classList.remove('is-hover-open');
      menu.querySelector('.nav-menu-trigger')?.setAttribute('aria-expanded', 'false');
    });
  };

  // The Labs panel is much wider than the Company menu, so a quick diagonal
  // cursor movement can briefly leave the trigger before reaching the panel.
  // Keep it open for a short grace period while the pointer crosses that gap.
  labsMenu?.addEventListener('pointerenter', (event) => {
    if (mobileNavQuery.matches || event.pointerType !== 'mouse') return;
    window.clearTimeout(labsHoverCloseTimer);
    labsMenu.classList.add('is-hover-open');
  });

  labsMenu?.addEventListener('pointerleave', (event) => {
    if (mobileNavQuery.matches || event.pointerType !== 'mouse') return;
    window.clearTimeout(labsHoverCloseTimer);
    labsHoverCloseTimer = window.setTimeout(() => {
      labsMenu.classList.remove('is-hover-open');
    }, 260);
  });

  navMenus.forEach(menu => {
    const trigger = menu.querySelector('.nav-menu-trigger');
    trigger?.addEventListener('click', (event) => {
      event.stopPropagation();
      const nextOpen = !menu.classList.contains('is-open');
      closeNavMenus(menu);
      menu.classList.toggle('is-open', nextOpen);
      trigger.setAttribute('aria-expanded', String(nextOpen));
    });
  });

  document.addEventListener('click', (event) => {
    if (!event.target.closest('[data-nav-menu]')) closeNavMenus();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && navLinks.classList.contains('open')) {
      setMobileNavOpen(false);
      hamburger.focus();
    }
  });

  // ---------- Scroll: Nav Background ----------
  const nav = document.getElementById('nav');

  window.addEventListener('scroll', () => {
    nav.classList.toggle('scrolled', window.scrollY > 60);
  }, { passive: true });

  // ---------- Scroll: Active Nav Link ----------
  const sections = document.querySelectorAll('section[id]');
  const navAnchors = navLinks.querySelectorAll(':scope > a');
  const labsTrigger = document.querySelector('.nav-menu--labs .nav-menu-trigger');
  const companyTrigger = document.querySelector('.nav-menu--company .nav-menu-trigger');

  const setActiveLink = () => {
    const scrollY = window.scrollY + 100;

    sections.forEach(section => {
      const top = section.offsetTop - 100;
      const bottom = top + section.offsetHeight;
      const id = section.getAttribute('id');

      if (scrollY >= top && scrollY < bottom) {
        navAnchors.forEach(a => {
          if (a.getAttribute('aria-current') === 'page') return;
          let targetId = id;
          if (targetId === 'how-it-works') targetId = 'about';
          const href = a.getAttribute('href') || '';
          if (href.startsWith('#')) a.classList.toggle('active', href === `#${targetId}`);
        });
        if (labsTrigger?.getAttribute('aria-current') !== 'page') labsTrigger?.classList.toggle('active', id === 'labs');
        if (companyTrigger?.getAttribute('aria-current') !== 'page') companyTrigger?.classList.toggle('active', id === 'contact');
      }
    });
  };

  window.addEventListener('scroll', setActiveLink, { passive: true });
  setActiveLink();

  // ---------- Scroll: Fade-in Animations ----------
  const fadeEls = document.querySelectorAll('.fade-in');

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    fadeEls.forEach(el => observer.observe(el));
  } else {
    fadeEls.forEach(el => el.classList.add('visible'));
  }

  // ---------- Ecosystem carousel ----------
  const ecosystemCarousel = document.querySelector('[data-carousel]');
  if (ecosystemCarousel) {
    const track = ecosystemCarousel.querySelector('.ecosystem-track');
    const slides = Array.from(ecosystemCarousel.querySelectorAll('[data-slide]'));
    const previousButton = ecosystemCarousel.querySelector('[data-carousel-prev]');
    const nextButton = ecosystemCarousel.querySelector('[data-carousel-next]');
    const dotsContainer = ecosystemCarousel.querySelector('[data-carousel-dots]');
    const position = ecosystemCarousel.querySelector('[data-carousel-position]');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const autoplayDelay = 5000;
    let activeIndex = 0;
    let autoplayTimer;
    let carouselIsVisible = true;
    let carouselIsPaused = false;

    const syncSlideVideos = () => {
      slides.forEach((slide, index) => {
        const video = slide.querySelector('.ecosystem-slide-video');
        if (!video) return;

        const shouldPlay = index === activeIndex && carouselIsVisible && !document.hidden && !reducedMotion.matches;
        if (shouldPlay) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      });
    };

    const stopAutoplay = () => {
      window.clearInterval(autoplayTimer);
      autoplayTimer = undefined;
    };

    const startAutoplay = () => {
      stopAutoplay();
      syncSlideVideos();
      if (slides.length < 2 || reducedMotion.matches || document.hidden || !carouselIsVisible || carouselIsPaused) return;
      autoplayTimer = window.setInterval(() => updateCarousel(activeIndex + 1), autoplayDelay);
    };

    const restartAutoplay = () => {
      stopAutoplay();
      startAutoplay();
    };

    const dots = slides.map((slide, index) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'ecosystem-dot';
      dot.setAttribute('aria-label', `Show ${slide.querySelector('h3')?.textContent || `item ${index + 1}`}`);
      dot.addEventListener('click', () => {
        updateCarousel(index);
        restartAutoplay();
      });
      dotsContainer.appendChild(dot);
      return dot;
    });

    const updateCarousel = (nextIndex, animate = true) => {
      activeIndex = (nextIndex + slides.length) % slides.length;
      const activeSlide = slides[activeIndex];
      const carouselRect = ecosystemCarousel.getBoundingClientRect();
      const slideCenter = activeSlide.offsetLeft + activeSlide.offsetWidth / 2;
      const target = carouselRect.width / 2 - slideCenter;

      if (!animate) track.style.transition = 'none';
      track.style.transform = `translateX(${target}px)`;
      if (!animate) window.requestAnimationFrame(() => { track.style.transition = ''; });

      slides.forEach((slide, index) => {
        const isActive = index === activeIndex;
        slide.classList.toggle('is-active', isActive);
        slide.setAttribute('aria-current', isActive ? 'true' : 'false');
        slide.tabIndex = isActive ? 0 : -1;
      });
      dots.forEach((dot, index) => {
        const isActive = index === activeIndex;
        dot.classList.toggle('is-active', isActive);
        dot.setAttribute('aria-current', isActive ? 'true' : 'false');
      });
      position.textContent = `${String(activeIndex + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')} · ${activeSlide.querySelector('h3')?.textContent || ''}`;
      syncSlideVideos();
    };

    previousButton.addEventListener('click', () => {
      updateCarousel(activeIndex - 1);
      restartAutoplay();
    });
    nextButton.addEventListener('click', () => {
      updateCarousel(activeIndex + 1);
      restartAutoplay();
    });
    ecosystemCarousel.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        updateCarousel(activeIndex - 1);
        restartAutoplay();
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        updateCarousel(activeIndex + 1);
        restartAutoplay();
      }
    });

    ecosystemCarousel.addEventListener('pointerenter', () => {
      carouselIsPaused = true;
      stopAutoplay();
    });
    ecosystemCarousel.addEventListener('pointerleave', () => {
      carouselIsPaused = false;
      startAutoplay();
    });
    ecosystemCarousel.addEventListener('focusin', () => {
      carouselIsPaused = true;
      stopAutoplay();
    });
    ecosystemCarousel.addEventListener('focusout', (event) => {
      if (ecosystemCarousel.contains(event.relatedTarget)) return;
      carouselIsPaused = false;
      startAutoplay();
    });

    document.addEventListener('visibilitychange', startAutoplay);
    reducedMotion.addEventListener('change', startAutoplay);

    if ('IntersectionObserver' in window) {
      const autoplayObserver = new IntersectionObserver(([entry]) => {
        carouselIsVisible = entry.isIntersecting;
        startAutoplay();
      }, { threshold: 0.2 });
      autoplayObserver.observe(ecosystemCarousel);
    }

    let resizeFrame;
    window.addEventListener('resize', () => {
      window.cancelAnimationFrame(resizeFrame);
      resizeFrame = window.requestAnimationFrame(() => updateCarousel(activeIndex, false));
    }, { passive: true });

    updateCarousel(0, false);
    startAutoplay();
  }

  // ---------- Labs portfolio ----------
  const labTabs = Array.from(document.querySelectorAll('[data-lab-tab]'));
  const labPanels = Array.from(document.querySelectorAll('[data-lab-panel]'));
  const labLinks = Array.from(document.querySelectorAll('[data-lab-link], a[href*="labs.html#lab-"]'));

  const activateLab = (labId, options = {}) => {
    if (!labTabs.some(tab => tab.dataset.labTab === labId)) return;

    labTabs.forEach(tab => {
      const active = tab.dataset.labTab === labId;
      tab.classList.toggle('is-active', active);
      tab.setAttribute('aria-selected', String(active));
      tab.tabIndex = active ? 0 : -1;
      if (active && options.focus) tab.focus();
    });

    labPanels.forEach(panel => {
      const active = panel.dataset.labPanel === labId;
      panel.classList.toggle('is-active', active);
      panel.hidden = !active;
    });
  };

  labTabs.forEach((tab, index) => {
    tab.addEventListener('click', () => activateLab(tab.dataset.labTab));
    tab.addEventListener('keydown', (event) => {
      if (!['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft', 'Home', 'End'].includes(event.key)) return;
      event.preventDefault();
      let nextIndex = index;
      if (event.key === 'ArrowDown' || event.key === 'ArrowRight') nextIndex = (index + 1) % labTabs.length;
      if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') nextIndex = (index - 1 + labTabs.length) % labTabs.length;
      if (event.key === 'Home') nextIndex = 0;
      if (event.key === 'End') nextIndex = labTabs.length - 1;
      activateLab(labTabs[nextIndex].dataset.labTab, { focus: true });
    });
  });

  const getLabIdFromLink = link => {
    if (link.dataset.labTarget) return link.dataset.labTarget;
    const hash = new URL(link.href, window.location.href).hash;
    return hash.startsWith('#lab-') ? hash.slice(5) : '';
  };

  labLinks.forEach(link => {
    link.addEventListener('click', (event) => {
      const labId = getLabIdFromLink(link);
      const destination = new URL(link.href, window.location.href);
      const currentPath = window.location.pathname.replace(/\/$/, '/index.html');
      const destinationPath = destination.pathname.replace(/\/$/, '/index.html');

      // Links from another page should perform normal navigation. Once on the
      // Labs page, handle the fragment locally so the visible tab and panel stay
      // synchronized with the URL.
      if (!labId || currentPath !== destinationPath || !labTabs.some(tab => tab.dataset.labTab === labId)) return;

      event.preventDefault();
      activateLab(labId);
      closeNavMenus();
      setMobileNavOpen(false);
      document.getElementById('labs')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      if (window.history?.replaceState) window.history.replaceState(null, '', `#lab-${labId}`);
    });
  });

  const syncLabFromHash = (scrollBehavior = 'auto') => {
    const requestedLab = window.location.hash.startsWith('#lab-') ? window.location.hash.slice(5) : '';
    if (!requestedLab || !labTabs.some(tab => tab.dataset.labTab === requestedLab)) return;

    activateLab(requestedLab);
    closeNavMenus();
    setMobileNavOpen(false);
    window.requestAnimationFrame(() => {
      document.getElementById('labs')?.scrollIntoView({ behavior: scrollBehavior, block: 'start' });
    });
  };

  syncLabFromHash();
  window.addEventListener('hashchange', () => syncLabFromHash('smooth'));
});

