import { useEffect } from 'react'
import { ExternalLink } from 'lucide-react'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import ButtonGroup from '../../components/ui/ButtonGroup'
import ImageField, { emptyImage, type ImageValue } from '../../components/ui/ImageField'
import { useForm } from '../../hooks/useForm'
import { useToast } from '../../context/ToastContext'
import { useConfirm } from '../../context/ConfirmContext'
import { bannerService, s3UploadService } from '../../services'
import { collectErrors, rules } from '../../lib/validators'
import { reportSaveError } from '../../lib/formErrors'
import { CATALOG_STATUS_OPTIONS, CatalogStatus } from '../../constants/enums'
import type { Banner } from '../../types/models'

type Values = {
  desktop: ImageValue
  mobile: ImageValue
  title: string
  subtitle: string
  linkUrl: string
  status: CatalogStatus
}

const LINK_REGEX = /^(\/|https?:\/\/)/

const validate = (v: Values) =>
  collectErrors({
    desktop: [!v.desktop.url && !v.desktop.file ? 'A desktop image is required' : undefined],
    title: [rules.maxLength(v.title, 150, 'Title')],
    subtitle: [rules.maxLength(v.subtitle, 250, 'Subtitle')],
    linkUrl: [v.linkUrl && !LINK_REGEX.test(v.linkUrl.trim()) ? 'Start with “/” (a store page) or https://' : undefined],
  })

type Props = {
  open: boolean
  banner: Banner | null
  /** position for a new banner (end of the carousel) */
  nextSortOrder: number
  onClose: () => void
  onSaved: () => void
}

export default function BannerFormModal({ open, banner, nextSortOrder, onClose, onSaved }: Props) {
  const toast = useToast()
  const confirm = useConfirm()
  const form = useForm<Values>(
    { desktop: emptyImage(), mobile: emptyImage(), title: '', subtitle: '', linkUrl: '', status: CatalogStatus.PUBLISHED },
    validate,
  )

  useEffect(() => {
    if (open)
      form.reset({
        desktop: emptyImage(banner?.imageUrl ?? null),
        mobile: emptyImage(banner?.mobileImageUrl ?? null),
        title: banner?.title ?? '',
        subtitle: banner?.subtitle ?? '',
        linkUrl: banner?.linkUrl ?? '',
        status: banner?.status ?? CatalogStatus.PUBLISHED,
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, banner])

  const close = async () => {
    if (form.dirty && !form.submitting) {
      const leave = await confirm({
        title: 'Discard changes?',
        message: 'Nothing has been uploaded yet — your picked images will be dropped.',
        confirmLabel: 'Discard',
        danger: true,
      })
      if (!leave) return
    }
    onClose()
  }

  const save = () =>
    form.submit(async (v) => {
      // 1. Upload picked images (banners/…). Remember them so a failed save can discard them.
      const uploaded: string[] = []
      const resolve = async (img: ImageValue) => {
        if (!img.file) return img.url
        const { url } = await s3UploadService.uploadBannerImage(img.file)
        uploaded.push(url)
        return url
      }
      try {
        const imageUrl = (await resolve(v.desktop))!
        const mobileImageUrl = await resolve(v.mobile)
        const payload = {
          imageUrl,
          mobileImageUrl: mobileImageUrl ?? undefined,
          title: v.title.trim() || undefined,
          subtitle: v.subtitle.trim() || undefined,
          linkUrl: v.linkUrl.trim() || undefined,
          status: v.status,
          sortOrder: banner ? banner.sortOrder : nextSortOrder,
        }
        // 2. Save. The backend deletes images this banner no longer uses.
        if (banner) await bannerService.replace(banner.id, payload)
        else await bannerService.create(payload)
        toast.success(banner ? 'Banner updated' : 'Banner added')
        onSaved()
      } catch (err) {
        // Nothing points at the new uploads — remove them so S3 stays clean.
        await Promise.allSettled(uploaded.map((url) => s3UploadService.discardUpload(url)))
        reportSaveError(err, { toastError: toast.error })
      }
    })

  const preview = form.values.desktop.file ? null : form.values.desktop.url

  return (
    <Modal
      open={open}
      onClose={() => void close()}
      title={banner ? 'Edit banner' : 'New banner'}
      size="lg"
      footer={
        <>
          <Button variant="outline" onClick={() => void close()}>
            Cancel
          </Button>
          <Button onClick={save} isLoading={form.submitting} data-testid="save-banner">
            {banner ? 'Save changes' : 'Add banner'}
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
        <div className="grid gap-4 sm:grid-cols-[1fr_150px]">
          <ImageField
            label="Desktop image"
            aspect="16 / 6"
            hint="About 1920 × 720. Keep text away from the edges."
            value={form.values.desktop}
            onChange={(img) => form.set('desktop', img)}
            error={form.errors.desktop}
            testId="banner-desktop"
          />
          <ImageField
            label="Mobile (optional)"
            aspect="4 / 5"
            hint="Taller crop for phones."
            value={form.values.mobile}
            onChange={(img) => form.set('mobile', img)}
            testId="banner-mobile"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            id="banner-title"
            label="Heading"
            placeholder="The Diwali Edit"
            value={form.values.title}
            onChange={(e) => form.set('title', e.target.value)}
            error={form.errors.title}
          />
          <Input
            id="banner-subtitle"
            label="Sub-heading"
            placeholder="Handwoven silks, up to 20% off"
            value={form.values.subtitle}
            onChange={(e) => form.set('subtitle', e.target.value)}
            error={form.errors.subtitle}
          />
        </div>
        <Input
          id="banner-link"
          label="Link"
          placeholder="/collections/diwali-edit"
          value={form.values.linkUrl}
          onChange={(e) => form.set('linkUrl', e.target.value)}
          error={form.errors.linkUrl}
          hint="Where a tap on the slide goes — a store page like /category/jamdani, or a full https:// link."
          leftIcon={<ExternalLink className="h-4 w-4" />}
        />
        <div>
          <span className="mb-1.5 block text-sm font-medium text-gray-700">Status</span>
          <ButtonGroup
            size="sm"
            options={CATALOG_STATUS_OPTIONS}
            value={form.values.status}
            onChange={(s) => form.set('status', s as CatalogStatus)}
          />
          <p className="mt-1.5 text-xs text-gray-500">Only Published banners appear in the homepage carousel.</p>
        </div>

        {preview && (form.values.title || form.values.subtitle) && (
          <div>
            <span className="mb-1.5 block text-sm font-medium text-gray-700">Preview</span>
            <div className="relative overflow-hidden rounded-xl" style={{ aspectRatio: '16 / 6' }}>
              <img src={preview} alt="" className="h-full w-full object-cover" />
              <div className="absolute inset-0 flex flex-col justify-center bg-gradient-to-r from-black/55 to-transparent px-8 text-white">
                {form.values.title && <p className="text-xl font-bold sm:text-2xl">{form.values.title}</p>}
                {form.values.subtitle && <p className="mt-1 text-sm opacity-90">{form.values.subtitle}</p>}
              </div>
            </div>
          </div>
        )}
        <button type="submit" className="hidden" />
      </form>
    </Modal>
  )
}
