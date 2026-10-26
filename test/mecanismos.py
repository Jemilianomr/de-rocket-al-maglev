import asyncio, json
from playwright.async_api import async_playwright
import pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'test' / 'out'; OUT.mkdir(exist_ok=True)
JS = r"""
async () => {
  const A = window.__app, sleep = ms => new Promise(r => setTimeout(r, ms));
  const waitIdle = async () => { for (let i = 0; i < 150 && (A.S.busy || A.S.pending != null); i++) await sleep(200); await sleep(300); };
  const out = [];
  for (let i = 0; i < A.TR.length; i++) {
    A.goTrain(i); await sleep(100); await waitIdle();
    const M = A.S.M, r = { id: A.S.t.id, err: null };
    try {
      M.powered = true;
      for (let k = 0; k < 120; k++) M.update(0.02, 25);
      r.parts = M.particles.map(p => p.points.geometry.attributes.position ? p.points.geometry.attributes.position.count : -1);
      r.brakeType = M.brakeType || null;
      if (M.setBrake) { M.setBrake(true); for (let k = 0; k < 30; k++) M.update(0.02, 25); r.bflowsVis = M.brakeFlows.filter(f => f.visible).length; M.setBrake(false); }
      if (M.steam) { M.setCutoff(0.5); for (let k = 0; k < 30; k++) M.update(0.02, 15); const ind = MB.indicator(M.steam, 60); r.mep = +ind.mep.toFixed(3); r.pts = ind.pts.length; }
      if (M.modes && M.modes.irregular) { M.irregular = true; for (let k = 0; k < 200; k++) M.update(0.02, 10); M.irregular = false; }
      if (M.modes && M.modes.curve) { M.curve = true; for (let k = 0; k < 120; k++) M.update(0.02, 5); let yaw = 0; M.root.traverse(o => { yaw = Math.max(yaw, Math.abs(o.rotation.y)); }); r.curveYaw = +yaw.toFixed(3); M.curve = false; for (let k = 0; k < 30; k++) M.update(0.02, 5); }
      r.rpm = M.rpm; r.notch = M.notch;
      let nan = 0; M.root.traverse(o => { if ([o.position.x, o.position.y, o.position.z, o.rotation.x, o.rotation.y, o.rotation.z].some(v => !isFinite(v))) nan++; }); r.nan = nan;
      M.powered = false; M.update(0, 0);
    } catch (e) { r.err = String(e && e.stack || e); }
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
        pg.on('console', lambda m: errs.append(f'{m.type}: {m.text}') if m.type in ('error',) else None)
        pg.on('pageerror', lambda e: errs.append(f'PAGEERROR: {e}'))
        await pg.goto((ROOT / 'dist' / 'test.html').as_uri()); await pg.wait_for_timeout(3000)
        r = await pg.evaluate(JS)
        for x in r: print(json.dumps(x))
        print('errors', errs)
        await b.close()
asyncio.run(main())
