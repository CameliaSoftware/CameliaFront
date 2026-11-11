/* Panel de administración de Camelia (admin.html).
   Solo funciona con una cuenta que esté en la tabla "administradores": la base de datos
   rechaza cualquier cambio de otra cuenta, aunque alguien abra esta página.
   Desde aquí se crean, editan, ocultan y eliminan joyas, se suben y borran fotos
   (con la marca de agua "Joyería Camelia") y se cambia el precio del gramo. */

(function () {
  var C = window.CAMELIA;
  var esc = C.esc;
  var raiz, joyas = [], precios = {}, vista = 'lista', editando = null, filtro = { q: '', metal: '' };

  var TIPOS_FOTO = [['producto', 'Producto'], ['detalle', 'Detalle'], ['modelo', 'Con modelo'], ['giro360', 'Giro 360°'], ['render_3d', 'Render 3D']];
  var INTERNAS = [['', 'Ninguna'], ['interna-vitrina', 'Vitrina'], ['interna-consignacion-piedra', 'Consignación piedra'], ['interna-consignacion-no-piedra', 'Consignación no piedra']];
  var FIGURAS = ['clasica', 'minimal', 'torcida', 'geometrica', 'organica', 'sello'];

  /* ---------- Datos ---------- */
  function cargar() {
    return Promise.all([
      C.sb.from('productos').select('*, variantes(*), imagenes(*)').order('orden').order('nombre'),
      C.sb.from('precios_metal').select('metal, precio_gramo'),
    ]).then(function (r) {
      if (r[0].error) throw r[0].error;
      joyas = r[0].data;
      joyas.forEach(function (j) { j.imagenes.sort(function (a, b) { return a.orden - b.orden; }); });
      precios = {};
      (r[1].data || []).forEach(function (x) { precios[x.metal] = x.precio_gramo; });
    });
  }

  function precioVariante(v) {
    if (v.precio_fijo) return v.precio_fijo;
    return v.peso_gramos && precios[v.metal] ? Math.round(Number(v.peso_gramos) * precios[v.metal] + (v.costo_hechura || 0)) : null;
  }
  function metalesDe(j) {
    var m = {};
    j.variantes.filter(function (v) { return v.activo !== false; }).forEach(function (v) {
      var pr = precioVariante(v);
      if (pr && (!m[v.metal] || pr < m[v.metal])) m[v.metal] = pr;
    });
    if (!Object.keys(m).length) { if (j.precio_oro) m.oro = j.precio_oro; if (j.precio_plata) m.plata = j.precio_plata; }
    return m;
  }
  function slug(t) {
    return String(t).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);
  }
  function op(lista, actual) {
    return lista.map(function (o) {
      var v = Array.isArray(o) ? o[0] : o, t = Array.isArray(o) ? o[1] : o;
      return '<option value="' + esc(v) + '"' + (String(actual == null ? '' : actual) === String(v) ? ' selected' : '') + '>' + esc(t) + '</option>';
    }).join('');
  }

  /* ---------- Acceso ---------- */
  function sinPermiso(u) {
    raiz.innerHTML = '<section class="area__vacio"><span class="logo__name">CAMELIA</span><h1 class="h2">Administración</h1>' +
      (u ? '<p class="muted">Tu cuenta (' + esc(u.email) + ') no tiene permisos de administrador.</p><a class="btn btn--ghost" href="index.html">Ir a la tienda</a>'
         : '<p class="muted">Entra con la cuenta de Google de administrador.</p><button class="btn btn--primary" data-entrar>Entrar con Google</button>') +
      '</section>';
    var b = raiz.querySelector('[data-entrar]');
    if (b) b.addEventListener('click', function () { C.auth.entrar('admin.html'); });
  }

  /* ---------- Lista de joyas ---------- */
  function pintarLista() {
    var q = slug(filtro.q);
    var lista = joyas.filter(function (j) {
      var m = metalesDe(j);
      if (filtro.metal && !m[filtro.metal]) return false;
      return !q || slug(j.nombre + ' ' + j.id + ' ' + (j.subcategoria || '') + ' ' + j.categoria).indexOf(q) > -1;
    });
    raiz.innerHTML =
      '<div class="area__head"><div><span class="label">Administración</span><h1 class="h2">Joyas</h1>' +
        '<p class="muted small">' + joyas.length + ' joyas · ' + joyas.filter(function (j) { return j.activo && j.estado === 'publicado'; }).length + ' visibles en la tienda</p></div>' +
        '<div class="adm__acciones"><button class="btn btn--ghost" data-ir="precios">Precio del gramo</button><button class="btn btn--primary" data-nueva>+ Nueva joya</button></div></div>' +
      '<div class="adm__filtros"><input class="input" type="search" placeholder="Buscar por nombre o categoría…" data-buscar value="' + esc(filtro.q) + '">' +
        '<select class="select" data-filtro-metal>' + op([['', 'Oro y plata'], ['oro', 'Solo oro'], ['plata', 'Solo plata']], filtro.metal) + '</select></div>' +
      '<div class="adm__lista">' + (lista.length ? lista.map(filaJoya).join('') : '<p class="muted">No hay joyas con ese filtro.</p>') + '</div>';
    var b = raiz.querySelector('[data-buscar]');
    if (filtro.q) { b.focus(); b.setSelectionRange(b.value.length, b.value.length); }
  }

  function filaJoya(j) {
    var m = metalesDe(j), foto = j.imagenes[0];
    var visible = j.activo && j.estado === 'publicado';
    var cat = C.getCategory(j.categoria);
    return '<article class="adm__fila">' +
      '<span class="adm__mini">' + (foto ? '<img src="' + C.urlFoto(foto.archivo) + '" alt="" loading="lazy">' : C.jewelSVG(cat ? cat.shape : 'anillo', Object.keys(m)[0] || 'oro', { variant: j.figura })) + '</span>' +
      '<div class="adm__info"><strong>' + esc(j.nombre) + '</strong>' +
        '<span class="muted small">' + esc(cat ? cat.name : j.categoria) + (j.subcategoria ? ' · ' + esc(j.subcategoria) : '') + ' · ' + j.imagenes.length + ' fotos</span>' +
        '<span class="small">' + Object.keys(m).map(function (k) { return '<i class="dot dot--' + k + '"></i> ' + C.formatCOP(m[k]); }).join(' &nbsp; ') + '</span></div>' +
      '<span class="adm__estado ' + (visible ? 'is-on' : '') + '">' + (visible ? 'Visible' : j.estado === 'agotado' ? 'Agotada' : 'Oculta') + '</span>' +
      '<div class="adm__btns">' +
        '<button class="btn btn--ghost btn--sm" data-editar="' + esc(j.id) + '">Editar</button>' +
        '<button class="link-arrow small" data-alternar="' + esc(j.id) + '">' + (visible ? 'Ocultar' : 'Publicar') + '</button>' +
        (visible ? '<a class="link-arrow small" href="producto.html?id=' + encodeURIComponent(j.id) + '" target="_blank">Ver</a>' : '') +
        '<button class="link-arrow small adm__peligro" data-eliminar="' + esc(j.id) + '">Eliminar</button>' +
      '</div></article>';
  }

  /* ---------- Editor ---------- */
  function vacia() {
    return { id: '', nombre: '', categoria: 'dijes', subcategoria: '', descripcion: '', texto: '', ficha: [['Metal', 'Oro amarillo 18K (ley 750)']],
      complementos: [], piedra: 'ninguna', personalizable: false, estado: 'publicado', activo: true, figura: 'clasica',
      categoria_interna: null, variantes: [], imagenes: [], nueva: true };
  }

  function bloqueMetal(j, metal) {
    var v = j.variantes.find(function (x) { return x.metal === metal; }) || {};
    var on = !!v.metal || (j.nueva && metal === 'oro');
    return '<div class="adm__metal' + (on ? ' is-on' : '') + '" data-bloque="' + metal + '">' +
      '<label class="check"><input type="checkbox" data-metal-on="' + metal + '"' + (on ? ' checked' : '') + '> <span class="swatch swatch--' + metal + '"></span>' + C.METALS[metal].label + '</label>' +
      '<div class="form-grid adm__metal-campos">' +
        C.campo('Peso (gramos)', '<input class="input" type="number" step="0.01" min="0" name="' + metal + '_peso" value="' + esc(v.peso_gramos) + '" placeholder="Ej: 4.5">') +
        C.campo('Precio fijo <em>(opcional)</em>', '<input class="input" type="number" step="1000" min="0" name="' + metal + '_fijo" value="' + esc(v.precio_fijo) + '" placeholder="Si lo dejas vacío: peso × gramo">') +
        (metal === 'oro' ? C.campo('Color del oro', '<select class="select" name="oro_color">' + op([['amarillo', 'Amarillo'], ['blanco', 'Blanco'], ['rosa', 'Rosa']], v.color_oro || 'amarillo') + '</select>') : '') +
        C.campo('Largo (cm) <em>cadenas y pulseras</em>', '<input class="input" type="number" step="0.5" min="0" name="' + metal + '_largo" value="' + esc(v.largo_cm) + '">') +
        C.campo('Unidades disponibles', '<input class="input" type="number" step="1" min="0" name="' + metal + '_stock" value="' + esc(v.stock == null ? 1 : v.stock) + '">') +
      '</div><p class="small adm__precio" data-precio-metal="' + metal + '"></p></div>';
  }

  function pintarEditor() {
    var j = editando;
    var tipos = C.CATEGORIES.map(function (c) { return [c.id, c.name]; });
    var otras = joyas.filter(function (x) { return x.id !== j.id; });
    raiz.innerHTML =
      '<div class="area__head"><div><button class="link-arrow small" data-volver>← Volver a las joyas</button>' +
        '<h1 class="h2">' + (j.nueva ? 'Nueva joya' : esc(j.nombre)) + '</h1></div>' +
        (j.nueva ? '' : '<a class="btn btn--ghost" href="producto.html?id=' + encodeURIComponent(j.id) + '" target="_blank">Ver en la tienda</a>') + '</div>' +
      '<form class="adm__editor" data-form novalidate>' +
        '<section class="area__card"><h2 class="h4">Datos de la joya</h2><div class="form-grid">' +
          C.campo('Nombre', '<input class="input" name="nombre" required value="' + esc(j.nombre) + '" placeholder="Ej: Dije Cruz de Cristo">', true) +
          C.campo('Tipo de joya', '<select class="select" name="categoria">' + op(tipos, j.categoria) + '</select>') +
          C.campo('Categoría', '<select class="select" name="subcategoria" data-subs></select>') +
          C.campo('Frase corta <em>(sale en la tarjeta)</em>', '<input class="input" name="descripcion" value="' + esc(j.descripcion) + '" placeholder="Ej: Cruz calada con el rostro de Cristo">', true) +
          C.campo('Descripción <em>(página de la joya)</em>', '<textarea class="input adm__texto" name="texto" rows="4">' + esc(j.texto) + '</textarea>', true) +
          C.campo('Piedra', '<select class="select" name="piedra">' + op(Object.keys(C.STONES).map(function (k) { return [k, C.STONES[k]]; }), j.piedra) + '</select>') +
          C.campo('Categoría interna', '<select class="select" name="categoria_interna">' + op(INTERNAS, j.categoria_interna || '') + '</select>') +
          C.campo('Estado', '<select class="select" name="estado">' + op([['publicado', 'Visible en la tienda'], ['borrador', 'Oculta (borrador)'], ['agotado', 'Agotada (oculta)']], j.activo ? j.estado : 'borrador') + '</select>') +
          C.campo('Dibujo si no hay fotos', '<select class="select" name="figura">' + op(FIGURAS, j.figura || 'clasica') + '</select>') +
        '</div></section>' +

        '<section class="area__card"><h2 class="h4">Metal, peso y precio</h2>' +
          '<p class="small muted">El precio se calcula solo: peso × precio del gramo (oro ' + C.formatCOP(precios.oro || 0) + ', plata ' + C.formatCOP(precios.plata || 0) + '). Pon un precio fijo solo si quieres otro.</p>' +
          bloqueMetal(j, 'oro') + bloqueMetal(j, 'plata') +
        '</section>' +

        '<section class="area__card"><div class="area__card-head"><h2 class="h4">Ficha técnica</h2><button type="button" class="link-arrow small" data-ficha-mas>+ Agregar dato</button></div>' +
          '<p class="small muted">Sale en "Detalles". El peso y el largo se agregan solos.</p><div class="adm__ficha" data-ficha>' +
          (j.ficha || []).filter(function (f) { return f[0] !== 'Peso' && f[0] !== 'Largo'; }).map(filaFicha).join('') + '</div></section>' +

        '<section class="area__card"><h2 class="h4">Combínala con</h2><p class="small muted">Joyas que el cliente puede agregar con un clic (ej. la cadena para un dije).</p>' +
          '<div class="adm__combina">' + (otras.length ? otras.map(function (x) {
            return '<label class="check"><input type="checkbox" name="complementos" value="' + esc(x.id) + '"' + ((j.complementos || []).indexOf(x.id) > -1 ? ' checked' : '') + '> ' + esc(x.nombre) + '</label>';
          }).join('') : '<p class="muted small">Aún no hay otras joyas.</p>') + '</div></section>' +

        '<p class="form-error" data-error hidden></p>' +
        '<div class="form-actions adm__guardar"><button class="btn btn--primary" type="submit">' + (j.nueva ? 'Crear joya' : 'Guardar cambios') + '</button>' +
          '<button class="btn btn--ghost" type="button" data-volver>Cancelar</button></div>' +
      '</form>' +

      '<section class="area__card adm__fotos"><div class="area__card-head"><h2 class="h4">Fotos</h2><span class="small muted">Se les pone la marca de agua "Joyería Camelia" al subirlas</span></div>' +
        (j.nueva ? '<p class="muted small">Primero crea la joya; después podrás subir sus fotos aquí.</p>' :
        '<label class="adm__drop" data-drop><input type="file" accept="image/jpeg,image/png,image/webp" multiple hidden data-archivos>' +
          '<strong>Arrastra las fotos aquí o haz clic para elegirlas</strong><span class="small muted">JPG, PNG o WebP · puedes elegir varias a la vez</span></label>' +
        '<div class="adm__subida small" data-progreso hidden></div>' +
        '<div class="adm__galeria">' + j.imagenes.map(fotoHTML).join('') + '</div>') +
      '</section>';

    pintarSubs();
    pintarPrecios();
  }

  function filaFicha(f) {
    return '<div class="adm__ficha-fila"><input class="input" placeholder="Dato (ej. Tejido)" data-f-k value="' + esc(f ? f[0] : '') + '">' +
      '<input class="input" placeholder="Valor (ej. Veneciano)" data-f-v value="' + esc(f ? f[1] : '') + '">' +
      '<button type="button" class="icon-btn" data-ficha-quitar aria-label="Quitar">' + C.icon('close') + '</button></div>';
  }

  function fotoHTML(f, i) {
    return '<figure class="adm__foto" data-foto-id="' + f.id + '"><img src="' + C.urlFoto(f.archivo) + '" alt="" loading="lazy">' +
      '<figcaption><select class="select select--sm" data-foto-tipo="' + f.id + '">' + op(TIPOS_FOTO, f.tipo) + '</select>' +
      '<div class="adm__foto-acc">' +
        '<button type="button" class="icon-btn" data-mover="' + f.id + '" data-dir="-1" aria-label="Mover antes"' + (i === 0 ? ' disabled' : '') + '>←</button>' +
        '<button type="button" class="icon-btn" data-mover="' + f.id + '" data-dir="1" aria-label="Mover después"' + (i === editando.imagenes.length - 1 ? ' disabled' : '') + '>→</button>' +
        '<button type="button" class="link-arrow small adm__peligro" data-borrar-foto="' + f.id + '">Borrar</button>' +
      '</div>' + (i === 0 ? '<span class="tag tag--soft adm__principal">Principal</span>' : '') + '</figcaption></figure>';
  }

  function metalesMarcados() {
    return ['oro', 'plata'].filter(function (m) { var x = raiz.querySelector('[data-metal-on="' + m + '"]'); return x && x.checked; });
  }
  function pintarSubs() {
    var f = raiz.querySelector('[data-form]');
    var cat = C.getCategory(f.categoria.value);
    var subs = [];
    (metalesMarcados().length ? metalesMarcados() : ['oro', 'plata']).forEach(function (m) {
      (cat.subs[m] || []).forEach(function (s) { if (subs.indexOf(s) < 0) subs.push(s); });
    });
    var actual = f.subcategoria.value || editando.subcategoria;
    if (actual && subs.indexOf(actual) < 0) subs.push(actual);
    f.subcategoria.innerHTML = subs.length ? op(subs, actual) : '<option value="">(sin categorías para este metal)</option>';
  }
  function pintarPrecios() {
    var f = raiz.querySelector('[data-form]');
    ['oro', 'plata'].forEach(function (m) {
      var bloque = raiz.querySelector('[data-bloque="' + m + '"]');
      var on = raiz.querySelector('[data-metal-on="' + m + '"]').checked;
      bloque.classList.toggle('is-on', on);
      var peso = parseFloat(f[m + '_peso'].value), fijo = parseInt(f[m + '_fijo'].value, 10);
      var precio = fijo > 0 ? fijo : peso > 0 && precios[m] ? Math.round(peso * precios[m]) : null;
      raiz.querySelector('[data-precio-metal="' + m + '"]').innerHTML = on
        ? (precio ? 'Precio en la tienda: <strong>' + C.formatCOP(precio) + '</strong>' + (fijo > 0 ? ' (fijo)' : ' (' + String(peso).replace('.', ',') + ' g × ' + C.formatCOP(precios[m]) + ')') : 'Escribe el peso o un precio fijo.')
        : '';
    });
  }

  /* ---------- Guardar ---------- */
  function error(t) {
    var el = raiz.querySelector('[data-error]');
    el.textContent = t || ''; el.hidden = !t;
    if (t) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function guardar(form) {
    var j = editando;
    var nombre = form.nombre.value.trim();
    var metales = metalesMarcados();
    var faltan = [];
    if (nombre.length < 3) faltan.push('el nombre');
    if (!metales.length) faltan.push('el metal (oro o plata)');
    var precioDe = {};
    metales.forEach(function (m) {
      var peso = parseFloat(form[m + '_peso'].value), fijo = parseInt(form[m + '_fijo'].value, 10);
      precioDe[m] = fijo > 0 ? fijo : peso > 0 && precios[m] ? Math.round(peso * precios[m]) : null;
      if (!precioDe[m]) faltan.push('el peso o el precio en ' + C.METALS[m].label);
    });
    if (!form.subcategoria.value) faltan.push('la categoría');
    if (faltan.length) return error('Falta ' + faltan.join(', ') + '.');
    error('');

    var id = j.nueva ? slug(nombre) : j.id;
    if (j.nueva && joyas.some(function (x) { return x.id === id; })) id = id + '-' + Math.random().toString(36).slice(2, 6);
    var ficha = [].slice.call(raiz.querySelectorAll('.adm__ficha-fila')).map(function (r) {
      return [r.querySelector('[data-f-k]').value.trim(), r.querySelector('[data-f-v]').value.trim()];
    }).filter(function (f) { return f[0] && f[1]; });
    var estado = form.estado.value;
    var fila = {
      id: id, nombre: nombre, categoria: form.categoria.value, subcategoria: form.subcategoria.value,
      descripcion: form.descripcion.value.trim() || null, descripcion_corta: form.descripcion.value.trim() || null,
      texto: form.texto.value.trim() || null, ficha: ficha.length ? ficha : null,
      complementos: [].slice.call(form.querySelectorAll('[name=complementos]:checked')).map(function (x) { return x.value; }),
      piedra: form.piedra.value, figura: form.figura.value, categoria_interna: form.categoria_interna.value || null,
      estado: estado, activo: estado === 'publicado',
      precio_oro: precioDe.oro || null, precio_plata: precioDe.plata || null, actualizado: new Date().toISOString(),
    };
    if (j.nueva) fila.orden = 10;

    var btn = form.querySelector('[type=submit]');
    btn.disabled = true;
    C.sb.from('productos').upsert(fila).then(function (r) {
      if (r.error) throw r.error;
      // Variantes: una por metal marcado; se borran las de metales desmarcados
      var ops = [];
      ['oro', 'plata'].forEach(function (m) {
        var actual = j.variantes.find(function (v) { return v.metal === m; });
        if (metales.indexOf(m) < 0) { if (actual) ops.push(C.sb.from('variantes').delete().eq('id', actual.id)); return; }
        var datos = {
          producto_id: id, metal: m, ley: m === 'oro' ? 750 : 925, activo: true,
          color_oro: m === 'oro' ? form.oro_color.value : null,
          peso_gramos: parseFloat(form[m + '_peso'].value) || null,
          precio_fijo: parseInt(form[m + '_fijo'].value, 10) || null,
          largo_cm: parseFloat(form[m + '_largo'].value) || null,
          stock: parseInt(form[m + '_stock'].value, 10) || 0,
        };
        ops.push(actual ? C.sb.from('variantes').update(datos).eq('id', actual.id)
          : C.sb.from('variantes').insert(Object.assign({ referencia: 'CAM-' + id.toUpperCase().replace(/-/g, '').slice(0, 18) + '-' + (m === 'oro' ? 'OR' : 'PL') }, datos)));
      });
      return Promise.all(ops);
    }).then(function (res) {
      (res || []).forEach(function (x) { if (x.error) throw x.error; });
      return cargar();
    }).then(function () {
      editando = joyas.find(function (x) { return x.id === id; });
      C.avisar(j.nueva ? 'Joya creada. Ahora sube sus fotos.' : 'Cambios guardados. Ya se ven en la tienda.');
      pintarEditor();
    }).catch(function (e) { btn.disabled = false; error('No se pudo guardar: ' + e.message); });
  }

  /* ---------- Fotos con marca de agua (se procesan en el navegador) ---------- */
  function aBlob(canvas, calidad) {
    return new Promise(function (ok) {
      canvas.toBlob(function (b) {
        if (b && b.type === 'image/webp') return ok(b);
        canvas.toBlob(ok, 'image/jpeg', 0.9);       // Safari antiguo no guarda WebP
      }, 'image/webp', calidad);
    });
  }

  function procesar(archivo) {
    return createImageBitmap(archivo, { imageOrientation: 'from-image' }).catch(function () {
      throw new Error(archivo.name + ': no se pudo leer (usa JPG, PNG o WebP).');
    }).then(function (bmp) {
      var k = Math.min(1, 2000 / Math.max(bmp.width, bmp.height));
      var w = Math.round(bmp.width * k), h = Math.round(bmp.height * k);
      var cv = document.createElement('canvas');
      cv.width = w; cv.height = h;
      var ctx = cv.getContext('2d');
      ctx.drawImage(bmp, 0, 0, w, h);
      var res = { w: w, h: h };
      return aBlob(cv, 0.92).then(function (original) {
        res.original = original;
        var base = Math.min(w, h), tam = Math.max(14, Math.round(base * 0.036)), margen = Math.round(base * 0.04);
        var fuente = '400 ' + tam + 'px "Cormorant Garamond", Didot, Georgia, serif';
        return document.fonts.load(fuente).catch(function () {}).then(function () {
          ctx.font = fuente;
          if ('letterSpacing' in ctx) ctx.letterSpacing = (tam * 0.06).toFixed(1) + 'px';
          var texto = 'Joyería Camelia';
          var ancho = Math.ceil(ctx.measureText(texto).width);
          // Brillo de la esquina para elegir el color, igual que en el servidor
          var zx = Math.max(0, w - margen - ancho), zy = Math.max(0, h - margen - tam * 2);
          var px = ctx.getImageData(zx, zy, Math.min(w - zx, ancho + margen), Math.min(h - zy, tam * 2 + margen)).data;
          var suma = 0;
          for (var i = 0; i < px.length; i += 4) suma += (px[i] + px[i + 1] + px[i + 2]) / 3;
          var oscuro = suma / (px.length / 4) < 95;
          ctx.textAlign = 'right'; ctx.textBaseline = 'alphabetic';
          ctx.lineJoin = 'round';
          ctx.lineWidth = tam * 0.06;
          ctx.strokeStyle = oscuro ? 'rgba(0,0,0,0.18)' : 'rgba(255,255,255,0.55)';
          ctx.strokeText(texto, w - margen, h - margen);
          ctx.fillStyle = oscuro ? 'rgba(255,255,255,0.55)' : 'rgba(112,100,82,0.55)';
          ctx.fillText(texto, w - margen, h - margen);
          return aBlob(cv, 0.86);
        });
      }).then(function (marcada) { res.marcada = marcada; return res; });
    });
  }

  function subir(archivos) {
    var j = editando, prog = raiz.querySelector('[data-progreso]');
    var lista = [].slice.call(archivos).filter(function (a) { return /^image\//.test(a.type); });
    if (!lista.length) return;
    prog.hidden = false;
    var hechos = 0, errores = [];
    var orden = j.imagenes.reduce(function (n, f) { return Math.max(n, f.orden); }, 0);
    var tipoInicial = j.imagenes.length ? 'detalle' : 'producto';
    var cadena = Promise.resolve();
    lista.forEach(function (a, i) {
      cadena = cadena.then(function () {
        prog.textContent = 'Subiendo foto ' + (i + 1) + ' de ' + lista.length + '…';
        return procesar(a).then(function (r) {
          var ext = r.marcada.type === 'image/webp' ? '.webp' : '.jpg';
          var nombre = crypto.randomUUID() + ext;
          var ruta = 'productos/' + j.id + '/' + nombre;
          return C.sb.storage.from('originales').upload(ruta, r.original, { contentType: r.original.type })
            .then(function (x) { if (x.error) throw x.error; return C.sb.storage.from('joyas').upload(ruta, r.marcada, { contentType: r.marcada.type, cacheControl: '31536000' }); })
            .then(function (x) {
              if (x.error) throw x.error;
              orden++;
              return C.sb.from('imagenes').insert({
                producto_id: j.id, archivo: ruta, archivo_original: ruta, con_marca: true,
                descripcion: j.nombre + ' — foto ' + orden, alt: j.nombre,
                tipo: i === 0 ? tipoInicial : 'detalle', origen: 'ia', orden: orden,
                metal: j.variantes.length === 1 ? j.variantes[0].metal : null,
                ancho: r.w, alto: r.h, peso_kb: Math.round(r.marcada.size / 1024),
              });
            })
            .then(function (x) { if (x.error) throw x.error; hechos++; });
        }).catch(function (e) { errores.push(e.message); });
      });
    });
    cadena.then(cargar).then(function () {
      editando = joyas.find(function (x) { return x.id === j.id; });
      pintarEditor();
      C.avisar(hechos + ' foto' + (hechos === 1 ? '' : 's') + ' subida' + (hechos === 1 ? '' : 's') + ' con marca de agua.', errores.length ? 'error' : null);
      if (errores.length) alert('Algunas fotos no se subieron:\n' + errores.join('\n'));
    });
  }

  function borrarFoto(id) {
    var f = editando.imagenes.find(function (x) { return x.id === id; });
    if (!f || !confirm('¿Borrar esta foto? No se puede deshacer.')) return;
    Promise.all([
      C.sb.storage.from('joyas').remove([f.archivo]),
      f.archivo_original ? C.sb.storage.from('originales').remove([f.archivo_original]) : null,
    ]).then(function () { return C.sb.from('imagenes').delete().eq('id', id); })
      .then(function (r) { if (r.error) throw r.error; return cargar(); })
      .then(function () { editando = joyas.find(function (x) { return x.id === editando.id; }); pintarEditor(); C.avisar('Foto borrada.'); })
      .catch(function (e) { C.avisar('No se pudo borrar: ' + e.message, 'error'); });
  }

  function moverFoto(id, dir) {
    var l = editando.imagenes.slice(), i = l.findIndex(function (x) { return x.id === id; }), k = i + dir;
    if (i < 0 || k < 0 || k >= l.length) return;
    var t = l[i]; l[i] = l[k]; l[k] = t;
    // Se renumeran todas (1, 2, 3…) para que el orden quede siempre limpio
    Promise.all(l.map(function (f, n) { return f.orden === n + 1 ? null : C.sb.from('imagenes').update({ orden: n + 1 }).eq('id', f.id); }))
      .then(cargar).then(function () { editando = joyas.find(function (x) { return x.id === editando.id; }); pintarEditor(); });
  }

  /* ---------- Eliminar y publicar ---------- */
  function eliminar(id) {
    var j = joyas.find(function (x) { return x.id === id; });
    if (!j || !confirm('¿Eliminar "' + j.nombre + '" y sus ' + j.imagenes.length + ' fotos? No se puede deshacer.\n\nSi solo quieres quitarla de la tienda, usa "Ocultar".')) return;
    var pub = j.imagenes.map(function (f) { return f.archivo; });
    var orig = j.imagenes.map(function (f) { return f.archivo_original; }).filter(Boolean);
    Promise.all([
      pub.length ? C.sb.storage.from('joyas').remove(pub) : null,
      orig.length ? C.sb.storage.from('originales').remove(orig) : null,
    ]).then(function () { return C.sb.from('productos').delete().eq('id', id); })
      .then(function (r) { if (r.error) throw r.error; return cargar(); })
      .then(function () { pintarLista(); C.avisar('"' + j.nombre + '" eliminada.'); })
      .catch(function (e) { C.avisar('No se pudo eliminar: ' + e.message, 'error'); });
  }

  function alternar(id) {
    var j = joyas.find(function (x) { return x.id === id; });
    var visible = j.activo && j.estado === 'publicado';
    C.sb.from('productos').update(visible ? { estado: 'borrador' } : { estado: 'publicado', activo: true }).eq('id', id)
      .then(function (r) { if (r.error) throw r.error; return cargar(); })
      .then(function () { pintarLista(); C.avisar(visible ? 'Oculta de la tienda.' : 'Ya se ve en la tienda.'); })
      .catch(function (e) { C.avisar('No se pudo cambiar: ' + e.message, 'error'); });
  }

  /* ---------- Precio del gramo ---------- */
  function pintarPreciosGramo() {
    raiz.innerHTML =
      '<div class="area__head"><div><button class="link-arrow small" data-volver>← Volver a las joyas</button><h1 class="h2">Precio del gramo</h1></div></div>' +
      '<form class="area__card adm__gramo" data-form-gramo novalidate>' +
        '<p class="muted small">Todas las joyas con peso cambian de precio al instante: precio = peso × precio del gramo. Las que tienen precio fijo no cambian.</p>' +
        '<div class="form-grid">' +
          C.campo('Oro 18K (COP por gramo)', '<input class="input" type="number" step="1000" min="1" name="oro" value="' + esc(precios.oro) + '">') +
          C.campo('Plata 925 (COP por gramo)', '<input class="input" type="number" step="100" min="1" name="plata" value="' + esc(precios.plata) + '">') +
        '</div><div class="form-actions"><button class="btn btn--primary" type="submit">Guardar precios</button></div></form>';
  }
  function guardarGramo(form) {
    var cambios = ['oro', 'plata'].map(function (m) { return [m, parseInt(form[m].value, 10)]; }).filter(function (x) { return x[1] > 0; });
    Promise.all(cambios.map(function (x) {
      return C.sb.from('precios_metal').update({ precio_gramo: x[1], actualizado: new Date().toISOString() }).eq('metal', x[0]);
    })).then(function (r) {
      r.forEach(function (x) { if (x.error) throw x.error; });
      return cargar();
    }).then(function () { C.avisar('Precios guardados. La tienda ya usa los nuevos.'); pintarPreciosGramo(); })
      .catch(function (e) { C.avisar('No se pudo guardar: ' + e.message, 'error'); });
  }

  /* ---------- Eventos ---------- */
  function ir(v, j) {
    vista = v; editando = j || null;
    if (v === 'lista') pintarLista(); else if (v === 'precios') pintarPreciosGramo(); else pintarEditor();
    window.scrollTo(0, 0);
  }

  function eventos() {
    raiz.addEventListener('click', function (e) {
      var b = function (s) { return e.target.closest(s); }, el;
      if (b('[data-volver]')) return ir('lista');
      if (b('[data-nueva]')) return ir('editor', vacia());
      if ((el = b('[data-ir]'))) return ir(el.dataset.ir);
      if ((el = b('[data-editar]'))) return ir('editor', joyas.find(function (x) { return x.id === el.dataset.editar; }));
      if ((el = b('[data-eliminar]'))) return eliminar(el.dataset.eliminar);
      if ((el = b('[data-alternar]'))) return alternar(el.dataset.alternar);
      if (b('[data-ficha-mas]')) return raiz.querySelector('[data-ficha]').insertAdjacentHTML('beforeend', filaFicha());
      if ((el = b('[data-ficha-quitar]'))) return el.closest('.adm__ficha-fila').remove();
      if ((el = b('[data-borrar-foto]'))) return borrarFoto(el.dataset.borrarFoto);
      if ((el = b('[data-mover]'))) return moverFoto(el.dataset.mover, +el.dataset.dir);
    });
    raiz.addEventListener('input', function (e) {
      if (e.target.matches('[data-buscar]')) { filtro.q = e.target.value; pintarLista(); }
      if (e.target.closest('[data-form]')) pintarPrecios();
    });
    raiz.addEventListener('change', function (e) {
      var t = e.target;
      if (t.matches('[data-filtro-metal]')) { filtro.metal = t.value; pintarLista(); }
      if (t.matches('[name=categoria]') || t.matches('[data-metal-on]')) { pintarSubs(); pintarPrecios(); }
      if (t.matches('[data-archivos]')) { subir(t.files); t.value = ''; }
      if (t.matches('[data-foto-tipo]')) {
        C.sb.from('imagenes').update({ tipo: t.value }).eq('id', t.dataset.fotoTipo).then(function (r) {
          C.avisar(r.error ? 'No se pudo cambiar: ' + r.error.message : 'Tipo de foto actualizado.', r.error ? 'error' : null);
        });
      }
    });
    raiz.addEventListener('submit', function (e) {
      e.preventDefault();
      if (e.target.matches('[data-form]')) guardar(e.target);
      if (e.target.matches('[data-form-gramo]')) guardarGramo(e.target);
    });
    raiz.addEventListener('dragover', function (e) { var d = e.target.closest('[data-drop]'); if (d) { e.preventDefault(); d.classList.add('is-over'); } });
    raiz.addEventListener('dragleave', function (e) { var d = e.target.closest('[data-drop]'); if (d) d.classList.remove('is-over'); });
    raiz.addEventListener('drop', function (e) {
      var d = e.target.closest('[data-drop]');
      if (!d) return;
      e.preventDefault(); d.classList.remove('is-over');
      subir(e.dataTransfer.files);
    });
  }

  C.procesarFotoAdmin = procesar;   // se usa también para probar la marca de agua

  document.addEventListener('DOMContentLoaded', function () {
    raiz = document.querySelector('[data-admin]');
    raiz.innerHTML = '<p class="muted" style="padding:60px 0">Cargando…</p>';
    C.auth.listo.then(function (u) {
      if (!u) return sinPermiso(null);
      return C.sb.rpc('es_admin').then(function (r) {
        if (r.error || !r.data) return sinPermiso(u);
        return cargar().then(function () { eventos(); ir('lista'); });
      });
    }).catch(function (e) {
      raiz.innerHTML = '<p class="form-error" style="padding:60px 0">No se pudo cargar: ' + esc(e.message) + '</p>';
    });
  });
})();
