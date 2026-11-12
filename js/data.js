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
/* Tipos de joya. Cada uno tiene subcategorías distintas en Oro y en Plata:
   el menú muestra "Oro" y "Plata" por separado con estas listas.
   home:false = no aparece en las colecciones de la página de inicio. */
CAMELIA.CATEGORIES = [
  { id: 'anillos', name: 'Anillos', shape: 'anillo', subs: {
    oro: ['Anillos', 'Anillos pesados dama', 'Anillos de compromiso', 'Anillos en oro blanco', 'Anillos con esmeralda', 'Anillos con diamante', 'Anillos caballero'],
    plata: ['Anillos', 'Anillos con esmeralda'],
  } },
  { id: 'aretes', name: 'Aretes', shape: 'arete', subs: {
    oro: ['Aros', 'Candongas', 'Topos', 'Topos con esmeralda', 'Topos doble servicio', 'Topos con diamante'],
    plata: ['Candongas', 'Topos', 'Topos con esmeralda'],
  } },
  { id: 'cadenas', name: 'Cadenas', shape: 'cadena', subs: {
    oro: ['Cadenas dama', 'Cadenas caballero'],
    plata: ['Cadenas dama', 'Cadenas caballero'],
  } },
  { id: 'dijes', name: 'Dijes', shape: 'dije', subs: {
    oro: ['Dijes', 'Dijes con esmeralda', 'Dijes de letra', 'Cristos', 'Medallas'],
    plata: ['Dijes', 'Dijes con esmeralda'],
  } },
  { id: 'pulseras', name: 'Pulseras', shape: 'pulsera', subs: { oro: ['Pulseras'], plata: ['Pulseras'] } },
  { id: 'argollas', name: 'Argollas de matrimonio', shortName: 'Argollas', shape: 'argolla', subs: { oro: ['Argollas'], plata: [] } },
  { id: 'juegos', name: 'Juegos', shape: 'arete', home: false, subs: { oro: [], plata: ['Juegos'] } },
];

/* Categorías internas de inventario: solo para el panel, nunca se muestran en la tienda. */
CAMELIA.CATEGORIAS_INTERNAS = ['Vitrina', 'Consignación piedra', 'Consignación no piedra'];

/* Tipos de joya que tienen subcategorías en un metal (para armar el menú de Oro o de Plata) */
CAMELIA.categoriasDe = function (metal) {
  return CAMELIA.CATEGORIES.filter(function (c) { return c.subs[metal] && c.subs[metal].length; });
};

/* metals: precio por metal disponible. El primer metal es el principal.
   model (opcional): modelo 3D en GLB que se puede girar en la página del producto.
   detalle (opcional): cámara de la vista "Detalle" del visor 3D (por defecto, la parte baja del collar). */
CAMELIA.PRODUCTS = [
  { id: 'cadena-veneciana', name: 'Cadena Veneciana', cat: 'cadenas', sub: 'Cadenas dama', variant: 'minimal',
    desc: 'Tejido veneciano de 60 cm con broche de resorte', metals: { oro: 0 }, peso: { oro: 4.5 }, stone: 'ninguna', custom: false,
    texto: 'Cadena de tejido veneciano (de cajita) en oro 18K, de 60 cm de largo, firme y con brillo parejo, con broche de argolla de resorte. En las fotos se muestra con el Dije Cruz de Cristo, que se vende por separado.',
    complementos: ['dije-cruz-cristo'],
    ficha: [['Metal', 'Oro amarillo 18K (ley 750)'], ['Largo', '60 cm'], ['Tejido', 'Veneciano (de cajita)'], ['Broche', 'Argolla de resorte'], ['Dije', 'No incluido, se vende por separado']] },
  { id: 'dije-cruz-cristo', name: 'Dije Cruz de Cristo', cat: 'dijes', sub: 'Cristos', variant: 'clasica',
    desc: 'Cruz calada con el rostro de Cristo en relieve', metals: { oro: 0 }, peso: { oro: 1 }, stone: 'ninguna', custom: false,
    texto: 'Cruz calada en oro 18K con el rostro de Cristo en relieve y su corona de espinas, en un trabajo de orfebrería muy detallado. La argolla lleva grabada la ley 750. La cadena se vende por separado.',
    complementos: ['cadena-veneciana'],
    ficha: [['Metal', 'Oro amarillo 18K (ley 750)'], ['Piedras', 'Sin piedras'], ['Cadena', 'No incluida, se vende por separado']] },
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
  precioGramo: 1000000,
  densidad: 15.6,           // g/cm³ del oro 18K
  pared: 0.2,               // mm
  medallaGramos: 1.05,      // medalla de 12 mm
  letraGramos: 0.5,         // letra (dije) de oro 18K de ~7 mm
};

/* Joyas con peso: el precio sale de peso × precio del gramo (cambia solo si cambia el precio del oro). */
CAMELIA.PRODUCTS.forEach(function (p) {
  if (p.peso && p.peso.oro) p.metals.oro = Math.round(p.peso.oro * CAMELIA.ORO18K.precioGramo);
});

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

/* Datos de contacto. Con número de WhatsApp (código de país + número, ej. '573001234567')
   las consultas van por WhatsApp; sin número, por correo. */
CAMELIA.CONTACTO = { whatsapp: '', correo: 'joyascameliacorp@gmail.com' };

/* Una joya puede estar publicada sin precio todavía: su metal existe con precio 0. */
CAMELIA.tieneMetal = function (p, m) { return !!p && p.metals[m] !== undefined; };
CAMELIA.precioTexto = function (n) { return n ? CAMELIA.formatCOP(n) : 'Precio a consultar'; };
CAMELIA.enlaceConsulta = function (p, metal) {
  var texto = 'Hola, quiero saber el precio de ' + p.name + (metal ? ' en ' + CAMELIA.METALS[metal].label : '') + '.';
  var c = CAMELIA.CONTACTO;
  return c.whatsapp ? 'https://wa.me/' + c.whatsapp + '?text=' + encodeURIComponent(texto)
    : 'mailto:' + c.correo + '?subject=' + encodeURIComponent('Precio de ' + p.name) + '&body=' + encodeURIComponent(texto);
};

CAMELIA.getProduct = function (id) {
  return CAMELIA.PRODUCTS.find(function (p) { return p.id === id; });
};

CAMELIA.getCategory = function (id) {
  return CAMELIA.CATEGORIES.find(function (c) { return c.id === id; });
};

/* Metal que se muestra de un producto: el elegido en el switch Plata | Oro si existe, si no el principal. */
CAMELIA.displayMetal = function (product, preferred) {
  if (preferred && CAMELIA.tieneMetal(product, preferred)) return preferred;
  return Object.keys(product.metals)[0];
};
