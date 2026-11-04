/* ============================================
   БАРОША — интерактив: GSAP, курсор, tilt,
   фильтры, magnetic-кнопки, параллакс аватара
   ============================================ */
(function () {
  'use strict';

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = window.matchMedia('(hover: none), (pointer: coarse)').matches
    || (navigator.maxTouchPoints || 0) > 0
    || 'ontouchstart' in window;

  if (prefersReduced) document.body.classList.add('reduced-motion');

  const hasGsap = typeof window.gsap !== 'undefined';
  if (hasGsap && window.ScrollTrigger) gsap.registerPlugin(ScrollTrigger);

  /* ---------- Показ [data-reveal] без GSAP (fallback) ---------- */
  if (!hasGsap || prefersReduced) {
    document.querySelectorAll('[data-reveal]').forEach(function (el) {
      el.style.opacity = '1';
      el.style.transform = 'none';
    });
  }

  /* ---------- Шапка: фон при скролле + скрытие вниз ---------- */
  const header = document.querySelector('.header');
  let lastY = 0;
  window.addEventListener('scroll', function () {
    const y = window.scrollY;
    header.classList.toggle('is-scrolled', y > 40);
    if (y > 300 && y > lastY && !document.querySelector('.mobile-menu.is-open')) {
      header.classList.add('is-hidden');
    } else {
      header.classList.remove('is-hidden');
    }
    lastY = y;
  }, { passive: true });

  /* ---------- Мобильное меню ---------- */
  const burger = document.querySelector('.burger');
  const mobileMenu = document.querySelector('.mobile-menu');
  burger.addEventListener('click', function () {
    const open = mobileMenu.classList.toggle('is-open');
    burger.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', String(open));
    mobileMenu.setAttribute('aria-hidden', String(!open));
    document.body.style.overflow = open ? 'hidden' : '';
    document.body.classList.toggle('menu-open', open);
  });
  mobileMenu.querySelectorAll('.mobile-menu__link').forEach(function (link) {
    link.addEventListener('click', function () {
      mobileMenu.classList.remove('is-open');
      burger.classList.remove('is-open');
      burger.setAttribute('aria-expanded', 'false');
      mobileMenu.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      document.body.classList.remove('menu-open');
    });
  });

  /* ---------- Кастомный курсор ---------- */
  if (!isTouch) {
    const dot = document.querySelector('.cursor');
    const ring = document.querySelector('.cursor-ring');
    let mx = -100, my = -100, rx = -100, ry = -100;

    window.addEventListener('mousemove', function (e) {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = 'translate(' + (mx - 4) + 'px,' + (my - 4) + 'px)';
    }, { passive: true });

    (function follow() {
      rx += (mx - rx) * 0.16;
      ry += (my - ry) * 0.16;
      ring.style.transform = 'translate(' + (rx - ring.offsetWidth / 2) + 'px,' + (ry - ring.offsetHeight / 2) + 'px)';
      requestAnimationFrame(follow);
    })();

    document.querySelectorAll('a, button, .tilt, input, textarea').forEach(function (el) {
      el.addEventListener('mouseenter', function () { ring.classList.add('is-hover'); });
      el.addEventListener('mouseleave', function () { ring.classList.remove('is-hover'); });
    });
  }

  /* ---------- Magnetic-эффект ---------- */
  if (!isTouch && hasGsap && !prefersReduced) {
    document.querySelectorAll('.magnetic').forEach(function (el) {
      const strength = 0.35;
      el.addEventListener('mousemove', function (e) {
        const r = el.getBoundingClientRect();
        const x = e.clientX - r.left - r.width / 2;
        const y = e.clientY - r.top - r.height / 2;
        gsap.to(el, { x: x * strength, y: y * strength, duration: 0.4, ease: 'power3.out' });
      });
      el.addEventListener('mouseleave', function () {
        gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.4)' });
      });
    });
  }

  /* ---------- 3D-tilt карточек проектов ---------- */
  if (!isTouch && hasGsap && !prefersReduced) {
    document.querySelectorAll('.tilt').forEach(function (card) {
      const link = card.querySelector('.project-card__link');
      const media = card.querySelector('.project-card__media img');
      card.style.perspective = '900px';

      card.addEventListener('mousemove', function (e) {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5;
        const py = (e.clientY - r.top) / r.height - 0.5;
        gsap.to(link, {
          rotateY: px * 8, rotateX: -py * 8,
          transformPerspective: 900,
          duration: 0.5, ease: 'power2.out'
        });
        if (media) {
          gsap.to(media, { x: px * 18, y: py * 14, duration: 0.5, ease: 'power2.out' });
        }
      });
      card.addEventListener('mouseleave', function () {
        gsap.to(link, { rotateY: 0, rotateX: 0, duration: 0.8, ease: 'elastic.out(1, 0.5)' });
        if (media) gsap.to(media, { x: 0, y: 0, duration: 0.8, ease: 'power2.out' });
      });
    });
  }

  /* ---------- Параллакс аватара за курсором ---------- */
  if (!isTouch && hasGsap && !prefersReduced) {
    const stage = document.getElementById('avatarStage');
    if (stage) {
      const layers = stage.querySelectorAll('[data-depth]');
      const setters = Array.from(layers).map(function (layer) {
        return {
          depth: parseFloat(layer.dataset.depth),
          xTo: gsap.quickTo(layer, 'x', { duration: 1.1, ease: 'power3.out' }),
          yTo: gsap.quickTo(layer, 'y', { duration: 1.1, ease: 'power3.out' })
        };
      });
      window.addEventListener('mousemove', function (e) {
        const nx = e.clientX / window.innerWidth - 0.5;
        const ny = e.clientY / window.innerHeight - 0.5;
        setters.forEach(function (s) {
          s.xTo(nx * s.depth);
          s.yTo(ny * s.depth);
        });
      }, { passive: true });
    }
  }

  /* ---------- GSAP: появление элементов ---------- */
  if (hasGsap && window.ScrollTrigger && !prefersReduced) {

    // Заголовок hero: строки выезжают
    gsap.from('.hero__line em', {
      yPercent: 110,
      duration: 1.1,
      ease: 'power4.out',
      stagger: 0.12,
      delay: 0.15
    });

    // Аватар: мягкое появление
    gsap.from('.avatar-stage', {
      opacity: 0, scale: 0.92, y: 40,
      duration: 1.2, ease: 'power3.out', delay: 0.35
    });

    // Все data-reveal
    ScrollTrigger.config({ ignoreMobileResize: true });
    document.querySelectorAll('[data-reveal]').forEach(function (el) {
      gsap.to(el, {
        opacity: 1, y: 0,
        duration: 0.6,
        ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 98%', once: true }
      });
    });
    window.addEventListener('load', function () { ScrollTrigger.refresh(); });

    // Карточки проектов: сборка при скролле
    gsap.utils.toArray('.project-card').forEach(function (card, i) {
      gsap.from(card, {
        opacity: 0, y: 70, rotateZ: i % 2 ? 1.5 : -1.5,
        duration: 1, ease: 'power3.out',
        scrollTrigger: { trigger: card, start: 'top 98%', once: true }
      });
    });

    // Линия этапов: прорисовка
    const wfLine = document.getElementById('workflowLine');
    if (wfLine) {
      gsap.to(wfLine, {
        scaleX: 1,
        ease: 'none',
        scrollTrigger: {
          trigger: '.workflow__wrap',
          start: 'top 80%',
          end: 'bottom 60%',
          scrub: 0.6
        }
      });
    }

    // Лёгкий параллакс большого слова в футере
    gsap.fromTo('.footer__big', { yPercent: 60 }, {
      yPercent: 18,
      ease: 'none',
      scrollTrigger: {
        trigger: '.footer',
        start: 'top bottom',
        end: 'bottom bottom',
        scrub: 0.5
      }
    });
  }

  /* ---------- Фильтрация проектов ---------- */
  const filterBtns = document.querySelectorAll('.filter-btn');
  const projectCards = document.querySelectorAll('.project-card[data-cat]');

  filterBtns.forEach(function (btn) {
    btn.addEventListener('click', function () {
      filterBtns.forEach(function (b) {
        b.classList.remove('is-active');
        b.setAttribute('aria-selected', 'false');
      });
      btn.classList.add('is-active');
      btn.setAttribute('aria-selected', 'true');
      const filter = btn.dataset.filter;

      projectCards.forEach(function (card) {
        const cat = card.dataset.cat;
        const show = filter === 'all' || cat === filter || cat === 'all';
        if (show) {
          if (card.classList.contains('is-hidden')) {
            card.classList.remove('is-hidden');
            if (hasGsap && !prefersReduced) {
              gsap.fromTo(card, { opacity: 0, scale: 0.92, y: 26 },
                { opacity: 1, scale: 1, y: 0, duration: 0.55, ease: 'power3.out', clearProps: 'scale' });
            } else {
              card.style.opacity = '1';
            }
          }
        } else {
          if (hasGsap && !prefersReduced) {
            gsap.to(card, {
              opacity: 0, scale: 0.92, y: 20, duration: 0.3, ease: 'power2.in',
              onComplete: function () { card.classList.add('is-hidden'); gsap.set(card, { clearProps: 'all' }); }
            });
          } else {
            card.classList.add('is-hidden');
          }
        }
      });

      if (window.ScrollTrigger) setTimeout(function () { ScrollTrigger.refresh(); }, 650);
    });
  });

  /* ---------- Форма обратной связи → submit.php ---------- */
  const form = document.getElementById('contactForm');
  if (!form) return; // форма может быть отключена

  const formNote = document.getElementById('formNote');
  const submitBtn = document.getElementById('formSubmit');
  const submitBtnText = submitBtn ? submitBtn.textContent : '';

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    // Валидация
    let valid = true;
    form.querySelectorAll('[required]').forEach(function (field) {
      if (field.type === 'checkbox') {
        const consentWrap = document.getElementById('consentWrap');
        if (consentWrap) consentWrap.classList.toggle('has-error', !field.checked);
        if (!field.checked) valid = false;
      } else {
        const wrap = field.closest('.contact-form__field');
        const empty = !field.value.trim();
        if (wrap) wrap.classList.toggle('has-error', empty);
        if (empty) valid = false;
      }
    });

    if (!valid) {
      if (formNote) {
        formNote.textContent = 'заполните все поля и отметьте согласие — и смело отправляйте';
        formNote.classList.remove('is-success');
      }
      return;
    }

    const name = form.name.value.trim();
    const contact = form.contact.value.trim();
    const message = form.message.value.trim();

    // Отправляем на submit.php
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'отправляю…';
    }
    if (formNote) formNote.classList.remove('is-success');

    fetch('api/submit.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name, contact: contact, message: message })
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data.ok) {
          if (formNote) {
            formNote.textContent = data.message || 'спасибо! заявка сохранена — свяжусь с вами в течение дня';
            formNote.classList.add('is-success');
          }
          form.reset();
          if (hasGsap && !prefersReduced) {
            gsap.fromTo(form, { scale: 1 }, { scale: 1.015, duration: 0.14, yoyo: true, repeat: 1, ease: 'power2.inOut' });
          }
        } else {
          throw new Error(data.error || 'server error');
        }
      })
      .catch(function () {
        if (formNote) {
          formNote.innerHTML = 'не получилось отправить — напишите мне напрямую: ' +
            '<a href="https://t.me/barobarosha" target="_blank" rel="noopener" style="color:inherit;text-decoration:underline">@barobarosha</a>';
          formNote.classList.remove('is-success');
        }
      })
      .finally(function () {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = submitBtnText;
        }
      });
  });

  // Сброс ошибок при вводе
  form.querySelectorAll('[required]').forEach(function (field) {
    field.addEventListener('input', function () {
      if (field.type === 'checkbox') {
        const consentWrap = document.getElementById('consentWrap');
        if (consentWrap) consentWrap.classList.remove('has-error');
      } else {
        const wrap = field.closest('.contact-form__field');
        if (wrap) wrap.classList.remove('has-error');
      }
    });
  });

})();

