-- Seed: 10 oportunidades falsas para desenvolvimento

INSERT INTO opportunities (
  platform, external_id, url, title, description, budget, budget_currency,
  proposals_count, client_country, client_verified, posted_at, score,
  score_breakdown, content_hash
) VALUES
(
  'freelancer', 'fl-1001',
  'https://www.freelancer.com/projects/example/automacao-n8n-erp',
  'Automação n8n integrando ERP com WhatsApp',
  'Preciso automatizar o fluxo de pedidos do nosso ERP para notificações no WhatsApp. Já temos as APIs documentadas. Busco alguém com experiência em n8n e webhooks.',
  8000, 'BRL', 3, 'BR', 1,
  datetime('now', '-2 hours'),
  82,
  '{"keywords":{"matched":["automação","n8n"],"points":30},"budget":{"value":8000,"min":3000,"points":20},"competition":{"count":3,"points":12},"freshness":{"hours":2,"points":10},"verified":{"points":5},"blacklist":{"matched":[],"points":0},"total":82}',
  'hash-fl-1001'
),
(
  'workana', 'wk-2002',
  'https://www.workana.com/job/exemplo-dashboard-vendas',
  'Dashboard de vendas em tempo real com React',
  'Queremos um painel interno conectado ao nosso banco PostgreSQL. Métricas de vendas, funil e exportação CSV. Design já definido no Figma.',
  12000, 'BRL', 7, 'BR', 1,
  datetime('now', '-5 hours'),
  78,
  '{"keywords":{"matched":["dashboard"],"points":15},"budget":{"value":12000,"min":3000,"points":20},"competition":{"count":7,"points":8},"freshness":{"hours":5,"points":9},"verified":{"points":5},"blacklist":{"matched":[],"points":0},"total":78}',
  'hash-wk-2002'
),
(
  '99freelas', '99-3003',
  'https://www.99freelas.com.br/project/exemplo-app-web',
  'App web para gestão de ordens de serviço',
  'Sistema simples para cadastro de clientes, ordens de serviço e status. Stack livre, preferência por Next.js. Orçamento fixo.',
  6000, 'BRL', 12, 'BR', 0,
  datetime('now', '-1 days'),
  65,
  '{"keywords":{"matched":["app web"],"points":15},"budget":{"value":6000,"min":3000,"points":20},"competition":{"count":12,"points":5},"freshness":{"hours":24,"points":7},"verified":{"points":0},"blacklist":{"matched":[],"points":0},"total":65}',
  'hash-99-3003'
),
(
  'freelancer', 'fl-1004',
  'https://www.freelancer.com/projects/example/integracao-api',
  'Integração API REST entre CRM e plataforma de e-mail',
  'Sincronizar contatos e eventos entre HubSpot e Mailchimp. Experiência com OAuth e rate limiting necessária.',
  4500, 'USD', 2, 'US', 1,
  datetime('now', '-3 hours'),
  88,
  '{"keywords":{"matched":["api"],"points":15},"budget":{"value":4500,"min":3000,"points":20},"competition":{"count":2,"points":15},"freshness":{"hours":3,"points":10},"verified":{"points":5},"country":{"points":5},"blacklist":{"matched":[],"points":0},"total":88}',
  'hash-fl-1004'
),
(
  'workana', 'wk-2005',
  'https://www.workana.com/job/exemplo-landing-page',
  'Landing page institucional responsiva',
  'Site de uma página com formulário de contato e SEO básico. Conteúdo fornecido pelo cliente.',
  1500, 'BRL', 25, 'BR', 0,
  datetime('now', '-4 days'),
  28,
  '{"keywords":{"matched":[],"points":0},"budget":{"value":1500,"min":3000,"points":0},"competition":{"count":25,"points":0},"freshness":{"hours":96,"points":2},"verified":{"points":0},"blacklist":{"matched":[],"points":0},"total":28}',
  'hash-wk-2005'
),
(
  'freelancer', 'fl-1006',
  'https://www.freelancer.com/projects/example/bot-telegram',
  'Bot Telegram para atendimento automatizado',
  'Bot que responde FAQ e encaminha para humano. Base de conhecimento em planilha Google Sheets.',
  3500, 'BRL', 8, 'BR', 1,
  datetime('now', '-8 hours'),
  58,
  '{"keywords":{"matched":["automação"],"points":15},"budget":{"value":3500,"min":3000,"points":15},"competition":{"count":8,"points":6},"freshness":{"hours":8,"points":8},"verified":{"points":5},"blacklist":{"matched":[],"points":0},"total":58}',
  'hash-fl-1006'
),
(
  '99freelas', '99-3007',
  'https://www.99freelas.com.br/project/exemplo-urgente',
  'URGENTE: site barato para ontem, teste grátis primeiro',
  'Preciso de um site completo com e-commerce. Orçamento apertado, quero ver um teste grátis antes de pagar.',
  500, 'BRL', 40, 'BR', 0,
  datetime('now', '-30 minutes'),
  5,
  '{"keywords":{"matched":[],"points":0},"budget":{"value":500,"min":3000,"points":0},"competition":{"count":40,"points":0},"freshness":{"hours":0.5,"points":10},"verified":{"points":0},"blacklist":{"matched":["urgente e barato","teste grátis","preciso pra ontem"],"points":-90},"total":5}',
  'hash-99-3007'
),
(
  'workana', 'wk-2008',
  'https://www.workana.com/job/exemplo-migracao-dados',
  'Migração de dados legados para Supabase',
  'Exportar dados de sistema desktop antigo (Access) e importar no Supabase com scripts Node.js. Validação de integridade incluída.',
  9000, 'BRL', 4, 'BR', 1,
  datetime('now', '-12 hours'),
  80,
  '{"keywords":{"matched":["supabase"],"points":15},"budget":{"value":9000,"min":3000,"points":20},"competition":{"count":4,"points":12},"freshness":{"hours":12,"points":8},"verified":{"points":5},"blacklist":{"matched":[],"points":0},"total":80}',
  'hash-wk-2008'
),
(
  'freelancer', 'fl-1009',
  'https://www.freelancer.com/projects/example/painel-admin',
  'Painel admin multi-tenant com autenticação',
  'SaaS B2B com login, roles e dashboard por tenant. Next.js + PostgreSQL. MVP em 6 semanas.',
  15000, 'BRL', 6, 'BR', 1,
  datetime('now', '-1 hours'),
  85,
  '{"keywords":{"matched":["dashboard","next.js"],"points":30},"budget":{"value":15000,"min":3000,"points":20},"competition":{"count":6,"points":8},"freshness":{"hours":1,"points":10},"verified":{"points":5},"blacklist":{"matched":[],"points":0},"total":85}',
  'hash-fl-1009'
),
(
  '99freelas', '99-3010',
  'https://www.99freelas.com.br/project/exemplo-relatorio',
  'Relatório automatizado em PDF a partir de planilha',
  'Script que lê Google Sheets e gera PDF semanal com gráficos. Pode ser n8n ou Node.js.',
  2500, 'BRL', 15, 'BR', 0,
  datetime('now', '-2 days'),
  45,
  '{"keywords":{"matched":["n8n","automação"],"points":30},"budget":{"value":2500,"min":3000,"points":0},"competition":{"count":15,"points":4},"freshness":{"hours":48,"points":5},"verified":{"points":0},"blacklist":{"matched":[],"points":0},"total":45}',
  'hash-99-3010'
);

