import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import Admin from './pages/Admin'
import AdminCRM from './pages/AdminCRM'
import AdminCRMPainel from './pages/AdminCRMPainel'
import AdminCRMUsuarios from './pages/AdminCRMUsuarios'
import { ROUTES } from './routes'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to={ROUTES.adminCrm} replace />} />
        <Route path="/admin" element={<Admin />}>
          <Route index element={<Navigate to="crm" replace />} />
          <Route path="crm" element={<AdminCRM />} />
          <Route path="crm/usuarios" element={<AdminCRMUsuarios />} />
          <Route path="crm/painel" element={<AdminCRMPainel />} />
        </Route>
        <Route path="*" element={<Navigate to={ROUTES.adminCrm} replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
