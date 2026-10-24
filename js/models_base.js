/* models_base.js — clase Model común a los 8 trenes */
(function () {
  const { T, mat } = TB;

  class Model {
    constructor(id, pal) {
      this.id = id; this.pal = pal;
      this.root = new T.Group(); this.root.name = id;
      this.parts = {}; this.order = [];
      this.flows = []; this.flowGroup = new T.Group(); this.flowGroup.visible = false; this.root.add(this.flowGroup);
      this.anim = []; this.s = 0;
    }
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
    flow(points, color, opt) { const m = TB.flowLine(points, color, opt); this.flowGroup.add(m); this.flows.push(m); return m; }
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
    update(dt, v) { this.s += v * dt; for (const f of this.anim) f(this.s, dt, v); }
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

  window.MB = { Model, sliderCrank, pinPos, diamondPanto, singleArmPanto };
  window.MODELS = {};
})();
