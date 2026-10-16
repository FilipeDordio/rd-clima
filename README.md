# Gestão de Instalações AC

App interna (PWA) para gerir o agendamento e registo de instalações de ar
condicionado. Permite ao admin (patrão) agendar trabalhos no calendário
(cliente, localização, tipo de AC, técnico) e aos técnicos verem os trabalhos
do dia e marcá-los como instalados, com foto e notas.

## Stack

- React + Vite + TypeScript
- TailwindCSS v4
- React Router
- Supabase (Postgres + Auth + Storage)
- PWA (vite-plugin-pwa)

## Configuração do Supabase

1. Cria um projeto em [supabase.com](https://supabase.com).
2. No **SQL editor**, executa o conteúdo de `supabase/schema.sql` — isto cria
   as tabelas `profiles` e `jobs`, as policies de segurança (RLS) e o bucket
   de storage `instalacoes` para as fotos.
3. Em **Project Settings → API**, copia o `Project URL` e a `anon public key`.
4. Cria utilizadores em **Authentication → Users → Add user**:
   - Para o **admin**, adiciona o seguinte em "User Metadata" (JSON):

     ```json
     { "nome": "Nome do Patrão", "role": "admin" }
     ```

   - Para cada **técnico**:

     ```json
     { "nome": "Nome do Técnico", "role": "tecnico" }
     ```

   - O trigger `on_auth_user_created` cria automaticamente o perfil
     correspondente na tabela `profiles`.

## Desenvolvimento local

1. Copia `.env.example` para `.env` e preenche com os valores do Supabase:

   ```env
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=xxxx
   ```

2. Instala as dependências e arranca o servidor de desenvolvimento:

   ```bash
   npm install
   npm run dev
   ```

## Build de produção

```bash
npm run build
```

Os ficheiros gerados em `dist/` podem ser servidos por qualquer hosting
estático (Vercel, Netlify, etc). Como é uma PWA, pode ser "instalada" no
telemóvel a partir do browser (Adicionar ao ecrã principal).

## Fluxo da app

- **Admin**: vê um calendário mensal, clica num dia para ver/criar/editar
  trabalhos (cliente, localização, tipo de AC, quantidade, técnico
  responsável).
- **Técnico**: vê os trabalhos atribuídos para o dia selecionado e pode
  marcá-los como instalados, adicionando notas e uma foto da instalação.
