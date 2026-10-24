import asyncio, sys, json
from playwright.async_api import async_playwright
import pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'test' / 'out'; OUT.mkdir(exist_ok=True)
# uso: visor.py modelo salida.png [js extra] [w h]
async def main():
    m, out = sys.argv[1], sys.argv[2]
    extra = sys.argv[3] if len(sys.argv) > 3 else ''
    w = int(sys.argv[4]) if len(sys.argv) > 4 else 1200; h = int(sys.argv[5]) if len(sys.argv) > 5 else 750
    async with async_playwright() as p:
        b = await p.chromium.launch(args=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"])
        pg = await b.new_page(viewport={'width': w, 'height': h})
        logs = []
        pg.on('console', lambda msg: logs.append(f'{msg.type}: {msg.text}'))
        pg.on('pageerror', lambda e: logs.append(f'PAGEERROR: {e}'))
        await pg.goto((ROOT / 'test' / 'viewer.html').as_uri() + f'?m={m}')
        try:
            await pg.wait_for_function('window.ready === true', timeout=20000)
        except Exception as e:
            logs.append('TIMEOUT ready')
        if extra:
            await pg.evaluate(extra)
        ms = await pg.evaluate('window.draw()')
        logs.append(f'render ms: {ms:.0f}')
        await pg.screenshot(path=out)
        for l in logs:
            if 'GPU stall' in l or 'Automatic fallback' in l: continue
            print(l)
        await b.close()
asyncio.run(main())
