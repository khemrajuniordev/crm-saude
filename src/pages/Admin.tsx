import { Link, Outlet, useLocation } from 'react-router-dom'
import AssistenteCRM from '../components/AssistenteCRM'
import { ROUTES } from '../routes'

export default function Admin() {
  const { pathname } = useLocation()

  return (
    <main className="admin">
      <div className="shell">
        <header className="admin-topo">
          <div>
            <p className="admin-boasvindas">Ambiente de demonstração</p>
            <h1 className="page-title admin-titulo">Controle de CRM</h1>
          </div>
          <nav className="admin-acoes-topo" aria-label="Navegação do CRM">
            <Link
              className={`btn btn-ghost${pathname === ROUTES.adminCrm ? ' ativo' : ''}`}
              to={ROUTES.adminCrm}
            >
              Solicitações
            </Link>
            <Link
              className={`btn btn-ghost${pathname === ROUTES.adminCrmPainel ? ' ativo' : ''}`}
              to={ROUTES.adminCrmPainel}
            >
              Painel
            </Link>
            <Link
              className={`btn btn-ghost${pathname === ROUTES.adminCrmUsuarios ? ' ativo' : ''}`}
              to={ROUTES.adminCrmUsuarios}
            >
              Usuários
            </Link>
          </nav>
        </header>

        <aside className="crm-demo-aviso" role="note">
          Demonstração: os dados são fictícios e as alterações ficam apenas neste navegador.
          Não insira informações reais ou sensíveis.
        </aside>

        <Outlet />
      </div>
      <AssistenteCRM />
    </main>
  )
}
