/* Siemens & Halske (Berlín, 1879) — primera locomotora eléctrica de uso práctico.
   150 V CC por un riel central de pletina de hierro, retorno por los carriles; motor de 2,2 kW (3 PS) longitudinal,
   transmisión por engranajes cónicos con inversor de marcha. Cotas del Deutsches Museum (inv. 3720) y de Sperling (2023). */
(function () {
  const { T, Kit, G, wheelset } = TB;
  const { Model, pantoSparks } = MB;

  // figura humana simple (escala) sentada; dir: +1/-1 hacia donde mira en z, o 'x' para montar a horcajadas mirando +x
  function person(k, m, x, ySeat, z, dir, c) {
    const cl = m(c || 'cloth');
    if (dir === 'x') {
      k.add(G.cyl(0.12, 0.46, 10, 0.14), cl, [x, ySeat + 0.25, z]);
      k.sph(m('skin'), 0.085, x + 0.01, ySeat + 0.58, z);
      k.add(G.cyl(0.07, 0.1, 10, 0.075), m('hat'), [x + 0.01, ySeat + 0.69, z]); k.cyl(m('hat'), 0.11, 0.012, 'y', x + 0.01, ySeat + 0.64, z, 12);
      for (const s of [1, -1]) { // a horcajadas: muslos a los lados del banco y pies en los reposapiés
        k.bar(cl, [x, ySeat + 0.04, z + s * 0.09], [x + 0.2, ySeat + 0.0, z + s * 0.17], 0.09, 0.09);
        k.bar(cl, [x + 0.2, ySeat + 0.0, z + s * 0.17], [x + 0.3, ySeat - 0.1, z + s * 0.25], 0.075, 0.075);
        k.bar(m('hat'), [x + 0.28, ySeat - 0.105, z + s * 0.25], [x + 0.38, ySeat - 0.105, z + s * 0.25], 0.06, 0.04); }
      for (const s of [1, -1]) k.bar(cl, [x + 0.02, ySeat + 0.4, z + s * 0.14], [x + 0.28, ySeat + 0.28, z + s * 0.1], 0.06, 0.06);
      return;
    }
    k.add(G.cyl(0.11, 0.44, 10, 0.135), cl, [x, ySeat + 0.24, z]);
    k.sph(m('skin'), 0.08, x, ySeat + 0.55, z + dir * 0.01);
    k.add(G.cyl(0.065, 0.09, 10, 0.07), m('hat'), [x, ySeat + 0.65, z]); k.cyl(m('hat'), 0.1, 0.012, 'y', x, ySeat + 0.61, z, 12);
    for (const dx of [-0.07, 0.07]) {
      k.bar(cl, [x + dx, ySeat + 0.04, z], [x + dx, ySeat + 0.02, z + dir * 0.3], 0.08, 0.08);
      k.bar(cl, [x + dx, ySeat + 0.02, z + dir * 0.3], [x + dx, ySeat - 0.22, z + dir * 0.32], 0.07, 0.07);
    }
  }

  MODELS.siemens = function () {
    const M = new Model('siemens', {
      wood: ['#4e3220', { r: 0.55 }], woodL: ['#9a7048', { r: 0.7 }], woodB: ['#6e4a2e', { r: 0.65 }],
      iron: ['#34363a', { r: 0.5, m: 0.6 }], steel: ['#a9aeb3', { r: 0.3, m: 0.85 }], brass: ['#c99a3c', { r: 0.28, m: 0.9 }],
      copper: ['#b8693d', { r: 0.35, m: 0.85 }], coil: ['#a8622f', { r: 0.45, m: 0.6 }], tyre: ['#2c2d2f', { r: 0.4, m: 0.75 }],
      green: ['#2f4a3a', { r: 0.5 }], red: ['#8e2a1e', { r: 0.5 }], insul: ['#d8d2c0', { r: 0.3 }], brick: ['#8a4a35', { r: 0.9, flat: true }],
      cloth: ['#2f3440', { r: 0.9 }], cloth2: ['#5a3d34', { r: 0.9 }], cloth3: ['#3d4a3a', { r: 0.9 }], skin: ['#d8b08a', { r: 0.8 }], hat: ['#1c1c1d', { r: 0.7 }],
      belt: ['#4a3324', { r: 0.8 }], black: ['#1c1c1d', { r: 0.6 }], gear: ['#55595e', { r: 0.35, m: 0.8 }],
    });
    const g = 0.49, R = 0.2, XA = [0.25, -0.25], yA = R;   // ancho 490 mm, ruedas Ø 400 mm, empate 500 mm
    const iB = 2.25, iS = 3.0, ratio = iB * iS;              // reducción estimada: cónica 2,25 × recta 3 ≈ 6,75
    const yM = yA + 0.21;                                    // eje del motor y del contraeje
    const LX = 0.735, LW = 0.425, yF = 0.36, yT = 0.8;        // caja 1 470 × 850 mm
    const RC = 0.15, CAR = 1.7, CW = 0.45;                    // coches
    const carX = [-1.835, -3.935, -6.035];
    const XG = 3.3, ZG = -1.55;                               // dínamo estacionaria

    // 1 — Motor de corriente continua (dínamo Siemens usada como motor), longitudinal
    const pM = M.part('motor', { anchor: [0.12, 0.55, 0.3], explode: [0, 0.9, 0.6] });
    let arm;
    {
      const k = new Kit();
      // bobinas de campo laterales sobre núcleos de hierro y zapatas polares
      for (const s of [1, -1]) {
        k.cyl(pM.m('iron'), 0.05, 0.4, 'x', 0.09, yM, s * 0.17, 14);
        k.cyl(pM.m('coil'), 0.068, 0.32, 'x', 0.09, yM, s * 0.17, 18);
        for (let i = 0; i < 9; i++) k.add(G.torus(0.069, 0.006, 4, 18), pM.m('copper'), [-0.06 + i * 0.037, yM, s * 0.17], [0, Math.PI / 2, 0]);
        // zapata polar curva que abraza al inducido (eje del sector girado a lo largo de x)
        k.add(G.sector(0.1, 0.12, s > 0 ? Math.PI - 0.75 : -0.75, s > 0 ? Math.PI + 0.75 : 0.75, 0.36), pM.m('iron'), [0.09, yM, 0], [0, Math.PI / 2, 0]);
      }
      // yugos de hierro que cierran el circuito magnético
      for (const x of [-0.12, 0.3]) k.box(pM.m('iron'), 0.04, 0.12, 0.46, x, yM, 0);
      // portaescobillas y escobillas sobre el colector
      for (const s of [1, -1]) { k.box(pM.m('brass'), 0.03, 0.05, 0.02, 0.34, yM + s * 0.075, 0); k.box(pM.m('copper'), 0.02, 0.03, 0.03, 0.34, yM + s * 0.05, 0); }
      k.box(pM.m('iron'), 0.06, 0.06, 0.3, 0.34, yM + 0.13, 0);
      k.build(pM.group);
      // inducido de tambor (Hefner-Alteneck) con colector: gira
      arm = new T.Group(); arm.position.set(0.09, yM, 0);
      const ka = new Kit();
      ka.cyl(pM.m('iron'), 0.088, 0.36, 'x', 0, 0, 0, 24);
      for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; ka.box(pM.m('copper'), 0.37, 0.012, 0.012, 0, Math.cos(a) * 0.09, Math.sin(a) * 0.09); }
      ka.cyl(pM.m('copper'), 0.045, 0.05, 'x', 0.25, 0, 0, 16);
      for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; ka.box(pM.m('black'), 0.05, 0.004, 0.006, 0.25, Math.cos(a) * 0.046, Math.sin(a) * 0.046); }
      ka.cyl(pM.m('steel'), 0.014, 0.62, 'x', 0.02, 0, 0, 10);
      ka.add(G.cyl(0.04, 0.04, 16, 0.018), pM.m('gear'), [-0.255, 0, 0], [0, 0, -Math.PI / 2]);
      ka.build(arm); arm.name = 'S.arm'; pM.group.add(arm);
    }

    // 2 — Transmisión: piñón cónico, contraeje con inversor de marcha y par recto al eje trasero
    const pT = M.part('transmision', { anchor: [-0.25, 0.42, 0.2], explode: [-0.35, 0.55, 0.9] });
    let counter, axleGear;
    {
      counter = new T.Group(); counter.position.set(-0.25, yM, 0);
      const k = new Kit();
      k.cyl(pT.m('steel'), 0.015, 0.36, 'z', 0, 0, 0, 10);
      // dos coronas cónicas enfrentadas (marcha adelante y atrás) y piñón recto
      for (const s of [1, -1]) k.add(G.cyl(0.045, 0.035, 22, 0.085), pT.m('gear'), [0, 0, s * 0.055], [s > 0 ? -Math.PI / 2 : Math.PI / 2, 0, 0]);
      k.cyl(pT.m('gear'), 0.05, 0.04, 'z', 0, 0, -0.15, 16);
      for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; k.box(pT.m('gear'), 0.016, 0.016, 0.04, Math.cos(a) * 0.055, Math.sin(a) * 0.055, -0.15, 0, 0, a); }
      k.build(counter); counter.name = 'S.counter'; pT.group.add(counter);
      // soportes del contraeje y palanca del inversor (Wendegetriebe)
      const ks = new Kit();
      for (const z of [-0.2, 0.2]) ks.box(pT.m('iron'), 0.06, 0.12, 0.03, -0.25, yM - 0.02, z);
      ks.bar(pT.m('brass'), [-0.25, yM + 0.02, 0.21], [-0.32, yT + 0.12, 0.3], 0.025, 0.025);
      ks.sph(pT.m('black'), 0.025, -0.32, yT + 0.12, 0.3);
      ks.build(pT.group);
    }

    // 3 — Bastidor, ruedas y ejes
    const pB = M.part('bastidor', { anchor: [0.0, 0.25, 0.36], explode: [0, -0.4, 0] });
    const wsets = [];
    {
      XA.forEach((x) => {
        const w = wheelset({ R, gauge: g, tread: 0.06, type: 'spoke', spokes: 8, hubR: 0.045, rimT: 0.03, axleR: 0.025, m: { tyre: pB.m('tyre'), body: pB.m('iron'), hub: pB.m('iron'), axle: pB.m('steel') } });
        w.group.position.set(x, yA, 0); pB.group.add(w.group); wsets.push(w.group);
      });
      // rueda dentada recta del eje motor (pertenece a la transmisión y gira con el eje trasero)
      const kg = new Kit(); kg.cyl(pT.m('gear'), 0.14, 0.035, 'z', 0, 0, -0.15, 36);
      for (let j = 0; j < 30; j++) { const a = j / 30 * Math.PI * 2; kg.box(pT.m('gear'), 0.018, 0.018, 0.035, Math.cos(a) * 0.148, Math.sin(a) * 0.148, -0.15, 0, 0, a); }
      axleGear = new T.Group(); axleGear.position.set(XA[1], yA, 0); kg.build(axleGear); pT.group.add(axleGear);
      const k = new Kit(); const ir = pB.m('iron');
      for (const s of [1, -1]) {
        k.box(ir, 1.24, 0.2, 0.03, 0, 0.24, s * 0.335);
        for (const x of XA) { k.box(ir, 0.1, 0.1, 0.06, x, yA, s * 0.335); k.cyl(pB.m('steel'), 0.022, 0.1, 'z', x, yA, s * 0.31, 10); }
      }
      for (const x of [-0.6, 0.6]) k.box(ir, 0.05, 0.12, 0.7, x, 0.27, 0);
      // traviesas de tope y enganche
      for (const sx of [1, -1]) { k.box(pB.m('woodB'), 0.06, 0.12, 0.85, sx * LX, 0.3, 0); k.box(ir, 0.08, 0.03, 0.05, sx * (LX + 0.04), 0.27, 0); }
      k.build(pB.group);
    }

    // 4 — Toma de corriente: frotadores sobre el riel central y cables al motor
    const pC = M.part('toma', { anchor: [0.06, 0.06, 0.12], explode: [0.3, -0.55, 0.5] });
    {
      const k = new Kit();
      k.box(pC.m('wood'), 0.32, 0.03, 0.12, 0.06, 0.15, 0);       // tabla aislante del portafrotadores
      for (const x of [0.0, 0.12]) {
        k.bar(pC.m('brass'), [x, 0.15, 0], [x - 0.03, 0.02, 0], 0.012, 0.03);
        k.box(pC.m('copper'), 0.06, 0.015, 0.04, x - 0.04, 0.008, 0);  // frotador apoyado en la pletina
        for (let i = 0; i < 4; i++) k.add(G.torus(0.012, 0.003, 4, 10), pC.m('steel'), [x - 0.015, 0.05 + i * 0.02, 0.0], [Math.PI / 2, 0, 0]);
      }
      k.add(G.poly([[0.06, 0.16, 0], [0.12, 0.28, 0.05], [0.34, 0.36, 0.08], [0.34, yM + 0.09, 0.02]], 0.007, 6), pC.m('copper'));
      k.add(G.poly([[0.09, 0.16, 0], [0.09, 0.3, 0.12], [0.09, yM - 0.06, 0.12]], 0.007, 6), pC.m('copper'));
      k.build(pC.group);
    }

    // 5 — Riel central: pletina de hierro de canto sobre un larguero de madera (aislante)
    const pR = M.part('riel', { anchor: [1.4, -0.02, 0.06], explode: [0, -0.7, 0] });
    const RX0 = -8.0, RX1 = 4.2;
    {
      const k = new Kit();
      k.box(pR.m('woodB'), RX1 - RX0, 0.035, 0.08, (RX0 + RX1) / 2, -0.045, 0);
      k.box(pR.m('iron'), RX1 - RX0, 0.035, 0.012, (RX0 + RX1) / 2, -0.012, 0);
      // conexiones de alimentación (cables a la dínamo) y al carril de retorno
      k.add(G.poly([[XG, -0.01, 0], [XG, -0.06, -0.12], [XG, -0.06, -0.9], [XG - 0.3, 0.1, ZG + 0.35]], 0.012, 6), pR.m('copper'));
      k.add(G.poly([[XG + 0.35, -0.01, -0.281], [XG + 0.35, -0.07, -0.5], [XG + 0.1, 0.1, ZG + 0.35]], 0.012, 6), pR.m('black'));
      k.box(pR.m('brass'), 0.06, 0.03, 0.03, XG, -0.005, 0);
      k.build(pR.group);
    }

    // 6 — Caja de madera, asiento del conductor y mandos
    const pK = M.part('carroceria', { anchor: [0.45, 0.85, 0.3], explode: [0, 1.0, 0] });
    {
      const k = new Kit(); const wd = pK.m('wood', { shell: true });
      k.box(wd, 2 * LX, 0.02, 2 * LW, 0, yF, 0);
      for (const s of [1, -1]) k.box(wd, 2 * LX, yT - yF, 0.02, 0, (yF + yT) / 2, s * LW);
      for (const sx of [1, -1]) k.box(wd, 0.02, yT - yF, 2 * LW, sx * LX, (yF + yT) / 2, 0);
      k.box(wd, 2 * LX, 0.02, 2 * LW, 0, yT, 0);
      // listones y molduras de latón
      for (const s of [1, -1]) { k.box(pK.m('brass'), 2 * LX + 0.01, 0.015, 0.006, 0, yT - 0.03, s * (LW + 0.012)); k.box(pK.m('brass'), 2 * LX + 0.01, 0.015, 0.006, 0, yF + 0.04, s * (LW + 0.012)); for (const x of [-0.45, 0, 0.45]) k.box(pK.m('woodB'), 0.03, yT - yF - 0.08, 0.006, x, (yF + yT) / 2, s * (LW + 0.012)); }
      k.box(pK.m('brass'), 0.18, 0.07, 0.005, 0, (yF + yT) / 2 + 0.05, LW + 0.016);   // placa del fabricante (sin rotular)
      // banco longitudinal sobre el que el conductor va a horcajadas
      k.box(pK.m('woodL'), 1.1, 0.08, 0.2, -0.05, yT + 0.05, 0);
      k.box(pK.m('cloth2'), 0.6, 0.03, 0.2, 0.0, yT + 0.105, 0);
      for (const s of [1, -1]) k.box(pK.m('iron'), 0.18, 0.015, 0.06, 0.32, yT + 0.005, s * 0.26);   // reposapiés
      // palanca del interruptor de marcha y volante del freno
      k.box(pK.m('iron'), 0.08, 0.04, 0.16, 0.6, yT + 0.03, -0.18);
      k.bar(pK.m('brass'), [0.6, yT + 0.05, -0.18], [0.66, yT + 0.32, -0.16], 0.02, 0.02); k.sph(pK.m('black'), 0.025, 0.66, yT + 0.33, -0.16);
      k.cyl(pK.m('iron'), 0.014, 0.3, 'y', 0.62, yT + 0.15, 0.2, 8);
      k.add(G.torus(0.09, 0.01, 6, 20), pK.m('iron'), [0.62, yT + 0.3, 0.2], [Math.PI / 2, 0, 0]);
      for (let i = 0; i < 4; i++) k.box(pK.m('iron'), 0.18, 0.008, 0.008, 0.62, yT + 0.3, 0.2, 0, i * Math.PI / 4, 0);
      person(k, (c) => pK.m(c), 0.0, yT + 0.12, 0, 'x', 'cloth');
      k.build(pK.group);
    }

    // 7 — Tres coches abiertos con bancos para seis pasajeros
    const pW = M.part('coches', { anchor: [-3.935, 0.9, 0.5], explode: [-0.8, 0, 0] });
    const carWheels = [];
    {
      const k = new Kit(); const wd = pW.m('woodL'), ir = pW.m('iron');
      carX.forEach((cx, ci) => {
        for (const dx of [-0.5, 0.5]) {
          const w = wheelset({ R: RC, gauge: g, tread: 0.055, type: 'spoke', spokes: 6, hubR: 0.035, rimT: 0.025, axleR: 0.02, m: { tyre: pW.m('tyre'), body: ir, hub: ir, axle: pW.m('steel') } });
          w.group.position.set(cx + dx, RC, 0); pW.group.add(w.group); carWheels.push(w.group);
        }
        for (const s of [1, -1]) { k.box(ir, CAR - 0.1, 0.08, 0.03, cx, 0.2, s * 0.3); for (const dx of [-0.5, 0.5]) k.box(ir, 0.08, 0.08, 0.05, cx + dx, RC, s * 0.3); }
        k.box(pW.m('woodB'), CAR, 0.04, 0.82, cx, 0.27, 0);
        for (const s of [1, -1]) k.box(pW.m('woodB'), CAR - 0.1, 0.025, 0.12, cx, 0.24, s * CW);     // estribos
        // banco doble espalda con espalda: los pasajeros miran hacia afuera
        for (const s of [1, -1]) { k.box(wd, CAR - 0.2, 0.04, 0.2, cx, 0.52, s * 0.12); for (const dx of [-0.65, 0, 0.65]) k.box(pW.m('woodB'), 0.04, 0.24, 0.16, cx + dx, 0.4, s * 0.12); }
        k.box(wd, CAR - 0.2, 0.3, 0.03, cx, 0.72, 0);
        k.box(pW.m('woodB'), CAR - 0.16, 0.04, 0.06, cx, 0.88, 0);
        for (const dx of [-0.75, 0.75]) k.cyl(ir, 0.012, 0.5, 'y', cx + dx, 0.55, 0.38, 6);
        k.box(ir, 0.08, 0.03, 0.05, cx + CAR / 2 + 0.04, 0.24, 0); k.box(ir, 0.08, 0.03, 0.05, cx - CAR / 2 - 0.04, 0.24, 0);
        // pasajeros (la mitad de las plazas, para ver la escala)
        const cols = ['cloth', 'cloth2', 'cloth3'];
        [[-0.5, 1], [0.1, 1], [0.55, -1], [-0.3, -1]].forEach(([dx, s], j) => { if ((ci + j) % 4 !== 3) person(k, (c) => pW.m(c), cx + dx, 0.54, s * 0.17, s, cols[(ci + j) % 3]); });
      });
      // enganches entre vehículos
      k.box(ir, 0.24, 0.02, 0.03, -LX - 0.12, 0.25, 0);
      for (let i = 0; i < 2; i++) k.box(ir, 0.3, 0.02, 0.03, (carX[i] + carX[i + 1]) / 2, 0.24, 0);
      k.build(pW.group);
    }

    // 8 — Dínamo estacionaria movida por una máquina de vapor fija
    const pG = M.part('generador', { anchor: [XG, 0.75, ZG + 0.3], explode: [0.6, 0.4, -0.8] });
    let fly, dyn;
    {
      const k = new Kit();
      k.box(pG.m('brick'), 2.5, 0.3, 1.0, XG + 0.55, 0.0, ZG);
      // dínamo: bobinas de campo, culata y polea
      k.box(pG.m('iron'), 0.7, 0.12, 0.42, XG, 0.21, ZG);
      for (const s of [1, -1]) { k.cyl(pG.m('coil'), 0.1, 0.5, 'x', XG, 0.45, ZG + s * 0.17, 18); k.cyl(pG.m('iron'), 0.07, 0.62, 'x', XG, 0.45, ZG + s * 0.17, 12); }
      for (const x of [XG - 0.33, XG + 0.33]) k.box(pG.m('iron'), 0.05, 0.4, 0.5, x, 0.42, ZG);
      for (const s of [1, -1]) k.box(pG.m('insul'), 0.06, 0.06, 0.06, XG - 0.25, 0.68, ZG + s * 0.08);
      // máquina de vapor horizontal y volante
      k.cyl(pG.m('green'), 0.15, 0.5, 'x', XG + 1.45, 0.32, ZG + 0.25, 18);
      k.box(pG.m('iron'), 0.9, 0.06, 0.12, XG + 1.0, 0.24, ZG + 0.25);
      k.cyl(pG.m('steel'), 0.03, 0.62, 'z', XG + 0.7, 0.7, ZG, 10);
      for (const z of [ZG + 0.3, ZG - 0.3]) k.box(pG.m('iron'), 0.12, 0.6, 0.06, XG + 0.7, 0.45, z);
      k.build(pG.group);
      fly = new T.Group(); fly.position.set(XG + 0.7, 0.7, ZG - 0.1);
      const kf = new Kit(); kf.add(G.torus(0.52, 0.04, 8, 40), pG.m('iron')); for (let i = 0; i < 6; i++) kf.box(pG.m('iron'), 1.0, 0.04, 0.03, 0, 0, 0, 0, 0, i * Math.PI / 6); kf.cyl(pG.m('iron'), 0.07, 0.08, 'z', 0, 0, 0, 14);
      kf.build(fly); pG.group.add(fly);
      dyn = new T.Group(); dyn.position.set(XG, 0.45, ZG);
      const kd = new Kit(); kd.cyl(pG.m('iron'), 0.095, 0.42, 'x', 0, 0, 0, 20); for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; kd.box(pG.m('copper'), 0.43, 0.012, 0.012, 0, Math.cos(a) * 0.097, Math.sin(a) * 0.097); }
      kd.cyl(pG.m('steel'), 0.014, 0.9, 'x', 0.1, 0, 0, 8); kd.cyl(pG.m('woodL'), 0.11, 0.08, 'x', 0.5, 0, 0, 20);
      kd.build(dyn); pG.group.add(dyn);
      // correa de transmisión (volante → polea de la dínamo)
      const kb = new Kit();
      kb.bar(pG.m('belt'), [XG + 0.5, 0.45 + 0.11, ZG], [XG + 0.7, 0.7 + 0.52, ZG - 0.1], 0.012, 0.08);
      kb.bar(pG.m('belt'), [XG + 0.5, 0.45 - 0.11, ZG], [XG + 0.7, 0.7 - 0.52, ZG - 0.1], 0.012, 0.08);
      kb.build(pG.group);
    }

    // ----- Animación -----
    M.anim.push((s) => {
      const th = -s / R;
      wsets.forEach(w => (w.rotation.z = th)); axleGear.rotation.z = th;
      carWheels.forEach(w => (w.rotation.z = -s / RC));
      counter.rotation.z = -th * iS;          // el piñón recto gira al revés que la rueda dentada del eje
      arm.rotation.x = th * ratio;            // inducido ≈ 6,75 veces más rápido que las ruedas
    });
    M.fx.push((t, dt) => {
      if (dt <= 0) return;
      const w = M.powered ? 2 * Math.PI * 1.5 : 0;        // máquina fija ≈ 90 rpm
      fly.rotation.z -= dt * w; dyn.rotation.x -= dt * w * 5;
      M.motorRpm = (M.vNow || 0) / (Math.PI * 2 * R) * 60 * ratio;
    });
    M.update(0, 0);
    pantoSparks(M, pC.group, [[-0.04, 0.0, 0], [0.08, 0.0, 0]], { spread: 0.05, vmin: 0.3, rate: 0.8, size: 0.02, kick: 0.6, grav: 3, count: 160 });

    // ----- Flujos de energía -----
    M.flow([[XG + 1.2, 0.32, ZG + 0.25], [XG + 0.7, 0.7, ZG - 0.1], [XG + 0.5, 0.45, ZG], [XG, 0.45, ZG]], '#ff8a3d', { r: 0.025 });
    M.flow([[XG - 0.25, 0.68, ZG], [XG - 0.3, 0.1, ZG + 0.35], [XG, -0.06, -0.9], [XG, -0.01, 0], [0.04, 0.0, 0], [0.06, 0.16, 0], [0.34, 0.36, 0.08], [0.3, yM, 0]], '#ffd166', { r: 0.02, speed: 1.2 });
    M.flow([[0.09, yM, 0], [-0.17, yM, 0], [-0.25, yM, -0.15], [-0.25, yA, -0.15]], '#ff9f43', { r: 0.022 });
    M.flow([[-0.25, 0.0, -0.281], [XG + 0.35, -0.01, -0.281], [XG + 0.1, 0.1, ZG + 0.35], [XG - 0.25, 0.68, ZG - 0.08]], '#5aa9e6', { r: 0.02 });

    M.finalize();
    M.len = 11.5; M.center = -1.4;
    M.frame = [-7.2, 4.6];
    M.camDir = [0.55, 0.42, 1]; M.camFit = 1.15;
    M.secH = 1.0; M.secY = 0.45; M.secMin = 1.3;
    // el riel central sigue fuera del tramo modelado como parte (mismo perfil, en el entorno)
    M.env = { gauge: g, groundY: -0.24, track: { style: 'wood', railScale: 0.36, sleeperL: 0.85, sleeperW: 0.1, sleeperH: 0.07, pitch: 0.45, ballastW: 1.1, ballastH: 0.16, sleeperColor: '#6b5440', ballast: ['#a39377', '#6f6250'] },
      extra: (grp, Rhex) => {
        const m1 = TB.sceneMat('#6e4a2e', { r: 0.65 }), m2 = TB.sceneMat('#34363a', { r: 0.5, m: 0.6 });
        const x0 = -Rhex * 0.866, x1 = Rhex * 0.866, off = -M.center;
        for (const [a, b] of [[x0, RX0 + off], [RX1 + off, x1]]) {
          if (b - a < 0.05) continue;
          const s1 = new T.Mesh(G.box(b - a, 0.035, 0.08), m1); s1.position.set((a + b) / 2, -0.045, 0); s1.receiveShadow = true; grp.add(s1);
          const s2 = new T.Mesh(G.box(b - a, 0.035, 0.012), m2); s2.position.set((a + b) / 2, -0.012, 0); grp.add(s2);
        }
      } };
    M.wheelR = R;
    M.gear = ratio;
    return M;
  };
})();
