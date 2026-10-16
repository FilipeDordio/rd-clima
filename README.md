# RD Clima — Gestão de Instalações AC

Aplicação web progressiva (PWA) que a empresa RD Clima usa para agendar e registar instalações e manutenções de ar condicionado, bombas de calor, solar térmico e hidráulica. O administrador marca os trabalhos no calendário e atribui-os aos técnicos. No telemóvel, os técnicos veem os trabalhos do dia e registam o resultado com foto e notas.

Projeto da Unidade Curricular de Portfólio — Licenciatura em Engenharia Informática, ESTSetúbal / IPS.
Autor: Filipe Dordio (n.º 202200035) · Professor orientador: Prof. Rui César das Neves

📄 [Manual Técnico (PDF)](docs/Manual_Tecnico_RD_Clima.pdf) · 📘 [Manual de Utilizador (PDF)](docs/Manual_Utilizador_RD_Clima.pdf)

## Funcionalidades

| Perfil | O que faz |
| --- | --- |
| **Administrador** | Calendário com indicadores (hoje, semana, atrasados, instalados no mês); criar e editar trabalhos com vários técnicos; clientes e aparelhos instalados; técnicos, férias e ausências; lista de serviços com filtros e exportação CSV; manutenções previstas; trabalhos por remarcar; estatísticas; catálogo de modelos de equipamento |
| **Técnico** | Trabalhos do dia e calendário; marcar como instalado (notas e foto) ou não instalado (motivo); avisar o cliente por WhatsApp ou email; perfil e estatísticas pessoais |
| **Ambos** | Notificações push, instalação no telemóvel, aviso de nova versão |

## Tecnologias

| Camada | Tecnologias |
| --- | --- |
| Frontend | React 19, TypeScript, Vite, React Router, Tailwind CSS 4, date-fns |
| Backend e base de dados | Supabase: PostgreSQL (Row Level Security e triggers), Auth, Storage, Edge Functions (Deno) |
| PWA e notificações | vite-plugin-pwa (service worker Workbox, `injectManifest`), Web Push (VAPID) |
| Testes e qualidade | Vitest, Testing Library, jsdom, ESLint, typescript-eslint |
| Alojamento | Vercel |

## Arquitetura

Não há servidor próprio. O browser descarrega a PWA da Vercel e comunica diretamente com o Supabase através do `supabase-js`. A única lógica no servidor é a Edge Function `send-push`, porque o envio de notificações precisa de chaves que não podem estar no browser.

```text
Vercel (alojamento estático)
   │ HTTPS
   ▼
PWA no browser ──supabase-js──▶ Supabase: Auth · PostgreSQL (RLS, triggers) · Storage
   │
   └──invoke──▶ Edge Function send-push ──Web Push (VAPID)──▶ Serviço Web Push
                                                                   │
PWA (service worker) ◀────────────── notificação ──────────────────┘
```

### Segurança

As permissões são aplicadas no PostgreSQL e não no browser.

- **RLS em todas as tabelas.** A função `is_admin()` verifica o perfil do utilizador. Um técnico só lê e altera os trabalhos a que está atribuído (`job_tecnicos`).
- **Sem escalada de privilégios.** O trigger `profiles_prevent_role_escalation` impede um técnico de se tornar administrador.
- **Contas de técnico criadas pelo admin.** São criadas com um cliente Supabase isolado (`createSignupClient`), sem substituir a sessão do admin.
- **Chaves secretas fora do browser.** A chave `service_role` e a chave VAPID privada existem apenas como secrets da Edge Function.

### Lógica na base de dados

| Trigger | O que faz |
| --- | --- |
| `on_auth_user_created` | Cria o perfil a partir dos metadados do utilizador |
| `jobs_updated_at` | Atualiza `updated_at` |
| `jobs_log_historico` | Regista a criação, as mudanças de estado e as edições em `job_historico`, com o autor |
| `jobs_sync_aparelho` | Ao marcar como instalado, cria o aparelho do cliente; numa manutenção, atualiza a última e a próxima manutenção |

Estados de um trabalho: `agendado` → `instalado` | `nao_instalado` → (remarcar) → `agendado`.

## Modelo de dados

9 tabelas em `public`: `profiles`, `clientes`, `jobs`, `job_tecnicos`, `job_historico`, `aparelhos`, `ausencias`, `push_subscriptions` e `modelos_equipamento`. O Storage tem os buckets `instalacoes` e `avatares`. O detalhe de cada tabela está no [Manual Técnico](docs/Manual_Tecnico_RD_Clima.pdf).

## Estrutura

```text
src/
  pages/         um ecrã por ficheiro (Hoje, calendários, Clientes, Técnicos, Serviços, …)
  components/    JobForm, JobCard, CalendarView, modais, ProximasManutencoes, …
  contexts/      AuthContext (sessão e perfil)
  lib/           Supabase, push, links WhatsApp/email, datas de manutenção
  types/         tipos do domínio
  sw.ts          service worker
supabase/
  schema.sql             esquema base (estado da v8)
  migration_v2…v13.sql   migrações incrementais
  functions/send-push/   Edge Function de notificações
docs/            ficha de validação e manuais (PDF)
```

## Instalação

### Requisitos

- Node.js 22 ou superior
- Uma conta Supabase e o Supabase CLI
- Uma conta Vercel, para publicar

### 1. Base de dados

1. Criar um projeto em [supabase.com](https://supabase.com).
2. No SQL editor, executar `supabase/schema.sql` e depois, por ordem, `migration_v9.sql` a `migration_v13.sql`.
3. Criar o administrador em **Authentication → Users → Add user**, com os metadados:

   ```json
   { "nome": "Nome", "role": "admin" }
   ```

   Os técnicos são criados depois, dentro da app.

### 2. Notificações push

```bash
npx web-push generate-vapid-keys
supabase secrets set VAPID_PUBLIC_KEY=… VAPID_PRIVATE_KEY=… VAPID_SUBJECT=mailto:…
supabase functions deploy send-push
```

### 3. Aplicação

Copiar `.env.example` para `.env` e preencher:

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=…
VITE_VAPID_PUBLIC_KEY=…
```

```bash
npm install
npm run dev        # desenvolvimento
npm run build      # verificação de tipos + build de produção em dist/
npm test           # testes (Vitest)
npm run lint       # ESLint
```

### 4. Publicação

Importar o repositório na Vercel (framework Vite, pasta de saída `dist`) e definir as três variáveis `VITE_*`. O `vercel.json` encaminha todas as rotas para `index.html`.

## Testes

São 56 testes em 10 ficheiros (Vitest + Testing Library, jsdom). Cobrem a lógica de `src/lib` (datas de manutenção, links de WhatsApp e email, envio de push, técnicos, iniciais) e os componentes `CalendarView`, `JobCard`, `JobForm`, `Chip` e `AdminSettings`. O Supabase é substituído por mocks.

## Limitações conhecidas

- A Edge Function `send-push` não valida quem a chama nem os destinatários.
- O estado `cancelado` existe na base de dados, mas nenhum ecrã o usa.
- As migrações são aplicadas à mão no SQL editor, sem CI.
- Não há testes end-to-end nem testes às políticas RLS.
