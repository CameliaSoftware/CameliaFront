/* Lógica de la página de inicio */

(function () {
  var C = CAMELIA;

  /* Dibuja las joyas decorativas marcadas con data-jewel */
  function paintJewels() {
    document.querySelectorAll('[data-jewel]').forEach(function (el) {
      var metal = el.dataset.metalFixed || C.state.metal;
      el.innerHTML = C.jewelSVG(el.dataset.jewel, metal, { variant: el.dataset.variant });
    });
  }

  /* Hero: línea divisoria que se arrastra para mostrar más plata o más oro */
  function initHero() {
    var hero = document.querySelector('[data-hero]');
    if (!hero) return;
    var handle = hero.querySelector('[data-handle]');
    var dragging = false;
    function set(pct) {
      pct = Math.max(8, Math.min(92, pct));
      hero.style.setProperty('--split', pct + '%');
    }
    function fromEvent(e) {
      var r = hero.getBoundingClientRect();
      set(((e.clientX - r.left) / r.width) * 100);
    }
    handle.addEventListener('pointerdown', function (e) { dragging = true; handle.setPointerCapture(e.pointerId); });
    handle.addEventListener('pointermove', function (e) { if (dragging) fromEvent(e); });
    handle.addEventListener('pointerup', function () { dragging = false; });
    handle.addEventListener('keydown', function (e) {
      var cur = parseFloat(getComputedStyle(hero).getPropertyValue('--split')) || 50;
      if (e.key === 'ArrowLeft') set(cur - 5);
      if (e.key === 'ArrowRight') set(cur + 5);
    });
  }

  /* Categorías en círculo */
  function renderCollections() {
    document.querySelector('[data-collections]').innerHTML = C.CATEGORIES.filter(function (c) { return c.home !== false; }).map(function (cat, i) {
      return '<a class="collection reveal" href="categoria.html?cat=' + cat.id + '">' +
        '<span class="collection__img">' + C.jewelSVG(cat.shape, i % 2 ? 'oro' : 'plata', { variant: i === 5 ? 'torcida' : 'clasica' }) + '</span>' +
        '<span>' + (cat.shortName || cat.name) + '</span></a>';
    }).join('');
  }

  /* Colección destacada con pestañas Todo | Plata | Oro */
  var filter = 'todo';
  function renderFeatured() {
    var list = C.PRODUCTS.filter(function (p) { return filter === 'todo' || C.tieneMetal(p, filter); });
    var picks = ['anillo-aura-esmeralda', 'dije-cruz-cristo', 'anillo-mariposa-esmeralda', 'pulsera-tejida-raqueta', 'anillo-flor-esmeralda', 'cadena-veneciana', 'anillo-pave-esmeralda', 'pulsera-tejida-letra-v'];
    list.sort(function (a, b) {
      var ia = picks.indexOf(a.id), ib = picks.indexOf(b.id);
      return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
    });
    var box = document.querySelector('[data-featured]');
    box.innerHTML = list.slice(0, 8).map(function (p) {
      return C.productCard(p, filter === 'todo' ? C.state.metal : filter);
    }).join('');
    C.observeReveal(box);
  }
  function initTabs() {
    document.querySelectorAll('[data-product-tabs] button').forEach(function (b) {
      b.addEventListener('click', function () {
        filter = b.dataset.filter;
        document.querySelectorAll('[data-product-tabs] button').forEach(function (x) { x.setAttribute('aria-selected', x === b); });
        renderFeatured();
      });
    });
  }

  /* Línea del proceso que se llena al aparecer */
  function initProcess() {
    var el = document.querySelector('[data-process]');
    if (!('IntersectionObserver' in window)) { el.style.setProperty('--fill', 1); return; }
    new IntersectionObserver(function (entries, obs) {
      if (entries[0].isIntersecting) { el.style.setProperty('--fill', 1); obs.disconnect(); }
    }, { threshold: .3 }).observe(el);
  }

  /* Testimonios */
  function initSlider() {
    var track = document.querySelector('[data-track]');
    var dots = document.querySelector('[data-dots]');
    var i = 0, timer;
    track.innerHTML = C.TESTIMONIALS.map(function (t) {
      return '<figure class="quote" style="margin:0"><div class="quote__img">' + C.jewelSVG(t.shape, t.metal) + '</div>' +
        '<div><blockquote>“' + t.quote + '”</blockquote><figcaption class="label">' + t.name + ' · ' + t.city + '</figcaption></div></figure>';
    }).join('');
    dots.innerHTML = C.TESTIMONIALS.map(function (_, n) {
      return '<button class="slider__dot" data-dot="' + n + '" aria-label="Testimonio ' + (n + 1) + '"></button>';
    }).join('');
    function go(n) {
      i = (n + C.TESTIMONIALS.length) % C.TESTIMONIALS.length;
      track.style.transform = 'translateX(' + (-100 * i) + '%)';
      dots.querySelectorAll('button').forEach(function (d, k) { d.setAttribute('aria-current', k === i); });
    }
    function auto() { clearInterval(timer); timer = setInterval(function () { go(i + 1); }, 6000); }
    dots.addEventListener('click', function (e) { var d = e.target.closest('[data-dot]'); if (d) { go(+d.dataset.dot); auto(); } });
    go(0); auto();
  }

  document.addEventListener('DOMContentLoaded', function () {
    paintJewels();
    initHero();
    renderCollections();
    C.catalogo.then(function () { renderFeatured(); C.observeReveal(); });
    initTabs();
    initProcess();
    initSlider();
    C.mountStudio(document.querySelector('[data-studio]'));
    C.observeReveal();
  });

  /* Al cambiar Plata | Oro se actualizan las joyas y los precios mostrados */
  document.addEventListener('metalchange', function () { paintJewels(); renderFeatured(); });
})();
