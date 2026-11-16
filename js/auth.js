/* Sesión de usuario (Supabase Auth): con Google o con correo y contraseña.
   Sin cuenta no se puede comprar.
   - Ícono de cuenta del encabezado: abre la ventana para entrar o va a "Mi cuenta".
   - "Finalizar compra": pide entrar antes de ir al checkout.
   Uso desde otras páginas: CAMELIA.auth.listo (promesa con el usuario o null),
   CAMELIA.auth.entrar(destino, motivo), CAMELIA.auth.salir(), CAMELIA.sb (cliente). */

(function () {
  var C = window.CAMELIA;
  var sb = null;
  try {
    sb = window.supabase.createClient(C.SUPABASE.url, C.SUPABASE.key, {
      auth: { flowType: 'pkce', persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    });
  } catch (e) { sb = null; }
  C.sb = sb;

  var usuario = null;
  var resolver;
  var listo = new Promise(function (r) { resolver = r; });

  var auth = C.auth = {
    listo: listo,
    usuario: function () { return usuario; },
    nombre: function () {
      if (!usuario) return '';
      var m = usuario.user_metadata || {};
      return m.full_name || m.name || usuario.email;
    },
    foto: function () { return usuario && usuario.user_metadata ? usuario.user_metadata.avatar_url : ''; },

    /* destino: página a la que vuelve después de entrar */
    entrarConGoogle: function (destino) {
      if (!sb) { alert('No se pudo conectar con el servicio de cuentas.'); return; }
      var url = new URL(destino || location.pathname + location.search, location.href).href;
      sb.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: url, queryParams: { prompt: 'select_account' } } })
        .then(function (r) { if (r.error) mostrarError(r.error.message); });
    },
    entrar: function (destino, motivo) { abrirVentana(destino, motivo); },
    /* Correo y contraseña */
    entrarConCorreo: function (email, clave) { return sb.auth.signInWithPassword({ email: email, password: clave }); },
    crearCuenta: function (nombre, email, clave, destino) {
      return sb.auth.signUp({ email: email, password: clave, options: { data: { full_name: nombre, name: nombre }, emailRedirectTo: urlDe(destino || 'cuenta.html') } });
    },
    recuperar: function (email) { return sb.auth.resetPasswordForEmail(email, { redirectTo: urlDe('cuenta.html') }); },
    salir: function () {
      if (!sb) return;
      sb.auth.signOut().then(function () { location.href = 'index.html'; });
    },
  };

  function urlDe(destino) { return new URL(destino, location.href).href; }

  /* Mensajes de Supabase en español */
  function traducir(m) {
    m = String(m || '');
    if (/invalid login credentials/i.test(m)) return 'Correo o contraseña incorrectos.';
    if (/email not confirmed/i.test(m)) return 'Primero confirma tu correo: abre el mensaje que te enviamos (revisa también spam).';
    if (/already registered|already exists/i.test(m)) return 'Ese correo ya tiene cuenta. Entra con tu contraseña o recupérala.';
    if (/password should be|weak password|at least/i.test(m)) return 'La contraseña debe tener al menos 8 caracteres.';
    if (/rate limit|too many|security purposes/i.test(m)) return 'Demasiados intentos. Espera un momento e inténtalo de nuevo.';
    if (/invalid email|unable to validate email/i.test(m)) return 'Revisa el correo: no parece válido.';
    if (/same.*password|different from the old/i.test(m)) return 'La nueva contraseña debe ser distinta de la anterior.';
    return m || 'Algo salió mal. Inténtalo de nuevo.';
  }

  /* ---------- Ventana "Entrar" (Google o correo) ---------- */
  var MODOS = {
    entrar: { titulo: 'Entra a tu cuenta', boton: 'Entrar' },
    crear: { titulo: 'Crea tu cuenta', boton: 'Crear cuenta' },
    olvido: { titulo: 'Recupera tu contraseña', boton: 'Enviar enlace' },
    nueva: { titulo: 'Elige una contraseña nueva', boton: 'Guardar contraseña' },
  };
  function formCorreo(modo) {
    var c = function (nombre, tipo, etiqueta, extra) {
      return '<label class="campo"><span>' + etiqueta + '</span><input class="input" name="' + nombre + '" type="' + tipo + '" required ' + (extra || '') + '></label>';
    };
    var campos = '';
    if (modo === 'crear') campos += c('nombre', 'text', 'Nombre completo', 'autocomplete="name"');
    if (modo !== 'nueva') campos += c('email', 'email', 'Correo electrónico', 'autocomplete="email" inputmode="email"');
    if (modo !== 'olvido') campos += c('clave', 'password', modo === 'entrar' ? 'Contraseña' : 'Contraseña (mínimo 8 caracteres)', 'minlength="8" autocomplete="' + (modo === 'entrar' ? 'current-password' : 'new-password') + '"');
    var pie = {
      entrar: '<button type="button" class="login__link" data-modo="olvido">¿Olvidaste tu contraseña?</button>' +
              '<p class="small">¿No tienes cuenta? <button type="button" class="login__link" data-modo="crear">Créala con tu correo</button></p>',
      crear: '<p class="small">¿Ya tienes cuenta? <button type="button" class="login__link" data-modo="entrar">Entra</button></p>',
      olvido: '<p class="small"><button type="button" class="login__link" data-modo="entrar">Volver a entrar</button></p>',
      nueva: '',
    }[modo];
    return '<form class="login__form" data-login-form novalidate>' + campos +
      '<p class="small login__error" data-login-error hidden></p><p class="small login__ok" data-login-ok hidden></p>' +
      '<button class="btn btn--primary btn--block" type="submit">' + MODOS[modo].boton + '</button>' + pie + '</form>';
  }
  function pintarModo(v, modo) {
    v.dataset.modo = modo;
    v.querySelector('#login-titulo').textContent = MODOS[modo].titulo;
    v.querySelector('[data-login-correo]').innerHTML = formCorreo(modo);
    v.querySelector('[data-login-google-zona]').hidden = modo === 'olvido' || modo === 'nueva';
    var primero = v.querySelector('[data-login-form] input'); if (primero && modo !== 'entrar') primero.focus();
  }
  function avisoForm(tipo, texto) {
    var v = document.querySelector('[data-login]');
    var err = v.querySelector('[data-login-error]'), ok = v.querySelector('[data-login-ok]');
    err.hidden = tipo !== 'error'; ok.hidden = tipo !== 'ok';
    (tipo === 'error' ? err : ok).textContent = texto || '';
  }
  function enviarCorreo(v, form) {
    var modo = v.dataset.modo, f = new FormData(form);
    var nombre = String(f.get('nombre') || '').trim(), email = String(f.get('email') || '').trim().toLowerCase(), clave = String(f.get('clave') || '');
    if (modo === 'crear' && nombre.length < 3) return avisoForm('error', 'Escribe tu nombre completo.');
    if (modo !== 'nueva' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return avisoForm('error', 'Escribe un correo válido.');
    if (modo !== 'olvido' && modo !== 'entrar' && clave.length < 8) return avisoForm('error', 'La contraseña debe tener al menos 8 caracteres.');
    if (modo === 'entrar' && !clave) return avisoForm('error', 'Escribe tu contraseña.');
    var btn = form.querySelector('[type=submit]'), texto = btn.textContent;
    btn.disabled = true; btn.textContent = 'Un momento…';
    var listoBtn = function () { btn.disabled = false; btn.textContent = texto; };
    var p;
    if (modo === 'entrar') p = auth.entrarConCorreo(email, clave).then(function (r) {
      if (r.error) throw r.error;
      cerrarVentana();
      location.href = v.dataset.destino || location.href;
    });
    if (modo === 'crear') p = auth.crearCuenta(nombre, email, clave, v.dataset.destino).then(function (r) {
      if (r.error) throw r.error;
      if (r.data.user && r.data.user.identities && !r.data.user.identities.length) throw new Error('already registered');
      if (r.data.session) { cerrarVentana(); location.href = v.dataset.destino || location.href; return; }
      form.querySelectorAll('input').forEach(function (i) { i.closest('label').hidden = true; });
      btn.hidden = true;
      avisoForm('ok', 'Te enviamos un correo a ' + email + '. Ábrelo y toca "Confirmar mi cuenta" para terminar. Si no llega en un par de minutos, revisa spam.');
    });
    if (modo === 'olvido') p = auth.recuperar(email).then(function (r) {
      if (r.error) throw r.error;
      avisoForm('ok', 'Si ' + email + ' tiene cuenta, te llegará un enlace para elegir una contraseña nueva.');
      listoBtn();
    });
    if (modo === 'nueva') p = sb.auth.updateUser({ password: clave }).then(function (r) {
      if (r.error) throw r.error;
      cerrarVentana();
      if (C.avisar) C.avisar('Tu contraseña quedó cambiada.');
    });
    p.catch(function (e) { listoBtn(); avisoForm('error', traducir(e.message)); });
  }

  var G_LOGO = '<svg viewBox="0 0 48 48" width="20" height="20" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>';

  function abrirVentana(destino, motivo, modo) {
    var v = document.querySelector('[data-login]');
    if (!v) {
      document.body.insertAdjacentHTML('beforeend',
        '<div class="login" data-login hidden role="dialog" aria-modal="true" aria-labelledby="login-titulo">' +
          '<div class="login__fondo" data-login-cerrar></div>' +
          '<div class="login__caja">' +
            '<button class="icon-btn login__x" data-login-cerrar aria-label="Cerrar">' + C.icon('close') + '</button>' +
            '<span class="logo__name">CAMELIA</span>' +
            '<h2 class="h3" id="login-titulo">Entra a tu cuenta</h2>' +
            '<p class="muted" data-login-motivo></p>' +
            '<div data-login-google-zona><button class="btn-google" data-login-google>' + G_LOGO + '<span>Continuar con Google</span></button>' +
            '<p class="login__o"><span>o con tu correo</span></p></div>' +
            '<div data-login-correo></div>' +
            '<ul class="login__beneficios">' +
              '<li>' + C.icon('heart') + 'Guarda tus favoritos y tus diseños</li>' +
              '<li>' + C.icon('truck') + 'Tus direcciones listas para comprar más rápido</li>' +
              '<li>' + C.icon('seal') + 'Tus pedidos y certificados de oro 18K en un solo lugar</li>' +
            '</ul>' +
            '<p class="small muted login__legal">Al continuar aceptas los <a href="terminos.html" target="_blank">Términos</a> y la <a href="privacidad.html" target="_blank">Política de tratamiento de datos</a>.</p>' +
            '<p class="small login__error" data-login-google-error hidden></p>' +
          '</div>' +
        '</div>');
      v = document.querySelector('[data-login]');
      v.addEventListener('click', function (e) {
        if (e.target.closest('[data-login-cerrar]')) cerrarVentana();
        var m = e.target.closest('[data-modo]');
        if (m) pintarModo(v, m.dataset.modo);
        if (e.target.closest('[data-login-google]')) {
          var b = e.target.closest('[data-login-google]');
          b.disabled = true;
          b.querySelector('span').textContent = 'Abriendo Google…';
          auth.entrarConGoogle(v.dataset.destino);
        }
      });
      v.addEventListener('submit', function (e) { e.preventDefault(); enviarCorreo(v, e.target); });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !v.hidden) cerrarVentana(); });
    }
    v.dataset.destino = destino || '';
    v.querySelector('[data-login-motivo]').textContent = motivo ||
      'Entra con Google o con tu correo. Si no tienes cuenta, la creas en un minuto.';
    var b = v.querySelector('[data-login-google]');
    b.disabled = false; b.querySelector('span').textContent = 'Continuar con Google';
    v.querySelector('[data-login-google-error]').hidden = true;
    pintarModo(v, modo || 'entrar');
    v.hidden = false;
    document.body.classList.add('no-scroll');
    requestAnimationFrame(function () { v.classList.add('is-open'); b.focus(); });
  }
  function cerrarVentana() {
    var v = document.querySelector('[data-login]');
    if (!v) return;
    v.classList.remove('is-open');
    document.body.classList.remove('no-scroll');
    setTimeout(function () { v.hidden = true; }, 250);
  }
  function mostrarError(msg) {
    var el = document.querySelector('[data-login-google-error]');
    if (!el) return alert(msg);
    el.textContent = 'No se pudo abrir Google: ' + msg;
    el.hidden = false;
  }

  /* ---------- Encabezado: foto del usuario en el ícono de cuenta ---------- */
  function pintarEncabezado() {
    document.querySelectorAll('[data-cuenta]').forEach(function (b) {
      if (usuario) {
        var foto = auth.foto();
        b.innerHTML = foto
          ? '<img class="avatar" src="' + foto + '" alt="" referrerpolicy="no-referrer">'
          : '<span class="avatar avatar--letra">' + (auth.nombre()[0] || '?').toUpperCase() + '</span>';
        b.setAttribute('aria-label', 'Mi cuenta (' + auth.nombre() + ')');
        b.title = auth.nombre();
      } else {
        b.innerHTML = C.icon('user');
        b.setAttribute('aria-label', 'Entrar o crear cuenta');
        b.title = 'Entrar';
      }
    });
    document.querySelectorAll('[data-cuenta-texto]').forEach(function (a) {
      a.textContent = usuario ? 'Mi cuenta' : 'Entrar o crear cuenta';
    });
  }

  /* ---------- Clics globales ---------- */
  document.addEventListener('click', function (e) {
    var cta = e.target.closest('[data-cuenta], [data-cuenta-texto]');
    if (cta) {
      e.preventDefault();
      if (usuario) location.href = 'cuenta.html';
      else abrirVentana('cuenta.html');
      return;
    }
    var fin = e.target.closest('[data-checkout]');
    if (fin) {
      e.preventDefault();
      if (!(C.state && C.state.cart && C.state.cart.length)) return;
      if (usuario) location.href = 'checkout.html';
      else abrirVentana('checkout.html', 'Para comprar necesitas una cuenta. Entra con Google o con tu correo; si no tienes, créala en un minuto.');
    }
  });

  /* ---------- Arranque ---------- */
  function fijar(u) {
    usuario = u || null;
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', pintarEncabezado);
    else pintarEncabezado();
    document.dispatchEvent(new CustomEvent('authchange', { detail: usuario }));
  }

  if (!sb) { fijar(null); resolver(null); return; }
  sb.auth.getSession().then(function (r) {
    fijar(r.data.session ? r.data.session.user : null);
    resolver(usuario);
    // Quitar ?code= de la dirección después de volver de Google
    if (/[?&]code=/.test(location.search)) {
      history.replaceState(null, '', location.pathname);
      // El enlace de confirmación se abrió en otro navegador: el correo ya quedó confirmado, solo falta entrar
      if (!usuario) abrirVentana(location.pathname.split('/').pop() || 'cuenta.html', 'Tu correo quedó confirmado. Entra con tu correo y contraseña.', 'entrar');
    }
  });
  sb.auth.onAuthStateChange(function (evento, sesion) {
    if (evento === 'PASSWORD_RECOVERY') setTimeout(function () { abrirVentana('', 'Escribe tu contraseña nueva para terminar.', 'nueva'); }, 0);
    if (evento === 'SIGNED_IN' || evento === 'SIGNED_OUT' || evento === 'USER_UPDATED') fijar(sesion ? sesion.user : null);
  });
})();
