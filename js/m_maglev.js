/* Transrapid SMT de Shanghái (Siemens/ThyssenKrupp, 2004) — levitación electromagnética (EMS) y motor lineal síncrono de estator largo */
(function () {
  const { T, Kit, G, loft, ringOpen, stations } = TB;
  const { Model } = MB;

  MODELS.maglev = function () {
    const M = new Model('maglev', {
      white: ['#f1f2f0', { r: 0.3, m: 0.05 }], blue: ['#2a5aa8', { r: 0.4 }], grey: ['#9aa0a6', { r: 0.4, m: 0.3 }],
      glass: ['#1f2b33', { r: 0.05, m: 0.6 }], concrete: ['#b9b6ae', { r: 0.9 }], concrete2: ['#a7a49c', { r: 0.9 }],
      steel: ['#8c9196', { r: 0.35, m: 0.85 }], lam: ['#4d5257', { r: 0.4, m: 0.7 }], dark: ['#25282c', { r: 0.55, m: 0.4 }],
      magnet: ['#3a4048', { r: 0.4, m: 0.6 }], coil: ['#b8693d', { r: 0.35, m: 0.8 }], rubber: ['#1b1b1c', { r: 0.8 }],
      skid: ['#c9c2a8', { r: 0.6 }], batt: ['#3c5a46', { r: 0.5, m: 0.3 }], lamp: ['#fff3c4', { r: 0.2, em: '#ffe9a0', ei: 0.9 }],
      hatchCap: ['#d9573b', { r: 0.7 }], poleN: ['#d9573b', { r: 0.4, em: '#d9573b', ei: 0.25 }], poleS: ['#3b78c9', { r: 0.4, em: '#3b78c9', ei: 0.25 }],
      gen: ['#d8a33a', { r: 0.35, m: 0.7 }], brake: ['#6b4c8a', { r: 0.4, m: 0.4 }],
    });
    const tau = 0.258;                // paso polar del estator (m)
    const X0 = -13.4, X1 = 27.0;      // extensión del modelo
    const GL = 64;                    // largo de la viga visible
    const zS = 1.08, wS = 0.42;       // centro y ancho del paquete de estator
    const yStB = -0.53;               // cara inferior del estator
    const gap = 0.010;
    const lift = 0.056;               // 7 mm reales × 8 (exagerado para que se vea)
    const vehicleGroups = [];

    // 1 — Viga guía (hormigón) con pilas
    const pV = M.part('viga', { anchorT: [-1.4, 0], explode: [0, -1.4, 0] });
    const piers = [];
    {
      const k = new Kit(); const c = pV.m('concrete');
      const xc = (X0 + X1) / 2;
      // tablero superior en "T" con voladizos
      k.add(G.extrude([[-1.4, 0], [1.4, 0], [1.4, -0.3], [0.62, -0.38], [0.62, -0.55], [-0.62, -0.55], [-0.62, -0.38], [-1.4, -0.3]].map(p => [p[0], p[1]]), GL), c, [xc, 0, 0], [0, Math.PI / 2, 0]);
      // alma en cajón
      k.add(G.extrude([[-0.62, -0.55], [0.62, -0.55], [0.5, -2.3], [-0.5, -2.3]], GL), pV.m('concrete2'), [xc, 0, 0], [0, Math.PI / 2, 0]);
      // franjas de deslizamiento y rieles de guiado (acero)
      for (const s of [1, -1]) {
        k.box(pV.m('steel'), GL, 0.02, 0.18, xc, 0.01, s * 1.15);
        k.box(pV.m('steel'), GL, 0.5, 0.05, xc, -0.27, s * 1.425);
      }
      k.build(pV.group);
      const pk = new Kit();
      pk.cyl(c, 0.75, 6.0, 'y', 0, -5.3, 0, 20); pk.box(c, 1.6, 0.5, 2.2, 0, -2.45, 0); pk.box(c, 2.6, 0.5, 2.6, 0, -8.05, 0);
      const pierGeo = TB.merge([...pk.lists.values()].flat()); pk.lists.clear();
      const inst = new T.InstancedMesh(pierGeo, pV.m('concrete'), 4); inst.castShadow = true; inst.receiveShadow = true; pV.group.add(inst);
      piers.push(inst);
    }

    // 2 — Estator largo: paquetes laminados + devanado trifásico (campo viajero)
    const pS = M.part('estator', { anchorT: [-0.45, 1.08], explode: [0, -0.9, 1.6] });
    const slots = [];
    const slotPitch = tau / 3, nSlots = Math.ceil(GL / slotPitch);
    let coilInst;
    {
      const k = new Kit();
      for (const s of [1, -1]) k.box(pS.m('lam'), GL, 0.14, wS, (X0 + X1) / 2, -0.45, s * zS);
      k.build(pS.group);
      const cg = G.box(slotPitch * 0.62, 0.035, wS + 0.05);
      coilInst = new T.InstancedMesh(cg, pS.m('coil'), nSlots * 2);
      coilInst.instanceMatrix.setUsage(T.DynamicDrawUsage);
      const c0 = new T.Color('#888');
      for (let i = 0; i < nSlots * 2; i++) coilInst.setColorAt(i, c0);
      coilInst.instanceColor.setUsage(T.DynamicDrawUsage);
      pS.group.add(coilInst);
    }

    // Grupo del vehículo (se eleva al levitar)
    function vgroup(part) { const g = new T.Group(); part.group.add(g); vehicleGroups.push(g); return g; }
    const modules = []; // posiciones de módulos magnéticos
    for (const [a, b] of [[0.6, 23.6], [X0 + 0.6, -0.9]]) { const n = Math.round((b - a) / 3.1); for (let i = 0; i < n; i++) modules.push(a + (i + 0.5) * (b - a) / n); }

    // 3 — Imanes de sustentación (atraen el vehículo hacia el estator)
    const pM = M.part('sustentacion', { anchorT: [-0.62, -1.08], explode: [0, -1.0, 2.4] });
    {
      const g = vgroup(pM); const k = new Kit();
      for (const x of modules) for (const s of [1, -1]) {
        k.box(pM.m('magnet'), 2.9, 0.16, wS, x, yStB - gap - 0.08, s * zS);
        // polos alternos N/S con el mismo paso que el campo del estator
        const n = Math.floor(2.8 / tau);
        for (let i = 0; i < n; i++) {
          const px = x - 1.4 + (i + 0.5) * tau;
          const pol = Math.cos(Math.PI * px / tau) > 0;
          k.box(pM.m(pol ? 'poleN' : 'poleS'), tau * 0.55, 0.012, wS - 0.04, px, yStB - gap - 0.003, s * zS);
        }
      }
      k.build(g);
    }

    // 4 — Imanes de guiado (frente al riel lateral)
    const pG = M.part('guiado', { anchorT: [-0.27, 1.53], explode: [0, -0.4, 2.9] });
    {
      const g = vgroup(pG); const k = new Kit();
      for (const x of modules) for (const s of [1, -1]) { k.box(pG.m('magnet'), 2.9, 0.42, 0.13, x, -0.27, s * (1.45 + gap + 0.065)); k.box(pG.m('coil'), 2.7, 0.36, 0.02, x, -0.27, s * (1.45 + gap + 0.005)); }
      k.build(g);
    }

    // 5 — Bastidores de levitación (envuelven la viga) y suspensión neumática
    const pC = M.part('chasis', { anchorT: [-0.79, -1.7], explode: [0, -0.2, 3.4] });
    {
      const g = vgroup(pC); const k = new Kit(); const dk = pC.m('dark');
      for (const x of modules) for (const s of [1, -1]) {
        k.add(G.extrude([[1.38, 0.2], [1.75, 0.2], [1.75, -0.86], [0.82, -0.86], [0.82, -0.72], [1.6, -0.72], [1.6, 0.06], [1.38, 0.06]].map(p => [p[0] * s, p[1]]), 2.6), dk, [x, 0, 0], [0, Math.PI / 2, 0]);
        k.cyl(pC.m('rubber'), 0.17, 0.18, 'y', x - 0.8, 0.3, s * 1.5, 18, 0.19);
        k.cyl(pC.m('rubber'), 0.17, 0.18, 'y', x + 0.8, 0.3, s * 1.5, 18, 0.19);
      }
      k.build(g);
    }

    // 6 — Generador lineal (bobinas en los polos) y baterías de a bordo
    const pL = M.part('generador', { anchorT: [-0.69, 1.08], explode: [0, 1.2, -2.0] });
    {
      const g = vgroup(pL); const k = new Kit();
      for (const x of modules) for (const s of [1, -1]) k.box(pL.m('gen'), 2.7, 0.03, wS - 0.1, x, yStB - gap - 0.15, s * zS);
      for (const x of [6, 14, 20, -7]) k.box(pL.m('batt'), 1.6, 0.35, 1.2, x, 0.38, 0);
      k.build(g);
    }

    // 7 — Patines de apoyo y freno de corrientes parásitas
    const pK = M.part('patines', { anchorT: [0.12, 1.15], explode: [0, 0.7, -2.6] });
    {
      const g = vgroup(pK); const k = new Kit();
      for (const x of modules.filter((_, i) => i % 2 === 0)) for (const s of [1, -1]) { k.box(pK.m('skid'), 0.8, 0.08, 0.16, x, 0.06, s * 1.15); k.box(pK.m('dark'), 0.6, 0.1, 0.2, x, 0.14, s * 1.15); }
      for (const x of [3.0, 16.5, -6.5]) for (const s of [1, -1]) k.box(pK.m('brake'), 1.6, 0.36, 0.12, x, -0.27, s * (1.45 + 0.02 + 0.2));
      k.build(g);
    }

    // 8 — Carrocería aerodinámica (Cd ≈ 0,26)
    const pB = M.part('carroceria', { anchorT: [2.7, 1.6], explode: [0, 3.0, 0] });
    {
      const g = vgroup(pB); const k = new Kit(); const wh = pB.m('white', { shell: true });
      const base = { w: 1.85, ym: 1.05, yb: -0.86, nT: 2.3 };
      const keys = [
        { ...base, x: 0.0, yt: 3.32 }, { ...base, x: 20.8, yt: 3.32, steps: 10 },
        { ...base, x: 22.6, yt: 2.95, w: 1.84, steps: 4 }, { ...base, x: 24.3, yt: 2.2, w: 1.72, ym: 0.95, yb: -0.6, steps: 5 },
        { ...base, x: 25.6, yt: 1.45, w: 1.42, ym: 0.75, yb: 0.08, steps: 5 }, { ...base, x: 26.55, yt: 0.95, w: 0.95, ym: 0.55, yb: 0.3, steps: 4 },
        { ...base, x: 27.0, yt: 0.62, w: 0.3, ym: 0.48, yb: 0.38, steps: 3 },
      ];
      const ST = stations(keys, 3);
      k.add(loft(ST, 64, [false, false], ringOpen, false), wh);
      k.add(G.sph(0.2, 14, 10), wh, [27.0, 0.5, 0], [0, 0, 0], [0.5, 0.6, 1.5]);
      const ST2 = stations([{ ...base, x: X0, yt: 3.32 }, { ...base, x: -0.4, yt: 3.32 }], 6);
      k.add(loft(ST2, 64, [false, false], ringOpen, false), wh);
      // piso y tabiques
      k.box(pB.m('grey'), X1 - X0 - 1.5, 0.08, 3.6, (X0 + X1) / 2 - 0.7, 0.2, 0);
      k.box(pB.m('rubber'), 0.6, 2.8, 3.5, -0.2, 1.75, 0);
      // ventanas y franja azul
      for (const [a, b] of [[1.2, 20.3], [X0 + 0.8, -1.2]]) for (const s of [1, -1]) {
        for (let x = a; x < b; x += 1.25) k.box(pB.m('glass'), 0.9, 0.62, 0.02, x + 0.45, 2.0, s * 1.852);
        k.box(pB.m('blue'), b - a, 0.08, 0.02, (a + b) / 2, 1.38, s * 1.853);
      }
      // parabrisas
      k.add(TB.surfPatch(ST, 23.0, 24.4, Math.PI / 2 - 0.85, Math.PI / 2 + 0.85, 0.012, 10, 14, (s, a) => ringOpen(s, 0.5 + (a - Math.PI / 2) / Math.PI * 0.6)), pB.m('glass'));
      // tapa de corte de la sección intermedia (vista truncada)
      const prof = []; for (let i = 0; i <= 40; i++) { const [y, z] = ringOpen({ ...base, yt: 3.32 }, i / 40); prof.push([z, y]); }
      prof.push([-1.85, 0.25], [1.85, 0.25]);
      k.add(G.extrude(prof.map(p => [p[0], p[1]]), 0.02), pB.m('hatchCap'), [X0 - 0.01, 0, 0], [0, Math.PI / 2, 0]);
      k.build(g);
    }

    // ----- Animación: desplazamiento relativo, campo viajero síncrono y levitación -----
    const m4 = new T.Matrix4(), cN = new T.Color('#ff6a3d'), cS = new T.Color('#3d8bff'), cOff = new T.Color('#4a3f38'), tmp = new T.Color();
    let liftNow = 0;
    M.powered = false;
    function layoutTrack(off) {
      // pilas cada 24,8 m
      for (let i = 0; i < 4; i++) {
        let x = X0 - 6 + ((i * 24.8 - off) % (4 * 24.8) + 4 * 24.8) % (4 * 24.8);
        const vis = x < X1 + 12 ? 1 : 0.0001;
        m4.compose(new T.Vector3(x, 0, 0), new T.Quaternion(), new T.Vector3(vis, vis, vis)); piers[0].setMatrixAt(i, m4);
      }
      piers[0].instanceMatrix.needsUpdate = true;
      const xa = (X0 + X1) / 2 - GL / 2;
      let i = 0;
      for (let k = 0; k < nSlots; k++) {
        const x = xa + (((k * slotPitch - off) % GL) + GL) % GL;
        const inside = x > X0 - 0.5 && x < X1 + 0.5;
        const B = Math.cos(Math.PI * x / tau);
        if (M.powered && inside) tmp.copy(B > 0 ? cN : cS).lerp(cOff, 1 - Math.min(1, Math.abs(B) * 1.3)); else tmp.copy(cOff);
        for (const s of [1, -1]) {
          m4.makeTranslation(x, -0.535 + 0.0, s * zS); coilInst.setMatrixAt(i, m4); coilInst.setColorAt(i, tmp); i++;
        }
      }
      coilInst.instanceMatrix.needsUpdate = true; coilInst.instanceColor.needsUpdate = true;
    }
    let off = 0;
    M.anim.push((s, dt, v) => {
      off = s;
      layoutTrack(off);
      const target = M.powered ? lift : 0;
      liftNow += (target - liftNow) * Math.min(1, dt * 4 * (M.timeScale ? 1 / Math.max(0.05, M.timeScale) : 1));
      if (dt === 0) liftNow = target;
      vehicleGroups.forEach(g => (g.position.y = liftNow));
    });
    M.update(0, 0);
    M.trackless = true;

    // flujos: subestación → estator (campo viajero); generador lineal → baterías → imanes
    M.flow([[5, -7.6, -1.8], [5, -2.4, -1.5], [5, -0.6, -1.25], [12, -0.5, -1.08], [20, -0.5, -1.08]], '#ffd166', { r: 0.06 });
    M.flow([[10, -0.72, 1.08], [10, 0.1, 1.2], [14, 0.4, 0.4]], '#d8a33a', { r: 0.045 });
    M.flow([[14, 0.4, -0.2], [17, 0.2, -1.2], [17, -0.65, -1.08]], '#7bd389', { r: 0.045 });

    M.finalize();
    M.frame = [0, 27.2];
    M.secY = 0.2; M.secH = 4.0;
    M.len = 40.4; M.center = (X0 + X1) / 2;
    M.cam = { pos: [36, 5.5, 18], target: [20, 0.8, 0] };
    M.env = { gauge: 2.8, track: null, groundY: -8.3 };
    M.wheelR = null;
    return M;
  };
})();
