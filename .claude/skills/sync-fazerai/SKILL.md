---
name: sync-fazerai
description: Use esta skill para atualizar o fork Indica Fácil a partir de uma release da fazer.ai (arquivo .zip do fork deles, free ou pro). Cobre o processo completo e testado - espelhar o conteúdo preservando o .git, rodar o script de white-label, restaurar arquivos protegidos, corrigir as marcas que o script cego erra, validar por feature, versionar e publicar a release. NÃO é para o Chatwoot oficial (use sync-oficial) nem para git merge com upstream (use sync-fork). Dispare quando o usuário disser que saiu uma versão nova da fazer.ai, apontar um zip chatwoot-X.Y.Z-fazer-ai.NN.zip, ou pedir para atualizar a base do fork.
allowed-tools: Bash, PowerShell, Read, Edit, Write, Grep, Glob
---

# Sync fazer.ai → Indica Fácil (via zip de release)

> **Qual skill usar**
> - Veio um **zip da fazer.ai** → esta skill.
> - Veio do **Chatwoot oficial** (chatwoot/chatwoot) → `sync-oficial`.
> - **git merge** com remote upstream → `sync-fork` (herdada da fazer.ai; não é o fluxo normal aqui).

A fazer.ai já resolve os conflitos entre o Chatwoot oficial e as features do fork (Baileys, Z-API, Chat Interno, Kanban, mensagens agendadas). Partir da release deles é o caminho mais seguro: o trabalho aqui é **white-label + preservar o que é nosso**, não merge de código.

## Onde ficam as coisas

