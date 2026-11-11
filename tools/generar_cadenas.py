"""Genera los modelos 3D (GLB) de las cadenas de Camelia.

Cada cadena se arma eslabón por eslabón: los eslabones se reparten a lo largo
de una curva cerrada (la forma del collar) y se alternan girados 90° para que
queden entrelazados. Medidas en milímetros; el archivo final queda en metros
(estándar glTF), así que en realidad aumentada se ve a tamaño real.

Uso:  python3 tools/generar_cadenas.py
Salida: models/*.glb
"""
import json
import math
import os
import struct

import numpy as np

SALIDA = os.path.join(os.path.dirname(__file__), '..', 'models')

# Material metálico único: el sitio cambia su color (plata / oro) en vivo.
MATERIALES = {
    'Metal': {'baseColorFactor': [0.80, 0.81, 0.83, 1], 'metallicFactor': 1.0, 'roughnessFactor': 0.2},
    'Perla': {'baseColorFactor': [1.0, 0.97, 0.93, 1], 'metallicFactor': 0.0, 'roughnessFactor': 0.3},
    'Hematita': {'baseColorFactor': [0.15, 0.15, 0.16, 1], 'metallicFactor': 0.4, 'roughnessFactor': 0.62},
    'Cordon': {'baseColorFactor': [0.035, 0.035, 0.04, 1], 'metallicFactor': 0.0, 'roughnessFactor': 0.85},
}


# ---------------------------------------------------------------------------
# Mallas básicas
# ---------------------------------------------------------------------------

def malla_tubo(trayectoria, seccion, nu, nv):
    """Tubo cerrado: `trayectoria(u)` da el centro, `seccion(u, v)` el punto de la sección.
    Devuelve posiciones, normales e índices de una rejilla nu x nv que se cierra en ambos sentidos."""
    us = np.linspace(0, 2 * np.pi, nu, endpoint=False)
    vs = np.linspace(0, 2 * np.pi, nv, endpoint=False)
    P = np.array([[seccion(u, v) for v in vs] for u in us])          # (nu, nv, 3)
    C = np.array([trayectoria(u) for u in us])[:, None, :]           # centro de cada sección

    # Normales numéricas: producto cruz de las derivadas en u y v.
    du = np.roll(P, -1, axis=0) - np.roll(P, 1, axis=0)
    dv = np.roll(P, -1, axis=1) - np.roll(P, 1, axis=1)
    N = np.cross(du, dv)
    N /= np.linalg.norm(N, axis=2, keepdims=True) + 1e-12
    afuera = np.sum(N * (P - C), axis=2, keepdims=True)
    N = np.where(afuera < 0, -N, N)

    idx = []
    for i in range(nu):
        for j in range(nv):
            a = i * nv + j
            b = ((i + 1) % nu) * nv + j
            c = ((i + 1) % nu) * nv + (j + 1) % nv
            d = i * nv + (j + 1) % nv
            idx += [a, b, c, a, c, d]
    return P.reshape(-1, 3), N.reshape(-1, 3), np.array(idx, dtype=np.uint32)


def eslabon_oval(a, b, rn, rz, nu=28, nv=12, potencia=1.0):
    """Eslabón con eje mayor en X. `a`, `b`: semiejes del centro del alambre.
    `rn`, `rz`: radio de la sección hacia afuera y en grosor (iguales = alambre redondo).
    `potencia` < 1 vuelve el eslabón más cuadrado (cadena veneciana)."""

    def sp(x):  # superelipse: potencia 1 = elipse
        return math.copysign(abs(x) ** potencia, x)

    def centro(u):
        return np.array([a * sp(math.cos(u)), b * sp(math.sin(u)), 0.0])

    def seccion(u, v):
        h = 1e-4
        t = centro(u + h) - centro(u - h)
        t /= np.linalg.norm(t)
        n = np.array([t[1], -t[0], 0.0])  # normal en el plano, hacia afuera
        if np.dot(n, centro(u)) < 0:
            n = -n
        return centro(u) + rn * sp(math.cos(v)) * n + rz * sp(math.sin(v)) * np.array([0, 0, 1.0])

    return malla_tubo(centro, seccion, nu, nv)


def esfera(r, nu=40, nv=24):
    pos, nor, idx = [], [], []
    for i in range(nv + 1):
        th = math.pi * i / nv
        for j in range(nu + 1):
            ph = 2 * math.pi * j / nu
            n = [math.sin(th) * math.cos(ph), math.cos(th), math.sin(th) * math.sin(ph)]
            nor.append(n)
            pos.append([r * x for x in n])
    for i in range(nv):
        for j in range(nu):
            a = i * (nu + 1) + j
            b = a + nu + 1
            idx += [a, b, a + 1, a + 1, b, b + 1]
    return np.array(pos), np.array(nor), np.array(idx, dtype=np.uint32)


