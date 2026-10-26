/* Union Pacific 4000 «Big Boy» (ALCO, 1941) — 4-8-8-4 articulada de expansión simple, cuatro cilindros 23¾ × 32 in, 300 psi.
   Ruedas, empates, longitudes, caldera y cilindros según la ficha de Union Pacific y la especificación publicada (Railway Age, 1941). */
(function () {
  const { T, Kit, G, wheelset, rod, placeRod } = TB;
  const { Model, sliderCrank, pinPos, steamCyl, puff, fireFx, fireLight } = MB;

  MODELS.bigboy = function () {
    const M = new Model('bigboy', {
      black: ['#18191b', { r: 0.5 }], blackS: ['#18191b', { r: 0.5 }], graph: ['#3b3e42', { r: 0.4, m: 0.5 }], iron: ['#2e3033', { r: 0.5, m: 0.6 }],
      steel: ['#b1b6bb', { r: 0.25, m: 0.9 }], tyre: ['#2b2c2e', { r: 0.4, m: 0.75 }], red: ['#7d1d1b', { r: 0.5 }], brass: ['#c99a3c', { r: 0.25, m: 0.9 }],
      copper: ['#b8693d', { r: 0.35, m: 0.85 }], tube: ['#8f6a4a', { r: 0.45, m: 0.6 }], flue: ['#7a5a40', { r: 0.45, m: 0.6 }],
      fire: ['#ff7a2e', { r: 0.6, em: '#ff5a10', ei: 1.3 }], glass: ['#24323b', { r: 0.06, m: 0.6 }], lamp: ['#fff3c4', { r: 0.2, em: '#ffe9a0', ei: 0.9 }],
      coal: ['#1e1d1b', { r: 1, flat: true }], white: ['#d9d6cf', { r: 0.5 }], silver: ['#9aa0a6', { r: 0.3, m: 0.8 }],
    });
    const g = 1.435, R = 0.8636, Rl = 0.457, Rt = 0.533, Rtd = 0.457;   // 68, 36, 42 in; ténder (estimado)
    const XF = [7.6, 5.72, 3.84, 1.96], XR = [-1.0, -2.88, -4.76, -6.64]; // ejes motores de cada unidad
    const XL = [11.7, 9.9], XT = [-8.9, -10.7];
    const XH = 1.15;                                                     // pivote de la articulación
    const zRod = TB.zRod(g, 0.14);
    const r = 0.8128 / 2, L = 3.9, pr = 1.25, d0 = L - r + pr - 0.13, d1 = L + r + pr + 0.13;
    const yb = 3.15, rb = 1.36, bx0 = -4.8, bx1 = 9.4, sx = 12.7;       // caldera Ø 107 in; pintura grafito en la caja de humos
    const fx0 = -10.77, fx1 = bx0;                                       // hogar 235 in
    const tsR = -1.6, tsF = tsR + 6.71;                                   // placas tubulares: tubos de 22 ft; delante de la trasera, cámara de combustión (estimada)
    const ul = Math.hypot((d0 + d1) / 2, 0.18), u = [((d0 + d1) / 2) / ul, 0.18 / ul];
    const PH = { FR: 0, FL: Math.PI / 2, RR: 0.7, RL: 0.7 + Math.PI / 2 };

    // contenedores móviles para la articulación (giro de la unidad delantera en curva)
    const rigs = [];
    const rig = (part) => { const g2 = new T.Group(); part.group.add(g2); rigs.push(g2); return g2; };

    // 1 — Caldera: barril de 107 in, tubos de 22 ft con recalentador, caja de humos larga con colector y regulador frontal
    const pB = M.part('caldera', { explode: [0, 1.5, 0] });
    {
      const k = new Kit(), ks = new Kit(); const sh = pB.m('blackS', { shell: true }), gr = pB.m('graph', { shell: true });
      ks.add(G.cyl(rb, bx1 - bx0, 48, rb, true), sh, [(bx0 + bx1) / 2, yb, 0], [0, 0, Math.PI / 2]);
      for (let x = bx0 + 0.6; x < bx1; x += 1.6) ks.add(G.torus(rb + 0.008, 0.016, 6, 48), pB.m('silver', { shell: true }), [x, yb, 0], [0, Math.PI / 2, 0]);
      ks.add(G.cyl(rb - 0.02, sx - bx1, 48, rb - 0.02, true), gr, [(bx1 + sx) / 2, yb, 0], [0, 0, Math.PI / 2]);
      ks.cyl(gr, rb - 0.02, 0.05, 'x', sx, yb, 0, 48);
      k.cyl(pB.m('iron'), 0.42, 0.08, 'x', sx + 0.03, yb - 0.1, 0, 28);
      for (const x of [tsR, tsF]) k.cyl(pB.m('iron'), rb - 0.04, 0.03, 'x', x, yb, 0, 48);
      // 184 tubos de humos de 4 in (con elementos del recalentador) arriba y 75 tubos de 2¼ in abajo, 22 ft entre placas
      const len = tsF - tsR - 0.04, xm = (tsR + tsF) / 2;
      let nF = 0, nT = 0;
      for (let y = yb + 0.75; y > yb - 0.4 && nF < 184; y -= 0.125) for (let z = -1.05; z <= 1.05 && nF < 184; z += 0.125) {
        if (z * z + (y - yb) ** 2 > 1.1 * 1.1) continue; k.cyl(pB.m('flue'), 0.051, len, 'x', xm, y, z + ((Math.round((y - yb) / 0.125) & 1) ? 0.0625 : 0), 6, 0.051, true); nF++; }
      for (let y = yb - 0.52; y > yb - 1.05 && nT < 75; y -= 0.085) for (let z = -0.9; z <= 0.9 && nT < 75; z += 0.085) {
        if (z * z + (y - yb) ** 2 > 1.12 * 1.12) continue; k.cyl(pB.m('tube'), 0.0285, len, 'x', xm, y, z, 6, 0.0285, true); nT++; }
      // tubería seca del domo al colector del recalentador, colector y regulador en la caja de humos
      k.cyl(pB.m('steel'), 0.11, tsF + 0.6 - 2.8, 'x', (2.8 + tsF + 0.6) / 2, yb + 1.0, 0, 12);
      k.cyl(pB.m('iron'), 0.2, 2.0, 'z', tsF + 0.55, yb + 0.55, 0, 16);
      k.box(pB.m('iron'), 0.7, 0.5, 0.9, tsF + 1.3, yb + 0.75, 0);
      // domo de vapor y areneros
      k.add(G.lathe([[0.001, 0], [0.55, 0], [0.55, 0.28], [0.42, 0.42], [0.001, 0.46]], 28), pB.m('black'), [2.8, yb + rb - 0.12, 0]);
      for (const x of [5.6, 0.1]) k.add(G.lathe([[0.001, 0], [0.5, 0], [0.5, 0.22], [0.32, 0.36], [0.001, 0.4]], 28), pB.m('black'), [x, yb + rb - 0.12, 0]);
      // pasarelas laterales, faro, placas de número y bombas de aire de doble etapa al frente de la caja de humos
      for (const s of [1, -1]) { k.box(pB.m('black'), 22.5, 0.05, 0.42, 1.2, 1.98, s * 1.47); k.box(pB.m('black'), 22.5, 0.12, 0.03, 1.2, 1.93, s * 1.68); }
      k.add(G.cyl(0.3, 0.45, 20, 0.34), pB.m('black'), [sx + 0.1, yb + 0.75, 0], [0, 0, Math.PI / 2]);
      k.cyl(pB.m('lamp'), 0.25, 0.03, 'x', sx + 0.33, yb + 0.75, 0, 20);
      for (const s of [1, -1]) {
        k.box(pB.m('glass'), 0.03, 0.18, 0.4, sx + 0.06, yb + 0.25, s * 0.6);
        k.cyl(pB.m('graph'), 0.24, 0.8, 'y', sx + 0.32, yb - 0.75, s * 0.95, 18); k.cyl(pB.m('graph'), 0.18, 0.6, 'y', sx + 0.32, yb - 0.05, s * 0.95, 18);
        k.box(pB.m('black'), 0.04, 1.6, 0.62, sx + 0.62, yb - 0.4, s * 0.95);
      }
      k.build(pB.group); ks.build(pB.group);
    }

    // 2 — Hogar de 235 × 96 in con cámara de combustión, parrilla de 150 ft² y alimentador mecánico
    const pF = M.part('hogar', { explode: [-0.7, 1.4, 0] });
    let screw;
    {
      const k = new Kit(), ks = new Kit(); const sh = pF.m('graph', { shell: true });
      const fy0 = 1.55, fy1 = 3.9, hw = 1.22, hwo = rb;   // parrilla de 96 in por dentro; envolvente exterior al ras del barril
      // envolvente de hogar de techo redondo (riostras radiales): costados rectos y bóveda concéntrica con la caldera
      for (const s of [1, -1]) ks.box(sh, fx1 - fx0, yb - fy0, 0.03, (fx0 + fx1) / 2, (fy0 + yb) / 2, s * hwo);
      ks.add(new T.CylinderGeometry(hwo, hwo, fx1 - fx0, 40, 1, true, 0, Math.PI), sh, [(fx0 + fx1) / 2, yb, 0], [0, 0, Math.PI / 2]);
      const plate = (lower) => { const S = new T.Shape(); S.moveTo(-hwo, yb); S.lineTo(-hwo, fy0); S.lineTo(hwo, fy0); S.lineTo(hwo, yb);
        if (lower) S.absarc(0, yb, hwo, 0, -Math.PI, true); else S.absarc(0, yb, hwo, 0, Math.PI, false);
        const geo = new T.ExtrudeGeometry(S, { depth: 0.03, bevelEnabled: false, curveSegments: 24 }); geo.translate(0, 0, -0.015); return geo; };
      ks.add(plate(false), sh, [fx0, 0, 0], [0, Math.PI / 2, 0]);          // placa trasera (backhead)
      ks.add(plate(true), sh, [fx1, 0, 0], [0, Math.PI / 2, 0]);           // placa de garganta bajo el barril
      ks.rivets(sh, [fx0 + 0.1, fy0 + 0.06, hwo + 0.02], [fx1 - 0.1, fy0 + 0.06, hwo + 0.02], 30, 0.014); ks.rivets(sh, [fx0 + 0.1, fy0 + 0.06, -hwo - 0.02], [fx1 - 0.1, fy0 + 0.06, -hwo - 0.02], 30, 0.014);
      // caja de fuego interior, cámara de combustión que avanza dentro del barril y arco de ladrillo
      k.box(pF.m('copper'), fx1 - fx0 - 0.3, fy1 - fy0 - 0.25, 2 * hw - 0.3, (fx0 + fx1) / 2, (fy0 + fy1) / 2 + 0.05, 0);
      k.add(G.cyl(0.98, tsR - bx0, 28, 0.98, true), pF.m('copper'), [(bx0 + tsR) / 2, yb - 0.05, 0], [0, 0, Math.PI / 2]);
      k.box(pF.m('red'), 2.2, 0.12, 2 * hw - 0.4, fx1 - 1.6, 2.7, 0, 0, 0, -0.12);
      k.box(pF.m('iron'), fx1 - fx0 - 0.4, 0.05, 2 * hw - 0.35, (fx0 + fx1) / 2, fy0 + 0.12, 0);
      k.add(G.sph(0.7, 12, 8), pF.m('fire'), [(fx0 + fx1) / 2, fy0 + 0.35, 0], [0, 0, 0], [3.4, 0.38, 1.3]);
      // válvulas de seguridad sobre el hogar
      for (const z of [-0.25, 0, 0.25]) k.cyl(pF.m('brass'), 0.07, 0.22, 'y', fx1 - 0.6, yb + rb + 0.08, z, 12);
      // canal del alimentador mecánico (stoker) bajo la cabina
      k.box(pF.m('iron'), 4.2, 0.28, 0.42, -12.3, 1.25, 0);
      k.build(pF.group); ks.build(pF.group);
      screw = new T.Group(); screw.position.set(-12.3, 1.25, 0);
      const kw = new Kit(); kw.cyl(pF.m('steel'), 0.04, 4.0, 'x', 0, 0, 0, 8);
      for (let i = 0; i < 26; i++) { const a = i * 0.9; kw.box(pF.m('steel'), 0.03, 0.3, 0.05, -1.95 + i * 0.155, 0, 0, a, 0, 0); }
      kw.build(screw); pF.group.add(screw);
    }

    // 3 — Doble chimenea, toberas y conducto de escape de la unidad delantera
    const pE = M.part('escape', { explode: [0.8, 2.4, 0] });
    {
      const k = new Kit(), ks = new Kit();
      ks.add(G.cyl(0.42, 0.5, 28, 0.42, true), pE.m('black', { shell: true }), [11.5, yb + rb + 0.15, 0], [0, 0, 0], [1.75, 1, 1]);
      k.add(G.torus(0.42, 0.04, 6, 28), pE.m('black'), [11.5, yb + rb + 0.4, 0], [Math.PI / 2, 0, 0], [1.75, 1, 1]);
      for (const x of [11.2, 11.8]) {
        k.add(G.lathe([[0.22, 0], [0.26, 0.5], [0.24, 1.1], [0.3, 1.7]], 22), pE.m('graph'), [x, yb + 0.05, 0]);
        k.add(G.cyl(0.08, 0.5, 14, 0.14), pE.m('steel'), [x, yb - 0.55, 0]);
      }
      k.box(pE.m('iron'), 1.3, 0.25, 0.5, 11.5, yb - 0.85, 0);
      // escape de los cilindros traseros: tubo bajo la caldera hacia la caja de humos, con juntas deslizantes; escape de los delanteros
      const ex = [[0.39, 1.5, 0], [1.5, 1.66, 0], [8.0, 1.66, 0], [10.6, yb - 0.9, 0], [11.5, yb - 0.85, 0]];
      k.add(G.poly(ex, 0.11, 10), pE.m('iron'));
      for (const x of [1.5, 8.0]) k.cyl(pE.m('steel'), 0.15, 0.25, 'x', x, 1.66, 0, 14);
      for (const s of [1, -1]) k.add(G.poly([[8.99, 1.5, s * 0.55], [9.5, 1.85, s * 0.2], [10.6, yb - 0.9, 0]], 0.12, 10), pE.m('iron'));
      k.build(pE.group); ks.build(pE.group);
    }

    // 4–5 — Unidades motrices: bastidor, ruedas de 68 in, cilindros, bielas y Walschaerts
    const pD = M.part('delantera', { anchor: [5.0, 1.2, 1.2], explode: [0.6, -0.3, 2.2] });
    const pT = M.part('trasera', { anchor: [-3.0, 1.2, 1.2], explode: [0, -0.3, 2.2] });
    const engines = [];
    const P = M.addParticles(pE.group, { count: 1800, c0: '#e8e6e0', c1: '#56524d', grow: 3.4, rise: 0.7, opacity: 0.5 });
    const tops = [[11.2, 4.95, 0], [11.8, 4.95, 0]]; let tk = 0;
    const perBeat = () => Math.max(2, Math.min(8, Math.round(56 / Math.max(1, M.vNow / (Math.PI * 2 * R) * 8))));
    M.initSteam({ pB: 20.7, cut: 0.3, Rw: R, onBeat: () => { tk = (tk + 1) % 2; puff(P, tops[tk], M.vNow, M.tSim, { n: perBeat(), up: 3.2 + M.vNow * 0.1, life: 2.6, size: 0.45, rx: 0.35, rz: 0.3 }); } });
    function engine(part, X, ph, label) {
      const grp = rig(part); const A = [X[2], R];
      const wsets = [];
      const k = new Kit(); const ir = part.m('iron');
      // bastidor de acero fundido de una pieza y cajas de grasa
      for (const s of [1, -1]) {
        k.box(ir, X[0] - X[3] + 2.2, 0.36, 0.14, (X[0] + X[3]) / 2, 1.05, s * 0.55);
        for (const x of X) { k.box(ir, 0.42, 0.52, 0.18, x, R + 0.05, s * 0.6); for (let i = 0; i < 4; i++) k.box(part.m('steel'), 0.95 - i * 0.12, 0.03, 0.12, x, R + 0.4 + i * 0.033, s * 0.6); }
      }
      X.forEach((x) => {
        const w = wheelset({ R, gauge: g, tread: 0.14, type: 'spoke', spokes: 18, hubR: 0.2, crankR: r, phaseR: ph[0], phaseL: ph[1], pinL: 0.26, bossR: 0.12,
          m: { tyre: part.m('tyre'), body: part.m('black'), hub: part.m('black'), pin: part.m('steel'), axle: ir, cw: part.m('black') } });
        w.group.position.set(x, R, 0); grp.add(w.group); wsets.push(w.group);
      });
      k.build(grp);
      const sides = [];
      for (const [s, phase] of [[1, ph[0]], [-1, ph[1]]]) {
        const z = s * zRod; const kc = new Kit();
        const c0 = [A[0] + u[0] * d0, A[1] + u[1] * d0], c1 = [A[0] + u[0] * d1, A[1] + u[1] * d1];
        kc.seg(part.m('blackS', { shell: true }), [c0[0], c0[1], z], [c1[0], c1[1], z], 0.42, 32);
        for (const c of [c0, c1]) kc.seg(part.m('graph'), [c[0] - 0.04, c[1], z], [c[0] + 0.04, c[1], z], 0.44, 32);
        kc.seg(part.m('blackS', { shell: true }), [c0[0] - 0.1, c0[1] + 0.62, z], [c1[0] + 0.1, c1[1] + 0.62, z], 0.2, 20);   // caja de válvula de pistón
        for (const dn of [-0.2, 0.2]) kc.seg(part.m('steel'), [A[0] + u[0] * (L - 0.7), A[1] + u[1] * (L - 0.7) + dn, z], [c0[0], c0[1] + dn, z], 0.03, 6);
        kc.box(ir, 1.0, 0.7, 0.5, (c0[0] + c1[0]) / 2, c0[1] + 0.2, s * (zRod - 0.45));
        kc.build(grp);
        const pk = new Kit(); pk.cyl(part.m('steel'), 0.29, 0.12, 'x', 0, 0, 0, 24); pk.cyl(part.m('steel'), 0.073, pr, 'x', -pr / 2, 0, 0, 10);
        const piston = new T.Group(); pk.build(piston); piston.rotation.z = Math.atan2(u[1], u[0]); piston.position.z = z; grp.add(piston);
        const ck = new Kit(); ck.box(part.m('steel'), 0.42, 0.34, 0.2, 0, 0, 0); ck.box(part.m('steel'), 0.08, 0.42, 0.08, 0.06, -0.36, 0);
        const cross = new T.Group(); ck.build(cross); cross.rotation.z = Math.atan2(u[1], u[0]); cross.position.z = z; grp.add(cross);
        const mrod = rod(part.m('steel'), L, 0.2, 0.08, 0.15, ir); mrod.position.z = z + s * 0.09; grp.add(mrod);
        const cpl = [0, 1, 2].map(() => { const o = rod(part.m('steel'), X[0] - X[1], 0.16, 0.07, 0.12); o.position.z = z; grp.add(o); return o; });
        // Walschaerts (simplificada): manivela de retorno → barra de excéntrica → sector → barra de radio → palanca de combinación
        const PV = [c0[0] - 1.25, R + 1.05];
        const mk = (len, h) => { const o = rod(part.m('steel'), len, h, 0.04, h * 0.6); o.position.z = z + s * 0.2; grp.add(o); return o; };
        const link = new T.Group(); const lk = new Kit(); lk.box(part.m('steel'), 0.08, 0.75, 0.06, 0, 0, 0); lk.cyl(ir, 0.06, 0.12, 'z', 0, 0, 0, 12); lk.build(link); link.position.set(PV[0], PV[1], z + s * 0.2); grp.add(link);
        const eccRod = mk(2.1, 0.09), radRod = mk(2.6, 0.08), comb = mk(1.1, 0.07);
        const spindle = new T.Group(); const sk = new Kit(); sk.cyl(part.m('steel'), 0.03, 1.2, 'x', 0.3, 0, 0, 8); sk.box(part.m('steel'), 0.12, 0.12, 0.1, -0.3, 0, 0); sk.build(spindle); spindle.position.z = z; grp.add(spindle);
        const sd = { s, z, phase, piston, cross, mrod, cpl, link, eccRod, radRod, comb, spindle, A, PV, vx0: c0[0] - 0.3, vy: c0[1] + 0.62 };
        sides.push(sd);
        steamCyl(M, grp, { src: sd, A, u, L, r, pr, pt: 0.06, d0, d1, bore: 0.3015, z });
        if (label && s > 0) { piston.name = label + '.piston'; cross.name = label + '.cross'; mrod.name = label + '.biela'; link.name = label + '.link'; radRod.name = label + '.radius'; cpl[0].name = label + '.acopl'; }
      }
      const e = { grp, X, A, wsets, sides }; engines.push(e); return e;
    }
    const eF = engine(pD, XF, [PH.FR, PH.FL], 'BF');
    const eR = engine(pT, XR, [PH.RR, PH.RL], 'BR');
    { // enganche de la articulación en el bastidor delantero
      const k = new Kit(); k.box(pD.m('iron'), 1.0, 0.3, 0.9, XH + 0.45, 1.0, 0);
      for (const s of [1, -1]) k.box(pD.m('iron'), 3.8, 0.34, 0.14, 10.6, 1.12, s * 0.55);   // bastidor delantero hasta la traviesa del piloto
      k.add(G.extrude([[12.6, 1.5], [13.35, 0.35], [13.35, 0.18], [12.4, 0.18], [12.4, 1.5]], 2.6), pD.m('black'));   // piloto
      k.box(pD.m('black'), 0.35, 0.3, 3.0, 12.5, 1.4, 0); k.box(pD.m('steel'), 0.45, 0.22, 0.3, 13.55, 0.95, 0);
      k.build(eF.grp);
      const kr = new Kit(); kr.box(pT.m('iron'), 0.9, 0.36, 1.1, XH - 0.5, 1.0, 0); kr.box(pT.m('iron'), 2.4, 0.3, 1.0, -9.8, 1.05, 0); for (const s of [1, -1]) kr.box(pT.m('iron'), 5.6, 0.3, 0.14, -10.2, 1.25, s * 0.55); kr.build(eR.grp);
    }

    // 6 — Articulación: pivote, apoyo deslizante de la caldera y tuberías con juntas de rótula
    const pA = M.part('articulacion', { anchor: [XH, 1.25, 0.6], explode: [0, 0.9, 1.6] });
    {
      const k = new Kit();
      k.cyl(pA.m('steel'), 0.16, 0.5, 'y', XH, 1.0, 0, 20);
      k.cyl(pA.m('brass'), 0.22, 0.06, 'y', XH, 1.2, 0, 20);
      // apoyo deslizante: la caldera descansa sobre la unidad delantera y puede desplazarse lateralmente
      const XS = 6.66;   // entre el 1.º y el 2.º eje motor delantero
      k.box(pA.m('iron'), 0.14, 0.28, 0.9, XS, 1.39, 0); k.box(pA.m('brass'), 0.14, 0.03, 0.8, XS, 1.545, 0);
      for (const s of [1, -1]) k.box(pA.m('iron'), 0.14, 0.34, 0.08, XS, 1.72, s * 0.45);
      k.add(G.cyl(rb + 0.03, 0.12, 36, rb + 0.03, true), pA.m('iron'), [XS, yb, 0], [0, 0, Math.PI / 2]);
      // tuberías de vapor vivo a los cilindros delanteros: salen de la caja de humos con rótulas (la unidad se desplaza en curva)
      for (const s of [1, -1]) { k.add(G.poly([[tsF + 1.3, yb + 0.6, s * 0.45], [8.7, 2.25, s * 0.95], [8.95, 2.05, s * 1.05], [9.0, 1.86, s * zRod]], 0.1, 8), pA.m('graph')); k.sph(pA.m('iron'), 0.15, 8.95, 2.05, s * 1.05); }
      // tuberías de vapor a los cilindros traseros, por fuera del barril y bajo la pasarela
      for (const s of [1, -1]) { k.add(G.poly([[tsF + 1.3, yb + 0.3, s * 0.8], [7.0, yb - 0.35, s * 1.42], [1.4, yb - 0.35, s * 1.42], [0.7, 2.2, s * 1.2], [0.4, 1.86, s * zRod]], 0.09, 8), pA.m('graph')); k.sph(pA.m('iron'), 0.13, 1.4, yb - 0.35, s * 1.42); }
      k.build(pA.group);
    }

    // 7 — Bogie delantero (36 in) y bogie trasero bajo el hogar (42 in)
    const pG = M.part('bogies', { anchor: [10.8, 0.6, 1.0], explode: [0, -0.9, 0] });
    const smallW = [], leadRig = new T.Group(); pG.group.add(leadRig);
    {
      const k = new Kit(), kl = new Kit(); const ir = pG.m('iron');
      XL.forEach(x => { const w = wheelset({ R: Rl, gauge: g, tread: 0.13, type: 'disc', hubR: 0.1, m: { tyre: pG.m('tyre'), body: pG.m('black'), hub: pG.m('black'), axle: ir } }); w.group.position.set(x, Rl, 0); leadRig.add(w.group); smallW.push({ w: w.group, R: Rl }); });
      for (const s of [1, -1]) { kl.box(ir, 2.6, 0.22, 0.12, (XL[0] + XL[1]) / 2, 0.62, s * 0.72); for (const x of XL) kl.box(ir, 0.34, 0.34, 0.16, x, Rl + 0.04, s * 0.72); }
      kl.cyl(pG.m('steel'), 0.2, 0.25, 'y', (XL[0] + XL[1]) / 2, 0.85, 0, 18);
      kl.build(leadRig);
      XT.forEach(x => { const w = wheelset({ R: Rt, gauge: g, tread: 0.13, type: 'disc', hubR: 0.11, m: { tyre: pG.m('tyre'), body: pG.m('black'), hub: pG.m('black'), axle: ir } }); w.group.position.set(x, Rt, 0); pG.group.add(w.group); smallW.push({ w: w.group, R: Rt }); });
      for (const s of [1, -1]) { k.box(ir, 3.0, 0.3, 0.14, (XT[0] + XT[1]) / 2, 0.75, s * 0.8); for (const x of XT) k.box(ir, 0.38, 0.38, 0.18, x, Rt + 0.04, s * 0.8); }
      k.build(pG.group);
    }
    rigs.push(leadRig);

    // 8 — Cabina con señalización en cabina
    const pC = M.part('cabina', { explode: [-0.6, 1.8, 0] });
    {
      const k = new Kit(); const bk = pC.m('blackS', { shell: true });
      const cx0 = -13.0, cx1 = -10.0, y0 = 1.75, y1 = 4.55, hw = 1.6;
      for (const s of [1, -1]) {
        k.box(bk, cx1 - cx0, 1.0, 0.04, (cx0 + cx1) / 2, y0 + 0.5, s * hw);
        k.box(bk, 0.25, y1 - y0, 0.04, cx0 + 0.13, (y0 + y1) / 2, s * hw); k.box(bk, 0.25, y1 - y0, 0.04, cx1 - 0.13, (y0 + y1) / 2, s * hw);
        k.box(bk, 0.2, y1 - y0, 0.04, (cx0 + cx1) / 2 + 0.2, (y0 + y1) / 2, s * hw);
        k.box(bk, cx1 - cx0, 0.3, 0.04, (cx0 + cx1) / 2, y1 - 0.15, s * hw);
        for (const x of [-11.95, -10.8]) k.box(pC.m('glass'), 0.9, 0.85, 0.02, x, 3.45, s * (hw + 0.025));
      }
      k.box(bk, 0.04, y1 - y0, 2 * hw, cx1, (y0 + y1) / 2, 0);
      for (const z of [-0.85, 0.85]) k.box(pC.m('glass'), 0.02, 0.6, 0.7, cx1 + 0.03, 3.7, z);
      const Rr = 2.6, al = Math.asin(1.75 / Rr);
      k.add(new T.CylinderGeometry(Rr, Rr, cx1 - cx0 + 0.4, 32, 1, true, -al, 2 * al), pC.m('black'), [(cx0 + cx1) / 2 - 0.1, y1 + 0.32 - Rr, 0], [-Math.PI / 2, Math.PI / 2, 0, 'YXZ']);
      k.box(pC.m('iron'), cx1 - cx0, 0.08, 2 * hw, (cx0 + cx1) / 2, y0, 0);
      // indicador de señal en cabina y regulador
      k.box(pC.m('iron'), 0.3, 0.25, 0.12, -10.25, 3.2, 0.9); for (let i = 0; i < 3; i++) k.box(pC.m(i === 1 ? 'red' : 'lamp'), 0.06, 0.05, 0.02, -10.25, 3.14 + i * 0.06, 0.97);
      k.bar(pC.m('steel'), [-10.3, 3.0, 0.4], [-10.9, 3.4, 0.4], 0.05, 0.05);
      k.build(pC.group);
    }

    // 9 — Ténder de 14 ruedas: 28 t de carbón y 24 000 gal de agua
    const pR = M.part('tender', { explode: [-2.5, 0, 0] });
    const tw = [];
    {
      const k = new Kit(); const bk = pR.m('blackS', { shell: true }), ir = pR.m('iron');
      const tx0 = -27.45, tx1 = -13.4, ty0 = 1.4, ty1 = 4.55, hw = 1.6;
      for (const s of [1, -1]) k.box(bk, tx1 - tx0, ty1 - ty0, 0.04, (tx0 + tx1) / 2, (ty0 + ty1) / 2, s * hw);
      k.box(bk, 0.04, ty1 - ty0, 2 * hw, tx0, (ty0 + ty1) / 2, 0); k.box(bk, 0.04, 1.4, 2 * hw, tx1, ty0 + 0.7, 0);
      k.box(bk, tx1 - tx0 - 5.6, 0.04, 2 * hw, (tx0 + tx1) / 2 - 2.8, ty1, 0);
      // carbonera con pendiente hacia el alimentador y carbón
      k.box(pR.m('iron'), 5.4, 0.04, 2 * hw - 0.1, tx1 - 2.8, 2.6, 0, 0, 0, -0.2);
      for (let i = 0; i < 60; i++) k.add(G.sph(0.22 + (i % 4) * 0.05, 6, 5), pR.m('coal'), [tx1 - 0.6 - (i % 12) * 0.42, 3.2 + Math.floor(i / 12) * 0.18 - (i % 12) * 0.06, -1.2 + ((i * 7) % 11) * 0.24]);
      for (const s of [1, -1]) k.rivets(bk, [tx0 + 0.2, ty1 - 0.1, s * (hw + 0.022)], [tx1 - 0.2, ty1 - 0.1, s * (hw + 0.022)], 50, 0.014);
      for (const s of [1, -1]) { k.cyl(pR.m('black'), 0.07, tx1 - tx0, 'x', (tx0 + tx1) / 2, ty1, s * hw, 10); k.box(pR.m('black'), tx1 - tx0, 0.06, 0.05, (tx0 + tx1) / 2, 2.2, s * (hw + 0.03)); }
      for (let i = 0; i < 6; i++) k.box(pR.m('black'), 0.05, 0.03, 0.4, tx0 + 0.04, 1.8 + i * 0.4, 1.2);   // escalera trasera
      k.box(ir, tx1 - tx0, 0.35, 2.4, (tx0 + tx1) / 2, 1.25, 0);
      // bogie delantero de 4 ruedas y cinco ejes rígidos (4-10-0)
      const TX = [-14.9, -16.7, -19.2, -20.9, -22.6, -24.3, -26.0];
      TX.forEach(x => { const w = wheelset({ R: Rtd, gauge: g, tread: 0.13, type: 'disc', hubR: 0.1, m: { tyre: pR.m('tyre'), body: pR.m('black'), hub: pR.m('black'), axle: ir } }); w.group.position.set(x, Rtd, 0); pR.group.add(w.group); tw.push(w.group); });
      for (const s of [1, -1]) { k.box(ir, 2.4, 0.26, 0.12, -15.8, 0.62, s * 0.75); k.box(ir, 7.4, 0.34, 0.12, -22.6, 0.68, s * 0.75); for (const x of TX) k.box(ir, 0.32, 0.32, 0.16, x, Rtd + 0.05, s * 0.75); }
      k.build(pR.group);
    }

    // ----- Animación -----
    M.curve = false; M.modes.curve = true;
    let yaw = 0;
    M.anim.push((s, dt) => {
      const th = -s / R;
      for (const e of engines) {
        e.wsets.forEach(w => (w.rotation.z = th));
        for (const sd of e.sides) {
          const phi = th + sd.phase, pin = pinPos(sd.A, r, phi);
          const xc = sliderCrank(sd.A, u, pin, L);
          sd.xc = xc; sd.phi = phi;
          const C = [sd.A[0] + u[0] * xc, sd.A[1] + u[1] * xc];
          sd.cross.position.x = C[0]; sd.cross.position.y = C[1];
          sd.piston.position.x = sd.A[0] + u[0] * (xc + pr); sd.piston.position.y = sd.A[1] + u[1] * (xc + pr);
          placeRod(sd.mrod, pin, C);
          for (let i = 0; i < 3; i++) placeRod(sd.cpl[i], pinPos([e.X[i + 1], R], r, phi), pinPos([e.X[i], R], r, phi));
          // distribución: el sector oscila con la manivela de retorno (90° adelantada) y el dado fija el corte
          const cut = M.steam ? M.steam.cut : 0.3, dDie = 0.06 + 0.26 * cut;
          const ret = pinPos(sd.A, 0.22, phi + Math.PI / 2), la = 0.22 * Math.sin(phi + Math.PI / 2);
          sd.link.rotation.z = la;
          const foot = [sd.PV[0] + Math.sin(la) * 0.36, sd.PV[1] - Math.cos(la) * 0.36], die = [sd.PV[0] - Math.sin(la) * dDie, sd.PV[1] + Math.cos(la) * dDie];
          placeRod(sd.eccRod, ret, foot);
          const vx = sd.vx0 + 0.11 * Math.sin(phi + Math.PI / 2 + 0.2) * (0.35 + cut);
          placeRod(sd.radRod, die, [vx, sd.vy]);
          placeRod(sd.comb, [vx, sd.vy], [C[0] + 0.06, C[1] - 0.36]);
          sd.spindle.position.x = vx; sd.spindle.position.y = sd.vy;
        }
      }
      smallW.forEach(o => (o.w.rotation.z = -s / o.R));
      tw.forEach(w => (w.rotation.z = -s / Rtd));
    });
    // articulación: la unidad delantera y su bogie giran sobre el pivote como en una curva de 88 m (sólo en el modo estudio)
    M.fx.push((t, dt) => {
      const target = M.curve ? 0.098 * (0.5 - 0.5 * Math.cos(t * 1.6)) : 0;
      yaw += (target - yaw) * Math.min(1, Math.max(dt, 0) * 6 + (M.curve ? 0 : 1));
      for (const g2 of rigs) { g2.rotation.y = yaw; g2.position.set(XH - XH * Math.cos(yaw), 0, XH * Math.sin(yaw)); }
      if (screw && M.powered && dt > 0) screw.rotation.x += dt * 6;
    });
    M.update(0, 0);
    fireFx(M, [pF.m('fire')], fireLight(M, [(fx0 + fx1) / 2, 2.2, 0], 4.5), 1.3);

    // ----- Flujos de energía -----
    M.flow([[(fx0 + fx1) / 2, 2.0, 0], [(fx0 + fx1) / 2, 3.1, 0], [tsR, 3.1, 0], [tsF, 3.1, 0], [11.5, 3.6, 0], [11.5, 4.9, 0]], '#ff8a3d', { r: 0.09 });
    const dome = [[2.8, yb + rb + 0.25, 0], [2.8, yb + 1.0, 0], [tsF + 0.55, yb + 1.0, 0], [tsF + 0.55, yb + 0.55, 0.6], [tsR + 0.3, yb + 0.55, 0.6], [tsF + 0.4, yb + 0.45, 0.4], [tsF + 1.3, yb + 0.6, 0.45]];
    M.flow([...dome, [7.0, yb - 0.35, 1.42], [1.4, yb - 0.35, 1.42], [0.7, 2.2, 1.2], [0.4, 1.86, zRod], [0.39, 1.6, zRod]], '#bfe6ff', { r: 0.06, speed: 1.4 });
    M.flow([[tsF + 1.3, yb + 0.6, 0.45], [8.7, 2.25, 0.95], [8.95, 2.05, 1.05], [9.0, 1.86, zRod], [8.99, 1.6, zRod]], '#bfe6ff', { r: 0.06, speed: 1.4 });
    M.flow([[0.39, 1.5, 0], [1.5, 1.66, 0], [8.0, 1.66, 0], [10.6, yb - 0.9, 0], [11.5, yb - 0.85, 0], [11.5, 4.8, 0]], '#9fb4c4', { r: 0.06 });
    M.flow([[-16.0, 2.4, 0], [-13.4, 1.4, 0], [-10.3, 1.4, 0], [-9.2, 1.75, 0]], '#c98a4a', { r: 0.07 });

    M.finalize();
    M.len = 40.5; M.center = -7.2;
    M.frame = [-14, 13.6];
    M.camDir = [0.62, 0.4, 1];
    M.secH = 5.6; M.secY = 3.0;
    M.env = { gauge: g, track: { style: 'wood', sleeperColor: '#4e3c2e', pitch: 0.62, sleeperL: 2.6, ballast: ['#8c7660', '#5a4a3e'] } };
    M.wheelR = R;
    return M;
  };
})();
