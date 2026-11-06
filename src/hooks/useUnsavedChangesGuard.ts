import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useConfirm } from '../context/ConfirmContext'

/**
 * Warn before leaving a page with unsaved changes:
 * - closing / reloading the tab → the browser's own "Leave site?" prompt
 * - clicking an in-app link (sidebar, breadcrumbs) → our confirm dialog
 */
export function useUnsavedChangesGuard(dirty: boolean, message = 'Your changes on this page will be lost.') {
  const confirm = useConfirm()
  const navigate = useNavigate()

  useEffect(() => {
    if (!dirty) return
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const link = (e.target as HTMLElement).closest('a')
      if (!link || link.target === '_blank' || link.hasAttribute('download')) return
      const url = new URL(link.href, window.location.href)
      if (url.origin !== window.location.origin) return
      if (url.pathname === window.location.pathname && url.search === window.location.search) return
      e.preventDefault()
      e.stopPropagation()
      void confirm({ title: 'Leave without saving?', message, confirmLabel: 'Leave page', danger: true }).then(
        (leave) => leave && navigate(url.pathname + url.search + url.hash),
      )
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    document.addEventListener('click', onClick, true) // capture: runs before the router's link handler
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload)
      document.removeEventListener('click', onClick, true)
    }
  }, [dirty, message, confirm, navigate])
}