# ---------------------------------------------------------------------------
# Forma del collar y colocación de eslabones
# ---------------------------------------------------------------------------

def curva_collar(largo_mm, muestras=4000):
    """Curva cerrada vertical con forma de gota (como un collar en un exhibidor).
    Devuelve una función s -> (punto, tangente) parametrizada por longitud real."""
    t = np.linspace(0, 2 * np.pi, muestras, endpoint=False)
    x = np.sin(t) * (0.82 + 0.18 * np.cos(t))
    y = np.cos(t) * 1.12
    pts = np.stack([x, y, np.zeros_like(x)], axis=1)
    seg = np.linalg.norm(np.roll(pts, -1, axis=0) - pts, axis=1)
    pts *= largo_mm / seg.sum()
    seg *= largo_mm / seg.sum()
    acum = np.concatenate([[0], np.cumsum(seg)])

    def en(s):
        s %= largo_mm
        i = np.searchsorted(acum, s, side='right') - 1
        f = (s - acum[i]) / seg[i]
        p0, p1 = pts[i], pts[(i + 1) % muestras]
        tan = p1 - p0
        return p0 + f * tan, tan / np.linalg.norm(tan)

    return en


def colocar(malla, en, largo_mm, paso_mm, giro_extra=0.0):
    """Repite el eslabón a lo largo del collar, alternando 90° para entrelazarlos."""
    pos0, nor0, idx0 = malla
    n = max(2, int(round(largo_mm / paso_mm)))
    n += n % 2  # número par: la alternancia cierra bien
    paso = largo_mm / n
    P, N, I = [], [], []
    z = np.array([0, 0, 1.0])
    for k in range(n):
        p, T = en(k * paso)
        W = np.cross(z, T)  # normal en el plano del collar
        ang = (math.pi / 2 if k % 2 else 0.0) + (giro_extra if k % 2 == 0 else -giro_extra)
        V = math.cos(ang) * W + math.sin(ang) * z   # segundo eje del eslabón
        Z = np.cross(T, V)
        R = np.stack([T, V, Z], axis=1)             # columnas: ejes locales x, y, z
        P.append(pos0 @ R.T + p)
        N.append(nor0 @ R.T)
        I.append(idx0 + k * len(pos0))
    return np.concatenate(P), np.concatenate(N), np.concatenate(I), n


def transformar(malla, R, t):
    pos, nor, idx = malla
    return pos @ R.T + t, nor @ R.T, idx


# ---------------------------------------------------------------------------
# Escritura GLB
# ---------------------------------------------------------------------------

def escribir_glb(ruta, primitivas):
    """primitivas: lista de (nombre_material, posiciones_mm, normales, índices[, colores_rgb])."""
    gltf = {
        'asset': {'version': '2.0', 'generator': 'Camelia · generar_cadenas.py'},
        'scene': 0, 'scenes': [{'nodes': [0]}],
        'nodes': [{'mesh': 0, 'name': 'Joya'}],
        'meshes': [{'name': 'Joya', 'primitives': []}],
        'materials': [], 'accessors': [], 'bufferViews': [], 'buffers': [],
    }
    binario = bytearray()

    def agregar(arr, tipo, comp, destino):
        while len(binario) % 4:
            binario.append(0)
        datos = arr.tobytes()
        gltf['bufferViews'].append({'buffer': 0, 'byteOffset': len(binario), 'byteLength': len(datos), 'target': destino})
        binario.extend(datos)
        acc = {'bufferView': len(gltf['bufferViews']) - 1, 'componentType': comp,
               'count': len(arr), 'type': tipo}
        if tipo == 'VEC3' and comp == 5126:
            acc['min'] = arr.min(axis=0).tolist()
            acc['max'] = arr.max(axis=0).tolist()
        gltf['accessors'].append(acc)
        return len(gltf['accessors']) - 1

    nombres = []
    for prim_datos in primitivas:
        nombre, pos, nor, idx = prim_datos[:4]
        colores = prim_datos[4] if len(prim_datos) > 4 else None
        if nombre not in nombres:
            nombres.append(nombre)
            m = MATERIALES[nombre]
            mat = {'name': nombre, 'pbrMetallicRoughness': dict(m)}
            if nombre == 'Perla':
                mat['emissiveFactor'] = [0.16, 0.15, 0.14]
            gltf['materials'].append(mat)
        prim = {
            'attributes': {
                'POSITION': agregar((pos / 1000.0).astype(np.float32), 'VEC3', 5126, 34962),
                'NORMAL': agregar(nor.astype(np.float32), 'VEC3', 5126, 34962),
            },
            'indices': agregar(idx.astype(np.uint32), 'SCALAR', 5125, 34963),
            'material': nombres.index(nombre),
        }
        if colores is not None:  # oscurece zonas (p. ej. ranuras) multiplicando el color del material
            prim['attributes']['COLOR_0'] = agregar(colores.astype(np.float32), 'VEC3', 5126, 34962)
        gltf['meshes'][0]['primitives'].append(prim)

    while len(binario) % 4:
        binario.append(0)
    gltf['buffers'].append({'byteLength': len(binario)})
    js = json.dumps(gltf, separators=(',', ':')).encode()
    js += b' ' * ((4 - len(js) % 4) % 4)
    total = 12 + 8 + len(js) + 8 + len(binario)
    with open(ruta, 'wb') as f:
        f.write(struct.pack('<III', 0x46546C67, 2, total))
        f.write(struct.pack('<II', len(js), 0x4E4F534A) + js)
        f.write(struct.pack('<II', len(binario), 0x004E4942) + bytes(binario))
    return os.path.getsize(ruta)


