#!/usr/bin/env python3
"""Monta o site pessoal de corretor a partir de uma ficha JSON.

Uso:
  python3 montar.py dados/exemplo-marina.json            -> gera index.html nesta pasta (modelo)
  python3 montar.py dados/nani.json ../clientes/nani     -> gera index.html + fonts + img na pasta do cliente

Todo o conteúdo sai pronto no HTML (funciona até dentro do WhatsApp, sem JavaScript).
"""
import html, json, os, re, shutil, sys, urllib.parse

AQUI = os.path.dirname(os.path.abspath(__file__))
H2D_WHATS = '5551993759314'

ICONES = {
    'chave': '<circle cx="8" cy="12" r="4"/><path d="M12 12h9M18 12v3M21 12v2"/>',
    'predio': '<path d="M4 21V8l8-5 8 5v13M9 21v-6h6v6M8 11h.01M16 11h.01"/>',
    'grafico': '<path d="M4 20h16M7 16v-5M12 16V7M17 16v-4"/>',
    'lupa': '<circle cx="10.5" cy="10.5" r="7"/><path d="m21 21-5.5-5.5M7.5 12 10.5 9.5l3 2.5v2h-6z"/>',
    'casa': '<path d="M3 11.5 12 4l9 7.5M5.5 9.5V20h13V9.5M10 20v-5h4v5"/>',
    'pessoa': '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    'olho': '<path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    'local': '<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',
    'escudo': '<path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6z"/><path d="m8.5 12 2.5 2.5 4.5-5"/>',
    'check': '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    'insta': '<rect x="3.5" y="3.5" width="17" height="17" rx="5"/><circle cx="12" cy="12" r="4"/><path d="M17.2 6.8h.01"/>',
    'mail': '<rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="m4 7 8 6 8-6"/>',
    'tel': '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a1 1 0 0 1-1 1A16 16 0 0 1 4 5a1 1 0 0 1 1-1z"/>',
    'relogio': '<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>',
    'seta': '<path d="M5 12h14M13 6l6 6-6 6"/>',
}
WA_PATH = ('M17.47 14.38c-.3-.15-1.76-.87-2.03-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.5h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.76-.72 2.01-1.42.25-.7.25-1.29.17-1.42-.07-.12-.27-.2-.57-.35zM12.05 21.5h-.01a9.4 9.4 0 01-4.8-1.31l-.34-.2-3.56.93.95-3.47-.22-.36a9.4 9.4 0 01-1.44-5.01c0-5.2 4.23-9.43 9.44-9.43 2.52 0 4.89.98 6.67 2.77a9.37 9.37 0 012.76 6.67c0 5.2-4.23 9.43-9.44 9.43zm8.03-17.46A11.27 11.27 0 0012.05.75C5.8.75.7 5.84.7 12.1c0 2 .52 3.95 1.52 5.67L.6 23.25l5.6-1.47a11.3 11.3 0 005.84 1.49h.01c6.25 0 11.35-5.09 11.35-11.35 0-3.03-1.18-5.88-3.32-8.02z')


def e(t):
    return html.escape(str(t or ''), quote=True)


def rich(t):
    """Texto com *trecho* em destaque (itálico bronze)."""
    return re.sub(r'\*(.+?)\*', r'<em>\1</em>', e(t))


def ic(nome, cls=''):
    c = f' class="{cls}"' if cls else ''
    return f'<svg{c} aria-hidden="true"><use href="#i-{nome}"/></svg>'


