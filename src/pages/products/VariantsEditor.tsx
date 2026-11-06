import { Plus, Trash2, Wand2 } from 'lucide-react'
import Button from '../../components/ui/Button'
import IconButton from '../../components/ui/IconButton'
import Switch from '../../components/ui/Switch'
import { cn } from '../../lib/cn'
import { blankVariant, suggestSku, variantErrors, type VariantRow } from './productForm'

const SIZE_PRESETS = ['Free Size', 'XS', 'S', 'M', 'L', 'XL', 'XXL']

type Props = {
  rows: VariantRow[]
  onChange: (rows: VariantRow[]) => void
  /** for SKU suggestions */
  skuBase: string
  /** show row errors (after a save attempt) */
  showErrors: boolean
  error?: string
}

const cell =
  'h-9 w-full rounded-md border bg-white px-2.5 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 focus:ring-2'
const ok = 'border-gray-300 focus:border-gray-900 focus:ring-gray-900/10'
const bad = 'border-red-400 focus:ring-red-100'

/** Sizes of the product, each with its own SKU, stock and optional price. */
export default function VariantsEditor({ rows, onChange, skuBase, showErrors, error }: Props) {
  const errors = showErrors ? variantErrors(rows) : {}
  const update = (key: string, patch: Partial<VariantRow>) =>
    onChange(rows.map((r) => (r.key === key ? { ...r, ...patch } : r)))
  const used = new Set(rows.map((r) => r.size.trim().toLowerCase()))
  const totalStock = rows.filter((r) => r.isActive).reduce((s, r) => s + (Number(r.stock) || 0), 0)

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
              <th className="pb-2 pr-2">Size</th>
              <th className="pb-2 pr-2">SKU</th>
              <th className="w-24 pb-2 pr-2">Stock</th>
              <th className="w-36 pb-2 pr-2">Price (optional)</th>
              <th className="w-16 pb-2 pr-2">On sale</th>
              <th className="w-10 pb-2" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const e = errors[r.key] ?? {}
              return (
                <tr key={r.key} className="align-top" data-testid={`variant-row-${i}`}>
                  <td className="py-1.5 pr-2">
                    <input
                      aria-label={`Size ${i + 1}`}
                      className={cn(cell, e.size ? bad : ok)}
                      placeholder="Free Size"
                      value={r.size}
                      onChange={(ev) => update(r.key, { size: ev.target.value })}
                    />
                    {e.size && <p className="mt-0.5 text-xs text-red-600">{e.size}</p>}
                  </td>
                  <td className="py-1.5 pr-2">
                    <div className="flex gap-1">
                      <input
                        aria-label={`SKU ${i + 1}`}
                        className={cn(cell, 'font-mono uppercase', e.sku ? bad : ok)}
                        placeholder="SKU-CODE"
                        value={r.sku}
                        onChange={(ev) => update(r.key, { sku: ev.target.value.toUpperCase().replace(/\s/g, '') })}
                      />
                      <IconButton
                        icon={Wand2}
                        label="Suggest SKU"
                        onClick={() => update(r.key, { sku: suggestSku(skuBase, r.size) })}
                      />
                    </div>
                    {e.sku && <p className="mt-0.5 text-xs text-red-600">{e.sku}</p>}
                  </td>
                  <td className="py-1.5 pr-2">
                    <input
                      aria-label={`Stock ${i + 1}`}
                      inputMode="numeric"
                      className={cn(cell, e.stock ? bad : ok)}
                      placeholder="0"
                      value={r.stock}
                      onChange={(ev) => update(r.key, { stock: ev.target.value })}
                    />
                    {e.stock ? (
                      <p className="mt-0.5 text-xs text-red-600">{e.stock}</p>
                    ) : r.reservedStock > 0 ? (
                      <p className="mt-0.5 text-xs text-gray-500">{r.reservedStock} in checkouts</p>
                    ) : null}
                  </td>
                  <td className="py-1.5 pr-2">
                    <div className={cn('flex h-9 items-center gap-1 rounded-md border bg-white px-2.5', e.price ? bad : ok)}>
                      <span className="text-gray-400">₹</span>
                      <input
                        aria-label={`Price ${i + 1}`}
                        inputMode="decimal"
                        className="h-full w-full bg-transparent text-sm outline-none placeholder:text-gray-400"
                        placeholder="Same as product"
                        value={r.price}
                        onChange={(ev) => update(r.key, { price: ev.target.value })}
                      />
                    </div>
                    {e.price && <p className="mt-0.5 text-xs text-red-600">{e.price}</p>}
                  </td>
                  <td className="py-1.5 pr-2 pt-2">
                    <Switch checked={r.isActive} onChange={(on) => update(r.key, { isActive: on })} />
                  </td>
                  <td className="py-1.5">
                    <IconButton
                      icon={Trash2}
                      label={`Remove size ${r.size || i + 1}`}
                      tone="danger"
                      onClick={() => onChange(rows.filter((x) => x.key !== r.key))}
                    />
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {error && rows.length === 0 && <p className="mt-1 text-xs text-red-600">{error}</p>}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button size="sm" variant="outline" leftIcon={<Plus className="h-3.5 w-3.5" />} onClick={() => onChange([...rows, blankVariant()])}>
          Add size
        </Button>
        <span className="text-xs text-gray-400">Quick add:</span>
        {SIZE_PRESETS.filter((s) => !used.has(s.toLowerCase())).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => onChange([...rows, { ...blankVariant(s), sku: suggestSku(skuBase, s) }])}
            className="rounded-full border border-dashed border-gray-300 px-2.5 py-1 text-xs text-gray-600 hover:border-gray-500 hover:text-gray-900"
          >
            + {s}
          </button>
        ))}
        <span className="ml-auto text-xs text-gray-500" data-testid="total-stock">
          Total in stock: <strong className="text-gray-900">{totalStock}</strong>
        </span>
      </div>
    </div>
  )
}
