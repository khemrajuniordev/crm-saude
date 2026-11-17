import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  etapaAtual,
  formatarData,
  formatarValor,
  SOLICITACOES_EXEMPLO,
  type SolicitacaoCRM,
} from '../data/crm'
import { ROUTES } from '../routes'

type Periodo = '30d' | '90d' | 'ano'
type AbaDemonstracao = 'painel' | 'solicitacoes'

const periodos: { valor: Periodo; rotulo: string; dias: number }[] = [
  { valor: '30d', rotulo: '30 dias', dias: 30 },
  { valor: '90d', rotulo: '90 dias', dias: 90 },
  { valor: 'ano', rotulo: 'Ano', dias: 365 },
]

const filtros = [
  'Todas',
  'Reembolsos',
  'Aguardando enfermagem',
  'Aguardando financeiro',
  'Pagamento agendado',
  'Pago',
  'Não autorizado',
]

function dentroDoPeriodo(solicitacao: SolicitacaoCRM, dias: number) {
  const inicio = new Date()
  inicio.setDate(inicio.getDate() - dias)
  return solicitacao.abertura >= inicio.toISOString().slice(0, 10)
}

function valorClasseEtapa(etapa: string) {
  switch (etapa) {
    case 'Aguardando enfermagem':
      return 'nursing'
    case 'Aguardando financeiro':
      return 'finance'
    case 'Pagamento agendado':
      return 'scheduled'
    case 'Pago':
      return 'paid'
    case 'Não autorizado':
      return 'denied'
    default:
      return 'default'
  }
}

