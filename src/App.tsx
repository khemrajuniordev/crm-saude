import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import Admin from './pages/Admin'
import AdminCRM from './pages/AdminCRM'
import AdminCRMPainel from './pages/AdminCRMPainel'
import AdminCRMUsuarios from './pages/AdminCRMUsuarios'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import { ROUTES } from './routes'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path={ROUTES.home} element={<LandingPage />} />
        <Route path={ROUTES.login} element={<LoginPage />} />
        <Route path={ROUTES.cadastro} element={<RegisterPage />} />
        <Route path={ROUTES.crm} element={<Admin />}>
          <Route index element={<AdminCRM />} />
        </Route>

        <Route path="/admin" element={<Admin />}>
          <Route index element={<Navigate to="crm" replace />} />
          <Route path="crm" element={<AdminCRM />} />
          <Route path="crm/usuarios" element={<AdminCRMUsuarios />} />
          <Route path="crm/painel" element={<AdminCRMPainel />} />
        </Route>

        <Route path="*" element={<Navigate to={ROUTES.home} replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
