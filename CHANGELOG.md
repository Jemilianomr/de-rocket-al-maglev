# Historial de cambios

## v3.0.0 — 2026-10-26

Tres trenes nuevos investigados en fuentes oficiales y técnicas: el inventario pasa de ocho a once hitos, de 1829 a 2018.

### Nuevo
- **Siemens & Halske, 1879** (Berlín): el primer tren eléctrico alimentado desde una central fija que llevó pasajeros. Ocho piezas: motor de corriente continua de 2,2 kW, engranajes cónicos con inversor de marcha, frotadores, riel central de 150 V, dínamo con máquina fija, bastidor, caja con el conductor a horcajadas y tres coches con 18 pasajeros. Cotas del Deutsches Museum (inv. 3720) y de Sperling (2023).
- **Union Pacific 4000 «Big Boy», 1941**: 4-8-8-4 articulada con cuatro cilindros de expansión simple. Nueve piezas, con caldera de tubos de 22 ft, hogar con alimentador mecánico, doble chimenea, dos unidades motrices con Walschaerts y diagrama p–V de cuatro cilindros, articulación, bogies, cabina y ténder de 14 ruedas.
- **Alstom Coradia iLint, 2018**: el primer tren de pasajeros con pila de combustible de hidrógeno. Ocho piezas: depósitos a 350 bar, pilas PEM, batería, convertidores, motor asíncrono con cardanes, bogies B′2′+2′B′, frenos y caja Lint 54. Vapor de agua por el techo y aerogeneradores en el escenario.
- **Curva cerrada** (Big Boy): la unidad delantera gira sobre el pivote como en la curva mínima de 288 ft; disponible en el HUD, en el recorrido y en el modo estudio de la articulación.
- **Tracción por hidrógeno** en la telemetría: consumo estimado de H₂ en kg/h; el freno regenerativo del iLint carga la batería y apaga los flujos de hidrógeno mientras frena.
- 24 pasos nuevos de «Cómo funciona» y modo estudio para las 25 piezas nuevas, con componentes señalados y cotas.
- Tres escenarios nuevos: Exposición Industrial de Berlín de 1879, llanuras de Wyoming y Baja Sajonia con aerogeneradores.
- Comparativa con once hitos, nuevo color para el hidrógeno y nota sobre las definiciones de potencia.

### Mejorado
- Escenarios con campos y banderines: un material por color en lugar de uno por pieza, de unas 830 a 17 mallas en el TGV.
- La cámara del corte transversal se adapta a modelos pequeños (Siemens) y grandes (Big Boy).
- La línea de tiempo y la tabla comparativa admiten los once trenes.

## v2.0.0 — 2026-10-21

Animaciones más detalladas y explicación del funcionamiento del tren completo y de cada pieza.

### Nuevo
- **Cómo funciona:** recorrido guiado de 8 pasos por tren (64 en total). Cada paso encuadra la pieza, ajusta corte, rayos X, flujos y velocidad, y trae un dato o ecuación con valores reales. Tarjeta contraíble en el teléfono.
- **Estudiar pieza:** la pieza aislada sobre un plano con cuadrícula a escala y giro automático, componentes señalados con letras (las etiquetas siguen a las piezas móviles), cotas con valores de las fuentes y piezas de contexto translúcidas. Disponible para las 66 piezas.
- **Diagrama p–V en vivo** para Rocket, General y Mallard: ciclo con admisión, expansión politrópica, escape anticipado y compresión; presión en cada cámara del cilindro por color; control de corte; presión media efectiva, trabajo por vuelta y potencia indicada ideal. Sección nueva en la pestaña Física.
- **Mecanismos:** humo y chispas en GPU sincronizados con cada golpe de escape, fuego con luz parpadeante, chispas en pantógrafos, rotores Roots lobulados y régimen del V16 según el punto del acelerador (F7), aguja del conmutador de 22 tomas (Krokodil), corredera en D del General, vía irregular con balancín compensador en acción.
- **Frenos:** regenerativo (Krokodil, Transrapid) con flujo invertido en verde; reostático y dinámico (Serie 0, TGV, F7) con energía hacia las resistencias y ventiladores que sólo giran al frenar.
- **Realce por contorno** de la pieza seleccionada en el shader, sin tocar los materiales emisivos.
- Controles en el HUD: diagrama p–V, freno eléctrico, vía irregular y estado del mecanismo.
- Sitio en GitHub Pages con documento HTML completo y vista previa para redes sociales.

### Corregido
- Rocket: la ficha daba 12,8 m² como superficie de los tubos; es la total. Tubos: 117,8 ft² (≈ 10,9 m²).
- Al cambiar de tren con una pieza seleccionada, el tren nuevo aparecía casi transparente.
- Si se interrumpía la animación de entrada, el escenario podía quedar a media altura.
- F7: el corte transversal del motor ahora pasa por un par de cilindros.

## v1.0.0 — 2026-10-20

Primera versión.

- Ocho trenes modelados a escala 1:1 con 6 a 9 piezas cada uno: función, diseño, fabricación, evolución, datos y referencias.
- Corte longitudinal y transversal con superficies rayadas, vista explosionada, rayos X y flujos de energía.
- Mecanismos animados, telemetría, curva esfuerzo–velocidad con límite de adherencia y ecuaciones con datos reales.
- Contexto histórico, fuentes por tren y comparativa entre eras.
- Render bajo demanda y auditoría automática (estabilidad, memoria, llamadas de dibujo).
