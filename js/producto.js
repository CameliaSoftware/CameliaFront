/* Página de producto: galería (o visor 3D), metal, talla, agregar a la bolsa y relacionados. */

(function () {
  var C = CAMELIA;
  var params = new URLSearchParams(location.search);
  var p = C.getProduct(params.get('id')) || C.PRODUCTS[0];
  var cat = C.getCategory(p.cat);
  var metal = p.metals[params.get('metal')] ? params.get('metal') : C.displayMetal(p, C.state.metal);
  var hasSize = p.cat === 'anillos' || p.cat === 'argollas';
  var size = null, view = 0;
  var ANGLES = [0, 40, 90, 140];

  /* Vistas rápidas del visor 3D: ángulo de cámara y punto al que mira */
  var VIEWS_3D = [
    { name: 'Completa', orbit: '0deg 85deg auto', target: 'auto auto auto' },
    { name: 'Detalle', orbit: '0deg 75deg 0.06m', target: '0m -0.07m 0m' },
    { name: 'Lado', orbit: '70deg 75deg auto', target: 'auto auto auto' },
    { name: 'Arriba', orbit: '0deg 15deg auto', target: 'auto auto auto' },
  ];

  if (p.detalle) VIEWS_3D[1] = { name: 'Detalle', orbit: p.detalle.orbit, target: p.detalle.target };

  /* El visor se crea una sola vez y se reutiliza (así no recarga el modelo al cambiar de metal) */
  var viewer = null;
  function getViewer() {
    if (viewer || !p.model) return viewer;
    viewer = document.createElement('model-viewer');
    viewer.className = 'viewer3d';
    viewer.setAttribute('src', p.model);
    viewer.setAttribute('alt', p.name + ' en 3D');
    viewer.setAttribute('camera-controls', '');
    viewer.setAttribute('touch-action', 'pan-y');
    viewer.setAttribute('auto-rotate', '');
    viewer.setAttribute('auto-rotate-delay', '2500');
    viewer.setAttribute('rotation-per-second', '18deg');
    viewer.setAttribute('interaction-prompt', 'none');
    viewer.setAttribute('environment-image', 'legacy');
    viewer.setAttribute('shadow-intensity', '0.8');
    viewer.setAttribute('min-camera-orbit', 'auto auto 0.03m');
    viewer.setAttribute('camera-orbit', VIEWS_3D[0].orbit);
    viewer.setAttribute('ar', '');
    viewer.setAttribute('ar-modes', 'webxr scene-viewer quick-look');
    viewer.setAttribute('ar-scale', 'fixed');
    viewer.innerHTML =
      '<button slot="ar-button" class="viewer3d__ar">' + C.icon('cube') + 'Ver en mi espacio</button>' +
      '<div slot="progress-bar" class="viewer3d__loading"><i></i></div>';
    viewer.addEventListener('load', paintMetal);
    viewer.addEventListener('progress', function (e) {
      var bar = viewer.querySelector('.viewer3d__loading');
      bar.firstChild.style.width = (e.detail.totalProgress * 100) + '%';
      bar.hidden = e.detail.totalProgress >= 1;
    });
    return viewer;
  }

  /* Cambia el color del material "Metal" del modelo sin recargarlo */
  function paintMetal() {
    if (!viewer || !viewer.model) return;
    viewer.model.materials.forEach(function (m) {
      if (m.name === 'Metal') m.pbrMetallicRoughness.setBaseColorFactor(C.METAL_COLOR[metal]);
    });
  }

  var fotoSel = 0, modo3d = false;

  function galeriaFotos(fotos) {
    var thumbs = fotos.map(function (f, i) {
      return '<button data-foto="' + i + '" aria-pressed="' + (!modo3d && i === fotoSel) + '" aria-label="Foto ' + (i + 1) + '">' + C.imgFoto(f) + '</button>';
    }).join('') + (p.model ? '<button class="thumb3d" data-ver3d aria-pressed="' + modo3d + '">' + C.icon('rotate') + '<span>3D</span></button>' : '');
    var f = fotos[Math.min(fotoSel, fotos.length - 1)];
    var principal = modo3d
      ? '<div class="gallery__main gallery__main--3d" data-slot><span class="tag"><i class="dot dot--' + metal + '"></i>' + C.METALS[metal].label + '</span>' +
        '<span class="tag tag--3d gallery__hint">' + C.icon('rotate') + 'Arrastra para girar · pellizca para acercar</span></div>'
      : '<div class="gallery__main gallery__main--foto">' + C.imgFoto(f) +
        '<span class="tag"><i class="dot dot--' + metal + '"></i>' + C.METALS[metal].label + '</span>' +
        (f.origen === 'ia' ? '<span class="tag tag--ilustrativa">Imagen ilustrativa</span>' : '') + '</div>';
    return '<div class="gallery__thumbs">' + thumbs + '</div>' + principal;
  }

  function galleryHTML() {
    var fotos = C.fotosDe(p, metal);
    if (fotos.length) return galeriaFotos(fotos);
    if (p.model) {
      return '<div class="gallery__thumbs">' + VIEWS_3D.map(function (v, i) {
          return '<button class="thumb3d" data-view="' + i + '" aria-pressed="' + (i === view) + '">' +
            C.jewelSVG(cat.shape, metal, { variant: p.variant, stone: p.stone, angle: ANGLES[i] }) + '<span>' + v.name + '</span></button>';
        }).join('') + '</div>' +
        '<div class="gallery__main gallery__main--3d" data-slot>' +
          '<span class="tag"><i class="dot dot--' + metal + '"></i>' + C.METALS[metal].label + '</span>' +
          '<span class="tag tag--3d gallery__hint">' + C.icon('rotate') + 'Arrastra para girar · pellizca para acercar</span>' +
        '</div>';
    }
    return '<div class="gallery__thumbs">' + ANGLES.map(function (a, i) {
        return '<button data-view="' + i + '" aria-pressed="' + (i === view) + '" aria-label="Vista ' + (i + 1) + '">' +
          C.jewelSVG(cat.shape, metal, { variant: p.variant, stone: p.stone, angle: a }) + '</button>';
      }).join('') + '</div>' +
      '<div class="gallery__main"><span class="tag"><i class="dot dot--' + metal + '"></i>' + C.METALS[metal].label + '</span>' +
        C.jewelSVG(cat.shape, metal, { variant: p.variant, stone: p.stone, angle: ANGLES[view] }) + '</div>';
  }

  function render() {
    var root = document.querySelector('[data-product]');
    var metals = Object.keys(p.metals);
    var fav = C.isFav(p.id);
    root.innerHTML =
      '<div class="gallery">' + galleryHTML() + '</div>' +
      '<div class="info">' +
        '<div><span class="label">' + cat.name + ' · ' + p.sub + '</span>' +
          '<h1 class="h2" style="margin-top:12px">' + p.name + '</h1>' +
          '<p class="price info__price" style="margin-top:14px">' + C.formatCOP(p.metals[metal]) + '</p>' +
          '<p class="muted small">Hasta 6 cuotas sin interés · PSE, Nequi y tarjetas</p></div>' +
        '<p>' + p.desc + '. Pieza hecha a mano en Colombia, con acabado pulido y empaque de regalo.</p>' +
        '<div class="field"><span class="label">Metal</span><div class="options">' + metals.map(function (m) {
          return '<button class="option" data-metal-pick="' + m + '" aria-pressed="' + (m === metal) + '"><span class="swatch swatch--' + m + '"></span>' + C.METALS[m].label + '</button>';
        }).join('') + '</div></div>' +
        (hasSize ? '<div class="field"><span class="label">Talla <a href="#" class="muted">Guía de tallas</a></span><div class="options">' +
          [5, 6, 7, 8, 9, 10, 11].map(function (n) {
            return '<button class="option option--size" data-size="' + n + '" aria-pressed="' + (n === size) + '">' + n + '</button>';
          }).join('') + '</div><p class="small" style="color:#a3412a;margin-top:8px" data-size-msg hidden>Elige tu talla para continuar.</p></div>' : '') +
        '<div class="info__actions"><button class="btn btn--primary btn--block" data-buy>Agregar a la bolsa</button>' +
          '<button class="icon-btn' + (fav ? ' is-fav' : '') + '" data-fav="' + p.id + '" aria-pressed="' + fav + '" aria-label="Favorito">' + C.icon('heart') + '</button></div>' +
        (p.custom ? '<a class="btn btn--ghost btn--block" href="disena.html?tipo=' + cat.shape + '">Personalizar esta joya ' + C.icon('sparkle') + '</a>' : '') +
        '<ul class="perks">' +
          (p.model ? '<li>' + C.icon('rotate') + 'Modelo 3D a tamaño real: gíralo o mírala en tu espacio</li>' : '') +
          '<li>' + C.icon('truck') + 'Envío asegurado a toda Colombia</li><li>' + C.icon('shield') + 'Garantía de 1 año</li><li>' + C.icon('seal') + (metal === 'oro' ? 'Oro 18K certificado de por vida' : 'Plata 925 certificada') + '</li></ul>' +
        '<div class="accordion">' +
          '<details open><summary>Detalles' + C.icon('chevron') + '</summary><div>Metal: ' + C.METALS[metal].label + '. Piedra: ' + C.STONES[p.stone] + '. Hecha a mano en nuestro taller.</div></details>' +
          '<details><summary>Cuidados' + C.icon('chevron') + '</summary><div>Guárdala en su bolsa, lejos de perfumes y cloro. Límpiala con un paño suave.</div></details>' +
          '<details><summary>Envíos y cambios' + C.icon('chevron') + '</summary><div>Entrega en 2 a 5 días hábiles. Tienes 30 días para cambios.</div></details>' +
        '</div>' +
      '</div>';

    var slot = root.querySelector('[data-slot]');
    if (slot) { slot.appendChild(getViewer()); paintMetal(); }
  }

  function goToView(i) {
    view = i;
    if (viewer) {
      var v = VIEWS_3D[i];
      viewer.setAttribute('camera-target', v.target);
      viewer.setAttribute('camera-orbit', v.orbit);
      document.querySelectorAll('[data-view]').forEach(function (b) { b.setAttribute('aria-pressed', +b.dataset.view === i); });
    } else {
      render();
    }
  }

  function renderRelated() {
    var list = C.PRODUCTS.filter(function (x) { return x.id !== p.id && x.cat === p.cat; });
    list = list.concat(C.PRODUCTS.filter(function (x) { return x.id !== p.id && x.cat !== p.cat; })).slice(0, 4);
    var box = document.querySelector('[data-related]');
    box.innerHTML = list.map(function (x) { return C.productCard(x); }).join('');
    C.observeReveal(box);
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.title = p.name + ' · Camelia';
    document.querySelector('[data-crumbs]').innerHTML = '<a href="index.html">Inicio</a><span>/</span><a href="categoria.html?cat=' + cat.id + '">' + cat.name + '</a><span>/</span><span>' + p.name + '</span>';
    render();
    renderRelated();
    document.addEventListener('fotoschange', function () { fotoSel = 0; render(); renderRelated(); });

    document.querySelector('[data-product]').addEventListener('click', function (e) {
      var v = e.target.closest('[data-view]'), m = e.target.closest('[data-metal-pick]'), s = e.target.closest('[data-size]');
      var fo = e.target.closest('[data-foto]');
      if (fo) { fotoSel = +fo.dataset.foto; modo3d = false; render(); return; }
      if (e.target.closest('[data-ver3d]')) { modo3d = true; render(); return; }
      if (v) goToView(+v.dataset.view);
      else if (m) { metal = m.dataset.metalPick; render(); }
      else if (s) { size = +s.dataset.size; render(); }
      else if (e.target.closest('[data-buy]')) {
        if (hasSize && !size) { document.querySelector('[data-size-msg]').hidden = false; return; }
        C.addProductToCart(p, metal, { size: size });
      }
    });
  });
})();
