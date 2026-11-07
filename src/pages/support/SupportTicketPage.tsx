import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { useParams } from 'react-router-dom'
import { CheckCircle2, Headset, Lock, Mail, Phone, Send, User, XCircle } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/ui/Button'
import CopyCell from '../../components/ui/CopyCell'
import ErrorBox from '../../components/ui/ErrorBox'
import Skeleton from '../../components/ui/Skeleton'
import { SupportStatusBadge } from '../../components/ui/StatusBadge'
import { useApi } from '../../hooks/useApi'
import { useConfirm } from '../../context/ConfirmContext'
import { useToast } from '../../context/ToastContext'
import { getApiErrorMessage, supportService } from '../../services'
import { SUPPORT_REASON_LABELS } from '../../constants/enums'
import { formatDateTime, timeAgo } from '../../lib/date'
import { cn } from '../../lib/cn'
import type { SupportTicket } from '../../types/models'
import { customerName, notifySupportChanged } from './supportEvents'

const MAX = 2000
const POLL_MS = 30_000

function Bubble({ who, support, body, at }: { who: string; support: boolean; body: string; at: string }) {
  return (
    <li className={cn('flex gap-3', support && 'flex-row-reverse')}>
      <span
        className={cn(
          'mt-5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
          support ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700',
        )}
        aria-hidden="true"
      >
        {support ? <Headset className="h-4 w-4" /> : who.charAt(0).toUpperCase()}
      </span>
      <div className={cn('flex min-w-0 max-w-[80%] flex-col sm:max-w-[65%] lg:max-w-md', support ? 'items-end' : 'items-start')}>
        <p className="mb-1 px-1 text-xs text-gray-500">
          <span className="font-semibold text-gray-800">{who}</span> · <time dateTime={at}>{formatDateTime(at)}</time>
        </p>
        <div
          className={cn(
            'whitespace-pre-wrap rounded-2xl [overflow-wrap:anywhere] px-4 py-3 text-sm leading-relaxed',
            support ? 'rounded-tr-sm bg-gray-900 text-white' : 'rounded-tl-sm border border-gray-200 bg-white text-gray-800',
          )}
        >
          {body}
        </div>
      </div>
    </li>
  )
}

