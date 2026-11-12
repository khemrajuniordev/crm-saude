-- ============================================================
-- Sistema Central DPS — schema Supabase
-- Execute no SQL Editor do Supabase (uma vez)
-- ============================================================

-- 1. Perfis dos usuários DPS (admin | operador | medica)
create table if not exists dps_perfis (
  id   uuid references auth.users on delete cascade primary key,
  nome text not null,
  papel text not null check (papel in ('admin', 'operador', 'medica')),
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);
alter table dps_perfis enable row level security;
create policy "dps_perfis_leitura" on dps_perfis for select using (auth.uid() is not null);
create policy "dps_perfis_insercao" on dps_perfis for insert with check (auth.uid() is not null);
create policy "dps_perfis_atualizacao" on dps_perfis for update using (auth.uid() is not null);
create policy "dps_perfis_exclusao" on dps_perfis for delete using (auth.uid() is not null);

-- 2. Solicitações DPS
create table if not exists dps_solicitacoes (
  id                  uuid primary key default gen_random_uuid(),
  protocolo           text unique not null,

  -- Titular (mãe/responsável)
  nome_titular        text not null,
  cpf_titular         text,
  telefone_titular    text,

  -- Criança/dependente
  nome_crianca        text not null,
  data_nascimento     date,
  cpf_crianca         text,

  -- Contrato
  tipo_plano          text not null default '',
  vigencia            date,

  -- Consulta
  data_consulta       timestamptz,
  medica_id           uuid references dps_perfis(id) on delete set null,
  medica_nome         text,

  -- Resultado
  status              text not null default 'cadastro'
                        check (status in ('cadastro','agendado','avaliacao','aprovado','reprovado')),
  observacao          text,
  motivo_reprovacao   text,

  -- Auditoria
  created_by          uuid references auth.users on delete set null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
alter table dps_solicitacoes enable row level security;
create policy "dps_sol_leitura"    on dps_solicitacoes for select using (auth.uid() is not null);
create policy "dps_sol_insercao"   on dps_solicitacoes for insert with check (auth.uid() is not null);
create policy "dps_sol_atualizacao" on dps_solicitacoes for update using (auth.uid() is not null);
create policy "dps_sol_exclusao"   on dps_solicitacoes for delete using (auth.uid() is not null);

-- Auto-updated_at
create or replace function dps_set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists dps_sol_updated_at on dps_solicitacoes;
create trigger dps_sol_updated_at
  before update on dps_solicitacoes
  for each row execute procedure dps_set_updated_at();

-- Protocolo automático: DPS-YYYYMMDD-NNNNNN
create or replace function dps_gerar_protocolo()
returns trigger language plpgsql as $$
declare seq int;
begin
  select count(*) + 1 into seq from dps_solicitacoes
    where date_trunc('day', created_at) = date_trunc('day', now());
  new.protocolo := 'DPS-' || to_char(now(), 'YYYYMMDD') || '-' || lpad(seq::text, 6, '0');
  return new;
end; $$;

drop trigger if exists dps_protocolo_trigger on dps_solicitacoes;
create trigger dps_protocolo_trigger
  before insert on dps_solicitacoes
  for each row when (new.protocolo = '' or new.protocolo is null)
  execute procedure dps_gerar_protocolo();

-- Função para buscar papel do usuário atual
create or replace function dps_papel()
returns text language sql stable security definer as $$
  select papel from dps_perfis where id = auth.uid() and ativo = true limit 1;
$$;

-- View: agenda das médicas (para checar conflito de horário)
create or replace view dps_agenda as
  select
    medica_id,
    medica_nome,
    data_consulta,
    protocolo,
    nome_crianca,
    nome_titular,
    status
  from dps_solicitacoes
  where medica_id is not null
    and data_consulta is not null
    and status not in ('reprovado');
