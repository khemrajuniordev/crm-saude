import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ROUTES } from '../routes'
import {
  etapaDPS,
  ETAPAS_DPS,
  idadeLabel,
  ROTULO_STATUS,
  SOLICITACOES_EXEMPLO,
  type SolicitacaoDPS,
} from '../data/dps'
import {
  assinarSolicitacoesDPS,
  listarSolicitacoesDPS,
  meuPapelDPS,
} from '../data/dpsRepo'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'

const MESES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez']

function calcular(lista: SolicitacaoDPS[]) {
  const porStatus = { cadastro: 0, agendado: 0, avaliacao: 0, aprovado: 0, reprovado: 0 }
  for (const s of lista) porStatus[s.status]++

  const total = lista.length
  const aprovados  = porStatus.aprovado
  const reprovados = porStatus.reprovado
  const decididas  = aprovados + reprovados
  const taxaAprov  = decididas ? Math.round((aprovados / decididas) * 100) : 0
  const pendentes  = total - aprovados - reprovados

  // últimos 6 meses
  const hoje = new Date()
  const buckets: { rotulo: string; chave: string; aprovados: number; reprovados: number }[] = []
  for (let i = 5; i >= 0; i--) {
    const d = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1)
    buckets.push({ rotulo: MESES[d.getMonth()], chave: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`, aprovados: 0, reprovados: 0 })
  }
  for (const s of lista) {
    if (s.atualizadoEm) {
      const b = buckets.find((x) => x.chave === s.atualizadoEm.slice(0,7))
      if (b) {
        if (s.status === 'aprovado')  b.aprovados++
        if (s.status === 'reprovado') b.reprovados++
      }
    }
  }

  // top médicas
  const porMedica = new Map<string, number>()
  for (const s of lista) if (s.medicaNome) porMedica.set(s.medicaNome, (porMedica.get(s.medicaNome) ?? 0) + 1)
  const topMedicas = [...porMedica.entries()].sort((a,b) => b[1]-a[1]).slice(0,5).map(([nome,n]) => ({ nome, n }))

  // top planos
  const porPlano = new Map<string, number>()
  for (const s of lista) if (s.tipoPlano) porPlano.set(s.tipoPlano, (porPlano.get(s.tipoPlano) ?? 0) + 1)
  const topPlanos = [...porPlano.entries()].sort((a,b) => b[1]-a[1]).map(([nome,n]) => ({ nome, n }))

  // próximas consultas (7 dias)
  const em7dias = new Date(hoje.getTime() + 7 * 86400000)
  const proximas = lista
    .filter((s) => s.dataConsulta && new Date(s.dataConsulta) >= hoje && new Date(s.dataConsulta) <= em7dias)
    .sort((a,b) => (a.dataConsulta ?? '') < (b.dataConsulta ?? '') ? -1 : 1)
    .slice(0, 10)

  return { total, porStatus, aprovados, reprovados, decididas, taxaAprov, pendentes, buckets, topMedicas, topPlanos, proximas }
}

const CORES_STATUS: Record<string, string> = {
  cadastro:  'var(--tom-aguardando)',
  agendado:  'var(--tom-analise)',
  avaliacao: 'var(--tom-agendado)',
  aprovado:  'var(--tom-ok)',
  reprovado: 'var(--tom-recusado)',
}

export default function AdminDPSPainel() {
  const [papel, setPapel] = useState<string | null>(null)
  const [lista, setLista] = useState<SolicitacaoDPS[]>([])
  const [carregando, setCarregando] = useState(true)

  const recarregar = useCallback(async () => {
    const dados = await listarSolicitacoesDPS()
    setLista(dados)
  }, [])

  useEffect(() => {
    let vivo = true
    ;(async () => {
      try {
        const p = await meuPapelDPS()
        if (!vivo) return
        setPapel(p)
        if (p) await recarregar()
      } finally {
        if (vivo) setCarregando(false)
      }
    })()
    return () => { vivo = false }
  }, [recarregar])

  useEffect(() => {
    if (!papel) return
    let timer: ReturnType<typeof setTimeout> | undefined
    const des = assinarSolicitacoesDPS(() => { clearTimeout(timer); timer = setTimeout(() => void recarregar(), 400) })
    return () => { clearTimeout(timer); des() }
  }, [papel, recarregar])

  const m = useMemo(() => calcular(lista), [lista])

  if (carregando) return <p className="admin-info">Carregando painel…</p>
  if (!papel) return (
    <div className="crm">
      <p className="admin-info">Acesso restrito.</p>
      <Link to={ROUTES.adminDps} className="btn btn-ghost">← Voltar</Link>
    </div>
  )

  const maxBar = Math.max(1, ...m.topMedicas.map((t) => t.n))
  const maxPlano = Math.max(1, ...m.topPlanos.map((t) => t.n))
  const maxBucket = Math.max(1, ...m.buckets.flatMap((b) => [b.aprovados, b.reprovados]))

  const barra = (valor: number, max: number, cor: string, delay = 0) => (
    <span className="pnl-track">
      <span className="pnl-fill" style={{ width: `${(valor/max)*100}%`, background: cor, animationDelay: `${delay}ms` }} />
    </span>
  )

  return (
    <div className="crm pnl">
      <div className="crm-topo">
        <h2 className="admin-secao-titulo">DPS · Painel</h2>
        <Link className="btn btn-ghost" to={ROUTES.adminDps}>← Voltar ao DPS</Link>
      </div>

      {/* KPIs */}
      <div className="pnl-kpis">
        <div className="pnl-kpi"><span className="pnl-kpi-lab">Total de solicitações</span><span className="pnl-kpi-num">{m.total}</span></div>
        <div className="pnl-kpi"><span className="pnl-kpi-lab">Aprovados</span><span className="pnl-kpi-num" style={{ color: 'var(--tom-ok)' }}>{m.aprovados}</span></div>
        <div className="pnl-kpi"><span className="pnl-kpi-lab">Reprovados</span><span className="pnl-kpi-num" style={{ color: 'var(--tom-recusado)' }}>{m.reprovados}</span></div>
        <div className="pnl-kpi"><span className="pnl-kpi-lab">Taxa de aprovação</span><span className="pnl-kpi-num">{m.taxaAprov}%</span></div>
        <div className="pnl-kpi"><span className="pnl-kpi-lab">Pendentes</span><span className="pnl-kpi-num">{m.pendentes}</span></div>
      </div>

      <div className="pnl-grid">
        {/* Rosca por status */}
        <section className="pnl-card">
          <h3>Distribuição por status</h3>
          <p className="pnl-cap">Situação atual das {m.total} solicitações</p>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <ResponsiveContainer width={140} height={140}>
              <PieChart>
                <Pie
                  data={ETAPAS_DPS.map((e) => ({ name: ROTULO_STATUS[e.chave], value: m.porStatus[e.chave] }))}
                  cx="50%" cy="50%" innerRadius={35} outerRadius={60}
                  startAngle={90} endAngle={-270} dataKey="value"
                  isAnimationActive animationDuration={900} strokeWidth={0}
                >
                  {ETAPAS_DPS.map((e) => <Cell key={e.chave} fill={CORES_STATUS[e.chave]} />)}
                </Pie>
                <Tooltip formatter={(v: number, name: string) => [v, name]} contentStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {ETAPAS_DPS.map((e) => (
                <div key={e.chave} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: CORES_STATUS[e.chave], flexShrink: 0 }} />
                  <span>{e.label}</span>
                  <strong style={{ marginLeft: 'auto', paddingLeft: 8 }}>{m.porStatus[e.chave]}</strong>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Resultados por mês */}
        <section className="pnl-card">
          <h3>Resultados por mês</h3>
          <p className="pnl-cap">Aprovados vs reprovados — últimos 6 meses</p>
          <div className="pnl-hbars">
            {m.buckets.map((b, i) => (
              <div key={b.chave}>
                <div className="pnl-hbar">
                  <span className="pnl-n" style={{ width: 36 }}>{b.rotulo}</span>
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <span className="pnl-track" style={{ height: 8 }}>
                      <span className="pnl-fill" style={{ width: `${(b.aprovados/maxBucket)*100}%`, background: 'var(--tom-ok)', animationDelay: `${i*60}ms` }} />
                    </span>
                    <span className="pnl-track" style={{ height: 8 }}>
                      <span className="pnl-fill" style={{ width: `${(b.reprovados/maxBucket)*100}%`, background: 'var(--tom-recusado)', animationDelay: `${i*60+30}ms` }} />
                    </span>
                  </div>
                  <span className="pnl-v" style={{ fontSize: 11 }}>{b.aprovados}/{b.reprovados}</span>
                </div>
              </div>
            ))}
            <div style={{ display: 'flex', gap: 12, fontSize: 11, marginTop: 4 }}>
              <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: 'var(--tom-ok)', marginRight: 4 }} />Aprovados</span>
              <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: 'var(--tom-recusado)', marginRight: 4 }} />Reprovados</span>
            </div>
          </div>
        </section>

        {/* Top médicas */}
        <section className="pnl-card">
          <h3>Consultas por médica</h3>
          <p className="pnl-cap">Médicas com mais avaliações</p>
          <div className="pnl-hbars">
            {m.topMedicas.length === 0 && <p className="crm-aviso">Sem dados.</p>}
            {m.topMedicas.map((t, i) => (
              <div className="pnl-hbar" key={t.nome}>
                <span className="pnl-n">{t.nome}</span>
                {barra(t.n, maxBar, 'var(--blue-500)', i * 80)}
                <span className="pnl-v">{t.n}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Top planos */}
        <section className="pnl-card">
          <h3>Solicitações por plano</h3>
          <p className="pnl-cap">Distribuição por tipo de plano</p>
          <div className="pnl-hbars">
            {m.topPlanos.map((t, i) => (
              <div className="pnl-hbar" key={t.nome}>
                <span className="pnl-n">{t.nome}</span>
                {barra(t.n, maxPlano, 'var(--blue-400)', i * 80)}
                <span className="pnl-v">{t.n}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Próximas consultas */}
      {m.proximas.length > 0 && (
        <section className="pnl-card pnl-tabela" style={{ marginTop: 20 }}>
          <h3>Próximas consultas (7 dias)</h3>
          <p className="pnl-cap">Agendamentos confirmados para os próximos dias</p>
          <div className="admin-tabela-wrap">
            <table className="admin-tabela crm-tabela">
              <thead><tr><th>Data / Hora</th><th>Criança</th><th>Titular</th><th>Médica</th><th>Status</th></tr></thead>
              <tbody>
                {m.proximas.map((s) => (
                  <tr key={s.id}>
                    <td><strong>{new Date(s.dataConsulta!).toLocaleString('pt-BR')}</strong></td>
                    <td>{s.nomeCrianca}<small>{idadeLabel(s.dataNascimento)}</small></td>
                    <td>{s.nomeTitular}</td>
                    <td>{s.medicaNome || '—'}</td>
                    <td><span className={`crm-badge tom-${etapaDPS(s.status).tom}`}>{etapaDPS(s.status).label}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  )
}

/* PREVIEW TEMPORARIO */
export function __DPSPainelPreview() {
  const lista = SOLICITACOES_EXEMPLO
  const m = calcular(lista)
  const maxBar = Math.max(1, ...m.topMedicas.map((t) => t.n))
  const barra = (valor: number, max: number, cor: string, delay = 0) => (
    <span className="pnl-track"><span className="pnl-fill" style={{ width: `${(valor/max)*100}%`, background: cor, animationDelay: `${delay}ms` }} /></span>
  )
  return (
    <div className="crm pnl" style={{ padding: 24 }}>
      <h2 className="admin-secao-titulo">DPS · Painel</h2>
      <div className="pnl-kpis">
        <div className="pnl-kpi"><span className="pnl-kpi-lab">Total</span><span className="pnl-kpi-num">{m.total}</span></div>
        <div className="pnl-kpi"><span className="pnl-kpi-lab">Aprovados</span><span className="pnl-kpi-num" style={{ color: 'var(--tom-ok)' }}>{m.aprovados}</span></div>
        <div className="pnl-kpi"><span className="pnl-kpi-lab">Reprovados</span><span className="pnl-kpi-num" style={{ color: 'var(--tom-recusado)' }}>{m.reprovados}</span></div>
        <div className="pnl-kpi"><span className="pnl-kpi-lab">Taxa</span><span className="pnl-kpi-num">{m.taxaAprov}%</span></div>
        <div className="pnl-kpi"><span className="pnl-kpi-lab">Pendentes</span><span className="pnl-kpi-num">{m.pendentes}</span></div>
      </div>
      <div className="pnl-grid">
        <section className="pnl-card">
          <h3>Distribuição por status</h3>
          <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
            <ResponsiveContainer width={140} height={140}>
              <PieChart>
                <Pie data={ETAPAS_DPS.map((e) => ({ name: ROTULO_STATUS[e.chave], value: m.porStatus[e.chave] }))} cx="50%" cy="50%" innerRadius={35} outerRadius={60} startAngle={90} endAngle={-270} dataKey="value" isAnimationActive animationDuration={900} strokeWidth={0}>
                  {ETAPAS_DPS.map((e) => <Cell key={e.chave} fill={CORES_STATUS[e.chave]} />)}
                </Pie>
                <Tooltip formatter={(v: number, name: string) => [v, name]} contentStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {ETAPAS_DPS.map((e) => (
                <div key={e.chave} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: CORES_STATUS[e.chave], flexShrink: 0 }} />
                  <span>{e.label}</span>
                  <strong style={{ marginLeft: 'auto', paddingLeft: 8 }}>{m.porStatus[e.chave]}</strong>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="pnl-card">
          <h3>Consultas por médica</h3>
          <div className="pnl-hbars">
            {m.topMedicas.map((t, i) => <div className="pnl-hbar" key={t.nome}><span className="pnl-n">{t.nome}</span>{barra(t.n, maxBar, 'var(--blue-500)', i * 80)}<span className="pnl-v">{t.n}</span></div>)}
          </div>
        </section>
      </div>
    </div>
  )
}
/* FIM PREVIEW */
