import { useEffect, useMemo } from 'react'
import { Sparkles, Ticket } from 'lucide-react'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Switch from '../../components/ui/Switch'
import ButtonGroup from '../../components/ui/ButtonGroup'
import DateRangePicker, { type DateRange } from '../../components/ui/DateRangePicker'
import { useForm } from '../../hooks/useForm'
import { useToast } from '../../context/ToastContext'
import { useConfirm } from '../../context/ConfirmContext'
import { discountService } from '../../services'
import { collectErrors, rules } from '../../lib/validators'
import { reportSaveError } from '../../lib/formErrors'
import { paiseToRupees, rupeesToPaise } from '../../lib/money'
import { describeDiscount, generateCode } from '../../lib/discount'
import { DiscountType } from '../../constants/enums'
import type { Discount } from '../../types/models'

type Values = {
  code: string
  description: string
  type: DiscountType
  /** percent, or rupees for FLAT */
  value: string
  /** rupees */
  maxDiscount: string
  /** rupees */
  minOrder: string
  usageLimit: string
  perUserLimit: string
  range: DateRange
  isActive: boolean
}

const CODE_REGEX = /^[A-Z0-9_-]{3,30}$/
const TYPE_OPTIONS = [
  { label: 'Percentage %', value: DiscountType.PERCENTAGE },
  { label: 'Flat amount ₹', value: DiscountType.FLAT },
]

const num = (s: string) => (s.trim() === '' ? null : Number(s))
const positiveInt = (s: string, label: string) => {
  const n = num(s)
  return n !== null && (!Number.isInteger(n) || n < 1) ? `${label} must be a whole number of at least 1` : undefined
}
const money = (s: string, label: string, min = 0) => {
  const n = num(s)
  if (n === null) return undefined
  if (Number.isNaN(n) || n < min) return `${label} must be ${min > 0 ? 'more than ₹0' : '₹0 or more'}`
  if (Math.round(n * 100) !== n * 100) return `${label} can have at most 2 decimals`
  return undefined
}

const validate = (v: Values) => {
  const value = num(v.value)
  const pct = v.type === DiscountType.PERCENTAGE
  return collectErrors({
    code: [
      rules.required(v.code, 'Code'),
      v.code && !CODE_REGEX.test(v.code) ? '3–30 characters: letters, numbers, - or _' : undefined,
    ],
    value: [
      rules.required(v.value, pct ? 'Percentage' : 'Amount'),
      value !== null && pct && (!Number.isInteger(value) || value < 1 || value > 100)
        ? 'Enter a whole percentage from 1 to 100'
        : undefined,
      !pct ? money(v.value, 'Amount', 0.01) : undefined,
    ],
    maxDiscount: [pct ? money(v.maxDiscount, 'Max discount', 0.01) : undefined],
    minOrder: [money(v.minOrder, 'Minimum order')],
    usageLimit: [positiveInt(v.usageLimit, 'Total uses')],
    perUserLimit: [
      positiveInt(v.perUserLimit, 'Uses per customer'),
      num(v.perUserLimit) !== null && num(v.usageLimit) !== null && num(v.perUserLimit)! > num(v.usageLimit)!
        ? 'Can’t be more than the total uses'
        : undefined,
    ],
    description: [rules.maxLength(v.description, 250, 'Note')],
  })
}

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0)
const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999)

function toValues(d: Discount | null): Values {
  return {
    code: d?.code ?? '',
    description: d?.description ?? '',
    type: d?.type ?? DiscountType.PERCENTAGE,
    value: d ? String(d.type === DiscountType.FLAT ? paiseToRupees(d.value) : d.value) : '',
    maxDiscount: d?.maxDiscountAmount ? String(paiseToRupees(d.maxDiscountAmount)) : '',
    minOrder: d?.minOrderValue ? String(paiseToRupees(d.minOrderValue)) : '',
    usageLimit: d?.usageLimit ? String(d.usageLimit) : '',
    perUserLimit: d?.perUserLimit ? String(d.perUserLimit) : '',
    range: { start: d?.startsAt ? new Date(d.startsAt) : null, end: d?.endsAt ? new Date(d.endsAt) : null },
    isActive: d?.isActive ?? true,
  }
}

