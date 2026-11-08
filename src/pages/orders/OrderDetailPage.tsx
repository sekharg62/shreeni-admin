import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { Ban, CheckCircle2, Copy, Mail, MapPin, PackageCheck, Phone, RotateCcw, Truck, User, Wallet } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import CopyCell from '../../components/ui/CopyCell'
import ErrorBox from '../../components/ui/ErrorBox'
import Input from '../../components/ui/Input'
import Modal from '../../components/ui/Modal'
import Skeleton from '../../components/ui/Skeleton'
import Textarea from '../../components/ui/Textarea'
import { OrderStatusBadge, PaymentStatusBadge } from '../../components/ui/StatusBadge'
import { useApi } from '../../hooks/useApi'
import { useToast } from '../../context/ToastContext'
import { getApiErrorMessage, orderService } from '../../services'
import { PAYMENT_METHOD_LABELS, type OrderStatus } from '../../constants/enums'
import { formatDateTime, timeAgo } from '../../lib/date'
import { formatPaise } from '../../lib/money'
import { cn } from '../../lib/cn'
import type { AdminOrder } from '../../types/models'
import { formatPhone, notifyOrdersChanged, spacedOrderNumber } from './orderEvents'

/** How each next step is offered to the admin. */
const ACTIONS: Record<OrderStatus, { label: string; icon: typeof Truck; variant: 'primary' | 'outline' | 'danger'; help: string }> = {
  PENDING: { label: 'Pending', icon: Wallet, variant: 'outline', help: '' },
  CONFIRMED: {
    label: 'Mark paid & confirm',
    icon: Wallet,
    variant: 'primary',
    help: 'Use when the payment was received outside the website. The stock is taken from inventory.',
  },
  PACKED: { label: 'Mark packed', icon: PackageCheck, variant: 'primary', help: 'The parcel is packed and ready for the courier.' },
  SHIPPED: { label: 'Mark shipped', icon: Truck, variant: 'primary', help: 'Handed to the courier. The customer sees the courier and tracking number.' },
  DELIVERED: { label: 'Mark delivered', icon: CheckCircle2, variant: 'primary', help: 'The customer has received the parcel.' },
  CANCELLED: {
    label: 'Cancel order',
    icon: Ban,
    variant: 'danger',
    help: 'Stock goes back to inventory, the coupon use is released, and a paid order is refunded.',
  },
  RETURNED: { label: 'Mark returned', icon: RotateCcw, variant: 'outline', help: 'The parcel came back. Stock goes back to inventory and a paid order is refunded.' },
}

function Card({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn('rounded-xl border border-gray-200 bg-white p-5', className)}>
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-500">{title}</h2>
      {children}
    </section>
  )
}

