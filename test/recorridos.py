import asyncio, json, sys
from playwright.async_api import async_playwright
import pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'test' / 'out'; OUT.mkdir(exist_ok=True)
JS = r"""
async () => {
  const A = window.__app, sleep = ms => new Promise(r => setTimeout(r, ms));
  const waitIdle = async () => { for (let i = 0; i < 150 && (A.S.busy || A.S.pending != null); i++) await sleep(200); await sleep(300); };
  const out = [];
  for (let i = 0; i < 8; i++) {
    A.goTrain(i); await sleep(100); await waitIdle();
    const t = A.S.t, M = A.S.M, r = { id: t.id, issues: [] };
    const tour = window.TOURS[t.id] || [];
    for (const st of tour) { if (st.part && !M.parts[st.part]) r.issues.push('tour part ' + st.part); for (const h of st.hl || []) if (!M.parts[h]) r.issues.push('tour hl ' + h); if (Array.isArray(st.flows)) for (const f of st.flows) if (!M.flows[f]) r.issues.push('tour flow ' + f + ' of ' + M.flows.length); }
    try { A.startTour(); for (let k = 0; k < tour.length; k++) { A.tourGo(k); await sleep(60); A.render(); } A.exitTour(); } catch (e) { r.issues.push('tour err ' + e.message); }
    const sd = window.STUDY[t.id] || {};
    for (const id of Object.keys(sd)) {
      if (!M.parts[id]) { r.issues.push('study part ' + id); continue; }
      const p = M.parts[id], b = p.box.clone().expandByScalar(0.35);
      for (const c of sd[id].comps || []) { const v = new THREE.Vector3(...c[2]); if (!b.containsPoint(v)) r.issues.push(`comp fuera ${id}:${c[0]} d=${b.distanceToPoint(v).toFixed(2)}`); }
      try { A.selectPart(id, false); A.enterStudy(id); await sleep(80); A.render(); await sleep(30);
        const chips = document.querySelectorAll('#sLayer .cchip').length; if (chips !== (sd[id].comps || []).length) r.issues.push('chips ' + id);
        A.exitStudy(); } catch (e) { r.issues.push('study err ' + id + ' ' + e.message); }
    }
    for (const id of t.partOrder) if (!sd[id]) r.issues.push('sin estudio ' + id);
    out.push(r);
  }
  return out;
}
"""
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"])
        pg = await b.new_page(viewport={'width': 1280, 'height': 800})
        errs = []
        pg.on('console', lambda m: errs.append(f'{m.type}: {m.text}') if m.type in ('error','warning') else None)
        pg.on('pageerror', lambda e: errs.append(f'PAGEERROR: {e}'))
        await pg.goto((ROOT / 'dist' / 'test.html').as_uri()); await pg.wait_for_timeout(3000)
        r = await pg.evaluate(JS)
        for x in r: print(json.dumps(x, ensure_ascii=False))
        print('errors', [e for e in errs if 'net::' not in e and 'GPU stall' not in e][:20])
        await b.close()
asyncio.run(main())
