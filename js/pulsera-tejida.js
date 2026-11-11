/* Personalizador de pulseras tejidas en 3D (Three.js).
   Medidas en milímetros: 1 unidad de la escena = 1 mm.
   Todo lo que se puede elegir sale de CAMELIA.TEJIDO en js/data.js. */

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

const C = window.CAMELIA;
const TJ = C.TEJIDO;

/* ------------------------------------------------------------------
   Estado del diseño
------------------------------------------------------------------ */
let uid = 0;
const item = (type, extra = {}) => ({ id: ++uid, type, ...extra });

const TIPOS = {
  oro: { name: 'Balín liso', short: 'Liso' },
  diamantado: { name: 'Balín diamantado', short: 'Diamantado' },
  neopreno: { name: 'Neopreno', short: 'Neopreno' },
  hematita: { name: 'Hematita', short: 'Hematita' },
  medalla: { name: 'Medalla con inicial', short: 'Medalla' },
  nudo: { name: 'Nudo (espacio)', short: 'Nudo' },
};

const PRESETS = {
  clasica: () => Array.from({ length: 7 }, () => item('diamantado')),
  alterna: () => [item('neopreno', { color: 'negro' }), item('oro'), item('neopreno', { color: 'negro' }), item('oro'),
    item('neopreno', { color: 'negro' }), item('oro'), item('neopreno', { color: 'negro' })],
  medalla: () => [item('oro'), item('oro'), item('oro'), item('medalla', { letra: 'C' }), item('oro'), item('oro'), item('oro')],
  tres: () => [item('oro'), item('diamantado'), item('oro')],
  vaciar: () => [],
};

const state = {
  estilo: 'tejida',
  hilo: 'negro',
  ancho: 'medio',
  balin: 5,
  talla: 'M',
  espacio: 1,
  neoColor: 'negro',
  seq: PRESETS.clasica(),
  sel: null,
};

const find = (list, id) => list.find((x) => x.id === id);
const hilo = () => find(TJ.hilos, state.hilo);
const talla = () => find(TJ.tallas, state.talla);

/* Medidas que dependen del estilo y el ancho */
function medidas() {
  const a = find(TJ.anchos, state.ancho);
  if (state.estilo === 'tejida') {
    const W = a.tejida;               // alto de la banda tejida
    const tr = W * 0.16;              // radio de cada hebra del tejido
    return { W, H: W * 0.55, tr, ks: tr * 2.05, gapBase: 0.3 };
  }
  const cr = a.hilo / 2;              // radio del cordón
  return { W: cr * 2, H: cr * 2, tr: cr, ks: 2.2, gapBase: 0.4 };
}

/* Diámetro / largo que ocupa cada cuenta sobre el hilo */
function tamano(it) {
  switch (it.type) {
    case 'oro': case 'diamantado': return state.balin;
    case 'neopreno': return state.balin + 1;
    case 'hematita': return Math.max(6, state.balin + 2);
    case 'medalla': return 12;
    case 'nudo': return medidas().ks * 2.4;
    default: return state.balin;
  }
}

function gapEntre() {
  const m = medidas();
  return m.gapBase + state.espacio * m.ks;
}

function largoDiseno(seq = state.seq) {
  if (!seq.length) return 0;
  return seq.reduce((n, it) => n + tamano(it), 0) + gapEntre() * (seq.length - 1);
}

const CIERRE = 26;  // mm reservados para el nudo corredizo
function largoDisponible() { return talla().cm * 10 - CIERRE - 12; }

/* ------------------------------------------------------------------
   Precio y peso del oro
------------------------------------------------------------------ */
function resumen() {
  const est = find(TJ.estilos, state.estilo);
  const balines = state.seq.filter((it) => it.type === 'oro' || it.type === 'diamantado').length;
  const medallas = state.seq.filter((it) => it.type === 'medalla').length;
  const neo = state.seq.filter((it) => it.type === 'neopreno').length;
  const hem = state.seq.filter((it) => it.type === 'hematita').length;
  const gBalin = C.pesoBalin(state.balin);
  const gPuntas = 2 * C.pesoBalin(3);       // balines de 3 mm en las puntas del cordón
  const gramos = balines * gBalin + medallas * C.ORO18K.medallaGramos + gPuntas;
  const oro = gramos * C.ORO18K.precioGramo;
  const lineas = [
    ['Oro 18K · ' + fmtG(gramos), oro],
    [est.name + ' y cierre ajustable', est.base],
  ];
  if (neo) lineas.push(['Neopreno × ' + neo, neo * TJ.precios.neopreno]);
  if (hem) lineas.push(['Hematita × ' + hem, hem * TJ.precios.hematita]);
  const total = Math.round(lineas.reduce((n, l) => n + l[1], 0) / 1000) * 1000;
  return { balines, medallas, neo, hem, gBalin, gPuntas, gramos, lineas, total };
}

const fmtG = (g) => g.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' g';

/* ------------------------------------------------------------------
   Escena 3D
------------------------------------------------------------------ */
const host = document.querySelector('[data-canvas]');
/* Si el equipo no soporta 3D, el diseñador sigue funcionando y solo se muestra un aviso */
let renderer = null;
try { renderer = new THREE.WebGLRenderer({ antialias: true }); } catch (e) { renderer = null; }
const SIN_3D = !renderer;
if (SIN_3D) {
  host.innerHTML = '<p class="tj__loading">Tu navegador no puede mostrar la vista 3D, pero puedes diseñar tu pulsera igual.</p>';
  const lienzo = document.createElement('canvas');
  renderer = { setPixelRatio() {}, setSize() {}, setAnimationLoop() {}, render() {}, shadowMap: {}, domElement: lienzo };
}
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.VSMShadowMap;   // sombras suaves, como con luz de softbox
if (!SIN_3D) host.appendChild(renderer.domElement);

