import { Outlet } from 'react-router-dom'
import AssistenteCRM from '../components/AssistenteCRM'

export default function Admin() {

  return (
    <main className="admin">
      <div className="shell">
        <header className="admin-topo">
          <div>
            <p className="admin-boasvindas">Ambiente de demonstração</p>
            <h1 className="page-title admin-titulo">Controle de CRM</h1>
          </div>
        </header>

        <Outlet />
      </div>
      <AssistenteCRM />
    </main>
  )
}
