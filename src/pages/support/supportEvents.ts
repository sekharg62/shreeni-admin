import { useEffect, useState } from 'react'
import { supportService } from '../../services'

/** Fired after a reply / status change so the sidebar badge refreshes right away. */
export const SUPPORT_CHANGED_EVENT = 'shreeni:support-changed'
export const notifySupportChanged = () => window.dispatchEvent(new Event(SUPPORT_CHANGED_EVENT))

const POLL_MS = 60_000

/** Tickets waiting for a reply (status OPEN). Polls every minute while the tab is visible. */
export function useOpenSupportCount(): number {
  const [count, setCount] = useState(0)
  useEffect(() => {
    let alive = true
    const load = () => {
      if (document.visibilityState !== 'visible') return
      supportService.counts().then(
        (c) => alive && setCount(c.OPEN),
        () => {},
      )
    }
    load()
    const timer = setInterval(load, POLL_MS)
    window.addEventListener(SUPPORT_CHANGED_EVENT, load)
    document.addEventListener('visibilitychange', load)
    return () => {
      alive = false
      clearInterval(timer)
      window.removeEventListener(SUPPORT_CHANGED_EVENT, load)
      document.removeEventListener('visibilitychange', load)
    }
  }, [])
  return count
}

/** "Priya Sen", or the phone number when no name was given. */
export function customerName(u: { firstName: string | null; lastName: string | null; phone: string }): string {
  return [u.firstName, u.lastName].filter(Boolean).join(' ') || u.phone
}
