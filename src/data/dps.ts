/** Tipos, constantes e helpers do sistema Central DPS. */

export type PapelDPS = 'admin' | 'operador' | 'medica'

export type StatusDPS =
  | 'cadastro'
  | 'agendado'
  | 'avaliacao'
  | 'aprovado'
  | 'reprovado'

export type SolicitacaoDPS = {
  id: string
  protocolo: string
  // Titular
  nomeTitular: string
  cpfTitular: string
  telefoneTitular: string
  // Criança
  nomeCrianca: string
  dataNascimento: string | null
  cpfCrianca: string
  // Contrato
  tipoPlano: string
  vigencia: string | null
  // Consulta
  dataConsulta: string | null
  medicaId: string | null
  medicaNome: string
  // Resultado
  status: StatusDPS
  observacao: string
  motivoReprovacao: string
  // Auditoria
  criadoPor: string | null
  criadoEm: string
  atualizadoEm: string
}

export type EtapaDPS = {
  chave: StatusDPS
  label: string
  tom: string
}

export const ETAPAS_DPS: EtapaDPS[] = [
  { chave: 'cadastro',  label: 'Aguardando agendamento', tom: 'aguardando' },
  { chave: 'agendado',  label: 'Consulta agendada',       tom: 'analise'   },
  { chave: 'avaliacao', label: 'Em avaliação',             tom: 'agendado'  },
  { chave: 'aprovado',  label: 'Aprovado',                 tom: 'ok'        },
  { chave: 'reprovado', label: 'Reprovado',                tom: 'recusado'  },
]

export function etapaDPS(status: StatusDPS): EtapaDPS {
  return ETAPAS_DPS.find((e) => e.chave === status) ?? ETAPAS_DPS[0]
}

export const TIPOS_PLANO = [
  'Individual',
  'Familiar',
  'Empresarial',
  'MEI',
  'Coletivo por Adesão',
]

export const ROTULO_STATUS: Record<StatusDPS, string> = {
  cadastro:  'Aguardando agendamento',
  agendado:  'Consulta agendada',
  avaliacao: 'Em avaliação',
  aprovado:  'Aprovado',
  reprovado: 'Reprovado',
}

export const FILTROS_DPS = [
  { chave: 'todos',     label: 'Todos',               tom: '' },
  { chave: 'cadastro',  label: 'Ag. agendamento',      tom: 'aguardando' },
  { chave: 'agendado',  label: 'Agendado',             tom: 'analise'    },
  { chave: 'avaliacao', label: 'Em avaliação',         tom: 'agendado'   },
  { chave: 'aprovado',  label: 'Aprovados',            tom: 'ok'         },
  { chave: 'reprovado', label: 'Reprovados',           tom: 'recusado'   },
] as const

export function idadeMeses(dataNascimento: string | null): number {
  if (!dataNascimento) return 0
  const nasc = new Date(dataNascimento + 'T00:00:00')
  const hoje = new Date()
  return (
    (hoje.getFullYear() - nasc.getFullYear()) * 12 +
    (hoje.getMonth() - nasc.getMonth())
  )
}

export function idadeLabel(dataNascimento: string | null): string {
  const m = idadeMeses(dataNascimento)
  if (m < 24) return `${m} mes${m !== 1 ? 'es' : ''}`
  const a = Math.floor(m / 12)
  return `${a} ano${a !== 1 ? 's' : ''}`
}

export function hojeISO(): string {
  return new Date().toISOString().slice(0, 10)
}

export const SOLICITACOES_EXEMPLO: SolicitacaoDPS[] = [
  {
    id: 'ex-1', protocolo: 'DPS-20261001-000001',
    nomeTitular: 'ANA PAULA SILVA', cpfTitular: '123.456.789-00', telefoneTitular: '(69) 99999-0001',
    nomeCrianca: 'LUCAS SILVA', dataNascimento: '2024-03-15', cpfCrianca: '',
    tipoPlano: 'Familiar', vigencia: '2026-11-01',
    dataConsulta: '2026-10-10T09:00:00', medicaId: null, medicaNome: 'Dra. MARIANA ROCHA',
    status: 'aprovado', observacao: 'Criança saudável, sem restrições.', motivoReprovacao: '',
    criadoPor: null, criadoEm: '2026-10-01', atualizadoEm: '2026-10-10',
  },
  {
    id: 'ex-2', protocolo: 'DPS-20261005-000002',
    nomeTitular: 'FERNANDA COSTA', cpfTitular: '234.567.890-11', telefoneTitular: '(69) 99988-0002',
    nomeCrianca: 'ISABELA COSTA', dataNascimento: '2023-07-20', cpfCrianca: '',
    tipoPlano: 'Individual', vigencia: '2026-11-05',
    dataConsulta: '2026-10-20T10:30:00', medicaId: null, medicaNome: 'Dra. MARIANA ROCHA',
    status: 'reprovado', observacao: '', motivoReprovacao: 'Cardiopatia congênita confirmada.',
    criadoPor: null, criadoEm: '2026-10-05', atualizadoEm: '2026-10-20',
  },
  {
    id: 'ex-3', protocolo: 'DPS-20261110-000003',
    nomeTitular: 'MARCOS OLIVEIRA', cpfTitular: '345.678.901-22', telefoneTitular: '(69) 99977-0003',
    nomeCrianca: 'PEDRO OLIVEIRA', dataNascimento: '2025-01-05', cpfCrianca: '',
    tipoPlano: 'Empresarial', vigencia: '2026-12-01',
    dataConsulta: '2026-11-15T14:00:00', medicaId: null, medicaNome: 'Dra. CAMILA FERRAZ',
    status: 'agendado', observacao: '', motivoReprovacao: '',
    criadoPor: null, criadoEm: '2026-11-10', atualizadoEm: '2026-11-10',
  },
  {
    id: 'ex-4', protocolo: 'DPS-20261112-000004',
    nomeTitular: 'JULIANA MENDES', cpfTitular: '456.789.012-33', telefoneTitular: '(69) 99966-0004',
    nomeCrianca: 'SOFIA MENDES', dataNascimento: '2024-09-22', cpfCrianca: '',
    tipoPlano: 'Familiar', vigencia: '2026-12-01',
    dataConsulta: null, medicaId: null, medicaNome: '',
    status: 'cadastro', observacao: '', motivoReprovacao: '',
    criadoPor: null, criadoEm: '2026-11-12', atualizadoEm: '2026-11-12',
  },
]
