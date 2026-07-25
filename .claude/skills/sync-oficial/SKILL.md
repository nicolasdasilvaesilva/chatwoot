---
name: sync-oficial
description: Use this skill when incorporating improvements from the OFFICIAL Chatwoot repository (chatwoot/chatwoot) into the Indica Fácil fork (nicolasdasilvaesilva/chatwoot). This is NOT for syncing with the fazer.ai fork — use sync-fork for that. Covers the governance rules for incremental intelligent updates: full audit before any changes, file-by-file comparison, WhatsApp integration protection, conflict resolution protocol, and continuous validation. Trigger when the user wants to pull security fixes, performance improvements, new features, AI/Captain improvements, or UX enhancements from the official Chatwoot into the Indica Fácil fork.
allowed-tools: Bash, Read, Edit, Write, Grep, Glob, Agent
---

# Sync Oficial — chatwoot/chatwoot → nicolasdasilvaesilva/chatwoot (Indica Fácil)

> **Esta skill é exclusiva para incorporar melhorias do Chatwoot OFICIAL.**
> Para sincronizar com o fork fazer.ai, use a skill `sync-fork`.
> Para aplicar atualizações white-label, use a skill `chatwoot-indicafacil-updater`.

## Regra de Ouro

**Nosso fork é a Fonte da Verdade. O Chatwoot Oficial é apenas referência técnica.**

Em hipótese alguma:
- Substitua nossa implementação pela oficial
- Copie arquivos inteiros porque mudaram
- Remova funcionalidades
- Altere fluxos de negócio
- Elimine integrações
- Descaracterize nossa arquitetura

Todo trabalho deve ser realizado através de **Merge Inteligente** — extrair apenas trechos compatíveis do oficial.

## Repositórios

| Papel | Repositório | Local |
|---|---|---|
| **Fork (Fonte da Verdade)** | `nicolasdasilvaesilva/chatwoot` | `D:\dev2026\chatwoot-free-indicafacil-source` |
| **Oficial (Referência)** | `chatwoot/chatwoot` | Obtido via zip de release ou `git remote add upstream` |

## Fluxo completo (checklist obrigatório)

Não pule etapas. Cada uma existe por causa de um incidente real ou risco identificado.

### Etapa 0 — Preparação

1. Confirmar com o usuário **qual versão oficial** será usada como referência (ex: `v4.16.1`).
2. Obter o código oficial (zip da release ou checkout do tag).
3. Confirmar qual é a versão atual do fork (`config/app.yml`, tag mais recente).
4. Criar branch de trabalho: `chore/sync-oficial-X.Y.Z`.

```bash
git checkout main
git pull origin main
git checkout -b chore/sync-oficial-X.Y.Z
```

### Etapa 1 — Auditoria Completa do Fork (OBRIGATÓRIA)

**Antes de escrever qualquer linha de código**, gerar um inventário completo das customizações do fork. Isso reduz drasticamente o risco de sobrescrever funcionalidades exclusivas.

#### 1.1 Inventário de customizações

Analisar profundamente:

- **Estrutura do projeto** — diretórios adicionados, reorganizações
- **Módulos exclusivos** — Kanban, Internal Chat, Baileys, Z-API, mensagens agendadas
- **Componentes Vue personalizados** — white-label, ProFeatureNudge, etc.
- **APIs próprias** — controllers, rotas, políticas adicionadas
- **Models e migrations** — tabelas, colunas, índices exclusivos do fork
- **Services e Jobs** — lógica de negócio customizada
- **Workers e filas Sidekiq** — processamento assíncrono próprio
- **Webhooks** — eventos customizados
- **Docker / Docker Compose** — configurações específicas
- **Variáveis de ambiente** — chaves exclusivas
- **CI/CD e .github** — workflows próprios

#### 1.2 Auditoria do WhatsApp

Engenharia reversa completa das integrações WhatsApp existentes no fork:

- **Providers**: Baileys, WhatsApp Cloud API, Z-API, outros
- **Inboxes customizadas**: canais próprios
- **Controllers, Models, Services, Jobs** específicos
- **Fluxo de mensagens**: envio, recebimento, anexos, mídias, áudios, documentos
- **Funcionalidades**: localização, contatos, figurinhas, reações, digitação, confirmações de entrega/leitura, edição, exclusão, grupos, comunidades, chamadas de voz/vídeo
- **Sincronização**: histórico, reconexão, persistência, QR Code, gerenciamento de sessões
- **Vue Components, Stores, Helpers** relacionados

