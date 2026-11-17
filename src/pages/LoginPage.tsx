import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { autenticarUsuario } from '../auth'

export default function LoginPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', senha: '' })
  const [erro, setErro] = useState('')

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const usuario = autenticarUsuario(form.email, form.senha)

    if (!usuario) {
      setErro('E-mail ou senha inválidos. Verifique os dados ou cadastre uma conta.')
      return
    }

    setErro('')
    navigate('/crm')
  }

  return (
    <main className="auth-page">
      <div className="auth-shell">
        <Link to="/" className="auth-home-link">
          ← Voltar ao início
        </Link>
        <div className="auth-card auth-card-large">
          <div className="auth-intro">
            <span className="eyebrow">Acesso ao CRM</span>
            <h1>Entrar na plataforma</h1>
            <p>Gerencie solicitações, atendimentos e pagamentos em um único lugar.</p>
          </div>

          <form className="auth-form" onSubmit={onSubmit}>
            <label>
              E-mail
              <input
                type="email"
                value={form.email}
                autoComplete="username"
                onChange={(event) => setForm((atual) => ({ ...atual, email: event.target.value }))}
                placeholder="seu@email.com"
                required
              />
            </label>

            <label>
              Senha
              <input
                type="password"
                value={form.senha}
                autoComplete="current-password"
                onChange={(event) => setForm((atual) => ({ ...atual, senha: event.target.value }))}
                placeholder="••••••••"
                required
              />
            </label>

            {erro && <p className="auth-error">{erro}</p>}

            <button type="submit" className="btn btn-primary auth-submit">
              Entrar
            </button>
          </form>

          <div className="auth-demo-access">
            <span>Ou</span>
            <Link to="/crm" className="btn btn-light auth-submit">
              Acessar demonstração sem cadastro
            </Link>
          </div>

          <p className="auth-footer">
            Ainda não tem conta? <Link to="/cadastro">Cadastre-se</Link>
          </p>
        </div>
      </div>
    </main>
  )
}
