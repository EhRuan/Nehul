# NEHUL — Museu Digital (guia de configuração)

Site com várias páginas públicas + um painel de administração, usando
**Supabase** como banco de dados, armazenamento de mídia e autenticação.

## Estrutura de arquivos

Todos os arquivos ficam **na mesma pasta** (não use as subpastas `Estilo/`
e `Scripts/` do projeto antigo — os caminhos foram simplificados):

```
index.html        → página inicial (hero + vitrine + sobre + navegação)
andamento.html     → lista projetos com status "andamento"
futuros.html        → lista projetos com status "futuro"
realizados.html     → lista projetos com status "realizado"
memorial.html        → esboço (veja sugestão dentro da própria página)
admin.html            → painel restrito: criar / editar / excluir / organizar
styles.css
config.js          → suas chaves do Supabase (edite este arquivo)
supabase-client.js
projects.js         → busca/renderização usada pelas páginas públicas
home.js               → vitrine dinâmica (só usado no index)
admin.js                → toda a lógica do painel administrativo
ui.js                     → menu mobile e estado ativo do menu
```

> `sobre.html` foi removido — o conteúdo já existe dentro do `index.html`
> (seção `#sobre`). O link "Sobre" do menu agora aponta para
> `index.html#sobre`.

---

## 1. Criar o projeto no Supabase

Crie uma conta grátis em https://supabase.com → **New project**. Anote a
senha do banco e espere provisionar (~2 min).

## 2. Criar a tabela `projects`

**SQL Editor** → **New query** → cole e rode:

```sql
create table projects (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  status text not null
    check (status in ('futuro','andamento','realizado')),
  ordem integer not null default 0,
  image_urls text[] default '{}',
  video_urls text[] default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table projects enable row level security;

create policy "leitura publica"
  on projects for select
  using (true);

create policy "insercao autenticada"
  on projects for insert
  with check (auth.role() = 'authenticated');

create policy "atualizacao autenticada"
  on projects for update
  using (auth.role() = 'authenticated');

create policy "exclusao autenticada"
  on projects for delete
  using (auth.role() = 'authenticated');
```

A coluna `ordem` é o que permite organizar manualmente os projetos dentro de
cada status no painel admin (setas ▲▼). `video_urls` guarda até 5 links
(YouTube/Vimeo) ou vídeos enviados por upload, por projeto.

> **Já criou a tabela antes, com a coluna antiga `video_url` (singular)?**
> Rode esta migração no SQL Editor em vez de criar a tabela de novo:
> ```sql
> alter table projects add column video_urls text[] default '{}';
> update projects
>   set video_urls = case when video_url is not null then array[video_url] else '{}' end;
> alter table projects drop column video_url;
> ```

## 3. Criar os buckets de mídia

**Storage** → **Create bucket**:
1. `project-images` → marque **Public bucket**
2. `project-videos` → marque **Public bucket**

Em cada bucket, aba **Policies**, adicione (via SQL Editor):

```sql
create policy "leitura publica imagens"
  on storage.objects for select
  using (bucket_id = 'project-images');

create policy "upload autenticado imagens"
  on storage.objects for insert
  with check (bucket_id = 'project-images' and auth.role() = 'authenticated');

create policy "leitura publica videos"
  on storage.objects for select
  using (bucket_id = 'project-videos');

create policy "upload autenticado videos"
  on storage.objects for insert
  with check (bucket_id = 'project-videos' and auth.role() = 'authenticated');
```

> **Vídeos longos/pesados:** prefira colar link do YouTube (não listado) ou
> Vimeo no formulário — o site já incorpora o player automaticamente. Use o
> upload direto só para clipes curtos, pelos limites do plano gratuito.

## 4. Criar seu usuário administrador

**Authentication → Users → Add user → Create new user.** Cadastre e-mail e
senha — é com eles que você entra em `admin.html`.

Depois vá em **Authentication → Providers → Email** e **desative "Confirm
email"** — assim você consegue logar imediatamente, sem precisar confirmar
por link enviado por e-mail.

