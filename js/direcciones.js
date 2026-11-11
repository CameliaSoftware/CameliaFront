/* Direcciones y perfil del usuario (Supabase). Lo usan "Mi cuenta" y el checkout.
   Las reglas de la base de datos (RLS) garantizan que cada quien solo vea lo suyo. */

(function () {
  var C = window.CAMELIA;

  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  C.esc = esc;

  /* Celular colombiano: 10 dígitos que empiezan por 3 (acepta +57 y espacios) */
  C.celularValido = function (v) { return /^(\+?57)?3\d{9}$/.test(String(v || '').replace(/[\s-]/g, '')); };
  C.limpiarCelular = function (v) { return String(v || '').replace(/[\s-]/g, '').replace(/^\+?57(?=3\d{9}$)/, ''); };

  C.perfil = {
    cargar: function (uid) {
      return C.sb.from('perfiles').select('*').eq('id', uid).maybeSingle().then(function (r) {
        if (r.error) throw r.error;
        if (r.data) return r.data;
        // Si por alguna razón no existe (cuentas creadas antes del sistema), crearlo
        var u = C.auth.usuario();
        return C.sb.from('perfiles').insert({ id: uid, email: u.email, nombre: C.auth.nombre(), foto_url: C.auth.foto() })
          .select().single().then(function (x) { if (x.error) throw x.error; return x.data; });
      });
    },
    guardar: function (uid, cambios) {
      return C.sb.from('perfiles').update(cambios).eq('id', uid).select().single().then(function (r) {
        if (r.error) throw r.error; return r.data;
      });
    },
    /* Lo que falta para poder comprar */
    faltantes: function (p, dirs) {
      var f = [];
      if (!p.celular) f.push('celular');
      if (!p.tipo_documento || !p.numero_documento) f.push('documento');
      if (!dirs.length) f.push('una dirección de envío');
      if (!p.acepta_datos) f.push('la autorización de datos');
      return f;
    },
  };

  C.direcciones = {
    cargar: function () {
      return C.sb.from('direcciones').select('*').order('predeterminada', { ascending: false }).order('creada')
        .then(function (r) { if (r.error) throw r.error; return r.data; });
    },
    guardar: function (uid, datos, id) {
      datos.usuario_id = uid;
      datos.celular = C.limpiarCelular(datos.celular);
      var q = id ? C.sb.from('direcciones').update(datos).eq('id', id) : C.sb.from('direcciones').insert(datos);
      return q.select().single().then(function (r) { if (r.error) throw r.error; return r.data; });
    },
    borrar: function (id) {
      return C.sb.from('direcciones').delete().eq('id', id).then(function (r) { if (r.error) throw r.error; });
    },
    texto: function (d) {
      return esc(d.direccion) + (d.barrio ? ', ' + esc(d.barrio) : '') + (d.detalle ? ' · ' + esc(d.detalle) : '') +
        '<br>' + esc(d.ciudad) + ', ' + esc(d.departamento);
    },
    formHTML: function (d, nombrePorDefecto, celularPorDefecto) {
      d = d || {};
      var deptos = C.DEPARTAMENTOS.map(function (x) {
        return '<option' + (x === d.departamento ? ' selected' : '') + '>' + x + '</option>';
      }).join('');
      return '<form class="dir-form" data-dir-form' + (d.id ? ' data-id="' + d.id + '"' : '') + ' novalidate>' +
        '<div class="form-grid">' +
          campo('Nombre de quien recibe', '<input class="input" name="nombre_recibe" required value="' + esc(d.nombre_recibe || nombrePorDefecto || '') + '">') +
          campo('Celular de quien recibe', '<input class="input" name="celular" inputmode="tel" required placeholder="300 123 4567" value="' + esc(d.celular || celularPorDefecto || '') + '">') +
          campo('Departamento', '<select class="select" name="departamento" required><option value="">Elige…</option>' + deptos + '</select>') +
          campo('Ciudad o municipio', '<input class="input" name="ciudad" required value="' + esc(d.ciudad || '') + '">') +
          campo('Dirección', '<input class="input" name="direccion" required placeholder="Calle 85 # 12-34" value="' + esc(d.direccion || '') + '">', true) +
          campo('Barrio', '<input class="input" name="barrio" value="' + esc(d.barrio || '') + '">') +
          campo('Apto, torre o indicaciones', '<input class="input" name="detalle" placeholder="Apto 502, torre 2" value="' + esc(d.detalle || '') + '">') +
          campo('Nombre para reconocerla', '<input class="input" name="alias" placeholder="Casa, Oficina…" value="' + esc(d.alias || 'Casa') + '">') +
        '</div>' +
        '<label class="check"><input type="checkbox" name="predeterminada"' + (d.predeterminada || !d.id ? ' checked' : '') + '> Usar como dirección principal</label>' +
        '<p class="form-error" data-dir-error hidden></p>' +
        '<div class="form-actions"><button class="btn btn--primary" type="submit">' + (d.id ? 'Guardar cambios' : 'Guardar dirección') + '</button>' +
        '<button class="btn btn--ghost" type="button" data-dir-cancelar>Cancelar</button></div>' +
      '</form>';
    },
    leerForm: function (form) {
      var f = new FormData(form);
      var d = {};
      ['nombre_recibe', 'celular', 'departamento', 'ciudad', 'direccion', 'barrio', 'detalle', 'alias'].forEach(function (k) {
        d[k] = String(f.get(k) || '').trim();
      });
      d.predeterminada = !!f.get('predeterminada');
      var err = [];
      if (d.nombre_recibe.length < 3) err.push('el nombre de quien recibe');
      if (!C.celularValido(d.celular)) err.push('un celular válido (10 dígitos, empieza por 3)');
      if (!d.departamento) err.push('el departamento');
      if (d.ciudad.length < 2) err.push('la ciudad');
      if (d.direccion.length < 5) err.push('la dirección');
      if (!d.alias) d.alias = 'Casa';
      return { datos: d, error: err.length ? 'Falta ' + err.join(', ') + '.' : null };
    },
  };

  function campo(etiqueta, control, ancho) {
    return '<label class="campo' + (ancho ? ' campo--ancho' : '') + '"><span>' + etiqueta + '</span>' + control + '</label>';
  }
  C.campo = campo;

  /* Aviso corto en la parte de abajo */
  var t;
  C.avisar = function (texto, tipo) {
    var el = document.querySelector('.tj-toast');
    if (!el) { el = document.createElement('div'); el.className = 'tj-toast'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
    el.textContent = texto;
    el.classList.toggle('tj-toast--error', tipo === 'error');
    el.classList.add('is-on');
    clearTimeout(t);
    t = setTimeout(function () { el.classList.remove('is-on'); }, 3200);
  };
})();
