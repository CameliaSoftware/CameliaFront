"""Genera el modelo 3D de la Pulsera Hematita (cordón ajustable).

Estructura (según las fotos de referencia):
- Cordón negro trenzado de dos hilos, con nudo corredizo de macramé para ajustar la talla.
- 20 cuentas alternadas: 10 de hematita mate con ranuras (8 mm) y 10 metálicas pulidas (6 mm).
- En el centro, dos cuentas metálicas juntas con una argolla y un dije "V" de corazón abierto.
- Cada punta del cordón lleva una cuenta metálica, una de hematita y un nudo final.

Medidas en milímetros (muñeca de ~17 cm). Uso: python3 tools/generar_pulsera.py
"""
import math
import os

import numpy as np

from generar_cadenas import SALIDA, eslabon_oval, escribir_glb, transformar

Z = np.array([0, 0, 1.0])


# ---------------------------------------------------------------------------
# Curvas y barridos
# ---------------------------------------------------------------------------

def catmull(puntos, paso=0.25):
    """Suaviza una lista de puntos (Catmull-Rom) y la remuestrea cada `paso` mm."""
    P = np.array(puntos, dtype=float)
    P = np.vstack([P[0] * 2 - P[1], P, P[-1] * 2 - P[-2]])
    densa = []
    for i in range(1, len(P) - 2):
        p0, p1, p2, p3 = P[i - 1], P[i], P[i + 1], P[i + 2]
        for t in np.linspace(0, 1, 24, endpoint=False):
            t2, t3 = t * t, t * t * t
            densa.append(0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 + (-p0 + 3 * p1 - 3 * p2 + p3) * t3))
    densa.append(P[-2])
    densa = np.array(densa)
    seg = np.linalg.norm(np.diff(densa, axis=0), axis=1)
    acum = np.concatenate([[0], np.cumsum(seg)])
    s = np.arange(0, acum[-1], paso)
    return np.stack([np.interp(s, acum, densa[:, k]) for k in range(3)], axis=1)


def marcos(C):
    """Tangente y normal en el plano XY para cada punto de una curva plana."""
    T = np.gradient(C, axis=0)
    T /= np.linalg.norm(T, axis=1, keepdims=True)
    N = np.cross(Z, T)
    return T, N


def malla_rejilla(P, centro, cerrar_u):
    """Convierte una rejilla (nu, nv, 3) en triángulos con normales hacia afuera."""
    nu, nv, _ = P.shape
    if cerrar_u:
        du = np.roll(P, -1, axis=0) - np.roll(P, 1, axis=0)
    else:
        du = np.gradient(P, axis=0)
    dv = np.roll(P, -1, axis=1) - np.roll(P, 1, axis=1)
    N = np.cross(du, dv)
    N /= np.linalg.norm(N, axis=2, keepdims=True) + 1e-12
    N = np.where(np.sum(N * (P - centro), axis=2, keepdims=True) < 0, -N, N)
    idx = []
    filas = nu if cerrar_u else nu - 1
    for i in range(filas):
        for j in range(nv):
            a = i * nv + j
            b = ((i + 1) % nu) * nv + j
            c = ((i + 1) % nu) * nv + (j + 1) % nv
            d = i * nv + (j + 1) % nv
            idx += [a, b, c, a, c, d]
    return P.reshape(-1, 3), N.reshape(-1, 3), np.array(idx, dtype=np.uint32)


def barrido(C, rn, rz, nv=10, desplazar=None):
    """Tubo a lo largo de la curva C. `desplazar(i, T, N)` mueve el centro (para hilos trenzados)."""
    T, N = marcos(C)
    centros = C.copy()
    if desplazar is not None:
        centros = np.array([C[i] + desplazar(i, T[i], N[i]) for i in range(len(C))])
    vs = np.linspace(0, 2 * np.pi, nv, endpoint=False)
    P = centros[:, None, :] + rn * np.cos(vs)[None, :, None] * N[:, None, :] + rz * np.sin(vs)[None, :, None] * Z
    return malla_rejilla(P, centros[:, None, :], cerrar_u=False)


def cordon_trenzado(C, r_hilo=0.32, separacion=0.27, paso_trenza=1.8):
    """Cordón de dos hilos enrollados en hélice, como el hilo encerado de la foto."""
    partes = []
    s = np.concatenate([[0], np.cumsum(np.linalg.norm(np.diff(C, axis=0), axis=1))])
    for fase in (0, math.pi):
        def desplazar(i, T, N, fase=fase):
            a = 2 * math.pi * s[i] / paso_trenza + fase
            return separacion * (math.cos(a) * N + math.sin(a) * Z)
        partes.append(barrido(C, r_hilo, r_hilo, 8, desplazar))
    return unir(partes)


def unir(partes):
    P, N, I, base = [], [], [], 0
    for p, n, i in partes:
        P.append(p); N.append(n); I.append(i + base); base += len(p)
    return np.concatenate(P), np.concatenate(N), np.concatenate(I)


# ---------------------------------------------------------------------------
# Cuentas
# ---------------------------------------------------------------------------