-- Propostas de exemplo (apenas para oportunidades com score alto)
INSERT INTO proposals (opportunity_id, template_used, body, is_weak, regenerated_count)
SELECT id, 'default',
  'Vi que vocês precisam integrar o ERP ao WhatsApp via n8n — já fiz fluxo parecido para uma distribuidora que reduziu 4h/dia de trabalho manual.

Entendo o problema: pedidos saem do ERP mas ninguém avisa o cliente em tempo real.

Como resolveria:
1. Mapear endpoints do ERP e criar webhooks no n8n
2. Montar fluxo de notificação com retry e log de erros
3. Testar com volume real antes de ir pra produção

Case similar: automação n8n + WhatsApp para e-commerce, 200+ pedidos/dia sem falha.

Qual API do ERP vocês usam hoje — REST ou SOAP?',
  0, 0
FROM opportunities WHERE external_id = 'fl-1001';

INSERT INTO proposals (opportunity_id, template_used, body, is_weak, regenerated_count)
SELECT id, 'default',
  'O dashboard em React conectado ao PostgreSQL é exatamente o tipo de projeto que faço. Métricas de funil com exportação CSV são straightforward com a stack certa.

Meu plano:
1. Conectar ao Postgres com queries otimizadas (índices nas colunas de data)
2. Montar componentes de gráfico seguindo o Figma
3. Implementar export CSV com filtros de período

