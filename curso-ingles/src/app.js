/* Fala Fácil · aplicativo do aluno
   Estrutura: utilidades → estado e revisão espaçada → voz e microfone → curso → telas.
   O tutor com IA (futuro) entra pelo objeto TUTOR: hoje ele usa regras locais. */
'use strict';
var CONFIG = { whatsapp: '5551993759314', ia: { ativo: false, endpoint: '' } };

/* ================= utilidades ================= */
var $ = function (s, r) { return (r || document).querySelector(s); };
var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function ico(id, cls) { return '<svg class="i ' + (cls || '') + '" aria-hidden="true"><use href="#i-' + id + '"/></svg>'; }
function hoje() { var d = new Date(); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
function addDias(iso, n) { var p = iso.split('-'), d = new Date(+p[0], +p[1] - 1, +p[2] + n); return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
function dataBR(iso) { var p = iso.split('-'); return p[2] + '/' + p[1]; }
function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
var toastT;
function toast(m) { var t = $('#toast'); t.textContent = m; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove('show'); }, 3600); }

/* ================= estado (salvo no aparelho) ================= */
var KEY = 'falafacil_v2';
var S = { tema: 'auto', onb: false, nome: '', w: {}, done: {}, aval: {}, days: {}, hist: [], frases: 0, revs: 0, medals: {}, vozPt: '', vozEn: '' };
try { var raw = localStorage.getItem(KEY); if (raw) S = Object.assign(S, JSON.parse(raw)); } catch (e) {}
(function migrar() { /* aproveita o progresso da versão anterior */
  try { if (Object.keys(S.w).length) return; var v1 = JSON.parse(localStorage.getItem('falafacil_v1') || 'null'); if (!v1 || !v1.ok) return;
    Object.keys(v1.ok).forEach(function (w) { S.w[w] = { st: 'aprendendo', due: hoje(), n: 1, err: 0, fav: false, seen: hoje() }; }); } catch (e) {}
})();
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} }

/* tema claro / escuro */
var mqEscuro = matchMedia('(prefers-color-scheme: dark)');
function temaAtual() { return S.tema === 'auto' ? (mqEscuro.matches ? 'escuro' : 'claro') : S.tema; }
function aplicarTema() {
  var t = temaAtual(); document.documentElement.dataset.theme = t;
  var ic = document.getElementById('temaIc'); if (ic) ic.innerHTML = '<use href="#i-' + (t === 'escuro' ? 'sun' : 'moon') + '"/>';
  var b = document.getElementById('temaBtn'); if (b) b.setAttribute('aria-label', t === 'escuro' ? 'Usar fundo claro' : 'Usar fundo escuro');
  var m = document.querySelector('meta[name="theme-color"]'); if (m) m.content = t === 'escuro' ? '#0b1220' : '#2563eb';
}
if (mqEscuro.addEventListener) mqEscuro.addEventListener('change', function () { if (S.tema === 'auto') aplicarTema(); });

function estudou(txt) {
  S.days[hoje()] = 1;
  S.hist.unshift({ d: hoje(), t: txt }); S.hist = S.hist.slice(0, 40);
  save(); conquistas();
}
function sequencia() {
  var d = hoje(), n = 0;
  if (!S.days[d]) d = addDias(d, -1);
  while (S.days[d]) { n++; d = addDias(d, -1); }
  return n;
}

/* revisão espaçada: difícil volta amanhã, aprendendo em 3 dias, dominada em 7, 14 e 30 dias */
function W(w) { return S.w[w] || (S.w[w] = { st: 'novo', due: hoje(), n: 0, err: 0, fav: false, seen: '' }); }
function marcarVisto(w) { var x = W(w); if (!x.seen) { x.seen = hoje(); if (x.st === 'novo') { x.st = 'aprendendo'; x.due = addDias(hoje(), 1); } } }
function classificar(w, st) {
  var x = W(w); x.st = st; x.n++; if (!x.seen) x.seen = hoje();
  var dias = st === 'dificil' ? 1 : st === 'aprendendo' ? 3 : (x.dom = (x.dom || 0) + 1) === 1 ? 7 : x.dom === 2 ? 14 : 30;
  if (st !== 'dominada') x.dom = 0;
  x.due = addDias(hoje(), dias);
}
function errou(w) { var x = W(w); x.err++; x.st = 'dificil'; x.due = hoje(); }
function itemDe(w) { for (var i = 0; i < LICOES.length; i++) for (var j = 0; j < LICOES[i].itens.length; j++) if (LICOES[i].itens[j][0] === w) return LICOES[i].itens[j]; return null; }
function pendentes() { var d = hoje(); return Object.keys(S.w).filter(function (w) { var x = S.w[w]; return x.seen && x.due <= d && itemDe(w); }); }
function contar(st) { return Object.keys(S.w).filter(function (w) { return S.w[w].seen && S.w[w].st === st; }).length; }
function aprendidas() { return Object.keys(S.w).filter(function (w) { return S.w[w].seen; }).length; }

/* ================= curso: 5 módulos × 6 dias ================= */
function lic(id) { for (var i = 0; i < LICOES.length; i++) if (LICOES[i].id === id) return LICOES[i]; return null; }
var DIAS = [];
MODULOS.forEach(function (m, mi) {
  m.aulas.forEach(function (id) { DIAS.push({ tipo: 'aula', id: id, m: mi }); });
  DIAS.push(mi === MODULOS.length - 1 ? { tipo: 'final', id: 'final', m: mi } : { tipo: 'aval', id: 'aval-' + m.id, m: mi });
});
function feito(d) { return d.tipo === 'aula' ? !!S.done[d.id] : !!(S.aval[d.id] && S.aval[d.id].ok); }
function diaAtual() { for (var i = 0; i < DIAS.length; i++) if (!feito(DIAS[i])) return i; return DIAS.length; }
function nomeDia(d) { return d.tipo === 'aula' ? lic(d.id).titulo : d.tipo === 'final' ? 'Avaliação final do curso' : 'Avaliação do módulo'; }
function aulasFeitas() { return DIAS.filter(feito).length; }
function moduloFeito(mi) { return DIAS.filter(function (d) { return d.m === mi; }).every(feito); }

/* ================= conquistas ================= */
var MEDALHAS = [
  { id: 'primeira', n: 'Primeiro passo', r: 'Concluir a primeira aula', ok: function () { return Object.keys(S.done).length >= 1; } },
  { id: 'seq3', n: 'Ritmo', r: '3 dias seguidos', ok: function () { return sequencia() >= 3; } },
  { id: 'seq7', n: 'Desafio de 7 dias', r: '7 dias seguidos de estudo', ok: function () { return sequencia() >= 7; } },
  { id: 'p50', n: '50 palavras', r: 'Aprender 50 palavras', ok: function () { return aprendidas() >= 50; } },
  { id: 'p100', n: '100 palavras', r: 'Aprender 100 palavras', ok: function () { return aprendidas() >= 100; } },
  { id: 'p200', n: '200 palavras', r: 'Aprender 200 palavras', ok: function () { return aprendidas() >= 200; } },
  { id: 'dom25', n: 'Memória firme', r: 'Dominar 25 palavras', ok: function () { return contar('dominada') >= 25; } },
  { id: 'rev20', n: 'Revisora dedicada', r: 'Fazer 20 revisões', ok: function () { return S.revs >= 20; } },
  { id: 'fr30', n: 'Construtora de frases', r: 'Praticar 30 frases', ok: function () { return S.frases >= 30; } }
].concat(MODULOS.map(function (m, i) { return { id: 'mod' + (i + 1), n: 'Módulo ' + (i + 1), r: 'Concluir “' + m.nome + '”', ok: function () { return moduloFeito(i); } }; }))
 .concat([{ id: 'curso', n: 'Fala Fácil completo', r: 'Concluir os 30 dias', ok: function () { return diaAtual() >= DIAS.length; } }]);
var novasMedalhas = [];
function conquistas() { MEDALHAS.forEach(function (m) { if (!S.medals[m.id] && m.ok()) { S.medals[m.id] = hoje(); novasMedalhas.push(m); } }); save(); }

/* ================= voz ================= */
var synth = window.speechSynthesis, vozes = [];
function carregarVozes() { if (synth) vozes = synth.getVoices(); }
if (synth) { carregarVozes(); if (synth.addEventListener) synth.addEventListener('voiceschanged', carregarVozes); else synth.onvoiceschanged = carregarVozes; }
function melhorVoz(pref) {
  var nome = pref === 'pt' ? S.vozPt : S.vozEn;
  if (nome) { var v0 = vozes.filter(function (v) { return v.name === nome; })[0]; if (v0) return v0; }
  var lang = pref === 'pt' ? /^pt[-_]br/i : /^en[-_]us/i, alt = pref === 'pt' ? /^pt/i : /^en/i;
  var lista = vozes.filter(function (v) { return lang.test(v.lang); }); if (!lista.length) lista = vozes.filter(function (v) { return alt.test(v.lang); });
  return lista.filter(function (v) { return /natural|neural|premium|enhanced|google/i.test(v.name); })[0] || lista[0] || null;
}
function falar(txt, opt) {
  opt = opt || {};
  if (!synth) { toast('Este aparelho não tem áudio de leitura disponível.'); return; }
  synth.cancel();
  var u = new SpeechSynthesisUtterance(txt), pt = opt.lang === 'pt';
  u.lang = pt ? 'pt-BR' : 'en-US'; var v = melhorVoz(pt ? 'pt' : 'en'); if (v) u.voice = v;
  u.rate = opt.lento ? 0.72 : (opt.rate || (txt.split(' ').length > 3 ? 0.9 : 0.85)); if (opt.pitch) u.pitch = opt.pitch;
  if (opt.fim) u.onend = opt.fim;
  synth.speak(u);
}
var actx = null;
function plim() { try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); var t = actx.currentTime;
  [659.25, 880].forEach(function (f, i) { var o = actx.createOscillator(), g = actx.createGain(); o.type = 'sine'; o.frequency.value = f;
    g.gain.setValueAtTime(0, t + i * .08); g.gain.linearRampToValueAtTime(.12, t + i * .08 + .02); g.gain.exponentialRampToValueAtTime(.001, t + i * .08 + .35);
    o.connect(g); g.connect(actx.destination); o.start(t + i * .08); o.stop(t + i * .08 + .4); }); } catch (e) {} }
