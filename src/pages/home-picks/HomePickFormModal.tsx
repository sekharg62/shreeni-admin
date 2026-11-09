import { useState } from 'react'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Switch from '../../components/ui/Switch'
import DateRangePicker, { type DateRange } from '../../components/ui/DateRangePicker'
import { useToast } from '../../context/ToastContext'
import { homePickService, getApiErrorMessage } from '../../services'
import { cn } from '../../lib/cn'
import type { HomePick } from '../../types/models'

const BADGE_MAX = 30

/** Quick picks for the ribbon. "Bestseller" is left out on purpose: only use it for items that really sell. */
const BADGE_SUGGESTIONS = ['Handpicked', 'Customer favourite', 'New arrival', 'Limited stock', 'Festive pick']

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0)
const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999)

type Props = {
  pick: HomePick
  onClose: () => void
  onSaved: (saved: HomePick) => void
}

/**
 * Edit a pick's ribbon, on/off and optional dates. The product itself is edited on its own page.
 * Render it with `key={pick.id}` so each pick opens with its own values.
 */
export default function HomePickFormModal({ pick, onClose, onSaved }: Props) {
  const toast = useToast()
  const [badge, setBadge] = useState(pick.badge ?? '')
  const [isActive, setIsActive] = useState(pick.isActive)
  const [range, setRange] = useState<DateRange>({
    start: pick.startsAt ? new Date(pick.startsAt) : null,
    end: pick.endsAt ? new Date(pick.endsAt) : null,
  })
  const [saving, setSaving] = useState(false)

  const badgeError = badge.trim().length > BADGE_MAX ? `At most ${BADGE_MAX} characters` : undefined
  const saysBestseller = /best\s*-?\s*sell/i.test(badge)

  const save = async () => {
    if (badgeError) return
    setSaving(true)
    try {
      const saved = await homePickService.update(pick.id, {
        badge: badge.trim() || null,
        isActive,
        startsAt: range.start ? startOfDay(range.start).toISOString() : null,
        endsAt: range.end ? endOfDay(range.end).toISOString() : null,
      })
      toast.success('Homepage pick saved')
      onSaved(saved)
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={`Edit “${pick.product.name}”`}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => void save()} isLoading={saving} disabled={Boolean(badgeError)} data-testid="save-home-pick">
            Save changes
          </Button>
        </>
      }
    >
      <form
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault()
          void save()
        }}
      >
        <div>
          <Input
            id="home-pick-badge"
            label="Badge on the card (optional)"
            placeholder="e.g. Customer favourite"
            value={badge}
            maxLength={BADGE_MAX + 10}
            onChange={(e) => setBadge(e.target.value)}
            error={badgeError}
            hint={`${badge.trim().length}/${BADGE_MAX} · leave empty for no badge`}
          />
          <div className="mt-2 flex flex-wrap gap-1.5">
            {BADGE_SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setBadge(s)}
                className={cn(
                  'rounded-full border px-2.5 py-1 text-xs transition-colors',
                  badge === s
                    ? 'border-gray-900 bg-gray-900 text-white'
                    : 'border-gray-200 text-gray-600 hover:border-gray-400',
                )}
              >
                {s}
              </button>
            ))}
          </div>
          {saysBestseller && (
            <p className="mt-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
              Only call it a bestseller if it really sells well. Shoppers treat it as a fact, and a false claim
              can count as misleading advertising.
            </p>
          )}
        </div>

        <div>
          <DateRangePicker
            label="Show only between these dates (optional)"
            placeholder="Always, while switched on"
            value={range}
            onChange={setRange}
          />
          <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
            <span>
              {range.start && !range.end
                ? 'Pick an end date, or leave it open.'
                : 'Starts at 12:00 am on the first day, ends at 11:59 pm on the last.'}
            </span>
            {(range.start || range.end) && (
              <button
                type="button"
                className="font-medium text-gray-700 hover:underline"
                onClick={() => setRange({ start: null, end: null })}
              >
                Clear dates
              </button>
            )}
          </div>
        </div>

        <Switch checked={isActive} onChange={setIsActive} label="Show on the homepage" />
      </form>
    </Modal>
  )
}