Se algum usuário ficar como "Waiting for verification", rode:
```sql
update auth.users set email_confirmed_at = now() where email = 'seu-email@exemplo.com';
```

## 5. Colar as chaves de API

**Project Settings → API** → copie **Project URL** e **anon public key** e
cole em `config.js`:

```js
const SUPABASE_URL = "https://xxxxxxxx.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJI...";
```

## 6. Testar localmente

Abra `index.html` direto no navegador, ou rode um servidor simples:
```bash
python3 -m http.server 8080
```
e acesse `http://localhost:8080`.

## 7. Publicar online

**Netlify Drop**: acesse https://app.netlify.com/drop e arraste a pasta
inteira (todos os arquivos, sem subpastas). Você recebe uma URL pública em
segundos. Alternativas: Vercel ou GitHub Pages.

---

## Como usar

- **Visitantes**: veem `index.html`, `andamento.html`, `futuros.html`,
  `realizados.html` e `memorial.html` normalmente — sem login.
- **Você (administrador)**: acessa `admin.html` (tem um link discreto no
  rodapé do site, "Área do administrador"), faz login, e pode:
  - Criar projetos, escolhendo o status (isso já define em qual página ele
    aparece)
  - Editar título, descrição, status, imagens e vídeo
  - Reordenar com as setas ▲▼ (a ordem é por status)
  - Excluir
- **Vitrine da home**: puxa uma amostra aleatória de até 30 projetos
  recentes (de qualquer status) e mostra **um projeto por vez**; os botões
  ← → avançam/voltam exatamente um projeto, com contador "X de N". Clicar no
  card leva para a página do status correspondente.
- **Mídia de cada projeto**: imagens e vídeos aparecem juntos num mesmo
  carrossel, dentro do card. Se o projeto tiver mais de uma imagem/vídeo,
  aparecem setinhas próprias (‹ ›) só naquele card para passar item por
  item, com contador "1/3" no canto. Isso vale tanto nas páginas de
  listagem quanto na vitrine da home.
- **Vídeos**: cada projeto suporta até **5 vídeos**, misturando links
  (YouTube/Vimeo) e arquivos enviados. Antes só existia 1 vídeo por projeto
  e ele só aparecia quando não havia nenhuma imagem cadastrada — isso foi
  corrigido: agora vídeos sempre aparecem no carrossel, junto das imagens.

## Sobre a página `admin.html` ser acessível por URL

Isso é esperado em qualquer site estático — não tem como impedir alguém de
digitar `seusite.com/admin.html` diretamente, mesmo sem link visível. A
proteção real não está em esconder a página: está nas políticas de RLS que
você criou no passo 2 e 3, que recusam qualquer inserção/edição/exclusão
sem login válido. Ver a tela de login não expõe nem altera nenhum dado.

Se ainda assim quiser dificultar a descoberta casual da página (não é
proteção real, é só reduzir visibilidade):
- Renomear `admin.html` para um nome não-óbvio (ex: `painel-x7k2.html`) e
  atualizar os links do rodapé de acordo
- Adicionar proteção por senha no próprio provedor de hospedagem (recurso
  pago na maioria dos serviços, ex: Netlify "Password Protection")

## Sobre o Memorial

A página `memorial.html` mostra uma **linha do tempo cronológica dos
projetos com status "realizado"** — reaproveita a mesma tabela `projects`,
sem precisar de tabela nova. Cada marco mostra o ano, a mídia, o título e a
descrição do projeto, em ordem do mais antigo para o mais recente.

## Próximos passos possíveis

- Carrossel de múltiplas imagens dentro do card (hoje mostra só a primeira)
- Busca/filtro por palavra-chave nas páginas de listagem
- Agrupar a linha do tempo do Memorial por ano (cabeçalhos "2023", "2024"...)
- Exclusão automática dos arquivos de mídia no Storage ao excluir um projeto
