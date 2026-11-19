import type { BadgeVariant } from '../../components/ui/Badge'
import type { JournalState } from '../../types/journal'

/** How each post state is shown in the admin. */
export const STATE_BADGE: Record<JournalState, { label: string; variant: BadgeVariant }> = {
  draft: { label: 'Draft', variant: 'neutral' },
  scheduled: { label: 'Scheduled', variant: 'info' },
  published: { label: 'Published', variant: 'success' },
  archived: { label: 'Archived', variant: 'warning' },
}
