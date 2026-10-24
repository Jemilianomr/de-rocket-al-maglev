/* EMD F7A (La Grange, 1949) — diésel-eléctrica B-B, motor 16-567B de dos tiempos */
(function () {
  const { T, Kit, G, wheelset, loft, stations, ease } = TB;
  const { Model } = MB;

  MODELS.f7 = function () {
    const M = new Model('f7', {
      body: ['#5c1f24', { r: 0.4, m: 0.15 }], band: ['#b9bcbf', { r: 0.25, m: 0.8 }], stripe: ['#d9a93a', { r: 0.4 }],
      dark: ['#232528', { r: 0.55, m: 0.4 }], black: ['#151617', { r: 0.55 }], steel: ['#b1b6bb', { r: 0.25, m: 0.9 }],
      block: ['#3f5a4f', { r: 0.45, m: 0.4 }], head: ['#4c6a5e', { r: 0.4, m: 0.45 }], piston: ['#c2c6ca', { r: 0.25, m: 0.9 }],
      gen: ['#3d4146', { r: 0.4, m: 0.6 }], copper: ['#b8693d', { r: 0.35, m: 0.85 }], tyre: ['#2b2c2e', { r: 0.4, m: 0.75 }],
      truck: ['#2a2b2d', { r: 0.6, m: 0.4 }], grid: ['#8a5a3a', { r: 0.5, m: 0.6 }], glass: ['#25333c', { r: 0.06, m: 0.6 }],
      rad: ['#7c8186', { r: 0.4, m: 0.7 }], fuel: ['#2e3033', { r: 0.6, m: 0.3 }], lamp: ['#fff3c4', { r: 0.2, em: '#ffe9a0', ei: 0.9 }],
      spring: ['#9da2a7', { r: 0.35, m: 0.8 }],
    });
    const g = 1.435, R = 0.508, XTR = [4.57, -4.57], WB = 2.743, gear = 62 / 15;
    const yF = 1.36;

    // 7 — Carrocería "covered wagon" con nariz bulldog (se crea primero para fijar volúmenes)
    const pC = M.part('cabina', { anchor: [6.2, 3.6, 1.3], explode: [0, 2.8, 0] });
    {
      const k = new Kit(); const bd = pC.m('body', { shell: true });
      const base = { w: 1.5, ym: 2.2, yb: yF, nT: 3.4, nB: 14 };
      const keys = [
        { ...base, x: -7.16, w: 1.42, yt: 4.2 }, { ...base, x: -7.0, yt: 4.31 }, { ...base, x: 3.7, yt: 4.31, steps: 8 },
        { ...base, x: 4.3, yt: 4.57 }, { ...base, x: 5.3, yt: 4.57 },
        { ...base, x: 6.2, yt: 3.4, steps: 6 }, { ...base, x: 6.85, w: 1.42, yt: 2.85, steps: 5 },
        { ...base, x: 7.3, w: 1.18, yt: 2.38, ym: 2.0, yb: 1.42, steps: 5 }, { ...base, x: 7.56, w: 0.7, yt: 1.98, ym: 1.78, yb: 1.5, nB: 6, steps: 4 },
      ];
      const ST = stations(keys, 3);
      k.add(loft(ST, 56), bd);
      const zs = (x, y) => { let s0 = ST[0]; for (const s of ST) if (Math.abs(s.x - x) < Math.abs(s0.x - x)) s0 = s; return TB.widthAt(s0, y); };
      // franja plateada y filetes
      for (const s of [1, -1]) {
        k.box(pC.m('band'), 10.8, 0.22, 0.02, -1.6, 1.62, s * 1.505);
        k.box(pC.m('stripe'), 10.8, 0.04, 0.02, -1.6, 1.77, s * 1.507);
        // ojos de buey
        for (const x of [2.6, 1.2, -0.2]) { const zz = zs(x, 3.1) + 0.005; k.add(G.cyl(0.22, 0.03, 24), pC.m('glass'), [x, 3.1, s * zz], [Math.PI / 2, 0, 0]); k.add(G.torus(0.22, 0.03, 6, 24), pC.m('steel'), [x, 3.1, s * (zz + 0.005)], [0, 0, 0]); }
        // ventana lateral de cabina
        k.box(pC.m('glass'), 0.9, 0.62, 0.02, 4.8, 3.65, s * (zs(4.8, 3.65) + 0.006));
        // rejillas de radiador (acero inoxidable)
        for (let x = -6.6; x < -3.6; x += 0.5) k.box(pC.m('rad'), 0.42, 0.62, 0.025, x, 3.35, s * (zs(x, 3.66) + 0.01));
      }
      // parabrisas en dos hojas sobre el plano inclinado
      for (const s of [1, -1]) k.box(pC.m('glass'), 0.03, 0.72, 0.92, 5.80, 3.98, s * 0.55, 0, s * 0.16, 0.609);
      // faro y tableros de número
      k.add(G.cyl(0.2, 0.12, 24), pC.m('lamp'), [7.12, 2.62, 0], [0, 0, Math.PI / 2 - 0.55]);
      k.add(G.torus(0.21, 0.035, 6, 24), pC.m('steel'), [7.13, 2.62, 0], [0, Math.PI / 2, 0.55]);
      k.build(pC.group);
    }

    // 1 — Motor diésel 16-567B (V16 a 45°, dos tiempos, soplador Roots)
    const pE = M.part('motor', { anchor: [-1.6, 2.5, 0.6], explode: [0, 1.6, 1.8] });
    const pist = []; let crank;
    const EX0 = -3.5, EX1 = 0.35, yCr = 1.85, rc = 0.127, Lc = 0.62, pitch = (EX1 - EX0 - 0.4) / 8;
    {
      const k = new Kit();
      k.box(pE.m('block'), EX1 - EX0, 0.6, 1.1, (EX0 + EX1) / 2, yCr - 0.1, 0);
      for (const sgn of [1, -1]) {
        const a = sgn * Math.PI / 8; // 22.5° desde la vertical
        const dir = [Math.sin(a), Math.cos(a)];
        for (let i = 0; i < 8; i++) {
          const x = EX0 + 0.2 + pitch * (i + 0.5) + (sgn > 0 ? 0.04 : -0.04);
          const c0 = 0.55, c1 = 1.05;
          k.add(G.cyl(0.13, c1 - c0, 18), pE.m('block'), [x, yCr + dir[1] * (c0 + c1) / 2, dir[0] * (c0 + c1) / 2], [a, 0, 0]);
          k.add(G.box(0.36, 0.14, 0.34), pE.m('head'), [x, yCr + dir[1] * 1.12, dir[0] * 1.12], [a, 0, 0]);
          const pg = new T.Group(); const pk = new Kit();
          pk.cyl(pE.m('piston'), 0.108, 0.16, 'y', 0, 0, 0, 16);
          pk.cyl(pE.m('steel'), 0.028, Lc, 'y', 0, -Lc / 2, 0, 8);
          pk.build(pg); pg.rotation.x = a; pE.group.add(pg);
          pist.push({ pg, x, dir: [dir[0], dir[1]], phase: i * Math.PI / 4 + (sgn > 0 ? 0 : Math.PI / 4) });
        }
      }
      // cárter, bancada y soplador Roots
      k.box(pE.m('block'), EX1 - EX0, 0.45, 1.25, (EX0 + EX1) / 2, yCr - 0.5, 0);
      k.box(pE.m('gen'), 0.55, 0.85, 1.0, EX0 - 0.35, yCr + 0.45, 0);
      for (const z of [-0.2, 0.2]) k.cyl(pE.m('steel'), 0.17, 0.5, 'x', EX0 - 0.35, yCr + 0.5, z, 16);
      // escapes en el techo
      for (let i = 0; i < 4; i++) k.cyl(pE.m('dark'), 0.12, 0.6, 'y', EX0 + 0.5 + i * 0.95, 4.3, 0, 14);
      k.build(pE.group);
      const cg = new T.Group(); cg.position.set(0, yCr, 0);
      const ck = new Kit(); ck.cyl(pE.m('steel'), 0.07, EX1 - EX0, 'x', (EX0 + EX1) / 2, 0, 0, 12);
      for (let i = 0; i < 8; i++) { const ph = i * Math.PI / 4, x = EX0 + 0.2 + pitch * (i + 0.5); ck.add(G.box(0.08, rc + 0.12, 0.2), pE.m('steel'), [x, Math.cos(ph) * rc / 2, Math.sin(ph) * rc / 2], [-ph, 0, 0]); }
      ck.build(cg); pE.group.add(cg); crank = cg;
    }

    // 2 — Generador principal D12 (CC) acoplado al volante
    const pG = M.part('generador', { anchor: [0.97, 1.85, 0.66], explode: [1.1, 1.3, 1.6] });
    let genArm;
    {
      const k = new Kit();
      k.cyl(pG.m('gen'), 0.66, 1.05, 'x', EX1 + 0.62, yCr, 0, 36);
      for (let i = 0; i < 12; i++) { const a = i / 12 * Math.PI * 2; k.box(pG.m('gen'), 1.0, 0.06, 0.06, EX1 + 0.62, yCr + Math.cos(a) * 0.66, Math.sin(a) * 0.66); }
      k.cyl(pG.m('dark'), 0.72, 0.1, 'x', EX1 + 0.05, yCr, 0, 36);
      // generador auxiliar y armario eléctrico
      k.cyl(pG.m('gen'), 0.22, 0.5, 'x', EX1 + 1.45, yCr + 0.5, 0, 18);
      k.box(pG.m('dark'), 0.6, 1.9, 2.4, 3.45, 2.5, 0);
      for (let i = 0; i < 6; i++) k.box(pG.m('copper'), 0.04, 0.12, 0.3, 3.14, 1.9 + i * 0.25, 0.5);
      k.build(pG.group);
      genArm = new T.Group(); genArm.position.set(EX1 + 0.62, yCr, 0);
      const ak = new Kit(); ak.cyl(pG.m('copper'), 0.48, 0.95, 'x', 0, 0, 0, 24);
      for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2; ak.box(pG.m('steel'), 0.9, 0.04, 0.04, 0, Math.cos(a) * 0.49, Math.sin(a) * 0.49); }
      ak.build(genArm); pG.group.add(genArm);
    }

    // 3 — Motores de tracción D27 suspendidos por la nariz (4)
    const pM = M.part('traccion', { anchor: [5.32, 0.6, 0.5], explode: [0, -0.2, 2.0] });
    const tms = [];
    // 4 — Bogies Blomberg B
    const pB = M.part('bogies', { anchor: [-4.57, 0.7, 1.0], explode: [0, -0.8, 0] });
    const wsets = [];
    for (const xc of XTR) {
      const k = new Kit(); const tk = pB.m('truck');
      for (const dx of [-WB / 2, WB / 2]) {
        const w = wheelset({ R, gauge: g, tread: 0.135, type: 'disc', hubR: 0.12, m: { tyre: pB.m('tyre'), body: pB.m('truck'), hub: pB.m('truck'), axle: pB.m('dark') } });
        w.group.position.set(xc + dx, R, 0); pB.group.add(w.group); wsets.push(w.group);
        // motor nasal: carcasa al lado del eje, hacia el centro del bogie
        const toward = dx > 0 ? -1 : 1;
        const mg = new T.Group(); mg.position.set(xc + dx + toward * 0.52, R + 0.1, 0); pM.group.add(mg);
        const mk = new Kit();
        mk.cyl(pM.m('gen'), 0.36, 1.05, 'z', 0, 0, 0, 28);
        mk.box(pM.m('gen'), 0.5, 0.18, 0.9, toward * 0.35, 0.25, 0);
        mk.box(pM.m('dark'), 0.95, 0.75, 0.16, -toward * 0.3, -0.08, 0.6);
        mk.build(mg);
        const arm = new T.Group(); const ak = new Kit(); ak.cyl(pM.m('copper'), 0.25, 0.9, 'z', 0, 0, -0.05, 18); for (let i = 0; i < 10; i++) { const a = i / 10 * Math.PI * 2; ak.box(pM.m('steel'), 0.04, 0.04, 0.88, Math.cos(a) * 0.26, Math.sin(a) * 0.26, -0.05); } ak.build(arm); mg.add(arm);
        tms.push(arm);
      }
      for (const s of [1, -1]) {
        const z = s * 1.0;
        // bastidor lateral fundido con columna central
        k.add(G.extrude([[-1.85, 0.35], [-1.6, 0.85], [-0.55, 0.95], [-0.45, 1.15], [0.45, 1.15], [0.55, 0.95], [1.6, 0.85], [1.85, 0.35], [1.4, 0.3], [0.5, 0.55], [-0.5, 0.55], [-1.4, 0.3]].map(p => [xc + p[0], p[1]]), 0.12), tk, [0, 0, z]);
        // compensadores y resortes helicoidales
        k.bar(tk, [xc - WB / 2, R + 0.28, z + s * 0.05], [xc + WB / 2, R + 0.28, z + s * 0.05], 0.08, 0.08);
        for (const dx of [-0.7, 0.7]) for (let i = 0; i < 6; i++) k.add(G.torus(0.1, 0.018, 5, 14), pB.m('spring'), [xc + dx, R + 0.35 + i * 0.05, z + s * 0.05], [Math.PI / 2, 0, 0]);
        // ballestas elípticas del balancín colgante
        for (let i = 0; i < 5; i++) { k.add(G.torus(0.45 - i * 0.03, 0.012, 4, 20, Math.PI), pB.m('spring'), [xc, 0.95, z * 0.75], [0, 0, 0], [1, 0.25, 1]); k.add(G.torus(0.45 - i * 0.03, 0.012, 4, 20, Math.PI), pB.m('spring'), [xc, 0.95, z * 0.75], [Math.PI, 0, 0], [1, 0.25, 1]); }
        // cajas de grasa
        for (const dx of [-WB / 2, WB / 2]) k.box(tk, 0.32, 0.36, 0.2, xc + dx, R, z);
        // cilindro de freno
        k.cyl(tk, 0.11, 0.3, 'x', xc + 1.15, 0.95, z, 14);
      }
      k.box(tk, 0.9, 0.3, 2.1, xc, 1.05, 0);
      k.cyl(pB.m('steel'), 0.3, 0.12, 'y', xc, 1.22, 0, 20);
      k.build(pB.group);
    }

    // 5 — Freno dinámico (rejillas resistivas y ventilador en el techo)
    const pD = M.part('dinamico', { anchor: [1.2, 4.45, 0], explode: [0, 1.6, -0.8] });
    let dynFan;
    {
      const k = new Kit();
      k.box(pD.m('body', { shell: true }), 2.2, 0.28, 2.4, 1.2, 4.42, 0);
      k.box(pD.m('rad'), 1.9, 0.02, 1.6, 1.2, 4.57, 0);
      for (let i = 0; i < 9; i++) for (let j = 0; j < 3; j++) k.box(pD.m('grid'), 0.04, 0.5, 0.8, 0.45 + i * 0.18, 3.95, -0.6 + j * 0.6);
      k.box(pD.m('dark'), 1.9, 0.08, 2.2, 1.2, 3.65, 0);
      k.build(pD.group);
      dynFan = new T.Group(); dynFan.position.set(1.2, 4.5, 0);
      const fk = new Kit(); for (let i = 0; i < 6; i++) fk.add(G.box(0.62, 0.02, 0.14), pD.m('steel'), [0.31 * Math.cos(i * Math.PI / 3), 0, 0.31 * Math.sin(i * Math.PI / 3)], [0.3, -i * Math.PI / 3, 0]);
      fk.cyl(pD.m('dark'), 0.08, 0.1, 'y', 0, 0, 0, 12); fk.build(dynFan); pD.group.add(dynFan);
    }

    // 6 — Refrigeración: radiadores laterales y ventiladores de techo
    const pR = M.part('refrigeracion', { anchor: [-5.1, 3.6, 1.35], explode: [0, 1.4, 0] });
    const fans = [];
    {
      const k = new Kit();
      for (const s of [1, -1]) k.box(pR.m('rad'), 3.1, 0.85, 0.15, -5.1, 3.55, s * 1.32);
      for (const x of [-4.4, -6.1]) {
        k.add(G.cyl(0.66, 0.15, 30, 0.66, true), pR.m('dark'), [x, 4.33, 0]);
        k.add(G.torus(0.66, 0.025, 4, 30), pR.m('rad'), [x, 4.41, 0], [Math.PI / 2, 0, 0]);
        const f = new T.Group(); f.position.set(x, 4.3, 0); const fk = new Kit();
        for (let i = 0; i < 6; i++) fk.add(G.box(0.6, 0.02, 0.16), pR.m('steel'), [0.3 * Math.cos(i * Math.PI / 3), 0, 0.3 * Math.sin(i * Math.PI / 3)], [0.35, -i * Math.PI / 3, 0]);
        fk.build(f); pR.group.add(f); fans.push(f);
      }
      // tubería de agua al motor
      k.add(G.poly([[-4.6, 3.2, 0.9], [-3.8, 2.5, 0.7], [-3.6, 2.2, 0.5]], 0.07, 8), pR.m('dark'));
      k.build(pR.group);
    }

    // 8 — Chasis: bastidor, depósito de combustible, depósitos de aire, quitapiedras y enchufes MU
    const pF = M.part('chasis', { anchor: [0, 0.9, 1.2], explode: [0, -1.4, 0] });
    {
      const k = new Kit(); const dk = pF.m('dark');
      k.box(dk, 14.6, 0.3, 2.9, 0.2, yF - 0.15, 0);
      k.add(G.cyl(0.62, 5.6, 28, 0.62), pF.m('fuel'), [0, 0.95, 0], [0, 0, Math.PI / 2], [1, 0.75, 1.55]);
      for (const z of [-1.05, 1.05]) k.cyl(pF.m('fuel'), 0.18, 3.4, 'x', 0, 0.95, z, 16);
      k.add(G.extrude([[7.0, yF - 0.3], [7.75, 0.35], [7.75, 0.2], [6.9, 0.2], [6.9, yF - 0.3]], 2.5), pF.m('black'), [0, 0, 0]);
      k.box(pF.m('steel'), 0.35, 0.18, 0.25, 7.8, 0.9, 0);
      k.box(pF.m('steel'), 0.4, 0.18, 0.25, -7.35, 0.9, 0);
      for (const z of [-0.5, 0.5]) k.cyl(pF.m('black'), 0.04, 0.4, 'x', 7.6, 1.15, z, 8);
      k.build(pF.group);
    }

    M.anim.push((s, dt, v) => {
      wsets.forEach(w => (w.rotation.z = -s / R));
      tms.forEach(a => (a.rotation.z = s / R * gear));
      M._eng = (M._eng || 0) + dt * (v > 0.01 ? 800 : 275) / 60 * Math.PI * 2 * (M.timeScale ?? 1);
      const ca = M._eng;
      crank.rotation.x = ca; genArm.rotation.x = ca;
      for (const p of pist) {
        const ang = ca + p.phase;
        const x = rc * Math.cos(ang) + Math.sqrt(Lc * Lc - (rc * Math.sin(ang)) ** 2);
        const d = x + 0.18;
        p.pg.position.set(p.x, yCr + p.dir[1] * (d + 0.55 - Lc + 0.25), p.dir[0] * (d + 0.55 - Lc + 0.25));
      }
      fans.forEach(f => (f.rotation.y += dt * (v > 0.01 ? 18 : 6) * (M.timeScale ?? 1)));
      dynFan.rotation.y += dt * (v > 0.01 ? 4 : 0) * (M.timeScale ?? 1);
    });
    M.update(0, 0);
    M.gear = gear;

    // flujos: combustible → motor; eje → generador; CC → motores de tracción
    M.flow([[-0.5, 0.95, 0.5], [-1.2, 1.3, 0.5], [-1.5, 1.65, 0.55]], '#c9a227', { r: 0.04 });
    M.flow([[EX0 + 0.2, yCr, 0], [EX1 + 1.1, yCr, 0]], '#b9c3cc', { r: 0.05, speed: 2 });
    for (const xc of XTR) for (const dx of [-WB / 2, WB / 2]) {
      const tw = dx > 0 ? -1 : 1;
      M.flow([[EX1 + 1.1, yCr - 0.3, 0.3], [xc * 0.5 + 0.6, 1.2, 0.3], [xc + dx + tw * 0.52, R + 0.45, 0.3]], '#ffd166', { r: 0.04 });
    }

    M.finalize();
    M.len = 15.44; M.center = 0.2;
    M.cam = { pos: [13, 5.5, 13.5], target: [1.0, 2.2, 0] };
    M.env = { gauge: g, track: { style: 'wood', sleeperColor: '#4b3b2f', pitch: 0.6, ballast: ['#8c7a66', '#5a4a3c'] } };
    M.wheelR = R;
    return M;
  };
})();
