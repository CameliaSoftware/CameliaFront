/* Catálogo de Camelia.
   Todo el contenido del sitio (menú, productos, testimonios) sale de aquí.
   Para agregar una joya, copia un objeto de PRODUCTS y cambia sus datos. */

window.CAMELIA = window.CAMELIA || {};

CAMELIA.METALS = {
  plata: { label: 'Plata 925', short: 'Plata' },
  oro: { label: 'Oro 18K', short: 'Oro' },
};

CAMELIA.STONES = {
  ninguna: 'Sin piedra',
  circon: 'Circón',
  perla: 'Perla',
  color: 'Piedra de color',
};

CAMELIA.PRICE_RANGES = [
  { id: 'menos-200', label: 'Menos de $200.000', min: 0, max: 200000 },
  { id: '200-500', label: '$200.000 a $500.000', min: 200000, max: 500000 },
  { id: '500-1500', label: '$500.000 a $1.500.000', min: 500000, max: 1500000 },
  { id: 'mas-1500', label: 'Más de $1.500.000', min: 1500000, max: Infinity },
];

/* Categorías del menú principal. `shape` define el dibujo que se usa como imagen. */
CAMELIA.CATEGORIES = [
  {
    id: 'anillos', name: 'Anillos', shape: 'anillo',
    subs: ['Solitarios', 'Compromiso', 'Sellos', 'Minimalistas', 'Para hombre'],
  },
  {
    id: 'aretes', name: 'Aretes', shape: 'arete',
    subs: ['Candongas', 'Topos', 'Largos', 'Ear cuffs'],
  },
  {
    id: 'cadenas', name: 'Cadenas', shape: 'cadena',
    subs: ['Finas', 'Gruesas', 'Con dije', 'Para hombre'],
  },
  {
    id: 'dijes', name: 'Dijes', shape: 'dije',
    subs: ['Iniciales', 'Naturaleza', 'Religiosos', 'Medallas'],
  },
  {
    id: 'pulseras', name: 'Pulseras', shape: 'pulsera',
    subs: ['Esclavas', 'Tejidas', 'Con dijes', 'Rígidas'],
  },
  {
    id: 'argollas', name: 'Argollas de matrimonio', shortName: 'Argollas', shape: 'argolla',
    subs: ['Clásicas', 'Con piedras', 'Dos tonos', 'Grabadas'],
  },
];

/* metals: precio por metal disponible. El primer metal es el principal.
   model (opcional): modelo 3D en GLB que se puede girar en la página del producto.
   detalle (opcional): cámara de la vista "Detalle" del visor 3D (por defecto, la parte baja del collar). */
