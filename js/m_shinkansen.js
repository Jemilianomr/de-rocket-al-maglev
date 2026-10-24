/* JNR Serie 0 Shinkansen (1964) — unidad eléctrica 25 kV 60 Hz, todos los ejes motorizados (185 kW) */
(function () {
  const { T, Kit, G, wheelset, loft, stations } = TB;
  const { Model, diamondPanto } = MB;

  MODELS.shinkansen = function () {
    const M = new Model('shinkansen', {
      ivory: ['#eee8da', { r: 0.35, m: 0.05 }], blue: ['#1d3e93', { r: 0.4 }], glass: ['#202d36', { r: 0.05, m: 0.6 }],
      skirt: ['#5d6670', { r: 0.5, m: 0.3 }], dark: ['#26292d', { r: 0.55, m: 0.4 }], steel: ['#b2b7bc', { r: 0.25, m: 0.9 }],
      tyre: ['#2b2c2e', { r: 0.4, m: 0.75 }], truck: ['#30333a', { r: 0.55, m: 0.4 }], rubber: ['#1b1b1c', { r: 0.8 }],
      motor: ['#3e444b', { r: 0.4, m: 0.6 }], copper: ['#b8693d', { r: 0.35, m: 0.85 }], oil: ['#4b5040', { r: 0.4, m: 0.3 }],
      grid: ['#8a5a3a', { r: 0.5, m: 0.6 }], panto: ['#3a3d41', { r: 0.4, m: 0.6 }], insul: ['#e8e2d2', { r: 0.25 }],
      nose: ['#f7f3e8', { r: 0.2, em: '#fff6d8', ei: 0.25 }], lamp: ['#ffd27a', { r: 0.2, em: '#ffcf6a', ei: 1.2 }], red: ['#b3261e', { r: 0.4 }],
      disc: ['#8e9398', { r: 0.3, m: 0.85 }], coil: ['#c58b2a', { r: 0.35, m: 0.7 }],
    });
    const g = 1.435, R = 0.455, WB = 2.5, gearR = 2.17;
    const yB = 1.12, yT = 3.975, hw = 1.69;
    const C21 = [0, 25.15], C26 = [-25.65, -0.65];
    const B21 = [3.83, 21.33], B26 = [-21.82, -4.32];
    const wire = 5.0;

    // 1 — Carrocería: coche 21 con nariz tipo DC-8 y coche 26
    const pC = M.part('carroceria', { anchor: [16, 3.4, 1.5], explode: [0, 2.8, 0] });
    let ST21;
    {
      const k = new Kit(); const iv = pC.m('ivory', { shell: true });
      const base = { w: hw, ym: 2.25, yb: yB, nT: 2.7, nB: 7 };
      const keys = [
        { ...base, x: C21[0], yt: yT }, { ...base, x: 18.4, yt: yT, steps: 10 },
        { ...base, x: 19.6, yt: 3.82, steps: 4 }, { ...base, x: 20.9, yt: 3.3, w: 1.66, steps: 5 },
        { ...base, x: 22.2, yt: 2.82, w: 1.52, ym: 2.15, steps: 5 }, { ...base, x: 23.5, yt: 2.42, w: 1.24, ym: 2.0, yb: 1.18, steps: 5 },
        { ...base, x: 24.5, yt: 2.12, w: 0.86, ym: 1.85, yb: 1.25, steps: 4 }, { ...base, x: 25.15, yt: 1.86, w: 0.2, ym: 1.72, yb: 1.6, nB: 4, steps: 4 },
      ];
      ST21 = stations(keys, 3);
      k.add(loft(ST21, 60), iv);
      const keys26 = [{ ...base, x: C26[0], yt: yT }, { ...base, x: C26[1], yt: yT }];
      k.add(loft(stations(keys26, 6), 60), iv);
      // franjas azules: banda de ventanas y faldón; ventanas
      for (const [x0, x1] of [[0.4, 18.6], [C26[0] + 0.4, C26[1] - 0.4]]) for (const s of [1, -1]) {
        k.box(pC.m('blue'), x1 - x0, 0.62, 0.02, (x0 + x1) / 2, 2.62, s * (hw + 0.003));
        k.box(pC.m('blue'), x1 - x0, 0.22, 0.02, (x0 + x1) / 2, 1.28, s * (TB.widthAt({ ...base, yt: yT }, 1.28) + 0.004));
        for (let x = x0 + 1.4; x < x1 - 1.2; x += 1.15) k.box(pC.m('glass'), 0.82, 0.48, 0.02, x, 2.64, s * (hw + 0.008));
        for (const xd of [x0 + 0.65, x1 - 0.65]) { const zz = s * (hw + 0.007); k.box(pC.m('dark'), 0.025, 1.9, 0.02, xd - 0.36, 2.15, zz); k.box(pC.m('dark'), 0.025, 1.9, 0.02, xd + 0.36, 2.15, zz); k.box(pC.m('dark'), 0.72, 0.025, 0.02, xd, 3.1, zz); k.box(pC.m('glass'), 0.4, 0.5, 0.02, xd, 2.7, zz); }
      }
      // franja azul que envuelve la nariz y faros
      const nz = (x, y) => { let s0 = ST21[0]; for (const s of ST21) if (Math.abs(s.x - x) < Math.abs(s0.x - x)) s0 = s; return TB.widthAt(s0, y); };
      for (const s of [1, -1]) {
        const pts = []; for (let x = 18.6; x <= 24.3; x += 0.3) pts.push([x, 1.3 + Math.max(0, x - 21.5) * 0.08, s * (nz(x, 1.3 + Math.max(0, x - 21.5) * 0.08) + 0.01)]);
        k.add(G.poly(pts, 0.1, 6), pC.m('blue'));
        const la = s > 0 ? 0.42 : Math.PI - 0.42;
        k.addMtx(G.cyl(0.16, 0.05, 22), pC.m('lamp'), TB.onSurf(ST21, 23.3, la, 0.0));
        k.addMtx(G.torus(0.17, 0.03, 6, 22).rotateX(Math.PI / 2), pC.m('blue'), TB.onSurf(ST21, 23.3, la, 0.02));
      }
      // parabrisas envolvente
      k.add(TB.surfPatch(ST21, 19.55, 20.95, Math.PI / 2 + 0.06, Math.PI / 2 + 0.7, 0.012), pC.m('glass'));
      k.add(TB.surfPatch(ST21, 19.55, 20.95, Math.PI / 2 - 0.7, Math.PI / 2 - 0.06, 0.012), pC.m('glass'));
      for (const s of [1, -1]) k.add(TB.surfPatch(ST21, 19.9, 20.7, s > 0 ? 0.62 : Math.PI - 0.95, s > 0 ? 0.95 : Math.PI - 0.62, 0.012, 6, 6), pC.m('glass'));
      // tapa luminosa de la nariz
      k.add(G.sph(0.32, 20, 14), pC.m('nose'), [24.92, 1.8, 0], [0, 0, 0], [0.7, 0.85, 1]);
      // fuelle de intercomunicación
      k.box(pC.m('rubber'), 0.75, 2.5, 2.2, -0.33, 2.3, 0);
      k.build(pC.group);
    }

    // 2 — Pantógrafo PS200 (sobre el coche 26)
    const pP = M.part('panto', { anchor: [-8.2, 4.8, 0], explode: [0, 1.6, 0] });
    const xPan = -8.2;
    {
      const pg = diamondPanto(pP, { w: 1.45, base: 1.3, arm: 0.92, headW: 1.95, h: wire - yT - 0.2 });
      pg.group.position.set(xPan, yT + 0.08, 0); pP.group.add(pg.group);
      const k = new Kit(); k.box(pP.m('panto'), 3.0, 0.08, 0.14, xPan - 1.6, yT + 0.06, 0.4); k.cyl(pP.m('insul'), 0.07, 0.25, 'y', xPan - 2.8, yT + 0.12, 0.4, 10); k.build(pP.group);
    }

    // 3 — Transformador principal (bajo el piso del coche 26)
    const pX = M.part('trafo', { anchor: [-12.9, 0.7, 1.2], explode: [0, -1.4, 1.8] });
    {
      const k = new Kit();
      k.box(pX.m('oil'), 3.2, 0.75, 2.4, -12.9, 0.7, 0);
      for (let i = 0; i < 18; i++) k.box(pX.m('dark'), 0.04, 0.6, 2.5, -14.3 + i * 0.165, 0.68, 0);
      k.box(pX.m('dark'), 1.2, 0.5, 1.6, -10.3, 0.8, 0);
      // rectificador de diodos de silicio con aletas
      k.box(pX.m('motor'), 2.0, 0.6, 2.0, -16.6, 0.78, 0);
      for (let i = 0; i < 14; i++) k.box(pX.m('steel'), 0.03, 0.5, 2.05, -17.5 + i * 0.13, 0.78, 0);
      k.build(pX.group);
    }

    // 4 — Control por tomas de baja tensión (25 escalones) y controlador principal
    const pK = M.part('control', { anchor: [13.6, 0.75, 1.1], explode: [0, -1.4, -1.8] });
    {
      const k = new Kit();
      k.box(pK.m('dark'), 2.4, 0.7, 2.2, 13.6, 0.75, 0);
      k.cyl(pK.m('steel'), 0.42, 0.08, 'z', 13.6, 0.78, 1.15, 28);
      for (let i = 0; i < 25; i++) { const a = -2.5 + i * 0.21; k.box(pK.m('copper'), 0.05, 0.08, 0.05, 13.6 + Math.cos(a) * 0.45, 0.78 + Math.sin(a) * 0.45, 1.18); }
      k.box(pK.m('dark'), 1.6, 0.6, 2.0, 10.6, 0.8, 0);
      // pupitre en cabina
      k.box(pK.m('dark'), 0.8, 0.9, 1.8, 19.6, 2.0, 0);
      k.build(pK.group);
    }

    // 5 — Motores MT200 (185 kW) con acoplamiento de engranajes WN; 6 — Bogies DT200
    const pM = M.part('motores', { anchor: [20.06, 0.57, 0.5], explode: [0, -0.4, 2.2] });
    const pB = M.part('bogies', { anchor: [3.83, 0.6, 1.0], explode: [0, -1.0, 0] });
    const wsets = [], arms = [], discs = [];
    for (const xc of [...B21, ...B26]) {
      const k = new Kit(); const tk = pB.m('truck');
      for (const dx of [-WB / 2, WB / 2]) {
        const w = wheelset({ R, gauge: g, tread: 0.135, type: 'disc', hubR: 0.11, m: { tyre: pB.m('tyre'), body: pB.m('truck'), hub: pB.m('truck'), axle: pB.m('dark') } });
        w.group.position.set(xc + dx, R, 0); pB.group.add(w.group); wsets.push(w.group);
        // discos de freno en el eje
        const dk = new Kit(); for (const z of [-0.35, 0.35]) dk.cyl(pB.m('disc'), 0.33, 0.06, 'z', 0, 0, z, 30); dk.build(w.group);
        // motor montado en el bastidor, hacia el centro del bogie
        const tw = dx > 0 ? -1 : 1;
        const mg = new T.Group(); mg.position.set(xc + dx + tw * 0.62, R + 0.12, -0.12); pM.group.add(mg);
        const mk = new Kit(); mk.cyl(pM.m('motor'), 0.3, 0.75, 'z', 0, 0, 0, 24); mk.box(pM.m('dark'), 0.6, 0.62, 0.12, -tw * 0.3, -0.06, 0.48); mk.cyl(pM.m('steel'), 0.1, 0.18, 'z', -tw * 0.05, 0, 0.5, 14); mk.build(mg);
        const arm = new T.Group(); const ak = new Kit(); ak.cyl(pM.m('copper'), 0.2, 0.7, 'z', 0, 0, -0.02, 18); for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; ak.box(pM.m('steel'), 0.035, 0.035, 0.68, Math.cos(a) * 0.21, Math.sin(a) * 0.21, -0.02); } ak.build(arm); mg.add(arm); arms.push(arm);
      }
      for (const s of [1, -1]) {
        const z = s * 1.0;
        k.add(G.extrude([[-1.75, 0.38], [-1.75, 0.7], [-0.6, 0.85], [0.6, 0.85], [1.75, 0.7], [1.75, 0.38], [1.25, 0.32], [0.5, 0.55], [-0.5, 0.55], [-1.25, 0.32]].map(p => [xc + p[0], p[1]]), 0.1), tk, [0, 0, z]);
        // resortes de eje tipo IS y cajas de grasa
        for (const dx of [-WB / 2, WB / 2]) { k.box(tk, 0.3, 0.3, 0.18, xc + dx, R, z); for (let i = 0; i < 5; i++) k.add(G.torus(0.09, 0.016, 5, 14), pB.m('steel'), [xc + dx + (dx > 0 ? -0.25 : 0.25), R + 0.2 + i * 0.045, z], [Math.PI / 2, 0, 0]); }
        // resorte neumático (montaje directo)
        k.cyl(pB.m('rubber'), 0.3, 0.3, 'y', xc, 1.0, s * 0.95, 24, 0.33);
        // amortiguador
        k.seg(pB.m('steel'), [xc + 0.5, 0.65, z + s * 0.08], [xc + 0.9, 1.05, z + s * 0.08], 0.04, 8);
      }
      k.box(tk, 0.5, 0.25, 2.1, xc, 0.72, 0);
      k.build(pB.group);
    }

    // 7 — ATC: antenas receptoras delante del primer eje y señal en cabina
    const pA = M.part('atc', { anchor: [23.13, 0.25, 0.72], explode: [1.2, -0.6, 0] });
    {
      const k = new Kit();
      for (const s of [1, -1]) { k.box(pA.m('dark'), 0.35, 0.12, 0.25, B21[1] + WB / 2 + 0.55, 0.25, s * 0.72); k.box(pA.m('coil'), 0.3, 0.04, 0.2, B21[1] + WB / 2 + 0.55, 0.18, s * 0.72); }
      k.box(pA.m('dark'), 0.9, 0.5, 0.6, 18.5, 0.85, -0.6);
      k.box(pA.m('dark'), 0.35, 0.22, 0.05, 19.85, 2.65, 0.0, 0, 0, -0.4);
      k.box(pA.m('red'), 0.2, 0.12, 0.06, 19.86, 2.67, 0.0, 0, 0, -0.4);
      k.build(pA.group);
    }

    // 8 — Frenos: resistencias del freno reostático (bajo el piso) + discos
    const pF = M.part('frenos', { anchor: [7.6, 0.8, 1.0], explode: [0, -1.3, 0] });
    {
      const k = new Kit();
      for (const xc of [7.6, -7.5]) { k.box(pF.m('dark'), 2.4, 0.08, 2.0, xc, 1.05, 0); for (let i = 0; i < 10; i++) k.box(pF.m('grid'), 0.05, 0.5, 1.8, xc - 1.1 + i * 0.24, 0.75, 0); }
      k.build(pF.group);
    }

    M.anim.push((s) => {
      wsets.forEach(w => (w.rotation.z = -s / R));
      arms.forEach(a => (a.rotation.z = -s / R * gearR));
    });
    M.update(0, 0);
    M.gear = gearR;

    const cY = '#ffd166';
    M.flow([[xPan, wire, 0], [xPan, yT + 0.4, 0], [xPan - 1.6, yT + 0.1, 0.4], [-12.9, 2.0, 0.4], [-12.9, 1.0, 0]], cY, { r: 0.06 });
    M.flow([[-12.9, 0.8, 0.5], [-16.6, 0.8, 0.5]], '#ffb347', { r: 0.05 });
    M.flow([[-16.6, 0.95, 0.4], [-11, 1.0, 0.6], [-0.4, 1.0, 0.6], [10.6, 0.95, 0.6], [13.6, 0.9, 0.6]], '#ff9f43', { r: 0.05 });
    for (const xc of [...B21, ...B26]) M.flow([[xc > 0 ? 13.6 : -16.6, 0.95, 0.3], [xc, 0.9, 0.3], [xc - 0.62, R + 0.12, 0.1], [xc + 0.62, R + 0.12, 0.1]], '#ffd166', { r: 0.04 });

    M.finalize();
    M.frame = [-6, 25.2];
    M.len = 51; M.center = -0.25;
    M.cam = { pos: [26, 6, 18], target: [17, 2.0, 0] };
    M.env = { gauge: g, track: { style: 'wood', sleeperColor: '#9b978f', sleeperW: 0.28, pitch: 0.6, ballast: ['#8b8780', '#55524d'] },
      catenary: { wireH: wire, span: 50, lattice: false, mastColor: '#9ca1a5', stagger: 0.2 } };
    M.wheelR = R;
    return M;
  };
})();