function StatusDialog({ order, to, onClose, onDone }: { order: AdminOrder; to: OrderStatus; onClose: () => void; onDone: (o: AdminOrder) => void }) {
  const toast = useToast()
  const [note, setNote] = useState('')
  const [courier, setCourier] = useState(order.shipment?.deliveryPartner ?? '')
  const [awb, setAwb] = useState(order.shipment?.awb ?? '')
  const [errors, setErrors] = useState<{ note?: string; courier?: string }>({})
  const [busy, setBusy] = useState(false)
  const action = ACTIONS[to]

  const submit = async () => {
    const e: typeof errors = {}
    if (to === 'CANCELLED' && !note.trim()) e.note = 'Tell the customer why (they will see this).'
    if (to === 'SHIPPED' && !courier.trim()) e.courier = 'Enter the courier name.'
    setErrors(e)
    if (Object.keys(e).length) return
    setBusy(true)
    try {
      const updated = await orderService.setStatus(order.id, {
        status: to,
        note: note.trim() || undefined,
        ...(to === 'SHIPPED' && { deliveryPartner: courier.trim(), awb: awb.trim() || undefined }),
      })
      toast.success(`Order ${spacedOrderNumber(order.orderNumber)} → ${action.label.replace(/^Mark /, '').replace(/^Cancel order$/, 'cancelled')}`)
      onDone(updated)
    } catch (err) {
      toast.error(getApiErrorMessage(err))
      setBusy(false)
    }
  }

  return (
    <Modal
      open
      onClose={busy ? () => {} : onClose}
      title={action.label}
      footer={
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Back
          </Button>
          <Button variant={action.variant === 'danger' ? 'danger' : 'primary'} isLoading={busy} onClick={() => void submit()}>
            {action.label}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-600">{action.help}</p>
        {to === 'SHIPPED' && (
          <div className="grid gap-4 sm:grid-cols-2">
            <Input id="courier" label="Courier" placeholder="e.g. Delhivery, India Post" value={courier} onChange={(e) => setCourier(e.target.value)} error={errors.courier} maxLength={80} autoFocus />
            <Input id="awb" label="Tracking (AWB) number" placeholder="Optional" value={awb} onChange={(e) => setAwb(e.target.value)} maxLength={60} />
          </div>
        )}
        <Textarea
          id="note"
          label={to === 'CANCELLED' ? 'Reason (shown to the customer)' : 'Note for the customer (optional)'}
          placeholder={to === 'CANCELLED' ? 'e.g. This saree is no longer available' : 'Shown on the order timeline'}
          rows={3}
          maxLength={300}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          error={errors.note}
          autoFocus={to !== 'SHIPPED'}
        />
      </div>
    </Modal>
  )
}

export default function OrderDetailPage() {
  const { id = '' } = useParams()
  const order = useApi(() => orderService.get(id), [id])
  const [dialog, setDialog] = useState<OrderStatus | null>(null)
  const toast = useToast()
  const o = order.data
  const crumbs = [{ label: 'Orders', to: '/orders' }, { label: o ? spacedOrderNumber(o.orderNumber) : 'Order' }]

  if (order.error) {
    return (
      <div>
        <PageHeader title="Order" breadcrumbs={crumbs} />
        <ErrorBox message={order.error} onRetry={order.refetch} />
      </div>
    )
  }
  if (!o) {
    return (
      <div>
        <PageHeader title="Order" breadcrumbs={crumbs} />
        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          <Skeleton className="h-96 w-full rounded-xl" />
          <Skeleton className="h-80 w-full rounded-xl" />
        </div>
      </div>
    )
  }

  const customer = o.user ? [o.user.firstName, o.user.lastName].filter(Boolean).join(' ') || o.user.phone : o.shipReceiverName
  const payment = o.payments[0]
  const forward = o.nextStatuses.filter((s) => s !== 'CANCELLED' && s !== 'RETURNED')
  const backward = o.nextStatuses.filter((s) => s === 'CANCELLED' || s === 'RETURNED')
  const address = [o.shipFlatHouseNo, o.shipApartmentSector, o.shipLandmark, `${o.shipCity}, ${o.shipState} ${o.shipPincode}`].filter(Boolean)

  return (
    <div>
      <PageHeader
        title={spacedOrderNumber(o.orderNumber)}
        description={`Placed ${formatDateTime(o.createdAt)} (${timeAgo(o.createdAt)})`}
        breadcrumbs={crumbs}
        actions={
          o.nextStatuses.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {backward.map((s) => {
                const a = ACTIONS[s]
                return (
                  <Button key={s} variant={a.variant === 'danger' ? 'ghost' : 'outline'} leftIcon={<a.icon className="h-4 w-4" />} onClick={() => setDialog(s)}>
                    {a.label}
                  </Button>
                )
              })}
              {forward.map((s) => {
                const a = ACTIONS[s]
                return (
                  <Button key={s} leftIcon={<a.icon className="h-4 w-4" />} onClick={() => setDialog(s)}>
                    {a.label}
                  </Button>
                )
              })}
            </div>
          )
        }
      />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <OrderStatusBadge status={o.status} />
        {payment && <PaymentStatusBadge status={payment.status} />}
        {o.isGuest && <Badge>Guest checkout</Badge>}
        {o.status === 'CANCELLED' && o.cancelReason && <span className="text-sm text-red-700">Reason: {o.cancelReason}</span>}
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-6">
          <Card title={`Items (${o.items.reduce((n, i) => n + i.quantity, 0)})`}>
            <ul className="divide-y divide-gray-100">
              {o.items.map((i) => (
                <li key={i.id} className="flex items-center gap-4 py-3 first:pt-0">
                  <div className="h-16 w-12 shrink-0 overflow-hidden rounded-md bg-gray-100">
                    {i.image && <img src={i.image} alt="" className="h-full w-full object-cover" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900">{i.name}</p>
                    <p className="text-xs text-gray-500">
                      {[i.size, i.sku && `SKU ${i.sku}`].filter(Boolean).join(' · ')}
                    </p>
                  </div>
                  <p className="text-sm text-gray-600">
                    {i.quantity} × {formatPaise(i.unitPrice)}
                  </p>
                  <p className="w-24 text-right text-sm font-semibold text-gray-900">{formatPaise(i.unitPrice * i.quantity)}</p>
                </li>
              ))}
            </ul>
            <dl className="mt-3 space-y-1.5 border-t border-gray-100 pt-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-gray-500">Subtotal</dt>
                <dd>{formatPaise(o.subtotal)}</dd>
              </div>
              {o.discountTotal > 0 && (
                <div className="flex justify-between text-green-700">
                  <dt>
                    Coupon <span className="font-mono">{o.discountCode}</span>
                  </dt>
                  <dd>−{formatPaise(o.discountTotal)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-gray-500">Shipping</dt>
                <dd>{o.shippingTotal ? formatPaise(o.shippingTotal) : 'Free'}</dd>
              </div>
              <div className="flex justify-between border-t border-gray-100 pt-2 text-base font-semibold">
                <dt>Total</dt>
                <dd>{formatPaise(o.grandTotal)}</dd>
              </div>
            </dl>
          </Card>

          <Card title="Timeline">
            <ol className="relative space-y-5 border-l border-gray-200 pl-6">
              {o.events.map((e) => {
                const by = e.actor
                  ? e.actor.role === 'ADMIN'
                    ? [e.actor.firstName, e.actor.lastName].filter(Boolean).join(' ') || 'Admin'
                    : 'Customer'
                  : 'System'
                return (
                  <li key={e.id} className="relative">
                    <span
                      className={cn(
                        'absolute -left-[31px] top-1 h-3.5 w-3.5 rounded-full ring-4 ring-white',
                        e.status === 'CANCELLED' ? 'bg-red-500' : e.status === 'DELIVERED' ? 'bg-green-500' : 'bg-gray-900',
                      )}
                      aria-hidden="true"
                    />
                    <p className="text-sm font-semibold text-gray-900">{e.label}</p>
                    <p className="text-xs text-gray-500">
                      {formatDateTime(e.createdAt)} · by {by}
                    </p>
                    {e.note && e.note !== e.label && <p className="mt-1 text-sm text-gray-700">{e.note}</p>}
                  </li>
                )
              })}
            </ol>
          </Card>
        </div>

        <aside className="space-y-4 lg:sticky lg:top-4">
          <Card title="Customer">
            <ul className="space-y-2.5 text-sm">
              <li className="flex items-center gap-2.5 text-gray-900">
                <User className="h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" /> {customer}
                {o.isGuest ? <Badge>Guest</Badge> : <Badge variant="info">Account</Badge>}
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" />
                <CopyCell value={o.contactPhone} />
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" />
                {o.contactEmail ? <CopyCell value={o.contactEmail} /> : <span className="text-gray-400">No email</span>}
              </li>
            </ul>
          </Card>

          <Card title="Ship to">
            <div className="flex gap-2.5 text-sm">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" />
              <address className="not-italic leading-relaxed text-gray-700">
                <span className="font-medium text-gray-900">{o.shipReceiverName}</span>
                {address.map((l) => (
                  <span key={l} className="block">
                    {l}
                  </span>
                ))}
                <span className="block">{formatPhone(o.shipReceiverPhone)}</span>
              </address>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="mt-3"
              leftIcon={<Copy className="h-3.5 w-3.5" />}
              onClick={() => {
                void navigator.clipboard.writeText([o.shipReceiverName, ...address, o.shipReceiverPhone].join('\n')).then(() => toast.success('Address copied'))
              }}
            >
              Copy address
            </Button>
          </Card>

          {o.shipment && (
            <Card title="Shipment">
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-gray-500">Courier</dt>
                  <dd className="font-medium text-gray-900">{o.shipment.deliveryPartner}</dd>
                </div>
                {o.shipment.awb && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-gray-500">AWB</dt>
                    <dd>
                      <CopyCell value={o.shipment.awb} />
                    </dd>
                  </div>
                )}
                {o.shipment.shippedAt && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-gray-500">Shipped</dt>
                    <dd>{formatDateTime(o.shipment.shippedAt)}</dd>
                  </div>
                )}
                {o.shipment.deliveredAt && (
                  <div className="flex justify-between gap-3">
                    <dt className="text-gray-500">Delivered</dt>
                    <dd>{formatDateTime(o.shipment.deliveredAt)}</dd>
                  </div>
                )}
              </dl>
            </Card>
          )}

          <Card title="Payment">
            {o.payments.length === 0 ? (
              <p className="text-sm text-gray-400">No payment</p>
            ) : (
              <ul className="space-y-3 text-sm">
                {o.payments.map((p) => (
                  <li key={p.id} className="space-y-1">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium text-gray-900">
                        {p.provider === 'test' ? 'Test payment' : p.provider} · {PAYMENT_METHOD_LABELS[p.method]}
                      </span>
                      <PaymentStatusBadge status={p.status} />
                    </div>
                    <p className="text-gray-600">{formatPaise(p.amount)}</p>
                    {p.paidAt && <p className="text-xs text-gray-500">Paid {formatDateTime(p.paidAt)}</p>}
                    {p.gatewayTxnId && <p className="break-all font-mono text-[11px] text-gray-400">{p.gatewayTxnId}</p>}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </aside>
      </div>

      {dialog && (
        <StatusDialog
          order={o}
          to={dialog}
          onClose={() => setDialog(null)}
          onDone={(updated) => {
            order.setData(updated)
            setDialog(null)
            notifyOrdersChanged()
          }}
        />
      )}
    </div>
  )
}
