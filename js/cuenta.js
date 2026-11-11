/* Mi cuenta: perfil, medidas y gustos, privacidad y direcciones. */

(function () {
  var C = window.CAMELIA;
  var esc = C.esc;
  var raiz, uid, perfil, dirs = [], editando = null, esAdmin = false;

  function sinSesion() {
    raiz.innerHTML =
      '<section class="area__vacio">' +
        '<span class="logo__name">CAMELIA</span>' +
        '<h1 class="h2">Tu cuenta</h1>' +
        '<p class="muted">Entra con Google para ver tu perfil, tus direcciones y tus pedidos.</p>' +
        '<button class="btn btn--primary" data-entrar>Entrar con Google</button>' +
      '</section>';
    raiz.querySelector('[data-entrar]').addEventListener('click', function () { C.auth.entrar('cuenta.html'); });
  }

  function opciones(lista, actual) {
    return lista.map(function (o) {
      var v = Array.isArray(o) ? o[0] : o, t = Array.isArray(o) ? o[1] : o;
      return '<option value="' + v + '"' + (String(actual || '') === String(v) ? ' selected' : '') + '>' + t + '</option>';
    }).join('');
  }

  function pintar() {
    setTimeout(function () { var l = raiz.querySelector('[data-link-admin]'); if (l) l.hidden = !esAdmin; });
    var falta = C.perfil.faltantes(perfil, dirs);
    var foto = perfil.foto_url || C.auth.foto();
    raiz.innerHTML =
      '<div class="area__head">' +
        '<div class="area__user">' +
          (foto ? '<img class="avatar avatar--xl" src="' + esc(foto) + '" alt="" referrerpolicy="no-referrer">' : '<span class="avatar avatar--xl avatar--letra">' + esc((perfil.nombre || '?')[0]) + '</span>') +
          '<div><span class="label">Mi cuenta</span><h1 class="h2">Hola, ' + esc((perfil.nombre || '').split(' ')[0] || 'bienvenida') + '</h1>' +
          '<p class="muted small">' + esc(perfil.email) + ' · entras con Google</p></div>' +
        '</div>' +
        '<div class="adm__acciones"><a class="btn btn--primary" href="admin.html" data-link-admin hidden>Panel de administración</a>' +
        '<button class="btn btn--ghost" data-salir>Cerrar sesión</button></div>' +
      '</div>' +

      (falta.length
        ? '<div class="aviso aviso--pendiente">' + C.icon('seal') + '<div><strong>Completa tu perfil para comprar más rápido</strong><p class="small">Te falta: ' + falta.join(', ') + '.</p></div></div>'
        : '<div class="aviso aviso--ok">' + C.icon('shield') + '<div><strong>Tu perfil está listo para comprar</strong><p class="small">Tus datos y tu dirección se llenarán solos en el checkout.</p></div></div>') +

      '<div class="area__grid">' +
        '<form class="area__card" data-perfil novalidate>' +
          '<h2 class="h4">Datos personales</h2>' +
          '<div class="form-grid">' +
            C.campo('Nombre completo', '<input class="input" name="nombre" required value="' + esc(perfil.nombre) + '">', true) +
            C.campo('Correo (de tu cuenta de Google)', '<input class="input" value="' + esc(perfil.email) + '" disabled>', true) +
            C.campo('Celular (WhatsApp)', '<input class="input" name="celular" inputmode="tel" placeholder="300 123 4567" value="' + esc(perfil.celular) + '">') +
            C.campo('Cumpleaños <em>(opcional)</em>', '<input class="input" type="date" name="fecha_nacimiento" value="' + esc(perfil.fecha_nacimiento) + '">') +
            C.campo('Tipo de documento', '<select class="select" name="tipo_documento"><option value="">Elige…</option>' +
              opciones([['CC', 'Cédula de ciudadanía'], ['CE', 'Cédula de extranjería'], ['NIT', 'NIT (empresa)'], ['PP', 'Pasaporte'], ['TI', 'Tarjeta de identidad']], perfil.tipo_documento) + '</select>') +
            C.campo('Número de documento', '<input class="input" name="numero_documento" inputmode="numeric" value="' + esc(perfil.numero_documento) + '">') +
          '</div>' +
          '<p class="small muted">Tu documento lo pedimos solo para la factura electrónica y la guía de envío.</p>' +

          '<h2 class="h4" style="margin-top:28px">Tus medidas y gustos <em class="muted small">(opcional)</em></h2>' +
          '<p class="small muted">Así te sugerimos la talla correcta y te mostramos primero lo que te gusta.</p>' +
          '<div class="form-grid">' +
            C.campo('Talla de anillo', '<select class="select" name="talla_anillo"><option value="">No la sé</option>' + opciones(['4', '5', '6', '7', '8', '9', '10', '11', '12'], perfil.talla_anillo) + '</select>') +
            C.campo('Medida de muñeca (cm)', '<input class="input" type="number" min="10" max="30" step="0.5" name="medida_muneca_cm" placeholder="16" value="' + esc(perfil.medida_muneca_cm) + '">') +
            C.campo('Metal preferido', '<select class="select" name="metal_preferido"><option value="">Me gustan los dos</option>' + opciones([['oro', 'Oro 18K'], ['plata', 'Plata 925']], perfil.metal_preferido) + '</select>', true) +
          '</div>' +

          '<h2 class="h4" style="margin-top:28px">Privacidad</h2>' +
          '<label class="check check--legal"><input type="checkbox" name="acepta_datos"' + (perfil.acepta_datos ? ' checked' : '') + '> ' +
            '<span>Autorizo a Camelia el tratamiento de mis datos personales para gestionar mis compras, envíos y facturación, según la <a href="#">Política de tratamiento de datos</a> (Ley 1581 de 2012).' +
            (perfil.acepta_datos_fecha ? ' <em class="muted">Autorizado el ' + new Date(perfil.acepta_datos_fecha).toLocaleDateString('es-CO') + '.</em>' : '') + '</span></label>' +
          '<label class="check check--legal"><input type="checkbox" name="acepta_novedades"' + (perfil.acepta_novedades ? ' checked' : '') + '> ' +
            '<span>Quiero recibir novedades, lanzamientos y ofertas por correo o WhatsApp.</span></label>' +
          '<p class="form-error" data-perfil-error hidden></p>' +
          '<div class="form-actions"><button class="btn btn--primary" type="submit">Guardar mis datos</button></div>' +
        '</form>' +

        '<section class="area__card">' +
          '<div class="area__card-head"><h2 class="h4">Direcciones de envío</h2>' +
            (editando === null ? '<button class="link-arrow" data-dir-nueva>+ Agregar dirección</button>' : '') + '</div>' +
          (editando === 'nueva' ? C.direcciones.formHTML(null, perfil.nombre, perfil.celular) : '') +
          (dirs.length ? dirs.map(function (d) {
            if (editando === d.id) return C.direcciones.formHTML(d);
            return '<article class="dir">' +
              '<div><strong>' + esc(d.alias) + '</strong>' + (d.predeterminada ? ' <span class="tag tag--soft">Principal</span>' : '') +
              '<p class="small">' + esc(d.nombre_recibe) + ' · ' + esc(d.celular) + '</p>' +
              '<p class="small muted">' + C.direcciones.texto(d) + '</p></div>' +
              '<div class="dir__acc">' +
                (d.predeterminada ? '' : '<button class="link-arrow small" data-dir-principal="' + d.id + '">Hacer principal</button>') +
                '<button class="link-arrow small" data-dir-editar="' + d.id + '">Editar</button>' +
                '<button class="link-arrow small" data-dir-borrar="' + d.id + '">Borrar</button>' +
              '</div></article>';
          }).join('') : (editando === 'nueva' ? '' : '<p class="muted small">Aún no tienes direcciones guardadas.</p>')) +
        '</section>' +

        '<section class="area__card">' +
          '<h2 class="h4">Mis pedidos</h2>' +
          '<p class="muted small">Aquí verás tus pedidos, su estado y el certificado de oro 18K de cada joya.</p>' +
          '<a class="btn btn--ghost" href="categoria.html">Ver joyas</a>' +
        '</section>' +
      '</div>';
  }

  /* --- Guardar perfil --- */
  function guardarPerfil(form) {
    var f = new FormData(form);
    var err = form.querySelector('[data-perfil-error]');
    var cambios = {
      nombre: String(f.get('nombre') || '').trim(),
      celular: C.limpiarCelular(f.get('celular')) || null,
      fecha_nacimiento: f.get('fecha_nacimiento') || null,
      tipo_documento: f.get('tipo_documento') || null,
      numero_documento: String(f.get('numero_documento') || '').trim() || null,
      talla_anillo: f.get('talla_anillo') || null,
      medida_muneca_cm: f.get('medida_muneca_cm') ? Number(f.get('medida_muneca_cm')) : null,
      metal_preferido: f.get('metal_preferido') || null,
      acepta_datos: !!f.get('acepta_datos'),
      acepta_novedades: !!f.get('acepta_novedades'),
    };
    var problemas = [];
    if (cambios.nombre.length < 3) problemas.push('Escribe tu nombre completo.');
    if (cambios.celular && !C.celularValido(cambios.celular)) problemas.push('El celular debe tener 10 dígitos y empezar por 3.');
    if (!!cambios.tipo_documento !== !!cambios.numero_documento) problemas.push('Escribe el tipo y el número de documento.');
    if (cambios.numero_documento && !/^[0-9A-Za-z.-]{4,20}$/.test(cambios.numero_documento)) problemas.push('Revisa el número de documento.');
    if (problemas.length) { err.textContent = problemas.join(' '); err.hidden = false; return; }
    err.hidden = true;
    var btn = form.querySelector('[type=submit]');
    btn.disabled = true;
    C.perfil.guardar(uid, cambios)
      .then(function (p) { perfil = p; pintar(); C.avisar('Tus datos quedaron guardados.'); })
      .catch(function (e) { err.textContent = 'No se pudo guardar: ' + e.message; err.hidden = false; btn.disabled = false; });
  }

  function recargarDirs() {
    return C.direcciones.cargar().then(function (d) { dirs = d; editando = null; pintar(); });
  }

  function eventos() {
    raiz.addEventListener('submit', function (e) {
      e.preventDefault();
      if (e.target.matches('[data-perfil]')) return guardarPerfil(e.target);
      if (e.target.matches('[data-dir-form]')) {
        var form = e.target, r = C.direcciones.leerForm(form), err = form.querySelector('[data-dir-error]');
        if (r.error) { err.textContent = r.error; err.hidden = false; return; }
        form.querySelector('[type=submit]').disabled = true;
        C.direcciones.guardar(uid, r.datos, form.dataset.id)
          .then(function () { C.avisar('Dirección guardada.'); return recargarDirs(); })
          .catch(function (x) { err.textContent = 'No se pudo guardar: ' + x.message; err.hidden = false; form.querySelector('[type=submit]').disabled = false; });
      }
    });
    raiz.addEventListener('click', function (e) {
      var b = function (s) { return e.target.closest(s); };
      var el;
      if (b('[data-salir]')) return C.auth.salir();
      if (b('[data-dir-nueva]')) { editando = 'nueva'; return pintar(); }
      if (b('[data-dir-cancelar]')) { editando = null; return pintar(); }
      if ((el = b('[data-dir-editar]'))) { editando = el.dataset.dirEditar; return pintar(); }
      if ((el = b('[data-dir-principal]'))) {
        return C.sb.from('direcciones').update({ predeterminada: true }).eq('id', el.dataset.dirPrincipal).then(recargarDirs);
      }
      if ((el = b('[data-dir-borrar]')) && confirm('¿Borrar esta dirección?')) {
        return C.direcciones.borrar(el.dataset.dirBorrar).then(function () { C.avisar('Dirección borrada.'); return recargarDirs(); });
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    raiz = document.querySelector('[data-pagina-cuenta]');
    C.auth.listo.then(function (u) {
      if (!u) return sinSesion();
      uid = u.id;
      return Promise.all([C.perfil.cargar(uid), C.direcciones.cargar()]).then(function (r) {
        perfil = r[0]; dirs = r[1];
        pintar();
        eventos();
        // Si la cuenta es de administrador, mostrar el acceso al panel
        C.sb.rpc('es_admin').then(function (x) {
          if (!x.data) return;
          esAdmin = true;
          var l = raiz.querySelector('[data-link-admin]'); if (l) l.hidden = false;
        });
      });
    }).catch(function (e) {
      raiz.innerHTML = '<p class="form-error" style="padding:60px 0">No se pudo cargar tu cuenta: ' + esc(e.message) + '</p>';
    });
  });
})();
