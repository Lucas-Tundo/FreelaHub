# FreelaBoard

Painel **local** para monitorar oportunidades em plataformas freelancer, pontuar projetos, gerar propostas com IA e rastrear status.

**O sistema nunca envia nada sozinho.** Ele não faz login em plataformas, não clica em "enviar proposta" e não posta nada. O produto final é um painel de leitura com botão de copiar e rastreamento manual de status.

---

## O que você precisa ter instalado

| Requisito | Versão mínima |
|-----------|---------------|
| Node.js   | 20+           |
| npm       | 9+            |

Opcional (para coleta real):
- Chave da API da [Anthropic](https://console.anthropic.com/) (para gerar propostas)
- **99Freelas** — gratuito via Playwright (`npx playwright install chromium`)
- Freelancer.com — API paga; adapter existe mas vem **desabilitado** por padrão

---

## Instalação passo a passo

### 1. Entrar na pasta do projeto

```bash
cd freela
```

### 2. Instalar dependências

```bash
npm install
```

### 3. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

Edite o arquivo `.env`:

```env
# Obrigatório para gerar propostas
ANTHROPIC_API_KEY=sk-ant-...

# Opcional — só se habilitar freelancer no config.yaml (API paga)
# FLN_OAUTH_TOKEN=seu_token_aqui

# Opcional — padrões já funcionam
DATABASE_PATH=./data/freelaboard.db
WORKER_CRON=*/15 * * * *
```

### 4. Criar o banco de dados

```bash
npm run db:init
```

Isso cria `data/freelaboard.db` com **10 oportunidades de exemplo** para você explorar o painel sem configurar APIs.

### 5. Subir o painel

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000).

### 6. (Opcional) Rodar o worker de coleta

Para **99Freelas** e **Workana** (scraping com Playwright), instale o Chromium uma vez:

```bash
npx playwright install chromium
```

Em outro terminal:

```bash
# Uma coleta e encerra
npm run worker:once

# Loop contínuo com cron (padrão: a cada 15 min)
npm run worker
```

---

## Configuração do perfil (`config.yaml`)

Antes de usar em produção, edite `config.yaml` com **seus dados reais**:

```yaml
profile:
  niche: "automações n8n, dashboards, apps web"   # o que você vende
  stack: "Next.js, TypeScript, Node.js, n8n"    # sua stack
  price_min: 3000                                 # orçamento mínimo aceito
  price_max: 15000
  cases:                                          # cases citados nas propostas
    - title: "Nome do case"
      description: "Resultado mensurável"
      tags: ["n8n", "automação"]

scoring:
  threshold: 60          # score mínimo para gerar proposta automaticamente
  keywords: [...]        # palavras que você quer ver nos projetos
  blacklist: [...]       # frases que penalizam o score
```

---

## Como usar o painel

### Fluxo de triagem (3 min para 20 oportunidades)

1. Lista ordenada por **score** — comece pelo topo
2. Selecione uma oportunidade (`j`/`k` para navegar)
3. Leia a proposta gerada
4. `c` → copia a proposta
5. `o` → abre o projeto na plataforma em nova aba
6. Cole e envie **manualmente** na plataforma
7. `1` → marca como **enviada**
8. `x` ou `4` → **descarta** o que não serve

### Atalhos de teclado

| Tecla | Ação |
|-------|------|
| `j` | Próxima oportunidade na lista |
| `k` | Oportunidade anterior |
| `c` | Copiar proposta |
| `o` | Abrir projeto na plataforma |
| `x` | Descartar |
| `1` | Status: enviada |
| `2` | Status: respondeu |
| `3` | Status: fechou (precisa valor no card) |
| `4` | Status: descartada |
| `?` | Mostrar/ocultar ajuda de atalhos |

Atalhos não funcionam quando o foco está em um campo de texto.

### Filtros

- **Busca** — título e descrição (filtro local, instantâneo)
- **Plataforma / Score / Status** — filtro no servidor
- **Com/sem proposta** — filtro local
- **Só fracas** — propostas marcadas como genéricas pelo sistema

---

## Scripts disponíveis

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Painel em desenvolvimento |
| `npm run build` | Build de produção |
| `npm run start` | Painel em produção (após build) |
| `npm run db:init` | Recria banco + seed de exemplo |
| `npm run worker` | Worker em loop (cron) |
| `npm run worker:once` | Uma coleta e encerra |
| `npm run test` | Testes automatizados (Vitest) |
| `npm run lint` | ESLint |

---

## Estrutura do projeto

```
app/                  # Next.js — painel + API routes
components/           # UI (cards, filtros, métricas)
lib/
  adapters/           # Coleta por plataforma
  scoring.ts          # Pontuação (funções puras)
  proposal.ts         # Geração via Anthropic
  metrics.ts          # Cálculo de métricas
scripts/worker.ts     # Cron de coleta
config.yaml           # Seu perfil e regras de scoring
data/                 # Banco SQLite (gerado localmente)
```

---

## Solução de problemas

### Painel mostra erro ao carregar

```bash
npm run db:init
```

### Worker falha com "FLN_OAUTH_TOKEN não configurado"

O Freelancer está desabilitado por padrão em `config.yaml`. Se ainda aparecer esse erro, confira `platforms.freelancer.enabled: false`. Só habilite se você tiver token pago da API.

### Proposta não gera

Verifique `ANTHROPIC_API_KEY` no `.env` e se o score da oportunidade é ≥ `threshold` no `config.yaml`.

### Erros de coleta no painel

Banner vermelho no topo = último erro registrado em `activity_log`. Detalhes em `GET /api/activity?errors=true`.

---

## Regras do sistema

1. **Zero envio automático** — você copia e envia manualmente
2. **Zero login automatizado** — só leitura via API ou página pública
3. **Coleta respeita delay** de 30–120s entre requisições
4. **Erros de scraping falham alto** — aparecem no painel, nunca dado parcial silencioso
5. **Toda coleta é logada** em `activity_log`

---

## Status do desenvolvimento

- [x] Fase 1 — Setup + painel com seed
- [x] Fase 2 — Scoring + testes
- [x] Fase 3 — Adapter Freelancer.com + worker
- [x] Fase 4 — Geração de proposta com LLM
- [x] Fase 5 — Tracking + métricas + taxa por template
- [x] Fase 6 — Atalhos de teclado + filtros + README
- [x] Fase 7 — Adapters Workana e 99Freelas
- [x] Fase 8 — Vagas remotas (Trampos.co)

## Plataformas de coleta

| Plataforma | Tipo | Método | Status |
|------------|------|--------|--------|
| **99Freelas** | Freelance | Playwright | **Ativo por padrão** |
| **Trampos.co** | Vaga remota | Playwright | **Ativo por padrão** (só 100% remoto) |
| Workana | Freelance | Playwright | Pode ser bloqueado por Cloudflare |
| Freelancer.com | Freelance | API oficial (paga) | Desabilitado por padrão |

No painel, use o filtro **Tipo** para ver só Freelance, só Vagas remotas, ou todos.

Para habilitar scraping, edite `config.yaml`:

```yaml
platforms:
  99freelas:
    enabled: true
  trampos:
    enabled: true   # vagas 100% remotas
```

Depois rode `npx playwright install chromium` e `npm run worker:once`.

**Workana:** se o worker registrar erro de Cloudflare, a coleta automática não funcionará neste ambiente — o erro aparece no painel (regra: falhar alto, nunca dado parcial).