| O quê | Caminho |
|---|---|
| Repo de trabalho | `D:\dev2026\chatwoot-free-indicafacil-source` |
| Zips de release | `D:\dev2026\chatwoot-free-releases\` e `D:\dev2026\chatwoot-free-indicafacil-source-oficial\` |
| Origin | `github.com/nicolasdasilvaesilva/chatwoot` (público) |

## Fase 0 — Backup

```bash
cd D:/dev2026/chatwoot-free-indicafacil-source
git status --short              # nada importante solto?
git tag backup-pre-upgrade-X.Y.Z
```

Copiar para uma pasta temporária os **arquivos protegidos** (lista na Fase 2). Extrair o zip da fazer.ai.

## Fase 1 — Espelhar o conteúdo e aplicar white-label

Espelhar o conteúdo do zip por cima do repo **preservando `.git`**. No Windows, `robocopy /MIR /XD ".git"` funciona (código de saída 1 ou 3 é sucesso; só ≥8 é erro).

Depois rodar o script de white-label em `.rb .vue .js .ts .yml .json .md .erb .rake`, com este dicionário **na ordem** (mais específico primeiro, senão `fazer-ai` come `fazer-ai/chatwoot`):

| De | Para |
|---|---|
| `fazer-ai/chatwoot-pro` | `nicolasdasilvaesilva/chatwoot-pro` |
| `fazer-ai/chatwoot` | `nicolasdasilvaesilva/chatwoot` |
| `Chatwoot fazer.ai` | `Chatwoot Indica Fácil` |
| `Fazer AI` | `Indica Fácil` |
| `FazerAi` | `IndicaFacil` |
| `fazer.ai` | `indicafacil.app` |
| `fazer_ai` | `indica_facil` |
| `fazerai` | `indicafacil` |
| `fazer-ai` | `indica-facil` |
| `FAZER_AI_GUIDES_URL` | `INDICA_FACIL_GUIDES_URL` |

Renomear no disco: `lib/middleware/fazer_ai_platform_header.rb` → `indica_facil_platform_header.rb` (a classe já vira `IndicaFacilPlatformHeader` pelo dicionário, e `config/application.rb` já aponta certo).

> Rodar o script com `sys.stdout.reconfigure(encoding='utf-8')` — sem isso o print de `→` estoura em `cp1252` no Windows.

## Fase 2 — Restaurar arquivos protegidos

Sobrescrever com as cópias do backup:

| Arquivo | Por quê |
|---|---|
| `.github/` | nossos workflows (docker multi-arch, ci-lint, ci-spec, ci-fork-features) |
| `.claude/` | estas skills |
| `.gitattributes` | força LF em `*.sh` e `bin/*` |
| `docker-compose.coolify.yaml` | env do Baileys, branding, imagem ghcr própria |
| `CUSTOM_BRANDING.md` | documentação de branding |
| `app/javascript/dashboard/components/app/versionCheckHelper.js` | nossa comparação de versão — a da fazer.ai não entende o sufixo `-indica-facil.NN` (ver Armadilhas) |

E atualizar a versão em **`VERSION_CW`** e **`config/app.yml`** (têm de bater — o CI verifica).

## Fase 3 — Corrigir a marca que o script cego erra (CRÍTICO)

O find-replace acerta o texto mas erra o **destino** de vários links. Estas 5 correções foram necessárias na 4.16.1 e tendem a repetir:

| Arquivo | O script deixa | Corrigir para |
|---|---|---|
| `app/views/super_admin/devise/sessions/new.html.erb` | `SuperAdmin \| indicafacil.app` | `SuperAdmin \| Indica Fácil` |
| `components-next/sidebar/SidebarProfileMenu.vue` | `indicafacil.app/chatwoot-release-notes` | `licencas.indicafacil.app/chatwoot-release-notes` |
| `components/app/UpdateBanner.vue` | `indicafacil.app/chatwoot-release-notes` | `licencas.indicafacil.app/chatwoot-release-notes` |
| `v3/views/login/Index.vue` | `indicafacil.app` | `licencas.indicafacil.app` + texto `Indica Fácil Tecnologia e Serviços Digitais` |
| `settings/account/components/BuildInfo.vue` | idem | idem |

Também **manualmente** (o script não alcança):

- `settings/inbox/components/WhatsappLinkDeviceModal.vue` — a URL da extensão tem ID fixo da Chrome Web Store. Deve ser `https://chromewebstore.google.com/detail/indicafacilapp-whatsapp-connector-for-chatwoot/lnkmkgmicadcmbocnbogggkemjihjjcm` (nunca o `nchdjpj...` da fazer.ai).
- `internalChat/ProFeatureNudge.vue` e `kanban/Index.vue` — `upgradeUrl` deve ser `https://licencas.indicafacil.app/kanban`.
- `app/views/super_admin/application/_navigation.html.erb` — remover a string `Chatwoot` hardcoded, deixando só `<%= Chatwoot.config[:version] %>`.

> **Como conferir sem depender de memória:** comparar com a tag do release anterior.
> `git show <tag-anterior>:<arquivo> | grep -n "indicafacil"` e ver se bate.

## Fase 4 — Enquetes liberadas no Free (decisão do produto)

O fork da fazer.ai trava enquetes do Chat Interno no Pro. A Indica Fácil libera no Free. Após o white-label, reaplicar nos **dois lados**:

- `app/models/internal_chat/limits.rb` → `polls_enabled?` retorna `true`
- `app/javascript/dashboard/composables/useInternalChatPro.js` → `pollsEnabled: computed(() => true)`
- specs: `spec/models/internal_chat/limits_spec.rb` e `spec/controllers/api/v1/accounts/internal_chat/polls_controller_spec.rb`

Só o frontend não basta: `polls_controller.rb` devolve HTTP 402 e o usuário toma erro ao enviar.

## Fase 5 — Validar por FEATURE (obrigatório)

Build verde não prova nada aqui. Rodar:

```bash
grep -ic 'baileys\|zapi' app/javascript/dashboard/routes/dashboard/settings/inbox/channels/Whatsapp.vue  # >= 20
grep -c 'internal_chat' config/routes.rb                                                                  # >= 1
grep -c 'kanban\|internalChat' app/javascript/dashboard/routes/dashboard/dashboard.routes.js              # >= 4
grep -c 'internalChat' app/javascript/dashboard/store/index.js                                            # >= 4
ls app/models/internal_chat/ | wc -l                                                                      # 12
ls app/services/whatsapp/baileys_handlers/ | wc -l                                                        # 11
ls app/services/whatsapp/zapi_handlers/ | wc -l                                                           # 6
grep -rl 'fazer\.ai\|fazer-ai\|fazer_ai' --include='*.rb' --include='*.vue' --include='*.js' app/ config/ lib/ | wc -l  # 0
npx vitest run app/javascript/dashboard/components/app/specs/versionCheckHelper.spec.js                    # 9 passando
```

O workflow `ci-fork-features` faz isso automaticamente em ~13s — mas rodar local antes do push evita ida e volta.

**Auditoria completa** (recomendada): comparar cada arquivo do zip da fazer.ai com o nosso e listar ausências. Esperado: **0 ausentes**; as diferenças legítimas são só white-label, versão e a liberação das enquetes.

## Fase 6 — Build e testes

`bundle`, `rspec` e `rubocop` **não rodam no Windows** (não há Ruby). Não tente. O caminho é o CI:

```bash
git push origin main    # dispara ci-lint, ci-spec, ci-fork-features e docker-build
```

Localmente dá para rodar `pnpm install --frozen-lockfile` e `npx eslint <arquivos>`.

> Se `package.json` mudou de dependências, rodar `pnpm install --lockfile-only` — lockfile dessincronizado quebra o build Docker em `--frozen-lockfile`.

## Fase 7 — Commit, tag e release

O hook de pre-commit roda `bundle exec rubocop` e falha com exit 127 (sem Ruby no Windows). Peça autorização ao usuário para `--no-verify`; o rubocop roda no CI.

```bash
git commit --no-verify -F mensagem.txt
git tag -a vX.Y.Z-indica-facil.NN -m "vX.Y.Z-indica-facil.NN"
git push origin main
git push origin vX.Y.Z-indica-facil.NN
gh release create vX.Y.Z-indica-facil.NN --title "..." -F release_notes.md
gh release edit vX.Y.Z-indica-facil.NN --draft=false --latest   # OBRIGATÓRIO
```

> O sufixo `.NN` é **global**: não reseta ao mudar a versão upstream (…4.15.1-`.02` → 4.16.1-`.03`).
>
> Sem `--draft=false --latest` a tag não é criada no GitHub e a API `/releases/latest` ignora a release — o banner de aviso de atualização dos clientes fica mudo. Conferir depois:
> `curl -s https://api.github.com/repos/nicolasdasilvaesilva/chatwoot/releases/latest`

Para as notas, use a skill `release-notes` (blocos bilíngues pt-BR + en para usuário final).

## Armadilhas já pagas

- **Copiar arquivo do oficial por cima do nosso** apaga features inteiras. Nesta skill não acontece porque a fazer.ai já traz tudo — mas se for misturar patch do oficial, use `sync-oficial`.
- **Lixo na raiz**: `logs.zip`, `fix_ruby_files.py`, `action_log.txt` e afins ficam untracked. Não commitar.
- **Permissão de execução**: arquivos copiados no Windows perdem o `+x`. O rubocop acusa (`Lint/ScriptPermission`). Corrigir com `git update-index --chmod=+x <arquivo>`.
- **Exit code engana**: `robocopy` retorna 1/3 em sucesso; um `pnpm run build` inexistente retorna 0 com erro no stdout. Sempre ler a saída, não só o código.
- **A comparação de versão do banner** (descoberto em 2026-07-27, quebrado desde a `.01`). O espelhamento traz o `versionCheckHelper.js` da fazer.ai, que faz `if (!semver.valid(latest)) return false`. Nossa versão `4.16.2-indica-facil.07` **não é semver válido** — zero à esquerda em identificador numérico de pré-lançamento é proibido pela especificação. Resultado: o banner de nova versão nunca aparece, sem erro nem log. Restaurar sempre a nossa versão do helper, e conferir que o `BuildInfo.vue` **usa o helper** em vez de repetir a comparação em linha (o upstream repete). Nunca passar a versão inteira para `semver.lt`: com versão inválida ele **lança exceção**, não devolve `false`, e isso quebra a renderização do painel.
