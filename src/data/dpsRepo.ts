/**
 * Persistência do Central DPS no Supabase.
 * Tabela: dps_solicitacoes, dps_perfis (ver supabase/dps_schema.sql).
 */
import { supabase as _supabase } from '../lib/supabase'

function sb() {
  if (!_supabase) throw new Error('Supabase não configurado')
  return _supabase
}
import type { PapelDPS, SolicitacaoDPS, StatusDPS } from './dps'

type LinhaDPS = {
  id: string
  protocolo: string
  nome_titular: string
  cpf_titular: string | null
  telefone_titular: string | null
  nome_crianca: string
  data_nascimento: string | null
  cpf_crianca: string | null
  tipo_plano: string
  vigencia: string | null
  data_consulta: string | null
  medica_id: string | null
  medica_nome: string | null
  status: StatusDPS
  observacao: string | null
  motivo_reprovacao: string | null
  created_by: string | null
  created_at: string
  updated_at: string
}

function daLinha(l: LinhaDPS): SolicitacaoDPS {
  return {
    id: l.id,
    protocolo: l.protocolo,
    nomeTitular: (l.nome_titular || '').toUpperCase(),
    cpfTitular: l.cpf_titular ?? '',
    telefoneTitular: l.telefone_titular ?? '',
    nomeCrianca: (l.nome_crianca || '').toUpperCase(),
    dataNascimento: l.data_nascimento,
    cpfCrianca: l.cpf_crianca ?? '',
    tipoPlano: l.tipo_plano,
    vigencia: l.vigencia,
    dataConsulta: l.data_consulta,
    medicaId: l.medica_id,
    medicaNome: (l.medica_nome ?? '').toUpperCase(),
    status: l.status,
    observacao: l.observacao ?? '',
    motivoReprovacao: l.motivo_reprovacao ?? '',
    criadoPor: l.created_by,
    criadoEm: l.created_at.slice(0, 10),
    atualizadoEm: l.updated_at.slice(0, 10),
  }
}

export async function listarSolicitacoesDPS(): Promise<SolicitacaoDPS[]> {
  const { data, error } = await sb()
    .from('dps_solicitacoes')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data as LinhaDPS[]).map(daLinha)
}

export async function listarSolicitacoesMinhaAgendaDPS(medicaId: string): Promise<SolicitacaoDPS[]> {
  const { data, error } = await sb()
    .from('dps_solicitacoes')
    .select('*')
    .eq('medica_id', medicaId)
    .order('data_consulta', { ascending: true })
  if (error) throw error
  return (data as LinhaDPS[]).map(daLinha)
}

export type NovaSolicitacaoDPS = Omit<SolicitacaoDPS,
  'id' | 'protocolo' | 'criadoEm' | 'atualizadoEm' | 'criadoPor'>

export async function criarSolicitacaoDPS(s: NovaSolicitacaoDPS): Promise<SolicitacaoDPS> {
  const { data: { user } } = await sb().auth.getUser()
  const { data, error } = await sb()
    .from('dps_solicitacoes')
    .insert({
      protocolo: '',
      nome_titular: s.nomeTitular.toUpperCase(),
      cpf_titular: s.cpfTitular || null,
      telefone_titular: s.telefoneTitular || null,
      nome_crianca: s.nomeCrianca.toUpperCase(),
      data_nascimento: s.dataNascimento || null,
      cpf_crianca: s.cpfCrianca || null,
      tipo_plano: s.tipoPlano,
      vigencia: s.vigencia || null,
      data_consulta: s.dataConsulta || null,
      medica_id: s.medicaId || null,
      medica_nome: s.medicaNome.toUpperCase() || null,
      status: s.status,
      observacao: s.observacao || null,
      motivo_reprovacao: s.motivoReprovacao || null,
      created_by: user?.id ?? null,
    })
    .select()
    .single()
  if (error) throw error
  return daLinha(data as LinhaDPS)
}

export type PatchDPS = Partial<{
  nomeTitular: string
  cpfTitular: string
  telefoneTitular: string
  nomeCrianca: string
  dataNascimento: string | null
  cpfCrianca: string
  tipoPlano: string
  vigencia: string | null
  dataConsulta: string | null
  medicaId: string | null
  medicaNome: string
  status: StatusDPS
  observacao: string
  motivoReprovacao: string
}>

