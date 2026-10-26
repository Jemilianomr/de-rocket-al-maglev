/* stage.js — renderizador, luces, entorno, diorama por era */
(function () {
  const T = THREE;

  class Stage {
    constructor(canvas) {
      this.canvas = canvas;
      const r = this.renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance', preserveDrawingBuffer: false });
      r.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      r.outputEncoding = T.sRGBEncoding;
      r.toneMapping = T.ACESFilmicToneMapping; r.toneMappingExposure = 1.0;
      r.shadowMap.enabled = true; r.shadowMap.type = T.PCFSoftShadowMap;
      r.localClippingEnabled = true;
      r.setClearColor(0x000000, 0);
      this.scene = new T.Scene();
      this.camera = new T.PerspectiveCamera(32, 1, 0.1, 600);
      const pm = new T.PMREMGenerator(r);
      this.scene.environment = pm.fromScene(new T.RoomEnvironment(), 0.04).texture;
      pm.dispose();
      this.hemi = new T.HemisphereLight('#dfe9f2', '#5a4a3a', 0.38); this.scene.add(this.hemi);
      const sun = this.sun = new T.DirectionalLight('#fff1d6', 1.7);
      sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048);
      sun.shadow.bias = -0.0004; sun.shadow.normalBias = 0.03;
      this.scene.add(sun); this.scene.add(sun.target);
      this.fill = new T.DirectionalLight('#9fc3e6', 0.45); this.scene.add(this.fill);
      this.controls = new T.OrbitControls(this.camera, canvas);
      Object.assign(this.controls, { enableDamping: true, dampingFactor: 0.085, maxPolarAngle: 1.47, minDistance: 1.5, maxDistance: 120, rotateSpeed: 0.7, zoomSpeed: 0.9 });
      this.envGroup = new T.Group(); this.scene.add(this.envGroup);
      this.holder = new T.Group(); this.scene.add(this.holder); // contiene la raíz del modelo
      this.trackAnim = null; this.model = null;
    }
    resize(w, h) {
      this.renderer.setSize(w, h, false);
      this.camera.aspect = w / Math.max(1, h); this.camera.updateProjectionMatrix();
    }
    disposeGroup(g) {
      g.traverse(o => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => { if (m.map) m.map.dispose(); m.dispose(); });
      });
      while (g.children.length) g.remove(g.children[0]);
    }
    load(model, era) {
      if (this.model) { this.holder.remove(this.model.root); this.disposeGroup(this.model.root); }
      this.disposeGroup(this.envGroup);
      this.model = model;
      model.root.position.x = -model.center;
      this.holder.add(model.root);
      const Rhex = Math.max(9, model.len * 0.62 + 3.5);
      this.Rhex = Rhex;
      const env = model.env;
      const tile = TB.hexTile(Rhex, era.tile);
      tile.position.y = env.groundY ?? -0.72;
      this.envGroup.add(tile);
      this.groundY = tile.position.y;
      const hAt = tile.userData.heightAt;
      // vía
      if (env.track) {
        const tr = TB.track({ length: Rhex * 1.732, gauge: env.gauge, ...env.track });
        this.envGroup.add(tr); this.trackAnim = tr.userData.anim;
      } else this.trackAnim = null;
      const gGrp = new T.Group(); gGrp.position.y = tile.position.y; this.envGroup.add(gGrp);
      if (env.extra) env.extra(this.envGroup, Rhex, hAt, gGrp);
      // catenaria
      if (env.catenary) {
        const xs = []; const sp = env.catenary.span ?? 30;
        for (let x = -Rhex * 0.82; x <= Rhex * 0.84; x += sp) xs.push(x);
        if (xs.length < 2) xs.push(Rhex * 0.8);
        const c = TB.catenary({ masts: xs, gauge: env.gauge, base: this.groundY, ...env.catenary });
        this.envGroup.add(c);
      }
      // utilería de la era
      if (era.props) era.props(gGrp, Rhex, hAt);
      // luz y sombra
      const s = this.sun;
      const d = era.sunDir || [-0.6, 1.05, 0.7];
      const dv = new T.Vector3(...d).normalize();
      s.position.copy(dv.multiplyScalar(Rhex * 1.6)); s.target.position.set(0, 0, 0);
      s.color.set(era.sun || '#fff1d6'); s.intensity = era.sunI ?? 1.7;
      const cam = s.shadow.camera; const ext = Rhex * 1.05;
      cam.left = -ext; cam.right = ext; cam.top = ext; cam.bottom = -ext; cam.near = 0.5; cam.far = Rhex * 4; cam.updateProjectionMatrix();
      this.hemi.color.set(era.sky || '#dfe9f2'); this.hemi.groundColor.set(era.groundLight || '#5a4a3a');
      this.fill.position.set(-Rhex, Rhex * 0.4, -Rhex * 0.6);
      this.scene.fog = new T.Fog(era.fog || '#1a2833', Rhex * 2.2, Rhex * 5.5);
      this.controls.maxDistance = Rhex * 3.2;
      this.controls.minDistance = 1.2;
    }
    camPreset() {
      const m = this.model; const off = -m.center;
      const b = m.bbox.clone();
      if (m.frame) { b.min.x = Math.max(b.min.x, m.frame[0]); b.max.x = Math.min(b.max.x, m.frame[1]); }
      b.min.x += off; b.max.x += off;
      const size = b.getSize(new T.Vector3()), c = b.getCenter(new T.Vector3());
      c.y = b.min.y + size.y * 0.42;
      const dir = new T.Vector3(...(m.camDir || [0.62, 0.42, 1])).normalize();
      const az = Math.atan2(Math.abs(dir.x), dir.z), el = Math.asin(dir.y);
      const vf = this.camera.fov * Math.PI / 180, hf = 2 * Math.atan(Math.tan(vf / 2) * this.camera.aspect);
      const hw = 0.5 * (size.x * Math.cos(az) + size.z * Math.sin(az));
      const hh = 0.5 * (size.y * Math.cos(el) + (size.x * Math.sin(az) + size.z * Math.cos(az)) * Math.sin(el));
      const d = Math.max(hw / Math.tan(hf / 2), hh / Math.tan(vf / 2)) * (m.camFit || 1.3) + size.z * 0.5;
      return { pos: c.clone().addScaledVector(dir, d), target: c };
    }
    render() { this.renderer.render(this.scene, this.camera); }
  }

  // ---------- Utilería por era ----------
  const P = {};
  const sm = TB.sceneMat;
  function trees(g, R, hAt, n, seed, kind, colors, avoidW = 4.2) {
    const pts = TB.randPts(R, n, seed, (x, z) => z > -avoidW, hAt);
    if (kind === 'pine') {
      const geo = TB.G.cyl(1.05, 2.4, 7, 0.0); geo.translate(0, 2.1, 0);
      const geo2 = TB.G.cyl(0.8, 2.0, 7, 0.0); geo2.translate(0, 3.3, 0);
      TB.scatter(g, geo, sm(colors[0], { flat: true }), pts); TB.scatter(g, geo2, sm(colors[0], { flat: true }), pts);
      const tr = TB.G.cyl(0.13, 1.2, 6); tr.translate(0, 0.6, 0); TB.scatter(g, tr, sm('#5b4330'), pts);
    } else if (kind === 'poplar') {
      const geo = new THREE.SphereGeometry(0.9, 8, 6); geo.scale(0.75, 2.6, 0.75); geo.translate(0, 3.2, 0);
      TB.scatter(g, geo, sm(colors[0], { flat: true }), pts);
      const tr = TB.G.cyl(0.12, 1.4, 6); tr.translate(0, 0.7, 0); TB.scatter(g, tr, sm('#5b4330'), pts);
    } else {
      const geo = new THREE.IcosahedronGeometry(1.15, 0); geo.translate(0, 2.4, 0);
      TB.scatter(g, geo, sm(colors[0], { flat: true }), pts);
      const tr = TB.G.cyl(0.14, 1.6, 6); tr.translate(0, 0.8, 0); TB.scatter(g, tr, sm('#5b4330'), pts);
    }
    return pts;
  }
  function poles(g, R, z, spacing, h, color, wires) {
    const k = new TB.Kit(); const m = sm(color || '#5b4330');
    const xs = []; for (let x = -R * 0.8; x <= R * 0.8; x += spacing) xs.push(x);
    xs.forEach(x => { k.cyl(m, 0.09, h, 'y', x, h / 2, z, 6, 0.11); k.box(m, 0.06, 0.06, 1.1, x, h - 0.25, z); });
    const grp = new THREE.Group(); k.build(grp);
    if (wires) {
      const km = new TB.Kit(); const wm = sm('#2b2b2b');
      for (let i = 0; i < xs.length - 1; i++) for (const dz of [-0.4, 0.4]) {
        const a = xs[i], b = xs[i + 1]; const pts = [];
        for (let t = 0; t <= 6; t++) { const u = t / 6; pts.push([a + (b - a) * u, h - 0.2 - Math.sin(u * Math.PI) * 0.35, z + dz]); }
        km.add(TB.G.tube(pts, 0.012, 10, 4), wm);
      }
      km.build(grp, { cast: false });
    }
    g.add(grp);
  }
  function rocks(g, R, hAt, n, seed, color, avoidW = 4) {
    const pts = TB.randPts(R, n, seed, (x, z) => (z > -avoidW && !(z > avoidW + 1 && Math.abs(x) > R * 0.4)), hAt);
    const geo = new THREE.DodecahedronGeometry(0.6, 0); geo.scale(1, 0.6, 1);
    TB.scatter(g, geo, sm(color, { flat: true }), pts, i => 0.6 + (i % 5) * 0.35);
  }
  function wall(g, R, z, color) { // muro de piedra seca
    const k = new TB.Kit(); const m = sm(color, { flat: true });
    for (let x = -R * 0.8; x < R * 0.8; x += 0.7) k.box(m, 0.68, 0.5 + Math.sin(x * 3) * 0.06, 0.45, x, 0.25, z + Math.sin(x * 0.7) * 0.15);
    const grp = new THREE.Group(); k.build(grp); g.add(grp);
  }
  function fence(g, R, z, color) { // cerca de rieles en zigzag (worm fence)
    const k = new TB.Kit(); const m = sm(color, { flat: true });
    let s = 1;
    for (let x = -R * 0.8; x < R * 0.8; x += 2.0) {
      for (let h = 0.15; h < 1.1; h += 0.22) k.bar(m, [x, h, z + s * 0.35], [x + 2.0, h + 0.05, z - s * 0.35], 0.07, 0.07);
      s = -s;
    }
    const grp = new THREE.Group(); k.build(grp); g.add(grp);
  }
  function mountain(g, x, z, r, h, c1, snow) {
    const geo = new THREE.ConeGeometry(r, h, 9, 3);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) { const y = pos.getY(i); if (y < h / 2 - 0.01) { pos.setX(i, pos.getX(i) * (0.9 + TB.fbm(i, 3) * 0.3)); pos.setZ(i, pos.getZ(i) * (0.9 + TB.fbm(3, i) * 0.3)); } }
    geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, sm(c1, { flat: true })); m.position.set(x, h / 2 - 0.3, z); m.castShadow = true; m.receiveShadow = true; g.add(m);
    if (snow) { const cap = new THREE.Mesh(new THREE.ConeGeometry(r * 0.36, h * 0.36, 9), sm('#f1f4f6', { flat: true })); cap.position.set(x, h - h * 0.18 - 0.28, z); g.add(cap); }
  }
  function signal(g, x, z) { // semáforo ferroviario
    const k = new TB.Kit();
    k.cyl(sm('#e8e4da'), 0.08, 6, 'y', x, 3, z, 8);
    k.box(sm('#b22a22'), 1.0, 0.22, 0.05, x + 0.45, 5.4, z + 0.1, 0, 0, 0.6);
    k.box(sm('#f2f2f2'), 0.12, 0.2, 0.06, x + 0.75, 5.62, z + 0.12, 0, 0, 0.6);
    k.box(sm('#2b2b2b'), 0.5, 0.05, 0.5, x, 6.02, z);
    const grp = new THREE.Group(); k.build(grp); g.add(grp);
  }
  function fields(g, R, zFrom, zTo, colors, rows, tall) {
    const k = new TB.Kit(); const mats = colors.map(c => sm(c, { flat: true }));   // un material por color: una malla por color
    for (let z = zFrom; z < zTo; z += rows) {
      for (let x = -R * 0.85; x < R * 0.85; x += 1.3) {
        if (!TB.inHex(x, z, R * 0.94)) continue;
        k.box(mats[(Math.floor(z * 3) & 1)], 1.2, tall ?? 0.35, rows * 0.45, x, (tall ?? 0.35) / 2, z);
      }
    }
    const grp = new THREE.Group(); k.build(grp, { cast: false }); g.add(grp);
  }
  function paddies(g, R, hAt) {
    const k = new TB.Kit(); const w = sm('#7fa7b5', { r: 0.15, m: 0.1 }); const d = sm('#a9a06a');
    for (let x = -R * 0.8; x < R * 0.8; x += 4.2) for (const z of [6.5, 11, -6.5, -11]) {
      if (!TB.inHex(x, z, R * 0.9)) continue;
      k.box(w, 3.8, 0.06, 3.8, x, 0.08, z); k.box(d, 4.1, 0.14, 0.2, x, 0.07, z + 2.0); k.box(d, 0.2, 0.14, 4.1, x + 2.05, 0.07, z);
    }
    const grp = new THREE.Group(); k.build(grp, { cast: false }); g.add(grp);
    // brotes de arroz
    const pts = []; for (let x = -R * 0.8; x < R * 0.8; x += 0.7) for (const z0 of [6.5, 11, -6.5, -11]) for (let dz = -1.5; dz <= 1.5; dz += 0.75) if (TB.inHex(x, z0 + dz, R * 0.88)) pts.push([x, 0.1, z0 + dz, 0, 1]);
    const geo = TB.G.cyl(0.0, 0.35, 4, 0.06); geo.translate(0, 0.17, 0);
    TB.scatter(g, geo, sm('#6f9e3f', { flat: true }), pts);
  }
  function buildings(g, R, z0, z1, seed) {
    const k = new TB.Kit(); let s = seed; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    const cols = [sm('#8d96a3', { flat: true }), sm('#7b8794', { flat: true }), sm('#a3a6ad', { flat: true })];
    const win = new THREE.MeshStandardMaterial({ color: '#2a3442', emissive: '#ffcf8a', emissiveIntensity: 0.35, roughness: 0.4 });
    for (let x = -R * 0.8; x < R * 0.8; x += 6 + rnd() * 4) {
      const z = z0 + rnd() * (z1 - z0); if (!TB.inHex(x, z, R * 0.9)) continue;
      const h = 4 + rnd() * 9, w = 3 + rnd() * 2.5;
      k.box(cols[Math.floor(rnd() * 3)], w, h, w * 0.8, x, h / 2, z);
      for (let y = 1.5; y < h - 0.6; y += 1.4) k.box(win, w + 0.02, 0.28, w * 0.8 + 0.02, x, y, z);
    }
    const grp = new THREE.Group(); k.build(grp); g.add(grp);
  }

  P.rainhill = (g, R, h) => { wall(g, R, -R * 0.42, '#8e8779'); trees(g, R, h, Math.round(R * 0.9), 11, 'round', ['#5d7a3a'], 4.6); rocks(g, R, h, 6, 5, '#8e8779', 4); };
  P.georgia = (g, R, h) => { fence(g, R, -R * 0.38, '#7a6448'); trees(g, R, h, Math.round(R * 1.4), 23, 'pine', ['#3f5f37'], 4.6); poles(g, R, -3.9, 9, 5.2, '#5b4330', true); };
  P.alps = (g, R, h) => { trees(g, R, h, Math.round(R * 1.2), 31, 'pine', ['#2f4f3a'], 5); rocks(g, R, h, 14, 7, '#8a8c8e', 4.5); };
  P.ecml = (g, R, h) => { trees(g, R, h, Math.round(R * 0.7), 41, 'round', ['#4f7a3a'], 5); fields(g, R, -R * 0.75, -R * 0.35, ['#9bae5b', '#c3b35e'], 2.2, 0.12); signal(g, R * 0.42, -3.4); };
  P.west = (g, R, h) => { rocks(g, R, h, 12, 9, '#a5704a', 4.5); poles(g, R, -3.8, 11, 6, '#6b5640', true); const pts = TB.randPts(R, 40, 77, (x, z) => Math.abs(z) < 4.5, h); const geo = new THREE.IcosahedronGeometry(0.35, 0); geo.translate(0, 0.25, 0); TB.scatter(g, geo, sm('#7d8a5a', { flat: true }), pts); };
  P.tokaido = (g, R, h) => { paddies(g, R, h); trees(g, R, h, 8, 51, 'pine', ['#355e3b'], 13); mountain(g, -R * 0.42, -R * 0.68, R * 0.2, R * 0.26, '#6f7f93', true); };
  P.bourgogne = (g, R, h) => { fields(g, R, 6.5, R * 0.8, ['#5f7d33', '#7f8f3a'], 1.3, 0.3); trees(g, R, h, Math.round(R * 0.35), 61, 'poplar', ['#4f6e2f'], 5.5); fields(g, R, -R * 0.8, -5.5, ['#c8b46a', '#b9a65b'], 3, 0.1); };
  P.pudong = (g, R, h) => { buildings(g, R, -R * 0.82, -R * 0.6, 91); trees(g, R, h, 10, 93, 'round', ['#4b7040'], 7); };

  // ---------- utilería de las eras añadidas en la v3 ----------
  function lamps(g, R, z, spacing) { // farolas de gas de hierro fundido
    const k = new TB.Kit(); const ir = sm('#2c2f33', { r: 0.5, m: 0.5 }); const gl = new THREE.MeshStandardMaterial({ color: '#f6e2a8', emissive: '#ffd27a', emissiveIntensity: 0.6, roughness: 0.3 });
    for (let x = -R * 0.78; x <= R * 0.78; x += spacing) {
      k.cyl(ir, 0.06, 2.6, 'y', x, 1.3, z, 8, 0.08); k.cyl(ir, 0.14, 0.12, 'y', x, 0.06, z, 10);
      k.add(TB.G.cyl(0.13, 0.32, 6, 0.18), gl, [x, 2.78, z]); k.add(TB.G.cyl(0.2, 0.1, 6, 0.02), ir, [x, 3.0, z]);
    }
    const grp = new THREE.Group(); k.build(grp); g.add(grp);
  }
  function pavilion(g, x, z, w, d, h) { // pabellón de hierro y vidrio con cubierta en arco
    const k = new TB.Kit(); const ir = sm('#3a4048', { r: 0.5, m: 0.5 }); const gl = sm('#9fb7c4', { r: 0.15, m: 0.3 }); const st = sm('#c9bfa8', { flat: true });
    k.box(st, w, 0.5, d, x, 0.25, z);
    for (let i = 0; i <= 8; i++) { const xx = x - w / 2 + i * w / 8; k.box(ir, 0.12, h, 0.12, xx, h / 2 + 0.5, z + d / 2); k.box(ir, 0.12, h, 0.12, xx, h / 2 + 0.5, z - d / 2); }
    k.box(gl, w, h - 0.4, 0.04, x, h / 2 + 0.5, z + d / 2 - 0.02);
    const roof = new THREE.CylinderGeometry(d / 2, d / 2, w, 24, 1, true, 0, Math.PI); roof.rotateZ(Math.PI / 2);
    k.add(roof, gl, [x, h + 0.5, z], [0, 0, 0], [1, 0.55, 1]);
    for (let i = 0; i <= 8; i++) k.add(TB.G.torus(d / 2, 0.05, 4, 20, Math.PI), ir, [x - w / 2 + i * w / 8, h + 0.5, z], [0, Math.PI / 2, 0], [1, 0.55, 1]);
    const grp = new THREE.Group(); k.build(grp); g.add(grp);
  }
  function pennants(g, R, z, spacing, colors) {
    const k = new TB.Kit(); const wd = sm('#e8e2d2'), br = sm('#c99a3c', { m: 0.8, r: 0.3 }), cm = colors.map(c => sm(c));
    let i = 0;
    for (let x = -R * 0.7; x <= R * 0.7; x += spacing, i++) {
      k.cyl(wd, 0.05, 6, 'y', x, 3, z, 8); k.sph(br, 0.09, x, 6.05, z);
      k.add(TB.G.extrude([[0, 0], [1.4, -0.25], [0, -0.5]], 0.02), cm[i % cm.length], [x + 0.05, 5.8, z]);
    }
    const grp = new THREE.Group(); k.build(grp); g.add(grp);
  }
  function sage(g, R, hAt, n, seed, color) { // artemisa de las altas llanuras
    const pts = TB.randPts(R, n, seed, (x, z) => Math.abs(z) < 4.2, hAt);
    const geo = new THREE.IcosahedronGeometry(0.38, 0); geo.scale(1, 0.6, 1); geo.translate(0, 0.2, 0);
    TB.scatter(g, geo, sm(color, { flat: true }), pts, i => 0.6 + (i % 4) * 0.25);
  }
  function mesa(g, x, z, r, h, color) {
    const geo = new THREE.CylinderGeometry(r * 0.72, r, h, 9, 1); geo.translate(0, h / 2 - 0.4, 0);
    const m = new THREE.Mesh(geo, sm(color, { flat: true })); m.position.set(x, 0, z); m.castShadow = true; m.receiveShadow = true; g.add(m);
  }
  function birches(g, R, hAt, n, seed) {
    const pts = TB.randPts(R, n, seed, (x, z) => z > -5.5, hAt);
    const geo = new THREE.SphereGeometry(0.9, 7, 5); geo.scale(0.8, 1.6, 0.8); geo.translate(0, 3.2, 0);
    TB.scatter(g, geo, sm('#7f9a45', { flat: true }), pts);
    const tr = TB.G.cyl(0.09, 2.4, 6); tr.translate(0, 1.2, 0); TB.scatter(g, tr, sm('#e6e2d8'), pts);
  }
  P.berlin1879 = (g, R, h) => { lamps(g, R, -2.6, 4.2); pennants(g, R, -6.2, 3.4, ['#b8402e', '#e8e2d2', '#2f4a6a', '#c99a3c']); pavilion(g, -R * 0.15, -R * 0.7, R * 0.8, 3.0, 2.6); trees(g, R, h, Math.round(R * 0.5), 71, 'round', ['#4f6e33'], 7.5); };
  P.wyoming = (g, R, h) => { sage(g, R, h, Math.round(R * 2.2), 83, '#8a9470'); rocks(g, R, h, 10, 13, '#9a8468', 4.6); poles(g, R, -4.1, 12, 6.2, '#6b5640', true); mesa(g, -R * 0.3, -R * 0.72, R * 0.22, R * 0.12, '#a5866a'); mesa(g, R * 0.45, -R * 0.62, R * 0.16, R * 0.09, '#9a7c62'); };
  P.niedersachsen = (g, R, h) => { fields(g, R, 6.0, R * 0.8, ['#6f9a3c', '#9ab04a'], 1.6, 0.25); fields(g, R, -R * 0.8, -6.5, ['#c9b45a', '#8aa84a'], 2.4, 0.12); birches(g, R, h, Math.round(R * 0.35), 97); };

  window.STAGE = { Stage, PROPS: P };
})();
