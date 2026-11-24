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

# aviso de privacidade e validade da prévia
CLIENTE = 'Las Santas'
VALIDADE = '2026-12-09'          # depois desta data a prévia mostra "expirada"
VALIDADE_TXT = '9 de dezembro de 2026'
_av = ('<style>.pv{position:fixed;inset:0;z-index:300;display:grid;place-items:center;padding:20px;background:rgba(31,26,23,.55);backdrop-filter:blur(4px);-webkit-backdrop-filter:blur(4px)}'
  '.pv[hidden],.pvc:checked+.pv{display:none}.pv label.bt2{cursor:pointer}.pv .b{width:min(480px,100%);max-height:calc(100svh - 40px);overflow:auto;background:#fbf8f4;color:#1f1a17;padding:34px 28px;text-align:center;font-family:Jost,Arial,sans-serif;box-shadow:0 30px 60px -20px rgba(0,0,0,.5)}'
  '.pv .k{font-size:11px;letter-spacing:.28em;text-transform:uppercase;color:#7d5c38}.pv h2{font-family:Cormorant,Georgia,serif;font-weight:400;font-size:30px;line-height:1.1;margin:10px 0 16px}'
  '.pv p{font-size:15px;line-height:1.6;color:#554b43;margin-bottom:12px}.pv ul{list-style:none;text-align:left;margin:16px 0 20px;display:grid;gap:9px}'
  '.pv li{position:relative;padding-left:22px;font-size:14.5px;line-height:1.5;color:#3d342d}.pv li::before{content:"✓";position:absolute;left:0;color:#a8825a;font-weight:500}'
  '.pv .val{display:inline-block;margin:4px 0 20px;padding:7px 14px;border:1px solid rgba(168,130,90,.5);font-size:13px;color:#7d5c38}'
  '.pv button,.pv a.bt{display:inline-flex;justify-content:center;width:100%;min-height:50px;align-items:center;background:#1f1a17;color:#fbf8f4;border:0;font:500 13px Jost,Arial,sans-serif;letter-spacing:.16em;text-transform:uppercase;cursor:pointer;text-decoration:none}'
  '.pv .sig{margin-top:16px;font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#766a5f}.pv .sig b{color:#a8825a;font-weight:500}</style>'
  '<input type="checkbox" class="pvc" id="pvC" hidden aria-hidden="true"><div class="pv" id="pvAviso" role="dialog" aria-modal="true" aria-labelledby="pvT"><div class="b"><span class="k">Prévia exclusiva</span>'
  '<h2 id="pvT">Feita especialmente para a ' + CLIENTE + '</h2>'
  '<p>Este site foi criado pela H2D Studio apenas como demonstração para a proprietária da ' + CLIENTE + '.</p>'
  '<ul><li>Não está publicado na internet.</li><li>Não será usado para nenhum outro fim sem a sua autorização.</li>'
  '<li>As fotos, os textos e a marca pertencem à ' + CLIENTE + '.</li><li>Se você não seguir com o projeto, todos os arquivos serão descartados.</li></ul>'
  '<span class="val">Esta prévia expira em ' + VALIDADE_TXT + '</span>'
  '<label for="pvC" class="bt2" id="pvOk" role="button" tabindex="0" style="display:inline-flex;justify-content:center;align-items:center;width:100%;min-height:50px;background:#1f1a17;color:#fbf8f4;font:500 13px Jost,Arial,sans-serif;letter-spacing:.16em;text-transform:uppercase">Entendi, ver a prévia</label><p class="sig">Prévia · <b>H2D Studio</b></p></div></div>'
  '<div class="pv" id="pvExp" role="dialog" aria-modal="true" aria-labelledby="pvE" hidden><div class="b"><span class="k">Prévia encerrada</span>'
  '<h2 id="pvE">Esta prévia expirou</h2><p>O prazo de demonstração terminou e esta prévia não está mais disponível.</p>'
  '<p>Para ver o projeto novamente, fale com a H2D Studio.</p><a class="bt" href="https://h2d-studio.netlify.app/" target="_blank" rel="noopener">Falar com a H2D Studio</a></div></div>'
  '<script>(function(){var exp=new Date("' + VALIDADE + 'T23:59:59")<new Date(),a=document.getElementById("pvAviso"),e=document.getElementById("pvExp");'
  'if(exp){a.hidden=true;e.hidden=false;document.documentElement.style.overflow="hidden";return;}'
  'document.documentElement.style.overflow="hidden";var b=document.getElementById("pvOk");setTimeout(function(){b.focus()},80);'
  'function ok(){a.hidden=true;document.documentElement.style.overflow="";}b.addEventListener("click",ok);b.addEventListener("keydown",function(e){if(e.key==="Enter"||e.key===" "){e.preventDefault();ok();}});})();</script>\n')
s = s.replace('</body>', _av + '</body>', 1)
open(d + 'previa-las-santas.html', 'w', encoding='utf-8').write(s)
print('prévia ok', len(s) // 1024, 'KB')
