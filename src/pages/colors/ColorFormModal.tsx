import { useEffect } from 'react'
import Modal from '../../components/ui/Modal'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import ColorInput from '../../components/ui/ColorInput'
import ColorSwatch from '../../components/ui/ColorSwatch'
import { useForm } from '../../hooks/useForm'
import { useToast } from '../../context/ToastContext'
import { colorService } from '../../services'
import { collectErrors, rules } from '../../lib/validators'
import { reportSaveError } from '../../lib/formErrors'
import type { Color } from '../../types'

type Values = { name: string; hexCode: string }

const validate = (v: Values) =>
  collectErrors({
    name: [rules.required(v.name, 'Name'), rules.maxLength(v.name, 60, 'Name')],
    hexCode: [rules.hexColor(v.hexCode)],
  })

type Props = { open: boolean; color: Color | null; onClose: () => void; onSaved: (c: Color) => void }

export default function ColorFormModal({ open, color, onClose, onSaved }: Props) {
  const toast = useToast()
  const form = useForm<Values>({ name: '', hexCode: '' }, validate)

  useEffect(() => {
    if (open) form.reset({ name: color?.name ?? '', hexCode: color?.hexCode ?? '' })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, color])

  const save = () =>
    form.submit(async (v) => {
      const payload = { name: v.name.trim(), hexCode: v.hexCode || undefined }
      try {
        const saved = color ? await colorService.replace(color.id, payload) : await colorService.create(payload)
        toast.success(color ? 'Color updated' : 'Color created')
        onSaved(saved)
      } catch (err) {
        reportSaveError(err, { toastError: toast.error, setFieldError: form.setServerError, conflictField: 'name' })
      }
    })

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={color ? 'Edit color' : 'New color'}
      footer={
        <>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={save} isLoading={form.submitting} data-testid="save-color">
            {color ? 'Save changes' : 'Create color'}
          </Button>
        </>
      }
    >
      <form
        className="space-y-4"
        onSubmit={(e) => {
          e.preventDefault()
          void save()
        }}
      >
        <Input
          id="color-name"
          label="Name"
          placeholder="Light Pink"
          value={form.values.name}
          onChange={(e) => form.set('name', e.target.value)}
          error={form.errors.name}
          autoFocus
        />
        <ColorInput
          id="color-hex"
          label="Hex code"
          value={form.values.hexCode}
          onChange={(c) => form.set('hexCode', c)}
          error={form.errors.hexCode}
          hint="Used for the swatch customers see."
        />
        <div className="flex items-center gap-3 rounded-lg bg-gray-50 px-3 py-3">
          <ColorSwatch color={form.values.hexCode} size="lg" />
          <span className="text-sm font-medium text-gray-800">{form.values.name || 'Color preview'}</span>
        </div>
        <button type="submit" className="hidden" />
      </form>
    </Modal>
  )
}
