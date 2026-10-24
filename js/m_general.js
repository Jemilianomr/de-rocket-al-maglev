/* W&A "General" (Rogers, Ketchum & Grosvenor, 1855) — 4-4-0 "American", vía de 5 ft */
(function () {
  const { T, Kit, G, wheelset, rod, placeRod } = TB;
  const { Model, sliderCrank, pinPos } = MB;

  MODELS.general = function () {
    const M = new Model('general', {
      russia: ['#5e6c79', { r: 0.35, m: 0.7 }], black: ['#1f1f1f', { r: 0.6 }], brass: ['#c99a3c', { r: 0.25, m: 0.9 }],
      red: ['#9b2a1f', { r: 0.5 }], redS: ['#9b2a1f', { r: 0.5 }], wood: ['#6e4426', { r: 0.6 }], woodL: ['#a87543', { r: 0.7 }],
      iron: ['#3a3c3f', { r: 0.5, m: 0.6 }], steel: ['#a3a8ad', { r: 0.3, m: 0.85 }], tyre: ['#2c2d2f', { r: 0.4, m: 0.75 }],
      green: ['#2f4a3a', { r: 0.5 }], tube: ['#8f6a4a', { r: 0.45, m: 0.6 }], fire: ['#ff7a2e', { r: 0.6, em: '#ff5a10', ei: 1.3 }],
      glass: ['#d8e6c0', { r: 0.1, em: '#ffe9a8', ei: 0.6 }], log: ['#7a5a3a', { r: 0.9 }], logEnd: ['#c59a66', { r: 0.9 }],
    });
    const g = 1.524, R = 0.762, Rt = 0.381;
    const xD1 = -1.86, xD2 = -3.994, xT1 = 2.25, xT2 = 0.70;
    const yb = 2.02, rb = 0.54;
    const zRod = TB.zRod(g, 0.13);
    const A = [xD1, R];
    const cylC = [1.55, 1.05];
    const ul = Math.hypot(cylC[0] - A[0], cylC[1] - A[1]);
    const u = [(cylC[0] - A[0]) / ul, (cylC[1] - A[1]) / ul];
    const r = 0.559 / 2, L = 2.35, pr = 1.05;

    // 1 — Bogie delantero (truck de Jervis con pivote central)
    const pT = M.part('bogie', { explode: [0.6, -0.3, 1.3] });
    const truckWheels = [];
    {
      const k = new Kit(); const ir = pT.m('iron');
      for (const x of [xT1, xT2]) {
        const w = wheelset({ R: Rt, gauge: g, tread: 0.12, type: 'spoke', spokes: 8, hubR: 0.08, m: { tyre: pT.m('tyre'), body: pT.m('red'), hub: pT.m('iron'), axle: ir } });
        w.group.position.set(x, Rt, 0); pT.group.add(w.group); truckWheels.push(w.group);
      }
      for (const s of [1, -1]) {
        k.box(ir, 2.2, 0.08, 0.08, (xT1 + xT2) / 2, 0.62, s * 0.62);
        k.box(ir, 2.0, 0.06, 0.08, (xT1 + xT2) / 2, 0.42, s * 0.62);
        for (const x of [xT1, xT2]) k.box(ir, 0.24, 0.3, 0.12, x, 0.45, s * 0.62);
      }
      k.box(ir, 0.25, 0.12, 1.36, (xT1 + xT2) / 2, 0.68, 0);
      k.cyl(pT.m('steel'), 0.12, 0.25, 'y', (xT1 + xT2) / 2, 0.82, 0, 16);
      k.build(pT.group);
    }

    // 2 — Bastidor de barras, ballestas y balancines compensadores (Harrison)
    const pS = M.part('bastidor', { explode: [0, -0.55, 0] });
    {
      const k = new Kit(); const ir = pS.m('iron'), st = pS.m('steel');
      for (const s of [1, -1]) {
        k.box(ir, 6.6, 0.1, 0.09, -1.0, 1.02, s * 0.5);
        k.box(ir, 2.6, 0.08, 0.09, -2.93, 0.62, s * 0.5);
        for (const x of [xD1, xD2]) {
          k.box(ir, 0.26, 0.42, 0.14, x, 0.85, s * 0.5);
          for (let i = 0; i < 7; i++) k.box(st, 0.95 - i * 0.11, 0.025, 0.1, x, 1.14 + i * 0.027, s * 0.5);
        }
        // balancín compensador entre ejes motrices y su fulcro
        k.box(pS.m('red'), xD1 - xD2 - 0.9, 0.08, 0.06, (xD1 + xD2) / 2, 1.38, s * 0.5);
        k.cyl(st, 0.05, 0.16, 'z', (xD1 + xD2) / 2, 1.38, s * 0.5, 12);
        k.seg(ir, [(xD1 + xD2) / 2, 1.38, s * 0.5], [(xD1 + xD2) / 2, 1.06, s * 0.5], 0.03, 6);
        for (const x of [xD1 + 0.45, xD2 - 0.45, xD1 - 0.45, xD2 + 0.45]) k.seg(ir, [x, 1.14, s * 0.5], [x, 1.38, s * 0.5], 0.02, 6);
      }
      // estribo y piso
      k.box(pS.m('wood'), 0.5, 0.06, 2.0, 1.25, 1.12, 0);
      k.box(ir, 0.18, 0.25, 1.6, 2.75, 0.9, 0);
      k.build(pS.group);
    }

    // 3 — Chimenea de globo (parachispas) y caja de humos
    const pC = M.part('chimenea', { explode: [0.3, 1.7, 0] });
    {
      const k = new Kit(), ks = new Kit();
      const bk = pC.m('black', { shell: true });
      const sx = 1.95;
      ks.add(G.cyl(rb + 0.03, 1.15, 36, rb + 0.03, true), bk, [1.98, yb, 0], [0, 0, Math.PI / 2]);
      ks.cyl(bk, rb + 0.03, 0.04, 'x', 2.56, yb, 0, 36);
      k.cyl(pC.m('brass'), 0.12, 0.05, 'x', 2.6, yb, 0, 16);
      // chimenea: tronco cónico + globo
      ks.add(G.lathe([[0.2, 0], [0.22, 0.7], [0.3, 1.0], [0.62, 1.45], [0.72, 1.75], [0.7, 2.0], [0.55, 2.12], [0.22, 2.2]], 30), bk, [sx, yb + rb - 0.05, 0]);
      // cono interior parachispas y malla
      k.add(G.cyl(0.02, 0.5, 20, 0.5, true), pC.m('iron'), [sx, yb + rb + 1.55, 0]);
      k.add(G.cyl(0.6, 0.02, 24, 0.6, true), pC.m('steel'), [sx, yb + rb + 1.95, 0]);
      // tobera de escape
      k.seg(pC.m('iron'), [sx, yb - 0.2, 0], [sx, yb + rb + 0.3, 0], 0.07, 12, 0.05);
      k.build(pC.group); ks.build(pC.group);
    }

    // 4 — Cilindros, distribución de Stephenson y bielas motrices
    const pY = M.part('cilindros', { explode: [0, 0.35, 1.2] });
    const sides = [];
    const ecc = [];
    {
      for (const s of [1, -1]) {
        const grp = new T.Group(); pY.group.add(grp);
        const k = new Kit();
        const c0 = [A[0] + u[0] * 3.0, A[1] + u[1] * 3.0], c1 = [A[0] + u[0] * 3.85, A[1] + u[1] * 3.85];
        const cs = pY.m('russia', { shell: true });
        k.seg(cs, [c0[0], c0[1], s * zRod], [c1[0], c1[1], s * zRod], 0.25, 28);
        k.seg(pY.m('brass'), [c0[0] - 0.03, c0[1], s * zRod], [c0[0] + 0.03, c0[1], s * zRod], 0.27, 28);
        k.seg(pY.m('brass'), [c1[0] - 0.03, c1[1], s * zRod], [c1[0] + 0.03, c1[1], s * zRod], 0.27, 28);
        // caja de válvulas (corredera en D)
        k.box(pY.m('russia', { shell: true }), 0.7, 0.28, 0.32, (c0[0] + c1[0]) / 2, c0[1] + 0.36, s * zRod);
        // guías
        for (const dn of [-0.11, 0.11]) k.seg(pY.m('steel'), [A[0] + u[0] * 1.9, A[1] + u[1] * 1.9 + dn, s * zRod], [c0[0], c0[1] + dn, s * zRod], 0.02, 6);
        // silleta hacia caja de humos
        k.box(pY.m('iron'), 0.7, 0.5, 0.35, (c0[0] + c1[0]) / 2, c0[1] + 0.6, s * (zRod - 0.3));
        k.build(grp);
        const pk = new Kit(); pk.cyl(pY.m('steel'), 0.18, 0.08, 'x', 0, 0, 0, 20); pk.cyl(pY.m('steel'), 0.03, pr, 'x', -pr / 2, 0, 0, 8);
        const piston = new T.Group(); pk.build(piston); piston.rotation.z = Math.atan2(u[1], u[0]); piston.position.z = s * zRod; grp.add(piston);
        const ck = new Kit(); ck.box(pY.m('steel'), 0.2, 0.18, 0.12, 0, 0, 0);
        const cross = new T.Group(); ck.build(cross); cross.rotation.z = Math.atan2(u[1], u[0]); cross.position.z = s * zRod; grp.add(cross);
        const mrod = rod(pY.m('iron'), L, 0.11, 0.05, 0.085, pY.m('brass')); mrod.position.z = s * (zRod + 0.07); grp.add(mrod);
        sides.push({ s, piston, cross, mrod, phase: s > 0 ? 0 : Math.PI / 2 });
        // excéntricas (dentro del bastidor, sobre el eje motriz delantero) y barras al sector
        const eg = new T.Group(); eg.position.set(A[0], A[1], s * 0.3); grp.add(eg);
        const ek = new Kit(); ek.cyl(pY.m('steel'), 0.17, 0.06, 'z', 0.07, 0, -0.04, 20); ek.cyl(pY.m('steel'), 0.17, 0.06, 'z', -0.07, 0.03, 0.04, 20); ek.build(eg);
        const eRod1 = rod(pY.m('iron'), 1.6, 0.05, 0.03, 0.04); eRod1.position.z = s * 0.26; grp.add(eRod1);
        const eRod2 = rod(pY.m('iron'), 1.6, 0.05, 0.03, 0.04); eRod2.position.z = s * 0.34; grp.add(eRod2);
        const link = new T.Group(); const lk = new Kit(); lk.add(G.torus(1.6, 0.025, 5, 12, 0.32), pY.m('steel'), [0, 0, 0], [0, 0, Math.PI - 0.16]); lk.build(link);
        link.position.set(A[0] + 1.6 + 1.6, A[1] + 0.05, s * 0.3); grp.add(link);
        ecc.push({ eg, eRod1, eRod2, link, s });
      }
    }

    // 5 — Ruedas motrices de 60 in y bielas de acoplamiento
    const pW = M.part('ruedas', { explode: [0, -0.2, 1.6] });
    const drivers = [];
    const cRods = [];
    {
      for (const x of [xD1, xD2]) {
        const w = wheelset({ R, gauge: g, tread: 0.13, type: 'spoke', spokes: 16, hubR: 0.15, crankR: r, phaseR: 0, phaseL: Math.PI / 2, pinL: 0.22,
          m: { tyre: pW.m('tyre'), body: pW.m('red'), hub: pW.m('red'), pin: pW.m('steel'), axle: pW.m('iron'), cw: pW.m('red') } });
        w.group.position.set(x, R, 0); pW.group.add(w.group); drivers.push(w.group);
      }
      for (const s of [1, -1]) {
        const cr = rod(pW.m('steel'), xD1 - xD2, 0.09, 0.045, 0.075);
        cr.position.z = s * (zRod + 0.0); pW.group.add(cr); cRods.push({ cr, s, phase: s > 0 ? 0 : Math.PI / 2 });
      }
    }

    // 6 — Caldera, hogar, domos y 130 tubos de humo
    const pB = M.part('caldera', { explode: [0, 0.95, 0] });
    {
      const k = new Kit(), ks = new Kit();
      const sh = pB.m('russia', { shell: true }), br = pB.m('brass');
      const bx0 = -3.2, bx1 = 1.42;
      ks.add(G.cyl(rb, bx1 - bx0, 40, rb, true), sh, [(bx0 + bx1) / 2, yb, 0], [0, 0, Math.PI / 2]);
      for (let x = bx0 + 0.4; x < bx1; x += 0.95) ks.add(G.torus(rb + 0.006, 0.015, 6, 40), pB.m('brass', { shell: true }), [x, yb, 0], [0, Math.PI / 2, 0]);
      // hogar alto ("wagon top") entre bastidores
      const fx0 = -4.6, fx1 = -3.2;
      ks.box(sh, fx1 - fx0, 1.6, 0.02, (fx0 + fx1) / 2, 1.75, 0.48);
      ks.box(sh, fx1 - fx0, 1.6, 0.02, (fx0 + fx1) / 2, 1.75, -0.48);
      ks.add(G.cyl(0.62, fx1 - fx0, 32, 0.62, true), sh, [(fx0 + fx1) / 2, 2.5, 0], [0, 0, Math.PI / 2], [1, 0.62, 0.78]);
      ks.box(sh, 0.02, 1.6, 0.96, fx0, 1.75, 0);
      k.box(pB.m('iron'), fx1 - fx0 - 0.2, 0.03, 0.8, (fx0 + fx1) / 2, 1.05, 0);
      k.add(G.sph(0.35, 10, 8), pB.m('fire'), [(fx0 + fx1) / 2, 1.2, 0], [0, 0, 0], [1.4, 0.45, 0.9]);
      // tubos: 130 × 2 in × 11 ft
      for (let i = 0; i < 13; i++) for (let j = 0; j < 10; j++) {
        const z = -0.39 + i * 0.065, y = yb - 0.36 + j * 0.065;
        if (z * z + (y - yb) * (y - yb) > 0.44 * 0.44) continue;
        k.cyl(pB.m('tube'), 0.0254, bx1 - bx0 - 0.1, 'x', (bx0 + bx1) / 2, y, z, 6, 0.0254, true);
      }
      for (const x of [bx0, bx1]) k.cyl(pB.m('iron'), rb - 0.01, 0.02, 'x', x, yb, 0, 40);
      // domo de vapor y arenero (latón)
      k.add(G.lathe([[0.001, 0], [0.32, 0], [0.32, 0.45], [0.3, 0.55], [0.22, 0.66], [0.001, 0.72]], 28), br, [-1.6, yb + rb - 0.08, 0]);
      k.add(G.lathe([[0.001, 0], [0.26, 0], [0.26, 0.32], [0.18, 0.44], [0.001, 0.48]], 28), br, [0.25, yb + rb - 0.08, 0]);
      // válvulas de seguridad y silbato
      k.cyl(br, 0.05, 0.3, 'y', -3.9, 3.0, 0.12, 12); k.cyl(br, 0.05, 0.3, 'y', -3.9, 3.0, -0.12, 12);
      k.cyl(br, 0.04, 0.35, 'y', -3.5, 3.0, 0, 12);
      k.build(pB.group); ks.build(pB.group);
    }

    // 7 — Quitapiedras (pilot), faro y campana
    const pP = M.part('quitapiedras', { explode: [1.3, 0, 0] });
    {
      const k = new Kit(); const rd = pP.m('red');
      const x0 = 2.72, tip = 4.35, h = 0.95;
      for (let i = -5; i <= 5; i++) {
        const z = i * 0.13;
        k.bar(rd, [x0, h, z], [tip - Math.abs(i) * 0.14, 0.09, z * 0.15], 0.05, 0.05);
      }
      k.bar(rd, [x0, h, -0.75], [tip - 0.7, 0.09, -0.12], 0.06, 0.06); k.bar(rd, [x0, h, 0.75], [tip - 0.7, 0.09, 0.12], 0.06, 0.06);
      k.box(pP.m('wood'), 0.14, 0.2, 1.6, x0, h, 0);
      // faro de caja (lámpara de aceite con reflector)
      k.box(pP.m('black'), 0.75, 0.62, 0.58, 2.55, yb + rb + 0.42, 0);
      k.add(G.lathe([[0.001, 0], [0.26, 0], [0.18, -0.12], [0.001, -0.14]], 20), pP.m('glass'), [2.94, yb + rb + 0.42, 0], [0, 0, Math.PI / 2]);
      k.add(G.cyl(0.01, 0.28, 4, 0.38), pP.m('black'), [2.55, yb + rb + 0.86, 0]);
      // campana
      k.add(G.lathe([[0.001, 0.36], [0.06, 0.36], [0.13, 0.2], [0.16, 0.02], [0.19, 0], [0.001, 0]], 20), pP.m('brass'), [0.95, yb + rb + 0.12, 0]);
      k.box(pP.m('black'), 0.08, 0.5, 0.5, 0.95, yb + rb + 0.15, 0);
      k.build(pP.group);
    }

    // 8 — Cabina de madera
    const pK = M.part('cabina', { explode: [-0.4, 1.0, 0] });
    {
      const k = new Kit(); const wd = pK.m('wood', { shell: true }), wl = pK.m('woodL');
      const cx0 = -5.35, cx1 = -3.55, y0 = 1.45, y1 = 3.45, hw = 1.05;
      for (const s of [1, -1]) {
        k.box(wd, cx1 - cx0, 0.75, 0.06, (cx0 + cx1) / 2, y0 + 0.38, s * hw);
        k.box(wd, 0.2, y1 - y0, 0.06, cx0 + 0.1, (y0 + y1) / 2, s * hw);
        k.box(wd, 0.2, y1 - y0, 0.06, cx1 - 0.1, (y0 + y1) / 2, s * hw);
        k.box(wd, 0.16, y1 - y0, 0.06, (cx0 + cx1) / 2, (y0 + y1) / 2, s * hw);
        k.box(wl, cx1 - cx0, 0.1, 0.07, (cx0 + cx1) / 2, y0 + 0.78, s * hw);
        k.box(wd, cx1 - cx0, 0.25, 0.06, (cx0 + cx1) / 2, y1 - 0.12, s * hw);
      }
      k.box(wd, 0.06, 0.6, 2.1, cx1, y1 - 0.4, 0);
      { const Rr = 1.7, al = Math.asin(1.2 / Rr);
        const roof = new T.CylinderGeometry(Rr, Rr, cx1 - cx0 + 0.45, 28, 1, true, -al, 2 * al);
        k.add(roof, pK.m('green'), [(cx0 + cx1) / 2 - 0.1, y1 + 0.18 - Rr, 0], [-Math.PI / 2, Math.PI / 2, 0, 'YXZ']); }
      k.box(pK.m('wood'), cx1 - cx0, 0.08, 2.2, (cx0 + cx1) / 2, y0, 0);
      k.build(pK.group);
    }

    // 9 — Ténder de leña (agua en tanque en "U")
    const pR = M.part('tender', { explode: [-1.6, 0, 0] });
    const tWheels = [];
    {
      const k = new Kit(); const rd = pR.m('red', { shell: true }), ir = pR.m('iron');
      const tx0 = -11.05, tx1 = -5.75, ty = 1.12;
      k.box(pR.m('wood'), tx1 - tx0, 0.2, 2.3, (tx0 + tx1) / 2, ty, 0);
      // tanque en U
      for (const s of [1, -1]) k.box(rd, tx1 - tx0 - 0.3, 1.1, 0.5, (tx0 + tx1) / 2 - 0.15, ty + 0.65, s * 0.9);
      k.box(rd, 0.9, 1.1, 2.3, tx0 + 0.6, ty + 0.65, 0);
      k.box(pR.m('brass'), tx1 - tx0 - 0.3, 0.05, 0.52, (tx0 + tx1) / 2 - 0.15, ty + 1.22, 0.9);
      k.box(pR.m('brass'), tx1 - tx0 - 0.3, 0.05, 0.52, (tx0 + tx1) / 2 - 0.15, ty + 1.22, -0.9);
      // leños
      for (let i = 0; i < 46; i++) {
        const x = tx1 - 0.6 - (i % 8) * 0.48, y = ty + 0.25 + Math.floor(i / 8) * 0.17, z = ((i * 37) % 9 - 4) * 0.1;
        k.cyl(pR.m('log'), 0.08, 0.95, 'z', x, y, z, 7);
        k.cyl(pR.m('logEnd'), 0.075, 0.97, 'z', x, y, z, 7);
      }
      k.build(pR.group);
      for (const x of [-6.7, -8.0, -8.85, -10.15]) {
        const w = wheelset({ R: Rt, gauge: g, tread: 0.12, type: 'spoke', spokes: 8, hubR: 0.08, m: { tyre: pR.m('tyre'), body: ir, hub: ir, axle: ir } });
        w.group.position.set(x, Rt, 0); pR.group.add(w.group); tWheels.push(w.group);
      }
      const kk = new Kit();
      for (const xc of [-7.35, -9.5]) for (const s of [1, -1]) { kk.box(ir, 1.6, 0.12, 0.08, xc, 0.55, s * 0.95); kk.box(ir, 0.3, 0.3, 0.1, xc, 0.42, s * 0.95); }
      kk.build(pR.group);
    }

    M.anim.push((s) => {
      const th = -s / R;
      drivers.forEach(d => (d.rotation.z = th));
      truckWheels.forEach(w => (w.rotation.z = -s / Rt));
      tWheels.forEach(w => (w.rotation.z = -s / Rt));
      for (const sd of sides) {
        const pin = pinPos(A, r, th + sd.phase);
        const xc = sliderCrank(A, u, pin, L);
        const C = [A[0] + u[0] * xc, A[1] + u[1] * xc];
        sd.cross.position.x = C[0]; sd.cross.position.y = C[1];
        sd.piston.position.x = A[0] + u[0] * (xc + pr); sd.piston.position.y = A[1] + u[1] * (xc + pr);
        placeRod(sd.mrod, pin, C);
      }
      for (const c of cRods) { const a = pinPos([xD2, R], r, th + c.phase); const b = pinPos([xD1, R], r, th + c.phase); placeRod(c.cr, a, b); }
      for (const e of ecc) {
        e.eg.rotation.z = th;
        const lead = e.s > 0 ? 0 : Math.PI / 2;
        const p1 = pinPos(A, 0.07, th + lead + Math.PI / 2 + 0.5), p2 = pinPos(A, 0.07, th + lead - Math.PI / 2 - 0.5);
        const lx = e.link.position.x;
        placeRod(e.eRod1, p1, [lx - 0.02, A[1] + 0.25]); placeRod(e.eRod2, p2, [lx - 0.02, A[1] - 0.15]);
        e.link.rotation.z = Math.sin(th + lead) * 0.05;
      }
    });
    M.update(0, 0);

    // flujos: gases calientes y vapor
    M.flow([[-3.9, 1.25, 0], [-3.9, 1.8, 0], [-3.2, 1.95, 0], [1.4, 1.95, 0], [1.95, 2.2, 0], [1.95, 4.3, 0]], '#ff8a3d', { r: 0.06 });
    M.flow([[-1.6, yb + rb + 0.4, 0], [-1.6, yb + 0.3, 0], [1.6, yb + 0.1, 0], [1.6, 1.42, 0.6], [1.6, 1.42, zRod], [1.95, 1.3, zRod], [1.95, yb - 0.2, 0.2], [1.95, 4.0, 0]], '#bfe6ff', { r: 0.04, speed: 1.4 });

    M.finalize();
    M.len = 15.45; M.center = -3.35;
    M.cam = { pos: [9.5, 5.2, 13.5], target: [-2.6, 1.6, 0] };
    M.env = { gauge: g, track: { style: 'wood', railScale: 0.62, sleeperColor: '#5b4634', pitch: 0.75, sleeperL: g + 1.0, ballast: ['#8a5a3a', '#5a3a26'] } };
    M.wheelR = R;
    return M;
  };
})();