def cuenta(radio, eje_aplanado=0.93, ranuras=None, nu=36, nv=24):
    """Esfera con el eje del orificio en Z local. `ranuras`: alturas relativas (-1..1) de las ranuras.
    Devuelve posiciones, normales, índices y color por vértice (las ranuras salen más oscuras)."""
    pos, col = [], []
    for i in range(nv + 1):
        th = math.pi * i / nv
        z_rel = math.cos(th)
        r = radio
        oscuro = 1.0
        if ranuras:
            hundido = sum(math.exp(-((z_rel - zi) / 0.055) ** 2) for zi in ranuras)
            r -= 0.38 * min(hundido, 1.0)
            oscuro = 1.0 - 0.75 * min(hundido, 1.0)
        for j in range(nu + 1):
            ph = 2 * math.pi * j / nu
            pos.append([r * math.sin(th) * math.cos(ph), r * math.sin(th) * math.sin(ph), radio * eje_aplanado * z_rel])
            col.append([oscuro] * 3)
    pos = np.array(pos)
    idx = []
    for i in range(nv):
        for j in range(nu):
            a = i * (nu + 1) + j
            b = a + nu + 1
            idx += [a, b, a + 1, a + 1, b, b + 1]
    idx = np.array(idx, dtype=np.uint32)
    # Normales por promedio de caras (respetan las ranuras).
    nor = np.zeros_like(pos)
    tri = idx.reshape(-1, 3)
    cara = np.cross(pos[tri[:, 1]] - pos[tri[:, 0]], pos[tri[:, 2]] - pos[tri[:, 0]])
    for k in range(3):
        np.add.at(nor, tri[:, k], cara)
    nor /= np.linalg.norm(nor, axis=1, keepdims=True) + 1e-12
    nor = np.where(np.sum(nor * pos, axis=1, keepdims=True) < 0, -nor, nor)
    return pos, nor, idx, np.array(col)


def orientar(datos, centro, eje):
    """Pone una pieza (con eje local Z) en `centro`, con su eje Z apuntando a `eje`."""
    eje = eje / np.linalg.norm(eje)
    a = np.cross(Z, eje)
    a = a / np.linalg.norm(a) if np.linalg.norm(a) > 1e-6 else np.array([1.0, 0, 0])
    b = np.cross(eje, a)
    R = np.stack([a, b, eje], axis=1)
    pos, nor, idx = datos[:3]
    salida = (pos @ R.T + centro, nor @ R.T, idx)
    return salida + tuple(datos[3:])


# ---------------------------------------------------------------------------
# Pulsera
# ---------------------------------------------------------------------------

