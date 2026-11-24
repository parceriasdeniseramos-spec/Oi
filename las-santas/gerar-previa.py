import base64, re
d = '/home/user/Oi/las-santas/'
s = open(d + 'index.html', encoding='utf-8').read()
s = re.sub(r'<link rel="preload"[^>]*>\n', '', s)
b = lambda p, m: 'data:' + m + ';base64,' + base64.b64encode(open(d + p, 'rb').read()).decode()
for p in sorted(set(re.findall(r'url\((fonts/[^)]+)\)', s))):
    s = s.replace('url(' + p + ')', 'url(' + b(p, 'font/woff2') + ')')
for p in sorted(set(re.findall(r"(img/[\w.-]+\.webp)", s))):
    s = s.replace("'" + p + "'", "'" + b(p, 'image/webp') + "'").replace('"' + p + '"', '"' + b(p, 'image/webp') + '"')
import re as _r; print([s[m.start()-30:m.start()+30] for m in _r.finditer('(fonts|img)/',s)][:5])

# marca d'água da H2D (só na prévia)
import urllib.parse as _u
_svg = ('<svg xmlns="http://www.w3.org/2000/svg" width="380" height="240"><g transform="rotate(-24 190 120)" font-family="Jost, Arial, sans-serif" text-anchor="middle" fill="#8b7a69">'
        '<text x="190" y="112" font-size="26" font-weight="500" letter-spacing="7" fill-opacity=".2">H2D STUDIO</text>'
        '<text x="190" y="140" font-size="13" letter-spacing="6" fill-opacity=".2">PRÉVIA</text></g></svg>')
_wm = ('<style>.h2dwm{position:fixed;inset:0;z-index:150;pointer-events:none;background:url("data:image/svg+xml,' + _u.quote(_svg) + '") 0 0/380px 240px repeat}'
       '.h2dseal{position:fixed;left:12px;bottom:calc(12px + env(safe-area-inset-bottom,0px));z-index:151;pointer-events:none;padding:7px 12px;background:rgba(31,26,23,.78);color:#f1e7da;font:500 11px/1.2 Jost,Arial,sans-serif;letter-spacing:.12em;text-transform:uppercase}'
       '.h2dseal b{color:#d2b48c;font-weight:500}</style>'
       '<div class="h2dwm" aria-hidden="true"></div><div class="h2dseal" aria-hidden="true">Prévia · <b>H2D Studio</b></div>\n')
assert s.count('</body>') if False else True
s = s.replace('</body>', _wm + '</body>', 1)
open(d + 'previa-las-santas.html', 'w', encoding='utf-8').write(s)
print('prévia ok', len(s) // 1024, 'KB')
