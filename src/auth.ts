export type UsuarioCRM = {
  nome: string
  email: string
  senha: string
  papel: 'atendimento' | 'enfermagem' | 'financeiro' | 'admin'
}

const STORAGE_USERS = 'crm-demo-usuarios'
const STORAGE_CURRENT = 'crm-demo-usuario-atual'

const readUsers = (): UsuarioCRM[] => {
  try {
    const raw = localStorage.getItem(STORAGE_USERS)
    return raw ? (JSON.parse(raw) as UsuarioCRM[]) : []
  } catch {
    return []
  }
}

export const getUsuarioAtual = (): UsuarioCRM | null => {
  try {
    const raw = localStorage.getItem(STORAGE_CURRENT)
    return raw ? (JSON.parse(raw) as UsuarioCRM) : null
  } catch {
    return null
  }
}

export const setUsuarioAtual = (usuario: UsuarioCRM | null) => {
  if (!usuario) {
    localStorage.removeItem(STORAGE_CURRENT)
    return
  }
  localStorage.setItem(STORAGE_CURRENT, JSON.stringify(usuario))
}

export const registrarUsuario = (usuario: Omit<UsuarioCRM, 'papel'> & { papel?: UsuarioCRM['papel'] }) => {
  const usuarios = readUsers()
  const jaExiste = usuarios.some((item) => item.email.toLowerCase() === usuario.email.toLowerCase())
  if (jaExiste) {
    throw new Error('Já existe uma conta com esse e-mail.')
  }

  const novoUsuario: UsuarioCRM = {
    nome: usuario.nome,
    email: usuario.email,
    senha: usuario.senha,
    papel: usuario.papel ?? 'atendimento',
  }

  usuarios.push(novoUsuario)
  localStorage.setItem(STORAGE_USERS, JSON.stringify(usuarios))
  setUsuarioAtual(novoUsuario)
  return novoUsuario
}

export const autenticarUsuario = (email: string, senha: string) => {
  const usuarios = readUsers()
  const usuario = usuarios.find(
    (item) => item.email.toLowerCase() === email.trim().toLowerCase() && item.senha === senha,
  )

  if (!usuario) {
    return null
  }

  setUsuarioAtual(usuario)
  return usuario
}

export const sairUsuario = () => setUsuarioAtual(null)