const FONDO = 0xefe7da;
const scene = new THREE.Scene();
scene.background = new THREE.Color(FONDO);
scene.fog = new THREE.Fog(FONDO, 330, 900);
if (!SIN_3D) renderer.setClearColor(FONDO);
if (!SIN_3D) {
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), 0.04).texture;
  // Iluminación real de estudio fotográfico (Poly Haven, CC0): da los reflejos del oro
  new RGBELoader().load('assets/hdri/estudio.hdr', (hdr) => {
    scene.environment = pmrem.fromEquirectangular(hdr).texture;
    hdr.dispose();
  });
}

const camera = new THREE.PerspectiveCamera(22, 1, 5, 3000);
camera.position.set(0, 112, 205);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.target.set(0, 4, 0);
controls.minDistance = 35;
controls.maxDistance = 520;
controls.maxPolarAngle = Math.PI * 0.49;   // no pasar por debajo de la mesa
controls.autoRotate = true;
controls.autoRotateSpeed = 1.1;

scene.add(new THREE.HemisphereLight(0xffffff, 0xd9cdb8, 0.25));
const sol = new THREE.DirectionalLight(0xfffaf0, 1.25);
sol.position.set(45, 140, 70);
sol.castShadow = true;
sol.shadow.mapSize.set(2048, 2048);
Object.assign(sol.shadow.camera, { left: -90, right: 90, top: 90, bottom: -90, near: 10, far: 400 });
sol.shadow.bias = -0.0004;
sol.shadow.radius = 7;
sol.shadow.blurSamples = 16;
scene.add(sol);
const relleno = new THREE.DirectionalLight(0xfff4e0, 0.25);
relleno.position.set(-80, 60, -40);
scene.add(relleno);

const cargador = new THREE.TextureLoader();
const lino = (archivo, color) => {
  const t = cargador.load('assets/textures/lino/' + archivo);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(14, 14);
  t.anisotropy = 8;
  if (color) t.colorSpace = THREE.SRGBColorSpace;
  return t;
};
const mesa = new THREE.Mesh(new THREE.PlaneGeometry(1400, 1400), new THREE.MeshStandardMaterial({
  color: 0xeee4d4, normalMap: lino('lino_nor_gl.jpg'),
  normalScale: new THREE.Vector2(0.6, 0.6), roughnessMap: lino('lino_rough.jpg'), roughness: 1, envMapIntensity: 0.6,
}));
mesa.rotation.x = -Math.PI / 2;
mesa.receiveShadow = true;
scene.add(mesa);

/* --- Texturas generadas: fibras del hilo y grano del neopreno --- */
function texturasHilo() {
  // Altura de un hilo de 3 hebras torcidas con fibras finas: U = a lo largo del hilo, V = alrededor
  const W = 512, H = 128;
  const alt = new Float32Array(W * H);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const u = x / W, v = y / H;
      const fase = v * 3 - u * 6;                        // 3 hebras, 6 vueltas por repetición
      const hebra = Math.pow(0.5 + 0.5 * Math.cos(fase * Math.PI * 2), 0.6);
      const fibra = 0.5 + 0.5 * Math.sin((v * 40 - u * 90) * Math.PI * 2 + Math.sin(u * 37) * 2);
      alt[y * W + x] = hebra * 0.8 + fibra * 0.12 + Math.random() * 0.08;
    }
  }
  const color = document.createElement('canvas'), normal = document.createElement('canvas');
  color.width = normal.width = W; color.height = normal.height = H;
  const gc = color.getContext('2d'), gn = normal.getContext('2d');
  const ic = gc.createImageData(W, H), inn = gn.createImageData(W, H);
  const h = (x, y) => alt[((y + H) % H) * W + ((x + W) % W)];
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = (y * W + x) * 4;
      const a = h(x, y);
      const c = 150 + a * 105;                           // surcos entre hebras más oscuros
      ic.data[i] = ic.data[i + 1] = ic.data[i + 2] = c; ic.data[i + 3] = 255;
      const dx = (h(x + 1, y) - h(x - 1, y)) * 3, dy = (h(x, y + 1) - h(x, y - 1)) * 3;
      const len = Math.hypot(dx, dy, 1);
      inn.data[i] = (-dx / len * 0.5 + 0.5) * 255;
      inn.data[i + 1] = (-dy / len * 0.5 + 0.5) * 255;
      inn.data[i + 2] = (1 / len * 0.5 + 0.5) * 255;
      inn.data[i + 3] = 255;
    }
  }
  gc.putImageData(ic, 0, 0); gn.putImageData(inn, 0, 0);
  const tc = new THREE.CanvasTexture(color), tn = new THREE.CanvasTexture(normal);
  [tc, tn].forEach((t) => { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; });
  tc.colorSpace = THREE.SRGBColorSpace;
  return { color: tc, normal: tn };
}
function texturaGrano() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const img = g.createImageData(128, 128);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 200 + Math.random() * 55;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v; img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(3, 3);
  return t;
}
const TEX_HILO = texturasHilo();
const TEX_GRANO = texturaGrano();

function matHilo(hex, repeatU) {
  const map = TEX_HILO.color.clone(), normalMap = TEX_HILO.normal.clone();
  [map, normalMap].forEach((t) => { t.repeat.set(repeatU, 1); t.needsUpdate = true; });
  const mat = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(hex), map, normalMap, normalScale: new THREE.Vector2(1.1, 1.1),
    roughness: 0.78, sheen: 0.7, sheenRoughness: 0.55, envMapIntensity: 0.7,
    sheenColor: new THREE.Color(hex).lerp(new THREE.Color(0xffffff), 0.22),
  });
  mat.userData.texturas = [map, normalMap];
  return mat;
}

