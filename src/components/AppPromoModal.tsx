/*
import { useEffect, useState } from 'react'
import { X } from 'lucide-react'
import comunicado from '../assets/aviso-porto-velho.png'

/*
 * Modal de divulgação do comunicado da sede de Porto Velho.
 *
 * Aparece uma vez por sessão do navegador. Para atualizar o comunicado, troque
 * a imagem e atualize PROMO_ID.
 */
const PROMO_ID = 'comunicado-porto-velho-2026-11'
const STORAGE_KEY = `promo-visto:${PROMO_ID}`

function AppPromoModal() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    try {
      if (sessionStorage.getItem(STORAGE_KEY)) return
    } catch {
      /* sessionStorage indisponível: mostramos mesmo assim */
    }
    setOpen(true)
  }, [])

  function fechar() {
    setOpen(false)
    try {
      sessionStorage.setItem(STORAGE_KEY, '1')
    } catch {
      /* sem persistência: o modal pode reaparecer, tudo bem */
    }
  }

  /* Fecha com a tecla Esc. */
  useEffect(() => {
    if (!open) return
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') fechar()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  if (!open) return null

  return (
    <div
      className="promo-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Comunicado oficial: sede de Porto Velho sem expediente presencial"
      onClick={fechar}
    >
      <div className="promo-dialog" onClick={(e) => e.stopPropagation()}>
        <button className="promo-close" onClick={fechar} aria-label="Fechar aviso">
          <X size={22} aria-hidden="true" />
        </button>

        <img
          className="promo-img"
          src={comunicado}
          alt="Comunicado oficial: a sede de Porto Velho estará sem atendimento presencial de 9 a 13 de novembro. O atendimento será retomado em 16 de novembro."
        />

        <div className="promo-actions">
          <button className="btn btn-primary" onClick={fechar}>
            Entendi
          </button>
        </div>
      </div>
    </div>
  )
}

export default AppPromoModal

