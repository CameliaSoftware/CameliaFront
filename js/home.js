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

  /* Joyas que salen primero (en el carrusel y en la colección destacada) */
  var picks = ['juego-flor-azul', 'anillo-mariposa-oro-esmeralda', 'anillo-aura-esmeralda', 'dije-cruz-cristo', 'topos-virgen-verde', 'anillo-riviera-esmeralda', 'pulsera-tejida-raqueta', 'anillo-duo-esmeralda-azul', 'cadena-veneciana', 'anillo-cruzado-esmeralda', 'pulsera-tejida-letra-v'];
  function ordenDestacado(a, b) {
    var ia = picks.indexOf(a.id), ib = picks.indexOf(b.id);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  }

  /* Carrusel de inicio: una joya por diapositiva, pasa sola y se puede deslizar */
  function initCarrusel() {
    var pista = document.querySelector('[data-carrusel]');
    var puntos = document.querySelector('[data-puntos]');
    var root = pista.closest('.hero-carrusel');
    var lista = C.PRODUCTS.filter(function (p) { return p.fotos && p.fotos.length; }).sort(ordenDestacado).slice(0, 8);
    if (!lista.length) { root.hidden = true; return; }
    pista.innerHTML = lista.map(function (p, n) {
      var m = C.displayMetal(p, C.state.metal);
      var fotos = C.fotosDe(p, m);
      var foto = fotos.filter(function (f) { return f.ancho && f.alto && f.ancho >= f.alto * 1.2; })[0] || fotos[0];
      var url = 'producto.html?id=' + p.id + '&metal=' + m;
      var cat = C.getCategory(p.cat);
      return '<article class="slide" aria-roledescription="diapositiva" aria-label="' + (n + 1) + ' de ' + lista.length + '">' +
        '<div class="container slide__in">' +
          '<div class="slide__txt">' +
            '<span class="label">' + C.METALS[m].label + (cat ? ' · ' + (cat.shortName || cat.name) : '') + '</span>' +
            '<h2 class="h1">' + p.name + '</h2>' +
            '<p class="lead">' + p.desc + '</p>' +
            '<p class="slide__precio">' + C.precioTexto(p.metals[m]) + '</p>' +
            '<div class="slide__btns"><a class="btn btn--primary" href="' + url + '">Ver joya</a>' +
            '<a class="btn btn--ghost" href="categoria.html?cat=' + p.cat + '&metal=' + m + '">Ver más ' + (cat ? (cat.shortName || cat.name).toLowerCase() : 'joyas') + '</a></div>' +
          '</div>' +
          '<a class="slide__img" href="' + url + '" tabindex="-1">' + C.imgFoto(foto, '', n === 0) + '</a>' +
        '</div></article>';
    }).join('');
    puntos.innerHTML = lista.map(function (p, n) {
      return '<button class="hero-carrusel__punto" data-ir="' + n + '" aria-label="Ver ' + p.name.replace(/"/g, '&quot;') + '"></button>';
    }).join('');
    root.querySelector('[data-prev]').innerHTML = C.icon('chevron');
    root.querySelector('[data-next]').innerHTML = C.icon('chevron');

    var actual = 0, timer;
    function ir(n) {
      actual = (n + lista.length) % lista.length;
      pista.scrollTo({ left: actual * pista.clientWidth, behavior: 'smooth' });
    }
    function marcar() {
      actual = Math.round(pista.scrollLeft / pista.clientWidth);
      puntos.querySelectorAll('button').forEach(function (b, k) { b.setAttribute('aria-current', k === actual); });
    }
    function auto() {
      clearInterval(timer);
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      timer = setInterval(function () { if (!document.hidden) ir(actual + 1); }, 6000);
    }
    pista.addEventListener('scroll', function () { clearTimeout(pista._t); pista._t = setTimeout(marcar, 80); }, { passive: true });
    pista.addEventListener('pointerdown', auto);
    pista.addEventListener('touchstart', auto, { passive: true });
    root.addEventListener('mouseenter', function () { clearInterval(timer); });
    root.addEventListener('mouseleave', auto);
    root.querySelector('[data-prev]').addEventListener('click', function () { ir(actual - 1); auto(); });
    root.querySelector('[data-next]').addEventListener('click', function () { ir(actual + 1); auto(); });
    puntos.addEventListener('click', function (e) { var b = e.target.closest('[data-ir]'); if (b) { ir(+b.dataset.ir); auto(); } });
    window.addEventListener('resize', function () { pista.scrollLeft = actual * pista.clientWidth; });
    marcar(); auto();
  }

  /* Colección destacada con pestañas Todo | Plata | Oro */
  var filter = 'todo';
  function renderFeatured() {
    var list = C.PRODUCTS.filter(function (p) { return filter === 'todo' || C.tieneMetal(p, filter); });
    list.sort(ordenDestacado);
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

  /* Letrerito flotante (abajo a la izquierda): invita a personalizar la pulsera tejida.
     Se puede cerrar; al cerrarlo no vuelve a salir en 3 días. */
  function initLetrero() {
    var CLAVE = 'camelia-letrero-pulsera', DIAS = 3;
    try { if (Date.now() - (parseInt(localStorage.getItem(CLAVE), 10) || 0) < DIAS * 864e5) return; } catch (e) {}
    var p = C.PRODUCTS.find(function (x) { return x.cat === 'pulseras' && x.fotos && x.fotos.length; });
    var img = p ? '<img src="' + C.fotosDe(p, C.displayMetal(p))[0].url + '" alt="">' : C.jewelSVG('pulsera', 'oro', { variant: 'clasica' });
    var el = document.createElement('aside');
    el.className = 'letrero';
    el.setAttribute('aria-label', 'Personaliza tu pulsera tejida');
    el.innerHTML = '<a class="letrero__link" href="personaliza-pulsera.html">' +
        '<span class="letrero__img">' + img + '</span>' +
        '<span class="letrero__txt"><span class="letrero__kicker">✦ Nuevo</span><strong>Personaliza tu pulsera tejida</strong>' +
        '<span class="letrero__sub">Elige el hilo, los balines de oro 18K y el dije</span></span></a>' +
      '<button type="button" class="letrero__cerrar" aria-label="Cerrar">' + C.icon('close') + '</button>';
    document.body.appendChild(el);
    setTimeout(function () { el.classList.add('is-on'); }, 1500);
    el.querySelector('.letrero__cerrar').addEventListener('click', function () {
      el.classList.remove('is-on');
      try { localStorage.setItem(CLAVE, String(Date.now())); } catch (e) {}
      setTimeout(function () { el.remove(); }, 400);
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    paintJewels();
    initHero();
    renderCollections();
    C.catalogo.then(function () { initCarrusel(); renderFeatured(); C.observeReveal(); initLetrero(); });
    initTabs();
    initProcess();
    initSlider();
    C.observeReveal();
  });

  /* Al cambiar Plata | Oro se actualizan las joyas y los precios mostrados */
  document.addEventListener('metalchange', function () { paintJewels(); renderFeatured(); });
})();
