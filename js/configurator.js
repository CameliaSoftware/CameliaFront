/* Configurador "Diseña tu joya": modo manual (paso a paso) y modo IA.
   Uso: CAMELIA.mountStudio(elemento) */

(function () {
  var C = CAMELIA;

  var TYPES = [
    { id: 'anillo', name: 'Anillo', base: 159000, sizes: true },
    { id: 'dije', name: 'Dije', base: 119000 },
    { id: 'arete', name: 'Aretes', base: 139000 },
    { id: 'pulsera', name: 'Pulsera', base: 179000 },
    { id: 'argolla', name: 'Argollas', base: 329000, sizes: true },
  ];
  var SHAPES = [
    { id: 'clasica', name: 'Clásica' }, { id: 'minimal', name: 'Minimal' }, { id: 'torcida', name: 'Torcida' },
    { id: 'geometrica', name: 'Geométrica' }, { id: 'organica', name: 'Orgánica' }, { id: 'sello', name: 'Sello' },
  ];
  var STONES = [
    { id: 'ninguna', name: 'Ninguna', extra: 0 },
    { id: 'circon', name: 'Circón', extra: 40000 },
    { id: 'color', name: 'Piedra de color', extra: 60000 },
  ];
  var FINISH = [{ id: 'espejo', name: 'Espejo' }, { id: 'mate', name: 'Mate' }];
  var SIZES = [5, 6, 7, 8, 9, 10, 11];
  var CHIPS = ['Iniciales entrelazadas', 'Inspirado en el mar', 'Mi mascota', 'Geometría sagrada', 'Flor de café'];

  function find(list, id) { return list.find(function (x) { return x.id === id; }); }

  function price(s) {
    var t = find(TYPES, s.tipo);
    var p = t.base * (s.metal === 'oro' ? 6.8 : 1) * (1 + (s.grosor - 5) * 0.06);
    p += find(STONES, s.piedra).extra * (s.metal === 'oro' ? 2 : 1);
    if (s.grabado.trim()) p += 25000;
    return Math.round(p / 1000) * 1000;
  }

  function optionGroup(name, list, current, cls) {
    return list.map(function (o) {
      return '<button type="button" class="option ' + (cls || '') + '" data-set="' + name + '" data-value="' + o.id + '" aria-pressed="' + (o.id === current) + '">' +
        (o.html || '') + o.name + '</button>';
    }).join('');
  }

  C.mountStudio = function (root, initial) {
    var params = new URLSearchParams(location.search);
    var s = Object.assign({
      tipo: find(TYPES, params.get('tipo')) ? params.get('tipo') : 'anillo',
      silueta: 'organica',
      metal: C.state.metal || 'plata',
      acabado: 'espejo',
      grosor: 5,
      talla: 7,
      piedra: 'ninguna',
      grabado: '',
    }, initial || {});
    var view = { rot: 0, zoom: 1, tab: params.get('modo') === 'ia' ? 'ia' : 'manual' };

    root.innerHTML =
      '<div class="studio reveal">' +
        '<div class="studio__bar"><strong class="serif h4">Tu primera pieza</strong>' +
          '<div class="tabs" role="tablist">' +
            '<button role="tab" data-tab="manual">Diseño manual</button>' +
            '<button role="tab" data-tab="ia">Crear con IA ✦</button></div>' +
          '<button class="link-arrow" data-reset>Empezar de nuevo ' + C.icon('arrow') + '</button></div>' +
        '<div class="studio__grid" data-panel="manual">' +
          '<div class="viewer" data-viewer>' +
            '<div class="viewer__meta"><span class="label" data-meta></span><span class="label" data-shape-label></span></div>' +
            '<div class="viewer__stage" data-stage></div>' +
            '<div class="viewer__pedestal"></div>' +
            '<div class="viewer__engrave" data-engrave-preview></div>' +
            '<div class="viewer__tools">' +
              '<button data-zoom="-1" aria-label="Alejar">−</button><button data-zoom="0">100%</button><button data-zoom="1" aria-label="Acercar">+</button>' +
              '<button data-rotate>Girar 360°</button><button data-hand>Ver en mi mano</button></div>' +
          '</div>' +
          '<div class="panel">' +
            '<div><h3 class="h3">Hazla tuya.</h3><p class="muted small">Cada cambio se ve al instante en la vista previa.</p></div>' +
            '<div class="field"><span class="label">01 · Tipo de joya</span><div class="options" data-group="tipo"></div></div>' +
            '<div class="field"><span class="label">02 · Silueta</span><div class="options" data-group="silueta"></div></div>' +
            '<div class="field"><span class="label">03 · Metal</span><div class="options" data-group="metal"></div></div>' +
            '<div class="field"><span class="label">04 · Ajustes</span>' +
              '<div class="options" data-group="acabado"></div>' +
              '<div class="range" style="margin-top:12px"><span>Grosor</span><input type="range" min="1" max="10" data-range="grosor"></div>' +
              '<div class="options" data-group="piedra" style="margin-top:12px"></div></div>' +
            '<div class="field" data-size-field><span class="label">05 · Talla <a href="#" class="muted">Guía de tallas</a></span><div class="options" data-group="talla"></div></div>' +
            '<div class="field"><span class="label">06 · Grabado personal <span>Opcional · hasta 12 letras</span></span>' +
              '<input class="input" maxlength="12" placeholder="Tu historia, en una palabra" data-engrave></div>' +
            '<div class="panel__total">' +
              '<div class="panel__price"><span class="muted">Precio estimado</span><span class="price" data-price></span></div>' +
              '<p class="muted small" data-time></p>' +
              '<button class="btn btn--primary btn--block" data-add-design>Agregar a la bolsa ' + C.icon('arrow') + '</button></div>' +
          '</div>' +
        '</div>' +
        '<div class="ia" data-panel="ia" hidden>' +
          '<div><h3 class="h3">Cuéntanos tu idea.</h3><p class="muted">Escribe lo que imaginas y te mostramos cuatro propuestas.</p></div>' +
          '<form class="ia__prompt" data-ia-form><div class="ia__prompt-inner">' +
            '<textarea rows="2" placeholder="Describe tu joya… ej: un dije de colibrí minimalista en oro" data-ia-input></textarea>' +
            '<button class="btn btn--primary" type="submit">Generar ' + C.icon('sparkle') + '</button></div></form>' +
          '<div class="ia__chips">' + CHIPS.map(function (c) { return '<button type="button" class="chip" data-chip>' + c + '</button>'; }).join('') + '</div>' +
          '<div data-ia-results></div>' +
          '<p class="muted small">✦ Un diseñador revisa cada pieza antes de fabricarla.</p>' +
        '</div>' +
      '</div>';

    var $ = function (sel) { return root.querySelector(sel); };

    function render() {
      var t = find(TYPES, s.tipo);
      $('[data-group="tipo"]').innerHTML = optionGroup('tipo', TYPES.map(function (x) {
        return { id: x.id, name: x.name, html: C.jewelSVG(x.id, s.metal, { variant: 'clasica' }) };
      }), s.tipo, 'option--icon');
      $('[data-group="silueta"]').innerHTML = optionGroup('silueta', SHAPES, s.silueta);
      $('[data-group="metal"]').innerHTML = optionGroup('metal', [
        { id: 'plata', name: 'Plata 925', html: '<span class="swatch swatch--plata"></span>' },
        { id: 'oro', name: 'Oro 18K', html: '<span class="swatch swatch--oro"></span>' },
      ], s.metal);
      $('[data-group="acabado"]').innerHTML = optionGroup('acabado', FINISH, s.acabado);
      $('[data-group="piedra"]').innerHTML = optionGroup('piedra', STONES, s.piedra);
      $('[data-group="talla"]').innerHTML = optionGroup('talla', SIZES.map(function (n) { return { id: n, name: String(n) }; }), s.talla, 'option--size');
      $('[data-size-field]').hidden = !t.sizes;
      $('[data-range="grosor"]').value = s.grosor;

      var stage = $('[data-stage]');
      stage.innerHTML = C.jewelSVG(s.tipo, s.metal, { variant: s.silueta, stone: s.piedra, thickness: s.grosor, angle: s.acabado === 'mate' ? 60 : 0 });
      stage.style.filter = s.acabado === 'mate' ? 'saturate(.7) contrast(.9)' : '';
      applyView();

      $('[data-meta]').textContent = 'Vista previa · ' + C.METALS[s.metal].label;
      $('[data-shape-label]').textContent = find(SHAPES, s.silueta).name;
      $('[data-engrave-preview]').textContent = s.grabado ? '“' + s.grabado + '”' : '';
      $('[data-price]').textContent = C.formatCOP(price(s));
      $('[data-time]').textContent = 'Fabricación: ' + (s.metal === 'oro' ? '12 a 15' : '7 a 10') + ' días hábiles · Envío asegurado';
    }

    function applyView() {
      $('[data-stage]').style.transform = 'perspective(800px) rotateY(' + view.rot + 'deg) scale(' + view.zoom + ')';
    }

    function setTab(tab) {
      view.tab = tab;
      root.querySelectorAll('[data-tab]').forEach(function (b) { b.setAttribute('aria-selected', b.dataset.tab === tab); });
      $('[data-panel="manual"]').hidden = tab !== 'manual';
      $('[data-panel="ia"]').hidden = tab !== 'ia';
    }

    /* Clics de opciones */
    root.addEventListener('click', function (e) {
      var opt = e.target.closest('[data-set]');
      if (opt) {
        var key = opt.dataset.set, val = opt.dataset.value;
        s[key] = key === 'talla' ? +val : val;
        render();
        return;
      }
      var tab = e.target.closest('[data-tab]');
      if (tab) return setTab(tab.dataset.tab);
      var z = e.target.closest('[data-zoom]');
      if (z) { var d = +z.dataset.zoom; view.zoom = d === 0 ? 1 : Math.min(1.6, Math.max(.6, view.zoom + d * .15)); return applyView(); }
      if (e.target.closest('[data-rotate]')) {
        var stage = $('[data-stage]');
        view.rot += 360;
        stage.style.transition = 'transform 1.4s cubic-bezier(.22,1,.36,1)';
        applyView();
        setTimeout(function () { stage.style.transition = ''; }, 1400);
        return;
      }
      if (e.target.closest('[data-hand]')) { e.target.closest('[data-hand]').textContent = 'Próximamente'; return; }
      if (e.target.closest('[data-reset]')) { s.silueta = 'clasica'; s.piedra = 'ninguna'; s.grosor = 5; s.grabado = ''; $('[data-engrave]').value = ''; view.rot = 0; view.zoom = 1; render(); return; }
      if (e.target.closest('[data-add-design]')) {
        var t = find(TYPES, s.tipo);
        C.addToCart({
          key: 'diseno|' + JSON.stringify(s), name: t.name + ' diseñado por ti',
          detail: C.METALS[s.metal].label + ' · ' + find(SHAPES, s.silueta).name + (t.sizes ? ' · Talla ' + s.talla : '') + (s.grabado ? ' · “' + s.grabado + '”' : ''),
          price: price(s), shape: s.tipo, metal: s.metal, opts: { variant: s.silueta, stone: s.piedra, thickness: s.grosor },
        });
        return;
      }
      var chip = e.target.closest('[data-chip]');
      if (chip) { $('[data-ia-input]').value = chip.textContent; generate(); return; }
      var take = e.target.closest('[data-take]');
      if (take) { Object.assign(s, JSON.parse(take.dataset.take)); render(); setTab('manual'); root.scrollIntoView({ behavior: 'smooth' }); return; }
      var refine = e.target.closest('[data-refine]');
      if (refine) { var inp = $('[data-ia-input]'); inp.value = inp.value + ', más ' + refine.dataset.refine; generate(); }
    });

    $('[data-range="grosor"]').addEventListener('input', function (e) { s.grosor = +e.target.value; render(); });
    $('[data-engrave]').addEventListener('input', function (e) { s.grabado = e.target.value; render(); });

    /* Girar arrastrando */
    var viewer = $('[data-viewer]'), dragging = false, startX = 0, startRot = 0;
    viewer.addEventListener('pointerdown', function (e) {
      if (e.target.closest('button')) return;
      dragging = true; startX = e.clientX; startRot = view.rot; viewer.setPointerCapture(e.pointerId);
    });
    viewer.addEventListener('pointermove', function (e) { if (dragging) { view.rot = startRot + (e.clientX - startX) * .6; applyView(); } });
    viewer.addEventListener('pointerup', function () { dragging = false; });

    /* Modo IA (simulado): lee palabras clave de la descripción */
    function generate() {
      var text = $('[data-ia-input]').value.trim();
      var box = $('[data-ia-results]');
      if (!text) { $('[data-ia-input]').focus(); return; }
      box.innerHTML = '<p class="loading"><i></i><i></i><i></i> Creando propuestas…</p>';
      var low = text.toLowerCase();
      var tipo = /anillo|sello/.test(low) ? 'anillo' : /arete|candonga|topo/.test(low) ? 'arete'
        : /pulsera|esclava/.test(low) ? 'pulsera' : /argolla|matrimonio|boda/.test(low) ? 'argolla' : 'dije';
      var metalFix = /oro|dorad/.test(low) ? 'oro' : /plata|platead/.test(low) ? 'plata' : null;
      var names = ['Esencia', 'Latido', 'Raíz', 'Destello'];
      var variants = /geometr|sagrad/.test(low) ? ['geometrica', 'geometrica', 'sello', 'minimal']
        : /mar|ola|flor|caf|colibr|mascota/.test(low) ? ['organica', 'torcida', 'organica', 'clasica']
        : ['organica', 'minimal', 'torcida', 'sello'];
      setTimeout(function () {
        box.innerHTML = '<div class="ia__results">' + names.map(function (n, i) {
          var cfg = { tipo: tipo, silueta: variants[i], metal: metalFix || (i % 2 ? 'oro' : 'plata'), piedra: i === 2 ? 'circon' : 'ninguna', grosor: 4 + i };
          return '<div class="concept"><div class="concept__img">' + C.jewelSVG(cfg.tipo, cfg.metal, { variant: cfg.silueta, stone: cfg.piedra, thickness: cfg.grosor }) + '</div>' +
            '<div class="concept__body"><strong>' + n + '</strong><span class="muted small">' + C.METALS[cfg.metal].label + ' · ' + find(SHAPES, cfg.silueta).name + '</span>' +
            '<span class="price small">Desde ' + C.formatCOP(price(Object.assign({}, s, cfg, { grabado: '' }))) + '</span>' +
            '<div class="concept__actions"><button data-refine="' + (i % 2 ? 'delicado' : 'llamativo') + '">Refinar</button>' +
            '<button data-take=\'' + JSON.stringify(cfg) + '\'>Llevar a 3D</button></div></div></div>';
        }).join('') + '</div>';
      }, 1100);
    }
    $('[data-ia-form]').addEventListener('submit', function (e) { e.preventDefault(); generate(); });

    /* El switch Plata | Oro del encabezado también cambia el metal del diseño */
    document.addEventListener('metalchange', function (e) { s.metal = e.detail; render(); });

    setTab(view.tab);
    render();
    C.observeReveal(root);
  };
})();