def montar(c):
    demo = bool(c.get('modo_demonstracao'))
    nome = c['nome'].strip()
    partes = nome.split(' ')
    nome_h1 = e(' '.join(partes[:-1])) + ' <em>' + e(partes[-1]) + '</em>' if len(partes) > 1 else e(nome)
    iniciais = ''.join(p[0] for p in partes if p[:1].isalpha())[:2].upper()
    primeiro = partes[0]
    local = f"{c['cidade']}/{c['uf']}" if c.get('uf') else c['cidade']

    def wa(msg):
        num = re.sub(r'\D', '', c.get('whatsapp', ''))
        return ('https://wa.me/' + num if num else 'https://wa.me/') + '?text=' + urllib.parse.quote(msg)

    def ext(href):
        return f'href="{e(href)}" target="_blank" rel="noopener"'

    msg0 = c['mensagem_padrao']
    tem_ind = [i for i in c.get('indicadores', []) if str(i.get('valor', '')).strip()]
    selo = c.get('selo') or {}
    titulo = f"{nome} · {c['profissao']} em {c['cidade']}" + (' · Modelo H2D Studio' if demo else '')
    desc = (f"{c['profissao']} em {local}. {c['especialidade']}. {c['frase']}")[:300]
    if demo:
        desc = 'Modelo de demonstração da H2D Studio: site pessoal para corretores de imóveis. Personagem fictícia.'
    url = (c.get('site_url') or '').rstrip('/')
    og_img = (url + '/img/compartilhar.jpg') if url else 'img/compartilhar.jpg'

    # ---------- partes ----------
    ind_html = ''
    if tem_ind:
        itens = ''.join(
            f'<div class="ind rv"><b data-n="{e(re.sub(r"[^0-9]", "", i["valor"]))}" data-p="{e(re.sub(r"[0-9]", "", i["valor"]))}">{e(i["valor"])}</b><span>{e(i["rotulo"])}</span></div>'
            for i in tem_ind)
        nota = f'<p class="ind-nota">{e(c["indicadores_nota"])}</p>' if c.get('indicadores_nota') else ''
        ind_html = f'<section class="inds" aria-label="Indicadores profissionais"><div class="wrap"><div class="ind-g" style="--n:{len(tem_ind)}">{itens}</div>{nota}</div></section>'

    selo_html = ''
    if str(selo.get('valor', '')).strip():
        selo_html = f'<div class="selo"><b>{e(selo["valor"])}</b><span>{e(selo["rotulo"])}</span></div>'

    pontos = ''.join(f'<li>{ic("check")}<span>{e(p)}</span></li>' for p in c.get('sobre_pontos', []))
    sobre_p = ''.join(f'<p class="rv">{e(p)}</p>' for p in c.get('sobre', []))

    esp = ''.join(
        f'<article class="es rv" tabindex="0"><span class="es-n">0{n}</span><i>{ic(x["icone"])}</i><h3>{e(x["titulo"])}</h3><p>{e(x["texto"])}</p></article>'
        for n, x in enumerate(c.get('especialidades', [])[:4], 1))

    dif = ''.join(
        f'<div class="df rv"><i>{ic(x["icone"])}</i><div><h3>{e(x["titulo"])}</h3><p>{e(x["texto"])}</p></div></div>'
        for x in c.get('diferenciais', [])[:4])

    ajuda = c.get('ajuda', [])[:4]
    aj_in = ''.join(f'<input class="sr" type="radio" name="aj" id="aj{n}">' for n in range(1, len(ajuda) + 1))
    aj_lb = ''.join(f'<label for="aj{n}">{ic(x["icone"])}<span>{e(x["rotulo"])}</span></label>' for n, x in enumerate(ajuda, 1))
    aj_rs = ''.join(
        f'<div class="r r{n}"><p class="bolha">{e(x["mensagem"])}</p><a class="btn btn-wa" {ext(wa(x["mensagem"]))}><svg aria-hidden="true"><use href="#wa"/></svg>Enviar pelo WhatsApp</a></div>'
        for n, x in enumerate(ajuda, 1))
    aj_css = ''.join(
        f'#aj{n}:checked~.ops label[for=aj{n}]{{background:var(--bronze);border-color:var(--bronze);color:#fff}}'
        f'#aj{n}:focus-visible~.ops label[for=aj{n}]{{outline:3px solid var(--bronze2);outline-offset:3px}}'
        f'#aj{n}:checked~.ops label[for=aj{n}] svg{{stroke:#fff}}#aj{n}:checked~.res .r{n}{{display:block}}'
        for n in range(1, len(ajuda) + 1))

    canais = []
    if c.get('instagram'):
        h = c['instagram'].lstrip('@')
        canais.append(('insta', 'Instagram', '@' + h, 'https://www.instagram.com/' + h + '/'))
    if c.get('telefone') or (demo and c.get('telefone_exibicao')):
        canais.append(('tel', 'Telefone', c.get('telefone_exibicao') or c['telefone'], 'tel:+' + re.sub(r'\D', '', c.get('telefone', ''))))
    if c.get('email'):
        canais.append(('mail', 'E-mail', c['email'], 'mailto:' + c['email']))
    can_html = ''
    for icn, rot, txt, href in canais:
        if demo:
            alvo = f'href="#contato" data-demo="{e(rot)}"'
        elif href.startswith('http'):
            alvo = ext(href)
        else:
            alvo = f'href="{e(href)}"'
        can_html += f'<a class="cn" {alvo}><i>{ic(icn)}</i><span><b>{e(rot)}</b>{e(txt)}</span></a>'
    hor = f'<p class="hor">{ic("relogio")}{e(c["horario"])}</p>' if c.get('horario') else ''

    jsonld = {
        '@context': 'https://schema.org', '@type': 'RealEstateAgent', 'name': nome,
        'description': c['especialidade'], 'image': og_img if url else None, 'url': url or None,
        'telephone': ('+' + re.sub(r'\D', '', c['whatsapp'])) if re.sub(r'\D', '', c.get('whatsapp', '')) else None,
        'email': c.get('email') or None,
        'address': {'@type': 'PostalAddress', 'addressLocality': c['cidade'], 'addressRegion': c.get('uf'), 'addressCountry': 'BR'},
        'areaServed': c.get('regiao') or c['cidade'],
        'sameAs': ['https://www.instagram.com/' + c['instagram'].lstrip('@') + '/'] if c.get('instagram') else None,
    }
    jsonld = {k: v for k, v in jsonld.items() if v}
    ld = '' if demo else '<script type="application/ld+json">' + json.dumps(jsonld, ensure_ascii=False) + '</script>\n'

    demo_bar = ('<div class="demo"><b>MODELO DE DEMONSTRAÇÃO</b> · personagem e dados fictícios · H2D Studio</div>\n' if demo else '')
    demo_cta = ''
    if demo:
        m = 'Olá! Vi o modelo de site para corretores da H2D Studio e quero um assim, com a minha foto e os meus dados.'
        demo_cta = (f'<div class="h2d"><p><b>Gostou?</b> Este é um modelo da H2D Studio. Seu site pode ficar assim, com a sua foto, a sua história e o seu WhatsApp.</p>'
                    f'<a class="btn btn-b" {ext("https://wa.me/" + H2D_WHATS + "?text=" + urllib.parse.quote(m))}>Quero um site assim{ic("seta")}</a></div>')
    credito = ''
    if c.get('credito_h2d', True):
        credito = '<p class="cred">' + ('Modelo de demonstração com personagem e dados fictícios · ' if demo else '') + 'Site desenvolvido pela <a href="https://h2d-studio.netlify.app/" target="_blank" rel="noopener">H2D Studio</a></p>'

    simbolos = ''.join(f'<symbol id="i-{k}" viewBox="0 0 24 24">{v}</symbol>' for k, v in ICONES.items())

    t = open(os.path.join(AQUI, 'template.html'), encoding='utf-8').read()
    rep = {
        'TITULO': e(titulo), 'DESCRICAO': e(desc), 'ROBOTS': 'index,follow' if c.get('indexar') and not demo else 'noindex,nofollow',
        'CANONICAL': f'<link rel="canonical" href="{e(url)}/">' if url and not demo else '',
        'OG_TITULO': e(f"{nome} · {c['profissao']}"), 'OG_IMG': e(og_img), 'OG_URL': e(url + '/' if url else ''),
        'JSONLD': ld, 'SIMBOLOS': simbolos, 'WA_PATH': WA_PATH, 'DEMO_BAR': demo_bar,
        'INICIAIS': e(iniciais), 'NOME': e(nome), 'NOME_H1': nome_h1, 'PRIMEIRO': e(primeiro),
        'PROFISSAO': e(c['profissao']), 'CRECI': e(c['creci']), 'LOCAL': e(local), 'REGIAO': e(c.get('regiao', '')),
        'REGIAO_SEP': ' · ' if c.get('regiao') else '',
        'ESPECIALIDADE': e(c['especialidade']), 'FRASE': e(c['frase']),
        'FOTO': e(c['foto']), 'FOTO_W': str(c['foto_largura']), 'FOTO_H': str(c['foto_altura']),
        'FOTO_POS': e(c.get('foto_posicao', '50% 25%')), 'FOTO_ALT': e(c['foto_descricao']), 'SELO': selo_html,
        'INDICADORES': ind_html,
        'SOBRE_TITULO': rich(c['sobre_titulo']), 'SOBRE_P': sobre_p, 'SOBRE_PONTOS': pontos,
        'FOTO2': e(c['foto_sobre']), 'FOTO2_W': str(c['foto_sobre_largura']), 'FOTO2_H': str(c['foto_sobre_altura']),
        'FOTO2_POS': e(c.get('foto_sobre_posicao', '50% 40%')), 'FOTO2_ALT': e(c['foto_sobre_descricao']),
        'ESPECIALIDADES': esp, 'DIFERENCIAIS': dif,
        'AJ_IN': aj_in, 'AJ_LB': aj_lb, 'AJ_RS': aj_rs, 'AJ_CSS': aj_css,
        'WA0': e(wa(msg0)), 'WA_EXIB': e(c.get('whatsapp_exibicao', '')), 'CANAIS': can_html, 'HORARIO': hor,
        'DEMO_CTA': demo_cta, 'CREDITO': credito,
    }
    for k, v in rep.items():
        t = t.replace('{{' + k + '}}', v)
    falta = re.findall(r'\{\{[A-Z0-9_]+\}\}', t)
    assert not falta, falta
    return t


def main():
    if len(sys.argv) < 2:
        print(__doc__); sys.exit(1)
    c = json.load(open(sys.argv[1], encoding='utf-8'))
    saida = os.path.abspath(sys.argv[2]) if len(sys.argv) > 2 else AQUI
    os.makedirs(saida, exist_ok=True)
    pagina = montar(c)
    if saida != AQUI:
        shutil.copytree(os.path.join(AQUI, 'fonts'), os.path.join(saida, 'fonts'), dirs_exist_ok=True)
        for p in sorted(set(re.findall(r'(img/[\w.-]+)', pagina))):
            orig = os.path.join(AQUI, p) if os.path.exists(os.path.join(AQUI, p)) else os.path.join(os.path.dirname(os.path.abspath(sys.argv[1])), p)
            if os.path.exists(orig):
                os.makedirs(os.path.join(saida, 'img'), exist_ok=True)
                shutil.copy(orig, os.path.join(saida, p))
            else:
                print('ATENÇÃO: imagem não encontrada:', p)
    open(os.path.join(saida, 'index.html'), 'w', encoding='utf-8').write(pagina)
    print('site montado em', os.path.join(saida, 'index.html'), len(pagina) // 1024, 'KB')


if __name__ == '__main__':
    main()
