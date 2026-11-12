/* Página de categoría: filtros laterales, orden y resultados.
   Los filtros viven en la URL (?cat=anillos&metal=oro...) para poder compartir el enlace. */

(function () {
  var C = CAMELIA;
  var params = new URLSearchParams(location.search);

  var f = {
    cat: params.getAll('cat'),
    sub: params.get('sub') || '',
    metal: params.getAll('metal'),
    piedra: params.getAll('piedra'),
    precio: params.getAll('precio'),
    custom: params.get('custom') === '1',
    favoritos: params.get('favoritos') === '1',
    sort: 'destacados',
  };

  function priceFor(p) {
    var m = f.metal.length === 1 && C.tieneMetal(p, f.metal[0]) ? f.metal[0] : C.displayMetal(p, C.state.metal);
    return p.metals[m];
  }

  function matches(p, skip) {
    if (skip !== 'cat' && f.cat.length && f.cat.indexOf(p.cat) < 0) return false;
    if (skip !== 'sub' && f.sub && p.sub !== f.sub) return false;
    if (skip !== 'metal' && f.metal.length && !f.metal.some(function (m) { return C.tieneMetal(p, m); })) return false;
    if (skip !== 'piedra' && f.piedra.length && f.piedra.indexOf(p.stone) < 0) return false;
    if (skip !== 'precio' && f.precio.length && !f.precio.some(function (id) {
      var r = C.PRICE_RANGES.find(function (x) { return x.id === id; });
      return Object.keys(p.metals).some(function (m) { return p.metals[m] > 0 && p.metals[m] >= r.min && p.metals[m] < r.max; });
    })) return false;
    if (skip !== 'custom' && f.custom && !p.custom) return false;
    if (f.favoritos && !C.isFav(p.id)) return false;
    return true;
  }

  function group(title, key, options) {
    return '<div class="filters__group"><span class="label">' + title + '</span>' + options.map(function (o) {
      var count = C.PRODUCTS.filter(function (p) { return matches(p, key) && o.test(p); }).length;
      var checked = key === 'custom' ? f.custom : key === 'sub' ? f.sub === o.id : f[key].indexOf(o.id) > -1;
      return '<label class="check"><input type="checkbox" data-key="' + key + '" value="' + o.id + '"' + (checked ? ' checked' : '') + '>' +
        (o.swatch ? '<span class="swatch swatch--' + o.swatch + '"></span>' : '') + o.label + '<span class="count">' + count + '</span></label>';
    }).join('') + '</div>';
  }

  /* Subcategorías del tipo elegido, según el metal (Oro y Plata tienen listas distintas) */
  function subGroup() {
    if (f.cat.length !== 1) return '';
    var cat = C.getCategory(f.cat[0]);
    var metales = f.metal.length ? f.metal : ['oro', 'plata'];
    var subs = [];
    metales.forEach(function (m) { cat.subs[m].forEach(function (s) { if (subs.indexOf(s) < 0) subs.push(s); }); });
    if (f.sub && subs.indexOf(f.sub) < 0) subs.push(f.sub);
    if (subs.length < 2) return '';
    return group('Categoría', 'sub', subs.map(function (s) {
      return { id: s, label: s, test: function (p) { return p.sub === s; } };
    }));
  }

  function renderFilters() {
    document.querySelector('[data-filter-groups]').innerHTML =
      group('Tipo de joya', 'cat', C.CATEGORIES.filter(function (c) {
        return !f.metal.length || f.metal.some(function (m) { return c.subs[m].length; });
      }).map(function (c) {
        return { id: c.id, label: c.shortName || c.name, test: function (p) { return p.cat === c.id; } };
      })) +
      subGroup() +
      group('Metal', 'metal', [
        { id: 'plata', label: 'Plata 925', swatch: 'plata', test: function (p) { return C.tieneMetal(p, 'plata'); } },
        { id: 'oro', label: 'Oro 18K', swatch: 'oro', test: function (p) { return C.tieneMetal(p, 'oro'); } },
      ]) +
      group('Precio', 'precio', C.PRICE_RANGES.map(function (r) {
        return { id: r.id, label: r.label, test: function (p) { return Object.keys(p.metals).some(function (m) { return p.metals[m] > 0 && p.metals[m] >= r.min && p.metals[m] < r.max; }); } };
      })) +
      group('Piedra', 'piedra', Object.keys(C.STONES).map(function (k) {
        return { id: k, label: C.STONES[k], test: function (p) { return p.stone === k; } };
      })) +
      group('Diseño', 'custom', [{ id: '1', label: 'Personalizable', test: function (p) { return p.custom; } }]);
  }

  function renderResults() {
    var list = C.PRODUCTS.filter(function (p) { return matches(p); });
    if (f.sort === 'menor') list.sort(function (a, b) { return priceFor(a) - priceFor(b); });
    if (f.sort === 'mayor') list.sort(function (a, b) { return priceFor(b) - priceFor(a); });
    if (f.sort === 'nombre') list.sort(function (a, b) { return a.name.localeCompare(b.name, 'es'); });

    var preferred = f.metal.length === 1 ? f.metal[0] : null;
    var box = document.querySelector('[data-results]');
    box.innerHTML = list.length ? list.map(function (p) { return C.productCard(p, preferred); }).join('')
      : '<div class="empty" style="grid-column:1/-1"><p class="h4 serif">No hay joyas con estos filtros</p>' +
        '<p class="muted">Prueba quitando alguno, o crea exactamente la que buscas.</p>' +
        '<a class="btn btn--primary" href="disena.html">Diseñar mi joya</a></div>';
    document.querySelector('[data-count]').textContent = list.length + (list.length === 1 ? ' joya' : ' joyas');
    C.observeReveal(box);

    /* Chips de filtros activos */
    var chips = [];
    f.cat.forEach(function (id) { chips.push({ key: 'cat', id: id, label: C.getCategory(id).shortName || C.getCategory(id).name }); });
    if (f.sub) chips.push({ key: 'sub', id: f.sub, label: f.sub });
    f.metal.forEach(function (id) { chips.push({ key: 'metal', id: id, label: C.METALS[id].label }); });
    f.precio.forEach(function (id) { chips.push({ key: 'precio', id: id, label: C.PRICE_RANGES.find(function (r) { return r.id === id; }).label }); });
    f.piedra.forEach(function (id) { chips.push({ key: 'piedra', id: id, label: C.STONES[id] }); });
    if (f.custom) chips.push({ key: 'custom', id: '1', label: 'Personalizable' });
    if (f.favoritos) chips.push({ key: 'favoritos', id: '1', label: 'Mis favoritos' });
    document.querySelector('[data-active]').innerHTML = chips.map(function (c) {
      return '<button class="chip" data-remove-filter="' + c.key + '" data-id="' + c.id + '">' + c.label + ' ✕</button>';
    }).join('') + (chips.length > 1 ? '<button class="link-arrow small" data-clear>Limpiar todo</button>' : '');
  }

  function renderHead() {
    var cat = f.cat.length === 1 ? C.getCategory(f.cat[0]) : null;
    var metal = f.metal.length === 1 ? C.METALS[f.metal[0]].label : '';
    var base = f.sub || (cat ? cat.name : '');
    var title = f.favoritos ? 'Mis favoritos'
      : base ? base + (metal ? ' en ' + metal : '')
      : metal ? 'Joyas en ' + metal : 'Todas las joyas';
    document.querySelector('[data-title]').textContent = title;
    document.querySelector('[data-crumb]').textContent = [metal, cat ? cat.name : ''].filter(Boolean).join(' · ') || 'Joyas';
    document.title = title + ' · Camelia';
    if (cat) document.querySelector('[data-design-link]').href = cat.id === 'pulseras' ? 'personaliza-pulsera.html' : 'disena.html?tipo=' + cat.shape;
    var promo = document.querySelector('[data-tj-promo]');
    if (cat && cat.id === 'pulseras' && !promo) {
      document.querySelector('.page-head .container').insertAdjacentHTML('beforeend',
        '<a class="tj-promo" data-tj-promo href="personaliza-pulsera.html"><div><strong>Personaliza tu pulsera tejida</strong>' +
        '<p>Elige el hilo, el ancho y los balines de oro 18K certificado de por vida. Mírala en 3D antes de pedirla.</p></div>' +
        '<span class="btn btn--primary">Empezar a diseñar</span></a>');
    } else if (promo && !(cat && cat.id === 'pulseras')) promo.remove();
  }

  function syncURL() {
    var q = new URLSearchParams();
    f.cat.forEach(function (v) { q.append('cat', v); });
    if (f.sub) q.set('sub', f.sub);
    f.metal.forEach(function (v) { q.append('metal', v); });
    f.piedra.forEach(function (v) { q.append('piedra', v); });
    f.precio.forEach(function (v) { q.append('precio', v); });
    if (f.custom) q.set('custom', '1');
    if (f.favoritos) q.set('favoritos', '1');
    var s = q.toString();
    history.replaceState(null, '', location.pathname + (s ? '?' + s : ''));
  }

  function update() { syncURL(); renderHead(); renderFilters(); renderResults(); }

  document.addEventListener('DOMContentLoaded', function () {
    C.catalogo.then(update);

    document.querySelector('[data-filters]').addEventListener('change', function (e) {
      var input = e.target, key = input.dataset.key;
      if (!key) return;
      if (key === 'custom') f.custom = input.checked;
      else if (key === 'sub') f.sub = input.checked ? input.value : '';
      else {
        var i = f[key].indexOf(input.value);
        if (input.checked && i < 0) f[key].push(input.value);
        if (!input.checked && i > -1) f[key].splice(i, 1);
        if (key === 'cat') f.sub = '';
      }
      update();
    });

    document.querySelector('[data-active]').addEventListener('click', function (e) {
      if (e.target.closest('[data-clear]')) {
        f.cat = []; f.sub = ''; f.metal = []; f.piedra = []; f.precio = []; f.custom = false; f.favoritos = false;
        return update();
      }
      var b = e.target.closest('[data-remove-filter]');
      if (!b) return;
      var key = b.dataset.removeFilter;
      if (key === 'custom' || key === 'favoritos') f[key] = false;
      else if (key === 'sub') f.sub = '';
      else f[key] = f[key].filter(function (v) { return v !== b.dataset.id; });
      update();
    });

    document.querySelector('[data-sort]').addEventListener('change', function (e) { f.sort = e.target.value; renderResults(); });

    /* Filtros en móvil: panel lateral */
    var panel = document.querySelector('[data-filters]');
    document.querySelector('[data-open-filters]').addEventListener('click', function () {
      panel.classList.add('is-open');
      var ov = document.querySelector('[data-overlay]');
      ov.hidden = false;
      requestAnimationFrame(function () { ov.classList.add('is-open'); });
      ov.addEventListener('click', function close() {
        panel.classList.remove('is-open'); ov.classList.remove('is-open');
        setTimeout(function () { ov.hidden = true; }, 300);
        ov.removeEventListener('click', close);
      });
    });
  });

  document.addEventListener('metalchange', renderResults);
  document.addEventListener('click', function (e) { if (f.favoritos && e.target.closest('[data-fav]')) setTimeout(renderResults, 0); });
})();
