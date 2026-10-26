/* Alstom Coradia iLint (Salzgitter, 2016–2018) — automotor de pila de combustible de hidrógeno sobre la plataforma Coradia Lint 54.
   Dos coches, B'2'+2'B', 54,27 m, 2,75 m de ancho, 4,30 m de alto con el equipo de techo. Cotas de la hoja técnica del RMV (BR 654)
   y de Alstom; la posición de los equipos bajo el piso y en el techo sigue la disposición publicada, con medidas estimadas. */
(function () {
  const { T, Kit, G, wheelset, loft, stations } = TB;
  const { Model } = MB;

  MODELS.ilint = function () {
    const M = new Model('ilint', {
      white: ['#e8ebee', { r: 0.32, m: 0.05 }], blue: ['#1f4f9e', { r: 0.38 }], lblue: ['#59a3dc', { r: 0.35 }], roof: ['#b9bfc5', { r: 0.45, m: 0.2 }],
      glass: ['#1e2a33', { r: 0.05, m: 0.6 }], dark: ['#2a2d31', { r: 0.55, m: 0.4 }], steel: ['#b2b7bc', { r: 0.25, m: 0.9 }],
      tyre: ['#2b2c2e', { r: 0.4, m: 0.75 }], truck: ['#33363b', { r: 0.55, m: 0.4 }], rubber: ['#1b1b1c', { r: 0.8 }],
      motor: ['#3e444b', { r: 0.4, m: 0.6 }], copper: ['#b8693d', { r: 0.35, m: 0.85 }], tank: ['#3f454c', { r: 0.35, m: 0.3 }],
      cap: ['#c3c8cd', { r: 0.25, m: 0.85 }], plate: ['#7b8591', { r: 0.35, m: 0.7 }], mem: ['#2f7a62', { r: 0.4, m: 0.1 }],
      cell: ['#4d6b8a', { r: 0.4, m: 0.3 }], lamp: ['#fff3c4', { r: 0.2, em: '#ffe9a0', ei: 1.1 }], tail: ['#c0392b', { r: 0.3, em: '#c0392b', ei: 0.6 }],
      disc: ['#8e9398', { r: 0.3, m: 0.85 }], mg: ['#5b4a3a', { r: 0.6, m: 0.5 }], yellow: ['#e5b32a', { r: 0.4 }],
    });
    const g = 1.435, R = 0.385, WB = 2.5, gear = 4.0;        // rueda Ø 770 mm, empate de bogie y relación de engranajes estimados
    const XE = 27.13, XP = 23.3, XT = 3.6;                    // extremo de cada coche, bogie motor y bogie portador (centros, estimados)
    const yb = 0.98, yt = 3.82, hw = 1.375, yR = 4.3;         // caja; techo con equipos hasta 4,30 m
    const SG = [1, -1];                                       // coche A (x > 0) y coche B (x < 0), simétricos

    // 1 — Caja: dos coches Lint 54 de acero con frente de fibra, 155 plazas (EVB)
    const pC = M.part('caja', { anchor: [17, 3.0, 1.4], explode: [0, 2.6, 0] });
    const STs = {};
    {
      const k = new Kit(); const wh = pC.m('white', { shell: true });
      const base = { w: hw, ym: 2.3, yb, yt, nT: 2.6, nB: 6 };
      const keysA = [
        { ...base, x: 0.22 }, { ...base, x: 24.8, steps: 8 },
        { ...base, x: 25.8, yt: 3.74, w: 1.37, steps: 4 }, { ...base, x: 26.5, yt: 3.45, w: 1.345, steps: 4 },
        { ...base, x: 26.95, yt: 2.95, w: 1.31, ym: 2.2, steps: 4 }, { ...base, x: XE, yt: 2.45, w: 1.27, ym: 2.0, steps: 3 },
      ];
      for (const sg of SG) {
        const keys = (sg > 0 ? keysA : keysA.map(o => ({ ...o, x: -o.x })).reverse()).map(o => ({ ...o }));
        if (sg < 0) { for (let i = keys.length - 1; i > 0; i--) keys[i].steps = keys[i - 1].steps; keys[0].steps = undefined; }
        const ST = stations(keys, 4); STs[sg] = ST;
        k.add(loft(ST, 60), wh);
        const X = (x) => sg * x;
        // librea genérica: banda azul inferior, franja clara, ventanas y puertas siguen la superficie de la caja
        const ang = (y) => { const sn = y >= base.ym ? Math.pow((y - base.ym) / (base.yt - base.ym), base.nT / 2) : -Math.pow((base.ym - y) / (base.ym - base.yb), base.nB / 2); return Math.asin(Math.max(-1, Math.min(1, sn))); };
        const skin = (x0, x1, y0, y1, side, m, off = 0.006, na = 6) => {
          const [xa, xb] = sg > 0 ? [x0, x1] : [-x1, -x0];
          const [a0, a1] = side > 0 ? [ang(y0), ang(y1)] : [Math.PI - ang(y1), Math.PI - ang(y0)];
          k.add(TB.surfPatch(ST, xa, xb, a0, a1, off, 2, na), m);
        };
        for (const s of [1, -1]) {
          skin(0.4, 24.7, 1.02, 1.42, s, pC.m('blue', { shell: true }), 0.005, 8);
          skin(0.4, 24.7, 1.47, 1.53, s, pC.m('lblue', { shell: true }), 0.005, 2);
          for (const [a, b] of [[1.4, 5.4], [7.2, 19.4], [21.4, 24.6]]) for (let x = a + 0.2; x < b - 0.6; x += 1.45) skin(x, x + 1.2, 2.2, 3.05, s, pC.m('glass', { shell: true }), 0.008, 6);
          // puertas dobles con acceso bajo (810 mm sobre el riel)
          for (const xd of [6.3, 20.4]) {
            skin(xd - 0.75, xd + 0.75, 1.05, 2.98, s, pC.m('blue', { shell: true }), 0.007, 8);
            for (const d of [-0.33, 0.33]) skin(xd + d - 0.24, xd + d + 0.24, 1.95, 2.95, s, pC.m('glass', { shell: true }), 0.011, 4);
          }
          skin(0.4, 24.7, 3.12, 3.17, s, pC.m('blue', { shell: true }), 0.005, 2);
        }
        // frente: parabrisas envolvente, faros, luces de cola, enganche Scharfenberg y antiacaballamiento
        k.add(TB.surfPatch(ST, sg > 0 ? 26.2 : -XE + 0.005, sg > 0 ? XE - 0.005 : -26.2, 0.32, Math.PI - 0.32, 0.012, 10, 14), pC.m('glass', { shell: true }));
        for (const s of [1, -1]) {
          k.cyl(pC.m('lamp'), 0.11, 0.04, 'x', X(XE + 0.01), 1.75, s * 0.85, 18);
          k.cyl(pC.m('tail'), 0.06, 0.04, 'x', X(XE + 0.01), 1.75, s * 1.05, 14);
        }
        k.cyl(pC.m('lamp'), 0.08, 0.04, 'x', X(XE - 0.42), 3.12, 0, 14);
        k.box(pC.m('blue', { shell: true }), 0.02, 0.42, 2.2, X(XE + 0.012), 1.24, 0);
        k.box(pC.m('dark'), 0.12, 0.16, 2.3, X(XE + 0.06), 1.0, 0);
        k.cyl(pC.m('dark'), 0.12, 0.7, 'x', X(XE + 0.3), 0.98, 0, 14); k.box(pC.m('steel'), 0.25, 0.28, 0.32, X(XE + 0.68), 0.98, 0);
        // bastidor bajo el piso y faldón
        k.box(pC.m('dark'), 26.6, 0.12, 2.5, X(13.6), 0.98, 0);
      }
      k.build(pC.group);
      // fuelle de intercomunicación entre coches
      const kb = new Kit(); kb.box(pC.m('rubber'), 0.46, 2.4, 2.1, 0, 2.25, 0); for (let i = 0; i < 5; i++) kb.box(pC.m('dark'), 0.03, 2.44, 2.14, -0.2 + i * 0.1, 2.25, 0); kb.build(pC.group);
    }

    // 2 — Depósitos de hidrógeno a 350 bar en el techo: 24 cilindros de material compuesto por coche
    const pH = M.part('tanques', { anchor: [12.9, 4.1, 0.8], explode: [0, 2.0, 0] });
    {
      const k = new Kit(); const fa = pH.m('roof', { shell: true });
      for (const sg of SG) {
        const X = (x) => sg * x;
        const fb = { w: 1.22, ym: 3.95, yb: 3.72, yt: yR - 0.02, nT: 4, nB: 2 };
        const keys = [{ ...fb, x: 6.6, w: 1.0, yt: 4.0 }, { ...fb, x: 7.1 }, { ...fb, x: 18.7, steps: 6 }, { ...fb, x: 19.2, w: 1.0, yt: 4.0 }].map(o => ({ ...o, x: X(o.x) }));
        if (sg < 0) keys.reverse();
        k.add(loft(stations(keys, 3), 40), fa);
        // 4 en el ancho × 6 a lo largo; cada cilindro con sus ojivas metálicas y válvula
        for (let i = 0; i < 6; i++) for (const z of [-0.81, -0.27, 0.27, 0.81]) {
          const x0 = 7.25 + i * 1.92, x1 = x0 + 1.78, xm = X((x0 + x1) / 2);
          k.cyl(pH.m('tank'), 0.2, 1.5, 'x', xm, 4.0, z, 18);
          for (const e of [-1, 1]) k.add(G.sph(0.2, 14, 8), pH.m('tank'), [xm + e * 0.75, 4.0, z], [0, 0, 0], [0.55, 1, 1]);
          k.cyl(pH.m('cap'), 0.05, 0.12, 'x', xm + X(0.92), 4.0, z, 10);
        }
        // colector de alta presión y válvulas
        k.cyl(pH.m('cap'), 0.025, 11.6, 'x', X(13.0), 3.82, 0.0, 8);
        k.box(pH.m('dark'), 0.4, 0.15, 0.5, X(6.95), 3.86, 0);
        // bocas de carga en el costado (unos 15 min por repostaje)
        for (const s of [1, -1]) k.box(pH.m('yellow'), 0.3, 0.22, 0.03, X(8.6), 1.65, s * (hw + 0.01));
      }
      k.build(pH.group);
    }

    // 3 — Pila de combustible PEM (unos 200 kW por coche) y su refrigeración, en el techo junto al enganche entre coches
    const pF = M.part('pila', { anchor: [3.5, 4.05, 0.8], explode: [0, 2.2, 0] });
    const fans = [];
    {
      const k = new Kit(); const sh = pF.m('roof', { shell: true });
      for (const sg of SG) {
        const X = (x) => sg * x;
        k.box(sh, 4.3, 0.46, 2.36, X(3.55), 4.05, 0);
        // dos apilamientos: placas bipolares y membranas
        for (const z of [-0.5, 0.5]) for (let i = 0; i < 34; i++) {
          const x = X(1.75 + i * 0.065);
          k.box(pF.m(i % 2 ? 'mem' : 'plate'), 0.03, 0.32, 0.8, x, 4.02, z);
        }
        for (const x of [1.62, 4.0]) k.box(pF.m('dark'), 0.08, 0.38, 2.0, X(x), 4.02, 0);
        // humidificador, compresor de aire y salida de agua
        k.cyl(pF.m('motor'), 0.13, 0.7, 'z', X(4.8), 4.0, 0, 16);
        k.cyl(pF.m('steel'), 0.07, 0.3, 'y', X(5.3), 4.2, 0.7, 12);
        // ventiladores del radiador
        for (const z of [-0.6, 0.6]) {
          k.add(G.torus(0.34, 0.03, 6, 26), pF.m('dark'), [X(2.6), yR - 0.005, z], [Math.PI / 2, 0, 0]);
          const fg = new T.Group(); fg.position.set(X(2.6), yR - 0.03, z);
          const fk = new Kit(); fk.cyl(pF.m('dark'), 0.07, 0.05, 'y', 0, 0, 0, 12);
          for (let b = 0; b < 5; b++) { const a = b / 5 * Math.PI * 2; fk.box(pF.m('plate'), 0.28, 0.012, 0.09, Math.cos(a) * 0.17, 0, Math.sin(a) * 0.17, 0.3, -a, 0); }
          fk.build(fg); pF.group.add(fg); fans.push(fg);
        }
      }
      k.build(pF.group);
    }

    // 4 — Baterías de iones de litio bajo el piso (unos 110 kWh por coche)
    const pB = M.part('bateria', { anchor: [10.8, 0.62, 1.1], explode: [0, -1.2, 1.6] });
    {
      const k = new Kit();
      for (const sg of SG) {
        const X = (x) => sg * x;
        k.box(pB.m('dark'), 3.6, 0.5, 2.2, X(10.8), 0.66, 0);
        for (let i = 0; i < 8; i++) for (const z of [-0.55, 0.55]) k.box(pB.m('cell'), 0.38, 0.36, 0.95, X(9.25 + i * 0.44), 0.66, z);
        for (let i = 0; i < 9; i++) k.box(pB.m('motor'), 0.03, 0.52, 2.22, X(9.05 + i * 0.44), 0.66, 0);
        k.box(pB.m('copper'), 3.4, 0.04, 0.08, X(10.8), 0.93, 0.95);
      }
      k.build(pB.group);
    }

    // 5 — Convertidores: tracción (ondulador), CC/CC de la batería y auxiliares
    const pV = M.part('convertidores', { anchor: [14.7, 0.65, 1.1], explode: [0, -1.2, -1.6] });
    {
      const k = new Kit();
      for (const sg of SG) {
        const X = (x) => sg * x;
        k.box(pV.m('motor'), 2.6, 0.55, 2.2, X(14.7), 0.64, 0);
        for (let i = 0; i < 16; i++) k.box(pV.m('steel'), 0.03, 0.42, 2.24, X(13.55 + i * 0.15), 0.62, 0);
        k.box(pV.m('dark'), 1.2, 0.45, 1.8, X(16.9), 0.68, 0);
        for (let i = 0; i < 3; i++) k.cyl(pV.m('copper'), 0.09, 0.3, 'z', X(16.5 + i * 0.4), 0.68, 0.98, 12);
      }
      k.build(pV.group);
    }

    // 6 — Motor asíncrono de tracción bajo la caja, cardanes y reductores de eje del bogie motor (B')
    const pM = M.part('motores', { anchor: [19.6, 0.6, 0.7], explode: [0, -0.8, 1.8] });
    const rotors = [], shafts = [];
    {
      for (const sg of SG) {
        const X = (x) => sg * x; const k = new Kit();
        k.cyl(pM.m('motor'), 0.33, 0.95, 'x', X(19.6), 0.62, 0, 28);
        for (let i = 0; i < 10; i++) k.box(pM.m('dark'), 0.9, 0.04, 0.04, X(19.6), 0.62 + Math.sin(i / 10 * Math.PI * 2) * 0.34, Math.cos(i / 10 * Math.PI * 2) * 0.34);
        k.box(pM.m('dark'), 0.7, 0.12, 0.9, X(19.6), 0.98, 0);
        for (const ax of [XP - WB / 2, XP + WB / 2]) { k.box(pM.m('truck'), 0.45, 0.42, 0.5, X(ax), R, 0.12); }
        k.build(pM.group);
        const rot = new T.Group(); rot.position.set(X(19.6), 0.62, 0); const rk = new Kit(); rk.cyl(pM.m('copper'), 0.2, 0.98, 'x', 0, 0, 0, 18);
        for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI * 2; rk.box(pM.m('steel'), 1.0, 0.03, 0.03, 0, Math.cos(a) * 0.21, Math.sin(a) * 0.21); }
        rk.cyl(pM.m('steel'), 0.05, 1.3, 'x', 0, 0, 0, 10); rk.build(rot); rot.name = sg > 0 ? 'I.rotorA' : 'I.rotorB'; pM.group.add(rot); rotors.push(rot);
        // cardán motor → reductor del eje interior y cardán entre reductores
        const mkShaft = (a, b) => {
          const sgp = new T.Group(); const L = Math.hypot(b[0] - a[0], b[1] - a[1]); const sk = new Kit();
          sk.cyl(pM.m('steel'), 0.045, L - 0.2, 'x', L / 2, 0, 0, 10);
          for (const e of [0.06, L - 0.06]) { sk.cyl(pM.m('dark'), 0.09, 0.08, 'x', e, 0, 0, 12); sk.box(pM.m('steel'), 0.06, 0.2, 0.04, e, 0, 0); }
          sk.build(sgp); const holder = new T.Group(); holder.position.set(a[0], a[1], 0.12); holder.rotation.z = Math.atan2(b[1] - a[1], b[0] - a[0]); holder.add(sgp); pM.group.add(holder); shafts.push(sgp);
        };
        const s0 = [X(19.6 + 0.65 * sg) , 0.62], s1 = [X(XP - sg * WB / 2), R], s2 = [X(XP + sg * WB / 2), R];
        const ord = (a, b) => (a[0] < b[0] ? [a, b] : [b, a]);
        mkShaft(...ord(s0, s1)); mkShaft(...ord(s1, s2));
      }
    }

    // 7 — Bogies: motor (B') en cada extremo y portador (2') junto al enganche entre coches
    const pG = M.part('bogies', { anchor: [XP, 0.55, 1.1], explode: [0, -1.0, 0] });
    const wsets = [];
    const trailerAxles = [], discs = [];
    {
      for (const sg of SG) for (const xc0 of [XP, XT]) {
        const xc = sg * xc0; const k = new Kit(); const tk = pG.m('truck');
        for (const dx of [-WB / 2, WB / 2]) {
          const w = wheelset({ R, gauge: g, tread: 0.135, type: 'disc', hubR: 0.1, m: { tyre: pG.m('tyre'), body: pG.m('truck'), hub: pG.m('truck'), axle: pG.m('dark') } });
          w.group.position.set(xc + dx, R, 0); pG.group.add(w.group); wsets.push(w.group);
          if (xc0 === XT) trailerAxles.push(w.group);
        }
        for (const s of [1, -1]) {
          const z = s * 0.98;
          k.add(G.extrude([[-1.7, 0.32], [-1.7, 0.6], [-0.55, 0.74], [0.55, 0.74], [1.7, 0.6], [1.7, 0.32], [1.2, 0.26], [0.45, 0.46], [-0.45, 0.46], [-1.2, 0.26]].map(p => [xc + p[0], p[1]]), 0.1), tk, [0, 0, z]);
          for (const dx of [-WB / 2, WB / 2]) { k.box(tk, 0.3, 0.26, 0.18, xc + dx, R, z); k.cyl(pG.m('steel'), 0.09, 0.22, 'y', xc + dx + (dx > 0 ? -0.3 : 0.3), R + 0.2, z, 12); }
          k.cyl(pG.m('rubber'), 0.27, 0.24, 'y', xc, 0.86, s * 0.95, 22, 0.3);       // resorte neumático secundario
          k.seg(pG.m('steel'), [xc + 0.5, 0.55, z + s * 0.08], [xc + 0.9, 0.9, z + s * 0.08], 0.035, 8);
        }
        k.box(tk, 0.5, 0.22, 2.05, xc, 0.62, 0);
        k.build(pG.group);
      }
    }

    // 8 — Frenos: discos y freno de vía magnético en los bogies portadores; el freno eléctrico recupera energía a la batería
    const pK = M.part('frenos', { anchor: [XT, 0.3, 0.8], explode: [0, -0.9, 1.4] });
    {
      const k = new Kit();
      for (const ax of trailerAxles) {   // discos en los ejes portadores: grupo propio de la pieza «frenos», gira con el eje
        const dg = new T.Group(); dg.position.copy(ax.position); const dk = new Kit();
        for (const z of [-0.32, 0.32]) { dk.cyl(pK.m('disc'), 0.3, 0.05, 'z', 0, 0, z, 28); for (let i = 0; i < 8; i++) { const a = i / 8 * Math.PI * 2; dk.box(pK.m('dark'), 0.05, 0.02, 0.055, Math.cos(a) * 0.22, Math.sin(a) * 0.22, z, 0, 0, a); } }
        dk.build(dg); pK.group.add(dg); discs.push(dg);
      }
      for (const sg of SG) {
        const xc = sg * XT;
        for (const dx of [-WB / 2, WB / 2]) for (const z of [-0.32, 0.32]) k.box(pK.m('dark'), 0.16, 0.22, 0.12, xc + dx + (dx > 0 ? -0.33 : 0.33), R + 0.12, z);
        for (const s of [1, -1]) { k.box(pK.m('mg'), 1.1, 0.1, 0.09, xc, 0.07, s * 0.72); k.box(pK.m('dark'), 0.12, 0.3, 0.05, xc - 0.4, 0.25, s * 0.72); k.box(pK.m('dark'), 0.12, 0.3, 0.05, xc + 0.4, 0.25, s * 0.72); }
      }
      k.build(pK.group);
    }

    // ----- Animación -----
    M.anim.push((s) => {
      const th = -s / R;
      wsets.forEach(w => (w.rotation.z = th)); discs.forEach(d => (d.rotation.z = th));
      rotors.forEach(r => (r.rotation.x = th * gear));
      shafts.forEach(sh => (sh.rotation.x = th * gear));
    });
    // vapor de agua de la pila (único escape) y ventiladores del radiador
    const PW = M.addParticles(pF.group, { count: 900, c0: '#f7f9fb', c1: '#d5dee5', grow: 2.6, rise: 0.9, opacity: 0.42 });
    let acc = 0;
    M.fx.push((t, dt, v) => {
      if (dt <= 0) return;
      const on = M.powered && !M.brake;
      fans.forEach(f => (f.rotation.y += dt * (on ? 14 : 3)));
      if (!on) return;
      acc += dt * (3 + v * 0.2);
      while (acc > 1) { acc--; for (const sg of SG) PW.emit([sg * 5.3, 4.36, 0.7 + (Math.random() - 0.5) * 0.1], [-v * 0.9 + (Math.random() - 0.5) * 0.3, 1.0 + Math.random() * 0.6, (Math.random() - 0.5) * 0.3], 1.8, 0.4, t); }
    });
    M.update(0, 0);

    // ----- Flujos de energía -----
    for (const sg of SG) {
      const X = (x) => sg * x;
      const fH = M.flow([[X(12.5), 4.0, 0.27], [X(7.0), 3.86, 0], [X(5.3), 4.0, 0.2], [X(3.6), 4.0, 0.5]], '#7fe0c0', { r: 0.05 }); fH.userData.noRev = true; fH.userData.offOnBrake = true;
      const fC = M.flow([[X(3.0), 3.9, 0.9], [X(1.0), 3.7, 1.0], [X(1.0), 1.0, 1.0], [X(13.5), 0.78, 0.9]], '#ffd166', { r: 0.05 }); fC.userData.noRev = true; fC.userData.offOnBrake = true;
      M.flow([[X(10.8), 0.95, 0.6], [X(13.6), 0.9, 0.6]], '#ffb347', { r: 0.045 });
      M.flow([[X(15.9), 0.92, 0.5], [X(19.0), 0.95, 0.4], [X(19.6), 0.62, 0.3]], '#ffd166', { r: 0.045 });
      M.flow([[X(19.6), 0.62, 0.12], [X(XP - sg * WB / 2), R, 0.12], [X(XP + sg * WB / 2), R, 0.12]], '#5aa9e6', { r: 0.04, speed: 0.8 });
    }
    M.brakeType = 'regen'; M.regenTo = 'batería';

    M.finalize();
    M.len = 54.27; M.center = 0;
    M.frame = [-4, XE + 0.8];
    M.camDir = [0.6, 0.38, 1];
    // aerogeneradores al fondo: el hidrógeno de la estación de Bremervörde se compraba como subproducto industrial; la meta es el hidrógeno verde
    const rotorsW = [];
    M.env = { gauge: g, track: { style: 'wood', sleeperColor: '#9a968e', sleeperW: 0.26, pitch: 0.6, ballast: ['#8b8780', '#55524d'] },
      extra: (grp0, Rhex, hAt, grp) => {
        const mW = TB.sceneMat('#eef0f2', { r: 0.5 }), mN = TB.sceneMat('#d9dde1', { r: 0.45 });
        for (const [fx, fz, hh] of [[-0.45, -0.62, 10], [0.05, -0.7, 11.5], [0.5, -0.58, 9.5]]) {
          const x = fx * Rhex, z = fz * Rhex, y0 = hAt ? hAt(x, z) : 0;
          const tw = new T.Mesh(G.cyl(0.22, hh, 12, 0.38), mW); tw.position.set(x, y0 + hh / 2, z); tw.castShadow = true; grp.add(tw);
          const nac = new T.Mesh(G.box(1.1, 0.48, 0.48), mN); nac.position.set(x, y0 + hh + 0.15, z + 0.1); grp.add(nac);
          const rot = new T.Group(); rot.position.set(x + 0.62, y0 + hh + 0.15, z + 0.1);
          const hub = new T.Mesh(G.sph(0.22, 12, 8), mW); rot.add(hub);
          for (let b = 0; b < 3; b++) { const bl = new T.Mesh(G.box(0.08, 4.6, 0.3), mW); bl.geometry.translate(0, 2.4, 0); bl.rotation.x = b / 3 * Math.PI * 2; rot.add(bl); }
          rot.rotation.x = fx * 3; grp.add(rot); rotorsW.push(rot);
        }
      } };
    M.fx.push((t, dt) => { if (dt > 0) rotorsW.forEach((r, i) => (r.rotation.x += dt * (0.55 + i * 0.07))); });
    M.wheelR = R; M.gear = gear;
    return M;
  };
})();