> Essas integrações fazem parte da identidade do projeto. **Nunca remova nenhuma delas.**

#### 1.3 Documentar o inventário

Gerar um relatório estruturado (pode ser em memória da conversa ou arquivo temporário) listando todos os pontos acima. Este inventário é a referência para todas as decisões de merge.

### Etapa 2 — Análise de Releases Oficiais

Para cada release oficial entre a versão do fork e a versão alvo, identificar:

| Categoria | O que procurar |
|---|---|
| **Segurança** | CVEs, patches de autenticação/autorização, sanitização |
| **Performance** | Otimizações de queries, cache, índices, N+1 |
| **Bugs** | Correções que afetam funcionalidades que usamos |
| **IA** | Melhorias no Captain, AI Assist, Knowledge Base, RAG |
| **UX/UI** | Componentes novos, acessibilidade, responsividade |
| **Canais** | Melhorias em WhatsApp Cloud, Email, Widget, API |
| **Infraestrutura** | ActionCable, WebSockets, Sidekiq, Redis, PostgreSQL |
| **Observabilidade** | Logs, monitoramento, métricas |
| **Automações** | Melhorias em automations, macros, SLA |
| **Novos recursos** | Features que podem ser incorporadas sem conflito |

Classificar cada item como:
- **INCORPORAR** — compatível, sem conflito com customizações
- **AVALIAR** — potencialmente compatível, precisa análise mais profunda
- **IGNORAR** — conflita com nossas customizações ou é irrelevante

### Etapa 2.5 — Diagnóstico de 3 conjuntos (OBRIGATÓRIO — incidente real)

> **Esta etapa existe por causa de um incidente em 2026-07-25.** O patch 4.16.1 foi aplicado copiando arquivos direto do oficial, tratando como "customizado" apenas o que tinha marca. Isso sobrescreveu **39 arquivos** e removeu silenciosamente **Baileys, Z-API, Chat Interno e Kanban** da interface. O build Docker passou **verde**. Nenhum lint acusou. O defeito só apareceu quando o usuário abriu a tela de criar caixa de entrada e viu 2 provedores em vez de 4 — depois da release já publicada.

**O fork não difere do oficial apenas em marca.** Ele carrega features inteiras que tocam arquivos compartilhados com o upstream:

| Arquivo compartilhado | Feature do fork que vive nele |
|---|---|
| `config/routes.rb` | rotas do Internal Chat, Scheduled Messages |
| `app/javascript/dashboard/store/index.js` | módulos Vuex do Internal Chat |
| `app/javascript/dashboard/routes/dashboard/dashboard.routes.js` | rotas do Kanban e Chat Interno |
| `app/javascript/dashboard/featureFlags.js` | flags do fork |
| `.../settings/inbox/channels/Whatsapp.vue` | provedores Baileys e Z-API |
| `app/controllers/webhooks/whatsapp_controller.rb` | webhooks Baileys/Z-API |
| `app/services/whatsapp/incoming_message_base_service.rb` | locking de duas camadas, reações |

Antes de copiar **qualquer** arquivo, rode o diagnóstico:

```
A = arquivos que o patch altera   (oficial_novo  != oficial_base)
B = arquivos que o fork customiza (fork_base     != oficial_base)
A ∩ B = EXIGEM MERGE MANUAL — nunca copiar
```

Para cada arquivo em `A ∩ B`, use merge de 3 vias e depois o white-label:

```bash
git merge-file -p <fork_base> <oficial_base> <oficial_novo> > resultado
```

Conflito no merge significa que **ambos mexeram na mesma linha** — resolva a favor do fork (Regra de Ouro) e só incorpore o upstream quando comprovadamente compatível. Atenção: escolher "o lado do fork" pode quebrar o arquivo se o upstream tiver renomeado/movido símbolos que o fork ainda usa — rode o lint depois, sempre.

### Etapa 3 — Merge Inteligente (arquivo por arquivo)

Para cada arquivo diferente entre os dois repositórios:

