import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ROUTES } from '../routes'
import {
  alternarAtivoPerfil,
  listarPerfis,
  meuPapelDPS,
  salvarPerfil,
  type PerfilDPS,
} from '../data/dpsRepo'
import type { PapelDPS } from '../data/dps'

const PAPEIS: { chave: PapelDPS; label: string }[] = [
  { chave: 'admin',    label: 'Administrador' },
  { chave: 'operador', label: 'Operador / Atendimento' },
  { chave: 'medica',   label: 'Médica Avaliadora' },
]

export default function AdminDPSUsuarios() {
  const [papel, setPapel] = useState<PapelDPS | null>(null)
  const [lista, setLista] = useState<PerfilDPS[]>([])
  const [carregando, setCarregando] = useState(true)
  const [toastErro, setToastErro] = useState('')
  const [toastOk, setToastOk] = useState('')
  const [conviteId, setConviteId] = useState('')
  const [conviteNome, setConviteNome] = useState('')
  const [convitePapel, setConvitePapel] = useState<PapelDPS>('operador')
  const [salvando, setSalvando] = useState(false)
  const [erroConvite, setErroConvite] = useState('')

  useEffect(() => {
    ;(async () => {
      try {
        const p = await meuPapelDPS()
        setPapel(p)
        if (p === 'admin') {
          const l = await listarPerfis()
          setLista(l)
        }
      } catch (e) {
        setToastErro('Erro: ' + String(e))
      } finally {
        setCarregando(false)
      }
    })()
  }, [])

  async function recarregar() {
    const l = await listarPerfis()
    setLista(l)
  }

  async function salvar() {
    if (!conviteId.trim()) { setErroConvite('Informe o ID do usuário (UUID do Supabase Auth).'); return }
    if (!conviteNome.trim()) { setErroConvite('Informe o nome.'); return }
    setErroConvite('')
    setSalvando(true)
    try {
      await salvarPerfil(conviteId.trim(), conviteNome.trim(), convitePapel)
      setConviteId(''); setConviteNome(''); setConvitePapel('operador')
      setToastOk('Usuário salvo com sucesso.')
      await recarregar()
    } catch (e) {
      setToastErro('Erro: ' + String(e))
    } finally {
      setSalvando(false)
    }
  }

  async function alternar(p: PerfilDPS) {
    try {
      await alternarAtivoPerfil(p.id, !p.ativo)
      setToastOk(`Usuário ${p.ativo ? 'desativado' : 'ativado'}.`)
      await recarregar()
    } catch (e) {
      setToastErro('Erro: ' + String(e))
    }
  }

  if (carregando) return <p className="admin-info">Carregando…</p>
  if (papel !== 'admin') return (
    <div className="crm">
      <p className="admin-info">Acesso restrito ao administrador.</p>
      <Link to={ROUTES.adminDps} className="btn btn-ghost">← Voltar ao DPS</Link>
    </div>
  )

  return (
    <div className="crm">
      <div className="crm-topo">
        <h2 className="admin-secao-titulo">DPS · Usuários</h2>
        <Link to={ROUTES.adminDps} className="btn btn-ghost">← Voltar</Link>
      </div>

      {/* Formulário de adição */}
      <section className="crm-bloco" style={{ marginBottom: 24 }}>
        <h4>Adicionar / atualizar usuário</h4>
        <p className="pnl-cap">Cole o UUID do usuário gerado no Supabase Auth (Auth → Users).</p>
        {erroConvite && <p className="erro" role="alert">{erroConvite}</p>}
        <div className="crm-campos">
          <div className="campo">
            <label>UUID do usuário</label>
            <input value={conviteId} onChange={(e) => setConviteId(e.target.value)} placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" />
          </div>
          <div className="campo">
            <label>Nome</label>
            <input value={conviteNome} onChange={(e) => setConviteNome(e.target.value)} placeholder="Nome completo" />
          </div>
          <div className="campo">
            <label>Perfil</label>
            <select value={convitePapel} onChange={(e) => setConvitePapel(e.target.value as PapelDPS)}>
              {PAPEIS.map((p) => <option key={p.chave} value={p.chave}>{p.label}</option>)}
            </select>
          </div>
        </div>
        <button type="button" className="btn btn-primary" onClick={salvar} disabled={salvando}>
          {salvando ? 'Salvando…' : 'Salvar usuário'}
        </button>
      </section>

      {/* Lista de usuários */}
      <div className="admin-tabela-wrap">
        <table className="admin-tabela crm-tabela">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Perfil</th>
              <th>Status</th>
              <th>Ação</th>
            </tr>
          </thead>
          <tbody>
            {lista.length === 0 && (
              <tr><td colSpan={4} className="admin-td-vazio">Nenhum usuário cadastrado.</td></tr>
            )}
            {lista.map((u) => (
              <tr key={u.id}>
                <td><strong>{u.nome}</strong><small style={{ display: 'block', color: 'var(--text-dim)', fontSize: 11 }}>{u.id}</small></td>
                <td>{PAPEIS.find((p) => p.chave === u.papel)?.label ?? u.papel}</td>
                <td>
                  <span className={`crm-badge ${u.ativo ? 'tom-ok' : 'tom-recusado'}`}>
                    {u.ativo ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td>
                  <button type="button" className="btn btn-ghost" style={{ fontSize: 13 }} onClick={() => alternar(u)}>
                    {u.ativo ? 'Desativar' : 'Ativar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {toastErro && (
        <div className="crm-toast-erro" role="alert">
          <span>{toastErro}</span>
          <button type="button" onClick={() => setToastErro('')} aria-label="Fechar">×</button>
        </div>
      )}
      {toastOk && (
        <div className="crm-toast-ok" role="status">
          <span>{toastOk}</span>
          <button type="button" onClick={() => setToastOk('')} aria-label="Fechar">×</button>
        </div>
      )}
    </div>
  )
}