CAMELIA.PRODUCTS = [
  { id: 'anillo-orbita', name: 'Anillo Órbita', cat: 'anillos', sub: 'Minimalistas', variant: 'organica',
    desc: 'Acabado espejo', metals: { plata: 189000, oro: 1290000 }, stone: 'ninguna', custom: true },
  { id: 'anillo-sol', name: 'Anillo Sol', cat: 'anillos', sub: 'Minimalistas', variant: 'torcida',
    desc: 'Forma orgánica', metals: { oro: 1290000, plata: 179000 }, stone: 'ninguna', custom: true },
  { id: 'solitario-luna', name: 'Solitario Luna', cat: 'anillos', sub: 'Compromiso', variant: 'clasica',
    desc: 'Circón talla brillante', metals: { oro: 2390000, plata: 259000 }, stone: 'circon', custom: true },
  { id: 'sello-raiz', name: 'Sello Raíz', cat: 'anillos', sub: 'Sellos', variant: 'sello',
    desc: 'Grabado a mano', metals: { plata: 239000, oro: 1890000 }, stone: 'ninguna', custom: true },
  { id: 'anillo-prisma', name: 'Anillo Prisma', cat: 'anillos', sub: 'Para hombre', variant: 'geometrica',
    desc: 'Facetado geométrico', metals: { plata: 219000 }, stone: 'ninguna', custom: false },

  { id: 'aretes-eclipse', name: 'Aretes Eclipse', cat: 'aretes', sub: 'Candongas', variant: 'clasica',
    desc: 'Pulido brillante', metals: { oro: 890000, plata: 159000 }, stone: 'ninguna', custom: false },
  { id: 'topos-rocio', name: 'Topos Rocío', cat: 'aretes', sub: 'Topos', variant: 'minimal',
    desc: 'Perla de agua dulce', metals: { plata: 129000, oro: 590000 }, stone: 'perla', custom: false },
  { id: 'candongas-marea', name: 'Candongas Marea', cat: 'aretes', sub: 'Candongas', variant: 'torcida',
    desc: 'Textura ondulada', metals: { plata: 169000 }, stone: 'ninguna', custom: true },

  { id: 'collar-aura', name: 'Collar Aura', cat: 'cadenas', sub: 'Con dije', variant: 'clasica',
    desc: 'Perla natural', metals: { plata: 249000, oro: 1490000 }, stone: 'perla', custom: false,
    model: 'models/collar-aura.glb' },
  { id: 'cadena-rio', name: 'Cadena Río', cat: 'cadenas', sub: 'Finas', variant: 'minimal',
    desc: 'Eslabón veneciano 45 cm', metals: { oro: 1190000, plata: 149000 }, stone: 'ninguna', custom: false,
    model: 'models/cadena-rio.glb' },
  { id: 'cadena-cauca', name: 'Cadena Cauca', cat: 'cadenas', sub: 'Gruesas', variant: 'clasica',
    desc: 'Eslabón cubano 50 cm', metals: { plata: 329000 }, stone: 'ninguna', custom: false,
    model: 'models/cadena-cauca.glb' },

  { id: 'dije-colibri', name: 'Dije Colibrí', cat: 'dijes', sub: 'Naturaleza', variant: 'organica',
    desc: 'Inspirado en el Caribe', metals: { oro: 690000, plata: 139000 }, stone: 'ninguna', custom: true },
  { id: 'dije-inicial', name: 'Dije Inicial', cat: 'dijes', sub: 'Iniciales', variant: 'sello',
    desc: 'Tu letra, grabada', metals: { plata: 119000, oro: 520000 }, stone: 'ninguna', custom: true },

  { id: 'pulsera-hematita', name: 'Pulsera Hematita', cat: 'pulseras', sub: 'Tejidas', variant: 'clasica',
    desc: 'Hematita mate, cordón ajustable y dije V', metals: { oro: 690000, plata: 169000 }, stone: 'color', custom: true,
    model: 'models/pulsera-hematita.glb', detalle: { orbit: '0deg 85deg 0.045m', target: '-0.014m -0.03m 0m' } },
  { id: 'pulsera-orilla', name: 'Pulsera Orilla', cat: 'pulseras', sub: 'Esclavas', variant: 'clasica',
    desc: 'Cierre invisible', metals: { plata: 199000, oro: 1590000 }, stone: 'ninguna', custom: true },
  { id: 'pulsera-astro', name: 'Pulsera Astro', cat: 'pulseras', sub: 'Con dijes', variant: 'minimal',
    desc: 'Circones de color', metals: { oro: 980000, plata: 189000 }, stone: 'color', custom: false },

  { id: 'argollas-eterna', name: 'Argollas Eterna', cat: 'argollas', sub: 'Clásicas', variant: 'clasica',
    desc: 'Par · confort fit', metals: { oro: 2890000, plata: 389000 }, stone: 'ninguna', custom: true },
  { id: 'argollas-dos-mundos', name: 'Argollas Dos Mundos', cat: 'argollas', sub: 'Dos tonos', variant: 'torcida',
    desc: 'Par · plata y oro', metals: { oro: 1990000 }, stone: 'ninguna', custom: true },
];

CAMELIA.TESTIMONIALS = [
  { quote: 'Diseñé el anillo de compromiso con la forma de la montaña donde nos conocimos. Llegó idéntico.',
    name: 'Laura M.', city: 'Medellín', shape: 'anillo', metal: 'oro' },
  { quote: 'No sabía cómo describir lo que quería y la IA me dio cuatro ideas. La segunda era exactamente eso.',
    name: 'Andrés P.', city: 'Bogotá', shape: 'dije', metal: 'plata' },
  { quote: 'Las argollas de plata y oro son lo más bonito que tenemos. Y a un precio que no esperábamos.',
    name: 'Camila y Juan', city: 'Cali', shape: 'argolla', metal: 'oro' },
  { quote: 'El grabado quedó perfecto y la caja de regalo es una joya en sí misma.',
    name: 'Valentina R.', city: 'Barranquilla', shape: 'pulsera', metal: 'plata' },
];

/* ---------- Ayudas ---------- */

/* ---------- Pulseras tejidas personalizables ----------
   Todo el oro es 18K con certificado de por vida.
   precioGramo: precio de venta del gramo de oro 18K (editar según el mercado).
   pared: grosor de la pared del balín hueco en mm (define el peso). */
CAMELIA.CERTIFICADO = 'Oro 18K certificado de por vida';

/* Dirección del API (CameliaBack). Las fotos de cada producto se piden ahí;
   si el API no responde, la página sigue funcionando con los dibujos. */
CAMELIA.API = /^(localhost|127\.0\.0\.1)$/.test(location.hostname)
  ? 'http://localhost:4000'
  : 'https://api.' + location.hostname.replace(/^www\./, '');   // ej. camelia.co -> https://api.camelia.co

/* Supabase (inicio de sesión con Google). La clave "publishable" es pública por diseño:
   la seguridad la ponen las reglas (RLS) de la base de datos. */
