/* Fala Fácil · aplicativo do aluno (versão 3)
   Organização: utilidades → estado e backup → tempo de estudo → revisão espaçada → curso → conquistas e níveis
   → voz → microfone → exercícios → telas → sessões (aula, avaliação, revisão, estudo rápido, desafio) → ações.
   O tutor com IA (futuro) entra pelo objeto TUTOR; hoje ele usa regras locais. */
'use strict';
var CONFIG = { whatsapp: '5551993759314', versao: '3.1', ia: { ativo: false, endpoint: '' } };

/* ================= utilidades ================= */
var $ = function (s, r) { return (r || document).querySelector(s); };
var $$ = function (s, r) { return [].slice.call((r || document).querySelectorAll(s)); };
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function ico(id, cls) { return '<svg class="i ' + (cls || '') + '" aria-hidden="true"><use href="#i-' + id + '"/></svg>'; }
function iso(d) { return d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2); }
function hoje() { return iso(new Date()); }
function addDias(s, n) { var p = s.split('-'); return iso(new Date(+p[0], +p[1] - 1, +p[2] + n)); }
function dataBR(s) { var p = s.split('-'); return p[2] + '/' + p[1]; }
var DIASEM = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sáb'];
function diaSem(s) { var p = s.split('-'); return DIASEM[new Date(+p[0], +p[1] - 1, +p[2]).getDay()]; }
var rnd = Math.random;
function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rnd() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
function pick(a) { return a[Math.floor(rnd() * a.length)]; }
function semente(str) { var h = 1779033703 ^ str.length; for (var i = 0; i < str.length; i++) { h = Math.imul(h ^ str.charCodeAt(i), 3432918353); h = h << 13 | h >>> 19; }
  return function () { h = Math.imul(h ^ h >>> 16, 2246822507); h = Math.imul(h ^ h >>> 13, 3266489909); h ^= h >>> 16; return (h >>> 0) / 4294967296; }; }
function minutos(seg) { var m = Math.round(seg / 60); return m < 60 ? m + ' min' : Math.floor(m / 60) + 'h' + (m % 60 ? ' ' + m % 60 + 'min' : ''); }
var toastT;
function toast(m) { var t = $('#toast'); t.textContent = m; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove('show'); }, 3600); }

/* ================= estado, backup e dados corrompidos ================= */
var KEY = 'falafacil_v2', KEY_BAK = 'falafacil_v2_backup';
function padrao() { return { versao: 3, tema: 'auto', onb: false, nome: '', metaMin: 10, w: {}, done: {}, aval: {}, days: {}, hist: [], frases: 0, revs: 0, medals: {},
  vozPt: '', vozEn: '', st: {}, tempo: {}, revDia: {}, desafio: {}, lembrete: { on: false, hora: '19:00', ultimo: '' }, bak: '' }; }
var S = padrao(), AVISO_DADOS = '';
function validar(d) {
  var x = Object.assign(padrao(), d && typeof d === 'object' ? d : {});
  ['w', 'done', 'aval', 'days', 'medals', 'st', 'tempo', 'revDia', 'desafio'].forEach(function (k) { if (!x[k] || typeof x[k] !== 'object' || Array.isArray(x[k])) x[k] = {}; });
  if (!Array.isArray(x.hist)) x.hist = [];
  if (!x.lembrete || typeof x.lembrete !== 'object') x.lembrete = padrao().lembrete;
  x.metaMin = +x.metaMin; if ([5, 10, 15, 20].indexOf(x.metaMin) < 0) x.metaMin = 10;
  Object.keys(x.w).forEach(function (k) { var y = x.w[k]; if (!y || typeof y !== 'object') { delete x.w[k]; return; } if (!y.ef) y.ef = 2.3; if (!y.ivl) y.ivl = 1; if (y.err == null) y.err = 0; });
  ['frases', 'revs'].forEach(function (k) { x[k] = +x[k] || 0; });
  x.versao = 3; return x;
}
(function carregar() {
  var raw = null; try { raw = localStorage.getItem(KEY); } catch (e) {}
  if (raw) {
    try { S = validar(JSON.parse(raw)); }
    catch (e) {
      try { localStorage.setItem(KEY + '_corrompido', raw); } catch (e2) {}
      try { var b = localStorage.getItem(KEY_BAK); if (b) { S = validar(JSON.parse(b)); AVISO_DADOS = 'recuperado'; } else { S = padrao(); AVISO_DADOS = 'perdido'; } } catch (e3) { AVISO_DADOS = 'perdido'; S = padrao(); }
    }
  } else {
    try { var v1 = JSON.parse(localStorage.getItem('falafacil_v1') || 'null'); if (v1 && v1.ok) Object.keys(v1.ok).forEach(function (w) { S.w[w] = { st: 'aprendendo', due: hoje(), ivl: 1, ef: 2.3, n: 1, err: 0, fav: false, seen: hoje() }; }); } catch (e) {}
  }
})();
function save() {
  try { var j = JSON.stringify(S); localStorage.setItem(KEY, j); if (JSON.parse(localStorage.getItem(KEY)).versao) localStorage.setItem(KEY_BAK, j); }
  catch (e) { if (!save.avisou) { save.avisou = true; toast('Não foi possível salvar o progresso neste navegador (modo anônimo ou memória cheia).'); } }
}
function exportar() {
  var blob = new Blob([JSON.stringify(S, null, 1)], { type: 'application/json' }), a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = 'fala-facil-progresso-' + hoje() + '.json'; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(function () { URL.revokeObjectURL(a.href); }, 2000); toast('Arquivo de backup salvo no aparelho.');
}
function importar(file) {
  var r = new FileReader();
  r.onload = function () { try { var d = JSON.parse(r.result); if (!d || typeof d.w !== 'object') throw 0; S = validar(d); save(); fecharModal(); toast('Progresso restaurado!'); aplicarTema(); ir('inicio'); }
    catch (e) { toast('Este arquivo não é um backup válido do Fala Fácil.'); } };
  r.readAsText(file);
}

/* ================= tema ================= */
var mqEscuro = matchMedia('(prefers-color-scheme: dark)');
function temaAtual() { return S.tema === 'auto' ? (mqEscuro.matches ? 'escuro' : 'claro') : S.tema; }
function aplicarTema() {
  var t = temaAtual(); document.documentElement.dataset.theme = t;
  var ic = document.getElementById('temaIc'); if (ic) ic.innerHTML = '<use href="#i-' + (t === 'escuro' ? 'sun' : 'moon') + '"/>';
  var b = document.getElementById('temaBtn'); if (b) b.setAttribute('aria-label', t === 'escuro' ? 'Usar fundo claro' : 'Usar fundo escuro');
  var m = document.querySelector('meta[name="theme-color"]'); if (m) m.content = t === 'escuro' ? '#0b1220' : '#2563eb';
}
if (mqEscuro.addEventListener) mqEscuro.addEventListener('change', function () { if (S.tema === 'auto') aplicarTema(); });

/* ================= histórico, sequência e tempo de estudo ================= */
function estudou(txt) { S.days[hoje()] = 1; S.hist.unshift({ d: hoje(), t: txt }); S.hist = S.hist.slice(0, 60); save(); conquistas(); }
function sequencia() { var d = hoje(), n = 0; if (!S.days[d]) d = addDias(d, -1); while (S.days[d]) { n++; d = addDias(d, -1); } return n; }
function tempoHoje() { return S.tempo[hoje()] || 0; }
function tempoTotal() { return Object.keys(S.tempo).reduce(function (t, k) { return t + S.tempo[k]; }, 0); }
var ultimaAcao = Date.now();
['click', 'keydown', 'touchstart'].forEach(function (ev) { addEventListener(ev, function () { ultimaAcao = Date.now(); }, { passive: true }); });
setInterval(function () {
  if (document.visibilityState !== 'visible' || !SESSAO || Date.now() - ultimaAcao > 90000) return;
  var d = hoje(); S.tempo[d] = (S.tempo[d] || 0) + 15;
  if (S.tempo[d] >= 120 && !S.days[d]) S.days[d] = 1;
  save();
}, 15000);
function metaCumprida() { var d = hoje(); return tempoHoje() >= S.metaMin * 60 || (S.revDia[d] || 0) >= 10 || S.hist.some(function (h) { return h.d === d && /^Concluiu/.test(h.t); }); }

/* ================= desempenho por habilidade ================= */
var HAB = { vocab: 'Vocabulário', escuta: 'Escuta', constr: 'Construção de frases', trad: 'Compreensão de frases', recall: 'Lembrar sem pistas', fala: 'Fala' };
function reg(hab, primeira, final) { var x = S.st[hab] || (S.st[hab] = { tot: 0, first: 0, ok: 0 }); x.tot++; if (primeira) x.first++; if (final) x.ok++; }
function taxa(hab) { var x = S.st[hab]; return x && x.tot ? x.first / x.tot : 0; }
function acertoGeral() { var t = 0, f = 0; Object.keys(S.st).forEach(function (k) { if (k === 'fala') return; t += S.st[k].tot; f += S.st[k].first; }); return t ? Math.round(f / t * 100) : 0; }

/* ================= vocabulário e revisão espaçada =================
   Cada palavra tem estado (dificil | aprendendo | dominada), intervalo (ivl, em dias), facilidade (ef) e próxima revisão (due).
   Difícil volta amanhã e reduz a facilidade; Aprendendo cresce devagar; Dominada multiplica o intervalo pela facilidade. */
function W(w) { return S.w[w] || (S.w[w] = { st: 'novo', due: hoje(), ivl: 1, ef: 2.3, n: 0, err: 0, fav: false, seen: '' }); }
function marcarVisto(w) { var x = W(w); if (!x.seen) { x.seen = hoje(); if (x.st === 'novo') { x.st = 'aprendendo'; x.due = addDias(hoje(), 1); } } }
function classificar(w, st) {
  var x = W(w); if (!x.seen) x.seen = hoje(); x.n++; x.st = st;
  if (st === 'dificil') { x.ef = Math.max(1.3, x.ef - 0.2); x.ivl = 1; }
  else if (st === 'aprendendo') { x.ivl = Math.max(2, Math.round(x.ivl * 1.3)); }
  else { x.ivl = Math.max(4, Math.round(x.ivl * x.ef)); x.ef = Math.min(3, x.ef + 0.1); }
  x.ivl = Math.min(x.ivl, 120); x.due = addDias(hoje(), x.ivl); x.last = hoje();
}
function errou(w) { var x = W(w); if (!x.seen) x.seen = hoje(); x.err++; x.st = 'dificil'; x.ivl = 1; x.ef = Math.max(1.3, x.ef - 0.15); x.due = hoje(); }
var INDICE = {};
LICOES.forEach(function (l) { l.itens.forEach(function (it) { INDICE[it[0]] = { it: it, l: l }; }); });
function itemDe(w) { return INDICE[w] ? INDICE[w].it : null; }
function vistas() { return Object.keys(S.w).filter(function (w) { return S.w[w].seen && INDICE[w]; }); }
function pendentes() { var d = hoje(); return vistas().filter(function (w) { return S.w[w].due <= d; }).sort(function (a, b) { return S.w[a].due < S.w[b].due ? -1 : 1; }); }
function atrasadas() { var d = hoje(); return vistas().filter(function (w) { return S.w[w].due < d; }); }
function contar(st) { return vistas().filter(function (w) { return S.w[w].st === st; }).length; }
function aprendidas() { return vistas().length; }
function revisouAgora() { var d = hoje(); S.revDia[d] = (S.revDia[d] || 0) + 1; S.revs++; }

/* ================= curso: 5 módulos × 6 dias ================= */
function lic(id) { for (var i = 0; i < LICOES.length; i++) if (LICOES[i].id === id) return LICOES[i]; return null; }
function moduloDe(id) { for (var i = 0; i < MODULOS.length; i++) if (MODULOS[i].aulas.indexOf(id) > -1) return i; return -1; }
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
/* avaliação do módulo exige as 5 aulas do módulo; a final exige todos os dias anteriores */
function bloqueio(d) {
  if (d.tipo === 'aval') { var f = DIAS.filter(function (x) { return x.m === d.m && x.tipo === 'aula' && !S.done[x.id]; }).length; return f ? 'Conclua as ' + f + ' aula' + (f > 1 ? 's' : '') + ' que faltam do Módulo ' + (d.m + 1) + ' para liberar esta avaliação.' : ''; }
  if (d.tipo === 'final') { var g = DIAS.filter(function (x) { return x.tipo !== 'final' && !feito(x); }).length; return g ? 'A avaliação final é liberada depois dos outros 29 dias. Faltam ' + g + '.' : ''; }
  return '';
}
function certificadoOk() { return !!(S.aval.final && S.aval.final.ok) && DIAS.every(function (d) { return d.tipo === 'final' || feito(d); }); }

/* ================= níveis ================= */
var NIVEIS = [[0, 'Primeiros passos'], [120, 'Começando a entender'], [350, 'Já me viro'], [700, 'Comunicando o básico'], [1150, 'Conversando com confiança'], [1700, 'Pronto(a) para o próximo nível']];
function pontos() {
  var p = 0; vistas().forEach(function (w) { var st = S.w[w].st; p += st === 'dominada' ? 3 : st === 'aprendendo' ? 1.5 : 1; });
  Object.keys(S.st).forEach(function (k) { p += S.st[k].first * 1.5 + (S.st[k].ok - S.st[k].first) * 0.5; });
  p += S.revs * 0.5 + S.frases * 2 + Object.keys(S.done).length * 10;
  return Math.round(p);
}
function nivel() { var p = pontos(), i = 0; while (i < NIVEIS.length - 1 && p >= NIVEIS[i + 1][0]) i++;
  var prox = NIVEIS[i + 1]; return { n: i + 1, nome: NIVEIS[i][1], p: p, ini: NIVEIS[i][0], prox: prox ? prox[0] : null, proxNome: prox ? prox[1] : '' }; }

/* ================= conquistas ================= */
function med(id, n, r, cur, goal) { return { id: id, n: n, r: r, prog: function () { return [Math.min(cur(), goal), goal]; } }; }
var MEDALHAS = [
  med('primeira', 'Primeiro passo', 'Concluir a primeira aula', function () { return Object.keys(S.done).length; }, 1),
  med('seq3', 'Ritmo', 'Estudar 3 dias seguidos', sequencia, 3),
  med('seq7', 'Desafio de 7 dias', 'Estudar 7 dias seguidos', sequencia, 7),
  med('p50', '50 palavras', 'Aprender 50 palavras', aprendidas, 50),
  med('p100', '100 palavras', 'Aprender 100 palavras', aprendidas, 100),
  med('p200', '200 palavras', 'Aprender 200 palavras', aprendidas, 200),
  med('dom25', 'Memória firme', 'Dominar 25 palavras', function () { return contar('dominada'); }, 25),
  med('rev50', 'Revisão em dia', 'Fazer 50 revisões', function () { return S.revs; }, 50),
  med('fr30', 'Construtora de frases', 'Praticar 30 frases', function () { return S.frases; }, 30),
  med('des7', 'Desafiadora', 'Completar 7 desafios diários', function () { return Object.keys(S.desafio).length; }, 7),
  med('t120', 'Duas horas de inglês', 'Estudar 2 horas no total', function () { return Math.floor(tempoTotal() / 60); }, 120),
  med('nv3', 'Já me viro', 'Chegar ao nível 3', function () { return nivel().n; }, 3)
].concat(MODULOS.map(function (m, i) { return med('mod' + (i + 1), 'Módulo ' + (i + 1), 'Concluir “' + m.nome + '”', function () { return moduloFeito(i) ? 1 : 0; }, 1); }))
 .concat([med('curso', 'Fala Fácil completo', 'Concluir os 30 dias', function () { return certificadoOk() ? 1 : 0; }, 1)]);
var novasMedalhas = [];
function conquistas() { MEDALHAS.forEach(function (m) { var p = m.prog(); if (!S.medals[m.id] && p[0] >= p[1]) { S.medals[m.id] = hoje(); novasMedalhas.push(m); } }); save(); }
function proximaConquista() { var c = MEDALHAS.filter(function (m) { return !S.medals[m.id]; }).map(function (m) { var p = m.prog(); return { m: m, p: p, r: p[0] / p[1] }; });
  c.sort(function (a, b) { return b.r - a.r; }); return c[0] || null; }

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
  u.rate = opt.lento ? 0.72 : (txt.split(' ').length > 3 ? 0.92 : 0.86); if (opt.pitch) u.pitch = opt.pitch;
  if (opt.fim) u.onend = opt.fim;
  synth.speak(u);
}
var actx = null;
function plim() { try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); var t = actx.currentTime;
  [659.25, 880].forEach(function (f, i) { var o = actx.createOscillator(), g = actx.createGain(); o.type = 'sine'; o.frequency.value = f;
    g.gain.setValueAtTime(0, t + i * .08); g.gain.linearRampToValueAtTime(.12, t + i * .08 + .02); g.gain.exponentialRampToValueAtTime(.001, t + i * .08 + .35);
    o.connect(g); g.connect(actx.destination); o.start(t + i * .08); o.stop(t + i * .08 + .4); }); } catch (e) {} }
function festa() { if (matchMedia('(prefers-reduced-motion: reduce)').matches) return; var b = document.createElement('div'); b.className = 'conf'; b.setAttribute('aria-hidden', 'true');
  var cores = ['#2563eb', '#f59e0b', '#15803d', '#60a5fa', '#f97316'];
  for (var i = 0; i < 40; i++) { var x = document.createElement('i'); x.style.left = Math.random() * 100 + '%'; x.style.background = cores[i % cores.length]; x.style.animationDelay = Math.random() * .4 + 's'; b.appendChild(x); }
  document.body.appendChild(b); setTimeout(function () { b.remove(); }, 2300); }

