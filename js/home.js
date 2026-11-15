/* Página de inicio: todo sale de las joyas publicadas y sus fotos reales. */

(function () {
  var C = CAMELIA;

  /* Joyas preferidas para cada bloque (si no están, se usa otra con foto) */
  var PORTADA = 'cadena-veneciana';
  var FOTO_CATEGORIA = {
    anillos: 'anillo-solitario-azul', aretes: 'topos-flor-azul', dijes: 'dije-cruz-destello',
    cadenas: 'collar-hojas-verde', pulseras: 'pulsera-tejida-raqueta', juegos: 'juego-flor-azul',
  };
  var NOMBRE_CATEGORIA = { cadenas: 'Cadenas y collares' };

  function conFotos() { return C.PRODUCTS.filter(function (p) { return p.fotos && p.fotos.length; }); }

  /* La primera foto de la joya cuyo tipo esté en `tipos` (en ese orden de preferencia) */
  function foto(p, tipos) {
    var m = C.displayMetal(p);
    var fotos = C.fotosDe(p, m);
    for (var i = 0; i < tipos.length; i++) {
      var f = fotos.find(function (x) { return (x.tipo || 'producto') === tipos[i]; });
      if (f) return f;
    }
    return fotos[0];
  }
  function img(f, cls, inmediata) { return f ? C.imgFoto(f, cls, inmediata) : ''; }
  function desde(lista, metal) {
    var precios = lista.map(function (p) { return p.metals[metal]; }).filter(Boolean);
    return precios.length ? Math.min.apply(null, precios) : 0;
  }

  function portada() {
    var lista = conFotos();
    var p = C.getProduct(PORTADA);
    if (!p || !foto(p, ['modelo'])) p = lista.find(function (x) { return foto(x, ['modelo']).tipo === 'modelo'; }) || lista[0];
    if (!p) return;
    var box = document.querySelector('[data-portada-foto]');
    box.innerHTML = img(foto(p, ['modelo', 'detalle', 'producto']), '', true);
    box.href = 'producto.html?id=' + p.id + '&metal=' + C.displayMetal(p);
    box.setAttribute('aria-label', 'Ver ' + p.name);
  }

  function categorias() {
    var orden = ['anillos', 'aretes', 'dijes', 'cadenas', 'pulseras', 'juegos', 'argollas'];
    var html = C.CATEGORIES.slice().sort(function (a, b) { return orden.indexOf(a.id) - orden.indexOf(b.id); }).map(function (cat) {
      var lista = conFotos().filter(function (p) { return p.cat === cat.id; });
      if (!lista.length) return '';
      var p = C.getProduct(FOTO_CATEGORIA[cat.id]);
      if (!p || p.cat !== cat.id || !p.fotos || !p.fotos.length) p = lista.slice().sort(C.porNovedad)[0];
      var n = C.PRODUCTS.filter(function (x) { return x.cat === cat.id; }).length;
      return '<a class="cat" href="' + C.urlCats([cat.id]) + '"><span class="cat__img">' + img(foto(p, ['producto', 'detalle'])) + '</span>' +
        '<span class="cat__nombre">' + (NOMBRE_CATEGORIA[cat.id] || cat.name) + '</span><span class="cat__n">' + n + (n === 1 ? ' joya' : ' joyas') + '</span></a>';
    }).join('');
    document.querySelector('[data-cats]').innerHTML = html;
  }

  function novedades() {
    var lista = conFotos().sort(C.porNovedad).slice(0, 8);
    var box = document.querySelector('[data-novedades]');
    box.innerHTML = lista.map(function (p) { return C.productCard(p); }).join('');
    C.observeReveal(box);
  }

  function metales() {
    var lista = conFotos();
    var bloques = [
      { metal: 'oro', tipos: ['detalle', 'producto'], texto: 'Precio según el peso de cada joya' },
      { metal: 'plata', tipos: ['modelo', 'detalle', 'producto'], texto: 'Para usar todos los días' },
    ].map(function (b) {
      var deMetal = lista.filter(function (p) { return p.metals[b.metal]; });
      if (!deMetal.length) return '';
      var p = deMetal.slice().sort(C.porNovedad).find(function (x) { var f = foto(x, b.tipos); return f && f.tipo === b.tipos[0]; }) || deMetal[0];
      var d = desde(deMetal, b.metal);
      return '<a class="metal" href="categoria.html?metal=' + b.metal + '">' + img(foto(p, b.tipos)) +
        '<span class="metal__txt"><strong>' + C.METALS[b.metal].label + '</strong><span>' + b.texto + (d ? ' · desde ' + C.formatCOP(d) : '') + '</span></span></a>';
    });
    document.querySelector('[data-metales]').innerHTML = bloques.join('');
  }

  function pulsera() {
    var p = conFotos().find(function (x) { return x.cat === 'pulseras'; });
    var box = document.querySelector('[data-pulsera-foto]');
    if (p) box.innerHTML = img(foto(p, ['modelo', 'detalle', 'producto']));
    else box.hidden = true;
  }

  function precios() {
    document.querySelector('[data-precios]').innerHTML = C.PRICE_RANGES.map(function (r) {
      var n = C.PRODUCTS.filter(function (p) {
        return Object.keys(p.metals).some(function (m) { return p.metals[m] >= r.min && p.metals[m] < r.max && p.metals[m] > 0; });
      }).length;
      if (!n) return '';
      return '<a class="precio" href="categoria.html?precio=' + r.id + '"><strong>' + r.label + '</strong><span>' + n + (n === 1 ? ' joya' : ' joyas') + '</span></a>';
    }).join('');
  }

  document.addEventListener('DOMContentLoaded', function () {
    C.catalogo.then(function () {
      portada(); categorias(); novedades(); metales(); pulsera(); precios();
    });
  });
})();
