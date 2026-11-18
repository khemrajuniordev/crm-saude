/**
 * Controle de CRM — CM.
 *
 * Tipos, helpers de fluxo e dados fictícios da demonstração local do CRM.
 *
 * Fluxo em 3 etapas sequenciais:
 *   1. ATENDIMENTO  → registra a solicitação
 *   2. ENFERMAGEM   → autoriza (Sim/Não)
 *   3. FINANCEIRO   → agenda e paga
 */

export type PapelCRM = 'atendimento' | 'enfermagem' | 'financeiro' | 'admin'

export type Autorizacao = 'pendente' | 'sim' | 'nao'

export type StatusFinanceiro = 'Pendente' | 'Agendado' | 'Pago' | 'Recusado'

export const STATUS_FINANCEIRO: StatusFinanceiro[] = [
  'Pendente',
  'Agendado',
  'Pago',
  'Recusado',
]

export const FORMAS_PAGAMENTO = ['Pix'] as const

export type TipoSolicitacao = 'consulta' | 'reembolso'

export const ROTULO_TIPO: Record<TipoSolicitacao, string> = {
  consulta: 'Consulta',
  reembolso: 'Reembolso',
}

/** Rótulos dos campos conforme o tipo (consulta x reembolso). */
export function rotulosTipo(t: TipoSolicitacao) {
  return t === 'reembolso'
    ? {
        data: 'Data do atendimento',
        dataCurta: 'Atendimento',
        valor: 'Valor a reembolsar',
        proc: 'Procedimento / despesa',
        local: 'Prestador / local',
      }
    : {
        data: 'Data da consulta',
        dataCurta: 'Consulta',
        valor: 'Valor solicitado',
        proc: 'Procedimento',
        local: 'Clínica / Hospital',
      }
}

export type SolicitacaoCRM = {
  id: string
  protocolo: string
  tipo: TipoSolicitacao

  /* ---- Atendimento ---- */
  abertura: string // ISO (yyyy-mm-dd)
  termino: string | null // prazo/conclusão do atendimento
  solicitante: string
  dataConsulta: string | null
  beneficiario: string
  cpf: string
  procedimento: string
  clinicaHospital: string
  valorSolicitado: number | null
  formaPagamento: string
  dadosBancarios: string

  /* ---- Enfermagem ---- */
  autorizacao: Autorizacao
  dataAutorizacao: string | null
  motivoRecusa: string | null
  motivoAutorizacao: string | null

  /* ---- Financeiro ---- */
  dataPrevistaPagamento: string | null
  statusFinanceiro: StatusFinanceiro | null
  dataPagamento: string | null

  /* ---- Comum ---- */
  observacoes: string
}

/* ============================================================
 * Etapa atual (derivada do estado) — rótulo + tom para o badge
 * ========================================================== */
export type Tom = 'aguardando' | 'analise' | 'agendado' | 'ok' | 'recusado'

export type EtapaInfo = { chave: string; label: string; tom: Tom }

export function etapaAtual(s: SolicitacaoCRM): EtapaInfo {
  if (s.autorizacao === 'nao' || s.statusFinanceiro === 'Recusado')
    return { chave: 'recusado', label: 'Não autorizado', tom: 'recusado' }

  if (s.autorizacao === 'pendente')
    return { chave: 'enfermagem', label: 'Aguardando enfermagem', tom: 'aguardando' }

  // autorizado
  if (s.statusFinanceiro === 'Pago')
    return { chave: 'pago', label: 'Pago', tom: 'ok' }

  if (s.statusFinanceiro === 'Agendado')
    return { chave: 'agendado', label: 'Pagamento agendado', tom: 'agendado' }

  return { chave: 'financeiro', label: 'Aguardando financeiro', tom: 'analise' }
}

/** Papéis que podem editar cada etapa. */
export function podeEditarAtendimento(p: PapelCRM) {
  return p === 'atendimento' || p === 'admin'
}
export function podeEditarEnfermagem(p: PapelCRM) {
  return p === 'enfermagem' || p === 'admin'
}
export function podeEditarFinanceiro(p: PapelCRM) {
  return p === 'financeiro' || p === 'admin'
}

