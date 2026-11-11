/* Checkout: exige sesión con Google, completa datos y dirección, y resume el pedido.
   Mientras no haya pasarela de pago, el pedido se confirma por WhatsApp con todo el detalle. */

(function () {
  var C = window.CAMELIA;
  var esc = C.esc;
  var WHATSAPP = '570000000000';   // reemplazar por el número de Camelia (código de país + número)
  var raiz, uid, perfil, dirs = [], dirSel = null, nuevaDir = false;

  function totales() {
    var sub = C.state.cart.reduce(function (n, i) { return n + i.price * i.qty; }, 0);
    var envio = sub >= C.ENVIO.gratisDesde ? 0 : C.ENVIO.costo;
    return { sub: sub, envio: envio, total: sub + envio };
  }

  function sinSesion() {
    raiz.innerHTML = '<section class="area__vacio"><span class="logo__name">CAMELIA</span>' +
      '<h1 class="h2">Finalizar compra</h1>' +
      '<p class="muted">Para finalizar tu compra entra con Google. Es un clic y guardamos tus datos para la próxima.</p>' +
      '<button class="btn btn--primary" data-entrar>Entrar con Google</button></section>';
    raiz.querySelector('[data-entrar]').addEventListener('click', function () { C.auth.entrar('checkout.html'); });
    C.auth.entrar('checkout.html', 'Para finalizar tu compra entra con Google. Es un clic y guardamos tus datos para la próxima.');
  }

  function carritoVacio() {
    raiz.innerHTML = '<section class="area__vacio"><h1 class="h2">Tu bolsa está vacía</h1>' +
      '<p class="muted">Agrega una joya o diseña la tuya para continuar.</p>' +
      '<a class="btn btn--primary" href="categoria.html">Ver joyas</a></section>';
  }

  function pintar() {
    var t = totales();
    if (!dirSel && dirs.length) dirSel = (dirs.find(function (d) { return d.predeterminada; }) || dirs[0]).id;
    raiz.innerHTML =
      '<div class="area__head"><div><span class="label">Paso final</span><h1 class="h2">Finalizar compra</h1></div>' +
        '<span class="cert-badge">' + C.icon('shield') + C.CERTIFICADO + '</span></div>' +
      '<div class="co">' +
        '<div class="co__pasos">' +
          '<form class="area__card" data-datos novalidate>' +
            '<h2 class="h4"><span class="co__n">1</span>Tus datos</h2>' +
            '<div class="form-grid">' +
              C.campo('Nombre completo', '<input class="input" name="nombre" required value="' + esc(perfil.nombre) + '">', true) +
              C.campo('Celular (WhatsApp)', '<input class="input" name="celular" inputmode="tel" required placeholder="300 123 4567" value="' + esc(perfil.celular) + '">') +
              C.campo('Correo', '<input class="input" value="' + esc(perfil.email) + '" disabled>') +
              C.campo('Tipo de documento', '<select class="select" name="tipo_documento" required><option value="">Elige…</option>' +
                [['CC', 'Cédula de ciudadanía'], ['CE', 'Cédula de extranjería'], ['NIT', 'NIT (empresa)'], ['PP', 'Pasaporte'], ['TI', 'Tarjeta de identidad']].map(function (o) {
                  return '<option value="' + o[0] + '"' + (perfil.tipo_documento === o[0] ? ' selected' : '') + '>' + o[1] + '</option>';
                }).join('') + '</select>') +
              C.campo('Número de documento', '<input class="input" name="numero_documento" inputmode="numeric" required value="' + esc(perfil.numero_documento) + '">') +
            '</div>' +
            '<p class="small muted">Lo usamos para tu factura electrónica y la guía de envío.</p>' +
          '</form>' +

          '<section class="area__card">' +
            '<h2 class="h4"><span class="co__n">2</span>Dirección de envío</h2>' +
            (dirs.length ? '<div class="co__dirs">' + dirs.map(function (d) {
              return '<label class="co__dir"><input type="radio" name="dir" value="' + d.id + '"' + (d.id === dirSel && !nuevaDir ? ' checked' : '') + '>' +
                '<span><strong>' + esc(d.alias) + '</strong> · ' + esc(d.nombre_recibe) + ' · ' + esc(d.celular) +
                '<br><span class="muted small">' + C.direcciones.texto(d) + '</span></span></label>';
            }).join('') + '</div>' : '') +
            (nuevaDir || !dirs.length
              ? C.direcciones.formHTML(null, perfil.nombre, perfil.celular)
              : '<button class="link-arrow" data-dir-nueva>+ Enviar a otra dirección</button>') +
          '</section>' +
        '</div>' +

        '<aside class="area__card co__resumen">' +
          '<h2 class="h4"><span class="co__n">3</span>Tu pedido</h2>' +
          '<ul class="co__items">' + C.state.cart.map(function (i) {
            return '<li><span class="co__img">' + C.jewelSVG(i.shape, i.metal, i.opts) + '</span>' +
              '<span class="co__txt"><strong>' + esc(i.name) + '</strong><span class="muted small">' + esc(i.detail) + ' · x' + i.qty + '</span></span>' +
              '<span class="price">' + C.formatCOP(i.price * i.qty) + '</span></li>';
          }).join('') + '</ul>' +
          '<dl class="tj__lines">' +
            '<div><dt>Subtotal</dt><dd class="price">' + C.formatCOP(t.sub) + '</dd></div>' +
            '<div><dt>Envío asegurado</dt><dd class="price">' + (t.envio ? C.formatCOP(t.envio) : 'Gratis') + '</dd></div>' +
          '</dl>' +
          (t.envio ? '<p class="small muted">Envío gratis en compras desde ' + C.formatCOP(C.ENVIO.gratisDesde) + '.</p>' : '') +
          '<div class="panel__price"><span class="muted">Total (IVA incluido)</span><span class="price">' + C.formatCOP(t.total) + '</span></div>' +
          '<label class="check check--legal"><input type="checkbox" data-acepta-datos' + (perfil.acepta_datos ? ' checked' : '') + '> ' +
            '<span>Autorizo el tratamiento de mis datos personales según la <a href="#">Política de tratamiento de datos</a> (Ley 1581 de 2012).</span></label>' +
          '<label class="check check--legal"><input type="checkbox" data-acepta-terminos> <span>Acepto los <a href="#">Términos y condiciones</a> y la política de cambios.</span></label>' +
          '<p class="form-error" data-co-error hidden></p>' +
          '<button class="btn btn--primary btn--block" data-confirmar>' + C.icon('whatsapp') + 'Confirmar pedido por WhatsApp</button>' +
          '<p class="small muted">Te escribimos para confirmar y enviarte el link de pago (PSE, Nequi o tarjeta).</p>' +
        '</aside>' +
      '</div>';
  }

  function error(texto) {
    var el = raiz.querySelector('[data-co-error]');
    el.textContent = texto; el.hidden = !texto;
    if (texto) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function confirmar() {
    var f = new FormData(raiz.querySelector('[data-datos]'));
    var datos = {
      nombre: String(f.get('nombre') || '').trim(),
      celular: C.limpiarCelular(f.get('celular')),
      tipo_documento: f.get('tipo_documento') || null,
      numero_documento: String(f.get('numero_documento') || '').trim(),
      acepta_datos: raiz.querySelector('[data-acepta-datos]').checked,
    };
    var faltan = [];
    if (datos.nombre.length < 3) faltan.push('tu nombre');
    if (!C.celularValido(datos.celular)) faltan.push('un celular válido');
    if (!datos.tipo_documento || !/^[0-9A-Za-z.-]{4,20}$/.test(datos.numero_documento)) faltan.push('tu documento');
    if (!datos.acepta_datos) faltan.push('la autorización de datos');
    if (!raiz.querySelector('[data-acepta-terminos]').checked) faltan.push('aceptar los términos');

    var formDir = raiz.querySelector('[data-dir-form]');
    var dirNueva = null;
    if (formDir) {
      var r = C.direcciones.leerForm(formDir);
      if (r.error) { formDir.querySelector('[data-dir-error]').textContent = r.error; formDir.querySelector('[data-dir-error]').hidden = false; faltan.push('la dirección de envío'); }
      else dirNueva = r.datos;
    } else if (!dirSel) faltan.push('la dirección de envío');
    if (faltan.length) return error('Para continuar falta: ' + faltan.join(', ') + '.');
    error('');

    var btn = raiz.querySelector('[data-confirmar]');
    btn.disabled = true;
    // Guarda los datos en el perfil (para la próxima compra) y la dirección nueva
    C.perfil.guardar(uid, datos)
      .then(function (p) { perfil = p; return dirNueva ? C.direcciones.guardar(uid, dirNueva) : dirs.find(function (d) { return d.id === dirSel; }); })
      .then(function (dir) {
        var t = totales();
        var lineas = C.state.cart.map(function (i) { return '• ' + i.name + ' (' + i.detail + ') x' + i.qty + ' — ' + C.formatCOP(i.price * i.qty); });
        var msg = 'Hola Camelia, quiero confirmar este pedido:\n\n' + lineas.join('\n') +
          '\n\nSubtotal: ' + C.formatCOP(t.sub) + '\nEnvío: ' + (t.envio ? C.formatCOP(t.envio) : 'Gratis') + '\nTotal: ' + C.formatCOP(t.total) +
          '\n\nCliente: ' + perfil.nombre + ' · ' + perfil.tipo_documento + ' ' + perfil.numero_documento + ' · ' + perfil.celular + ' · ' + perfil.email +
          '\nEnvío a: ' + dir.nombre_recibe + ' (' + dir.celular + '), ' + dir.direccion + (dir.barrio ? ', ' + dir.barrio : '') +
          (dir.detalle ? ', ' + dir.detalle : '') + ', ' + dir.ciudad + ', ' + dir.departamento;
        window.open('https://wa.me/' + WHATSAPP + '?text=' + encodeURIComponent(msg), '_blank', 'noopener');
        btn.disabled = false;
        C.avisar('Abrimos WhatsApp con tu pedido. Te confirmamos en minutos.');
      })
      .catch(function (e) { btn.disabled = false; error('No se pudo guardar: ' + e.message); });
  }

  function eventos() {
    raiz.addEventListener('change', function (e) {
      if (e.target.name === 'dir') { dirSel = e.target.value; nuevaDir = false; var f = raiz.querySelector('[data-dir-form]'); if (f && dirs.length) { pintar(); } }
    });
    raiz.addEventListener('click', function (e) {
      if (e.target.closest('[data-dir-nueva]')) { nuevaDir = true; dirSel = null; pintar(); }
      if (e.target.closest('[data-dir-cancelar]')) { nuevaDir = false; pintar(); }
      if (e.target.closest('[data-confirmar]')) confirmar();
    });
    raiz.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!e.target.matches('[data-dir-form]')) return;
      var form = e.target, r = C.direcciones.leerForm(form), err = form.querySelector('[data-dir-error]');
      if (r.error) { err.textContent = r.error; err.hidden = false; return; }
      C.direcciones.guardar(uid, r.datos).then(function (d) {
        return C.direcciones.cargar().then(function (lista) { dirs = lista; dirSel = d.id; nuevaDir = false; pintar(); C.avisar('Dirección guardada.'); });
      }).catch(function (x) { err.textContent = 'No se pudo guardar: ' + x.message; err.hidden = false; });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    raiz = document.querySelector('[data-pagina-checkout]');
    if (!C.state.cart.length) return carritoVacio();
    C.auth.listo.then(function (u) {
      if (!u) return sinSesion();
      uid = u.id;
      return Promise.all([C.perfil.cargar(uid), C.direcciones.cargar()]).then(function (r) {
        perfil = r[0]; dirs = r[1];
        pintar();
        eventos();
      });
    }).catch(function (e) { raiz.innerHTML = '<p class="form-error" style="padding:60px 0">No se pudo cargar: ' + esc(e.message) + '</p>'; });
  });
})();
