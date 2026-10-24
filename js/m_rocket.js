/* Stephenson's Rocket (1829) — 0-2-2, dimensiones del cuaderno de J. U. Rastrick (5 oct 1829) */
(function () {
  const { T, Kit, G, wheelset, rod, placeRod } = TB;
  const { Model, sliderCrank, pinPos, steamCyl, puff, fireFx, fireLight } = MB;

  MODELS.rocket = function () {
    const M = new Model('rocket', {
      yellow: ['#e0b23a', { r: 0.45 }], yellowS: ['#e0b23a', { r: 0.45 }], black: ['#1f1e1c', { r: 0.55 }],
      copper: ['#b8693d', { r: 0.32, m: 0.85 }], brass: ['#c99a3c', { r: 0.28, m: 0.9 }], iron: ['#3b3d40', { r: 0.5, m: 0.6 }],
      tyre: ['#2c2d2f', { r: 0.4, m: 0.75 }], steel: ['#a3a8ad', { r: 0.3, m: 0.85 }], wood: ['#7a5233', { r: 0.8 }],
      cask: ['#8a5a32', { r: 0.75 }], coke: ['#2a2622', { r: 1, flat: true }], fire: ['#ff7a2e', { r: 0.6, em: '#ff5a10', ei: 1.4 }],
      tube: ['#c27848', { r: 0.4, m: 0.8 }], plate: ['#6d6f72', { r: 0.5, m: 0.6 }],
    });
    const R = 1.435 / 2, Rt = 0.826 / 2, xa = 1.08, xt = -1.08, ya = R;
    const yb = 1.33, rb = 0.508, bx0 = -0.63, bx1 = 1.20;
    const g = 1.435;

    // 1 — Caldera multitubular
    const pB = M.part('caldera', { explode: [0, 0.75, 0] });
    {
      const k = new Kit(), ks = new Kit();
      ks.add(G.cyl(rb, bx1 - bx0, 40, rb, true), pB.m('yellow', { shell: true }), [(bx0 + bx1) / 2, yb, 0], [0, 0, Math.PI / 2]);
      for (const x of [bx0 + 0.25, (bx0 + bx1) / 2, bx1 - 0.22]) { ks.add(G.torus(rb + 0.004, 0.012, 6, 40), pB.m('yellow', { shell: true }), [x, yb, 0], [0, Math.PI / 2, 0]); ks.rivetRing(pB.m('yellow', { shell: true }), [x + 0.035, yb, 0], rb + 0.004, 36, 0.009); }
      // placas tubulares
      for (const x of [bx0, bx1]) k.cyl(pB.m('plate'), rb - 0.005, 0.02, 'x', x, yb, 0, 40);
      // 25 tubos de cobre de 3 in (76 mm)
      const tp = pB.m('tube');
      for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) {
        k.cyl(tp, 0.038, bx1 - bx0, 'x', (bx0 + bx1) / 2, yb - 0.1 + j * 0.135, i * 0.135, 10, 0.038, true);
      }
      // nivel de agua (lámina translúcida)
      k.build(pB.group); ks.build(pB.group);
      const water = new T.Mesh(G.box(bx1 - bx0 - 0.04, 0.005, rb * 1.84), new T.MeshStandardMaterial({ color: '#4f8fb3', transparent: true, opacity: 0.45, roughness: 0.1, clippingPlanes: [TB.SECTION], side: T.DoubleSide }));
      water.position.set((bx0 + bx1) / 2, yb + 0.22, 0); pB.group.add(water);
    }

    // 2 — Hogar con camisa de agua (cobre)
    const pF = M.part('hogar', { explode: [-0.9, 0.25, 0] });
    {
      const k = new Kit(), ks = new Kit();
      const fx0 = -1.24, fx1 = -0.63, fy0 = 0.78, fy1 = 1.62, fw = 0.914;
      const cop = pF.m('copper', { shell: true });
      // camisa exterior (caja con techo en lomo)
      ks.box(cop, fx1 - fx0, fy1 - fy0, 0.02, (fx0 + fx1) / 2, (fy0 + fy1) / 2, fw / 2);
      ks.box(cop, fx1 - fx0, fy1 - fy0, 0.02, (fx0 + fx1) / 2, (fy0 + fy1) / 2, -fw / 2);
      ks.box(cop, 0.02, fy1 - fy0, fw, fx0, (fy0 + fy1) / 2, 0);
      ks.add(G.cyl(fw / 2, fx1 - fx0, 30, fw / 2, true), cop, [(fx0 + fx1) / 2, fy1, 0], [0, 0, Math.PI / 2], [1, 0.45, 1]);
      ks.add(TB.G.cyl(fw / 2, 0.02, 30), cop, [fx0, fy1, 0], [0, 0, Math.PI / 2], [1, 0.45, 1]);
      // caja de fuego interior (camisa de agua de ~3 in)
      const inner = pF.m('copper');
      k.box(inner, fx1 - fx0 - 0.16, fy1 - fy0 - 0.12, 0.015, (fx0 + fx1) / 2, (fy0 + fy1) / 2 + 0.02, fw / 2 - 0.08);
      k.box(inner, fx1 - fx0 - 0.16, fy1 - fy0 - 0.12, 0.015, (fx0 + fx1) / 2, (fy0 + fy1) / 2 + 0.02, -fw / 2 + 0.08);
      k.box(inner, fx1 - fx0 - 0.16, 0.015, fw - 0.16, (fx0 + fx1) / 2, fy1 - 0.05, 0);
      // parrilla y fuego
      for (let i = 0; i < 7; i++) k.box(pF.m('iron'), fx1 - fx0 - 0.18, 0.03, 0.03, (fx0 + fx1) / 2, fy0 + 0.1, -0.3 + i * 0.1);
      k.add(G.sph(0.24, 12, 8), pF.m('fire'), [(fx0 + fx1) / 2, fy0 + 0.2, 0], [0, 0, 0], [1, 0.45, 1.4]);
      // puerta del hogar
      k.box(pF.m('iron'), 0.03, 0.26, 0.3, fx0 - 0.02, fy0 + 0.42, 0);
      // remaches de la camisa exterior
      const rv = pF.m('copper', { shell: true });
      for (const sz of [1, -1]) { ks.rivets(rv, [fx0 + 0.03, fy0 + 0.04, sz * (fw / 2 + 0.012)], [fx1 - 0.03, fy0 + 0.04, sz * (fw / 2 + 0.012)], 9, 0.011); ks.rivets(rv, [fx0 + 0.03, fy0 + 0.06, sz * (fw / 2 + 0.012)], [fx0 + 0.03, fy1 - 0.04, sz * (fw / 2 + 0.012)], 8, 0.011); }
      k.build(pF.group); ks.build(pF.group);
    }

    // 3 — Escape (tobera) y chimenea
    const pE = M.part('escape', { explode: [0.25, 1.5, 0] });
    {
      const k = new Kit(), ks = new Kit();
      const cx = 1.03, ytop = 4.572, ybase = yb + rb - 0.05, cr = 0.178;
      // caja de humos frontal pequeña
      ks.add(G.cyl(rb + 0.02, 0.24, 36, rb + 0.02, true), pE.m('black', { shell: true }), [bx1 + 0.1, yb, 0], [0, 0, Math.PI / 2]);
      ks.cyl(pE.m('black', { shell: true }), rb + 0.02, 0.02, 'x', bx1 + 0.22, yb, 0, 36);
      ks.add(G.cyl(cr, ytop - ybase, 28, cr, true), pE.m('black', { shell: true }), [cx, (ytop + ybase) / 2, 0]);
      ks.add(G.cyl(cr + 0.03, 0.12, 28, cr + 0.01, true), pE.m('black', { shell: true }), [cx, ytop - 0.06, 0]);
      ks.add(G.torus(cr + 0.015, 0.02, 6, 28), pE.m('black', { shell: true }), [cx, ytop, 0], [Math.PI / 2, 0, 0]);
      // tobera de escape (blastpipe) dentro de la base de la chimenea
      const cu = pE.m('copper');
      k.seg(cu, [cx, yb - 0.1, 0], [cx, ybase + 0.25, 0], 0.045, 12, 0.03);
      k.add(G.cyl(0.03, 0.08, 12, 0.045), cu, [cx, ybase + 0.3, 0]);
      // tubos de escape desde los cilindros
      for (const s of [1, -1]) {
        k.add(G.poly([[-0.52, 2.02, s * 0.9], [-0.35, 2.05, s * 0.72], [0.9, 1.98, s * 0.6], [cx, 1.6, s * 0.2], [cx, yb - 0.1, 0.0]], 0.038, 8), cu);
      }
      k.build(pE.group); ks.build(pE.group);
    }

    // 4 — Cilindros inclinados, pistones, crucetas y bielas
    const pC = M.part('cilindros', { explode: [0, 0.35, 0.9] });
    const ang = 38 * Math.PI / 180, u = [-Math.cos(ang), Math.sin(ang)], A = [xa, ya];
    const r = 0.4191 / 2, L = 1.25, pistonRod = 0.58, cyl0 = 1.5, cyl1 = 2.1;
    const zRod = TB.zRod(g, 0.09);
    const sides = [];
    // Rocket trabajaba casi a plena admisión: su distribución de excéntricas no permitía variar el corte
    const P = M.addParticles(pE.group, { count: 1100, c0: '#f3f2ee', c1: '#a19e98', grow: 2.8, rise: 0.9, opacity: 0.5 });
    M.initSteam({ pB: 3.45, cut: 0.85, Rw: R, fixedCut: true, onBeat: (c, dt) => puff(P, [1.03, 4.62, 0], M.vNow, M.tSim, { n: beatN(), up: 3.2 + M.vNow * 0.15, life: 2.6, size: 0.3 }) });
    M.steam.fixedCut = true;
    const beatN = () => Math.max(2, Math.min(9, Math.round(40 / Math.max(1, M.vNow / (Math.PI * 2 * R) * 4))));
    {
      for (const s of [1, -1]) {
        const grp = new T.Group(); pC.group.add(grp);
        const k = new Kit();
        const c0 = [A[0] + u[0] * cyl0, A[1] + u[1] * cyl0], c1 = [A[0] + u[0] * cyl1, A[1] + u[1] * cyl1];
        const yel = pC.m('yellowS', { shell: true });
        k.seg(yel, [c0[0], c0[1], s * zRod], [c1[0], c1[1], s * zRod], 0.135, 24);
        k.seg(pC.m('brass'), [c1[0], c1[1], s * zRod], [c1[0] + u[0] * 0.04, c1[1] + u[1] * 0.04, s * zRod], 0.145, 24);
        k.seg(pC.m('brass'), [c0[0] - u[0] * 0.04, c0[1] - u[1] * 0.04, s * zRod], [c0[0], c0[1], s * zRod], 0.145, 24);
        // guías de cruceta
        for (const dn of [-0.07, 0.07]) {
          const nx = -u[1] * dn, ny = u[0] * dn;
          k.seg(pC.m('steel'), [A[0] + u[0] * 0.95 + nx, A[1] + u[1] * 0.95 + ny, s * zRod], [c0[0] + nx, c0[1] + ny, s * zRod], 0.016, 6);
        }
        // soporte al bastidor
        k.seg(pC.m('iron'), [c1[0], c1[1] - 0.1, s * zRod], [c1[0] + 0.05, yb - 0.1, s * 0.55], 0.03, 6);
        k.build(grp);
        // pistón (dentro del cilindro)
        const pk = new Kit();
        pk.cyl(pC.m('steel'), 0.1, 0.07, 'x', 0, 0, 0, 20);
        pk.cyl(pC.m('steel'), 0.022, pistonRod, 'x', -pistonRod / 2, 0, 0, 8);
        const piston = new T.Group(); pk.build(piston); piston.rotation.z = Math.atan2(u[1], u[0]); piston.position.z = s * zRod; grp.add(piston);
        const ck = new Kit(); ck.box(pC.m('steel'), 0.12, 0.13, 0.08, 0, 0, 0);
        const cross = new T.Group(); ck.build(cross); cross.rotation.z = Math.atan2(u[1], u[0]); cross.position.z = s * zRod; grp.add(cross);
        const crod = rod(pC.m('iron'), L, 0.075, 0.045, 0.065, pC.m('brass')); crod.position.z = s * (zRod + 0.06); grp.add(crod);
        if (s > 0) { piston.name = 'R.piston'; cross.name = 'R.cross'; crod.name = 'R.biela'; }
        const sd = { s, piston, cross, crod, phase: s > 0 ? 0 : Math.PI / 2, A };
        sides.push(sd);
        steamCyl(M, grp, { src: sd, A, u, L, r, pr: pistonRod, pt: 0.035, d0: cyl0, d1: cyl1, bore: 0.1015, z: s * zRod });
      }
    }

    // 5 — Ruedas motrices (madera con llanta de hierro) y eje trasero
    const pW = M.part('ruedas', { explode: [0, -0.15, 1.2] });
    const drive = wheelset({ R, gauge: g, tread: 0.09, type: 'wood', spokes: 14, hubR: 0.17, crankR: r, phaseR: 0, phaseL: Math.PI / 2, pinL: 0.16, cw: false,
      m: { tyre: pW.m('tyre'), body: pW.m('yellow'), hub: pW.m('iron'), pin: pW.m('steel'), axle: pW.m('iron') } });
    drive.group.position.set(xa, ya, 0); pW.group.add(drive.group);
    const trail = wheelset({ R: Rt, gauge: g, tread: 0.09, type: 'wood', spokes: 10, hubR: 0.1, m: { tyre: pW.m('tyre'), body: pW.m('yellow'), hub: pW.m('iron'), axle: pW.m('iron') } });
    trail.group.position.set(xt, Rt, 0); pW.group.add(trail.group);

    // 6 — Bastidor y ballestas
    const pS = M.part('bastidor', { explode: [0, -0.45, 0] });
    {
      const k = new Kit();
      const ir = pS.m('iron'), wd = pS.m('wood');
      for (const s of [1, -1]) {
        k.box(wd, 2.75, 0.2, 0.09, 0.05, 0.98, s * 0.58);
        k.box(ir, 2.75, 0.03, 0.1, 0.05, 1.09, s * 0.58);
        // cajas de grasa y ballestas
        for (const [x, y, rr] of [[xa, ya, R], [xt, Rt, Rt]]) {
          k.box(ir, 0.22, 0.24, 0.12, x, y + 0.02, s * 0.58);
          const sy = y + 0.22;
          for (let i = 0; i < 6; i++) k.box(pS.m('steel'), 0.9 - i * 0.12, 0.022, 0.08, x, sy + 0.03 + i * 0.024, s * 0.58);
          k.seg(ir, [x - 0.45, sy + 0.02, s * 0.58], [x - 0.45, 1.0, s * 0.58], 0.018, 6);
          k.seg(ir, [x + 0.45, sy + 0.02, s * 0.58], [x + 0.45, 1.0, s * 0.58], 0.018, 6);
        }
      }
      // travesaños y plataforma del maquinista
      k.box(wd, 0.12, 0.2, 1.25, 1.4, 0.98, 0); k.box(wd, 0.12, 0.2, 1.25, -1.3, 0.98, 0);
      k.box(wd, 0.5, 0.05, 1.3, -1.52, 0.86, 0);
      // bomba de alimentación (forcing pump 1½ in)
      k.seg(pS.m('brass'), [-0.2, 0.8, 0.62], [0.5, 0.8, 0.62], 0.045, 10);
      k.build(pS.group);
    }

    // 7 — Válvulas de seguridad y regulador
    const pV = M.part('valvulas', { explode: [0, 0.9, -0.4] });
    {
      const k = new Kit();
      const br = pV.m('brass');
      // válvula de palanca con resorte (balanza)
      k.add(G.cyl(0.065, 0.16, 18, 0.08), br, [-0.45, yb + rb + 0.08, 0]);
      k.seg(pV.m('iron'), [-0.45, yb + rb + 0.18, 0], [0.12, yb + rb + 0.12, 0], 0.014, 6);
      k.add(G.cyl(0.03, 0.22, 10), pV.m('steel'), [0.12, yb + rb + 0.02, 0]);
      // válvula de cierre (lock-up) en caja de latón
      k.add(G.cyl(0.07, 0.22, 18, 0.09), br, [0.45, yb + rb + 0.1, 0]);
      k.sph(br, 0.07, 0.45, yb + rb + 0.22, 0, 1, 0.6, 1);
      // tubo de vapor y regulador hacia los cilindros
      for (const s of [1, -1]) k.add(G.poly([[-0.3, yb + rb - 0.02, 0], [-0.3, yb + rb + 0.02, s * 0.3], [-0.52, 2.06, s * 0.82]], 0.035, 8), pV.m('copper'));
      k.add(G.cyl(0.07, 0.12, 14), br, [-0.3, yb + rb + 0.04, 0]);
      k.build(pV.group);
    }

    // vapor que escapa de la válvula de seguridad (“pluma”) y humo de coque
    const PS = M.addParticles(pV.group, { count: 200, c0: '#ffffff', c1: '#d8dde2', grow: 2.0, rise: 0.4, opacity: 0.32 });
    { let acc = 0, accS = 0;
      M.fx.push((t, dt, v) => {
        if (!M.powered || dt <= 0) return;
        accS += dt * 5; while (accS > 1) { accS--; PS.emit([-0.45 + (Math.random() - 0.5) * 0.04, yb + rb + 0.2, (Math.random() - 0.5) * 0.04], [-v * 0.9 + (Math.random() - 0.5) * 0.3, 1.6 + Math.random(), (Math.random() - 0.5) * 0.3], 1.6, 0.12, t); }
        acc += dt * 4; while (acc > 1) { acc--; P.emit([1.03 + (Math.random() - 0.5) * 0.1, 4.6, (Math.random() - 0.5) * 0.1], [-v * 0.95, 1.2 + Math.random() * 0.6, (Math.random() - 0.5) * 0.3], 3.0, 0.28, t); }
      });
    }
    fireFx(M, [pF.m('fire')], fireLight(M, [-0.93, 1.05, 0], 2.2), 1.4);

    // 8 — Ténder
    const pT = M.part('tender', { explode: [-1.2, 0, 0] });
    const tWheels = [];
    {
      const k = new Kit();
      const wd = pT.m('wood'), ye = pT.m('yellow');
      const tx0 = -4.25, tx1 = -1.85, ty = 0.86;
      k.box(wd, tx1 - tx0, 0.12, 1.35, (tx0 + tx1) / 2, ty, 0);
      for (const s of [1, -1]) {
        k.box(ye, tx1 - tx0, 0.26, 0.06, (tx0 + tx1) / 2, ty - 0.12, s * 0.66);
        for (let x = tx0 + 0.1; x < tx1; x += 0.3) k.box(pT.m('iron'), 0.025, 0.42, 0.025, x, ty + 0.27, s * 0.66);
        k.box(pT.m('iron'), tx1 - tx0, 0.03, 0.03, (tx0 + tx1) / 2, ty + 0.48, s * 0.66);
      }
      // tonel de agua (barril de madera con aros)
      const cx = -3.35, cy = ty + 0.53;
      k.add(G.lathe([[0.001, -0.68], [0.4, -0.68], [0.47, -0.3], [0.49, 0], [0.47, 0.3], [0.4, 0.68], [0.001, 0.68]], 28), pT.m('cask'), [cx, cy, 0], [0, 0, Math.PI / 2]);
      for (const d of [-0.55, -0.22, 0.22, 0.55]) k.add(G.torus(0.46 - Math.abs(d) * 0.08, 0.014, 5, 28), pT.m('iron'), [cx + d, cy, 0], [0, Math.PI / 2, 0]);
      // coque
      for (let i = 0; i < 26; i++) { const a = i * 2.39; k.add(G.sph(0.09 + (i % 3) * 0.02, 6, 5), pT.m('coke'), [-2.35 + Math.cos(a) * 0.25, ty + 0.12 + (i % 5) * 0.05, Math.sin(a) * 0.4]); }
      // barra de tiro
      k.box(pT.m('iron'), 0.45, 0.06, 0.08, tx1 + 0.08, ty - 0.05, 0);
      k.build(pT.group);
      for (const x of [-2.35, -3.75]) {
        const w = wheelset({ R: 0.455, gauge: g, tread: 0.09, type: 'spoke', spokes: 8, hubR: 0.09, m: { tyre: pT.m('iron'), body: pT.m('iron'), hub: pT.m('iron'), axle: pT.m('iron') } });
        w.group.position.set(x, 0.455, 0); pT.group.add(w.group); tWheels.push(w.group);
      }
    }

    // ----- Animación -----
    M.anim.push((s) => {
      const th = -s / R;
      drive.group.rotation.z = th; trail.group.rotation.z = -s / Rt;
      tWheels.forEach(w => (w.rotation.z = -s / 0.455));
      for (const sd of sides) {
        const pin = pinPos(A, r, th + sd.phase);
        const xc = sliderCrank(A, u, pin, L);
        sd.xc = xc; sd.phi = th + sd.phase;
        const C = [A[0] + u[0] * xc, A[1] + u[1] * xc];
        sd.cross.position.x = C[0]; sd.cross.position.y = C[1];
        sd.piston.position.x = A[0] + u[0] * (xc + pistonRod); sd.piston.position.y = A[1] + u[1] * (xc + pistonRod);
        placeRod(sd.crod, pin, C);
      }
    });
    M.update(0, 0);

    // ----- Flujos de energía -----
    M.flow([[-0.93, 1.0, 0], [-0.93, 1.25, 0], [-0.6, 1.23, 0], [1.15, 1.23, 0], [1.03, 1.75, 0], [1.03, 4.4, 0]], '#ff8a3d', { r: 0.055 });
    M.flow([[-0.2, yb + 0.35, 0], [-0.3, yb + rb + 0.04, 0], [-0.3, yb + rb + 0.04, 0.3], [-0.52, 2.06, 0.82], [-0.56, 2.04, 0.9], [-0.35, 2.05, 0.72], [0.9, 1.98, 0.6], [1.03, 1.6, 0.2], [1.03, 4.0, 0]], '#bfe6ff', { r: 0.035, speed: 1.4 });

    M.finalize();
    M.len = 6.2; M.center = -1.4;
    M.cam = { pos: [3.6, 3.1, 7.4], target: [-1.2, 1.5, 0] };
    M.env = { gauge: g, track: { style: 'stone', railScale: 0.55, sleeperColor: '#8b857a', pitch: 0.9, ballast: ['#7b6a55', '#4a3e30'], ballastW: 2.6 } };
    M.wheelR = R;
    return M;
  };
})();