export const PAPEL_LABEL: Record<PapelCRM, string> = {
  atendimento: 'Atendimento',
  enfermagem: 'Enfermagem',
  financeiro: 'Financeiro',
  admin: 'Admin (todos)',
}

/* ============================================================
 * Utilidades
 * ========================================================== */
export function hojeISO(): string {
  const hoje = new Date()
  const ano = hoje.getFullYear()
  const mes = String(hoje.getMonth() + 1).padStart(2, '0')
  const dia = String(hoje.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

export function formatarData(iso: string | null): string {
  if (!iso) return '—'
  const [a, m, d] = iso.slice(0, 10).split('-')
  if (!a || !m || !d) return '—'
  return `${d}/${m}/${a}`
}

export function formatarValor(v: number | null): string {
  if (v == null) return '—'
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

/** Protocolo sequencial local: CRM-AAAA-00001. */
export function proximoProtocolo(existentes: SolicitacaoCRM[]): string {
  const ano = new Date().getFullYear()
  const doAno = existentes.filter((s) => s.protocolo.includes(`-${ano}-`))
  const n = doAno.length + 1
  return `CRM-${ano}-${String(n).padStart(5, '0')}`
}

/* ============================================================
 * Alertas para revisão (regras locais — nenhum dado sai do sistema)
 * ========================================================== */
export type TipoAlerta = 'duplicata' | 'pix' | 'valor' | 'sem-doc' | 'consulta'

export type Alerta = {
  id: string
  protocolo: string
  beneficiario: string
  tipo: TipoAlerta
  motivo: string
}

export const ROTULO_ALERTA: Record<TipoAlerta, string> = {
  duplicata: 'Possível duplicata',
  pix: 'Pix repetido',
  valor: 'Valor atípico',
  'sem-doc': 'Sem documento',
  consulta: 'Consulta sem pagamento',
}

/* ============================================================
 * Urgência da consulta — cruza a data da consulta com o pagamento.
 * Só vale para solicitações ainda NÃO pagas (e não recusadas) com data.
 * ========================================================== */
export type NivelUrgencia = 'atrasada' | 'urgente' | 'atencao'
/* `rotulo` é a frase completa, usada no detalhe da solicitação.
   `curto` é a marca que vai na tabela: precisa caber ao lado do
   badge de etapa sem quebrar a linha, senão a altura das linhas
   deixa de ser uniforme e a tabela para de ser escaneável. */
export type UrgenciaConsulta =
  | { nivel: NivelUrgencia; dias: number; rotulo: string; curto: string }
  | null

export function urgenciaConsulta(s: SolicitacaoCRM): UrgenciaConsulta {
  if (s.tipo === 'reembolso') return null // reembolso é despesa passada, não time-critical
  if (!s.dataConsulta) return null
  if (s.statusFinanceiro === 'Pago') return null
  if (s.autorizacao === 'nao' || s.statusFinanceiro === 'Recusado') return null
  const hoje = new Date(hojeISO())
  const dc = new Date(s.dataConsulta)
  const dias = Math.round((dc.getTime() - hoje.getTime()) / 86400000)
  if (dias < 0)
    return {
      nivel: 'atrasada',
      dias,
      rotulo: `Consulta atrasada em ${formatarData(s.dataConsulta)}, sem pagamento`,
      curto: `${Math.abs(dias)}d atrasada`,
    }
  if (dias <= 1)
    return {
      nivel: 'urgente',
      dias,
      rotulo:
        dias === 0
          ? 'Consulta hoje, sem pagamento'
          : 'Consulta amanhã, sem pagamento',
      curto: dias === 0 ? 'Hoje' : 'Amanhã',
    }
  if (dias <= 3)
    return {
      nivel: 'atencao',
      dias,
      rotulo: `Consulta em ${dias} dias, sem pagamento`,
      curto: `em ${dias}d`,
    }
  return null
}

function mediana(nums: number[]): number {
  if (!nums.length) return 0
  const s = [...nums].sort((a, b) => a - b)
  const meio = Math.floor(s.length / 2)
  return s.length % 2 ? s[meio] : (s[meio - 1] + s[meio]) / 2
}

function chavePix(dados: string): string {
  const t = (dados || '').trim()
  if (!t) return ''
  const i = t.lastIndexOf(':')
  return (i >= 0 ? t.slice(i + 1) : t).replace(/\s+/g, '').toLowerCase()
}

function diasEntre(a: string, b: string): number {
  return (
    Math.abs(
      new Date(a + 'T00:00:00').getTime() - new Date(b + 'T00:00:00').getTime(),
    ) / 86400000
  )
}

/**
 * Gera avisos para o financeiro revisar, a partir das solicitações.
 * Não bloqueia nada e não envia dados a lugar nenhum.
 */
export function calcularAlertas(lista: SolicitacaoCRM[], idsComDoc?: Set<string>): Alerta[] {
  const alertas: Alerta[] = []
  const add = (s: SolicitacaoCRM, tipo: TipoAlerta, motivo: string) =>
    alertas.push({ id: s.id, protocolo: s.protocolo, beneficiario: s.beneficiario, tipo, motivo })

  // 1) duplicatas: mesmo beneficiário + procedimento em até 15 dias
  const grupos = new Map<string, SolicitacaoCRM[]>()
  for (const s of lista) {
    const k = `${s.beneficiario.trim().toLowerCase()}|${s.procedimento.trim().toLowerCase()}`
    ;(grupos.get(k) ?? grupos.set(k, []).get(k)!).push(s)
  }
  for (const grupo of grupos.values()) {
    if (grupo.length < 2) continue
    const ord = [...grupo].sort((a, b) => a.abertura.localeCompare(b.abertura))
    for (let i = 1; i < ord.length; i++) {
      const d = diasEntre(ord[i].abertura, ord[i - 1].abertura)
      if (d <= 15) {
        add(ord[i], 'duplicata', `Mesmo paciente e procedimento de ${ord[i - 1].protocolo} em ${Math.round(d)} dia(s)`)
      }
    }
  }

  // 2) mesma chave Pix em 3+ beneficiários distintos
  const benefPorPix = new Map<string, Set<string>>()
  const solsPorPix = new Map<string, SolicitacaoCRM[]>()
  for (const s of lista) {
    const k = chavePix(s.dadosBancarios)
    if (!k) continue
    if (!benefPorPix.has(k)) {
      benefPorPix.set(k, new Set())
      solsPorPix.set(k, [])
    }
    benefPorPix.get(k)!.add(s.beneficiario.trim().toLowerCase())
    solsPorPix.get(k)!.push(s)
  }
  for (const [k, benefs] of benefPorPix) {
    if (benefs.size >= 3) {
      for (const s of solsPorPix.get(k)!)
        add(s, 'pix', `Mesma chave Pix usada por ${benefs.size} beneficiários diferentes`)
    }
  }

  // 3) valor fora do padrão: acima de 2,5× a mediana do procedimento (grupo com 3+)
  const porProc = new Map<string, SolicitacaoCRM[]>()
  for (const s of lista) {
    if (s.valorSolicitado == null) continue
    const k = s.procedimento.trim().toLowerCase()
    ;(porProc.get(k) ?? porProc.set(k, []).get(k)!).push(s)
  }
  for (const grupo of porProc.values()) {
    if (grupo.length < 3) continue
    const med = mediana(grupo.map((s) => s.valorSolicitado!))
    if (med <= 0) continue
    for (const s of grupo) {
      if (s.valorSolicitado! > med * 2.5) {
        add(
          s,
          'valor',
          `Valor ${formatarValor(s.valorSolicitado)} é ${(s.valorSolicitado! / med).toFixed(1)}× a mediana do procedimento (${formatarValor(med)})`,
        )
      }
    }
  }

  // 4) autorizado sem documento anexado
  if (idsComDoc) {
    for (const s of lista) {
      if (s.autorizacao === 'sim' && !idsComDoc.has(s.id)) {
        add(s, 'sem-doc', 'Autorizada sem documento anexado')
      }
    }
  }

  // 5) consulta hoje/amanhã (ou atrasada) ainda não paga — avisar o financeiro
  for (const s of lista) {
    const u = urgenciaConsulta(s)
    if (u && u.nivel !== 'atencao') {
      add(
        s,
        'consulta',
        u.nivel === 'atrasada'
          ? `Consulta já passou (${formatarData(s.dataConsulta)}) e não foi paga — pagar`
          : u.dias === 0
            ? 'Consulta é hoje e ainda não foi paga — pagar'
            : 'Consulta é amanhã e ainda não foi paga — pagar',
      )
    }
  }

  return alertas
}

function dataExemplo(diasAtras: number): string {
  const data = new Date()
  data.setDate(data.getDate() - diasAtras)
  const ano = data.getFullYear()
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const dia = String(data.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

/* Todos os nomes, identificadores e chaves abaixo são fictícios. */
const solicitacoesDemoAdicionais: SolicitacaoCRM[] = Array.from({ length: 15 }, (_, indice) => {
  const numero = indice + 6
  const cenario = numero % 5
  const tipo: TipoSolicitacao = numero % 4 === 0 ? 'reembolso' : 'consulta'
  const autorizacao: Autorizacao =
    cenario === 0 ? 'pendente' : cenario === 4 ? 'nao' : 'sim'
  const statusFinanceiro: StatusFinanceiro | null =
    cenario === 0
      ? null
      : cenario === 1
        ? 'Pendente'
        : cenario === 2
          ? 'Agendado'
          : cenario === 3
            ? 'Pago'
            : 'Recusado'
  const solicitantes = ['ALEX DEMONSTRAÇÃO', 'BIA DEMONSTRAÇÃO', 'CAIO DEMONSTRAÇÃO']
  const procedimentos = [
    'CONSULTA DE ACOMPANHAMENTO',
    'EXAME DEMONSTRATIVO',
    'SESSÃO DE FISIOTERAPIA',
    'PROCEDIMENTO DE EXEMPLO',
    'REEMBOLSO DE DESPESA',
  ]
  const locais = ['CLÍNICA MODELO', 'CENTRO FICTÍCIO DE SAÚDE', 'PRESTADOR FICTÍCIO']
  const dataPagamento = statusFinanceiro === 'Pago' ? dataExemplo(1 + (numero % 20)) : null

  return {
    id: `demo-${numero}`,
    protocolo: `CRM-${new Date().getFullYear()}-${String(numero).padStart(5, '0')}`,
    tipo,
    abertura: dataExemplo(1 + (numero % 45)),
    termino: dataPagamento,
    solicitante: solicitantes[indice % solicitantes.length],
    dataConsulta: tipo === 'consulta' ? dataExemplo((numero % 9) - 3) : null,
    beneficiario: `PESSOA FICTÍCIA ${String(numero).padStart(2, '0')}`,
    cpf: '000.000.000-00',
    procedimento: procedimentos[indice % procedimentos.length],
    clinicaHospital: locais[indice % locais.length],
    valorSolicitado: 250 + numero * 75,
    formaPagamento: 'Pix',
    dadosBancarios: `Chave Pix fictícia: chave-demo-${String(numero).padStart(2, '0')}@example.invalid`,
    autorizacao,
    dataAutorizacao: autorizacao === 'pendente' ? null : dataExemplo(1 + (numero % 12)),
    motivoRecusa: autorizacao === 'nao' ? 'Cenário fictício de solicitação recusada.' : null,
    motivoAutorizacao: null,
    dataPrevistaPagamento:
      statusFinanceiro === 'Agendado' ? dataExemplo(-2) : null,
    statusFinanceiro,
    dataPagamento,
    observacoes: 'Registro fictício de demonstração.',
  }
})

export const SOLICITACOES_EXEMPLO: SolicitacaoCRM[] = [
  {
    id: 'demo-1',
    protocolo: `CRM-${new Date().getFullYear()}-00001`,
    tipo: 'consulta',
    abertura: dataExemplo(3),
    termino: dataExemplo(-10),
    solicitante: 'ALEX DEMONSTRAÇÃO',
    dataConsulta: dataExemplo(-5),
    beneficiario: 'PESSOA FICTÍCIA 01',
    cpf: '000.000.000-00',
    procedimento: 'CONSULTA DE EXEMPLO',
    clinicaHospital: 'CLÍNICA MODELO',
    valorSolicitado: 620,
    formaPagamento: 'Pix',
    dadosBancarios: 'Chave Pix fictícia: chave-demo-01@example.invalid',
    autorizacao: 'sim',
    dataAutorizacao: dataExemplo(2),
    motivoRecusa: null,
    motivoAutorizacao: null,
    dataPrevistaPagamento: dataExemplo(-2),
    statusFinanceiro: 'Agendado',
    dataPagamento: null,
    observacoes: '',
  },
  {
    id: 'demo-2',
    protocolo: `CRM-${new Date().getFullYear()}-00002`,
    tipo: 'consulta',
    abertura: dataExemplo(14),
    termino: null,
    solicitante: 'ALEX DEMONSTRAÇÃO',
    dataConsulta: null,
    beneficiario: 'PESSOA FICTÍCIA 02',
    cpf: '000.000.000-00',
    procedimento: 'PROCEDIMENTO DEMONSTRATIVO',
    clinicaHospital: '',
    valorSolicitado: 250,
    formaPagamento: 'Pix',
    dadosBancarios: '',
    autorizacao: 'nao',
    dataAutorizacao: dataExemplo(12),
    motivoRecusa: 'Cenário fictício de solicitação recusada.',
    motivoAutorizacao: null,
    dataPrevistaPagamento: null,
    statusFinanceiro: 'Recusado',
    dataPagamento: null,
    observacoes: 'Registro de demonstração sem dados reais.',
  },
  {
    id: 'demo-3',
    protocolo: `CRM-${new Date().getFullYear()}-00003`,
    tipo: 'consulta',
    abertura: dataExemplo(1),
    termino: dataExemplo(-14),
    solicitante: 'BIA DEMONSTRAÇÃO',
    dataConsulta: dataExemplo(1),
    beneficiario: 'PESSOA FICTÍCIA 03',
    cpf: '000.000.000-00',
    procedimento: 'EXAME DEMONSTRATIVO',
    clinicaHospital: 'CENTRO FICTÍCIO DE SAÚDE',
    valorSolicitado: 480,
    formaPagamento: 'Pix',
    dadosBancarios: 'Chave Pix fictícia: chave-demo-03@example.invalid',
    autorizacao: 'pendente',
    dataAutorizacao: null,
    motivoRecusa: null,
    motivoAutorizacao: null,
    dataPrevistaPagamento: null,
    statusFinanceiro: null,
    dataPagamento: null,
    observacoes: '',
  },
  {
    id: 'demo-4',
    protocolo: `CRM-${new Date().getFullYear()}-00004`,
    tipo: 'reembolso',
    abertura: dataExemplo(35),
    termino: dataExemplo(30),
    solicitante: 'CAIO DEMONSTRAÇÃO',
    dataConsulta: dataExemplo(40),
    beneficiario: 'PESSOA FICTÍCIA 04',
    cpf: '000.000.000-00',
    procedimento: 'REEMBOLSO DE EXEMPLO',
    clinicaHospital: 'PRESTADOR FICTÍCIO',
    valorSolicitado: 1200,
    formaPagamento: 'Pix',
    dadosBancarios: 'Chave Pix fictícia: chave-demo-04@example.invalid',
    autorizacao: 'sim',
    dataAutorizacao: dataExemplo(33),
    motivoRecusa: null,
    motivoAutorizacao: null,
    dataPrevistaPagamento: dataExemplo(28),
    statusFinanceiro: 'Pago',
    dataPagamento: dataExemplo(28),
    observacoes: '',
  },
  {
    id: 'demo-5',
    protocolo: `CRM-${new Date().getFullYear()}-00005`,
    tipo: 'consulta',
    abertura: dataExemplo(5),
    termino: null,
    solicitante: 'ALEX DEMONSTRAÇÃO',
    dataConsulta: dataExemplo(-7),
    beneficiario: 'PESSOA FICTÍCIA 05',
    cpf: '000.000.000-00',
    procedimento: 'CONSULTA DE ACOMPANHAMENTO',
    clinicaHospital: 'CLÍNICA MODELO',
    valorSolicitado: 350,
    formaPagamento: 'Pix',
    dadosBancarios: '',
    autorizacao: 'sim',
    dataAutorizacao: dataExemplo(4),
    motivoRecusa: null,
    motivoAutorizacao: null,
    dataPrevistaPagamento: null,
    statusFinanceiro: 'Pendente',
    dataPagamento: null,
    observacoes: 'Cenário fictício aguardando pagamento.',
  },
  ...solicitacoesDemoAdicionais,
]
