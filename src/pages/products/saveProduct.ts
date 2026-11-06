import {
  productCollectionService,
  productColorService,
  productService,
  productSpecificationService,
  productTagService,
  productVariantService,
  relatedProductService,
} from '../../services'
import type { ProductDetail } from '../../types/models'
import {
  fromProduct,
  orderedSpecs,
  specPayload,
  toCorePayload,
  variantPayload,
  type ProductValues,
} from './productForm'

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)
const sameSet = (a: string[], b: string[]) => same([...a].sort(), [...b].sort())

export type SaveResult = {
  /** The form values with ids filled in for rows created during this save. */
  values: ProductValues
  /** Number of API calls that changed something. */
  changes: number
  error?: unknown
}

/**
 * Save an existing product: compares the form with what the server has and only
 * sends what changed — product fields (PUT), then variants, specifications,
 * tags, collections, related products and colors.
 *
 * Steps run one after another. If one fails, the rows created before it already
 * have their new ids in `values`, so saving again won't create duplicates.
 */
export async function saveProductChanges(server: ProductDetail, input: ProductValues): Promise<SaveResult> {
  const id = server.id
  const before = fromProduct(server)
  const v: ProductValues = structuredClone(input)
  let changes = 0
  const run = async (fn: () => Promise<unknown>) => {
    await fn()
    changes++
  }

  try {
    // 1. Product's own fields
    const core = toCorePayload(v, server.sortOrder)
    if (!same(core, toCorePayload(before, server.sortOrder))) {
      await run(() => productService.replace(id, core))
    }

    // 2. Variants — delete first so a size/SKU can be reused by a new row
    const keepIds = new Set(v.variants.map((r) => r.id).filter(Boolean))
    for (const old of before.variants) {
      if (!keepIds.has(old.id)) await run(() => productVariantService.remove(id, old.id!))
    }
    for (const row of v.variants) {
      if (!row.id) continue
      const old = before.variants.find((o) => o.id === row.id)
      if (old && !same(variantPayload(row), variantPayload(old))) {
        await run(() => productVariantService.replace(id, row.id!, variantPayload(row)))
      }
    }
    for (const row of v.variants) {
      if (row.id) continue
      const created = await productVariantService.create(id, variantPayload(row))
      row.id = created.id
      changes++
    }

    // 3. Specifications (sortOrder = position in Details, then Manufacturing)
    const specs = orderedSpecs(v.specs)
    const keepSpecs = new Set(specs.map((s) => s.id).filter(Boolean))
    for (const old of before.specs) {
      if (!keepSpecs.has(old.id)) await run(() => productSpecificationService.remove(id, old.id!))
    }
    for (const [i, row] of specs.entries()) {
      if (!row.id) {
        const created = await productSpecificationService.create(id, specPayload(row, i))
        row.id = created.id // same object as in v.specs
        changes++
        continue
      }
      const old = before.specs.find((o) => o.id === row.id)
      const { sortOrder: _a, ...now } = specPayload(row, i)
      const { sortOrder: _b, ...was } = old ? specPayload(old, 0) : { sortOrder: 0 }
      if (old && !same(now, was)) {
        await run(() => productSpecificationService.replace(id, row.id!, specPayload(row, i)))
      }
    }
    const newOrder = specs.map((s) => s.id!)
    if (newOrder.length && !same(newOrder, orderedSpecs(before.specs).map((s) => s.id))) {
      await run(() => productSpecificationService.reorder(id, newOrder))
    }

    // 4. Links
    if (!sameSet(v.tagIds, before.tagIds)) await run(() => productTagService.set(id, v.tagIds))
    if (!sameSet(v.collectionIds, before.collectionIds))
      await run(() => productCollectionService.set(id, v.collectionIds))
    const relatedIds = v.related.map((r) => r.id)
    if (!sameSet(relatedIds, before.related.map((r) => r.id)))
      await run(() => relatedProductService.set(id, relatedIds))

    // 5. Colors
    if (v.primaryColorId !== before.primaryColorId || v.secondaryColorId !== before.secondaryColorId) {
      if (v.primaryColorId) {
        await run(() =>
          productColorService.set(id, {
            primaryColorId: v.primaryColorId,
            secondaryColorId: v.secondaryColorId || null,
          }),
        )
      } else {
        await run(() => productColorService.clear(id))
      }
    }
    return { values: v, changes }
  } catch (error) {
    return { values: v, changes, error }
  }
}
