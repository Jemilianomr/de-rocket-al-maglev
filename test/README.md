# Pruebas

Las pruebas abren `dist/test.html` en Chromium sin interfaz (Playwright) con WebGL por software (SwiftShader), así que no necesitan tarjeta gráfica. Los tiempos por fotograma que reportan **no** representan el rendimiento real en una GPU.

```sh
python3 build.py                 # genera dist/test.html
./tools/fetch_vendor.sh          # three.js r147 local en vendor/ (requiere npm)
pip install playwright && python -m playwright install chromium
```

| Script | Qué comprueba |
|---|---|
| `auditoria.py` | Los 8 trenes: piezas, pestañas, corte, explosión, rayos X, flujos, animación, cinemática, NaN, llamadas de dibujo, fugas de memoria al ciclar, render bajo demanda en reposo y tabla comparativa. |
| `mecanismos.py` | Simulación de vapor (lazo p–V y presión media), frenos regenerativo y reostático, vía irregular, régimen del diésel y tomas del transformador. |
| `recorridos.py` | Recorre los 8 pasos de cada «Cómo funciona» y entra al modo estudio de cada pieza; verifica que piezas, flujos y puntos señalados existan y caigan dentro de su pieza. |
| `captura.py` | Una captura de pantalla tras ejecutar pasos de JavaScript: `python3 test/captura.py salida.png "window.__app.startTour()" 1440 900`. |
| `capturas.py` | Varias capturas desde un plan JSON `[["nombre", ["js", 3000, ...]], ...]`; se guardan en `test/out/`. |
| `visor.py` + `viewer.html` | Visor de un solo modelo para depurar geometría: `python3 test/visor.py mallard salida.png`. |
| `webgl.py` | Comprueba que el Chromium de pruebas tenga WebGL 2. |

La API de depuración está en `window.__app` (`goTrain`, `selectPart`, `startTour`, `tourGo`, `enterStudy`, `setCut`, `setBrake`, …).
