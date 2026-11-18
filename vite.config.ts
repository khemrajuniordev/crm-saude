import { copyFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'

/* Onde o app é servido muda conforme o destino:
   - Vercel  → raiz do domínio               → base '/'
   - GitHub Pages (projeto) → /crm-saude/    → base '/crm-saude/'
   A Vercel define VERCEL=1 no ambiente de build, então o base é
   escolhido sozinho e o mesmo `npm run build` serve aos dois.
   O BrowserRouter lê esse valor por import.meta.env.BASE_URL, e
   acompanha automaticamente. */
const base = process.env.VERCEL ? '/' : '/crm-saude/'

/* O GitHub Pages não tem reescrita de rota: um link direto para
   /crm-saude/admin/crm não existe como arquivo e devolve a página
   de 404 do próprio Pages. Publicando uma cópia do index.html
   como 404.html, o Pages devolve o SPA, os assets carregam pelo
   base e o router resolve a rota normalmente. Na Vercel quem faz
   esse papel é o rewrite do vercel.json. */
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
  base,
  plugins: [fallbackGithubPages()],
})
