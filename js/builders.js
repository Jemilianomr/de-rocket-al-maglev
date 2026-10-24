/* ============================================================
   builders.js — primitivas geométricas, materiales con corte de
   sección, ruedas, loft de carrocerías, vía y diorama hexagonal.
   Unidades: metros. Eje X = longitudinal (avance +X), Y = vertical,
   Z = transversal (cámara en +Z). Y = 0 en la cabeza del riel.
   ============================================================ */
(function () {
  const T = THREE;
  if (T.ColorManagement) T.ColorManagement.legacyMode = false;
  const TAU = Math.PI * 2;

  // ---------- Plano de corte compartido y uniformes globales ----------
  const SECTION = new T.Plane(new T.Vector3(0, 0, -1), 50);
  const GU = { uCut: { value: 0 } };

  function patchCut(m, interior) {
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uCut = GU.uCut;
      const inj = interior
        ? `if (uCut > 0.5 && !gl_FrontFacing) { gl_FragColor.rgb *= 0.5; }`
        : `if (uCut > 0.5 && !gl_FrontFacing) {
          float h = step(0.5, fract((gl_FragCoord.x + gl_FragCoord.y) / 10.0));
          gl_FragColor = vec4(mix(vec3(0.86, 0.36, 0.24), vec3(0.64, 0.22, 0.15), h), gl_FragColor.a);
        }`;
      sh.fragmentShader = 'uniform float uCut;\n' + sh.fragmentShader.replace('#include <dithering_fragment>', '#include <dithering_fragment>\n' + inj);
    };
    m.customProgramCacheKey = () => interior ? 'cutInt1' : 'cutHatch1';
  }

  function mat(color, o = {}) {
    const m = new T.MeshStandardMaterial({
      color,
      roughness: o.r ?? 0.55,
      metalness: o.m ?? 0.05,
      side: T.DoubleSide,
      clippingPlanes: o.noClip ? null : [SECTION],
      clipShadows: !o.noClip,
      envMapIntensity: o.env ?? 0.9,
      flatShading: !!o.flat,
      transparent: !!o.transparent,
      opacity: o.opacity ?? 1,
    });
    if (o.em) { m.emissive = new T.Color(o.em); m.emissiveIntensity = o.ei ?? 1; }
    patchCut(m, !!o.interior);
    m.userData.base = { opacity: m.opacity, transparent: m.transparent, emissive: m.emissive.clone(), ei: m.emissiveIntensity };
    return m;
  }

  // Material sin corte para escenario (terreno, vía)
  function sceneMat(color, o = {}) {
    const m = new T.MeshStandardMaterial({
      color, roughness: o.r ?? 0.9, metalness: o.m ?? 0, flatShading: !!o.flat,
      vertexColors: !!o.vc, envMapIntensity: o.env ?? 0.4,
    });
    if (o.map) m.map = o.map;
    return m;
  }

  // ---------- Geometrías ----------
  const G = {
    box: (w, h, d) => new T.BoxGeometry(w, h, d),
    cyl: (r, len, seg = 24, r2, open = false) => new T.CylinderGeometry(r2 ?? r, r, len, seg, 1, open),
    sph: (r, ws = 20, hs = 14) => new T.SphereGeometry(r, ws, hs),
    torus: (R, r, rs = 10, ts = 32, arc = TAU) => new T.TorusGeometry(R, r, rs, ts, arc),
    lathe: (pts, seg = 32) => new T.LatheGeometry(pts.map(p => new T.Vector2(p[0], p[1])), seg),
    tube: (pts, r, seg = 40, rs = 8) => new T.TubeGeometry(new T.CatmullRomCurve3(pts.map(p => new T.Vector3(...p)), false, 'centripetal'), seg, r, rs, false),
    poly: (pts, r, rs = 8) => { // tubo por tramos rectos (tuberías)
      const path = new T.CurvePath();
      for (let i = 0; i < pts.length - 1; i++) path.add(new T.LineCurve3(new T.Vector3(...pts[i]), new T.Vector3(...pts[i + 1])));
      return new T.TubeGeometry(path, Math.max(2, (pts.length - 1) * 2), r, rs, false);
    },
    extrude: (pts, depth, bevel = 0) => {
      const s = new T.Shape(pts.map(p => new T.Vector2(p[0], p[1])));
      const g = new T.ExtrudeGeometry(s, { depth, bevelEnabled: bevel > 0, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 2, curveSegments: 16 });
      g.translate(0, 0, -depth / 2);
      return g;
    },
    // sector anular (contrapesos, ventanas en arco)
    sector: (r1, r2, a0, a1, depth, seg = 16) => {
      const pts = [];
      for (let i = 0; i <= seg; i++) { const a = a0 + (a1 - a0) * i / seg; pts.push([Math.cos(a) * r2, Math.sin(a) * r2]); }
      for (let i = seg; i >= 0; i--) { const a = a0 + (a1 - a0) * i / seg; pts.push([Math.cos(a) * r1, Math.sin(a) * r1]); }
      return G.extrude(pts, depth);
    },
  };

  // orientar geometría de eje Y a eje dado
  function axisRot(axis) {
    if (axis === 'x') return [0, 0, -Math.PI / 2];
    if (axis === 'z') return [Math.PI / 2, 0, 0];
    return [0, 0, 0];
  }

  // ---------- Kit: acumula geometrías y las fusiona por material ----------
  const _q = new T.Quaternion(), _e = new T.Euler(), _v = new T.Vector3(), _s = new T.Vector3();
  class Kit {
    constructor() { this.lists = new Map(); }
    add(geo, m, pos = [0, 0, 0], rot = [0, 0, 0], scl = [1, 1, 1]) {
      let g = geo.index ? geo.toNonIndexed() : geo;
      if (g === geo) g = geo.clone();
      _e.set(rot[0], rot[1], rot[2], rot[3] || 'XYZ');
      const mtx = new T.Matrix4().compose(_v.set(pos[0], pos[1], pos[2]), _q.setFromEuler(_e), _s.set(scl[0], scl[1], scl[2]));
      g.applyMatrix4(mtx);
      if (!this.lists.has(m)) this.lists.set(m, []);
      this.lists.get(m).push(g);
      geo.dispose && geo !== g && geo.dispose();
      return this;
    }
    addMtx(geo, m, mtx) {
      let g = geo.index ? geo.toNonIndexed() : geo.clone();
      g.applyMatrix4(mtx);
      if (!this.lists.has(m)) this.lists.set(m, []);
      this.lists.get(m).push(g);
      return this;
    }
    box(m, w, h, d, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) { return this.add(G.box(w, h, d), m, [x, y, z], [rx, ry, rz]); }
    cyl(m, r, len, axis = 'y', x = 0, y = 0, z = 0, seg = 24, r2, open = false) {
      return this.add(G.cyl(r, len, seg, r2, open), m, [x, y, z], axisRot(axis));
    }
    sph(m, r, x, y, z, sx = 1, sy = 1, sz = 1, ws = 20, hs = 14) { return this.add(G.sph(r, ws, hs), m, [x, y, z], [0, 0, 0], [sx, sy, sz]); }
    // cilindro entre dos puntos
    seg(m, a, b, r, rs = 10, r2) {
      const A = new T.Vector3(...a), Bv = new T.Vector3(...b);
      const len = A.distanceTo(Bv); if (len < 1e-5) return this;
      const g = G.cyl(r, len, rs, r2 ?? r);
      const mid = A.clone().add(Bv).multiplyScalar(0.5);
      const dir = Bv.clone().sub(A).normalize();
      const q = new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 1, 0), dir);
      const mtx = new T.Matrix4().compose(mid, q, new T.Vector3(1, 1, 1));
      return this.addMtx(g, m, mtx);
    }
    // caja entre dos puntos (barra rectangular)
    bar(m, a, b, w, h, upHint) {
      const A = new T.Vector3(...a), Bv = new T.Vector3(...b);
      const len = A.distanceTo(Bv); if (len < 1e-5) return this;
      const g = G.box(len, h, w);
      const mid = A.clone().add(Bv).multiplyScalar(0.5);
      const dir = Bv.clone().sub(A).normalize();
      const q = new T.Quaternion().setFromUnitVectors(new T.Vector3(1, 0, 0), dir);
      return this.addMtx(g, m, new T.Matrix4().compose(mid, q, new T.Vector3(1, 1, 1)));
    }
    build(parent, opts = {}) {
      const meshes = [];
      for (const [m, geos] of this.lists) {
        const geo = merge(geos);
        geos.forEach(g => g.dispose());
        const mesh = new T.Mesh(geo, m);
        mesh.castShadow = opts.cast !== false;
        mesh.receiveShadow = opts.receive !== false;
        if (m.userData.shell) mesh.userData.shell = true;
        parent.add(mesh); meshes.push(mesh);
      }
      this.lists.clear();
      return meshes;
    }
  }

  function merge(geos) {
    let n = 0; for (const g of geos) n += g.attributes.position.count;
    const pos = new Float32Array(n * 3), nor = new Float32Array(n * 3), uv = new Float32Array(n * 2);
    let o = 0;
    for (const g of geos) {
      const c = g.attributes.position.count;
      if (!g.attributes.normal) g.computeVertexNormals();
      pos.set(g.attributes.position.array, o * 3);
      nor.set(g.attributes.normal.array, o * 3);
      if (g.attributes.uv) uv.set(g.attributes.uv.array, o * 2);
      o += c;
    }
    const geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.BufferAttribute(pos, 3));
    geo.setAttribute('normal', new T.BufferAttribute(nor, 3));
    geo.setAttribute('uv', new T.BufferAttribute(uv, 2));
    geo.computeBoundingSphere(); geo.computeBoundingBox();
    return geo;
  }

  // ---------- Loft: carrocerías por secciones superelípticas ----------
  // st: {x, w (semiancho), yb, yt, ym (altura de ancho máx.), nT, nB, zc (desplazamiento)}
  function ringPoint(s, a) {
    const c = Math.cos(a), sn = Math.sin(a);
    const up = sn >= 0;
    const n = up ? (s.nT ?? 3) : (s.nB ?? 4);
    const ym = s.ym ?? (s.yb + s.yt) / 2;
    const h = up ? (s.yt - ym) : (ym - s.yb);
    const z = s.w * Math.sign(c) * Math.pow(Math.abs(c), 2 / n) + (s.zc || 0);
    const y = ym + h * Math.sign(sn) * Math.pow(Math.abs(sn), 2 / n);
    return [y, z];
  }
  function loft(stations, n = 48, caps = [true, true], ringFn = ringPoint, closed = true) {
    const S = stations.length;
    const pos = [], uv = [], idx = [];
    for (let i = 0; i < S; i++) {
      const s = stations[i];
      for (let j = 0; j < n; j++) {
        const a = closed ? (j / n) * TAU : j / (n - 1);
        const [y, z] = ringFn(s, a);
        pos.push(s.x, y, z); uv.push(i / (S - 1), j / n);
      }
    }
    const jm = closed ? n : n - 1;
    for (let i = 0; i < S - 1; i++) for (let j = 0; j < jm; j++) {
      const a = i * n + j, b = i * n + (j + 1) % n, c = (i + 1) * n + j, d = (i + 1) * n + (j + 1) % n;
      idx.push(a, c, b, b, c, d);
    }
    const addCap = (i, flip) => {
      const s = stations[i]; let cy = 0, cz = 0;
      for (let j = 0; j < n; j++) { cy += pos[(i * n + j) * 3 + 1]; cz += pos[(i * n + j) * 3 + 2]; }
      const ci = pos.length / 3; pos.push(s.x, cy / n, cz / n); uv.push(i / (S - 1), 0.5);
      for (let j = 0; j < jm; j++) { const a = i * n + j, b = i * n + (j + 1) % n; flip ? idx.push(ci, b, a) : idx.push(ci, a, b); }
    };
    if (caps[0]) addCap(0, false);
    if (caps[1]) addCap(S - 1, true);
    const geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    geo.setAttribute('uv', new T.Float32BufferAttribute(uv, 2));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    // orientación: normal del punto más alto de la estación central debe apuntar hacia +Y
    const mid = Math.floor(S / 2);
    let best = -1, by = -1e9;
    for (let j = 0; j < n; j++) { const y = pos[(mid * n + j) * 3 + 1]; if (y > by) { by = y; best = j; } }
    const ny = geo.attributes.normal.array[(mid * n + best) * 3 + 1];
    if (ny < 0) {
      for (let k = 0; k < idx.length; k += 3) { const t = idx[k + 1]; idx[k + 1] = idx[k + 2]; idx[k + 2] = t; }
      geo.setIndex(idx); geo.computeVertexNormals();
    }
    return geo;
  }
  // perfil abierto (faldones): t en [0,1] recorre faldón der. → techo → faldón izq.
  function ringOpen(s, t) {
    const n = s.nT ?? 2.5, ym = s.ym, h = s.yt - s.ym, w = s.w;
    const skirt = ym - s.yb; const arc = Math.PI * (w + h) / 2;
    const total = skirt * 2 + arc; const d = t * total;
    if (d < skirt) return [s.yb + d, w + (s.flare || 0) * (1 - d / skirt)];
    if (d > skirt + arc) { const e = d - skirt - arc; return [ym - e, -w - (s.flare || 0) * (e / skirt)]; }
    const a = ((d - skirt) / arc) * Math.PI;
    const c = Math.cos(a), sn = Math.sin(a);
    return [ym + h * Math.pow(Math.abs(sn), 2 / n), w * Math.sign(c) * Math.pow(Math.abs(c), 2 / n)];
  }
  // interpolación cúbica monótona (PCHIP) de parámetros entre claves → estaciones suaves
  function pchip(xs, ys) {
    const n = xs.length, h = [], d = [], m = new Array(n).fill(0);
    for (let i = 0; i < n - 1; i++) { h[i] = xs[i + 1] - xs[i]; d[i] = (ys[i + 1] - ys[i]) / h[i]; }
    m[0] = d[0]; m[n - 1] = d[n - 2];
    for (let i = 1; i < n - 1; i++) {
      if (d[i - 1] * d[i] <= 0) m[i] = 0;
      else { const w1 = 2 * h[i] + h[i - 1], w2 = h[i] + 2 * h[i - 1]; m[i] = (w1 + w2) / (w1 / d[i - 1] + w2 / d[i]); }
    }
    return (x) => {
      let i = 0; while (i < n - 2 && x > xs[i + 1]) i++;
      const t = (x - xs[i]) / h[i], t2 = t * t, t3 = t2 * t;
      return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h[i] * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h[i] * m[i + 1];
    };
  }
  function stations(keys, steps = 4) {
    const xs = keys.map(k => k.x);
    const params = Object.keys(keys[0]).filter(k => k !== 'x' && typeof keys[0][k] === 'number');
    const fns = {};
    for (const p of params) fns[p] = pchip(xs, keys.map(k => k[p] ?? keys[0][p]));
    const out = [];
    for (let i = 0; i < keys.length - 1; i++) {
      const st = keys[i + 1].steps ?? steps;
      for (let k = 0; k < st; k++) {
        const x = xs[i] + (xs[i + 1] - xs[i]) * k / st;
        const o = { x }; for (const p of params) o[p] = fns[p](x); out.push(o);
      }
    }
    const last = { x: xs[xs.length - 1] }; for (const p of params) last[p] = keys[keys.length - 1][p] ?? keys[0][p]; out.push(last);
    return out;
  }
  // semiancho de una sección superelíptica a la altura y
  function widthAt(s, y) {
    const ym = s.ym ?? (s.yb + s.yt) / 2;
    if (y >= ym) { const n = s.nT ?? 3, h = s.yt - ym; const t = Math.min(1, (y - ym) / h); return s.w * Math.pow(Math.max(0, 1 - Math.pow(t, n)), 1 / n); }
    const n = s.nB ?? 4, h = ym - s.yb; const t = Math.min(1, (ym - y) / h); return s.w * Math.pow(Math.max(0, 1 - Math.pow(t, n)), 1 / n);
  }
  // ---------- Superficies sobre lofts: punto/normal y parches (parabrisas, franjas) ----------
  function stAt(ST, x) {
    let i = 0; while (i < ST.length - 2 && ST[i + 1].x < x) i++;
    const a = ST[i], b = ST[i + 1]; const t = Math.min(1, Math.max(0, (x - a.x) / ((b.x - a.x) || 1)));
    const o = {}; for (const k in a) if (typeof a[k] === 'number') o[k] = a[k] + ((b[k] ?? a[k]) - a[k]) * t; return o;
  }
  function surfP(ST, x, a, ring = ringPoint) { const s = stAt(ST, x); const [y, z] = ring(s, a); return new T.Vector3(x, y, z); }
  function surf(ST, x, a, ring = ringPoint) {
    const p = surfP(ST, x, a, ring);
    const tx = surfP(ST, x + 0.03, a, ring).sub(surfP(ST, x - 0.03, a, ring));
    const ta = surfP(ST, x, a + 0.01, ring).sub(surfP(ST, x, a - 0.01, ring));
    const n = new T.Vector3().crossVectors(tx, ta).normalize();
    const s = stAt(ST, x); const radial = new T.Vector3(0, p.y - (s.ym ?? (s.yb + s.yt) / 2), p.z);
    if (n.dot(radial) < 0) n.negate();
    return { p, n };
  }
  function surfPatch(ST, x0, x1, a0, a1, off = 0.012, nx = 14, na = 12, ring = ringPoint) {
    const pos = [], idx = [], uv = [];
    for (let i = 0; i <= nx; i++) for (let j = 0; j <= na; j++) {
      const x = x0 + (x1 - x0) * i / nx, a = a0 + (a1 - a0) * j / na;
      const { p, n } = surf(ST, x, a, ring); p.addScaledVector(n, off);
      pos.push(p.x, p.y, p.z); uv.push(i / nx, j / na);
    }
    for (let i = 0; i < nx; i++) for (let j = 0; j < na; j++) { const A = i * (na + 1) + j, B = A + 1, C = A + na + 1, D = C + 1; idx.push(A, C, B, B, C, D); }
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
    // orientar normales hacia afuera
    const { n } = surf(ST, (x0 + x1) / 2, (a0 + a1) / 2, ring);
    const nn = new T.Vector3().fromArray(g.attributes.normal.array, Math.floor(((nx / 2) * (na + 1) + na / 2)) * 3);
    if (nn.dot(n) < 0) { for (let k = 0; k < idx.length; k += 3) { const t = idx[k + 1]; idx[k + 1] = idx[k + 2]; idx[k + 2] = t; } g.setIndex(idx); g.computeVertexNormals(); }
    return g;
  }
  // matriz para colocar un objeto (eje Y local) apoyado sobre la superficie
  function onSurf(ST, x, a, off = 0.01, ring = ringPoint) {
    const { p, n } = surf(ST, x, a, ring);
    return new T.Matrix4().compose(p.addScaledVector(n, off), new T.Quaternion().setFromUnitVectors(new T.Vector3(0, 1, 0), n), new T.Vector3(1, 1, 1));
  }
  const ease = {
    out: t => 1 - Math.pow(1 - t, 2),
    in: t => t * t,
    sin: t => Math.sin(t * Math.PI / 2),
    circ: t => Math.sqrt(1 - Math.pow(1 - t, 2)),
    smooth: t => t * t * (3 - 2 * t),
  };

  // ---------- Ruedas ----------
  // o: {R, side, type:'spoke'|'wood'|'disc', spokes, tread, flange, hubR, crank:{r, phase}, cw:{span}, m:{tyre, body, hub, pin}}
  function wheel(o) {
    const side = o.side ?? 1;
    const k = new Kit();
    const w = o.tread ?? 0.13, f = o.flange ?? 0.028, R = o.R;
    const ri = R - (o.rimT ?? Math.max(0.05, R * 0.07));
    // perfil de la llanta (r, axial); flange hacia -axial (interior)
    let prof = [[ri, -w / 2], [R + f, -w / 2], [R + f, -w / 2 + 0.014], [R + 0.004, -w / 2 + 0.034], [R, -w / 2 + 0.05], [R - 0.008, w / 2], [ri, w / 2]];
    prof = prof.map(p => [p[0], p[1] * side]);
    if (side < 0) prof.reverse();
    prof.push(prof[0]);
    k.add(G.lathe(prof, 44), o.m.tyre, [0, 0, 0], [Math.PI / 2, 0, 0]);
    const zFace = side * w / 2;
    const hubR = o.hubR ?? R * 0.2;
    const body = o.m.body;
    if (o.type === 'disc') {
      const t = 0.035;
      const dprof = side > 0 ? [[hubR, -t + 0.02], [ri, -t], [ri, t], [hubR, t + 0.03]] : [[hubR, t + 0.03], [ri, t], [ri, -t], [hubR, -t + 0.02]];
      k.add(G.lathe(dprof.map(p => [p[0], p[1] * side]), 40), body, [0, 0, 0], [Math.PI / 2, 0, 0]);
      k.add(G.cyl(ri, 0.02, 40, ri, true), body, [0, 0, -side * 0.01], [Math.PI / 2, 0, 0]);
    } else {
      const n = o.spokes ?? 12;
      const sw = o.type === 'wood' ? R * 0.11 : R * 0.065, sd = o.type === 'wood' ? 0.07 : 0.05;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * TAU + (o.spokeOff || 0);
        const L = ri - hubR * 0.9, rm = hubR * 0.9 + L / 2;
        k.add(G.box(L, sw, sd), body, [Math.cos(a) * rm, Math.sin(a) * rm, side * 0.0], [0, 0, a]);
      }
      // aro interior
      k.add(G.torus((ri + ri - 0.03) / 2, 0.022, 6, 48), body, [0, 0, 0], [0, 0, 0]);
    }
    // cubo
    k.cyl(o.m.hub ?? body, hubR, w + 0.06, 'z', 0, 0, side * 0.02, 24);
    // contrapeso (opuesto a la manivela)
    if (o.crank && o.cw !== false) {
      const ph = o.crank.phase + Math.PI;
      const span = (o.cw && o.cw.span) || 1.5;
      k.add(G.sector(Math.max(hubR * 1.2, ri * 0.52), ri - 0.01, ph - span / 2, ph + span / 2, 0.06), o.m.cw ?? body, [0, 0, side * 0.012]);
    }
    // manivela
    if (o.crank) {
      const a = o.crank.phase, r = o.crank.r;
      const px = Math.cos(a) * r, py = Math.sin(a) * r;
      if (o.crank.boss !== false) k.add(G.cyl(o.crank.bossR ?? 0.085, 0.07, 18), body, [px, py, zFace + side * 0.02], [Math.PI / 2, 0, 0]);
      k.add(G.cyl(o.crank.pinR ?? 0.045, o.crank.pinL ?? 0.2, 16), o.m.pin ?? o.m.hub ?? body, [px, py, zFace + side * (o.crank.pinL ?? 0.2) / 2], [Math.PI / 2, 0, 0]);
    }
    const grp = new T.Group();
    k.build(grp);
    return grp;
  }

  // juego de ruedas montado: devuelve {group, zWheel, zRod}
  function wheelset(o) {
    const g = new T.Group();
    const gauge = o.gauge ?? 1.435;
    const w = o.tread ?? 0.13;
    const zW = gauge / 2 + 0.036 + w / 2 - 0.05;
    for (const side of [1, -1]) {
      const ph = side > 0 ? (o.phaseR ?? 0) : (o.phaseL ?? (o.phaseR ?? 0) + Math.PI / 2);
      const wh = wheel({ ...o, side, crank: o.crankR ? { r: o.crankR, phase: ph, pinL: o.pinL, pinR: o.pinR, bossR: o.bossR } : null });
      wh.position.z = side * zW;
      g.add(wh);
    }
    const k = new Kit();
    k.cyl(o.m.axle ?? o.m.hub ?? o.m.body, o.axleR ?? 0.08, zW * 2 + 0.05, 'z', 0, 0, 0, 16);
    k.build(g);
    return { group: g, zW, zRod: zW + w / 2 + 0.11 };
  }

  function zRod(gauge, tread) { const zW = gauge / 2 + 0.036 + tread / 2 - 0.05; return zW + tread / 2 + 0.11; }
  // ---------- Bielas ----------
  function rodGeo(len, h, t, endR) {
    const k = new Kit();
    return { len, h, t, endR };
  }
  // crea una biela (Mesh fusionado) de longitud len a lo largo de +X desde el origen
  function rod(m, len, h = 0.1, t = 0.05, endR = 0.08, mEnd) {
    const k = new Kit();
    k.box(m, len, h, t, len / 2, 0, 0);
    k.cyl(mEnd ?? m, endR, t * 1.3, 'z', 0, 0, 0, 20);
    k.cyl(mEnd ?? m, endR * 0.9, t * 1.3, 'z', len, 0, 0, 20);
    const g = new T.Group(); k.build(g); return g;
  }
  function placeRod(obj, a, b) { // a,b: [x,y] en el plano del objeto
    obj.position.x = a[0]; obj.position.y = a[1];
    obj.rotation.z = Math.atan2(b[1] - a[1], b[0] - a[0]);
  }

  // ---------- Texturas procedurales (canvas) ----------
  function noiseTex(c1, c2, size = 128, grain = 1, rep = [1, 1]) {
    const cv = document.createElement('canvas'); cv.width = cv.height = size;
    const ctx = cv.getContext('2d');
    const a = new T.Color(c1), b = new T.Color(c2);
    const img = ctx.createImageData(size, size);
    let seed = 1234;
    const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let i = 0; i < size * size; i++) {
      const t = Math.pow(rnd(), grain);
      img.data[i * 4] = (a.r + (b.r - a.r) * t) * 255;
      img.data[i * 4 + 1] = (a.g + (b.g - a.g) * t) * 255;
      img.data[i * 4 + 2] = (a.b + (b.b - a.b) * t) * 255;
      img.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    // piedras
    for (let i = 0; i < size * 1.6; i++) {
      ctx.fillStyle = `rgba(${rnd() > 0.5 ? '255,255,255' : '0,0,0'},${0.08 + rnd() * 0.12})`;
      ctx.beginPath(); ctx.ellipse(rnd() * size, rnd() * size, 1 + rnd() * 3, 1 + rnd() * 2.5, rnd() * 3, 0, TAU); ctx.fill();
    }
    const tex = new T.CanvasTexture(cv);
    tex.wrapS = tex.wrapT = T.RepeatWrapping; tex.repeat.set(rep[0], rep[1]);
    tex.encoding = T.sRGBEncoding; tex.anisotropy = 4;
    return tex;
  }

  // ---------- Ruido para terreno ----------
  function hash(x, y) { const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return s - Math.floor(s); }
  function vnoise(x, y) {
    const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    const a = hash(xi, yi), b = hash(xi + 1, yi), c = hash(xi, yi + 1), d = hash(xi + 1, yi + 1);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  }
  function fbm(x, y) { let s = 0, a = 0.5, f = 1; for (let i = 0; i < 4; i++) { s += a * vnoise(x * f, y * f); a *= 0.5; f *= 2.03; } return s; }

  // ---------- Diorama hexagonal (losa tipo tablero) ----------
  // era: {ground:[c1,c2,c3], side:[c1,c2], track:'stone'|'wood'|'concrete'|'slab'|'guideway', hills, snow, gauge}
  function hexTile(R, era) {
    const grp = new T.Group();
    const N = Math.max(10, Math.round(R / 1.4));
    const pos = [], col = [], idx = [];
    const ring = (k) => { // puntos del anillo k (6k puntos) en hexágono de lados planos en ±X
      if (k === 0) return [[0, 0]];
      const pts = [];
      const r = R * k / N;
      const corners = [];
      for (let i = 0; i < 6; i++) { const a = Math.PI / 6 + i * Math.PI / 3; corners.push([Math.cos(a) * r, Math.sin(a) * r]); }
      for (let i = 0; i < 6; i++) {
        const A = corners[i], Bc = corners[(i + 1) % 6];
        for (let j = 0; j < k; j++) { const t = j / k; pts.push([A[0] + (Bc[0] - A[0]) * t, A[1] + (Bc[1] - A[1]) * t]); }
      }
      return pts;
    };
    const rings = []; let base = 0;
    const c1 = new T.Color(era.ground[0]), c2 = new T.Color(era.ground[1]), c3 = new T.Color(era.ground[2] || era.ground[1]);
    const tmp = new T.Color();
    const heightAt = (x, z) => {
      const dz = Math.abs(z);
      const flat = Math.min(1, Math.max(0, (dz - (era.flatW ?? 3.2)) / 3.5));
      let h = (fbm(x * 0.09 + 3, z * 0.09) - 0.45) * 0.9 * flat;
      if (era.hills && z < 0) h += Math.pow(Math.max(0, (-z - R * 0.35) / (R * 0.65)), 1.6) * era.hills * (0.6 + 0.8 * fbm(x * 0.05, z * 0.05));
      if (era.embank) h += 0; // terraplén manejado por la vía
      return h;
    };
    for (let k = 0; k <= N; k++) {
      const pts = ring(k); rings.push({ start: base, n: pts.length });
      for (const [x, z] of pts) {
        const edge = k === N;
        const y = edge ? 0 : heightAt(x, z);
        pos.push(x, y, z);
        const n1 = fbm(x * 0.15, z * 0.15), n2 = fbm(x * 0.6 + 9, z * 0.6);
        tmp.copy(c1).lerp(c2, Math.min(1, n1 * 1.4)).lerp(c3, Math.max(0, n2 - 0.55) * 1.6);
        if (era.snow && y > era.hills * 0.45) tmp.lerp(new T.Color('#eef2f5'), Math.min(1, (y - era.hills * 0.45) / (era.hills * 0.2)));
        col.push(tmp.r, tmp.g, tmp.b);
      }
      base += pts.length;
    }
    // triangulación entre anillos
    for (let k = 0; k < N; k++) {
      const inner = rings[k], outer = rings[k + 1];
      if (k === 0) { for (let i = 0; i < 6; i++) idx.push(0, outer.start + (i + 1) % 6, outer.start + i); continue; }
      for (let s = 0; s < 6; s++) {
        for (let j = 0; j < k + 1; j++) {
          const o0 = outer.start + (s * (k + 1) + j) % outer.n, o1 = outer.start + (s * (k + 1) + j + 1) % outer.n;
          const i0 = inner.start + (s * k + j) % inner.n;
          idx.push(i0, o1, o0);
          if (j < k) { const i1 = inner.start + (s * k + j + 1) % inner.n; idx.push(i0, i1, o1); }
        }
      }
    }
    const tg = new T.BufferGeometry();
    tg.setAttribute('position', new T.Float32BufferAttribute(pos, 3));
    tg.setAttribute('color', new T.Float32BufferAttribute(col, 3));
    tg.setIndex(idx); tg.computeVertexNormals();
    const top = new T.Mesh(tg, sceneMat('#ffffff', { vc: true, r: 0.95 }));
    top.receiveShadow = true; grp.add(top);
    // flancos estratificados
    const th = era.thick ?? 2.4;
    const layers = era.side || ['#6b4f3a', '#4a3a2e'];
    let y0 = 0;
    layers.forEach((c, i) => {
      const h = i === 0 ? th * 0.35 : th * 0.65 / (layers.length - 1);
      const g = new T.CylinderGeometry(R * (1 - i * 0.002), R * (1 - (i + 1) * 0.004), h, 6, 1, true);
      g.rotateY(Math.PI / 6 + Math.PI / 2);
      const m = new T.Mesh(g, sceneMat(c, { r: 0.95, flat: true }));
      m.position.y = y0 - h / 2; y0 -= h; grp.add(m);
    });
    const bot = new T.Mesh(new T.CircleGeometry(R * 0.99, 6).rotateX(Math.PI / 2).rotateY(Math.PI / 6 + Math.PI / 2), sceneMat(layers[layers.length - 1]));
    bot.position.y = -th; grp.add(bot);
    // borde de latón (marco tipo tablero)
    const rim = new T.Mesh(new T.TorusGeometry(R, 0.09, 6, 6).rotateX(Math.PI / 2).rotateY(Math.PI / 6 + Math.PI / 2), new T.MeshStandardMaterial({ color: '#b98a3e', metalness: 0.8, roughness: 0.35 }));
    rim.position.y = 0.01; grp.add(rim);
    grp.userData.heightAt = heightAt;
    return grp;
  }

  // ---------- Vía ----------
  function railShape(scale = 1) {
    // perfil de riel tipo Vignole (aprox. UIC 60 escalado)
    const s = scale;
    return [[-0.075 * s, -0.172 * s], [0.075 * s, -0.172 * s], [0.075 * s, -0.16 * s], [0.012 * s, -0.145 * s], [0.009 * s, -0.05 * s],
      [0.036 * s, -0.035 * s], [0.036 * s, 0], [-0.036 * s, 0], [-0.036 * s, -0.035 * s], [-0.009 * s, -0.05 * s], [-0.012 * s, -0.145 * s], [-0.075 * s, -0.16 * s]];
  }
  // track: {length, gauge, style, railScale, sleeper:{w,h,d,color,pitch}, ballast}
  function track(o) {
    const grp = new T.Group();
    const L = o.length, g = o.gauge ?? 1.435;
    const zr = g / 2 + 0.036;
    const rs = o.railScale ?? 1;
    const railH = 0.172 * rs;
    const sleeperTop = -railH;
    const anim = { sleepers: null, pitch: o.pitch ?? 0.65, offset: 0, tex: null, texLen: 1 };
    // balasto
    if (o.style !== 'slab') {
      const bw = (o.ballastW ?? g + 1.6), bh = o.ballastH ?? 0.45, top = sleeperTop - (o.sleeperH ?? 0.18) + 0.06;
      const sh = [[-bw / 2 - bh * 1.4, top - bh], [bw / 2 + bh * 1.4, top - bh], [bw / 2, top], [-bw / 2, top]];
      const geo = G.extrude(sh, L);
      geo.rotateY(Math.PI / 2);
      const tex = noiseTex(o.ballast?.[0] ?? '#6f6a63', o.ballast?.[1] ?? '#3d3a36', 128, 1.2, [L / 2, 2]);
      anim.tex = tex; anim.texLen = 2;
      const m = sceneMat('#ffffff', { map: tex, r: 1 });
      const mesh = new T.Mesh(geo, m); mesh.receiveShadow = true; grp.add(mesh);
    } else {
      const geo = G.box(L, 0.3, g + 1.2); const m = sceneMat('#9a9a96', { r: 0.9 });
      const mesh = new T.Mesh(geo, m); mesh.position.y = sleeperTop - 0.3; mesh.receiveShadow = true; grp.add(mesh);
    }
    // traviesas o bloques
    const sw = o.sleeperW ?? 0.25, shh = o.sleeperH ?? 0.18, sl = o.sleeperL ?? g + 1.15;
    const count = Math.ceil(L / anim.pitch) + 2;
    let sGeo, sMat, per = 1;
    if (o.style === 'stone') { sGeo = G.box(0.55, 0.3, 0.55); per = 2; sMat = sceneMat(o.sleeperColor ?? '#8d877c', { r: 0.95, flat: true }); }
    else { sGeo = G.box(sw, shh, sl); sMat = sceneMat(o.sleeperColor ?? '#5a4636', { r: 0.9 }); }
    const inst = new T.InstancedMesh(sGeo, sMat, count * per);
    inst.castShadow = false; inst.receiveShadow = true;
    anim.sleepers = inst; anim.count = count; anim.per = per; anim.L = L; anim.y = sleeperTop - (o.style === 'stone' ? 0.15 : shh / 2); anim.zr = zr;
    grp.add(inst);
    // rieles
    const rgeo = G.extrude(railShape(rs), L);
    rgeo.rotateY(Math.PI / 2);
    const rmat = sceneMat('#8b8f93', { r: 0.4, m: 0.75, env: 1 });
    for (const s of [1, -1]) {
      const r = new T.Mesh(rgeo, rmat); r.position.z = s * zr; r.castShadow = true; r.receiveShadow = true; grp.add(r);
    }
    // sillas / placas
    function layout(off) {
      const m4 = new T.Matrix4(); let i = 0;
      for (let k = 0; k < count; k++) {
        let x = -L / 2 + ((k * anim.pitch + off) % (count * anim.pitch));
        if (x > L / 2) x -= count * anim.pitch;
        const vis = x > -L / 2 - 0.2 && x < L / 2 + 0.2 ? 1 : 0.0001;
        if (per === 2) {
          for (const s of [1, -1]) { m4.compose(new T.Vector3(x, anim.y, s * zr), new T.Quaternion(), new T.Vector3(vis, vis, vis)); inst.setMatrixAt(i++, m4); }
        } else { m4.compose(new T.Vector3(x, anim.y, 0), new T.Quaternion(), new T.Vector3(vis, vis, vis)); inst.setMatrixAt(i++, m4); }
      }
      inst.instanceMatrix.needsUpdate = true;
    }
    layout(0);
    anim.scroll = (dx) => {
      anim.offset = ((anim.offset - dx) % anim.pitch + anim.pitch) % anim.pitch;
      layout(anim.offset);
      if (anim.tex) anim.tex.offset.x -= dx / anim.texLen;
    };
    grp.userData.anim = anim;
    return grp;
  }

  // ---------- Utilerías de escenario (instanciadas) ----------
  function scatter(grp, geo, m, pts, scaleFn) {
    const inst = new T.InstancedMesh(geo, m, pts.length);
    const m4 = new T.Matrix4(), q = new T.Quaternion();
    pts.forEach((p, i) => {
      const s = scaleFn ? scaleFn(i) : 1;
      q.setFromEuler(new T.Euler(0, (p[3] ?? 0), 0));
      m4.compose(new T.Vector3(p[0], p[1], p[2]), q, new T.Vector3(s, s * (p[4] ?? 1), s));
      inst.setMatrixAt(i, m4);
    });
    inst.castShadow = true; inst.receiveShadow = true;
    grp.add(inst); return inst;
  }
  function inHex(x, z, R) { // punto dentro de hexágono de lados planos en ±X
    const ax = Math.abs(x), az = Math.abs(z);
    return ax <= R * 0.866 && (ax * 0.5 + az * 0.866) <= R * 0.866;
  }
  function randPts(R, n, seed, avoid, heightAt) {
    const out = []; let s = seed;
    const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
    let tries = 0;
    while (out.length < n && tries < n * 40) {
      tries++;
      const x = (rnd() * 2 - 1) * R, z = (rnd() * 2 - 1) * R;
      if (!inHex(x, z, R * 0.93)) continue;
      if (avoid && avoid(x, z)) continue;
      out.push([x, heightAt ? heightAt(x, z) : 0, z, rnd() * TAU, 0.8 + rnd() * 0.5]);
    }
    return out;
  }

  // ---------- Catenaria ----------
  function catenary(o) {
    const grp = new T.Group(); const k = new Kit();
    const mMast = sceneMat(o.mastColor ?? '#6d7378', { r: 0.6, m: 0.5 });
    const mWire = sceneMat('#b8793f', { r: 0.4, m: 0.8 });
    const hW = o.wireH ?? 5.1, hM = hW + 1.3;
    const zm = -(o.gauge ?? 1.435) / 2 - 2.0;
    const yb = o.base ?? -0.72;
    const xs = o.masts;
    for (const x of xs) {
      if (o.lattice) {
        for (const dz of [-0.14, 0.14]) for (const dx of [-0.14, 0.14]) k.box(mMast, 0.04, hM - yb, 0.04, x + dx, (hM + yb) / 2, zm + dz);
        for (let y = yb + 0.2; y < hM; y += 0.45) { k.box(mMast, 0.32, 0.03, 0.03, x, y, zm - 0.14, 0, 0, 0.6); k.box(mMast, 0.32, 0.03, 0.03, x, y, zm + 0.14, 0, 0, -0.6); }
      } else {
        k.cyl(mMast, 0.13, hM - yb, 'y', x, (hM + yb) / 2, zm, 12, 0.16);
        k.box(mMast, 0.6, 0.3, 0.6, x, yb + 0.15, zm);
      }
      // ménsula
      k.bar(mMast, [x, hM - 0.4, zm], [x, hM - 0.4, 0.4], 0.06, 0.07);
      k.bar(mMast, [x, hM - 1.1, zm], [x, hM - 0.4, 0.1], 0.04, 0.04);
    }
    const x0 = xs[0], x1 = xs[xs.length - 1];
    // sustentador (catenaria) e hilo de contacto con descentramiento (zigzag)
    const stag = o.stagger ?? 0.2;
    for (let i = 0; i < xs.length - 1; i++) {
      const a = xs[i], b = xs[i + 1];
      const za = (i % 2 ? -stag : stag), zb = ((i + 1) % 2 ? -stag : stag);
      const pts = [];
      for (let t = 0; t <= 8; t++) { const u = t / 8; const x = a + (b - a) * u; pts.push([x, hM - 0.5 - Math.sin(u * Math.PI) * 0.7, za + (zb - za) * u]); }
      k.add(G.tube(pts, 0.012, 16, 5), mWire);
      k.seg(mWire, [a, hW, za], [b, hW, zb], 0.011, 5);
      for (let t = 1; t < 8; t++) { const u = t / 8; const x = a + (b - a) * u; const z = za + (zb - za) * u; k.seg(mWire, [x, hW, z], [x, hM - 0.5 - Math.sin(u * Math.PI) * 0.7, z], 0.005, 4); }
    }
    k.build(grp, { cast: false });
    grp.userData.wireH = hW;
    return grp;
  }

  // ---------- Flujo de energía (tubo con trazo animado) ----------
  const flowMats = [];
  function flowLine(points, color, opt = {}) {
    const geo = G.poly(points, opt.r ?? 0.05, 8);
    let len = 0; for (let i = 0; i < points.length - 1; i++) len += new T.Vector3(...points[i]).distanceTo(new T.Vector3(...points[i + 1]));
    const m = new T.ShaderMaterial({
      uniforms: { uT: { value: 0 }, uC: { value: new T.Color(color) }, uLen: { value: len }, uSpeed: { value: opt.speed ?? 1 } },
      vertexShader: `#include <clipping_planes_pars_vertex>
        varying vec2 vUv; void main(){ vUv = uv; vec4 mvPosition = modelViewMatrix * vec4(position,1.0); gl_Position = projectionMatrix * mvPosition;
        #include <clipping_planes_vertex>
        }`,
      fragmentShader: `#include <clipping_planes_pars_fragment>
        uniform float uT; uniform vec3 uC; uniform float uLen; uniform float uSpeed; varying vec2 vUv;
        void main(){
        #include <clipping_planes_fragment>
        float d = fract(vUv.x * uLen / 0.7 - uT * uSpeed); float a = smoothstep(0.0, 0.15, d) * (1.0 - smoothstep(0.55, 0.75, d));
        gl_FragColor = vec4(mix(uC*0.55, uC*1.25, a), 0.35 + 0.6 * a); }`,
      transparent: true, depthTest: false, depthWrite: false, clipping: true, clippingPlanes: [SECTION],
    });
    flowMats.push(m);
    const mesh = new T.Mesh(geo, m); mesh.renderOrder = 10;
    return mesh;
  }

  window.TB = { T, TAU, SECTION, GU, mat, sceneMat, G, Kit, merge, loft, ringOpen, stations, widthAt, pchip, stAt, surf, surfPatch, onSurf, ease, ringPoint, wheel, wheelset, zRod, rod, placeRod, noiseTex, fbm, hexTile, track, scatter, inHex, randPts, catenary, flowLine, flowMats, axisRot };
})();
