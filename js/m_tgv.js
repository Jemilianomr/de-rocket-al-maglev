/* SNCF TGV Sud-Est (Alsthom, 1981) — motriz + remolques articulados sobre bogies Jacobs; 12 motores de CC */
(function () {
  const { T, Kit, G, wheelset, loft, stations } = TB;
  const { Model, singleArmPanto } = MB;

  MODELS.tgv = function () {
    const M = new Model('tgv', {
      orange: ['#cf4a14', { r: 0.45, m: 0.05 }], white: ['#f1efe9', { r: 0.35 }], grey: ['#4c5157', { r: 0.4, m: 0.2 }],
      glass: ['#1f2b33', { r: 0.05, m: 0.6 }], dark: ['#25282c', { r: 0.55, m: 0.4 }], steel: ['#b2b7bc', { r: 0.25, m: 0.9 }],
      tyre: ['#2b2c2e', { r: 0.4, m: 0.75 }], truck: ['#2f3238', { r: 0.55, m: 0.4 }], rubber: ['#1b1b1c', { r: 0.8 }],
      motor: ['#3d4248', { r: 0.4, m: 0.6 }], copper: ['#b8693d', { r: 0.35, m: 0.85 }], oil: ['#4b5040', { r: 0.4, m: 0.3 }],
      grid: ['#8a5a3a', { r: 0.5, m: 0.6 }], panto: ['#3a3d41', { r: 0.4, m: 0.6 }], insul: ['#7a4a33', { r: 0.25 }],
      lamp: ['#fff3c4', { r: 0.2, em: '#ffe9a0', ei: 0.9 }], thy: ['#556070', { r: 0.4, m: 0.5 }], disc: ['#8e9398', { r: 0.3, m: 0.85 }],
      coil: ['#c58b2a', { r: 0.35, m: 0.7 }], hatchCap: ['#d9573b', { r: 0.7 }], red: ['#c0392b', { r: 0.4 }],
    });
    const g = 1.435, R = 0.46, WB = 3.0, gear = 2.2;
    const PC = [0, 22.15], BPC = [3.3, 17.3];
    const R1 = [-0.85, -19.55], BR1 = -2.35, BJ = -19.55, R2end = -26.3;
    const wire = 5.08;

    // 1 — Motriz: carrocería y morro (diseño de Jacques Cooper)
    const pC = M.part('motriz', { anchor: [19.5, 2.6, 1.3], explode: [0, 2.6, 0] });
    let STp;
    {
      const k = new Kit(); const or = pC.m('orange', { shell: true });
      const base = { w: 1.405, ym: 2.1, yb: 0.95, nT: 3.0, nB: 9 };
      const keys = [
        { ...base, x: PC[0], yt: 4.05 }, { ...base, x: 15.3, yt: 4.05, steps: 8 },
        { ...base, x: 16.3, yt: 3.98, steps: 3 }, { ...base, x: 18.2, yt: 3.05, w: 1.38, steps: 5 },
        { ...base, x: 19.6, yt: 2.42, w: 1.3, ym: 1.95, steps: 4 }, { ...base, x: 21.1, yt: 1.95, w: 1.0, ym: 1.6, yb: 1.0, steps: 4 },
        { ...base, x: 22.15, yt: 1.45, w: 0.35, ym: 1.3, yb: 1.08, nT: 2.4, nB: 4, steps: 4 },
      ];
      STp = stations(keys, 3);
      k.add(loft(STp, 60), or);
      // librea: banda blanca y gris inferior
      for (const s of [1, -1]) {
        k.add(TB.surfPatch(STp, 0.3, 21.4, s > 0 ? -0.62 : Math.PI + 0.38, s > 0 ? -0.38 : Math.PI + 0.62, 0.008, 40, 3), pC.m('grey'));
        k.add(TB.surfPatch(STp, 0.3, 19.0, s > 0 ? 0.32 : Math.PI - 0.42, s > 0 ? 0.42 : Math.PI - 0.32, 0.008, 30, 2), pC.m('white'));
        k.box(pC.m('glass'), 0.8, 0.6, 0.02, 15.0, 3.0, s * 1.41);
        k.addMtx(G.cyl(0.13, 0.05, 20), pC.m('lamp'), TB.onSurf(STp, 21.3, s > 0 ? 0.25 : Math.PI - 0.25, 0.0));
      }
      // parabrisas
      k.add(TB.surfPatch(STp, 16.6, 18.15, Math.PI / 2 - 0.85, Math.PI / 2 + 0.85, 0.012, 10, 14), pC.m('glass'));
      // rejillas laterales de ventilación
      for (const s of [1, -1]) for (let x = 3.0; x < 12.5; x += 1.6) for (let i = 0; i < 9; i++) k.box(pC.m('grey'), 0.05, 0.78, 0.02, x - 0.5 + i * 0.125, 3.1, s * 1.408);
      k.build(pC.group);
    }

    // 2 — Pantógrafo de un brazo y dos etapas (AM-PSE)
    const pP = M.part('panto', { anchor: [3.6, 5.0, 0], explode: [0, 1.6, 0] });
    {
      const pg = singleArmPanto(pP, { L1: 1.55, L2: 1.6, headW: 1.6, h: wire - 4.12 - 0.2 });
      pg.group.position.set(3.6, 4.12, 0); pP.group.add(pg.group);
      const k = new Kit(); k.box(pP.m('dark'), 1.1, 0.4, 0.8, 7.0, 4.15, 0); k.cyl(pP.m('insul'), 0.08, 0.35, 'y', 7.0, 4.45, 0, 12); k.build(pP.group);
    }

    // 3 — Transformador y puentes mixtos de tiristores
    const pX = M.part('potencia', { anchor: [10.3, 1.6, 1.0], explode: [0, 1.4, 2.0] });
    {
      const k = new Kit();
      k.box(pX.m('oil'), 2.4, 1.0, 2.0, 10.3, 1.55, 0);
      for (let i = 0; i < 14; i++) k.box(pX.m('dark'), 0.04, 0.8, 2.08, 9.2 + i * 0.17, 1.55, 0);
      for (const x of [7.0, 13.4]) {
        k.box(pX.m('thy'), 1.6, 1.8, 1.1, x, 2.3, -0.55);
        for (let i = 0; i < 6; i++) for (let j = 0; j < 3; j++) k.cyl(pX.m('steel'), 0.06, 0.08, 'z', x - 0.55 + i * 0.22, 1.7 + j * 0.5, 0.02, 12);
        // reactancias de alisado
        for (let i = 0; i < 6; i++) k.add(G.torus(0.3, 0.05, 6, 20), pX.m('copper'), [x, 1.55 + i * 0.11, 0.8], [Math.PI / 2, 0, 0]);
      }
      k.box(pX.m('dark'), 0.9, 1.6, 2.2, 15.6, 2.4, 0);
      k.build(pX.group);
    }

    // 4 — Motores de CC suspendidos de la caja con transmisión trípode; 5 — Bogies motores de la motriz
    const pM = M.part('motores', { anchor: [16.55, 1.32, 0.4], explode: [0, 0.9, 2.3] });
    const pB = M.part('bogies', { anchor: [3.3, 0.6, 1.0], explode: [0, -1.0, 0] });
    // 7 — Bogie motor del remolque R1
    const pR = M.part('remolque', { anchor: [-2.35, 0.6, 1.0], explode: [-0.6, -1.0, 1.6] });
    const wsets = [], arms = [], shafts = [];
    function motorBogie(part, mpart, xc, bodyHung) {
      const k = new Kit(); const tk = part.m('truck');
      for (const dx of [-WB / 2, WB / 2]) {
        const w = wheelset({ R, gauge: g, tread: 0.135, type: 'disc', hubR: 0.11, m: { tyre: part.m('tyre'), body: part.m('truck'), hub: part.m('truck'), axle: part.m('dark') } });
        w.group.position.set(xc + dx, R, 0); part.group.add(w.group); wsets.push(w.group);
        const dk = new Kit(); dk.box(part.m('dark'), 0.5, 0.5, 0.35, 0, 0, -0.35); dk.build(w.group); // caja de engranajes en el eje
        const tw = dx > 0 ? -1 : 1;
        const mx = xc + dx + tw * 0.75, my = bodyHung ? 1.32 : R + 0.15;
        const mg = new T.Group(); mg.position.set(mx, my, -0.05); mpart.group.add(mg);
        const mk = new Kit(); mk.cyl(mpart.m('motor'), 0.36, 0.95, 'z', 0, 0, 0, 26); mk.box(mpart.m('dark'), 0.25, 0.25, 0.8, 0, 0.42, 0); mk.build(mg);
        const arm = new T.Group(); const ak = new Kit(); ak.cyl(mpart.m('copper'), 0.25, 0.9, 'z', 0, 0, 0, 18); for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; ak.box(mpart.m('steel'), 0.035, 0.035, 0.88, Math.cos(a) * 0.26, Math.sin(a) * 0.26, 0); } ak.build(arm); mg.add(arm); arms.push(arm);
        if (bodyHung) { // árbol trípode deslizante motor → reductor
          const sg = new T.Group(); const sk = new Kit(); const a = [mx, my, -0.4], b = [xc + dx + tw * 0.12, R + 0.05, -0.4];
          sk.seg(mpart.m('steel'), a, b, 0.05, 10); sk.sph(mpart.m('steel'), 0.09, ...a); sk.sph(mpart.m('steel'), 0.09, ...b); sk.build(sg); mpart.group.add(sg); shafts.push(sg);
        }
      }
      for (const s of [1, -1]) {
        const z = s * 0.98;
        k.add(G.extrude([[-1.95, 0.4], [-1.95, 0.72], [-0.6, 0.86], [0.6, 0.86], [1.95, 0.72], [1.95, 0.4], [1.4, 0.34], [0.5, 0.58], [-0.5, 0.58], [-1.4, 0.34]].map(p => [xc + p[0], p[1]]), 0.1), tk, [0, 0, z]);
        for (const dx of [-WB / 2, WB / 2]) { k.box(tk, 0.32, 0.3, 0.18, xc + dx, R, z); for (let i = 0; i < 5; i++) k.add(G.torus(0.1, 0.017, 5, 14), part.m('steel'), [xc + dx + (dx > 0 ? -0.28 : 0.28), R + 0.2 + i * 0.045, z], [Math.PI / 2, 0, 0]); }
        for (let i = 0; i < 5; i++) k.add(G.torus(0.16, 0.025, 6, 16), part.m('steel'), [xc, 0.92 + i * 0.06, s * 0.85], [Math.PI / 2, 0, 0]);
      }
      k.box(tk, 0.5, 0.25, 2.1, xc, 0.72, 0);
      k.build(part.group);
    }
    for (const xc of BPC) motorBogie(pB, pM, xc, true);
    motorBogie(pR, pR, BR1, false);

    // 6 — Articulación: bogie Jacobs entre R1 y R2, cajas de remolque
    const pJ = M.part('jacobs', { anchor: [-19.55, 1.0, 1.0], explode: [0, 0.0, 0] });
    let ST1;
    {
      const k = new Kit(); const or = pJ.m('orange', { shell: true }), wh = pJ.m('white');
      const base = { w: 1.452, ym: 1.9, yb: 0.98, nT: 3.2, nB: 9, yt: 3.42 };
      ST1 = stations([{ ...base, x: R1[1] }, { ...base, x: R1[0] }], 8);
      k.add(loft(ST1, 56), or);
      const ST2 = stations([{ ...base, x: R2end }, { ...base, x: BJ - 0.05 }], 3);
      k.add(loft(ST2, 56, [false, true]), or);
      for (const [x0, x1] of [[R1[1] + 0.4, R1[0] - 0.4], [R2end + 0.1, BJ - 0.4]]) for (const s of [1, -1]) {
        k.box(wh, x1 - x0, 0.5, 0.02, (x0 + x1) / 2, 2.55, s * 1.455);
        for (let x = x0 + 1.3; x < x1 - 1.0; x += 1.15) k.box(pJ.m('glass'), 0.8, 0.42, 0.02, x, 2.56, s * 1.462);
        k.add(TB.surfPatch(ST1, x0, x1, s > 0 ? -0.6 : Math.PI + 0.38, s > 0 ? -0.38 : Math.PI + 0.6, 0.008, 4, 2), pJ.m('grey'));
      }
      // tapa de corte convencional (vista truncada) al final de R2
      k.cyl(pJ.m('hatchCap'), 1.4, 0.02, 'x', R2end - 0.01, 2.2, 0, 32);
      const kJ = new Kit(); const tk = pJ.m('truck');
      for (const dx of [-WB / 2, WB / 2]) { const w = wheelset({ R, gauge: g, tread: 0.135, type: 'disc', hubR: 0.11, m: { tyre: pJ.m('tyre'), body: tk, hub: tk, axle: pJ.m('dark') } }); w.group.position.set(BJ + dx, R, 0); pJ.group.add(w.group); wsets.push(w.group); const dk = new Kit(); for (const z of [-0.35, -0.12, 0.12, 0.35]) dk.cyl(pJ.m('disc'), 0.3, 0.05, 'z', 0, 0, z, 28); dk.build(w.group); }
      for (const s of [1, -1]) { kJ.add(G.extrude([[-1.85, 0.4], [-1.85, 0.72], [1.85, 0.72], [1.85, 0.4]].map(p => [BJ + p[0], p[1]]), 0.1), tk, [0, 0, s * 0.98]); kJ.cyl(pJ.m('rubber'), 0.28, 0.32, 'y', BJ, 1.0, s * 1.0, 22, 0.3); }
      // anillo de articulación que comparten ambas cajas
      kJ.add(G.torus(0.55, 0.08, 10, 30), pJ.m('steel'), [BJ, 1.1, 0], [Math.PI / 2, 0, 0]);
      kJ.box(tk, 0.5, 0.25, 2.1, BJ, 0.75, 0);
      kJ.box(pJ.m('rubber'), 0.6, 2.4, 2.4, BJ, 2.2, 0);
      kJ.build(pJ.group);
      k.box(pJ.m('rubber'), 0.6, 2.4, 2.3, -0.42, 2.3, 0);
      k.build(pJ.group);
    }

    // 8 — Señalización TVM 300 (captadores y señal en cabina)
    const pT = M.part('tvm', { anchor: [19.4, 0.24, 0.72], explode: [1.2, -0.6, 0] });
    {
      const k = new Kit();
      for (const s of [1, -1]) { k.box(pT.m('dark'), 0.4, 0.12, 0.3, BPC[1] + WB / 2 + 0.6, 0.24, s * 0.72); k.box(pT.m('coil'), 0.34, 0.04, 0.24, BPC[1] + WB / 2 + 0.6, 0.17, s * 0.72); }
      k.box(pT.m('dark'), 0.8, 0.9, 1.6, 16.0, 2.2, 0.4);
      k.box(pT.m('dark'), 0.35, 0.25, 0.05, 16.75, 2.95, 0.3, 0, 0, -0.5);
      for (let i = 0; i < 3; i++) k.box(pT.m(i === 1 ? 'red' : 'lamp'), 0.08, 0.06, 0.06, 16.74, 2.9 + i * 0.05, 0.3 - 0.08 + i * 0.08, 0, 0, -0.5);
      k.build(pT.group);
    }

    // 9 — Freno reostático (resistencias en el techo con ventiladores) y discos
    const pF = M.part('frenos', { anchor: [11.0, 4.3, 0], explode: [0, 1.5, -1.2] });
    const fans = [];
    {
      const k = new Kit();
      k.box(pF.m('grey'), 4.4, 0.35, 1.9, 11.0, 4.2, 0);
      for (let i = 0; i < 16; i++) k.box(pF.m('grid'), 0.04, 0.3, 1.6, 9.0 + i * 0.26, 4.2, 0);
      for (const x of [9.6, 12.4]) { k.add(G.torus(0.55, 0.03, 4, 26), pF.m('steel'), [x, 4.4, 0], [Math.PI / 2, 0, 0]); const f = new T.Group(); f.position.set(x, 4.38, 0); const fk = new Kit(); for (let i = 0; i < 6; i++) fk.add(G.box(0.5, 0.02, 0.14), pF.m('steel'), [0.25 * Math.cos(i * Math.PI / 3), 0, 0.25 * Math.sin(i * Math.PI / 3)], [0.35, -i * Math.PI / 3, 0]); fk.build(f); pF.group.add(f); fans.push(f); }
      k.build(pF.group);
    }

    M.anim.push((s, dt, v) => {
      wsets.forEach(w => (w.rotation.z = -s / R));
      arms.forEach(a => (a.rotation.z = -s / R * gear));
      shafts.forEach(sh => (sh.rotation.x = 0));
      fans.forEach(f => (f.rotation.y += dt * (v > 0.01 ? 10 : 0) * (M.timeScale ?? 1)));
    });
    M.update(0, 0);
    M.gear = gear;

    const cY = '#ffd166';
    M.flow([[3.6 + 0.6, wire, 0], [4.4, 4.5, 0], [7.0, 4.4, 0], [7.0, 3.6, 0], [10.3, 2.2, 0]], cY, { r: 0.06 });
    for (const x of [7.0, 13.4]) M.flow([[10.3, 1.6, 0.3], [x, 1.8, 0.3], [x, 2.6, -0.3]], '#ffb347', { r: 0.05 });
    for (const xc of BPC) M.flow([[xc < 10 ? 7 : 13.4, 1.6, -0.3], [xc - 0.75, 1.35, -0.1], [xc + 0.75, 1.35, -0.1]], '#ffd166', { r: 0.045 });
    M.flow([[3.3, 1.5, -0.4], [0.0, 1.3, -0.4], [BR1, R + 0.4, -0.3]], '#ffd166', { r: 0.045 });

    M.finalize();
    M.frame = [-6, 22.2];
    M.len = 48.5; M.center = -2.1;
    M.cam = { pos: [26, 6.5, 16], target: [12, 2.0, 0] };
    M.env = { gauge: g, track: { style: 'wood', sleeperColor: '#a29d94', sleeperW: 0.3, pitch: 0.6, ballast: ['#8e8a82', '#57534d'] },
      catenary: { wireH: wire, span: 54, lattice: false, mastColor: '#8d9398', stagger: 0.2 } };
    M.wheelR = R;
    return M;
  };
})();
