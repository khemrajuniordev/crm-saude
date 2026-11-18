import { Outlet } from 'react-router-dom'
import AssistenteCRM from '../components/AssistenteCRM'

export default function Admin() {

  return (
    <main className="admin">
      <div className="shell">
        {/* Faixa de contexto, não título. O título da tela é o
            nome do trabalho que se faz nela ("Solicitações",
            "Dashboard"), definido por cada página. */}
        <header className="admin-contexto">
          <span className="admin-marca">Controle de CRM</span>
          <span className="admin-demo">Ambiente de demonstração</span>
        </header>

        <Outlet />
      </div>
      <AssistenteCRM />
    </main>
  )
}
