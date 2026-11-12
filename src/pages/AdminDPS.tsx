import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ROUTES } from '../routes'
import {
  etapaDPS,
  ETAPAS_DPS,
  FILTROS_DPS,
  hojeISO,
  idadeLabel,
  ROTULO_STATUS,
  SOLICITACOES_EXEMPLO,
  TIPOS_PLANO,
  type PapelDPS,
  type SolicitacaoDPS,
  type StatusDPS,
} from '../data/dps'
import {
  atualizarSolicitacaoDPS,
  assinarSolicitacoesDPS,
  checarConflitoAgenda,
  criarSolicitacaoDPS,
  listarMedicas,
  listarSolicitacoesDPS,
  listarSolicitacoesMinhaAgendaDPS,
  meuPapelDPS,
  type PerfilDPS,
} from '../data/dpsRepo'
import { mascaraDocumento, mascaraTelefone } from '../utils/formulario'

// ---- tipos internos ----
type FormDPS = {
  nomeTitular: string
  cpfTitular: string
  telefoneTitular: string
  nomeCrianca: string
  dataNascimento: string
  cpfCrianca: string
  tipoPlano: string
  vigencia: string
  dataConsulta: string
  medicaId: string
  medicaNome: string
}

const FORM_VAZIO: FormDPS = {
  nomeTitular: '', cpfTitular: '', telefoneTitular: '',
  nomeCrianca: '', dataNascimento: '', cpfCrianca: '',
  tipoPlano: '', vigencia: '',
  dataConsulta: '', medicaId: '', medicaNome: '',
}

// ---- helpers visuais ----
function Badge({ status }: { status: StatusDPS }) {
  const e = etapaDPS(status)
  return <span className={`crm-badge tom-${e.tom}`}>{e.label}</span>
}

function ToastErro({ msg, onClose }: { msg: string; onClose: () => void }) {
  return (
    <div className="crm-toast-erro" role="alert">
      <span>{msg}</span>
      <button type="button" onClick={onClose} aria-label="Fechar">×</button>
    </div>
  )
}
function ToastOk({ msg, onClose }: { msg: string; onClose: () => void }) {
  return (
    <div className="crm-toast-ok" role="status">
      <span>{msg}</span>
      <button type="button" onClick={onClose} aria-label="Fechar">×</button>
    </div>
  )
}

