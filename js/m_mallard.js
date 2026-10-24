/* LNER A4 4468 "Mallard" (Doncaster, 1938) — 4-6-2 de tres cilindros, carenado aerodinámico, escape doble Kylchap */
(function () {
  const { T, Kit, G, wheelset, rod, placeRod, loft, ringOpen, stations, ease } = TB;
  const { Model, sliderCrank, pinPos, steamCyl, puff, fireFx, fireLight } = MB;

  function circ2(P, r1, Q, r2, pickLow) { // intersección de circunferencias; devuelve el punto inferior (o superior)
    const dx = Q[0] - P[0], dy = Q[1] - P[1], d = Math.hypot(dx, dy);
    const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
    const h = Math.sqrt(Math.max(0, r1 * r1 - a * a));
    const mx = P[0] + a * dx / d, my = P[1] + a * dy / d;
    const s1 = [mx + h * dy / d, my - h * dx / d], s2 = [mx - h * dy / d, my + h * dx / d];
    return (s1[1] < s2[1]) === pickLow ? s1 : s2;
  }

  MODELS.mallard = function () {
    const M = new Model('mallard', {
      blue: ['#1b4583', { r: 0.42, m: 0.1 }], black: ['#151617', { r: 0.45 }], red: ['#7d1d1b', { r: 0.45 }], redLine: ['#b3261e', { r: 0.4 }],
      steel: ['#b4b9be', { r: 0.25, m: 0.9 }], iron: ['#35373a', { r: 0.5, m: 0.6 }], tyre: ['#2b2c2e', { r: 0.4, m: 0.75 }],
      lag: ['#8c8478', { r: 0.8 }], copper: ['#b8693d', { r: 0.35, m: 0.85 }], tube: ['#8f6a4a', { r: 0.45, m: 0.6 }],
      fire: ['#ff7a2e', { r: 0.6, em: '#ff5a10', ei: 1.3 }], glass: ['#24323b', { r: 0.06, m: 0.6 }], brass: ['#c99a3c', { r: 0.25, m: 0.9 }],
      grey: ['#55595d', { r: 0.4, m: 0.6 }], coal: ['#1e1d1b', { r: 1, flat: true }],
    });
    const g = 1.435, R = 1.016, Rl = 0.4825, Rt = 0.559, Rten = 0.635;
    const XD = [1.30, -0.91, -3.12], XB = [5.95, 4.05], XT = -4.95;
    const zRod = TB.zRod(g, 0.14);
    const yb = 2.85;
    const A2 = [XD[1], R], A1 = [XD[0], R];
    const uo = (() => { const v = [4.46, 0.234]; const l = Math.hypot(...v); return [v[0] / l, v[1] / l]; })();
    const ui = [Math.cos(0.124), Math.sin(0.124)]; // 1 en 8
    const r = 0.33, Lo = 3.5, Li = 2.0, pro = 1.05, pri = 1.0;
    const PH = { R: 0, I: 2 * Math.PI / 3, L: 4 * Math.PI / 3 };

    // 1 — Carenado aerodinámico (cuña) con faldones
    const pC = M.part('carenado', { explode: [0, 2.6, 0] });
    {
      const bl = pC.m('blue', { shell: true });
      const body = { x: -6.35, w: 1.37, ym: 1.48, yt: 3.92, yb: 1.02, nT: 2.4 };
      const keys = [ { ...body }, { ...body, x: 3.4 } ];
      const st = stations(keys, 2);
      for (let i = 1; i <= 22; i++) {
        const t = i / 22, x = 3.4 + t * 3.55;
        st.push({ x, w: 1.37 * (1 - 0.7 * Math.pow(t, 2.1)), ym: 1.48, yt: 3.92 - 2.3 * Math.pow(t, 1.45), yb: 1.02 + 0.46 * Math.pow(t, 1.8), nT: 2.4 - 0.7 * t });
      }
      const geo = loft(st, 56, [false, true], ringOpen, false);
      const k = new Kit(); k.add(geo, bl);
      // línea roja sobre el faldón y faldón negro inferior frontal
      const st2 = st.map(s => ({ ...s, yt: s.ym + 0.04, yb: s.ym - 0.02 }));
      // franja (dos tiras laterales)
      for (const sgn of [1, -1]) {
        const pts = st.filter((_, i) => i % 1 === 0).map(s => [s.x, s.ym + 0.05, sgn * (s.w + 0.006)]);
        k.add(G.poly(pts, 0.022, 6), pC.m('redLine'));
      }
      // aberturas del doble Kylchap (óvalos oscuros) y ventanas de cabina
      for (const x of [2.55, 3.2]) k.add(G.cyl(0.24, 0.05, 20), pC.m('black'), [x, 3.92, 0], [0, 0, 0], [1.25, 1, 0.8]);
      for (const sgn of [1, -1]) {
        k.box(pC.m('glass'), 0.62, 0.55, 0.02, -5.0, 3.15, sgn * 1.235);
        k.box(pC.m('glass'), 0.45, 0.55, 0.02, -5.8, 3.15, sgn * 1.235);
        k.box(pC.m('glass'), 0.02, 0.5, 0.55, -4.5, 3.25, sgn * 0.75, 0, sgn * 0.6, 0);
      }
      // techo de cabina abierto atrás y piso
      k.box(pC.m('black'), 1.9, 0.06, 2.6, -5.4, 1.5, 0);
      k.build(pC.group);
    }

    // 2 — Escape doble Kylchap y caja de humos
    const pK = M.part('kylchap', { explode: [1.2, 1.2, 0] });
    {
      const k = new Kit(), ks = new Kit();
      const sb = pK.m('iron', { shell: true });
      ks.add(G.cyl(0.9, 1.4, 40, 0.9, true), sb, [3.1, yb, 0], [0, 0, Math.PI / 2]);
      ks.cyl(sb, 0.9, 0.04, 'x', 3.8, yb, 0, 40);
      for (const x of [2.55, 3.2]) {
        // chimenea con "petticoat" y tobera de cuatro boquillas + difusor Kylälä
        k.add(G.lathe([[0.2, 0], [0.24, 0.3], [0.21, 0.6], [0.24, 0.92]], 24), pK.m('grey'), [x, yb + 0.15, 0]);
        k.add(G.lathe([[0.32, 0], [0.24, 0.35]], 24), pK.m('grey'), [x, yb - 0.25, 0]);
        k.add(G.cyl(0.12, 0.6, 16, 0.09), pK.m('steel'), [x, yb - 0.75, 0]);
        for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; k.add(G.box(0.05, 0.22, 0.12), pK.m('steel'), [x + Math.cos(a) * 0.1, yb - 0.38, Math.sin(a) * 0.1], [0, a, 0]); }
        k.add(G.cyl(0.035, 0.25, 10, 0.12), pK.m('steel'), [x, yb - 0.45, 0]);
      }
      k.seg(pK.m('iron'), [2.55, yb - 1.05, 0], [3.2, yb - 1.05, 0], 0.12, 12);
      // regulador y tubo de vapor recalentado
      k.add(G.poly([[2.1, yb + 0.5, 0], [3.8, yb + 0.5, 0.2], [3.8, 1.6, 0.6], [3.7, 1.6, zRod]], 0.07, 8), pK.m('copper'));
      k.build(pK.group); ks.build(pK.group);
    }

    // 3 — Caldera cónica (250 psi), hogar ancho y cámara de combustión
    const pB = M.part('caldera', { explode: [0, 0.9, -1.6] });
    {
      const k = new Kit(), ks = new Kit();
      const lg = pB.m('lag', { shell: true });
      ks.add(G.cyl(0.98, 4.6, 40, 0.88, true), lg, [0.1, yb, 0], [0, 0, Math.PI / 2]);
      for (let x = -1.9; x < 2.4; x += 0.75) ks.add(G.torus(0.93, 0.012, 6, 40), pB.m('steel', { shell: true }), [x, yb, 0], [0, Math.PI / 2, 0]);
      // hogar ancho tipo Wootten sobre el bisel trasero
      ks.box(lg, 2.6, 1.6, 0.02, -3.5, 2.2, 0.95); ks.box(lg, 2.6, 1.6, 0.02, -3.5, 2.2, -0.95);
      ks.add(G.cyl(0.95, 2.6, 32, 0.95, true), lg, [-3.5, 3.0, 0], [0, 0, Math.PI / 2], [1, 0.6, 1]);
      ks.box(lg, 0.02, 2.0, 1.9, -4.8, 2.4, 0);
      // interior: caja de fuego, emparrillado, tubos y tubos de recalentador
      k.box(pB.m('copper'), 2.2, 1.5, 1.6, -3.5, 2.4, 0);
      k.box(pB.m('iron'), 2.2, 0.04, 1.8, -3.5, 1.6, 0);
      k.add(G.sph(0.5, 12, 8), pB.m('fire'), [-3.5, 1.8, 0], [0, 0, 0], [2, 0.5, 1.6]);
      for (let i = -6; i <= 6; i++) for (let j = -5; j <= 3; j++) {
        const z = i * 0.11, y = yb + j * 0.11; if (z * z + (y - yb) ** 2 > 0.78 * 0.78) continue;
        const big = j >= 1 && Math.abs(i) <= 4 && (i + j) % 2 === 0;
        k.cyl(pB.m('tube'), big ? 0.052 : 0.028, 4.5, 'x', 0.1, y, z, 6, big ? 0.052 : 0.028, true);
      }
      // válvulas de seguridad y domo
      k.cyl(pB.m('brass'), 0.07, 0.25, 'y', -2.4, 3.95, 0.15, 14); k.cyl(pB.m('brass'), 0.07, 0.25, 'y', -2.4, 3.95, -0.15, 14);
      k.build(pB.group); ks.build(pB.group);
    }

    // 4 — Tres cilindros 18½ × 26 in con bielas
    const pY = M.part('cilindros', { explode: [0.6, 0, 1.7] });
    const cyls = [];
    const P = M.addParticles(pK.group, { count: 1400, c0: '#f1f0ec', c1: '#7f7d79', grow: 3.2, rise: 0.7, opacity: 0.5 });
    const tops = [[2.55, 3.95, 0], [3.2, 3.95, 0]];
    let tk = 0;
    const perBeat = () => Math.max(2, Math.min(8, Math.round(54 / Math.max(1, M.vNow / (Math.PI * 2 * R) * 6))));
    M.initSteam({ pB: 17.2, cut: 0.25, Rw: R, onBeat: () => { tk = (tk + 1) % 2; puff(P, tops[tk], M.vNow, M.tSim, { n: perBeat(), up: 3.0 + M.vNow * 0.1, life: 2.2, size: 0.4, rx: 0.3, rz: 0.25 }); } });
    function makeCyl(grp, A, u, L, pr, z, phase, d0, d1, shell) {
      const k = new Kit();
      const c0 = [A[0] + u[0] * d0, A[1] + u[1] * d0], c1 = [A[0] + u[0] * d1, A[1] + u[1] * d1];
      k.seg(pY.m(shell ? 'blue' : 'iron', shell ? { shell: true } : {}), [c0[0], c0[1], z], [c1[0], c1[1], z], 0.33, 32);
      k.seg(pY.m('iron'), [c0[0] - 0.03, c0[1], z], [c0[0] + 0.03, c0[1], z], 0.35, 32);
      k.seg(pY.m('iron'), [c1[0] - 0.03, c1[1], z], [c1[0] + 0.03, c1[1], z], 0.35, 32);
      for (const dn of [-0.16, 0.16]) k.seg(pY.m('steel'), [A[0] + u[0] * (L - 0.6), A[1] + u[1] * (L - 0.6) + dn, z], [c0[0], c0[1] + dn, z], 0.025, 6);
      k.build(grp);
      const pk = new Kit(); pk.cyl(pY.m('steel'), 0.23, 0.1, 'x', 0, 0, 0, 24); pk.cyl(pY.m('steel'), 0.045, pr, 'x', -pr / 2, 0, 0, 10);
      const piston = new T.Group(); pk.build(piston); piston.rotation.z = Math.atan2(u[1], u[0]); piston.position.z = z; grp.add(piston);
      const ck = new Kit(); ck.box(pY.m('steel'), 0.32, 0.26, 0.16, 0, 0, 0); ck.box(pY.m('steel'), 0.06, 0.32, 0.06, 0.05, -0.28, 0);
      const cross = new T.Group(); ck.build(cross); cross.rotation.z = Math.atan2(u[1], u[0]); cross.position.z = z; grp.add(cross);
      const mrod = rod(pY.m('steel'), L, 0.16, 0.07, 0.12, pY.m('iron')); mrod.position.z = z + Math.sign(z || 1) * 0.07; grp.add(mrod);
      if (!cyls.length) { piston.name = 'M.piston'; cross.name = 'M.cross'; mrod.name = 'M.biela'; } else if (z === 0) piston.name = 'M.pistonI';
      const c = { A, u, L, pr, piston, cross, mrod, phase };
      cyls.push(c);
      steamCyl(M, grp, { src: c, A, u, L, r, pr, pt: 0.05, d0, d1, bore: 0.235, z });
    }
    for (const s of [1, -1]) makeCyl(pY.group, A2, uo, Lo, pro, s * zRod, s > 0 ? PH.R : PH.L, 4.15, 5.0, true);
    makeCyl(pY.group, A1, ui, Li, pri, 0.0, PH.I, 2.58, 3.42, false);

    // 5 — Distribución Walschaerts (exterior) y conjugada Gresley 2:1 (interior)
    const pV = M.part('valvulas', { explode: [0.4, 0.7, 2.4] });
    const vg = [];
    const PV = [1.05, 1.95], lf = 0.42, re = 0.23; let dDie = 0.12;
    M.onCutoff = (c) => { dDie = 0.035 + 0.23 * c; };
    M.onCutoff(0.25);
    const yT = 1.256 + 0.55, aL = 0.14, xB0 = 0.25;
    const Le = Math.hypot(PV[0] - A2[0], PV[1] - lf - A2[1]);
    const xC0 = A2[0] + Lo * uo[0];
    const xT0 = 2.86, Lr = (xT0 - aL / 1.0 * 0) - (PV[0]);
    const yRp = yT - aL, yB = 1.256 - 0.06 - 0.3, bL = yRp - yB;
    const vx0 = 3.66; // centro de la caja de válvulas
    {
      for (const s of [1, -1]) {
        const z = s * (zRod + 0.2);
        const grp = new T.Group(); pV.group.add(grp);
        const k = new Kit();
        // caja de válvulas (sobre el cilindro) y soporte del sector
        k.seg(pV.m('blue', { shell: true }), [3.25, yT, s * zRod], [4.1, yT, s * zRod], 0.16, 20);
        k.box(pV.m('iron'), 0.12, 0.7, 0.1, PV[0], PV[1] - 0.05, z - s * 0.08);
        k.build(grp);
        const mk = (len, h, t) => { const o = rod(pV.m('steel'), len, h, t, h * 0.6); o.position.z = z; grp.add(o); return o; };
        const link = new T.Group(); const lk = new Kit();
        lk.add(G.torus(1.9, 0.03, 6, 10, 0.34), pV.m('steel'), [-1.9, 0, 0], [0, 0, -0.17]);
        lk.cyl(pV.m('iron'), 0.05, 0.12, 'z', 0, 0, 0, 12);
        lk.build(link); link.position.set(PV[0], PV[1], z); grp.add(link);
        const eccRod = mk(Le, 0.07, 0.035);
        const radRod = mk(Lr, 0.06, 0.035);
        const comb = mk(1.0, 0.06, 0.035);
        const union = mk(0.3, 0.05, 0.03);
        const spindle = new T.Group(); const sk = new Kit(); sk.cyl(pV.m('steel'), 0.025, 0.9, 'x', 0.45, 0, 0, 8); sk.cyl(pV.m('steel'), 0.13, 0.08, 'x', 0.9, 0, 0, 16); sk.cyl(pV.m('steel'), 0.13, 0.08, 'x', 1.2, 0, 0, 16); sk.cyl(pV.m('steel'), 0.025, 1.25, 'x', 1.6, 0, 0, 8);
        sk.build(spindle); spindle.position.set(0, yT, s * zRod); grp.add(spindle);
        const ret = new T.Group(); const rk = new Kit(); rk.box(pV.m('steel'), re + 0.06, 0.08, 0.05, (re) / 2, 0, 0); rk.build(ret); ret.position.z = z - s * 0.06; grp.add(ret);
        const die = new T.Group(); const dk = new Kit(); dk.box(pV.m('brass'), 0.07, 0.11, 0.07, 0, 0, 0); dk.build(die); grp.add(die);
        // válvula de pistón dentro de la caja (visible con rayos X o corte)
        if (s > 0) { die.name = 'M.die'; comb.name = 'M.comb'; eccRod.name = 'M.ecc'; radRod.name = 'M.radius'; }
        vg.push({ s, z, link, eccRod, radRod, comb, union, spindle, ret, die, phase: s > 0 ? PH.R : PH.L, dx: 0 });
      }
      // conjugada 2:1 (delante de las cajas de válvulas, plano horizontal)
      const xf = 5.5, yc = yT;
      const cg = new T.Group(); pV.group.add(cg);
      const lever21 = new T.Group(), lever11 = new T.Group();
      const k1 = new Kit(); k1.box(pV.m('steel'), 0.08, 0.1, 1.45, 0, 0, 0); k1.build(lever21);
      const k2 = new Kit(); k2.box(pV.m('steel'), 0.07, 0.09, 1.0, 0, 0, 0); k2.build(lever11);
      cg.add(lever21); cg.add(lever11);
      const fk = new Kit(); fk.cyl(pV.m('iron'), 0.06, 0.4, 'y', xf, yc - 0.1, 0, 12); fk.box(pV.m('iron'), 0.3, 0.06, 0.3, xf + 0.15, yc - 0.3, 0); fk.build(cg);
      // válvula interior
      const vi = new T.Group(); const vk = new Kit(); vk.seg(pV.m('iron'), [3.0, yT + 0.05, 0], [4.0, yT + 0.05, 0], 0.15, 18); vk.build(vi); cg.add(vi);
      const ivalve = new T.Group(); const ik = new Kit(); ik.cyl(pV.m('steel'), 0.12, 0.08, 'x', 0, 0, 0, 16); ik.cyl(pV.m('steel'), 0.12, 0.08, 'x', 0.3, 0, 0, 16); ik.cyl(pV.m('steel'), 0.025, 2.0, 'x', 1.0, 0, 0, 8); ik.build(ivalve); ivalve.position.set(3.35, yT + 0.05, 0); cg.add(ivalve);
      lever21.name = 'M.conj'; ivalve.name = 'M.ivalve';
      M._conj = { lever21, lever11, ivalve, xf, yc };
    }

    // 6 — Ruedas motrices 6 ft 8 in, bielas de acoplamiento y eje acodado
    const pW = M.part('ruedas', { explode: [0, -0.35, 1.3] });
    const drivers = [], cpl = [];
    {
      XD.forEach((x, i) => {
        const w = wheelset({ R, gauge: g, tread: 0.14, type: 'spoke', spokes: 20, hubR: 0.2, crankR: r, phaseR: PH.R, phaseL: PH.L, pinL: 0.24, bossR: 0.11,
          m: { tyre: pW.m('tyre'), body: pW.m('red'), hub: pW.m('red'), pin: pW.m('steel'), axle: pW.m('iron'), cw: pW.m('red') } });
        w.group.position.set(x, R, 0); pW.group.add(w.group); drivers.push(w.group);
        if (i === 0) { // eje acodado para el cilindro interior
          const ck = new Kit();
          const a = PH.I;
          ck.box(pW.m('steel'), 0.12, r + 0.25, 0.12, Math.cos(a) * r / 2, Math.sin(a) * r / 2, 0.14, 0, 0, a + Math.PI / 2);
          ck.box(pW.m('steel'), 0.12, r + 0.25, 0.12, Math.cos(a) * r / 2, Math.sin(a) * r / 2, -0.14, 0, 0, a + Math.PI / 2);
          ck.cyl(pW.m('steel'), 0.09, 0.3, 'z', Math.cos(a) * r, Math.sin(a) * r, 0, 16);
          ck.build(w.group);
        }
      });
      for (const s of [1, -1]) {
        const ph = s > 0 ? PH.R : PH.L;
        const a = rod(pW.m('steel'), XD[0] - XD[1], 0.13, 0.06, 0.1); a.position.z = s * (zRod - 0.0); pW.group.add(a);
        const b = rod(pW.m('steel'), XD[1] - XD[2], 0.13, 0.06, 0.1); b.position.z = s * (zRod - 0.0); pW.group.add(b);
        cpl.push({ a, b, ph }); if (s > 0) a.name = 'M.acopl';
      }
    }

    // 7 — Rodaje: bogie delantero, bisel trasero Cartazzi y bastidor de placas
    const pR = M.part('rodaje', { explode: [0, -0.7, 0] });
    const small = [];
    {
      const k = new Kit(); const ir = pR.m('iron');
      for (const x of XB) { const w = wheelset({ R: Rl, gauge: g, tread: 0.13, type: 'disc', hubR: 0.1, m: { tyre: pR.m('tyre'), body: pR.m('red'), hub: pR.m('red'), axle: ir } }); w.group.position.set(x, Rl, 0); pR.group.add(w.group); small.push({ g: w.group, R: Rl }); }
      const wt = wheelset({ R: Rt, gauge: g, tread: 0.13, type: 'spoke', spokes: 12, hubR: 0.1, m: { tyre: pR.m('tyre'), body: pR.m('red'), hub: pR.m('red'), axle: ir } }); wt.group.position.set(XT, Rt, 0); pR.group.add(wt.group); small.push({ g: wt.group, R: Rt });
      for (const s of [1, -1]) {
        k.add(G.extrude([[6.55, 0.62], [-5.6, 0.62], [-5.6, 1.45], [6.55, 1.45]], 0.035), ir, [0, 0, s * 0.62]);
        k.box(ir, 2.5, 0.12, 0.08, (XB[0] + XB[1]) / 2, 0.68, s * 0.75);
        for (const x of XB) k.box(ir, 0.3, 0.3, 0.12, x, Rl + 0.05, s * 0.75);
        k.box(ir, 0.35, 0.35, 0.14, XT, Rt + 0.05, s * 0.75);
        for (const x of XD) { k.box(ir, 0.36, 0.48, 0.16, x, R + 0.02, s * 0.62); }
      }
      k.cyl(pR.m('steel'), 0.18, 0.2, 'y', (XB[0] + XB[1]) / 2, 0.82, 0, 18);
      k.box(pR.m('red'), 0.25, 0.5, 2.6, 6.7, 1.15, 0);
      for (const s of [1, -1]) { k.cyl(ir, 0.1, 0.45, 'x', 6.95, 1.06, s * 0.88, 14); k.cyl(pR.m('steel'), 0.2, 0.05, 'x', 7.17, 1.06, s * 0.88, 20); }
      k.build(pR.group);
    }

    // 8 — Ténder de 8 ruedas (sin pasillo, configuración de 1938)
    const pT = M.part('tender', { explode: [-2.2, 0, 0] });
    const tw = [];
    {
      const k = new Kit();
      const st = [{ x: -14.75, w: 1.37, ym: 1.48, yt: 3.62, yb: 1.0, nT: 7 }, { x: -6.65, w: 1.37, ym: 1.48, yt: 3.62, yb: 1.0, nT: 7 }];
      k.add(loft(stations(st, 6), 48, [false, false], ringOpen, false), pT.m('blue', { shell: true }));
      k.box(pT.m('blue', { shell: true }), 0.04, 2.5, 2.74, -14.74, 2.35, 0);
      k.box(pT.m('blue', { shell: true }), 0.04, 2.5, 2.74, -6.66, 2.35, 0);
      for (const sgn of [1, -1]) k.add(G.poly([[-14.7, 1.53, sgn * 1.376], [-6.7, 1.53, sgn * 1.376]], 0.022, 6), pT.m('redLine'));
      // carbón y tanque
      k.box(pT.m('iron'), 3.2, 1.6, 2.5, -8.4, 2.2, 0);
      for (let i = 0; i < 40; i++) k.add(G.sph(0.18 + (i % 4) * 0.04, 6, 5), pT.m('coal'), [-7.0 - (i % 8) * 0.38, 3.0 + Math.floor(i / 8) * 0.08, -1.0 + ((i * 7) % 11) * 0.2]);
      k.box(pT.m('blue'), 4.6, 1.9, 2.6, -12.2, 2.0, 0);
      const ir = pT.m('iron');
      for (const s of [1, -1]) k.add(G.extrude([[-14.6, 0.6], [-6.8, 0.6], [-6.8, 1.3], [-14.6, 1.3]], 0.035), ir, [0, 0, s * 0.7]);
      k.box(pT.m('red'), 0.2, 0.45, 2.6, -14.85, 1.1, 0);
      k.build(pT.group);
      for (const x of [-7.9, -9.5, -11.4, -13.0]) { const w = wheelset({ R: Rten, gauge: g, tread: 0.13, type: 'spoke', spokes: 12, hubR: 0.1, m: { tyre: pT.m('tyre'), body: pT.m('red'), hub: pT.m('red'), axle: ir } }); w.group.position.set(x, Rten, 0); pT.group.add(w.group); tw.push(w.group); }
    }

    // ----- Animación -----
    const lerp = (a, b, t) => a + (b - a) * t;
    M.anim.push((s) => {
      const th = -s / R;
      drivers.forEach(d => (d.rotation.z = th));
      small.forEach(w => (w.g.rotation.z = -s / w.R));
      tw.forEach(w => (w.rotation.z = -s / Rten));
      const cross = {};
      cyls.forEach((c, i) => {
        const pin = pinPos(c.A, r, th + c.phase);
        const xc = sliderCrank(c.A, c.u, pin, c.L);
        c.xc = xc; c.phi = th + c.phase;
        const C = [c.A[0] + c.u[0] * xc, c.A[1] + c.u[1] * xc];
        c.cross.position.x = C[0]; c.cross.position.y = C[1];
        c.piston.position.x = c.A[0] + c.u[0] * (xc + c.pr); c.piston.position.y = c.A[1] + c.u[1] * (xc + c.pr);
        placeRod(c.mrod, pin, C);
        cross[i] = C;
      });
      cpl.forEach(c => {
        placeRod(c.a, pinPos([XD[1], R], r, th + c.ph), pinPos([XD[0], R], r, th + c.ph));
        placeRod(c.b, pinPos([XD[2], R], r, th + c.ph), pinPos([XD[1], R], r, th + c.ph));
      });
      const dxs = {};
      vg.forEach((v, i) => {
        const pin = pinPos(A2, r, th + v.phase);
        const E = pinPos(A2, re, th + v.phase - Math.PI / 2);
        v.ret.position.x = pin[0]; v.ret.position.y = pin[1]; v.ret.rotation.z = Math.atan2(E[1] - pin[1], E[0] - pin[0]);
        const F = circ2(PV, lf, E, Le, true);
        const psi = Math.atan2(F[0] - PV[0], -(F[1] - PV[1]));
        v.link.rotation.z = psi;
        const D = [PV[0] - dDie * Math.sin(psi), PV[1] + dDie * Math.cos(psi)];
        if (v.die) { v.die.position.set(D[0], D[1], v.z); v.die.rotation.z = psi; }
        placeRod(v.eccRod, E, F);
        const C = cross[i];
        const xB = C[0] + xB0, Rp = [D[0] + Lr, yRp];
        const xT = Rp[0] + (aL / bL) * (Rp[0] - xB);
        placeRod(v.radRod, D, Rp);
        placeRod(v.comb, [xB, yB], [xT, yT]);
        placeRod(v.union, [C[0], C[1] - 0.3], [xB, yB]);
        v.spindle.position.x = xT;
        v.dx = xT - xT0; dxs[v.s] = v.dx;
      });
      const cj = M._conj; if (cj) {
        const dL = dxs[-1] || 0, dR = dxs[1] || 0, dI = -(dL + dR);
        cj.lever21.position.set(cj.xf - dL / 4, cj.yc, -0.24); cj.lever21.rotation.y = Math.atan2(dL * 1.5, 1.45);
        cj.lever11.position.set(cj.xf + (dR + dI) / 2 - 0.25, cj.yc, 0.475); cj.lever11.rotation.y = Math.atan2(dR - dI, 0.95);
        cj.ivalve.position.x = 3.35 + dI;
      }
    });
    M.update(0, 0);

    fireFx(M, [pB.m('fire')], fireLight(M, [-3.5, 2.0, 0], 3.2), 1.3);
    { let acc = 0; M.fx.push((t, dt, v) => { if (!M.powered || dt <= 0) return; acc += dt * 6; while (acc > 1) { acc--; const tp = tops[Math.random() < 0.5 ? 0 : 1]; P.emit([tp[0] + (Math.random() - 0.5) * 0.2, tp[1], (Math.random() - 0.5) * 0.2], [-v * 0.95, 1.0 + Math.random() * 0.8, (Math.random() - 0.5) * 0.3], 2.6, 0.3, t); } }); }
    M.flow([[-3.5, 1.8, 0], [-3.5, 2.6, 0], [-2.2, yb - 0.2, 0], [2.3, yb - 0.2, 0], [2.85, yb - 0.6, 0], [2.85, 4.4, 0]], '#ff8a3d', { r: 0.07 });
    M.flow([[-2.0, yb + 0.6, 0], [2.1, yb + 0.5, 0], [3.8, yb + 0.5, 0.2], [3.8, 1.6, 0.6], [3.66, 1.8, zRod], [3.66, 1.25, zRod], [2.9, yb - 0.5, 0.3], [2.9, 4.3, 0]], '#bfe6ff', { r: 0.05, speed: 1.4 });

    M.finalize();
    M.len = 21.9; M.center = -3.9;
    M.cam = { pos: [9.5, 5.2, 16.5], target: [-2.6, 2.0, 0] };
    M.env = { gauge: g, track: { style: 'wood', sleeperColor: '#4a3a2e', pitch: 0.7, ballast: ['#7d776e', '#4a4640'] } };
    M.wheelR = R;
    return M;
  };
})();
