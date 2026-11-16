import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import SiteHeader from './SiteHeader'
import SiteFooter from './SiteFooter'
import CookieConsent from './CookieConsent'
import ApppromoModal from './AppPromoModal'


function Layout() {
  const { pathname } = useLocation()

  /* Cada navegacao comeca no topo, e nao na posicao herdada da rota anterior */
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <div className="page">
      <SiteHeader />

      <main>
        <Outlet />
      </main>

      <SiteFooter />

      <CookieConsent />

      <ApppromoModal />

      
    </div>
  )
}

export default Layout
