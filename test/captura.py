import asyncio, sys, json
from playwright.async_api import async_playwright
import pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'test' / 'out'; OUT.mkdir(exist_ok=True)
# uso: captura.py salida.png "js" [w h] [espera_ms]
async def main():
    out = sys.argv[1]; extra = sys.argv[2] if len(sys.argv) > 2 else ''
    w = int(sys.argv[3]) if len(sys.argv) > 3 else 1440; h = int(sys.argv[4]) if len(sys.argv) > 4 else 900
    wait = int(sys.argv[5]) if len(sys.argv) > 5 else 3500
    async with async_playwright() as p:
        b = await p.chromium.launch(args=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"])
        pg = await b.new_page(viewport={'width': w, 'height': h}, device_scale_factor=1)
        logs = []
        pg.on('console', lambda m: logs.append(f'{m.type}: {m.text}'))
        pg.on('pageerror', lambda e: logs.append(f'PAGEERROR: {e}'))
        await pg.goto((ROOT / 'dist' / 'test.html').as_uri())
        await pg.wait_for_timeout(wait)
        if extra:
            for step in extra.split('||'):
                step = step.strip()
                if step.startswith('wait:'):
                    await pg.wait_for_timeout(int(step[5:])); continue
                r = await pg.evaluate(step)
                if r is not None: logs.append(f'eval: {r}')
            await pg.wait_for_timeout(1800)
        await pg.screenshot(path=out, timeout=180000)
        for l in logs:
            if any(k in l for k in ('GPU stall', 'Automatic fallback', 'fonts.g', 'ERR_NAME', 'net::', 'Failed to load resource')): continue
            print(l)
        await b.close()
asyncio.run(main())
