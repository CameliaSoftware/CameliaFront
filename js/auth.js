/* Sesión de usuario: solo con Google (Supabase Auth).
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
    salir: function () {
      if (!sb) return;
      sb.auth.signOut().then(function () { location.href = 'index.html'; });
    },
  };

  /* ---------- Ventana "Entrar con Google" ---------- */
  var G_LOGO = '<svg viewBox="0 0 48 48" width="20" height="20" aria-hidden="true"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="m6.3 14.7 6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>';

  function abrirVentana(destino, motivo) {
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
            '<button class="btn-google" data-login-google>' + G_LOGO + '<span>Continuar con Google</span></button>' +
            '<ul class="login__beneficios">' +
              '<li>' + C.icon('heart') + 'Guarda tus favoritos y tus diseños</li>' +
              '<li>' + C.icon('truck') + 'Tus direcciones listas para comprar más rápido</li>' +
              '<li>' + C.icon('seal') + 'Tus pedidos y certificados de oro 18K en un solo lugar</li>' +
            '</ul>' +
            '<p class="small muted login__legal">No necesitas contraseña: entras con tu cuenta de Google. Al continuar aceptas los <a href="#">Términos</a> y la <a href="#">Política de tratamiento de datos</a>.</p>' +
            '<p class="small login__error" data-login-error hidden></p>' +
          '</div>' +
        '</div>');
      v = document.querySelector('[data-login]');
      v.addEventListener('click', function (e) {
        if (e.target.closest('[data-login-cerrar]')) cerrarVentana();
        if (e.target.closest('[data-login-google]')) {
          var b = e.target.closest('[data-login-google]');
          b.disabled = true;
          b.querySelector('span').textContent = 'Abriendo Google…';
          auth.entrarConGoogle(v.dataset.destino);
        }
      });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !v.hidden) cerrarVentana(); });
    }
    v.dataset.destino = destino || '';
    v.querySelector('[data-login-motivo]').textContent = motivo ||
      'Crea tu perfil o entra con un clic. Usamos tu cuenta de Google, sin contraseñas nuevas.';
    var b = v.querySelector('[data-login-google]');
    b.disabled = false; b.querySelector('span').textContent = 'Continuar con Google';
    v.querySelector('[data-login-error]').hidden = true;
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
    var el = document.querySelector('[data-login-error]');
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
      a.textContent = usuario ? 'Mi cuenta' : 'Entrar con Google';
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
      else abrirVentana('checkout.html', 'Para finalizar tu compra entra con Google. Es un clic y guardamos tus datos para la próxima.');
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
    if (/[?&]code=/.test(location.search)) history.replaceState(null, '', location.pathname);
  });
  sb.auth.onAuthStateChange(function (evento, sesion) {
    if (evento === 'SIGNED_IN' || evento === 'SIGNED_OUT' || evento === 'USER_UPDATED') fijar(sesion ? sesion.user : null);
  });
})();