# ---------------------------------------------------------------------------
# Cadenas del catálogo
# ---------------------------------------------------------------------------

def cadena(largo, a, b, rn, rz, nu, nv, potencia=1.0, giro=0.0):
    malla = eslabon_oval(a, b, rn, rz, nu, nv, potencia)
    paso = 2 * (a - rn) * 0.98  # distancia entre centros: los eslabones apenas se tocan
    en = curva_collar(largo)
    P, N, I, n = colocar(malla, en, largo, paso, giro)
    return (P, N, I), n, en


def main():
    os.makedirs(SALIDA, exist_ok=True)
    reporte = []

    # Cadena Río: eslabón veneciano (cuadrado), 45 cm, ~2 mm de ancho.
    (P, N, I), n, _ = cadena(450, 1.0, 1.0, 0.32, 0.32, 24, 8, potencia=0.35)
    kb = escribir_glb(os.path.join(SALIDA, 'cadena-rio.glb'), [('Metal', P, N, I)]) // 1024
    reporte.append(('cadena-rio.glb', 'Veneciana 45 cm', n, len(P), kb))

    # Cadena Cauca: eslabón cubano (oval, ancho y aplanado), 50 cm, ~6 mm de ancho.
    (P, N, I), n, _ = cadena(500, 3.2, 2.3, 1.25, 0.8, 30, 12, giro=math.radians(28))
    kb = escribir_glb(os.path.join(SALIDA, 'cadena-cauca.glb'), [('Metal', P, N, I)]) // 1024
    reporte.append(('cadena-cauca.glb', 'Cubana 50 cm', n, len(P), kb))

    # Collar Aura: cadena fina tipo rolo, 45 cm, con una perla de 8 mm colgando.
    (P, N, I), n, en = cadena(450, 1.25, 0.95, 0.33, 0.33, 22, 8)
    largo = 450
    fondo, T = en(largo / 2)                         # punto más bajo del collar
    # Argolla que sujeta la perla, perpendicular al collar.
    arg = eslabon_oval(1.7, 1.7, 0.4, 0.4, 28, 10)
    R = np.stack([np.array([0, -1.0, 0]), np.array([0, 0, 1.0]), np.array([1.0, 0, 0])], axis=1)
    pA, nA, iA = transformar(arg, R, fondo + np.array([0, -1.4, 0]))
    # Capuchón metálico y perla.
    capu = esfera(1.3, 24, 12)
    pC, nC, iC = transformar(capu, np.eye(3), fondo + np.array([0, -3.4, 0]))
    perla = esfera(4.0)
    pP, nP, iP = transformar(perla, np.eye(3), fondo + np.array([0, -7.6, 0]))

    metal_P = np.concatenate([P, pA, pC])
    metal_N = np.concatenate([N, nA, nC])
    metal_I = np.concatenate([I, iA + len(P), iC + len(P) + len(pA)])
    kb = escribir_glb(os.path.join(SALIDA, 'collar-aura.glb'),
                      [('Metal', metal_P, metal_N, metal_I), ('Perla', pP, nP, iP)]) // 1024
    reporte.append(('collar-aura.glb', 'Rolo 45 cm + perla 8 mm', n, len(metal_P) + len(pP), kb))

    for archivo, desc, eslabones, vertices, peso in reporte:
        print(f'{archivo:20} {desc:24} {eslabones:4} eslabones  {vertices:7} vértices  {peso:5} KB')


if __name__ == '__main__':
    main()