/* Oro 18K: color físico del oro, metal pulido con reflejos del estudio */
const ORO = new THREE.Color().setRGB(1.0, 0.71, 0.29);
const MAT_ORO = new THREE.MeshPhysicalMaterial({ color: ORO, metalness: 1, roughness: 0.1, envMapIntensity: 1.25 });
const MAT_DIAM = new THREE.MeshPhysicalMaterial({ color: ORO, metalness: 1, roughness: 0.05, flatShading: true, envMapIntensity: 1.4 });
const MAT_HEM = new THREE.MeshPhysicalMaterial({ color: 0x2b2c30, metalness: 0.45, roughness: 0.5, vertexColors: true });
const matNeo = {};
function matNeopreno(id) {
  if (!matNeo[id]) {
    const hex = find(TJ.neoprenos, id).hex;
    matNeo[id] = new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(hex), roughness: 0.92, bumpMap: TEX_GRANO, bumpScale: 0.25,
      sheen: 0.4, sheenColor: new THREE.Color(hex).lerp(new THREE.Color(0xffffff), 0.6),
    });
  }
  return matNeo[id];
}

/* --- Geometrías de cuentas (se guardan por tamaño) --- */
const cache = {};
function geo(clave, crear) { return cache[clave] || (cache[clave] = crear()); }

function geoBalin(d) { return geo('b' + d, () => new THREE.SphereGeometry(d / 2, 48, 32).rotateZ(Math.PI / 2)); }
function geoDiam(d) { return geo('d' + d, () => new THREE.SphereGeometry(d / 2, 20, 10).rotateZ(Math.PI / 2)); }
function geoNeo(d) { return geo('n' + d, () => new THREE.SphereGeometry(d / 2, 40, 28)); }
function geoHematita(d) {
  return geo('h' + d, () => {
    const g = new THREE.SphereGeometry(d / 2, 64, 40);
    const p = g.attributes.position;
    const col = [];
    const r = d / 2;
    for (let i = 0; i < p.count; i++) {
      const v = new THREE.Vector3().fromBufferAttribute(p, i);
      const lat = v.x / r;   // el orificio va a lo largo de X (sentido del hilo)
      const dent = Math.min(1, [-0.62, -0.31, 0, 0.31, 0.62].reduce((n, z) => n + Math.exp(-(((lat - z) / 0.055) ** 2)), 0));
      v.multiplyScalar(1 - 0.08 * dent);
      p.setXYZ(i, v.x, v.y, v.z);
      const o = 1 - 0.7 * dent;
      col.push(o, o, o);
    }
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    g.computeVertexNormals();
    return g;
  });
}

const texLetra = {};
function texturaInicial(letra) {
  if (texLetra[letra]) return texLetra[letra];
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d');
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, 256, 256);
  g.strokeStyle = '#8a8a8a'; g.lineWidth = 6;
  g.beginPath(); g.arc(128, 128, 104, 0, Math.PI * 2); g.stroke();
  g.fillStyle = '#5c5c5c';
  g.font = '500 150px "Cormorant Garamond", Georgia, serif';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.fillText(letra || '', 128, 138);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return (texLetra[letra] = t);
}
function medalla(letra) {
  const grupo = new THREE.Group();
  const t = texturaInicial(letra);
  const cara = new THREE.MeshPhysicalMaterial({ color: ORO, metalness: 1, roughness: 0.18, map: t, bumpMap: t, bumpScale: 2.5 });
  const disco = new THREE.Mesh(geo('med', () => new THREE.CylinderGeometry(6, 6, 0.9, 64).rotateX(Math.PI / 2)), [MAT_ORO, cara, MAT_ORO]);
  const borde = new THREE.Mesh(geo('medb', () => new THREE.TorusGeometry(6, 0.45, 12, 64)), MAT_ORO);
  borde.position.z = 0.1;
  // Argollas a los lados para unirla al tejido
  const arg = geo('arg', () => new THREE.TorusGeometry(0.9, 0.28, 10, 24).rotateY(Math.PI / 2));
  const a1 = new THREE.Mesh(arg, MAT_ORO); a1.position.x = 6.6;
  const a2 = new THREE.Mesh(arg, MAT_ORO); a2.position.x = -6.6;
  // La cara con la inicial mira hacia afuera (+z local)
  disco.rotation.y = 0;
  grupo.add(disco, borde, a1, a2);
  return grupo;
}

/* ------------------------------------------------------------------
   Construcción de la pulsera
------------------------------------------------------------------ */
let pulsera = null;
let desechables = [];
const mallasPorId = new Map();
let marcoFrente = null;

