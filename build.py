"""Compila el atlas en archivos HTML autocontenidos.

  python3 build.py

Salidas:
  docs/index.html               página completa para GitHub Pages (three.js desde CDN)
  dist/de-rocket-al-maglev.html fragmento para publicar como artifact de Claude (sin <html>/<head>/<body>)
  dist/test.html                página para pruebas locales con three.js en vendor/ (ver tools/fetch_vendor.sh)
"""
import pathlib

root = pathlib.Path(__file__).parent
shell = (root / 'src/shell.html').read_text(encoding='utf-8')
ORDER = ['builders.js', 'models_base.js', 'stage.js',
         'm_rocket.js', 'm_general.js', 'm_croc.js', 'm_mallard.js', 'm_f7.js', 'm_shinkansen.js', 'm_tgv.js', 'm_maglev.js',
         'data1.js', 'data2.js', 'data3.js', 'data4.js', 'app.js']
ORDER = [f for f in ORDER if (root / 'js' / f).exists()]
js = '\n'.join((root / 'js' / f).read_text(encoding='utf-8') for f in ORDER)

THREE = 'https://cdn.jsdelivr.net/npm/three@0.147.0/'
CDN = [THREE + 'build/three.min.js', THREE + 'examples/js/controls/OrbitControls.js', THREE + 'examples/js/environments/RoomEnvironment.js']
LOCAL = ['../vendor/three.min.js', '../vendor/OrbitControls.js', '../vendor/RoomEnvironment.js']

SITE = 'https://jemilianomr.github.io/de-rocket-al-maglev/'
DESC = ('Atlas 3D interactivo de la evolución de la tracción ferroviaria, de Rocket (1829) al maglev de Shanghái (2004): '
        'piezas en corte, recorridos «Cómo funciona», modo estudio con cotas y diagrama p–V.')

def scripts(libs):
    return '\n'.join(f'<script src="{u}"></script>' for u in libs) + '\n<script>\n' + js + '\n</script>\n'

def fragment(libs):
    """Formato de artifact: el host añade el esqueleto del documento."""
    return shell + '\n' + scripts(libs)

def document(libs, social=False):
    """Documento HTML completo: cabecera (título, metadatos, estilos) y cuerpo (interfaz y scripts)."""
    cut = shell.index('<div class="app"')
    head, body = shell[:cut], shell[cut:]
    meta = ('<meta charset="utf-8">\n<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n'
            f'<meta name="description" content="{DESC}">\n<meta name="theme-color" content="#0d1720">\n')
    if social:
        meta += (f'<meta property="og:type" content="website">\n<meta property="og:title" content="De Rocket al Maglev">\n'
                 f'<meta property="og:description" content="{DESC}">\n<meta property="og:url" content="{SITE}">\n'
                 f'<meta property="og:image" content="{SITE}img/og.jpg">\n<meta name="twitter:card" content="summary_large_image">\n')
    extra = '<style>[hidden]{display:none!important}</style>\n'
    return f'<!doctype html>\n<html lang="es">\n<head>\n{meta}{head}{extra}</head>\n<body>\n{body}\n{scripts(libs)}</body>\n</html>\n'

(root / 'dist').mkdir(exist_ok=True)
(root / 'docs').mkdir(exist_ok=True)
pub = fragment(CDN)
(root / 'dist/de-rocket-al-maglev.html').write_text(pub, encoding='utf-8')
(root / 'dist/test.html').write_text(document(LOCAL), encoding='utf-8')
site = document(CDN, social=True)
(root / 'docs/index.html').write_text(site, encoding='utf-8')
(root / 'docs/.nojekyll').write_text('', encoding='utf-8')
print(f'{len(ORDER)} módulos · docs/index.html {len(site.encode()) / 1024:.0f} KB · artifact {len(pub.encode()) / 1024:.0f} KB')
