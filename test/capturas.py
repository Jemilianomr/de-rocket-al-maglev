import asyncio, sys, json
from playwright.async_api import async_playwright
import pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'test' / 'out'; OUT.mkdir(exist_ok=True)
# uso: capturas.py plan.json [w h]
async def main():
    plan = json.load(open(sys.argv[1]))
    w = int(sys.argv[2]) if len(sys.argv) > 2 else 1440; h = int(sys.argv[3]) if len(sys.argv) > 3 else 900
    async with async_playwright() as p:
        b = await p.chromium.launch(args=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"])
        pg = await b.new_page(viewport={'width': w, 'height': h}, device_scale_factor=1)
        logs = []
        pg.on('console', lambda m: logs.append(f'{m.type}: {m.text}') if m.type in ('error', 'warning') else None)
        pg.on('pageerror', lambda e: logs.append(f'PAGEERROR: {e}'))
        await pg.goto((ROOT / 'dist' / 'test.html').as_uri())
        await pg.wait_for_timeout(3500)
        for name, steps in plan:
            for st in steps:
                if isinstance(st, int): await pg.wait_for_timeout(st)
                else: await pg.evaluate(st)
            await pg.screenshot(path=str(OUT / f'{name}.png'), timeout=180000)   # SwiftShader compila los shaders despacio
            print('shot', name, flush=True)
        for l in logs:
            if any(k in l for k in ('GPU stall', 'net::', 'Failed to load resource')): continue
            print(l)
        await b.close()
asyncio.run(main())