export default function LandingPage() {
  const [periodo, setPeriodo] = useState<Periodo>('90d')
  const [aba, setAba] = useState<AbaDemonstracao>('painel')
  const [filtro, setFiltro] = useState('Todas')
  const [busca, setBusca] = useState('')

  const diasPeriodo = periodos.find((item) => item.valor === periodo)?.dias ?? 90
  const solicitacoesPeriodo = useMemo(
    () => SOLICITACOES_EXEMPLO.filter((item) => dentroDoPeriodo(item, diasPeriodo)),
    [diasPeriodo],
  )

  const indicadores = useMemo(() => {
    const porEtapa = (etapa: string) =>
      solicitacoesPeriodo.filter((item) => etapaAtual(item).label === etapa).length
    const totalAutorizado = solicitacoesPeriodo
      .filter((item) => item.autorizacao === 'sim' && item.statusFinanceiro !== 'Recusado')
      .reduce((total, item) => total + (item.valorSolicitado ?? 0), 0)
    const totalPendente = solicitacoesPeriodo
      .filter((item) => item.autorizacao === 'sim' && item.statusFinanceiro !== 'Pago')
      .reduce((total, item) => total + (item.valorSolicitado ?? 0), 0)
    const totalPago = solicitacoesPeriodo
      .filter((item) => item.statusFinanceiro === 'Pago')
      .reduce((total, item) => total + (item.valorSolicitado ?? 0), 0)

    return {
      enfermagem: porEtapa('Aguardando enfermagem'),
      financeiro: porEtapa('Aguardando financeiro'),
      agendado: porEtapa('Pagamento agendado'),
      pago: porEtapa('Pago'),
      recusado: porEtapa('Não autorizado'),
      totalAutorizado,
      totalPendente,
      totalPago,
    }
  }, [solicitacoesPeriodo])

  const solicitacoesFiltradas = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase('pt-BR')
    return SOLICITACOES_EXEMPLO.filter((item) => {
      const etapa = etapaAtual(item).label
      const combinaFiltro =
        filtro === 'Todas' ||
        (filtro === 'Reembolsos' && item.tipo === 'reembolso') ||
        etapa === filtro
      const combinaBusca =
        !termo ||
        [item.protocolo, item.beneficiario, item.solicitante, item.procedimento]
          .join(' ')
          .toLocaleLowerCase('pt-BR')
          .includes(termo)
      return combinaFiltro && combinaBusca
    })
  }, [busca, filtro])

  const solicitantes = useMemo(() => {
    const totais = new Map<string, number>()
    for (const item of solicitacoesPeriodo) {
      totais.set(item.solicitante, (totais.get(item.solicitante) ?? 0) + 1)
    }
    return [...totais.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3)
  }, [solicitacoesPeriodo])

  const maxSolicitante = Math.max(1, ...solicitantes.map(([, total]) => total))

  return (
    <main className="landing-page lp-page">
      <header className="lp-header">
        <div className="lp-shell lp-header-inner">
          <a className="lp-brand" href="#inicio" aria-label="CRM Saúde, início">
            <span>Operadora de saúde</span>
            <strong>CRM Saúde</strong>
          </a>

          <nav className="lp-nav" aria-label="Navegação principal">
            <a href="#funcionalidades">Funcionalidades</a>
            <a href="#demonstracao">Demonstração</a>
            <a href="#como-funciona">Como funciona</a>
            <a href="#indicadores">Indicadores</a>
          </nav>

          <div className="lp-header-actions">
            <Link to={ROUTES.login} className="lp-button lp-button-outline lp-button-compact">
              Entrar
            </Link>
            <Link to={ROUTES.cadastro} className="lp-button lp-button-primary lp-button-compact">
              Cadastrar
            </Link>
          </div>
        </div>
      </header>

      <section className="lp-hero" id="inicio">
        <div className="lp-shell lp-hero-grid">
          <div className="lp-hero-copy">
            <span className="lp-eyebrow">Centralize solicitações e pagamentos</span>
            <h1>Você no controle do atendimento médico e financeiro do CRM.</h1>
            <p>
              Acompanhe solicitações, resolva pendências com agilidade e mantenha cada etapa do
              processo organizada em um único ambiente.
            </p>
            <div className="lp-actions">
              <Link to={ROUTES.crm} className="lp-button lp-button-primary">
                Acessar CRM
                <span aria-hidden="true">→</span>
              </Link>
              <Link to={ROUTES.cadastro} className="lp-button lp-button-outline">
                Criar conta
              </Link>
            </div>
            <ul className="lp-highlights">
              <li><span className="lp-highlight-dot green" />Triagem de enfermagem integrada</li>
              <li><span className="lp-highlight-dot blue" />Visibilidade financeira centralizada</li>
              <li><span className="lp-highlight-dot purple" />Alertas de consultas e vencimentos</li>
            </ul>
          </div>

          <aside className="lp-overview-card" aria-label="Resumo ilustrativo do CRM">
            <div className="lp-card-heading">
              <div>
                <span className="lp-demo-tag">Demonstração</span>
                <h2>Visão do CRM</h2>
              </div>
              <span className="lp-illustrative">Dados fictícios</span>
            </div>
            <div className="lp-period-control" aria-label="Período dos indicadores">
              <span>Período analisado</span>
              <div className="lp-segmented">
                {periodos.map((item) => (
                  <button
                    key={item.valor}
                    type="button"
                    className={periodo === item.valor ? 'is-selected' : ''}
                    aria-pressed={periodo === item.valor}
                    onClick={() => setPeriodo(item.valor)}
                  >
                    {item.rotulo}
                  </button>
                ))}
              </div>
            </div>
            <div className="lp-overview-metrics">
              <div className="lp-overview-metric">
                <span>Solicitações</span>
                <strong>{solicitacoesPeriodo.length}</strong>
              </div>
              <div className="lp-overview-metric">
                <span>Em análise</span>
                <strong>{indicadores.enfermagem + indicadores.financeiro}</strong>
              </div>
              <div className="lp-overview-metric is-highlighted">
                <span>Total autorizado</span>
                <strong>{formatarValor(indicadores.totalAutorizado)}</strong>
              </div>
            </div>
            <a className="lp-card-link" href="#demonstracao">
              Explorar painel completo <span aria-hidden="true">→</span>
            </a>
          </aside>
        </div>
      </section>

      <section className="lp-section lp-features" id="funcionalidades">
        <div className="lp-shell lp-feature-grid">
          <article className="lp-feature-card">
            <span className="lp-feature-icon blue" aria-hidden="true">✓</span>
            <h2>Fluxo organizado</h2>
            <p>Visualize solicitações por etapa e acompanhe cada pendência em um único fluxo.</p>
          </article>
          <article className="lp-feature-card">
            <span className="lp-feature-icon amber" aria-hidden="true">↗</span>
            <h2>Atendimento mais ágil</h2>
            <p>Reduza retrabalho com informações centralizadas e histórico de cada caso.</p>
          </article>
          <article className="lp-feature-card">
            <span className="lp-feature-icon green" aria-hidden="true">$</span>
            <h2>Gestão financeira</h2>
            <p>Monitore autorizações, pagamentos e valores pendentes sem perder o controle.</p>
          </article>
        </div>
      </section>

      <section className="lp-section lp-showcase" id="demonstracao">
        <div className="lp-shell">
          <div className="lp-section-heading lp-centered-heading">
            <span className="lp-eyebrow">Ambiente de demonstração interativo</span>
            <h2>Conheça o painel na prática</h2>
            <p>
              Explore os indicadores e a fila de solicitações com registros fictícios baseados no
              fluxo do CRM.
            </p>
          </div>

          <div className="lp-showcase-tabs" role="tablist" aria-label="Visões da demonstração">
            <button
              type="button"
              role="tab"
              aria-selected={aba === 'painel'}
              className={aba === 'painel' ? 'is-selected' : ''}
              onClick={() => setAba('painel')}
            >
              <span aria-hidden="true">▥</span> Dashboard &amp; Indicadores
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={aba === 'solicitacoes'}
              className={aba === 'solicitacoes' ? 'is-selected' : ''}
              onClick={() => setAba('solicitacoes')}
            >
              <span aria-hidden="true">☷</span> Gestão de Solicitações
            </button>
          </div>

          <div className="lp-app-frame">
            <div className="lp-app-header">
              <div>
                <span>Ambiente de demonstração</span>
                <h3>Controle de CRM</h3>
              </div>
              <div className="lp-app-nav">
                <button
                  type="button"
                  className={aba === 'painel' ? 'is-active' : ''}
                  onClick={() => setAba('painel')}
                >
                  Painel
                </button>
                <button
                  type="button"
                  className={aba === 'solicitacoes' ? 'is-active' : ''}
                  onClick={() => setAba('solicitacoes')}
                >
                  Solicitações
                </button>
                <span>Admin (todos)</span>
              </div>
            </div>

            {aba === 'painel' ? (
              <div className="lp-dashboard" role="tabpanel">
                <div className="lp-dashboard-heading">
                  <div>
                    <h4>Dashboard do CRM</h4>
                    <p>Indicadores calculados a partir dos dados fictícios da demonstração.</p>
                  </div>
                  <div className="lp-segmented lp-dashboard-period">
                    {periodos.map((item) => (
                      <button
                        key={item.valor}
                        type="button"
                        className={periodo === item.valor ? 'is-selected' : ''}
                        aria-pressed={periodo === item.valor}
                        onClick={() => setPeriodo(item.valor)}
                      >
                        {item.rotulo}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="lp-kpi-grid">
                  <article className="lp-kpi-card">
                    <span>Solicitações no período</span>
                    <strong>{solicitacoesPeriodo.length}</strong>
                  </article>
                  <article className="lp-kpi-card">
                    <span>Aguardando enfermagem</span>
                    <strong>{indicadores.enfermagem}</strong>
                  </article>
                  <article className="lp-kpi-card">
                    <span>Aguardando financeiro</span>
                    <strong>{indicadores.financeiro}</strong>
                  </article>
                  <article className="lp-kpi-card">
                    <span>Total a pagar</span>
                    <strong>{formatarValor(indicadores.totalPendente)}</strong>
                  </article>
                  <article className="lp-kpi-card">
                    <span>Pago</span>
                    <strong>{formatarValor(indicadores.totalPago)}</strong>
                  </article>
                </div>

                <div className="lp-analytics-grid">
                  <article className="lp-analytics-card">
                    <h5>Solicitações por etapa</h5>
                    <p>Distribuição no período selecionado</p>
                    {[
                      ['Pago', indicadores.pago, 'green'],
                      ['Pagamento agendado', indicadores.agendado, 'blue'],
                      ['Aguardando financeiro', indicadores.financeiro, 'amber'],
                      ['Aguardando enfermagem', indicadores.enfermagem, 'orange'],
                      ['Não autorizado', indicadores.recusado, 'red'],
                    ].map(([label, total, tone]) => {
                      const count = Number(total)
                      const max = Math.max(1, solicitacoesPeriodo.length)
                      return (
                        <div className="lp-bar-row" key={label}>
                          <span>{label}</span>
                          <div className="lp-bar-track">
                            <span
                              className={`tone-${tone}`}
                              style={{ width: `${(count / max) * 100}%` }}
                            />
                          </div>
                          <strong>{count}</strong>
                        </div>
                      )
                    })}
                  </article>
                  <article className="lp-analytics-card">
                    <h5>Solicitações por solicitante</h5>
                    <p>Volume de registros no período</p>
                    {solicitantes.length ? solicitantes.map(([nome, total]) => (
                      <div className="lp-bar-row lp-requester-row" key={nome}>
                        <span title={nome}>{nome}</span>
                        <div className="lp-bar-track">
                          <span
                            className="tone-blue"
                            style={{ width: `${(total / maxSolicitante) * 100}%` }}
                          />
                        </div>
                        <strong>{total}</strong>
                      </div>
                    )) : <p className="lp-empty">Sem solicitações neste período.</p>}
                    <div className="lp-analytics-total">
                      <span>Taxa de autorização nos exemplos</span>
                      <strong>
                        {solicitacoesPeriodo.length
                          ? `${Math.round(
                              (solicitacoesPeriodo.filter((item) => item.autorizacao === 'sim')
                                .length /
                                solicitacoesPeriodo.length) *
                                100,
                            )}%`
                          : '—'}
                      </strong>
                    </div>
                  </article>
                </div>
              </div>
            ) : (
              <div className="lp-requests" role="tabpanel">
                <div className="lp-dashboard-heading">
                  <div>
                    <h4>Solicitações</h4>
                    <p>Prévia dos registros fictícios; a gestão completa está dentro do CRM.</p>
                  </div>
                  <Link to={ROUTES.crm} className="lp-button lp-button-primary lp-button-compact">
                    + Nova solicitação
                  </Link>
                </div>

                <div className="lp-filter-panel">
                  <span>Filtrar solicitações</span>
                  <div className="lp-filter-list">
                    {filtros.map((item) => (
                      <button
                        key={item}
                        type="button"
                        className={filtro === item ? 'is-selected' : ''}
                        aria-pressed={filtro === item}
                        onClick={() => setFiltro(item)}
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>

                <label className="lp-search">
                  <span>Buscar solicitações</span>
                  <input
                    type="search"
                    value={busca}
                    onChange={(event) => setBusca(event.target.value)}
                    placeholder="Protocolo, paciente, solicitante ou procedimento"
                  />
                </label>

                <div className="lp-table-wrap">
                  <table className="lp-table">
                    <thead>
                      <tr>
                        <th>Protocolo</th>
                        <th>Paciente</th>
                        <th>Procedimento</th>
                        <th>Valor</th>
                        <th>Etapa</th>
                        <th>Ação</th>
                      </tr>
                    </thead>
                    <tbody>
                      {solicitacoesFiltradas.slice(0, 6).map((item) => {
                        const etapa = etapaAtual(item).label
                        return (
                          <tr key={item.id}>
                            <td>
                              <strong>{item.protocolo}</strong>
                              <small>{formatarData(item.abertura)}</small>
                            </td>
                            <td>
                              <strong>{item.beneficiario}</strong>
                              <small>{item.solicitante}</small>
                            </td>
                            <td>
                              <strong>{item.procedimento}</strong>
                              {item.tipo === 'reembolso' && <small>Reembolso</small>}
                            </td>
                            <td>{formatarValor(item.valorSolicitado)}</td>
                            <td>
                              <span className={`lp-stage lp-stage-${valorClasseEtapa(etapa)}`}>
                                {etapa}
                              </span>
                            </td>
                            <td>
                              <Link to={ROUTES.crm} className="lp-table-link">Abrir</Link>
                            </td>
                          </tr>
                        )
                      })}
                      {!solicitacoesFiltradas.length && (
                        <tr>
                          <td className="lp-no-results" colSpan={6}>
                            Nenhuma solicitação encontrada para os filtros atuais.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
                <div className="lp-table-footer">
                  <span>
                    Exibindo {Math.min(6, solicitacoesFiltradas.length)} de {solicitacoesFiltradas.length}{' '}
                    registros fictícios
                  </span>
                  <Link to={ROUTES.crm}>Ver todas no CRM <span aria-hidden="true">→</span></Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="lp-section lp-workflow" id="como-funciona">
        <div className="lp-shell">
          <div className="lp-section-heading">
            <span className="lp-eyebrow">Fluxo operacional</span>
            <h2>Do pedido ao pagamento em 4 etapas simples</h2>
            <p>
              Cada área acompanha o que precisa executar, com as informações organizadas no mesmo
              fluxo.
            </p>
          </div>
          <div className="lp-step-grid">
            {[
              ['Abertura da solicitação', 'Registre consultas, procedimentos e pedidos de reembolso com protocolo.'],
              ['Triagem de enfermagem', 'Analise os dados clínicos e registre a decisão de autorização.'],
              ['Análise financeira', 'Acompanhe valores autorizados e organize pagamentos pendentes.'],
              ['Pagamento e acompanhamento', 'Atualize o status e consulte os indicadores do fluxo.'],
            ].map(([titulo, descricao], index) => (
              <article className="lp-step-card" key={titulo}>
                <span>{index + 1}</span>
                <h3>{titulo}</h3>
                <p>{descricao}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="lp-section lp-cta" id="indicadores">
        <div className="lp-shell">
          <div className="lp-cta-card">
            <div>
              <span className="lp-eyebrow">Operadora de saúde · CRM Saúde</span>
              <h2>Mais clareza para acompanhar cada solicitação.</h2>
              <p>
                Centralize o atendimento, acompanhe as etapas e consulte os indicadores do seu fluxo
                em um só lugar.
              </p>
            </div>
            <div className="lp-cta-actions">
              <Link to={ROUTES.crm} className="lp-button lp-button-primary">
                Acessar CRM
              </Link>
              <Link to={ROUTES.cadastro} className="lp-button lp-button-white">
                Criar conta
              </Link>
            </div>
          </div>
        </div>
      </section>

      <footer className="lp-footer">
        <div className="lp-shell lp-footer-inner">
          <a className="lp-brand" href="#inicio">
            <span>Operadora de saúde</span>
            <strong>CRM Saúde</strong>
          </a>
          <nav aria-label="Navegação do rodapé">
            <a href="#funcionalidades">Funcionalidades</a>
            <a href="#demonstracao">Demonstração</a>
            <a href="#como-funciona">Como funciona</a>
            <Link to={ROUTES.login}>Entrar no sistema</Link>
          </nav>
          <p>© {new Date().getFullYear()} CRM Saúde</p>
        </div>
      </footer>
    </main>
  )
}