Já entreguei painel de vendas para SaaS B2B com 15k eventos/dia.

O Figma já tem os breakpoints mobile definidos?',
  0, 0
FROM opportunities WHERE external_id = 'wk-2002';

INSERT INTO proposals (opportunity_id, template_used, body, is_weak, regenerated_count)
SELECT id, 'default',
  'A integração HubSpot ↔ Mailchimp com OAuth pede cuidado com rate limiting — já passei por isso em projeto similar.

Passos:
1. Configurar apps OAuth em ambas plataformas
2. Mapear campos de contato e eventos de sync
3. Implementar fila com retry exponencial

Case: sync bidirecional CRM ↔ e-mail para agência com 50k contatos.

Vocês precisam de sync em tempo real ou batch diário?',
  0, 0
FROM opportunities WHERE external_id = 'fl-1004';

INSERT INTO proposals (opportunity_id, template_used, body, is_weak, regenerated_count)
SELECT id, 'default',
  'Proposta para app web de ordens de serviço com Next.js.',
  0, 0
FROM opportunities WHERE external_id = '99-3003';

INSERT INTO proposals (opportunity_id, template_used, body, is_weak, regenerated_count)
SELECT id, 'adjusted:mais curta',
  'Bot Telegram com FAQ + encaminhamento humano via Google Sheets — já implementei fluxo parecido.',
  0, 1
FROM opportunities WHERE external_id = 'fl-1006';

INSERT INTO proposals (opportunity_id, template_used, body, is_weak, regenerated_count)
SELECT id, 'default',
  'Migração Access → Supabase com scripts Node.js e validação de integridade.',
  0, 0
FROM opportunities WHERE external_id = 'wk-2008';

-- Tracking com status variados
INSERT INTO tracking (opportunity_id, status, sent_at, replied_at, closed_value, notes)
SELECT id, 'nova', NULL, NULL, NULL, ''
FROM opportunities WHERE external_id IN ('fl-1001', 'wk-2002', 'fl-1004', 'fl-1009');

INSERT INTO tracking (opportunity_id, status, sent_at, replied_at, closed_value, notes)
SELECT id, 'enviada', datetime('now', '-1 days'), NULL, NULL, ''
FROM opportunities WHERE external_id = '99-3003';

INSERT INTO tracking (opportunity_id, status, sent_at, replied_at, closed_value, notes)
SELECT id, 'respondeu', datetime('now', '-3 days'), datetime('now', '-2 days'), NULL, 'Cliente pediu call'
FROM opportunities WHERE external_id = 'fl-1006';

INSERT INTO tracking (opportunity_id, status, sent_at, replied_at, closed_value, notes)
SELECT id, 'fechou', datetime('now', '-10 days'), datetime('now', '-8 days'), 8500, 'Fechou no valor cheio'
FROM opportunities WHERE external_id = 'wk-2008';

INSERT INTO tracking (opportunity_id, status, sent_at, replied_at, closed_value, notes)
SELECT id, 'descartada', NULL, NULL, NULL, 'Orçamento muito baixo'
FROM opportunities WHERE external_id IN ('wk-2005', '99-3007', '99-3010');

-- Log de atividade de exemplo
INSERT INTO activity_log (platform, level, message, metadata)
VALUES
  ('seed', 'info', 'Banco populado com 10 oportunidades de exemplo', '{}'),
  ('freelancer', 'info', 'Coleta simulada concluída', '{"count": 4}');
