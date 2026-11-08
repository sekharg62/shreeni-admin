import { useEffect, useState } from 'react'
import { orderService } from '../../services'

/** Fired after a status change so the sidebar badge refreshes right away. */
export const ORDERS_CHANGED_EVENT = 'shreeni:orders-changed'
export const notifyOrdersChanged = () => window.dispatchEvent(new Event(ORDERS_CHANGED_EVENT))

const POLL_MS = 60_000

/** Paid orders waiting to be packed or shipped. Polls every minute while the tab is visible. */
export function useOrdersToFulfil(): number {
  const [count, setCount] = useState(0)
  useEffect(() => {
    let alive = true
    const load = () => {
      if (document.visibilityState !== 'visible') return
      orderService.counts().then(
        (c) => alive && setCount(c.TO_FULFIL),
        () => {},
      )
    }
    load()
    const timer = setInterval(load, POLL_MS)
    window.addEventListener(ORDERS_CHANGED_EVENT, load)
    document.addEventListener('visibilitychange', load)
    return () => {
      alive = false
      clearInterval(timer)
      window.removeEventListener(ORDERS_CHANGED_EVENT, load)
      document.removeEventListener('visibilitychange', load)
    }
  }, [])
  return count
}

/** "OD261108482913" → "OD 261108 482913" (easier to read out on the phone). */
export const spacedOrderNumber = (n: string) => n.replace(/^(OD)(\d{6})(\d{6})$/, '$1 $2 $3')

/** "+919876543210" → "+91 98765 43210" */
export const formatPhone = (p: string) => p.replace(/^\+91(\d{5})(\d{5})$/, '+91 $1 $2')