/** Form values → API payload (money in paise, dates as whole days). */
function toPayload(v: Values) {
  const pct = v.type === DiscountType.PERCENTAGE
  const paise = (s: string) => (num(s) === null ? undefined : rupeesToPaise(Number(s)))
  return {
    code: v.code.trim().toUpperCase(),
    description: v.description.trim() || undefined,
    type: v.type,
    value: pct ? Number(v.value) : rupeesToPaise(Number(v.value)),
    maxDiscountAmount: pct ? paise(v.maxDiscount) : undefined,
    minOrderValue: paise(v.minOrder),
    usageLimit: num(v.usageLimit) ?? undefined,
    perUserLimit: num(v.perUserLimit) ?? undefined,
    startsAt: v.range.start ? startOfDay(v.range.start).toISOString() : undefined,
    endsAt: (v.range.end ?? null) ? endOfDay(v.range.end!).toISOString() : undefined,
    isActive: v.isActive,
  }
}

type Props = {
  open: boolean
  discount: Discount | null
  onClose: () => void
  onSaved: () => void
}

export default function DiscountFormModal({ open, discount, onClose, onSaved }: Props) {
  const toast = useToast()
  const confirm = useConfirm()
  const form = useForm<Values>(toValues(null), validate)
  const pct = form.values.type === DiscountType.PERCENTAGE

  useEffect(() => {
    if (open) form.reset(toValues(discount))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, discount])

  /** Live summary — only once the essentials are valid. */
  const summary = useMemo(() => {
    if (form.errors.value || validate(form.values).value || !form.values.value) return null
    const p = toPayload(form.values)
    return describeDiscount({
      type: p.type,
      value: p.value,
      maxDiscountAmount: p.maxDiscountAmount ?? null,
      minOrderValue: p.minOrderValue ?? null,
      usageLimit: p.usageLimit ?? null,
      perUserLimit: p.perUserLimit ?? null,
      startsAt: p.startsAt ?? null,
      endsAt: p.endsAt ?? null,
    })
  }, [form.values, form.errors.value])

  const close = async () => {
    if (form.dirty && !form.submitting) {
      const leave = await confirm({ title: 'Discard changes?', confirmLabel: 'Discard', danger: true })
      if (!leave) return
    }
    onClose()
  }

  const save = () =>
    form.submit(async (v) => {
      try {
        const payload = toPayload(v)
        if (discount) await discountService.replace(discount.id, payload)
        else await discountService.create(payload)
        toast.success(discount ? 'Discount updated' : `Discount ${payload.code} created`)
        onSaved()
      } catch (err) {
        reportSaveError(err, { toastError: toast.error, setFieldError: form.setServerError, conflictField: 'code' })
      }
    })

  return (
    <Modal
      open={open}
      onClose={() => void close()}
      title={discount ? `Edit ${discount.code}` : 'New discount code'}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={() => void close()}>
            Cancel
          </Button>
          <Button onClick={save} isLoading={form.submitting} data-testid="save-discount">
            {discount ? 'Save changes' : 'Create discount'}
          </Button>
        </>
      }
    >
      <form
        className="max-h-[70vh] space-y-5 overflow-y-auto pr-1"
        onSubmit={(e) => {
          e.preventDefault()
          void save()
        }}
      >
        <div className="flex items-end gap-2">
          <div className="flex-1">
            <Input
              id="discount-code"
              label="Code"
              placeholder="DIWALI20"
              value={form.values.code}
              onChange={(e) => form.set('code', e.target.value.toUpperCase().replace(/\s/g, ''))}
              error={form.errors.code}
              leftIcon={<Ticket className="h-4 w-4" />}
              className="font-mono tracking-wide"
              autoFocus
            />
          </div>
          <Button
            type="button"
            variant="outline"
            leftIcon={<Sparkles className="h-4 w-4" />}
            onClick={() => form.set('code', generateCode(form.values.type, form.values.value))}
            className={form.errors.code ? 'mb-5' : undefined}
          >
            Generate
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <span className="mb-1.5 block text-sm font-medium text-gray-700">Discount type</span>
            <ButtonGroup
              options={TYPE_OPTIONS}
              value={form.values.type}
              onChange={(t) => form.patch({ type: t as DiscountType, maxDiscount: '' })}
            />
          </div>
          <Input
            id="discount-value"
            label={pct ? 'Percentage off' : 'Amount off'}
            inputMode="decimal"
            placeholder={pct ? '20' : '500'}
            value={form.values.value}
            onChange={(e) => form.set('value', e.target.value)}
            error={form.errors.value}
            leftIcon={pct ? undefined : <span className="text-sm">₹</span>}
            suffix={pct ? '%' : undefined}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            id="discount-min-order"
            label="Minimum order (optional)"
            inputMode="decimal"
            placeholder="2000"
            value={form.values.minOrder}
            onChange={(e) => form.set('minOrder', e.target.value)}
            error={form.errors.minOrder}
            leftIcon={<span className="text-sm">₹</span>}
            hint="Cart subtotal needed to use the code."
          />
          {pct ? (
            <Input
              id="discount-max"
              label="Max discount (optional)"
              inputMode="decimal"
              placeholder="500"
              value={form.values.maxDiscount}
              onChange={(e) => form.set('maxDiscount', e.target.value)}
              error={form.errors.maxDiscount}
              leftIcon={<span className="text-sm">₹</span>}
              hint="Caps the saving on big orders."
            />
          ) : (
            <div className="hidden sm:block" />
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            id="discount-usage"
            label="Total uses (optional)"
            inputMode="numeric"
            placeholder="Unlimited"
            value={form.values.usageLimit}
            onChange={(e) => form.set('usageLimit', e.target.value)}
            error={form.errors.usageLimit}
            hint={discount ? `Used ${discount.usedCount} time${discount.usedCount === 1 ? '' : 's'} so far.` : 'Across all customers.'}
          />
          <Input
            id="discount-per-user"
            label="Uses per customer (optional)"
            inputMode="numeric"
            placeholder="Unlimited"
            value={form.values.perUserLimit}
            onChange={(e) => form.set('perUserLimit', e.target.value)}
            error={form.errors.perUserLimit}
          />
        </div>

        <div>
          <DateRangePicker
            label="Valid dates (optional)"
            placeholder="Always valid"
            value={form.values.range}
            onChange={(r) => form.set('range', r)}
          />
          <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
            <span>
              {form.values.range.start && !form.values.range.end
                ? 'Pick an end date, or leave it open.'
                : 'Starts at 12:00 am on the first day, ends at 11:59 pm on the last.'}
            </span>
            {(form.values.range.start || form.values.range.end) && (
              <button type="button" className="font-medium text-gray-700 hover:underline" onClick={() => form.set('range', { start: null, end: null })}>
                Clear dates
              </button>
            )}
          </div>
        </div>

        <Input
          id="discount-note"
          label="Internal note (optional)"
          placeholder="Diwali campaign — Instagram"
          value={form.values.description}
          onChange={(e) => form.set('description', e.target.value)}
          error={form.errors.description}
        />

        <div className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-3">
          <div>
            <p className="text-sm font-medium text-gray-900">Active</p>
            <p className="text-xs text-gray-500">Turn off to pause the code without deleting it.</p>
          </div>
          <Switch checked={form.values.isActive} onChange={(on) => form.set('isActive', on)} />
        </div>

        <div className="rounded-lg bg-gray-900 px-4 py-3 text-sm text-white" data-testid="discount-summary">
          <p className="text-xs uppercase tracking-wide text-gray-400">Shoppers get</p>
          <p className="mt-0.5 font-medium">{summary ?? 'Enter a value to see the summary'}</p>
        </div>
        <button type="submit" className="hidden" />
      </form>
    </Modal>
  )
}