/* =====================================================
   ОТЗЫВЫ: загрузка одобренных + форма «оставить отзыв»
   ===================================================== */
(function () {
  'use strict';

  var grid = document.getElementById('reviewsGrid');
  var leaveCard = document.getElementById('leaveReview');
  var reviewForm = document.getElementById('reviewForm');
  var hasGsapR = typeof gsap !== 'undefined';
  var prefersReducedR = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function initials(name) {
    var parts = name.trim().split(/\s+/);
    var ch = parts.map(function (p) { return p.charAt(0); }).join('').slice(0, 2);
    return ch ? ch.toUpperCase() : '★';
  }

  /* ---------- Загрузка одобренных отзывов из БД ---------- */
  if (grid) {
    fetch('api/reviews.php')
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (!data.ok || !Array.isArray(data.reviews)) return;
        var existing = Array.prototype.slice.call(
          grid.querySelectorAll('.review-card--filled figcaption')
        ).map(function (el) { return el.textContent.trim().toLowerCase(); });

        data.reviews.forEach(function (r) {
          var caption = (r.name + ' · ' + r.project).toLowerCase();
          if (existing.indexOf(caption) !== -1) return; // не дублируем статичную карточку
          var fig = document.createElement('figure');
          fig.className = 'review-card review-card--filled';
          fig.innerHTML =
            '<div class="review-card__avatar review-card__avatar--filled" aria-hidden="true">' + esc(initials(r.name)) + '</div>' +
            '<blockquote>' + esc(r.text) + '</blockquote>' +
            '<figcaption>' + esc(r.name) + ' · ' + esc(r.project) + '</figcaption>';
          grid.insertBefore(fig, leaveCard);
        });
      })
      .catch(function () { /* статичные карточки остаются */ });
  }

  if (!leaveCard || !reviewForm) return;

  var reviewNote = document.getElementById('reviewNote');
  var reviewSubmit = document.getElementById('reviewSubmit');
  var reviewCancel = document.getElementById('reviewCancel');
  var reviewSubmitText = reviewSubmit ? reviewSubmit.textContent : '';

  function openForm() {
    if (!reviewForm.hidden) return;
    reviewForm.hidden = false;
    if (hasGsapR && !prefersReducedR) {
      gsap.fromTo(reviewForm, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' });
    }
    var y = reviewForm.getBoundingClientRect().top + window.scrollY - 90;
    window.scrollTo({ top: y, behavior: prefersReducedR ? 'auto' : 'smooth' });
    var first = reviewForm.querySelector('input');
    if (first) setTimeout(function () { first.focus(); }, prefersReducedR ? 0 : 400);
  }

  function closeForm() {
    reviewForm.hidden = true;
    reviewForm.reset();
    if (reviewNote) { reviewNote.textContent = ''; reviewNote.classList.remove('is-success'); }
  }

  leaveCard.addEventListener('click', openForm);
  leaveCard.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openForm(); }
  });
  if (reviewCancel) reviewCancel.addEventListener('click', closeForm);

  reviewForm.addEventListener('submit', function (e) {
    e.preventDefault();

    var valid = true;
    reviewForm.querySelectorAll('[required]').forEach(function (field) {
      if (field.type === 'checkbox') {
        var cw = document.getElementById('reviewConsentWrap');
        if (cw) cw.classList.toggle('has-error', !field.checked);
        if (!field.checked) valid = false;
      } else {
        var wrap = field.closest('.contact-form__field');
        var empty = !field.value.trim();
        if (wrap) wrap.classList.toggle('has-error', empty);
        if (empty) valid = false;
      }
    });

    if (!valid) {
      if (reviewNote) {
        reviewNote.textContent = 'заполните все поля и отметьте согласие';
        reviewNote.classList.remove('is-success');
      }
      return;
    }

    if (reviewSubmit) { reviewSubmit.disabled = true; reviewSubmit.textContent = 'отправляю…'; }
    if (reviewNote) reviewNote.classList.remove('is-success');

    fetch('api/review-submit.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: reviewForm.name.value.trim(),
        project: reviewForm.project.value.trim(),
        text: reviewForm.text.value.trim()
      })
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data.ok) {
          if (reviewNote) {
            reviewNote.textContent = data.message || 'спасибо! отзыв появится на сайте после проверки';
            reviewNote.classList.add('is-success');
          }
          reviewForm.reset();
          if (hasGsapR && !prefersReducedR) {
            gsap.fromTo(reviewForm, { scale: 1 }, { scale: 1.015, duration: 0.14, yoyo: true, repeat: 1, ease: 'power2.inOut' });
          }
        } else {
          throw new Error(data.error || 'server error');
        }
      })
      .catch(function () {
        if (reviewNote) {
          reviewNote.innerHTML = 'не получилось отправить — напишите мне напрямую: ' +
            '<a href="https://t.me/barobarosha" target="_blank" rel="noopener" style="color:inherit;text-decoration:underline">@barobarosha</a>';
          reviewNote.classList.remove('is-success');
        }
      })
      .finally(function () {
        if (reviewSubmit) { reviewSubmit.disabled = false; reviewSubmit.textContent = reviewSubmitText; }
      });
  });

  reviewForm.querySelectorAll('[required]').forEach(function (field) {
    field.addEventListener('input', function () {
      if (field.type === 'checkbox') {
        var cw = document.getElementById('reviewConsentWrap');
        if (cw) cw.classList.remove('has-error');
      } else {
        var wrap = field.closest('.contact-form__field');
        if (wrap) wrap.classList.remove('has-error');
      }
    });
  });

})();