def main():
    R = 27.0                        # radio del círculo de cuentas (muñeca ~17 cm)
    GRIS, ORO, SEP, ARG = 8.0, 6.0, 0.6, 1.4
    mitad = ['gris', 'oro'] * 5     # de la punta al centro: gris, oro, ..., oro
    secuencia = mitad + mitad[::-1]  # centro: oro | argolla | oro
    largo = sum(GRIS if c == 'gris' else ORO for c in secuencia) + SEP * (len(secuencia) - 1) + ARG

    th_nudo = math.radians(60)      # el nudo va arriba a la derecha; el dije cuelga abajo a la izquierda
    hueco = 2 * math.pi - (largo + 3) / R
    th1 = th_nudo + hueco / 2       # inicio de las cuentas (sentido antihorario)
    radial = lambda th: np.array([math.cos(th), math.sin(th), 0])
    tang = lambda th: np.array([-math.sin(th), math.cos(th), 0])

    K = (R + 1.2) * radial(th_nudo)
    tk, rk = tang(th_nudo), radial(th_nudo)
    L_NUDO = 10.0

    # --- Cordón: punta 1 -> nudo -> cuentas -> nudo -> punta 2 (una sola pieza) ---
    def punta(signo, n=10):
        ini = K + signo * (L_NUDO / 2) * tk
        ctrl = K + signo * 16 * tk + 4 * rk
        fin = K + signo * 22 * tk + 30 * rk
        t = np.linspace(0, 1, n)[:, None]
        return (1 - t) ** 2 * ini + 2 * (1 - t) * t * ctrl + t ** 2 * fin

    arco = [R * radial(th1 + (th - th1)) for th in np.linspace(th1, th1 + (2 * math.pi - hueco), 160)]
    off = 0.6
    puntos = list(punta(-1)[::-1])                                   # punta 1 (entra por el lado horario)
    puntos += [K - (L_NUDO / 2) * tk + off * rk, K + (L_NUDO / 2) * tk + off * rk]
    puntos += arco
    puntos += [K - (L_NUDO / 2) * tk - off * rk, K + (L_NUDO / 2) * tk - off * rk]
    puntos += list(punta(+1))
    C = catmull(puntos)
    cordon = cordon_trenzado(C)

    # Nudos finales de cada punta.
    remate = cuenta(1.0, 1.0)[:3]
    remates = [transformar(remate, np.eye(3), C[0]), transformar(remate, np.eye(3), C[-1])]

    # --- Nudo corredizo de macramé: barril con lazos alternados ---
    xs = np.linspace(-L_NUDO / 2, L_NUDO / 2, 90)
    vs = np.linspace(0, 2 * np.pi, 28, endpoint=False)
    P = []
    for x in xs:
        afinar = min(1.0, (L_NUDO / 2 - abs(x)) / 1.2) ** 0.5
        k = math.floor((x + L_NUDO / 2) / 1.4)
        fila = []
        for v in vs:
            lazo = abs(math.sin(math.pi * (x + L_NUDO / 2) / 1.4))
            lado = 0.6 + 0.4 * math.cos(v + (k % 2) * math.pi)
            r = 0.9 + afinar * (1.0 + 0.55 * lazo * lado)
            fila.append(K + x * tk + r * (math.cos(v) * rk + math.sin(v) * Z))
        P.append(fila)
    nudo = malla_rejilla(np.array(P), (K + xs[:, None, None] * tk)[:, :, :], cerrar_u=False)

    # --- Cuentas sobre el arco ---
    hematita = cuenta(GRIS / 2, 0.92, ranuras=[-0.62, -0.31, 0.0, 0.31, 0.62])
    oro = cuenta(ORO / 2, 0.9)
    piezas_hem, piezas_oro = [], []
    s = 1.5
    centro_dije = None
    for i, c in enumerate(secuencia):
        d = GRIS if c == 'gris' else ORO
        th = th1 + (s + d / 2) / R
        pieza = orientar(hematita if c == 'gris' else oro, R * radial(th), tang(th))
        (piezas_hem if c == 'gris' else piezas_oro).append(pieza)
        s += d + SEP
        if i == len(secuencia) // 2 - 1:          # entre las dos cuentas doradas del centro
            s += ARG - SEP
            centro_dije = th1 + (s - ARG / 2 - SEP / 2) / R

    # Cuentas de las puntas: dorada y luego hematita, cerca del final.
    for extremo in (C[:220][::-1], C[-220:]):
        T, _ = marcos(extremo)
        for c, dist in (('oro', 171), ('gris', 201)):   # la hematita queda justo antes del nudo final
            pieza = orientar(hematita if c == 'gris' else oro, extremo[dist], T[dist])
            (piezas_hem if c == 'gris' else piezas_oro).append(pieza)

    # --- Argolla y dije en "V" de corazón abierto ---
    ra, ta = radial(centro_dije), tang(centro_dije)
    argolla = eslabon_oval(1.5, 1.5, 0.32, 0.32, 28, 10)
    Ra = np.stack([ra, Z, ta], axis=1)                 # la argolla rodea el cordón
    argolla = transformar(argolla, Ra, R * ra + 0.9 * ra)
    contorno = [(-2.2, 7.0), (-3.6, 7.7), (-4.4, 6.4), (-3.3, 5.3), (-1.7, 3.1), (0, 0),
                (1.2, 2.7), (2.5, 5.6), (3.6, 8.0), (4.4, 9.3)]
    ancla = np.array([-2.6, 8.4])                       # donde se cuelga de la argolla
    curva = catmull([(x, y, 0) for x, y in contorno], 0.15)
    T, N = marcos(curva)
    vs = np.linspace(0, 2 * np.pi, 10, endpoint=False)
    Pd = curva[:, None, :] + 0.5 * np.cos(vs)[None, :, None] * N[:, None, :] + 0.22 * np.sin(vs)[None, :, None] * Z
    dije = malla_rejilla(Pd, curva[:, None, :], cerrar_u=False)
    inclinacion = math.radians(15)
    arriba = np.array([0, 1.0, 0])
    eje_y = arriba * math.cos(inclinacion) + Z * math.sin(inclinacion)   # el dije cuelga hacia abajo
    eje_x = np.array([1.0, 0, 0])
    eje_z = np.cross(eje_x, eje_y)
    Rd = np.stack([eje_x, eje_y, eje_z], axis=1)
    origen = R * ra + 2.3 * ra - Rd @ np.array([ancla[0], ancla[1], 0])
    dije = transformar(dije, Rd, origen)
    gancho = transformar(eslabon_oval(0.9, 0.9, 0.22, 0.22, 20, 8), np.stack([ta, Z, ra], axis=1), R * ra + 2.2 * ra)

    metal = unir([p[:3] for p in piezas_oro] + [argolla, dije, gancho])
    hem = unir([p[:3] for p in piezas_hem])
    colores_hem = np.concatenate([p[3] for p in piezas_hem])
    cord = unir([cordon, nudo] + remates)

    ruta = os.path.join(SALIDA, 'pulsera-hematita.glb')
    kb = escribir_glb(ruta, [('Metal', *metal), ('Hematita', *hem, colores_hem), ('Cordon', *cord)]) // 1024
    total = len(metal[0]) + len(hem[0]) + len(cord[0])
    print(f'pulsera-hematita.glb  {len(secuencia)} cuentas + 4 en puntas  {total} vértices  {kb} KB')


if __name__ == '__main__':
    main()
