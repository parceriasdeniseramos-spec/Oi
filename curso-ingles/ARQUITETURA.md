# Fala Fácil · Arquitetura

## Arquivos

| Arquivo | Função |
|---|---|
| `index.html` | Página comercial (proposta, método, módulos, FAQ, inscrição pelo WhatsApp) |
| `app.html` | Aplicativo do aluno (estrutura da tela e estilos) |
| `src/vocabulario.js` | Vocabulário de cada aula: inglês, pronúncia aproximada, tradução, dica e respostas aceitas |
| `src/pedagogia.js` | Estrutura de frase, frases-modelo, diálogo e frases para montar de cada aula; módulos; guia de sons difíceis |
| `src/app.js` | Lógica: estado, revisão espaçada, voz, microfone, aulas, avaliações, painel, conquistas |

Para acrescentar conteúdo, edite só os dois arquivos de dados (`vocabulario.js` e `pedagogia.js`). As telas e os exercícios são gerados automaticamente.

## Jornada

5 módulos × 6 dias = 30 dias. Cada módulo tem 5 aulas e 1 avaliação (12 questões, aprovação com 70%). O dia 30 é a avaliação final (20 questões), que conclui o módulo 5 e libera o certificado.

Cada aula segue 6 etapas: Aprenda → Escute → Pronuncie (por palavra) → Construa (estrutura + montar frases) → Pratique (6 exercícios + diálogo + desafio de conversação) → Revise (classificação + revisão de aulas anteriores).

## Progresso

Salvo automaticamente no `localStorage` do navegador, na chave `falafacil_v2` (o progresso da versão anterior é importado).
Revisão espaçada: Difícil volta em 1 dia, Aprendendo em 3 dias, Dominada em 7, 14 e depois 30 dias. Errar um exercício marca a palavra como difícil para o mesmo dia.

Limite: o progresso fica no aparelho. Para sincronizar entre aparelhos e vender com login, será preciso um backend com contas de aluno.

## Microfone

Usa o reconhecimento de fala do navegador (Web Speech API): Chrome no Android e no computador, Safari no iPhone (com o Ditado ativado). Exige o site aberto por HTTPS.
O app mostra se a fala foi **reconhecida** e com que confiança. Ele **não** faz avaliação fonética de pronúncia e não afirma que a pronúncia está correta.

Próximo passo para avaliação real de pronúncia: um serviço de *pronunciation assessment* (por exemplo, Azure Speech), chamado por um backend, que devolve nota por som e por palavra.

## Tutor com inteligência artificial (futuro)

O objeto `TUTOR` em `src/app.js` concentra as respostas do tutor (explicar erros, explicar a ordem da frase, sugerir revisão). Hoje ele usa regras locais. Para ligar a IA:

1. Criar um backend (por exemplo, uma Netlify Function) que guarda a chave da API **no servidor**. Nunca colocar a chave no navegador.
2. Ligar `CONFIG.ia.ativo` e apontar `CONFIG.ia.endpoint` para essa função.
3. Fazer os métodos do `TUTOR` chamarem o endpoint, enviando o nível do aluno, a aula atual e as palavras difíceis (`TUTOR.sugerirRevisao()`).
4. Novos recursos previstos: conversa em inglês com níveis adaptados, correção de frases com explicação em português, simulação de situações (restaurante, reunião, hotel), diálogos personalizados e recomendação de revisão a partir dos erros recorrentes.

Diretriz de comportamento do tutor: amigável, paciente, explica em português, fala em inglês simples e incentiva o aluno a falar sem medo.

## Trilhas futuras

Viagens, Dia a dia, Trabalho e Conversação. Cada trilha é um conjunto de aulas no mesmo formato (`LICOES` + `PED`), com um módulo próprio em `MODULOS` ou uma lista separada.
