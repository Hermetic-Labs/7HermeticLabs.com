/* =========================================
   HERMETIC LABS — Interactivity
   ========================================= */

document.addEventListener('DOMContentLoaded', () => {

  // ---------- Mobile Nav ----------
  const hamburger = document.getElementById('hamburger');
  const navLinks  = document.getElementById('navLinks');
  const mobileNavQuery = window.matchMedia('(max-width: 900px)');

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
  const navAnchors = navLinks.querySelectorAll('a');

  const setActiveLink = () => {
    const scrollY = window.scrollY + 100;

    sections.forEach(section => {
      const top = section.offsetTop - 100;
      const bottom = top + section.offsetHeight;
      const id = section.getAttribute('id');

      if (scrollY >= top && scrollY < bottom) {
        navAnchors.forEach(a => {
          let targetId = id;
          if (targetId === 'how-it-works') targetId = 'about';
          a.classList.toggle('active', a.getAttribute('href') === `#${targetId}`);
        });
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
    let activeIndex = 0;

    const dots = slides.map((slide, index) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'ecosystem-dot';
      dot.setAttribute('aria-label', `Show ${slide.querySelector('h3')?.textContent || `item ${index + 1}`}`);
      dot.addEventListener('click', () => updateCarousel(index));
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
    };

    previousButton.addEventListener('click', () => updateCarousel(activeIndex - 1));
    nextButton.addEventListener('click', () => updateCarousel(activeIndex + 1));
    ecosystemCarousel.addEventListener('keydown', (event) => {
      if (event.key === 'ArrowLeft') {
        event.preventDefault();
        updateCarousel(activeIndex - 1);
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        updateCarousel(activeIndex + 1);
      }
    });

    let resizeFrame;
    window.addEventListener('resize', () => {
      window.cancelAnimationFrame(resizeFrame);
      resizeFrame = window.requestAnimationFrame(() => updateCarousel(activeIndex, false));
    }, { passive: true });

    updateCarousel(0, false);
  }
});

