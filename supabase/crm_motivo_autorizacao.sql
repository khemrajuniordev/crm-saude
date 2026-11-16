-- ============================================================
-- Controle de CRM — motivo da autorização (reautorização).
-- Rode UMA vez no SQL Editor do Supabase.
--
-- Quando a enfermagem reautoriza uma solicitação que havia sido
-- NÃO autorizada (recusada), passa a registrar o motivo da mudança.
-- O campo explica por que a decisão anterior foi revertida e fica
-- no histórico (trilha de auditoria).
-- ============================================================

alter table public.crm_solicitacoes
  add column if not exists motivo_autorizacao text;

-- 1) Trava de edição por papel: `motivo_autorizacao` é campo da
--    enfermagem (como autorizacao / data_autorizacao / motivo_recusa).
create or replace function public.crm_validar_edicao()
returns trigger language plpgsql as $$
declare
  p text := public.crm_papel();
  mudou_atendimento boolean;
  mudou_enfermagem boolean;
  mudou_financeiro boolean;
begin
  if p = 'admin' then
    return new; -- admin edita tudo
  end if;

  mudou_atendimento :=
       new.abertura         is distinct from old.abertura
    or new.termino          is distinct from old.termino
    or new.solicitante      is distinct from old.solicitante
    or new.data_consulta    is distinct from old.data_consulta
    or new.beneficiario     is distinct from old.beneficiario
    or new.procedimento     is distinct from old.procedimento
    or new.clinica_hospital is distinct from old.clinica_hospital
    or new.valor_solicitado is distinct from old.valor_solicitado
    or new.forma_pagamento  is distinct from old.forma_pagamento
    or new.dados_bancarios  is distinct from old.dados_bancarios
    or new.tipo             is distinct from old.tipo;

  mudou_enfermagem :=
       new.autorizacao        is distinct from old.autorizacao
    or new.data_autorizacao   is distinct from old.data_autorizacao
    or new.motivo_recusa      is distinct from old.motivo_recusa
    or new.motivo_autorizacao is distinct from old.motivo_autorizacao;

  mudou_financeiro :=
       new.data_prevista_pagamento is distinct from old.data_prevista_pagamento
    or new.status_financeiro       is distinct from old.status_financeiro
    or new.data_pagamento          is distinct from old.data_pagamento;

  if mudou_atendimento and p <> 'atendimento' then
    raise exception 'Somente o atendimento pode alterar os dados de abertura.';
  end if;
  if mudou_enfermagem and p <> 'enfermagem' then
    raise exception 'Somente a enfermagem pode alterar a autorização.';
  end if;
  if mudou_financeiro and p <> 'financeiro' then
    raise exception 'Somente o financeiro pode alterar o pagamento.';
  end if;

  return new;
end $$;

-- 2) Histórico: registra o motivo como detalhe do evento `autorizada`
--    (só quando há motivo informado — p.ex. numa reautorização).
create or replace function public.crm_log_solicitacao()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_nome text := (select nome from public.crm_perfis where user_id = auth.uid());
begin
  if tg_op = 'INSERT' then
    insert into public.crm_historico (solicitacao_id, evento, user_id, user_nome)
    values (new.id, 'criada', v_uid, v_nome);
    return new;
  end if;

  -- autorização
  if new.autorizacao is distinct from old.autorizacao then
    if new.autorizacao = 'sim' then
      insert into public.crm_historico (solicitacao_id, evento, detalhe, user_id, user_nome)
      values (new.id, 'autorizada',
              case
                when old.autorizacao = 'nao' and coalesce(new.motivo_autorizacao, '') <> ''
                  then 'Reautorizada — ' || new.motivo_autorizacao
                when coalesce(new.motivo_autorizacao, '') <> ''
                  then new.motivo_autorizacao
                else null
              end,
              v_uid, v_nome);
    elsif new.autorizacao = 'nao' then
      insert into public.crm_historico (solicitacao_id, evento, detalhe, user_id, user_nome)
      values (new.id, 'recusada', new.motivo_recusa, v_uid, v_nome);
    end if;
  end if;

  -- financeiro
  if new.status_financeiro is distinct from old.status_financeiro then
    if new.status_financeiro = 'Agendado' then
      insert into public.crm_historico (solicitacao_id, evento, detalhe, user_id, user_nome)
      values (new.id, 'agendada',
              'Prev.: ' || coalesce(to_char(new.data_prevista_pagamento, 'DD/MM/YYYY'), '—'),
              v_uid, v_nome);
    elsif new.status_financeiro = 'Pago' then
      insert into public.crm_historico (solicitacao_id, evento, detalhe, user_id, user_nome)
      values (new.id, 'paga',
              'Pago em ' || coalesce(to_char(new.data_pagamento, 'DD/MM/YYYY'), to_char(current_date, 'DD/MM/YYYY')),
              v_uid, v_nome);
    end if;
  end if;

  return new;
end $$;