CAMELIA.SUPABASE = {
  url: 'https://tmmpqlckoznoombrlicp.supabase.co',
  key: 'sb_publishable_9Kj0bZ6NAJQSHaAscu4Aeg_RTkUMk5-',
};

CAMELIA.DEPARTAMENTOS = ['Amazonas', 'Antioquia', 'Arauca', 'Atlántico', 'Bogotá D.C.', 'Bolívar', 'Boyacá', 'Caldas',
  'Caquetá', 'Casanare', 'Cauca', 'Cesar', 'Chocó', 'Córdoba', 'Cundinamarca', 'Guainía', 'Guaviare', 'Huila',
  'La Guajira', 'Magdalena', 'Meta', 'Nariño', 'Norte de Santander', 'Putumayo', 'Quindío', 'Risaralda',
  'San Andrés y Providencia', 'Santander', 'Sucre', 'Tolima', 'Valle del Cauca', 'Vaupés', 'Vichada'];

CAMELIA.ENVIO = { gratisDesde: 300000, costo: 15000 };

CAMELIA.ORO18K = {
  precioGramo: 430000,
  densidad: 15.6,           // g/cm³ del oro 18K
  pared: 0.2,               // mm
  medallaGramos: 1.05,      // medalla de 12 mm
};

/* Peso en gramos de un balín hueco de oro 18K según su diámetro en mm */
CAMELIA.pesoBalin = function (diametro) {
  var r = diametro / 2, t = CAMELIA.ORO18K.pared;
  var mm3 = 4 / 3 * Math.PI * (Math.pow(r, 3) - Math.pow(r - t, 3));
  return mm3 * CAMELIA.ORO18K.densidad / 1000;
};

CAMELIA.TEJIDO = {
  estilos: [
    { id: 'tejida', name: 'Tejida en macramé', desc: 'Hilo tejido a mano alrededor de las cuentas', base: 65000 },
    { id: 'hilo', name: 'Balines en hilo', desc: 'Cuentas sobre cordón trenzado, más delicada', base: 38000 },
  ],
  anchos: [
    { id: 'fino', name: 'Fino', tejida: 3.2, hilo: 0.8 },
    { id: 'medio', name: 'Medio', tejida: 4.6, hilo: 1.1 },
    { id: 'grueso', name: 'Grueso', tejida: 6.2, hilo: 1.5 },
  ],
  balines: [3, 4, 5, 6],     // mm
  tallas: [
    { id: 'XS', cm: 14 }, { id: 'S', cm: 15.5 }, { id: 'M', cm: 17 }, { id: 'L', cm: 18.5 }, { id: 'XL', cm: 20 },
  ],
  hilos: [
    { id: 'negro', name: 'Negro', hex: '#151515' }, { id: 'rojo', name: 'Rojo', hex: '#b3121b' },
    { id: 'azul', name: 'Azul noche', hex: '#1d2f6b' }, { id: 'verde', name: 'Verde', hex: '#5f8a1f' },
    { id: 'beige', name: 'Beige', hex: '#d8bf98' }, { id: 'cafe', name: 'Café', hex: '#5a3a22' },
    { id: 'blanco', name: 'Blanco', hex: '#efece6' }, { id: 'rosado', name: 'Rosado', hex: '#e7a3b4' },
  ],
  neoprenos: [
    { id: 'negro', name: 'Negro', hex: '#1b1b1d' }, { id: 'blanco', name: 'Blanco', hex: '#f2f0ec' },
    { id: 'rojo', name: 'Rojo', hex: '#c0262d' }, { id: 'azul', name: 'Azul', hex: '#2453b8' },
    { id: 'verde', name: 'Verde', hex: '#2f9a55' }, { id: 'rosado', name: 'Rosado', hex: '#f08fb0' },
    { id: 'turquesa', name: 'Turquesa', hex: '#2bb3b0' }, { id: 'gris', name: 'Gris', hex: '#7c8088' },
  ],
  precios: { neopreno: 4000, hematita: 6000, nudo: 0 },
};

/* Color del metal en los modelos 3D (se aplica en vivo al material "Metal") */
CAMELIA.METAL_COLOR = {
  plata: [0.80, 0.81, 0.83, 1],
  oro: [1.0, 0.78, 0.36, 1],
};

CAMELIA.formatCOP = function (n) {
  return '$ ' + new Intl.NumberFormat('es-CO').format(Math.round(n)) + ' COP';
};

CAMELIA.getProduct = function (id) {
  return CAMELIA.PRODUCTS.find(function (p) { return p.id === id; });
};

CAMELIA.getCategory = function (id) {
  return CAMELIA.CATEGORIES.find(function (c) { return c.id === id; });
};

/* Metal que se muestra de un producto: el elegido en el switch Plata | Oro si existe, si no el principal. */
CAMELIA.displayMetal = function (product, preferred) {
  if (preferred && product.metals[preferred]) return preferred;
  return Object.keys(product.metals)[0];
};
