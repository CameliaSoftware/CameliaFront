/* Ilustraciones de joyas en SVG con degradados metálicos.
   Sirven de imagen mientras llegan las fotos reales: para usar una foto,
   reemplaza CAMELIA.jewelSVG(...) por una etiqueta <img>. */

(function () {
  var uid = 0;

  var GRADIENTS = {
    plata: ['#F4F5F7', '#B8BCC4', '#E8EAED', '#7D828B'],
    oro: ['#FFF1C9', '#D4AF37', '#F6E3B4', '#8A6A1F'],
  };

  function metalGradient(id, metal, angle) {
    var c = GRADIENTS[metal] || GRADIENTS.plata;
    return '<linearGradient id="' + id + '" x1="0" y1="0" x2="1" y2="1" gradientTransform="rotate(' + (angle || 0) + ' .5 .5)">' +
      '<stop offset="0" stop-color="' + c[0] + '"/>' +
      '<stop offset=".45" stop-color="' + c[1] + '"/>' +
      '<stop offset=".55" stop-color="' + c[2] + '"/>' +
      '<stop offset="1" stop-color="' + c[3] + '"/></linearGradient>';
  }

  function stoneGradient(id, stone) {
    var c = stone === 'color' ? ['#E6F2FF', '#3F6FB5', '#1E3A6B']
      : stone === 'perla' ? ['#FFFFFF', '#F3EEE6', '#D9D1C4']
      : ['#FFFFFF', '#E3EAF2', '#AEB9C6'];
    return '<radialGradient id="' + id + '" cx=".35" cy=".3" r=".8">' +
      '<stop offset="0" stop-color="' + c[0] + '"/><stop offset=".55" stop-color="' + c[1] + '"/>' +
      '<stop offset="1" stop-color="' + c[2] + '"/></radialGradient>';
  }

  function shadow(cx, cy, rx) {
    return '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="7" fill="url(#sh' + uid + ')"/>';
  }

  /* Banda de anillo según la silueta */
  function ringBand(g, t, variant, cx, cy, rx, ry) {
    cx = cx || 100; cy = cy || 104; rx = rx || 50; ry = ry || 22;
    var s = 'fill="none" stroke="url(#' + g + ')" stroke-linejoin="round"';
    switch (variant) {
      case 'minimal':
        return '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '" ' + s + ' stroke-width="' + t * 0.55 + '"/>';
      case 'torcida':
        return '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '" ' + s + ' stroke-width="' + t * 0.6 + '" transform="rotate(-7 ' + cx + ' ' + cy + ')"/>' +
          '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '" ' + s + ' stroke-width="' + t * 0.6 + '" transform="rotate(7 ' + cx + ' ' + cy + ')"/>';
      case 'geometrica':
        var pts = [];
        for (var i = 0; i < 8; i++) {
          var a = (Math.PI * 2 * i) / 8 + Math.PI / 8;
          pts.push((cx + rx * Math.cos(a)).toFixed(1) + ',' + (cy + ry * Math.sin(a)).toFixed(1));
        }
        return '<polygon points="' + pts.join(' ') + '" ' + s + ' stroke-width="' + t + '"/>';
      case 'organica':
        return '<path d="M' + (cx - rx) + ' ' + cy + ' C' + (cx - rx) + ' ' + (cy - ry * 1.5) + ' ' + (cx + rx * 0.3) + ' ' + (cy - ry * 0.7) + ' ' + (cx + rx) + ' ' + (cy - ry * 0.4) +
          ' C' + (cx + rx * 1.15) + ' ' + (cy + ry * 0.8) + ' ' + (cx - rx * 0.2) + ' ' + (cy + ry * 1.5) + ' ' + (cx - rx) + ' ' + cy + 'Z" ' + s + ' stroke-width="' + t * 1.15 + '"/>';
      case 'sello':
        return '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '" ' + s + ' stroke-width="' + t * 0.8 + '"/>' +
          '<rect x="' + (cx - 20) + '" y="' + (cy - ry - 16) + '" width="40" height="26" rx="9" fill="url(#' + g + ')"/>' +
          '<rect x="' + (cx - 14) + '" y="' + (cy - ry - 11) + '" width="28" height="16" rx="6" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="1"/>';
      default:
        return '<ellipse cx="' + cx + '" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '" ' + s + ' stroke-width="' + t + '"/>';
    }
  }

  function gem(sg, x, y, r) {
    return '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="url(#' + sg + ')" stroke="rgba(0,0,0,.08)"/>' +
      '<circle cx="' + (x - r * 0.35) + '" cy="' + (y - r * 0.35) + '" r="' + r * 0.25 + '" fill="#fff" opacity=".85"/>';
  }

  /**
   * shape: anillo | arete | cadena | dije | pulsera | argolla
   * metal: plata | oro
   * opts: { variant, stone, thickness (1-10), angle }
   */
  CAMELIA.jewelSVG = function (shape, metal, opts) {
    opts = opts || {};
    uid++;
    var g = 'mg' + uid, g2 = 'mh' + uid, sg = 'sg' + uid;
    var other = metal === 'oro' ? 'plata' : 'oro';
    var t = 8 + (opts.thickness || 5) * 1.4;
    var stone = opts.stone && opts.stone !== 'ninguna' ? opts.stone : null;
    var body = '';

    switch (shape) {
      case 'arete':
        body = shadow(100, 168, 62) +
          '<ellipse cx="68" cy="102" rx="24" ry="38" fill="none" stroke="url(#' + g + ')" stroke-width="' + t * 0.9 + '"/>' +
          '<ellipse cx="132" cy="102" rx="24" ry="38" fill="none" stroke="url(#' + g + ')" stroke-width="' + t * 0.9 + '"/>' +
          '<path d="M60 68 Q68 60 76 68" fill="none" stroke="rgba(255,255,255,.7)" stroke-width="2"/>' +
          '<path d="M124 68 Q132 60 140 68" fill="none" stroke="rgba(255,255,255,.7)" stroke-width="2"/>' +
          (stone ? gem(sg, 68, 140, 8) + gem(sg, 132, 140, 8) : '');
        break;
      case 'cadena':
        body = shadow(100, 172, 48) +
          '<path d="M34 26 Q100 168 166 26" fill="none" stroke="url(#' + g + ')" stroke-width="5"/>' +
          '<path d="M34 26 Q100 168 166 26" fill="none" stroke="rgba(0,0,0,.18)" stroke-width="5" stroke-dasharray="2 5"/>' +
          (stone === 'perla' ? gem(sg, 100, 106, 12) : stone ? gem(sg, 100, 104, 9) : '');
        break;
      case 'dije':
        body = shadow(100, 176, 34) +
          '<path d="M58 18 Q100 92 142 18" fill="none" stroke="url(#' + g + ')" stroke-width="3"/>' +
          '<circle cx="100" cy="72" r="5" fill="none" stroke="url(#' + g + ')" stroke-width="3"/>' +
          (opts.variant === 'organica'
            ? '<path d="M100 80 C130 92 138 132 100 156 C62 132 70 92 100 80Z" fill="url(#' + g + ')"/>' +
              '<path d="M100 92 C118 102 122 126 100 142" fill="none" stroke="rgba(255,255,255,.6)" stroke-width="2"/>'
            : '<circle cx="100" cy="116" r="34" fill="url(#' + g + ')"/>' +
              '<circle cx="100" cy="116" r="26" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="1.2"/>') +
          (stone ? gem(sg, 100, 116, 9) : '');
        break;
      case 'pulsera':
        body = shadow(100, 152, 74) +
          '<ellipse cx="100" cy="104" rx="72" ry="30" fill="none" stroke="url(#' + g + ')" stroke-width="' + t * 0.6 + '"/>' +
          '<path d="M40 92 Q100 64 160 92" fill="none" stroke="rgba(255,255,255,.65)" stroke-width="2"/>' +
          (stone ? gem(sg, 100, 134, 7) + gem(sg, 74, 131, 5) + gem(sg, 126, 131, 5) : '');
        break;
      case 'argolla':
        body = shadow(100, 154, 70) +
          ringBand(g2, t, opts.variant, 82, 100, 42, 19) +
          ringBand(g, t, opts.variant, 118, 108, 42, 19) +
          (stone ? gem(sg, 118, 86, 6) : '');
        break;
      default: /* anillo */
        body = shadow(100, 152, 60) +
          ringBand(g, t, opts.variant) +
          '<path d="M62 96 Q100 76 138 96" fill="none" stroke="rgba(255,255,255,.65)" stroke-width="2"/>' +
          (stone ? '<path d="M92 82 L100 62 L108 82" fill="none" stroke="url(#' + g + ')" stroke-width="3"/>' + gem(sg, 100, 66, 12) : '');
    }

    return '<svg class="jewel" viewBox="0 0 200 200" role="img" aria-hidden="true" style="--rot:' + (opts.angle || 0) + 'deg">' +
      '<defs>' + metalGradient(g, metal, opts.angle) +
      metalGradient(g2, shape === 'argolla' && opts.variant === 'torcida' ? other : metal, (opts.angle || 0) + 30) +
      stoneGradient(sg, stone) +
      '<radialGradient id="sh' + uid + '"><stop offset="0" stop-color="rgba(60,50,30,.22)"/><stop offset="1" stop-color="rgba(60,50,30,0)"/></radialGradient>' +
      '</defs>' + body + '</svg>';
  };
})();
