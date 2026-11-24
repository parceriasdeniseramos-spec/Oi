# H2D Studio · Plataforma para mandatos: planos e próximos passos

## O que o modelo de demonstração já faz (funcionando de verdade)

- Menu com Início, Sobre, Atuação, Projetos e Leis, Prestação de Contas, Notícias, Agenda e Contato, com o botão "Atendimento ao cidadão"
- Abertura com nome, cargo, frase de posicionamento e os botões "Conheça meu trabalho" e "Fale com meu gabinete"; carrossel com pausa
- Troca de identidade visual (azul, verde e vinho) para mostrar que cada cliente tem a sua
- Biografia em blocos (trajetória, formação, compromissos)
- Vídeo que só carrega ao tocar, sem som automático e com legenda
- Projetos e leis com filtros por tipo, assunto, ano e situação (aprovado, em tramitação, apresentado, arquivado, rejeitado)
- Prestação de contas com 8 indicadores por período (2026, 2025, mandato), relatórios e fontes
- Fiscalização com linha do tempo de cada demanda, filtros por bairro, assunto e situação
- Mapa real e interativo (OpenStreetMap) com filtros de visitas, demandas e fiscalizações
- Agenda em calendário, com detalhes do evento, "Adicionar à minha agenda" e "Ver no mapa"
- Notícias com filtros, página individual com endereço próprio, "Compartilhar" e "Copiar link"
- Galeria com filtros e ampliação das fotos
- Atendimento ao cidadão com 9 assuntos, aviso de emergência (190, 192, 193), horário e mensagem pronta no WhatsApp
- Formulários com validação, proteção contra robôs (campo invisível) e contra envio duplicado
- Política de Privacidade (LGPD), aviso de site institucional (sem conteúdo eleitoral), acessibilidade (teclado, foco, leitores de tela, movimento reduzido)
- Funciona também aberto dentro do WhatsApp (conteúdo completo, sem as animações)
- Continua com noindex,nofollow, por ser demonstração

## O que depende de servidor (fazer com o Diogo, quando houver cliente)

1. **Painel administrativo com login:** para o gabinete atualizar notícias, agenda, projetos, indicadores e fotos sem mexer em código. Sugestão: um CMS pronto (Decap CMS no próprio Netlify, ou Sanity), com níveis de acesso e histórico de alterações.
2. **Envio dos formulários para um banco ou e-mail:** hoje vão pelo WhatsApp, que é seguro e não guarda dados. Se o gabinete quiser registro, usar o Netlify Forms com proteção contra spam.
3. **Backups e históricos.**
4. **Domínio, HTTPS, Google Search Console, sitemap e imagem de compartilhamento**, na publicação oficial.
5. **Ferramentas de estatística**, só com aviso de cookies.

## Planos comerciais (sugestão de valores)

| | Institucional | Profissional | Completo |
|---|---|---|---|
| Site, identidade visual, sobre, atuação, notícias, agenda, galeria, contato, SEO básico | ✓ | ✓ | ✓ |
| Prestação de contas, projetos e leis, fiscalização, formulários, WhatsApp, painel administrativo, SEO avançado | | ✓ | ✓ |
| Atendimento inteligente, mapa de atuação, acompanhamento de demandas, indicadores, central de notícias | | | ✓ |
| **Implantação** | R$ 1.490 | R$ 2.490 | R$ 3.990 |
| **Manutenção mensal** | R$ 249 | R$ 349 | R$ 549 |

Valores a ajustar com o Diogo, conforme o tempo do painel administrativo.

## Cuidados legais (para todos os clientes)

- Site institucional separado de campanha eleitoral
- Nada pago com dinheiro público para fins eleitorais
- Sem disparo em massa nem segmentação por opinião política
- Conteúdo e funcionalidades revisados pelo jurídico do cliente antes da publicação
- Nenhum número ou resultado publicado sem documento que comprove