function festa() { if (matchMedia('(prefers-reduced-motion: reduce)').matches) return; var b = document.createElement('div'); b.className = 'conf';
  var cores = ['#2563eb', '#f59e0b', '#15803d', '#60a5fa', '#f97316'];
  for (var i = 0; i < 40; i++) { var x = document.createElement('i'); x.style.left = Math.random() * 100 + '%'; x.style.background = cores[i % cores.length]; x.style.animationDelay = Math.random() * .4 + 's'; b.appendChild(x); }
  document.body.appendChild(b); setTimeout(function () { b.remove(); }, 2300); }

/* ================= microfone (reconhecimento de fala) ================= */
var SR = window.SpeechRecognition || window.webkitSpeechRecognition, rec = null, ouvindo = false;
function norm(s) { return String(s).toLowerCase().replace(/[’‘`]/g, "'").replace(/[^a-z0-9' ]/g, ' ').replace(/\s+/g, ' ').trim(); }
function lev(a, b) { var m = a.length, n = b.length, d = [], i, j; for (i = 0; i <= m; i++) d[i] = [i]; for (j = 0; j <= n; j++) d[0][j] = j;
  for (i = 1; i <= m; i++) for (j = 1; j <= n; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return d[m][n]; }
function similaridade(ouvidos, alvos) {
  var best = 0; alvos = alvos.map(norm);
  ouvidos.forEach(function (h) { var hs = norm(h).replace(/[' ]/g, '');
    alvos.forEach(function (t) { var ts = t.replace(/[' ]/g, ''); var s = 1 - lev(hs, ts) / Math.max(hs.length, ts.length, 1); if (hs.indexOf(ts) > -1 && ts.length > 2) s = Math.max(s, .97); best = Math.max(best, s); }); });
  return best;
}
function pararMic() { if (rec && ouvindo) { try { rec.abort(); } catch (e) {} } ouvindo = false; }
/* ouvir(alvos, ui, callback): ui = {btn, status}. Resultado: {nivel, ouvido, conf} */
function ouvir(alvos, ui, cb) {
  if (ouvindo) { pararMic(); ui.btn.classList.remove('on'); ui.status.innerHTML = '<b>Toque para falar</b>'; return; }
  if (!SR) { cb({ nivel: 'sem-suporte' }); return; }
  if (synth) synth.cancel();
  var recebeu = false;
  try { rec = new SR(); } catch (e) { cb({ nivel: 'erro', erro: 'start' }); return; }
  rec.lang = 'en-US'; rec.interimResults = false; rec.maxAlternatives = 5; rec.continuous = false;
  rec.onresult = function (ev) { recebeu = true; var alts = []; for (var i = 0; i < ev.results[0].length; i++) alts.push(ev.results[0][i].transcript);
    var conf = ev.results[0][0].confidence || 0, sim = similaridade(alts, alvos);
    var nivel = sim >= .95 && conf >= .8 ? 'clara' : sim >= .85 ? 'reconhecida' : sim >= .6 ? 'parcial' : 'nao';
    fim(); cb({ nivel: nivel, ouvido: alts[0], conf: conf }); };
  rec.onerror = function (ev) { recebeu = true; fim(); cb({ nivel: 'erro', erro: ev.error }); };
  rec.onend = function () { if (!recebeu) { fim(); cb({ nivel: 'erro', erro: 'no-speech' }); } };
  function fim() { ouvindo = false; ui.btn.classList.remove('on'); ui.btn.setAttribute('aria-label', 'Toque para falar'); ui.status.innerHTML = '<b>Toque para falar</b><span class="note">Fale depois de tocar no microfone</span>'; }
  try { rec.start(); ouvindo = true; ui.btn.classList.add('on'); ui.btn.setAttribute('aria-label', 'Parar de ouvir');
    ui.status.innerHTML = '<b>Ouvindo… fale agora <span class="waves"><i></i><i></i><i></i><i></i></span></b><span class="note">Toque de novo para parar</span>'; }
  catch (e) { recebeu = true; fim(); cb({ nivel: 'erro', erro: 'start' }); }
}
function msgFala(r, esperado) {
  var aviso = '<small>O reconhecimento mostra se a sua fala foi entendida. Ele não é uma nota completa de pronúncia.</small>';
  if (r.nivel === 'clara') return { c: 'ok', h: '<b>' + ico('check') + ' Fala reconhecida com clareza.</b> Entendi: “' + esc(r.ouvido) + '”.' + aviso };
  if (r.nivel === 'reconhecida') return { c: 'ok', h: '<b>Fala reconhecida.</b> Entendi: “' + esc(r.ouvido) + '”. Para soar mais natural, ouça o áudio lento e repita mais uma vez.' + aviso };
  if (r.nivel === 'parcial') return { c: 'mid', h: '<b>Quase.</b> Entendi: “' + esc(r.ouvido) + '”, que ainda não é “' + esc(esperado) + '”. Ouça o áudio lento e tente de novo, sem pressa.' };
  if (r.nivel === 'nao') return { c: 'err', h: '<b>Ainda não reconheci.</b> Entendi: “' + esc(r.ouvido) + '”. Ouça devagar, repita sílaba por sílaba e tente outra vez.' };
  if (r.nivel === 'sem-suporte') return { c: 'info', h: '<b>Este navegador não reconhece a fala.</b> Pratique em voz alta mesmo assim: ouça, repita e compare. Para o reconhecimento automático, use o Google Chrome no Android ou no computador, ou o Safari no iPhone. <button class="btn-g" type="button" data-act="ajuda-mic">Como ativar</button>' };
  var e = r.erro;
  if (e === 'not-allowed' || e === 'service-not-allowed') return { c: 'err', h: '<b>O microfone está bloqueado.</b> Libere o acesso ao microfone e tente de novo. <button class="btn-g" type="button" data-act="ajuda-mic">Ver o passo a passo</button>' };
  if (e === 'network') return { c: 'err', h: '<b>Sem conexão.</b> O reconhecimento de fala precisa de internet. Verifique a conexão e tente de novo.' };
  if (e === 'no-speech') return { c: 'mid', h: '<b>Não ouvi nada.</b> Toque no microfone e fale logo em seguida, um pouco mais perto do aparelho.' };
  if (e === 'audio-capture') return { c: 'err', h: '<b>Nenhum microfone encontrado.</b> Verifique se o aparelho tem microfone e se outro app não está usando.' };
  return { c: 'err', h: '<b>Não foi possível usar o microfone agora.</b> Tente de novo. <button class="btn-g" type="button" data-act="ajuda-mic">Ajuda</button>' };
}

/* ================= tutor (regras locais; pronto para IA no futuro) ================= */
var TUTOR = {
  explicarErro: function (certo, escolhido, extra) { return 'A resposta certa é <b>“' + esc(certo) + '”</b>' + (escolhido ? ', e não “' + esc(escolhido) + '”' : '') + '.' + (extra ? ' ' + extra : ''); },
  explicarOrdem: function (frase, est) { return 'A ordem certa é: <b>' + esc(frase) + '</b>.' + (est ? ' Lembre: ' + esc(est) : ''); },
  sugerirRevisao: function () { return pendentes().slice(0, 15); }
};

/* ================= sons difíceis ================= */
function sonsDe(w) {
  var t = w.toLowerCase(), r = [];
  if (/th/.test(t)) r.push('th');
  if (/(^|\s)h[aeiou]/.test(t) && !/\b(hour|honest)/.test(t)) r.push('h');
  if (/(^|\s)wh?[aeio]/.test(t) && !/\bwho/.test(t)) r.push('w');
  if (/(^|\s)(black|thank|family|happy|bank|cash|sad|fabric|back|actually)/.test(t)) r.push('a');
  if (/^[a-z]+$/.test(t) && /[bdgkpt]$/.test(t)) r.push('fim');
  return r.slice(0, 2);
}

/* ================= navegação ================= */
var ABA = 'inicio', AULA = null;
function setNav(on) { document.body.classList.toggle('nonav', !on); }
function ir(aba) { pararMic(); if (synth) synth.cancel(); ABA = aba; AULA = null; setNav(true); $$('.tab').forEach(function (t) { t.classList.toggle('on', t.dataset.tab === aba); }); render(); scrollTo(0, 0); }
function render() {
  $('#streakN').textContent = sequencia();
  var p = pendentes().length, b = $('#revBadge'); b.hidden = !p; b.textContent = p > 99 ? '99+' : p;
  var v = $('#view');
  if (!S.onb) { setNav(false); v.innerHTML = telaBoasVindas(); return; }
  if (ABA === 'inicio') v.innerHTML = telaInicio();
  else if (ABA === 'curso') v.innerHTML = telaCurso();
  else if (ABA === 'revisar') v.innerHTML = telaRevisar();
  else if (ABA === 'conquistas') v.innerHTML = telaConquistas();
}
$$('.tab').forEach(function (t) { t.addEventListener('click', function () { ir(t.dataset.tab); }); });
$('#gearBtn').addEventListener('click', function () { abrirConfig(); });
$('#temaBtn').addEventListener('click', function () { S.tema = temaAtual() === 'escuro' ? 'claro' : 'escuro'; save(); aplicarTema(); toast(S.tema === 'escuro' ? 'Fundo escuro ativado' : 'Fundo claro ativado'); });

/* ================= boas-vindas ================= */
var onbPasso = 0;
function telaBoasVindas() {
  if (onbPasso === 0) return '<div class="card" style="margin-top:8px"><span class="pill p-blue">Bem-vindo(a)</span><h1 class="h1" style="margin:12px 0 8px">Inglês do zero, sem medo e no seu ritmo.</h1>' +
    '<p class="sub">Em 30 dias, com uma aula por dia, você aprende o inglês que usa no dia a dia e no trabalho, sempre explicado em português.</p>' +
    '<div class="how"><div><b>1</b>Aprenda a palavra e o significado</div><div><b>2</b>Escute o áudio, normal ou lento</div><div><b>3</b>Pronuncie e veja se foi entendida</div><div><b>4</b>Construa frases de verdade</div><div><b>5</b>Pratique com exercícios e diálogos</div><div><b>6</b>Revise no tempo certo para não esquecer</div></div>' +
    '<button class="btn btn-p full" type="button" data-act="onb-next">Começar ' + ico('right') + '</button></div>';
  if (onbPasso === 1) return '<div class="card" style="margin-top:8px"><span class="pill p-blue">Passo 1 de 2</span><h2 class="h1" style="margin:12px 0 6px">Como podemos te chamar?</h2><p class="sub">O seu nome aparece no painel e no certificado. Fica salvo só neste aparelho.</p>' +
    '<label class="field"><span>Seu nome (opcional)</span><input id="onbNome" autocomplete="given-name" value="' + esc(S.nome) + '" placeholder="Ex.: Denise"></label>' +
    '<p class="sub">Meta diária: <b>1 aula por dia</b>, cerca de 15 minutos. Se o dia estiver corrido, 10 revisões também contam.</p>' +
    '<button class="btn btn-p full" type="button" data-act="onb-next" style="margin-top:14px">Continuar ' + ico('right') + '</button></div>';
  return '<div class="card" style="margin-top:8px"><span class="pill p-blue">Passo 2 de 2</span><h2 class="h1" style="margin:12px 0 6px">Vamos testar o som e o microfone</h2>' +
    '<p class="sub">Aumente o volume e toque em “Ouvir”. Depois, toque no microfone e diga <b>“Hello”</b>.</p>' +
    '<div class="row" style="margin:14px 0"><button class="btn btn-s" type="button" data-act="onb-som">' + ico('play') + 'Ouvir “Hello”</button></div>' +
    '<div class="mic"><button class="micb" type="button" id="onbMic" aria-label="Toque para falar">' + ico('mic') + '</button><div class="st" id="onbSt"><b>Toque para falar</b><span class="note">O navegador vai pedir permissão. Toque em “Permitir”.</span></div></div>' +
    '<div id="onbFb"></div><p class="note" style="margin-top:12px">Se o microfone não funcionar, você ainda pode fazer o curso: basta praticar em voz alta. <button class="btn-g" type="button" data-act="ajuda-mic">Como ativar o microfone</button></p>' +
    '<button class="btn btn-p full" type="button" data-act="onb-fim" style="margin-top:14px">Ir para o meu painel ' + ico('right') + '</button></div>';
}

/* ================= início (painel) ================= */
function telaInicio() {
  var i = diaAtual(), fim = i >= DIAS.length, d = DIAS[Math.min(i, DIAS.length - 1)], feitas = aulasFeitas(), pct = Math.round(feitas / DIAS.length * 100);
  var nome = S.nome ? ', ' + esc(S.nome) : '', pend = pendentes().length, seq = sequencia();
  var metaAula = S.hist.some(function (h) { return h.d === hoje() && /^Concluiu/.test(h.t); }), revHoje = S.hist.filter(function (h) { return h.d === hoje() && /^Revisou/.test(h.t); }).length;
  var h = '<h1 class="h1" style="margin:4px 0 2px">Olá' + nome + '!</h1><p class="sub">' + (fim ? 'Você concluiu os 30 dias. Parabéns!' : 'Dia ' + (i + 1) + ' de 30 · Módulo ' + (d.m + 1) + ': ' + esc(MODULOS[d.m].nome)) + '</p>';
  h += '<div class="card hero" style="margin-top:14px">';
  if (fim) h += '<b style="font-size:1.2rem">Curso concluído!</b><p class="sub" style="margin:6px 0 14px">Continue revisando para manter o que aprendeu.</p><button class="btn btn-p full" type="button" data-act="certificado">Ver o meu certificado</button>';
  else h += '<span class="pill" style="background:rgba(255,255,255,.18);color:#fff">' + (feitas ? 'Próxima aula' : 'Comece por aqui') + '</span><b style="display:block;font-size:1.3rem;margin:10px 0 2px">Dia ' + (i + 1) + ' · ' + esc(nomeDia(d)) + '</b><p class="sub">' + esc(d.tipo === 'aula' ? lic(d.id).sub : d.tipo === 'final' ? 'Mostre tudo o que aprendeu e ganhe o seu certificado' : 'Confira o que aprendeu no módulo ' + (d.m + 1)) + '</p>' +
    '<div class="bar" style="margin:14px 0 6px"><i style="width:' + pct + '%"></i></div><p class="sub" style="font-size:.82rem;margin-bottom:14px">' + feitas + ' de 30 dias concluídos · ' + pct + '%</p>' +
    '<button class="btn btn-p full" type="button" data-act="abrir-dia" data-i="' + i + '">' + (feitas ? 'Continuar' : 'Começar a aula 1') + ' ' + ico('right') + '</button>';
  h += '</div>';
  h += '<div class="card"><div class="goal"><span class="ck ' + (metaAula || revHoje >= 10 ? 'on' : '') + '">' + (metaAula || revHoje >= 10 ? ico('check') : '') + '</span><div><b>Meta de hoje</b><div class="sub">' + (metaAula ? 'Aula concluída. Muito bem!' : revHoje >= 10 ? 'Meta cumprida com revisões!' : 'Concluir 1 aula ou fazer 10 revisões (' + revHoje + '/10)') + '</div></div></div></div>';
  if (pend) h += '<div class="card" style="display:flex;align-items:center;gap:12px"><div style="flex:1"><b>Revisão do dia</b><div class="sub">' + pend + ' palavra' + (pend > 1 ? 's' : '') + ' para relembrar hoje</div></div><button class="btn btn-s" type="button" data-act="revisao">Revisar</button></div>';
  if (!S.hist.length) {
    h += '<div class="card"><b>Como funciona o seu painel</b><p class="sub" style="margin-top:6px">Depois da primeira aula, aqui aparecem a sua sequência de dias, as palavras aprendidas e dominadas, as frases praticadas e o seu histórico.</p></div>';
  } else {
    h += '<h2 class="h2">Seu progresso</h2><div class="stats">' +
      stat(feitas + '/30', 'dias concluídos') + stat(aprendidas(), 'palavras aprendidas') + stat(contar('dominada'), 'palavras dominadas') +
      stat(pend, 'para revisar hoje') + stat(S.frases, 'frases praticadas') + stat(seq + (seq === 1 ? ' dia' : ' dias'), 'de sequência') + '</div>';
    h += '<div class="card" style="margin-top:12px"><b>Próxima meta</b><p class="sub" style="margin-top:4px">' + esc(proximaMeta()) + '</p></div>';
    h += '<h2 class="h2">Histórico</h2><div class="card"><ul class="hist">' + S.hist.slice(0, 8).map(function (x) { return '<li><span>' + esc(x.t) + '</span><time>' + dataBR(x.d) + '</time></li>'; }).join('') + '</ul></div>';
  }
  return h;
}
function stat(v, l) { return '<div class="stat"><b>' + v + '</b><span>' + l + '</span></div>'; }
function proximaMeta() {
  var i = diaAtual(); if (i < DIAS.length) { var mi = DIAS[i].m; if (!moduloFeito(mi)) { var falta = DIAS.filter(function (d) { return d.m === mi && !feito(d); }).length;
    if (sequencia() < 7) return 'Concluir o Módulo ' + (mi + 1) + ' (faltam ' + falta + ' dia' + (falta > 1 ? 's' : '') + ') e chegar a 7 dias seguidos de estudo.'; return 'Concluir o Módulo ' + (mi + 1) + ': faltam ' + falta + ' dia' + (falta > 1 ? 's' : '') + '.'; } }
  var a = aprendidas(); if (a < 100) return 'Chegar a 100 palavras aprendidas (faltam ' + (100 - a) + ').'; if (a < 200) return 'Chegar a 200 palavras aprendidas (faltam ' + (200 - a) + ').';
  return 'Dominar todas as palavras do curso com as revisões diárias.';
}

/* ================= curso (jornada) ================= */
function telaCurso() {
  var cur = diaAtual(), h = '<h1 class="h1" style="margin:4px 0 2px">Sua jornada de 30 dias</h1><p class="sub">5 módulos · 6 dias cada · 25 aulas e 5 avaliações</p>';
  MODULOS.forEach(function (m, mi) {
    var done = moduloFeito(mi);
    h += '<div class="card mod' + (done ? ' done' : '') + '" style="margin-top:14px"><div class="mh"><span class="num">' + (done ? ico('check') : mi + 1) + '</span><div><b style="font-size:1.08rem">Módulo ' + (mi + 1) + ' · ' + esc(m.nome) + '</b><p class="sub">' + esc(m.obj) + '</p>' +
      '<details style="margin-top:6px"><summary class="note" style="cursor:pointer;font-weight:700;color:var(--primary-d)">O que você vai aprender</summary><ul class="learn">' + m.aprende.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></details></div></div>';
    DIAS.forEach(function (d, i) { if (d.m !== mi) return;
      var ok = feito(d), atual = i === cur, nota = d.tipo !== 'aula' && S.aval[d.id] ? ' · ' + S.aval[d.id].pct + '%' : '';
      var sub = d.tipo === 'aula' ? lic(d.id).sub + ' · ' + lic(d.id).itens.length + ' palavras e frases' : d.tipo === 'final' ? 'Avaliação final e certificado (conclui o Módulo 5)' : '12 questões · aprovação com 70%';
      h += '<button class="day' + (ok ? ' ok' : '') + (atual ? ' cur' : '') + '" type="button" data-act="abrir-dia" data-i="' + i + '"><span class="st">' + (ok ? ico('check') : i + 1) + '</span><span style="min-width:0"><b>Dia ' + (i + 1) + ' · ' + esc(nomeDia(d)) + '</b><small>' + (ok ? 'Concluído' + nota : atual ? 'Aula atual' : esc(sub)) + '</small></span><span class="go">' + ico('right') + '</span></button>';
    });
    h += '</div>';
  });
  h += '<h2 class="h2">Trilhas</h2><div class="card"><div style="display:flex;gap:12px;align-items:flex-start"><span class="pill p-ok">Disponível</span></div><b style="display:block;margin-top:8px">Bônus · Entender a internet</b><p class="sub">Botões, avisos e mensagens que aparecem em sites, aplicativos e redes sociais. 23 palavras e expressões.</p><button class="btn btn-s" type="button" data-act="abrir-aula" data-id="t1" style="margin-top:10px">' + (S.done.t1 ? 'Refazer a aula' : 'Fazer a aula bônus') + '</button></div>';
  h += '<div class="card"><span class="pill p-grey">Em preparação</span><p class="sub" style="margin-top:8px">Próximas trilhas, cada uma com objetivos e situações práticas próprias:</p><ul class="learn" style="margin-top:6px">' +
    ['<b>Inglês para viagens</b> · aeroporto, hotel, passeios e imprevistos', '<b>Inglês para o dia a dia</b> · mercado, médico, vizinhos e serviços', '<b>Inglês para o trabalho</b> · reuniões, apresentações e negociação', '<b>Inglês para conversação</b> · falar de você, opiniões e planos'].map(function (x) { return '<li style="padding:4px 0">' + x + '</li>'; }).join('') + '</ul></div>';
  return h;
}

/* ================= revisar ================= */
var filtroRev = 'dificil';
function telaRevisar() {
  var p = pendentes().length, h = '<h1 class="h1" style="margin:4px 0 2px">Revisar</h1><p class="sub">A revisão espaçada traz cada palavra de volta no momento certo, antes de você esquecer.</p>';
  h += '<div class="card" style="margin-top:14px"><b>Revisão do dia</b><p class="sub" style="margin:4px 0 12px">' + (p ? p + ' palavra' + (p > 1 ? 's' : '') + ' para relembrar hoje.' : aprendidas() ? 'Tudo em dia! Volte amanhã para a próxima revisão.' : 'As palavras das aulas aparecem aqui para revisão.') + '</p>' +
    '<button class="btn btn-p full" type="button" data-act="revisao"' + (p ? '' : ' disabled') + '>' + ico('rep') + 'Começar a revisão</button></div>';
  var grupos = [['dificil', 'Difíceis'], ['aprendendo', 'Aprendendo'], ['dominada', 'Dominadas'], ['erros', 'Que eu errei'], ['fav', 'Favoritas']];
  h += '<h2 class="h2">Minhas palavras</h2><div class="seg" role="tablist">' + grupos.map(function (g) { return '<button type="button" role="tab" aria-selected="' + (filtroRev === g[0]) + '" class="' + (filtroRev === g[0] ? 'on' : '') + '" data-act="filtro" data-f="' + g[0] + '">' + g[1] + ' (' + listaRev(g[0]).length + ')</button>'; }).join('') + '</div>';
  var l = listaRev(filtroRev);
  h += '<div class="card">' + (l.length ? l.slice(0, 120).map(function (w) { var it = itemDe(w); return '<div class="wl"><button class="play" type="button" data-act="falar" data-t="' + esc(w) + '" aria-label="Ouvir ' + esc(w) + '">' + ico('play') + '</button><div class="t"><b lang="en">' + esc(w) + '</b><span>' + esc(it[2]) + (S.w[w].err ? ' · errou ' + S.w[w].err + 'x' : '') + '</span></div><button class="favb' + (S.w[w].fav ? ' on' : '') + '" type="button" data-act="fav" data-w="' + esc(w) + '" aria-label="Favoritar">' + ico('star') + '</button></div>'; }).join('') :
    '<p class="sub">Nenhuma palavra nesta lista ainda.</p>') + '</div>';
  var feitas = DIAS.filter(function (d) { return d.tipo === 'aula' && S.done[d.id]; });
  if (feitas.length) h += '<h2 class="h2">Revisar uma aula anterior</h2><div class="card mod">' + feitas.map(function (d) { var i = DIAS.indexOf(d); return '<button class="day ok" type="button" data-act="abrir-dia" data-i="' + i + '"><span class="st">' + ico('check') + '</span><span><b>Dia ' + (i + 1) + ' · ' + esc(lic(d.id).titulo) + '</b><small>Refazer a aula completa</small></span><span class="go">' + ico('right') + '</span></button>'; }).join('') + '</div>';
  return h;
}
function listaRev(f) { return Object.keys(S.w).filter(function (w) { var x = S.w[w]; if (!x.seen || !itemDe(w)) return false; if (f === 'erros') return x.err > 0; if (f === 'fav') return x.fav; return x.st === f; }); }

/* ================= conquistas ================= */
function telaConquistas() {
  var seq = sequencia(), ganhas = MEDALHAS.filter(function (m) { return S.medals[m.id]; }).length;
  var h = '<h1 class="h1" style="margin:4px 0 2px">Conquistas</h1><p class="sub">' + ganhas + ' de ' + MEDALHAS.length + ' conquistas</p>';
  h += '<div class="card" style="margin-top:14px"><b>Desafio de 7 dias</b><p class="sub" style="margin:4px 0 10px">Estude 7 dias seguidos. Uma aula ou 10 revisões por dia já contam.</p><div class="bar"><i style="width:' + Math.min(100, Math.round(seq / 7 * 100)) + '%"></i></div><p class="note" style="margin-top:6px">' + Math.min(seq, 7) + ' de 7 dias</p></div>';
  h += '<div class="medals" style="margin-top:12px">' + MEDALHAS.map(function (m) { var on = S.medals[m.id]; return '<div class="medal' + (on ? ' on' : '') + '"><div class="m">' + ico(on ? 'award' : 'lock') + '</div><b>' + esc(m.n) + '</b><small>' + (on ? 'Conquistada em ' + dataBR(on) : esc(m.r)) + '</small></div>'; }).join('') + '</div>';
  h += '<div class="card" style="margin-top:12px"><b>Certificado de conclusão</b><p class="sub" style="margin:4px 0 12px">' + (S.aval.final && S.aval.final.ok ? 'Você concluiu o curso. Seu certificado está pronto.' : 'Disponível ao ser aprovado(a) na avaliação final do dia 30.') + '</p><button class="btn btn-s" type="button" data-act="certificado"' + (S.aval.final && S.aval.final.ok ? '' : ' disabled') + '>Ver certificado</button></div>';
  return h;
}

/* ================= aula (6 etapas) ================= */
var ETAPAS = ['Aprenda', 'Escute', 'Pronuncie', 'Construa', 'Pratique', 'Revise'];
function abrirDia(i) { var d = DIAS[i]; if (!d) return; if (d.tipo === 'aula') abrirAula(d.id, i); else abrirAvaliacao(d, i); }
function abrirAula(id, diaIdx) {
  var l = lic(id), p = PED[id];
  AULA = { tipo: 'aula', id: id, dia: diaIdx, l: l, p: p, fase: 'vocab', i: 0, rec: {}, erros: {}, acertos: 0, total: 0, frasesOk: 0, ex: null, k: 0, rot: [] };
  setNav(false); renderAula(); scrollTo(0, 0);
}
function cabecalho(titulo, sub, etapaOn) {
  var idx = { vocab: 2, construa: 3, pratique: 4, revise: 5 }[etapaOn];
  return '<div class="lhead"><button class="iconbtn" type="button" data-act="sair-aula" aria-label="Sair da aula">' + ico('x') + '</button><div class="t"><b>' + esc(titulo) + '</b><small>' + esc(sub) + '</small></div></div>' +
    (idx == null ? '' : '<div class="steps" aria-label="Etapas da aula">' + ETAPAS.map(function (e, k) { var c = etapaOn === 'vocab' ? (k <= 2 ? 'on' : '') : k < idx ? 'ok' : k === idx ? 'on' : ''; return '<span class="' + c + '">' + (k + 1) + '. ' + e + '</span>'; }).join('') + '</div>');
}
function renderAula() {
  var A = AULA, v = $('#view'), dia = A.dia != null ? 'Dia ' + (A.dia + 1) + ' de 30' : 'Aula bônus';
  if (A.fase === 'vocab') v.innerHTML = cabecalho(A.l.titulo, dia + ' · Palavra ' + (A.i + 1) + ' de ' + A.l.itens.length, 'vocab') + cartaoPalavra();
  else if (A.fase === 'construa') v.innerHTML = cabecalho(A.l.titulo, dia + ' · Construa frases', 'construa') + telaConstrua();
  else if (A.fase === 'pratique') v.innerHTML = cabecalho(A.l.titulo, dia + ' · Pratique', 'pratique') + telaPratique();
  else if (A.fase === 'revise') v.innerHTML = cabecalho(A.l.titulo, dia + ' · Revise', 'revise') + telaRevise();
  else if (A.fase === 'fim') v.innerHTML = telaFimAula();
}
function exemploPara(w, p) {
  var wl = w.toLowerCase().replace(/[^a-z' ]/g, '').trim(), todas = [];
  if (p) { p.est.ex.forEach(function (e) { todas.push(e); }); p.dlg.forEach(function (d) { todas.push([d[1], d[2]]); }); }
  if (wl.split(' ').length > 2) return null;
  var re = new RegExp('(^|[^a-z])' + wl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '([^a-z]|$)', 'i');
  for (var i = 0; i < todas.length; i++) if (re.test(todas[i][0]) && norm(todas[i][0]) !== norm(w)) return todas[i];
  return null;
}
function cartaoPalavra() {
  var A = AULA, it = A.l.itens[A.i], w = it[0], x = W(w), ex = exemploPara(w, A.p), sons = sonsDe(w), r = A.rec[w];
  marcarVisto(w); save();
  var h = '<div class="card">';
  h += '<div class="sec"><div class="lbl"><i>1</i>Aprenda</div><div style="display:flex;gap:12px;align-items:flex-start"><div style="flex:1;min-width:0"><div class="word" lang="en">' + esc(w) + '</div><div class="mean">' + esc(it[2]) + '</div></div><button class="favb' + (x.fav ? ' on' : '') + '" type="button" data-act="fav" data-w="' + esc(w) + '" aria-label="Marcar como favorita">' + ico('star') + '</button></div>' +
    '<div class="tip">' + esc(it[3]) + '</div>' + (ex ? '<div class="ex"><button class="play" type="button" data-act="falar" data-t="' + esc(ex[0]) + '" aria-label="Ouvir a frase de exemplo">' + ico('play') + '</button><div class="t"><b lang="en">' + esc(ex[0]) + '</b><span>' + esc(ex[1]) + '</span></div></div>' : '') + '</div>';
  h += '<div class="sec"><div class="lbl"><i>2</i>Escute</div><div class="row"><button class="btn btn-s" type="button" data-act="falar" data-t="' + esc(w) + '">' + ico('play') + 'Ouvir</button><button class="btn btn-o" type="button" data-act="falar" data-t="' + esc(w) + '" data-lento="1">' + ico('slow') + 'Ouvir lento</button></div>' +
    '<div class="approx"><span>Guia aproximado:</span><b>' + esc(it[1]) + '</b></div><p class="note">O guia ajuda a começar, mas o áudio é a referência. Ouça quantas vezes quiser.</p>' +
    sons.map(function (s) { return '<button class="sound" type="button" data-act="som" data-s="' + s + '">' + ico('info') + 'Som difícil: ' + esc(SONS[s].t.replace('O som do ', '').replace('O ', '')) + ' · ver como fazer</button> '; }).join('') + '</div>';
  h += '<div class="sec"><div class="lbl"><i>3</i>Pronuncie</div><div class="mic"><button class="micb" type="button" id="micBtn" data-act="mic" aria-label="Toque para falar">' + ico('mic') + '</button><div class="st" id="micSt"><b>Toque para falar</b><span class="note">Diga “' + esc(w) + '” depois de tocar</span></div></div><div id="micFb">' + (r ? fbHtml(msgFala(r, w)) : '') + '</div></div>';
  h += '</div><div class="lnav"><button class="btn btn-o" type="button" data-act="ant"' + (A.i === 0 ? ' disabled' : '') + ' aria-label="Palavra anterior">' + ico('left') + '</button><button class="btn btn-p" type="button" data-act="prox">' + (A.i === A.l.itens.length - 1 ? 'Ir para Construa' : 'Próxima palavra') + ' ' + ico('right') + '</button></div>';
  setTimeout(function () { falar(w); }, 300);
  return h;
}
function fbHtml(m) { return '<div class="fb ' + m.c + '">' + m.h + '</div>'; }

/* etapa 4: construa */
function telaConstrua() {
  var A = AULA, p = A.p;
  if (A.k === 0 && !A.cIntro) {
    return '<div class="card"><div class="lbl"><i>4</i>Construa</div><h2 style="font-size:1.25rem;margin-bottom:6px">' + esc(p.est.t) + '</h2><p class="sub" style="color:var(--ink2)">' + esc(p.est.x) + '</p>' +
      p.est.ex.map(function (e) { return '<div class="ex"><button class="play" type="button" data-act="falar" data-t="' + esc(e[0]) + '" aria-label="Ouvir">' + ico('play') + '</button><div class="t"><b lang="en">' + esc(e[0]) + '</b><span>' + esc(e[1]) + '</span></div></div>'; }).join('') +
      '</div><button class="btn btn-p full" type="button" data-act="c-ini" style="margin-top:14px">Montar frases ' + ico('right') + '</button>';
  }
  var f = p.c[A.k], st = A.cState;
  if (!st || st.k !== A.k) {
    var palavras = f[0].split(' '), extras = [];
    p.c.forEach(function (o, j) { if (j !== A.k) o[0].split(' ').forEach(function (x) { if (palavras.indexOf(x) < 0 && extras.indexOf(x) < 0) extras.push(x); }); });
    st = A.cState = { k: A.k, banco: shuffle(palavras.concat(extras.length ? [pick(extras)] : [])).map(function (x, n) { return { t: x, n: n, u: false }; }), sel: [], res: null };
  }
  var h = '<div class="card"><div class="lbl"><i>4</i>Construa · frase ' + (A.k + 1) + ' de ' + p.c.length + '</div><p class="sub">Toque nas palavras na ordem certa para dizer em inglês:</p><p class="q">“' + esc(f[1]) + '”</p>' +
    '<div class="build" aria-label="Sua frase">' + (st.sel.length ? st.sel.map(function (n) { return '<button class="tile" type="button" data-act="c-tira" data-n="' + n + '"' + (st.res ? ' disabled' : '') + '>' + esc(st.banco[n].t) + '</button>'; }).join('') : '<span class="note" style="padding:10px">Toque nas palavras abaixo</span>') + '</div>' +
    '<div class="bank">' + st.banco.map(function (b) { return '<button class="tile' + (b.u ? ' used' : '') + '" type="button" data-act="c-poe" data-n="' + b.n + '"' + (st.res ? ' disabled' : '') + '>' + esc(b.t) + '</button>'; }).join('') + '</div>';
  if (st.res === 'ok') h += '<div class="fb ok"><b>' + ico('check') + ' Correto!</b> “' + esc(f[0]) + '” = ' + esc(f[1]) + '. <button class="btn-g" type="button" data-act="falar" data-t="' + esc(f[0]) + '">Ouvir a frase</button></div>';
  if (st.res === 'err') h += '<div class="fb err"><b>Ainda não.</b> ' + TUTOR.explicarOrdem(f[0], p.est.x) + ' <button class="btn-g" type="button" data-act="falar" data-t="' + esc(f[0]) + '">Ouvir a frase</button></div>';
  h += '</div><div class="row" style="margin-top:14px">' + (st.res ? '<button class="btn btn-p" type="button" data-act="c-prox">Continuar ' + ico('right') + '</button>' :
    '<button class="btn btn-o" type="button" data-act="c-limpa">Limpar</button><button class="btn btn-p" type="button" data-act="c-ver"' + (st.sel.length ? '' : ' disabled') + '>Verificar</button>') + '</div>';
  return h;
}

/* etapa 5: pratique */
function gerarExercicios(itens, peds, n, sentencas) {
  var ex = [], pool = shuffle(itens), outros = function (campo, certo, base) { return shuffle(base.filter(function (x) { return x[campo] !== certo[campo]; })).slice(0, 3).map(function (x) { return x[campo]; }); };
  var tipos = ['en2pt', 'pt2en', 'ouvir', 'completar', 'frase-en2pt', 'frase-pt2en'];
  for (var k = 0; k < n; k++) {
    var tipo = tipos[k % tipos.length], it = pool[k % pool.length], ped = pick(peds);
    if (tipo === 'en2pt') ex.push({ tipo: tipo, w: it[0], q: 'O que significa?', destaque: it[0], audio: it[0], certo: it[2], ops: shuffle([it[2]].concat(outros(2, it, itens))), dica: '“' + it[0] + '” = ' + it[2] + '.' });
    else if (tipo === 'pt2en') ex.push({ tipo: tipo, w: it[0], q: 'Como se diz em inglês?', destaque: it[2], certo: it[0], ops: shuffle([it[0]].concat(outros(0, it, itens))), dica: '“' + it[2] + '” = ' + it[0] + '.' });
    else if (tipo === 'ouvir') ex.push({ tipo: tipo, w: it[0], q: 'Escute e escolha o que você ouviu', audio: it[0], auto: true, certo: it[0], ops: shuffle([it[0]].concat(outros(0, it, itens))), dica: 'Você ouviu “' + it[0] + '” (' + it[2] + ').' });
    else if (tipo === 'completar') {
      var f = pick(sentencas), pal = f[0].split(' '), alvo = pal.reduce(function (a, b) { return b.length > a.length ? b : a; }, ''), todas = [];
      sentencas.forEach(function (s) { s[0].split(' ').forEach(function (x) { if (x !== alvo && todas.indexOf(x) < 0) todas.push(x); }); });
      ex.push({ tipo: tipo, q: 'Complete a frase', destaque: f[0].replace(alvo, '____'), sub: f[1], certo: alvo, ops: shuffle([alvo].concat(shuffle(todas).slice(0, 3))), dica: 'A frase completa é “' + f[0] + '” (' + f[1] + ').', audioFim: f[0] });
    } else if (tipo === 'frase-en2pt') {
      var e = pick(ped.est.ex.concat(ped.dlg.map(function (d) { return [d[1], d[2]]; }))), base = ped.est.ex.concat(ped.dlg.map(function (d) { return [d[1], d[2]]; }));
      ex.push({ tipo: tipo, q: 'Traduza para o português', destaque: e[0], audio: e[0], certo: e[1], ops: shuffle([e[1]].concat(shuffle(base.filter(function (b) { return b[1] !== e[1]; })).slice(0, 3).map(function (b) { return b[1]; }))), dica: '“' + e[0] + '” = ' + e[1] });
    } else {
      var d0 = pick(ped.dlg), bd = ped.dlg.concat(ped.est.ex.map(function (e2) { return ['', e2[0], e2[1]]; }));
      ex.push({ tipo: tipo, q: 'Como se diz em inglês?', destaque: d0[2], certo: d0[1], ops: shuffle([d0[1]].concat(shuffle(bd.filter(function (b) { return b[1] !== d0[1]; })).slice(0, 3).map(function (b) { return b[1]; }))), dica: '“' + d0[2] + '” = ' + d0[1] });
    }
  }
  return ex;
}
function telaPratique() {
  var A = AULA;
  if (!A.ex) A.ex = gerarExercicios(A.l.itens, [A.p], 6, A.p.c.concat(A.p.est.ex.map(function (e) { return [e[0].replace(/[.,!?]/g, ''), e[1]]; })));
  if (A.k < A.ex.length) return telaQuestao(A.ex[A.k], 'Pratique · exercício ' + (A.k + 1) + ' de ' + (A.ex.length + 1), 5);
  var p = A.p, ult = p.dlg.filter(function (d) { return d[0] !== 'A'; }).slice(-1)[0] || p.dlg[p.dlg.length - 1];
  return '<div class="card"><div class="lbl"><i>5</i>Pratique · diálogo</div><p class="sub">Ouça a conversa. Toque em uma linha para ouvir só ela.</p><ul class="dlg">' +
    p.dlg.map(function (d) { return '<li><span class="who' + (d[0] === 'A' ? '' : ' b') + '">' + esc(d[0]) + '</span><div class="t"><b lang="en">' + esc(d[1]) + '</b><span>' + esc(d[2]) + '</span></div><button class="play" type="button" data-act="falar" data-t="' + esc(d[1]) + '" aria-label="Ouvir">' + ico('play') + '</button></li>'; }).join('') +
    '</ul><button class="btn btn-s full" type="button" data-act="dlg-todo" style="margin-top:10px">' + ico('play') + 'Ouvir o diálogo completo</button></div>' +
    '<div class="card"><div class="lbl">Desafio de conversação</div><p>Agora é a sua vez. Você é a pessoa <b>' + esc(ult[0]) + '</b>. Responda em voz alta:</p><p class="q" lang="en">“' + esc(ult[1]) + '”</p><p class="sub">' + esc(ult[2]) + '</p>' +
    '<div class="mic" style="margin-top:12px"><button class="micb" type="button" id="micBtn" data-act="mic-dlg" aria-label="Toque para falar">' + ico('mic') + '</button><div class="st" id="micSt"><b>Toque para falar</b><span class="note">Sem pressão: pode tentar quantas vezes quiser</span></div></div><div id="micFb"></div></div>' +
    '<button class="btn btn-p full" type="button" data-act="p-fim" style="margin-top:14px">Ir para Revise ' + ico('right') + '</button>';
}
function telaQuestao(q, rot, etapa) {
  var h = '<div class="card"><div class="lbl">' + (etapa ? '<i>' + etapa + '</i>' : '') + esc(rot) + '</div><p class="sub">' + esc(q.q) + '</p>';
  if (q.destaque) h += '<p class="q"' + (/en|completar|ouvir/.test(q.tipo) && q.tipo !== 'pt2en' && q.tipo !== 'frase-pt2en' ? ' lang="en"' : '') + '>' + esc(q.destaque) + '</p>';
  if (q.sub) h += '<p class="sub" style="margin:-6px 0 12px">' + esc(q.sub) + '</p>';
  if (q.audio) h += '<div class="row" style="margin-bottom:12px"><button class="btn btn-s" type="button" data-act="falar" data-t="' + esc(q.audio) + '">' + ico('play') + 'Ouvir</button><button class="btn btn-o" type="button" data-act="falar" data-t="' + esc(q.audio) + '" data-lento="1">' + ico('slow') + 'Lento</button></div>';
  h += '<div class="opts">' + q.ops.map(function (o) { var c = q.resp ? (o === q.certo ? ' right' : o === q.resp ? ' wrong' : '') : ''; return '<button class="opt' + c + '" type="button" data-act="resp" data-o="' + esc(o) + '"' + (q.resp ? ' disabled' : '') + '>' + esc(o) + '</button>'; }).join('') + '</div>';
  if (q.resp) h += q.resp === q.certo ? '<div class="fb ok"><b>' + ico('check') + ' Correto!</b> ' + esc(q.dica) + '</div>' : '<div class="fb err"><b>Não foi dessa vez.</b> ' + TUTOR.explicarErro(q.certo, q.resp, esc(q.dica)) + '</div>';
  h += '</div>' + (q.resp ? '<button class="btn btn-p full" type="button" data-act="q-prox" style="margin-top:14px">Continuar ' + ico('right') + '</button>' : '');
  if (q.auto && !q.tocou) { q.tocou = true; setTimeout(function () { falar(q.audio); }, 350); }
  return h;
}

/* etapa 6: revise */
function telaRevise() {
  var A = AULA;
  if (!A.revIni) {
    A.revIni = true; A.class = {};
    A.l.itens.forEach(function (it) { var w = it[0], r = A.rec[w]; A.class[w] = A.erros[w] ? 'dificil' : (r && r.nivel === 'clara' ? 'dominada' : 'aprendendo'); });
    A.antigas = shuffle(pendentes().filter(function (w) { return !A.l.itens.some(function (it) { return it[0] === w; }); })).slice(0, 3); A.ai = 0; A.mostrou = false;
  }
  var h = '<div class="card"><div class="lbl"><i>6</i>Revise</div><p>Como você se sente com cada palavra desta aula? A sua escolha define quando ela volta para revisão.</p>' +
    '<p class="note" style="margin:6px 0 4px"><b style="color:var(--err)">Difícil</b>: volta amanhã · <b style="color:var(--warn)">Aprendendo</b>: em 3 dias · <b style="color:var(--ok)">Dominada</b>: em 1 semana</p>' +
    A.l.itens.map(function (it) { var w = it[0], c = A.class[w]; return '<div class="wl" style="display:block"><div style="display:flex;gap:10px;align-items:center"><button class="play" type="button" data-act="falar" data-t="' + esc(w) + '" aria-label="Ouvir">' + ico('play') + '</button><div class="t"><b lang="en">' + esc(w) + '</b><span>' + esc(it[2]) + '</span></div></div><div class="rate">' +
      [['dificil', 'Difícil'], ['aprendendo', 'Aprendendo'], ['dominada', 'Dominada']].map(function (o) { return '<button type="button" data-act="cls" data-w="' + esc(w) + '" data-v="' + o[0] + '" class="' + (c === o[0] ? 'on' : '') + '" aria-pressed="' + (c === o[0]) + '">' + o[1] + '</button>'; }).join('') + '</div></div>'; }).join('') + '</div>';
  if (A.antigas.length && A.ai < A.antigas.length) {
    var w = A.antigas[A.ai], it = itemDe(w);
    h += '<div class="card"><div class="lbl">Revisão de aulas anteriores · ' + (A.ai + 1) + ' de ' + A.antigas.length + '</div><p class="sub">Você lembra como se diz em inglês?</p><p class="q">“' + esc(it[2]) + '”</p>' +
      (A.mostrou ? '<div class="ex"><button class="play" type="button" data-act="falar" data-t="' + esc(w) + '" aria-label="Ouvir">' + ico('play') + '</button><div class="t"><b lang="en" style="font-size:1.2rem">' + esc(w) + '</b><span>' + esc(it[1]) + '</span></div></div><div class="rate">' +
        [['dificil', 'Não lembrei'], ['aprendendo', 'Lembrei com esforço'], ['dominada', 'Lembrei fácil']].map(function (o) { return '<button type="button" data-act="ant-cls" data-v="' + o[0] + '">' + o[1] + '</button>'; }).join('') + '</div>'
        : '<button class="btn btn-s full" type="button" data-act="mostrar">Mostrar a resposta</button>') + '</div>';
  }
  h += '<button class="btn btn-p full" type="button" data-act="concluir" style="margin-top:14px">Concluir a aula ' + ico('check') + '</button>';
  return h;
}
function concluirAula() {
  var A = AULA;
  Object.keys(A.class).forEach(function (w) { classificar(w, A.class[w]); });
  var pct = A.total ? Math.round(A.acertos / A.total * 100) : 100, primeira = !S.done[A.id];
  S.done[A.id] = { d: hoje(), pct: pct };
  estudou('Concluiu ' + (A.dia != null ? 'o dia ' + (A.dia + 1) + ': ' : 'a aula bônus: ') + A.l.titulo);
  A.fase = 'fim'; A.pct = pct; A.primeira = primeira; renderAula(); scrollTo(0, 0); plim(); festa();
}
function telaFimAula() {
  var A = AULA, prox = diaAtual(), med = novasMedalhas.splice(0);
  var h = '<div class="card big-ok"><div class="ic">' + ico('check') + '</div><h1 class="h1">Aula concluída!</h1><p class="sub" style="margin-top:6px">' + (A.dia != null ? 'Dia ' + (A.dia + 1) + ' de 30 · ' : '') + esc(A.l.titulo) + '</p>' +
    '<div class="stats" style="margin-top:16px;text-align:left">' + stat(A.l.itens.length, 'palavras estudadas') + stat(A.pct + '%', 'acertos nos exercícios') + stat(A.frasesOk, 'frases praticadas') + '</div></div>';
  if (med.length) h += '<div class="card"><b>Nova conquista!</b>' + med.map(function (m) { return '<div class="goal" style="margin-top:10px"><span class="ck on">' + ico('award') + '</span><div><b>' + esc(m.n) + '</b><div class="sub">' + esc(m.r) + '</div></div></div>'; }).join('') + '</div>';
  h += '<div class="row" style="margin-top:14px">' + (prox < DIAS.length ? '<button class="btn btn-p" type="button" data-act="abrir-dia" data-i="' + prox + '">Próximo: Dia ' + (prox + 1) + ' ' + ico('right') + '</button>' : '') + '<button class="btn btn-o" type="button" data-act="ir" data-tab="inicio">Voltar ao início</button></div>';
  return h;
}

/* ================= avaliações ================= */
function abrirAvaliacao(d, diaIdx) {
  var mods = d.tipo === 'final' ? MODULOS : [MODULOS[d.m]], itens = [], peds = [], sent = [];
  mods.forEach(function (m) { m.aulas.forEach(function (id) { itens = itens.concat(lic(id).itens); peds.push(PED[id]); sent = sent.concat(PED[id].c); }); });
  var n = d.tipo === 'final' ? 20 : 12;
  AULA = { tipo: 'aval', d: d, dia: diaIdx, qs: gerarExercicios(itens, peds, n, sent), k: 0, acertos: 0, erros: [] };
  setNav(false); renderAval(); scrollTo(0, 0);
}
function renderAval() {
  var A = AULA, t = A.d.tipo === 'final' ? 'Avaliação final' : 'Avaliação do Módulo ' + (A.d.m + 1), v = $('#view');
  if (A.k === 0 && !A.ini) {
    v.innerHTML = cabecalho(t, 'Dia ' + (A.dia + 1) + ' de 30') + '<div class="card"><h1 class="h1">' + esc(t) + '</h1><p class="sub" style="margin-top:6px">' + A.qs.length + ' questões sobre ' + (A.d.tipo === 'final' ? 'todo o curso' : 'as aulas do módulo “' + esc(MODULOS[A.d.m].nome) + '”') + '. Para ser aprovado(a), acerte 70% ou mais. Você pode refazer quantas vezes quiser.</p>' +
      '<button class="btn btn-p full" type="button" data-act="av-ini" style="margin-top:16px">Começar ' + ico('right') + '</button></div>';
    return;
  }
  if (A.k < A.qs.length) { v.innerHTML = cabecalho(t, 'Questão ' + (A.k + 1) + ' de ' + A.qs.length) + '<div class="bar" style="margin-bottom:14px"><i style="width:' + Math.round(A.k / A.qs.length * 100) + '%"></i></div>' + telaQuestao(A.qs[A.k], 'Questão ' + (A.k + 1)); return; }
  var pct = Math.round(A.acertos / A.qs.length * 100), ok = pct >= 70, ant = S.aval[A.d.id];
  if (!A.salvo) { A.salvo = true; S.aval[A.d.id] = { ok: ok || !!(ant && ant.ok), pct: Math.max(pct, ant ? ant.pct : 0), d: hoje() };
    estudou((ok ? 'Aprovado(a) na ' : 'Fez a ') + t.toLowerCase().replace('avaliação', 'avaliação') + ' (' + pct + '%)'); if (ok) { plim(); festa(); } }
  var med = novasMedalhas.splice(0);
  var h = '<div class="card big-ok"><div class="ic" style="' + (ok ? '' : 'background:var(--warn-s);color:var(--warn)') + '">' + ico(ok ? 'award' : 'rep') + '</div><h1 class="h1">' + (ok ? (A.d.tipo === 'final' ? 'Você concluiu o Fala Fácil!' : 'Módulo ' + (A.d.m + 1) + ' concluído!') : 'Quase lá!') + '</h1>' +
    '<p class="sub" style="margin-top:6px">Você acertou ' + A.acertos + ' de ' + A.qs.length + ' (' + pct + '%).' + (ok ? '' : ' Para ser aprovado(a), são 70%. Revise as palavras abaixo e tente de novo.') + '</p></div>';
  if (A.erros.length) h += '<div class="card"><b>Para revisar</b>' + A.erros.map(function (e) { return '<div class="wl"><div class="t"><b>' + esc(e.certo) + '</b><span>' + esc(e.dica) + '</span></div></div>'; }).join('') + '</div>';
  if (med.length) h += '<div class="card"><b>Nova conquista!</b>' + med.map(function (m) { return '<div class="goal" style="margin-top:10px"><span class="ck on">' + ico('award') + '</span><div><b>' + esc(m.n) + '</b><div class="sub">' + esc(m.r) + '</div></div></div>'; }).join('') + '</div>';
  var prox = diaAtual();
  h += '<div class="row" style="margin-top:14px">' + (ok && A.d.tipo === 'final' ? '<button class="btn btn-p" type="button" data-act="certificado">Ver o meu certificado</button>' : ok && prox < DIAS.length ? '<button class="btn btn-p" type="button" data-act="abrir-dia" data-i="' + prox + '">Próximo: Dia ' + (prox + 1) + ' ' + ico('right') + '</button>' : '<button class="btn btn-p" type="button" data-act="abrir-dia" data-i="' + A.dia + '">Tentar de novo</button>') +
    '<button class="btn btn-o" type="button" data-act="ir" data-tab="inicio">Voltar ao início</button></div>';
  v.innerHTML = h;
}

/* ================= revisão do dia ================= */
function abrirRevisao() {
  var lista = shuffle(TUTOR.sugerirRevisao()); if (!lista.length) { toast('Nenhuma palavra para revisar agora.'); return; }
  AULA = { tipo: 'rev', lista: lista, k: 0, mostrou: false, feitas: 0 }; setNav(false); renderRev(); scrollTo(0, 0);
}
function renderRev() {
  var A = AULA, v = $('#view');
  if (A.k >= A.lista.length) { estudou('Revisou ' + A.feitas + ' palavra' + (A.feitas > 1 ? 's' : '')); v.innerHTML = '<div class="card big-ok"><div class="ic">' + ico('check') + '</div><h1 class="h1">Revisão concluída!</h1><p class="sub" style="margin-top:6px">' + A.feitas + ' palavras revisadas. Cada uma volta no momento certo.</p></div><button class="btn btn-p full" type="button" data-act="ir" data-tab="inicio" style="margin-top:14px">Voltar ao início</button>'; plim(); return; }
  var w = A.lista[A.k], it = itemDe(w);
  v.innerHTML = cabecalho('Revisão do dia', 'Palavra ' + (A.k + 1) + ' de ' + A.lista.length) + '<div class="bar" style="margin-bottom:14px"><i style="width:' + Math.round(A.k / A.lista.length * 100) + '%"></i></div>' +
    '<div class="card"><p class="sub">Como se diz em inglês?</p><p class="q" style="font-size:1.5rem">“' + esc(it[2]) + '”</p><p class="note">Tente lembrar e falar em voz alta antes de ver a resposta.</p>' +
    (A.mostrou ? '<div class="sec"><div class="ex"><button class="play" type="button" data-act="falar" data-t="' + esc(w) + '" aria-label="Ouvir">' + ico('play') + '</button><div class="t"><b lang="en" style="font-size:1.4rem">' + esc(w) + '</b><span>Guia aproximado: ' + esc(it[1]) + '</span></div></div><div class="rate" style="margin-top:14px">' +
      [['dificil', 'Não lembrei'], ['aprendendo', 'Com esforço'], ['dominada', 'Lembrei fácil']].map(function (o) { return '<button type="button" data-act="rev-cls" data-v="' + o[0] + '">' + o[1] + '</button>'; }).join('') + '</div></div>'
      : '<button class="btn btn-p full" type="button" data-act="rev-mostra" style="margin-top:14px">Mostrar a resposta</button>') + '</div>';
  if (A.mostrou) falar(w);
}

/* ================= modais ================= */
function modal(html) { $('#modalRoot').innerHTML = '<div class="modal" role="dialog" aria-modal="true"><div class="box">' + html + '<button class="btn btn-o full" type="button" data-act="fechar" style="margin-top:14px">Fechar</button></div></div>'; }
document.addEventListener('keydown', function (e) { if (e.key === 'Escape') $('#modalRoot').innerHTML = ''; });
function ajudaMic() {
  modal('<h3>Como ativar o microfone</h3><p><b>Android (Google Chrome):</b> toque no cadeado ao lado do endereço do site → Permissões → Microfone → Permitir. Depois, recarregue a página.</p>' +
    '<p><b>iPhone (Safari):</b> o reconhecimento de fala usa o Ditado do iPhone. Vá em Ajustes → Geral → Teclado → ative “Ditado”. Depois, em Ajustes → Safari → Microfone → Permitir.</p>' +
    '<p><b>Computador (Chrome ou Edge):</b> clique no cadeado ao lado do endereço → Microfone → Permitir, e recarregue.</p>' +
    '<p class="note">Importante: o microfone só funciona quando o site é aberto pela internet (endereço começando com https). O reconhecimento indica se a fala foi entendida, mas não substitui um professor na avaliação do sotaque.</p>');
}
function guiaSom(s) { var x = SONS[s];
  modal('<h3>' + esc(x.t) + '</h3><p><b>Como fazer:</b> ' + esc(x.como) + '</p><p><b>Evite:</b> ' + esc(x.evite) + '</p><p><b>Escute exemplos:</b></p><div class="row">' + x.ex.map(function (e) { return '<button class="btn btn-s" type="button" data-act="falar" data-t="' + esc(e) + '">' + ico('play') + esc(e) + '</button>'; }).join('') + '</div>');
}
function abrirConfig() {
  var pt = vozes.filter(function (v) { return /^pt/i.test(v.lang); }), en = vozes.filter(function (v) { return /^en/i.test(v.lang); });
  function ops(l, cur) { return '<option value="">Automática (recomendada)</option>' + l.map(function (v) { return '<option value="' + esc(v.name) + '"' + (v.name === cur ? ' selected' : '') + '>' + esc(v.name) + ' (' + esc(v.lang) + ')</option>'; }).join(''); }
  modal('<h3>Configurações</h3><label class="field"><span>Aparência</span><select id="cfTema"><option value="auto"' + (S.tema === 'auto' ? ' selected' : '') + '>Automático (igual ao celular)</option><option value="claro"' + (S.tema === 'claro' ? ' selected' : '') + '>Fundo claro</option><option value="escuro"' + (S.tema === 'escuro' ? ' selected' : '') + '>Fundo escuro</option></select></label><label class="field"><span>Seu nome</span><input id="cfNome" value="' + esc(S.nome) + '" autocomplete="given-name"></label>' +
    '<label class="field"><span>Voz em inglês</span><select id="cfEn">' + ops(en, S.vozEn) + '</select></label><button class="btn btn-s" type="button" data-act="falar" data-t="Hello! Nice to meet you.">' + ico('play') + 'Testar voz em inglês</button>' +
    '<label class="field"><span>Voz em português</span><select id="cfPt">' + ops(pt, S.vozPt) + '</select></label>' +
    '<p class="note">As vozes vêm do seu aparelho. Experimente e escolha a mais clara. No Android, as vozes “Google” costumam ser as melhores.</p>' +
    '<div class="row" style="margin-top:12px"><button class="btn btn-o" type="button" data-act="ajuda-mic">Ajuda com o microfone</button><button class="btn btn-o" type="button" data-act="sons">Sons difíceis</button></div>' +
    '<button class="btn btn-p full" type="button" data-act="cf-salvar" style="margin-top:12px">Salvar</button>' +
    '<p class="note" style="margin-top:14px">O seu progresso fica salvo automaticamente neste aparelho e navegador.</p><button class="btn-g" type="button" data-act="zerar" style="color:var(--err)">Apagar o progresso e recomeçar</button>');
}
function certificado() {
  if (!(S.aval.final && S.aval.final.ok)) { toast('O certificado fica disponível após a aprovação na avaliação final.'); return; }
  setNav(true); AULA = null;
  $('#view').innerHTML = '<div class="cert"><div class="k">Certificado de conclusão</div><h2>Fala Fácil · Inglês do zero</h2><p>Certificamos que</p><div class="nm">' + esc(S.nome || 'Aluno(a) Fala Fácil') + '</div>' +
    '<p>concluiu a jornada de 30 dias do curso Fala Fácil, com 25 aulas e 5 avaliações, estudando ' + aprendidas() + ' palavras e expressões em inglês.</p><p class="note" style="margin-top:14px">Concluído em ' + dataBR(S.aval.final.d) + '/' + S.aval.final.d.slice(0, 4) + ' · Aproveitamento na avaliação final: ' + S.aval.final.pct + '%</p></div>' +
    '<label class="field"><span>Nome no certificado</span><input id="certNome" value="' + esc(S.nome) + '"></label><div class="row"><button class="btn btn-o" type="button" data-act="cert-nome">Atualizar nome</button><button class="btn btn-p" type="button" data-act="imprimir">Salvar ou imprimir</button></div>';
}

/* ================= ações ================= */
document.addEventListener('click', function (e) {
  var b = e.target.closest('[data-act]'); if (!b) return;
  var a = b.dataset.act, A = AULA;
  switch (a) {
    case 'onb-next': if (onbPasso === 1) { S.nome = ($('#onbNome').value || '').trim().slice(0, 40); save(); } onbPasso++; render(); scrollTo(0, 0); break;
    case 'onb-som': falar('Hello'); break;
    case 'onb-fim': S.onb = true; save(); pararMic(); ir('inicio'); break;
    case 'falar': falar(b.dataset.t, { lento: !!b.dataset.lento }); break;
    case 'ajuda-mic': ajudaMic(); break;
    case 'som': guiaSom(b.dataset.s); break;
    case 'sons': modal('<h3>Sons difíceis do inglês</h3><p>Escolha um som para ver como fazer:</p><div class="opts">' + Object.keys(SONS).map(function (s) { return '<button class="opt" type="button" data-act="som" data-s="' + s + '">' + esc(SONS[s].t) + '</button>'; }).join('') + '</div>'); break;
    case 'fechar': $('#modalRoot').innerHTML = ''; break;
    case 'ir': ir(b.dataset.tab); break;
    case 'abrir-dia': $('#modalRoot').innerHTML = ''; abrirDia(+b.dataset.i); break;
    case 'abrir-aula': abrirAula(b.dataset.id, null); break;
    case 'revisao': abrirRevisao(); break;
    case 'certificado': certificado(); break;
    case 'filtro': filtroRev = b.dataset.f; render(); break;
    case 'fav': var x = W(b.dataset.w); x.fav = !x.fav; if (!x.seen) x.seen = hoje(); save(); b.classList.toggle('on', x.fav); toast(x.fav ? 'Adicionada às favoritas' : 'Removida das favoritas'); if (!A) render(); break;
    case 'sair-aula': pararMic(); if (synth) synth.cancel(); if (A && A.tipo === 'aula' && A.fase !== 'fim' && !confirm('Sair da aula? O que você já estudou fica salvo, mas a aula só conta como concluída no final.')) break; ir(ABA); break;
    case 'mic': var it = A.l.itens[A.i];
      ouvir([it[0]].concat(it[4] || []), { btn: $('#micBtn'), status: $('#micSt') }, function (r) { if (AULA !== A) return; if (r.nivel !== 'erro' && r.nivel !== 'sem-suporte') A.rec[it[0]] = r; var fb = $('#micFb'); if (fb) fb.innerHTML = fbHtml(msgFala(r, it[0])); if (r.nivel === 'clara') plim(); }); break;
    case 'mic-dlg': var ult = A.p.dlg.filter(function (d) { return d[0] !== 'A'; }).slice(-1)[0] || A.p.dlg[A.p.dlg.length - 1];
      ouvir([ult[1]], { btn: $('#micBtn'), status: $('#micSt') }, function (r) { if (AULA !== A) return; var fb = $('#micFb'); if (fb) fb.innerHTML = fbHtml(msgFala(r, ult[1])); if (r.nivel === 'clara' || r.nivel === 'reconhecida') { A.frasesOk++; S.frases++; save(); plim(); } }); break;
    case 'ant': pararMic(); A.i--; renderAula(); scrollTo(0, 0); break;
    case 'prox': pararMic(); if (A.i < A.l.itens.length - 1) A.i++; else { A.fase = 'construa'; A.k = 0; } renderAula(); scrollTo(0, 0); break;
    case 'c-ini': A.cIntro = true; renderAula(); break;
    case 'c-poe': var st = A.cState, n = +b.dataset.n; if (st.banco[n].u) break; st.banco[n].u = true; st.sel.push(n); renderAula(); break;
    case 'c-tira': var st2 = A.cState, n2 = +b.dataset.n; st2.banco[n2].u = false; st2.sel = st2.sel.filter(function (x) { return x !== n2; }); renderAula(); break;
    case 'c-limpa': A.cState.banco.forEach(function (x) { x.u = false; }); A.cState.sel = []; renderAula(); break;
    case 'c-ver': var s3 = A.cState, frase = A.p.c[A.k][0], resp = s3.sel.map(function (x) { return s3.banco[x].t; }).join(' ');
      A.total++; if (norm(resp) === norm(frase)) { s3.res = 'ok'; A.acertos++; A.frasesOk++; S.frases++; save(); plim(); } else s3.res = 'err';
      renderAula(); falar(frase); break;
    case 'c-prox': A.k++; A.cState = null; if (A.k >= A.p.c.length) { A.fase = 'pratique'; A.k = 0; } renderAula(); scrollTo(0, 0); break;
    case 'resp': var q = A.tipo === 'aval' ? A.qs[A.k] : A.ex[A.k], o = b.dataset.o; if (q.resp) break; q.resp = o;
      if (o === q.certo) { if (A.tipo === 'aval') A.acertos++; else { A.acertos++; } plim(); } else { if (q.w) { errou(q.w); if (A.erros && A.tipo === 'aula') A.erros[q.w] = 1; } if (A.tipo === 'aval') A.erros.push(q); }
      if (A.tipo === 'aula') A.total++; save();
      if (A.tipo === 'aval') renderAval(); else renderAula();
      if (q.audioFim) falar(q.audioFim); break;
    case 'q-prox': A.k++; if (A.tipo === 'aval') renderAval(); else renderAula(); scrollTo(0, 0); break;
    case 'dlg-todo': var linhas = A.p.dlg.slice(), idx = 0; (function prox() { if (idx >= linhas.length || AULA !== A) return; var l = linhas[idx++]; falar(l[1], { pitch: l[0] === 'A' ? 1 : 1.25, fim: function () { setTimeout(prox, 350); } }); })(); break;
    case 'p-fim': pararMic(); A.fase = 'revise'; renderAula(); scrollTo(0, 0); break;
    case 'cls': A.class[b.dataset.w] = b.dataset.v; $$('.rate button[data-w="' + CSS.escape(b.dataset.w) + '"]').forEach(function (x) { var on = x.dataset.v === b.dataset.v; x.classList.toggle('on', on); x.setAttribute('aria-pressed', on); }); break;
    case 'mostrar': A.mostrou = true; renderAula(); falar(A.antigas[A.ai]); break;
    case 'ant-cls': classificar(A.antigas[A.ai], b.dataset.v); S.revs++; save(); A.ai++; A.mostrou = false; renderAula(); break;
    case 'concluir': concluirAula(); break;
    case 'av-ini': A.ini = true; renderAval(); break;
    case 'rev-mostra': A.mostrou = true; renderRev(); break;
    case 'rev-cls': classificar(A.lista[A.k], b.dataset.v); S.revs++; A.feitas++; save(); A.k++; A.mostrou = false; renderRev(); break;
    case 'cf-salvar': S.nome = ($('#cfNome').value || '').trim().slice(0, 40); S.vozEn = $('#cfEn').value; S.vozPt = $('#cfPt').value; S.tema = $('#cfTema').value; save(); aplicarTema(); $('#modalRoot').innerHTML = ''; toast('Configurações salvas'); if (!AULA) render(); break;
    case 'zerar': if (confirm('Apagar todo o progresso deste aparelho? Esta ação não pode ser desfeita.')) { try { localStorage.removeItem(KEY); } catch (er) {} location.reload(); } break;
    case 'cert-nome': S.nome = ($('#certNome').value || '').trim().slice(0, 40); save(); certificado(); break;
    case 'imprimir': window.print(); break;
  }
});
document.addEventListener('click', function (e) {
  if (e.target.id === 'onbMic' || e.target.closest('#onbMic')) {
    ouvir(['hello'], { btn: $('#onbMic'), status: $('#onbSt') }, function (r) {
      var m = r.nivel === 'clara' || r.nivel === 'reconhecida' ? { c: 'ok', h: '<b>' + ico('check') + ' Tudo certo!</b> O microfone está funcionando e reconheceu “' + esc(r.ouvido) + '”.' } : msgFala(r, 'Hello');
      var fb = $('#onbFb'); if (fb) fb.innerHTML = fbHtml(m);
    });
  }
});
document.addEventListener('click', function (e) { if (e.target.classList && e.target.classList.contains('modal')) $('#modalRoot').innerHTML = ''; });

aplicarTema(); conquistas(); novasMedalhas = [];
$$('.tab').forEach(function (t) { t.classList.toggle('on', t.dataset.tab === ABA); });
render();
