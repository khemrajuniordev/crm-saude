import { copyFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'

/* O GitHub Pages não tem reescrita de rota: um link direto para
   /crm-saude/admin/crm não existe como arquivo e devolve a página
   de 404 do próprio Pages. Publicando uma cópia do index.html
   como 404.html, o Pages devolve o SPA, os assets carregam pelo
   base e o router resolve a rota normalmente. O vercel.json faz
   o equivalente na Vercel, por reescrita. */
function fallbackGithubPages() {
  return {
    name: 'fallback-github-pages',
    closeBundle() {
      const dist = resolve(__dirname, 'dist')
      copyFileSync(resolve(dist, 'index.html'), resolve(dist, '404.html'))
    },
  }
}

export default defineConfig({
  base: '/crm-saude/',
  plugins: [fallbackGithubPages()],
})
