/* Partes compartidas por todas las páginas:
   encabezado + mega menú, menú móvil, buscador, carrito, footer,
   switch Plata | Oro, favoritos y tarjeta de producto. */

(function () {
  var C = CAMELIA;

  /* ---------- Guardado local (puede fallar en modo privado) ---------- */
  function load(key, fallback) {
    try { var v = localStorage.getItem('camelia:' + key); return v ? JSON.parse(v) : fallback; }
    catch (e) { return fallback; }
  }
  function save(key, value) {
    try { localStorage.setItem('camelia:' + key, JSON.stringify(value)); } catch (e) { /* sin almacenamiento */ }
  }
  C.load = load; C.save = save;

  /* ---------- Íconos lineales ---------- */
  var ICONS = {
    search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
    heart: '<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10Z"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
    bag: '<path d="M5 8h14l-1 12H6L5 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    close: '<path d="m6 6 12 12M18 6 6 18"/>',
    chevron: '<path d="m6 9 6 6 6-6"/>',
    arrow: '<path d="M7 17 17 7M8 7h9v9"/>',
    pin: '<path d="M12 21s-6-5.5-6-11a6 6 0 0 1 12 0c0 5.5-6 11-6 11Z"/><circle cx="12" cy="10" r="2"/>',
    whatsapp: '<path d="M4 20l1.3-4A8 8 0 1 1 8 18.7L4 20Z"/><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5l1-1.5-2-1-1 .8a4 4 0 0 1-2-2l.8-1-1-2L9 9.5Z"/>',
    instagram: '<rect x="4" y="4" width="16" height="16" rx="5"/><circle cx="12" cy="12" r="3.5"/><circle cx="17" cy="7" r=".6"/>',
    tiktok: '<path d="M14 4v10.5a3.5 3.5 0 1 1-3.5-3.5"/><path d="M14 4c.5 2.5 2.5 4 5 4"/>',
    truck: '<path d="M3 7h11v9H3zM14 10h4l3 3v3h-7"/><circle cx="7" cy="17" r="1.6"/><circle cx="17" cy="17" r="1.6"/>',
    shield: '<path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6l-7-3Z"/><path d="m9 12 2 2 4-4"/>',
    gem: '<path d="M6 4h12l3 5-9 11L3 9l3-5Z"/><path d="M3 9h18M9 4l3 16 3-16"/>',
    seal: '<circle cx="12" cy="10" r="6"/><path d="m9 15-2 6 5-2 5 2-2-6"/>',
    trash: '<path d="M5 7h14M10 7V5h4v2M7 7l1 13h8l1-13"/>',
    rotate: '<path d="M20 12a8 8 0 1 1-2.3-5.7"/><path d="M20 4v4h-4"/>',
    cube: '<path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z"/><path d="M12 12 4 7.5M12 12l8-4.5M12 12v9"/>',
    sparkle: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M6 18l2.5-2.5M15.5 8.5 18 6"/>',
  };
  C.icon = function (name, cls) {
    return '<svg class="icon ' + (cls || '') + '" viewBox="0 0 24 24" aria-hidden="true">' + (ICONS[name] || '') + '</svg>';
  };

  /* ---------- Estado global ---------- */
  var state = {
    metal: load('metal', 'oro'),
    cart: load('cart', []),
    favs: load('favs', []),
  };
  C.state = state;

  /* ---------- Encabezado ---------- */
  function headerHTML() {
    var nav = ['oro', 'plata'].map(function (metal) {
      return '<li class="nav__item" data-grupo="' + metal + '">' +
        '<a class="nav__link" href="categoria.html?metal=' + metal + '" aria-haspopup="true" aria-expanded="false">' +
        '<i class="dot dot--' + metal + '"></i>' + C.METALS[metal].label + C.icon('chevron', 'nav__chev') + '</a></li>';
    }).join('') +
      '<li class="nav__item"><a class="nav__link" href="personaliza-pulsera.html">Personaliza tu pulsera</a></li>';

    return '' +
      '<div class="topbar"><div class="container topbar__inner">' +
        '<span class="topbar__left">' + C.icon('pin') + 'Hecha en Colombia</span>' +
        '<span class="topbar__center">✦ Oro 18K certificado de por vida · Envío gratis desde $300.000</span>' +
        '<a class="topbar__right" href="https://wa.me/570000000000" target="_blank" rel="noopener">' + C.icon('whatsapp') + 'Escríbenos</a>' +
      '</div></div>' +
      '<div class="masthead"><div class="container masthead__inner">' +
        '<button class="icon-btn masthead__menu" data-open-mobile aria-label="Abrir menú">' + C.icon('menu') + '</button>' +
        '<div class="metal-switch" role="group" aria-label="Ver joyas en">' +
          '<span class="metal-switch__thumb" aria-hidden="true"></span>' +
          '<button type="button" data-metal="plata">Plata</button>' +
          '<button type="button" data-metal="oro">Oro</button>' +
        '</div>' +
        '<a class="logo" href="index.html" aria-label="Camelia, inicio">' +
          '<span class="logo__name">CAMELIA</span><span class="logo__tag">Joyería colombiana</span></a>' +
        '<div class="masthead__actions">' +
          '<button class="icon-btn" data-open-search aria-label="Buscar">' + C.icon('search') + '</button>' +
          '<a class="icon-btn hide-sm" href="categoria.html?favoritos=1" aria-label="Favoritos">' + C.icon('heart') + '<span class="badge-count" data-fav-count hidden></span></a>' +
          '<button class="icon-btn" data-cuenta aria-label="Entrar o crear cuenta">' + C.icon('user') + '</button>' +
          '<button class="icon-btn" data-open-cart aria-label="Bolsa de compras">' + C.icon('bag') + '<span class="badge-count" data-cart-count hidden></span></button>' +
        '</div>' +
      '</div></div>' +
      '<div class="mobile-metal"><div class="metal-switch" role="group" aria-label="Ver joyas en">' +
        '<span class="metal-switch__thumb" aria-hidden="true"></span>' +
        '<button type="button" data-metal="plata">Plata</button><button type="button" data-metal="oro">Oro</button></div></div>' +
      '<nav class="nav" aria-label="Categorías"><div class="container">' +
        '<ul class="nav__list">' + nav +
          '<li class="nav__item"><a class="nav__link nav__link--cta" href="disena.html">Diseña tu joya ✦</a></li>' +
        '</ul></div>' +
        '<div class="mega" hidden><div class="container mega__inner" data-mega-content></div></div>' +
      '</nav>';
  }

  /* Contenido del mega menú, igual de ordenado que en Kevin's: categoría · metal · piedra/precio · destacados */
  /* Ícono pequeño de joya para cada opción del menú (como los íconos de Kevin's) */
  var VARIANTS = ['clasica', 'minimal', 'torcida', 'geometrica', 'organica', 'sello'];
  function miniJewel(shape, i, metal, stone) {
    return '<span class="mega__ico">' + C.jewelSVG(shape, metal || 'plata', { variant: VARIANTS[i % VARIANTS.length], stone: stone }) + '</span>';
  }

  /* Piedra sugerida para el ícono según el nombre de la subcategoría */
  function piedraDe(sub) {
    return /esmeralda/i.test(sub) ? 'color' : /diamante|compromiso/i.test(sub) ? 'circon' : undefined;
  }
  function urlCat(metal, cat, sub) {
    return 'categoria.html?metal=' + metal + '&cat=' + cat + (sub ? '&sub=' + encodeURIComponent(sub) : '');
  }

  /* Mega menú de un metal: una columna por tipo de joya con sus subcategorías.
     Los tipos con pocas opciones (cadenas, pulseras, argollas, juegos) se apilan en una sola columna. */
  function megaHTML(metal) {
    var cats = C.categoriasDe(metal);
    var grandes = cats.filter(function (c) { return ['anillos', 'aretes', 'dijes'].indexOf(c.id) > -1; });
    var chicas = cats.filter(function (c) { return grandes.indexOf(c) < 0; });
    function bloque(cat) {
      return '<p class="mega__title"><a href="' + urlCat(metal, cat.id) + '">' + cat.name + '</a></p><ul class="mega__list">' +
        cat.subs[metal].map(function (s, i) {
          return '<li><a href="' + urlCat(metal, cat.id, s) + '">' + miniJewel(cat.shape, i, metal, piedraDe(s)) + s + '</a></li>';
        }).join('') + '</ul>';
    }
    /* Si un tipo tiene una sola opción con su mismo nombre (Pulseras → Pulseras), se muestra una vez, como enlace directo */
    var unica = function (c) { var s = c.subs[metal]; return s.length === 1 && s[0].toLowerCase() === (c.shortName || c.name).toLowerCase(); };
    var sueltas = chicas.filter(unica);
    var cols = grandes.map(function (c) { return '<div class="mega__col">' + bloque(c) + '</div>'; });
    var pila = chicas.filter(function (c) { return !unica(c); }).map(bloque);
    if (sueltas.length) pila.push('<p class="mega__title">Más joyas</p><ul class="mega__list">' + sueltas.map(function (c, i) {
      return '<li><a href="' + urlCat(metal, c.id, c.subs[metal][0]) + '">' + miniJewel(c.shape, i, metal) + c.name + '</a></li>';
    }).join('') + '</ul>');
    if (pila.length) cols.push('<div class="mega__col">' + pila.join('<div class="mega__label-gap"></div>') + '</div>');
    var destacado = C.PRODUCTS.find(function (p) { return p.metals[metal] && p.model; }) || C.PRODUCTS.find(function (p) { return p.metals[metal]; });
    var shape = destacado ? C.getCategory(destacado.cat).shape : 'anillo';
    return '<div class="mega__grid" style="--cols:' + cols.length + '">' + cols.join('') +
      '<div class="mega__feature">' +
        '<a class="mega__promo" href="categoria.html?metal=' + metal + '">' + C.jewelSVG(shape, metal, { variant: destacado && destacado.variant, stone: destacado && destacado.stone }) + '</a>' +
        '<a class="mega__more" href="categoria.html?metal=' + metal + '">Ver todo en ' + C.METALS[metal].label + ' ' + C.icon('chevron', 'icon--right') + '</a>' +
        (metal === 'oro' ? '<span class="small muted">' + C.CERTIFICADO + '</span>' : '') +
        '<a class="link-arrow" href="disena.html">o diseña tu joya desde cero ' + C.icon('arrow') + '</a></div></div>';
  }

  function initMegaMenu(root) {
    var mega = root.querySelector('.mega');
    var content = root.querySelector('[data-mega-content]');
    var items = root.querySelectorAll('.nav__item[data-grupo]');
    var closeTimer, current = null;

    function open(item) {
      clearTimeout(closeTimer);
      if (current === item) return;
      if (current) close(true);
      current = item;
      content.innerHTML = megaHTML(item.dataset.grupo);
      mega.hidden = false;
      requestAnimationFrame(function () { mega.classList.add('is-open'); });
      item.classList.add('is-active');
      item.querySelector('.nav__link').setAttribute('aria-expanded', 'true');
    }
    function close(instant) {
      if (!current) return;
      current.classList.remove('is-active');
      current.querySelector('.nav__link').setAttribute('aria-expanded', 'false');
      current = null;
      mega.classList.remove('is-open');
      if (instant) { mega.hidden = true; return; }
      setTimeout(function () { if (!current) mega.hidden = true; }, 250);
    }
    function scheduleClose() { closeTimer = setTimeout(close, 180); }

    items.forEach(function (item) {
      item.addEventListener('mouseenter', function () { if (matchMedia('(min-width: 1025px)').matches) open(item); });
      item.addEventListener('mouseleave', scheduleClose);
      item.querySelector('.nav__link').addEventListener('focus', function () { open(item); });
    });
    root.querySelectorAll('.nav__item:not([data-grupo])').forEach(function (i) {
      i.addEventListener('mouseenter', function () { close(); });
    });
    mega.addEventListener('mouseenter', function () { clearTimeout(closeTimer); });
    mega.addEventListener('mouseleave', scheduleClose);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') close(); });
    document.addEventListener('focusin', function (e) { if (!root.querySelector('.nav').contains(e.target)) close(); });
  }

  /* ---------- Menú móvil ---------- */
  function mobileHTML() {
    var cats = ['oro', 'plata'].map(function (metal) {
      return '<details class="mnav__group"><summary>' + C.METALS[metal].label + C.icon('chevron') + '</summary><div class="mnav__body">' +
        '<a class="mnav__todo" href="categoria.html?metal=' + metal + '">Ver todo en ' + C.METALS[metal].label + '</a>' +
        (function () {
          var unicas = [];
          var html = C.categoriasDe(metal).map(function (cat) {
            var subs = cat.subs[metal];
            if (subs.length === 1 && subs[0].toLowerCase() === (cat.shortName || cat.name).toLowerCase()) { unicas.push(cat); return ''; }
            return '<p class="mnav__tipo"><a href="' + urlCat(metal, cat.id) + '">' + cat.name + '</a></p><ul>' +
              subs.map(function (s) { return '<li><a href="' + urlCat(metal, cat.id, s) + '">' + s + '</a></li>'; }).join('') + '</ul>';
          }).join('');
          if (unicas.length) html += '<p class="mnav__tipo">Más joyas</p><ul>' + unicas.map(function (c) {
            return '<li><a href="' + urlCat(metal, c.id, c.subs[metal][0]) + '">' + c.name + '</a></li>';
          }).join('') + '</ul>';
          return html;
        })() + '</div></details>';
    }).join('') +
      '<a class="mnav__link" href="personaliza-pulsera.html">Personaliza tu pulsera tejida</a>';
    return '<div class="sheet sheet--full" data-mobile-nav hidden>' +
      '<div class="sheet__head"><span class="logo__name">CAMELIA</span>' +
      '<button class="icon-btn" data-close aria-label="Cerrar menú">' + C.icon('close') + '</button></div>' +
      '<nav class="mnav">' + cats + '<a class="mnav__cta" href="disena.html">Diseña tu joya ✦</a></nav>' +
      '<div class="mnav__foot"><a href="cuenta.html" data-cuenta-texto>Mi cuenta</a><a href="categoria.html?favoritos=1">Favoritos</a><a href="https://wa.me/570000000000">WhatsApp</a></div></div>';
  }

  /* ---------- Buscador ---------- */
  function searchHTML() {
    return '<div class="search" data-search hidden><div class="container search__inner">' +
      '<div class="search__bar">' + C.icon('search') +
      '<input type="search" placeholder="Busca anillos, aretes, oro, plata…" aria-label="Buscar joyas">' +
      '<button class="icon-btn" data-close aria-label="Cerrar buscador">' + C.icon('close') + '</button></div>' +
      '<div class="search__results" aria-live="polite"></div></div></div>';
  }

  function initSearch() {
    var box = document.querySelector('[data-search]');
    var input = box.querySelector('input');
    var results = box.querySelector('.search__results');
    function norm(s) { return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
    function render() {
      var q = norm(input.value.trim());
      if (!q) { results.innerHTML = '<p class="muted">Sugerencias: anillo, perla, oro, argollas</p>'; return; }
      var hits = C.PRODUCTS.filter(function (p) {
        var cat = C.getCategory(p.cat);
        var text = norm([p.name, p.desc, cat.name, p.sub, Object.keys(p.metals).map(function (m) { return C.METALS[m].label; }).join(' ')].join(' '));
        return q.split(/\s+/).every(function (w) { return text.indexOf(w) > -1; });
      });
      results.innerHTML = hits.length
        ? hits.slice(0, 6).map(function (p) {
            var m = C.displayMetal(p, state.metal);
            return '<a class="search__hit" href="producto.html?id=' + p.id + '"><span class="search__img">' +
              C.jewelSVG(C.getCategory(p.cat).shape, m, { variant: p.variant, stone: p.stone }) + '</span>' +
              '<span><strong>' + p.name + '</strong><br><span class="muted">' + C.METALS[m].label + ' · ' + C.formatCOP(p.metals[m]) + '</span></span></a>';
          }).join('')
        : '<p class="muted">No encontramos “' + input.value.replace(/</g, '&lt;') + '”. ¿Y si la diseñas? <a class="link-arrow" href="disena.html">Diseñar ' + C.icon('arrow') + '</a></p>';
    }
    input.addEventListener('input', render);
    document.querySelectorAll('[data-open-search]').forEach(function (b) {
      b.addEventListener('click', function () { openLayer(box); render(); setTimeout(function () { input.focus(); }, 50); });
    });
  }

  /* ---------- Carrito ---------- */
  function cartHTML() {
    return '<div class="overlay" data-overlay hidden></div>' +
      '<aside class="drawer" data-cart hidden aria-label="Bolsa de compras">' +
      '<div class="drawer__head"><h2 class="h4">Tu bolsa</h2>' +
      '<button class="icon-btn" data-close aria-label="Cerrar bolsa">' + C.icon('close') + '</button></div>' +
      '<div class="drawer__body" data-cart-items></div>' +
      '<div class="drawer__foot"><div class="drawer__total"><span>Subtotal</span><span class="price" data-cart-total></span></div>' +
      '<p class="muted small">Envío asegurado y empaque de regalo incluidos.</p>' +
      '<button class="btn btn--primary btn--block" data-checkout>Finalizar compra</button></div></aside>';
  }

  function renderCart() {
    var list = document.querySelector('[data-cart-items]');
    var total = 0;
    if (!state.cart.length) {
      list.innerHTML = '<div class="empty"><p class="h4 serif">Tu bolsa está vacía</p><p class="muted">Explora la colección o crea una pieza única.</p>' +
        '<a class="btn btn--ghost" href="categoria.html">Ver joyas</a></div>';
    } else {
      list.innerHTML = state.cart.map(function (item, i) {
        total += item.price * item.qty;
        return '<div class="cart-item"><div class="cart-item__img">' + C.jewelSVG(item.shape, item.metal, item.opts) + '</div>' +
          '<div class="cart-item__info"><strong>' + item.name + '</strong><span class="muted small">' + item.detail + '</span>' +
          '<div class="qty"><button data-qty="' + i + '" data-d="-1" aria-label="Quitar uno">−</button><span>' + item.qty + '</span>' +
          '<button data-qty="' + i + '" data-d="1" aria-label="Agregar uno">+</button></div></div>' +
          '<div class="cart-item__side"><span class="price">' + C.formatCOP(item.price * item.qty) + '</span>' +
          '<button class="icon-btn" data-remove="' + i + '" aria-label="Eliminar">' + C.icon('trash') + '</button></div></div>';
      }).join('');
    }
    document.querySelector('[data-cart-total]').textContent = C.formatCOP(total);
    var count = state.cart.reduce(function (n, i) { return n + i.qty; }, 0);
    document.querySelectorAll('[data-cart-count]').forEach(function (el) { el.textContent = count; el.hidden = !count; });
  }

  C.addToCart = function (item) {
    var same = state.cart.find(function (i) { return i.key === item.key; });
    if (same) same.qty++; else state.cart.push(Object.assign({ qty: 1 }, item));
    save('cart', state.cart);
    renderCart();
    openLayer(document.querySelector('[data-cart]'));
  };

  C.addProductToCart = function (product, metal, extra) {
    extra = extra || {};
    var cat = C.getCategory(product.cat);
    C.addToCart({
      key: product.id + '|' + metal + '|' + (extra.size || ''),
      name: product.name,
      detail: C.METALS[metal].label + (extra.size ? ' · Talla ' + extra.size : ''),
      price: product.metals[metal],
      shape: cat.shape, metal: metal,
      opts: { variant: product.variant, stone: product.stone },
    });
  };

  function initCart() {
    var drawer = document.querySelector('[data-cart]');
    drawer.addEventListener('click', function (e) {
      var q = e.target.closest('[data-qty]'), r = e.target.closest('[data-remove]');
      if (q) {
        var item = state.cart[+q.dataset.qty];
        item.qty += +q.dataset.d;
        if (item.qty < 1) state.cart.splice(+q.dataset.qty, 1);
      } else if (r) {
        state.cart.splice(+r.dataset.remove, 1);
      } else return;
      save('cart', state.cart);
      renderCart();
    });
    document.querySelectorAll('[data-open-cart]').forEach(function (b) {
      b.addEventListener('click', function () { openLayer(drawer); });
    });
    renderCart();
  }

  /* ---------- Capas (carrito, menú móvil, buscador) ---------- */
  var openEl = null, lastFocus = null;
  function openLayer(el) {
    if (openEl && openEl !== el) closeLayer();
    lastFocus = document.activeElement;
    openEl = el;
    el.hidden = false;
    document.querySelector('[data-overlay]').hidden = false;
    document.body.classList.add('no-scroll');
    requestAnimationFrame(function () {
      el.classList.add('is-open');
      document.querySelector('[data-overlay]').classList.add('is-open');
    });
  }
  function closeLayer() {
    if (!openEl) return;
    var el = openEl;
    openEl = null;
    el.classList.remove('is-open');
    var ov = document.querySelector('[data-overlay]');
    ov.classList.remove('is-open');
    document.body.classList.remove('no-scroll');
    setTimeout(function () { if (openEl !== el) el.hidden = true; if (!openEl) ov.hidden = true; }, 350);
    if (lastFocus) lastFocus.focus();
  }
  C.openLayer = openLayer;

  /* ---------- Switch Plata | Oro ---------- */
  function applyMetal(metal, silent) {
    state.metal = metal;
    document.documentElement.dataset.metal = metal;
    document.querySelectorAll('.metal-switch button').forEach(function (b) {
      b.setAttribute('aria-pressed', b.dataset.metal === metal);
    });
    save('metal', metal);
    if (!silent) document.dispatchEvent(new CustomEvent('metalchange', { detail: metal }));
  }
  C.setMetal = applyMetal;

  /* ---------- Favoritos ---------- */
  C.isFav = function (id) { return state.favs.indexOf(id) > -1; };
  function updateFavCount() {
    document.querySelectorAll('[data-fav-count]').forEach(function (el) { el.textContent = state.favs.length; el.hidden = !state.favs.length; });
  }
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-fav]');
    if (!b) return;
    e.preventDefault();
    var id = b.dataset.fav, i = state.favs.indexOf(id);
    if (i > -1) state.favs.splice(i, 1); else state.favs.push(id);
    save('favs', state.favs);
    document.querySelectorAll('[data-fav="' + id + '"]').forEach(function (el) {
      el.classList.toggle('is-fav', i === -1);
      el.setAttribute('aria-pressed', i === -1);
    });
    updateFavCount();
  });

  /* ---------- Fotos reales desde la base de datos ---------- */
  /* Elige las fotos de un producto para un metal: primero las de ese metal, luego las generales */
  C.fotosDe = function (p, metal) {
    var fotos = p.fotos || [];
    var delMetal = fotos.filter(function (f) { return f.metal === metal; });
    var generales = fotos.filter(function (f) { return !f.metal; });
    var lista = delMetal.concat(generales);
    return lista.length ? lista : fotos;
  };
  C.imgFoto = function (f, cls) {
    return '<img class="' + (cls || '') + ' foto--' + (f.tipo || 'producto') + '" src="' + f.url + '" alt="' + String(f.alt || f.descripcion || '').replace(/"/g, '&quot;') + '" loading="lazy" decoding="async">';
  };
  /* Lee las fotos directo de Supabase con la clave pública: las reglas de la base
     de datos solo dejan ver productos publicados, así que no hace falta servidor. */
  C.cargarFotos = function () {
    var S = C.SUPABASE;
    if (!S || !window.fetch) return;
    var campos = 'id,imagenes(archivo,metal,orden,origen,tipo,alt,descripcion)';
    fetch(S.url + '/rest/v1/productos?select=' + encodeURIComponent(campos) + '&activo=eq.true&estado=eq.publicado', {
      headers: { apikey: S.key },
    })
      .then(function (r) { return r.ok ? r.json() : []; })
      .then(function (lista) {
        var hay = false;
        lista.forEach(function (item) {
          var p = C.getProduct(item.id);
          if (!p || !item.imagenes || !item.imagenes.length) return;
          p.fotos = item.imagenes
            .sort(function (a, b) { return a.orden - b.orden; })
            .map(function (f) {
              f.url = S.url + '/storage/v1/object/public/joyas/' + f.archivo.split('/').map(encodeURIComponent).join('/');
              return f;
            });
          hay = true;
        });
        if (hay) document.dispatchEvent(new CustomEvent('fotoschange'));
      })
      .catch(function () { /* sin API: se quedan los dibujos */ });
  };

  /* ---------- Tarjeta de producto ---------- */
  function vistasTarjeta(p, cat, m) {
    var fotos = C.fotosDe(p, m);
    if (fotos.length) {
      var b = fotos[1] || fotos[0];
      return '<span class="card__view card__view--foto card__view--a">' + C.imgFoto(fotos[0]) + '</span>' +
        '<span class="card__view card__view--foto card__view--b">' + C.imgFoto(b) + '</span>' +
        (fotos[0].origen === 'ia' ? '<span class="tag tag--ilustrativa">Imagen ilustrativa</span>' : '');
    }
    return '<span class="card__view card__view--a">' + C.jewelSVG(cat.shape, m, { variant: p.variant, stone: p.stone }) + '</span>' +
      '<span class="card__view card__view--b">' + C.jewelSVG(cat.shape, m, { variant: p.variant, stone: p.stone, angle: 40 }) + '</span>';
  }

  C.productCard = function (p, preferredMetal) {
    var cat = C.getCategory(p.cat);
    var m = C.displayMetal(p, preferredMetal || state.metal);
    var fav = C.isFav(p.id);
    return '<article class="card reveal"><div class="card__frame">' +
      '<a class="card__media" href="producto.html?id=' + p.id + '&metal=' + m + '">' +
        vistasTarjeta(p, cat, m) +
        '<span class="tag"><i class="dot dot--' + m + '"></i>' + C.METALS[m].label + '</span>' +
        (p.custom ? '<span class="tag tag--soft">Personalizable</span>' : '') +
        (p.model ? '<span class="tag tag--3d">' + C.icon('rotate') + '3D</span>' : '') +
      '</a>' +
      '<button class="card__fav' + (fav ? ' is-fav' : '') + '" data-fav="' + p.id + '" aria-pressed="' + fav + '" aria-label="Agregar ' + p.name + ' a favoritos">' + C.icon('heart') + '</button>' +
      '<button class="card__add" data-add="' + p.id + '" data-metal="' + m + '">Agregar a la bolsa</button></div>' +
      '<div class="card__body"><h3 class="card__name">' + p.name + '</h3>' +
        '<p class="card__desc">' + C.METALS[m].short + ' · ' + p.desc + '</p>' +
        '<p class="card__price"><span class="price">' + C.formatCOP(p.metals[m]) + '</span>' +
        (Object.keys(p.metals).length > 1 ? '<span class="card__alt">También en ' + C.METALS[m === 'oro' ? 'plata' : 'oro'].short.toLowerCase() + '</span>' : '') +
      '</p></div></article>';
  };

  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-add]');
    if (!b) return;
    C.addProductToCart(C.getProduct(b.dataset.add), b.dataset.metal);
  });

  /* ---------- Footer ---------- */
  function footerHTML() {
    var shop = C.CATEGORIES.filter(function (c) { return c.home !== false; }).map(function (c) { return '<li><a href="categoria.html?cat=' + c.id + '">' + (c.shortName || c.name) + '</a></li>'; }).join('');
    return '<div class="footer__news"><div class="container footer__news-inner">' +
        '<div><h2 class="h3 serif">Tu próximo universo<br>empieza aquí.</h2><p class="muted">Nuevas piezas, ideas y un poco de inspiración.</p></div>' +
        '<form class="newsletter" data-newsletter><label class="label" for="nl-email">Tu correo electrónico</label>' +
        '<div class="newsletter__row"><input id="nl-email" type="email" required placeholder="nombre@correo.com">' +
        '<button class="btn btn--primary" type="submit">Quiero ser parte</button></div>' +
        '<p class="muted small" data-nl-msg>Al suscribirte aceptas nuestra política de tratamiento de datos.</p></form>' +
      '</div></div>' +
      '<div class="container footer__main">' +
        '<div class="footer__brand"><span class="logo__name">CAMELIA</span><p class="label">Dos metales, un universo.</p><p class="cert-line">Todo nuestro oro es 18K con certificado de autenticidad de por vida.</p>' +
          '<div class="footer__social">' +
            '<a class="icon-btn" href="#" aria-label="Instagram">' + C.icon('instagram') + '</a>' +
            '<a class="icon-btn" href="#" aria-label="TikTok">' + C.icon('tiktok') + '</a>' +
            '<a class="icon-btn" href="https://wa.me/570000000000" aria-label="WhatsApp">' + C.icon('whatsapp') + '</a></div></div>' +
        '<div><p class="label">Tienda</p><ul>' + shop + '</ul></div>' +
        '<div><p class="label">Diseña</p><ul><li><a href="disena.html">Configurador 3D</a></li><li><a href="disena.html?modo=ia">Crear con IA</a></li><li><a href="index.html#proceso">Cómo lo hacemos</a></li></ul></div>' +
        '<div><p class="label">Ayuda</p><ul><li><a href="#">Envíos</a></li><li><a href="#">Cambios y devoluciones</a></li><li><a href="#">Guía de tallas</a></li><li><a href="#">Cuidado de tu joya</a></li></ul></div>' +
        '<div><p class="label">Marca</p><ul><li><a href="#">Nosotros</a></li><li><a href="#">Contacto</a></li><li><a href="#">Preguntas frecuentes</a></li></ul></div>' +
      '</div>' +
      '<div class="container footer__legal">' +
        '<span>© ' + new Date().getFullYear() + ' Camelia · Hecho en Colombia</span>' +
        '<span class="footer__pay"><span>PSE</span><span>Nequi</span><span>Visa</span><span>Mastercard</span></span>' +
        '<span><a href="#">Privacidad</a> · <a href="#">Términos</a> · <a href="#">SIC</a></span></div>';
  }

  /* ---------- Aparición suave al hacer scroll ---------- */
  var io = 'IntersectionObserver' in window ? new IntersectionObserver(function (entries) {
    entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
  }, { rootMargin: '0px 0px -8% 0px' }) : null;
  C.observeReveal = function (scope) {
    (scope || document).querySelectorAll('.reveal:not(.is-in)').forEach(function (el) {
      if (io) io.observe(el); else el.classList.add('is-in');
    });
  };

  /* ---------- Arranque ---------- */
  document.addEventListener('DOMContentLoaded', function () {
    var header = document.getElementById('site-header');
    header.className = 'site-header';
    header.innerHTML = headerHTML();
    document.getElementById('site-footer').className = 'site-footer';
    document.getElementById('site-footer').innerHTML = footerHTML();
    document.body.insertAdjacentHTML('beforeend', cartHTML() + mobileHTML() + searchHTML() +
      '<a class="wa-float" href="https://wa.me/570000000000" target="_blank" rel="noopener" aria-label="Escríbenos por WhatsApp">' + C.icon('whatsapp') + '</a>');

    initMegaMenu(header);
    initCart();
    initSearch();
    updateFavCount();
    applyMetal(state.metal, true);

    header.querySelectorAll('.metal-switch button').forEach(function (b) {
      b.addEventListener('click', function () { applyMetal(b.dataset.metal); });
    });
    document.querySelectorAll('[data-open-mobile]').forEach(function (b) {
      b.addEventListener('click', function () { openLayer(document.querySelector('[data-mobile-nav]')); });
    });
    document.addEventListener('click', function (e) {
      if (e.target.closest('[data-close]') || e.target.matches('[data-overlay]')) closeLayer();
    });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeLayer(); });

    var nl = document.querySelector('[data-newsletter]');
    nl.addEventListener('submit', function (e) {
      e.preventDefault();
      nl.querySelector('[data-nl-msg]').textContent = '¡Listo! Te escribiremos pronto.';
      nl.reset();
    });

    var onScroll = function () { header.classList.toggle('is-scrolled', window.scrollY > 8); };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    C.observeReveal();
    C.cargarFotos();
  });
})();
