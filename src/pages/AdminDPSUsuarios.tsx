import { useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ROUTES } from '../routes'
import { type PapelDPS } from '../data/dps'
import {
  atualizarUsuarioDPS,
  convidarUsuarioDPS,
  listarPerfis,
  meuIdDPS,
  meuPapelDPS,
  redefinirSenhaDPS,
  removerUsuarioDPS,
  type PerfilDPS,
} from '../data/dpsRepo'

const PAPEIS: { chave: PapelDPS; label: string }[] = [
  { chave: 'admin',    label: 'Administrador' },
  { chave: 'operador', label: 'Operador / Atendimento' },
  { chave: 'medica',   label: 'Médica Avaliadora' },
]

type FormNovo = { nome: string; email: string; papel: PapelDPS }
const FORM_VAZIO: FormNovo = { nome: '', email: '', papel: 'operador' }

export default function AdminDPSUsuarios() {
  const [papel, setPapel]           = useState<PapelDPS | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [lista, setLista]           = useState<PerfilDPS[]>([])
  const [form, setForm]             = useState<FormNovo | null>(null)
  const [salvando, setSalvando]     = useState(false)
  const [erro, setErro]             = useState('')
  const [aviso, setAviso]           = useState('')
  const [meuId, setMeuId]           = useState<string | null>(null)
  const [ocupado, setOcupado]       = useState<string | null>(null)

  useEffect(() => {
    let vivo = true
    ;(async () => {
      try {
        const [p, id] = await Promise.all([meuPapelDPS(), meuIdDPS()])
        if (!vivo) return
        setPapel(p)
        setMeuId(id)
        if (p === 'admin') {
          const us = await listarPerfis()
          if (vivo) setLista(us)
        }
      } catch (e) {
        if (vivo) setErro('Falha ao carregar usuários: ' + String(e))
      } finally {
        if (vivo) setCarregando(false)
      }
    })()
    return () => { vivo = false }
  }, [])

  const alternarAtivo = async (u: PerfilDPS) => {
    setErro('')
    try {
      const novo = await atualizarUsuarioDPS(u.id, { ativo: !u.ativo })
      setLista((atual) => atual.map((x) => (x.id === u.id ? novo : x)))
    } catch (e) { setErro(String(e)) }
  }

  const mudarPapel = async (u: PerfilDPS, novoPapel: PapelDPS) => {
    setErro('')
    try {
      const novo = await atualizarUsuarioDPS(u.id, { papel: novoPapel })
      setLista((atual) => atual.map((x) => (x.id === u.id ? novo : x)))
    } catch (e) { setErro(String(e)) }
  }

  const redefinir = async (u: PerfilDPS) => {
    if (!confirm(`Enviar uma nova senha provisória para ${u.nome || u.email}?`)) return
    setErro(''); setAviso(''); setOcupado(u.id)
    try {
      await redefinirSenhaDPS(u.id)
      setAviso(`Nova senha provisória enviada para ${u.email}.`)
    } catch (e) { setErro(String(e)) } finally { setOcupado(null) }
  }

  const remover = async (u: PerfilDPS) => {
    if (!confirm(`Remover ${u.nome || u.email}? O acesso dessa pessoa será apagado.`)) return
    setErro(''); setAviso(''); setOcupado(u.id)
    try {
      await removerUsuarioDPS(u.id)
      setLista((atual) => atual.filter((x) => x.id !== u.id))
      setAviso(`${u.nome || u.email} foi removido.`)
    } catch (e) { setErro(String(e)) } finally { setOcupado(null) }
  }

  const criar = async (e: FormEvent) => {
    e.preventDefault()
    if (!form) return
    setErro(''); setAviso(''); setSalvando(true)
    try {
      const novo = await convidarUsuarioDPS(form.nome.trim(), form.email.trim(), form.papel)
      setLista((atual) => [...atual, novo])
      setForm(null)
      setAviso(`Acesso enviado para ${novo.email} (e-mail com a senha provisória).`)
    } catch (err) {
      setErro('Não foi possível convidar: ' + String(err))
    } finally { setSalvando(false) }
  }

  if (carregando) return <p className="admin-info">Carregando usuários…</p>

  if (papel !== 'admin') {
    return (
      <div className="crm">
        <h2 className="admin-secao-titulo">DPS · Usuários</h2>
        <p className="admin-info">Área restrita a administradores do DPS.</p>
      </div>
    )
  }

  return (
    <div className="crm">
      <div className="crm-topo">
        <h2 className="admin-secao-titulo">DPS · Usuários</h2>
        <Link className="btn btn-ghost" to={ROUTES.adminDps}>← Voltar ao DPS</Link>
      </div>

      {erro && (
        <div className="crm-toast-erro" role="alert">
          <span>{erro}</span>
          <button type="button" onClick={() => setErro('')} aria-label="Fechar">×</button>
        </div>
      )}
      {aviso && (
        <div className="crm-toast-ok" role="status">
          <span>{aviso}</span>
          <button type="button" onClick={() => setAviso('')} aria-label="Fechar">×</button>
        </div>
      )}

      <div className="admin-barra">
        <p className="rede-contagem"><strong>{lista.length}</strong> usuários</p>
        <button type="button" className="btn btn-primary" onClick={() => setForm(FORM_VAZIO)}>
          + Novo usuário
        </button>
      </div>

      <div className="admin-tabela-wrap">
        <table className="admin-tabela crm-tabela">
          <thead>
            <tr>
              <th>Nome</th>
              <th>E-mail</th>
              <th>Papel</th>
              <th>Ativo</th>
              <th aria-label="Ações" />
            </tr>
          </thead>
          <tbody>
            {lista.length === 0 && (
              <tr><td colSpan={5} className="admin-td-vazio">Nenhum usuário cadastrado ainda.</td></tr>
            )}
            {lista.map((u) => (
              <tr key={u.id}>
                <td><strong>{u.nome || '—'}</strong></td>
                <td>{u.email}</td>
                <td>
                  <select
                    className="crm-sel-papel"
                    value={u.papel}
                    onChange={(e) => mudarPapel(u, e.target.value as PapelDPS)}
                  >
                    {PAPEIS.map((p) => (
                      <option key={p.chave} value={p.chave}>{p.label}</option>
                    ))}
                  </select>
                </td>
                <td>
                  <button
                    type="button"
                    className={`crm-switch${u.ativo ? ' on' : ''}`}
                    role="switch"
                    aria-checked={u.ativo}
                    aria-label={u.ativo ? 'Desativar' : 'Ativar'}
                    onClick={() => alternarAtivo(u)}
                  >
                    <span />
                  </button>
                </td>
                <td className="admin-td-acoes">
                  <button
                    type="button"
                    className="admin-link"
                    disabled={ocupado === u.id}
                    onClick={() => redefinir(u)}
                  >
                    Redefinir senha
                  </button>
                  {u.id !== meuId && (
                    <button
                      type="button"
                      className="admin-link admin-link-danger"
                      disabled={ocupado === u.id}
                      onClick={() => remover(u)}
                    >
                      Remover
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {form && (
        <div className="crm-overlay" role="dialog" aria-modal="true" onClick={() => setForm(null)}>
          <form className="crm-modal" onClick={(e) => e.stopPropagation()} onSubmit={criar}>
            <h3>Novo usuário</h3>
            <div className="campo">
              <label htmlFor="u-nome">Nome</label>
              <input id="u-nome" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} required />
            </div>
            <div className="campo">
              <label htmlFor="u-email">E-mail (login)</label>
              <input id="u-email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
            </div>
            <div className="campo">
              <label htmlFor="u-papel">Papel</label>
              <select id="u-papel" value={form.papel} onChange={(e) => setForm({ ...form, papel: e.target.value as PapelDPS })}>
                {PAPEIS.map((p) => <option key={p.chave} value={p.chave}>{p.label}</option>)}
              </select>
            </div>
            <p className="crm-aviso">
              Ao criar, o usuário recebe um e-mail com uma senha provisória e já entra em /admin com o papel escolhido.
            </p>
            <div className="crm-modal-acoes">
              <button type="button" className="btn btn-ghost" onClick={() => setForm(null)}>Cancelar</button>
              <button type="submit" className="btn btn-primary" disabled={salvando}>
                {salvando ? 'Enviando…' : 'Criar e convidar'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}