export default function SupportTicketPage() {
  const { id = '' } = useParams()
  const ticket = useApi(() => supportService.get(id), [id])
  const [reply, setReply] = useState('')
  const [busy, setBusy] = useState<null | 'send' | 'send-resolve' | 'RESOLVED' | 'CLOSED'>(null)
  const confirm = useConfirm()
  const toast = useToast()
  const endRef = useRef<HTMLDivElement>(null)
  const t = ticket.data
  const messageCount = t?.messages.length ?? 0

  // New customer replies show up without a reload.
  const status = t?.status
  useEffect(() => {
    if (!status || status === 'CLOSED') return
    const timer = setInterval(() => {
      if (document.visibilityState !== 'visible') return
      supportService.get(id).then((fresh) => ticket.setData(fresh), () => {})
    }, POLL_MS)
    return () => clearInterval(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, status])

  useEffect(() => {
    if (messageCount > 0) endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messageCount])

  const apply = (fresh: SupportTicket) => {
    ticket.setData(fresh)
    notifySupportChanged()
  }

  const send = async (resolve = false) => {
    const body = reply.trim()
    if (!body || busy) return
    setBusy(resolve ? 'send-resolve' : 'send')
    try {
      let fresh = await supportService.reply(id, body)
      if (resolve) fresh = await supportService.setStatus(id, 'RESOLVED')
      apply(fresh)
      setReply('')
      toast.success(resolve ? 'Reply sent and ticket resolved' : 'Reply sent')
    } catch (err) {
      toast.error(getApiErrorMessage(err))
      void ticket.refetch()
    } finally {
      setBusy(null)
    }
  }

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) void send()
  }

  const setStatus = async (next: 'RESOLVED' | 'CLOSED') => {
    if (next === 'CLOSED') {
      const ok = await confirm({
        title: 'Close this ticket?',
        message: 'Closed tickets are final: neither you nor the customer can reply again.',
        confirmLabel: 'Close ticket',
        danger: true,
      })
      if (!ok) return
    }
    setBusy(next)
    try {
      apply(await supportService.setStatus(id, next))
      toast.success(next === 'CLOSED' ? 'Ticket closed' : 'Marked as resolved')
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setBusy(null)
    }
  }

  const crumbs = [{ label: 'Support', to: '/support' }, { label: t ? `SUP-${t.ticketNumber}` : 'Ticket' }]

  if (ticket.error) {
    return (
      <div>
        <PageHeader title="Support ticket" breadcrumbs={crumbs} />
        <ErrorBox message={ticket.error} onRetry={ticket.refetch} />
      </div>
    )
  }

  if (!t) {
    return (
      <div>
        <PageHeader title="Support ticket" breadcrumbs={crumbs} />
        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <Skeleton className="h-96 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    )
  }

  const name = customerName(t.user)
  const closed = t.status === 'CLOSED'
  const length = reply.trim().length

  return (
    <div>
      <PageHeader
        title={`SUP-${t.ticketNumber} · ${SUPPORT_REASON_LABELS[t.reason]}`}
        description={`Opened by ${name} ${timeAgo(t.createdAt)}`}
        breadcrumbs={crumbs}
        actions={
          !closed && (
            <div className="flex gap-2">
              {t.status !== 'RESOLVED' && (
                <Button
                  variant="outline"
                  leftIcon={<CheckCircle2 className="h-4 w-4" />}
                  isLoading={busy === 'RESOLVED'}
                  disabled={busy !== null}
                  onClick={() => void setStatus('RESOLVED')}
                >
                  Mark resolved
                </Button>
              )}
              <Button
                variant="ghost"
                leftIcon={<XCircle className="h-4 w-4" />}
                isLoading={busy === 'CLOSED'}
                disabled={busy !== null}
                onClick={() => void setStatus('CLOSED')}
              >
                Close
              </Button>
            </div>
          )
        }
      />

      <div className="grid items-start gap-6 lg:grid-cols-[1fr_320px]">
        {/* Conversation */}
        <section className="min-w-0 rounded-xl border border-gray-200 bg-gray-50 p-4 sm:p-6" aria-label="Conversation">
          <ol className="space-y-5">
            <Bubble who={name} support={false} body={t.description} at={t.createdAt} />
            {t.messages.map((m) => {
              const support = m.senderRole === 'ADMIN'
              const adminName = [m.sender.firstName, m.sender.lastName].filter(Boolean).join(' ')
              const who = support ? (adminName ? `${adminName} · Support` : 'Support') : name
              return <Bubble key={m.id} who={who} support={support} body={m.body} at={m.createdAt} />
            })}
          </ol>
          <div ref={endRef} />

          {closed ? (
            <p className="mt-6 flex items-center justify-center gap-2 rounded-lg bg-white px-4 py-3 text-sm text-gray-500">
              <Lock className="h-4 w-4" aria-hidden="true" /> Closed {t.closedAt ? formatDateTime(t.closedAt) : ''}. No more replies.
            </p>
          ) : (
            <div className="mt-6 rounded-xl border border-gray-200 bg-white p-3 focus-within:ring-2 focus-within:ring-gray-900/20">
              <label htmlFor="reply" className="sr-only">
                Reply to {name}
              </label>
              <textarea
                id="reply"
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                onKeyDown={onKeyDown}
                maxLength={MAX}
                rows={4}
                placeholder={`Reply to ${name}…`}
                className="w-full resize-y bg-transparent px-1 py-1 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
              />
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-3">
                <p className="text-xs text-gray-400">
                  Ctrl + Enter to send · {reply.length}/{MAX}
                </p>
                <div className="flex gap-2">
                  {t.status !== 'RESOLVED' && (
                    <Button
                      size="sm"
                      variant="outline"
                      isLoading={busy === 'send-resolve'}
                      disabled={length === 0 || busy !== null}
                      onClick={() => void send(true)}
                    >
                      Send &amp; resolve
                    </Button>
                  )}
                  <Button
                    size="sm"
                    leftIcon={<Send className="h-3.5 w-3.5" />}
                    isLoading={busy === 'send'}
                    disabled={length === 0 || busy !== null}
                    onClick={() => void send()}
                  >
                    Send reply
                  </Button>
                </div>
              </div>
            </div>
          )}
        </section>

        {/* Details */}
        <aside className="space-y-4 lg:sticky lg:top-4">
          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Customer</h2>
            <ul className="mt-3 space-y-2.5 text-sm">
              <li className="flex items-center gap-2.5 text-gray-900">
                <User className="h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" /> {name}
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" />
                <CopyCell value={t.user.phone} />
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="h-4 w-4 shrink-0 text-gray-400" aria-hidden="true" />
                {t.user.email ? <CopyCell value={t.user.email} /> : <span className="text-gray-400">No email</span>}
              </li>
            </ul>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-5">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Ticket</h2>
            <dl className="mt-3 space-y-2.5 text-sm">
              {[
                ['Status', <SupportStatusBadge key="s" status={t.status} />],
                ['Reason', SUPPORT_REASON_LABELS[t.reason]],
                ['Opened', formatDateTime(t.createdAt)],
                ['Last activity', timeAgo(t.lastMessageAt)],
                ['Replies', String(t.messages.length)],
                ...(t.closedAt ? [['Closed', formatDateTime(t.closedAt)]] : []),
              ].map(([label, value]) => (
                <div key={String(label)} className="flex items-center justify-between gap-3">
                  <dt className="text-gray-500">{label}</dt>
                  <dd className="text-right font-medium text-gray-900">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        </aside>
      </div>
    </div>
  )
}
