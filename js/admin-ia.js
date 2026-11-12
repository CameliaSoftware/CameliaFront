/* Editor de fotos con IA del panel de administración.
   Se sube una foto, se escribe qué cambiar y el servidor (CameliaBack → OpenAI) devuelve la foto editada.
   Se puede seguir corrigiendo sobre el último resultado o volver a cualquier versión anterior.
   Al aprobar, la foto pasa a la subida normal del panel (que le pone la marca de agua).
   La clave de OpenAI vive en el servidor; aquí solo se manda el token de sesión del administrador. */

(function () {
  var C = window.CAMELIA;
  var esc = C.esc;
  C.API_URL = /^(localhost|127\.0\.0\.1)$/.test(location.hostname) ? 'http://localhost:4000' : 'https://cameliaback.onrender.com';

  var SUGERENCIAS = [
    'Fondo blanco limpio de estudio, sombra suave debajo',
    'Fondo gris claro de estudio, luz suave',
    'Sobre tela de satén color champaña',
    'Puesta en la mano de una mujer, uñas naturales',
    'Más luz y brillo en el metal, sin reflejos feos',
    'Quita el polvo, las rayas y los reflejos',
  ];
  var CALIDADES = [['low', 'Rápida (más barata)'], ['medium', 'Normal'], ['high', 'Alta (más cara)']];
  var CLAVE_GASTO = 'camelia-ia-gasto';

  var modal, versiones, actual, ocupado, gastoSesion, alAprobar, nombreJoya;

  function gastoTotal(sumar) {
    var t = 0;
    try { t = parseFloat(localStorage.getItem(CLAVE_GASTO)) || 0; } catch (e) {}
    if (sumar) { t += sumar; try { localStorage.setItem(CLAVE_GASTO, String(t)); } catch (e) {} }
    return t;
  }
  function usd(n) { return 'US$' + (Math.round(n * 100) / 100).toFixed(2); }

  var SIN_SESION = 'Se cerró tu sesión. Recarga la página y vuelve a entrar con Google.';

  /* Token de sesión vigente. Supabase renueva solo el token cuando vence (getSession).
     Si hay que forzar la renovación, se hace UNA sola vez aunque haya varias fotos pidiéndola a la vez:
     cada llave de renovación sirve una vez, y usarla dos veces cierra la sesión. */
  var renovando = null;
  function renovar() {
    if (!renovando) {
      renovando = C.sb.auth.refreshSession().then(function (x) {
        var n = x.data && x.data.session;
        if (!n) throw new Error(SIN_SESION);
        return n.access_token;
      });
      renovando.then(soltar, soltar);
    }
    return renovando;
  }
  function soltar() { setTimeout(function () { renovando = null; }, 2000); }
  function token(forzar) {
    if (forzar || renovando) return renovar();
    return C.sb.auth.getSession().then(function (r) {
      var s = r.data && r.data.session;
      if (!s) throw new Error(SIN_SESION);
      return s.access_token;
    });
  }

  /* Llamada al servidor. Si responde 401 (token viejo), renueva la sesión y reintenta una vez. */
  function api(ruta, opciones, reintento) {
    opciones = opciones || {};
    return token(reintento).then(function (t) {
      var o = Object.assign({}, opciones, { headers: Object.assign({}, opciones.headers || {}, { Authorization: 'Bearer ' + t }) });
      return fetch(C.API_URL + ruta, o).catch(function () {
        throw new Error('No se pudo conectar con el servidor. Espera unos segundos e intenta de nuevo.');
      });
    }).then(function (r) {
      if (r.status === 401 && !reintento) return api(ruta, opciones, true);
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (!r.ok) throw new Error(r.status === 401 ? SIN_SESION : (j.error || 'El servidor respondió ' + r.status + '.'));
        return j;
      });
    });
  }

  function dataUrlABlob(url) { return fetch(url).then(function (r) { return r.blob(); }); }

  /* ---------- Pintar ---------- */
  function pintar() {
    var v = versiones[actual];
    var original = versiones[0];
    modal.querySelector('[data-ia-cuerpo]').innerHTML = !versiones.length ?
      '<label class="adm__drop ia__elegir" data-ia-drop><input type="file" accept="image/jpeg,image/png,image/webp" hidden data-ia-archivo>' +
        '<strong>Elige la foto que quieres mejorar</strong><span class="small muted">JPG, PNG o WebP · una foto a la vez</span></label>' :

      '<div class="ia__comparar">' +
        '<figure><figcaption class="label">Original</figcaption><img src="' + original.url + '" alt="Foto original"></figure>' +
        '<figure><figcaption class="label">' + (actual === 0 ? 'Sin cambios todavía' : 'Versión ' + actual) + '</figcaption>' +
          '<div class="ia__resultado">' + (ocupado ? '<div class="ia__cargando"><span class="ia__spinner"></span>Editando la foto… puede tardar hasta un minuto</div>' : '') +
          '<img src="' + v.url + '" alt="Resultado"></div>' +
          (v.instruccion ? '<p class="small muted ia__pedido">“' + esc(v.instruccion) + '”</p>' : '') + '</figure>' +
      '</div>' +
      (versiones.length > 1 ? '<div class="ia__versiones"><span class="small muted">Versiones (clic para volver a una):</span><div>' + versiones.map(function (x, n) {
        return '<button type="button" class="ia__mini' + (n === actual ? ' is-on' : '') + '" data-ia-version="' + n + '" title="' + esc(n ? 'Versión ' + n + ': ' + x.instruccion : 'Original') + '"><img src="' + x.url + '" alt=""><span>' + (n || 'Orig.') + '</span></button>';
      }).join('') + '</div></div>' : '') +

      '<div class="ia__controles">' +
        '<label class="label" for="ia-instruccion">¿Qué quieres cambiar? ' + (actual ? '(se aplica sobre la versión ' + actual + ')' : '') + '</label>' +
        '<textarea class="input" id="ia-instruccion" rows="3" data-ia-instruccion placeholder="Ej.: fondo blanco limpio, que se vea profesional y con más brillo"></textarea>' +
        '<div class="ia__chips">' + SUGERENCIAS.map(function (s) { return '<button type="button" class="chip" data-ia-sugerencia>' + esc(s) + '</button>'; }).join('') + '</div>' +
        '<div class="ia__fila">' +
          '<label class="small">Calidad <select class="input" data-ia-calidad>' + CALIDADES.map(function (c) { return '<option value="' + c[0] + '"' + (c[0] === 'medium' ? ' selected' : '') + '>' + c[1] + '</option>'; }).join('') + '</select></label>' +
          '<span class="small muted" data-ia-gasto>Gastado en esta sesión: ' + usd(gastoSesion) + ' · total en este navegador: ' + usd(gastoTotal()) + '</span>' +
        '</div>' +
        '<p class="form-error" data-ia-error hidden></p>' +
        '<div class="form-actions">' +
          '<button type="button" class="btn btn--primary" data-ia-aplicar' + (ocupado ? ' disabled' : '') + '>✦ Aplicar cambio</button>' +
          '<button type="button" class="btn btn--ghost" data-ia-usar' + (ocupado ? ' disabled' : '') + '>Usar ' + (actual ? 'la versión ' + actual : 'la original') + ' en la joya</button>' +
          '<button type="button" class="link-arrow small" data-ia-otra>Elegir otra foto</button>' +
        '</div>' +
        '<p class="small muted">La IA solo debe cambiar el fondo, la luz o la escena: revisa siempre que la joya se vea igual a la real antes de usarla.</p>' +
      '</div>';
  }

  function error(msg) {
    var p = modal.querySelector('[data-ia-error]');
    if (!p) return C.avisar(msg, 'error');
    p.textContent = msg; p.hidden = !msg;
  }

  /* ---------- Acciones ---------- */
  function elegir(archivo) {
    if (!archivo || !/^image\//.test(archivo.type)) return;
    var lector = new FileReader();
    lector.onload = function () {
      versiones = [{ url: lector.result, blob: archivo, instruccion: '' }];
      actual = 0;
      pintar();
    };
    lector.readAsDataURL(archivo);
  }

  function aplicar() {
    var campo = modal.querySelector('[data-ia-instruccion]');
    var instruccion = campo.value.trim();
    if (instruccion.length < 3) { error('Escribe qué quieres cambiar en la foto.'); campo.focus(); return; }
    var calidad = modal.querySelector('[data-ia-calidad]').value;
    var base = versiones[actual];
    ocupado = true; pintar();
    modal.querySelector('[data-ia-instruccion]').value = instruccion;
    modal.querySelector('[data-ia-calidad]').value = calidad;
    (base.blob ? Promise.resolve(base.blob) : dataUrlABlob(base.url)).then(function (blob) {
      var form = new FormData();
      form.append('imagen', blob, 'foto.png');
      form.append('instruccion', instruccion);
      form.append('calidad', calidad);
      return api('/api/ia/editar-imagen', { method: 'POST', body: form });
    }).then(function (j) {
      if (j.costoUsd) { gastoSesion += j.costoUsd; gastoTotal(j.costoUsd); }
      versiones.push({ url: j.imagen, instruccion: instruccion });
      actual = versiones.length - 1;
      ocupado = false; pintar();
    }).catch(function (e) {
      ocupado = false; pintar();
      modal.querySelector('[data-ia-instruccion]').value = instruccion;
      error(e.message);
    });
  }

  function usar() {
    var v = versiones[actual];
    var listo = v.blob ? Promise.resolve(v.blob) : dataUrlABlob(v.url);
    listo.then(function (blob) {
      var nombre = (nombreJoya || 'foto').toLowerCase().replace(/[^a-z0-9]+/g, '-') + (actual ? '-ia-' + actual : '') + '.png';
      var archivo = new File([blob], nombre, { type: blob.type || 'image/png' });
      cerrar();
      alAprobar(archivo);
    });
  }

  function cerrar() {
    if (ocupado && !confirm('La IA todavía está trabajando. ¿Cerrar de todas formas? (el cobro ya se hizo)')) return;
    modal.remove(); modal = null;
    document.body.classList.remove('no-scroll');
  }

  /* Para otras partes del panel (paquetes de fotos) */
  C.iaApi = api;
  C.iaGasto = function (n) { gastoTotal(n); };

  /* ---------- Abrir ---------- */
  C.abrirEditorIA = function (joya, callback, archivoInicial) {
    alAprobar = callback; nombreJoya = joya && joya.nombre;
    versiones = []; actual = 0; ocupado = false; gastoSesion = 0;
    modal = document.createElement('div');
    modal.className = 'ia';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.innerHTML = '<div class="ia__caja">' +
      '<div class="ia__head"><div><span class="label">' + esc(nombreJoya || '') + '</span><h2 class="h3">Editar foto con IA</h2></div>' +
      '<button type="button" class="ia__cerrar" data-ia-cerrar aria-label="Cerrar">' + C.icon('close') + '</button></div>' +
      '<div data-ia-estado></div><div data-ia-cuerpo></div></div>';
    document.body.appendChild(modal);
    document.body.classList.add('no-scroll');
    if (archivoInicial) elegir(archivoInicial); else pintar();

    // Avisa si falta la clave de OpenAI en el servidor
    api('/api/ia/estado').then(function (j) {
      if (!j.activo && modal) modal.querySelector('[data-ia-estado]').innerHTML = '<p class="form-error">Falta la clave de OpenAI en el servidor: agrega OPENAI_API_KEY en Render → CameliaBack → Environment.</p>';
    }).catch(function (e) {
      if (modal) modal.querySelector('[data-ia-estado]').innerHTML = '<p class="form-error">' + esc(e.message) + '</p>';
    });

    modal.addEventListener('click', function (e) {
      var b = function (s) { return e.target.closest(s); }, el;
      if (e.target === modal || b('[data-ia-cerrar]')) return cerrar();
      if ((el = b('[data-ia-sugerencia]'))) {
        var t = modal.querySelector('[data-ia-instruccion]');
        t.value = t.value.trim() ? t.value.trim().replace(/[.,]?$/, ', ') + el.textContent.toLowerCase() : el.textContent;
        return t.focus();
      }
      if ((el = b('[data-ia-version]'))) { if (!ocupado) { actual = +el.dataset.iaVersion; pintar(); } return; }
      if (b('[data-ia-aplicar]')) return aplicar();
      if (b('[data-ia-usar]')) return usar();
      if (b('[data-ia-otra]')) { if (!ocupado) { versiones = []; actual = 0; pintar(); } return; }
    });
    modal.addEventListener('change', function (e) {
      if (e.target.matches('[data-ia-archivo]')) elegir(e.target.files[0]);
    });
    modal.addEventListener('dragover', function (e) { if (e.target.closest('[data-ia-drop]')) e.preventDefault(); });
    modal.addEventListener('drop', function (e) {
      if (!e.target.closest('[data-ia-drop]')) return;
      e.preventDefault(); elegir(e.dataTransfer.files[0]);
    });
    document.addEventListener('keydown', function teclaEsc(e) {
      if (!modal) return document.removeEventListener('keydown', teclaEsc);
      if (e.key === 'Escape') cerrar();
    });
  };
})();
