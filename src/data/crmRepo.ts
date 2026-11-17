/**
 * Repositório local de demonstração do CRM.
 * Os dados ficam no localStorage deste navegador; não há conexão com serviços externos.
 */
import {
  hojeISO,
  proximoProtocolo,
  SOLICITACOES_EXEMPLO,
  type PapelCRM,
  type SolicitacaoCRM,
} from './crm'

const SOLICITACOES_KEY = 'crm-demo-solicitacoes-v1'
const SOLICITACOES_SEMENTE_VERSION_KEY = 'crm-demo-solicitacoes-semente-v2'
const USUARIOS_KEY = 'crm-demo-usuarios-v1'
const ANEXOS_KEY = 'crm-demo-anexos-v1'
const HISTORICO_KEY = 'crm-demo-historico-v1'
const listeners = new Set<() => void>()
const arquivosLocais = new Map<string, string>()

function ler<T>(chave: string, inicial: T): T {
  const salvo = localStorage.getItem(chave)
  if (salvo === null) {
    localStorage.setItem(chave, JSON.stringify(inicial))
    return inicial
  }
  return JSON.parse(salvo) as T
}

function gravar<T>(chave: string, valor: T): void {
  localStorage.setItem(chave, JSON.stringify(valor))
}

function emitirMudanca(): void {
  listeners.forEach((listener) => listener())
}

function registrarHistorico(
  solicitacaoId: string,
  evento: string,
  detalhe: string | null = null,
): void {
  const todos = ler<HistoricoCRM[]>(HISTORICO_KEY, [])
  todos.push({
    id: crypto.randomUUID(),
    evento,
    detalhe,
    userNome: 'EQUIPE DEMONSTRAÇÃO',
    createdAt: new Date().toISOString(),
    solicitacaoId,
  })
  gravar(HISTORICO_KEY, todos)
}

export function assinarSolicitacoes(aoMudar: () => void): () => void {
  listeners.add(aoMudar)
  const aoMudarEmOutraAba = (evento: StorageEvent) => {
    if (evento.key === SOLICITACOES_KEY) aoMudar()
  }
  window.addEventListener('storage', aoMudarEmOutraAba)
  return () => {
    listeners.delete(aoMudar)
    window.removeEventListener('storage', aoMudarEmOutraAba)
  }
}

export async function meuPapel(): Promise<PapelCRM> {
  return 'admin'
}

export async function meuNome(): Promise<string> {
  return 'EQUIPE DEMONSTRAÇÃO'
}

export async function listarSolicitacoes(): Promise<SolicitacaoCRM[]> {
  const atuais = ler<SolicitacaoCRM[]>(SOLICITACOES_KEY, SOLICITACOES_EXEMPLO)
  if (localStorage.getItem(SOLICITACOES_SEMENTE_VERSION_KEY) === '2') return atuais

  const idsAtuais = new Set(atuais.map((solicitacao) => solicitacao.id))
  const faltantes = SOLICITACOES_EXEMPLO.filter(
    (solicitacao) => !idsAtuais.has(solicitacao.id),
  )
  const migradas = [...atuais, ...faltantes]

  if (faltantes.length > 0) gravar(SOLICITACOES_KEY, migradas)
  localStorage.setItem(SOLICITACOES_SEMENTE_VERSION_KEY, '2')
  return migradas
}

export type NovaSolicitacao = {
  protocolo: string
  tipo: SolicitacaoCRM['tipo']
  solicitante: string
  beneficiario: string
  cpf: string
  procedimento: string
  clinicaHospital: string
  dataConsulta: string | null
  termino: string | null
  valorSolicitado: number | null
  dadosBancarios: string
  observacoes: string
}

