/* models_base.js — clase Model común a los 8 trenes */
(function () {
  const { T, mat } = TB;

  class Model {
    constructor(id, pal) {
      this.id = id; this.pal = pal;
      this.root = new T.Group(); this.root.name = id;
      this.parts = {}; this.order = [];
      this.flows = []; this.flowGroup = new T.Group(); this.flowGroup.visible = false; this.root.add(this.flowGroup);
      this.anim = []; this.s = 0; this.tSim = 0;
      this.fx = []; this.particles = []; this.steam = null; this.lights = [];
      this.modes = {}; this.brakeFlows = []; this.brake = false; this.irregular = false;
    }
    // sistema de partículas anclado a un grupo (sigue la explosión de la pieza)
    addParticles(group, o) { const P = new TB.Particles(o); P.mat.uniforms.uScale = TB.GU.uPScale; group.add(P.points); this.particles.push(P); return P; }
    // simulación de vapor (presión en cámaras de cilindro y golpes de escape)
    initSteam(o) { this.steam = { cyls: [], pB: o.pB, cut: o.cut ?? 0.35, clr: o.clr ?? 0.08, pex: o.pex ?? 0.08, Rw: o.Rw, onBeat: o.onBeat || null, pAssumed: !!o.pAssumed }; setValveEvents(this.steam); return this.steam; }
    setCutoff(c) { if (!this.steam) return; this.steam.cut = c; setValveEvents(this.steam); if (this.onCutoff) this.onCutoff(c); this.update(0, 0); }
    part(id, o = {}) {
      const g = new T.Group(); g.userData.partId = id; this.root.add(g);
      const self = this;
      const p = {
        id, group: g, explode: new T.Vector3(...(o.explode || [0, 0, 0])), anchorOverride: o.anchor ? new T.Vector3(...o.anchor) : null,
        mats: {}, focus: o.focus || null, anchorT: o.anchorT || null,
        m(key, extra = {}) {
          const ck = key + (extra.shell ? '#s' : '') + (extra.tag || '');
          if (!this.mats[ck]) {
            const def = self.pal[key]; if (!def) throw new Error('pal ' + key);
            const mm = mat(def[0], { ...(def[1] || {}), ...extra, interior: !!extra.shell || !!extra.interior });
            if (extra.shell) mm.userData.shell = true;
            this.mats[ck] = mm;
          }
          return this.mats[ck];
        },
      };
      this.parts[id] = p; this.order.push(id);
      return p;
    }
    flow(points, color, opt = {}) { const m = TB.flowLine(points, color, opt); m.userData.sp = opt.speed ?? 1; m.userData.c0 = color; this.flowGroup.add(m); this.flows.push(m); return m; }
    // flujo que sólo aparece en modo freno (energía hacia resistencias)
    bflow(points, color, opt = {}) { const m = TB.flowLine(points, color, opt); m.userData.sp = opt.speed ?? 1; m.visible = false; this.flowGroup.add(m); this.brakeFlows.push(m); return m; }
    setBrake(on) {
      this.brake = !!on;
      // regenerativo: el flujo se invierte y se tiñe de verde (energía devuelta a la red)
      if (this.brakeType === 'regen') this.flows.forEach(f => { if (f.userData.noRev) return; const u = f.material.uniforms; u.uSpeed.value = Math.abs(f.userData.sp) * (on ? -1 : 1); if (u.uC) u.uC.value.set(on ? '#7bd389' : f.userData.c0); });
      if (this.brakeType === 'rheo') { this.flows.forEach(f => (f.visible = !on || !!f.userData.keep)); this.brakeFlows.forEach(f => (f.visible = !!on)); }
      if (this.onBrake) this.onBrake(on);
    }
    finalize() {
      const box = new T.Box3();
      for (const id of this.order) {
        const p = this.parts[id];
        box.setFromObject(p.group);
        p.box = box.clone();
        p.anchor = p.anchorOverride || box.getCenter(new T.Vector3());
        p.radius = box.getSize(new T.Vector3()).length() / 2;
        p.matList = Object.values(p.mats);
        p.group.traverse(o => { if (o.isMesh) o.userData.partId = id; });
      }
      this.bbox = new T.Box3().setFromObject(this.root);
    }
    setExplode(k) { for (const id of this.order) { const p = this.parts[id]; p.group.position.copy(p.explode).multiplyScalar(k); } }
    update(dt, v) {
      this.s += v * dt; this.tSim += dt; this.vNow = v;
      for (const f of this.anim) f(this.s, dt, v);
      if (this.steam) updateSteam(this, dt);
      for (const f of this.fx) f(this.tSim, dt, v);
      for (const P of this.particles) { P.mat.uniforms.uTime.value = this.tSim; P.flush(); }
    }
  }

  // Cinemática biela-manivela con eje de deslizamiento por el centro del eje
  // A: centro del eje [x,y]; u: vector unitario del eje del cilindro (desde el eje hacia el cilindro)
  // pin: [x,y] del muñón; L: longitud de biela. Devuelve distancia de la cruceta a lo largo de u.
  function sliderCrank(A, u, pin, L) {
    const px = pin[0] - A[0], py = pin[1] - A[1];
    const pu = px * u[0] + py * u[1];
    const pn = -px * u[1] + py * u[0];
    return pu + Math.sqrt(Math.max(0, L * L - pn * pn));
  }
  function pinPos(A, r, ang) { return [A[0] + r * Math.cos(ang), A[1] + r * Math.sin(ang)]; }

  // Pantógrafo romboidal (diamante) — devuelve {group, set(h)}; h = altura de trabajo sobre la base
  function diamondPanto(part, o) {
    const g = new T.Group();
    const w = o.w ?? 1.5, base = o.base ?? 1.3, la = o.arm ?? 0.95, mm = part.m(o.mat ?? 'panto'), mi = part.m(o.ins ?? 'insul');
    const k0 = new TB.Kit();
    k0.box(mm, base + 0.2, 0.06, w * 0.8, 0, 0.05, 0);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) k0.cyl(mi, 0.055, 0.26, 'y', sx * base * 0.42, -0.11, sz * w * 0.33, 12);
    k0.build(g);
    const arms = new T.Group(); g.add(arms);
    const head = new T.Group(); g.add(head);
    const hw = o.headW ?? 1.95;
    const kh = new TB.Kit();
    kh.box(mm, 0.07, 0.05, hw, -0.11, 0, 0); kh.box(mm, 0.07, 0.05, hw, 0.11, 0, 0);
    for (const sz of [-1, 1]) kh.add(TB.G.torus(0.13, 0.022, 6, 12, Math.PI), mm, [0, -0.02, sz * hw / 2], [0, sz > 0 ? 0 : Math.PI, Math.PI / 2]);
    kh.build(head);
    let armMeshes = [];
    function set(h) {
      armMeshes.forEach(m => { arms.remove(m); m.geometry.dispose(); });
      const k = new TB.Kit();
      const hh = Math.max(0.1, h), kx = Math.sqrt(Math.max(0.0025, la * la - (hh / 2) ** 2));
      for (const sz of [-0.33 * w, 0.33 * w]) {
        const y0 = 0.08, ym = y0 + hh / 2, yt = y0 + hh;
        k.seg(mm, [-0.12, y0, sz], [-kx, ym, sz * 0.85], 0.032, 6);
        k.seg(mm, [0.12, y0, sz], [kx, ym, sz * 0.85], 0.032, 6);
        k.seg(mm, [-kx, ym, sz * 0.85], [-0.06, yt, sz * 0.55], 0.024, 6);
        k.seg(mm, [kx, ym, sz * 0.85], [0.06, yt, sz * 0.55], 0.024, 6);
      }
      for (const sx of [-1, 1]) k.seg(mm, [sx * kx, 0.08 + hh / 2, -0.29 * w], [sx * kx, 0.08 + hh / 2, 0.29 * w], 0.02, 6);
      k.seg(mm, [-0.12, 0.08, -0.33 * w], [-0.12, 0.08, 0.33 * w], 0.04, 8);
      k.seg(mm, [0.12, 0.08, -0.33 * w], [0.12, 0.08, 0.33 * w], 0.04, 8);
      armMeshes = k.build(arms);
      head.position.set(0, 0.08 + hh + 0.03, 0);
    }
    set(o.h ?? 0.3);
    return { group: g, set, head };
  }

  // Pantógrafo de un solo brazo (dos etapas, tipo TGV)
  function singleArmPanto(part, o) {
    const g = new T.Group(); const mm = part.m(o.mat ?? 'panto'), mi = part.m(o.ins ?? 'insul');
    const k0 = new TB.Kit();
    k0.box(mm, 1.6, 0.08, 0.9, 0, 0.06, 0);
    for (const sx of [-0.65, 0.65]) for (const sz of [-0.3, 0.3]) k0.cyl(mi, 0.06, 0.26, 'y', sx, -0.1, sz, 12);
    k0.build(g);
    const lower = new T.Group(), upper = new T.Group(), head = new T.Group();
    g.add(lower); lower.add(upper); upper.add(head);
    const L1 = o.L1 ?? 1.7, L2 = o.L2 ?? 1.75;
    const kl = new TB.Kit();
    for (const sz of [-0.28, 0.28]) kl.seg(mm, [0, 0, sz], [L1, 0, sz * 0.25], 0.045, 6);
    kl.seg(mm, [0, 0, -0.3], [0, 0, 0.3], 0.06, 8);
    kl.cyl(mm, 0.07, 0.12, 'z', L1, 0, 0, 12);
    kl.build(lower);
    const ku = new TB.Kit();
    ku.seg(mm, [0, 0, 0], [L2, 0, 0], 0.03, 6);
    ku.seg(mm, [0.1, -0.06, 0.05], [L2 * 0.92, -0.03, 0.03], 0.013, 4);
    ku.build(upper);
    const hw = o.headW ?? 1.6;
    const kh = new TB.Kit();
    kh.box(mm, 0.07, 0.05, hw, -0.1, 0.06, 0); kh.box(mm, 0.07, 0.05, hw, 0.1, 0.06, 0);
    kh.seg(mm, [0, 0, 0], [0, 0.05, 0], 0.03, 6);
    kh.build(head);
    lower.position.set(o.pivotX ?? 0.75, 0.14, 0); upper.position.set(L1, 0, 0); head.position.set(L2, 0, 0);
    function set(H) {
      H = Math.max(0.15, H);
      let lo = 0.02, hi = 1.5, a = 0.3, b = 0;
      for (let i = 0; i < 40; i++) {
        a = (lo + hi) / 2;
        b = Math.acos(Math.min(1, L1 * Math.cos(a) / L2));
        const hgt = L1 * Math.sin(a) + L2 * Math.sin(b);
        if (hgt > H) hi = a; else lo = a;
      }
      lower.rotation.z = Math.PI - a;
      upper.rotation.z = b - (Math.PI - a);
      head.rotation.z = -b;
    }
    set(o.h ?? 0.8);
    return { group: g, set };
  }

  // ---------- Ciclo ideal de vapor ----------
  // x: posición del pistón medida desde la tapa de la cámara (0 = volumen mínimo), fracción de la carrera.
  function setValveEvents(st) {
    const c = st.cut;
    st.rel = Math.min(0.96, 0.72 + 0.3 * c);            // escape anticipado
    st.comp = 0.08 + 0.3 * Math.max(0, 0.75 - c);        // compresión (fracción de carrera que falta)
    st.lead = 0.015;
  }
  function chamberP(x, power, st) {
    const c = st.clr, n = 1.3, pb = st.pex;
    if (power) {
      const pa = 1 - 0.05 * Math.min(x, st.cut);
      if (x <= st.cut) return pa;
      const p1 = pa * Math.pow((c + st.cut) / (c + Math.min(x, st.rel)), n);
      if (x <= st.rel) return p1;
      return p1 + (pb - p1) * Math.min(1, (x - st.rel) / Math.max(0.02, 1 - st.rel) * 1.35);
    }
    if (x >= st.comp) return pb;
    const pc = pb * Math.pow((c + st.comp) / (c + Math.max(0, x)), n);
    if (x > st.lead) return Math.min(1, pc);
    return Math.min(1, pc + (1 - pc) * (1 - x / st.lead));
  }
  // diagrama indicado (lazo cerrado) y presión media efectiva
  function indicator(st, N = 120) {
    const pts = [];
    for (let i = 0; i <= N; i++) { const x = i / N; pts.push([st.clr + x, chamberP(x, true, st)]); }
    for (let i = N; i >= 0; i--) { const x = i / N; pts.push([st.clr + x, chamberP(x, false, st)]); }
    let W = 0; for (let i = 1; i < pts.length; i++) W += (pts[i][0] - pts[i - 1][0]) * (pts[i][1] + pts[i - 1][1]) / 2;
    return { pts, mep: W };
  }
  // cámara de vapor ligada a un cilindro: src es el objeto de la animación del modelo, que escribe xc y phi
  function steamCyl(M, grp, o) {
    const geo = new T.CylinderGeometry(o.bore * 0.96, o.bore * 0.96, 1, 28, 1, false);
    const mA = new T.Mesh(geo, TB.chamberMat()), mB = new T.Mesh(geo, TB.chamberMat());
    const rz = Math.atan2(o.u[1], o.u[0]) - Math.PI / 2;
    for (const m of [mA, mB]) { m.rotation.z = rz; m.position.z = o.z; m.userData.chamber = true; grp.add(m); }
    const c = { ...o, mA, mB, prev: [0, 0], pA: 0, pBv: 0, xA: 0, xB: 0, powA: false, powB: false };
    M.steam.cyls.push(c);
    return c;
  }
  const _c = new T.Color();
  function placeSeg(m, A, u, a, b) {
    const L = Math.max(0.002, b - a), mid = (a + b) / 2;
    m.position.x = A[0] + u[0] * mid; m.position.y = A[1] + u[1] * mid; m.scale.set(1, L, 1);
  }
  function updateSteam(M, dt) {
    const st = M.steam;
    for (const c of st.cyls) {
      const src = c.src; if (src.xc == null) continue;
      const xc = src.xc, f = (xc - (c.L - c.r)) / (2 * c.r);
      const pinF = pinPos(src.A || c.A, c.r, src.phi - 0.02);
      const xcF = sliderCrank(c.A, c.u, pinF, c.L);
      const inc = xcF > xc; // la posición f crecerá en marcha adelante
      const xp = xc + c.pr;
      placeSeg(c.mA, c.A, c.u, c.d0 + 0.005, xp - c.pt);        // cámara del lado de la manivela
      placeSeg(c.mB, c.A, c.u, xp + c.pt, c.d1 - 0.005);        // cámara del lado de la tapa
      const xA = Math.min(1, Math.max(0, f)), xB = 1 - xA;
      const pA = chamberP(xA, inc, st), pBv = chamberP(xB, !inc, st);
      c.xA = xA; c.xB = xB; c.pA = pA; c.pBv = pBv; c.powA = inc; c.powB = !inc;
      c.mA.material.color.copy(TB.pressureColor(_c, pA));
      c.mB.material.color.copy(TB.pressureColor(_c, pBv));
      if (dt > 0) {
        // golpe de escape: la cámara en carrera motriz cruza el punto de escape
        if (inc && c.prev[0] < st.rel && xA >= st.rel && st.onBeat) st.onBeat(c, dt);
        if (!inc && c.prev[1] < st.rel && xB >= st.rel && st.onBeat) st.onBeat(c, dt);
      }
      c.prev[0] = xA; c.prev[1] = xB;
    }
  }

  // emisor de bocanadas de vapor/humo en la chimenea
  function puff(P, at, v, t, o = {}) {
    const n = o.n ?? 8, up = o.up ?? 4.5, spread = o.spread ?? 0.6, life = o.life ?? 2.4, size = o.size ?? 0.35;
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, r = Math.random() * spread;
      P.emit([at[0] + (Math.random() - 0.5) * (o.rx ?? 0.15), at[1], at[2] + (Math.random() - 0.5) * (o.rz ?? 0.15)],
        [Math.cos(a) * r - v * (0.85 + Math.random() * 0.25), up * (0.65 + Math.random() * 0.6), Math.sin(a) * r], life * (0.7 + Math.random() * 0.6), size * (0.7 + Math.random() * 0.6), t);
    }
  }
  // llama del hogar: parpadeo de emisivo y luz puntual
  function fireFx(M, mats, light, base = 1.3) {
    let ph = 0;
    M.fx.push((t, dt, v) => {
      ph += dt * (6 + v * 0.3);
      const fl = 0.75 + 0.25 * Math.sin(ph * 2.1) * Math.sin(ph * 3.7 + 1.3) + 0.12 * Math.sin(ph * 11.0);
      const k = M.powered ? 1 : 0.55;
      mats.forEach(m => { if (m) m.emissiveIntensity = base * k * (0.8 + 0.5 * fl); });
      if (light) light.intensity = (M.powered ? 3.2 : 1.2) * (0.75 + 0.35 * fl);
    });
  }
  // chispas en el contacto pantógrafo–hilo
  function pantoSparks(M, group, pts) {
    const PK = M.addParticles(group, { kind: 'spark', count: 220, c0: '#e9f6ff', c1: '#6fb7ff', grow: -0.7, rise: 0, grav: 6 });
    let acc = 0;
    M.fx.push((t, dt, v) => {
      if (!M.powered || dt <= 0 || v < 1) return;
      acc += dt * (0.6 + v * 0.05);
      while (acc > 1) { acc--; const p = pts[Math.floor(Math.random() * pts.length)];
        for (let i = 0; i < 7; i++) PK.emit([p[0] + (Math.random() - 0.5) * 0.1, p[1], p[2] + (Math.random() - 0.5) * 0.9], [-v * 0.15 + (Math.random() - 0.5) * 3, Math.random() * 2.5, (Math.random() - 0.5) * 3], 0.25 + Math.random() * 0.3, 0.035, t); }
    });
    return PK;
  }
  function fireLight(M, pos, dist = 2.6) {
    const L = new T.PointLight('#ff8a3a', 1.2, dist, 2); L.position.set(...pos); M.root.add(L); M.lights.push(L); return L;
  }

  window.MB = { Model, sliderCrank, pinPos, diamondPanto, singleArmPanto, chamberP, indicator, steamCyl, puff, fireFx, fireLight, setValveEvents, pantoSparks };
  window.MODELS = {};
})();
