import asyncio, json
from playwright.async_api import async_playwright
import pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'test' / 'out'; OUT.mkdir(exist_ok=True)
JS = r"""
async () => {
  const A = window.__app, sleep = ms => new Promise(r => setTimeout(r, ms));
  const st = () => A.stage.renderer.info;
  const out = { trains: [], errors: [] };
  const waitIdle = async () => { for (let i = 0; i < 150 && (A.S.busy || A.S.pending != null); i++) await sleep(200); await sleep(600); };
  const mem0 = { ...st().memory };
  for (let i = 0; i < A.TR.length; i++) {
    A.goTrain(i); await sleep(100); await waitIdle();
    const t = A.S.t, M = A.S.M;
    const r = { id: t.id, parts: t.partOrder.length, missingParts: t.partOrder.filter(p => !M.parts[p]), extraParts: M.order.filter(p => !t.parts[p]) };
    // tabs
    for (const tab of ['piezas','ficha','fisica','contexto','fuentes']) { A.S.tab = tab; A.renderTab(); await sleep(30); if (!document.getElementById('pBody').innerHTML.trim()) r['emptyTab_'+tab] = true; }
    if (!document.getElementById('fvChart')) {} 
    A.S.tab = 'fisica'; A.renderTab(); r.fvPath = !!document.querySelector('#fvChart path');
    // cada pieza
    for (const p of t.partOrder) { A.selectPart(p, true); await sleep(40); const h = document.getElementById('pBody').innerHTML; if (!h.includes(t.parts[p].name)) r['badDetail_'+p] = true; }
    A.selectPart(null, false);
    // herramientas
    A.setCut(true); A.setCutMode('T'); await sleep(200); A.setCutMode('L'); await sleep(200); A.setCut(false);
    document.getElementById('tExp').click(); await sleep(400); document.getElementById('tExp').click();
    document.getElementById('tX').click(); await sleep(50); document.getElementById('tX').click();
    A.toggleFlow(true); await sleep(100); A.toggleFlow(false);
    const raf = () => new Promise(r => requestAnimationFrame(() => r()));
    for (let k = 0; k < 3; k++) await raf();
    A.togglePlay(true); const s0 = M.s; let frames = 0; const t0 = performance.now();
    while (performance.now() - t0 < 2500 && frames < 40) { await raf(); frames++; }
    r.animAdvances = M.s !== s0; r.frames = frames; r.msPerFrame = Math.round((performance.now() - t0) / frames); A.togglePlay(false);
    // cinemática: comprobar que las piezas móviles cambian de pose
    const snap = () => { let acc = 0; M.root.traverse(o => { acc += o.position.x * 1.3 + o.position.y * 2.1 + o.rotation.z * 0.7; }); return acc; };
    const a0 = snap(); M.update(0.37, 20); const a1 = snap(); r.kinematicsMove = Math.abs(a1 - a0) > 1e-6; M.update(0, 0);
    // NaN en la escena
    let nan = 0; M.root.traverse(o => { if ([o.position.x, o.position.y, o.position.z, o.rotation.z].some(v => !isFinite(v))) nan++; }); r.nanNodes = nan;
    await sleep(200);
    const info = st();
    r.calls = info.render.calls; r.tris = info.render.triangles; r.geos = info.memory.geometries; r.tex = info.memory.textures;
    r.balloons = document.querySelectorAll('.balloon').length;
    out.trains.push(r);
  }
  // volver al primero y medir fugas
  A.goTrain(0); await sleep(100); await waitIdle();
  out.memFirstLoad = mem0; out.memAfterCycle = { ...st().memory };
  // render bajo demanda: contar renders en reposo
  let n = 0; const orig = A.stage.renderer.render.bind(A.stage.renderer);
  A.stage.renderer.render = (...a) => { n++; return orig(...a); };
  await sleep(1500); out.idleRendersIn1500ms = n;
  A.stage.renderer.render = orig;
  A.openCompare(); out.compareRows = document.querySelectorAll('#cmpTable tbody tr').length; document.getElementById('cmpClose').click();
  out.links = [...document.querySelectorAll('a[href]')].length;
  return out;
}
"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"])
        pg = await b.new_page(viewport={'width': 1440, 'height': 900})
        errs = []
        pg.on('console', lambda m: errs.append(f'{m.type}: {m.text}') if m.type in ('error','warning') else None)
        pg.on('pageerror', lambda e: errs.append(f'PAGEERROR: {e}'))
        await pg.goto((ROOT / 'dist' / 'test.html').as_uri())
        await pg.wait_for_timeout(5000)
        res = await pg.evaluate(JS)
        print(json.dumps(res, indent=1, ensure_ascii=False))
        print('console:', [e for e in errs if 'fonts' not in e and 'net::' not in e][:20])
        await b.close()
asyncio.run(main())
