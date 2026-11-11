# Camelia · Front

Sitio de joyería en plata 925 y oro 18K. HTML, CSS y JavaScript puro: no necesita instalar nada.

## Cómo verlo

Abre `index.html` en el navegador (doble clic).

## Páginas

| Archivo | Qué es |
|---|---|
| `index.html` | Inicio: hero Plata/Oro, categorías, colección, configurador, proceso, servicios, testimonios |
| `categoria.html` | Catálogo con filtros (tipo, metal, precio, piedra, personalizable). Ej: `categoria.html?cat=anillos&metal=oro` |
| `producto.html` | Ficha de producto. Ej: `producto.html?id=anillo-sol` |
| `disena.html` | Configurador a pantalla completa (manual y con IA) |

## Carpetas

```
css/styles.css      Todos los estilos (colores y tipografías arriba, en :root)
js/data.js          Catálogo: categorías, productos, precios, testimonios  ← aquí se editan los datos
js/jewels.js        Dibujos de joyas en SVG (temporales hasta tener fotos)
js/layout.js        Encabezado + mega menú, menú móvil, buscador, carrito, footer
js/configurator.js  "Diseña tu joya"
js/home.js / categoria.js / producto.js   Lógica de cada página
```

## Modelos 3D

Los productos con `model:` en `js/data.js` muestran un visor 3D (Google model-viewer) en su página:
se pueden girar, acercar y ver en realidad aumentada desde el celular ("Ver en mi espacio").

- Los archivos están en `models/` (formato GLB, medidas reales).
- El color plata / oro se aplica en vivo al material llamado `Metal`, así que basta un archivo por joya.
- Las cadenas actuales se generan con `python3 tools/generar_cadenas.py` y la pulsera de hematita con
  `cd tools && python3 generar_pulsera.py` (requieren numpy).
- Para cambiar una por el modelo de un diseñador: exportar en GLB, nombrar el material metálico `Metal`
  y reemplazar el archivo en `models/`.
- Los modelos 3D no cargan abriendo el archivo con doble clic: hay que usar un servidor local
  (`python3 -m http.server 5500` y abrir http://localhost:5500).

## Personalizador de pulseras tejidas

`personaliza-pulsera.html` (+ `js/pulsera-tejida.js`, hecho con Three.js) permite armar una pulsera tejida en 3D:
estilo (macramé o balines en hilo), color del hilo, ancho, tamaño de los balines de oro 18K, y el orden de las
cuentas arrastrándolas (balín liso, diamantado, neopreno de colores, hematita, medalla con inicial, nudos).

- **Precio del oro:** se edita en `js/data.js` → `CAMELIA.ORO18K.precioGramo`. El peso de cada balín se calcula
  con su diámetro (balín hueco, pared de 0,2 mm); también se ajusta ahí.
- Colores de hilo y neopreno, anchos, tallas y precios del tejido: `CAMELIA.TEJIDO` en `js/data.js`.
- Si el equipo no soporta 3D, el diseñador sigue funcionando y solo avisa que no puede mostrar la vista.
- Realismo: iluminación de estudio fotográfico (`assets/hdri/estudio.hdr`, "Photo Studio 01") y relieve de lino
  (`assets/textures/lino/`, "Rough Linen"), ambos de Poly Haven con licencia CC0 (uso comercial libre, sin atribución obligatoria).
  El hilo usa un relieve de 3 hebras torcidas generado por código; además hay oclusión ambiental y brillo suave en el oro.

## Siguientes pasos

- Cambiar los dibujos SVG por fotos reales de producto.
- Conectar `data.js` con el backend (CameliaBack) para traer productos y guardar pedidos.
- El modo IA del configurador es una simulación: genera propuestas a partir de palabras clave.
- Reemplazar el número de WhatsApp (`570000000000`) en `js/layout.js`.
