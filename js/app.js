/* app.js — interfaz: escena, selección de piezas, corte, explosión, telemetría, paneles y comparativas */
(function () {
  const T = THREE;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const TR = window.TRAINS;
  const TC = { vapor: 'var(--steam)', electrica: 'var(--elec)', diesel: 'var(--diesel)', maglev: 'var(--maglev)', hidrogeno: 'var(--h2)' };
  const TCOL = { vapor: '#e08a4b', electrica: '#4fb3d9', diesel: '#cdb54f', maglev: '#a796f2', hidrogeno: '#5fd3a0' };
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  // formato SI (NOM-008 / ISO 80000): coma decimal y espacio fino como separador de miles
  const fmt = (x, d = 0) => {
    if (x == null || !isFinite(x)) return '—';
    const neg = x < 0; const [i, f] = Math.abs(x).toFixed(d).split('.');
    const ig = i.length > 4 ? i.replace(/\B(?=(\d{3})+(?!\d))/g, '\u202f') : (i.length === 4 ? i[0] + '\u202f' + i.slice(1) : i);
    return (neg ? '−' : '') + ig + (f ? ',' + f : '');
  };
  const ease = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

  const S = { i: 0, t: null, M: null, sel: null, hover: null, tab: 'piezas', cut: false, cutMode: 'L', cutV: 613, exp: false, expK: 0, expTarget: 0.7,
    xray: false, flow: false, labels: true, play: false, vkmh: 0, ts: 0.0625, mu: 0.25, busy: false,
    tour: null, tourHL: [], tourGhost: false, study: null, pv: false, auto: true };
  const LET = 'ABCDEFGHIJKLMNOP';
  const NS = 'http://www.w3.org/2000/svg';
  const svgEl = (tag, at = {}) => { const e = document.createElementNS(NS, tag); for (const k in at) e.setAttribute(k, at[k]); return e; };
  const TOURS = () => window.TOURS || {};
  const narrow = () => $('#vp').clientWidth < 640;
  const STUDY = () => window.STUDY || {};
  let stage = null, tween = null, needs = true, last = performance.now(), flowT = 0, hudT = 0;

  // ---------- Arranque ----------
  function init() {
    buildRail();
    bindUI();
    try {
      stage = new STAGE.Stage($('#cv'));
      stage.controls.addEventListener('change', () => { needs = true; });
      new ResizeObserver(resize).observe($('#vp'));
      resize();
      stage.renderer.setAnimationLoop(tick);
      document.addEventListener('visibilitychange', () => { stage.renderer.setAnimationLoop(document.hidden ? null : tick); last = performance.now(); });
    } catch (e) {
      console.error(e);
      $('#loading').hidden = true;
      const d = document.createElement('div'); d.className = 'err';
      d.innerHTML = '<div><b>No se pudo iniciar WebGL.</b><br>Activa la aceleración por hardware en tu navegador para ver los modelos 3D. Toda la información técnica sigue disponible en el panel.</div>';
      $('#vp').appendChild(d);
    }
    const h = (location.hash || '').slice(1);
    const start = Math.max(0, TR.findIndex(t => t.id === h));
    goTrain(start, true);
  }

  function resize() {
    if (!stage) return;
    const r = $('#vp').getBoundingClientRect();
    stage.resize(Math.max(1, r.width), Math.max(1, r.height));
    TB.GU.uPScale.value = stage.renderer.domElement.height * 0.5 / Math.tan(stage.camera.fov * Math.PI / 360);
    viewOffset();
    needs = true;
  }

  // ---------- Bucle de render (sólo cuando hay cambios) ----------
  function tick(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    if (!stage || !S.M) return;
    let moved = stage.controls.update();
    if (tween) {
      const k = Math.min(1, (now - tween.t0) / tween.d), e = ease(k);
      if (tween.cam) { stage.camera.position.lerpVectors(tween.p0, tween.p1, e); stage.controls.target.lerpVectors(tween.q0, tween.q1, e); }
      if (tween.fn) tween.fn(e);
      needs = true;
      if (k >= 1) { const done = tween.done; tween = null; done && done(); }
    }
    if (Math.abs(S.expK - (S.exp ? S.expTarget : 0)) > 1e-3) {
      S.expK += ((S.exp ? S.expTarget : 0) - S.expK) * Math.min(1, dt * 7);
      S.M.setExplode(S.expK); needs = true;
    }
    if (S.play) {
      const v = S.vkmh / 3.6, sdt = dt * S.ts;
      S.M.timeScale = S.ts;
      S.M.update(sdt, v);
      if (stage.trackAnim) stage.trackAnim.scroll(v * sdt);
      if (S.pv) pvLive();
      if (now - hudT > 220) { hudT = now; setHudState(); }
      needs = true;
    }
    if (S.flow) { flowT += dt; TB.flowMats.forEach(m => (m.uniforms.uT.value = flowT)); needs = true; }
    if (needs || moved) { stage.render(); placeLabels(); needs = false; }
  }

  // ---------- Cambio de tren con transición de era ----------
  function goTrain(i, first) {
    if (S.busy) { S.pending = i; return; }
    if (!first && i === S.i && S.M) return;
    if (S.tour) exitTour(true);
    if (S.study) exitStudy(true);
    S.busy = true;
    const t = TR[i];
    $('#eraK').textContent = t.era;
    $('#eraY').textContent = t.year;
    $('#eraN').textContent = t.name + ' · ' + t.country;
    $('#era').classList.add('show');
    S.i = i; S.t = t;
    $$('.stn').forEach((b, k) => b.setAttribute('aria-current', k === i ? 'true' : 'false'));
    const railBtn = $$('.stn')[i]; railBtn && railBtn.scrollIntoView({ block: 'nearest', inline: 'center', behavior: reduce ? 'auto' : 'smooth' });
    setTimeout(() => {
      S.sel = null; S.hover = null; // antes de cargar: applyLook no debe fantasmear el tren nuevo
      try { loadScene(t); } catch (err) { console.error(err); }
      renderHead(t);
      S.tab = S.tab || 'piezas';
      renderTab();
      setTimeout(() => { $('#era').classList.remove('show'); S.busy = false; if (S.pending != null) { const p = S.pending; S.pending = null; goTrain(p); } }, reduce ? 200 : 650);
    }, reduce || first ? 60 : 380);
  }

  function loadScene(t) {
    $('#vp').style.setProperty('--sky', `linear-gradient(180deg, ${t.sky[0]} 0%, ${t.sky[1]} 70%, ${t.sky[2] || t.sky[1]} 100%)`);
    $('#loading').hidden = true;
    if (!stage) return;
    if (S.M) TB.flowMats.length = 0;
    const M = MODELS[t.model]();
    S.M = M;
    const era = { ...t.stage, props: STAGE.PROPS[t.stage.props] };
    stage.load(M, era);
    // materiales: base para fantasmas/rayos X/realce
    for (const id of M.order) {
      const p = M.parts[id]; const set = new Set();
      p.group.traverse(o => { if (o.isMesh && o.material) set.add(o.material); });
      p.mats2 = [...set].filter(m => m.isMeshStandardMaterial);
      p.mats2.forEach(m => { if (!m.userData.base) m.userData.base = { opacity: m.opacity, transparent: m.transparent }; });
      p.basics = []; p.group.traverse(o => { if (o.userData.chamber) p.basics.push(o); });
    }
    M.flowGroup.visible = S.flow;
    // reiniciar estado de escena
    S.expK = 0; M.setExplode(0); S.exp = false; setPressed('#tExp', false); $('#expCtl').hidden = true;
    setCut(false);
    M.powered = S.play;
    // velocidad
    const tele = t.physics.tele;
    const spd = $('#spd'); spd.max = String(tele.vsim); S.vkmh = Math.round(tele.vsim * 0.35); spd.value = String(S.vkmh);
    S.mu = t.physics.fv.mu ?? 0.25;
    buildLabels();
    buildHudX();
    showPV(false);
    applyLook();
    updateHud();
    // cámara: entra desde más lejos y el diorama sube
    const cp = stage.camPreset();
    const from = cp.pos.clone().sub(cp.target).multiplyScalar(1.45).add(cp.target).add(new T.Vector3(0, 2, 0));
    stage.camera.position.copy(reduce ? cp.pos : from); stage.controls.target.copy(cp.target);
    if (!reduce) {
      stage.envGroup.position.y = -3; stage.holder.position.y = -3;
      tween = { t0: performance.now(), d: 1100, cam: true, p0: from, p1: cp.pos, q0: cp.target.clone(), q1: cp.target, fn: e => { stage.envGroup.position.y = -3 * (1 - e); stage.holder.position.y = -3 * (1 - e); } };
    } else { stage.envGroup.position.y = 0; stage.holder.position.y = 0; }
    needs = true;
  }

  // ---------- Aspecto: fantasmas, rayos X, realce ----------
  // realce por contorno (rim) en el shader: no toca el emisivo, que usan el fuego y los indicadores
  function applyLook() {
    const M = S.M; if (!M) return;
    const hl = S.tour ? S.tourHL : [];
    for (const id of M.order) {
      const p = M.parts[id];
      const sw = S.study ? (studyData(S.study) || {}).with || [] : [];
      const hidden = !!S.study && id !== S.study && !sw.includes(id);
      p.group.visible = !hidden;
      const ghost = !hidden && (S.study ? sw.includes(id) : S.sel ? S.sel !== id : (S.tourGhost && hl.length ? !hl.includes(id) : false));
      const k = S.study ? (S.hover === id ? 0.25 : 0) : S.sel === id ? 0.75 : hl.includes(id) ? 0.62 : (S.hover === id && !S.sel ? 0.38 : 0);
      for (const m of p.mats2) {
        const b = m.userData.base;
        let op = 1;
        if (S.xray && m.userData.shell) op = 0.14;
        if (ghost) op = Math.min(op, S.study ? 0.2 : S.tour && !S.sel ? 0.16 : 0.07);
        const tr = op < 1 || b.transparent;
        if (m.transparent !== tr) { m.transparent = tr; m.needsUpdate = true; }
        m.opacity = b.opacity * op; m.depthWrite = op >= 1;
        if (m.userData.uHL) m.userData.uHL.value = k;
      }
      for (const o of p.basics) o.visible = !ghost;
    }
    $$('.balloon').forEach(b => {
      b.classList.toggle('sel', b.dataset.id === S.sel);
      b.classList.toggle('dim', !!S.sel && b.dataset.id !== S.sel);
      b.classList.toggle('hot', b.dataset.id === S.hover);
    });
    needs = true;
  }

  // ---------- Globos (números de pieza tipo plano) ----------
  let balloons = [];
  function buildLabels() {
    const L = $('#labels'); $$('.balloon', L).forEach(b => b.remove()); $('#leaders').innerHTML = '';
    balloons = [];
    const t = S.t, M = S.M;
    t.partOrder.forEach((id, k) => {
      if (!M.parts[id]) return;
      const b = document.createElement('button');
      b.type = 'button'; b.className = 'balloon'; b.dataset.id = id; b.textContent = k + 1;
      b.setAttribute('aria-label', `Pieza ${k + 1}: ${t.parts[id].name}`);
      b.addEventListener('click', e => { e.stopPropagation(); selectPart(id, true); });
      b.addEventListener('pointerenter', () => { S.hover = id; applyLook(); });
      b.addEventListener('pointerleave', () => { S.hover = null; applyLook(); });
      L.appendChild(b);
      const ln = document.createElementNS('http://www.w3.org/2000/svg', 'line'); ln.setAttribute('class', 'leader'); $('#leaders').appendChild(ln);
      const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle'); dot.setAttribute('r', '2.5'); dot.setAttribute('class', 'anchor-dot'); $('#leaders').appendChild(dot);
      balloons.push({ id, b, ln, dot });
    });
  }
  const _v = new T.Vector3();
  function placeLabels() {
    const L = $('#labels');
    if (S.study) { L.style.display = 'none'; placeStudy(); return; }
    L.style.display = S.labels ? '' : 'none';
    if (!S.labels || !S.M) return;
    const r = $('#vp').getBoundingClientRect(), W = r.width, H = r.height;
    const pts = [];
    let cx = 0, cy = 0, n = 0;
    for (const bl of balloons) {
      const p = S.M.parts[bl.id];
      _v.copy(p.anchor).addScaledVector(p.explode, S.expK);
      S.M.root.localToWorld(_v);
      let clipped = false;
      if (S.cut) {
        const ox = S.M.root.position.x + p.explode.x * S.expK, oz = p.explode.z * S.expK, c = TB.SECTION.constant;
        if (S.cutMode === 'T') { if (p.box.min.x + ox > c) clipped = true; else if (p.box.max.x + ox > c) { _v.x = c - 0.02; if (p.anchorT) { _v.y = p.anchorT[0] + p.explode.y * S.expK; _v.z = p.anchorT[1] + oz; } } }
        else { if (p.box.min.z + oz > c) clipped = true; else if (p.box.max.z + oz > c) _v.z = c - 0.02; }
      }
      _v.project(stage.camera);
      const vis = !clipped && _v.z < 1 && _v.z > -1 && !(S.tour && S.tourHL.length && !S.tourHL.includes(bl.id));
      const x = (_v.x * 0.5 + 0.5) * W, y = (-_v.y * 0.5 + 0.5) * H;
      pts.push({ bl, x, y, vis }); if (vis) { cx += x; cy += y; n++; }
    }
    cx /= n || 1; cy /= n || 1;
    for (const q of pts) {
      let dx = q.x - cx, dy = q.y - cy - 40; const d = Math.hypot(dx, dy) || 1;
      q.bx = q.x + dx / d * 46; q.by = q.y + dy / d * 40 - 18;
    }
    for (let it = 0; it < 6; it++) for (let a = 0; a < pts.length; a++) for (let b = a + 1; b < pts.length; b++) {
      const A = pts[a], B = pts[b]; const dx = B.bx - A.bx, dy = B.by - A.by, d = Math.hypot(dx, dy);
      if (d < 30 && d > 0.001) { const push = (30 - d) / 2; A.bx -= dx / d * push; A.by -= dy / d * push; B.bx += dx / d * push; B.by += dy / d * push; }
    }
    for (const q of pts) {
      const bx = Math.min(W - 16, Math.max(16, q.bx)), by = Math.min(H - 16, Math.max(16, q.by));
      q.bl.b.style.transform = `translate(${bx}px, ${by}px)`;
      q.bl.b.style.visibility = q.vis ? 'visible' : 'hidden';
      q.bl.ln.setAttribute('x1', q.x); q.bl.ln.setAttribute('y1', q.y); q.bl.ln.setAttribute('x2', bx); q.bl.ln.setAttribute('y2', by);
      q.bl.ln.style.visibility = q.vis ? 'visible' : 'hidden';
      q.bl.ln.classList.toggle('sel', q.bl.id === S.sel);
      q.bl.dot.setAttribute('cx', q.x); q.bl.dot.setAttribute('cy', q.y); q.bl.dot.style.visibility = q.vis ? 'visible' : 'hidden';
    }
  }

  // ---------- Selección y cámara ----------
  function flyTo(pos, target, d = 900) {
    if (!stage) return;
    if (tween && tween.fn) tween.fn(1); // completa la entrada del diorama si se interrumpe
    if (reduce) { stage.camera.position.copy(pos); stage.controls.target.copy(target); needs = true; return; }
    tween = { t0: performance.now(), d, cam: true, p0: stage.camera.position.clone(), p1: pos, q0: stage.controls.target.clone(), q1: target };
  }
  function focusPart(id) {
    const M = S.M, p = M.parts[id]; if (!p || !stage) return;
    const c = p.anchor.clone().addScaledVector(p.explode, S.expK); M.root.localToWorld(c);
    const rad = Math.max(0.9, Math.min(10, p.radius));
    const cur = stage.camera.position.clone().sub(stage.controls.target).normalize();
    const dir = new T.Vector3(cur.x >= 0 ? 0.42 : -0.42, 0.4, 1).normalize();
    if (S.cut && S.cutMode === 'L' && dir.z < 0.4) dir.z = 0.6;
    const dist = Math.max(2.4, rad * 2.3 + 1.2);
    flyTo(c.clone().addScaledVector(dir.normalize(), dist), c);
  }
  function selectPart(id, fly) {
    S.sel = id; S.tab = 'piezas';
    applyLook(); renderTab(); setTabs();
    if (fly && id) focusPart(id);
  }
  function clearSel() { if (!S.sel) return; S.sel = null; applyLook(); renderTab(); }

  // ---------- Selección en 3D (raycast) ----------
  const ray = new T.Raycaster(), ndc = new T.Vector2();
  function pick(ev) {
    if (!S.M || !stage) return null;
    const r = $('#cv').getBoundingClientRect();
    ndc.set(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, stage.camera);
    const objs = []; for (const id of S.M.order) { const g = S.M.parts[id].group; if (g.visible) g.traverse(o => { if (o.isMesh && !o.userData.chamber) objs.push(o); }); }
    const hits = ray.intersectObjects(objs, false);
    for (const h of hits) {
      if (S.cut && TB.SECTION.distanceToPoint(h.point) < 0) continue;
      const id = h.object.userData.partId;
      if (S.xray && h.object.material && h.object.material.userData.shell && !S.sel) continue;
      if (id) return id;
    }
    return null;
  }

  // ---------- Corte de sección ----------
  function setCut(on) {
    S.cut = on; setPressed('#tCut', on); $('#cutCtl').hidden = !on;
    TB.GU.uCut.value = on ? 1 : 0;
    if (!on) { TB.SECTION.normal.set(0, 0, -1); TB.SECTION.constant = 1e4; needs = true; return; }
    updateCut(); needs = true;
  }
  function updateCut() {
    const M = S.M; if (!M) return;
    const v = S.cutV / 1000;
    if (S.cutMode === 'L') { TB.SECTION.normal.set(0, 0, -1); TB.SECTION.constant = 1.9 + (-1.4 - 1.9) * v; }
    else { const b = M.bbox; const x = b.min.x + (b.max.x - b.min.x) * v; TB.SECTION.normal.set(-1, 0, 0); TB.SECTION.constant = x; }
    needs = true;
  }
  function setCutMode(mode) {
    S.cutMode = mode;
    setPressed('#cutL', mode === 'L'); setPressed('#cutT', mode === 'T');
    const M = S.M; if (!M) return;
    if (mode === 'L') { S.cutV = 613; }
    else { const b = M.bbox; const xw = (S.t.cutX - M.center); S.cutV = Math.round((xw - b.min.x) / (b.max.x - b.min.x) * 1000); }
    $('#cutPos').value = String(S.cutV);
    updateCut();
    if (mode === 'T') flySection(); else {
      const cp = stage.camPreset(); const dir = cp.pos.clone().sub(cp.target); dir.x *= 0.4; dir.z = Math.abs(dir.z);
      flyTo(cp.target.clone().add(dir), cp.target);
    }
  }

  function flySection() {
    const M = S.M, b = M.bbox;
    const hgt = M.secH ?? Math.min(6, b.max.y - Math.max(b.min.y, -1)), yc = M.secY ?? (Math.max(b.min.y, -1) + hgt * 0.5);
    const x = TB.SECTION.constant;
    const dMin = M.secMin ?? 6;   // distancia mínima de la cámara (los modelos pequeños la reducen)
    flyTo(new T.Vector3(x + Math.max(dMin, hgt * 2.1), yc + hgt * 0.38, Math.max(dMin * 0.67, hgt * 1.25)), new T.Vector3(x - hgt * 0.15, yc - hgt * 0.06, 0));
  }

  // ---------- Telemetría ----------
  function envF(fv, v) { // v en m/s → kN
    let F = Infinity;
    if (fv.Fs != null) F = Math.min(F, fv.Fs);
    if (fv.adh != null) F = Math.min(F, S.mu * fv.adh * 9.81);
    if (fv.P != null) {
      if (fv.vminP != null && v * 3.6 < fv.vminP && fv.Fs == null && fv.adh == null) return null;
      F = Math.min(F, v > 0.05 ? fv.P / v : Infinity);
    }
    return isFinite(F) ? F : null;
  }
  function updateHud() {
    const t = S.t; if (!t) return;
    const tele = t.physics.tele, fv = t.physics.fv;
    const v = S.vkmh / 3.6;
    $('#spdV').textContent = fmt(S.vkmh) + ' km/h';
    const ro = [];
    if (tele.type === 'maglev') {
      const f = v / (2 * tele.tau);
      ro.push([fmt(f, 0) + ' Hz', 'Frec. estator']);
      ro.push([S.play ? '10 mm' : '17 mm', S.play ? 'Entrehierro' : 'En patines']);
      const D = 0.5 * 1.2 * fv.CdA * v * v / 1000;
      ro.push([fmt(D, 1) + ' kN', 'Arrastre']);
      ro.push([fmt(D * v, 0) + ' kW', 'P. aerodin.']);
    } else {
      const n = v / (Math.PI * tele.D) * 60;
      ro.push([fmt(n, 0) + ' rpm', 'Rueda']);
      if (tele.second) ro.push(tele.second);
      else if (tele.type === 'steam') ro.push([fmt(2 * tele.stroke * n / 60, 2) + ' m/s', 'Pistón (media)']);
      else if (tele.gear) ro.push([fmt(n * tele.gear, 0) + ' rpm', tele.gearLabel || 'Motor de tracción']);
      else ro.push([fmt(n, 0) + ' rpm', tele.shaftLabel || 'Eje ciego']);
      const F = envF(fv, v);
      if (tele.type === 'h2') ro.splice(1);   // rueda · esfuerzo · potencia · hidrógeno
      ro.push([F == null ? 'n/d' : fmt(F, F < 10 ? 1 : 0) + ' kN', 'Esfuerzo']);
      ro.push([F == null ? 'n/d' : fmt(F * v, F * v < 10 ? 1 : 0) + ' kW', 'Potencia']);
      if (tele.type === 'h2') {
        const br = S.M && S.M.brake;
        ro.push([br ? 'recarga' : F == null ? 'n/d' : fmt(F * v / ((tele.eta || 0.5) * 33.33), F * v < 100 ? 1 : 0) + ' kg/h', br ? 'Batería' : 'H₂ (máx., est.)']);
      }
    }
    $('#ro').innerHTML = ro.map(r => `<div class="ro"><b>${r[0]}</b><span>${r[1]}</span></div>`).join('');
    if (S.tab === 'fisica') drawFv();
    setHudState(); if (S.pv) pvNums();
  }

  // ---------- Panel ----------
  function renderHead(t) {
    $('#pHead').style.setProperty('--tc', TC[t.traction]);
    $('#pHead').innerHTML = `<span class="chip"><i></i>${t.tractionLabel} · ${t.year} · ${t.country}</span>
      <h2>${t.name}</h2><p class="by">${t.builder} · ${t.place}</p><p class="sum">${t.summary}</p>
      ${TOURS()[t.id] ? `<button class="btn primary tourbtn" id="hTour" type="button"><svg viewBox="0 0 20 20" fill="currentColor"><path d="M6 3.5v13l10-6.5z"/></svg>Cómo funciona · ${TOURS()[t.id].length} pasos</button>` : ''}`;
    const hb = $('#hTour'); hb && hb.addEventListener('click', startTour);
    $('#btnTour').hidden = !TOURS()[t.id];
  }
  function setTabs() { $$('.tabs button').forEach(b => b.setAttribute('aria-selected', b.dataset.tab === S.tab ? 'true' : 'false')); }
  function renderTab() {
    const t = S.t; if (!t) return; setTabs();
    const B = $('#pBody'); B.scrollTop = 0;
    if (S.tab === 'piezas') B.innerHTML = S.sel ? partDetail(t, S.sel) : partList(t);
    if (S.tab === 'ficha') B.innerHTML = fichaHTML(t);
    if (S.tab === 'fisica') { B.innerHTML = fisicaHTML(t); drawFv(); const mu = $('#mu'); mu && mu.addEventListener('input', () => { S.mu = +mu.value / 100; $('#muV').textContent = S.mu.toFixed(2); drawFv(); updateHud(); }); }
    if (S.tab === 'contexto') B.innerHTML = contextoHTML(t);
    if (S.tab === 'fuentes') B.innerHTML = fuentesHTML(t);
    bindPanel();
  }
  function partList(t) {
    const rows = t.partOrder.map((id, k) => { const p = t.parts[id]; return `<tr data-part="${id}" tabindex="0"><td class="n"><b>${k + 1}</b></td><td><div class="nm">${p.name}</div><div class="ds">${p.kicker}</div></td></tr>`; }).join('');
    return `<h3>Lista de piezas</h3><p class="lead">${t.partsIntro}</p><table class="bom"><tbody>${rows}</tbody></table>
      <div class="note"><b>Cómo funciona</b> recorre el tren paso a paso. Al elegir una pieza, <b>Estudiar pieza</b> la aísla sobre un plano con sus componentes señalados y cotas reales. Usa <b>Corte</b> para ver el interior en sección (las superficies cortadas aparecen rayadas, como en un plano) y <b>Flujo de energía</b> para seguir el vapor, el combustible o la corriente.</div>`;
  }
  function partDetail(t, id) {
    const p = t.parts[id], n = t.partOrder.indexOf(id) + 1;
    const sec = (lbl, txt) => txt ? `<div class="sec"><div class="lbl">${lbl}</div><p>${txt}</p></div>` : '';
    const data = p.data && p.data.length ? `<div class="sec"><div class="lbl">Datos</div><dl class="kv">${p.data.map(d => `<dt>${d[0]}</dt><dd>${d[1]}</dd>`).join('')}</dl></div>` : '';
    const refs = p.refs && p.refs.length ? `<div class="sec"><div class="lbl">Para profundizar</div><ul class="refs">${p.refs.map(r => `<li><a href="${r[1]}" target="_blank" rel="noopener">${r[0]}</a></li>`).join('')}</ul></div>` : '';
    return `<button class="back" type="button" data-act="back">← Lista de piezas</button>
      <div class="part-h"><div class="num">${n}</div><div><h4>${p.name}</h4><p class="k">${p.kicker}</p></div></div>
      <div class="part-act">${S.study === id ? '<button class="btn primary" type="button" data-act="unstudy">Salir del estudio</button>' : '<button class="btn primary" type="button" data-act="study"><svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="9" cy="9" r="5.5"/><path d="M13 13l4.5 4.5"/></svg>Estudiar pieza</button>'}<button class="btn" type="button" data-act="focus">Encuadrar</button><button class="btn" type="button" data-act="cut">Ver en corte</button>${S.M && S.M.flows.length ? '<button class="btn" type="button" data-act="flow">Flujo de energía</button>' : ''}</div>
      ${compsHTML(t, id)}
      ${sec('Función', p.fn)}${sec('Diseño', p.design)}${sec('Fabricación', p.make)}${sec('Evolución', p.evo)}${data}${refs}`;
  }
  function compsHTML(t, id) {
    const sd = studyData(id);
    if (!sd || !sd.comps || !sd.comps.length) return S.study === id && sd && sd.note ? `<div class="sec"><div class="lbl">Cómo se mueve</div><p>${sd.note}</p></div>` : '';
    if (S.study !== id) return `<p class="hintp">Modo estudio: ${sd.comps.length} componentes señalados${sd.dims && sd.dims.length ? ` y ${sd.dims.length} cotas` : ''} sobre la pieza aislada.</p>`;
    return `<div class="sec"><div class="lbl">Componentes señalados</div><ol class="comps">${sd.comps.map((c, k) => `<li data-comp="${k}"><b>${LET[k]}</b><div><span class="cn">${c[0]}</span><span class="cd">${c[1]}</span></div></li>`).join('')}</ol>
      ${sd.note ? `<p class="snote"><b>Cómo se mueve.</b> ${sd.note}</p>` : ''}${sd.dims && sd.dims.length ? '<p class="snote">Cotas en milímetros salvo indicación; valores de las fuentes (pestaña Fuentes). El modelo está a escala real.</p>' : ''}</div>`;
  }
  function fichaHTML(t) {
    return t.specs.map(g => `<div class="spec-g"><h3>${g[0]}</h3><dl class="kv">${g[1].map(r => `<dt>${r[0]}</dt><dd>${r[1]}</dd>`).join('')}</dl></div>`).join('') +
      `<div class="note">${t.specNote || 'Las cifras provienen de las fuentes listadas en la pestaña Fuentes. Unidades originales entre paréntesis.'}</div>`;
  }
  function fisicaHTML(t) {
    const ph = t.physics, fv = ph.fv;
    const eqs = ph.eqs.map(e => `<div class="eq"><div class="et">${e.t}</div><div class="ef">${e.f}</div>${e.s ? `<div class="es">${e.s}</div>` : ''}${e.r ? `<div class="er">${e.r}</div>` : ''}${e.n ? `<div class="en">${e.n}</div>` : ''}</div>`).join('');
    const mu = fv.adh != null ? `<div class="mu"><label for="mu">Coeficiente de adherencia μ</label><input type="range" id="mu" min="10" max="40" value="${Math.round(S.mu * 100)}"><b id="muV">${S.mu.toFixed(2)}</b></div>` : '';
    return `<h3>${ph.title}</h3><p class="lead">${ph.intro}</p>
      <h3>Envolvente esfuerzo–velocidad</h3>
      <div class="legend">${fv.legend.map(l => `<span><i style="background:${l[1]}"></i>${l[0]}</span>`).join('')}</div>
      <svg class="chart" id="fvChart" viewBox="0 0 390 240" role="img" aria-label="Curva de esfuerzo de tracción contra velocidad"></svg>
      ${mu}<p style="font-size:12px;color:var(--muted)">${fv.note}</p>
      ${S.M && S.M.steam ? pvSectionHTML() : ''}
      <h3>Ecuaciones con datos reales</h3>${eqs}`;
  }
  function contextoHTML(t) {
    const c = t.context;
    return `<h3>¿Qué estaba pasando?</h3>${c.world.map(p => `<p>${p}</p>`).join('')}
      <h3>Cómo el contexto moldeó el diseño</h3><ul>${c.why.map(li => `<li>${li}</li>`).join('')}</ul>
      <h3>Fabricación</h3><p>${c.make}</p>
      <h3>Cronología</h3><ul class="tl">${c.timeline.map(e => `<li><b>${e[0]}</b>${e[1]}</li>`).join('')}</ul>`;
  }
  function fuentesHTML(t) {
    const kinds = [['primaria', 'Fuentes primarias y oficiales'], ['tecnica', 'Datos técnicos y documentación'], ['libro', 'Bibliografía recomendada']];
    let h = '';
    for (const [k, lbl] of kinds) {
      const list = t.sources.filter(s => s.k === k); if (!list.length) continue;
      h += `<h3>${lbl}</h3><ul class="refs">${list.map(s => `<li><span class="t">${s.who || ''}</span>${s.u ? `<a href="${s.u}" target="_blank" rel="noopener">${s.t}</a>` : s.t}</li>`).join('')}</ul>`;
    }
    h += `<h3>Sobre la exactitud del modelo</h3><p>${t.accuracy}</p><div class="note">${window.ACCURACY_GENERAL}</div>`;
    return h;
  }
  function bindPanel() {
    $$('.bom tr').forEach(tr => { const go = () => selectPart(tr.dataset.part, true); tr.addEventListener('click', go); tr.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } });
      tr.addEventListener('pointerenter', () => { S.hover = tr.dataset.part; applyLook(); }); tr.addEventListener('pointerleave', () => { S.hover = null; applyLook(); }); });
    const a = $$('[data-act]');
    a.forEach(b => b.addEventListener('click', () => {
      const act = b.dataset.act;
      if (act === 'back') { clearSel(); }
      if (act === 'focus') focusPart(S.sel);
      if (act === 'cut') { if (!S.cut) setCut(true); const m = S.t.parts[S.sel].cutMode || 'L'; setCutMode(m); if (m === 'T' && S.t.parts[S.sel].cutX != null) { const b2 = S.M.bbox; S.cutV = Math.round(((S.t.parts[S.sel].cutX - S.M.center) - b2.min.x) / (b2.max.x - b2.min.x) * 1000); $('#cutPos').value = S.cutV; updateCut(); flySection(); } }
      if (act === 'flow') toggleFlow(true);
      if (act === 'study') enterStudy(S.sel);
      if (act === 'unstudy') exitStudy();
      if (act === 'pv') showPV(true);
    }));
    $$('.comps li').forEach(li => { const k = +li.dataset.comp; li.addEventListener('pointerenter', () => hotComp(k, true)); li.addEventListener('pointerleave', () => hotComp(k, false)); });
  }

  // ---------- Gráfica F–v ----------
  function drawFv() {
    const svg = $('#fvChart'); if (!svg) return;
    const t = S.t, fv = t.physics.fv;
    const W = 390, H = 240, ml = 44, mr = 12, mt = 12, mb = 32;
    const vmax = fv.vmax, vMs = v => v / 3.6;
    const samples = [];
    for (let k = 0; k <= 120; k++) { const v = vmax * k / 120; samples.push([v, envF(fv, vMs(v))]); }
    let ymax = fv.ymax || Math.max(...samples.map(s => s[1] || 0), ...(fv.pts || []).map(p => p.F), fv.adh ? 0.4 * fv.adh * 9.81 : 0) * 1.12;
    const nice = x => { const p = Math.pow(10, Math.floor(Math.log10(x))); const m = x / p; return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 2.5 ? 2.5 : m <= 5 ? 5 : 10) * p; };
    const ystep = nice((ymax || 1) / 5); ymax = Math.ceil((ymax || 1) / ystep - 1e-9) * ystep;
    const X = v => ml + (v / vmax) * (W - ml - mr), Y = F => H - mb - (F / ymax) * (H - mt - mb);
    let g = '';
    for (let F = 0; F <= ymax + 1e-9; F += ystep) { g += `<line class="gr" x1="${ml}" x2="${W - mr}" y1="${Y(F)}" y2="${Y(F)}"/><text x="${ml - 6}" y="${Y(F) + 3.5}" text-anchor="end">${fmt(F, F < 10 && F > 0 ? 1 : 0)}</text>`; }
    const xt = nice(vmax / 5);
    for (let v = 0; v <= vmax + 0.01; v += xt) g += `<line class="gr" x1="${X(v)}" x2="${X(v)}" y1="${mt}" y2="${H - mb}"/><text x="${X(v)}" y="${H - mb + 14}" text-anchor="middle">${fmt(v)}</text>`;
    g += `<line class="ax" x1="${ml}" x2="${W - mr}" y1="${H - mb}" y2="${H - mb}"/><line class="ax" x1="${ml}" x2="${ml}" y1="${mt}" y2="${H - mb}"/>`;
    g += `<text x="${(ml + W - mr) / 2}" y="${H - 4}" text-anchor="middle">v (km/h)</text><text x="12" y="${(mt + H - mb) / 2}" text-anchor="middle" transform="rotate(-90 12 ${(mt + H - mb) / 2})">F (kN)</text>`;
    const path = pts => pts.filter(p => p[1] != null && p[1] <= ymax * 1.02).map((p, k) => `${k ? 'L' : 'M'}${X(p[0]).toFixed(1)},${Y(Math.min(p[1], ymax)).toFixed(1)}`).join('');
    if (fv.adh != null) { const Fa = S.mu * fv.adh * 9.81; if (Fa <= ymax) g += `<line x1="${ml}" x2="${W - mr}" y1="${Y(Fa)}" y2="${Y(Fa)}" stroke="#4fb3d9" stroke-width="1.3" stroke-dasharray="5 4"/>`; }
    if (fv.P != null && (fv.Fs != null || fv.adh != null)) { const hp = []; for (let k = 1; k <= 160; k++) { const v = vmax * k / 160; const F = fv.P / vMs(v); if (F <= ymax) hp.push([v, F]); } g += `<path d="${path(hp)}" fill="none" stroke="#8fa2ad" stroke-width="1" stroke-dasharray="2 3"/>`; }
    if (fv.Fs != null && fv.Fs <= ymax) g += `<line x1="${ml}" x2="${W - mr}" y1="${Y(fv.Fs)}" y2="${Y(fv.Fs)}" stroke="#cdb54f" stroke-width="1" stroke-dasharray="1 3"/>`;
    for (const ln of fv.lines || []) if (ln.F <= ymax) g += `<line x1="${ml}" x2="${W - mr}" y1="${Y(ln.F)}" y2="${Y(ln.F)}" stroke="${ln.c}" stroke-width="1.4" stroke-dasharray="6 3"/><text x="${W - mr - 4}" y="${Y(ln.F) - 5}" text-anchor="end" style="fill:${ln.c}">${ln.l}</text>`;
    if (fv.CdA != null) { const dr = []; for (let k = 0; k <= 120; k++) { const v = vmax * k / 120; dr.push([v, 0.5 * 1.2 * fv.CdA * vMs(v) ** 2 / 1000]); } g += `<path d="${path(dr)}" fill="none" stroke="#d9573b" stroke-width="1.6"/>`; }
    g += `<path d="${path(samples)}" fill="none" stroke="#d6a54f" stroke-width="2.4" stroke-linejoin="round"/>`;
    for (const p of fv.pts || []) g += `<circle cx="${X(p.v)}" cy="${Y(p.F)}" r="4" fill="${p.hollow ? 'none' : '#f0cd84'}" stroke="#f0cd84" stroke-width="1.5"/><text x="${X(p.v) + (p.dx ?? 7)}" y="${Y(p.F) + (p.dy ?? -6)}" style="fill:#c9c4b6" text-anchor="${p.anchor || 'start'}">${p.l}</text>`;
    const vNow = Math.min(vmax, S.vkmh), FNow = fv.CdA != null ? 0.5 * 1.2 * fv.CdA * vMs(vNow) ** 2 / 1000 : envF(fv, vMs(vNow));
    g += `<line x1="${X(vNow)}" x2="${X(vNow)}" y1="${mt}" y2="${H - mb}" stroke="#f0cd84" stroke-width="1" opacity=".55"/>`;
    if (FNow != null && FNow <= ymax) g += `<circle cx="${X(vNow)}" cy="${Y(FNow)}" r="5.5" fill="#d9573b" stroke="#fff" stroke-width="1.5"/>`;
    svg.innerHTML = g;
  }

  // ---------- Riel de eras ----------
  function buildRail() {
    $('#rail').innerHTML = TR.map((t, i) => `<button class="stn" type="button" style="--tc:${TC[t.traction]}" aria-current="false" data-i="${i}" aria-label="${t.year}: ${t.name}, ${t.country}"><span class="yr">${t.year}</span><span class="dot"></span><span class="nm">${t.short || t.name}</span><span class="co">${t.country}</span></button>`).join('');
    $$('.stn').forEach(b => b.addEventListener('click', () => goTrain(+b.dataset.i)));
  }

  // ---------- Comparar eras ----------
  function openCompare() {
    $('#sheet').hidden = false; $('#cmpClose').focus();
    const C = TR.map(t => ({ t, ...t.cmp }));
    const card = (title, sub, svg) => `<div class="card"><h3>${title}</h3><p>${sub}</p>${svg}</div>`;
    $('#cmpCharts').innerHTML =
      card('Velocidad máxima', 'En servicio (lleno) y récord (vacío), km/h', yearChart(C, 'vs', 'vr', 600, 'km/h')) +
      card('Potencia específica', 'Potencia nominal ÷ masa de la unidad de tracción, kW/t', barChart(C, 'kwt', 'kW/t')) +
      card('Carga por eje', 'Masa máxima que cada eje transmite a la vía, t', barChart(C, 'axle', 't'));
    $('#cmpTable').innerHTML = `<thead><tr><th>Tren</th><th>Año</th><th style="text-align:left">Tracción</th><th>V servicio (km/h)</th><th>Récord (km/h)</th><th>Potencia (kW)</th><th>Masa (t)</th><th>kW/t</th><th>Carga/eje (t)</th></tr></thead><tbody>` +
      C.map(c => `<tr><td>${c.t.name}</td><td>${c.t.year}</td><td style="text-align:left">${c.t.tractionLabel}</td><td>${v(c.vs)}</td><td>${v(c.vr, c.vr && c.vr % 1 ? 1 : 0)}</td><td>${v(c.P, c.P != null && c.P < 10 ? 1 : 0)}</td><td>${v(c.m, c.m != null && c.m < 10 ? 1 : 0)}</td><td>${v(c.kwt, 1)}</td><td>${c.axle === 0 ? 'sin ruedas' : v(c.axle, 1)}</td></tr>`).join('') + '</tbody>';
    function v(x, d = 0) { return x == null ? '<span class="nd">n/d</span>' : fmt(x, d); }
    $('#cmpTable').insertAdjacentHTML('beforeend', `<caption style="caption-side:bottom;text-align:left;padding:10px;color:var(--muted);font-size:12px">${window.CMP_NOTE}</caption>`);
  }
  const LBL = { rocket: [0, -9, 'start'], siemens: [0, -10, 'middle'], krokodil: [-4, -9, 'end'], mallard: [-6, -4, 'end'], bigboy: [8, -10, 'start'], f7: [6, 14, 'start'], serie0: [8, 4, 'start'], tgv: [-8, 4, 'end'], transrapid: [-8, 4, 'end'], ilint: [-8, 4, 'end'] };
  function yearChart(C, a, b, ymax, unit) {
    const W = 380, H = 230, ml = 40, mr = 14, mt = 14, mb = 28, x0 = 1820, x1 = 2025;
    const X = y => ml + (y - x0) / (x1 - x0) * (W - ml - mr), Y = v => H - mb - v / ymax * (H - mt - mb);
    let g = '';
    for (let v = 0; v <= ymax; v += 100) g += `<line class="gr" x1="${ml}" x2="${W - mr}" y1="${Y(v)}" y2="${Y(v)}"/><text x="${ml - 6}" y="${Y(v) + 3.5}" text-anchor="end">${v}</text>`;
    for (let y = 1840; y <= 2020; y += 40) g += `<text x="${X(y)}" y="${H - mb + 14}" text-anchor="middle">${y}</text>`;
    g += `<line class="ax" x1="${ml}" x2="${W - mr}" y1="${H - mb}" y2="${H - mb}"/>`;
    const pts = C.filter(c => c[a] != null);
    g += `<path d="${pts.map((c, k) => `${k ? 'L' : 'M'}${X(c.t.year)},${Y(c[a])}`).join('')}" fill="none" stroke="#d6a54f" stroke-width="2"/>`;
    for (const c of C) {
      const col = TCOL[c.t.traction] || '#a796f2';
      if (c[a] != null) g += `<circle cx="${X(c.t.year)}" cy="${Y(c[a])}" r="4.5" fill="${col}"/>`;
      if (c[b] != null) g += `<circle cx="${X(c.t.year)}" cy="${Y(c[b])}" r="4.5" fill="none" stroke="${col}" stroke-width="1.6"/><line x1="${X(c.t.year)}" x2="${X(c.t.year)}" y1="${Y(c[a] ?? 0)}" y2="${Y(c[b]) + 4}" stroke="${col}" stroke-width="1" stroke-dasharray="2 2"/>`;
      const yv = c[b] ?? c[a]; const L = LBL[c.t.id] || [0, -9, 'middle'];
      if (yv != null) g += `<text x="${X(c.t.year) + L[0]}" y="${Y(yv) + L[1]}" text-anchor="${L[2]}" style="fill:#c9c4b6">${c.t.short || c.t.name}</text>`;
    }
    const nd = C.filter(c => c[a] == null && c[b] == null).map(c => c.t.short || c.t.name);
    if (nd.length) g += `<text x="${ml + 6}" y="${mt + 6}" text-anchor="start">Sin dato: ${nd.join(', ')}</text>`;
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="Velocidad por año">${g}</svg>`;
  }
  function barChart(C, key, unit) {
    const W = 380, rowH = 24, H = C.length * rowH + 16, ml = 92, mr = 46;
    const max = Math.max(...C.map(c => c[key] || 0)) * 1.08;
    let g = '';
    C.forEach((c, k) => {
      const y = 8 + k * rowH, val = c[key];
      const col = TCOL[c.t.traction] || '#a796f2';
      g += `<text x="${ml - 8}" y="${y + 15}" text-anchor="end" style="fill:#c9c4b6">${c.t.short || c.t.name}</text>`;
      if (val === 0) g += `<text x="${ml}" y="${y + 15}" style="fill:#a796f2">sin ruedas</text>`;
      else if (val != null) { const w = (W - ml - mr) * val / max; g += `<rect x="${ml}" y="${y + 4}" width="${Math.max(2, w)}" height="${rowH - 9}" rx="3" fill="${col}"/><text x="${ml + w + 6}" y="${y + 15}">${fmt(val, val < 20 ? 1 : 0)}</text>`; }
      else g += `<text x="${ml}" y="${y + 15}">n/d</text>`;
    });
    return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="${unit}">${g}</svg>`;
  }

  // ---------- Controles ----------
  function setPressed(sel, on) { const b = $(sel); b && b.setAttribute('aria-pressed', on ? 'true' : 'false'); }
  function toggleFlow(on) { S.flow = on ?? !S.flow; setPressed('#tFlow', S.flow); if (S.M) S.M.flowGroup.visible = S.flow; needs = true; }
  function setSpeed(v) { const mx = +$('#spd').max; S.vkmh = Math.max(0, Math.min(mx, v)); $('#spd').value = String(S.vkmh); updateHud(); needs = true; }
  function setTs(ts) { S.ts = ts; $$('.hud .seg button').forEach(x => x.setAttribute('aria-pressed', +x.dataset.ts === ts ? 'true' : 'false')); }
  function togglePlay(on) {
    S.play = on ?? !S.play; setPressed('#play', S.play);
    $('#play').innerHTML = S.play ? '<svg viewBox="0 0 16 16" fill="currentColor"><rect x="3.5" y="2.5" width="3" height="11" rx="1"/><rect x="9.5" y="2.5" width="3" height="11" rx="1"/></svg>' : '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M4 2.5v11l9-5.5z"/></svg>';
    $('#play').setAttribute('aria-label', S.play ? 'Pausar mecanismos' : 'Animar mecanismos');
    const tp = $('#tourPlay'); if (tp) { tp.innerHTML = S.play ? '<svg viewBox="0 0 16 16" fill="currentColor"><rect x="3.5" y="2.5" width="3" height="11" rx="1"/><rect x="9.5" y="2.5" width="3" height="11" rx="1"/></svg>' : '<svg viewBox="0 0 16 16" fill="currentColor"><path d="M4 2.5v11l9-5.5z"/></svg>'; tp.setAttribute('aria-label', S.play ? 'Pausar' : 'Animar'); }
    if (S.M) S.M.powered = S.play;
    last = performance.now(); needs = true; updateHud();
  }
  function bindUI() {
    $('#tCut').addEventListener('click', () => setCut(!S.cut));
    $('#cutL').addEventListener('click', () => setCutMode('L'));
    $('#cutT').addEventListener('click', () => setCutMode('T'));
    $('#cutPos').addEventListener('input', e => { S.cutV = +e.target.value; updateCut(); });
    $('#tExp').addEventListener('click', () => { S.exp = !S.exp; setPressed('#tExp', S.exp); $('#expCtl').hidden = !S.exp; needs = true; });
    $('#expAmt').addEventListener('input', e => { S.expTarget = +e.target.value / 100; });
    $('#tX').addEventListener('click', () => { S.xray = !S.xray; setPressed('#tX', S.xray); applyLook(); });
    $('#tFlow').addEventListener('click', () => toggleFlow());
    $('#tLab').addEventListener('click', () => { S.labels = !S.labels; setPressed('#tLab', S.labels); needs = true; placeLabels(); });
    $('#tHome').addEventListener('click', () => { if (!stage) return; const cp = stage.camPreset(); flyTo(cp.pos, cp.target); });
    $('#play').addEventListener('click', () => togglePlay());
    $('#spd').addEventListener('input', e => { S.vkmh = +e.target.value; updateHud(); needs = true; });
    $$('.hud .seg button').forEach(b => b.addEventListener('click', () => { S.ts = +b.dataset.ts; $$('.hud .seg button').forEach(x => setPressed2(x, x === b)); }));
    function setPressed2(el, on) { el.setAttribute('aria-pressed', on ? 'true' : 'false'); }
    $$('.tabs button').forEach(b => b.addEventListener('click', () => { S.tab = b.dataset.tab; renderTab(); }));
    $('#btnCompare').addEventListener('click', openCompare);
    $('#btnTour').addEventListener('click', startTour);
    $('#tourPrev').addEventListener('click', () => tourStep(-1));
    $('#tourNext').addEventListener('click', () => tourStep(1));
    $('#tourExit').addEventListener('click', () => exitTour());
    $('#tourMin').addEventListener('click', () => { const t = $('#tour'), m = !t.classList.contains('min'); t.classList.toggle('min', m); $('#tourMin').setAttribute('aria-expanded', m ? 'false' : 'true'); $('#tourMin').setAttribute('aria-label', m ? 'Mostrar explicación' : 'Contraer explicación'); requestAnimationFrame(viewOffset); });
    $('#tourPlay').addEventListener('click', () => togglePlay());
    $('#sRot').addEventListener('click', () => setAuto(!S.auto));
    $('#sExit').addEventListener('click', () => exitStudy());
    $('#pvClose').addEventListener('click', () => showPV(false));
    $('#pvCut').addEventListener('input', e => { if (!S.M || !S.M.steam) return; S.M.setCutoff(+e.target.value / 100); drawPV(); setHudState(); if (S.tab === 'fisica') renderTab(); needs = true; });
    $('#cmpClose').addEventListener('click', () => { $('#sheet').hidden = true; $('#btnCompare').focus(); });
    $('#sheet').addEventListener('click', e => { if (e.target.id === 'sheet') $('#sheet').hidden = true; });
    // puntero sobre el lienzo
    const cv = $('#cv'); let down = null, lastMove = 0;
    cv.addEventListener('pointerdown', e => { down = { x: e.clientX, y: e.clientY }; if (S.study && stage.controls.autoRotate) setAuto(false); });
    cv.addEventListener('pointerup', e => {
      if (!down) return; const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y); down = null;
      if (moved > 6) return;
      if (S.study) return;
      const id = pick(e);
      if (id) selectPart(id, true); else clearSel();
    });
    cv.addEventListener('pointermove', e => {
      if (e.pointerType !== 'mouse' || down) return;
      const now = performance.now(); if (now - lastMove < 60) return; lastMove = now;
      const id = pick(e); const tip = $('#tip');
      if (id !== S.hover) { S.hover = id; applyLook(); }
      cv.style.cursor = id ? 'pointer' : 'grab';
      if (id) { const r = $('#vp').getBoundingClientRect(); tip.hidden = false; tip.textContent = `${S.t.partOrder.indexOf(id) + 1} · ${S.t.parts[id].name}`; tip.style.left = (e.clientX - r.left) + 'px'; tip.style.top = (e.clientY - r.top) + 'px'; }
      else tip.hidden = true;
    });
    cv.addEventListener('pointerleave', () => { $('#tip').hidden = true; if (S.hover) { S.hover = null; applyLook(); } });
    // teclado
    document.addEventListener('keydown', e => {
      if (e.target.closest('input, select, textarea')) return;
      if (!$('#sheet').hidden) { if (e.key === 'Escape') $('#sheet').hidden = true; return; }
      if (S.tour) { if (e.key === 'ArrowRight') { tourStep(1); return; } if (e.key === 'ArrowLeft') { tourStep(-1); return; } if (e.key === 'Escape') { exitTour(); return; } }
      if (S.study && e.key === 'Escape') { exitStudy(); return; }
      if (e.key === 'ArrowRight') goTrain(Math.min(TR.length - 1, S.i + 1));
      else if (e.key === 'ArrowLeft') goTrain(Math.max(0, S.i - 1));
      else if (e.key === 'Escape') clearSel();
      else if (e.key === ' ' && e.target === document.body) { e.preventDefault(); togglePlay(); }
      else if (e.key.toLowerCase() === 'c') setCut(!S.cut);
      else if (e.key.toLowerCase() === 'x') $('#tX').click();
      else if (e.key.toLowerCase() === 'e') $('#tExp').click();
      else if (e.key.toLowerCase() === 'f') toggleFlow();
      else if (e.key.toLowerCase() === 'l') $('#tLab').click();
      else if (e.key.toLowerCase() === 'h') $('#tHome').click();
    });
  }


  // ---------- Controles extra del HUD: p–V, freno, vía irregular, estado ----------
  function buildHudX() {
    const M = S.M, x = $('#hudX'); if (!M) return;
    let h = '';
    if (M.steam) h += '<button class="chipb" id="bPV" type="button" aria-pressed="false" title="Diagrama indicado presión–volumen en vivo">Diagrama p–V</button>';
    if (M.brakeType) h += `<button class="chipb" id="bBrake" type="button" aria-pressed="false" title="Los motores pasan a funcionar como generadores">${M.brakeType === 'regen' ? 'Freno regenerativo' : S.t.id === 'f7' ? 'Freno dinámico' : 'Freno reostático'}</button>`;
    if (M.modes.irregular) h += '<button class="chipb" id="bIrr" type="button" aria-pressed="false" title="Una junta de carril levantada: observa la suspensión compensada">Vía irregular</button>';
    if (M.modes.curve) h += '<button class="chipb" id="bCurve" type="button" aria-pressed="false" title="La unidad delantera gira sobre el pivote como en la curva mínima">Curva cerrada</button>';
    h += '<span class="hstate" id="hState"></span>';
    x.innerHTML = h;
    const bp_ = $('#bPV'); bp_ && bp_.addEventListener('click', () => showPV(!S.pv));
    const bb = $('#bBrake'); bb && bb.addEventListener('click', () => { M.setBrake(!M.brake); if (M.brake) { toggleFlow(true); if (!S.play) togglePlay(true); } updateHudX(); needs = true; });
    const bi = $('#bIrr'); bi && bi.addEventListener('click', () => { M.irregular = !M.irregular; if (M.irregular && !S.play) togglePlay(true); updateHudX(); needs = true; });
    const bc = $('#bCurve'); bc && bc.addEventListener('click', () => { M.curve = !M.curve; if (M.curve && !S.play) togglePlay(true); updateHudX(); needs = true; });
    updateHudX();
  }
  function updateHudX() {
    const M = S.M; if (!M) return;
    setPressed('#bPV', S.pv); setPressed('#bBrake', !!M.brake); setPressed('#bIrr', !!M.irregular); setPressed('#bCurve', !!M.curve);
    setHudState();
  }
  function setHudState() {
    const el = $('#hState'), M = S.M; if (!el || !M) return;
    let s = '';
    if (M.brake) s = M.brakeType === 'regen' ? `Motores → generadores · energía ${M.regenTo ? 'a la ' + M.regenTo : 'devuelta a la red'}` : 'Motores → generadores · calor en resistencias';
    else if (M.curve) s = 'Curva de 288 ft (87,8 m): la unidad delantera gira sobre el pivote';
    else if (M.steam) s = `Corte ${Math.round(M.steam.cut * 100)} % · ${2 * M.steam.cyls.length} escapes por vuelta`;
    else if (M.rpm != null) s = M.notch ? `Punto ${M.notch} de 8 · motor ${fmt(M.rpm)} rpm` : `Ralentí · motor ${fmt(M.rpm)} rpm`;
    else if (M.notch != null) s = S.play ? `Toma ${M.notch} de 22 del transformador` : 'Toma 0 de 22';
    else if (S.t && S.t.physics.tele.type === 'h2') s = S.play ? 'Pila en marcha · por el techo sale vapor de agua' : 'Pila en reposo';
    if (M.irregular) s = 'Junta levantada: el balancín reparte la carga';
    if (el.textContent !== s) el.textContent = s;
  }

  // ---------- Diagrama indicado p–V ----------
  function showPV(on) {
    S.pv = !!on && !!(S.M && S.M.steam);
    $('#pv').hidden = !S.pv; setPressed('#bPV', S.pv);
    if (S.pv) drawPV();
    viewOffset();
  }
  function pvGeom() {
    const st = S.M.steam; let k = 0;
    for (const c of st.cyls) k += Math.PI * c.bore * c.bore * 2 * c.r; // A·L por cilindro
    const c0 = st.cyls[0];
    return { st, AL: k, n: st.cyls.length, D: Math.round(c0.bore * 2000), L: Math.round(c0.r * 2000) };
  }
  const PVW = 300, PVH = 176, PVm = [40, 10, 10, 28];
  const pvX = (V, st) => PVm[0] + V / (1 + st.clr) * (PVW - PVm[0] - PVm[1]);
  const pvY = p => PVH - PVm[3] - p / 1.06 * (PVH - PVm[2] - PVm[3]);
  function drawPV() {
    const M = S.M; if (!M || !M.steam) return;
    const st = M.steam, svg = $('#pvSvg'); const ind = MB.indicator(st, 96);
    let g = '';
    const step = st.pB > 10 ? 4 : st.pB > 5 ? 2 : 1;
    for (let b = 0; b <= st.pB + 1e-6; b += step) { const y = pvY(b / st.pB); g += `<line class="gr" x1="${PVm[0]}" x2="${PVW - PVm[1]}" y1="${y}" y2="${y}"/><text x="${PVm[0] - 5}" y="${y + 3.5}" text-anchor="end">${fmt(b)}</text>`; }
    g += `<line class="ax" x1="${PVm[0]}" x2="${PVW - PVm[1]}" y1="${pvY(0)}" y2="${pvY(0)}"/><line class="ax" x1="${PVm[0]}" x2="${PVm[0]}" y1="${PVm[2]}" y2="${pvY(0)}"/>`;
    // eventos de distribución: corte y escape en la carrera motriz (arriba), compresión en la de retorno (abajo)
    const ev = [[st.clr + st.cut, 'corte', 'top'], [st.clr + st.rel, 'escape', 'top'], [st.clr + st.comp, 'compresión', 'bot']];
    let lastTop = -1e9;
    ev.forEach(([V, l, w]) => {
      const x = pvX(V, st);
      g += `<line x1="${x}" x2="${x}" y1="${PVm[2]}" y2="${pvY(0)}" stroke="#8fa2ad" stroke-width=".8" stroke-dasharray="2 3"/>`;
      const right = x > PVW - 64, tx = right ? x - 3 : x + 3, an = right ? 'end' : 'start';
      if (w === 'top') { const dy = x - lastTop < 48 ? 11 : 0; lastTop = x; g += `<text x="${tx}" y="${PVm[2] + 9 + dy}" text-anchor="${an}" style="fill:#c9c4b6">${l}</text>`; }
      else g += `<text x="${tx}" y="${pvY(0) - 4}" text-anchor="${an}" style="fill:#c9c4b6">${l}</text>`;
    });
    g += `<text x="${pvX(0, st)}" y="${pvY(0) + 12}" text-anchor="start">V₀ (espacio muerto)</text>`;
    g += `<text x="${PVW - PVm[1]}" y="${PVH - 3}" text-anchor="end">volumen de cámara →</text><text x="11" y="${(PVm[2] + pvY(0)) / 2}" text-anchor="middle" transform="rotate(-90 11 ${(PVm[2] + pvY(0)) / 2})">p (bar man.)</text>`;
    const d = ind.pts.map((q, k) => `${k ? 'L' : 'M'}${pvX(q[0], st).toFixed(1)},${pvY(q[1]).toFixed(1)}`).join('') + 'Z';
    g += `<path d="${d}" fill="rgba(214,165,79,.16)" stroke="#f0cd84" stroke-width="1.8" stroke-linejoin="round"/>`;
    g += `<circle id="pvA" r="5" fill="#d9573b" stroke="#fff" stroke-width="1.4"/><circle id="pvB" r="5" fill="#4fb3d9" stroke="#fff" stroke-width="1.4"/>`;
    svg.innerHTML = g;
    const sl = $('#pvCut'); sl.value = String(Math.round(st.cut * 100)); sl.disabled = !!st.fixedCut;
    $('#pvCutV').textContent = Math.round(st.cut * 100) + ' %';
    $('#pvNote').textContent = (st.fixedCut ? 'Excéntricas de calado fijo: sin corte variable (valor estimado). ' : st.pAssumed ? 'Presión de caldera supuesta (no documentada). ' : 'Menos corte: más expansión y menos vapor por golpe. ') + 'Ciclo ideal: cota superior de la potencia.';
    pvNums(); pvLive();
  }
  function pvNums() {
    const M = S.M; if (!M || !M.steam || !$('#pvNums')) return;
    const { st, AL } = pvGeom(); const ind = MB.indicator(st, 96);
    const pm = ind.mep * st.pB; // bar
    const W = 2 * pm * 1e5 * AL / 1000; // kJ por vuelta (doble efecto, todos los cilindros)
    const N = (S.vkmh / 3.6) / (2 * Math.PI * st.Rw);
    $('#pvNums').innerHTML = `<div><b>${fmt(pm, 2)} bar</b><span>p media</span></div><div><b>${fmt(W, 1)} kJ</b><span>por vuelta</span></div><div><b>${fmt(W * N, 0)} kW</b><span>P ind. ideal</span></div>`;
  }
  function pvLive() {
    const M = S.M; if (!M || !M.steam) return; const st = M.steam, c = st.cyls[0];
    const a = $('#pvA'), b = $('#pvB'); if (!a) return;
    a.setAttribute('cx', pvX(st.clr + c.xA, st)); a.setAttribute('cy', pvY(c.pA));
    b.setAttribute('cx', pvX(st.clr + c.xB, st)); b.setAttribute('cy', pvY(c.pBv));
  }
  function pvSectionHTML() {
    const { st, AL, n, D, L } = pvGeom(); const ind = MB.indicator(st, 96);
    const pm = ind.mep * st.pB, W = 2 * pm * 1e5 * AL / 1000;
    const N = (S.vkmh / 3.6) / (2 * Math.PI * st.Rw);
    return `<h3>Diagrama indicado p–V (ciclo ideal)</h3>
      <p>Cada cámara del cilindro recorre un lazo: admisión a presión de caldera hasta el <b>corte</b>, expansión politrópica (n ≈ 1,3), <b>escape</b> anticipado, contrapresión de escape y <b>compresión</b> del vapor residual que amortigua al pistón al final de carrera. El área encerrada es el trabajo por carrera.</p>
      <div class="part-act"><button class="btn" type="button" data-act="pv">Ver el diagrama en vivo sobre el modelo</button></div>
      <div class="eq"><div class="et">Presión media efectiva (corte ${Math.round(st.cut * 100)} %)</div><div class="ef">p<sub>m</sub> = (1/V<sub>s</sub>) ∮ p dV</div><div class="es">= ${fmt(ind.mep, 3)} · ${fmt(st.pB, 1)} bar</div><div class="er">p<sub>m</sub> ≈ ${fmt(pm, 2)} bar</div></div>
      <div class="eq"><div class="et">Trabajo por vuelta de rueda (${n} cilindros de doble efecto, Ø ${fmt(D)} × ${fmt(L)} mm)</div><div class="ef">W = 2 · n · p<sub>m</sub> · A · L</div><div class="er">W ≈ ${fmt(W, 1)} kJ</div></div>
      <div class="eq"><div class="et">Potencia indicada ideal a ${fmt(S.vkmh)} km/h</div><div class="ef">P<sub>i</sub> = W · N,&nbsp; N = v / (π·D<sub>rueda</sub>)</div><div class="es">N = ${fmt(N, 2)} rev/s</div><div class="er">P<sub>i</sub> ≈ ${fmt(W * N, 0)} kW</div><div class="en">Cota superior: a alta velocidad la presión en la caja de vapor cae por estrangulamiento en lumbreras y regulador, y la caldera no produce vapor suficiente; por eso la curva F–v real queda por debajo.</div></div>`;
  }

  // ---------- Recorrido guiado «Cómo funciona» ----------
  function startTour() {
    const steps = TOURS()[S.t.id]; if (!steps || !S.M || !stage) return;
    if (S.study) exitStudy(true);
    $('#sheet').hidden = true;
    S.tour = { k: -1, steps, saved: { play: S.play, vkmh: S.vkmh, ts: S.ts } };
    S.sel = null; S.tab = 'piezas'; renderTab();
    $('#tour').hidden = false; $('#hud').hidden = true; $('#btnTour').hidden = true;
    $('#tourDots').innerHTML = steps.map((_, i) => `<button type="button" aria-label="Paso ${i + 1}" data-k="${i}"></button>`).join('');
    $$('#tourDots button').forEach(b => b.addEventListener('click', () => tourGo(+b.dataset.k)));
    tourGo(0);
    $('#tourNext').focus({ preventScroll: true });
  }
  function tourStep(d) { if (!S.tour) return; const k = S.tour.k + d; if (k >= S.tour.steps.length) exitTour(); else tourGo(k); }
  function tourGo(k) {
    const TT = S.tour; if (!TT || !S.M) return;
    k = Math.max(0, Math.min(TT.steps.length - 1, k)); TT.k = k;
    const st = TT.steps[k], M = S.M;
    $('#tourK').textContent = `Cómo funciona · ${k + 1} / ${TT.steps.length}`;
    $('#tourT').textContent = st.t;
    $('#tourD').innerHTML = st.d;
    $('#tourF').innerHTML = st.f || ''; $('#tourF').hidden = !st.f;
    $$('#tourDots button').forEach((b, i) => { b.className = i < k ? 'done' : i === k ? 'on' : ''; b.setAttribute('aria-current', i === k ? 'step' : 'false'); });
    $('#tourPrev').disabled = k === 0;
    $('#tourNext').textContent = k === TT.steps.length - 1 ? 'Terminar' : 'Siguiente →';
    if (S.sel) { S.sel = null; renderTab(); }
    S.xray = !!st.xray; setPressed('#tX', S.xray);
    S.exp = !!st.exp; setPressed('#tExp', S.exp); $('#expCtl').hidden = true;
    if (M.modes.irregular) M.irregular = !!st.irregular;
    if (M.modes.curve) M.curve = !!st.curve;
    if (M.brakeType) M.setBrake(!!st.brake);
    if (st.flows) { toggleFlow(true); if (!st.brake) M.flows.forEach((f, i) => (f.visible = st.flows === true || st.flows.includes(i))); }
    else { toggleFlow(false); M.flows.forEach(f => (f.visible = true)); }
    if (st.v != null) setSpeed(st.v);
    if (st.ts != null) setTs(st.ts);
    if (st.cutoff != null && M.steam && !M.steam.fixedCut) M.setCutoff(st.cutoff);
    togglePlay(st.play ?? true);
    showPV(!!st.pv && !!M.steam && !narrow());
    S.tourHL = st.hl || (st.part ? [st.part] : []);
    S.tourGhost = !!st.ghost;
    if (st.cut) {
      if (!S.cut) setCut(true);
      S.cutMode = st.cut; setPressed('#cutL', st.cut === 'L'); setPressed('#cutT', st.cut === 'T');
      if (st.cut === 'T') { const b = M.bbox; const xw = (st.cutX ?? S.t.cutX) - M.center; S.cutV = Math.round(Math.max(0, Math.min(1, (xw - b.min.x) / (b.max.x - b.min.x))) * 1000); }
      else S.cutV = st.cutV ?? 613;
      $('#cutPos').value = String(S.cutV); updateCut();
    } else if (S.cut) setCut(false);
    tourCam(st);
    requestAnimationFrame(viewOffset);
    applyLook(); updateHudX(); needs = true;
  }
  function tourCam(st) {
    const M = S.M;
    if (st.view === 'home' || (!st.part && !st.at && !st.dir)) { const cp = stage.camPreset(); if (st.dir) { const dd = cp.pos.distanceTo(cp.target) * (st.zoom || 1); flyTo(cp.target.clone().addScaledVector(new T.Vector3(...st.dir).normalize(), dd), cp.target, 1100); } else flyTo(cp.pos, cp.target, 1100); return; }
    if (st.cut === 'T' && !st.dir) { flySection(); return; }
    const p = st.part ? M.parts[st.part] : null;
    const c = st.at ? new T.Vector3(...st.at) : p.anchor.clone().addScaledVector(p.explode, S.exp ? S.expTarget : 0);
    M.root.localToWorld(c);
    const rad = Math.max(0.9, Math.min(10, p ? p.radius : 3));
    const dist = st.dist ?? Math.max(3.6, rad * 3.0 + 1.8);
    const dir = new T.Vector3(...(st.dir || [0.42, 0.4, 1])).normalize();
    flyTo(c.clone().addScaledVector(dir, dist), c, 1100);
  }
  // desplaza el punto principal de la cámara para que el sujeto quede sobre la tarjeta del recorrido
  function viewOffset() {
    if (!stage) return;
    const r = $('#vp').getBoundingClientRect(), W = Math.max(1, r.width), H = Math.max(1, r.height);
    const cam = stage.camera;
    let ox = 0, oy = 0;
    if (S.tour) { const card = $('#tour').getBoundingClientRect(); const cover = Math.max(0, Math.min(0.45, (r.bottom - card.top) / H)); oy = H * cover * 0.42; }
    if (S.pv && W > 700) { const pr = $('#pv').getBoundingClientRect(); if (pr.width) ox = Math.min(W * 0.2, (r.right - pr.left) * 0.45); }
    if (ox || oy) cam.setViewOffset(W, H, ox, oy, W, H); else cam.clearViewOffset();
    needs = true;
  }
  function exitTour(silent) {
    const TT = S.tour; if (!TT) return;
    S.tour = null; S.tourHL = []; S.tourGhost = false;
    $('#tour').hidden = true; $('#hud').hidden = false; $('#btnTour').hidden = !TOURS()[S.t.id];
    const M = S.M;
    if (M) { if (M.brakeType) M.setBrake(false); M.irregular = false; M.curve = false; M.flows.forEach(f => (f.visible = true)); }
    S.xray = false; setPressed('#tX', false); S.exp = false; setPressed('#tExp', false);
    toggleFlow(false); setCut(false); showPV(false); viewOffset();
    setSpeed(TT.saved.vkmh); setTs(TT.saved.ts); togglePlay(TT.saved.play);
    applyLook(); updateHudX();
    if (!silent && stage) { const cp = stage.camPreset(); flyTo(cp.pos, cp.target, 1000); $('#btnTour').focus({ preventScroll: true }); }
  }

  // ---------- Modo estudio: pieza aislada, componentes y cotas ----------
  function studyData(id) { return (STUDY()[S.t.id] || {})[id] || null; }
  let bp = null, sEls = { comps: [], dims: [] }, sCenter = new T.Vector3();
  function makeBlueprint() {
    const g = new T.Group();
    const disc = new T.Mesh(new T.CircleGeometry(1, 72), new T.MeshBasicMaterial({ color: '#0f2638', transparent: true, opacity: 0.72, depthWrite: false }));
    disc.rotation.x = -Math.PI / 2; disc.position.y = -0.003; disc.renderOrder = -2; g.add(disc);
    const sh = new T.Mesh(new T.CircleGeometry(1, 72), new T.ShadowMaterial({ opacity: 0.38, depthWrite: false }));
    sh.rotation.x = -Math.PI / 2; sh.position.y = -0.001; sh.receiveShadow = true; g.add(sh);
    const ring = new T.Mesh(new T.RingGeometry(0.986, 1, 120), new T.MeshBasicMaterial({ color: '#8cc8f0', transparent: true, opacity: 0.75, depthWrite: false }));
    ring.rotation.x = -Math.PI / 2; g.add(ring);
    const tk = []; for (let a = 0; a < 360; a += 10) { const r0 = a % 90 === 0 ? 0.9 : a % 30 === 0 ? 0.94 : 0.965, c = Math.cos(a * Math.PI / 180), s = Math.sin(a * Math.PI / 180); tk.push(c * r0, 0, s * r0, c * 0.986, 0, s * 0.986); }
    const tg = new T.BufferGeometry(); tg.setAttribute('position', new T.Float32BufferAttribute(tk, 3));
    g.add(new T.LineSegments(tg, new T.LineBasicMaterial({ color: '#8cc8f0', transparent: true, opacity: 0.6 })));
    const grid = new T.LineSegments(new T.BufferGeometry(), new T.LineBasicMaterial({ color: '#3f7fae', transparent: true, opacity: 0.42, depthWrite: false }));
    grid.name = 'grid'; g.add(grid);
    return g;
  }
  function setGrid(R) {
    const step = [0.1, 0.25, 0.5, 1, 2].find(s => R / s <= 14) || 2;
    const grid = bp.getObjectByName('grid'); const a = [];
    for (let x = -Math.floor(R / step) * step; x <= R + 1e-6; x += step) { const h = Math.sqrt(Math.max(0, R * R - x * x)) / R; const u = x / R; a.push(u, 0, -h, u, 0, h, -h, 0, u, h, 0, u); }
    grid.geometry.dispose(); grid.geometry = new T.BufferGeometry(); grid.geometry.setAttribute('position', new T.Float32BufferAttribute(a, 3));
    return step;
  }
  function enterStudy(id) {
    const M = S.M; if (!M || !M.parts[id] || !stage) return;
    if (S.tour) exitTour(true);
    S.study = id; S.sel = id;
    S.exp = false; S.expK = 0; M.setExplode(0); setPressed('#tExp', false); $('#expCtl').hidden = true; $('#tExp').disabled = true;
    stage.envGroup.visible = false;
    $('#vp').classList.add('study'); $('#studyBar').hidden = false; $('#btnTour').hidden = true;
    $('#studyName').textContent = S.t.parts[id].name;
    const p = M.parts[id], sd = studyData(id) || {};
    const box = p.box;
    const c = sd.at ? new T.Vector3(...sd.at) : box.getCenter(new T.Vector3());
    const size = sd.r ? new T.Vector3(sd.r * 1.7, sd.r, sd.r) : box.getSize(new T.Vector3());
    sCenter.copy(c);
    const cw = c.clone(); M.root.localToWorld(cw);
    const base = new T.Vector3(c.x, sd.floor ?? box.min.y, c.z); M.root.localToWorld(base);
    if (!bp) { bp = makeBlueprint(); stage.scene.add(bp); }
    const R = sd.r ? sd.r * 1.15 : Math.max(0.8, Math.hypot(size.x, size.z) * 0.62);
    // ajustes de escena propios de la pieza (corte, rayos X, modos)
    toggleFlow(false);
    S.studySet = { cut: !!sd.cut, xray: !!sd.xray && !S.xray, brake: !!sd.brake && !!M.brakeType, irr: !!sd.irregular && !!M.modes.irregular, curve: !!sd.curve && !!M.modes.curve };
    if (sd.xray) { S.xray = true; setPressed('#tX', true); }
    if (S.studySet.brake) M.setBrake(true);
    if (S.studySet.irr) M.irregular = true;
    if (S.studySet.curve) M.curve = true;
    if (sd.cut) {
      if (!S.cut) setCut(true);
      S.cutMode = sd.cut; setPressed('#cutL', sd.cut === 'L'); setPressed('#cutT', sd.cut === 'T');
      if (sd.cut === 'T') { const b = M.bbox; S.cutV = Math.round(Math.max(0, Math.min(1, ((sd.cutX ?? S.t.cutX) - M.center - b.min.x) / (b.max.x - b.min.x))) * 1000); }
      else S.cutV = sd.cutV ?? 613;
      $('#cutPos').value = String(S.cutV); updateCut();
    } else if (S.cut) setCut(false);
    if (sd.v != null) setSpeed(sd.v);
    const step = setGrid(R);
    bp.visible = true; bp.scale.setScalar(R); bp.position.set(cw.x, base.y - 0.01, cw.z);
    $('#studyGrid').textContent = `Cuadrícula ${step < 1 ? fmt(step * 1000) + ' mm' : fmt(step) + ' m'}`;
    stage.controls.minDistance = 0.4;
    setAuto(!reduce);
    const vf = stage.camera.fov * Math.PI / 180, hf = 2 * Math.atan(Math.tan(vf / 2) * stage.camera.aspect);
    const rad = sd.r ?? Math.max(0.3, size.length() * 0.5);
    const dist = rad / Math.sin(Math.min(vf, hf) / 2) * (sd.fit ?? 1.08);
    const dir = new T.Vector3(...(sd.view || [0.78, 0.42, 1])).normalize();
    flyTo(cw.clone().addScaledVector(dir, dist), cw, 1000);
    buildStudy(sd);
    if (sd.play) { setTs(sd.ts ?? 0.0625); togglePlay(true); }
    showPV(!!sd.pv && !!M.steam && !narrow());
    updateHudX(); applyLook(); renderTab(); needs = true;
  }
  function setAuto(on) { S.auto = on; if (stage) { stage.controls.autoRotate = on && !!S.study; stage.controls.autoRotateSpeed = 0.9; } setPressed('#sRot', on); }
  function exitStudy(silent) {
    if (!S.study) return; const id = S.study;
    S.study = null; $('#sLayer').hidden = true; $('#studyBar').hidden = true; $('#vp').classList.remove('study');
    $('#tExp').disabled = false; if (stage) { stage.envGroup.visible = true; stage.controls.autoRotate = false; stage.controls.minDistance = 1.5; }
    if (bp) bp.visible = false;
    $('#btnTour').hidden = !TOURS()[S.t.id];
    showPV(false);
    const ss = S.studySet || {}, M = S.M;
    if (ss.cut) setCut(false);
    if (ss.xray) { S.xray = false; setPressed('#tX', false); }
    if (ss.brake && M) M.setBrake(false);
    if (ss.irr && M) M.irregular = false;
    if (ss.curve && M) M.curve = false;
    S.studySet = null; updateHudX();
    applyLook(); if (!silent) { renderTab(); focusPart(id); }
  }
  function buildStudy(sd) {
    const L = $('#sLayer'); L.hidden = false;
    $$('.cchip', L).forEach(e => e.remove());
    const svg = $('#sSvg'); svg.querySelectorAll('g.dyn').forEach(g => g.remove());
    const g = svgEl('g', { class: 'dyn' }); svg.appendChild(g);
    sEls = { comps: [], dims: [] };
    (sd.dims || []).forEach(d => {
      const grp = svgEl('g', { class: 'dim' });
      const e1 = svgEl('line', { class: 'dimx' }), e2 = svgEl('line', { class: 'dimx' });
      const ln = svgEl('line', { class: 'diml', 'marker-start': 'url(#arw)', 'marker-end': 'url(#arw)' });
      const tx = svgEl('text', { 'text-anchor': 'middle' }); tx.textContent = d[2];
      grp.append(e1, e2, ln, tx); g.appendChild(grp);
      sEls.dims.push({ a: new T.Vector3(...d[0]), b: new T.Vector3(...d[1]), off: d[3] ? new T.Vector3(...d[3]) : null, e1, e2, ln, tx });
    });
    (sd.comps || []).forEach((cp, k) => {
      const ch = document.createElement('button'); ch.type = 'button'; ch.className = 'cchip'; ch.innerHTML = `<b>${LET[k]}</b><span>${cp[0]}</span>`;
      ch.addEventListener('pointerenter', () => hotComp(k, true)); ch.addEventListener('pointerleave', () => hotComp(k, false));
      ch.addEventListener('click', () => { if (S.tab !== 'piezas') { S.tab = 'piezas'; renderTab(); } const row = $(`.comps li[data-comp="${k}"]`); if (row) { row.scrollIntoView({ block: 'nearest', behavior: reduce ? 'auto' : 'smooth' }); row.classList.add('flash'); setTimeout(() => row.classList.remove('flash'), 900); } });
      L.appendChild(ch);
      const ln = svgEl('polyline', { class: 'sline', fill: 'none' }), dot = svgEl('circle', { r: 3.2, class: 'sdot' });
      g.append(ln, dot);
      const obj = typeof cp[3] === 'string' ? S.M.root.getObjectByName(cp[3]) : null;
      sEls.comps.push({ k, p: new T.Vector3(...cp[2]), obj, off: new T.Vector3(...(cp[4] || [0, 0, 0])), ch, ln, dot, w: 0 });
    });
  }
  function hotComp(k, on) {
    const c = sEls.comps[k]; if (c) { c.ch.classList.toggle('hot', on); c.ln.classList.toggle('hot', on); c.dot.classList.toggle('hot', on); }
    const row = $(`.comps li[data-comp="${k}"]`); row && row.classList.toggle('hot', on);
  }
  const _w = new T.Vector3();
  function proj(v, W, H, obj) { _w.copy(v); (obj || S.M.root).localToWorld(_w); _w.project(stage.camera); return { x: (_w.x * 0.5 + 0.5) * W, y: (-_w.y * 0.5 + 0.5) * H, ok: _w.z < 1 && _w.z > -1 }; }
  function placeStudy() {
    if (!S.M || !stage) return;
    const r = $('#vp').getBoundingClientRect(), W = r.width, H = r.height;
    const cc = proj(sCenter, W, H);
    // cotas
    for (const d of sEls.dims) {
      let A = proj(d.a, W, H), B = proj(d.b, W, H), A2 = A, B2 = B;
      if (d.off) { A2 = proj(_w.copy(d.a).add(d.off).clone(), W, H); B2 = proj(_w.copy(d.b).add(d.off).clone(), W, H); }
      const ok = A.ok && B.ok && A2.ok && B2.ok, vis = ok ? 'visible' : 'hidden';
      d.ln.style.visibility = d.tx.style.visibility = vis;
      set4(d.ln, A2, B2);
      if (d.off) { set4(d.e1, A, A2); set4(d.e2, B, B2); d.e1.style.visibility = d.e2.style.visibility = vis; } else d.e1.style.visibility = d.e2.style.visibility = 'hidden';
      const mx = (A2.x + B2.x) / 2, my = (A2.y + B2.y) / 2; let ang = Math.atan2(B2.y - A2.y, B2.x - A2.x) * 180 / Math.PI;
      if (ang > 90) ang -= 180; if (ang < -90) ang += 180;
      const len = Math.hypot(B2.x - A2.x, B2.y - A2.y);
      d.tx.setAttribute('x', mx); d.tx.setAttribute('y', my - 6); d.tx.setAttribute('transform', `rotate(${ang.toFixed(1)} ${mx.toFixed(1)} ${my.toFixed(1)})`);
      if (len < 26) d.tx.style.visibility = 'hidden';
    }
    // componentes: dos columnas de etiquetas con líneas de referencia
    const pts = sEls.comps.map(c => ({ c, ...(c.obj ? proj(c.off, W, H, c.obj) : proj(c.p, W, H)) }));
    if (!pts.length) return;
    const cmp = W < 640, L0 = $('#sLayer');
    if (L0.classList.contains('compact') !== cmp) { L0.classList.toggle('compact', cmp); sEls.comps.forEach(c => (c.w = 0)); }
    for (const q of pts) if (!q.c.w) q.c.w = q.c.ch.offsetWidth || 120;
    const L = pts.filter(q => q.x < cc.x).sort((a, b) => a.y - b.y), R = pts.filter(q => q.x >= cc.x).sort((a, b) => a.y - b.y);
    const xs = pts.map(q => q.x), minX = Math.min(...xs), maxX = Math.max(...xs);
    // zonas ocupadas por tarjetas: el p–V (arriba a la derecha) y el HUD (abajo a la izquierda)
    const lim = { xR: W - 10, botL: H - 14 };
    if (S.pv) { const pr = $('#pv').getBoundingClientRect(); if (pr.width) lim.xR = Math.max(W * 0.45, pr.left - r.left - 12); }
    const hr = $('#hud').getBoundingClientRect(); if (hr.height && !$('#hud').hidden) lim.botL = Math.max(H * 0.45, hr.top - r.top - 10);
    col(L, minX - 44, 'L', W, H, lim); col(R, maxX + 44, 'R', W, H, lim);
  }
  function set4(el, A, B) { el.setAttribute('x1', A.x.toFixed(1)); el.setAttribute('y1', A.y.toFixed(1)); el.setAttribute('x2', B.x.toFixed(1)); el.setAttribute('y2', B.y.toFixed(1)); }
  function col(arr, cx, side, W, H, lim) {
    if (!arr.length) return;
    const gap = 27, top = 64, bot = side === 'L' ? lim.botL : H - 14;
    let y0 = -1e9; for (const q of arr) { q.cy = Math.max(q.y, top, y0 + gap); y0 = q.cy; }
    const over = arr[arr.length - 1].cy - bot; if (over > 0) { for (let i = arr.length - 1, lim = bot; i >= 0; i--, lim -= gap) arr[i].cy = Math.min(arr[i].cy, lim); }
    const wmax = Math.max(...arr.map(q => q.c.w));
    if (side === 'L') cx = Math.max(10 + wmax, cx); else cx = Math.min(lim.xR - wmax, cx);
    for (const q of arr) {
      const vis = q.ok ? 'visible' : 'hidden';
      const x0 = side === 'L' ? cx - q.c.w : cx;
      q.c.ch.style.transform = `translate(${x0.toFixed(1)}px, ${(q.cy - 11).toFixed(1)}px)`; q.c.ch.style.visibility = vis;
      const ex = side === 'L' ? cx + 2 : cx - 2, kx = side === 'L' ? cx + 14 : cx - 14;
      q.c.ln.setAttribute('points', `${q.x.toFixed(1)},${q.y.toFixed(1)} ${kx.toFixed(1)},${q.cy.toFixed(1)} ${ex.toFixed(1)},${q.cy.toFixed(1)}`);
      q.c.dot.setAttribute('cx', q.x.toFixed(1)); q.c.dot.setAttribute('cy', q.y.toFixed(1));
      q.c.ln.style.visibility = q.c.dot.style.visibility = vis;
    }
  }

  window.__app = { S, TR, goTrain, selectPart, setCut, setCutMode, togglePlay, toggleFlow, openCompare, get stage() { return stage; }, renderTab, render: () => { needs = true; },
    startTour, tourGo, exitTour, enterStudy, exitStudy, showPV, setSpeed, setTs, setBrake: on => { if (S.M && S.M.brakeType) { S.M.setBrake(on); updateHudX(); } } };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