function construir() {
  if (SIN_3D) return;
  if (pulsera) scene.remove(pulsera);
  desechables.forEach((d) => d.dispose());
  desechables = [];
  mallasPorId.clear();
  pulsera = new THREE.Group();

  const m = medidas();
  const Lc = talla().cm * 10;
  const Rc = Lc / (2 * Math.PI);
  const alturas = state.seq.map((it) => (it.type === 'medalla' ? 12 : it.type === 'nudo' ? 0 : tamano(it)));
  const Yc = Math.max(m.W, 3, ...alturas) / 2 + 0.15;
  const hex = hilo().hex;

  /* Marco local en la posición s (mm a lo largo de la pulsera, s=0 es el cierre, atrás) */
  const marco = (s) => {
    const a = -Math.PI / 2 + s / Rc;
    const P = new THREE.Vector3(Rc * Math.cos(a), Yc, Rc * Math.sin(a));
    const T = new THREE.Vector3(-Math.sin(a), 0, Math.cos(a));
    const N = new THREE.Vector3(Math.cos(a), 0, Math.sin(a));
    const U = new THREE.Vector3(0, 1, 0);
    const M = new THREE.Matrix4().makeBasis(T.clone().negate(), U, N).setPosition(P);
    return { P, T, N, U, M };
  };
  marcoFrente = marco(Lc / 2);

  const agregar = (mesh) => {
    mesh.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    pulsera.add(mesh);
    return mesh;
  };
  const tubo = (puntos, radio, repeat, cerrado = false, segs) => {
    const curva = new THREE.CatmullRomCurve3(puntos, cerrado, 'centripetal');
    const g = new THREE.TubeGeometry(curva, segs || Math.max(32, Math.round(curva.getLength() / 0.6)), radio, 10, cerrado);
    const mat = matHilo(hex, repeat || curva.getLength() / 2.2);
    desechables.push(g, mat, ...mat.userData.texturas);
    return agregar(new THREE.Mesh(g, mat));
  };

  /* --- Posición de cada cuenta (centradas al frente) --- */
  const total = largoDiseno();
  let s = Lc / 2 - total / 2;
  const ocupado = [];
  state.seq.forEach((it) => {
    const d = tamano(it);
    const centro = s + d / 2;
    s += d + gapEntre();
    if (it.type === 'nudo') return;
    ocupado.push([centro - d / 2, centro + d / 2]);
    const f = marco(centro);
    let mesh;
    if (it.type === 'oro') mesh = new THREE.Mesh(geoBalin(d), MAT_ORO);
    else if (it.type === 'diamantado') mesh = new THREE.Mesh(geoDiam(d), MAT_DIAM);
    else if (it.type === 'neopreno') mesh = new THREE.Mesh(geoNeo(d), matNeopreno(it.color || 'negro'));
    else if (it.type === 'hematita') mesh = new THREE.Mesh(geoHematita(d), MAT_HEM);
    else if (it.type === 'medalla') {
      mesh = medalla(it.letra);
      mesh.position.z = m.H / 2 + 0.7;           // sobre la cara exterior del tejido
    }
    const pivote = new THREE.Group();
    pivote.matrixAutoUpdate = false;
    pivote.matrix.copy(f.M);
    pivote.add(mesh);
    agregar(pivote);
    mallasPorId.set(it.id, mesh);
  });
  const libre = (x, margen) => !ocupado.some(([a, b]) => x > a - margen && x < b + margen);

  /* --- Hilo / tejido --- */
  const bh = 5.2;   // medio largo del nudo corredizo
  if (state.estilo === 'tejida') {
    // Alma: cordones que corren por dentro de todo el tejido (y atraviesan el cierre)
    const alma = [];
    for (let k = 0; k < 120; k++) alma.push(marco((k / 120) * Lc).P);
    tubo(alma, m.H * 0.32, Lc / 2, true, 360);

    // Nudos cobra de macramé: barra al frente, lazo que sobresale por un lado (alternando) y barra atrás
    const vuelta = (lado) => {
      const p = m.ks, W2 = m.W / 2, H2 = m.H / 2, t = m.tr;
      const P = (x, y, z) => new THREE.Vector3(x, y * lado, z);
      const pts = [
        P(0, -W2 * 0.92, H2 * 0.7), P(0, -W2 * 0.5, H2 * 1.0), P(0, 0, H2 * 1.08), P(0, W2 * 0.5, H2 * 1.0),
        P(p * 0.08, W2 * 0.95, H2 * 0.7),
        P(p * 0.22, W2 + t * 1.25, H2 * 0.35), P(p * 0.3, W2 + t * 1.6, 0), P(p * 0.38, W2 + t * 1.25, -H2 * 0.35),
        P(p * 0.5, W2 * 0.95, -H2 * 0.7), P(p * 0.5, W2 * 0.5, -H2 * 1.0), P(p * 0.5, 0, -H2 * 1.05), P(p * 0.5, -W2 * 0.5, -H2 * 1.0),
        P(p * 0.45, -W2 * 0.95, -H2 * 0.6), P(p * 0.22, -W2 - t * 0.25, 0),
      ];
      const g = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true, 'catmullrom', 0.5), 120, t, 12, true);
      desechables.push(g);
      return g;
    };
    const posiciones = [];
    for (let x = bh + 1.2; x < Lc - bh - 1.2; x += m.ks) if (libre(x, m.tr * 0.9)) posiciones.push(x);
    const matN = matHilo(hex, 2);
    desechables.push(matN, ...matN.userData.texturas);
    [1, -1].forEach((flip, par) => {
      const lista = posiciones.filter((_, i) => i % 2 === par);
      const inst = new THREE.InstancedMesh(vuelta(flip), matN, lista.length);
      lista.forEach((x, i) => inst.setMatrixAt(i, marco(x).M));
      inst.instanceMatrix.needsUpdate = true;
      agregar(inst);
    });
  } else {
    // Cordón trenzado de dos hilos con las cuentas ensartadas
    const pasos = 260;
    [0, Math.PI].forEach((fase) => {
      const pts = [];
      for (let k = 0; k <= pasos; k++) {
        const x = (k / pasos) * Lc;
        const f = marco(x);
        const ang = (x / 1.6) * Math.PI * 2 + fase;
        pts.push(f.P.clone().addScaledVector(f.U, Math.cos(ang) * m.tr * 0.45).addScaledVector(f.N, Math.sin(ang) * m.tr * 0.45));
      }
      tubo(pts, m.tr * 0.62, Lc / 1.2, false, 900);
    });
    // Nuditos entre cuentas
    if (state.espacio > 0 && state.seq.length > 1) {
      const g = new THREE.SphereGeometry(m.tr * 1.7, 16, 12);
      const mat = matHilo(hex, 2);
      desechables.push(g, mat, ...mat.userData.texturas);
      let x = Lc / 2 - total / 2;
      state.seq.forEach((it, i) => {
        x += tamano(it);
        if (i < state.seq.length - 1) {
          for (let k = 0; k < state.espacio; k++) {
            const nudo = new THREE.Mesh(g, mat);
            nudo.position.copy(marco(x + m.gapBase / 2 + (k + 0.5) * m.ks).P);
            agregar(nudo);
          }
          x += gapEntre();
        }
      });
    }
  }

  /* --- Nudo corredizo (cierre ajustable) --- */
  const rb = state.estilo === 'tejida' ? m.W * 0.5 : m.tr * 3;
  const trb = state.estilo === 'tejida' ? m.tr * 1.05 : m.tr * 0.9;
  const anillo = new THREE.TorusGeometry(rb, trb, 10, 28).rotateY(Math.PI / 2);
  const matB = matHilo(hex, 4);
  desechables.push(anillo, matB, ...matB.userData.texturas);
  const nAnillos = Math.floor((bh * 2) / (trb * 1.9));
  for (let k = 0; k < nAnillos; k++) {
    const x = -bh + (k + 0.5) * ((bh * 2) / nAnillos);
    const piv = new THREE.Mesh(anillo, matB);
    piv.matrixAutoUpdate = false;
    piv.matrix.copy(marco((x + Lc) % Lc).M);
    agregar(piv);
  }

  /* --- Puntas del cordón con balín de oro de 3 mm y nudo final --- */
  const rPunta = state.estilo === 'tejida' ? m.tr * 0.95 : m.tr * 0.7;
  [1, -1].forEach((dir) => {
    const f = marco(dir > 0 ? bh : Lc - bh);
    const T = f.T.clone().multiplyScalar(dir);
    const p0 = f.P.clone().addScaledVector(T, 0.5);
    const piso = (v, y) => { v.y = y; return v; };
    const pts = [
      p0,
      piso(p0.clone().addScaledVector(T, 5).addScaledVector(f.N, 3), Yc * 0.6),
      piso(p0.clone().addScaledVector(T, 11).addScaledVector(f.N, 12), 1.6),
      piso(p0.clone().addScaledVector(T, 15).addScaledVector(f.N, 24), 1.5),
      piso(p0.clone().addScaledVector(T, 17).addScaledVector(f.N, 34), 1.5),
    ];
    tubo(pts, rPunta, 14);
    const curva = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
    const pb = curva.getPointAt(0.84);
    const tb = curva.getTangentAt(0.84);
    const bola = new THREE.Mesh(geoBalin(3), MAT_ORO);
    bola.position.copy(pb); bola.position.y = 1.5;
    bola.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), tb);
    agregar(bola);
    const fin = new THREE.Mesh(new THREE.SphereGeometry(rPunta * 1.9, 16, 12), matHilo(hex, 1));
    desechables.push(fin.geometry, fin.material, ...fin.material.userData.texturas);
    fin.position.copy(curva.getPointAt(1));
    agregar(fin);
  });

  scene.add(pulsera);
  controls.target.y = Yc * 0.6;
}

