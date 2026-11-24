// Gera img/compartilhar.jpg (1200x630), a imagem que aparece ao mandar o link no WhatsApp e nas redes.
// Uso: node imagem-compartilhar.js dados/exemplo-marina.json
const {chromium} = require('playwright');
const fs = require('fs'), path = require('path');
const D = __dirname, c = JSON.parse(fs.readFileSync(process.argv[2] || path.join(D, 'dados/exemplo-marina.json'), 'utf8'));
const esc = s => String(s || '').replace(/[&<>"]/g, m => ({'&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;'}[m]));
const partes = c.nome.trim().split(' '), ult = partes.pop();
const html = `<!doctype html><html><head><meta charset="utf-8"><base href="file://${D}/"><style>
@font-face{font-family:Corm;font-weight:500;src:url(fonts/cormorant-garamond-latin-500-normal.woff2)}@font-face{font-family:Corm;font-style:italic;font-weight:500;src:url(fonts/cormorant-garamond-latin-500-italic.woff2)}@font-face{font-family:Jost;font-weight:500;src:url(fonts/jost-latin-500-normal.woff2)}@font-face{font-family:Jost;src:url(fonts/jost-latin-400-normal.woff2)}
*{margin:0;box-sizing:border-box}body{width:1200px;height:630px;display:grid;grid-template-columns:1fr 470px;background:#f8f5f0;font-family:Jost;color:#16140f}
.t{padding:0 60px 0 80px;display:flex;flex-direction:column;justify-content:center}
.k{font-size:20px;letter-spacing:.22em;text-transform:uppercase;color:#84603a;font-weight:500}
h1{font-family:Corm;font-weight:500;font-size:${c.nome.length > 18 ? 92 : 112}px;line-height:1;margin:26px 0 20px}h1 em{color:#84603a}
p{font-family:Corm;font-style:italic;font-size:36px;line-height:1.2;color:#2a2620}.l{margin-top:22px;font-size:22px;color:#5b544b;font-family:Jost;font-style:normal}
img{width:100%;height:100%;object-fit:cover;object-position:${c.foto_posicao || '50% 22%'}}
</style></head><body><div class="t"><span class="k">${esc(c.profissao)} · ${esc(c.creci)}</span><h1>${esc(partes.join(' '))} <em>${esc(ult)}</em></h1><p>${esc(c.especialidade)}</p><span class="l">${esc(c.cidade)}${c.uf ? '/' + esc(c.uf) : ''}</span></div><img src="${esc(c.foto)}"></body></html>`;
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({viewport: {width: 1200, height: 630}});
  await p.setContent(html, {waitUntil: 'load'}); await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(300);
  await p.screenshot({path: path.join(D, 'img/compartilhar.jpg'), type: 'jpeg', quality: 86}); await b.close();
  console.log('img/compartilhar.jpg pronta');
})();
