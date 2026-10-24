import asyncio, sys
from playwright.async_api import async_playwright
import pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / 'test' / 'out'; OUT.mkdir(exist_ok=True)
async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--ignore-gpu-blocklist"])
        pg = await b.new_page()
        await pg.set_content("<canvas id=c></canvas><script>const gl=document.getElementById('c').getContext('webgl2');document.title=gl?('ok '+gl.getParameter(gl.VERSION)):'nogl'</script>")
        print(await pg.title())
        await b.close()
asyncio.run(main())
