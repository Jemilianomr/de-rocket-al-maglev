# De Rocket al Maglev

**Atlas 3D interactivo de la evolución de la tracción ferroviaria, 1829–2004.** Ocho hitos modelados a escala 1:1, con piezas que se pueden aislar, cortar en sección y ver funcionar, explicados para ingenieros mecánicos y eléctricos.

### ▶ [Abrir el atlas](https://jemilianomr.github.io/de-rocket-al-maglev/)

![Mallard (1938) en el atlas, con las piezas numeradas](docs/img/portada.jpg)

Funciona en cualquier navegador moderno con WebGL 2, en escritorio y en el teléfono. Se aprovecha la tarjeta gráfica y sólo se redibuja cuando algo cambia.

## Los ocho hitos

| Año | Tren | País | Tracción | Qué aporta |
|---|---|---|---|---|
| 1829 | Rocket | Reino Unido | Vapor | Caldera multitubular, hogar con camisa de agua y tiro por escape |
| 1855 | The General | Estados Unidos | Vapor | Bogie delantero y balancines compensadores para vías irregulares |
| 1919 | Ce 6/8 II «Krokodil» | Suiza | Eléctrica 15 kV 16⅔ Hz | Transformador con 22 tomas, eje ciego y freno de recuperación |
| 1938 | Mallard (A4 4468) | Reino Unido | Vapor | Tres cilindros, Walschaerts + conjugada Gresley, escape Kylchap; récord de 203 km/h |
| 1949 | EMD F7 | Estados Unidos | Diésel-eléctrica | V16 de dos tiempos, generador de CC, motores suspendidos por la nariz, freno dinámico |
| 1964 | Shinkansen Serie 0 | Japón | Eléctrica 25 kV 60 Hz | Tracción distribuida, rectificador de silicio, señal en cabina (ATC) |
| 1981 | TGV Sud-Est | Francia | Eléctrica 25 kV / 1,5 kV | Tiristores, motores colgados de la caja, bogies Jacobs |
| 2004 | Transrapid de Shanghái | China / Alemania | Levitación magnética | Estator largo en la vía, sustentación EMS a ~10 mm |

## Qué se puede hacer

**Cómo funciona.** Un recorrido de 8 pasos por tren que sigue la energía de la fuente a la rueda. La cámara, el corte, los rayos X, los flujos y la velocidad se ajustan en cada paso, y cada uno trae un dato o una ecuación con valores reales.

![Paso «Expansión en los cilindros» del recorrido de Rocket, con el diagrama p–V](docs/img/recorrido-rocket.jpg)

**Estudiar pieza.** Aísla la pieza sobre un plano con cuadrícula a escala y giro automático, señala sus componentes con letras (las etiquetas siguen a émbolos, crucetas, bielas y dados mientras se mueven) y dibuja cotas con valores de las fuentes. Las piezas vecinas que dan contexto quedan translúcidas.

| | |
|---|---|
| ![Distribución Walschaerts y conjugada Gresley del Mallard](docs/img/estudio-walschaerts-mallard.jpg) | ![Balancín compensador del General sobre vía irregular](docs/img/estudio-balancin-general.jpg) |
| ![Soplador Roots del F7 en sección](docs/img/seccion-roots-f7.jpg) | ![Imanes de sustentación del Transrapid en sección](docs/img/estudio-sustentacion-maglev.jpg) |

**Diagrama p–V en vivo** (locomotoras de vapor). Dos puntos recorren el lazo de cada cámara del cilindro, cuyo color indica la presión. Al mover el corte de admisión cambian la presión media efectiva, el trabajo por vuelta y la potencia indicada ideal.

**Además:**

- **Corte** longitudinal y transversal con superficies rayadas como en un plano.
- **Vista explosionada**, **rayos X** de carrocerías y **flujos de energía** animados (vapor, gases, combustible, corriente).
- **Modos:** freno regenerativo (flujo invertido en verde) y reostático, vía irregular, régimen del diésel según el punto del acelerador y tomas del transformador.
- **Fichas técnicas**, curva esfuerzo–velocidad con límite de adherencia, **ecuaciones con datos reales**, **contexto histórico** (qué pasaba en la sociedad que explica el diseño) y **fuentes** por tren.
- **Comparar eras:** velocidad, potencia específica y carga por eje de los ocho trenes.

![Comparativa entre eras](docs/img/comparar-eras.jpg)

**Atajos de teclado:** ← → cambian de tren (o de paso en un recorrido) · <kbd>Espacio</kbd> animar · <kbd>C</kbd> corte · <kbd>E</kbd> explosionar · <kbd>X</kbd> rayos X · <kbd>F</kbd> flujos · <kbd>L</kbd> globos · <kbd>H</kbd> vista inicial · <kbd>Esc</kbd> salir.

## Exactitud y fuentes

Los modelos se construyen en código a escala 1:1 (1 unidad = 1 m) a partir de cotas publicadas: diámetros de rueda, empates, ancho de vía, cilindros, longitudes y posición de los componentes principales. Los detalles menores están simplificados y las cotas que no aparecen en las fuentes se estimaron por proporción; la pestaña **Fuentes** de cada tren indica cuáles, junto con las referencias primarias (por ejemplo, el cuaderno de J. U. Rastrick para Rocket o la especificación de Rogers para el General) y la bibliografía recomendada.

Dos supuestos están señalados en la propia interfaz:

- El diagrama p–V es un **ciclo ideal**: su potencia es una cota superior. A alta velocidad la presión en la caja de vapor cae y la potencia real es menor, como muestra la curva esfuerzo–velocidad.
- La presión de caldera del General (100 psi) es un **supuesto** típico de la década: la especificación de 1855 no la registra.

## Estructura del repositorio

```
src/shell.html     interfaz: marcado y estilos
js/builders.js     primitivas, materiales con corte y realce, partículas en GPU, vía y diorama
js/models_base.js  clase Model, cinemática biela-manivela, simulación de vapor, frenos
js/stage.js        renderizador, luces, cámara y escenarios por era
js/m_*.js          un archivo por tren (geometría y animación)
js/data1.js–2.js   textos técnicos e históricos, fichas, ecuaciones y fuentes
js/data3.js        recorridos «Cómo funciona»
js/data4.js        modo estudio: componentes y cotas por pieza
js/app.js          interfaz: selección, corte, recorridos, estudio, p–V, paneles
build.py           compila todo en un solo HTML
docs/              sitio publicado en GitHub Pages (docs/index.html se genera)
test/              auditoría y pruebas con Playwright (ver test/README.md)
```

## Desarrollo

No hay dependencias de compilación: `build.py` concatena los módulos en un HTML autocontenido; three.js r147 se carga desde jsDelivr.

```sh
python3 build.py        # docs/index.html + dist/
```

Para probar en local abre `docs/index.html` en el navegador. Las pruebas automáticas están descritas en [`test/README.md`](test/README.md):

```sh
./tools/fetch_vendor.sh && python3 test/auditoria.py
```

## Historial

Los cambios de cada versión están en [`CHANGELOG.md`](CHANGELOG.md). En el historial de commits, la v1.0 y la v2.0 son commits separados, así que se puede comparar una con otra. Las ideas y correcciones pendientes pueden registrarse en *Issues*.

## Licencia

Código bajo licencia [MIT](LICENSE). three.js es © sus autores, también bajo MIT. Los datos técnicos e históricos citan sus fuentes en la pestaña **Fuentes** de cada tren; las libreas son genéricas y no reproducen logotipos ni rotulaciones.
