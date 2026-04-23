-- ─── Drop existing tables (clean slate) ──────────────────────────────────────

drop table if exists share_links cascade;
drop table if exists jotting_versions cascade;
drop table if exists jottings cascade;
drop table if exists diagrams cascade;
drop table if exists characters cascade;
drop table if exists document_versions cascade;
drop table if exists documents cascade;
drop table if exists projects cascade;
drop table if exists users cascade;

-- ─── Tables ───────────────────────────────────────────────────────────────────

create table if not exists users (
  id         uuid references auth.users on delete cascade primary key,
  email      text not null,
  name       text,
  pen_name   text,
  created_at timestamptz default now()
);

create table if not exists projects (
  id         uuid default gen_random_uuid() primary key,
  user_id    uuid references users(id) on delete cascade not null,
  title      text not null,
  author     text,
  started_at date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists documents (
  id         uuid default gen_random_uuid() primary key,
  project_id uuid references projects(id) on delete cascade not null,
  type       text check (type in ('intention', 'synopsis', 'scenario')) not null,
  content    text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  unique (project_id, type)
);

create table if not exists document_versions (
  id          uuid default gen_random_uuid() primary key,
  document_id uuid references documents(id) on delete cascade not null,
  content     text not null,
  created_at  timestamptz default now()
);

create table if not exists characters (
  id          uuid default gen_random_uuid() primary key,
  project_id  uuid references projects(id) on delete cascade not null,
  name        text not null,
  gender      text,
  age         integer,
  job         text,
  summary     text,
  description text,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

create table if not exists diagrams (
  id         uuid default gen_random_uuid() primary key,
  project_id uuid references projects(id) on delete cascade not null unique,
  nodes      jsonb default '[]',
  edges      jsonb default '[]',
  updated_at timestamptz default now()
);

create table if not exists jottings (
  id         uuid default gen_random_uuid() primary key,
  user_id    uuid references users(id) on delete cascade not null,
  title      text default '제목 없음',
  content    text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists jotting_versions (
  id         uuid default gen_random_uuid() primary key,
  jotting_id uuid references jottings(id) on delete cascade not null,
  content    text not null,
  created_at timestamptz default now()
);

create table if not exists share_links (
  id           uuid default gen_random_uuid() primary key,
  content_type text check (content_type in ('document', 'jotting')) not null,
  content_id   uuid not null,
  token        text unique not null,
  expires_at   timestamptz not null,
  is_active    boolean default true,
  created_at   timestamptz default now()
);

-- ─── updated_at trigger ───────────────────────────────────────────────────────

create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace trigger projects_updated_at
  before update on projects
  for each row execute function update_updated_at();

create or replace trigger documents_updated_at
  before update on documents
  for each row execute function update_updated_at();

create or replace trigger characters_updated_at
  before update on characters
  for each row execute function update_updated_at();

create or replace trigger diagrams_updated_at
  before update on diagrams
  for each row execute function update_updated_at();

create or replace trigger jottings_updated_at
  before update on jottings
  for each row execute function update_updated_at();

-- ─── RLS ──────────────────────────────────────────────────────────────────────

alter table users enable row level security;
alter table projects enable row level security;
alter table documents enable row level security;
alter table document_versions enable row level security;
alter table characters enable row level security;
alter table diagrams enable row level security;
alter table jottings enable row level security;
alter table jotting_versions enable row level security;
alter table share_links enable row level security;

-- users: 본인 데이터만
create policy "users_self" on users
  for all using (auth.uid() = id);

-- projects: 본인 데이터만
create policy "projects_owner" on projects
  for all using (auth.uid() = user_id);

-- documents: 프로젝트 소유자만
create policy "documents_owner" on documents
  for all using (
    exists (
      select 1 from projects where id = documents.project_id and user_id = auth.uid()
    )
  );

-- document_versions: 문서 소유자만
create policy "document_versions_owner" on document_versions
  for all using (
    exists (
      select 1 from documents d
      join projects p on p.id = d.project_id
      where d.id = document_versions.document_id and p.user_id = auth.uid()
    )
  );

-- characters: 프로젝트 소유자만
create policy "characters_owner" on characters
  for all using (
    exists (
      select 1 from projects where id = characters.project_id and user_id = auth.uid()
    )
  );

-- diagrams: 프로젝트 소유자만
create policy "diagrams_owner" on diagrams
  for all using (
    exists (
      select 1 from projects where id = diagrams.project_id and user_id = auth.uid()
    )
  );

-- jottings: 본인 데이터만
create policy "jottings_owner" on jottings
  for all using (auth.uid() = user_id);

-- jotting_versions: 끄적 소유자만
create policy "jotting_versions_owner" on jotting_versions
  for all using (
    exists (
      select 1 from jottings where id = jotting_versions.jotting_id and user_id = auth.uid()
    )
  );

-- share_links: 토큰으로 조회 공개 / 수정·삭제는 소유자만
-- (share_links에는 user_id가 없으므로 content_id로 소유권 확인)
create policy "share_links_read" on share_links
  for select using (is_active = true);

create policy "share_links_write" on share_links
  for insert with check (true);

create policy "share_links_manage" on share_links
  for update using (true);

create policy "share_links_delete" on share_links
  for delete using (true);