1. **Compare** cuidadosamente as diferenças
2. **Entenda o motivo** — é do nosso fork ou do oficial?
3. **Classifique a diferença**:

| Código | Significado |
|---|---|
| **NOSSO** | Customização do fork — preservar integralmente |
| **OFICIAL** | Melhoria do oficial — incorporar |
| **MISTO** | Ambos mudaram — merge manual cuidadoso |
| **IGNORAR** | Diferença irrelevante (formatação, comentários) |

4. **Preserve sempre** nossa implementação como base
5. **Extraia apenas os trechos necessários** do projeto oficial
6. **Faça merge manual** — nunca copie arquivos inteiros
7. **Execute testes** após cada lote

### Etapa 4 — Arquivos protegidos (NUNCA sobrescrever)

Os seguintes arquivos/diretórios **nunca devem ser substituídos** pelo oficial:

| Arquivo/Diretório | Motivo |
|---|---|
| `VERSION_CW` | Versão customizada do painel |
| `CUSTOM_BRANDING.md` | Configurações de branding |
| `config/app.yml` | Versão e configurações específicas |
| `app/jobs/internal/check_new_versions_job.rb` | Notificação de versão via GitHub `nicolasdasilvaesilva` |
| `app/javascript/dashboard/components/app/UpdateBanner.vue` | Links de atualização |
| `.github/` | CI/CD e instruções próprias |
| `.claude/` | Skills e configuração do agente |
| `docker-compose.yaml` | Configuração Docker customizada |
| Arquivos com links `licencas.indicafacil.app` | Links de licença Kanban Pro |
| `WhatsappLinkDeviceModal.vue` | URL da extensão Chrome (ID fixo) |
| Qualquer arquivo do módulo Kanban | Feature exclusiva do fork |
| Qualquer arquivo do Internal Chat | Feature exclusiva do fork |
| Providers Baileys/Z-API | Integrações exclusivas |

### Etapa 5 — Áreas de alto risco (atenção redobrada)

#### 5.1 WhatsApp incoming message service
- `app/services/whatsapp/incoming_message_base_service.rb` — nosso fork tem locking de duas camadas
- Nunca substituir pelo simples dedup do oficial
- Incorporar apenas melhorias pontuais (ex: check de `@contact.blocked?`)

