/* SBB Ce 6/8 II "Krokodil" (SLM/MFO, 1919) — (1'C)(C1'), 15 kV 16⅔ Hz, accionamiento por eje ciego y bielas */
(function () {
  const { T, Kit, G, wheelset, rod } = TB;
  const { Model, diamondPanto } = MB;

  MODELS.croc = function () {
    const M = new Model('croc', {
      brown: ['#5b321f', { r: 0.5 }], brownS: ['#5b321f', { r: 0.5 }], dark: ['#26272a', { r: 0.55, m: 0.4 }], black: ['#1c1c1d', { r: 0.6 }],
      red: ['#8e2a1e', { r: 0.5 }], steel: ['#a8adb2', { r: 0.3, m: 0.85 }], tyre: ['#2c2d2f', { r: 0.4, m: 0.75 }],
      copper: ['#b8693d', { r: 0.35, m: 0.85 }], oil: ['#4c4f3c', { r: 0.4, m: 0.3 }], fin: ['#5b5e4a', { r: 0.45, m: 0.4 }],
      panto: ['#3a3d41', { r: 0.4, m: 0.6 }], insul: ['#7d4f3a', { r: 0.25 }], glass: ['#26343d', { r: 0.06, m: 0.6 }],
      motor: ['#3d4146', { r: 0.45, m: 0.55 }], coil: ['#a8622f', { r: 0.4, m: 0.7 }], gear: ['#55595e', { r: 0.35, m: 0.8 }],
    });
    const g = 1.435, R = 0.675, Rp = 0.475, cr = 0.3;
    const zRod = TB.zRod(g, 0.135);
    const AX = [1.7, 3.3, 5.0], XJ = 4.15, YJ = 1.0, XP = 7.3;
    const wire = 5.45;

    // 1 — Pantógrafos
    const pP = M.part('panto', { anchor: [1.75, 4.9, 0], explode: [0, 1.4, 0] });
    const pantos = [];
    for (const x of [-1.75, 1.75]) {
      const pg = diamondPanto(pP, { w: 1.45, base: 1.3, arm: 0.92, headW: 1.95, h: wire - 4.27 });
      pg.group.position.set(x, 4.15, 0); pP.group.add(pg.group); pantos.push(pg);
    }
    { const k = new Kit(); k.box(pP.m('panto'), 2.4, 0.06, 0.12, 0, 4.18, 0.55); k.cyl(pP.m('insul'), 0.06, 0.3, 'y', 0, 4.08, 0.55, 10); k.build(pP.group); }

    // 2 — Transformador principal y conmutador escalonado
    const pX = M.part('trafo', { anchor: [0.3, 2.7, 0.6], explode: [0, 1.0, 1.8] });
    {
      const k = new Kit();
      k.box(pX.m('oil'), 1.5, 1.6, 1.3, 0, 2.55, 0);
      for (let i = -6; i <= 6; i++) for (const s of [1, -1]) k.box(pX.m('fin'), 0.04, 1.3, 0.22, i * 0.11, 2.5, s * 0.76);
      k.box(pX.m('oil'), 1.6, 0.1, 1.4, 0, 3.38, 0);
      for (const z of [-0.35, 0, 0.35]) k.cyl(pX.m('insul'), 0.07, 0.35, 'y', -0.4, 3.6, z, 12);
      // conmutador escalonado (Stufenschalter) con 22 posiciones
      k.box(pX.m('dark'), 0.7, 1.0, 0.9, 1.25, 2.25, -0.2);
      k.cyl(pX.m('steel'), 0.32, 0.06, 'z', 1.25, 2.35, 0.27, 24);
      for (let i = 0; i < 22; i++) { const a = -2.2 + i * 0.21; k.box(pX.m('copper'), 0.04, 0.08, 0.04, 1.25 + Math.cos(a) * 0.36, 2.35 + Math.sin(a) * 0.36, 0.3); }
      // interruptor principal en aceite
      k.cyl(pX.m('dark'), 0.25, 0.7, 'y', -1.3, 2.2, 0.3, 16);
      k.build(pX.group);
    }

    // 3 — Motores de tracción (4 × monofásicos serie de 12 polos)
    const pM = M.part('motores', { anchor: [4.76, 1.7, 0.5], explode: [0, 1.6, 0] });
    const armatures = [];
    {
      for (const h of [1, -1]) for (const d of [-1, 1]) {
        const k = new Kit();
        const x = h * XJ + d * 0.61, y = YJ + 0.61;
        k.cyl(pM.m('motor'), 0.5, 1.1, 'z', x, y, 0, 32);
        k.cyl(pM.m('dark'), 0.52, 0.08, 'z', x, y, 0.56, 32); k.cyl(pM.m('dark'), 0.52, 0.08, 'z', x, y, -0.56, 32);
        for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; k.box(pM.m('dark'), 0.09, 0.09, 1.0, x + Math.cos(a) * 0.5, y + Math.sin(a) * 0.5, 0); }
        k.build(pM.group);
        // inducido/piñón (gira)
        const ag = new T.Group(); ag.position.set(x, y, 0);
        const ak = new Kit();
        ak.cyl(pM.m('gear'), 0.16, 0.16, 'z', 0, 0, 0.62, 18);
        for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2; ak.box(pM.m('gear'), 0.05, 0.05, 0.16, Math.cos(a) * 0.17, Math.sin(a) * 0.17, 0.62, 0, 0, a); }
        ak.cyl(pM.m('copper'), 0.3, 0.2, 'z', 0, 0, -0.35, 24);
        ak.build(ag); pM.group.add(ag); armatures.push({ ag, ratio: 0.71 / 0.17 });
        // ventilador superior
        const fk = new Kit(); fk.cyl(pM.m('dark'), 0.2, 0.35, 'y', x, y + 0.65, 0.3, 16); fk.build(pM.group);
      }
    }

    // 4 — Eje ciego (Blindwelle) con rueda dentada grande
    const pJ = M.part('ejeciego', { anchor: [4.15, 1.0, 0.75], explode: [0, 0.4, 1.4] });
    const jacks = [];
    for (const h of [1, -1]) {
      const jg = new T.Group(); jg.position.set(h * XJ, YJ, 0); pJ.group.add(jg);
      const k = new Kit();
      k.cyl(pJ.m('steel'), 0.11, 2 * zRod, 'z', 0, 0, 0, 16);
      k.cyl(pJ.m('gear'), 0.71, 0.14, 'z', 0, 0, 0.62, 48);
      for (let i = 0; i < 64; i++) { const a = i / 64 * Math.PI * 2; k.box(pJ.m('gear'), 0.05, 0.05, 0.14, Math.cos(a) * 0.72, Math.sin(a) * 0.72, 0.62, 0, 0, a); }
      for (const s of [1, -1]) {
        k.cyl(pJ.m('dark'), 0.38, 0.08, 'z', 0, 0, s * (zRod - 0.1), 32);
        k.add(G.sector(0.12, 0.37, Math.PI - 0.9, Math.PI + 0.9, 0.1), pJ.m('dark'), [0, 0, s * (zRod - 0.06)], [0, 0, s > 0 ? 0 : Math.PI / 2]);
        const ph = s > 0 ? 0 : Math.PI / 2;
        k.cyl(pJ.m('steel'), 0.06, 0.22, 'z', Math.cos(ph) * cr, Math.sin(ph) * cr, s * (zRod + 0.02), 14);
      }
      k.build(jg); jacks.push(jg);
      // cojinetes al bastidor
      const bk = new Kit(); for (const s of [1, -1]) bk.box(pJ.m('dark'), 0.4, 0.4, 0.15, h * XJ, YJ, s * 0.66); bk.build(pJ.group);
    }

    // 5 — Bielas de acoplamiento y marco triangular
    const pB = M.part('bielas', { anchor: [2.5, 0.7, 1.0], explode: [0, -0.1, 1.9] });
    const rigs = [];
    for (const h of [1, -1]) for (const s of [1, -1]) {
      const grp = new T.Group(); pB.group.add(grp);
      const k = new Kit(); const st = pB.m('steel');
      const z = s * (zRod + 0.06);
      const a1 = [h * AX[0], R, z], a2 = [h * AX[1], R, z], a3 = [h * AX[2], R, z], jj = [h * XJ, YJ, z];
      k.bar(st, a1, a2, 0.05, 0.13); k.bar(st, a2, a3, 0.05, 0.12);
      k.bar(st, a2, jj, 0.05, 0.11); k.bar(st, jj, a3, 0.05, 0.11);
      for (const p of [a1, a2, a3, jj]) k.cyl(pB.m('dark'), 0.1, 0.09, 'z', p[0], p[1], p[2], 18);
      k.build(grp);
      rigs.push({ grp, phase: s > 0 ? 0 : Math.PI / 2 });
    }

    // 6 — Bastidores articulados, ruedas y bogies delanteros (ejes portadores)
    const pR = M.part('rodaje', { anchor: [-7.3, 0.5, 0.9], explode: [0, -0.6, 0] });
    const wsets = [];
    {
      const k = new Kit(); const dk = pR.m('dark');
      for (const h of [1, -1]) {
        for (const x of AX) {
          const w = wheelset({ R, gauge: g, tread: 0.135, type: 'spoke', spokes: 16, hubR: 0.14, crankR: cr, phaseR: 0, phaseL: Math.PI / 2, pinL: 0.16,
            m: { tyre: pR.m('tyre'), body: pR.m('black'), hub: pR.m('black'), pin: pR.m('steel'), axle: dk, cw: pR.m('black') } });
          w.group.position.set(h * x, R, 0); pR.group.add(w.group); wsets.push({ g: w.group, R });
        }
        const pw = wheelset({ R: Rp, gauge: g, tread: 0.135, type: 'spoke', spokes: 10, hubR: 0.1, m: { tyre: pR.m('tyre'), body: pR.m('black'), hub: pR.m('black'), axle: dk } });
        pw.group.position.set(h * XP, Rp, 0); pR.group.add(pw.group); wsets.push({ g: pw.group, R: Rp });
        for (const s of [1, -1]) {
          const shape = [[0.15, 0.55], [7.9, 0.55], [7.9, 1.32], [0.15, 1.32]].map(p => [h * p[0], p[1]]);
          k.add(G.extrude(shape, 0.06), dk, [0, 0, s * 0.62]);
          k.box(dk, 0.4, 0.32, 0.12, h * XP, Rp + 0.05, s * 0.62);
        }
        // traviesa de topes y topes
        k.box(pR.m('red'), 0.25, 0.55, 3.0, h * 9.35, 1.05, 0);
        for (const s of [1, -1]) { k.cyl(pR.m('dark'), 0.09, 0.4, 'x', h * 9.55, 1.06, s * 0.88, 14); k.cyl(pR.m('steel'), 0.2, 0.05, 'x', h * 9.74, 1.06, s * 0.88, 20); }
        k.box(pR.m('dark'), 0.3, 0.2, 0.25, h * 9.6, 1.06, 0);
      }
      // articulación central: barra de acoplamiento entre bastidores y pivotes de la cabina
      k.box(dk, 0.6, 0.2, 0.5, 0, 1.05, 0);
      k.cyl(pR.m('steel'), 0.12, 0.32, 'y', 0.25, 1.1, 0, 16); k.cyl(pR.m('steel'), 0.12, 0.32, 'y', -0.25, 1.1, 0, 16);
      for (const h of [1, -1]) k.cyl(pR.m('steel'), 0.2, 0.25, 'y', h * 1.8, 1.42, 0, 20);
      k.build(pR.group);
    }

    // 7 — Freno de recuperación: bobina de reactancia y conmutador de marcha/freno
    const pF = M.part('recuperacion', { anchor: [-1.3, 2.4, -0.75], explode: [0, 0.8, -1.8] });
    {
      const k = new Kit();
      k.box(pF.m('dark'), 0.9, 0.9, 0.7, -1.3, 2.35, -0.75);
      for (let i = 0; i < 9; i++) k.add(G.torus(0.28, 0.035, 8, 24), pF.m('coil'), [-1.3, 2.05 + i * 0.065, -0.75], [Math.PI / 2, 0, 0]);
      k.cyl(pF.m('dark'), 0.12, 0.7, 'y', -1.3, 2.35, -0.75, 12);
      // conmutadores de inversión (sobre cada grupo de motores)
      for (const h of [1, -1]) k.box(pF.m('dark'), 0.8, 0.35, 0.9, h * XJ, 2.45, 0);
      k.build(pF.group);
    }

    // 8 — Carrocería: capós ("hocicos") y cabina central
    const pC = M.part('carroceria', { anchor: [-6.0, 2.4, 1.15], explode: [0, 2.6, 0] });
    {
      const k = new Kit(); const br = pC.m('brown', { shell: true });
      for (const h of [1, -1]) {
        const prof = [[3.0, 1.32], [9.15, 1.32], [9.15, 1.95], [8.55, 2.5], [3.0, 2.62]].map(p => [h * p[0], p[1]]);
        if (h < 0) prof.reverse();
        k.add(G.extrude(prof, 2.2, 0.03), br, [0, 0, 0]);
        // persianas laterales
        for (const s of [1, -1]) for (let x = 3.5; x < 7.9; x += 1.1) for (let i = 0; i < 6; i++) k.box(pC.m('black'), 0.035, 0.42, 0.02, h * (x + i * 0.09), 2.02, s * 1.135);
        // areneros, barandillas y faroles
        for (const s of [1, -1]) {
          k.seg(pC.m('steel'), [h * 3.1, 2.75, s * 1.0], [h * 8.4, 2.6, s * 1.0], 0.018, 6);
          k.cyl(pC.m('black'), 0.11, 0.18, 'x', h * 9.2, 1.75, s * 0.75, 14);
          k.cyl(pC.m('glass'), 0.09, 0.02, 'x', h * 9.3, 1.75, s * 0.75, 14);
        }
        k.cyl(pC.m('black'), 0.11, 0.18, 'x', h * 8.9, 2.42, 0, 14);
      }
      // cabina
      const cw = 1.5, cy0 = 1.35, cy1 = 3.7;
      for (const s of [1, -1]) {
        k.box(br, 6.0, cy1 - cy0, 0.06, 0, (cy0 + cy1) / 2, s * cw);
        for (const x of [-2.2, -0.75, 0.75, 2.2]) k.box(pC.m('glass'), 0.9, 0.8, 0.02, x, 3.0, s * (cw + 0.035));
      }
      for (const h of [1, -1]) {
        k.box(br, 0.06, cy1 - cy0, cw * 2, h * 3.0, (cy0 + cy1) / 2, 0);
        for (const z of [-0.85, 0.85]) k.box(pC.m('glass'), 0.02, 0.75, 0.8, h * 3.035, 3.0, z);
      }
      const Rr = 2.6, al = Math.asin(1.55 / Rr);
      k.add(new T.CylinderGeometry(Rr, Rr, 6.1, 32, 1, true, -al, 2 * al), br, [0, cy1 + 0.36 - Rr, 0], [-Math.PI / 2, Math.PI / 2, 0, 'YXZ']);
      for (const h of [1, -1]) k.add(new T.CylinderGeometry(Rr, Rr, 0.04, 32, 1, false, -al, 2 * al), br, [h * 3.04, cy1 + 0.36 - Rr, 0], [-Math.PI / 2, Math.PI / 2, 0, 'YXZ']);
      k.box(pC.m('dark'), 6.2, 0.12, 3.2, 0, cy0, 0);
      k.build(pC.group);
    }

    const ratio = 0.71 / 0.17;
    M.anim.push((s) => {
      wsets.forEach(w => (w.g.rotation.z = -s / w.R));
      const th = -s / R;
      jacks.forEach(j => (j.rotation.z = th));
      armatures.forEach(a => (a.ag.rotation.z = -th * a.ratio));
      for (const rg of rigs) { rg.grp.position.x = Math.cos(th + rg.phase) * cr; rg.grp.position.y = Math.sin(th + rg.phase) * cr; }
    });
    M.update(0, 0);
    M.gear = ratio;

    // flujo eléctrico: catenaria → pantógrafo → interruptor → transformador → conmutador → motores → ruedas → riel
    const c1 = '#ffd166';
    M.flow([[-1.75, wire, 0], [-1.75, 4.3, 0], [-1.3, 4.0, 0.3], [-1.3, 2.9, 0.3], [-0.4, 3.0, 0], [0, 2.6, 0]], c1, { r: 0.05 });
    for (const h of [1, -1]) M.flow([[0.6 * h, 2.4, 0], [1.25 * h, 2.3, -0.2], [2.6 * h, 2.0, -0.3], [h * (XJ - 0.61), YJ + 0.61, -0.3], [h * (XJ + 0.61), YJ + 0.61, -0.3]], '#ffb347', { r: 0.045 });
    M.flow([[XJ, YJ, 0.4], [AX[1], R, 0.4], [AX[1], 0.05, 0.75], [AX[1] + 2, 0.02, 0.75]], '#5aa9e6', { r: 0.035, speed: 0.8 });

    M.finalize();
    M.len = 19.4; M.center = 0;
    M.cam = { pos: [10.5, 6.5, 17], target: [0.5, 2.0, 0] };
    M.env = { gauge: g, track: { style: 'wood', sleeperColor: '#4e3d30', pitch: 0.7, ballast: ['#7b7a75', '#4c4b47'] },
      catenary: { wireH: wire, span: 26, lattice: true, mastColor: '#5c6268', stagger: 0.25 } };
    M.wheelR = R;
    return M;
  };
})();
