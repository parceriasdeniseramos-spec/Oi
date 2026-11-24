# Site pessoal para corretor: como fazer para um cliente

1. Copiar `dados/novo-corretor.json` com o nome do cliente (ex.: `dados/nani.json`).
2. Preencher só com dados **reais e confirmados** pelo corretor. Campo vazio não aparece no site.
   - `indicadores`: só com números que ele comprove. Sem números, a faixa some.
   - `selo`: o selo da foto (ex.: "16 anos de mercado"). Vazio, não aparece.
   - `instagram`, `telefone`, `email`, `horario`: vazios não aparecem.
   - `whatsapp`: só números, com 55 e DDD (ex.: 5551999999999).
3. Fotos em `img/` (de preferência .webp). A principal na vertical, com o rosto na parte de cima. Ajustar `foto_posicao` se o rosto cortar.
4. Montar: `python3 montar.py dados/nani.json ../clientes/nani`
5. Imagem de compartilhamento: `node imagem-compartilhar.js dados/nani.json` (depois copiar `img/compartilhar.jpg` para a pasta do cliente).
6. Conferir no celular e no computador, mostrar ao cliente e publicar só depois da aprovação.

O modelo de demonstração usa `dados/exemplo-marina.json` (fictício, fora do Google). Os dados do modelo nunca vão para o site de um cliente.
