# Historial de cambios

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