export async function criarSolicitacao(dados: NovaSolicitacao): Promise<SolicitacaoCRM> {
  const lista = await listarSolicitacoes()
  const nova: SolicitacaoCRM = {
    ...dados,
    id: crypto.randomUUID(),
    protocolo: dados.protocolo.trim() || proximoProtocolo(lista),
    abertura: hojeISO(),
    formaPagamento: 'Pix',
    autorizacao: 'pendente',
    dataAutorizacao: null,
    motivoRecusa: null,
    motivoAutorizacao: null,
    dataPrevistaPagamento: null,
    statusFinanceiro: null,
    dataPagamento: null,
  }
  gravar(SOLICITACOES_KEY, [nova, ...lista])
  registrarHistorico(nova.id, 'criada')
  emitirMudanca()
  return nova
}

export async function atualizarSolicitacao(
  id: string,
  patch: Partial<SolicitacaoCRM>,
): Promise<SolicitacaoCRM> {
  const lista = await listarSolicitacoes()
  const atual = lista.find((solicitacao) => solicitacao.id === id)
  if (!atual) throw new Error('Solicitação não encontrada nesta demonstração.')

  const atualizada = { ...atual, ...patch }
  gravar(
    SOLICITACOES_KEY,
    lista.map((solicitacao) => (solicitacao.id === id ? atualizada : solicitacao)),
  )

  if (patch.autorizacao === 'sim') registrarHistorico(id, 'autorizada')
  else if (patch.autorizacao === 'nao') registrarHistorico(id, 'recusada', patch.motivoRecusa ?? null)
  else if (patch.statusFinanceiro === 'Pago') registrarHistorico(id, 'paga')
  else if (patch.statusFinanceiro === 'Agendado') registrarHistorico(id, 'agendada')

  emitirMudanca()
  return atualizada
}

export async function excluirSolicitacao(id: string): Promise<void> {
  const lista = await listarSolicitacoes()
  gravar(
    SOLICITACOES_KEY,
    lista.filter((solicitacao) => solicitacao.id !== id),
  )
  const anexos = await listarAnexos(id)
  for (const anexo of anexos) await excluirAnexo(anexo)
  gravar(
    HISTORICO_KEY,
    ler<HistoricoCRM[]>(HISTORICO_KEY, []).filter((item) => item.solicitacaoId !== id),
  )
  emitirMudanca()
}

export type TipoAnexo = 'documento' | 'recibo'

export type AnexoCRM = {
  id: string
  solicitacaoId: string
  tipo: TipoAnexo
  nome: string
  path: string
  tamanho: number | null
  mime: string | null
  createdAt: string
}

export async function listarAnexos(solicitacaoId: string): Promise<AnexoCRM[]> {
  return ler<AnexoCRM[]>(ANEXOS_KEY, []).filter((anexo) => anexo.solicitacaoId === solicitacaoId)
}

export async function enviarAnexo(
  solicitacaoId: string,
  tipo: TipoAnexo,
  arquivo: File,
): Promise<AnexoCRM> {
  const anexo: AnexoCRM = {
    id: crypto.randomUUID(),
    solicitacaoId,
    tipo,
    nome: arquivo.name,
    path: crypto.randomUUID(),
    tamanho: arquivo.size,
    mime: arquivo.type || null,
    createdAt: new Date().toISOString(),
  }
  const anexos = ler<AnexoCRM[]>(ANEXOS_KEY, [])
  anexos.push(anexo)
  gravar(ANEXOS_KEY, anexos)
  arquivosLocais.set(anexo.path, URL.createObjectURL(arquivo))
  registrarHistorico(solicitacaoId, 'anexo', arquivo.name)
  emitirMudanca()
  return anexo
}

export async function urlAnexo(path: string): Promise<string> {
  const url = arquivosLocais.get(path)
  if (!url) throw new Error('O arquivo de demonstração não está disponível após recarregar a página.')
  return url
}

export async function excluirAnexo(anexo: AnexoCRM): Promise<void> {
  const url = arquivosLocais.get(anexo.path)
  if (url) URL.revokeObjectURL(url)
  arquivosLocais.delete(anexo.path)
  const anexos = ler<AnexoCRM[]>(ANEXOS_KEY, [])
  gravar(
    ANEXOS_KEY,
    anexos.filter((item) => item.id !== anexo.id),
  )
  emitirMudanca()
}