export async function atualizarSolicitacaoDPS(id: string, patch: PatchDPS): Promise<void> {
  const campos: Record<string, unknown> = {}
  if (patch.nomeTitular     != null) campos.nome_titular        = patch.nomeTitular.toUpperCase()
  if (patch.cpfTitular      != null) campos.cpf_titular         = patch.cpfTitular
  if (patch.telefoneTitular != null) campos.telefone_titular     = patch.telefoneTitular
  if (patch.nomeCrianca     != null) campos.nome_crianca         = patch.nomeCrianca.toUpperCase()
  if (patch.dataNascimento  != null) campos.data_nascimento      = patch.dataNascimento
  if (patch.cpfCrianca      != null) campos.cpf_crianca          = patch.cpfCrianca
  if (patch.tipoPlano       != null) campos.tipo_plano           = patch.tipoPlano
  if (patch.vigencia        != null) campos.vigencia             = patch.vigencia
  if (patch.dataConsulta    != null) campos.data_consulta        = patch.dataConsulta
  if (patch.medicaId        != null) campos.medica_id            = patch.medicaId
  if (patch.medicaNome      != null) campos.medica_nome          = patch.medicaNome.toUpperCase()
  if (patch.status          != null) campos.status               = patch.status
  if (patch.observacao      != null) campos.observacao           = patch.observacao
  if (patch.motivoReprovacao != null) campos.motivo_reprovacao   = patch.motivoReprovacao
  const { error } = await sb().from('dps_solicitacoes').update(campos).eq('id', id)
  if (error) throw error
}

export async function excluirSolicitacaoDPS(id: string): Promise<void> {
  const { error } = await sb().from('dps_solicitacoes').delete().eq('id', id)
  if (error) throw error
}

/** Verifica conflito de horário: mesma médica no mesmo dia/hora (±30min). */
export async function checarConflitoAgenda(
  medicaId: string,
  dataConsulta: string,
  ignorarId?: string,
): Promise<boolean> {
  const dt = new Date(dataConsulta)
  const ini = new Date(dt.getTime() - 30 * 60000).toISOString()
  const fim = new Date(dt.getTime() + 30 * 60000).toISOString()
  let q = sb()
    .from('dps_solicitacoes')
    .select('id')
    .eq('medica_id', medicaId)
    .neq('status', 'reprovado')
    .gte('data_consulta', ini)
    .lte('data_consulta', fim)
  if (ignorarId) q = q.neq('id', ignorarId)
  const { data, error } = await q
  if (error) throw error
  return (data?.length ?? 0) > 0
}

// ---- Perfis ----

export type PerfilDPS = {
  id: string
  nome: string
  email: string
  papel: PapelDPS
  ativo: boolean
}

async function invocarDpsUsuarios(
  acao: string,
  extra: Record<string, unknown> = {},
): Promise<Record<string, unknown>> {
  const client = sb()
  const { data, error } = await client.functions.invoke('dps-usuarios', {
    body: { acao, ...extra },
  })
  if (error) {
    let msg = error.message
    try {
      const parsed = typeof data === 'string' ? JSON.parse(data) : data
      if (parsed?.error) msg = parsed.error
    } catch { /* mantém msg padrão */ }
    throw new Error(msg)
  }
  return data as Record<string, unknown>
}

export async function listarPerfis(): Promise<PerfilDPS[]> {
  const data = await invocarDpsUsuarios('listar')
  return (data.usuarios as PerfilDPS[]) ?? []
}

export async function listarMedicas(): Promise<PerfilDPS[]> {
  const { data, error } = await sb()
    .from('dps_perfis')
    .select('id, nome, email, papel, ativo')
    .eq('papel', 'medica')
    .eq('ativo', true)
    .order('nome')
  if (error) throw error
  return data as PerfilDPS[]
}

export async function meuPapelDPS(): Promise<PapelDPS | null> {
  const { data, error } = await sb().rpc('dps_papel')
  if (error || !data) return null
  return data as PapelDPS
}

export async function meuIdDPS(): Promise<string | null> {
  const { data: { user } } = await sb().auth.getUser()
  return user?.id ?? null
}

export async function convidarUsuarioDPS(
  nome: string,
  email: string,
  papel: PapelDPS,
): Promise<PerfilDPS> {
  const data = await invocarDpsUsuarios('convidar', { nome, email, papel })
  return data.usuario as PerfilDPS
}

export async function atualizarUsuarioDPS(
  user_id: string,
  patch: Partial<{ papel: PapelDPS; ativo: boolean }>,
): Promise<PerfilDPS> {
  const data = await invocarDpsUsuarios('atualizar', { user_id, ...patch })
  return data.usuario as PerfilDPS
}

export async function redefinirSenhaDPS(user_id: string): Promise<boolean> {
  const data = await invocarDpsUsuarios('redefinir_senha', { user_id })
  return Boolean(data.enviado)
}

export async function removerUsuarioDPS(user_id: string): Promise<void> {
  await invocarDpsUsuarios('remover', { user_id })
}

export function assinarSolicitacoesDPS(cb: () => void): () => void {
  const client = sb()
  const ch = client
    .channel('dps-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'dps_solicitacoes' }, cb)
    .subscribe()
  return () => { void client.removeChannel(ch) }
}