/* --- Cámara --- */
let camDestino = null;
function moverCamara(tipo) {
  const t = controls.target.clone();
  if (tipo === 'frente') camDestino = { pos: new THREE.Vector3(0, 112, 205), target: new THREE.Vector3(0, t.y, 0) };
  if (tipo === 'arriba') camDestino = { pos: new THREE.Vector3(0, 245, 6), target: new THREE.Vector3(0, 0, 0) };
  if (tipo === 'detalle' && marcoFrente) {
    const p = marcoFrente.P;
    camDestino = { pos: p.clone().addScaledVector(marcoFrente.N, 62).add(new THREE.Vector3(0, 30, 0)), target: p.clone() };
  }
}

/* --- Postproceso: sombras de contacto entre piezas (GTAO) y brillo suave en el oro --- */
let composer = null;
if (!SIN_3D) {
  try {
    const rt = new THREE.WebGLRenderTarget(1, 1, { samples: 4, type: THREE.HalfFloatType });
    composer = new EffectComposer(renderer, rt);
    composer.addPass(new RenderPass(scene, camera));
    const ao = new GTAOPass(scene, camera, 1, 1);
    ao.updateGtaoMaterial({ radius: 3.5, distanceExponent: 1.2, thickness: 1.5, scale: 1.1, samples: 16 });
    ao.blendIntensity = 0.9;
    composer.addPass(ao);
    composer.addPass(new UnrealBloomPass(new THREE.Vector2(256, 256), 0.14, 0.35, 0.93));
    composer.addPass(new OutputPass());
  } catch (e) { composer = null; }
}

