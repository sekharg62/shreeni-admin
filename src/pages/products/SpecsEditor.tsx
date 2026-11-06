import type { ReactNode } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import SortableList from '../../components/ui/SortableList'
import IconButton from '../../components/ui/IconButton'
import Button from '../../components/ui/Button'
import { SPEC_GROUP_LABELS, SpecGroup } from '../../constants/enums'
import { cn } from '../../lib/cn'
import { blankSpec, specErrors, type SpecRow } from './productForm'

const PRESETS: Record<SpecGroup, string[]> = {
  DETAILS: ['Fabric', 'Weave', 'Work', 'Pattern', 'Occasion', 'Border', 'Pallu', 'Transparency'],
  MANUFACTURING: ['Generic name', 'Net quantity', 'Packed by', 'Marketed by', 'Customer care'],
}

const input =
  'h-9 w-full rounded-md border bg-white px-2.5 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:ring-2'
const ok = 'border-gray-300 focus:border-gray-900 focus:ring-gray-900/10'
const bad = 'border-red-400 focus:ring-red-100'

type Props = {
  rows: SpecRow[]
  onChange: (rows: SpecRow[]) => void
  showErrors: boolean
}

/** Label/value rows in two groups, each drag-sortable. Saved with the product. */
export default function SpecsEditor({ rows, onChange, showErrors }: Props) {
  const errors = showErrors ? specErrors(rows) : {}

  const groupRows = (g: SpecGroup) => rows.filter((r) => r.group === g)
  const setGroup = (g: SpecGroup, next: SpecRow[]) =>
    onChange([...rows.filter((r) => r.group !== g), ...next].sort((a, b) => (a.group === b.group ? 0 : a.group === SpecGroup.DETAILS ? -1 : 1)))
  const update = (key: string, patch: Partial<SpecRow>) => onChange(rows.map((r) => (r.key === key ? { ...r, ...patch } : r)))

  return (
    <div className="space-y-6">
      {[SpecGroup.DETAILS, SpecGroup.MANUFACTURING].map((g) => {
        const list = groupRows(g)
        const used = new Set(list.map((r) => r.label.trim().toLowerCase()))
        return (
          <div key={g} data-testid={`specs-${g}`}>
            <h3 className="mb-2 text-sm font-semibold text-gray-900">{SPEC_GROUP_LABELS[g]}</h3>
            {list.length === 0 ? (
              <p className="mb-2 rounded-lg border border-dashed border-gray-200 px-3 py-3 text-xs text-gray-400">
                No rows yet — use the buttons below.
              </p>
            ) : (
              <SortableList
                items={list}
                getId={(r) => r.key}
                onReorder={(next) => setGroup(g, next)}
                className="gap-1.5"
                renderItem={(r, handle: ReactNode) => {
                  const e = errors[r.key] ?? {}
                  return (
                    <div className="flex items-start gap-2" data-testid="spec-row">
                      <div className="pt-0.5">{handle}</div>
                      <div className="w-44 shrink-0">
                        <input
                          aria-label="Specification label"
                          className={cn(input, e.label ? bad : ok)}
                          placeholder="Label"
                          value={r.label}
                          onChange={(ev) => update(r.key, { label: ev.target.value })}
                        />
                      </div>
                      <div className="flex-1">
                        <input
                          aria-label={`${r.label || 'Specification'} value`}
                          className={cn(input, e.value ? bad : ok)}
                          placeholder="Value"
                          value={r.value}
                          onChange={(ev) => update(r.key, { value: ev.target.value })}
                        />
                      </div>
                      <IconButton icon={Trash2} label="Remove row" tone="danger" onClick={() => onChange(rows.filter((x) => x.key !== r.key))} />
                    </div>
                  )
                }}
              />
            )}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Button size="sm" variant="outline" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => setGroup(g, [...list, blankSpec(g)])}>
                Add row
              </Button>
              {PRESETS[g]
                .filter((label) => !used.has(label.toLowerCase()))
                .map((label) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setGroup(g, [...list, blankSpec(g, label)])}
                    className="rounded-full border border-dashed border-gray-300 px-2.5 py-1 text-xs text-gray-600 hover:border-gray-500 hover:text-gray-900"
                  >
                    + {label}
                  </button>
                ))}
            </div>
          </div>
        )
      })}
      {showErrors && Object.keys(errors).length > 0 && (
        <p className="text-xs text-red-600">Fill in or remove the empty rows.</p>
      )}
    </div>
  )
}
