create table if not exists projects (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  writing_date date not null,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  content      jsonb
);

-- auto-update updated_at on row change
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger projects_updated_at
  before update on projects
  for each row execute function update_updated_at();