export async function idsComDocumento(): Promise<Set<string>> {
  const anexos = ler<AnexoCRM[]>(ANEXOS_KEY, [])
  return new Set(anexos.filter((anexo) => anexo.tipo === 'documento').map((anexo) => anexo.solicitacaoId))
}

export type HistoricoCRM = {
  id: string
  evento: string
  detalhe: string | null
  userNome: string | null
  createdAt: string
  solicitacaoId: string
}

export async function listarHistorico(solicitacaoId: string): Promise<HistoricoCRM[]> {
  return ler<HistoricoCRM[]>(HISTORICO_KEY, [])
    .filter((item) => item.solicitacaoId === solicitacaoId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

export async function sugestoesRede(): Promise<{ clinicas: string[]; procedimentos: string[] }> {
  return {
    clinicas: ['CLÍNICA MODELO', 'CENTRO FICTÍCIO DE SAÚDE'],
    procedimentos: ['CONSULTA DE EXEMPLO', 'EXAME DEMONSTRATIVO'],
  }
}

export type UsuarioCRM = {
  user_id: string
  nome: string
  email: string
  papel: PapelCRM
  ativo: boolean
}

const USUARIOS_EXEMPLO: UsuarioCRM[] = [
  { user_id: 'demo-atendimento', nome: 'ALEX DEMONSTRAÇÃO', email: 'atendimento@example.invalid', papel: 'atendimento', ativo: true },
  { user_id: 'demo-enfermagem', nome: 'BIA DEMONSTRAÇÃO', email: 'enfermagem@example.invalid', papel: 'enfermagem', ativo: true },
  { user_id: 'demo-financeiro', nome: 'CAIO DEMONSTRAÇÃO', email: 'financeiro@example.invalid', papel: 'financeiro', ativo: true },
  { user_id: 'demo-admin', nome: 'EQUIPE DEMONSTRAÇÃO', email: 'admin@example.invalid', papel: 'admin', ativo: true },
]

export async function meuUserId(): Promise<string> {
  return 'demo-admin'
}

export async function listarUsuarios(): Promise<UsuarioCRM[]> {
  return ler(USUARIOS_KEY, USUARIOS_EXEMPLO)
}

export async function convidarUsuario(
  nome: string,
  email: string,
  papel: PapelCRM,
): Promise<UsuarioCRM> {
  const usuarios = await listarUsuarios()
  if (usuarios.some((usuario) => usuario.email.toLowerCase() === email.toLowerCase()))
    throw new Error('Este e-mail já está cadastrado na demonstração.')
  const novo: UsuarioCRM = {
    user_id: crypto.randomUUID(),
    nome,
    email,
    papel,
    ativo: true,
  }
  gravar(USUARIOS_KEY, [...usuarios, novo])
  return novo
}

export async function atualizarUsuario(
  user_id: string,
  patch: { papel?: PapelCRM; ativo?: boolean },
): Promise<UsuarioCRM> {
  const usuarios = await listarUsuarios()
  const atual = usuarios.find((usuario) => usuario.user_id === user_id)
  if (!atual) throw new Error('Usuário não encontrado nesta demonstração.')
  const atualizado = { ...atual, ...patch }
  gravar(
    USUARIOS_KEY,
    usuarios.map((usuario) => (usuario.user_id === user_id ? atualizado : usuario)),
  )
  return atualizado
}

export async function redefinirSenha(user_id: string): Promise<boolean> {
  if (!(await listarUsuarios()).some((usuario) => usuario.user_id === user_id))
    throw new Error('Usuário não encontrado nesta demonstração.')
  return true
}

export async function removerUsuario(user_id: string): Promise<void> {
  const usuarios = await listarUsuarios()
  if (!usuarios.some((usuario) => usuario.user_id === user_id))
    throw new Error('Usuário não encontrado nesta demonstração.')
  gravar(
    USUARIOS_KEY,
    usuarios.filter((usuario) => usuario.user_id !== user_id),
  )
}