#### 5.2 Signature architecture
- Fork usa arquitetura send-time (PR #79), removendo manipulação no editor
- Upstream pode re-introduzir o que foi removido — manter nosso approach

#### 5.3 db/schema.rb
- Nunca rodar `db:schema:dump` (polui com tabelas kanban do DB local)
- Resolver conflitos manualmente, pegando apenas novas tabelas/colunas do oficial
- Verificar: `grep -ic kanban db/schema.rb` deve ser 0 no fork CE

#### 5.4 InstallationConfig
- Fork pode ter custom coder ou constantes próprias
- Testar compatibilidade antes de aceitar simplificações do oficial

#### 5.5 i18n
- Combinar chaves de ambos os lados
- Não inventar traduções pt_BR — só incorporar as que o oficial já tem

### Etapa 6 — Protocolo de conflitos

Se uma alteração oficial entrar em conflito com nossas customizações:

1. **Nunca substitua automaticamente**
2. **Nunca escolha um dos lados** sem análise
3. **Documente**: motivo do conflito, impacto, riscos, alternativas
4. **Priorize sempre nossa implementação**
5. Se o merge seguro não for possível → **PARE e solicite aprovação**

> Antes de alterar qualquer arquivo, informe: arquivo, motivo, funcionalidade oficial relacionada, impacto esperado, estratégia para evitar regressões.

> Após cada alteração, informe: arquivos modificados, funcionalidades preservadas, funcionalidades adicionadas, possíveis riscos, testes executados, resultado.

### Etapa 7 — Validação contínua

Após cada lote de alterações, executar:

```bash
# 1. Sem marcadores de conflito
grep -rl '<<<<<<<\|=======\|>>>>>>>' $(git diff --name-only --cached) || echo "clean"

# 2. Parse Ruby
find . -name "*.rb" -newer .git/HEAD -exec ruby -c {} +

# 3. Rails boots
bundle exec rails runner 'puts "ok"'

# 4. Migrations
bundle exec rails db:migrate

# 5. Specs das áreas alteradas
bundle exec rspec spec/models spec/policies
bundle exec rspec spec/services/whatsapp  # se WA tocado

# 6. Rubocop completo (Husky não pega arquivos sem diff)
bundle exec rubocop --parallel

# 7. Smoke test de serialização
bundle exec rails runner 'InstallationConfig.find_each { |c| c.value }; puts "ok"'

# 8. Schema integrity
grep -ic kanban db/schema.rb  # DEVE ser 0

# 9. Frontend (se alterado)
NODE_OPTIONS="--max-old-space-size=4096" npx vitest run --no-coverage --reporter=verbose
```

### Etapa 7.5 — Validar por FEATURE, não por arquivo (OBRIGATÓRIO)

Build verde e lint limpo **não provam** que as features do fork sobreviveram. Conte referências reais:

```bash
echo "routes internal_chat:      $(grep -c 'internal_chat' config/routes.rb)"                       # esperado >= 1
echo "dashboard.routes kanban:   $(grep -c 'kanban\|internalChat' app/javascript/dashboard/routes/dashboard/dashboard.routes.js)"  # >= 4
echo "vuex internalChat:         $(grep -c 'internalChat' app/javascript/dashboard/store/index.js)"  # >= 4
echo "Whatsapp.vue baileys/zapi: $(grep -ic 'baileys\|zapi' app/javascript/dashboard/routes/dashboard/settings/inbox/channels/Whatsapp.vue)"  # >= 20
echo "webhook baileys/zapi:      $(grep -ic 'baileys\|zapi' app/controllers/webhooks/whatsapp_controller.rb)"  # >= 2
echo "internal_chat models:      $(ls app/models/internal_chat/ | wc -l)"        # 12
echo "baileys handlers:          $(ls app/services/whatsapp/baileys_handlers/ | wc -l)"  # 11
echo "zapi handlers:             $(ls app/services/whatsapp/zapi_handlers/ | wc -l)"     # 6
```

Qualquer zero aqui é **bloqueante**. Confirme também na UI antes de publicar: a tela `settings/inboxes/new/whatsapp` deve listar **4 provedores** (Cloud, Twilio, Baileys, Z-API), e o menu lateral deve mostrar **Chat Interno** e **Kanban**.

### Etapa 8 — White-label check pós-merge

Após incorporar do oficial, verificar que o white-label permanece intacto:

```bash
# Nenhuma referência ao Chatwoot oficial onde deveria ser Indica Fácil
grep -rn "powered by Chatwoot" app/javascript/ || echo "clean"

# Links de licença preservados
grep -rn "licencas.indicafacil.app" app/javascript/

# Extensão Chrome com ID correto
grep -rn "lnkmkgmicadcmbocnbogggkemjihjjcm" app/javascript/

# Versão no app.yml
grep "version:" config/app.yml
```

### Etapa 9 — Subagent review (obrigatório para merges grandes)

Para merges com mais de 20 arquivos alterados, rodar painel de subagentes:

1. **Integridade do schema** — kanban=0, tabelas corretas, f_unaccent presente
2. **Verificação por arquivo** — cada arquivo mantém a customização do fork
3. **Área de alto risco** — WhatsApp service, signature, serialization
4. **Breakage semântico** — imports/constantes renomeados no oficial que o fork ainda referencia

### Etapa 10 — CI e finalização

1. Commitar com mensagem descritiva
2. Push do branch
3. Rodar CI no branch
4. Aguardar green
5. Solicitar aprovação do usuário para merge

## O que esta skill NÃO cobre

- Sync com o fork fazer.ai → use `sync-fork`
- White-label de novas versões → use `chatwoot-indicafacil-updater`
- Release notes → use `release-notes`
- Decisões de produto sobre features do oficial (ex: adotar Captain model novo) — escalar para o usuário

## Missão

Atuar como mantenedor principal de um fork empresarial altamente customizado. O objetivo é evoluir continuamente o fork, absorvendo o que há de melhor no Chatwoot Oficial, sem jamais descaracterizar a arquitetura ou remover funcionalidades. A prioridade máxima é a preservação do produto. O Chatwoot Oficial é apenas a fonte de melhorias, nunca a fonte da verdade.
