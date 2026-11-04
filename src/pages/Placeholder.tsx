import { useLocation } from 'react-router-dom'
import { Construction } from 'lucide-react'
import Text from '../components/ui/Text'

export default function Placeholder({ title }: { title?: string }) {
  const { pathname } = useLocation()
  const derived =
    pathname
      .split('/')
      .filter(Boolean)
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join(' · ') || 'Page'
  const name = title ?? derived

  return (
    <div className="flex h-full flex-col items-center justify-center gap-3 text-center">
      <Construction className="h-12 w-12 text-gray-300" />
      <Text as="h1" size="2xl" weight="bold">
        {name}
      </Text>
      <Text variant="muted">This section is coming soon.</Text>
    </div>
  )
}
