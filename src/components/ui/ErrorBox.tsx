import { AlertCircle, RotateCw } from 'lucide-react'
import Button from './Button'

/** Shown when a page's data fails to load. */
export default function ErrorBox({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 rounded-xl border border-red-200 bg-red-50 px-6 py-10 text-center">
      <AlertCircle className="h-6 w-6 text-red-600" />
      <p className="text-sm text-red-700">{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" leftIcon={<RotateCw className="h-3.5 w-3.5" />} onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  )
}
