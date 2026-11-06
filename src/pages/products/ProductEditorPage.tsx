import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { AlertCircle, Loader2, Trash2 } from 'lucide-react'
import PageHeader from '../../components/layout/PageHeader'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Textarea from '../../components/ui/Textarea'
import Dropdown from '../../components/ui/Dropdown'
import SearchableSelect from '../../components/ui/SearchableSelect'
import MultiSelect from '../../components/ui/MultiSelect'
import ButtonGroup from '../../components/ui/ButtonGroup'
import Switch from '../../components/ui/Switch'
import ColorChoice from '../../components/ui/ColorChoice'
import ProductPicker from '../../components/ui/ProductPicker'
import Skeleton from '../../components/ui/Skeleton'
import ErrorBox from '../../components/ui/ErrorBox'
import { CatalogStatusBadge } from '../../components/ui/StatusBadge'
import { QueuedImages, LiveImages, type QueuedImage } from './ProductImagesSection'
import VariantsEditor from './VariantsEditor'
import SpecsEditor from './SpecsEditor'
import { useApi } from '../../hooks/useApi'
import { useForm } from '../../hooks/useForm'
import { useUnsavedChangesGuard } from '../../hooks/useUnsavedChangesGuard'
import { useToast } from '../../context/ToastContext'
import { useConfirm } from '../../context/ConfirmContext'
import {
  categoryService,
  collectionService,
  colorService,
  getApiErrorMessage,
  productImageService,
  productService,
  s3UploadService,
  tagService,
} from '../../services'
import { CATALOG_STATUS_OPTIONS, CatalogStatus, GENDER_OPTIONS, type Gender } from '../../constants/enums'
import { GST_RATE_OPTIONS } from '../../constants/app'
import { discountPercent, formatPaise, rupeesToPaise } from '../../lib/money'
import { slugify } from '../../lib/validators'
import { flattenWithPaths } from '../../lib/categoryTree'
import { cn } from '../../lib/cn'
import type { ProductDetail, ProductImage } from '../../types/models'
import {
  SECTION_FIELDS,
  emptyProduct,
  fromProduct,
  toCreatePayload,
  validateProduct,
  type ProductValues,
} from './productForm'
import { saveProductChanges } from './saveProduct'

const SECTIONS = [
  { id: 'basics', label: 'Basics' },
  { id: 'images', label: 'Photos' },
  { id: 'pricing', label: 'Price & tax' },
  { id: 'variants', label: 'Sizes & stock' },
  { id: 'details', label: 'Saree details' },
  { id: 'specs', label: 'Specifications' },
  { id: 'colors', label: 'Colors' },
  { id: 'organize', label: 'Tags & related' },
  { id: 'maker', label: 'Maker info' },
  { id: 'visibility', label: 'Visibility' },
] as const

const STATUS_HINT: Record<CatalogStatus, string> = {
  DRAFT: 'Not in the store yet — finish it at your own pace.',
  PUBLISHED: 'Live in the store.',
  UNPUBLISHED: 'Hidden from the store for now.',
  DISCONTINUED: 'No longer sold. Hidden from the store; past orders are kept.',
}

function Section({ id, title, description, error, children }: { id: string; title: string; description?: string; error?: string; children: ReactNode }) {
  return (
    <section id={id} data-section={id} className="scroll-mt-4 rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
      <header className="mb-4">
        <h2 className="text-base font-semibold text-gray-900">{title}</h2>
        {description && <p className="mt-0.5 text-sm text-gray-500">{description}</p>}
        {error && (
          <p className="mt-2 flex items-center gap-1.5 text-sm text-red-600" role="alert">
            <AlertCircle className="h-4 w-4" /> {error}
          </p>
        )}
      </header>
      {children}
    </section>
  )
}

const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })

export default function ProductEditorPage({ id }: { id?: string }) {
  const isNew = !id
  const navigate = useNavigate()
  const toast = useToast()
  const confirm = useConfirm()
  const form = useForm<ProductValues>(emptyProduct(), validateProduct)

  const lookups = useApi(
    () =>
      Promise.all([
        categoryService.tree(),
        tagService.list({ limit: 100, sortBy: 'name', sortOrder: 'asc' }),
        collectionService.list({ limit: 100, sortBy: 'name', sortOrder: 'asc' }),
        colorService.list({ limit: 100, sortBy: 'name', sortOrder: 'asc' }),
      ]),
    [],
  )
  const [server, setServer] = useState<ProductDetail | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [gallery, setGallery] = useState<ProductImage[]>([])
  const [queued, setQueued] = useState<QueuedImage[]>([])
  const [primaryKey, setPrimaryKey] = useState<string | null>(null)
  const [uploadPct, setUploadPct] = useState<number | null>(null)
  const [active, setActive] = useState<string>('basics')

  const load = useCallback(async () => {
    if (!id) return
    setLoadError(null)
    try {
      const p = await productService.get(id)
      setServer(p)
      setGallery(p.images)
      form.reset(fromProduct(p))
    } catch (err) {
      setLoadError(getApiErrorMessage(err, 'Could not load this product'))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])
  useEffect(() => void load(), [load])

  const dirty = form.dirty || queued.length > 0
  useUnsavedChangesGuard(dirty && !form.submitting)

  // Highlight the section in view in the side menu.
  useEffect(() => {
    const root = document.querySelector('main')
    if (!root) return
    const onScroll = () => {
      const top = root.getBoundingClientRect().top + 120
      let current: string = SECTIONS[0].id
      for (const s of SECTIONS) {
        const el = document.getElementById(s.id)
        if (el && el.getBoundingClientRect().top <= top) current = s.id
      }
      setActive(current)
    }
    root.addEventListener('scroll', onScroll, { passive: true })
    return () => root.removeEventListener('scroll', onScroll)
  }, [])

  const [tree, tags, collections, colors] = lookups.data ?? [[], { data: [] }, { data: [] }, { data: [] }]
  const categoryOptions = useMemo(() => flattenWithPaths(tree).map((c) => ({ label: c.path, value: c.id })), [tree])
  const v = form.values
  const e = form.errors
  const set = form.set

  const sectionHasError = (sid: string) => (SECTION_FIELDS[sid] ?? []).some((k) => e[k])

  const reportError = (err: unknown) => {
    const message = getApiErrorMessage(err, 'Could not save the product.')
    const status = axios.isAxiosError(err) ? err.response?.status : undefined
    if (status === 409 && /sku|size/i.test(message)) {
      form.setServerError('variants', message)
      scrollTo('variants')
    } else if (status === 409 && /slug/i.test(message)) {
      form.setServerError('slug', message)
      scrollTo('basics')
    }
    toast.error(message)
  }

  const save = async () => {
    const errors = validateProduct(v)
    if (Object.keys(errors).length) {
      const first = SECTIONS.find((s) => (SECTION_FIELDS[s.id] ?? []).some((k) => k in errors))
      if (first) scrollTo(first.id)
      toast.error('Please fix the highlighted fields')
    }
    await form.submit(async (values) => {
      if (isNew) {
        let created: ProductDetail
        try {
          created = await productService.create(toCreatePayload(values))
        } catch (err) {
          reportError(err)
          return
        }
        if (queued.length) {
          try {
            setUploadPct(0)
            const uploaded = await s3UploadService.uploadProductImages(created.id, queued.map((q) => q.file), setUploadPct)
            const idx = queued.findIndex((q) => q.key === primaryKey)
            if (idx > 0 && uploaded[idx]) await productImageService.setPrimary(created.id, uploaded[idx].id)
          } catch (err) {
            toast.error(`Product created, but the photos didn't upload: ${getApiErrorMessage(err)}. Add them again below.`)
          } finally {
            setUploadPct(null)
          }
        }
        queued.forEach((q) => URL.revokeObjectURL(q.url))
        setQueued([])
        toast.success(`“${created.name}” created`)
        navigate(`/products/${created.id}`, { replace: true })
        return
      }

      const result = await saveProductChanges(server!, values)
      let fresh: ProductDetail | null = null
      try {
        fresh = await productService.get(server!.id)
      } catch {
        /* keep the old copy if the reload fails */
      }
      if (fresh) {
        setServer(fresh)
        setGallery(fresh.images)
      }
      if (result.error) {
        if (fresh) {
          form.reset(fromProduct(fresh))
          form.patch(result.values) // keep what was typed; rows already created now carry their ids
        }
        reportError(result.error)
      } else {
        if (fresh) form.reset(fromProduct(fresh))
        toast.success(result.changes ? 'Product saved' : 'Nothing to save')
      }
    })
  }

  const discard = async () => {
    const ok = await confirm({ title: 'Discard changes?', message: 'Everything you changed since the last save is undone.', confirmLabel: 'Discard', danger: true })
    if (!ok) return
    form.reset()
    queued.forEach((q) => URL.revokeObjectURL(q.url))
    setQueued([])
    setPrimaryKey(null)
  }

  const remove = async () => {
    if (!server) return
    const ok = await confirm({
      title: `Delete "${server.name}"?`,
      message: 'Its photos, sizes and specifications are deleted too. To just hide it, set it to Discontinued instead.',
      danger: true,
    })
    if (!ok) return
    try {
      await productService.remove(server.id)
      toast.success('Product deleted')
      navigate('/products')
    } catch (err) {
      toast.error(getApiErrorMessage(err))
    }
  }

  // ── Loading / error states ────────────────────────────────────────────────
  const header = (
    <PageHeader
      title={isNew ? 'New product' : server?.name ?? 'Product'}
      breadcrumbs={[{ label: 'Catalog' }, { label: 'Products', to: '/products' }, { label: isNew ? 'New' : 'Edit' }]}
      actions={
        server && (
          <>
            <CatalogStatusBadge status={server.status} />
            <Button variant="outline" leftIcon={<Trash2 className="h-4 w-4" />} onClick={() => void remove()}>
              Delete
            </Button>
          </>
        )
      }
    />
  )
  if (loadError || lookups.error)
    return (
      <div>
        {header}
        <ErrorBox message={loadError ?? lookups.error!} onRetry={() => (loadError ? void load() : void lookups.refetch())} />
      </div>
    )
  if (!lookups.data || (!isNew && !server))
    return (
      <div>
        {header}
        <div className="grid gap-6 lg:grid-cols-[180px_minmax(0,1fr)]">
          <Skeleton className="hidden h-72 lg:block" />
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-56 w-full rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    )

  const off = discountPercent(rupeesToPaise(Number(v.originalPrice) || 0), v.discountPrice ? rupeesToPaise(Number(v.discountPrice)) : null)
  const selling = Number(v.discountPrice) > 0 ? Number(v.discountPrice) : Number(v.originalPrice)

  return (
    <div>
      {header}

      <div className="grid gap-6 lg:grid-cols-[180px_minmax(0,1fr)]">
        {/* Side menu */}
        <nav className="hidden lg:block" aria-label="Product sections">
          <ul className="sticky top-0 space-y-0.5">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => scrollTo(s.id)}
                  aria-current={active === s.id ? 'true' : undefined}
                  className={cn(
                    'flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors',
                    active === s.id ? 'bg-gray-900 font-medium text-white' : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900',
                  )}
                >
                  {s.label}
                  {sectionHasError(s.id) && <span className="h-2 w-2 rounded-full bg-red-500" aria-label="has errors" />}
                </button>
              </li>
            ))}
          </ul>
        </nav>

        <form
          className="min-w-0 space-y-5"
          onSubmit={(ev) => {
            ev.preventDefault()
            void save()
          }}
        >
          <Section id="basics" title="Basics" description="What shoppers see first.">
            <div className="space-y-4">
              <Input id="product-name" label="Name" placeholder="Red Jamdani Handloom Saree" value={v.name} onChange={(ev) => set('name', ev.target.value)} error={e.name} />
              <Input
                id="product-slug"
                label="Slug"
                placeholder={slugify(v.name) || 'auto-generated-from-name'}
                value={v.slug}
                onChange={(ev) => set('slug', ev.target.value)}
                error={e.slug}
                hint={`Store URL: /products/${v.slug || slugify(v.name) || '…'}`}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <SearchableSelect label="Category" options={categoryOptions} value={v.categoryId || null} onChange={(c) => set('categoryId', c)} placeholder="Choose a category" />
                  {e.categoryId && <p className="mt-1 text-xs text-red-600">{e.categoryId}</p>}
                </div>
                <Dropdown label="For" options={GENDER_OPTIONS} value={v.gender} onChange={(g) => set('gender', g as Gender)} />
              </div>
              <Input
                id="product-short"
                label="Short description (optional)"
                placeholder="Soft handloom cotton with a zari border"
                value={v.shortDescription}
                onChange={(ev) => set('shortDescription', ev.target.value)}
                hint="One line under the name on product cards."
              />
              <Textarea id="product-description" label="Description" rows={5} value={v.description} onChange={(ev) => set('description', ev.target.value)} error={e.description} placeholder="Describe the weave, feel, drape and occasion…" />
              <Textarea id="product-story" label="The story (optional)" rows={3} value={v.story} onChange={(ev) => set('story', ev.target.value)} placeholder="Who wove it, where, and the tradition behind it." />
            </div>
          </Section>

          <Section id="images" title="Photos" description={isNew ? 'Pick up to 10 now; you can add more after saving.' : 'Changes to photos save immediately.'}>
            {isNew ? (
              <QueuedImages
                value={queued}
                primaryKey={primaryKey}
                onChange={(q, p) => {
                  setQueued(q)
                  setPrimaryKey(p)
                }}
              />
            ) : (
              <LiveImages productId={server!.id} images={gallery} onChange={setGallery} />
            )}
          </Section>

          <Section id="pricing" title="Price & tax" description="Prices include GST.">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input id="product-price" label="Price (MRP)" inputMode="decimal" placeholder="4999" leftIcon={<span className="text-sm">₹</span>} value={v.originalPrice} onChange={(ev) => set('originalPrice', ev.target.value)} error={e.originalPrice} />
              <Input
                id="product-sale-price"
                label="Sale price (optional)"
                inputMode="decimal"
                placeholder="3999"
                leftIcon={<span className="text-sm">₹</span>}
                suffix={off > 0 ? <span className="font-semibold text-green-700">-{off}%</span> : undefined}
                value={v.discountPrice}
                onChange={(ev) => set('discountPrice', ev.target.value)}
                error={e.discountPrice}
                hint={selling > 0 ? `Shoppers pay ${formatPaise(rupeesToPaise(selling))}` : undefined}
              />
              <Dropdown label="GST rate" options={GST_RATE_OPTIONS} value={v.gstRate} onChange={(r) => set('gstRate', r)} />
              <Input id="product-hsn" label="HSN code (optional)" inputMode="numeric" placeholder="5208" value={v.hsnCode} onChange={(ev) => set('hsnCode', ev.target.value)} error={e.hsnCode} hint="For GST invoices — cotton sarees are usually 5208, silk 5007." />
            </div>
          </Section>

          <Section id="variants" title="Sizes & stock" description="Each size has its own SKU and stock. Most sarees have one “Free Size”." error={e.variants}>
            <VariantsEditor rows={v.variants} onChange={(rows) => set('variants', rows)} skuBase={v.slug || slugify(v.name)} showErrors={Boolean(e.variants)} error={e.variants} />
          </Section>

          <Section id="details" title="Saree details">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input id="product-fabric" label="Fabric" placeholder="Pure cotton" value={v.fabric} onChange={(ev) => set('fabric', ev.target.value)} />
              <Input id="product-series" label="Series / collection name (optional)" placeholder="Glitter Gulkand" value={v.collectionName} onChange={(ev) => set('collectionName', ev.target.value)} />
              <Input id="product-length" label="Length" inputMode="decimal" placeholder="550" suffix="cm" value={v.lengthCm} onChange={(ev) => set('lengthCm', ev.target.value)} error={e.lengthCm} />
              <Input id="product-width" label="Width" inputMode="decimal" placeholder="115" suffix="cm" value={v.widthCm} onChange={(ev) => set('widthCm', ev.target.value)} error={e.widthCm} />
              <div className="sm:col-span-2">
                <div className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Comes with a blouse piece</p>
                    <p className="text-xs text-gray-500">Shown as a highlight on the product page.</p>
                  </div>
                  <Switch checked={v.blousePiece} onChange={(on) => set('blousePiece', on)} />
                </div>
                {v.blousePiece && (
                  <div className="mt-3">
                    <Input id="product-blouse" label="Blouse piece details" placeholder="Unstitched, 80 cm, matching colour" value={v.blousePieceInfo} onChange={(ev) => set('blousePieceInfo', ev.target.value)} />
                  </div>
                )}
              </div>
              <div className="sm:col-span-2">
                <Input id="product-wash" label="Wash care" placeholder="Dry clean only" value={v.washCare} onChange={(ev) => set('washCare', ev.target.value)} />
              </div>
            </div>
          </Section>

          <Section id="specs" title="Specifications" description="Extra rows for the product page tables. Drag to reorder." error={e.specs}>
            <SpecsEditor rows={v.specs} onChange={(rows) => set('specs', rows)} showErrors={Boolean(e.specs)} />
          </Section>

          <Section id="colors" title="Colors" description={colors.data.length ? 'Used for the store’s color filter.' : undefined}>
            {colors.data.length === 0 ? (
              <p className="text-sm text-gray-500">No colors yet — add some on the Colors page first.</p>
            ) : (
              <div className="space-y-4">
                <ColorChoice
                  label="Primary color"
                  colors={colors.data}
                  value={v.primaryColorId}
                  onChange={(c) => form.patch({ primaryColorId: c, ...(c === '' || c === v.secondaryColorId ? { secondaryColorId: '' } : {}) })}
                />
                <ColorChoice
                  label="Secondary color (optional)"
                  colors={colors.data}
                  value={v.secondaryColorId}
                  onChange={(c) => set('secondaryColorId', c)}
                  disabledIds={v.primaryColorId ? [v.primaryColorId] : colors.data.map((c) => c.id)}
                  error={e.secondaryColorId}
                />
              </div>
            )}
          </Section>

          <Section id="organize" title="Tags, collections & related">
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <MultiSelect label="Tags" placeholder={tags.data.length ? 'Choose tags' : 'No tags yet'} options={tags.data.map((t) => ({ label: t.name, value: t.id }))} value={v.tagIds} onChange={(ids) => set('tagIds', ids)} />
                <MultiSelect label="Collections" placeholder={collections.data.length ? 'Choose collections' : 'No collections yet'} options={collections.data.map((c) => ({ label: c.name, value: c.id }))} value={v.collectionIds} onChange={(ids) => set('collectionIds', ids)} />
              </div>
              <ProductPicker label="You may also like" value={v.related} onChange={(r) => set('related', r)} excludeId={server?.id} />
            </div>
          </Section>

          <Section id="maker" title="Maker info" description="Required on Indian e-commerce listings (Legal Metrology).">
            <div className="grid gap-4 sm:grid-cols-2">
              <Input id="product-origin" label="Country of origin" placeholder="India" value={v.countryOfOrigin} onChange={(ev) => set('countryOfOrigin', ev.target.value)} />
              <Input id="product-maker" label="Manufactured by" placeholder="Shreeni Handlooms" value={v.manufacturedBy} onChange={(ev) => set('manufacturedBy', ev.target.value)} />
              <div className="sm:col-span-2">
                <Textarea id="product-maker-address" label="Manufacturer address" rows={2} value={v.manufacturerAddress} onChange={(ev) => set('manufacturerAddress', ev.target.value)} />
              </div>
            </div>
          </Section>

          <Section id="visibility" title="Visibility">
            <div className="space-y-4">
              <div>
                <span className="mb-1.5 block text-sm font-medium text-gray-700">Status</span>
                <ButtonGroup size="sm" options={CATALOG_STATUS_OPTIONS} value={v.status} onChange={(s) => set('status', s as CatalogStatus)} />
                <p className="mt-1.5 text-xs text-gray-500">{STATUS_HINT[v.status]}</p>
              </div>
              <div className="flex items-center justify-between rounded-lg border border-gray-200 px-3 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-900">Featured</p>
                  <p className="text-xs text-gray-500">Shown in the homepage “Featured” row.</p>
                </div>
                <Switch checked={v.isFeatured} onChange={(on) => set('isFeatured', on)} />
              </div>
            </div>
          </Section>

          {/* Sticky save bar */}
          {(isNew || dirty) && (
            <div className="sticky bottom-0 z-20 -mx-6 -mb-6 flex items-center gap-3 border-t border-gray-200 bg-white/95 px-6 py-3 backdrop-blur" data-testid="save-bar">
              <p className="flex items-center gap-2 text-sm text-gray-600">
                {uploadPct !== null ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Uploading photos… {uploadPct}%
                  </>
                ) : isNew ? (
                  'New product — not saved yet'
                ) : (
                  <>
                    <span className="h-2 w-2 rounded-full bg-amber-500" /> Unsaved changes
                  </>
                )}
              </p>
              <div className="ml-auto flex gap-2">
                {isNew ? (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={async () => {
                      if (dirty && !(await confirm({ title: 'Discard this product?', message: 'Nothing has been saved yet.', confirmLabel: 'Discard', danger: true }))) return
                      navigate('/products')
                    }}
                  >
                    Cancel
                  </Button>
                ) : (
                  <Button type="button" variant="outline" onClick={() => void discard()} disabled={form.submitting}>
                    Discard
                  </Button>
                )}
                <Button type="submit" isLoading={form.submitting} data-testid="save-product">
                  {isNew ? 'Create product' : 'Save changes'}
                </Button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