// ================================================================
// Componente principal
// ================================================================
export default function AdminDPS() {
  const [papel, setPapel] = useState<PapelDPS | null>(null)
  const [meuId, setMeuId] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [lista, setLista] = useState<SolicitacaoDPS[]>([])
  const [medicas, setMedicas] = useState<PerfilDPS[]>([])
  const [filtro, setFiltro] = useState<string>('todos')
  const [busca, setBusca] = useState('')
  const [detalhe, setDetalhe] = useState<SolicitacaoDPS | null>(null)
  const [criando, setCriando] = useState(false)
  const [editando, setEditando] = useState(false)
  const [form, setForm] = useState<FormDPS>(FORM_VAZIO)
  const [salvando, setSalvando] = useState(false)
  const [erroForm, setErroForm] = useState('')
  const [toastErro, setToastErro] = useState('')
  const [toastOk, setToastOk] = useState('')
  // avaliação médica
  const [avaliando, setAvaliando] = useState(false)
  const [obsForm, setObsForm] = useState('')
  const [reprovando, setReprovando] = useState(false)
  const [motivoRep, setMotivoRep] = useState('')
  const [erroMotivo, setErroMotivo] = useState('')
  const listRef = useRef<HTMLDivElement>(null)

  const recarregar = useCallback(async (pap: PapelDPS, uid: string) => {
    const dados = pap === 'medica'
      ? await listarSolicitacoesMinhaAgendaDPS(uid)
      : await listarSolicitacoesDPS()
    setLista(dados)
  }, [])

  useEffect(() => {
    let vivo = true
    ;(async () => {
      try {
        const { supabase } = await import('../lib/supabase')
        const { data: { user } } = await supabase.auth.getUser()
        const p = await meuPapelDPS()
        if (!vivo) return
        setPapel(p)
        setMeuId(user?.id ?? null)
        if (p) {
          await recarregar(p, user?.id ?? '')
          const ms = await listarMedicas()
          setMedicas(ms)
        }
      } catch (e) {
        if (vivo) setToastErro('Erro ao carregar: ' + String(e))
      } finally {
        if (vivo) setCarregando(false)
      }
    })()
    return () => { vivo = false }
  }, [recarregar])

  useEffect(() => {
    if (!papel || !meuId) return
    let timer: ReturnType<typeof setTimeout> | undefined
    const agendar = () => { clearTimeout(timer); timer = setTimeout(() => void recarregar(papel, meuId), 400) }
    const des = assinarSolicitacoesDPS(agendar)
    return () => { clearTimeout(timer); des() }
  }, [papel, meuId, recarregar])

  // ---- lista filtrada ----
  const listaFiltrada = useMemo(() => {
    let r = lista
    if (filtro !== 'todos') r = r.filter((s) => s.status === filtro)
    const t = busca.trim().toLowerCase()
    if (t) r = r.filter((s) =>
      [s.protocolo, s.nomeTitular, s.nomeCrianca, s.tipoPlano, s.medicaNome].join(' ').toLowerCase().includes(t)
    )
    return r
  }, [lista, filtro, busca])

  // ---- contadores por filtro ----
  const contadores = useMemo(() => {
    const m: Record<string, number> = { todos: lista.length }
    for (const s of lista) m[s.status] = (m[s.status] ?? 0) + 1
    return m
  }, [lista])

  // ---- abertura de novo formulário ----
  function abrirNovo() {
    setForm(FORM_VAZIO)
    setErroForm('')
    setCriando(true)
    setDetalhe(null)
  }

  // ---- abertura de edição ----
  function abrirEdicao(s: SolicitacaoDPS) {
    setForm({
      nomeTitular: s.nomeTitular,
      cpfTitular: s.cpfTitular,
      telefoneTitular: s.telefoneTitular,
      nomeCrianca: s.nomeCrianca,
      dataNascimento: s.dataNascimento ?? '',
      cpfCrianca: s.cpfCrianca,
      tipoPlano: s.tipoPlano,
      vigencia: s.vigencia ?? '',
      dataConsulta: s.dataConsulta ? s.dataConsulta.slice(0, 16) : '',
      medicaId: s.medicaId ?? '',
      medicaNome: s.medicaNome,
    })
    setErroForm('')
    setEditando(true)
  }

  // ---- salvar novo ----
  async function salvarNovo() {
    if (!form.nomeTitular.trim()) { setErroForm('Informe o nome do titular.'); return }
    if (!form.nomeCrianca.trim()) { setErroForm('Informe o nome da criança.'); return }
    if (!form.tipoPlano) { setErroForm('Selecione o tipo de plano.'); return }
    setErroForm('')
    setSalvando(true)
    try {
      if (form.medicaId && form.dataConsulta) {
        const conflito = await checarConflitoAgenda(form.medicaId, form.dataConsulta)
        if (conflito) { setErroForm('Conflito de agenda: a médica já tem consulta nesse horário (±30 min).'); setSalvando(false); return }
      }
      await criarSolicitacaoDPS({
        nomeTitular: form.nomeTitular, cpfTitular: form.cpfTitular,
        telefoneTitular: form.telefoneTitular, nomeCrianca: form.nomeCrianca,
        dataNascimento: form.dataNascimento || null, cpfCrianca: form.cpfCrianca,
        tipoPlano: form.tipoPlano, vigencia: form.vigencia || null,
        dataConsulta: form.dataConsulta ? new Date(form.dataConsulta).toISOString() : null,
        medicaId: form.medicaId || null,
        medicaNome: form.medicaId ? (medicas.find((m) => m.id === form.medicaId)?.nome ?? form.medicaNome) : '',
        status: form.dataConsulta ? 'agendado' : 'cadastro',
        observacao: '', motivoReprovacao: '',
      })
      setCriando(false)
      setToastOk('Solicitação criada com sucesso.')
      await recarregar(papel!, meuId!)
    } catch (e) {
      setToastErro('Erro ao salvar: ' + String(e))
    } finally {
      setSalvando(false)
    }
  }

  // ---- salvar edição ----
  async function salvarEdicao() {
    if (!detalhe) return
    if (!form.nomeTitular.trim()) { setErroForm('Informe o nome do titular.'); return }
    if (!form.nomeCrianca.trim()) { setErroForm('Informe o nome da criança.'); return }
    setErroForm('')
    setSalvando(true)
    try {
      if (form.medicaId && form.dataConsulta) {
        const conflito = await checarConflitoAgenda(form.medicaId, form.dataConsulta, detalhe.id)
        if (conflito) { setErroForm('Conflito de agenda: a médica já tem consulta nesse horário (±30 min).'); setSalvando(false); return }
      }
      const novoStatus: StatusDPS =
        detalhe.status === 'aprovado' || detalhe.status === 'reprovado'
          ? detalhe.status
          : form.dataConsulta ? 'agendado' : 'cadastro'
      await atualizarSolicitacaoDPS(detalhe.id, {
        nomeTitular: form.nomeTitular, cpfTitular: form.cpfTitular,
        telefoneTitular: form.telefoneTitular, nomeCrianca: form.nomeCrianca,
        dataNascimento: form.dataNascimento || null, cpfCrianca: form.cpfCrianca,
        tipoPlano: form.tipoPlano, vigencia: form.vigencia || null,
        dataConsulta: form.dataConsulta ? new Date(form.dataConsulta).toISOString() : null,
        medicaId: form.medicaId || null,
        medicaNome: form.medicaId ? (medicas.find((m) => m.id === form.medicaId)?.nome ?? form.medicaNome) : '',
        status: novoStatus,
      })
      setEditando(false)
      setDetalhe((prev) => prev ? { ...prev, ...form, status: novoStatus } : prev)
      setToastOk('Solicitação atualizada.')
      await recarregar(papel!, meuId!)
    } catch (e) {
      setToastErro('Erro ao salvar: ' + String(e))
    } finally {
      setSalvando(false)
    }
  }

  // ---- avaliação médica ----
  async function registrarAvaliacao(resultado: 'aprovado' | 'reprovado') {
    if (!detalhe) return
    if (resultado === 'reprovado' && !motivoRep.trim()) {
      setErroMotivo('Informe o motivo da reprovação.')
      return
    }
    setSalvando(true)
    try {
      await atualizarSolicitacaoDPS(detalhe.id, {
        status: resultado,
        observacao: obsForm,
        motivoReprovacao: resultado === 'reprovado' ? motivoRep : '',
      })
      setAvaliando(false)
      setReprovando(false)
      setObsForm('')
      setMotivoRep('')
      setErroMotivo('')
      setDetalhe((prev) => prev ? { ...prev, status: resultado, observacao: obsForm, motivoReprovacao: motivoRep } : prev)
      setToastOk(`Parecer registrado: ${resultado === 'aprovado' ? 'Aprovado' : 'Reprovado'}.`)
      await recarregar(papel!, meuId!)
    } catch (e) {
      setToastErro('Erro ao registrar: ' + String(e))
    } finally {
      setSalvando(false)
    }
  }

  // ---- iniciar avaliação (médica) ----
  async function iniciarAvaliacao() {
    if (!detalhe) return
    setSalvando(true)
    try {
      await atualizarSolicitacaoDPS(detalhe.id, { status: 'avaliacao' })
      setDetalhe((prev) => prev ? { ...prev, status: 'avaliacao' } : prev)
      setAvaliando(true)
      setObsForm(detalhe.observacao)
      await recarregar(papel!, meuId!)
    } catch (e) {
      setToastErro('Erro: ' + String(e))
    } finally {
      setSalvando(false)
    }
  }

  // ---- guards ----
  if (carregando) return <p className="admin-info">Carregando…</p>
  if (!papel) return (
    <div className="crm">
      <h2 className="admin-secao-titulo">Central DPS</h2>
      <p className="admin-info">Seu usuário não tem perfil no sistema DPS.</p>
      <p className="admin-info"><Link to={ROUTES.adminDpsUsuarios}>Gerenciar usuários DPS →</Link></p>
    </div>
  )

  const podeEditar = papel === 'admin' || papel === 'operador'
  const ehMedica   = papel === 'medica'

  // ================================================================
  // Renderização do formulário (criar/editar)
  // ================================================================
  if (criando || (editando && detalhe)) {
    const titulo = criando ? 'Nova solicitação DPS' : 'Editar solicitação'
    const fechar = () => { setCriando(false); setEditando(false) }
    const salvar = criando ? salvarNovo : salvarEdicao
    return (
      <div className="crm">
        <div className="crm-topo">
          <h2 className="admin-secao-titulo">{titulo}</h2>
          <button type="button" className="btn btn-ghost" onClick={fechar}>← Voltar</button>
        </div>

        {erroForm && <p className="erro admin-erro" role="alert">{erroForm}</p>}

        <div className="crm-form-scroll">
          <fieldset className="crm-fieldset">
            <legend>Titular / Responsável</legend>
            <div className="crm-campos">
              <div className="campo">
                <label>Nome completo <span className="crm-req">*</span></label>
                <input value={form.nomeTitular} onChange={(e) => setForm((f) => ({ ...f, nomeTitular: e.target.value }))} />
              </div>
              <div className="campo">
                <label>CPF / CNPJ</label>
                <input value={form.cpfTitular} onChange={(e) => setForm((f) => ({ ...f, cpfTitular: mascaraDocumento(e.target.value) }))} placeholder="000.000.000-00" />
              </div>
              <div className="campo">
                <label>Telefone</label>
                <input value={form.telefoneTitular} onChange={(e) => setForm((f) => ({ ...f, telefoneTitular: mascaraTelefone(e.target.value) }))} placeholder="(69) 99999-0000" />
              </div>
            </div>
          </fieldset>

          <fieldset className="crm-fieldset">
            <legend>Criança / Dependente</legend>
            <div className="crm-campos">
              <div className="campo">
                <label>Nome completo <span className="crm-req">*</span></label>
                <input value={form.nomeCrianca} onChange={(e) => setForm((f) => ({ ...f, nomeCrianca: e.target.value }))} />
              </div>
              <div className="campo">
                <label>Data de nascimento</label>
                <input type="date" value={form.dataNascimento} onChange={(e) => setForm((f) => ({ ...f, dataNascimento: e.target.value }))} />
              </div>
              <div className="campo">
                <label>CPF da criança</label>
                <input value={form.cpfCrianca} onChange={(e) => setForm((f) => ({ ...f, cpfCrianca: mascaraDocumento(e.target.value) }))} placeholder="000.000.000-00" />
              </div>
            </div>
          </fieldset>

          <fieldset className="crm-fieldset">
            <legend>Contrato</legend>
            <div className="crm-campos">
              <div className="campo">
                <label>Tipo de plano <span className="crm-req">*</span></label>
                <select value={form.tipoPlano} onChange={(e) => setForm((f) => ({ ...f, tipoPlano: e.target.value }))}>
                  <option value="">Selecione…</option>
                  {TIPOS_PLANO.map((t) => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div className="campo">
                <label>Vigência do contrato</label>
                <input type="date" value={form.vigencia} onChange={(e) => setForm((f) => ({ ...f, vigencia: e.target.value }))} />
              </div>
            </div>
          </fieldset>

          <fieldset className="crm-fieldset">
            <legend>Agendamento (opcional ao criar)</legend>
            <div className="crm-campos">
              <div className="campo">
                <label>Médica avaliadora</label>
                <select
                  value={form.medicaId}
                  onChange={(e) => setForm((f) => ({ ...f, medicaId: e.target.value }))}
                >
                  <option value="">Selecione…</option>
                  {medicas.map((m) => <option key={m.id} value={m.id}>{m.nome}</option>)}
                </select>
              </div>
              <div className="campo">
                <label>Data e hora da consulta</label>
                <input
                  type="datetime-local"
                  value={form.dataConsulta}
                  onChange={(e) => setForm((f) => ({ ...f, dataConsulta: e.target.value }))}
                />
              </div>
            </div>
          </fieldset>
        </div>

        <div className="crm-acoes-fixas">
          <button type="button" className="btn btn-ghost" onClick={fechar} disabled={salvando}>Cancelar</button>
          <button type="button" className="btn btn-primary" onClick={salvar} disabled={salvando}>
            {salvando ? 'Salvando…' : 'Salvar'}
          </button>
        </div>
      </div>
    )
  }

  // ================================================================
  // Renderização do detalhe
  // ================================================================
  if (detalhe) {
    const s = detalhe
    const et = etapaDPS(s.status)
    const podeIniciarAvaliacao = ehMedica && s.status === 'agendado'
    const podeEmitirParecer    = ehMedica && (s.status === 'agendado' || s.status === 'avaliacao')
    const podeEditarSol        = podeEditar && s.status !== 'aprovado' && s.status !== 'reprovado'

    return (
      <div className="crm">
        <div className="crm-topo">
          <div>
            <h2 className="admin-secao-titulo">{s.protocolo}</h2>
            <Badge status={s.status} />
          </div>
          <div className="crm-topo-acoes">
            {podeEditarSol && (
              <button type="button" className="btn btn-ghost" onClick={() => abrirEdicao(s)}>✏️ Editar</button>
            )}
            <button type="button" className="btn btn-ghost" onClick={() => setDetalhe(null)}>← Voltar</button>
          </div>
        </div>

        {/* Stepper */}
        <div className="crm-stepper">
          {ETAPAS_DPS.map((e, i) => {
            const idx = ETAPAS_DPS.findIndex((x) => x.chave === s.status)
            const feito = i < idx
            const atual = i === idx
            return (
              <div key={e.chave} className={`crm-step${feito ? ' feito' : ''}${atual ? ' atual' : ''}`}>
                <span className="crm-step-circulo">{feito ? '✓' : i + 1}</span>
                <span className="crm-step-label">{e.label}</span>
              </div>
            )
          })}
        </div>

        {/* Resultado: reprovado */}
        {s.status === 'reprovado' && s.motivoReprovacao && (
          <div className="crm-banner crm-banner-recusado">
            <strong>Reprovado</strong> — {s.motivoReprovacao}
          </div>
        )}
        {/* Resultado: aprovado */}
        {s.status === 'aprovado' && (
          <div className="crm-banner crm-banner-ok">
            <strong>Aprovado</strong>{s.observacao ? ` — ${s.observacao}` : ''}
          </div>
        )}

        {/* Dados */}
        <div className="crm-detalhe-grid">
          <section className="crm-bloco">
            <h4>Titular / Responsável</h4>
            <dl className="crm-dl">
              <dt>Nome</dt><dd>{s.nomeTitular}</dd>
              <dt>CPF</dt><dd>{s.cpfTitular || '—'}</dd>
              <dt>Telefone</dt><dd>{s.telefoneTitular || '—'}</dd>
            </dl>
          </section>

          <section className="crm-bloco">
            <h4>Criança / Dependente</h4>
            <dl className="crm-dl">
              <dt>Nome</dt><dd>{s.nomeCrianca}</dd>
              <dt>Nascimento</dt><dd>{s.dataNascimento ? new Date(s.dataNascimento + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}{s.dataNascimento && <span className="crm-sub"> ({idadeLabel(s.dataNascimento)})</span>}</dd>
              <dt>CPF</dt><dd>{s.cpfCrianca || '—'}</dd>
            </dl>
          </section>

          <section className="crm-bloco">
            <h4>Contrato</h4>
            <dl className="crm-dl">
              <dt>Tipo de plano</dt><dd>{s.tipoPlano}</dd>
              <dt>Vigência</dt><dd>{s.vigencia ? new Date(s.vigencia + 'T00:00:00').toLocaleDateString('pt-BR') : '—'}</dd>
            </dl>
          </section>

          <section className="crm-bloco">
            <h4>Consulta DPS</h4>
            <dl className="crm-dl">
              <dt>Médica</dt><dd>{s.medicaNome || '—'}</dd>
              <dt>Data / Hora</dt><dd>{s.dataConsulta ? new Date(s.dataConsulta).toLocaleString('pt-BR') : '—'}</dd>
              <dt>Cadastrado em</dt><dd>{new Date(s.criadoEm).toLocaleDateString('pt-BR')}</dd>
            </dl>
          </section>
        </div>

        {/* Zona de ação — médica */}
        {podeEmitirParecer && !avaliando && !reprovando && (
          <div className="crm-zona-acao dps-zona-acao">
            <p>Registre o parecer após a consulta:</p>
            <div className="crm-acoes-row">
              {podeIniciarAvaliacao && (
                <button type="button" className="btn btn-ghost" onClick={iniciarAvaliacao} disabled={salvando}>
                  Iniciar avaliação
                </button>
              )}
              <button type="button" className="btn btn-primary" onClick={() => { setAvaliando(true); setObsForm(s.observacao) }}>
                ✅ Aprovar
              </button>
              <button type="button" className="btn dps-btn-reprovar" onClick={() => setReprovando(true)}>
                ✖ Reprovar
              </button>
            </div>
          </div>
        )}

        {/* Modal de aprovação */}
        {avaliando && !reprovando && (
          <div className="crm-overlay">
            <div className="crm-modal-sm dps-modal-parecer">
              <h3>Aprovar solicitação</h3>
              <div className="campo">
                <label>Observações clínicas (opcional)</label>
                <textarea rows={4} value={obsForm} onChange={(e) => setObsForm(e.target.value)} placeholder="Registre observações relevantes…" />
              </div>
              <div className="crm-modal-acoes">
                <button type="button" className="btn btn-ghost" onClick={() => setAvaliando(false)} disabled={salvando}>Cancelar</button>
                <button type="button" className="btn btn-primary" onClick={() => registrarAvaliacao('aprovado')} disabled={salvando}>
                  {salvando ? 'Salvando…' : 'Confirmar aprovação'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de reprovação */}
        {reprovando && (
          <div className="crm-overlay">
            <div className="crm-modal-sm dps-modal-parecer">
              <h3>Reprovar solicitação</h3>
              <div className={`campo${erroMotivo ? ' tem-erro' : ''}`}>
                <label>Motivo da reprovação <span className="crm-req">*</span></label>
                <textarea
                  rows={4}
                  value={motivoRep}
                  onChange={(e) => { setMotivoRep(e.target.value); setErroMotivo('') }}
                  placeholder="Descreva o motivo clínico…"
                />
                {erroMotivo && <span className="erro" role="alert">{erroMotivo}</span>}
              </div>
              <div className="campo">
                <label>Observações adicionais (opcional)</label>
                <textarea rows={3} value={obsForm} onChange={(e) => setObsForm(e.target.value)} />
              </div>
              <div className="crm-modal-acoes">
                <button type="button" className="btn btn-ghost" onClick={() => { setReprovando(false); setErroMotivo('') }} disabled={salvando}>Cancelar</button>
                <button type="button" className="btn dps-btn-reprovar" onClick={() => registrarAvaliacao('reprovado')} disabled={salvando}>
                  {salvando ? 'Salvando…' : 'Confirmar reprovação'}
                </button>
              </div>
            </div>
          </div>
        )}

        {toastErro && <ToastErro msg={toastErro} onClose={() => setToastErro('')} />}
        {toastOk  && <ToastOk  msg={toastOk}  onClose={() => setToastOk('')}  />}
      </div>
    )
  }

  // ================================================================
  // Lista
  // ================================================================
  return (
    <div className="crm" ref={listRef}>
      <div className="crm-topo">
        <h2 className="admin-secao-titulo">Central DPS</h2>
        <div className="crm-topo-acoes">
          {papel === 'admin' && (
            <Link className="btn btn-ghost" to={ROUTES.adminDpsUsuarios}>👥 Usuários</Link>
          )}
          <Link className="btn btn-ghost" to={ROUTES.adminDpsPainel}>📊 Painel</Link>
          {podeEditar && (
            <button type="button" className="btn btn-primary" onClick={abrirNovo}>+ Nova solicitação</button>
          )}
        </div>
      </div>

      {/* Chips de filtro */}
      <div className="crm-filtros" role="group" aria-label="Filtrar por status">
        {FILTROS_DPS.map((f) => (
          <button
            key={f.chave}
            type="button"
            className={`crm-chip${filtro === f.chave ? ' ativo' : ''}${f.tom ? ` tom-${f.tom}` : ''}`}
            onClick={() => setFiltro(f.chave)}
          >
            {f.label}
            {contadores[f.chave] != null && (
              <span className="crm-chip-n">{contadores[f.chave]}</span>
            )}
          </button>
        ))}
      </div>

      {/* Busca */}
      <div className="crm-busca-wrap">
        <input
          type="search"
          className="crm-busca"
          placeholder="Buscar por protocolo, titular, criança, plano, médica…"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
      </div>

      {/* Tabela */}
      <div className="admin-tabela-wrap">
        <table className="admin-tabela crm-tabela">
          <thead>
            <tr>
              <th>Protocolo</th>
              <th>Titular</th>
              <th>Criança</th>
              <th>Plano</th>
              <th>Consulta</th>
              <th>Médica</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {listaFiltrada.length === 0 && (
              <tr>
                <td colSpan={7} className="admin-td-vazio">
                  {busca ? 'Nenhum resultado para a busca.' : 'Nenhuma solicitação no filtro selecionado.'}
                </td>
              </tr>
            )}
            {listaFiltrada.map((s) => (
              <tr
                key={s.id}
                className="crm-row"
                onClick={() => setDetalhe(s)}
                style={{ cursor: 'pointer' }}
              >
                <td><strong>{s.protocolo}</strong></td>
                <td>
                  <strong>{s.nomeTitular}</strong>
                  {s.telefoneTitular && <small>{s.telefoneTitular}</small>}
                </td>
                <td>
                  <strong>{s.nomeCrianca}</strong>
                  {s.dataNascimento && <small>{idadeLabel(s.dataNascimento)}</small>}
                </td>
                <td>{s.tipoPlano}</td>
                <td>{s.dataConsulta ? new Date(s.dataConsulta).toLocaleDateString('pt-BR') : <span className="crm-sub">—</span>}</td>
                <td>{s.medicaNome || <span className="crm-sub">—</span>}</td>
                <td><Badge status={s.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {toastErro && <ToastErro msg={toastErro} onClose={() => setToastErro('')} />}
      {toastOk  && <ToastOk  msg={toastOk}  onClose={() => setToastOk('')}  />}
    </div>
  )
}

// ================================================================
// Preview interno (dev apenas)
// ================================================================
export function __DPSPreview() {
  const [detalhe, setDetalhe] = useState<SolicitacaoDPS | null>(null)
  const [filtro, setFiltro] = useState('todos')
  const lista = SOLICITACOES_EXEMPLO
  const listaFiltrada = filtro === 'todos' ? lista : lista.filter((s) => s.status === filtro)
  const contadores: Record<string, number> = { todos: lista.length }
  for (const s of lista) contadores[s.status] = (contadores[s.status] ?? 0) + 1

  if (detalhe) {
    const s = detalhe
    return (
      <div className="crm" style={{ padding: 24 }}>
        <div className="crm-topo">
          <div><h2 className="admin-secao-titulo">{s.protocolo}</h2><Badge status={s.status} /></div>
          <button type="button" className="btn btn-ghost" onClick={() => setDetalhe(null)}>← Voltar</button>
        </div>
        <div className="crm-detalhe-grid">
          <section className="crm-bloco"><h4>Titular</h4><dl className="crm-dl"><dt>Nome</dt><dd>{s.nomeTitular}</dd><dt>Telefone</dt><dd>{s.telefoneTitular}</dd></dl></section>
          <section className="crm-bloco"><h4>Criança</h4><dl className="crm-dl"><dt>Nome</dt><dd>{s.nomeCrianca}</dd><dt>Idade</dt><dd>{idadeLabel(s.dataNascimento)}</dd></dl></section>
          <section className="crm-bloco"><h4>Contrato</h4><dl className="crm-dl"><dt>Plano</dt><dd>{s.tipoPlano}</dd><dt>Vigência</dt><dd>{s.vigencia ?? '—'}</dd></dl></section>
          <section className="crm-bloco"><h4>Consulta</h4><dl className="crm-dl"><dt>Médica</dt><dd>{s.medicaNome || '—'}</dd><dt>Data</dt><dd>{s.dataConsulta ? new Date(s.dataConsulta).toLocaleString('pt-BR') : '—'}</dd></dl></section>
        </div>
        {s.status === 'aprovado' && <div className="crm-banner crm-banner-ok"><strong>Aprovado</strong>{s.observacao ? ` — ${s.observacao}` : ''}</div>}
        {s.status === 'reprovado' && <div className="crm-banner crm-banner-recusado"><strong>Reprovado</strong> — {s.motivoReprovacao}</div>}
      </div>
    )
  }

  return (
    <div className="crm" style={{ padding: 24 }}>
      <div className="crm-topo"><h2 className="admin-secao-titulo">Central DPS</h2></div>
      <div className="crm-filtros">
        {FILTROS_DPS.map((f) => (
          <button key={f.chave} type="button" className={`crm-chip${filtro === f.chave ? ' ativo' : ''}${f.tom ? ` tom-${f.tom}` : ''}`} onClick={() => setFiltro(f.chave)}>
            {f.label}<span className="crm-chip-n">{contadores[f.chave] ?? 0}</span>
          </button>
        ))}
      </div>
      <div className="admin-tabela-wrap">
        <table className="admin-tabela crm-tabela"><thead><tr><th>Protocolo</th><th>Titular</th><th>Criança</th><th>Plano</th><th>Consulta</th><th>Status</th></tr></thead>
          <tbody>
            {listaFiltrada.map((s) => (
              <tr key={s.id} className="crm-row" onClick={() => setDetalhe(s)} style={{ cursor: 'pointer' }}>
                <td><strong>{s.protocolo}</strong></td>
                <td><strong>{s.nomeTitular}</strong></td>
                <td><strong>{s.nomeCrianca}</strong><small>{idadeLabel(s.dataNascimento)}</small></td>
                <td>{s.tipoPlano}</td>
                <td>{s.dataConsulta ? new Date(s.dataConsulta).toLocaleDateString('pt-BR') : '—'}</td>
                <td><Badge status={s.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
