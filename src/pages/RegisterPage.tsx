import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { registrarUsuario } from '../auth'

export default function RegisterPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ nome: '', email: '', senha: '', confirmarSenha: '' })
  const [erro, setErro] = useState('')

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (form.senha.length < 6) {
      setErro('A senha deve ter pelo menos 6 caracteres.')
      return
    }

    if (form.senha !== form.confirmarSenha) {
      setErro('As senhas não coincidem.')
      return
    }

    try {
      registrarUsuario({
        nome: form.nome,
        email: form.email,
        senha: form.senha,
        papel: 'atendimento',
      })
      navigate('/crm')
    } catch (error) {
      setErro(error instanceof Error ? error.message : 'Não foi possível criar a conta.')
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-shell">
        <Link to="/" className="auth-home-link">
          ← Voltar ao início
        </Link>
        <div className="auth-card auth-card-large">
          <div className="auth-intro">
            <span className="eyebrow">Cadastro</span>
            <h1>Criar conta no CRM</h1>
            <p>Comece a organizar solicitações, atendimentos e pagamentos da sua operação.</p>
          </div>

          <form className="auth-form" onSubmit={onSubmit}>
            <label>
              Nome completo
              <input
                type="text"
                value={form.nome}
                autoComplete="name"
                onChange={(event) => setForm((atual) => ({ ...atual, nome: event.target.value }))}
                placeholder="Seu nome"
                required
              />
            </label>

            <label>
              E-mail
              <input
                type="email"
                value={form.email}
                autoComplete="email"
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
                autoComplete="new-password"
                onChange={(event) => setForm((atual) => ({ ...atual, senha: event.target.value }))}
                placeholder="••••••••"
                required
              />
            </label>

            <label>
              Confirmar senha
              <input
                type="password"
                value={form.confirmarSenha}
                autoComplete="new-password"
                onChange={(event) =>
                  setForm((atual) => ({ ...atual, confirmarSenha: event.target.value }))
                }
                placeholder="Repita a senha"
                required
              />
            </label>

            {erro && <p className="auth-error">{erro}</p>}

            <button type="submit" className="btn btn-primary auth-submit">
              Cadastrar
            </button>
          </form>

          <p className="auth-footer">
            Já possui conta? <Link to="/login">Faça login</Link>
          </p>
        </div>
      </div>
    </main>
  )
}
