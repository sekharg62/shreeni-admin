import { useEffect, useState } from 'react'
import { orderService } from '../../services'

/** Fired after a status change so the sidebar badge refreshes right away. */
export const ORDERS_CHANGED_EVENT = 'shreeni:orders-changed'
export const notifyOrdersChanged = () => window.dispatchEvent(new Event(ORDERS_CHANGED_EVENT))

/**
 * Paid orders waiting to be packed or shipped. Loaded once when the admin opens (no polling —
 * refresh the page to see new orders), and again after the admin changes an order's status.
 */
export function useOrdersToFulfil(): number {
  const [count, setCount] = useState(0)
  useEffect(() => {
    let alive = true
    const load = () => {
      orderService.counts().then(
        (c) => alive && setCount(c.TO_FULFIL),
        () => {},
      )
    }
    load()
    window.addEventListener(ORDERS_CHANGED_EVENT, load)
    return () => {
      alive = false
      window.removeEventListener(ORDERS_CHANGED_EVENT, load)
    }
  }, [])
  return count
}

/** "OD261108482913" → "OD 261108 482913" (easier to read out on the phone). */
export const spacedOrderNumber = (n: string) => n.replace(/^(OD)(\d{6})(\d{6})$/, '$1 $2 $3')

/** "+919876543210" → "+91 98765 43210" */
export const formatPhone = (p: string) => p.replace(/^\+91(\d{5})(\d{5})$/, '+91 $1 $2')