/* --- Bucle de render --- */
function tamanoCanvas() {
  const w = host.clientWidth, h = host.clientHeight;
  renderer.setSize(w, h, false);
  if (composer) { composer.setPixelRatio(renderer.getPixelRatio ? renderer.getPixelRatio() : 1); composer.setSize(w, h); }
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
new ResizeObserver(tamanoCanvas).observe(host);
tamanoCanvas();

const reloj = new THREE.Clock();
renderer.setAnimationLoop(() => {
  const t = reloj.getElapsedTime();
  if (camDestino) {
    camera.position.lerp(camDestino.pos, 0.08);
    controls.target.lerp(camDestino.target, 0.08);
    if (camera.position.distanceTo(camDestino.pos) < 0.5) camDestino = null;
  }
  mallasPorId.forEach((mesh, id) => mesh.scale.setScalar(id === state.sel ? 1 + 0.07 * (0.5 + 0.5 * Math.sin(t * 5)) : 1));
  controls.update();
  if (composer) composer.render(); else renderer.render(scene, camera);
});
controls.addEventListener('start', () => { camDestino = null; });

/* ------------------------------------------------------------------
   Interfaz
------------------------------------------------------------------ */
const $ = (sel) => document.querySelector(sel);
let pendiente = false;
function actualizar(rehacer3D = true) {
  pintarPanel();
  if (rehacer3D && !pendiente) {
    pendiente = true;
    requestAnimationFrame(() => { pendiente = false; construir(); });
  }
}

function vistaCuenta(it, px) {
  const size = px || 22;
  const base = 'width:' + size + 'px;height:' + size + 'px;';
  if (it.type === 'neopreno') return '<i class="dot3d dot3d--neo" style="' + base + 'background:' + find(TJ.neoprenos, it.color || state.neoColor).hex + '"></i>';
  if (it.type === 'medalla') return '<i class="dot3d dot3d--medalla" style="' + base + '">' + (it.letra || '') + '</i>';
  return '<i class="dot3d dot3d--' + it.type + '" style="' + base + '"></i>';
}

function pintarPanel() {
  const est = find(TJ.estilos, state.estilo);
  $('[data-estilos]').innerHTML = TJ.estilos.map((e) =>
    '<button class="style-card" data-estilo="' + e.id + '" aria-pressed="' + (e.id === state.estilo) + '">' +
    '<strong>' + e.name + '</strong><span>' + e.desc + '</span><em>Desde ' + C.formatCOP(e.base) + '</em></button>').join('');

  $('[data-hilos]').innerHTML = TJ.hilos.map((h) =>
    '<button class="swatch-btn" data-hilo="' + h.id + '" aria-pressed="' + (h.id === state.hilo) + '" title="' + h.name + '" aria-label="Hilo ' + h.name + '"><i style="background:' + h.hex + '"></i></button>').join('');
  $('[data-hilo-name]').textContent = hilo().name;

  $('[data-ancho-label]').textContent = state.estilo === 'tejida' ? '03 · Ancho del tejido' : '03 · Grosor del cordón';
  $('[data-anchos]').innerHTML = TJ.anchos.map((a) =>
    '<button class="option" data-ancho="' + a.id + '" aria-pressed="' + (a.id === state.ancho) + '">' + a.name + ' · ' +
    String(state.estilo === 'tejida' ? a.tejida : a.hilo).replace('.', ',') + ' mm</button>').join('');

  $('[data-balines]').innerHTML = TJ.balines.map((d) => {
    const g = C.pesoBalin(d);
    return '<button class="size-card" data-balin="' + d + '" aria-pressed="' + (d === state.balin) + '">' +
      '<i class="dot3d dot3d--oro" style="width:' + (d * 4.2) + 'px;height:' + (d * 4.2) + 'px"></i>' +
      '<strong>' + d + ' mm</strong><span>' + fmtG(g) + ' c/u</span><em>' + C.formatCOP(g * C.ORO18K.precioGramo) + '</em></button>';
  }).join('');

  $('[data-palette]').innerHTML = ['oro', 'diamantado', 'neopreno', 'hematita', 'medalla', 'nudo'].map((t) =>
    '<button class="palette__item" data-add="' + t + '">' + vistaCuenta({ type: t, color: state.neoColor, letra: 'A' }) +
    '<span>' + TIPOS[t].name + '</span><b aria-hidden="true">+</b></button>').join('');

  const strip = $('[data-strip]');
  strip.innerHTML = state.seq.length ? state.seq.map((it, i) =>
    '<div class="strip__item' + (it.id === state.sel ? ' is-selected' : '') + '" data-index="' + i + '" tabindex="0" role="button" aria-label="' + TIPOS[it.type].name + ', posición ' + (i + 1) + '">' +
    vistaCuenta(it, Math.max(16, tamano(it) * 3.6)) + '<span>' + (i + 1) + '</span></div>').join('')
    : '<p class="strip__empty">Tu pulsera está vacía. Toca o arrastra cuentas aquí.</p>';

  const usado = largoDiseno(), disp = largoDisponible();
  const pct = Math.round((usado / disp) * 100);
  $('[data-fit]').innerHTML = '<span class="' + (pct > 100 ? 'fit--over' : '') + '">' + Math.round(usado) + ' de ' + Math.round(disp) + ' mm usados</span>';

  $('[data-espacio]').value = state.espacio;
  $('[data-espacio-val]').textContent = state.espacio === 0 ? 'Juntas' : state.espacio + (state.espacio === 1 ? ' nudo' : ' nudos');

  $('[data-tallas]').innerHTML = TJ.tallas.map((t) =>
    '<button class="option" data-talla="' + t.id + '" aria-pressed="' + (t.id === state.talla) + '">' + t.id + ' · ' + String(t.cm).replace('.', ',') + ' cm</button>').join('');

  pintarEditor();

  const r = resumen();
  $('[data-gramos]').textContent = fmtG(r.gramos);
  const partes = [];
  if (r.balines) partes.push(r.balines + ' balín' + (r.balines > 1 ? 'es' : '') + ' de ' + state.balin + ' mm (' + fmtG(r.gBalin) + ' c/u)');
  if (r.medallas) partes.push(r.medallas + ' medalla' + (r.medallas > 1 ? 's' : '') + ' (' + fmtG(C.ORO18K.medallaGramos) + ')');
  partes.push('2 balines de 3 mm en las puntas');
  $('[data-gramos-detalle]').textContent = partes.join(' · ');
  $('[data-lineas]').innerHTML = r.lineas.map((l) => '<div><dt>' + l[0] + '</dt><dd class="price">' + C.formatCOP(l[1]) + '</dd></div>').join('');
  $('[data-total]').textContent = C.formatCOP(r.total);
  $('[data-precio-gramo]').textContent = C.formatCOP(C.ORO18K.precioGramo);
  $('[data-agregar]').disabled = pct > 100;
}

function pintarEditor() {
  const box = $('[data-editor]');
  const i = state.seq.findIndex((it) => it.id === state.sel);
  if (i < 0) { box.hidden = true; return; }
  const it = state.seq[i];
  let extra = '';
  if (it.type === 'neopreno') {
    extra = '<div class="swatches swatches--sm">' + TJ.neoprenos.map((n) =>
      '<button class="swatch-btn" data-neo="' + n.id + '" aria-pressed="' + (n.id === it.color) + '" title="' + n.name + '"><i style="background:' + n.hex + '"></i></button>').join('') + '</div>';
  }
  if (it.type === 'oro' || it.type === 'diamantado') {
    extra = '<div class="options">' + ['oro', 'diamantado'].map((t) =>
      '<button class="option" data-acabado="' + t + '" aria-pressed="' + (t === it.type) + '">' + TIPOS[t].short + '</button>').join('') + '</div>';
  }
  if (it.type === 'medalla') {
    extra = '<label class="small muted">Inicial grabada <input class="input" data-letra maxlength="1" value="' + (it.letra || '') + '" style="width:70px;margin-left:8px;text-align:center"></label>';
  }
  box.hidden = false;
  box.innerHTML = '<div class="bead-editor__head">' + vistaCuenta(it, 26) + '<strong>' + TIPOS[it.type].name + '</strong><span class="muted small">Posición ' + (i + 1) + ' de ' + state.seq.length + '</span></div>' +
    extra +
    '<div class="bead-editor__actions">' +
      '<button class="chip" data-mover="-1"' + (i === 0 ? ' disabled' : '') + '>‹ Mover</button>' +
      '<button class="chip" data-mover="1"' + (i === state.seq.length - 1 ? ' disabled' : '') + '>Mover ›</button>' +
      '<button class="chip" data-duplicar>Duplicar</button>' +
      '<button class="chip" data-quitar>Quitar</button>' +
      '<button class="chip" data-cerrar>Listo</button>' +
    '</div>';
}

/* --- Avisos cortos --- */
let avisoT;
function aviso(texto) {
  let el = $('.tj-toast');
  if (!el) { el = document.createElement('div'); el.className = 'tj-toast'; document.body.appendChild(el); }
  el.textContent = texto;
  el.classList.add('is-on');
  clearTimeout(avisoT);
  avisoT = setTimeout(() => el.classList.remove('is-on'), 2600);
}

function cabe(seq) { return largoDiseno(seq) <= largoDisponible(); }

function insertar(tipo, index) {
  const nuevo = item(tipo, tipo === 'neopreno' ? { color: state.neoColor } : tipo === 'medalla' ? { letra: 'C' } : {});
  const seq = state.seq.slice();
  seq.splice(index == null ? seq.length : index, 0, nuevo);
  if (!cabe(seq)) { aviso('No caben más cuentas en talla ' + state.talla + '. Prueba una talla mayor o balines más pequeños.'); return; }
  state.seq = seq;
  state.sel = nuevo.id;
  actualizar();
}

/* --- Clics del panel --- */
document.querySelector('.tj__panel').addEventListener('click', (e) => {
  const b = (sel) => e.target.closest(sel);
  let el;
  if ((el = b('[data-estilo]'))) { state.estilo = el.dataset.estilo; return actualizar(); }
  if ((el = b('[data-hilo]'))) { state.hilo = el.dataset.hilo; return actualizar(); }
  if ((el = b('[data-ancho]'))) { state.ancho = el.dataset.ancho; return actualizar(); }
  if ((el = b('[data-balin]'))) {
    const anterior = state.balin;
    state.balin = +el.dataset.balin;
    if (!cabe(state.seq)) { state.balin = anterior; aviso('Con balines de ' + el.dataset.balin + ' mm tu diseño no cabe en talla ' + state.talla + '. Quita alguna cuenta primero.'); return; }
    return actualizar();
  }
  if ((el = b('[data-talla]'))) {
    const anterior = state.talla;
    state.talla = el.dataset.talla;
    if (!cabe(state.seq)) { state.talla = anterior; aviso('Tu diseño es más largo que la talla ' + el.dataset.talla + '. Quita cuentas o reduce el espacio entre ellas.'); return; }
    return actualizar();
  }
  if ((el = b('[data-preset]'))) {
    const seq = PRESETS[el.dataset.preset]();
    state.seq = cabe(seq) ? seq : seq.slice(0, 3);
    state.sel = null;
    return actualizar();
  }
  const i = state.seq.findIndex((it) => it.id === state.sel);
  if ((el = b('[data-neo]')) && i > -1) { state.seq[i].color = state.neoColor = el.dataset.neo; return actualizar(); }
  if ((el = b('[data-acabado]')) && i > -1) { state.seq[i].type = el.dataset.acabado; return actualizar(); }
  if ((el = b('[data-mover]')) && i > -1) {
    const j = i + +el.dataset.mover;
    const [x] = state.seq.splice(i, 1);
    state.seq.splice(j, 0, x);
    return actualizar();
  }
  if (b('[data-duplicar]') && i > -1) {
    const copia = { ...state.seq[i], id: ++uid };
    const seq = state.seq.slice(); seq.splice(i + 1, 0, copia);
    if (!cabe(seq)) return aviso('No cabe otra cuenta en esta talla.');
    state.seq = seq; state.sel = copia.id;
    return actualizar();
  }
  if (b('[data-quitar]') && i > -1) { state.seq.splice(i, 1); state.sel = null; return actualizar(); }
  if (b('[data-cerrar]')) { state.sel = null; return actualizar(false); }
  if (b('[data-agregar]')) {
    const r = resumen();
    C.addToCart({
      key: 'tejida|' + JSON.stringify([state.estilo, state.hilo, state.ancho, state.balin, state.talla, state.espacio, state.seq.map((x) => [x.type, x.color, x.letra])]),
      name: 'Pulsera tejida personalizada',
      detail: find(TJ.estilos, state.estilo).name + ' · hilo ' + hilo().name.toLowerCase() + ' · ' + r.balines + ' balines de ' + state.balin + ' mm · ' + fmtG(r.gramos) + ' de oro 18K · Talla ' + state.talla,
      price: r.total, shape: 'pulsera', metal: 'oro', opts: { stone: r.neo ? 'color' : 'ninguna', thickness: 3 },
    });
  }
});

$('[data-espacio]').addEventListener('input', (e) => {
  const anterior = state.espacio;
  state.espacio = +e.target.value;
  if (!cabe(state.seq)) { state.espacio = anterior; e.target.value = anterior; aviso('Con más espacio tu diseño ya no cabe en esta talla.'); return; }
  actualizar();
});
document.querySelector('[data-editor]').addEventListener('input', (e) => {
  if (!e.target.matches('[data-letra]')) return;
  const it = state.seq.find((x) => x.id === state.sel);
  if (it) { it.letra = e.target.value.toUpperCase(); e.target.value = it.letra; construir(); pintarStripOnly(); }
});
function pintarStripOnly() {
  const it = state.seq.find((x) => x.id === state.sel);
  const chip = document.querySelector('.strip__item.is-selected .dot3d--medalla');
  if (chip && it) chip.textContent = it.letra;
}

document.querySelectorAll('[data-cam]').forEach((b) => b.addEventListener('click', () => moverCamara(b.dataset.cam)));
$('[data-autorotate]').addEventListener('click', (e) => {
  controls.autoRotate = !controls.autoRotate;
  e.currentTarget.setAttribute('aria-pressed', controls.autoRotate);
});

/* ------------------------------------------------------------------
   Arrastrar y soltar cuentas (mouse y táctil)
------------------------------------------------------------------ */
const strip = $('[data-strip]');
const trash = $('[data-trash]');
let drag = null;

function indiceInsercion(x, y) {
  const chips = [...strip.querySelectorAll('.strip__item:not(.is-dragging)')];
  let idx = 0;
  chips.forEach((c) => {
    const r = c.getBoundingClientRect();
    const cy = r.top + r.height / 2, cx = r.left + r.width / 2;
    if (cy < y - r.height / 2 || (Math.abs(cy - y) <= r.height / 2 && cx < x)) idx++;
  });
  return idx;
}
function sobreStrip(x, y) {
  const r = strip.getBoundingClientRect();
  return x > r.left - 20 && x < r.right + 20 && y > r.top - 40 && y < r.bottom + 40;
}
function ponerMarcador(idx) {
  let mk = strip.querySelector('.strip__marker');
  if (!mk) { mk = document.createElement('i'); mk.className = 'strip__marker'; }
  const chips = [...strip.querySelectorAll('.strip__item:not(.is-dragging)')];
  if (chips[idx]) strip.insertBefore(mk, chips[idx]); else strip.appendChild(mk);
}
function quitarMarcador() { const mk = strip.querySelector('.strip__marker'); if (mk) mk.remove(); }

function iniciar(e, fuente, el) {
  if (e.button !== undefined && e.button !== 0) return;
  drag = { fuente, el, x0: e.clientX, y0: e.clientY, activo: false, id: e.pointerId };
  window.addEventListener('pointermove', mover);
  window.addEventListener('pointerup', soltar);
  window.addEventListener('pointercancel', cancelar);
}
function mover(e) {
  if (!drag) return;
  if (!drag.activo) {
    if (Math.hypot(e.clientX - drag.x0, e.clientY - drag.y0) < 6) return;
    drag.activo = true;
    const fantasma = drag.el.cloneNode(true);
    fantasma.classList.add('drag-ghost');
    document.body.appendChild(fantasma);
    drag.fantasma = fantasma;
    if (drag.fuente.tipo === 'strip') drag.el.classList.add('is-dragging');
    document.body.classList.add('is-dragging-bead');
  }
  drag.fantasma.style.transform = 'translate(' + (e.clientX - 20) + 'px,' + (e.clientY - 20) + 'px)';
  const dentro = sobreStrip(e.clientX, e.clientY);
  if (dentro) ponerMarcador(indiceInsercion(e.clientX, e.clientY)); else quitarMarcador();
  trash.classList.toggle('is-active', drag.fuente.tipo === 'strip' && !dentro);
}
function soltar(e) {
  if (!drag) return;
  const d = drag;
  limpiar();
  if (!d.activo) {      // fue un toque, no un arrastre
    if (d.fuente.tipo === 'paleta') insertar(d.fuente.cuenta);
    else { const it = state.seq[d.fuente.index]; state.sel = state.sel === it.id ? null : it.id; actualizar(false); }
    return;
  }
  const dentro = sobreStrip(e.clientX, e.clientY);
  if (d.fuente.tipo === 'paleta') {
    if (dentro) insertar(d.fuente.cuenta, indiceInsercion(e.clientX, e.clientY));
  } else {
    const [x] = state.seq.splice(d.fuente.index, 1);
    if (dentro) {
      state.seq.splice(indiceInsercion(e.clientX, e.clientY), 0, x);
      state.sel = x.id;
    } else if (state.sel === x.id) state.sel = null;
    actualizar();
  }
}
function cancelar() { limpiar(); pintarPanel(); }
function limpiar() {
  window.removeEventListener('pointermove', mover);
  window.removeEventListener('pointerup', soltar);
  window.removeEventListener('pointercancel', cancelar);
  if (drag && drag.fantasma) drag.fantasma.remove();
  if (drag && drag.el) drag.el.classList.remove('is-dragging');
  quitarMarcador();
  trash.classList.remove('is-active');
  document.body.classList.remove('is-dragging-bead');
  drag = null;
}

$('[data-palette]').addEventListener('pointerdown', (e) => {
  const b = e.target.closest('[data-add]');
  if (b) { e.preventDefault(); iniciar(e, { tipo: 'paleta', cuenta: b.dataset.add }, b); }
});
strip.addEventListener('pointerdown', (e) => {
  const c = e.target.closest('.strip__item');
  if (c) { e.preventDefault(); iniciar(e, { tipo: 'strip', index: +c.dataset.index }, c); }
});
/* Teclado: Enter selecciona; Supr quita; flechas con Alt mueven */
strip.addEventListener('keydown', (e) => {
  const c = e.target.closest('.strip__item');
  if (!c) return;
  const i = +c.dataset.index;
  if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); state.sel = state.seq[i].id; actualizar(false); }
  if (e.key === 'Delete' || e.key === 'Backspace') { state.seq.splice(i, 1); state.sel = null; actualizar(); }
  if (e.altKey && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
    const j = i + (e.key === 'ArrowLeft' ? -1 : 1);
    if (j < 0 || j >= state.seq.length) return;
    const [x] = state.seq.splice(i, 1); state.seq.splice(j, 0, x); state.sel = x.id; actualizar();
    requestAnimationFrame(() => strip.querySelector('[data-index="' + j + '"]').focus());
  }
});

/* ------------------------------------------------------------------
   Arranque
------------------------------------------------------------------ */
const loading = document.querySelector('[data-loading]');
if (loading && !SIN_3D) loading.remove();
actualizar();