/* ================= texto: normalização e comparação ================= */
var CONTR = { "i'm": 'i am', "don't": 'do not', "doesn't": 'does not', "it's": 'it is', "what's": 'what is', "you're": 'you are', "we're": 'we are', "they're": 'they are',
  "let's": 'let us', "i'll": 'i will', "you'll": 'you will', "who's": 'who is', "that's": 'that is', "i'd": 'i would', "can't": 'cannot', "isn't": 'is not', "aren't": 'are not', "there's": 'there is', "he's": 'he is', "she's": 'she is' };
function norm(s) { return String(s).toLowerCase().replace(/[’‘`]/g, "'").replace(/[^a-z0-9' ]/g, ' ').replace(/\s+/g, ' ').trim(); }
function expandir(s) { return norm(s).split(' ').map(function (p) { return CONTR[p] || p; }).join(' ').replace(/'/g, ''); }
function kEn(s) { return expandir(s); }
function kPt(s) { return String(s).toLowerCase().replace(/\(.*?\)/g, '').replace(/[“”"?!.,;:…—–-]/g, ' ').replace(/\s+/g, ' ').trim(); }
function lev(a, b) { var m = a.length, n = b.length, d = [], i, j; for (i = 0; i <= m; i++) d[i] = [i]; for (j = 0; j <= n; j++) d[0][j] = j;
  for (i = 1; i <= m; i++) for (j = 1; j <= n; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); return d[m][n]; }

/* ================= microfone (reconhecimento de fala) =================
   O reconhecimento indica se a fala foi entendida e com que confiança. Não é uma avaliação fonética. */
var SR = window.SpeechRecognition || window.webkitSpeechRecognition, rec = null, ouvindo = false, pararDeProposito = false;
function similaridade(ouvidos, alvos) {
  var best = 0; alvos = alvos.map(kEn);
  ouvidos.forEach(function (h) { var hs = kEn(h).replace(/ /g, '');
    alvos.forEach(function (t) { var ts = t.replace(/ /g, ''); var s = 1 - lev(hs, ts) / Math.max(hs.length, ts.length, 1); if (hs.indexOf(ts) > -1 && ts.length > 2) s = Math.max(s, .97); best = Math.max(best, s); }); });
  return best;
}
function pararMic() { if (rec && ouvindo) { pararDeProposito = true; try { rec.abort(); } catch (e) {} } ouvindo = false; }
function ouvir(alvos, ui, cb) {
  if (ouvindo) { pararMic(); return; }
  if (!SR) { cb({ nivel: 'sem-suporte' }); return; }
  if (synth) synth.cancel();
  var recebeu = false; pararDeProposito = false;
  try { rec = new SR(); } catch (e) { cb({ nivel: 'erro', erro: 'start' }); return; }
  rec.lang = 'en-US'; rec.interimResults = false; rec.maxAlternatives = 5; rec.continuous = false;
  function fim() { ouvindo = false; if (ui.btn) { ui.btn.classList.remove('on'); ui.btn.setAttribute('aria-label', 'Toque para falar'); ui.btn.setAttribute('aria-pressed', 'false'); }
    if (ui.status) ui.status.innerHTML = '<b>Toque para falar</b><span class="note">Fale logo depois de tocar no microfone</span>'; }
  rec.onresult = function (ev) { recebeu = true; var r0 = ev.results[0], alts = []; for (var i = 0; i < r0.length; i++) alts.push(r0[i].transcript);
    var conf = r0[0].confidence || 0, sim = similaridade(alts, alvos);
    var nv = sim >= .95 && conf >= .8 ? 'clara' : sim >= .85 ? 'reconhecida' : sim >= .6 ? 'parcial' : 'nao';
    fim(); cb({ nivel: nv, ouvido: alts[0], conf: conf }); };
  rec.onerror = function (ev) { recebeu = true; fim(); if (ev.error === 'aborted' || pararDeProposito) { cb({ nivel: 'parado' }); return; } cb({ nivel: 'erro', erro: ev.error }); };
  rec.onend = function () { if (!recebeu) { recebeu = true; fim(); cb(pararDeProposito ? { nivel: 'parado' } : { nivel: 'erro', erro: 'no-speech' }); } };
  try { rec.start(); ouvindo = true; if (ui.btn) { ui.btn.classList.add('on'); ui.btn.setAttribute('aria-label', 'Parar de ouvir'); ui.btn.setAttribute('aria-pressed', 'true'); }
    if (ui.status) ui.status.innerHTML = '<b>Ouvindo… fale agora <span class="waves" aria-hidden="true"><i></i><i></i><i></i><i></i></span></b><span class="note">Toque de novo para parar</span>'; }
  catch (e) { recebeu = true; fim(); cb({ nivel: 'erro', erro: 'start' }); }
}
function msgFala(r, esperado) {
  var aviso = '<small>Isso mostra que a sua fala foi entendida. Não é uma nota de sotaque.</small>';
  if (r.nivel === 'parado') return null;
  if (r.nivel === 'clara') return { c: 'ok', h: '<b>' + ico('check') + ' Fala reconhecida com clareza.</b> Entendi: “' + esc(r.ouvido) + '”.' + aviso };
  if (r.nivel === 'reconhecida') return { c: 'ok', h: '<b>Fala reconhecida.</b> Entendi: “' + esc(r.ouvido) + '”. Para soar mais natural, ouça o áudio lento e repita mais uma vez.' + aviso };
  if (r.nivel === 'parcial') return { c: 'mid', h: '<b>Quase.</b> Entendi: “' + esc(r.ouvido) + '”. Ouça o áudio lento e tente de novo, sem pressa. Isso não conta como erro.' };
  if (r.nivel === 'nao') return { c: 'mid', h: '<b>Ainda não reconheci.</b> Entendi: “' + esc(r.ouvido) + '”. Ouça devagar, repita sílaba por sílaba e tente outra vez. Isso não conta como erro.' };
  if (r.nivel === 'sem-suporte') return { c: 'info', h: '<b>Este navegador não reconhece a fala.</b> Pratique em voz alta mesmo assim: ouça, repita e compare. <button class="btn-g" type="button" data-act="ajuda-mic">Como ativar</button>' };
  var e = r.erro;
  if (e === 'not-allowed' || e === 'service-not-allowed') return { c: 'err', h: '<b>O microfone está bloqueado.</b> Libere o acesso e tente de novo. <button class="btn-g" type="button" data-act="ajuda-mic">Ver o passo a passo</button>' };
  if (e === 'network') return { c: 'err', h: '<b>Sem conexão.</b> O reconhecimento de fala precisa de internet. Verifique a conexão e tente de novo.' };
  if (e === 'no-speech') return { c: 'mid', h: '<b>Não ouvi nada.</b> Toque no microfone e fale logo em seguida, mais perto do aparelho.' };
  if (e === 'audio-capture') return { c: 'err', h: '<b>Nenhum microfone encontrado.</b> Verifique se outro aplicativo não está usando o microfone.' };
  return { c: 'err', h: '<b>Não foi possível usar o microfone agora.</b> Tente de novo. <button class="btn-g" type="button" data-act="ajuda-mic">Ajuda</button>' };
}
function fbHtml(m) { return m ? '<div class="fb ' + m.c + '" role="status">' + m.h + '</div>' : ''; }

/* ================= tutor (regras locais; pronto para IA no futuro) ================= */
var TUTOR = {
  explicarErro: function (certo, escolhido, extra) { return 'A resposta certa é <b>“' + esc(certo) + '”</b>' + (escolhido ? ', e não “' + esc(escolhido) + '”' : '') + '.' + (extra ? ' ' + extra : ''); },
  explicarOrdem: function (frase, est) { return 'A ordem certa é: <b>' + esc(frase) + '</b>.' + (est ? ' Lembre: ' + esc(est) : ''); },
  dicaDigitar: function (certo) { var w = certo.split(' '); return 'Dica: começa com <b>“' + esc(w[0]) + '”</b> e tem ' + w.length + ' palavra' + (w.length > 1 ? 's' : '') + '.'; },
  sugerirRevisao: function () { return pendentes().slice(0, 20); }
};

/* ================= sons difíceis e exemplos ================= */
function sonsDe(w) {
  var t = w.toLowerCase(), r = [];
  if (/th/.test(t)) r.push('th');
  if (/(^|\s)h[aeiou]/.test(t) && !/\b(hour|honest)/.test(t)) r.push('h');
  if (/(^|\s)wh?[aeio]/.test(t) && !/\bwho/.test(t)) r.push('w');
  if (/(^|\s)(black|thank|family|happy|bank|cash|sad|fabric|back|actually)/.test(t)) r.push('a');
  if (/^[a-z]+$/.test(t) && /[bdgkpt]$/.test(t)) r.push('fim');
  return r.slice(0, 2);
}
function frasesDaAula(id) {
  var p = PED[id], out = [], vistos = {};
  function add(en, pt) { var k = kEn(en); if (!k || vistos[k]) return; vistos[k] = 1; out.push({ en: en, pt: pt }); }
  p.est.ex.forEach(function (e) { add(e[0], e[1]); }); p.dlg.forEach(function (d) { add(d[1], d[2]); });
  lic(id).itens.forEach(function (it) { var e = EXEMPLOS[it[0]]; if (e) add(e[0], e[1]); });
  return out;
}
function exemploPara(w, id) {
  var wl = norm(w), p = id && PED[id];
  if (p && wl.split(' ').length <= 2) {
    var re = new RegExp('(^|[^a-z])' + wl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '([^a-z]|$)', 'i'), todas = p.est.ex.concat(p.dlg.map(function (d) { return [d[1], d[2]]; }));
    for (var i = 0; i < todas.length; i++) if (re.test(todas[i][0]) && norm(todas[i][0]) !== wl) return todas[i];
  }
  return EXEMPLOS[w] || null;
}

/* ================= gerador de exercícios =================
   Regras: alternativas sempre únicas; nunca duas respostas certas (traduções equivalentes ficam fora dos distratores);
   dificuldade progressiva (reconhecer → escutar → lembrar → completar → frases → digitar). */
function distr(cands, n, chave, excluir) {
  var vistos = {}, out = []; (excluir || []).forEach(function (k) { vistos[k] = 1; });
  shuffle(cands).forEach(function (c) { var k = chave(c); if (out.length < n && k && !vistos[k]) { vistos[k] = 1; out.push(c); } }); return out;
}
function semAmbiguidade(it, lista) { var kp = kPt(it[2]), ke = kEn(it[0]); return lista.filter(function (x) { return kPt(x[2]) !== kp && kEn(x[0]) !== ke; }); }
var ORDEM_TIPOS = ['en2pt', 'ouvir', 'pt2en', 'completar', 'frase-en2pt', 'frase-pt2en', 'digitar'];
function qItem(tipo, it, itens) {
  if (!it) return null;
  var outros = semAmbiguidade(it, itens), q = null;
  if (tipo === 'en2pt') { var d = distr(outros, 3, function (x) { return kPt(x[2]); }, [kPt(it[2])]).map(function (x) { return x[2]; });
    if (d.length < 2) return null; q = { kind: 'q', tipo: tipo, hab: 'vocab', w: it[0], pergunta: 'O que significa?', destaque: it[0], dLang: 'en', audio: it[0], certo: it[2], ops: shuffle([it[2]].concat(d)), dica: '“' + it[0] + '” = ' + it[2] + '.' }; }
  else if (tipo === 'pt2en' || tipo === 'ouvir') { var d2 = distr(outros, 3, function (x) { return kEn(x[0]); }, [kEn(it[0])]).map(function (x) { return x[0]; });
    if (d2.length < 2) return null;
    q = tipo === 'pt2en' ? { kind: 'q', tipo: tipo, hab: 'vocab', w: it[0], pergunta: 'Como se diz em inglês?', destaque: it[2], dLang: 'pt', certo: it[0], ops: shuffle([it[0]].concat(d2)), opLang: 'en', dica: '“' + it[2] + '” = ' + it[0] + '.' }
      : { kind: 'q', tipo: tipo, hab: 'escuta', w: it[0], pergunta: 'Escute e escolha o que você ouviu', audio: it[0], auto: true, certo: it[0], ops: shuffle([it[0]].concat(d2)), opLang: 'en', dica: 'Você ouviu “' + it[0] + '” (' + it[2] + ').' }; }
  else if (tipo === 'digitar') {
    if (it[0].split(' ').length > 4) return null;
    q = { kind: 'dig', tipo: tipo, hab: 'recall', w: it[0], pt: it[2], certo: it[0], aceitas: [it[0]].concat(it[4] || []), tent: 0, dica: it[2] }; }
  return q;
}
function qFrase(tipo, f, frases) {
  if (!f) return null;
  if (tipo === 'completar') {
    var palavras = f.en.replace(/[.,!?]/g, '').split(' '), alvo = palavras.filter(function (p) { return /^[A-Za-z]{3,}$/.test(p); }).sort(function (a, b) { return b.length - a.length; })[0];
    if (!alvo) return null;
    var poolSet = {}; frases.forEach(function (x) { poolSet[kEn(x.en)] = 1; });
    var cands = []; frases.forEach(function (x) { if (x === f) return; x.en.replace(/[.,!?]/g, '').split(' ').forEach(function (p) { if (/^[A-Za-z]{3,}$/.test(p)) cands.push(p.toLowerCase()); }); });
    var cap = f.en.indexOf(alvo) === 0;
    var fmt = function (p) { return cap ? p.charAt(0).toUpperCase() + p.slice(1) : (/^[A-Z][a-z]/.test(alvo) && !cap ? p.charAt(0).toUpperCase() + p.slice(1) : p.toLowerCase()); };
    var re = new RegExp('\\b' + alvo + '\\b');
    var d = distr(cands, 3, function (p) { var k = p.toLowerCase(); if (k === alvo.toLowerCase()) return ''; if (poolSet[kEn(f.en.replace(re, p))]) return ''; return k; }).map(fmt);
    if (d.length < 2) return null;
    return { kind: 'q', tipo: tipo, hab: 'constr', pergunta: 'Complete a frase', destaque: f.en.replace(re, '____'), dLang: 'en', sub: f.pt, certo: alvo, ops: shuffle([alvo].concat(d)), opLang: 'en', dica: 'A frase completa é “' + f.en + '” (' + f.pt + ').', audioFim: f.en };
  }
  var outras = frases.filter(function (x) { return x !== f && kPt(x.pt) !== kPt(f.pt) && kEn(x.en) !== kEn(f.en); });
  if (tipo === 'frase-en2pt') { var d1 = distr(outras, 3, function (x) { return kPt(x.pt); }, [kPt(f.pt)]).map(function (x) { return x.pt; }); if (d1.length < 2) return null;
    return { kind: 'q', tipo: tipo, hab: 'trad', pergunta: 'O que esta frase quer dizer?', destaque: f.en, dLang: 'en', audio: f.en, certo: f.pt, ops: shuffle([f.pt].concat(d1)), dica: '“' + f.en + '” = ' + f.pt }; }
  var d3 = distr(outras, 3, function (x) { return kEn(x.en); }, [kEn(f.en)]).map(function (x) { return x.en; }); if (d3.length < 2) return null;
  return { kind: 'q', tipo: tipo, hab: 'trad', pergunta: 'Como se diz em inglês?', destaque: f.pt, dLang: 'pt', certo: f.en, ops: shuffle([f.en].concat(d3)), opLang: 'en', dica: '“' + f.pt + '” = ' + f.en };
}
function gerarExercicios(itens, frases, n, tipos) {
  tipos = tipos || ORDEM_TIPOS;
  var fila = [], pi = shuffle(itens), pf = shuffle(frases), ii = 0, fi = 0, usados = {}, tent = 0;
  while (fila.length < n && tent < n * 12) {
    tent++;
    var tipo = tipos[Math.min(Math.floor(fila.length * tipos.length / n), tipos.length - 1)], q = null;
    if (tent > n * 6) tipo = pick(['en2pt', 'pt2en', 'ouvir']);
    if (/^(en2pt|pt2en|ouvir|digitar)$/.test(tipo)) { var it = pi[ii++ % pi.length]; if (usados[tipo + it[0]]) continue; q = qItem(tipo, it, itens); if (q) usados[tipo + it[0]] = 1; }
    else { var f = pf[fi++ % Math.max(1, pf.length)]; if (!f || usados[tipo + f.en]) continue; q = qFrase(tipo, f, frases); if (q) usados[tipo + f.en] = 1; }
    if (q) fila.push(q);
  }
  return fila;
}
function itemMontar(instr, alvo, pt, base, frases) {
  var palavras = alvo.replace(/[.,!?]/g, '').split(' '), lower = palavras.map(function (p) { return p.toLowerCase(); }), extras = [];
  frases.forEach(function (x) { x.en.replace(/[.,!?]/g, '').split(' ').forEach(function (p) { if (/^[A-Za-z']{2,}$/.test(p) && lower.indexOf(p.toLowerCase()) < 0 && extras.indexOf(p.toLowerCase()) < 0) extras.push(p.toLowerCase()); }); });
  var banco = shuffle(palavras.concat(extras.length ? [pick(extras)] : [])).map(function (t, n) { return { t: t, n: n, u: false }; });
  return { kind: 'montar', hab: 'constr', instr: instr, base: base, alvo: alvo.replace(/[.,!?]/g, ''), pt: pt, banco: banco, sel: [], tent: 0, res: null, certo: alvo.replace(/[.,!?]/g, ''), dica: pt };
}

/* ================= navegação e telas principais ================= */
var ABA = 'inicio', SESSAO = null, AULA = null;
function setNav(on) { document.body.classList.toggle('nonav', !on); }
function ir(aba) { pararMic(); if (synth) synth.cancel(); ABA = aba; SESSAO = null; AULA = null; setNav(true);
  $$('.tab').forEach(function (t) { var on = t.dataset.tab === aba; t.classList.toggle('on', on); if (on) t.setAttribute('aria-current', 'page'); else t.removeAttribute('aria-current'); }); render(); scrollTo(0, 0); }
function render() {
  $('#streakN').textContent = sequencia();
  var p = pendentes().length, b = $('#revBadge'); b.hidden = !p; b.textContent = p > 99 ? '99+' : p;
  var v = $('#view');
  if (!S.onb) { setNav(false); document.body.classList.toggle('bv', onbPasso === 0); v.innerHTML = telaBoasVindas(); if (onbPasso === 0) iniciarBoasVindas(); return; }
  document.body.classList.remove('bv');
  if (ABA === 'inicio') v.innerHTML = telaInicio();
  else if (ABA === 'curso') v.innerHTML = telaCurso();
  else if (ABA === 'revisar') v.innerHTML = telaRevisar();
  else if (ABA === 'caderno') v.innerHTML = telaCaderno();
  else if (ABA === 'evolucao') v.innerHTML = telaEvolucao();
  lembreteBanner();
}
$$('.tab').forEach(function (t) { t.addEventListener('click', function () { ir(t.dataset.tab); }); });
function stat(v, l) { return '<div class="stat"><b>' + v + '</b><span>' + l + '</span></div>'; }
function vazio(icone, titulo, texto, acao) { return '<div class="empty">' + ico(icone) + '<b>' + esc(titulo) + '</b><p>' + esc(texto) + '</p>' + (acao || '') + '</div>'; }

/* boas-vindas */
var onbPasso = 0;
function saudacaoPt() { return S.nome ? 'Olá, ' + esc(S.nome) + '!' : 'Bem-vindo(a) ao <b>Fala Fácil</b>!'; }
function saudacaoEn() { return S.nome ? 'Hello, ' + esc(S.nome) + '!' : 'Welcome to <b>Fala Fácil</b>!'; }
/* boas-vindas animada: alterna português e inglês e move as camadas (paralaxe) com o dedo, o mouse ou a inclinação do celular */
var BV = { t: null, x: 0, y: 0, tx: 0, ty: 0, on: false };
function iniciarBoasVindas() {
  var w = $('#welcome'); if (!w) return;
  var reduz = matchMedia('(prefers-reduced-motion: reduce)').matches;
  requestAnimationFrame(function () { requestAnimationFrame(function () { w.classList.add('in'); }); });
  clearInterval(BV.t); var en = false;
  BV.t = setInterval(function () { var el = $('#welcome .wl-tit'); if (!el) { clearInterval(BV.t); return; } en = !en; el.classList.toggle('en', en); }, 2800);
  if (reduz || BV.on) return; BV.on = true;
  addEventListener('pointermove', function (e) { if ($('#welcome')) { BV.tx = e.clientX / innerWidth - .5; BV.ty = e.clientY / innerHeight - .5; } }, { passive: true });
  addEventListener('deviceorientation', function (e) { if ($('#welcome') && e.gamma != null) { BV.tx = Math.max(-1, Math.min(1, e.gamma / 30)) / 2; BV.ty = Math.max(-1, Math.min(1, (e.beta - 40) / 30)) / 2; } }, { passive: true });
  (function loop() {
    var lay = $$('#welcome [data-p]');
    if (lay.length) { BV.x += (BV.tx - BV.x) * .08; BV.y += (BV.ty - BV.y) * .08;
      lay.forEach(function (l) { var d = +l.dataset.p; l.style.transform = 'translate3d(' + (-BV.x * 40 * d).toFixed(1) + 'px,' + (-BV.y * 30 * d).toFixed(1) + 'px,0)'; }); }
    requestAnimationFrame(loop);
  })();
}
function telaBoasVindas() {
  if (onbPasso === 0) return '<section class="welcome" id="welcome" aria-labelledby="wTit">' +
    '<div class="wl-layer" data-p="0.5" aria-hidden="true"><span class="bub b1">Oi!</span><span class="bub b2">Hello!</span><span class="bub b3">Olá!</span><span class="bub b4">Hi there!</span><span class="bub b5">Tudo bem?</span><span class="bub b6">How are you?</span></div>' +
    '<div class="wl-layer" data-p="1.2" aria-hidden="true"><span class="flag f-br"><svg viewBox="0 0 70 50" aria-hidden="true"><rect width="70" height="50" rx="5" fill="#009b3a"/><path d="M35 6 64 25 35 44 6 25z" fill="#fedf00"/><circle cx="35" cy="25" r="10.5" fill="#002776"/><path d="M24.8 22.6c7-1.8 14.4-.6 20.6 3.2" stroke="#fff" stroke-width="2" fill="none"/></svg></span><span class="flag f-us"><svg viewBox="0 0 76 40" aria-hidden="true"><defs><clipPath id="fus"><rect width="76" height="40" rx="4"/></clipPath></defs><g clip-path="url(#fus)"><rect width="76" height="40" fill="#fff"/><rect y="0.00" width="76" height="3.08" fill="#b22234"/><rect y="6.15" width="76" height="3.08" fill="#b22234"/><rect y="12.30" width="76" height="3.08" fill="#b22234"/><rect y="18.45" width="76" height="3.08" fill="#b22234"/><rect y="24.60" width="76" height="3.08" fill="#b22234"/><rect y="30.75" width="76" height="3.08" fill="#b22234"/><rect y="36.90" width="76" height="3.08" fill="#b22234"/><rect width="31" height="21.5" fill="#3c3b6e"/><circle cx="3.5" cy="3.0" r="1.1" fill="#fff"/><circle cx="8.3" cy="3.0" r="1.1" fill="#fff"/><circle cx="13.1" cy="3.0" r="1.1" fill="#fff"/><circle cx="17.9" cy="3.0" r="1.1" fill="#fff"/><circle cx="22.7" cy="3.0" r="1.1" fill="#fff"/><circle cx="27.5" cy="3.0" r="1.1" fill="#fff"/><circle cx="3.5" cy="6.9" r="1.1" fill="#fff"/><circle cx="8.3" cy="6.9" r="1.1" fill="#fff"/><circle cx="13.1" cy="6.9" r="1.1" fill="#fff"/><circle cx="17.9" cy="6.9" r="1.1" fill="#fff"/><circle cx="22.7" cy="6.9" r="1.1" fill="#fff"/><circle cx="27.5" cy="6.9" r="1.1" fill="#fff"/><circle cx="3.5" cy="10.8" r="1.1" fill="#fff"/><circle cx="8.3" cy="10.8" r="1.1" fill="#fff"/><circle cx="13.1" cy="10.8" r="1.1" fill="#fff"/><circle cx="17.9" cy="10.8" r="1.1" fill="#fff"/><circle cx="22.7" cy="10.8" r="1.1" fill="#fff"/><circle cx="27.5" cy="10.8" r="1.1" fill="#fff"/><circle cx="3.5" cy="14.7" r="1.1" fill="#fff"/><circle cx="8.3" cy="14.7" r="1.1" fill="#fff"/><circle cx="13.1" cy="14.7" r="1.1" fill="#fff"/><circle cx="17.9" cy="14.7" r="1.1" fill="#fff"/><circle cx="22.7" cy="14.7" r="1.1" fill="#fff"/><circle cx="27.5" cy="14.7" r="1.1" fill="#fff"/><circle cx="3.5" cy="18.6" r="1.1" fill="#fff"/><circle cx="8.3" cy="18.6" r="1.1" fill="#fff"/><circle cx="13.1" cy="18.6" r="1.1" fill="#fff"/><circle cx="17.9" cy="18.6" r="1.1" fill="#fff"/><circle cx="22.7" cy="18.6" r="1.1" fill="#fff"/><circle cx="27.5" cy="18.6" r="1.1" fill="#fff"/></g></svg></span><span class="flag f-uk"><svg viewBox="0 0 60 30" aria-hidden="true"><defs><clipPath id="fuk"><rect width="60" height="30" rx="3"/></clipPath><clipPath id="fuk2"><path d="M30 15h30v15zv15H0zH0V0zV0h30z"/></clipPath></defs><g clip-path="url(#fuk)"><rect width="60" height="30" fill="#012169"/><path d="M0 0l60 30M60 0 0 30" stroke="#fff" stroke-width="6"/><path d="M0 0l60 30M60 0 0 30" clip-path="url(#fuk2)" stroke="#C8102E" stroke-width="4"/><path d="M30 0v30M0 15h60" stroke="#fff" stroke-width="10"/><path d="M30 0v30M0 15h60" stroke="#C8102E" stroke-width="6"/></g></svg></span></div>' +
    '<div class="wl-center"><div class="wl-logo" data-p="0.8" aria-hidden="true"><svg viewBox="0 0 120 110" aria-hidden="true"><defs><linearGradient id="wg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4f8bff"/><stop offset="1" stop-color="#1d4ed8"/></linearGradient></defs><path d="M18 6h84a14 14 0 0 1 14 14v50a14 14 0 0 1-14 14H46L24 104V84h-6A14 14 0 0 1 4 70V20A14 14 0 0 1 18 6z" fill="url(#wg)"/><text x="60" y="61" text-anchor="middle" font-family="system-ui,Arial" font-weight="900" font-size="38" fill="#fff">Hi!</text><circle cx="95" cy="25" r="6" fill="#f5b041"/></svg><span class="ring"></span></div>' +
    '<h1 class="wl-tit" id="wTit"><span class="wl-pt">' + saudacaoPt() + '</span><span class="wl-en" lang="en">' + saudacaoEn() + '</span></h1>' +
    '<p class="wl-sub">Inglês do zero, sem medo e no seu ritmo. <span lang="en">English made easy.</span></p>' +
    '<button class="wl-ouvir" type="button" data-act="ouvir-boas">' + ico('play') + 'Ouvir em inglês</button>' +
    '<label class="wl-nome"><span>Como você quer ser chamado(a)?</span><input id="onbNome" autocomplete="given-name" value="' + esc(S.nome) + '" placeholder="Seu nome ou apelido" maxlength="40"></label>' +
    '<button class="btn btn-p full wl-go" type="button" data-act="onb-next">Vamos começar<span class="en"> · <span lang="en">Let&#39;s go!</span></span> ' + ico('right') + '</button>' +
    '<p class="wl-note">Leva 1 minuto. Seus dados ficam só neste aparelho.</p></div></section>';
  if (onbPasso === 1) return '<div class="card" style="margin-top:8px"><span class="pill p-blue">Passo 1 de 2</span><h2 class="h1" style="margin:12px 0 6px">' + (S.nome ? esc(S.nome) + ', veja' : 'Veja') + ' como funciona</h2>' +
    '<p class="sub">Em 30 dias, com uma aula por dia, você aprende o inglês que usa no dia a dia e no trabalho, sempre explicado em português.</p>' +
    '<div class="how"><div><b>1</b>Aprenda a palavra e veja um exemplo</div><div><b>2</b>Escute o áudio, normal ou lento</div><div><b>3</b>Pronuncie e veja se foi entendida</div><div><b>4</b>Construa e transforme frases</div><div><b>5</b>Pratique com exercícios e diálogos</div><div><b>6</b>Revise no tempo certo para não esquecer</div></div>' +
    '<div class="field"><span id="metaLbl">Quanto tempo por dia?</span><div class="seg" role="radiogroup" aria-labelledby="metaLbl">' + [5, 10, 15, 20].map(function (m) { return '<button type="button" role="radio" aria-checked="' + (S.metaMin === m) + '" class="' + (S.metaMin === m ? 'on' : '') + '" data-act="meta" data-m="' + m + '">' + m + ' min</button>'; }).join('') + '</div></div>' +
    '<p class="note">Sem pressão: você pode mudar isso quando quiser. Tudo fica salvo só neste aparelho.</p>' +
    '<button class="btn btn-p full" type="button" data-act="onb-next" style="margin-top:14px">Continuar ' + ico('right') + '</button></div>';
  return '<div class="card" style="margin-top:8px"><span class="pill p-blue">Passo 2 de 2</span><h2 class="h1" style="margin:12px 0 6px">Vamos testar o som e o microfone</h2>' +
    '<p class="sub">Aumente o volume e toque em “Ouvir”. Depois, toque no microfone e diga <b>“Hello”</b>.</p>' +
    '<div class="row" style="margin:14px 0"><button class="btn btn-s" type="button" data-act="falar" data-t="Hello">' + ico('play') + 'Ouvir “Hello”</button></div>' +
    '<div class="mic"><button class="micb" type="button" id="micBtn" data-act="mic-onb" aria-label="Toque para falar" aria-pressed="false">' + ico('mic') + '</button><div class="st" id="micSt"><b>Toque para falar</b><span class="note">O navegador vai pedir permissão. Toque em “Permitir”.</span></div></div>' +
    '<div id="micFb" aria-live="polite"></div><p class="note" style="margin-top:12px">Se o microfone não funcionar, você ainda pode fazer o curso praticando em voz alta. <button class="btn-g" type="button" data-act="ajuda-mic">Como ativar o microfone</button></p>' +
    '<button class="btn btn-p full" type="button" data-act="onb-fim" style="margin-top:14px">Ir para o meu painel ' + ico('right') + '</button></div>';
}

/* início: orientar o aluno primeiro, números depois */
function telaInicio() {
  var i = diaAtual(), fim = i >= DIAS.length, d = DIAS[Math.min(i, DIAS.length - 1)], feitas = aulasFeitas(), pct = Math.round(feitas / DIAS.length * 100);
  var nome = S.nome ? ', ' + esc(S.nome) : '', hora = new Date().getHours(), sauda = hora < 12 ? 'Bom dia' : hora < 18 ? 'Boa tarde' : 'Boa noite';
  var pend = pendentes().length, atr = atrasadas().length, seq = sequencia(), th = tempoHoje(), meta = S.metaMin * 60, ok = metaCumprida();
  var h = '<h1 class="h1" style="margin:4px 0 2px">' + sauda + nome + '!</h1><p class="sub">' + (fim ? 'Você concluiu os 30 dias. Parabéns!' : 'Dia ' + (i + 1) + ' de 30 · Módulo ' + (d.m + 1) + ': ' + esc(MODULOS[d.m].nome)) + '</p>';
  h += '<div class="card hero" style="margin-top:14px">';
  if (fim) h += '<b style="font-size:1.2rem">Curso concluído!</b><p class="sub" style="margin:6px 0 14px">Continue revisando para manter o que aprendeu.</p><button class="btn btn-p full" type="button" data-act="certificado">Ver o meu certificado</button>';
  else h += '<span class="pill pill-hero">' + (feitas ? 'Sua próxima etapa' : 'Comece por aqui') + '</span><b style="display:block;font-size:1.3rem;margin:10px 0 2px">Dia ' + (i + 1) + ' · ' + esc(nomeDia(d)) + '</b><p class="sub">' + esc(d.tipo === 'aula' ? lic(d.id).sub : d.tipo === 'final' ? 'Mostre tudo o que aprendeu e ganhe o seu certificado' : 'Confira o que aprendeu no Módulo ' + (d.m + 1)) + '</p>' +
    '<div class="bar" style="margin:14px 0 6px" role="progressbar" aria-valuenow="' + pct + '" aria-valuemin="0" aria-valuemax="100" aria-label="Progresso do curso"><i style="width:' + pct + '%"></i></div><p class="sub" style="font-size:.82rem;margin-bottom:14px">' + feitas + ' de 30 dias concluídos · ' + pct + '%</p>' +
    '<button class="btn btn-p full" type="button" data-act="abrir-dia" data-i="' + i + '">' + (feitas ? 'Continuar' : 'Começar a aula 1') + ' ' + ico('right') + '</button>';
  h += '</div>';
  h += '<div class="card"><div class="goal"><span class="ck ' + (ok ? 'on' : '') + '">' + (ok ? ico('check') : ico('clock')) + '</span><div style="flex:1;min-width:0"><b>Meta de hoje: ' + S.metaMin + ' minutos</b><div class="sub">' + (ok ? 'Meta cumprida. Muito bem!' : minutos(th) + ' de ' + S.metaMin + ' min · ou conclua 1 aula · ou faça 10 revisões (' + (S.revDia[hoje()] || 0) + '/10)') + '</div>' +
    '<div class="bar" style="margin-top:8px;height:7px"><i style="width:' + (ok ? 100 : Math.min(100, Math.round(th / meta * 100))) + '%"></i></div></div></div></div>';
  if (pend) h += '<div class="card act"><div style="flex:1;min-width:0"><b>' + ico('rep') + ' Revisão do dia</b><div class="sub">' + pend + ' palavra' + (pend > 1 ? 's' : '') + ' para relembrar' + (atr ? ' · ' + atr + ' atrasada' + (atr > 1 ? 's' : '') : '') + '</div></div><button class="btn btn-s" type="button" data-act="rev" data-m="dia">Revisar</button></div>';
  var des = S.desafio[hoje()];
  h += '<div class="card act"><div style="flex:1;min-width:0"><b>' + ico('target') + ' Desafio do dia</b><div class="sub">' + (des ? 'Feito hoje: ' + des.pct + '% de acertos. Volte amanhã!' : '6 desafios rápidos · cerca de 3 minutos') + '</div></div>' + (des ? '<span class="pill p-ok">' + ico('check') + 'Feito</span>' : '<button class="btn btn-s" type="button" data-act="desafio">Fazer</button>') + '</div>';
  h += '<div class="card"><b>' + ico('bolt') + ' Estudo rápido</b><p class="sub" style="margin:4px 0 10px">Sem tempo para uma aula? Revise e pratique o que já estudou.</p><div class="quick">' + [5, 10, 20, 30].map(function (m) { return '<button class="btn btn-o" type="button" data-act="rapido" data-m="' + m + '">' + m + ' min</button>'; }).join('') + '</div></div>';
  if (S.hist.length) {
    var nv = nivel(), pc = proximaConquista();
    h += '<h2 class="h2">Resumo</h2><div class="stats">' + stat(aprendidas(), 'palavras estudadas') + stat(contar('dominada'), 'dominadas') + stat(S.frases, 'frases praticadas') +
      stat(seq + (seq === 1 ? ' dia' : ' dias'), 'de sequência') + stat(minutos(tempoTotal()), 'de estudo') + stat('Nível ' + nv.n, esc(nv.nome)) + '</div>';
    if (pc) h += '<div class="card" style="margin-top:12px"><b>Próxima conquista: ' + esc(pc.m.n) + '</b><p class="sub" style="margin:2px 0 8px">' + esc(pc.m.r) + ' · ' + pc.p[0] + ' de ' + pc.p[1] + '</p><div class="bar" style="height:7px"><i style="width:' + Math.round(pc.r * 100) + '%"></i></div></div>';
    h += '<h2 class="h2">Atividade recente</h2><div class="card"><ul class="hist">' + S.hist.slice(0, 4).map(function (x) { return '<li><span>' + esc(x.t) + '</span><time>' + dataBR(x.d) + '</time></li>'; }).join('') + '</ul><button class="btn-g" type="button" data-act="ir" data-tab="evolucao">Ver a minha evolução ' + ico('right') + '</button></div>';
  }
  return h;
}

/* curso */
function telaCurso() {
  var cur = diaAtual(), h = '<h1 class="h1" style="margin:4px 0 2px">Sua jornada de 30 dias</h1><p class="sub">5 módulos · 6 dias cada · 25 aulas e 5 avaliações</p>';
  MODULOS.forEach(function (m, mi) {
    var done = moduloFeito(mi), nAulas = m.aulas.filter(function (id) { return S.done[id]; }).length;
    h += '<section class="card mod' + (done ? ' done' : '') + '" style="margin-top:14px" aria-labelledby="mod' + mi + '"><div class="mh"><span class="num">' + (done ? ico('check') : mi + 1) + '</span><div style="min-width:0"><b id="mod' + mi + '" style="font-size:1.08rem">Módulo ' + (mi + 1) + ' · ' + esc(m.nome) + '</b><p class="sub">' + esc(m.obj) + '</p><p class="note">' + nAulas + ' de 5 aulas · ' + (done ? 'concluído' : 'em andamento') + '</p>' +
      '<details style="margin-top:6px"><summary class="note" style="cursor:pointer;font-weight:700;color:var(--primary-d)">O que você vai conseguir fazer</summary><ul class="learn">' + CONSEGUE[mi].map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></details></div></div>';
    DIAS.forEach(function (d, i) { if (d.m !== mi) return;
      var ok = feito(d), atual = i === cur, bl = bloqueio(d), nota = d.tipo !== 'aula' && S.aval[d.id] ? ' · melhor nota ' + S.aval[d.id].pct + '%' : d.tipo === 'aula' && S.done[d.id] && S.done[d.id].pct != null ? ' · ' + S.done[d.id].pct + '% de acertos' : '';
      var sub = d.tipo === 'aula' ? lic(d.id).sub + ' · ' + lic(d.id).itens.length + ' palavras e frases' : d.tipo === 'final' ? '20 questões · libera o certificado' : '12 questões · aprovação com 70%';
      h += '<button class="day' + (ok ? ' ok' : '') + (atual ? ' cur' : '') + (bl && !ok ? ' lock' : '') + '" type="button" data-act="abrir-dia" data-i="' + i + '"><span class="st">' + (ok ? ico('check') : bl ? ico('lock') : i + 1) + '</span><span style="min-width:0"><b>Dia ' + (i + 1) + ' · ' + esc(nomeDia(d)) + '</b><small>' + (ok ? 'Concluído' + nota : atual && !bl ? 'Aula atual' : bl ? 'Bloqueado até concluir as aulas' : esc(sub)) + '</small></span><span class="go">' + ico('right') + '</span></button>';
    });
    h += '</section>';
  });
  h += '<h2 class="h2">Trilhas</h2><div class="card"><span class="pill p-ok">Disponível</span><b style="display:block;margin-top:8px">Bônus · Entender a internet</b><p class="sub">Botões, avisos e mensagens de sites, aplicativos e redes sociais. 23 palavras e expressões.</p><button class="btn btn-s" type="button" data-act="abrir-aula" data-id="t1" style="margin-top:10px">' + (S.done.t1 ? 'Refazer a aula' : 'Fazer a aula bônus') + '</button></div>';
  h += '<div class="card"><span class="pill p-grey">Em preparação</span><p class="sub" style="margin-top:8px">Próximas trilhas, cada uma com objetivos e situações práticas próprias:</p><ul class="learn" style="margin-top:6px">' +
    ['<b>Inglês para viagens</b> · aeroporto, hotel, passeios e imprevistos', '<b>Inglês para o dia a dia</b> · mercado, médico, vizinhos e serviços', '<b>Inglês para o trabalho</b> · reuniões, apresentações e negociação', '<b>Inglês para conversação</b> · falar de você, opiniões e planos'].map(function (x) { return '<li style="padding:4px 0">' + x + '</li>'; }).join('') + '</ul></div>';
  return h;
}

/* revisar */
function listaRev(f) {
  var v = vistas();
  if (f === 'todas' || f === 'acumulada') return v;
  if (f === 'erros') return v.filter(function (w) { return S.w[w].err > 0; });
  if (f === 'fav') return v.filter(function (w) { return S.w[w].fav; });
  if (f === 'atrasadas') return atrasadas();
  if (f === 'dia') return pendentes();
  if (/^m\d$/.test(f)) { var mi = +f.slice(1); return v.filter(function (w) { return moduloDe(INDICE[w].l.id) === mi; }); }
  return v.filter(function (w) { return S.w[w].st === f; });
}
function telaRevisar() {
  var p = pendentes().length, a = atrasadas().length, n = aprendidas();
  var h = '<h1 class="h1" style="margin:4px 0 2px">Revisar</h1><p class="sub">Cada palavra volta no momento certo. Quanto melhor você lembra, mais tempo ela demora para voltar.</p>';
  h += '<div class="card" style="margin-top:14px"><b>Revisão do dia</b><p class="sub" style="margin:4px 0 12px">' + (p ? p + ' palavra' + (p > 1 ? 's' : '') + ' para hoje' + (a ? ', das quais ' + a + ' atrasada' + (a > 1 ? 's' : '') + ' (aparecem primeiro)' : '') + '.' : n ? 'Tudo em dia! Volte amanhã ou escolha uma revisão abaixo.' : 'As palavras das aulas aparecem aqui para revisão.') + '</p>' +
    '<button class="btn btn-p full" type="button" data-act="rev" data-m="dia"' + (p ? '' : ' disabled') + '>' + ico('rep') + 'Começar a revisão do dia</button></div>';
  if (!n) return h + vazio('book', 'Nada para revisar ainda', 'Faça a primeira aula. As palavras estudadas aparecem aqui automaticamente.', '<button class="btn btn-s" type="button" data-act="abrir-dia" data-i="0">Ir para a aula 1</button>');
  var opc = [['atrasadas', 'Atrasadas', 'cal'], ['dificil', 'Difíceis', 'alert'], ['erros', 'Que eu errei', 'x'], ['fav', 'Favoritas', 'star'],
    ['acumulada', 'Revisão geral (20 sorteadas)', 'shuffle'], ['audio', 'Por áudio: ouvir e lembrar', 'play'], ['frases', 'Frases das aulas', 'chat']];
  h += '<h2 class="h2">Escolha uma revisão</h2><div class="card list">' + opc.map(function (o) {
    var qt = o[0] === 'audio' ? n : o[0] === 'frases' ? Object.keys(S.done).filter(function (id) { return PED[id]; }).length : listaRev(o[0]).length;
    return '<button class="row-btn" type="button" data-act="rev" data-m="' + o[0] + '"' + (qt ? '' : ' disabled') + '>' + ico(o[2]) + '<span><b>' + esc(o[1]) + '</b><small>' + (o[0] === 'frases' ? (qt ? 'De ' + qt + ' aula' + (qt > 1 ? 's' : '') + ' concluída' + (qt > 1 ? 's' : '') : 'Conclua uma aula para liberar') : qt + ' palavra' + (qt === 1 ? '' : 's')) + '</small></span>' + ico('right', 'go') + '</button>'; }).join('') + '</div>';
  h += '<h2 class="h2">Por módulo</h2><div class="card list">' + MODULOS.map(function (m, i) { var qt = listaRev('m' + i).length; return '<button class="row-btn" type="button" data-act="rev" data-m="m' + i + '"' + (qt ? '' : ' disabled') + '><span class="num-s">' + (i + 1) + '</span><span><b>' + esc(m.nome) + '</b><small>' + qt + ' palavra' + (qt === 1 ? '' : 's') + ' estudada' + (qt === 1 ? '' : 's') + '</small></span>' + ico('right', 'go') + '</button>'; }).join('') + '</div>';
  var feitas = DIAS.filter(function (d) { return d.tipo === 'aula' && S.done[d.id]; });
  if (feitas.length) h += '<h2 class="h2">Refazer uma aula</h2><div class="card mod">' + feitas.map(function (d) { var i = DIAS.indexOf(d); return '<button class="day ok" type="button" data-act="abrir-dia" data-i="' + i + '"><span class="st">' + ico('check') + '</span><span><b>Dia ' + (i + 1) + ' · ' + esc(lic(d.id).titulo) + '</b><small>Refazer a aula completa</small></span><span class="go">' + ico('right') + '</span></button>'; }).join('') + '</div>';
  return h;
}

/* caderno de vocabulário */
var CAD = { f: 'todas', q: '', aberto: '' };
var ROTULO = { dificil: 'Difícil', aprendendo: 'Aprendendo', dominada: 'Dominada', novo: 'Não estudada' };
function telaCaderno() {
  var grupos = [['todas', 'Todas'], ['aprendendo', 'Aprendendo'], ['dominada', 'Dominadas'], ['dificil', 'Difíceis'], ['fav', 'Favoritas'], ['erros', 'Erros']];
  return '<h1 class="h1" style="margin:4px 0 2px">Caderno</h1><p class="sub">As palavras que você já estudou, com áudio, exemplo e a próxima revisão. A busca encontra qualquer palavra do curso.</p>' +
    '<label class="search"><span class="sr">Buscar palavra ou tradução</span>' + ico('search') + '<input id="cadBusca" type="search" placeholder="Buscar em inglês ou português" value="' + esc(CAD.q) + '" autocomplete="off"></label>' +
    '<div class="seg" role="tablist" aria-label="Filtrar palavras">' + grupos.map(function (g) { return '<button type="button" role="tab" aria-selected="' + (CAD.f === g[0]) + '" class="' + (CAD.f === g[0] ? 'on' : '') + '" data-act="cad-f" data-f="' + g[0] + '">' + g[1] + ' (' + listaRev(g[0]).length + ')</button>'; }).join('') + '</div><div id="cadLista">' + listaCaderno() + '</div>';
}
function listaCaderno() {
  var q = kPt(CAD.q), lista;
  if (q) lista = Object.keys(INDICE).filter(function (w) { return kPt(w).indexOf(q) > -1 || kPt(INDICE[w].it[2]).indexOf(q) > -1; });
  else lista = listaRev(CAD.f);
  if (!lista.length) return q ? vazio('search', 'Nada encontrado', 'Tente outra palavra, em inglês ou em português.') : vazio('book', 'Nenhuma palavra nesta lista', CAD.f === 'todas' ? 'Faça a primeira aula para começar o seu caderno.' : 'Quando houver palavras nesta categoria, elas aparecem aqui.');
  lista.sort(function (a, b) { return a.toLowerCase() < b.toLowerCase() ? -1 : 1; });
  return '<p class="note" style="margin-bottom:8px">' + lista.length + ' palavra' + (lista.length > 1 ? 's' : '') + (q ? ' encontrada' + (lista.length > 1 ? 's' : '') : '') + '</p><div class="card list">' + lista.slice(0, 200).map(linhaCaderno).join('') + '</div>';
}
function linhaCaderno(w) {
  var e = INDICE[w], it = e.it, x = S.w[w] || { st: 'novo' }, ab = CAD.aberto === w, st = x.seen ? x.st : 'novo', mi = moduloDe(e.l.id), ex = exemploPara(w, e.l.id);
  var h = '<div class="wl2' + (ab ? ' open' : '') + '"><div class="wl"><button class="play" type="button" data-act="falar" data-t="' + esc(w) + '" aria-label="Ouvir ' + esc(w) + '">' + ico('play') + '</button>' +
    '<button class="t tbtn" type="button" data-act="cad-abre" data-w="' + esc(w) + '" aria-expanded="' + ab + '"><b lang="en">' + esc(w) + '</b><span>' + esc(it[2]) + '</span></button><span class="pill p-' + ({ dificil: 'err', aprendendo: 'warn', dominada: 'ok', novo: 'grey' })[st] + '">' + ROTULO[st] + '</span></div>';
  if (ab) {
    h += '<div class="det"><div class="row"><button class="btn btn-s" type="button" data-act="falar" data-t="' + esc(w) + '">' + ico('play') + 'Ouvir</button><button class="btn btn-o" type="button" data-act="falar" data-t="' + esc(w) + '" data-lento="1">' + ico('slow') + 'Lento</button><button class="favb' + (x.fav ? ' on' : '') + '" type="button" data-act="fav" data-w="' + esc(w) + '" aria-pressed="' + !!x.fav + '" aria-label="Favorita">' + ico('star') + '</button></div>' +
      '<p class="approx">Guia aproximado: <b>' + esc(it[1]) + '</b></p><p class="tip">' + esc(it[3]) + '</p>' +
      (ex ? '<div class="ex"><button class="play" type="button" data-act="falar" data-t="' + esc(ex[0]) + '" aria-label="Ouvir o exemplo">' + ico('play') + '</button><div class="t"><b lang="en">' + esc(ex[0]) + '</b><span>' + esc(ex[1]) + '</span></div></div>' : '') +
      '<dl class="meta"><div><dt>Categoria</dt><dd>' + (mi > -1 ? 'Módulo ' + (mi + 1) + ' · ' : 'Bônus · ') + esc(e.l.titulo) + '</dd></div>' +
      (x.seen ? '<div><dt>Estudada em</dt><dd>' + dataBR(x.seen) + '</dd></div><div><dt>Próxima revisão</dt><dd>' + (x.due <= hoje() ? 'Hoje' : dataBR(x.due)) + '</dd></div>' + (x.err ? '<div><dt>Erros</dt><dd>' + x.err + '</dd></div>' : '') : '<div><dt>Situação</dt><dd>Ainda não estudada</dd></div>') + '</dl>' +
      (x.seen ? '<p class="note">Como está esta palavra para você?</p><div class="rate">' + [['dificil', 'Difícil'], ['aprendendo', 'Aprendendo'], ['dominada', 'Dominada']].map(function (o) { return '<button type="button" data-act="cad-cls" data-w="' + esc(w) + '" data-v="' + o[0] + '" class="' + (st === o[0] ? 'on' : '') + '" aria-pressed="' + (st === o[0]) + '">' + o[1] + '</button>'; }).join('') + '</div>' : '') + '</div>';
  }
  return h + '</div>';
}

/* evolução: nível, habilidades, relatório, conquistas e certificado */
function telaEvolucao() {
  var nv = nivel(), pr = nv.prox ? Math.round((nv.p - nv.ini) / (nv.prox - nv.ini) * 100) : 100;
  var h = '<h1 class="h1" style="margin:4px 0 2px">Sua evolução</h1><p class="sub">O que você já aprendeu e o que já consegue fazer em inglês.</p>';
  h += '<div class="card hero" style="margin-top:14px"><span class="pill pill-hero">Nível ' + nv.n + ' de ' + NIVEIS.length + '</span><b style="display:block;font-size:1.35rem;margin:8px 0 4px">' + esc(nv.nome) + '</b><p class="sub">' + nv.p + ' pontos' + (nv.prox ? ' · faltam ' + (nv.prox - nv.p) + ' para “' + esc(nv.proxNome) + '”' : ' · nível máximo do curso') + '</p><div class="bar" style="margin-top:12px"><i style="width:' + pr + '%"></i></div><p class="sub" style="font-size:.82rem;margin-top:8px">Os pontos vêm de palavras estudadas e dominadas, acertos de primeira, frases construídas, revisões e aulas.</p></div>';
  h += '<h2 class="h2">Habilidades</h2><div class="card">' + ['vocab', 'escuta', 'trad', 'constr', 'recall'].map(function (k) { var x = S.st[k], t = x ? x.tot : 0, pc = Math.round(taxa(k) * 100);
    return '<div class="skill"><div><b>' + HAB[k] + '</b><span>' + (t ? pc + '% de primeira · ' + t + ' exercício' + (t > 1 ? 's' : '') : 'Ainda sem exercícios') + '</span></div><div class="bar"><i style="width:' + (t ? pc : 0) + '%"></i></div></div>'; }).join('') +
    '<p class="note">Fala: o microfone reconheceu ' + ((S.st.fala && S.st.fala.ok) || 0) + ' de ' + ((S.st.fala && S.st.fala.tot) || 0) + ' tentativas. Ele mostra se a fala foi entendida, não avalia o sotaque.</p></div>';
  var dias = []; for (var i = 6; i >= 0; i--) dias.push(addDias(hoje(), -i));
  var maxT = Math.max(60, Math.max.apply(null, dias.map(function (d) { return S.tempo[d] || 0; })));
  h += '<h2 class="h2">Últimos 7 dias</h2><div class="card"><div class="week" role="img" aria-label="Minutos de estudo nos últimos 7 dias: ' + dias.map(function (d) { return diaSem(d) + ' ' + Math.round((S.tempo[d] || 0) / 60) + ' min'; }).join(', ') + '">' +
    dias.map(function (d) { var t = S.tempo[d] || 0; return '<div><em>' + Math.round(t / 60) + '</em><span class="bv' + (S.days[d] ? ' on' : '') + '" style="height:' + Math.max(4, Math.round(t / maxT * 100)) + '%"></span><small>' + diaSem(d) + '</small></div>'; }).join('') + '</div><p class="note">Minutos de estudo por dia · ' + Object.keys(S.days).length + ' dias ativos no total</p></div>';
  h += '<h2 class="h2">Relatório</h2><div class="stats">' + stat(aprendidas(), 'palavras estudadas') + stat(contar('dominada'), 'dominadas') + stat(contar('dificil'), 'difíceis') + stat(S.frases, 'frases praticadas') + stat(S.revs, 'revisões') + stat(minutos(tempoTotal()), 'tempo total') + stat(Object.keys(S.days).length, 'dias ativos') + stat(acertoGeral() + '%', 'acertos de primeira') + stat(sequencia(), 'dias seguidos') + '</div>';
  h += '<h2 class="h2">Por módulo</h2><div class="card">' + MODULOS.map(function (m, mi) { var tot = m.aulas.reduce(function (t, id) { return t + lic(id).itens.length; }, 0), l = listaRev('m' + mi), dom = l.filter(function (w) { return S.w[w].st === 'dominada'; }).length;
    return '<div class="skill"><div><b>' + (mi + 1) + '. ' + esc(m.nome) + '</b><span>' + l.length + ' de ' + tot + ' estudadas · ' + dom + ' dominadas</span></div><div class="bar"><i style="width:' + Math.round(l.length / tot * 100) + '%"></i></div></div>'; }).join('') + '</div>';
  var pode = []; MODULOS.forEach(function (m, mi) { var n = m.aulas.filter(function (id) { return S.done[id]; }).length; if (n >= 3 || moduloFeito(mi)) pode = pode.concat(CONSEGUE[mi]); });
  h += '<h2 class="h2">O que você já consegue fazer</h2><div class="card">' + (pode.length ? '<ul class="can">' + pode.map(function (x) { return '<li>' + ico('check') + '<span>' + esc(x) + '</span></li>'; }).join('') + '</ul>' : '<p class="sub">Conclua 3 aulas de um módulo para ver aqui o que você já consegue fazer em inglês.</p>') + '</div>';
  var ganhas = MEDALHAS.filter(function (m) { return S.medals[m.id]; }).length;
  h += '<h2 class="h2">Conquistas · ' + ganhas + ' de ' + MEDALHAS.length + '</h2><div class="medals">' + MEDALHAS.map(function (m) { var on = S.medals[m.id], p = m.prog();
    return '<div class="medal' + (on ? ' on' : '') + '"><div class="m">' + ico(on ? 'award' : 'lock') + '</div><b>' + esc(m.n) + '</b><small>' + (on ? 'Conquistada em ' + dataBR(on) : esc(m.r) + (p[1] > 1 ? ' · ' + p[0] + '/' + p[1] : '')) + '</small></div>'; }).join('') + '</div>';
  h += '<div class="card" style="margin-top:12px"><b>Certificado de conclusão</b><p class="sub" style="margin:4px 0 12px">' + (certificadoOk() ? 'Você concluiu o curso. Seu certificado está pronto.' : 'Disponível ao concluir as 25 aulas, as 4 avaliações de módulo e a avaliação final.') + '</p><button class="btn btn-s" type="button" data-act="certificado"' + (certificadoOk() ? '' : ' disabled') + '>Ver certificado</button></div>';
  h += '<h2 class="h2">Histórico</h2><div class="card">' + (S.hist.length ? '<ul class="hist">' + S.hist.slice(0, 15).map(function (x) { return '<li><span>' + esc(x.t) + '</span><time>' + dataBR(x.d) + '</time></li>'; }).join('') + '</ul>' : '<p class="sub">Suas atividades aparecem aqui.</p>') + '</div>';
  return h;
}

/* ================= aula (6 etapas) ================= */
var ETAPAS = ['Aprenda', 'Escute', 'Pronuncie', 'Construa', 'Pratique', 'Revise'];
function abrirDia(i) {
  var d = DIAS[i]; if (!d) return;
  if (d.tipo === 'aula') { abrirAula(d.id, i); return; }
  var bl = bloqueio(d); if (bl && !feito(d)) { modal('<h3 id="mT">Ainda não liberado</h3><p>' + esc(bl) + '</p>'); return; }
  abrirAvaliacao(d, i);
}
function abrirAula(id, diaIdx) {
  pararMic();
  AULA = { tipo: 'aula', id: id, dia: diaIdx, l: lic(id), p: PED[id], fase: 'obj', i: 0, rec: {}, erros: {}, frasesOk: 0, frases: frasesDaAula(id), stats: { first: 0, tot: 0 } };
  SESSAO = AULA; setNav(false); renderAula(); scrollTo(0, 0);
}
function cabecalho(titulo, sub, etapaIdx) {
  return '<div class="lhead"><button class="iconbtn" type="button" data-act="sair" aria-label="Sair">' + ico('x') + '</button><div class="t"><b>' + esc(titulo) + '</b><small>' + esc(sub) + '</small></div></div>' +
    (etapaIdx == null ? '' : '<ol class="steps" aria-label="Etapas da aula">' + ETAPAS.map(function (e, k) { var c = etapaIdx === 2 ? (k <= 2 ? 'on' : '') : k < etapaIdx ? 'ok' : k === etapaIdx ? 'on' : ''; return '<li class="' + c + '"' + (k === etapaIdx ? ' aria-current="step"' : '') + '><span>' + (k + 1) + '. ' + e + '</span></li>'; }).join('') + '</ol>');
}
function renderAula() {
  var A = AULA, v = $('#view'), dia = A.dia != null ? 'Dia ' + (A.dia + 1) + ' de 30' : 'Aula bônus';
  if (A.fase === 'obj') v.innerHTML = cabecalho(A.l.titulo, dia) + telaObjetivo();
  else if (A.fase === 'vocab') v.innerHTML = cabecalho(A.l.titulo, dia + ' · Palavra ' + (A.i + 1) + ' de ' + A.l.itens.length, 2) + cartaoPalavra();
  else if (A.fase === 'construa') v.innerHTML = cabecalho(A.l.titulo, dia + ' · Construa', 3) + telaEstrutura();
  else if (A.fase === 'cons-ex' || A.fase === 'prat-ex') v.innerHTML = cabecalho(A.l.titulo, dia + (A.fase === 'cons-ex' ? ' · Construa ' : ' · Pratique ') + (A.run.k + 1) + ' de ' + A.run.itens.length, A.fase === 'cons-ex' ? 3 : 4) + telaItem(A.run.itens[A.run.k]);
  else if (A.fase === 'dialogo') v.innerHTML = cabecalho(A.l.titulo, dia + ' · Pratique', 4) + telaDialogo();
  else if (A.fase === 'revise') v.innerHTML = cabecalho(A.l.titulo, dia + ' · Revise', 5) + telaReviseAula();
  else if (A.fase === 'fim') v.innerHTML = telaFimAula();
  focarTitulo();
}
function focarTitulo() { var t = $('#view .lhead .t b') || $('#view h1'); if (t) { t.setAttribute('tabindex', '-1'); try { t.focus({ preventScroll: true }); } catch (e) {} } }
function telaObjetivo() {
  var A = AULA, mi = moduloDe(A.id);
  return '<div class="card"><span class="pill p-blue">' + (mi > -1 ? 'Módulo ' + (mi + 1) + ' · ' + esc(MODULOS[mi].nome) : 'Aula bônus') + '</span><h1 class="h1" style="margin:12px 0 6px">' + esc(A.l.titulo) + '</h1><p class="sub">' + esc(A.l.sub) + '</p>' +
    '<h2 class="h3">Nesta aula você vai</h2><ul class="can">' +
    ['Aprender ' + A.l.itens.length + ' palavras e expressões, com áudio e exemplo', 'Usar a estrutura: ' + A.p.est.t, 'Montar e transformar frases com ela', 'Praticar num diálogo real e responder em voz alta'].map(function (x) { return '<li>' + ico('check') + '<span>' + esc(x) + '</span></li>'; }).join('') + '</ul>' +
    '<p class="note">Cerca de 15 minutos. Você pode sair a qualquer momento: o que estudou fica salvo.</p></div><button class="btn btn-p full" type="button" data-act="aula-ini" style="margin-top:14px">Começar a aula ' + ico('right') + '</button>';
}
function cartaoPalavra() {
  var A = AULA, it = A.l.itens[A.i], w = it[0], x = W(w), ex = exemploPara(w, A.id), sons = sonsDe(w), r = A.rec[w];
  marcarVisto(w); save();
  var h = '<div class="card">';
  h += '<div class="sec"><div class="lbl"><i>1</i>Aprenda</div><div style="display:flex;gap:12px;align-items:flex-start"><div style="flex:1;min-width:0"><div class="word" lang="en">' + esc(w) + '</div><div class="mean">' + esc(it[2]) + '</div></div><button class="favb' + (x.fav ? ' on' : '') + '" type="button" data-act="fav" data-w="' + esc(w) + '" aria-pressed="' + !!x.fav + '" aria-label="Marcar como favorita">' + ico('star') + '</button></div>' +
    '<div class="tip">' + esc(it[3]) + '</div>' + (ex ? '<div class="ex"><button class="play" type="button" data-act="falar" data-t="' + esc(ex[0]) + '" aria-label="Ouvir a frase de exemplo">' + ico('play') + '</button><div class="t"><small class="note">Exemplo</small><b lang="en">' + esc(ex[0]) + '</b><span>' + esc(ex[1]) + '</span></div></div>' : '') + '</div>';
  h += '<div class="sec"><div class="lbl"><i>2</i>Escute</div><div class="row"><button class="btn btn-s" type="button" data-act="falar" data-t="' + esc(w) + '">' + ico('play') + 'Ouvir</button><button class="btn btn-o" type="button" data-act="falar" data-t="' + esc(w) + '" data-lento="1">' + ico('slow') + 'Ouvir lento</button></div>' +
    '<div class="approx"><span>Guia aproximado:</span><b>' + esc(it[1]) + '</b><button class="btn-g ib" type="button" data-act="guia" aria-label="Como ler o guia de pronúncia">' + ico('info') + '</button></div><p class="note">O áudio é a referência. O guia só ajuda a começar.</p>' +
    sons.map(function (s) { return '<button class="sound" type="button" data-act="som" data-s="' + s + '">' + ico('info') + 'Som difícil: ' + esc(SONS[s].t.replace('O som do ', '').replace('O ', '')) + ' · ver como fazer</button> '; }).join('') + '</div>';
  h += '<div class="sec"><div class="lbl"><i>3</i>Pronuncie</div><div class="mic"><button class="micb" type="button" id="micBtn" data-act="mic" aria-label="Toque para falar" aria-pressed="false">' + ico('mic') + '</button><div class="st" id="micSt"><b>Toque para falar</b><span class="note">Diga “' + esc(w) + '” depois de tocar</span></div></div><div id="micFb" aria-live="polite">' + (r ? fbHtml(msgFala(r, w)) : '') + '</div></div>';
  h += '</div><div class="lnav"><button class="btn btn-o" type="button" data-act="ant"' + (A.i === 0 ? ' disabled' : '') + ' aria-label="Palavra anterior">' + ico('left') + '</button><button class="btn btn-p" type="button" data-act="prox">' + (A.i === A.l.itens.length - 1 ? 'Ir para Construa' : 'Próxima palavra') + ' ' + ico('right') + '</button></div>';
  setTimeout(function () { if (AULA === A && A.fase === 'vocab' && A.l.itens[A.i][0] === w) falar(w); }, 300);
  return h;
}
function telaEstrutura() {
  var p = AULA.p;
  return '<div class="card"><div class="lbl"><i>4</i>Construa</div><h2 style="font-size:1.25rem;margin-bottom:6px">' + esc(p.est.t) + '</h2><p class="sub" style="color:var(--ink2)">' + esc(p.est.x) + '</p>' +
    p.est.ex.map(function (e) { return '<div class="ex"><button class="play" type="button" data-act="falar" data-t="' + esc(e[0]) + '" aria-label="Ouvir">' + ico('play') + '</button><div class="t"><b lang="en">' + esc(e[0]) + '</b><span>' + esc(e[1]) + '</span></div></div>'; }).join('') +
    '<p class="note" style="margin-top:12px">Agora você vai montar 3 frases e depois transformar 2: trocar uma palavra, fazer uma negativa ou uma pergunta. É assim que você cria frases novas sozinho(a).</p></div><button class="btn btn-p full" type="button" data-act="cons-ini" style="margin-top:14px">Montar frases ' + ico('right') + '</button>';
}
function ultimaFalaB(p) { return p.dlg.filter(function (d) { return d[0] !== 'A'; }).slice(-1)[0] || p.dlg[p.dlg.length - 1]; }
function telaDialogo() {
  var p = AULA.p, ult = ultimaFalaB(p);
  return '<div class="card"><div class="lbl"><i>5</i>Pratique · diálogo</div><p class="sub">Ouça a conversa. Toque em uma linha para ouvir só ela.</p><ul class="dlg">' +
    p.dlg.map(function (d) { return '<li><span class="who' + (d[0] === 'A' ? '' : ' b') + '">' + esc(d[0]) + '</span><div class="t"><b lang="en">' + esc(d[1]) + '</b><span>' + esc(d[2]) + '</span></div><button class="play" type="button" data-act="falar" data-t="' + esc(d[1]) + '" aria-label="Ouvir esta fala">' + ico('play') + '</button></li>'; }).join('') +
    '</ul><button class="btn btn-s full" type="button" data-act="dlg-todo" style="margin-top:10px">' + ico('play') + 'Ouvir o diálogo completo</button></div>' +
    '<div class="card"><div class="lbl">Desafio de conversação</div><p>Agora é a sua vez. Você é a pessoa <b>' + esc(ult[0]) + '</b>. Diga em inglês:</p><p class="q">“' + esc(ult[2]) + '”</p>' +
    '<details class="hint"><summary>Ver a frase em inglês</summary><p lang="en"><b>' + esc(ult[1]) + '</b> <button class="btn-g" type="button" data-act="falar" data-t="' + esc(ult[1]) + '">' + ico('play') + 'Ouvir</button></p></details>' +
    '<div class="mic" style="margin-top:12px"><button class="micb" type="button" id="micBtn" data-act="mic-dlg" aria-label="Toque para falar" aria-pressed="false">' + ico('mic') + '</button><div class="st" id="micSt"><b>Toque para falar</b><span class="note">Sem pressão: pode tentar quantas vezes quiser</span></div></div><div id="micFb" aria-live="polite"></div></div>' +
    '<button class="btn btn-p full" type="button" data-act="p-fim" style="margin-top:14px">Ir para Revise ' + ico('right') + '</button>';
}
function telaReviseAula() {
  var A = AULA;
  if (!A.revIni) {
    A.revIni = true; A.class = {};
    A.l.itens.forEach(function (it) { A.class[it[0]] = A.erros[it[0]] ? 'dificil' : 'aprendendo'; });
    A.antigas = shuffle(pendentes().filter(function (w) { return !A.l.itens.some(function (it) { return it[0] === w; }); })).slice(0, 3); A.ai = 0; A.mostrou = false;
  }
  var h = '<div class="card"><div class="lbl"><i>6</i>Revise</div><p>Como você se sente com cada palavra? A sua escolha define quando ela volta.</p>' +
    '<p class="note" style="margin:6px 0 4px"><b style="color:var(--err)">Difícil</b>: volta amanhã · <b style="color:var(--warn)">Aprendendo</b>: em poucos dias · <b style="color:var(--ok)">Dominada</b>: em uma semana ou mais. As palavras que você errou já vêm marcadas como difíceis.</p>' +
    A.l.itens.map(function (it) { var w = it[0], c = A.class[w]; return '<div class="wl" style="display:block"><div style="display:flex;gap:10px;align-items:center"><button class="play" type="button" data-act="falar" data-t="' + esc(w) + '" aria-label="Ouvir ' + esc(w) + '">' + ico('play') + '</button><div class="t"><b lang="en">' + esc(w) + '</b><span>' + esc(it[2]) + '</span></div></div><div class="rate" role="radiogroup" aria-label="' + esc(w) + '">' +
      [['dificil', 'Difícil'], ['aprendendo', 'Aprendendo'], ['dominada', 'Dominada']].map(function (o) { return '<button type="button" role="radio" data-act="cls" data-w="' + esc(w) + '" data-v="' + o[0] + '" class="' + (c === o[0] ? 'on' : '') + '" aria-checked="' + (c === o[0]) + '">' + o[1] + '</button>'; }).join('') + '</div></div>'; }).join('') + '</div>';
  if (A.antigas.length && A.ai < A.antigas.length) {
    var w = A.antigas[A.ai], it = itemDe(w);
    h += '<div class="card"><div class="lbl">Revisão de aulas anteriores · ' + (A.ai + 1) + ' de ' + A.antigas.length + '</div><p class="sub">Você lembra como se diz em inglês?</p><p class="q">“' + esc(it[2]) + '”</p>' +
      (A.mostrou ? '<div class="ex"><button class="play" type="button" data-act="falar" data-t="' + esc(w) + '" aria-label="Ouvir">' + ico('play') + '</button><div class="t"><b lang="en" style="font-size:1.2rem">' + esc(w) + '</b><span>' + esc(it[1]) + '</span></div></div><div class="rate">' +
        [['dificil', 'Não lembrei'], ['aprendendo', 'Com esforço'], ['dominada', 'Lembrei fácil']].map(function (o) { return '<button type="button" data-act="ant-cls" data-v="' + o[0] + '">' + o[1] + '</button>'; }).join('') + '</div>'
        : '<button class="btn btn-s full" type="button" data-act="mostrar">Mostrar a resposta</button>') + '</div>';
  }
  h += '<button class="btn btn-p full" type="button" data-act="concluir" style="margin-top:14px">Concluir a aula ' + ico('check') + '</button>';
  return h;
}
function concluirAula() {
  var A = AULA;
  Object.keys(A.class).forEach(function (w) { classificar(w, A.class[w]); });
  var pct = A.stats.tot ? Math.round(A.stats.first / A.stats.tot * 100) : 100;
  var ant = S.done[A.id]; S.done[A.id] = { d: hoje(), pct: ant ? Math.max(ant.pct || 0, pct) : pct };
  estudou('Concluiu ' + (A.dia != null ? 'o dia ' + (A.dia + 1) + ': ' : 'a aula bônus: ') + A.l.titulo);
  A.fase = 'fim'; A.pct = pct; renderAula(); scrollTo(0, 0); plim(); festa();
}
function blocoMedalhas() { var md = novasMedalhas.splice(0); return md.length ? '<div class="card"><b>Nova conquista!</b>' + md.map(function (m) { return '<div class="goal" style="margin-top:10px"><span class="ck on">' + ico('award') + '</span><div><b>' + esc(m.n) + '</b><div class="sub">' + esc(m.r) + '</div></div></div>'; }).join('') + '</div>' : ''; }
function telaFimAula() {
  var A = AULA, prox = diaAtual(), mi = moduloDe(A.id);
  var h = '<div class="card big-ok"><div class="ic">' + ico('check') + '</div><h1 class="h1">Aula concluída!</h1><p class="sub" style="margin-top:6px">' + (A.dia != null ? 'Dia ' + (A.dia + 1) + ' de 30 · ' : '') + esc(A.l.titulo) + '</p>' +
    '<div class="stats" style="margin-top:16px;text-align:left">' + stat(A.l.itens.length, 'palavras estudadas') + stat(A.pct + '%', 'acertos de primeira') + stat(A.frasesOk, 'frases praticadas') + '</div></div>';
  h += '<div class="card"><b>Agora você consegue</b><ul class="can">' + ['Usar “' + A.p.est.t.split(':')[0] + '”', 'Entender o diálogo da aula'].concat(mi > -1 ? [CONSEGUE[mi][Math.min(2, MODULOS[mi].aulas.indexOf(A.id) % 3)]] : []).map(function (x) { return '<li>' + ico('check') + '<span>' + esc(x) + '</span></li>'; }).join('') + '</ul></div>';
  h += blocoMedalhas();
  h += '<div class="row" style="margin-top:14px">' + (prox < DIAS.length && !(A.dia === prox) ? '<button class="btn btn-p" type="button" data-act="abrir-dia" data-i="' + prox + '">Próximo: Dia ' + (prox + 1) + ' ' + ico('right') + '</button>' : '') + '<button class="btn btn-o" type="button" data-act="ir" data-tab="inicio">Voltar ao início</button></div>';
  return h;
}

/* ================= itens de exercício (usados em aulas, avaliações, estudo rápido e desafio) ================= */
function telaItem(q) {
  if (!q) return '';
  if (q.kind === 'q') return telaQuestao(q);
  if (q.kind === 'dig') return telaDigitar(q);
  if (q.kind === 'montar') return telaMontar(q);
  if (q.kind === 'cartao') return telaCartao(q);
  if (q.kind === 'oral') return telaOral(q);
  return '';
}
function proxBtn() { return '<button class="btn btn-p full" type="button" data-act="item-prox" style="margin-top:14px">Continuar ' + ico('right') + '</button>'; }
function telaQuestao(q) {
  var h = '<div class="card"><p class="sub">' + esc(q.pergunta) + '</p>';
  if (q.destaque) h += '<p class="q" lang="' + (q.dLang || 'pt') + '">' + esc(q.destaque) + '</p>';
  if (q.sub) h += '<p class="sub" style="margin:-6px 0 12px">' + esc(q.sub) + '</p>';
  if (q.audio) h += '<div class="row" style="margin-bottom:12px"><button class="btn btn-s" type="button" data-act="falar" data-t="' + esc(q.audio) + '">' + ico('play') + 'Ouvir</button><button class="btn btn-o" type="button" data-act="falar" data-t="' + esc(q.audio) + '" data-lento="1">' + ico('slow') + 'Lento</button></div>';
  h += '<div class="opts" role="group" aria-label="Alternativas">' + q.ops.map(function (o, n) { var c = q.resp != null ? (o === q.certo ? ' right' : o === q.resp ? ' wrong' : '') : ''; return '<button class="opt' + c + '" type="button" data-act="resp" data-n="' + n + '"' + (q.opLang ? ' lang="' + q.opLang + '"' : '') + (q.resp != null ? ' disabled' : '') + '><span>' + esc(o) + '</span>' + (c === ' right' ? ico('check', 'oi') : c === ' wrong' ? ico('x', 'oi') : '') + '</button>'; }).join('') + '</div>';
  if (q.resp != null) h += '<div aria-live="polite">' + (q.resp === q.certo ? '<div class="fb ok"><b>' + ico('check') + ' Correto!</b> ' + esc(q.dica) + '</div>' : '<div class="fb err"><b>Não foi dessa vez.</b> ' + TUTOR.explicarErro(q.certo, q.resp, esc(q.dica)) + '</div>') + '</div>';
  h += '</div>' + (q.resp != null ? proxBtn() : '');
  if (q.auto && !q.tocou) { q.tocou = true; setTimeout(function () { falar(q.audio); }, 350); }
  return h;
}
function telaDigitar(q) {
  var fim = q.res === 'ok' || q.res === 'typo' || q.res === 'err';
  var h = '<div class="card"><p class="sub">Escreva em inglês, sem ver as opções:</p><p class="q">“' + esc(q.pt) + '”</p>' +
    '<label class="field"><span class="sr">Sua resposta em inglês</span><input id="digIn" lang="en" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false" placeholder="Digite aqui" value="' + esc(q.valor || '') + '"' + (fim ? ' disabled' : '') + '></label>';
  if (q.res === 'err1') h += '<div class="fb mid" role="status"><b>Ainda não.</b> ' + TUTOR.dicaDigitar(q.certo) + ' Tente mais uma vez.</div>';
  if (q.res === 'ok') h += '<div class="fb ok" role="status"><b>' + ico('check') + ' Correto!</b> “' + esc(q.certo) + '”. <button class="btn-g" type="button" data-act="falar" data-t="' + esc(q.certo) + '">' + ico('play') + 'Ouvir</button></div>';
  if (q.res === 'typo') h += '<div class="fb ok" role="status"><b>Quase perfeito!</b> Só confira a escrita: <b lang="en">' + esc(q.certo) + '</b>. Contou como acerto.</div>';
  if (q.res === 'err') h += '<div class="fb err" role="status"><b>Resposta:</b> <b lang="en">' + esc(q.certo) + '</b>. Esta palavra vai para a revisão. <button class="btn-g" type="button" data-act="falar" data-t="' + esc(q.certo) + '">' + ico('play') + 'Ouvir</button></div>';
  h += '</div>' + (fim ? proxBtn() : '<div class="row" style="margin-top:14px"><button class="btn btn-o" type="button" data-act="dig-nao">Não sei</button><button class="btn btn-p" type="button" data-act="dig-ver">Verificar</button></div>');
  if (!fim) setTimeout(function () { var i = $('#digIn'); if (i) try { i.focus({ preventScroll: true }); } catch (e) {} }, 60);
  return h;
}
function telaMontar(q) {
  var fim = q.res === 'ok' || q.res === 'err';
  var h = '<div class="card"><p class="sub">' + esc(q.instr) + '</p>' + (q.base ? '<p class="base" lang="en">' + esc(q.base) + '</p><p class="sub">Resultado em português:</p>' : '') + '<p class="q">“' + esc(q.pt) + '”</p>' +
    '<div class="build" aria-label="Sua frase" aria-live="polite">' + (q.sel.length ? q.sel.map(function (n) { return '<button class="tile" type="button" data-act="tile-tira" data-n="' + n + '"' + (fim ? ' disabled' : '') + ' lang="en">' + esc(q.banco[n].t) + '</button>'; }).join('') : '<span class="note" style="padding:10px">Toque nas palavras abaixo, na ordem certa</span>') + '</div>' +
    '<div class="bank">' + q.banco.map(function (b) { return '<button class="tile' + (b.u ? ' used' : '') + '" type="button" data-act="tile-poe" data-n="' + b.n + '"' + (fim || b.u ? ' disabled' : '') + ' lang="en"' + (b.u ? ' aria-hidden="true" tabindex="-1"' : '') + '>' + esc(b.t) + '</button>'; }).join('') + '</div>';
  if (q.res === 'err1') h += '<div class="fb mid" role="status"><b>Quase.</b> A frase começa com <b>“' + esc(q.alvo.split(' ')[0]) + '”</b>. Tente de novo.</div>';
  if (q.res === 'ok') h += '<div class="fb ok" role="status"><b>' + ico('check') + ' Correto!</b> “' + esc(q.alvo) + '” = ' + esc(q.pt) + '.</div>';
  if (q.res === 'err') h += '<div class="fb err" role="status"><b>Ainda não.</b> ' + TUTOR.explicarOrdem(q.alvo, q.dicaEst) + '</div>';
  h += '</div>' + (fim ? proxBtn() : '<div class="row" style="margin-top:14px"><button class="btn btn-o" type="button" data-act="tile-limpa">Limpar</button><button class="btn btn-p" type="button" data-act="tile-ver"' + (q.sel.length ? '' : ' disabled') + '>Verificar</button></div>');
  return h;
}
function telaCartao(q) {
  var it = q.w ? itemDe(q.w) : null, h = '<div class="card">';
  if (q.modo === 'audio') h += '<p class="sub">Ouça e tente lembrar o significado:</p><div class="row" style="margin:12px 0"><button class="btn btn-s" type="button" data-act="falar" data-t="' + esc(q.w) + '">' + ico('play') + 'Ouvir</button><button class="btn btn-o" type="button" data-act="falar" data-t="' + esc(q.w) + '" data-lento="1">' + ico('slow') + 'Lento</button></div>';
  else if (q.modo === 'frase') h += '<p class="sub">Como se diz esta frase em inglês?</p><p class="q">“' + esc(q.pt) + '”</p><p class="note">Tente dizer em voz alta antes de ver a resposta.</p>';
  else h += '<p class="sub">Como se diz em inglês?</p><p class="q" style="font-size:1.45rem">“' + esc(it[2]) + '”</p><p class="note">Tente lembrar e falar em voz alta antes de ver a resposta.</p>';
  if (q.mostrou) {
    if (q.modo === 'frase') h += '<div class="sec"><div class="ex"><button class="play" type="button" data-act="falar" data-t="' + esc(q.en) + '" aria-label="Ouvir">' + ico('play') + '</button><div class="t"><b lang="en" style="font-size:1.2rem">' + esc(q.en) + '</b></div></div>';
    else h += '<div class="sec"><div class="ex"><button class="play" type="button" data-act="falar" data-t="' + esc(q.w) + '" aria-label="Ouvir">' + ico('play') + '</button><div class="t"><b lang="en" style="font-size:1.35rem">' + esc(q.w) + '</b><span>' + esc(it[2]) + ' · guia: ' + esc(it[1]) + '</span></div></div>';
    h += '<p class="note" style="margin-top:12px">Como foi?</p><div class="rate">' + [['dificil', 'Não lembrei'], ['aprendendo', 'Com esforço'], ['dominada', 'Lembrei fácil']].map(function (o) { return '<button type="button" data-act="card-cls" data-v="' + o[0] + '">' + o[1] + '</button>'; }).join('') + '</div></div>';
  } else h += '<button class="btn btn-p full" type="button" data-act="card-mostra" style="margin-top:14px">Mostrar a resposta</button>';
  h += '</div>';
  if (q.modo === 'audio' && !q.tocou) { q.tocou = true; setTimeout(function () { falar(q.w); }, 300); }
  if (q.mostrou && q.modo !== 'audio' && !q.falou) { q.falou = true; falar(q.modo === 'frase' ? q.en : q.w); }
  return h;
}
function telaOral(q) {
  return '<div class="card"><p class="sub">Desafio de fala: diga em inglês</p><p class="q">“' + esc(q.pt) + '”</p><details class="hint"><summary>Ver a frase em inglês</summary><p lang="en"><b>' + esc(q.en) + '</b> <button class="btn-g" type="button" data-act="falar" data-t="' + esc(q.en) + '">' + ico('play') + 'Ouvir</button></p></details>' +
    '<div class="mic" style="margin-top:12px"><button class="micb" type="button" id="micBtn" data-act="mic-item" aria-label="Toque para falar" aria-pressed="false">' + ico('mic') + '</button><div class="st" id="micSt"><b>Toque para falar</b><span class="note">Esta parte não vale nota: é só para praticar</span></div></div><div id="micFb" aria-live="polite"></div></div>' +
    '<button class="btn btn-p full" type="button" data-act="item-prox" style="margin-top:14px">' + (q.res ? 'Continuar' : 'Pular esta parte') + ' ' + ico('right') + '</button>';
}
/* registrar resultado de um item: separa a primeira tentativa do resultado final */
function registrar(q, primeira, final) {
  if (q.contado) return; q.contado = true;
  reg(q.hab, primeira, final);
  var X = SESSAO; if (X && X.stats) { X.stats.tot++; if (primeira) X.stats.first++; }
  if (!primeira && q.w) { errou(q.w); if (X && X.erros) X.erros[q.w] = 1; }
  if (X && X.errosLista && !primeira) X.errosLista.push(q);
  if (final && q.kind === 'montar') { S.frases++; if (X && X.frasesOk != null) X.frasesOk++; }
  save();
}

/* ================= sessões genéricas: avaliação, revisão, estudo rápido e desafio ================= */
function iniciarSessao(cfg) { pararMic(); AULA = null; SESSAO = Object.assign({ k: 0, stats: { first: 0, tot: 0 }, errosLista: [], erros: {}, frasesOk: 0, revisadas: 0 }, cfg); setNav(false); renderSessao(); scrollTo(0, 0); }
function renderSessao() {
  var X = SESSAO, v = $('#view');
  if (X.intro && !X.iniciou) { v.innerHTML = cabecalho(X.titulo, X.sub || '') + X.intro; focarTitulo(); return; }
  if (X.k >= X.itens.length || X.acabou) { v.innerHTML = X.fim(); focarTitulo(); return; }
  var resto = X.ate ? Math.max(0, Math.ceil((X.ate - Date.now()) / 60000)) : null;
  v.innerHTML = cabecalho(X.titulo, (X.cont || 'Item') + ' ' + (X.k + 1) + ' de ' + X.itens.length + (resto != null ? ' · ' + resto + ' min restantes' : '')) +
    '<div class="bar" style="margin-bottom:14px" role="progressbar" aria-label="Progresso" aria-valuenow="' + X.k + '" aria-valuemin="0" aria-valuemax="' + X.itens.length + '"><i style="width:' + Math.round(X.k / X.itens.length * 100) + '%"></i></div>' + telaItem(X.itens[X.k]);
  focarTitulo();
}
function avancarItem() {
  var X = SESSAO; pararMic();
  if (X.tipo === 'aula') { X.run.k++; if (X.run.k >= X.run.itens.length) X.run.fim(); else renderAula(); scrollTo(0, 0); return; }
  X.k++; if (X.ate && Date.now() >= X.ate) X.acabou = true; renderSessao(); scrollTo(0, 0);
}
function telaResultado(titulo, texto, ok, extra, botoes) {
  return '<div class="card big-ok"><div class="ic"' + (ok ? '' : ' style="background:var(--warn-s);color:var(--warn)"') + '>' + ico(ok ? 'award' : 'rep') + '</div><h1 class="h1">' + titulo + '</h1><p class="sub" style="margin-top:6px">' + texto + '</p></div>' + (extra || '') + blocoMedalhas() +
    '<div class="row" style="margin-top:14px">' + (botoes || '') + '<button class="btn btn-o" type="button" data-act="ir" data-tab="inicio">Voltar ao início</button></div>';
}
function listaErros(X) { return X.errosLista.length ? '<div class="card"><b>Para revisar</b>' + X.errosLista.map(function (q) { return '<div class="wl"><div class="t"><b lang="en">' + esc(q.certo) + '</b><span>' + esc(q.dica || '') + '</span></div></div>'; }).join('') + '</div>' : ''; }

/* avaliação */
function abrirAvaliacao(d, diaIdx) {
  var mods = d.tipo === 'final' ? MODULOS : [MODULOS[d.m]], itens = [], frases = [];
  mods.forEach(function (m) { m.aulas.forEach(function (id) { itens = itens.concat(lic(id).itens); frases = frases.concat(frasesDaAula(id)); }); });
  var n = d.tipo === 'final' ? 20 : 12, t = d.tipo === 'final' ? 'Avaliação final' : 'Avaliação do Módulo ' + (d.m + 1);
  iniciarSessao({ tipo: 'aval', d: d, dia: diaIdx, titulo: t, sub: 'Dia ' + (diaIdx + 1) + ' de 30', cont: 'Questão', itens: gerarExercicios(itens, frases, n),
    intro: '<div class="card"><h1 class="h1">' + esc(t) + '</h1><p class="sub" style="margin-top:6px">' + n + ' questões sobre ' + (d.tipo === 'final' ? 'todo o curso' : 'as aulas do módulo “' + esc(MODULOS[d.m].nome) + '”') + ', incluindo escuta, frases e uma questão de digitar. Para ser aprovado(a), acerte 70% ou mais <b>de primeira</b>. Você pode refazer quantas vezes quiser.</p></div><button class="btn btn-p full" type="button" data-act="sess-ini" style="margin-top:14px">Começar ' + ico('right') + '</button>',
    fim: function () { var X = SESSAO, pct = Math.round(X.stats.first / X.itens.length * 100), ok = pct >= 70, ant = S.aval[X.d.id];
      if (!X.salvo) { X.salvo = true; S.aval[X.d.id] = { ok: ok || !!(ant && ant.ok), pct: Math.max(pct, ant ? ant.pct : 0), d: ok && !(ant && ant.ok) ? hoje() : (ant && ant.d) || hoje() }; estudou((ok ? 'Aprovado(a) na ' : 'Fez a ') + X.titulo.toLowerCase() + ' (' + pct + '%)'); if (ok) { plim(); festa(); } }
      var prox = diaAtual();
      return telaResultado(ok ? (X.d.tipo === 'final' ? 'Você concluiu o Fala Fácil!' : 'Módulo ' + (X.d.m + 1) + ' concluído!') : 'Quase lá!', 'Você acertou ' + X.stats.first + ' de ' + X.itens.length + ' de primeira (' + pct + '%).' + (ok ? '' : ' Para ser aprovado(a), são 70%. Revise as palavras abaixo e tente de novo.'), ok, listaErros(X),
        ok && X.d.tipo === 'final' ? '<button class="btn btn-p" type="button" data-act="certificado">Ver o meu certificado</button>' : ok && prox < DIAS.length ? '<button class="btn btn-p" type="button" data-act="abrir-dia" data-i="' + prox + '">Próximo: Dia ' + (prox + 1) + ' ' + ico('right') + '</button>' : '<button class="btn btn-p" type="button" data-act="abrir-dia" data-i="' + X.dia + '">Tentar de novo</button>'); } });
}

/* revisão */
function abrirRevisao(modo) {
  var lista, tipo = 'cartao', titulo = 'Revisão';
  if (modo === 'audio') { lista = shuffle(vistas()).slice(0, 15); tipo = 'audio'; titulo = 'Revisão por áudio'; }
  else if (modo === 'frases') {
    var fr = []; Object.keys(S.done).forEach(function (id) { if (PED[id]) fr = fr.concat(frasesDaAula(id)); });
    if (!fr.length) { toast('Conclua uma aula para revisar frases.'); return; }
    iniciarSessao({ tipo: 'rev', titulo: 'Revisão de frases', cont: 'Frase', itens: shuffle(fr).slice(0, 10).map(function (f) { return { kind: 'cartao', modo: 'frase', en: f.en, pt: f.pt }; }), fim: fimRevisao }); return;
  }
  else if (modo === 'dia') { lista = TUTOR.sugerirRevisao(); titulo = 'Revisão do dia'; }
  else if (modo === 'acumulada') { lista = shuffle(vistas()).slice(0, 20); titulo = 'Revisão geral'; }
  else { lista = shuffle(listaRev(modo)).slice(0, 20); titulo = ({ atrasadas: 'Revisão das atrasadas', dificil: 'Revisão das difíceis', erros: 'Revisão dos erros', fav: 'Revisão das favoritas' })[modo] || ('Revisão · ' + ((MODULOS[+String(modo).slice(1)] || {}).nome || '')); }
  if (!lista.length) { toast('Nenhuma palavra para revisar agora.'); return; }
  iniciarSessao({ tipo: 'rev', titulo: titulo, cont: 'Palavra', itens: lista.map(function (w) { return { kind: 'cartao', modo: tipo, w: w }; }), fim: fimRevisao });
}
function fimRevisao() { var X = SESSAO; if (!X.salvo) { X.salvo = true; estudou('Revisou ' + X.revisadas + ' ' + (X.cont === 'Frase' ? 'frase' : 'palavra') + (X.revisadas > 1 ? 's' : '')); plim(); }
  return telaResultado('Revisão concluída!', X.revisadas + ' ' + (X.cont === 'Frase' ? 'frase' : 'palavra') + (X.revisadas === 1 ? '' : 's') + ' revisada' + (X.revisadas === 1 ? '' : 's') + '. Cada uma volta no momento certo.', true); }

/* estudo rápido: revisões pendentes + exercícios do que já foi estudado */
function abrirRapido(min) {
  var v = vistas(), base = v.length >= 6 ? v : lic('b1').itens.slice(0, 8).map(function (it) { return it[0]; });
  base.forEach(marcarVisto);
  var porMin = 3, pend = pendentes().slice(0, Math.ceil(min * porMin * 0.4)).map(function (w) { return { kind: 'cartao', modo: 'cartao', w: w }; });
  var its = base.map(itemDe).filter(Boolean), aulas = {}; base.forEach(function (w) { aulas[INDICE[w].l.id] = 1; });
  var frases = []; Object.keys(aulas).forEach(function (id) { if (PED[id]) frases = frases.concat(frasesDaAula(id)); });
  var ex = gerarExercicios(its, frases, Math.max(4, min * porMin - pend.length), ['en2pt', 'ouvir', 'pt2en', 'completar', 'frase-en2pt', 'digitar']);
  var monta = []; Object.keys(aulas).slice(0, 2).forEach(function (id) { var t = (TRANSF[id] || [])[0]; if (t) monta.push(itemMontar(t[1] + ':', t[3], t[4], t[2], frasesDaAula(id))); });
  var itens = []; pend.forEach(function (c, i) { itens.push(c); if (ex[i]) itens.push(ex[i]); }); itens = itens.concat(ex.slice(pend.length)); monta.forEach(function (m, i) { itens.splice(Math.min(itens.length, 3 + i * 5), 0, m); });
  iniciarSessao({ tipo: 'rapido', titulo: 'Estudo rápido · ' + min + ' min', cont: 'Atividade', itens: itens, ate: Date.now() + min * 60000,
    fim: function () { var X = SESSAO; if (!X.salvo) { X.salvo = true; estudou('Estudo rápido de ' + min + ' minutos'); plim(); }
      return telaResultado('Sessão concluída!', 'Você fez ' + Math.min(X.k, X.itens.length) + ' atividades' + (X.stats.tot ? ' e acertou ' + Math.round(X.stats.first / X.stats.tot * 100) + '% de primeira' : '') + '.', true, listaErros(X)); } });
}

/* desafio diário: o mesmo desafio para o dia inteiro, com tipos variados */
function abrirDesafio() {
  var d = hoje(), itens = [];
  rnd = semente('desafio' + d);
  try {
    var i0 = Math.min(diaAtual(), DIAS.length - 1), d0 = DIAS[i0], idAtual = d0.tipo === 'aula' ? d0.id : MODULOS[d0.m].aulas[4];
    var v = vistas(), base = v.length >= 10 ? v.slice() : lic(idAtual).itens.map(function (it) { return it[0]; }).concat(lic('b1').itens.map(function (it) { return it[0]; }));
    base = base.filter(function (w, i) { return base.indexOf(w) === i; }).sort();
    var its = base.map(itemDe).filter(Boolean), aulas = {}; base.forEach(function (w) { aulas[INDICE[w].l.id] = 1; });
    var ids = Object.keys(aulas).sort(), frases = []; ids.forEach(function (id) { if (PED[id]) frases = frases.concat(frasesDaAula(id)); });
    ['pt2en', 'ouvir', 'en2pt'].forEach(function (tp) { for (var k = 0; k < 5; k++) { var q = qItem(tp, pick(its), its); if (q && !itens.some(function (x) { return x.w === q.w; })) { itens.push(q); break; } } });
    var curtas = its.filter(function (x) { return x[0].split(' ').length <= 3; }); var dg = qItem('digitar', pick(curtas.length ? curtas : its), its); if (dg) itens.push(dg);
    var id0 = pick(ids.filter(function (id) { return TRANSF[id]; })) || 'b1', t = pick(TRANSF[id0]); itens.push(itemMontar(t[1] + ':', t[3], t[4], t[2], frasesDaAula(id0)));
    var fo = pick(frases.filter(function (f) { return f.en.split(' ').length <= 7; }).length ? frases.filter(function (f) { return f.en.split(' ').length <= 7; }) : frases); itens.push({ kind: 'oral', en: fo.en, pt: fo.pt, hab: 'fala' });
  } finally { rnd = Math.random; }
  iniciarSessao({ tipo: 'desafio', titulo: 'Desafio do dia', sub: dataBR(d), cont: 'Desafio', itens: itens,
    intro: '<div class="card"><h1 class="h1">Desafio do dia</h1><p class="sub" style="margin-top:6px">' + itens.length + ' desafios rápidos: tradução, escuta, vocabulário, digitar, montar uma frase e falar. O desafio de fala é só para praticar e não vale nota.</p>' + (S.desafio[d] ? '<p class="note">Você já fez o desafio de hoje (' + S.desafio[d].pct + '%). Pode treinar de novo; a melhor nota fica salva.</p>' : '') + '</div><button class="btn btn-p full" type="button" data-act="sess-ini" style="margin-top:14px">Começar ' + ico('right') + '</button>',
    fim: function () { var X = SESSAO, pct = X.stats.tot ? Math.round(X.stats.first / X.stats.tot * 100) : 0;
      if (!X.salvo) { X.salvo = true; var ant = S.desafio[d]; S.desafio[d] = { pct: Math.max(pct, ant ? ant.pct : 0) }; estudou('Desafio do dia (' + pct + '%)'); plim(); if (pct >= 80) festa(); }
      var seqD = 0, dd = d; while (S.desafio[dd]) { seqD++; dd = addDias(dd, -1); }
      return telaResultado('Desafio concluído!', 'Você acertou ' + X.stats.first + ' de ' + X.stats.tot + ' de primeira (' + pct + '%). ' + (seqD > 1 ? seqD + ' desafios seguidos!' : 'Volte amanhã para um novo desafio.'), pct >= 60, listaErros(X)); } });
}

/* ================= modais acessíveis ================= */
var focoAntes = null;
function modal(html, opts) {
  focoAntes = document.activeElement;
  $('#modalRoot').innerHTML = '<div class="modal"><div class="box" role="dialog" aria-modal="true" aria-labelledby="mT" tabindex="-1">' + html + ((opts && opts.semFechar) ? '' : '<button class="btn btn-o full" type="button" data-act="fechar" style="margin-top:14px">Fechar</button>') + '</div></div>';
  var b = $('#modalRoot .box'); var f = b.querySelector('button, input, select, a[href]'); try { (f || b).focus(); } catch (e) {}
}
function fecharModal() { $('#modalRoot').innerHTML = ''; if (focoAntes && document.contains(focoAntes)) try { focoAntes.focus(); } catch (e) {} }
function confirmar(titulo, texto, ok, cb) { modal('<h3 id="mT">' + esc(titulo) + '</h3><p>' + esc(texto) + '</p><div class="row"><button class="btn btn-o" type="button" data-act="fechar">Cancelar</button><button class="btn btn-p" type="button" data-act="confirmar">' + esc(ok) + '</button></div>', { semFechar: true }); confirmar.cb = cb; }
document.addEventListener('keydown', function (e) {
  var box = $('#modalRoot .box'); if (!box) return;
  if (e.key === 'Escape') { fecharModal(); return; }
  if (e.key === 'Tab') { var f = $$('button:not([disabled]), input, select, a[href], label[for]', box); if (!f.length) return; var a = f[0], z = f[f.length - 1];
    if (e.shiftKey && document.activeElement === a) { e.preventDefault(); z.focus(); } else if (!e.shiftKey && document.activeElement === z) { e.preventDefault(); a.focus(); } }
});
function ajudaMic() {
  modal('<h3 id="mT">Como ativar o microfone</h3><p><b>Android (Google Chrome):</b> toque no cadeado ao lado do endereço → Permissões → Microfone → Permitir. Depois, recarregue a página.</p>' +
    '<p><b>iPhone (Safari):</b> o reconhecimento usa o Ditado do iPhone. Vá em Ajustes → Geral → Teclado → ative “Ditado”. Depois, em Ajustes → Safari → Microfone → Permitir.</p>' +
    '<p><b>Computador (Chrome ou Edge):</b> clique no cadeado ao lado do endereço → Microfone → Permitir, e recarregue.</p>' +
    '<p class="note">O microfone só funciona com o site aberto pela internet (endereço começando com https) e com conexão. O reconhecimento mostra se a fala foi entendida; ele não substitui um professor na avaliação do sotaque.</p>');
}
function guiaPronuncia() {
  modal('<h3 id="mT">Como ler o guia de pronúncia</h3><p>O guia aproxima os sons do inglês com letras do português. Ele é só um apoio: <b>o áudio é sempre a referência</b>.</p><ul class="can">' +
    ['<b>MAIÚSCULAS</b> mostram a sílaba mais forte: rê-<b>LÔU</b> (Hello).', 'O <b>hífen</b> separa as sílabas de uma palavra; o <b>espaço</b> separa as palavras.', '<b>ê</b> e <b>ô</b> são sons fechados; <b>é</b> e <b>ó</b> são abertos.', '<b>r</b> no começo, como em “rato”, indica o sopro leve do “h” inglês.', '<b>â</b> é um “a” curto e abafado, como em “cama”.'].map(function (x) { return '<li>' + ico('check') + '<span>' + x + '</span></li>'; }).join('') + '</ul>');
}
function guiaSom(s) { var x = SONS[s];
  modal('<h3 id="mT">' + esc(x.t) + '</h3><p><b>Como fazer:</b> ' + esc(x.como) + '</p><p><b>Evite:</b> ' + esc(x.evite) + '</p><p><b>Escute exemplos:</b></p><div class="row">' + x.ex.map(function (e) { return '<button class="btn btn-s" type="button" data-act="falar" data-t="' + esc(e) + '">' + ico('play') + esc(e) + '</button>'; }).join('') + '</div>');
}

/* ================= configurações, backup, lembretes, instalação e certificado ================= */
var promptInstalar = null;
addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); promptInstalar = e; });
function ehIOS() { return /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); }
function instalado() { return matchMedia('(display-mode: standalone)').matches || navigator.standalone === true; }
function abrirConfig() {
  var pt = vozes.filter(function (v) { return /^pt/i.test(v.lang); }), en = vozes.filter(function (v) { return /^en/i.test(v.lang); });
  function ops(l, cur) { return '<option value="">Automática (recomendada)</option>' + l.map(function (v) { return '<option value="' + esc(v.name) + '"' + (v.name === cur ? ' selected' : '') + '>' + esc(v.name) + ' (' + esc(v.lang) + ')</option>'; }).join(''); }
  modal('<h3 id="mT">Configurações</h3>' +
    '<label class="field"><span>Aparência</span><select id="cfTema"><option value="auto"' + (S.tema === 'auto' ? ' selected' : '') + '>Automático (igual ao celular)</option><option value="claro"' + (S.tema === 'claro' ? ' selected' : '') + '>Fundo claro</option><option value="escuro"' + (S.tema === 'escuro' ? ' selected' : '') + '>Fundo escuro</option></select></label>' +
    '<label class="field"><span>Seu nome</span><input id="cfNome" value="' + esc(S.nome) + '" autocomplete="given-name"></label>' +
    '<label class="field"><span>Meta diária</span><select id="cfMeta">' + [5, 10, 15, 20].map(function (m) { return '<option value="' + m + '"' + (S.metaMin === m ? ' selected' : '') + '>' + m + ' minutos por dia</option>'; }).join('') + '</select></label>' +
    '<label class="field"><span>Voz em inglês</span><select id="cfEn">' + ops(en, S.vozEn) + '</select></label><button class="btn btn-s" type="button" data-act="falar" data-t="Hello! Nice to meet you.">' + ico('play') + 'Testar voz</button>' +
    '<label class="field"><span>Voz em português</span><select id="cfPt">' + ops(pt, S.vozPt) + '</select></label>' +
    '<div class="field box2"><span>Lembrete de estudo</span><label class="check"><input type="checkbox" id="cfLemb"' + (S.lembrete.on ? ' checked' : '') + '> Me lembrar de estudar</label><label class="field"><span>Horário</span><input type="time" id="cfHora" value="' + esc(S.lembrete.hora) + '"></label>' +
    '<p class="note">O lembrete aparece quando você abre o Fala Fácil depois desse horário sem ter estudado no dia. Com permissão de notificações, ele também avisa enquanto o app estiver aberto em segundo plano. Lembretes com o app totalmente fechado precisam de um servidor e chegam numa próxima versão.</p></div>' +
    '<button class="btn btn-p full" type="button" data-act="cf-salvar" style="margin-top:12px">Salvar</button>' +
    '<h3 style="margin-top:22px">Aplicativo</h3>' + (instalado() ? '<p class="note">O Fala Fácil já está instalado neste aparelho.</p>' : '<button class="btn btn-s full" type="button" data-act="instalar">' + ico('download') + 'Instalar na tela inicial</button>') +
    '<h3 style="margin-top:22px">Seu progresso</h3><p class="note">Fica salvo automaticamente neste aparelho e navegador, com uma cópia de segurança diária. Para trocar de aparelho, salve um backup e restaure no outro.</p>' +
    '<div class="row"><button class="btn btn-o" type="button" data-act="exportar">' + ico('download') + 'Salvar backup</button><label class="btn btn-o" for="cfImp" tabindex="0">' + ico('upload') + 'Restaurar</label><input type="file" id="cfImp" accept="application/json,.json" class="sr"></div>' +
    '<div class="row" style="margin-top:12px"><button class="btn btn-o" type="button" data-act="ajuda-mic">Ajuda com o microfone</button><button class="btn btn-o" type="button" data-act="sons">Sons difíceis</button><button class="btn btn-o" type="button" data-act="guia">Guia de pronúncia</button></div>' +
    '<button class="btn-g" type="button" data-act="zerar" style="color:var(--err);margin-top:12px">Apagar o progresso e recomeçar</button><p class="note">Versão ' + CONFIG.versao + '</p>');
  var imp = $('#cfImp'); if (imp) imp.addEventListener('change', function () { if (imp.files[0]) importar(imp.files[0]); });
}
function instalar() {
  if (promptInstalar) { promptInstalar.prompt(); promptInstalar.userChoice.then(function () { promptInstalar = null; fecharModal(); }); return; }
  if (ehIOS()) modal('<h3 id="mT">Instalar no iPhone ou iPad</h3><ol class="olist"><li>Abra o Fala Fácil no <b>Safari</b>.</li><li>Toque no botão <b>Compartilhar</b> (o quadrado com a seta para cima).</li><li>Escolha <b>Adicionar à Tela de Início</b> e toque em <b>Adicionar</b>.</li></ol>');
  else modal('<h3 id="mT">Instalar o aplicativo</h3><p>No Chrome, toque nos <b>três pontinhos</b> do canto e escolha <b>Instalar app</b> ou <b>Adicionar à tela inicial</b>.</p><p class="note">A instalação só aparece com o site aberto pela internet.</p>');
}
function lembreteBanner() {
  var L = S.lembrete, agora = new Date(), hm = ('0' + agora.getHours()).slice(-2) + ':' + ('0' + agora.getMinutes()).slice(-2);
  if (!L.on || S.days[hoje()] || hm < L.hora || L.ultimo === hoje()) return;
  L.ultimo = hoje(); save();
  var txt = pick(['Que tal 5 minutinhos de inglês agora?', 'Seu inglês está te esperando. Uma revisão rápida já conta!', 'Hora do inglês! Sem pressão: um pouquinho por dia faz diferença.']);
  toast(txt);
  try { if ('Notification' in window && Notification.permission === 'granted' && navigator.serviceWorker && navigator.serviceWorker.controller)
    navigator.serviceWorker.ready.then(function (r) { r.showNotification('Fala Fácil', { body: txt, icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', tag: 'lembrete' }); }); } catch (e) {}
}
setInterval(lembreteBanner, 60000);
function certificado() {
  if (!certificadoOk()) { toast('O certificado fica disponível depois de concluir as 25 aulas e as 5 avaliações.'); return; }
  pararMic(); SESSAO = null; AULA = null; setNav(true);
  var f = S.aval.final, nome = S.nome || 'Aluno(a) Fala Fácil', h = 5381, s = nome + '|' + f.d + '|' + f.pct;
  for (var i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) >>> 0;
  var cod = 'FF-' + h.toString(36).toUpperCase().slice(0, 4) + '-' + f.d.replace(/-/g, '').slice(2);
  $('#view').innerHTML = '<div class="cert" id="cert"><div class="cert-in"><div class="k">Certificado de conclusão</div><h2>Fala Fácil · Inglês do zero</h2><p>Certificamos que</p><div class="nm">' + esc(nome) + '</div>' +
    '<p>concluiu a jornada de 30 dias do curso livre Fala Fácil, com 25 aulas e 5 avaliações, estudando ' + aprendidas() + ' palavras e expressões em inglês.</p><p class="cmods">' + MODULOS.map(function (m, i) { return (i + 1) + '. ' + esc(m.nome); }).join(' · ') + '</p>' +
    '<div class="cfoot"><div><small>Concluído em</small><b>' + dataBR(f.d) + '/' + f.d.slice(0, 4) + '</b></div><div><small>Aproveitamento final</small><b>' + f.pct + '%</b></div><div><small>Código</small><b>' + cod + '</b></div></div>' +
    '<p class="cnote">Certificado de conclusão de curso livre. Não é uma certificação oficial de proficiência em inglês.</p></div></div>' +
    '<label class="field"><span>Nome no certificado</span><input id="certNome" value="' + esc(S.nome) + '"></label><div class="row"><button class="btn btn-o" type="button" data-act="cert-nome">Atualizar nome</button><button class="btn btn-p" type="button" data-act="imprimir">Salvar em PDF ou imprimir</button></div>';
  scrollTo(0, 0);
}

/* ================= ações ================= */
function itemAtual() { if (!SESSAO) return null; if (SESSAO.tipo === 'aula') return SESSAO.run && (SESSAO.fase === 'cons-ex' || SESSAO.fase === 'prat-ex') ? SESSAO.run.itens[SESSAO.run.k] : null; return SESSAO.itens[SESSAO.k]; }
function reRender() { if (SESSAO && SESSAO.tipo === 'aula') renderAula(); else if (SESSAO) renderSessao(); else render(); }
function iniciarExerciciosAula(fase) {
  var A = AULA;
  if (fase === 'cons-ex') {
    var itens = A.p.c.map(function (c) { var q = itemMontar('Toque nas palavras na ordem certa para dizer em inglês:', c[0], c[1], '', A.frases); q.dicaEst = A.p.est.x; return q; });
    (TRANSF[A.id] || []).forEach(function (t) { var q = itemMontar(t[1] + ':', t[3], t[4], t[2], A.frases); q.dicaEst = t[0] === 'neg' ? 'Na negativa, use “not” (is not, am not, do not).' : t[0] === 'perg' ? 'Na pergunta, o verbo ou o “do” vem antes da pessoa.' : 'Mantenha a estrutura e troque só a palavra indicada.'; itens.push(q); });
    A.run = { itens: itens, k: 0, fim: function () { iniciarExerciciosAula('prat-ex'); } };
  } else {
    A.run = { itens: gerarExercicios(A.l.itens, A.frases, 7), k: 0, fim: function () { A.fase = 'dialogo'; renderAula(); } };
  }
  A.fase = fase; renderAula(); scrollTo(0, 0);
}
document.addEventListener('input', function (e) {
  if (e.target.id === 'onbNome') { S.nome = e.target.value.trim().slice(0, 40); var pt = $('#welcome .wl-pt'), en = $('#welcome .wl-en'); if (pt) { pt.innerHTML = saudacaoPt(); en.innerHTML = saudacaoEn(); } }
  if (e.target.id === 'cadBusca') { CAD.q = e.target.value; CAD.aberto = ''; $('#cadLista').innerHTML = listaCaderno(); } });
document.addEventListener('keydown', function (e) {
  if (e.key === 'Enter' && e.target.id === 'digIn') { e.preventDefault(); var b = $('[data-act="dig-ver"]'); if (b) b.click(); }
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('label[for="cfImp"]')) { e.preventDefault(); $('#cfImp').click(); }
});
document.addEventListener('click', function (e) {
  var b = e.target.closest('[data-act]'); if (!b || b.disabled) return;
  var a = b.dataset.act, A = AULA, q = itemAtual();
  switch (a) {
    case 'onb-next': if (onbPasso === 0) { S.nome = ($('#onbNome').value || '').trim().slice(0, 40); save(); clearInterval(BV.t); } onbPasso++; render(); scrollTo(0, 0); break;
    case 'ouvir-boas': falar(S.nome ? 'Hello, ' + S.nome + '! Welcome to Fala Fácil!' : 'Welcome to Fala Fácil!'); break;
    case 'meta': S.metaMin = +b.dataset.m; save(); $$('[data-act="meta"]').forEach(function (x) { var on = x === b; x.classList.toggle('on', on); x.setAttribute('aria-checked', on); }); break;
    case 'onb-fim': S.onb = true; save(); pararMic(); ir('inicio'); break;
    case 'mic-onb': ouvir(['hello'], { btn: $('#micBtn'), status: $('#micSt') }, function (r) { var fb = $('#micFb'); if (!fb || r.nivel === 'parado') return;
      var m = r.nivel === 'clara' || r.nivel === 'reconhecida' ? { c: 'ok', h: '<b>' + ico('check') + ' Tudo certo!</b> O microfone está funcionando e reconheceu “' + esc(r.ouvido) + '”.' } : msgFala(r, 'Hello'); fb.innerHTML = fbHtml(m); }); break;
    case 'falar': falar(b.dataset.t, { lento: !!b.dataset.lento }); break;
    case 'ajuda-mic': ajudaMic(); break;
    case 'guia': guiaPronuncia(); break;
    case 'som': guiaSom(b.dataset.s); break;
    case 'sons': modal('<h3 id="mT">Sons difíceis do inglês</h3><p>Escolha um som para ver como fazer:</p><div class="opts">' + Object.keys(SONS).map(function (s) { return '<button class="opt" type="button" data-act="som" data-s="' + s + '">' + esc(SONS[s].t) + '</button>'; }).join('') + '</div>'); break;
    case 'fechar': fecharModal(); break;
    case 'confirmar': fecharModal(); if (confirmar.cb) confirmar.cb(); break;
    case 'ir': fecharModal(); ir(b.dataset.tab); break;
    case 'abrir-dia': fecharModal(); abrirDia(+b.dataset.i); break;
    case 'abrir-aula': abrirAula(b.dataset.id, null); break;
    case 'rev': abrirRevisao(b.dataset.m); break;
    case 'rapido': abrirRapido(+b.dataset.m); break;
    case 'desafio': abrirDesafio(); break;
    case 'certificado': certificado(); break;
    case 'cad-f': CAD.f = b.dataset.f; CAD.q = ''; CAD.aberto = ''; render(); break;
    case 'cad-abre': CAD.aberto = CAD.aberto === b.dataset.w ? '' : b.dataset.w; $('#cadLista').innerHTML = listaCaderno(); var r0 = $('#cadLista [aria-expanded="true"]'); if (r0) r0.focus(); break;
    case 'cad-cls': classificar(b.dataset.w, b.dataset.v); save(); $('#cadLista').innerHTML = listaCaderno(); toast('Atualizado: ' + ROTULO[b.dataset.v]); break;
    case 'fav': var x = W(b.dataset.w); x.fav = !x.fav; if (!x.seen) marcarVisto(b.dataset.w); save(); b.classList.toggle('on', x.fav); b.setAttribute('aria-pressed', x.fav); toast(x.fav ? 'Adicionada às favoritas' : 'Removida das favoritas'); break;
    case 'sair': pararMic(); if (synth) synth.cancel();
      var noFim = SESSAO && (SESSAO.tipo === 'aula' ? (SESSAO.fase === 'fim' || SESSAO.fase === 'obj') : (SESSAO.k >= SESSAO.itens.length || SESSAO.acabou || (SESSAO.intro && !SESSAO.iniciou)));
      if (SESSAO && !noFim) confirmar('Sair agora?', SESSAO.tipo === 'aula' ? 'O que você já estudou fica salvo, mas a aula só conta como concluída no final.' : 'O que você já respondeu fica salvo.', 'Sair', function () { ir(ABA); });
      else ir(ABA); break;
    case 'aula-ini': A.fase = 'vocab'; A.i = 0; renderAula(); break;
    case 'mic': var it = A.l.itens[A.i];
      ouvir([it[0]].concat(it[4] || []), { btn: $('#micBtn'), status: $('#micSt') }, function (r) { if (AULA !== A || r.nivel === 'parado') return;
        if (r.nivel !== 'erro' && r.nivel !== 'sem-suporte') { A.rec[it[0]] = r; var okf = r.nivel === 'clara' || r.nivel === 'reconhecida'; reg('fala', okf, okf); save(); }
        var fb = $('#micFb'); if (fb) fb.innerHTML = fbHtml(msgFala(r, it[0])); if (r.nivel === 'clara') plim(); }); break;
    case 'mic-dlg': case 'mic-item':
      var alvo = a === 'mic-dlg' ? ultimaFalaB(A.p)[1] : q.en, X0 = SESSAO, q0 = q;
      ouvir([alvo], { btn: $('#micBtn'), status: $('#micSt') }, function (r) { if (SESSAO !== X0 || r.nivel === 'parado') return; var fb = $('#micFb'); if (fb) fb.innerHTML = fbHtml(msgFala(r, alvo));
        var ok = r.nivel === 'clara' || r.nivel === 'reconhecida';
        if (r.nivel !== 'erro' && r.nivel !== 'sem-suporte') reg('fala', ok, ok);
        if (ok) { var jaContou = a === 'mic-dlg' ? X0.falouDlg : (q0 && q0.res); if (!jaContou) { S.frases++; if (X0.frasesOk != null) X0.frasesOk++; } if (a === 'mic-dlg') X0.falouDlg = true; if (q0) q0.res = 'ok'; plim(); }
        save(); var pb = $('[data-act="item-prox"]'); if (pb && q0 && q0.res) pb.innerHTML = 'Continuar ' + ico('right'); }); break;
    case 'ant': pararMic(); A.i--; renderAula(); scrollTo(0, 0); break;
    case 'prox': pararMic(); if (A.i < A.l.itens.length - 1) { A.i++; renderAula(); scrollTo(0, 0); } else { A.fase = 'construa'; renderAula(); scrollTo(0, 0); } break;
    case 'cons-ini': iniciarExerciciosAula('cons-ex'); break;
    case 'resp': if (!q || q.resp != null) break; q.resp = q.ops[+b.dataset.n]; var acertou = q.resp === q.certo; registrar(q, acertou, acertou); if (acertou) plim(); reRender(); if (q.audioFim) falar(q.audioFim); break;
    case 'dig-ver': case 'dig-nao':
      if (!q) break; var val = a === 'dig-nao' ? '' : ($('#digIn').value || ''); if (a === 'dig-ver' && !val.trim()) { toast('Escreva a resposta ou toque em “Não sei”.'); break; }
      q.valor = val; q.tent++;
      var kv = kEn(val), ok2 = q.aceitas.some(function (y) { return kEn(y) === kv; }), quase = !ok2 && kv.length > 3 && q.aceitas.some(function (y) { var k = kEn(y); return k.length >= 5 && lev(k, kv) <= 1; });
      if (ok2 || quase) { q.res = ok2 ? 'ok' : 'typo'; registrar(q, q.tent === 1, true); plim(); }
      else if (q.tent === 1 && a !== 'dig-nao') q.res = 'err1';
      else { q.res = 'err'; registrar(q, false, false); }
      reRender(); break;
    case 'tile-poe': var bn = q.banco[+b.dataset.n]; if (bn.u) break; bn.u = true; q.sel.push(bn.n); if (q.res === 'err1') q.res = null; reRender(); break;
    case 'tile-tira': var n2 = +b.dataset.n; q.banco[n2].u = false; q.sel = q.sel.filter(function (y) { return y !== n2; }); reRender(); break;
    case 'tile-limpa': q.banco.forEach(function (y) { y.u = false; }); q.sel = []; if (q.res === 'err1') q.res = null; reRender(); break;
    case 'tile-ver': var resp = q.sel.map(function (y) { return q.banco[y].t; }).join(' '); q.tent++;
      if (kEn(resp) === kEn(q.alvo)) { q.res = 'ok'; registrar(q, q.tent === 1, true); plim(); falar(q.alvo); }
      else if (q.tent === 1) { q.res = 'err1'; q.banco.forEach(function (y) { y.u = false; }); q.sel = []; }
      else { q.res = 'err'; registrar(q, false, false); falar(q.alvo); }
      reRender(); break;
    case 'card-mostra': q.mostrou = true; reRender(); break;
    case 'card-cls': if (q.w) classificar(q.w, b.dataset.v); revisouAgora(); SESSAO.revisadas++; save(); avancarItem(); break;
    case 'item-prox': avancarItem(); break;
    case 'sess-ini': SESSAO.iniciou = true; renderSessao(); break;
    case 'dlg-todo': var linhas = A.p.dlg.slice(), ix = 0; (function proxL() { if (ix >= linhas.length || AULA !== A) return; var l = linhas[ix++]; falar(l[1], { pitch: l[0] === 'A' ? 1 : 1.25, fim: function () { setTimeout(proxL, 350); } }); })(); break;
    case 'p-fim': pararMic(); A.fase = 'revise'; renderAula(); scrollTo(0, 0); break;
    case 'cls': A.class[b.dataset.w] = b.dataset.v; $$('.rate button[data-w="' + CSS.escape(b.dataset.w) + '"]').forEach(function (y) { var on = y.dataset.v === b.dataset.v; y.classList.toggle('on', on); y.setAttribute('aria-checked', on); }); break;
    case 'mostrar': A.mostrou = true; renderAula(); falar(A.antigas[A.ai]); break;
    case 'ant-cls': classificar(A.antigas[A.ai], b.dataset.v); revisouAgora(); save(); A.ai++; A.mostrou = false; renderAula(); break;
    case 'concluir': concluirAula(); break;
    case 'cf-salvar': S.nome = ($('#cfNome').value || '').trim().slice(0, 40); S.vozEn = $('#cfEn').value; S.vozPt = $('#cfPt').value; S.tema = $('#cfTema').value; S.metaMin = +$('#cfMeta').value;
      var lon = $('#cfLemb').checked; S.lembrete.hora = $('#cfHora').value || '19:00';
      if (lon && !S.lembrete.on && 'Notification' in window && Notification.permission === 'default') { try { Notification.requestPermission(); } catch (er) {} }
      if (lon !== S.lembrete.on) S.lembrete.ultimo = '';
      S.lembrete.on = lon; save(); aplicarTema(); fecharModal(); toast('Configurações salvas'); if (!SESSAO) render(); break;
    case 'exportar': exportar(); break;
    case 'instalar': instalar(); break;
    case 'zerar': confirmar('Apagar todo o progresso?', 'Esta ação não pode ser desfeita. Se quiser, salve um backup antes.', 'Apagar tudo', function () { try { localStorage.removeItem(KEY); localStorage.removeItem(KEY_BAK); } catch (er) {} location.reload(); }); break;
    case 'cert-nome': S.nome = ($('#certNome').value || '').trim().slice(0, 40); save(); certificado(); break;
    case 'imprimir': window.print(); break;
  }
});
document.addEventListener('click', function (e) { if (e.target.classList && e.target.classList.contains('modal')) fecharModal(); });
$('#gearBtn').addEventListener('click', function () { abrirConfig(); });
$('#temaBtn').addEventListener('click', function () { S.tema = temaAtual() === 'escuro' ? 'claro' : 'escuro'; save(); aplicarTema(); toast(S.tema === 'escuro' ? 'Fundo escuro ativado' : 'Fundo claro ativado'); });

/* ================= aplicativo instalável: service worker e atualização ================= */
if ('serviceWorker' in navigator && /^https?:/.test(location.protocol)) {
  addEventListener('load', function () {
    navigator.serviceWorker.register('sw.js').then(function (reg) {
      reg.addEventListener('updatefound', function () { var nw = reg.installing; if (!nw) return;
        nw.addEventListener('statechange', function () { if (nw.state === 'installed' && navigator.serviceWorker.controller) {
          var t = $('#toast'); t.innerHTML = 'Nova versão disponível. <button class="btn-g" type="button" id="atualizar" style="color:#fff;text-decoration:underline">Atualizar</button>'; t.classList.add('show');
          $('#atualizar').onclick = function () { nw.postMessage('pular'); setTimeout(function () { location.reload(); }, 300); }; } }); });
    }).catch(function () {});
  });
}

/* ================= início ================= */
aplicarTema(); conquistas(); novasMedalhas = [];
$$('.tab').forEach(function (t) { t.classList.toggle('on', t.dataset.tab === ABA); });
render();
if (AVISO_DADOS === 'recuperado') modal('<h3 id="mT">Progresso recuperado</h3><p>Os dados salvos estavam danificados. Restauramos a cópia de segurança mais recente. Pode faltar o estudo de hoje.</p>');
else if (AVISO_DADOS === 'perdido') modal('<h3 id="mT">Não foi possível ler o seu progresso</h3><p>Os dados salvos neste navegador estavam danificados e não havia cópia de segurança. Se você tiver um arquivo de backup, restaure em Configurações.</p>');
